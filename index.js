import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import connectMongo from 'connect-mongo'
import session from 'express-session'
import multer from 'multer'
import md5 from 'md5'
import dotenv from 'dotenv'
import path from 'path'
import FTPStorage from 'multer-ftp'
import cookieParser from 'cookie-parser'
// import fs from 'fs'
// import fsx from 'fs-extra'

import db from './db.js'

dotenv.config()

const MongoStore = connectMongo(session)

const app = express()

app.use(bodyParser.json())

// 跨域請求設定
app.use(cors({
  origin (origin, callback) {
    // console.log(origin)
    // 直接開網頁，不是 ajax 時，origin 是 undefined
    if (origin === undefined) {
      callback(null, true)
    } else {
      if (process.env.ALLOW_CORS === 'true') {
        // 開發環境，允許
        callback(null, true)
      } else if (origin.includes('github')) {
        // 非開發環境，但是從 github 過來，允許
        callback(null, true)
      } else {
        // 不是開發也不是從 github 過來，拒絕
        callback(new Error('not allowed'), false)
      }
    }
  },
  credentials: true
}))

// Session設定
app.use(session({
  secret: 'miniAttic',
  // 將 session 存入 mongodb
  store: new MongoStore({
    // 使用 mongoose 的資料庫連接
    mongooseConnection: db.connection,
    // 設定存入的 collection
    collection: process.env.COLLECTION_SESSION
  }),
  // session 有效期間
  cookie: {
    // 1000 毫秒 = 一秒鐘
    // 1000 毫秒 * 60 = 一分鐘
    // 1000 毫秒 * 60 * 30 = 三十分鐘
    maxAge: 1000 * 60 * 30,
    sameSite: 'none',
    secure: true
  },
  resave: true,
  // 是否保存未修改的session
  saveUninitialized: false,
  // 是否每次重設過期時間
  rolling: true
}))

let storage
// 開發環境放本機
if (process.env.FTP === 'false') {
  storage = multer.diskStorage({
    destination (req, file, cb) {
      cb(null, 'images/')
    },
    filename (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname))
    }
  })
} else {
  // heroku 將上傳檔案放伺服器
  storage = new FTPStorage({
    // 上傳伺服器的路徑
    basepath: process.env.FTP_FILE_PATH,
    ftp: {
      host: process.env.FTP_HOST,
      secure: false,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    },
    destination (req, file, options, cb) {
      cb(null, options.basepath + Date.now() + path.extname(file.originalname))
    }
  })
}

const upload = multer({
  storage,
  fileFilter (req, file, cb) {
    if (!file.mimetype.includes('image')) {
      // 觸發 multer 錯誤，不接受檔案
      cb(new multer.MulterError('LIMIT_FORMAT'), false)
    } else {
      cb(null, true)
    }
  },
  limits: {
    fileldSize: 1024 * 1024
  }
})

// 監聽
app.listen(process.env.PORT, () => {
  console.log(`Listening on: http://localhost:${process.env.PORT}`)
  console.log('伺服器已啟動')
})

// Cookie設定
app.use(cookieParser())

app.get('/', function (req, res) {
  // 如果请求中的 cookie 存在 isVisit, 则输出 cookie
  // 否则，设置 cookie 字段 isVisit, 并设置过期时间为1分钟
  if (req.cookies.isVisit) {
    console.log(req.cookies)
    res.send('再次欢迎访问')
  } else {
    res.cookie('isVisit', 1, { maxAge: 60 * 1000 })
    res.redirect(req.headers.referer)
  }
})

// 註冊新用戶
app.post('/users', async (req, res) => {
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    await db.users.create({
      name: req.body.name,
      phone: req.body.phone,
      account: req.body.account,
      password: md5(req.body.password)
    })
    res.status(200)
    res.send({ success: true, message: '會員註冊成功' })
  } catch (error) {
    // 資料格式錯誤
    if (error.errors.account.properties.message === '電子信箱重複') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 登入驗證
app.post('/login', async (req, res) => {
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    const result = await db.users.find(
      {
        account: req.body.account,
        password: md5(req.body.password)
      }
    )

    if (result.length > 0) {
      // if (process.env.ALLOW_CORS) {
      // req.session.user = result[0].account
      // } else {
      res.cookie('user', result[0].account)
      // }

      res.status(200)
      res.send({ success: true, message: '會員登入成功', account: result[0].account, name: result[0].name })
    } else {
      res.status(404)
      res.send({ success: false, message: '帳號密碼錯誤' })
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

app.delete('/logout', async (req, res) => {
  req.session.destroy(error => {
    if (error) {
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    } else {
      res.clearCookie()
      res.status(200)
      res.send({ success: true, message: '' })
    }
  })
})

app.get('/heartbeat', async (req, res) => {
  let isLogin = false
  if (req.session.user !== undefined) {
    isLogin = true
  }

  if (req.cookies.user !== undefined) {
    isLogin = true
  }
  res.status(200)
  res.send(isLogin)
})

// 內容編輯更新
app.patch('/pages/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    // 資料更新成功的時候要把資料進DB
    await db.pages.findOneAndUpdate(
      {
        item: req.params.item
      }, {
        show: req.body.show,
        description1: req.body.description1,
        description2: req.body.description2,
        description3: req.body.description3,
        link: req.body.link
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料更新成功' })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// pages的資料 全部
app.get('/pages', async (req, res) => {
  try {
    const result = await db.pages.find()

    const datas = []
    for (const value of result) {
      datas.push({
        item: value.item,
        src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + value.img,
        description1: value.description1,
        description2: value.description2,
        description3: value.description3,
        link: value.link,
        show: value.show
      })
    }

    res.status(200)
    res.send({
      success: true, message: '資料查詢成功', datas
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// pages的資料 條件查詢
app.get('/pages/:condition', async (req, res) => {
  try {
    const result = await db.pages.find({
      // 查詢符合req.params.condition的item
      item: { $regex: req.params.condition }
    })

    const datas = []
    for (const value of result) {
      datas.push({
        item: value.item,
        src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + value.img,
        description1: value.description1,
        description2: value.description2,
        description3: value.description3,
        link: value.link,
        show: value.show
      })
    }

    res.status(200)
    res.send({
      success: true, message: '資料查詢成功', datas
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// pages的圖片api
app.get('/img/:item', async (req, res) => {
  const result = await db.pages.findOne({ item: req.params.item })

  if (result === null) {
    // 如果資料庫沒有資料
    res.status(404)
    res.send({ success: false, message: '找不到圖片' })
    return
  }
  res.redirect('http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + result.img)
})

// 新增商品
app.post('/products', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    const result = await db.products.create(
      {
        item: Date.now(),
        class: req.body.class,
        name: req.body.name,
        subheading: req.body.subheading,
        intro: req.body.intro,
        price: req.body.price,
        description: req.body.description,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料建立成功', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 取得商品
app.get('/products', async (req, res) => {
  try {
    const result = await db.products.find()

    const datas = []
    for (const value of result) {
      datas.push({
        item: value.item,
        src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + value.img,
        class: value.class,
        name: value.name,
        show: value.show,
        subheading: value.subheading,
        intro: value.intro,
        price: value.price,
        description: value.description
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 更新商品
app.patch('/products/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    const result = await db.products.findOneAndUpdate(
      {
        item: req.params.item
      },
      {
        class: req.body.class,
        name: req.body.name,
        subheading: req.body.subheading,
        intro: req.body.intro,
        price: req.body.price,
        description: req.body.description,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '商品更新成功', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

app.delete('/products/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }

  try {
    const result = await db.products.findOneAndDelete(
      {
        item: req.params.item
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料已移除', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 上傳圖片
app.post('/img/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('multipart/form-data')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  upload.single('image')(req, res, async error => {
    if (error instanceof multer.MulterError) {
      let message = ''
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      } else {
        message = '格式不符'
      }
      res.status(400)
      res.send({ success: false, message })
    } else if (error) {
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    } else {
      try {
        let name = ''
        if (process.env.FTP === 'true') {
          name = path.basename(req.file.path)
        } else {
          name = req.file.filename
        }

        // 檔案上傳成功的時候要把資料進DB
        // req.body.collection 要更動哪個db_collection
        if (req.body.collection === 'product') {
          await db.products.findOneAndUpdate(
            { item: req.params.item },
            { img: process.env.FTP_FILE_PATH + name }
          )
        } else if (req.body.collection === 'page') {
          await db.pages.findOneAndUpdate(
            { item: req.params.item },
            { img: process.env.FTP_FILE_PATH + name }
          )
        }

        res.status(200)
        res.send({ success: true, message: '圖片上傳成功', name })
      } catch (error) {
        if (error.name === 'ValidationError') {
          // 資料格式錯誤
          const key = Object.keys(error.errors)[0]
          const message = error.errors[key].message
          res.status(400)
          res.send({ success: false, message })
        } else {
          // 伺服器錯誤
          res.status(500)
          res.send({ success: false, message: '伺服器錯誤' })
        }
      }
    }
  })
})

// 拿商品分類
app.get('/categorys', async (req, res) => {
  try {
    const datas = await db.categorys.find()

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 更新商品分類
app.patch('/categorys/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    // 資料更新成功的時候要把資料進DB
    await db.categorys.findOneAndUpdate(
      { item: req.params.item },
      {
        name: req.body.name,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料更新成功' })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 創建商品分類
app.post('/categorys', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    const result = await db.categorys.create(
      {
        item: req.body.item,
        name: req.body.name,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料建立成功', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 刪除商品分類
app.delete('/categorys/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }

  try {
    const result = await db.categorys.findOneAndDelete(
      {
        item: req.params.item
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料已移除', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// ------------------------------------------------------------------
// 拿付款方式
app.get('/payments', async (req, res) => {
  try {
    const datas = await db.payments.find()

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 更新付款方式
app.patch('/payments/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    // 資料更新成功的時候要把資料進DB
    await db.payments.findOneAndUpdate(
      { item: req.params.item },
      {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料更新成功' })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 創建付款方式
app.post('/payments', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    const result = await db.payments.create(
      {
        item: req.body.item,
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料建立成功', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 刪除付款方式
app.delete('/payments/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }

  try {
    const result = await db.payments.findOneAndDelete(
      {
        item: req.params.item
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料已移除', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 取得所有會員訂單
app.get('/back/orders', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }

  try {
    const result = await db.orders.find()

    const datas = []
    const dbProducts = await db.products.find()
    for (const value of result) {
      const item = value.item
      const account = value.account

      // 計算訂單金額
      let orderPrice = 0

      // 找真正的商品資料
      const products = []
      for (const v of value.products) {
        const product = dbProducts.find(e => e.item === v.item)
        products.push({
          item: product.item,
          amount: v.amount,
          name: product.name,
          src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + product.img,
          price: product.price
        })

        orderPrice += product.price * v.amount
      }

      const payment = value.payment
      orderPrice += value.payment.price

      const remark = value.remark
      const status = value.status

      datas.push({
        item,
        account,
        products,
        payment,
        orderPrice,
        remark,
        status
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 更新訂單
app.patch('/back/orders/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  try {
    const result = await db.orders.findOneAndUpdate(
      {
        item: req.params.item
      },
      req.body
    )

    res.status(200)
    res.send({ success: true, message: '商品更新成功', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

app.delete('/back/orders/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }

  try {
    const result = await db.orders.findOneAndDelete(
      {
        item: req.params.item
      }
    )

    if (result) {
      res.status(200)
      res.send({ success: true, message: '資料已移除', result })
    } else {
      res.status(404)
      res.send({ success: false, message: '沒有這個東西' })
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// ------------------------------------------------------------------

// 前台拿網頁資料
app.get('/webdata', async (req, res) => {
  try {
    // 拿頁面資料
    let result = await db.pages.find()
    const pages = []
    for (const value of result) {
      if (value.show) {
        pages.push({
          item: value.item,
          src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + value.img,
          description1: value.description1,
          description2: value.description2,
          description3: value.description3,
          link: value.link
        })
      }
    }

    // 拿商品資料
    result = await db.products.find()
    const products = []
    for (const value of result) {
      if (value.show) {
        products.push({
          item: value.item,
          src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + value.img,
          class: value.class,
          name: value.name,
          subheading: value.subheading,
          intro: value.intro,
          price: value.price,
          description: value.description
        })
      }
    }

    // 拿商品分類
    result = await db.categorys.find()
    let categorys = []
    for (const value of result) {
      if (value.show) {
        categorys.push({
          item: value.item,
          name: value.name
        })
      }
    }
    categorys = categorys.sort(function (a, b) { return a.item > b.item ? 1 : -1 })

    // 拿付款方式
    result = await db.payments.find()
    const payments = []
    for (const value of result) {
      if (value.show) {
        payments.push({
          item: value.item,
          name: value.name,
          description: value.description,
          price: value.price
        })
      }
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', pages, products, categorys, payments })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 新增訂單資料
app.post('/order', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }
  // 格式不符
  if (!req.headers['content-type'].includes('application/json')) {
    res.status(400)
    res.send({ success: false, message: '格式不符' })
    return
  }

  let products = req.body.products
  // 檢查是不是有效的訂單
  if (products.length === 0) {
    res.status(400)
    res.send({ success: false, message: '訂單沒有商品' })
    return
  } else {
    // 拿數量大於零的商品
    products = req.body.products.filter(e => e.amount > 0)
    if (products.length === 0) {
      res.status(400)
      res.send({ success: false, message: '訂單沒有商品' })
      return
    }
  }

  try {
    await db.orders.create(
      {
        item: Date.now(),
        account: req.session.user,
        products: products,
        payment: req.body.payment,
        remark: req.body.remark
      }
    )
    res.status(200)
    res.send({ success: true, message: '訂單送出成功' })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 取得會員訂單
app.get('/orders', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }

  try {
    const result = await db.orders.find({ account: req.session.user })

    const datas = []
    const dbProducts = await db.products.find()
    for (const value of result) {
      const item = value.item

      // 找真正的商品資料
      const products = []
      for (const v of value.products) {
        const product = dbProducts.find(e => e.item === v.item)
        products.push({
          item: product.item,
          amount: v.amount,
          name: product.name,
          src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + product.img,
          price: product.price
        })
      }

      const payment = value.payment
      const remark = value.remark
      const status = value.status

      datas.push({
        item,
        products,
        payment,
        remark,
        status
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

// 取得會員訂單
app.get('/orderDetail/:item', async (req, res) => {
  // 沒有登入
  if (req.session.user === undefined) {
    res.status(401)
    res.send({ success: false, message: '未登入' })
    return
  }

  try {
    const result = await db.orders.find({ account: req.session.user, item: req.params.item })

    const datas = []
    const dbProducts = await db.products.find()
    for (const value of result) {
      const item = value.item

      // 找真正的商品資料
      const products = []
      for (const v of value.products) {
        const product = dbProducts.find(e => e.item === v.item)
        products.push({
          item: product.item,
          amount: v.amount,
          name: product.name,
          src: 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + product.img,
          price: product.price
        })
      }

      const payment = value.payment
      const remark = value.remark
      const status = value.status

      datas.push({
        item,
        products,
        payment,
        remark,
        status
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 資料格式錯誤
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400)
      res.send({ success: false, message })
    } else {
      // 伺服器錯誤
      res.status(500)
      res.send({ success: false, message: '伺服器錯誤' })
    }
  }
})

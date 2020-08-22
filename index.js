import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import multer from 'multer'
// import md5 from 'md5'
import dotenv from 'dotenv'
import path from 'path'
import FTPStorage from 'multer-ftp'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import * as verify from './common/Verify.js'

import './db.js'
// import dbusers from './models/user.js'
import dbproducts from './models/product.js'
import dbcategorys from './models/category.js'
import dbpayments from './models/payment.js'
// import dborders from './models/order.js'
import dbpages from './models/page.js'

import userRoutes from './routes/user.js'
import productRoutes from './routes/product.js'
import categoryRoutes from './routes/category.js'
import paymentRoutes from './routes/payment.js'
import orderRoutes from './routes/order.js'
import pageRoutes from './routes/page.js'
import loginRoutes from './routes/login.js'

dotenv.config()

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

app.use('/users', userRoutes)
app.use('/products', productRoutes)
app.use('/categorys', categoryRoutes)
app.use('/payments', paymentRoutes)
app.use('/orders', orderRoutes)
app.use('/pages', pageRoutes)
app.use('/login', loginRoutes)

// 監聽
app.listen(process.env.PORT, () => {
  console.log(`Listening on: http://localhost:${process.env.PORT}`)
  console.log('伺服器已啟動')
})

// 自動導向
// app.get('/', function (req, res) {
//   if (req.cookies.isVisit) {
//     console.log(req.cookies)
//     res.send({ success: true })
//   } else {
//     res.cookie('isVisit', 1, { maxAge: 60 * 1000 })
//     res.redirect(req.headers.referer)
//   }
// })

app.get('/heartbeat', async (req, res) => {
  let isLogin = false

  try {
    const JWTData = verify.jwtVerify(req)
    if (JWTData) {
      isLogin = true
    }

    res.status(200)
    res.send(isLogin)
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
})

const imageCache = []

// 拿圖片api
app.get('/image/:item', async (req, res) => {
  try {
    if (imageCache.find(e => e.item === req.params.item)) {
      const data = imageCache.find(e => e.item === req.params.item)
      res.set({
        'Content-Type': 'image/' + data.ext
      })
      res.send(data.image)
    } else {
      const uri = 'http://' + process.env.FTP_HOST + '/' + process.env.FTP_USER + '/' + process.env.FTP_FILE_PATH + req.params.item
      const response = await axios.get(uri, { responseType: 'arraybuffer' })
      let ext = path.extname(uri).replace('.', '')
      ext = ext === 'jpg' ? 'jpeg' : ext
      res.set({
        'Content-Type': 'image/' + ext
      })
      res.send(response.data)
      imageCache.push({ item: req.params.item, image: response.data, ext: ext })
    }
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
})

// 上傳圖片
app.post('/img/:item', async (req, res) => {
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
        const { authorization } = req.headers
        const [, token] = authorization.split(' ')
        jwt.verify(token, process.env.JWT_KEY)
        let name = ''
        if (process.env.FTP === 'true') {
          name = path.basename(req.file.path)
        } else {
          name = req.file.filename
        }

        // 檔案上傳成功的時候要把資料進DB
        // req.body.collection 要更動哪個db_collection
        if (req.body.collection === 'product') {
          await dbproducts.findOneAndUpdate(
            { item: req.params.item },
            { img: name }
          )
        } else if (req.body.collection === 'page') {
          await dbpages.findOneAndUpdate(
            { item: req.params.item },
            { img: name }
          )
        }

        res.status(200)
        res.send({ success: true, message: '圖片上傳成功', name })
      } catch (error) {
        verify.ErrorResponse(error, res)
      }
    }
  })
})

// 前台拿網頁資料
app.get('/webdata', async (req, res) => {
  try {
    // 拿頁面資料
    let result = await dbpages.find()
    const pages = []
    for (const value of result) {
      if (value.show) {
        pages.push({
          item: value.item,
          src: value.img,
          description1: value.description1,
          description2: value.description2,
          description3: value.description3,
          link: value.link
        })
      }
    }

    // 拿商品資料
    result = await dbproducts.find()
    const products = []
    for (const value of result) {
      if (value.show) {
        products.push({
          item: value.item,
          src: value.img,
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
    result = await dbcategorys.find()
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
    result = await dbpayments.find()
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
    verify.ErrorResponse(error, res)
  }
})

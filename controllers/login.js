import dbusers from '../models/user.js'
import * as verify from '../common/Verify.js'
import dotenv from 'dotenv'
import md5 from 'md5'
import jwt from 'jsonwebtoken'

dotenv.config()

export const userLogin = async (req, res, next) => {
  try {
    verify.contentTypeJSON(req)
    const result = await dbusers.find(
      {
        account: req.body.account,
        password: md5(req.body.password)
      }
    )

    if (result.length > 0) {
      // 登入成功簽token
      const token = jwt.sign({
        account: result[0].account,
        access: result[0].access_right,
        exp: Math.floor(Date.now() / 1000) + 60 * 30
      }, process.env.JWT_KEY)

      const access = userAccess(result[0].access_right)
      // 判斷使用者權限
      if (access === 'user') {
        res.status(200)
        res.send({ success: true, message: '登入成功', account: result[0].account, name: result[0].name, token })
      } else if (access === 'admin' || access === 'editor') {
        res.status(200)
        res.send({ success: true, message: '登入成功', user: result[0].account, access, token })
      } else {
        res.status(403)
        res.send({ success: false, message: '沒有權限' })
        return
      }
    } else {
      res.status(404)
      res.send({ success: false, message: '帳號密碼錯誤' })
    }
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

const userAccess = (accessRight) => {
  if (accessRight === parseInt(process.env.ACCESS_RIGHT_ADMINISTRATOR)) {
    return 'admin'
  } else if (accessRight === parseInt(process.env.ACCESS_RIGHT_EDITOR)) {
    return 'edtor'
  } else if (accessRight === parseInt(process.env.ACCESS_RIGHT_USER)) {
    return 'user'
  } else {
    return '沒有權限'
  }
}

export const userLogout = async (req, res) => {
  res.status(200)
  res.send({ success: true, message: '掰掰，歡迎下次再來' })
}

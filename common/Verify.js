import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

export const ErrorResponse = (error, res) => {
  if (error.name === 'ValidationError') {
    // 資料格式錯誤
    const key = Object.keys(error.errors)[0]
    const message = error.errors[key].message
    res.status(400)
    res.send({ success: false, message })
  } else if (error.name === 'UserException') {
    res.status(error.status)
    res.send({ success: false, message: error.message })
  } else {
    console.log(error)
    res.status(500)
    res.send({ success: false, message: '伺服器錯誤' })
  }
}

export const contentTypeFD = (req) => {
  // 格式不符
  if (!req.headers['content-type'].includes('multipart/form-data')) {
    throw new UserException(400, '格式不符')
  }
}

export const contentTypeJSON = (req) => {
  if (!req.headers['content-type'].includes('application/json')) {
    throw new UserException(400, '格式不符')
  }
}

export const jwtVerify = (req) => {
  try {
    const { authorization } = req.headers
    const [, token] = authorization.split(' ')
    const jwtData = jwt.verify(token, process.env.JWT_KEY)
    return jwtData
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UserException(401, '登入過期')
    } else if (error.name === 'JsonWebTokenError') {
      throw new UserException(400, 'Token異常')
    } else {
      throw new UserException(500, '伺服器錯誤')
    }
  }
}

function UserException (status, message) {
  this.status = status
  this.message = message
  this.name = 'UserException'
}

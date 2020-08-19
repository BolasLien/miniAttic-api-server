import mongoose from 'mongoose'
import validator from 'validator'
import dotenv from 'dotenv'

dotenv.config()

const Schema = mongoose.Schema

const userSchema = new Schema({
  name: {
    // 資料類型是文字
    type: String,
    // 必填欄位，自訂錯誤訊息
    require: [true, '使用者名稱必填'],
    // 最小長度，自訂錯誤訊息
    minlength: [2, '使用者名稱最少 2 個字'],
    // 最大長度，自訂錯誤訊息
    maxlength: [20, '使用者名稱最多 20 個字']
  },
  phone: {
    type: String,
    require: [true, '電話號碼必填'],
    minlength: [9, '電話號碼最少 9 個字'],
    maxlength: [10, '電話號碼最多 10 個字']
  },
  account: {
    type: String,
    unique: '電子信箱重複',
    required: [true, '電子信箱必填'],
    // 自訂驗證規則
    validate: {
      // 驗證 function
      validator (value) {
        // 使用驗證套件檢查是不是 email
        return validator.isEmail(value)
      },
      // 錯誤訊息
      message: '信箱格式錯誤'
    }
  },
  password: {
    type: String,
    required: [true, '請輸入密碼']
  },
  access_right: {
    // 使用者權限
    type: Number,
    // 註冊的時候預設當作前台的會員
    default: process.env.ACCESS_RIGHT_USER
  }
}, {
  versionKey: false
})

const users = mongoose.model(process.env.COLLECTION_USER, userSchema)

export default users

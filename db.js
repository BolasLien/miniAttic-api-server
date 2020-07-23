import dotenv from 'dotenv'
import mongoose from 'mongoose'
import beautifyUnique from 'mongoose-beautiful-unique-validation'

dotenv.config()

const Schema = mongoose.Schema
mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
mongoose.plugin(beautifyUnique)

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
    // 100 = 前台會員
    // 200 = 後台管理員
    // 999 = 兩邊都可以通
    default: 100
  account: {
    type: String,
    minlength: [4, '帳號必須四個字以上'],
    maxlength: [20, '帳號必須二十個字以下'],
    unique: '帳號已使用',
    required: [true, '請輸入帳號']
  },
  password: {
    type: String,
    required: [true, '請輸入密碼']
  }
}, {
  versionKey: false
})

const fileSchema = new Schema({
  user: {
    type: String,
    required: [true, '沒有使用者名稱']
  },
  description: {
    type: String,
    maxlength: [200, '帳號必須二十個字以下']
  },
  name: {
    type: String,
    required: [true, '沒有檔案名稱']
  }
}, {
  versionKey: false
})

const pageSchema = new Schema({
  item: {
    // 例如: carousel-item-1 或 intro-title
    type: String,
    required: [true, '沒有指定item']
  },
  img: {
    // 例如: /images/xxx.jpg 或 /miniattic/assets/img/xxx.jpg
    type: String,
    required: [true, '沒有檔案路徑']
  },
  description1: {
    type: String
  },
  description2: {
    type: String
  },
  description3: {
    type: String
  },
  link: {
    // 例如: http://google.com/ / /about
    type: String
  },
  show: {
    type: Boolean,
    required: [true, '沒有設定是否顯示'],
    default: true
  }
}, {
  versionKey: false
})

const productSchema = new Schema({
  item: {
    type: String,
    required: [true, '沒有商品item']
  },
  class: {
    type: String
  },
  img: {
    // 例如: /images/xxx.jpg 或 /miniattic/assets/img/xxx.jpg
    type: String,
    default: '/1594090312145.jpg'
  },
  name: {
    type: String
  },
  subheading: {
    type: String
  },
  intro: {
    type: String
  },
  price: {
    type: String
  },
  description: {
    type: String
  },
  show: {
    type: Boolean,
    default: false
  }
}, {
  versionKey: false
})

const categorySchema = new Schema({
  item: {
    type: String,
    required: [true, '沒有分類item']
  },
  name: {
    type: String,
    default: '尚未定義名稱'
  },
  show: {
    type: Boolean,
    default: false
  }
}, {
  versionKey: false
})

const users = mongoose.model(process.env.COLLECTION_USER, userSchema)
const files = mongoose.model(process.env.COLLECTION_FILE, fileSchema)
const pages = mongoose.model(process.env.COLLECTION_PAGE, pageSchema)
const products = mongoose.model(process.env.COLLECTION_PRODUCT, productSchema)
const categorys = mongoose.model(process.env.COLLECTION_CATEGORY, categorySchema)
const connection = mongoose.connection

export default {
  users,
  files,
  pages,
  products,
  categorys,
  connection
}

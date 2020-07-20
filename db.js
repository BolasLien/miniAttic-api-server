import dotenv from 'dotenv'
import mongoose from 'mongoose'
import beautifyUnique from 'mongoose-beautiful-unique-validation'

dotenv.config()

const Schema = mongoose.Schema
mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
mongoose.plugin(beautifyUnique)

const userSchema = new Schema({
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
}
)

const productSchema = new Schema({
  item: {
    type: String,
    required: [true, '沒有這個商品']
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

const users = mongoose.model(process.env.COLLECTION_USER, userSchema)
const files = mongoose.model(process.env.COLLECTION_FILE, fileSchema)
const pages = mongoose.model(process.env.COLLECTION_PAGE, pageSchema)
const products = mongoose.model(process.env.COLLECTION_PRODUCT, productSchema)
const connection = mongoose.connection

export default {
  users,
  files,
  pages,
  products,
  connection
}

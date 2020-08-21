import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const Schema = mongoose.Schema

const pageSchema = new Schema({
  item: {
    // 例如: carousel-item-1 或 intro-title
    type: String,
    required: [true, '沒有頁面編號']
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

const pages = mongoose.model(process.env.COLLECTION_PAGE, pageSchema)

export default pages

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const Schema = mongoose.Schema

const categorySchema = new Schema({
  item: {
    type: String,
    unique: '編號重複',
    required: [true, '沒有分類編號']
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

const categorys = mongoose.model(process.env.COLLECTION_CATEGORY, categorySchema)

export default categorys

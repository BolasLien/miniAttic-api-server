import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const Schema = mongoose.Schema

const productSchema = new Schema({
  item: {
    type: String,
    unique: '編號重複',
    required: [true, '沒有商品編號']
  },
  class: {
    type: String,
    required: [true, '沒有商品分類']
  },
  img: {
    type: String,
    default: '1596695174260.jpg'
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

const products = mongoose.model(process.env.COLLECTION_PRODUCT, productSchema)

export default products

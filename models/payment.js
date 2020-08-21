import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const Schema = mongoose.Schema

const paymentSchema = new Schema({
  // 付款方式
  item: {
    type: String,
    unique: '編號重複',
    required: [true, '沒有付款編號']
  },
  name: String,
  price: Number,
  description: {
    type: String
  },
  show: {
    type: Boolean,
    default: false
  }
})

const payments = mongoose.model(process.env.COLLECTION_PAYMENT, paymentSchema)

export default payments

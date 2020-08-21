import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const Schema = mongoose.Schema

const orderSchema = new Schema({
  // 訂單資料
  item: {
    type: String,
    unique: '編號重複',
    required: [true, '沒有訂單編號']
  },
  account: {
    type: String,
    required: [true, '沒有會員帳號']
  },
  products: {
    type: Object,
    required: [true, '沒有商品']
  },
  payment: {
    type: Object,
    required: [true, '沒有付款方式']
  },
  remark: {
    type: String,
    maxlength: [200, '備註最多 200 個字']
  },
  status: {
    type: Number,
    // 0 訂單成立，尚未付款
    // 1 訂單已付款，待出貨
    // 2 出貨中
    // 3 已送達
    default: 0
  }
})

const orders = mongoose.model(process.env.COLLECTION_ORDER, orderSchema)

export default orders

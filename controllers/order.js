import db from '../models/order.js'
import dbproducts from '../models/product.js'
import * as verify from '../common/Verify.js'

export const createOrder = async (req, res) => {
  let products = req.body.products
  // 檢查是不是有效的訂單
  if (products.length === 0) {
    res.status(400)
    res.send({ success: false, message: '訂單沒有商品' })
    return
  } else {
    // 拿數量大於零的商品
    products = req.body.products.filter(e => e.amount > 0)
    if (products.length === 0) {
      res.status(400)
      res.send({ success: false, message: '訂單沒有商品' })
      return
    }
  }

  try {
    verify.contentTypeJSON(req)
    const JWTData = verify.jwtVerify(req)
    await db.create(
      {
        item: Date.now(),
        account: JWTData.account,
        products: products,
        payment: req.body.payment,
        remark: req.body.remark
      }
    )
    res.status(200)
    res.send({ success: true, message: '訂單送出成功' })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const getOrders = async (req, res) => {
  try {
    const JWTData = verify.jwtVerify(req)
    const result = await db.find({ account: JWTData.account })

    const datas = []
    const dbProducts = await dbproducts.find()
    for (const value of result) {
      const item = value.item

      // 找真正的商品資料
      const products = []
      for (const v of value.products) {
        const product = dbProducts.find(e => e.item === v.item)
        products.push({
          item: product.item,
          amount: v.amount,
          name: product.name,
          src: product.img,
          price: product.price
        })
      }

      const payment = value.payment
      const remark = value.remark
      const status = value.status

      datas.push({
        item,
        products,
        payment,
        remark,
        status
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const getOrderDetail = async (req, res) => {
  try {
    const JWTData = verify.jwtVerify(req)
    const result = await db.find({ account: JWTData.account, item: req.params.item })

    const datas = []
    const dbProducts = await dbproducts.find()
    for (const value of result) {
      const item = value.item

      // 找真正的商品資料
      const products = []
      for (const v of value.products) {
        const product = dbProducts.find(e => e.item === v.item)
        products.push({
          item: product.item,
          amount: v.amount,
          name: product.name,
          src: product.img,
          price: product.price
        })
      }

      const payment = value.payment
      const remark = value.remark
      const status = value.status

      datas.push({
        item,
        products,
        payment,
        remark,
        status
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const updateOrder = async (req, res) => {

}

export const deleteOrder = async (req, res) => {

}

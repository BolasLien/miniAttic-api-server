import db from '../models/product.js'
import * as verify from '../common/Verify.js'

export const createProduct = async (req, res) => {
  try {
    verify.contentTypeJSON(req)
    verify.jwtVerify(req)
    const result = await db.create(
      {
        item: Date.now(),
        class: req.body.class,
        name: req.body.name,
        subheading: req.body.subheading,
        intro: req.body.intro,
        price: req.body.price,
        description: req.body.description,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料建立成功', result })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const getProducts = async (req, res) => {
  try {
    const result = await db.find()

    const datas = []
    for (const value of result) {
      datas.push({
        item: value.item,
        src: value.img,
        class: value.class,
        name: value.name,
        show: value.show,
        subheading: value.subheading,
        intro: value.intro,
        price: value.price,
        description: value.description
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const updateProduct = async (req, res) => {
  try {
    verify.contentTypeJSON(req)
    verify.jwtVerify(req)
    const result = await db.findOneAndUpdate(
      { item: req.params.item },
      {
        class: req.body.class,
        name: req.body.name,
        subheading: req.body.subheading,
        intro: req.body.intro,
        price: req.body.price,
        description: req.body.description,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '商品更新成功', result })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const deleteProduct = async (req, res) => {
  try {
    verify.jwtVerify(req)
    const result = await db.findOneAndDelete(
      { item: req.params.item }
    )

    res.status(200)
    res.send({ success: true, message: '資料已移除', result })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

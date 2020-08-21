import db from '../models/category.js'
import * as verify from '../common/Verify.js'

export const createCategory = async (req, res) => {
  try {
    verify.contentTypeJSON(req)
    verify.jwtVerify(req)
    const result = await db.create(
      {
        item: req.body.item,
        name: req.body.name,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料建立成功', result })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const getCategorys = async (req, res) => {
  try {
    const datas = await db.find()

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const updateCategory = async (req, res) => {
  try {
    verify.contentTypeJSON(req)
    verify.jwtVerify(req)

    // 資料更新成功的時候要把資料進DB
    await db.findOneAndUpdate(
      { item: req.params.item },
      {
        name: req.body.name,
        show: req.body.show
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料更新成功' })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const deleteCategory = async (req, res) => {
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

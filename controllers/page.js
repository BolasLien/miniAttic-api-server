import dbpages from '../models/page.js'
import * as verify from '../common/Verify.js'

export const getPages = async (req, res) => {
  try {
    const result = await dbpages.find()

    const datas = []
    for (const value of result) {
      datas.push({
        item: value.item,
        src: value.img,
        description1: value.description1,
        description2: value.description2,
        description3: value.description3,
        link: value.link,
        show: value.show
      })
    }

    res.status(200)
    res.send({ success: true, message: '資料查詢成功', datas })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const getPagesCondition = async (req, res) => {
  try {
    const result = await dbpages.find({
      // 查詢符合req.params.condition的item
      item: { $regex: req.params.condition }
    })

    const datas = []
    for (const value of result) {
      datas.push({
        item: value.item,
        src: value.img,
        description1: value.description1,
        description2: value.description2,
        description3: value.description3,
        link: value.link,
        show: value.show
      })
    }

    res.status(200)
    res.send({
      success: true, message: '資料查詢成功', datas
    })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const updatePage = async (req, res) => {
  try {
    verify.contentTypeJSON(req)
    verify.jwtVerify(req)

    // 資料更新成功的時候要把資料進DB
    await dbpages.findOneAndUpdate(
      { item: req.params.item }, {
        show: req.body.show,
        description1: req.body.description1,
        description2: req.body.description2,
        description3: req.body.description3,
        link: req.body.link
      }
    )

    res.status(200)
    res.send({ success: true, message: '資料更新成功' })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

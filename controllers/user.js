import db from '../models/user.js'
import md5 from 'md5'
import * as verify from '../common/Verify.js'

// 建立使用者資料
export const createUser = async (req, res) => {
  try {
    verify.contentTypeJSON(req)
    await db.create({
      name: req.body.name,
      phone: req.body.phone,
      account: req.body.account,
      password: md5(req.body.password)
    })
    res.status(200)
    res.send({ success: true, message: '會員註冊成功' })
  } catch (error) {
    verify.ErrorResponse(error, res)
  }
}

export const getUsers = async (req, res) => {
  // 取得所有使用者資料
}

export const updateUser = async (req, res) => {
  // 更新使用者資料
}

export const deleteUser = async (req, res) => {
  // 刪除使用者資料
}

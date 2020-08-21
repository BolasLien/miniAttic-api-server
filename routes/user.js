import express from 'express'

import { createUser, getUsers, updateUser, deleteUser } from '../controllers/user.js'

const router = express.Router()

// 這裡最後的路徑會是 /users
router.post('/', createUser)

// 這裡最後的路徑會是 /users
router.get('/', getUsers)

// 這裡最後的路徑會是 /users/:account
router.patch('/:account', updateUser)

// 這裡最後的路徑會是 /users/:account
router.delete('/:account', deleteUser)

export default router

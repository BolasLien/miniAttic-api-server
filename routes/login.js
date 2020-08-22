import express from 'express'

import { userLogin, userLogout } from '../controllers/login.js'

const router = express.Router()

// url => /login
router.post('/', userLogin)

// url => /login
router.delete('/', userLogout)

export default router

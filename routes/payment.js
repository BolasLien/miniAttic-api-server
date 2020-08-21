import express from 'express'

import { createPayment, getPayments, updatePayment, deletePayment } from '../controllers/payment.js'

const router = express.Router()

// 這裡最後的路徑會是 /Categorys
router.post('/', createPayment)

// 這裡最後的路徑會是 /Categorys
router.get('/', getPayments)

// 這裡最後的路徑會是 /Categorys/:item
router.patch('/:item', updatePayment)

// 這裡最後的路徑會是 /Categorys/:item
router.delete('/:item', deletePayment)

export default router

import express from 'express'

import { createOrder, getOrders, getOrderDetail, updateOrder, deleteOrder } from '../controllers/order.js'

const router = express.Router()

// 這裡最後的路徑會是 /Orders
router.post('/', createOrder)

// 這裡最後的路徑會是 /Orders
router.get('/', getOrders)

// 這裡最後的路徑會是 /Orders/:item
router.get('/:item', getOrderDetail)

// 這裡最後的路徑會是 /Orders/:item
router.patch('/:item', updateOrder)

// 這裡最後的路徑會是 /Orders/:item
router.delete('/:item', deleteOrder)

export default router

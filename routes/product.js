import express from 'express'

import { createProduct, getProducts, updateProduct, deleteProduct } from '../controllers/product.js'

const router = express.Router()

// 這裡最後的路徑會是 /Products
router.post('/', createProduct)

// 這裡最後的路徑會是 /Products
router.get('/', getProducts)

// 這裡最後的路徑會是 /Products/:item
router.patch('/:item', updateProduct)

// 這裡最後的路徑會是 /Products/:item
router.delete('/:item', deleteProduct)

export default router

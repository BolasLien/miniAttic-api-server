import express from 'express'

import { createCategory, getCategorys, updateCategory, deleteCategory } from '../controllers/category.js'

const router = express.Router()

// 這裡最後的路徑會是 /Categorys
router.post('/', createCategory)

// 這裡最後的路徑會是 /Categorys
router.get('/', getCategorys)

// 這裡最後的路徑會是 /Categorys/:item
router.patch('/:item', updateCategory)

// 這裡最後的路徑會是 /Categorys/:item
router.delete('/:item', deleteCategory)

export default router

import express from 'express'

import { getPages, getPagesCondition, updatePage } from '../controllers/page.js'

const router = express.Router()

router.get('/', getPages)

router.get('/:condition', getPagesCondition)

router.patch('/:item', updatePage)

export default router

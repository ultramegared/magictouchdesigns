/**
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: review.routes.ts
 * Description: Review API routes configuration.
 * Languages: English (en) | Español (es)
 */

import { Router } from 'express';

import {
  create,
  getMine,
  getPublic,
  getById,
  update,
  remove,
} from '../controllers/review.controller';

import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();


/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

router.get('/public', getPublic);

router.get('/:id', getById);


/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/

router.post(
  '/',
  authenticateToken,
  create
);

router.get(
  '/my-reviews',
  authenticateToken,
  getMine
);

router.put(
  '/:id',
  authenticateToken,
  update
);

router.delete(
  '/:id',
  authenticateToken,
  remove
);


export default router;
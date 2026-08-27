/**
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: review.controller.ts
 * Description: Review request handling and API responses.
 * Languages: English (en) | Español (es)
 */


import { Request, Response } from 'express';

import {
  createReview,
  getMyReviews,
  getPublicReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../services/review.service';


interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}


export const create = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const review = await createReview({
      user_id: userId,
      product_id: req.body.product_id,
      rating: req.body.rating,
      comment: req.body.comment,
      image_url: req.body.image_url,
      social_platform: req.body.social_platform,
      social_url: req.body.social_url,
    });

    return res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Error creating review:', error);

    return res.status(500).json({
      message: 'Error creating review',
    });
  }
};


export const getMine = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const reviews = await getMyReviews(userId);

    return res.status(200).json({
      reviews,
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);

    return res.status(500).json({
      message: 'Error getting reviews',
    });
  }
};


export const getPublic = async (
  req: Request,
  res: Response
) => {
  try {
    const requestedLimit = Number(req.query.limit);

    const limit =
      requestedLimit > 0
        ? Math.min(requestedLimit, 8)
        : 8;

    const reviews = await getPublicReviews(limit);

    return res.status(200).json({
      reviews,
    });
  } catch (error) {
    console.error('Error getting public reviews:', error);

    return res.status(500).json({
      message: 'Error getting public reviews',
    });
  }
};


export const getById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const review = await getReviewById(id);

    if (!review) {
      return res.status(404).json({
        message: 'Review not found',
      });
    }

    return res.status(200).json({
      review,
    });
  } catch (error) {
    console.error('Error getting review:', error);

    return res.status(500).json({
      message: 'Error getting review',
    });
  }
};


export const update = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;

    const review = await updateReview(
      id,
      userId,
      {
        rating: req.body.rating,
        comment: req.body.comment,
        image_url: req.body.image_url,
        social_platform: req.body.social_platform,
        social_url: req.body.social_url,
      }
    );

    if (!review) {
      return res.status(404).json({
        message: 'Review not found or unauthorized',
      });
    }

    return res.status(200).json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Error updating review:', error);

    return res.status(500).json({
      message: 'Error updating review',
    });
  }
};


export const remove = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;

    const review = await deleteReview(
      id,
      userId
    );

    if (!review) {
      return res.status(404).json({
        message: 'Review not found or unauthorized',
      });
    }

    return res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);

    return res.status(500).json({
      message: 'Error deleting review',
    });
  }
};
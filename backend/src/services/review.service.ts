/**
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: review.service.ts
 * Description: Review business logic and database operations.
 * Languages: English (en) | Español (es)
 */


import { pool } from '../config/database';

export interface CreateReviewData {
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  image_url?: string | null;
  social_platform?: string | null;
  social_url?: string | null;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  image_url?: string | null;
  social_platform?: string | null;
  social_url?: string | null;
}

export const createReview = async (data: CreateReviewData) => {
  const {
    user_id,
    product_id,
    rating,
    comment,
    image_url = null,
    social_platform = null,
    social_url = null,
  } = data;

  const query = `
    INSERT INTO reviews (
      user_id,
      product_id,
      rating,
      comment,
      image_url,
      social_platform,
      social_url,
      is_approved
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
    RETURNING *;
  `;

  const values = [
    user_id,
    product_id,
    rating,
    comment,
    image_url,
    social_platform,
    social_url,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};


export const getMyReviews = async (userId: string) => {
  const query = `
    SELECT
      r.*
    FROM reviews r
    WHERE r.user_id = $1
    ORDER BY r.created_at DESC;
  `;

  const result = await pool.query(query, [userId]);

  return result.rows;
};


export const getPublicReviews = async (limit: number = 8) => {
  const query = `
    SELECT
      r.*,
      u.username,
      u.first_name,
      u.last_name
    FROM reviews r
    INNER JOIN users u
      ON u.id = r.user_id
    WHERE r.is_approved = TRUE
    ORDER BY r.created_at DESC
    LIMIT $1;
  `;

  const result = await pool.query(query, [limit]);

  return result.rows;
};


export const getReviewById = async (reviewId: string) => {
  const query = `
    SELECT *
    FROM reviews
    WHERE id = $1;
  `;

  const result = await pool.query(query, [reviewId]);

  return result.rows[0] || null;
};


export const updateReview = async (
  reviewId: string,
  userId: string,
  data: UpdateReviewData
) => {
  const {
    rating,
    comment,
    image_url,
    social_platform,
    social_url,
  } = data;

  const query = `
    UPDATE reviews
    SET
      rating = COALESCE($1, rating),
      comment = COALESCE($2, comment),
      image_url = COALESCE($3, image_url),
      social_platform = COALESCE($4, social_platform),
      social_url = COALESCE($5, social_url),
      is_approved = FALSE,
      updated_at = NOW()
    WHERE id = $6
      AND user_id = $7
    RETURNING *;
  `;

  const values = [
    rating ?? null,
    comment ?? null,
    image_url ?? null,
    social_platform ?? null,
    social_url ?? null,
    reviewId,
    userId,
  ];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
};


export const deleteReview = async (
  reviewId: string,
  userId: string
) => {
  const query = `
    DELETE FROM reviews
    WHERE id = $1
      AND user_id = $2
    RETURNING id;
  `;

  const result = await pool.query(query, [
    reviewId,
    userId,
  ]);

  return result.rows[0] || null;
};


export const approveReview = async (reviewId: string) => {
  const query = `
    UPDATE reviews
    SET
      is_approved = TRUE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [reviewId]);

  return result.rows[0] || null;
};
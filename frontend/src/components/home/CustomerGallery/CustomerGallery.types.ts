/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomerGallery.types.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Customer Gallery types.
 * ================================================================
 */

export interface CustomerGalleryItem {

    id: number;

    reviewId: string;

    userId: string;

    productId: string;

    image: string;

    customerName: string;

    comment: string;

    createdAt: string;

}
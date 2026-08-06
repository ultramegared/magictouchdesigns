# ===============================================================
# Magic Touch Designs
# PROJECT ARCHITECTURE
# Version: 1.0
# Status: Approved
# ===============================================================

# Project Vision

Magic Touch Designs is a premium e-commerce platform focused on personalized products.

The first release specializes in custom mugs, but the architecture is designed to support additional personalized products in the future without requiring major structural changes.

The platform prioritizes scalability, maintainability, security, performance, and a premium user experience.

—

# Design Philosophy

The website must feel modern, elegant, premium, and minimal.

Every page should share the same visual identity and user experience.

Core principles:

- Premium Design
- Clean UI
- Responsive Layout
- Fast Performance
- Professional UX
- Scalable Architecture

—

# Color Palette

Primary

Black

Accent

Gold

Text

White

Background

Dark Theme

—

# Typography

Elegant Serif Titles

Modern Sans-serif Body

High readability

Consistent spacing

—

# Languages

Default Language

English

Supported Languages

- English
- Spanish

Language selector

EN | ES

Always visible in the Header.

—

# Public Website

Home

Models

Collections

Customize

Cart

Checkout

Order Confirmation

Track My Order

My Account

Contact

Login

Register

Forgot Password

—

# Customer Flow

Home

↓

Models

↓

Customize

↓

Cart

↓

Checkout

↓

Order Confirmation

↓

Track My Order

↓

My Account

—

# Payment Providers

Stripe

PayPal

Future Support

Apple Pay

Google Pay

—

# Checkout Features

Sales Tax

Shipping

Coupons

Discounts

Grand Total

Secure Checkout

Order Summary

—

# Customer Features

Account

Saved Addresses

Order History

Track Orders

Saved Designs

Wishlist (Future)

Notifications (Future)

—

# Backend

REST API

Authentication

Authorization

JWT

Password Recovery

Image Upload

Email Service

Payment Processing

Shipping Calculation

Sales Tax Calculation

—

# Database

Users

Roles

Products

Product Images

Collections

Orders

Order Items

Payments

Coupons

Reviews

Homepage Banners

Newsletter

Shipping Addresses

Settings

Custom Designs

—

# Folder Structure

magictouchdesigns/

frontend/

backend/

docs/

—

# Frontend

React

TypeScript

React Router

Context API

Reusable Components

Responsive Design

—

# Backend

Node.js

Express

PostgreSQL

Prisma ORM

REST API

—

# Storage

storage/

models/

collections/

homepage/

gallery/

reviews/

logos/

emails/

users/

—

# Image Rules

High Quality

Optimized

WebP when possible

Consistent dimensions

Automatic cropping

Automatic resizing

—

# Responsive

Desktop

Tablet

Mobile

Every page must work perfectly on every device.

—

# Security

JWT Authentication

Password Encryption

Protected Routes

Role System

Admin Middleware

Input Validation

Rate Limiting

Future Secure Cookies

—

# Admin Dashboard

The Admin Dashboard is intentionally excluded from Phase 1.

The entire architecture must be prepared from the beginning.

Dashboard development starts after the public website is completed.

—

# Phase 1

Public Website

Backend

Authentication

Payments

Emails

Database

Shipping

Deployment

—

# Phase 2

Admin Dashboard

Orders

Customers

Products

Collections

Coupons

Homepage Manager

Analytics

Reports

Newsletter

Settings

—

# Future Features

Gift Cards

Reward Points

Referral Program

AI Preview

Inventory Control

Marketing Dashboard

Multiple Warehouses

Live Chat

Advanced Analytics

—

# Coding Standards

Folder Names

lowercase

React Components

PascalCase

Hooks

camelCase

Utilities

camelCase

Assets

lowercase

Documentation

UPPER_SNAKE_CASE.md

Git Branches

feature/*
fix/*
hotfix/*
release/*

Commit Style

feat:

fix:

refactor:

style:

docs:

test:

chore:

—

# Golden Rule

Never sacrifice architecture for speed.

Prioritize:

- Clean Code
- Scalability
- Maintainability
- Performance
- Security
- Professional UI/UX

Every feature must be built thinking about future growth.

# ===============================================================
# CODE STYLE GUIDE
# ===============================================================

The entire project must follow a single coding standard.

No exceptions.

————————————————————

# Language

Frontend

TypeScript

Backend

TypeScript

————————————————————

# React Components

PascalCase

Example

HomePage.tsx

ProductCard.tsx

CheckoutPage.tsx

————————————————————

# Hooks

camelCase

Example

useCart.ts

useCheckout.ts

useLanguage.ts

————————————————————

# Context

PascalCase

Example

AuthContext.tsx

CartContext.tsx

LanguageContext.tsx

————————————————————

# Interfaces

PascalCase

Example

interface User

interface Product

interface Order

————————————————————

# Variables

camelCase

Example

const productPrice

const totalAmount

const selectedModel

————————————————————

# Constants

UPPER_CASE

Example

DEFAULT_LANGUAGE

MAX_UPLOAD_SIZE

API_URL

————————————————————

# Functions

camelCase

Example

calculateTotal()

createOrder()

formatCurrency()

————————————————————

# Folder Names

lowercase

Example

components

pages

services

hooks

styles

translations

————————————————————

# CSS Classes

BEM Methodology

Example

product-card

product-card__image

product-card__title

product-card—active

————————————————————

# File Header

Every file must start with:

/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File:
 * Module:
 * Language:
 * Description:
 * ===============================================================
 */

————————————————————

# Formatting Rules

One import block

One export

Blank lines between logical blocks

Consistent indentation

Readable spacing

No unnecessary comments

Self-documenting code

————————————————————

# Clean Code Rules

Small Components

Single Responsibility

Reusable Components

No duplicated code

No magic numbers

Descriptive variable names

Strong typing

No any unless absolutely necessary

————————————————————

# Architecture Rule

UI

↓

Context

↓

Services

↓

API

↓

Backend

↓

Database

Never skip layers.

===============================================================

===============================================================
END OF DOCUMENT
===============================================================



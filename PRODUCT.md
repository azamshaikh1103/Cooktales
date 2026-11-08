# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two co-equal audiences: home cooks who discover and cook recipes/stories, and individual creators who publish and build an audience. Global, English-language.

## Product Purpose
CookTale is a user-generated cooking platform where people discover food content and creators publish and earn from their work. Success: cooks find and return to recipes and creators; creators can publish, grow and be paid.

## Positioning
Creator-first earnings: individual creators own their recipes, stories (and later courses) and earnings, funded through CookTale membership subscriptions.

## Operating Context
Next.js frontend (`frontend/`), NestJS API (`backend/`), PostgreSQL via Prisma, Redis/BullMQ, Cloudinary media. Architecture in `COOKTALE_SYSTEM_DESIGN.md`. Routes include recipe, stories/blogs, community, search, profile, studio (creator dashboard), membership, payment, notifications, onboarding.

## Capabilities and Constraints
Version one: individual creator accounts only; recipes with images and short step videos; likes, ratings, reviews, comments, bookmarks/collections, follows; stories; community discussions; search/filters; notifications; membership subscriptions; admin moderation. Later: mobile app, courses, live classes, creator payouts and ad earnings. Frontend currently uses Redux Toolkit + AuthContext (migration to Zustand/TanStack Query not approved); Zod for forms.

## Evidence on Hand
No testimonials, customer counts or benchmarks are recorded; do not fabricate them. Scale target (15,000 concurrent users) is unverified.

## Product Principles
- Creators own their work and earnings; the product never obscures who made something.
- Recipes are for cooking: content must stay readable and usable mid-task.
- Cooks and creators are both first-class; neither audience is an afterthought.
- Claim only what is built; no invented proof or metrics.

## Accessibility & Inclusion
No product-specific standard established; default to WCAG 2.1 AA.

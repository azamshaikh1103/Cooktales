# Backend Modules

CookTale backend modules should be migrated one at a time.

Recommended order:

1. `health` - foundation smoke test
2. `auth` - signup, login, refresh, verification, password reset, OAuth
3. `users` - profile, settings, preferences, follow/unfollow
4. `media` - Cloudinary signatures, upload policy, deletion
5. `recipes` - recipe CRUD, cook mode, ratings, reviews, bookmarks
6. `blogs` - stories/blogs, comments, likes, bookmarks
7. `community` - discussions, replies, challenges, leaderboard
8. `search` - normal search first, AI-backed search later
9. `payments` - checkout, billing portal, subscription webhooks
10. `studio` - creator analytics, content management, earnings
11. `notifications` - email, in-app, and later push notifications
12. `admin` - moderation and operational controls

Each real module should keep HTTP, validation, and business logic separated:

```txt
module-name/
  module-name.module.ts
  module-name.controller.ts
  module-name.service.ts
  module-name.validation.ts
  module-name.types.ts
```

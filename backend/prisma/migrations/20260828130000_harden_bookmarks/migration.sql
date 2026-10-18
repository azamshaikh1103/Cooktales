ALTER TABLE "Bookmark"
ADD CONSTRAINT "Bookmark_exactly_one_content_target"
CHECK (
  ("recipeId" IS NOT NULL AND "blogId" IS NULL)
  OR ("recipeId" IS NULL AND "blogId" IS NOT NULL)
);

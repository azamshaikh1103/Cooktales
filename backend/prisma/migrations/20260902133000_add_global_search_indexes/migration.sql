CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE FUNCTION "CookTale_search_vector"(title text, description text, tags text[])
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT to_tsvector(
    'english'::regconfig,
    coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), '')
  );
$$;

CREATE INDEX "Recipe_search_fts_idx"
ON "Recipe" USING GIN (
  "CookTale_search_vector"("name", "about", "tags")
);

CREATE INDEX "Blog_search_fts_idx"
ON "Blog" USING GIN (
  "CookTale_search_vector"("title", "shortDesc", "tags")
);

CREATE INDEX "User_search_fts_idx"
ON "User" USING GIN (
  "CookTale_search_vector"("name", "about", ARRAY["username"])
)
WHERE "deletedAt" IS NULL AND "username" IS NOT NULL;

CREATE INDEX "Recipe_name_trgm_idx" ON "Recipe" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX "Blog_title_trgm_idx" ON "Blog" USING GIN (lower("title") gin_trgm_ops);
CREATE INDEX "User_username_trgm_idx" ON "User" USING GIN (lower("username") gin_trgm_ops)
WHERE "deletedAt" IS NULL AND "username" IS NOT NULL;

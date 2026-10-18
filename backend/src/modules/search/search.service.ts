import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SearchQueryDto } from './dto/search.dto';

type SearchRow = {
  id: string;
  slug: string | null;
  type: 'recipe' | 'story' | 'chef';
  title: string;
  description: string | null;
  image: string | null;
  authorName: string | null;
  authorUsername: string | null;
  totalTime: number | null;
  cuisine: string | null;
  diet: string | null;
  difficulty: string | null;
  publishedAt: Date | null;
  score: number;
  total: number;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const rows = await this.run(query, (page - 1) * limit, limit);
    const total = rows[0]?.total || 0;
    return {
      results: rows.map(({ total: _total, score: _score, ...result }) => result),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  async suggestions(query: SearchQueryDto) {
    const rows = await this.run({ ...query, sort: 'relevance' }, 0, Math.min(query.limit || 8, 10));
    return {
      suggestions: rows.map(({ total: _total, score: _score, description, ...result }) => ({
        ...result,
        description: description || undefined,
      })),
    };
  }

  private async run(query: SearchQueryDto, offset: number, limit: number) {
    const normalized = query.q.trim().toLowerCase();
    const documents: Prisma.Sql[] = [];

    if (query.type === 'all' || query.type === 'recipe') {
      documents.push(this.recipeDocument(query, normalized));
    }
    if (query.type === 'all' || query.type === 'story') {
      documents.push(this.storyDocument(normalized));
    }
    if (query.type === 'all' || query.type === 'chef') {
      documents.push(this.chefDocument(normalized));
    }

    const orderBy =
      query.sort === 'latest'
        ? Prisma.sql`d."publishedAt" DESC NULLS LAST, d.score DESC, d.id ASC`
        : query.sort === 'popular'
          ? Prisma.sql`d.popularity DESC, d.score DESC, d."publishedAt" DESC NULLS LAST, d.id ASC`
          : Prisma.sql`d.score DESC, d."publishedAt" DESC NULLS LAST, d.id ASC`;

    return this.prisma.$queryRaw<SearchRow[]>(Prisma.sql`
      WITH search_query AS (
        SELECT websearch_to_tsquery('english'::regconfig, ${normalized}) AS tsq
      ), documents AS (
        ${Prisma.join(documents, ' UNION ALL ')}
      )
      SELECT
        d.id,
        d.slug,
        d.type,
        d.title,
        d.description,
        d.image,
        d."authorName",
        d."authorUsername",
        d."totalTime",
        d.cuisine,
        d.diet,
        d.difficulty,
        d."publishedAt",
        d.score,
        COUNT(*) OVER()::integer AS total
      FROM documents d
      ORDER BY ${orderBy}
      OFFSET ${offset}
      LIMIT ${limit}
    `);
  }

  private recipeDocument(query: SearchQueryDto, normalized: string) {
    const filters: Prisma.Sql[] = [
      Prisma.sql`r."status" = 'PUBLISHED'::"RecipeStatus"`,
      Prisma.sql`r."deletedAt" IS NULL`,
    ];
    if (query.cuisine) filters.push(Prisma.sql`r.cuisine = ${query.cuisine}`);
    if (query.diet) filters.push(Prisma.sql`r.diet::text = ${query.diet}`);
    if (query.difficulty) filters.push(Prisma.sql`r.difficulty::text = ${query.difficulty}`);
    if (query.maxMinutes) filters.push(Prisma.sql`r."totalTimeReq" <= ${query.maxMinutes}`);
    if (query.tag) {
      filters.push(Prisma.sql`EXISTS (SELECT 1 FROM unnest(r.tags) AS tag WHERE lower(tag) = lower(${query.tag}))`);
    }

    return Prisma.sql`
      SELECT
        r.id,
        r.slug,
        'recipe'::text AS type,
        r.name AS title,
        r.about AS description,
        NULLIF(r."mainImage", '') AS image,
        u.name AS "authorName",
        u.username AS "authorUsername",
        r."totalTimeReq" AS "totalTime",
        r.cuisine,
        r.diet::text AS diet,
        r.difficulty::text AS difficulty,
        r."publishedAt" AS "publishedAt",
        r."popularityScore" AS popularity,
        (
          ts_rank_cd(
            "CookTale_search_vector"(r.name, r.about, r.tags),
            q.tsq,
            32
          ) * 100
          + word_similarity(${normalized}, lower(coalesce(r.name, '') || ' ' || coalesce(r.about, '') || ' ' || coalesce(array_to_string(r.tags, ' '), ''))) * 25
          + LEAST(r."popularityScore", 10000) * 0.001
          + r.ratings * 0.1
        )::double precision AS score
      FROM "Recipe" r
      JOIN "User" u ON u.id = r."authorId" AND u."deletedAt" IS NULL
      CROSS JOIN search_query q
      WHERE ${Prisma.join(filters, ' AND ')}
        AND (
          "CookTale_search_vector"(r.name, r.about, r.tags) @@ q.tsq
          OR word_similarity(${normalized}, lower(coalesce(r.name, '') || ' ' || coalesce(r.about, '') || ' ' || coalesce(array_to_string(r.tags, ' '), ''))) >= 0.42
        )
    `;
  }

  private storyDocument(normalized: string) {
    return Prisma.sql`
      SELECT
        s.id,
        s.slug,
        'story'::text AS type,
        s.title,
        s."shortDesc" AS description,
        s.poster AS image,
        u.name AS "authorName",
        u.username AS "authorUsername",
        NULL::integer AS "totalTime",
        NULL::text AS cuisine,
        NULL::text AS diet,
        NULL::text AS difficulty,
        s."publishedAt" AS "publishedAt",
        s."popularityScore" AS popularity,
        (
          ts_rank_cd(
            "CookTale_search_vector"(s.title, s."shortDesc", s.tags),
            q.tsq,
            32
          ) * 100
          + word_similarity(${normalized}, lower(coalesce(s.title, '') || ' ' || coalesce(s."shortDesc", '') || ' ' || coalesce(array_to_string(s.tags, ' '), ''))) * 25
          + LEAST(s."popularityScore", 10000) * 0.001
        )::double precision AS score
      FROM "Blog" s
      JOIN "User" u ON u.id = s."authorId" AND u."deletedAt" IS NULL
      CROSS JOIN search_query q
      WHERE s."status" = 'PUBLISHED'::"StoryStatus"
        AND s."deletedAt" IS NULL
        AND (
          "CookTale_search_vector"(s.title, s."shortDesc", s.tags) @@ q.tsq
          OR word_similarity(${normalized}, lower(coalesce(s.title, '') || ' ' || coalesce(s."shortDesc", '') || ' ' || coalesce(array_to_string(s.tags, ' '), ''))) >= 0.42
        )
    `;
  }

  private chefDocument(normalized: string) {
    return Prisma.sql`
      SELECT
        u.id,
        u.username AS slug,
        'chef'::text AS type,
        u.name AS title,
        u.about AS description,
        u.image,
        NULL::text AS "authorName",
        u.username AS "authorUsername",
        NULL::integer AS "totalTime",
        NULL::text AS cuisine,
        NULL::text AS diet,
        NULL::text AS difficulty,
        u."createdAt" AS "publishedAt",
        u.points::double precision AS popularity,
        (
          ts_rank_cd("CookTale_search_vector"(u.name, u.about, ARRAY[u.username]), q.tsq, 32) * 100
          + word_similarity(${normalized}, lower(coalesce(u.name, '') || ' ' || coalesce(u.username, '') || ' ' || coalesce(u.about, ''))) * 25
          + LEAST(u.points, 10000) * 0.001
        )::double precision AS score
      FROM "User" u
      CROSS JOIN search_query q
      WHERE u."deletedAt" IS NULL
        AND u.username IS NOT NULL
        AND (
          "CookTale_search_vector"(u.name, u.about, ARRAY[u.username]) @@ q.tsq
          OR word_similarity(${normalized}, lower(coalesce(u.name, '') || ' ' || coalesce(u.username, '') || ' ' || coalesce(u.about, ''))) >= 0.42
        )
    `;
  }
}

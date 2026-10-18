import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_MODE: z.enum(['api', 'worker']).default('api'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().min(1).default('api'),
  API_VERSION: z.string().min(1).default('1'),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  AUTH_TRUSTED_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  AUTH_CSRF_PROTECTION_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value !== 'false'),
  JWT_ACCESS_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  EMAIL_UNSUBSCRIBE_SECRET: z.string().min(16).optional(),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  EMAIL_VERIFICATION_CODE_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  EMAIL_VERIFICATION_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  PASSWORD_RESET_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  AUTH_RATE_LIMIT_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value !== 'false'),
  AUTH_SIGNUP_EMAIL_LIMIT: z.coerce.number().int().positive().default(5),
  AUTH_SIGNUP_EMAIL_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_SIGNUP_IP_LIMIT: z.coerce.number().int().positive().default(20),
  AUTH_SIGNUP_IP_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_LOGIN_IP_LIMIT: z.coerce.number().int().positive().default(30),
  AUTH_LOGIN_IP_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  AUTH_LOGIN_LOCK_SHORT_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOGIN_LOCK_SHORT_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  AUTH_LOGIN_LOCK_LONG_ATTEMPTS: z.coerce.number().int().positive().default(10),
  AUTH_LOGIN_LOCK_LONG_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  AUTH_OTP_RESEND_EMAIL_LIMIT: z.coerce.number().int().positive().default(5),
  AUTH_OTP_RESEND_EMAIL_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_OTP_RESEND_IP_LIMIT: z.coerce.number().int().positive().default(20),
  AUTH_OTP_RESEND_IP_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_OTP_VERIFY_IP_LIMIT: z.coerce.number().int().positive().default(30),
  AUTH_OTP_VERIFY_IP_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  AUTH_FORGOT_PASSWORD_EMAIL_LIMIT: z.coerce.number().int().positive().default(3),
  AUTH_FORGOT_PASSWORD_EMAIL_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_FORGOT_PASSWORD_IP_LIMIT: z.coerce.number().int().positive().default(10),
  AUTH_FORGOT_PASSWORD_IP_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_RESET_PASSWORD_EMAIL_LIMIT: z.coerce.number().int().positive().default(5),
  AUTH_RESET_PASSWORD_EMAIL_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_RESET_PASSWORD_IP_LIMIT: z.coerce.number().int().positive().default(20),
  AUTH_RESET_PASSWORD_IP_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  AUTH_REFRESH_IP_LIMIT: z.coerce.number().int().positive().default(60),
  AUTH_REFRESH_IP_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  AUTH_REFRESH_TOKEN_LIMIT: z.coerce.number().int().positive().default(30),
  AUTH_REFRESH_TOKEN_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  AUTH_GOOGLE_IP_LIMIT: z.coerce.number().int().positive().default(30),
  AUTH_GOOGLE_IP_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  NEWSLETTER_CONFIRMATION_TTL_HOURS: z.coerce.number().int().positive().max(168).default(24),
  NEWSLETTER_SIGNUP_EMAIL_LIMIT: z.coerce.number().int().positive().default(3),
  NEWSLETTER_SIGNUP_IP_LIMIT: z.coerce.number().int().positive().default(10),
  NEWSLETTER_SIGNUP_WINDOW_SECONDS: z.coerce.number().int().positive().default(60 * 60),
  RECIPE_REACTION_USER_LIMIT: z.coerce.number().int().positive().default(60),
  RECIPE_REACTION_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RECIPE_REVIEW_USER_LIMIT: z.coerce.number().int().positive().default(10),
  RECIPE_REVIEW_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
  RECIPE_REVIEW_CREATE_LIMIT: z.coerce.number().int().positive().default(3),
  RECIPE_REVIEW_UPDATE_LIMIT: z.coerce.number().int().positive().default(10),
  RECIPE_REVIEW_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  RECIPE_COMMENT_CREATE_LIMIT: z.coerce.number().int().positive().default(5),
  RECIPE_COMMENT_EDIT_LIMIT: z.coerce.number().int().positive().default(10),
  RECIPE_COMMENT_REACTION_LIMIT: z.coerce.number().int().positive().default(30),
  RECIPE_COMMENT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RECIPE_VIEW_IP_LIMIT: z.coerce.number().int().positive().default(120),
  RECIPE_VIEW_IP_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RECIPE_VIEW_DEDUPE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 60),
  RECIPE_VIEW_FLUSH_INTERVAL_SECONDS: z.coerce.number().int().positive().default(30),
  SEARCH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  SEARCH_QUERY_IP_LIMIT: z.coerce.number().int().positive().default(120),
  SEARCH_SUGGESTIONS_IP_LIMIT: z.coerce.number().int().positive().default(60),
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().optional(),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URL: z.string().url().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_ROOT_FOLDER: z.string().min(1).default('cooktale'),
  MEDIA_PENDING_UPLOAD_TTL_HOURS: z.coerce.number().int().positive().default(24),
  MEDIA_CLEANUP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),
  PROFILE_USERNAME_CHANGE_COOLDOWN_DAYS: z.coerce.number().int().positive().default(30),
  NOTIFICATION_EMAIL_DIGEST_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value !== 'false'),
  NOTIFICATION_EMAIL_DIGEST_HOUR_LOCAL: z.coerce.number().int().min(0).max(23).default(9),
  NOTIFICATION_EMAIL_DIGEST_LOOKBACK_HOURS: z.coerce.number().int().positive().max(168).default(24),
  NOTIFICATION_EMAIL_DIGEST_ITEM_LIMIT: z.coerce.number().int().positive().max(12).default(8),
  NOTIFICATION_EMAIL_DIGEST_BATCH_SIZE: z.coerce.number().int().positive().max(500).default(100),
  NOTIFICATION_EMAIL_DIGEST_RUN_EVERY_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  NOTIFICATION_PUSH_ENABLED: z.string().default('true').transform((value) => value !== 'false'),
  NOTIFICATION_REALTIME_ENABLED: z.string().default('true').transform((value) => value !== 'false'),
  NOTIFICATION_UNREAD_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  NOTIFICATION_SSE_MAX_CONNECTIONS_PER_USER: z.coerce.number().int().positive().max(10).default(3),
  NOTIFICATION_SSE_MAX_CONNECTION_SECONDS: z.coerce.number().int().positive().max(3600).default(1500),
  NOTIFICATION_CLEANUP_ENABLED: z.string().default('true').transform((value) => value !== 'false'),
  NOTIFICATION_READ_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  NOTIFICATION_CLEANUP_BATCH_SIZE: z.coerce.number().int().positive().max(10_000).default(1000),
  VAPID_SUBJECT: z.string().default('mailto:hello@cooktale.in'),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('CookTale <noreply@cooktale.in>'),
  CONTACT_EMAIL_TO: z.string().email().default('contact@cooktale.in'),
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_STORE_ID: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
  LEMONSQUEEZY_VARIANT_MONTHLY: z.string().optional(),
  LEMONSQUEEZY_VARIANT_YEARLY: z.string().optional(),
  LEMONSQUEEZY_VARIANT_LIFETIME: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');

    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  return parsed.data;
}

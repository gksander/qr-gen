import { relations, sql } from 'drizzle-orm'
import { index, int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Trash sample
 */
export const postsTable = sqliteTable('posts', {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  content: text().notNull(),
})

/**
 * QR Codes
 */
export const qrCodesTable = sqliteTable('qr_codes', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(
      sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
    )
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(
      sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
    )
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),

  /**
   * Owner of the QR Code
   */
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  /**
   * Internally-referenced title of the QR code
   */
  title: text('title').notNull().default('Untitled'),

  /**
   * Type of the QR Code, e.g.
   * - `static` for a (free) static URL QR Code
   * - `url` for a dynamic URL QR Code
   */
  type: text({ enum: ['static', 'url'] })
    .notNull()
    .default('static'),

  /**
   * JSON blob of the QR Code visual configuration
   */
  qrConfig: text('qr_config').notNull().default('{}'),

  /**
   * Data encoded in the QR Code (e.g. a URL)
   */
  data: text('data').notNull().default(''),
})

/**
 * Better auth
 */
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(
      sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
    )
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(
      sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
    )
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text('role'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(
        sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
      )
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(
        sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
      )
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(
        sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
      )
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(
        sql`(cast(unixepoch('subsecond') * 1000 as integer))` as unknown as Date,
      )
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const userRelations = relations(user as any, ({ many }) => ({
  sessions: many(session as any),
  accounts: many(account as any),
}))

export const sessionRelations = relations(session as any, ({ one }) => ({
  user: one(user as any, {
    fields: [session.userId as any],
    references: [user.id as any],
  }),
}))

export const accountRelations = relations(account as any, ({ one }) => ({
  user: one(user as any, {
    fields: [account.userId as any],
    references: [user.id as any],
  }),
}))

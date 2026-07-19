import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/* ----------------------------- Better Auth ------------------------------ */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt')
    .$defaultFn(() => new Date())
    .notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt').$defaultFn(() => new Date()),
})

/* ------------------------------ API platform ---------------------------- */

export const apiKey = pgTable('api_key', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  keyHash: text('keyHash').notNull().unique(),
  keyPrefix: text('keyPrefix').notNull(),
  name: text('name').notNull().default('Default'),
  status: text('status').notNull().default('active'),
  lastUsedAt: timestamp('lastUsedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const apiBalance = pgTable('api_balance', {
  userId: text('userId').primaryKey(),
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0'),
  totalSpent: numeric('totalSpent', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  totalTopup: numeric('totalTopup', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  tier: text('tier').notNull().default('none'),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const apiTransaction = pgTable('api_transaction', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  balanceAfter: numeric('balanceAfter', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  refId: text('refId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const apiPurchase = pgTable('api_purchase', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  upstreamPurchaseId: text('upstreamPurchaseId'),
  mode: text('mode').notNull().default('single'),
  country: text('country').notNull(),
  countryCode: text('countryCode'),
  phone: text('phone'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  cost: numeric('cost', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  status: text('status').notNull().default('PENDING'),
  code: text('code'),
  twoFaPassword: text('twoFaPassword'),
  archiveUrl: text('archiveUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  deliveredAt: timestamp('deliveredAt'),
  refundedAt: timestamp('refundedAt'),
})

export const apiInvoice = pgTable('api_invoice', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  provider: text('provider').notNull().default('heleket'),
  providerInvoiceId: text('providerInvoiceId'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'),
  payUrl: text('payUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  paidAt: timestamp('paidAt'),
})

export const apiWebhook = pgTable('api_webhook', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  url: text('url').notNull(),
  secret: text('secret'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const pricingSetting = pgTable('pricing_setting', {
  scope: text('scope').primaryKey(),
  markupPercent: numeric('markupPercent', { precision: 6, scale: 2 })
    .notNull()
    .default('40'),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

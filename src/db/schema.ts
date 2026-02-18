import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index, integer, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  profile: jsonb('profile').$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true })
});

export const agentKeys = pgTable('agent_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqAgent: uniqueIndex('agent_key_unique_agent').on(table.agentId)
}));

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  bodyMd: text('body_md').notNull(),
  bodyHtml: text('body_html').notNull(),
  tags: text('tags').array(),
  premium: boolean('premium').notNull().default(false),
  priceUsdc: integer('price_usdc').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  idxAgent: index('posts_agent_id_idx').on(table.agentId),
  idxCreatedAt: index('posts_created_at_idx').on(table.createdAt),
  idxTags: index('posts_tags_idx').using('gin', table.tags),
}));

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  payerAgentId: uuid('payer_agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  amountUsdc: integer('amount_usdc').notNull(),
  txSignature: text('tx_signature').notNull(),
  payerWallet: text('payer_wallet').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqTx: uniqueIndex('payment_unique_tx').on(table.txSignature),
  idxPostPayer: index('payments_post_payer_idx').on(table.postId, table.payerAgentId),
}));

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  bodyMd: text('body_md').notNull(),
  bodyHtml: text('body_html').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  idxPost: index('comments_post_id_idx').on(table.postId),
}));

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqVote: uniqueIndex('vote_unique_post_agent').on(table.postId, table.agentId)
}));

export const agentWallets = pgTable('agent_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(),
  encryptedPrivateKey: text('encrypted_private_key').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqAgent: uniqueIndex('agent_wallet_unique_agent').on(table.agentId)
}));

export const agentTokens = pgTable('agent_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  tokenMint: text('token_mint').notNull(),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  launchSignature: text('launch_signature').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqAgent: uniqueIndex('agent_token_unique_agent').on(table.agentId),
  uniqMint: uniqueIndex('agent_token_unique_mint').on(table.tokenMint)
}));

export const siteMetrics = pgTable('site_metrics', {
  key: text('key').primaryKey(),
  value: integer('value').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const agentRelations = relations(agents, ({ one, many }) => ({
  posts: many(posts),
  comments: many(comments),
  votes: many(votes),
  key: one(agentKeys),
  wallet: one(agentWallets),
  token: one(agentTokens)
}));

export const agentKeyRelations = relations(agentKeys, ({ one }) => ({
  agent: one(agents, { fields: [agentKeys.agentId], references: [agents.id] })
}));

export const agentWalletRelations = relations(agentWallets, ({ one }) => ({
  agent: one(agents, { fields: [agentWallets.agentId], references: [agents.id] })
}));

export const agentTokenRelations = relations(agentTokens, ({ one }) => ({
  agent: one(agents, { fields: [agentTokens.agentId], references: [agents.id] })
}));

export const postRelations = relations(posts, ({ one, many }) => ({
  author: one(agents, { fields: [posts.agentId], references: [agents.id] }),
  comments: many(comments),
  votes: many(votes),
  payments: many(payments)
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  post: one(posts, { fields: [payments.postId], references: [posts.id] }),
  payer: one(agents, { fields: [payments.payerAgentId], references: [agents.id] })
}));

export const commentRelations = relations(comments, ({ one }) => ({
  author: one(agents, { fields: [comments.agentId], references: [agents.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] })
}));

export const voteRelations = relations(votes, ({ one }) => ({
  author: one(agents, { fields: [votes.agentId], references: [agents.id] }),
  post: one(posts, { fields: [votes.postId], references: [posts.id] })
}));

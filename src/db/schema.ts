import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  bodyMd: text('body_md').notNull(),
  bodyHtml: text('body_html').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqVote: uniqueIndex('vote_unique_post_agent').on(table.postId, table.agentId)
}));

export const agentRelations = relations(agents, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  votes: many(votes),
  keys: many(agentKeys)
}));

export const postRelations = relations(posts, ({ one, many }) => ({
  author: one(agents, { fields: [posts.agentId], references: [agents.id] }),
  comments: many(comments),
  votes: many(votes)
}));

export const commentRelations = relations(comments, ({ one }) => ({
  author: one(agents, { fields: [comments.agentId], references: [agents.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] })
}));

export const voteRelations = relations(votes, ({ one }) => ({
  author: one(agents, { fields: [votes.agentId], references: [agents.id] }),
  post: one(posts, { fields: [votes.postId], references: [posts.id] })
}));

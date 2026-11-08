import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ─────────────────────────────────────────────
   MATCHES TABLE (Upcoming Fixtures & Raw Data)
   ───────────────────────────────────────────── */
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  apiFixtureId: integer("api_fixture_id").notNull().unique(),
  homeTeam: varchar("home_team", { length: 255 }).notNull(),
  awayTeam: varchar("away_team", { length: 255 }).notNull(),
  leagueId: integer("league_id").notNull(),
  leagueName: varchar("league_name", { length: 255 }),
  country: varchar("country", { length: 100 }).notNull(),
  kickoffTime: timestamp("kickoff_time", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ─────────────────────────────────────────────
   PREDICTIONS TABLE (Market, Odds, Confidence)
   ───────────────────────────────────────────── */
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  market: varchar("market", { length: 150 }).notNull(),
  odds: numeric("odds", { precision: 5, scale: 2 }).notNull(),
  confidenceScore: integer("confidence_score").notNull(), // 0 to 100
  isWeekendPick: boolean("is_weekend_pick").default(false).notNull(),
  predictionDate: varchar("prediction_date", { length: 20 }), // Format: YYYY-MM-DD
  result: varchar("result", { length: 20 }).default("PENDING").notNull(), // WON, LOST, PENDING
  finalScore: varchar("final_score", { length: 50 }), // Actual match score e.g. "2 - 1"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ─────────────────────────────────────────────
   SETTINGS TABLE (Whitelisted Leagues & Markets)
   ───────────────────────────────────────────── */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  // Array of allowed League / Country API IDs
  allowedLeagues: jsonb("allowed_leagues").$type<number[]>().notNull(),
  // Array of approved Betting Market strings
  allowedMarkets: jsonb("allowed_markets").$type<string[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ─────────────────────────────────────────────
   DAILY VISITS TABLE (Lightweight Traffic Analytics)
   ───────────────────────────────────────────── */
export const dailyVisits = pgTable("daily_visits", {
  id: serial("id").primaryKey(),
  visitDate: varchar("visit_date", { length: 20 }).notNull().unique(), // Format: YYYY-MM-DD
  visitCount: integer("visit_count").default(1).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ─────────────────────────────────────────────
   DRIZZLE ORM RELATIONS
   ───────────────────────────────────────────── */
export const matchesRelations = relations(matches, ({ many }) => ({
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  match: one(matches, {
    fields: [predictions.matchId],
    references: [matches.id],
  }),
}));

/* TypeScript Inferred Types */
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type PredictionRecord = typeof predictions.$inferSelect;
export type NewPredictionRecord = typeof predictions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;


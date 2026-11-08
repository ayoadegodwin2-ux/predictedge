CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_fixture_id" integer NOT NULL,
	"home_team" varchar(255) NOT NULL,
	"away_team" varchar(255) NOT NULL,
	"league_id" integer NOT NULL,
	"league_name" varchar(255),
	"country" varchar(100) NOT NULL,
	"kickoff_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_api_fixture_id_unique" UNIQUE("api_fixture_id")
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"market" varchar(150) NOT NULL,
	"odds" numeric(5, 2) NOT NULL,
	"confidence_score" integer NOT NULL,
	"is_weekend_pick" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"allowed_leagues" jsonb NOT NULL,
	"allowed_markets" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
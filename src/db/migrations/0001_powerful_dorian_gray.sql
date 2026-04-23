-- Adds new carpool columns for gas money amount, stops (waypoints),
-- and date range (start_date / end_date). Idempotent because prior
-- schema changes were pushed directly rather than migrated.
ALTER TABLE "carpools" ADD COLUMN IF NOT EXISTS "gas_money_amount" integer;
--> statement-breakpoint
ALTER TABLE "carpools" ADD COLUMN IF NOT EXISTS "stops" jsonb;
--> statement-breakpoint
ALTER TABLE "carpools" ADD COLUMN IF NOT EXISTS "start_date" date;
--> statement-breakpoint
ALTER TABLE "carpools" ADD COLUMN IF NOT EXISTS "end_date" date;

-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "public"."aal_level" AS ENUM('aal1', 'aal2', 'aal3');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."action" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."code_challenge_method" AS ENUM('s256', 'plain');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."equality_op" AS ENUM('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."factor_status" AS ENUM('unverified', 'verified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."factor_type" AS ENUM('totp', 'webauthn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."key_status" AS ENUM('default', 'valid', 'invalid', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."key_type" AS ENUM('aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."one_time_token_type" AS ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mb_token_mint" (
	"token_mint_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"minting_amount" text NOT NULL,
	"minting_token_name" text NOT NULL,
	"minting_usd_amount" text NOT NULL,
	"recieving_token_amount" text NOT NULL,
	"recieving_token_name" text NOT NULL,
	"minting_status" text NOT NULL,
	"token_mint_at" timestamp with time zone NOT NULL,
	"transaction_index" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_top" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_top_historical_data" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"tick_in_name" text NOT NULL,
	"tick_in_amount" text NOT NULL,
	"tick_in_usd_amount" text NOT NULL,
	"tick_in_tx_block" text NOT NULL,
	"tick_out_name" text NOT NULL,
	"tick_out_amount" text NOT NULL,
	"tick_out_tx_block" text NOT NULL,
	"transaction_type" text NOT NULL,
	"transaction_status" text NOT NULL,
	"transaction_timestamp" timestamp with time zone NOT NULL,
	"network" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_bit10_top_rebalance" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"index_value" double precision NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL,
	"new_tokens" json NOT NULL,
	"added" json NOT NULL,
	"removed" json NOT NULL,
	"retained" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_meme" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_meme_historical_data" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "te_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"tick_in_name" text NOT NULL,
	"tick_in_amount" text NOT NULL,
	"tick_in_usd_amount" text NOT NULL,
	"tick_in_tx_block" text NOT NULL,
	"tick_out_name" text NOT NULL,
	"tick_out_amount" text NOT NULL,
	"tick_out_tx_block" text NOT NULL,
	"transaction_type" text NOT NULL,
	"transaction_status" text NOT NULL,
	"transaction_timestamp" timestamp with time zone NOT NULL,
	"network" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_bit10_meme_rebalance" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"index_value" double precision NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL,
	"new_tokens" json NOT NULL,
	"added" json NOT NULL,
	"removed" json NOT NULL,
	"retained" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist_address" (
	"waitlist_address_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "waitlist_address_waitlist_address_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"address" text NOT NULL,
	CONSTRAINT "waitlist_address_address_key" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_defi" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_collateral_token_prices" (
	"bit10_token_name" text PRIMARY KEY NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "te_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "te_users_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "te_users_user_principal_id_key" UNIQUE("user_principal_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_signups" (
	"newsletter_subscribers_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "te_token_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"token_purchase_amount" text NOT NULL,
	"token_purchase_name" text NOT NULL,
	"token_purchase_usd_amount" text NOT NULL,
	"bit10_token_quantity" text NOT NULL,
	"bit10_token_name" text NOT NULL,
	"token_transaction_status" text NOT NULL,
	"token_bought_at" timestamp with time zone NOT NULL,
	CONSTRAINT "te_token_swap_token_swap_id_key" UNIQUE("token_swap_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_brc20_rebalance" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"index_value" double precision NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL,
	"new_tokens" json NOT NULL,
	"added" json NOT NULL,
	"removed" json NOT NULL,
	"retained" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_brc20_historical_data" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "te_request_btc" (
	"email" varchar(255) NOT NULL,
	"user_principal_id" text NOT NULL,
	"request_id" serial PRIMARY KEY NOT NULL,
	"btc_sent" boolean DEFAULT false,
	CONSTRAINT "te_request_btc_request_id_key" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bit10_brc20" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_payment_address" text NOT NULL,
	"user_ordinals_address" text NOT NULL,
	"user_stacks_address" text NOT NULL,
	"token_purchase_amount" text NOT NULL,
	"token_purchase_name" text NOT NULL,
	"bit10_token_quantity" text NOT NULL,
	"bit10_token_name" text NOT NULL,
	"token_transaction_signature" text NOT NULL,
	"token_bought_at" timestamp with time zone NOT NULL,
	"token_purchase_usd_amount" text NOT NULL,
	CONSTRAINT "token_swap_token_swap_id_key" UNIQUE("token_swap_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mb_principal_id_whitelist" (
	"user_principal_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mb_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mb_users_user_principal_id_key" UNIQUE("user_principal_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mb_token_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"token_purchase_amount" text NOT NULL,
	"token_purchase_name" text NOT NULL,
	"token_purchase_usd_amount" text NOT NULL,
	"bit10_token_quantity" text NOT NULL,
	"bit10_token_name" text NOT NULL,
	"token_transaction_status" text NOT NULL,
	"token_bought_at" timestamp with time zone NOT NULL,
	"transaction_index" text NOT NULL,
	CONSTRAINT "mb_token_swap_transaction_index_key" UNIQUE("transaction_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" text NOT NULL,
	"user_payment_address" text NOT NULL,
	"user_ordinals_address" text NOT NULL,
	"user_stacks_address" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_pkey" PRIMARY KEY("user_id","user_payment_address"),
	CONSTRAINT "users_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "users_user_payment_address_key" UNIQUE("user_payment_address"),
	CONSTRAINT "users_user_ordinals_address_key" UNIQUE("user_ordinals_address"),
	CONSTRAINT "users_user_stacks_address_key" UNIQUE("user_stacks_address")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "swap" ADD CONSTRAINT "swap_user_principal_id_fkey" FOREIGN KEY ("user_principal_id") REFERENCES "public"."mb_users"("user_principal_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "te_swap" ADD CONSTRAINT "te_swap_user_principal_id_fkey" FOREIGN KEY ("user_principal_id") REFERENCES "public"."te_users"("user_principal_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "te_token_swap" ADD CONSTRAINT "te_token_swap_user_principal_id_te_users_user_principal_id_fk" FOREIGN KEY ("user_principal_id") REFERENCES "public"."te_users"("user_principal_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_ordinals_address_users_user_ordinals_address_fk" FOREIGN KEY ("user_ordinals_address") REFERENCES "public"."users"("user_ordinals_address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_payment_address_users_user_payment_address_fk" FOREIGN KEY ("user_payment_address") REFERENCES "public"."users"("user_payment_address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_stacks_address_users_user_stacks_address_fk" FOREIGN KEY ("user_stacks_address") REFERENCES "public"."users"("user_stacks_address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mb_token_swap" ADD CONSTRAINT "mb_token_swap_user_principal_id_mb_users_user_principal_id_fk" FOREIGN KEY ("user_principal_id") REFERENCES "public"."mb_users"("user_principal_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_top_timestmpz_idx" ON "bit10_top" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_top_historical_data_timestmpz_idx" ON "bit10_top_historical_data" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "test_bit10_top_rebalance_timestmpz_idx" ON "test_bit10_top_rebalance" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_meme_timestmpz_idx" ON "bit10_meme" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_meme_historical_data_timestmpz_idx" ON "bit10_meme_historical_data" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "test_bit10_meme_rebalance_timestmpz_idx" ON "test_bit10_meme_rebalance" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_defi_timestmpz_idx" ON "bit10_defi" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_brc20_rebalance_timestmpz_idx" ON "bit10_brc20_rebalance" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_brc20_historical_data_timestmpz_idx" ON "bit10_brc20_historical_data" USING btree ("timestmpz" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bit10_brc20_timestmpz_idx" ON "bit10_brc20" USING btree ("timestmpz" DESC NULLS FIRST);
*/
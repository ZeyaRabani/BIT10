-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."aal_level" AS ENUM('aal1', 'aal2', 'aal3');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."code_challenge_method" AS ENUM('s256', 'plain');--> statement-breakpoint
CREATE TYPE "public"."equality_op" AS ENUM('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');--> statement-breakpoint
CREATE TYPE "public"."factor_status" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "public"."factor_type" AS ENUM('totp', 'webauthn');--> statement-breakpoint
CREATE TYPE "public"."key_status" AS ENUM('default', 'valid', 'invalid', 'expired');--> statement-breakpoint
CREATE TYPE "public"."key_type" AS ENUM('aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20');--> statement-breakpoint
CREATE TYPE "public"."one_time_token_type" AS ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');--> statement-breakpoint
CREATE TABLE "mb_token_mint" (
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
CREATE TABLE "swap" (
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
CREATE TABLE "te_swap" (
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
CREATE TABLE "waitlist_address" (
	"waitlist_address_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "waitlist_address_waitlist_address_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"address" text NOT NULL,
	CONSTRAINT "waitlist_address_address_key" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "te_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "te_users_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "te_users_user_principal_id_key" UNIQUE("user_principal_id")
);
--> statement-breakpoint
CREATE TABLE "user_signups" (
	"newsletter_subscribers_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "te_token_swap" (
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
CREATE TABLE "te_request_btc" (
	"email" varchar(255) NOT NULL,
	"user_principal_id" text NOT NULL,
	"request_id" serial PRIMARY KEY NOT NULL,
	"btc_sent" boolean DEFAULT false,
	CONSTRAINT "te_request_btc_request_id_key" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "bit10_meme_historical_data" (
	"timestmpz" timestamp with time zone NOT NULL,
	"tokenprice" double precision NOT NULL,
	"data" json NOT NULL,
	CONSTRAINT "bit10_meme_historical_data_timestmpz_key" UNIQUE("timestmpz")
);
--> statement-breakpoint
CREATE TABLE "token_swap" (
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
CREATE TABLE "mb_principal_id_whitelist" (
	"user_principal_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mb_users_user_principal_id_key" UNIQUE("user_principal_id")
);
--> statement-breakpoint
CREATE TABLE "mb_token_swap" (
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
CREATE TABLE "users" (
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
ALTER TABLE "swap" ADD CONSTRAINT "swap_user_principal_id_fkey" FOREIGN KEY ("user_principal_id") REFERENCES "public"."mb_users"("user_principal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "te_swap" ADD CONSTRAINT "te_swap_user_principal_id_fkey" FOREIGN KEY ("user_principal_id") REFERENCES "public"."te_users"("user_principal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "te_token_swap" ADD CONSTRAINT "te_token_swap_user_principal_id_te_users_user_principal_id_fk" FOREIGN KEY ("user_principal_id") REFERENCES "public"."te_users"("user_principal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_ordinals_address_users_user_ordinals_address_fk" FOREIGN KEY ("user_ordinals_address") REFERENCES "public"."users"("user_ordinals_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_payment_address_users_user_payment_address_fk" FOREIGN KEY ("user_payment_address") REFERENCES "public"."users"("user_payment_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_stacks_address_users_user_stacks_address_fk" FOREIGN KEY ("user_stacks_address") REFERENCES "public"."users"("user_stacks_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb_token_swap" ADD CONSTRAINT "mb_token_swap_user_principal_id_mb_users_user_principal_id_fk" FOREIGN KEY ("user_principal_id") REFERENCES "public"."mb_users"("user_principal_id") ON DELETE no action ON UPDATE no action;
*/
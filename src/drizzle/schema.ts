import { pgTable, pgEnum, text, timestamp, unique, bigint, serial, varchar, boolean, primaryKey } from 'drizzle-orm/pg-core'

export const aal_level = pgEnum('aal_level', ['aal1', 'aal2', 'aal3'])
export const code_challenge_method = pgEnum('code_challenge_method', ['s256', 'plain'])
export const factor_status = pgEnum('factor_status', ['unverified', 'verified'])
export const factor_type = pgEnum('factor_type', ['totp', 'webauthn', 'phone'])
export const one_time_token_type = pgEnum('one_time_token_type', ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const key_status = pgEnum('key_status', ['default', 'valid', 'invalid', 'expired'])
export const key_type = pgEnum('key_type', ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const action = pgEnum('action', ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const equality_op = pgEnum('equality_op', ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])

export const mb_token_mint = pgTable('mb_token_mint', {
	token_mint_id: text('token_mint_id').primaryKey().notNull(),
	user_principal_id: text('user_principal_id').notNull(),
	minting_amount: text('minting_amount').notNull(),
	minting_token_name: text('minting_token_name').notNull(),
	minting_usd_amount: text('minting_usd_amount').notNull(),
	recieving_token_amount: text('recieving_token_amount').notNull(),
	recieving_token_name: text('recieving_token_name').notNull(),
	minting_status: text('minting_status').notNull(),
	token_mint_at: timestamp('token_mint_at', { withTimezone: true, mode: 'string' }).notNull(),
	transaction_index: text('transaction_index').notNull(),
});

export const swap = pgTable('swap', {
	token_swap_id: text('token_swap_id').primaryKey().notNull(),
	user_principal_id: text('user_principal_id').notNull().references(() => mb_users.user_principal_id),
	tick_in_name: text('tick_in_name').notNull(),
	tick_in_amount: text('tick_in_amount').notNull(),
	tick_in_usd_amount: text('tick_in_usd_amount').notNull(),
	tick_in_tx_block: text('tick_in_tx_block').notNull(),
	tick_out_name: text('tick_out_name').notNull(),
	tick_out_amount: text('tick_out_amount').notNull(),
	tick_out_tx_block: text('tick_out_tx_block').notNull(),
	transaction_type: text('transaction_type').notNull(),
	transaction_status: text('transaction_status').notNull(),
	transaction_timestamp: timestamp('transaction_timestamp', { withTimezone: true, mode: 'string' }).notNull(),
	network: text('network').notNull(),
});

export const te_swap = pgTable('te_swap', {
	token_swap_id: text('token_swap_id').primaryKey().notNull(),
	user_principal_id: text('user_principal_id').notNull().references(() => te_users.user_principal_id),
	tick_in_name: text('tick_in_name').notNull(),
	tick_in_amount: text('tick_in_amount').notNull(),
	tick_in_usd_amount: text('tick_in_usd_amount').notNull(),
	tick_in_tx_block: text('tick_in_tx_block').notNull(),
	tick_out_name: text('tick_out_name').notNull(),
	tick_out_amount: text('tick_out_amount').notNull(),
	tick_out_tx_block: text('tick_out_tx_block').notNull(),
	transaction_type: text('transaction_type').notNull(),
	transaction_status: text('transaction_status').notNull(),
	transaction_timestamp: timestamp('transaction_timestamp', { withTimezone: true, mode: 'string' }).notNull(),
	network: text('network').notNull(),
});

export const waitlist_address = pgTable('waitlist_address', {
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	waitlist_address_id: bigint('waitlist_address_id', { mode: 'number' }).primaryKey().notNull(),
	address: text('address').notNull(),
},
	(table) => {
		return {
			waitlist_address_address_key: unique('waitlist_address_address_key').on(table.address),
		}
	});

export const te_users = pgTable('te_users', {
	user_id: text('user_id').primaryKey().notNull(),
	user_principal_id: text('user_principal_id').notNull(),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			te_users_user_id_key: unique('te_users_user_id_key').on(table.user_id),
			te_users_user_principal_id_key: unique('te_users_user_principal_id_key').on(table.user_principal_id),
		}
	});

export const user_signups = pgTable('user_signups', {
	newsletter_subscribers_id: serial('newsletter_subscribers_id').primaryKey().notNull(),
	email: varchar('email', { length: 255 }).notNull(),
},
	(table) => {
		return {
			newsletter_subscribers_email_key: unique('newsletter_subscribers_email_key').on(table.email),
		}
	});

export const te_token_swap = pgTable('te_token_swap', {
	token_swap_id: text('token_swap_id').primaryKey().notNull(),
	user_principal_id: text('user_principal_id').notNull().references(() => te_users.user_principal_id),
	token_purchase_amount: text('token_purchase_amount').notNull(),
	token_purchase_name: text('token_purchase_name').notNull(),
	token_purchase_usd_amount: text('token_purchase_usd_amount').notNull(),
	bit10_token_quantity: text('bit10_token_quantity').notNull(),
	bit10_token_name: text('bit10_token_name').notNull(),
	token_transaction_status: text('token_transaction_status').notNull(),
	token_bought_at: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			te_token_swap_token_swap_id_key: unique('te_token_swap_token_swap_id_key').on(table.token_swap_id),
		}
	});

export const te_request_btc = pgTable('te_request_btc', {
	email: varchar('email', { length: 255 }).notNull(),
	user_principal_id: text('user_principal_id').notNull(),
	request_id: serial('request_id').primaryKey().notNull(),
	btc_sent: boolean('btc_sent').default(false),
},
	(table) => {
		return {
			te_request_btc_request_id_key: unique('te_request_btc_request_id_key').on(table.request_id),
		}
	});

export const token_swap = pgTable('token_swap', {
	token_swap_id: text('token_swap_id').primaryKey().notNull(),
	user_payment_address: text('user_payment_address').notNull().references(() => users.user_payment_address),
	user_ordinals_address: text('user_ordinals_address').notNull().references(() => users.user_ordinals_address),
	user_stacks_address: text('user_stacks_address').notNull().references(() => users.user_stacks_address),
	token_purchase_amount: text('token_purchase_amount').notNull(),
	token_purchase_name: text('token_purchase_name').notNull(),
	bit10_token_quantity: text('bit10_token_quantity').notNull(),
	bit10_token_name: text('bit10_token_name').notNull(),
	token_transaction_signature: text('token_transaction_signature').notNull(),
	token_bought_at: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
	token_purchase_usd_amount: text('token_purchase_usd_amount').notNull(),
},
	(table) => {
		return {
			token_swap_token_swap_id_key: unique('token_swap_token_swap_id_key').on(table.token_swap_id),
		}
	});

export const mb_principal_id_whitelist = pgTable('mb_principal_id_whitelist', {
	user_principal_id: text('user_principal_id').primaryKey().notNull(),
});

export const mb_users = pgTable('mb_users', {
	user_id: text('user_id').primaryKey().notNull(),
	user_principal_id: text('user_principal_id').notNull(),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			mb_users_user_principal_id_key: unique('mb_users_user_principal_id_key').on(table.user_principal_id),
		}
	});

export const mb_token_swap = pgTable('mb_token_swap', {
	token_swap_id: text('token_swap_id').primaryKey().notNull(),
	user_principal_id: text('user_principal_id').notNull().references(() => mb_users.user_principal_id),
	token_purchase_amount: text('token_purchase_amount').notNull(),
	token_purchase_name: text('token_purchase_name').notNull(),
	token_purchase_usd_amount: text('token_purchase_usd_amount').notNull(),
	bit10_token_quantity: text('bit10_token_quantity').notNull(),
	bit10_token_name: text('bit10_token_name').notNull(),
	token_transaction_status: text('token_transaction_status').notNull(),
	token_bought_at: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
	transaction_index: text('transaction_index').notNull(),
},
	(table) => {
		return {
			mb_token_swap_transaction_index_key: unique('mb_token_swap_transaction_index_key').on(table.transaction_index),
		}
	});

export const users = pgTable('users', {
	user_id: text('user_id').notNull(),
	user_payment_address: text('user_payment_address').notNull(),
	user_ordinals_address: text('user_ordinals_address').notNull(),
	user_stacks_address: text('user_stacks_address').notNull(),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			users_pkey: primaryKey({ columns: [table.user_id, table.user_payment_address], name: 'users_pkey' }),
			users_user_id_key: unique('users_user_id_key').on(table.user_id),
			users_user_payment_address_key: unique('users_user_payment_address_key').on(table.user_payment_address),
			users_user_ordinals_address_key: unique('users_user_ordinals_address_key').on(table.user_ordinals_address),
			users_user_stacks_address_key: unique('users_user_stacks_address_key').on(table.user_stacks_address),
		}
	});

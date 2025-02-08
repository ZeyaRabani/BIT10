import { pgTable, text, timestamp, foreignKey, unique, bigint, serial, varchar, boolean, primaryKey, pgEnum } from 'drizzle-orm/pg-core'

export const aalLevel = pgEnum('aal_level', ['aal1', 'aal2', 'aal3'])
export const action = pgEnum('action', ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const codeChallengeMethod = pgEnum('code_challenge_method', ['s256', 'plain'])
export const equalityOp = pgEnum('equality_op', ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])
export const factorStatus = pgEnum('factor_status', ['unverified', 'verified'])
export const factorType = pgEnum('factor_type', ['totp', 'webauthn'])
export const keyStatus = pgEnum('key_status', ['default', 'valid', 'invalid', 'expired'])
export const keyType = pgEnum('key_type', ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const oneTimeTokenType = pgEnum('one_time_token_type', ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])

export const mbTokenMint = pgTable('mb_token_mint', {
	tokenMintId: text('token_mint_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	mintingAmount: text('minting_amount').notNull(),
	mintingTokenName: text('minting_token_name').notNull(),
	mintingUsdAmount: text('minting_usd_amount').notNull(),
	recievingTokenAmount: text('recieving_token_amount').notNull(),
	recievingTokenName: text('recieving_token_name').notNull(),
	mintingStatus: text('minting_status').notNull(),
	tokenMintAt: timestamp('token_mint_at', { withTimezone: true, mode: 'string' }).notNull(),
	transactionIndex: text('transaction_index').notNull(),
});

export const swap = pgTable('swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tickInName: text('tick_in_name').notNull(),
	tickInAmount: text('tick_in_amount').notNull(),
	tickInUsdAmount: text('tick_in_usd_amount').notNull(),
	tickInTxBlock: text('tick_in_tx_block').notNull(),
	tickOutName: text('tick_out_name').notNull(),
	tickOutAmount: text('tick_out_amount').notNull(),
	tickOutTxBlock: text('tick_out_tx_block').notNull(),
	transactionType: text('transaction_type').notNull(),
	transactionStatus: text('transaction_status').notNull(),
	transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true, mode: 'string' }).notNull(),
	network: text('network').notNull(),
},
	(table) => {
		return {
			swapUserPrincipalIdFkey: foreignKey({
				columns: [table.userPrincipalId],
				foreignColumns: [mbUsers.userPrincipalId],
				name: 'swap_user_principal_id_fkey'
			}),
		}
	});

export const teSwap = pgTable('te_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tickInName: text('tick_in_name').notNull(),
	tickInAmount: text('tick_in_amount').notNull(),
	tickInUsdAmount: text('tick_in_usd_amount').notNull(),
	tickInTxBlock: text('tick_in_tx_block').notNull(),
	tickOutName: text('tick_out_name').notNull(),
	tickOutAmount: text('tick_out_amount').notNull(),
	tickOutTxBlock: text('tick_out_tx_block').notNull(),
	transactionType: text('transaction_type').notNull(),
	transactionStatus: text('transaction_status').notNull(),
	transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true, mode: 'string' }).notNull(),
	network: text('network').notNull(),
},
	(table) => {
		return {
			teSwapUserPrincipalIdFkey: foreignKey({
				columns: [table.userPrincipalId],
				foreignColumns: [teUsers.userPrincipalId],
				name: 'te_swap_user_principal_id_fkey'
			}),
		}
	});

export const waitlistAddress = pgTable('waitlist_address', {
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	waitlistAddressId: bigint('waitlist_address_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({ name: 'waitlist_address_waitlist_address_id_seq', startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	address: text('address').notNull(),
},
	(table) => {
		return {
			waitlistAddressAddressKey: unique('waitlist_address_address_key').on(table.address),
		}
	});

export const teUsers = pgTable('te_users', {
	userId: text('user_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			teUsersUserIdKey: unique('te_users_user_id_key').on(table.userId),
			teUsersUserPrincipalIdKey: unique('te_users_user_principal_id_key').on(table.userPrincipalId),
		}
	});

export const userSignups = pgTable('user_signups', {
	newsletterSubscribersId: serial('newsletter_subscribers_id').primaryKey().notNull(),
	email: varchar('email', { length: 255 }).notNull(),
},
	(table) => {
		return {
			newsletterSubscribersEmailKey: unique('newsletter_subscribers_email_key').on(table.email),
		}
	});

export const teTokenSwap = pgTable('te_token_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tokenPurchaseAmount: text('token_purchase_amount').notNull(),
	tokenPurchaseName: text('token_purchase_name').notNull(),
	tokenPurchaseUsdAmount: text('token_purchase_usd_amount').notNull(),
	bit10TokenQuantity: text('bit10_token_quantity').notNull(),
	bit10TokenName: text('bit10_token_name').notNull(),
	tokenTransactionStatus: text('token_transaction_status').notNull(),
	tokenBoughtAt: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			teTokenSwapUserPrincipalIdTeUsersUserPrincipalIdFk: foreignKey({
				columns: [table.userPrincipalId],
				foreignColumns: [teUsers.userPrincipalId],
				name: 'te_token_swap_user_principal_id_te_users_user_principal_id_fk'
			}),
			teTokenSwapTokenSwapIdKey: unique('te_token_swap_token_swap_id_key').on(table.tokenSwapId),
		}
	});

export const teRequestBtc = pgTable('te_request_btc', {
	email: varchar('email', { length: 255 }).notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	requestId: serial('request_id').primaryKey().notNull(),
	btcSent: boolean('btc_sent').default(false),
},
	(table) => {
		return {
			teRequestBtcRequestIdKey: unique('te_request_btc_request_id_key').on(table.requestId),
		}
	});

export const tokenSwap = pgTable('token_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPaymentAddress: text('user_payment_address').notNull(),
	userOrdinalsAddress: text('user_ordinals_address').notNull(),
	userStacksAddress: text('user_stacks_address').notNull(),
	tokenPurchaseAmount: text('token_purchase_amount').notNull(),
	tokenPurchaseName: text('token_purchase_name').notNull(),
	bit10TokenQuantity: text('bit10_token_quantity').notNull(),
	bit10TokenName: text('bit10_token_name').notNull(),
	tokenTransactionSignature: text('token_transaction_signature').notNull(),
	tokenBoughtAt: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
	tokenPurchaseUsdAmount: text('token_purchase_usd_amount').notNull(),
},
	(table) => {
		return {
			tokenSwapUserOrdinalsAddressUsersUserOrdinalsAddressFk: foreignKey({
				columns: [table.userOrdinalsAddress],
				foreignColumns: [users.userOrdinalsAddress],
				name: 'token_swap_user_ordinals_address_users_user_ordinals_address_fk'
			}),
			tokenSwapUserPaymentAddressUsersUserPaymentAddressFk: foreignKey({
				columns: [table.userPaymentAddress],
				foreignColumns: [users.userPaymentAddress],
				name: 'token_swap_user_payment_address_users_user_payment_address_fk'
			}),
			tokenSwapUserStacksAddressUsersUserStacksAddressFk: foreignKey({
				columns: [table.userStacksAddress],
				foreignColumns: [users.userStacksAddress],
				name: 'token_swap_user_stacks_address_users_user_stacks_address_fk'
			}),
			tokenSwapTokenSwapIdKey: unique('token_swap_token_swap_id_key').on(table.tokenSwapId),
		}
	});

export const mbPrincipalIdWhitelist = pgTable('mb_principal_id_whitelist', {
	userPrincipalId: text('user_principal_id').primaryKey().notNull(),
});

export const mbUsers = pgTable('mb_users', {
	userId: text('user_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			mbUsersUserPrincipalIdKey: unique('mb_users_user_principal_id_key').on(table.userPrincipalId),
		}
	});

export const mbTokenSwap = pgTable('mb_token_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tokenPurchaseAmount: text('token_purchase_amount').notNull(),
	tokenPurchaseName: text('token_purchase_name').notNull(),
	tokenPurchaseUsdAmount: text('token_purchase_usd_amount').notNull(),
	bit10TokenQuantity: text('bit10_token_quantity').notNull(),
	bit10TokenName: text('bit10_token_name').notNull(),
	tokenTransactionStatus: text('token_transaction_status').notNull(),
	tokenBoughtAt: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
	transactionIndex: text('transaction_index').notNull(),
},
	(table) => {
		return {
			mbTokenSwapUserPrincipalIdMbUsersUserPrincipalIdFk: foreignKey({
				columns: [table.userPrincipalId],
				foreignColumns: [mbUsers.userPrincipalId],
				name: 'mb_token_swap_user_principal_id_mb_users_user_principal_id_fk'
			}),
			mbTokenSwapTransactionIndexKey: unique('mb_token_swap_transaction_index_key').on(table.transactionIndex),
		}
	});

export const users = pgTable('users', {
	userId: text('user_id').notNull(),
	userPaymentAddress: text('user_payment_address').notNull(),
	userOrdinalsAddress: text('user_ordinals_address').notNull(),
	userStacksAddress: text('user_stacks_address').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
},
	(table) => {
		return {
			usersPkey: primaryKey({ columns: [table.userId, table.userPaymentAddress], name: 'users_pkey' }),
			usersUserIdKey: unique('users_user_id_key').on(table.userId),
			usersUserPaymentAddressKey: unique('users_user_payment_address_key').on(table.userPaymentAddress),
			usersUserOrdinalsAddressKey: unique('users_user_ordinals_address_key').on(table.userOrdinalsAddress),
			usersUserStacksAddressKey: unique('users_user_stacks_address_key').on(table.userStacksAddress),
		}
	});
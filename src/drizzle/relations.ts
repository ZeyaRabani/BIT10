import { relations } from 'drizzle-orm/relations'
import { te_users, te_token_swap, users, token_swap } from './schema'

export const te_token_swapRelations = relations(te_token_swap, ({ one }) => ({
	te_user: one(te_users, {
		fields: [te_token_swap.user_principal_id],
		references: [te_users.user_principal_id]
	}),
}));

export const te_usersRelations = relations(te_users, ({ many }) => ({
	te_token_swaps: many(te_token_swap),
}));

export const token_swapRelations = relations(token_swap, ({ one }) => ({
	user_user_ordinals_address: one(users, {
		fields: [token_swap.user_ordinals_address],
		references: [users.user_ordinals_address],
		relationName: 'token_swap_user_ordinals_address_users_user_ordinals_address'
	}),
	user_user_payment_address: one(users, {
		fields: [token_swap.user_payment_address],
		references: [users.user_payment_address],
		relationName: 'token_swap_user_payment_address_users_user_payment_address'
	}),
	user_user_stacks_address: one(users, {
		fields: [token_swap.user_stacks_address],
		references: [users.user_stacks_address],
		relationName: 'token_swap_user_stacks_address_users_user_stacks_address'
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	token_swaps_user_ordinals_address: many(token_swap, {
		relationName: 'token_swap_user_ordinals_address_users_user_ordinals_address'
	}),
	token_swaps_user_payment_address: many(token_swap, {
		relationName: 'token_swap_user_payment_address_users_user_payment_address'
	}),
	token_swaps_user_stacks_address: many(token_swap, {
		relationName: 'token_swap_user_stacks_address_users_user_stacks_address'
	}),
}));

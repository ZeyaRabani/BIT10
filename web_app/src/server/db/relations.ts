import { relations } from 'drizzle-orm/relations'
import { mbUsers, swap, teUsers, teSwap, teTokenSwap, users, tokenSwap, mbTokenSwap } from './schema'

export const swapRelations = relations(swap, ({ one }) => ({
	mbUser: one(mbUsers, {
		fields: [swap.userPrincipalId],
		references: [mbUsers.userPrincipalId]
	}),
}));

export const mbUsersRelations = relations(mbUsers, ({ many }) => ({
	swaps: many(swap),
	mbTokenSwaps: many(mbTokenSwap),
}));

export const teSwapRelations = relations(teSwap, ({ one }) => ({
	teUser: one(teUsers, {
		fields: [teSwap.userPrincipalId],
		references: [teUsers.userPrincipalId]
	}),
}));

export const teUsersRelations = relations(teUsers, ({ many }) => ({
	teSwaps: many(teSwap),
	teTokenSwaps: many(teTokenSwap),
}));

export const teTokenSwapRelations = relations(teTokenSwap, ({ one }) => ({
	teUser: one(teUsers, {
		fields: [teTokenSwap.userPrincipalId],
		references: [teUsers.userPrincipalId]
	}),
}));

export const tokenSwapRelations = relations(tokenSwap, ({ one }) => ({
	user_userOrdinalsAddress: one(users, {
		fields: [tokenSwap.userOrdinalsAddress],
		references: [users.userOrdinalsAddress],
		relationName: 'tokenSwap_userOrdinalsAddress_users_userOrdinalsAddress'
	}),
	user_userPaymentAddress: one(users, {
		fields: [tokenSwap.userPaymentAddress],
		references: [users.userPaymentAddress],
		relationName: 'tokenSwap_userPaymentAddress_users_userPaymentAddress'
	}),
	user_userStacksAddress: one(users, {
		fields: [tokenSwap.userStacksAddress],
		references: [users.userStacksAddress],
		relationName: 'tokenSwap_userStacksAddress_users_userStacksAddress'
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	tokenSwaps_userOrdinalsAddress: many(tokenSwap, {
		relationName: 'tokenSwap_userOrdinalsAddress_users_userOrdinalsAddress'
	}),
	tokenSwaps_userPaymentAddress: many(tokenSwap, {
		relationName: 'tokenSwap_userPaymentAddress_users_userPaymentAddress'
	}),
	tokenSwaps_userStacksAddress: many(tokenSwap, {
		relationName: 'tokenSwap_userStacksAddress_users_userStacksAddress'
	}),
}));

export const mbTokenSwapRelations = relations(mbTokenSwap, ({ one }) => ({
	mbUser: one(mbUsers, {
		fields: [mbTokenSwap.userPrincipalId],
		references: [mbUsers.userPrincipalId]
	}),
}));

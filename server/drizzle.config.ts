import { type Config } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

export default {
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    }
} satisfies Config;

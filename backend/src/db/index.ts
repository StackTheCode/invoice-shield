import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg';
import * as schema from './schema';
import 'dotenv/config'


const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.on('connect', () => {
    console.log(' Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error(' Database connection error:', err);
});
export const db = drizzle(pool, { schema });

export * from './schema';

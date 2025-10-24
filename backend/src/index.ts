import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db'; 
import { sql } from 'drizzle-orm';
dotenv.config();


const app = express();

const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.get('/api/health', (req, res) => {
  res.json(
    {
      status: 'ok',
      message: 'InvoiceShield API is running!',
      timestamp: new Date().toISOString()
    }
  )
})

app.get('/api/invoices', (req, res) => {
  res.json({ message: 'Invoices endpoint - coming soon!' });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    // Simple query to test connection
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    res.json({
      success: true,
      message: 'Database connected!',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`  Backend API running on http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`  DB Test: http://localhost:${PORT}/api/db-test`);
});
export  default app;

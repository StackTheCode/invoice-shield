import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { sql } from 'drizzle-orm';
import invoiceRoutes from './routes/invoice.routes'
import vendorRoutes from './routes/vendor.routes'
dotenv.config();


const app = express();

const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: [
   'http://localhost:3000',  
    process.env.FRONTEND_URL || 'https://invoiceshieldprot.vercel.app',
  ],
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

console.log(' Mounting /api/invoices router...');

app.use('/api/invoices', invoiceRoutes)
app.use('/api/vendors', vendorRoutes)

app.listen(PORT, () => {
  console.log(`  Backend API running on http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`  DB Test: http://localhost:${PORT}/api/db-test`);
});
export default app;

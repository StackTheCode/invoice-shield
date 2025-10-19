import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';

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

app.listen(PORT, () => {
  console.log(` Backend API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
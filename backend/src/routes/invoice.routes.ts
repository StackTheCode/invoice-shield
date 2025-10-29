import express from 'express'
import { upload } from '../services/upload.service';
import { db, invoices,companies } from '../db';
import path from 'path';
import { eq } from 'drizzle-orm';

const router = express.Router()

router.post('/upload', upload.single('invoice'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            })
        }
        // TODO: For now, we'll use a dummy company_id
        // Later we'll add authentication
      const testCompanyId = '00000000-0000-0000-0000-000000000000';
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, testCompanyId));

    if (!existingCompany) {
      // Create test company on the fly
      await db.insert(companies).values({
        id: testCompanyId,
        name: 'Test Company',
        email: 'test@invoiceshield.com',
        apiKey: 'test-api-key-12345',
        tier: 'free',
        monthlyQuota: 50,
      });
      console.log('✅ Created test company');
    }

    // Save invoice record to database
    const [newInvoice] = await db.insert(invoices).values({
      companyId: testCompanyId,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      status: 'pending',
    }).returning();

    res.json({
      success: true,
      message: 'Invoice uploaded successfully',
      data: {
        id: newInvoice.id,
        filename: req.file.filename,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });

    } catch (error) {
        console.error("Upload error: ", error)
        res.status(500).json({
            success: false,
            message: 'Failed to upload invoice',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }

});

router.get('/', async (req, res) => {
    try {
        const allInvoices = await db.select().from(invoices);

        res.json({
            success: true,
            data: allInvoices,
        });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoices',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});


router.get('/:id', async (req, res) => {

    try {
        const { id } = req.params;
        const [invoice] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, id));

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }
        res.json({
            success: true,
            data: invoice,
        });
    }
    catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
})
export default router;




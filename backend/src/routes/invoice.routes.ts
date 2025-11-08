import express from 'express'
import { upload } from '../services/upload.service';
import { db, invoices, companies } from '../db';
import { eq } from 'drizzle-orm';
import { OCRService } from '../services/ocr.service';
import { ParserService } from '../services/parser.service';
import { FraudDetectionService } from '../services/fraud.service';

const router = express.Router()
const ocrService = new OCRService();
const parserService = new ParserService();
const fraudService = new FraudDetectionService();


/**
 * Function to upload files
 */
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



router.post('/:id/analyze', async (req, res) => {
    try {
        const { id } = req.params;
        const startTime = Date.now();

        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice is not found"
            })

        }
        console.log("Extracting data from invoice:")

        const { rawText, confidence } = await ocrService.extractText(
            invoice.filePath,
            invoice.fileType!,
        )

        console.log("Parsing data")
        const parsedData = parserService.parse(rawText)
        // Update invoice with extracted data


        await db
            .update(invoices)
            .set({
                vendorName: parsedData.vendorName,
                vendorVat: parsedData.vatNumber,
                vendorIban: parsedData.iban,
                vendorEmail: parsedData.email,
                invoiceNumber: parsedData.invoiceNumber,
                totalAmount: parsedData.totalAmount?.toString(),
                currency: parsedData.currency,
                invoiceDate: parsedData.invoiceDate,
                dueDate: parsedData.dueDate,
                ocrConfidence: confidence?.toString(),
            })
            .where(eq(invoices.id, id));


        console.log("Running fraud detection...")

        const fraudAnalysis = await fraudService.analyzeInvoice(id)



        const processingTime = Date.now() - startTime;
        const [updatedInvoice] = await db
            .update(invoices)
            .set({
                riskScore: fraudAnalysis.riskScore,
                status: fraudAnalysis.status,
                fraudIndicators: fraudAnalysis.indicators as any,
                processingTimeMs: processingTime,
                analyzedAt: new Date(),
            })
            .where(eq(invoices.id, id))
            .returning()

        res.json({
            
                success: true,
                message: "invoice analyzed successfuly",
                data: {
                    invoice: updatedInvoice,
                    fraudAnalysis: {
                        riskScore: fraudAnalysis.riskScore,
                        status: fraudAnalysis.status,
                        indicators: fraudAnalysis.indicators
                    },
                    parsedData,
                    rawText: rawText.substring(0, 500), //Get 500 characters for debbugging ease
                    processingTime: `${processingTime}ms`
                }
            }
        )

    } catch (error) {
        console.error("Analysis error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to analyze invoice",
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
})


export default router;




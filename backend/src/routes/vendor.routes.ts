import express from "express";
import { db, vendors } from "../db";
import { eq } from "drizzle-orm";

const router = express.Router();


router.post("/", async (req, res) => {
    try {
        const { name, vatNumber, iban, email, phone, address } = req.body;

        //     // TODO: Get from authentication later

        const testCompanyId = '00000000-0000-0000-0000-000000000000';


        if (!name) {
            return res.status(400).json({
                success: true,
                message: "Vendor name is required"
            })

        }
           const [newVendor] = await db.insert(vendors).values({
                companyId: testCompanyId,
                name,
                vatNumber: vatNumber?.toUpperCase(),
                iban: iban?.replace(/\s/g, '').toUpperCase(),
                email,
                phone,
                address,
                isVerified: true,
                verificationDate: new Date()
            }).returning()

            res.json({
                success: true,
                message: "Vendor added successfully",
                data: newVendor
            }) 
    } catch (error) {
        console.error("Add vendor error: ", error);
        res.status(500).json({
            success: false,
            message: "Failed to add vendor",
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})


router.get('/', async (req, res) => {
    try {
        const testCompanyId = '00000000-0000-0000-0000-000000000000';

        const allVendors = await db
            .select()
            .from(vendors)
            .where(eq(vendors.companyId, testCompanyId))
        res.json({
            success: true,
            data: allVendors
        })
    } catch (error) {
        console.error("Fetch vendors error:", error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendors',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [vendor] = await db
            .select()
            .from(vendors)
            .where(eq(vendors.id, id));

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found',
            });
        }

        res.json({
            success: true,
            data: vendor,
        });

    } catch (error) {
        console.error('Fetch vendor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }


});


router.delete('/:id', async (req, res) => {
try{
    const { id } = req.params;

    const [deleteVendor] = await db
        .delete(vendors)
        .where(eq(vendors.id, id))
        .returning()


    if(!deleteVendor){
        return res.status(404).json({
            success:false,
            message:"Vendor not found"
        })
    
    }
        res.json({
            success:true,
            message:"Vendor deleted successfully"
        })
}
catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
})

export default router;

import express from "express";
import { db, vendors } from "../db";
import { eq,and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.middleware";
const router = express.Router();


router.post("/",requireAuth ,async (req, res) => {
    try {
        const { name, vatNumber, iban, email, phone, address } = req.body;

        

        const companyId = req.user!.companyId;


        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Vendor name is required"
            })

        }
           const [newVendor] = await db.insert(vendors).values({
                companyId: companyId,
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


router.get('/',requireAuth, async (req, res) => {
    try {
        const companyId = req.user!.companyId;

        const allVendors = await db
            .select()
            .from(vendors)
            .where(eq(vendors.companyId, companyId))
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

router.get('/:id',requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const companyId = req.user!.companyId;

        const [vendor] = await db
            .select()
            .from(vendors)
            .where(and(
                eq(vendors.id, id),
              eq(vendors.companyId,companyId)
            ));

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
    const companyId = req.user!.companyId;

    const [deleteVendor] = await db
        .delete(vendors)
        .where(
        and  (  eq(vendors.id, id),
        eq(vendors.companyId,companyId)
    )
        )
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

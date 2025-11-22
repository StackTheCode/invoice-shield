import express from 'express';
import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();
const authService = new AuthService();



router.post('/register', async (req, res) => {
    try {
        const { email, password, name, companyName } = req.body;

        if (!name || !password) {
            return res.status(400).json({
                success: false,
                error: " Email and password are required"
            })
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters',
            });
        }
        const result = await authService.register({ email, password, name, companyName });
        if (!result.success) {
            return res.status(400).json(result)
        }
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Registration failed',
        });
    }
})



router.post('/login', async (req,res) =>{
    try {
        const {email,password} = req.body;
    
         if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const result = await authService.login({email,password});

     if(!result){
        return res.status(401).json(result);
     }
     res.json(result)

    } catch (error) {
        return res.status(500).json({
            success:false,
            error:'Login Failed'
        })
    }
})


router.get('/me', requireAuth, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
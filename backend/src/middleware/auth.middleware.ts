import { error } from "console";
import { AuthService } from "../services/auth.service";
import { Request,Response,NextFunction } from "express";
const authService = new AuthService()

declare global {
    namespace Express{
        interface Request{
            user?:{
                userId:string;
                email:string;
                companyId:string
            }
        }
    }
}


export function requireAuth(req:Request,res:Response,next:NextFunction){
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            error:"No token provided"
        })
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token)

    if(!decoded){
          return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
    }
     req.user = decoded;
    next();
}


export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}



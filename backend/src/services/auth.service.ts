import { companies, db, users } from "../db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs'
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '7d';
interface RegisterInput {
    email: string;
    password: string;
    name?: string;
    companyName?: string;
}

interface LoginInput {
    email: string;
    password: string;
}

interface AuthResult {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        email: string;
        name: string | null;
        companyId: string | null;
    };
    error?: string;
}

export class AuthService {

    async register(input: RegisterInput): Promise<AuthResult> {
        try {
            const { email, password, name, companyName } = input;
            const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, email.toLowerCase()))
            if (existingUser) {
                return { success: false, error: "Email already registered" }
            }
            const hashedPassword = await bcrypt.hash(password, 12)


            //    Create new company for user
            const [newCompany] = await db.insert(companies).values({
                name: companyName || `${name || email}'s Company`,
                email: email.toLowerCase(),
                apiKey: `ak_${crypto.randomUUID().replace(/-/g, '')}`,
                tier: 'free',
                monthlyQuota: 50
            }).returning()

            const [newUser] = await db.insert(users).values({
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                companyId: newCompany.id,
                role: 'user'
            }).returning()

            const token = this.generateToken(newUser.id, newUser.email, newCompany.id);


            return {
                success: true,
                token,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    companyId: newUser.companyId,
                },
            };

        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed' };
        }
    }


    async login(input: LoginInput): Promise<AuthResult> {
        try {
            const { email, password } = input;
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email.toLowerCase()),);

            if (!user) {
                return { success: false, error: "Invalid email or password" }


            }

            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return { success: false, error: 'Invalid email or password' };
            }


            // Update last login
            await db
                .update(users)
                .set({ lastLogin: new Date() })
                .where(eq(users.id, user.id))


            const token = this.generateToken(user.id, user.email, user.companyId);

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    companyId: user.companyId,
                },
            };


        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed' };
        }
    }

    verifyToken(token: string): { userId: string; email: string; companyId: string } | null {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            return {
                userId: decoded.userId,
                email: decoded.email,
                companyId: decoded.companyId,
            }
        } catch {
            return null;

        }
    }



    private generateToken(userId: string, email: string, companyId: string | null): string {
        return jwt.sign(
            { userId, email, companyId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        )
    }
}
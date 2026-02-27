import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const generateToken: (user: {
    id: string;
    email: string;
    name: string;
}) => string;
//# sourceMappingURL=auth.d.ts.map
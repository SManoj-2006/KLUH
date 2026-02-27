import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
export const generateToken = (user) => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};
//# sourceMappingURL=auth.js.map
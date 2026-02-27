import { supabase } from '../lib/supabase.js';
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }
    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        const user = data.user;
        const fullName = (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
            (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
            user.email ||
            'User';
        req.user = {
            id: user.id,
            email: user.email || '',
            name: fullName,
        };
        req.accessToken = token;
        next();
    }
    catch {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
//# sourceMappingURL=auth.js.map
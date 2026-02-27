import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createAuthedSupabaseClient, supabase } from '../lib/supabase.js';
const router = Router();
// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    name,
                },
            },
        });
        if (signUpError) {
            return res.status(400).json({
                success: false,
                message: signUpError.message,
            });
        }
        let session = signUpData.session;
        let user = signUpData.user;
        if (!session) {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (loginError || !loginData.session || !loginData.user) {
                return res.status(400).json({
                    success: false,
                    message: loginError?.message || 'Registration succeeded but automatic login failed',
                });
            }
            session = loginData.session;
            user = loginData.user;
        }
        const authedClient = createAuthedSupabaseClient(session.access_token);
        const { error: profileError } = await authedClient.from('profiles').upsert({
            id: user.id,
            full_name: name,
            email,
        }, { onConflict: 'id' });
        if (profileError) {
            console.error('Profile upsert error:', profileError);
        }
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token: session.access_token,
                user: {
                    id: user.id,
                    name,
                    email: user.email
                }
            }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register user'
        });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.session || !data.user) {
            return res.status(401).json({
                success: false,
                message: error?.message || 'Invalid email or password'
            });
        }
        const fullName = (typeof data.user.user_metadata?.full_name === 'string' && data.user.user_metadata.full_name) ||
            (typeof data.user.user_metadata?.name === 'string' && data.user.user_metadata.name) ||
            data.user.email ||
            'User';
        const authedClient = createAuthedSupabaseClient(data.session.access_token);
        const { error: profileError } = await authedClient.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            email: data.user.email,
        }, { onConflict: 'id' });
        if (profileError) {
            console.error('Profile upsert error:', profileError);
        }
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token: data.session.access_token,
                user: {
                    id: data.user.id,
                    name: fullName,
                    email: data.user.email
                }
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to login'
        });
    }
});
// Get current user
router.get('/me', authenticateToken, (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email
                }
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user'
        });
    }
});
// Logout (client-side token removal, but we can add server-side blacklist if needed)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
export default router;
//# sourceMappingURL=auth.js.map
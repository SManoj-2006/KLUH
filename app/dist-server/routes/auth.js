import { Router } from 'express';
import { db } from '../models/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
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
        // Check if user exists
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        // Create user
        const user = await db.createUser(name, email, password);
        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
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
        // Find user
        const user = await db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        // Verify password
        const isValidPassword = await db.verifyPassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name
        });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
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
        const user = db.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
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
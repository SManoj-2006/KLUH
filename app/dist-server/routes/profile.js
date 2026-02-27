import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../models/database.js';
const router = Router();
// Get profile
router.get('/', authenticateToken, (req, res) => {
    try {
        const profile = db.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        res.json({
            success: true,
            data: {
                profile: {
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    education: profile.education,
                    experience: profile.experience,
                    skills: profile.skills,
                    resumeUrl: profile.resumeUrl,
                    updatedAt: profile.updatedAt
                }
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});
// Update profile
router.put('/', authenticateToken, (req, res) => {
    try {
        const { name, phone, education, experience, skills } = req.body;
        const updates = {};
        if (name !== undefined)
            updates.name = name;
        if (phone !== undefined)
            updates.phone = phone;
        if (education !== undefined)
            updates.education = education;
        if (experience !== undefined)
            updates.experience = experience;
        if (skills !== undefined)
            updates.skills = skills;
        const profile = db.updateProfile(req.user.id, updates);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: {
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    education: profile.education,
                    experience: profile.experience,
                    skills: profile.skills,
                    resumeUrl: profile.resumeUrl,
                    updatedAt: profile.updatedAt
                }
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});
// Add skill
router.post('/skills', authenticateToken, (req, res) => {
    try {
        const { skill } = req.body;
        if (!skill || typeof skill !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Skill is required'
            });
        }
        const profile = db.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        if (profile.skills.includes(skill)) {
            return res.status(409).json({
                success: false,
                message: 'Skill already exists'
            });
        }
        const updatedProfile = db.updateProfile(req.user.id, {
            skills: [...profile.skills, skill]
        });
        res.json({
            success: true,
            message: 'Skill added successfully',
            data: {
                skills: updatedProfile?.skills
            }
        });
    }
    catch (error) {
        console.error('Add skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add skill'
        });
    }
});
// Remove skill
router.delete('/skills/:skill', authenticateToken, (req, res) => {
    try {
        const { skill } = req.params;
        const profile = db.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        const updatedProfile = db.updateProfile(req.user.id, {
            skills: profile.skills.filter(s => s !== skill)
        });
        res.json({
            success: true,
            message: 'Skill removed successfully',
            data: {
                skills: updatedProfile?.skills
            }
        });
    }
    catch (error) {
        console.error('Remove skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove skill'
        });
    }
});
// Get profile completeness
router.get('/completeness', authenticateToken, (req, res) => {
    try {
        const profile = db.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        const checks = [
            { label: 'Personal Info', complete: !!(profile.name && profile.email) },
            { label: 'Education', complete: !!profile.education },
            { label: 'Experience', complete: !!profile.experience },
            { label: 'Skills', complete: profile.skills.length > 0 },
        ];
        const completedCount = checks.filter(c => c.complete).length;
        const percentage = Math.round((completedCount / checks.length) * 100);
        res.json({
            success: true,
            data: {
                percentage,
                checks
            }
        });
    }
    catch (error) {
        console.error('Get completeness error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile completeness'
        });
    }
});
export default router;
//# sourceMappingURL=profile.js.map
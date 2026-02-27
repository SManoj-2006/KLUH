import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../models/database.js';
const router = Router();
// Get all jobs
router.get('/', authenticateToken, (req, res) => {
    try {
        const { search, type, skills } = req.query;
        let jobs = db.getAllJobs();
        // Search filter
        if (search && typeof search === 'string') {
            jobs = db.searchJobs(search);
        }
        // Type filter
        if (type && typeof type === 'string') {
            jobs = jobs.filter(job => job.type.toLowerCase() === type.toLowerCase());
        }
        // Skills filter
        if (skills && typeof skills === 'string') {
            const skillList = skills.split(',').map(s => s.trim().toLowerCase());
            jobs = jobs.filter(job => skillList.some(skill => job.skills.some(jobSkill => jobSkill.toLowerCase().includes(skill))));
        }
        // Calculate personalized match scores based on user skills
        const profile = db.getProfile(req.user.id);
        const userSkills = profile?.skills || [];
        const jobsWithMatchScore = jobs.map(job => {
            const matchingSkills = job.skills.filter(skill => userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase()));
            const matchScore = job.skills.length > 0
                ? Math.round((matchingSkills.length / job.skills.length) * 100)
                : 0;
            return {
                ...job,
                matchPercentage: Math.max(matchScore, job.matchPercentage * 0.5) // Blend with base score
            };
        });
        // Sort by match percentage
        jobsWithMatchScore.sort((a, b) => b.matchPercentage - a.matchPercentage);
        res.json({
            success: true,
            data: {
                jobs: jobsWithMatchScore,
                total: jobsWithMatchScore.length
            }
        });
    }
    catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get jobs'
        });
    }
});
// Get job by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const id = req.params.id;
        const job = db.getJobById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        // Calculate personalized match score
        const profile = db.getProfile(req.user.id);
        const userSkills = profile?.skills || [];
        const matchingSkills = job.skills.filter(skill => userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase()));
        const matchScore = job.skills.length > 0
            ? Math.round((matchingSkills.length / job.skills.length) * 100)
            : 0;
        res.json({
            success: true,
            data: {
                job: {
                    ...job,
                    matchPercentage: Math.max(matchScore, job.matchPercentage * 0.5)
                }
            }
        });
    }
    catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get job'
        });
    }
});
// Apply for job
router.post('/:id/apply', authenticateToken, (req, res) => {
    try {
        const id = req.params.id;
        const job = db.getJobById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        // In a real app, this would save the application to a database
        // and potentially send notifications
        res.json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                jobId: id,
                appliedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Apply error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application'
        });
    }
});
export default router;
//# sourceMappingURL=jobs.js.map
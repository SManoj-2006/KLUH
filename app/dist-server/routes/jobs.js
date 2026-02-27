import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createAuthedSupabaseClient, parseSkillsText } from '../lib/supabase.js';
const router = Router();
const mapJob = (job) => {
    const skills = parseSkillsText(job.qualification);
    return {
        id: String(job.id),
        title: job.job_title || 'Untitled Role',
        company: job.company || 'Unknown Company',
        location: job.job_function || 'Not specified',
        salary: 'Not specified',
        type: job.vacancies ? `${job.vacancies} openings` : 'Open',
        skills,
        matchPercentage: 60,
        postedDate: 'Recently',
        description: [job.qualification, job.experience].filter(Boolean).join(' • ') || 'See full job details',
    };
};
const getUserSkills = async (accessToken, userId) => {
    const client = createAuthedSupabaseClient(accessToken);
    const { data } = await client
        .from('resumes')
        .select('extracted_skills')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    const rawSkills = data?.extracted_skills;
    if (!Array.isArray(rawSkills)) {
        return [];
    }
    return rawSkills.filter((skill) => typeof skill === 'string');
};
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search, type, skills } = req.query;
        const client = createAuthedSupabaseClient(req.accessToken);
        const { data, error } = await client
            .from('jobs')
            .select('id, company, job_title, job_function, vacancies, qualification, experience')
            .order('id', { ascending: true });
        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
        let jobsData = (data || []).map((job) => mapJob(job));
        if (search && typeof search === 'string') {
            const normalized = search.toLowerCase();
            jobsData = jobsData.filter((job) => job.title.toLowerCase().includes(normalized) ||
                job.company.toLowerCase().includes(normalized) ||
                job.skills.some((skill) => skill.toLowerCase().includes(normalized)));
        }
        if (type && typeof type === 'string') {
            const normalizedType = type.toLowerCase();
            jobsData = jobsData.filter((job) => job.type.toLowerCase().includes(normalizedType));
        }
        if (skills && typeof skills === 'string') {
            const skillList = skills.split(',').map((skill) => skill.trim().toLowerCase());
            jobsData = jobsData.filter((job) => skillList.some((skill) => job.skills.some((jobSkill) => jobSkill.toLowerCase().includes(skill))));
        }
        const userSkills = await getUserSkills(req.accessToken, req.user.id);
        const jobsWithMatchScore = jobsData.map((job) => {
            const matchingSkills = job.skills.filter((skill) => userSkills.some((userSkill) => userSkill.toLowerCase() === skill.toLowerCase()));
            const dynamicMatch = job.skills.length > 0 ? Math.round((matchingSkills.length / job.skills.length) * 100) : 0;
            return {
                ...job,
                matchPercentage: Math.max(dynamicMatch, job.matchPercentage),
            };
        });
        jobsWithMatchScore.sort((a, b) => b.matchPercentage - a.matchPercentage);
        res.json({
            success: true,
            data: {
                jobs: jobsWithMatchScore,
                total: jobsWithMatchScore.length,
            },
        });
    }
    catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get jobs',
        });
    }
});
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job id',
            });
        }
        const client = createAuthedSupabaseClient(req.accessToken);
        const { data, error } = await client
            .from('jobs')
            .select('id, company, job_title, job_function, vacancies, qualification, experience')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }
        const job = mapJob(data);
        const userSkills = await getUserSkills(req.accessToken, req.user.id);
        const matchingSkills = job.skills.filter((skill) => userSkills.some((userSkill) => userSkill.toLowerCase() === skill.toLowerCase()));
        const matchScore = job.skills.length > 0 ? Math.round((matchingSkills.length / job.skills.length) * 100) : 0;
        res.json({
            success: true,
            data: {
                job: {
                    ...job,
                    matchPercentage: Math.max(matchScore, job.matchPercentage),
                },
            },
        });
    }
    catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get job',
        });
    }
});
router.post('/:id/apply', authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job id',
            });
        }
        const client = createAuthedSupabaseClient(req.accessToken);
        const { data: existingRecommendation } = await client
            .from('recommendations')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('job_id', id)
            .maybeSingle();
        if (!existingRecommendation) {
            const { error } = await client.from('recommendations').insert({
                user_id: req.user.id,
                job_id: id,
                match_score: 0,
            });
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        }
        res.json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                jobId: String(id),
                appliedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Apply error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
        });
    }
});
export default router;
//# sourceMappingURL=jobs.js.map
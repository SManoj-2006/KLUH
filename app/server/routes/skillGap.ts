import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createAuthedSupabaseClient, parseSkillsText } from '../lib/supabase.js';

const router = Router();

interface SupabaseJobRow {
  id: number;
  company: string | null;
  job_title: string | null;
  qualification: string | null;
}

const getUserSkills = async (accessToken: string, userId: string): Promise<string[]> => {
  const client = createAuthedSupabaseClient(accessToken);
  const { data } = await client
    .from('resumes')
    .select('extracted_skills')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!Array.isArray(data?.extracted_skills)) {
    return [];
  }

  return data.extracted_skills.filter((skill: unknown): skill is string => typeof skill === 'string');
};

// In-demand skills data
const inDemandSkills = [
  { name: 'Next.js', demand: 'High', category: 'Frontend' },
  { name: 'Kubernetes', demand: 'High', category: 'DevOps' },
  { name: 'Terraform', demand: 'Medium', category: 'DevOps' },
  { name: 'Machine Learning', demand: 'High', category: 'AI/ML' },
  { name: 'System Design', demand: 'High', category: 'Architecture' },
  { name: 'GraphQL', demand: 'Medium', category: 'Backend' },
  { name: 'Rust', demand: 'High', category: 'Programming' },
  { name: 'WebAssembly', demand: 'Medium', category: 'Frontend' },
];

// Training recommendations
const trainingRecommendations: Record<string, Array<{
  name: string;
  provider: string;
  duration: string;
  level: string;
  url: string;
}>> = {
  'Next.js': [
    { name: 'Next.js Complete Course', provider: 'Udemy', duration: '12 hours', level: 'Intermediate', url: '#' },
    { name: 'Next.js Documentation', provider: 'Vercel', duration: 'Self-paced', level: 'All Levels', url: '#' }
  ],
  'Tailwind CSS': [
    { name: 'Tailwind CSS Mastery', provider: 'Frontend Masters', duration: '6 hours', level: 'Beginner', url: '#' },
    { name: 'Tailwind CSS From Scratch', provider: 'YouTube', duration: '3 hours', level: 'Beginner', url: '#' }
  ],
  'Jest': [
    { name: 'Testing with Jest', provider: 'Codecademy', duration: '8 hours', level: 'Intermediate', url: '#' }
  ],
  'Django': [
    { name: 'Python Django Bootcamp', provider: 'Coursera', duration: '20 hours', level: 'Intermediate', url: '#' }
  ],
  'Redis': [
    { name: 'Redis Fundamentals', provider: 'Redis University', duration: '4 hours', level: 'Beginner', url: '#' }
  ],
  'Kubernetes': [
    { name: 'Kubernetes for Developers', provider: 'Pluralsight', duration: '15 hours', level: 'Advanced', url: '#' },
    { name: 'CKA Certification Prep', provider: 'Linux Foundation', duration: '30 hours', level: 'Advanced', url: '#' }
  ],
  'System Design': [
    { name: 'System Design Interview', provider: 'Educative', duration: '25 hours', level: 'Advanced', url: '#' }
  ],
  'Micro-frontends': [
    { name: 'Micro-frontend Architecture', provider: 'Egghead', duration: '8 hours', level: 'Advanced', url: '#' }
  ],
  'Webpack': [
    { name: 'Webpack 5 Fundamentals', provider: 'Frontend Masters', duration: '5 hours', level: 'Intermediate', url: '#' }
  ],
  'Performance Optimization': [
    { name: 'Web Performance Fundamentals', provider: 'Google', duration: '10 hours', level: 'Intermediate', url: '#' }
  ]
};

// Get skill gap analysis
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const client = createAuthedSupabaseClient(req.accessToken!);
    const userSkills = (await getUserSkills(req.accessToken!, req.user!.id)).map((skill) => skill.toLowerCase());
    const { data: jobsRows, error } = await client
      .from('jobs')
      .select('id, company, job_title, qualification');

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    const jobs = (jobsRows || []) as SupabaseJobRow[];
    
    // Analyze skill gaps for each job
    const jobAnalysis = jobs.map(job => {
      const jobSkills = parseSkillsText(job.qualification);
      const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
      
      // Find matching skills
      const matchingSkills = jobSkills.filter((_, index) => 
        userSkills.includes(jobSkillsLower[index])
      );
      
      // Find missing skills
      const missingSkills = jobSkills.filter((_, index) => 
        !userSkills.includes(jobSkillsLower[index])
      );
      
      // Calculate match percentage
      const matchPercentage = jobSkills.length > 0 
        ? Math.round((matchingSkills.length / jobSkills.length) * 100)
        : 0;

      // Get training recommendations for missing skills
      const recommendedTrainings = missingSkills.flatMap(skill => 
        trainingRecommendations[skill] || []
      ).slice(0, 3); // Limit to 3 recommendations

      return {
        jobTitle: job.job_title || 'Untitled Role',
        company: job.company || 'Unknown Company',
        overallMatch: matchPercentage,
        matchingSkills,
        missingSkills,
        recommendedTrainings: recommendedTrainings.length > 0 
          ? recommendedTrainings 
          : [{
              name: 'General Full Stack Course',
              provider: 'Coursera',
              duration: '40 hours',
              level: 'Intermediate',
              url: '#'
            }]
      };
    });

    // Sort by match percentage (lowest first to show biggest gaps)
    jobAnalysis.sort((a, b) => a.overallMatch - b.overallMatch);

    res.json({
      success: true,
      data: {
        analysis: jobAnalysis,
        userSkills,
        totalGaps: jobAnalysis.reduce((sum, job) => sum + job.missingSkills.length, 0)
      }
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze skill gaps'
    });
  }
});

// Get in-demand skills
router.get('/in-demand', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userSkills = (await getUserSkills(req.accessToken!, req.user!.id)).map((skill) => skill.toLowerCase());

    // Mark skills user already has
    const skillsWithStatus = inDemandSkills.map(skill => ({
      ...skill,
      hasSkill: userSkills.includes(skill.name.toLowerCase())
    }));

    res.json({
      success: true,
      data: {
        skills: skillsWithStatus
      }
    });
  } catch (error) {
    console.error('In-demand skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get in-demand skills'
    });
  }
});

// Get training recommendations for a specific skill
router.get('/training/:skill', authenticateToken, (req: AuthRequest, res) => {
  try {
    const skill = req.params.skill as string;
    const trainings = trainingRecommendations[skill] || [];

    res.json({
      success: true,
      data: {
        skill,
        trainings
      }
    });
  } catch (error) {
    console.error('Training recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training recommendations'
    });
  }
});

// Get user's skill statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const client = createAuthedSupabaseClient(req.accessToken!);
    const userSkills = await getUserSkills(req.accessToken!, req.user!.id);
    const { data: jobsRows, error } = await client
      .from('jobs')
      .select('id, qualification');

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    const jobs = (jobsRows || []) as Array<{ id: number; qualification: string | null }>;
    
    // Calculate average match across all jobs
    let totalMatch = 0;
    jobs.forEach(job => {
      const jobSkills = parseSkillsText(job.qualification);
      const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
      const matchingSkills = jobSkills.filter((_, index) => 
        userSkills.map(s => s.toLowerCase()).includes(jobSkillsLower[index])
      );
      const matchPercentage = jobSkills.length > 0 
        ? (matchingSkills.length / jobSkills.length) * 100
        : 0;
      totalMatch += matchPercentage;
    });
    
    const averageMatch = jobs.length > 0 ? Math.round(totalMatch / jobs.length) : 0;

    // Count job opportunities (jobs with >50% match)
    const opportunities = jobs.filter(job => {
      const jobSkills = parseSkillsText(job.qualification);
      const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
      const matchingSkills = jobSkills.filter((_, index) => 
        userSkills.map(s => s.toLowerCase()).includes(jobSkillsLower[index])
      );
      const matchPercentage = jobSkills.length > 0 
        ? (matchingSkills.length / jobSkills.length) * 100
        : 0;
      return matchPercentage >= 50;
    }).length;

    res.json({
      success: true,
      data: {
        totalSkills: userSkills.length,
        averageMatch,
        opportunities,
        skillCategories: {
          frontend: userSkills.filter(s => 
            ['react', 'vue', 'angular', 'html', 'css', 'javascript'].includes(s.toLowerCase())
          ).length,
          backend: userSkills.filter(s => 
            ['node', 'python', 'java', 'go', 'php', 'ruby'].includes(s.toLowerCase())
          ).length,
          devops: userSkills.filter(s => 
            ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins'].includes(s.toLowerCase())
          ).length,
          database: userSkills.filter(s => 
            ['sql', 'mysql', 'postgresql', 'mongodb', 'redis'].includes(s.toLowerCase())
          ).length
        }
      }
    });
  } catch (error) {
    console.error('Skill stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skill statistics'
    });
  }
});

export default router;

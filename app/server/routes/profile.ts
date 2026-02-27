import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createAuthedSupabaseClient } from '../lib/supabase.js';

const router = Router();

interface ResumeRow {
  id: string;
  file_url: string | null;
  extracted_skills: unknown;
  parsed_role: string | null;
  created_at: string;
}

const normalizeSkills = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((skill): skill is string => typeof skill === 'string');
};

const getLatestResume = async (accessToken: string, userId: string): Promise<ResumeRow | null> => {
  const client = createAuthedSupabaseClient(accessToken);
  const { data } = await client
    .from('resumes')
    .select('id, file_url, extracted_skills, parsed_role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ResumeRow | null) || null;
};

// Get profile
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const client = createAuthedSupabaseClient(req.accessToken!);
    const { data: profile, error } = await client
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('id', req.user!.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    const latestResume = await getLatestResume(req.accessToken!, req.user!.id);
    const skills = normalizeSkills(latestResume?.extracted_skills);

    if (!profile) {
      const { error: upsertError } = await client.from('profiles').upsert(
        {
          id: req.user!.id,
          full_name: req.user!.name,
          email: req.user!.email,
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        return res.status(500).json({
          success: false,
          message: upsertError.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        profile: {
          name: profile?.full_name || req.user!.name,
          email: profile?.email || req.user!.email,
          phone: '',
          education: '',
          experience: latestResume?.parsed_role || '',
          skills,
          resumeUrl: latestResume?.file_url || undefined,
          updatedAt: latestResume?.created_at || profile?.created_at || new Date().toISOString(),
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Update profile
router.put('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, experience, skills } = req.body;
    const client = createAuthedSupabaseClient(req.accessToken!);

    if (name !== undefined) {
      const { error } = await client.from('profiles').upsert(
        {
          id: req.user!.id,
          full_name: name,
          email: req.user!.email,
        },
        { onConflict: 'id' }
      );

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }

    if (skills !== undefined || experience !== undefined) {
      const latestResume = await getLatestResume(req.accessToken!, req.user!.id);

      if (latestResume) {
        const { error } = await client
          .from('resumes')
          .update({
            extracted_skills: skills !== undefined ? skills : latestResume.extracted_skills,
            parsed_role: experience !== undefined ? experience : latestResume.parsed_role,
          })
          .eq('id', latestResume.id);

        if (error) {
          return res.status(500).json({
            success: false,
            message: error.message,
          });
        }
      } else {
        const { error } = await client.from('resumes').insert({
          user_id: req.user!.id,
          file_url: '',
          extracted_skills: Array.isArray(skills) ? skills : [],
          parsed_role: typeof experience === 'string' ? experience : null,
          experience_years: null,
        });

        if (error) {
          return res.status(500).json({
            success: false,
            message: error.message,
          });
        }
      }
    }

    const { data: updatedProfile } = await client
      .from('profiles')
      .select('full_name, email, created_at')
      .eq('id', req.user!.id)
      .maybeSingle();

    const latestResume = await getLatestResume(req.accessToken!, req.user!.id);
    const normalizedSkills = normalizeSkills(latestResume?.extracted_skills);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: {
          name: updatedProfile?.full_name || req.user!.name,
          email: updatedProfile?.email || req.user!.email,
          phone: '',
          education: '',
          experience: latestResume?.parsed_role || '',
          skills: normalizedSkills,
          resumeUrl: latestResume?.file_url || undefined,
          updatedAt: latestResume?.created_at || updatedProfile?.created_at || new Date().toISOString(),
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Add skill
router.post('/skills', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { skill } = req.body;
    
    if (!skill || typeof skill !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Skill is required'
      });
    }

    const client = createAuthedSupabaseClient(req.accessToken!);
    const latestResume = await getLatestResume(req.accessToken!, req.user!.id);
    const currentSkills = normalizeSkills(latestResume?.extracted_skills);

    if (currentSkills.includes(skill)) {
      return res.status(409).json({
        success: false,
        message: 'Skill already exists'
      });
    }

    const nextSkills = [...currentSkills, skill];

    if (latestResume) {
      await client
        .from('resumes')
        .update({ extracted_skills: nextSkills })
        .eq('id', latestResume.id);
    } else {
      await client.from('resumes').insert({
        user_id: req.user!.id,
        file_url: '',
        extracted_skills: nextSkills,
        parsed_role: null,
        experience_years: null,
      });
    }

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: {
        skills: nextSkills
      }
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skill'
    });
  }
});

// Remove skill
router.delete('/skills/:skill', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { skill } = req.params;

    const client = createAuthedSupabaseClient(req.accessToken!);
    const latestResume = await getLatestResume(req.accessToken!, req.user!.id);
    if (!latestResume) {
      return res.json({
        success: true,
        message: 'Skill removed successfully',
        data: {
          skills: []
        }
      });
    }

    const currentSkills = normalizeSkills(latestResume.extracted_skills);
    const nextSkills = currentSkills.filter((existingSkill) => existingSkill !== skill);

    await client
      .from('resumes')
      .update({ extracted_skills: nextSkills })
      .eq('id', latestResume.id);

    res.json({
      success: true,
      message: 'Skill removed successfully',
      data: {
        skills: nextSkills
      }
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove skill'
    });
  }
});

// Get profile completeness
router.get('/completeness', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const client = createAuthedSupabaseClient(req.accessToken!);
    const { data: profile } = await client
      .from('profiles')
      .select('full_name, email')
      .eq('id', req.user!.id)
      .maybeSingle();

    const latestResume = await getLatestResume(req.accessToken!, req.user!.id);
    const skills = normalizeSkills(latestResume?.extracted_skills);

    const checks = [
      { label: 'Personal Info', complete: !!(profile?.full_name && profile?.email) },
      { label: 'Education', complete: false },
      { label: 'Experience', complete: !!latestResume?.parsed_role },
      { label: 'Skills', complete: skills.length > 0 },
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
  } catch (error) {
    console.error('Get completeness error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile completeness'
    });
  }
});

export default router;

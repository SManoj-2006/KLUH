import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createAuthedSupabaseClient } from '../lib/supabase.js';

const router = Router();

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload resume
router.post('/', authenticateToken, upload.single('resume'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user!.id;
    const fileUrl = `/uploads/${req.file.filename}`;

    // Simulate AI extraction (in production, this would call an AI service)
    const extractedSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'];
    const extractedData = {
      name: req.user!.name,
      email: req.user!.email,
      phone: '',
      education: 'bachelor',
      experience: '',
      skills: extractedSkills
    };

    const client = createAuthedSupabaseClient(req.accessToken!);
    const { error } = await client.from('resumes').insert({
      user_id: userId,
      file_url: fileUrl,
      extracted_skills: extractedSkills,
      parsed_role: null,
      experience_years: null,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl
        },
        extractedData
      }
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload resume'
    });
  }
});

// Get upload status
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  const client = createAuthedSupabaseClient(req.accessToken!);
  const { data, error } = await client
    .from('resumes')
    .select('file_url')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  res.json({
    success: true,
    data: {
      hasResume: !!data?.file_url,
      resumeUrl: data?.file_url || null
    }
  });
});

// Delete resume
router.delete('/', authenticateToken, async (req: AuthRequest, res) => {
  const client = createAuthedSupabaseClient(req.accessToken!);
  const { error } = await client
    .from('resumes')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  res.json({
    success: true,
    message: 'Resume deleted successfully'
  });
});

export default router;

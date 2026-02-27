import { useState, useEffect } from 'react';
import { SkillGapCard } from '@/components/ui-custom/SkillGapCard';
import { skillGapAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  AlertCircle, 
  BookOpen, 
  Target, 
  ArrowRight,
  Sparkles,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface JobAnalysis {
  jobTitle: string;
  company: string;
  overallMatch: number;
  matchingSkills: string[];
  missingSkills: string[];
  recommendedTrainings: {
    name: string;
    provider: string;
    duration: string;
    level: string;
    url: string;
  }[];
}

interface SkillStats {
  totalSkills: number;
  averageMatch: number;
  opportunities: number;
  skillCategories: {
    frontend: number;
    backend: number;
    devops: number;
    database: number;
  };
}

interface InDemandSkill {
  name: string;
  demand: string;
  category: string;
  hasSkill: boolean;
}

export function SkillGap() {
  const [analysis, setAnalysis] = useState<JobAnalysis[]>([]);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [inDemandSkills, setInDemandSkills] = useState<InDemandSkill[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkillGapData();
  }, []);

  const fetchSkillGapData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [analysisRes, statsRes, inDemandRes] = await Promise.all([
        skillGapAPI.getAnalysis(),
        skillGapAPI.getStats(),
        skillGapAPI.getInDemandSkills(),
      ]);

      setAnalysis(analysisRes.data.analysis);
      setUserSkills(analysisRes.data.userSkills);
      setStats(statsRes.data);
      setInDemandSkills(inDemandRes.data.skills);
    } catch (err: any) {
      setError(err.message || 'Failed to load skill gap analysis');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Analyzing your skill gaps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Skill Gap Analysis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Identify Your Skill Gaps
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Compare your current skills with job requirements and discover training opportunities to boost your career.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        {stats && (
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Your Skills</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalSkills}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Avg. Match</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.averageMatch}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Opportunities</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.opportunities}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Skill Gap Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Job-Specific Analysis</h2>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {analysis.length} Jobs Analyzed
              </Badge>
            </div>

            <div className="space-y-6">
              {analysis.map((job, index) => (
                <SkillGapCard 
                  key={index}
                  jobTitle={job.jobTitle}
                  company={job.company}
                  overallMatch={job.overallMatch}
                  missingSkills={job.missingSkills}
                  recommendedTrainings={job.recommendedTrainings}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Skills */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-slate-900">Your Current Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 bg-emerald-50"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* In-Demand Skills */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  <h3 className="font-semibold text-slate-900">In-Demand Skills</h3>
                </div>
                <div className="space-y-3">
                  {inDemandSkills.map((skill) => (
                    <div
                      key={skill.name}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        skill.hasSkill 
                          ? 'bg-emerald-50 border border-emerald-100' 
                          : 'bg-slate-50 hover:bg-violet-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{skill.name}</span>
                        {skill.hasSkill && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          skill.demand === 'High'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {skill.demand} Demand
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill Categories */}
            {stats && (
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Skills by Category</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Frontend</span>
                      <Badge variant="secondary">{stats.skillCategories.frontend}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Backend</span>
                      <Badge variant="secondary">{stats.skillCategories.backend}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">DevOps</span>
                      <Badge variant="secondary">{stats.skillCategories.devops}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Database</span>
                      <Badge variant="secondary">{stats.skillCategories.database}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-violet-600 border-0">
              <CardContent className="p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5" />
                  <h3 className="font-semibold">Boost Your Career</h3>
                </div>
                <p className="text-sm text-blue-100 mb-4">
                  Take recommended courses to fill your skill gaps and increase your job match scores.
                </p>
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  View All Courses
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

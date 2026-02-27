import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, BookOpen, TrendingUp, Target } from 'lucide-react';

interface SkillGapCardProps {
  jobTitle: string;
  company: string;
  overallMatch: number;
  missingSkills: string[];
  recommendedTrainings: {
    name: string;
    provider: string;
    duration: string;
    level: string;
  }[];
}

export function SkillGapCard({
  jobTitle,
  company,
  overallMatch,
  missingSkills,
  recommendedTrainings,
}: SkillGapCardProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 75) return 'text-emerald-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="overflow-hidden border-slate-200 transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">{jobTitle}</CardTitle>
            <p className="text-sm text-slate-500 mt-1">{company}</p>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Overall Match */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Overall Match</span>
            <span className={`text-lg font-bold ${getMatchColor(overallMatch)}`}>
              {overallMatch}%
            </span>
          </div>
          <Progress
            value={overallMatch}
            className="h-2.5 bg-slate-100"
          />
        </div>

        {/* Missing Skills */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-slate-700">Missing Skills</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="text-xs border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                >
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-slate-500 italic">No missing skills - Great match!</span>
            )}
          </div>
        </div>

        {/* Recommended Trainings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-slate-700">Recommended Training</span>
          </div>
          <div className="space-y-2">
            {recommendedTrainings.map((training, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{training.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{training.provider}</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className="text-xs bg-white">
                    {training.duration}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                    {training.level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

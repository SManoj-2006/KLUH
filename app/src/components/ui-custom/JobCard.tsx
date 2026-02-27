import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Building2, MapPin, DollarSign, Calendar, ExternalLink } from 'lucide-react';

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  skills: string[];
  matchPercentage: number;
  postedDate: string;
}

export function JobCard({
  title,
  company,
  location,
  salary,
  type,
  skills,
  matchPercentage,
  postedDate,
}: JobCardProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-emerald-500 text-white';
    if (percentage >= 75) return 'bg-blue-500 text-white';
    if (percentage >= 60) return 'bg-amber-500 text-white';
    return 'bg-slate-500 text-white';
  };

  return (
    <Card className="group relative overflow-hidden border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200">
      {/* Match Percentage Badge */}
      <div className="absolute top-4 right-4">
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${getMatchColor(matchPercentage)}`}>
          {matchPercentage}% Match
        </div>
      </div>

      <CardContent className="p-6">
        {/* Job Title & Company */}
        <div className="mb-4 pr-20">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-slate-600">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">{company}</span>
          </div>
        </div>

        {/* Job Details */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <DollarSign className="h-3.5 w-3.5" />
            {salary}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {postedDate}
          </div>
        </div>

        {/* Job Type Badge */}
        <Badge variant="secondary" className="mb-3 bg-slate-100 text-slate-700 hover:bg-slate-200">
          {type}
        </Badge>

        {/* Required Skills */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Required Skills</span>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all group/btn">
          Apply Now
          <ExternalLink className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

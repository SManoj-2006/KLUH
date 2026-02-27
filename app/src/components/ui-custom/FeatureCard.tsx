import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'hover:border-blue-200',
    shadow: 'hover:shadow-blue-500/10',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    border: 'hover:border-emerald-200',
    shadow: 'hover:shadow-emerald-500/10',
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    border: 'hover:border-violet-200',
    shadow: 'hover:shadow-violet-500/10',
  },
  orange: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'hover:border-amber-200',
    shadow: 'hover:shadow-amber-500/10',
  },
};

export function FeatureCard({ icon: Icon, title, description, color = 'blue' }: FeatureCardProps) {
  const colors = colorVariants[color];

  return (
    <Card className={`group relative overflow-hidden border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${colors.border} ${colors.shadow}`}>
      <CardContent className="p-6">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.icon} mb-4 transition-transform group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

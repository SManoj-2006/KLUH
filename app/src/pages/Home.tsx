import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/ui-custom/HeroSection';
import { FeatureCard } from '@/components/ui-custom/FeatureCard';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  UserCheck, 
  Briefcase, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Upload
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Resume AI Extraction',
    description: 'Our advanced AI automatically parses your resume, extracting key information like skills, experience, and education with high accuracy.',
    color: 'blue' as const,
  },
  {
    icon: UserCheck,
    title: 'Auto Registration',
    description: 'Seamlessly register with DEET using your extracted profile information. No manual data entry required.',
    color: 'green' as const,
  },
  {
    icon: Briefcase,
    title: 'Smart Job Matching',
    description: 'Get personalized job recommendations based on your skills, experience, and career preferences using our AI algorithm.',
    color: 'purple' as const,
  },
  {
    icon: TrendingUp,
    title: 'Skill Gap Analysis',
    description: 'Identify missing skills for your target jobs and receive recommendations for courses and training to bridge the gap.',
    color: 'orange' as const,
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Upload Resume',
    description: 'Upload your resume in PDF, DOC, or DOCX format.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'AI Analysis',
    description: 'Our AI extracts your skills and experience automatically.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Get Matched',
    description: 'Receive personalized job recommendations instantly.',
    icon: Zap,
  },
  {
    step: '04',
    title: 'Apply Securely',
    description: 'Apply to jobs with your verified DEET profile.',
    icon: Shield,
  },
];

export function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-4">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to streamline your job search and career development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={feature.title} className={`animate-fade-in stagger-${index + 1}`}>
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get started in minutes with our simple four-step process
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector Line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-slate-200" />
                )}
                
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
                      <item.icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-blue-600 to-violet-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Job?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have found their dream careers through our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/upload">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Resume
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/recommendations">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                    <Briefcase className="h-5 w-5 mr-2" />
                    View Jobs
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                    Get Started Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

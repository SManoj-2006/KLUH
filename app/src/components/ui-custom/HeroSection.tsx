import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, Briefcase, Sparkles, CheckCircle } from 'lucide-react';

export function HeroSection() {
  const features = [
    'AI-powered resume parsing',
    'Instant DEET registration',
    'Smart job matching',
    'Skill gap analysis',
  ];

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/50" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-100/20 to-transparent" />
      
      {/* Animated Circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI-Powered Job Matching</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                AI Resume to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  DEET Job
                </span>{' '}
                Automation System
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Transform your resume into career opportunities with our intelligent AI system. 
                Automatically extract skills, register with DEET, and get matched with your perfect job.
              </p>
            </div>

            {/* Feature List */}
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/upload">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 px-8">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Resume
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/recommendations">
                <Button size="lg" variant="outline" className="border-slate-300 hover:bg-slate-50 px-8">
                  <Briefcase className="h-5 w-5 mr-2" />
                  View Jobs
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4 border-t border-slate-200">
              <div>
                <p className="text-2xl font-bold text-slate-900">50K+</p>
                <p className="text-sm text-slate-500">Jobs Matched</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900">98%</p>
                <p className="text-sm text-slate-500">Accuracy Rate</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900">10K+</p>
                <p className="text-sm text-slate-500">Active Users</p>
              </div>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/10 p-6 border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">AI Analysis Complete</p>
                    <p className="text-sm text-slate-500">Resume processed successfully</p>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-slate-700">Extracted Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'].map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Match Score */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-800">Job Match Score</span>
                    <span className="text-lg font-bold text-emerald-600">92%</span>
                  </div>
                  <div className="h-2 rounded-full bg-emerald-200 overflow-hidden">
                    <div className="h-full w-[92%] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">New Match</p>
                    <p className="text-sm font-semibold text-slate-900">Senior Developer</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-slate-100 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">Profile Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

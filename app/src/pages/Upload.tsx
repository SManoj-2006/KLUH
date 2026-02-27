import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadForm } from '@/components/ui-custom/UploadForm';
import { uploadAPI } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Sparkles, Shield, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Sparkles,
    title: 'AI-Powered Analysis',
    description: 'Our advanced NLP models extract skills with 98% accuracy.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get your profile analyzed and jobs matched within seconds.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and never shared with third parties.',
  },
];

export function Upload() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    try {
      await uploadAPI.uploadResume(file);
      navigate('/recommendations');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Resume Upload</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Upload Your Resume
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Let our AI analyze your resume and extract your skills for personalized job recommendations.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Upload Form */}
            <div className="lg:col-span-2">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <UploadForm onUpload={handleUpload} />
            </div>

            {/* Sidebar - Benefits */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Why Upload?</h3>
                <div className="space-y-4">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="flex gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{benefit.title}</h4>
                        <p className="text-sm text-slate-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Pro Tips</h3>
                <ul className="space-y-3 text-sm text-blue-100">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 mt-0.5">•</span>
                    Use a clean, professional resume format
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 mt-0.5">•</span>
                    Include specific skills and technologies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 mt-0.5">•</span>
                    Quantify your achievements when possible
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 mt-0.5">•</span>
                    Keep your resume under 2 pages
                  </li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

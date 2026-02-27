import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadForm } from '@/components/ui-custom/UploadForm';
import { uploadAPI } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react';

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
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    try {
      const response = await uploadAPI.uploadResume(file);
      setUploadSuccess(true);
      setExtractedData(response.data.extractedData);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
  };

  const handleContinue = () => {
    navigate('/preview');
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

        {uploadSuccess ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Upload Successful!
              </h2>
              <p className="text-slate-600 mb-6">
                Our AI has analyzed your resume and extracted your skills. 
                Continue to preview and edit your profile.
              </p>
              
              {extractedData && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-medium text-slate-700 mb-2">Extracted Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleContinue}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Preview Profile
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

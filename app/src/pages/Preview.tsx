import { useState, useEffect } from 'react';
import { PreviewForm } from '@/components/ui-custom/PreviewForm';
import { profileAPI } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle, CheckCircle, Sparkles, Loader2 } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  skills: string[];
}

interface CompletenessData {
  percentage: number;
  checks: { label: string; complete: boolean }[];
}

export function Preview() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const [profileRes, completenessRes] = await Promise.all([
        profileAPI.getProfile(),
        profileAPI.getCompleteness(),
      ]);
      setProfile(profileRes.data.profile);
      setCompleteness(completenessRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: ProfileData) => {
    try {
      setError(null);
      setSaveSuccess(false);
      await profileAPI.updateProfile({
        name: data.name,
        phone: data.phone,
        education: data.education,
        experience: data.experience,
        skills: data.skills,
      });
      setSaveSuccess(true);
      // Refresh completeness
      const completenessRes = await profileAPI.getCompleteness();
      setCompleteness(completenessRes.data);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Loading your profile...</p>
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
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Profile Preview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Review Your Profile
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Review and edit your extracted information before saving to your DEET profile.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="max-w-6xl mx-auto mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="max-w-6xl mx-auto mb-6 bg-emerald-50 border-emerald-200 text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Profile saved successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Main Form */}
          <div className="lg:col-span-3">
            {profile && (
              <PreviewForm 
                initialData={profile} 
                onSave={handleSave} 
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completeness */}
            {completeness && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Completeness</h3>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">{completeness.percentage}% Complete</span>
                    {completeness.percentage === 100 && (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${completeness.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  {completeness.checks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2">
                      {check.complete ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className={`text-sm ${check.complete ? 'text-slate-700' : 'text-slate-500'}`}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Extraction Notice */}
            <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">AI Extracted</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                This information was automatically extracted from your resume using our AI technology.
              </p>
              <div className="text-xs text-slate-500">
                <p className="font-medium mb-1">Last updated:</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
              <h3 className="font-semibold text-amber-900 mb-3">Tips</h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Double-check your contact information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Add any missing skills manually
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Update your experience summary
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Phone, GraduationCap, Wrench, Save, X, Plus, CheckCircle } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  skills: string[];
}

interface PreviewFormProps {
  initialData?: Partial<ProfileData>;
  onSave?: (data: ProfileData) => void;
}

export function PreviewForm({ initialData, onSave }: PreviewFormProps) {
  const [formData, setFormData] = useState<ProfileData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    education: initialData?.education || '',
    experience: initialData?.experience || '',
    skills: initialData?.skills || [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
      setIsSaved(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
    setIsSaved(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const inputGroups = [
    {
      label: 'Full Name',
      field: 'name' as const,
      icon: User,
      placeholder: 'Enter your full name',
      type: 'text',
    },
    {
      label: 'Email Address',
      field: 'email' as const,
      icon: Mail,
      placeholder: 'Enter your email address',
      type: 'email',
    },
    {
      label: 'Phone Number',
      field: 'phone' as const,
      icon: Phone,
      placeholder: 'Enter your phone number',
      type: 'tel',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {inputGroups.map(({ label, field, icon: Icon, placeholder, type }) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="text-sm font-medium text-slate-700">
                  {label}
                </Label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id={field}
                    type={type}
                    value={formData[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Education</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="education" className="text-sm font-medium text-slate-700">
                Highest Education Level
              </Label>
              <Select
                value={formData.education}
                onValueChange={(value) => handleChange('education', value)}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Select your highest education" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School</SelectItem>
                  <SelectItem value="associate">Associate Degree</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Skills</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Add Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a skill and press Enter"
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  onClick={handleAddSkill}
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Skills List */}
            <div className="flex flex-wrap gap-2">
              {formData.skills.length > 0 ? (
                formData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No skills added yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <User className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Work Experience</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="text-sm font-medium text-slate-700">
              Summary
            </Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              placeholder="Briefly describe your work experience..."
              rows={4}
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {isSaved && (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Profile saved successfully!</span>
          </div>
        )}
        <Button
          type="submit"
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Profile
        </Button>
      </div>
    </form>
  );
}

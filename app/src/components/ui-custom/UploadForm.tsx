import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface UploadFormProps {
  onUpload?: (file: File) => void;
}

export function UploadForm({ onUpload }: UploadFormProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const acceptedTypes = ['.pdf', '.doc', '.docx'];
  const acceptedTypesString = acceptedTypes.join(',');

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedTypes.includes(extension);
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) {
      setUploadStatus('error');
      return;
    }
    setUploadedFile(file);
    setUploadStatus('idle');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) return;
    
    setUploadStatus('uploading');
    
    // Simulate upload
    setTimeout(() => {
      setUploadStatus('success');
      onUpload?.(uploadedFile);
    }, 2000);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-slate-200 shadow-xl shadow-slate-200/50">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Your Resume</h2>
          <p className="text-slate-600">
            Our AI will analyze your resume and extract your skills for job matching
          </p>
        </div>

        {/* Drop Zone */}
        {!uploadedFile ? (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }
            `}
          >
            <input
              type="file"
              accept={acceptedTypesString}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className={`
              mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors
              ${isDragActive ? 'bg-blue-100' : 'bg-slate-100'}
            `}>
              <Upload className={`h-10 w-10 ${isDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
            </p>
            <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <File className="h-4 w-4" />
              <span>Supported formats: PDF, DOC, DOCX</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {getFileIcon(uploadedFile.name)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{uploadedFile.name}</p>
                <p className="text-sm text-slate-500">{formatFileSize(uploadedFile.size)}</p>
              </div>
              {uploadStatus !== 'uploading' && (
                <button
                  onClick={clearFile}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              )}
            </div>

            {/* Status Messages */}
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Invalid file format. Please upload PDF, DOC, or DOCX.</span>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Resume uploaded successfully! AI analysis in progress...</span>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <div className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Uploaded Successfully
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Resume
                </>
              )}
            </Button>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> For best results, ensure your resume includes clear sections for skills, 
            education, and work experience. Our AI extracts information more accurately from well-structured resumes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

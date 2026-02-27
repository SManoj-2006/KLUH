import { useState, useEffect } from 'react';
import { JobCard } from '@/components/ui-custom/JobCard';
import { jobsAPI } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Briefcase, 
  SlidersHorizontal, 
  X,
  Loader2
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  skills: string[];
  matchPercentage: number;
  postedDate: string;
}

const filterOptions = {
  jobType: ['Full-time', 'Part-time', 'Contract', 'Remote'],
  experience: ['Entry Level', 'Mid Level', 'Senior Level'],
  salary: ['$0-$50k', '$50k-$100k', '$100k-$150k', '$150k+'],
};

export function Recommendations() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (filters?: { search?: string; type?: string; skills?: string[] }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await jobsAPI.getJobs(filters);
      setJobs(response.data.jobs);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
    fetchJobs();
  };

  const handleSearch = () => {
    fetchJobs({ search: searchQuery || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredJobs = jobs;

  return (
    <div className="min-h-screen bg-slate-50 py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Job Recommendations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Jobs Matched For You
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Based on your skills and experience, we've found these jobs that match your profile.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by job title, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-300 hover:bg-slate-50"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-slate-600">Active filters:</span>
              {activeFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
                >
                  {filter}
                  <button
                    onClick={() => toggleFilter(filter)}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Filter Options */}
          {showFilters && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Job Type</h4>
                  <div className="space-y-2">
                    {filterOptions.jobType.map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(type)}
                          onChange={() => toggleFilter(type)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Experience Level</h4>
                  <div className="space-y-2">
                    {filterOptions.experience.map((exp) => (
                      <label key={exp} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(exp)}
                          onChange={() => toggleFilter(exp)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{exp}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Salary Range</h4>
                  <div className="space-y-2">
                    {filterOptions.salary.map((salary) => (
                      <label key={salary} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(salary)}
                          onChange={() => toggleFilter(salary)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{salary}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-6">
            <p className="text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filteredJobs.length}</span> jobs
              {filteredJobs.length > 0 && (
                <span> with match scores from{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(...filteredJobs.map((j) => j.matchPercentage))}%
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.max(...filteredJobs.map((j) => j.matchPercentage))}%
                </span>
                </span>
              )}
            </p>
          </div>
        )}

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Loading job recommendations...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search or filters to find more opportunities.
            </p>
            <Button onClick={clearFilters} variant="outline" className="border-slate-300">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

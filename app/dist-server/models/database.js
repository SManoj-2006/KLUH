import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
// In-memory database
class Database {
    constructor() {
        this.users = new Map();
        this.profiles = new Map();
        this.jobs = [
            {
                id: '1',
                title: 'Senior Frontend Developer',
                company: 'TechCorp Inc.',
                location: 'San Francisco, CA',
                salary: '$120k - $160k',
                type: 'Full-time',
                skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
                matchPercentage: 95,
                postedDate: '2 days ago',
                description: 'We are looking for an experienced Frontend Developer...'
            },
            {
                id: '2',
                title: 'Full Stack Engineer',
                company: 'StartupXYZ',
                location: 'Remote',
                salary: '$100k - $140k',
                type: 'Full-time',
                skills: ['React', 'Python', 'AWS', 'PostgreSQL'],
                matchPercentage: 88,
                postedDate: '1 week ago',
                description: 'Join our fast-growing startup as a Full Stack Engineer...'
            },
            {
                id: '3',
                title: 'React Developer',
                company: 'Digital Solutions',
                location: 'New York, NY',
                salary: '$90k - $120k',
                type: 'Contract',
                skills: ['React', 'JavaScript', 'CSS', 'Redux'],
                matchPercentage: 92,
                postedDate: '3 days ago',
                description: 'Looking for a skilled React Developer...'
            },
            {
                id: '4',
                title: 'Software Engineer',
                company: 'Innovation Labs',
                location: 'Austin, TX',
                salary: '$110k - $150k',
                type: 'Full-time',
                skills: ['TypeScript', 'Node.js', 'Docker', 'Kubernetes'],
                matchPercentage: 85,
                postedDate: '5 days ago',
                description: 'Join our engineering team...'
            },
            {
                id: '5',
                title: 'Frontend Architect',
                company: 'Enterprise Co',
                location: 'Seattle, WA',
                salary: '$140k - $180k',
                type: 'Full-time',
                skills: ['React', 'TypeScript', 'System Design', 'Leadership'],
                matchPercentage: 78,
                postedDate: '1 day ago',
                description: 'Seeking an experienced Frontend Architect...'
            },
            {
                id: '6',
                title: 'Web Developer',
                company: 'Creative Agency',
                location: 'Los Angeles, CA',
                salary: '$80k - $110k',
                type: 'Full-time',
                skills: ['React', 'Vue.js', 'HTML', 'CSS'],
                matchPercentage: 82,
                postedDate: '4 days ago',
                description: 'Join our creative team...'
            }
        ];
    }
    // User methods
    async createUser(name, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: uuidv4(),
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date()
        };
        this.users.set(user.id, user);
        // Create empty profile for user
        this.profiles.set(user.id, {
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: '',
            education: '',
            experience: '',
            skills: [],
            updatedAt: new Date()
        });
        return user;
    }
    async findUserByEmail(email) {
        const normalizedEmail = email.toLowerCase();
        for (const user of this.users.values()) {
            if (user.email === normalizedEmail) {
                return user;
            }
        }
        return undefined;
    }
    findUserById(id) {
        return this.users.get(id);
    }
    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    // Profile methods
    getProfile(userId) {
        return this.profiles.get(userId);
    }
    updateProfile(userId, updates) {
        const profile = this.profiles.get(userId);
        if (!profile)
            return undefined;
        const updatedProfile = {
            ...profile,
            ...updates,
            updatedAt: new Date()
        };
        this.profiles.set(userId, updatedProfile);
        return updatedProfile;
    }
    // Job methods
    getAllJobs() {
        return this.jobs;
    }
    getJobById(id) {
        return this.jobs.find(job => job.id === id);
    }
    searchJobs(query) {
        const lowerQuery = query.toLowerCase();
        return this.jobs.filter(job => job.title.toLowerCase().includes(lowerQuery) ||
            job.company.toLowerCase().includes(lowerQuery) ||
            job.skills.some(skill => skill.toLowerCase().includes(lowerQuery)));
    }
    filterJobs(filters) {
        return this.jobs.filter(job => {
            if (filters.type && job.type !== filters.type)
                return false;
            if (filters.skills && filters.skills.length > 0) {
                const hasMatchingSkill = filters.skills.some(skill => job.skills.some(jobSkill => jobSkill.toLowerCase().includes(skill.toLowerCase())));
                if (!hasMatchingSkill)
                    return false;
            }
            return true;
        });
    }
}
export const db = new Database();
//# sourceMappingURL=database.js.map
export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
}
export interface Profile {
    userId: string;
    name: string;
    email: string;
    phone: string;
    education: string;
    experience: string;
    skills: string[];
    resumeUrl?: string;
    updatedAt: Date;
}
export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    skills: string[];
    matchPercentage: number;
    postedDate: string;
    description: string;
}
declare class Database {
    private users;
    private profiles;
    private jobs;
    createUser(name: string, email: string, password: string): Promise<User>;
    findUserByEmail(email: string): Promise<User | undefined>;
    findUserById(id: string): User | undefined;
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    getProfile(userId: string): Profile | undefined;
    updateProfile(userId: string, updates: Partial<Profile>): Profile | undefined;
    getAllJobs(): Job[];
    getJobById(id: string): Job | undefined;
    searchJobs(query: string): Job[];
    filterJobs(filters: {
        type?: string;
        skills?: string[];
    }): Job[];
}
export declare const db: Database;
export {};
//# sourceMappingURL=database.d.ts.map
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in environment');
}
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
export const createAuthedSupabaseClient = (accessToken) => {
    return createClient(supabaseUrl, supabasePublishableKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
};
export const parseSkillsText = (value) => {
    if (!value) {
        return [];
    }
    return value
        .split(/[,/|]/)
        .map((skill) => skill.trim())
        .filter(Boolean);
};
//# sourceMappingURL=supabase.js.map
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// 타입 정의
export interface UserProfile {
    id: string;
    email: string;
    plan: "free" | "pro" | "team";
    stripe_customer_id?: string;
    projects_count: number;
    created_at: string;
}

export interface SavedProject {
    id: string;
    user_id: string;
    name: string;
    prompt: string;
    template_id: string;
    style_id: string;
    color_name: string;
    design_tokens: Record<string, unknown>;
    features: string[];
    sections: string[];
    created_at: string;
    updated_at: string;
}

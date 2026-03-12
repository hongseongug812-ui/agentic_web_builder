import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { Plan } from "@/lib/plan-check";

export interface AuthStore {
    user: User | null;
    plan: Plan;
    projectsCount: number;
    isLoading: boolean;
    isInitialized: boolean;

    setUser: (user: User | null) => void;
    setPlan: (plan: Plan) => void;
    setProjectsCount: (count: number) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    plan: "free",
    projectsCount: 0,
    isLoading: true,
    isInitialized: false,

    setUser: (user) => set({ user }),
    setPlan: (plan) => set({ plan }),
    setProjectsCount: (count) => set({ projectsCount: count }),
    setLoading: (loading) => set({ isLoading: loading }),
    setInitialized: (initialized) => set({ isInitialized: initialized }),

    signOut: async () => {
        const { createClient } = await import("@/lib/supabase");
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, plan: "free", projectsCount: 0 });
    },
}));

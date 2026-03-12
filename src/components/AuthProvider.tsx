"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import type { Plan } from "@/lib/plan-check";

/**
 * 앱 최상단에 마운트되어 Supabase 세션 변화를 감지하고
 * authStore를 동기화합니다.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setPlan, setLoading, setInitialized } = useAuthStore();

    useEffect(() => {
        const supabase = createClient();

        // 초기 세션 확인
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const user = session?.user ?? null;
            setUser(user);

            if (user) {
                // 프로필에서 플랜 정보 가져오기
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("plan")
                    .eq("id", user.id)
                    .single();
                setPlan((profile?.plan as Plan) ?? "free");
            }

            setLoading(false);
            setInitialized(true);
        });

        // 세션 변화 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user ?? null;
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("plan")
                    .eq("id", user.id)
                    .single();
                setPlan((profile?.plan as Plan) ?? "free");
            } else {
                setPlan("free");
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [setUser, setPlan, setLoading, setInitialized]);

    return <>{children}</>;
}

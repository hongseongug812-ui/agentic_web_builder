"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Github } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/");
        }
    }

    async function handleOAuth(provider: "google" | "github") {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white">로그인</h1>
                    <p className="text-sm text-white/50 mt-1">Agentic Web Builder에 오신 것을 환영합니다</p>
                </div>

                {/* OAuth 버튼 */}
                <div className="space-y-2">
                    <button
                        onClick={() => handleOAuth("google")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white hover:bg-white/[0.08] transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google로 시작하기
                    </button>
                    <button
                        onClick={() => handleOAuth("github")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white hover:bg-white/[0.08] transition-colors"
                    >
                        <Github className="w-4 h-4" />
                        GitHub로 시작하기
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.08]" />
                    </div>
                    <div className="relative flex justify-center text-xs text-white/30">
                        <span className="bg-gray-950 px-2">또는 이메일로</span>
                    </div>
                </div>

                {/* 이메일 폼 */}
                <form onSubmit={handleLogin} className="space-y-3">
                    <input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>

                <p className="text-center text-xs text-white/40">
                    계정이 없으신가요?{" "}
                    <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    );
}

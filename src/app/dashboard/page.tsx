"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { canUseFeature } from "@/lib/plan-check";
import { Plus, LogOut, Zap, Clock, Trash2 } from "lucide-react";

interface Project {
    id: string;
    name: string;
    template_id: string;
    created_at: string;
    updated_at: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, plan, signOut, isLoading } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [fetching, setFetching] = useState(true);
    const [upgraded, setUpgraded] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("upgraded") === "true") setUpgraded(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/auth/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("projects")
                .select("id, name, template_id, created_at, updated_at")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false });
            setProjects(data || []);
            setFetching(false);
        })();
    }, [user]);

    async function handleDelete(id: string) {
        const supabase = createClient();
        await supabase.from("projects").delete().eq("id", id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
    }

    async function handleManageBilling() {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
    }

    const canCreateMore = canUseFeature(plan, "unlimited_projects") || projects.length < 1;

    if (isLoading || fetching) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Nav */}
            <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-white font-bold text-sm">
                    ⚡ Agentic Builder
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">{user?.email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan === "pro" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "bg-white/[0.05] text-white/40 border border-white/[0.08]"}`}>
                        {plan.toUpperCase()}
                    </span>
                    {plan !== "pro" && (
                        <Link href="/pricing" className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1">
                            <Zap className="w-3 h-3" /> 업그레이드
                        </Link>
                    )}
                    {plan === "pro" && (
                        <button onClick={handleManageBilling} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                            구독 관리
                        </button>
                    )}
                    <button onClick={signOut} className="text-white/30 hover:text-white/60 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* 업그레이드 성공 배너 */}
                {upgraded && (
                    <div className="mb-6 bg-indigo-600/15 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm text-indigo-300 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Pro 플랜으로 업그레이드되었습니다! 모든 기능을 사용하세요.
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white">내 프로젝트</h1>
                    {canCreateMore ? (
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" /> 새 프로젝트
                        </Link>
                    ) : (
                        <Link
                            href="/pricing"
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 rounded-lg transition-colors hover:bg-white/[0.08]"
                        >
                            <Zap className="w-4 h-4 text-indigo-400" /> Pro로 업그레이드
                        </Link>
                    )}
                </div>

                {/* Free plan limit notice */}
                {plan === "free" && (
                    <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300/80">
                        Free 플랜은 프로젝트 1개까지 저장됩니다.{" "}
                        <Link href="/pricing" className="underline text-amber-300">Pro로 업그레이드</Link>하면 무제한 저장!
                    </div>
                )}

                {/* Project grid */}
                {projects.length === 0 ? (
                    <div className="text-center py-24 text-white/30">
                        <div className="text-5xl mb-4">🏗️</div>
                        <p className="text-base">아직 프로젝트가 없습니다.</p>
                        <p className="text-sm mt-1">새 프로젝트를 시작해보세요!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="group relative bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 hover:border-indigo-500/30 transition-all"
                            >
                                <div className="text-2xl mb-3">🌐</div>
                                <h3 className="text-sm font-medium text-white truncate">{project.name || "이름 없는 프로젝트"}</h3>
                                <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(project.updated_at).toLocaleDateString("ko-KR")}
                                </p>
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                                    title="삭제"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

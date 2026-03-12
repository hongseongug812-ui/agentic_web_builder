"use client";

import { useState, useEffect } from "react";
import FlowCanvas from "@/components/FlowCanvas";
import NodeDetailPanel from "@/components/NodeDetailPanel";
import CodePreviewPanel from "@/components/CodePreviewPanel";
import PreviewPanel from "@/components/PreviewPanel";
import IREditorPanel from "@/components/IREditorPanel";
import PipelineProgress from "@/components/PipelineProgress";
import SetupGuide from "@/components/SetupGuide";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastContainer from "@/components/Toast";
import TemplateBuilder from "@/components/TemplateBuilder";
import { useUIStore, useAgentStore } from "@/store";
import type { BottomTab } from "@/store/uiStore";
import { ArrowLeft, Sparkles, Code2, Eye, Zap, Globe, Layers } from "lucide-react";

/* ── Tab button (extracted to remove repeated ternary chains) ── */
const TAB_STYLES: Record<BottomTab, { active: string; icon: string }> = {
    code:    { active: "border-indigo-400 text-indigo-300 bg-indigo-400/5",   icon: "indigo" },
    preview: { active: "border-emerald-400 text-emerald-300 bg-emerald-400/5", icon: "emerald" },
    ir:      { active: "border-purple-400 text-purple-300 bg-purple-400/5",   icon: "purple" },
};

function TabButton({
    tab,
    current,
    onClick,
    icon,
    label,
    ariaLabel,
}: {
    tab: BottomTab;
    current: BottomTab;
    onClick: (t: BottomTab) => void;
    icon: React.ReactNode;
    label: string;
    ariaLabel: string;
}) {
    const isActive = tab === current;
    const { active } = TAB_STYLES[tab];
    return (
        <button
            onClick={() => onClick(tab)}
            aria-label={ariaLabel}
            aria-selected={isActive}
            role="tab"
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all duration-200 ${
                isActive ? active : "border-transparent text-white/30 hover:text-white/55 hover:bg-white/[0.02]"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

/* ── Animated Logo ── */
function AnimatedLogo() {
    return (
        <div className="relative w-8 h-8 group">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 opacity-70 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-500" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
        </div>
    );
}

/* ── Live Status Badge ── */
function StatusBadge() {
    const isRunning  = useAgentStore((s) => s.isRunning);
    const currentView = useUIStore((s) => s.currentView);

    if (currentView === "setup") {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/40 font-medium tracking-wide uppercase">Ready</span>
            </div>
        );
    }

    if (isRunning) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <div className="relative w-1.5 h-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                </div>
                <span className="text-[10px] text-amber-400/80 font-medium tracking-wide uppercase">Building</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] text-indigo-400/80 font-medium tracking-wide uppercase">Complete</span>
        </div>
    );
}

/* ── Shared Top Bar ── */
function TopBar() {
    const currentView = useUIStore((s) => s.currentView);
    const setView     = useUIStore((s) => s.setView);

    return (
        <header className="h-[52px] flex-shrink-0 flex items-center px-4 border-b border-white/[0.055] bg-[#030712]/95 backdrop-blur-xl z-50 relative overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
            {/* Ambient glow behind logo */}
            <div className="absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-indigo-600/[0.04] to-transparent pointer-events-none" />

            <div className="flex items-center gap-2.5 relative">
                {currentView === "canvas" && (
                    <button
                        onClick={() => setView("setup")}
                        aria-label="설정으로 돌아가기"
                        className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/35 hover:text-white/75 hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-200"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                )}
                <AnimatedLogo />
                <div className="flex flex-col leading-none">
                    <span className="text-[13px] font-bold tracking-tight text-white/90">
                        Agentic Web Builder
                    </span>
                    <span className="text-[9px] text-white/22 font-medium tracking-[0.1em] uppercase mt-[3px]">
                        AI Multi-Agent Platform
                    </span>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2.5">
                <StatusBadge />
                <div className="h-3.5 w-px bg-white/[0.07]" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.025] border border-white/[0.055]">
                    <Globe className="w-2.5 h-2.5 text-white/25" />
                    <span className="text-[9px] text-white/25 font-mono tracking-wider">v1.0</span>
                </div>
            </div>
        </header>
    );
}

/* ── Setup View ── */
function SetupView() {
    return (
        <div className="flex-1 flex overflow-hidden bg-gray-950">
            <TemplateBuilder />
        </div>
    );
}

/* ── Shared tab bar ── */
function PanelTabBar({ current, onClick }: { current: BottomTab; onClick: (t: BottomTab) => void }) {
    return (
        <div
            className="flex items-center bg-gray-900/50 border-b border-white/[0.06] px-3 flex-shrink-0"
            role="tablist"
            aria-label="하단 패널"
        >
            <TabButton tab="code"    current={current} onClick={onClick} icon={<Code2  className="w-3.5 h-3.5" />} label="코드"         ariaLabel="코드 보기" />
            <TabButton tab="preview" current={current} onClick={onClick} icon={<Eye    className="w-3.5 h-3.5" />} label="프리뷰 / 배포" ariaLabel="프리뷰 보기" />
            <TabButton tab="ir"      current={current} onClick={onClick} icon={<Layers className="w-3.5 h-3.5" />} label="편집기"        ariaLabel="IR 편집기" />
        </div>
    );
}

/* ── Canvas View ── */
function CanvasView() {
    const bottomTab    = useUIStore((s) => s.bottomTab);
    const setBottomTab = useUIStore((s) => s.setBottomTab);

    // IR 편집기 탭: 전체 화면 편집기 레이아웃 (파이프라인 캔버스 숨김)
    const isIRMode = bottomTab === "ir";

    return (
        <div className="flex flex-1 overflow-hidden bg-gray-950 animate-[fadeInUp_0.4s_ease-out]">
            <main className="flex-1 flex flex-col overflow-hidden bg-gray-950 relative">
                <PipelineProgress />

                {isIRMode ? (
                    /* ── IR 전체화면 모드 ── */
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <PanelTabBar current={bottomTab} onClick={setBottomTab} />
                        <div className="flex-1 min-h-0 overflow-hidden" role="tabpanel">
                            <IREditorPanel />
                        </div>
                    </div>
                ) : (
                    /* ── 에이전트 + 코드/프리뷰 분할 모드 ── */
                    <>
                        {/* 파이프라인 캔버스 (상단 3/5) */}
                        <div className="flex-[3] min-h-0 overflow-hidden">
                            <FlowCanvas />
                        </div>

                        {/* 하단 패널 (하단 2/5) */}
                        <div className="flex-[2] min-h-0 flex flex-col overflow-hidden border-t border-white/[0.06]">
                            <PanelTabBar current={bottomTab} onClick={setBottomTab} />
                            <div className="flex-1 min-h-0 overflow-hidden" role="tabpanel">
                                {bottomTab === "code" ? <CodePreviewPanel /> : <PreviewPanel />}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* 에이전트 디테일 패널: IR 모드에서는 숨김 */}
            {!isIRMode && <NodeDetailPanel />}
        </div>
    );
}

/* ── Main Page ── */
export default function Home() {
    const currentView = useUIStore((s) => s.currentView);
    const [viewKey, setViewKey]             = useState(currentView);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (viewKey !== currentView) {
            setIsTransitioning(true);
            const t = setTimeout(() => {
                setViewKey(currentView);
                setIsTransitioning(false);
            }, 200);
            return () => clearTimeout(t);
        }
    }, [currentView, viewKey]);

    return (
        <ErrorBoundary>
            <div
                className="flex flex-col h-screen w-screen overflow-hidden font-[family-name:var(--font-geist-sans)]"
                role="application"
                aria-label="Agentic Web Builder"
            >
                <TopBar />
                <div
                    className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
                    style={{
                        opacity:   isTransitioning ? 0 : 1,
                        transform: isTransitioning ? "scale(0.985)" : "scale(1)",
                    }}
                >
                    {viewKey === "setup" ? (
                        <>
                            <SetupGuide />
                            <SetupView />
                        </>
                    ) : (
                        <CanvasView />
                    )}
                </div>
                <ToastContainer />
            </div>
        </ErrorBoundary>
    );
}

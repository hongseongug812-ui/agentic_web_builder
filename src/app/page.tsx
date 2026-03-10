"use client";

import { useState, useEffect } from "react";
import FlowCanvas from "@/components/FlowCanvas";
import NodeDetailPanel from "@/components/NodeDetailPanel";
import CodePreviewPanel from "@/components/CodePreviewPanel";
import PreviewPanel from "@/components/PreviewPanel";
import PipelineProgress from "@/components/PipelineProgress";
import SetupGuide from "@/components/SetupGuide";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastContainer from "@/components/Toast";
import TemplateBuilder from "@/components/TemplateBuilder";
import { useFlowStore } from "@/store/store";
import { ArrowLeft, Sparkles, Code2, Eye, Zap, Globe } from "lucide-react";

/* ── Animated Logo ── */
function AnimatedLogo() {
  return (
    <div className="relative w-8 h-8 group">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 opacity-70 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-500" />
      {/* Inner icon */}
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
      </div>
    </div>
  );
}

/* ── Live Status Badge ── */
function StatusBadge() {
  const isRunning = useFlowStore((s) => s.isRunning);
  const currentView = useFlowStore((s) => s.currentView);

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
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
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
  const currentView = useFlowStore((s) => s.currentView);
  const setView = useFlowStore((s) => s.setView);

  return (
    <header className="h-14 flex-shrink-0 flex items-center px-5 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl z-50 relative overflow-hidden">
      {/* Subtle gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="flex items-center gap-3">
        {currentView === "canvas" && (
          <button
            onClick={() => setView("setup")}
            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200 mr-0.5"
            title="설정으로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <AnimatedLogo />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white/95 leading-none">
            Agentic Web Builder
          </span>
          <span className="text-[10px] text-white/25 font-medium tracking-wider mt-0.5">
            AI-Powered Multi-Agent Platform
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <StatusBadge />
        <div className="h-4 w-px bg-white/[0.08]" />
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
          <Globe className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/30 font-mono">
            v1.0.0
          </span>
        </div>
      </div>
    </header>
  );
}

/* ── Setup View: Full-page survey wizard ── */
function SetupView() {
  return (
    <div className="flex-1 flex overflow-hidden bg-gray-950">
      <TemplateBuilder />
    </div>
  );
}

/* ── Canvas View: React Flow + Detail + Code/Preview ── */
function CanvasView() {
  const [bottomTab, setBottomTab] = useState<"code" | "preview">("code");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex flex-1 overflow-hidden bg-gray-950 transition-all duration-500"
      style={{
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-950 relative">
        {/* Pipeline Progress Bar */}
        <PipelineProgress />
        {/* Canvas (top) */}
        <div className="flex-[3] min-h-0 overflow-hidden">
          <FlowCanvas />
        </div>
        {/* Bottom Panel: Tab Bar + Content */}
        <div className="flex-[2] min-h-0 flex flex-col overflow-hidden border-t border-white/[0.06]">
          {/* Tab Bar */}
          <div className="flex items-center gap-0 bg-gray-900/50 border-b border-white/[0.06] px-3 flex-shrink-0">
            <button
              onClick={() => setBottomTab("code")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all duration-200 ${bottomTab === "code"
                  ? "border-indigo-400 text-indigo-300 bg-indigo-400/5"
                  : "border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.02]"
                }`}
              aria-label="코드 보기"
            >
              <Code2 className="w-3.5 h-3.5" />
              코드
            </button>
            <button
              onClick={() => setBottomTab("preview")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all duration-200 ${bottomTab === "preview"
                  ? "border-emerald-400 text-emerald-300 bg-emerald-400/5"
                  : "border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.02]"
                }`}
              aria-label="프리뷰 보기"
            >
              <Eye className="w-3.5 h-3.5" />
              프리뷰 / 배포
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {bottomTab === "code" ? <CodePreviewPanel /> : <PreviewPanel />}
          </div>
        </div>
      </main>
      <NodeDetailPanel />
    </div>
  );
}

/* ── Main Page ── */
export default function Home() {
  const currentView = useFlowStore((s) => s.currentView);
  const [viewKey, setViewKey] = useState(currentView);
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
      <div className="flex flex-col h-screen w-screen overflow-hidden font-[family-name:var(--font-geist-sans)]" role="application" aria-label="Agentic Web Builder">
        <TopBar />
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? "scale(0.98)" : "scale(1)",
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

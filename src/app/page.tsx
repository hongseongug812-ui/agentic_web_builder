"use client";

import { useState } from "react";
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
import { ArrowLeft, Sparkles, Code2, Eye } from "lucide-react";

/* ── Shared Top Bar ── */
function TopBar() {
  const currentView = useFlowStore((s) => s.currentView);
  const setView = useFlowStore((s) => s.setView);

  return (
    <header className="h-12 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-sm z-10">
      <div className="flex items-center gap-2">
        {currentView === "canvas" && (
          <button
            onClick={() => setView("setup")}
            className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors mr-1"
            title="설정으로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white/90">
          Agentic Web Builder
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-white/30 font-[family-name:var(--font-geist-mono)]">
          v0.5.0
        </span>
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

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-950 animate-[scaleIn_0.3s_ease-out]">
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
          <div className="flex items-center gap-0 bg-gray-900/50 border-b border-white/[0.06] px-2 flex-shrink-0">
            <button
              onClick={() => setBottomTab("code")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${bottomTab === "code"
                  ? "border-indigo-400 text-indigo-300"
                  : "border-transparent text-white/30 hover:text-white/50"
                }`}
              aria-label="코드 보기"
            >
              <Code2 className="w-3.5 h-3.5" />
              코드
            </button>
            <button
              onClick={() => setBottomTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${bottomTab === "preview"
                  ? "border-emerald-400 text-emerald-300"
                  : "border-transparent text-white/30 hover:text-white/50"
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

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-screen overflow-hidden font-[family-name:var(--font-geist-sans)]" role="application" aria-label="Agentic Web Builder">
        <TopBar />
        {currentView === "setup" ? (
          <>
            <SetupGuide />
            <SetupView />
          </>
        ) : (
          <CanvasView />
        )}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}

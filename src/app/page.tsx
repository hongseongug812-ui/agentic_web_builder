"use client";

import { useState } from "react";
import FlowCanvas from "@/components/FlowCanvas";
import NodeDetailPanel from "@/components/NodeDetailPanel";
import CodePreviewPanel from "@/components/CodePreviewPanel";
import PipelineProgress from "@/components/PipelineProgress";
import SetupGuide from "@/components/SetupGuide";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastContainer from "@/components/Toast";
import { useFlowStore, TEMPLATES, TEMPLATE_CATEGORIES } from "@/store/store";
import { ArrowLeft, Sparkles, Check } from "lucide-react";

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
          v0.4.0
        </span>
      </div>
    </header>
  );
}

/* ── Template Preview Card (collage style, dark theme) ── */
function TemplateCard({ template, isSelected, onClick }: {
  template: typeof TEMPLATES[number];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative text-left rounded-xl overflow-hidden transition-all duration-200 ease-out
        ${isSelected
          ? "ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/20 -translate-y-1"
          : "ring-1 ring-white/[0.08] hover:ring-white/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
        }
      `}
    >
      {/* Preview images collage */}
      <div className="relative bg-white/[0.02]">
        <div className="grid grid-cols-2 gap-[2px]">
          {/* Large main image */}
          <div className="col-span-1 row-span-2">
            <img
              src={template.previews[0]}
              alt={template.name}
              className="w-full h-[180px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
          {/* Two smaller images */}
          <div>
            <img
              src={template.previews[1]}
              alt=""
              className="w-full h-[89px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
          <div>
            <img
              src={template.previews[2]}
              alt=""
              className="w-full h-[89px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* Subtle overlay on hover */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${isSelected ? "bg-indigo-500/5" : "bg-transparent group-hover:bg-white/[0.03]"}`} />

        {/* Selected badge */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className={`px-3.5 py-3 transition-colors ${isSelected ? "bg-indigo-500/[0.08]" : "bg-white/[0.02] group-hover:bg-white/[0.04]"}`}>
        <p className={`text-[13px] font-semibold ${isSelected ? "text-indigo-300" : "text-white/70 group-hover:text-white/90"}`}>
          {template.name}
        </p>
      </div>
    </button>
  );
}

/* ── Setup View: Full page template gallery (dark theme) ── */
function SetupView() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const selectedTemplateId = useFlowStore((s) => s.selectedTemplateId);
  const setTemplate = useFlowStore((s) => s.setTemplate);
  const runSequence = useFlowStore((s) => s.runSequence);
  const isRunning = useFlowStore((s) => s.isRunning);

  const filteredTemplates = selectedCategory === "전체"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === selectedCategory);

  // Count per category
  const categoryCounts: Record<string, number> = { "전체": TEMPLATES.length };
  TEMPLATES.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const handleGenerate = () => {
    if (isRunning) return;
    runSequence();
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-950">
      {/* ── Left: Category Filter ── */}
      <nav className="w-[180px] flex-shrink-0 bg-gray-950 border-r border-white/[0.06] py-5 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => setSelectedCategory(cat)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all duration-150
                  ${selectedCategory === cat
                    ? "bg-indigo-500/15 text-indigo-300 font-semibold"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80 font-medium"
                  }
                `}
              >
                <span>{cat}</span>
                <span className={`text-[11px] tabular-nums ${selectedCategory === cat ? "text-indigo-400/60" : "text-white/25"}`}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Right: Gallery Grid ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Title section */}
        <div className="text-center pt-10 pb-8 px-6">
          <h1 className="text-[28px] font-extrabold text-white/90 tracking-tight mb-2">
            홈페이지 스킨
          </h1>
          <p className="text-[15px] text-white/40">
            원하는 디자인 스킨을 선택하여 나만의 사이트를 만들어 보세요.
          </p>
        </div>

        {/* Template grid */}
        <div className="max-w-[1200px] mx-auto px-8 pb-32">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isSelected={selectedTemplateId === t.id}
                onClick={() => setTemplate(t.id)}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/30 text-sm">해당 카테고리에 템플릿이 없습니다</p>
            </div>
          )}
        </div>

        {/* Fixed bottom generate bar */}
        {selectedTemplateId && (
          <div className="fixed bottom-0 left-[180px] right-0 h-[68px] bg-gray-950/90 backdrop-blur-md border-t border-white/[0.06] flex items-center justify-between px-8 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-white/[0.08]">
                <img
                  src={TEMPLATES.find((t) => t.id === selectedTemplateId)?.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">
                  {TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}
                </p>
                <p className="text-[11px] text-white/30">
                  {TEMPLATES.find((t) => t.id === selectedTemplateId)?.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isRunning}
              className="h-10 px-7 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-white/[0.06] disabled:to-white/[0.06] disabled:text-white/20 text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Sparkles className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "생성중..." : "이 템플릿으로 시작하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Canvas View: React Flow + Detail + Code ── */
function CanvasView() {
  return (
    <div className="flex flex-1 overflow-hidden bg-gray-950 animate-[scaleIn_0.3s_ease-out]">
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-950 relative">
        {/* Pipeline Progress Bar */}
        <PipelineProgress />
        {/* Canvas (top) */}
        <div className="flex-[3] min-h-0 overflow-hidden">
          <FlowCanvas />
        </div>
        {/* Code Preview (bottom) */}
        <div className="flex-[2] min-h-0 overflow-hidden">
          <CodePreviewPanel />
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

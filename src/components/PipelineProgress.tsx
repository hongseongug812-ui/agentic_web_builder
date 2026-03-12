"use client";

import { useAgentStore } from "@/store";
import { RotateCcw, RefreshCw, AlertTriangle } from "lucide-react";

/**
 * 파이프라인 진행률 바 — 캔버스 상단에 표시
 * 에러 시: 어느 에이전트에서 실패했는지 + 재시도/처음부터 버튼
 * 경고 시: 경고 카운트 + 재시도 중 표시
 */
export default function PipelineProgress() {
    const isRunning      = useAgentStore((s) => s.isRunning);
    const step           = useAgentStore((s) => s.pipelineStep);
    const total          = useAgentStore((s) => s.pipelineTotal);
    const label          = useAgentStore((s) => s.pipelineLabel);
    const error          = useAgentStore((s) => s.error);
    const warnings       = useAgentStore((s) => s.warnings);
    const retryInfo      = useAgentStore((s) => s.retryInfo);
    const retryAvailable = useAgentStore((s) => s.retryAvailable);
    const retrySequence  = useAgentStore((s) => s.retrySequence);
    const runSequence    = useAgentStore((s) => s.runSequence);
    const resetAllAgents = useAgentStore((s) => s.resetAllAgents);
    const agents         = useAgentStore((s) => s.agents);

    if (!isRunning && !label && !error) return null;

    // Guard against total === 0 before division
    const pct = total > 0 ? Math.min((step / total) * 100, 100) : 0;
    const isComplete = label === "완료";
    const erroredAgent = agents.find((a) => a.status === "error");

    function handleRestart() {
        resetAllAgents();
        // Defer by one tick so reset propagates first
        setTimeout(() => runSequence(), 100);
    }

    const barColor = error ? "bg-red-500" : isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-indigo-400";
    const dotColor = error ? "bg-red-400" : isComplete ? "bg-emerald-400" : "bg-indigo-400 animate-pulse";
    const textColor = error ? "text-red-300" : isComplete ? "text-emerald-300" : "text-white/60";

    const statusText = error
        ? erroredAgent
            ? `${erroredAgent.name} 오류 발생`
            : "오류 발생"
        : label || "준비 중...";

    const errorDetail = error && error.length > 80 ? error.slice(0, 80) + "…" : error;

    return (
        <div className="absolute top-0 left-0 right-0 z-20 animate-[fadeInUp_0.3s_ease-out]">
            {/* Progress bar */}
            <div className="h-[3px] bg-white/[0.04]">
                <div
                    className={`h-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Label strip */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900/90 backdrop-blur-sm border-b border-white/[0.05]">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    <span className={`text-[11px] font-medium ${textColor}`}>{statusText}</span>
                    {errorDetail && (
                        <span
                            className="text-[10px] text-red-400/55 truncate"
                            title={error ?? undefined}
                        >
                            — {errorDetail}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {retryInfo && !error && (
                        <span className="text-[10px] text-amber-400/70 font-mono">
                            재시도 {retryInfo.attempt}/{retryInfo.maxAttempts}
                        </span>
                    )}
                    {warnings.length > 0 && !error && (
                        <span
                            className="flex items-center gap-1 text-[10px] text-amber-400/70"
                            title={warnings.join("\n")}
                        >
                            <AlertTriangle className="w-3 h-3" />
                            {warnings.length}
                        </span>
                    )}
                    {!error && !isComplete && total > 0 && !retryInfo && (
                        <span className="text-[10px] text-white/25 font-mono tabular-nums">
                            {Math.round(pct)}%
                        </span>
                    )}
                    {retryAvailable && (
                        <button
                            onClick={retrySequence}
                            title="마지막 에이전트부터 재시도"
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[10px] text-indigo-300 font-medium hover:bg-indigo-500/25 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            재시도
                        </button>
                    )}
                    {(error || retryAvailable) && (
                        <button
                            onClick={handleRestart}
                            title="처음부터 다시 생성"
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 font-medium hover:bg-white/[0.08] hover:text-white/60 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            처음부터
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

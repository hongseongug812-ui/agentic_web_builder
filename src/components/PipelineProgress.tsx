"use client";

import { useFlowStore } from "@/store/store";

/**
 * 파이프라인 진행률 바 — 캔버스 상단에 표시
 * WebSocket 이벤트로 실시간 업데이트
 */
export default function PipelineProgress() {
    const isRunning = useFlowStore((s) => s.isRunning);
    const step = useFlowStore((s) => s.pipelineStep);
    const total = useFlowStore((s) => s.pipelineTotal);
    const label = useFlowStore((s) => s.pipelineLabel);
    const error = useFlowStore((s) => s.error);
    const retryAvailable = useFlowStore((s) => s.retryAvailable);
    const retrySequence = useFlowStore((s) => s.retrySequence);

    if (!isRunning && !label && !error) return null;

    const pct = Math.min((step / total) * 100, 100);
    const isComplete = label === "완료";

    return (
        <div className="absolute top-0 left-0 right-0 z-20 animate-[fadeInUp_0.3s_ease-out]">
            {/* Progress bar */}
            <div className="h-1 bg-white/[0.04]">
                <div
                    className={`h-full transition-all duration-700 ease-out ${
                        error ? "bg-red-500" : isComplete ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Label strip */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900/90 backdrop-blur-sm border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    {isRunning && !error && (
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                    {isComplete && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    {error && (
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                    )}
                    <span className={`text-[11px] font-medium ${
                        error ? "text-red-300" : isComplete ? "text-emerald-300" : "text-white/60"
                    }`}>
                        {error ? "오류 발생" : label || "준비 중..."}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {!error && !isComplete && (
                        <span className="text-[10px] text-white/25 font-mono">
                            {Math.round(pct)}%
                        </span>
                    )}
                    {retryAvailable && (
                        <button
                            onClick={retrySequence}
                            className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[10px] text-indigo-300 font-medium hover:bg-indigo-500/25 transition-colors"
                        >
                            재시도
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

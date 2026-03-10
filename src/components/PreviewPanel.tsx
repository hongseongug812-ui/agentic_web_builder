"use client";

import { useState, useEffect } from "react";
import {
    Play,
    Square,
    Rocket,
    ExternalLink,
    Loader2,
    Monitor,
    Smartphone,
    Copy,
    Check,
    RefreshCw,
} from "lucide-react";
import { useFlowStore, type DebateMessage } from "@/store/store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 프리뷰 + 배포 패널
 * - 생성된 코드를 라이브 프리뷰 (iframe)
 * - Vercel 원클릭 배포
 */
export default function PreviewPanel() {
    const debateMessages = useFlowStore((s) => s.debateMessages);
    const isRunning = useFlowStore((s) => s.isRunning);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployUrl, setDeployUrl] = useState<string | null>(null);
    const [deployError, setDeployError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [copied, setCopied] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    // 코드 메시지에서 파일 추출
    const codeMessage = debateMessages.find(
        (m: DebateMessage) => m.message_type === "code" && m.data
    );
    const files = (codeMessage?.data as Record<string, unknown>)?.files as
        | Array<{ path: string; code: string; language: string }>
        | undefined;
    const hasCode = !!files && files.length > 0;

    // 파이프라인 완료 시 자동 프리뷰 시작
    useEffect(() => {
        if (hasCode && !isRunning && !previewUrl) {
            handleStartPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasCode, isRunning]);

    async function handleStartPreview() {
        if (!files) return;
        setIsPreviewLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/preview/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    files,
                    title: "AI Generated Preview",
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setPreviewUrl(`${API_BASE}${data.url}`);
                setIframeKey((k) => k + 1);
            }
        } catch {
            /* silent */
        } finally {
            setIsPreviewLoading(false);
        }
    }

    async function handleStopPreview() {
        try {
            await fetch(`${API_BASE}/api/preview/stop`, { method: "POST" });
        } catch {
            /* silent */
        }
        setPreviewUrl(null);
    }

    async function handleDeploy() {
        if (!files) return;
        setIsDeploying(true);
        setDeployError(null);
        setDeployUrl(null);
        try {
            const res = await fetch(`${API_BASE}/api/deploy/vercel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    files,
                    project_name: "agentic-preview",
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setDeployUrl(data.url);
            } else {
                setDeployError(data.detail || "배포 실패");
            }
        } catch (err) {
            setDeployError(err instanceof Error ? err.message : "네트워크 오류");
        } finally {
            setIsDeploying(false);
        }
    }

    function handleCopyUrl() {
        if (deployUrl) {
            navigator.clipboard.writeText(deployUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (!hasCode) return null;

    return (
        <div className="flex flex-col h-full bg-gray-950">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/50 font-medium">라이브 프리뷰</span>

                    {/* View mode toggle */}
                    <div className="flex items-center bg-white/[0.04] rounded-md border border-white/[0.06] p-0.5">
                        <button
                            onClick={() => setViewMode("desktop")}
                            className={`p-1 rounded transition-colors ${viewMode === "desktop" ? "bg-indigo-500/20 text-indigo-300" : "text-white/30 hover:text-white/50"}`}
                            aria-label="데스크탑 뷰"
                        >
                            <Monitor className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setViewMode("mobile")}
                            className={`p-1 rounded transition-colors ${viewMode === "mobile" ? "bg-indigo-500/20 text-indigo-300" : "text-white/30 hover:text-white/50"}`}
                            aria-label="모바일 뷰"
                        >
                            <Smartphone className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Refresh */}
                    {previewUrl && (
                        <button
                            onClick={() => setIframeKey((k) => k + 1)}
                            className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                            aria-label="프리뷰 새로고침"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Preview toggle */}
                    {!previewUrl ? (
                        <button
                            onClick={handleStartPreview}
                            disabled={isPreviewLoading}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-[10px] text-emerald-300 font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                        >
                            {isPreviewLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Play className="w-3 h-3" />
                            )}
                            프리뷰
                        </button>
                    ) : (
                        <button
                            onClick={handleStopPreview}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/25 text-[10px] text-red-300 font-medium hover:bg-red-500/25 transition-colors"
                        >
                            <Square className="w-3 h-3" />
                            중지
                        </button>
                    )}

                    {/* Deploy */}
                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-[10px] text-indigo-300 font-medium hover:bg-indigo-500/25 transition-colors disabled:opacity-50"
                    >
                        {isDeploying ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Rocket className="w-3 h-3" />
                        )}
                        배포
                    </button>
                </div>
            </div>

            {/* Deploy URL banner */}
            {deployUrl && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/[0.06] border-b border-emerald-500/20 animate-[fadeInUp_0.3s_ease-out]">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-300 font-medium">배포 완료!</span>
                    <a
                        href={deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-0.5 font-mono"
                    >
                        {deployUrl}
                        <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <button
                        onClick={handleCopyUrl}
                        className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
                        aria-label="URL 복사"
                    >
                        {copied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                            <Copy className="w-3 h-3" />
                        )}
                    </button>
                </div>
            )}

            {/* Deploy error */}
            {deployError && (
                <div className="px-3 py-2 bg-red-500/[0.06] border-b border-red-500/20 text-[10px] text-red-300 animate-[fadeInUp_0.3s_ease-out]">
                    ⚠️ {deployError}
                </div>
            )}

            {/* Preview iframe */}
            <div className="flex-1 flex items-center justify-center p-2 bg-[#0a0a0a]">
                {previewUrl ? (
                    <div
                        className={`bg-white rounded-lg overflow-hidden shadow-2xl shadow-black/60 transition-all duration-300 ${
                            viewMode === "mobile" ? "w-[375px] h-[667px]" : "w-full h-full"
                        }`}
                    >
                        <iframe
                            key={iframeKey}
                            src={previewUrl}
                            className="w-full h-full border-0"
                            title="Live Preview"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                            <Monitor className="w-7 h-7 text-white/10" />
                        </div>
                        <p className="text-[11px] text-white/25 mb-1">프리뷰 준비 중...</p>
                        <p className="text-[9px] text-white/15">코드 생성이 완료되면 자동으로 시작됩니다</p>
                    </div>
                )}
            </div>
        </div>
    );
}

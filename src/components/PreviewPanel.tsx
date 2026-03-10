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
    KeyRound,
    MessageSquare,
    ThumbsUp,
    Maximize2,
    Minimize2,
} from "lucide-react";
import { useFlowStore } from "@/store/store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 프리뷰 + 배포 패널
 * - 생성된 코드를 라이브 프리뷰 (iframe)
 * - Vercel 원클릭 배포
 * - 사용자 피드백: 승인 / 수정요청
 */
export default function PreviewPanel() {
    const agentOutputData = useFlowStore((s) => s.agentOutputData);
    const isRunning = useFlowStore((s) => s.isRunning);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployUrl, setDeployUrl] = useState<string | null>(null);
    const [deployError, setDeployError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [copied, setCopied] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [vercelToken, setVercelToken] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("vercel_token") || "";
        }
        return "";
    });

    // User feedback state
    const [showRevisionInput, setShowRevisionInput] = useState(false);
    const [revisionText, setRevisionText] = useState("");
    const [isRevising, setIsRevising] = useState(false);
    const [approved, setApproved] = useState(false);

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false);

    // agentOutputData에서 파일 추출 (CodePreviewPanel과 같은 방식)
    const feOutput = agentOutputData["frontend-agent"] as { data?: { files?: Array<{ path: string; code: string; language: string }> } } | undefined;
    const beOutput = agentOutputData["backend-agent"] as { data?: { files?: Array<{ path: string; code: string; language: string }> } } | undefined;
    // Also check new agent IDs
    const feLeadOutput = agentOutputData["fe-lead-agent"] as { data?: { files?: Array<{ path: string; code: string; language: string }> } } | undefined;
    const beLeadOutput = agentOutputData["be-lead-agent"] as { data?: { files?: Array<{ path: string; code: string; language: string }> } } | undefined;
    const feFiles = feOutput?.data?.files || feLeadOutput?.data?.files || [];
    const beFiles = beOutput?.data?.files || beLeadOutput?.data?.files || [];
    const files = [...feFiles, ...beFiles];
    const hasCode = files.length > 0;

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
            setPreviewUrl(null);
        } catch {
            /* silent */
        }
    }

    async function handleDeploy() {
        if (!files || files.length === 0) return;
        const token = vercelToken || (typeof window !== "undefined" ? localStorage.getItem("vercel_token") || "" : "");
        setIsDeploying(true);
        setDeployError(null);
        try {
            const res = await fetch(`${API_BASE}/api/deploy/vercel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    files,
                    project_name: "agentic-preview",
                    framework: "Next.js 14",
                    vercel_token: token || undefined,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setDeployUrl(data.url);
            } else {
                const errData = await res.json().catch(() => ({ detail: "배포 실패" }));
                setDeployError(errData.detail || "배포 실패");
            }
        } catch {
            setDeployError("네트워크 오류");
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

    async function handleRevisionSubmit() {
        if (!revisionText.trim()) return;
        setIsRevising(true);
        try {
            const provider = typeof window !== "undefined" ? localStorage.getItem("selected_provider") || "gpt" : "gpt";
            const res = await fetch(`${API_BASE}/api/revise`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback: revisionText, provider }),
            });
            if (res.ok) {
                setRevisionText("");
                setShowRevisionInput(false);
                // Refresh preview
                setTimeout(() => handleStartPreview(), 1000);
            }
        } catch {
            /* silent */
        } finally {
            setIsRevising(false);
        }
    }

    if (!hasCode) return null;

    const containerClass = isFullscreen
        ? "fixed inset-0 z-50 flex flex-col bg-gray-950"
        : "flex flex-col h-full bg-gray-950";

    return (
        <div className={containerClass}>
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

                    {/* Fullscreen toggle */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1 rounded transition-colors text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                        title={isFullscreen ? "축소" : "전체화면"}
                    >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Preview controls */}
                    {previewUrl ? (
                        <>
                            <button
                                onClick={() => { setIframeKey(k => k + 1); }}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
                                title="새로고침"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </button>
                            <button
                                onClick={handleStopPreview}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Square className="w-3 h-3" /> 중지
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleStartPreview}
                            disabled={isPreviewLoading}
                            className="flex items-center gap-1 px-3 py-1 rounded-md text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                            {isPreviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            프리뷰
                        </button>
                    )}

                    {/* Vercel token toggle */}
                    <button
                        onClick={() => setShowTokenInput(!showTokenInput)}
                        className={`p-1 rounded transition-colors ${vercelToken ? "text-emerald-400/60 hover:text-emerald-400" : "text-white/20 hover:text-white/40"}`}
                        title="Vercel 토큰 설정"
                    >
                        <KeyRound className="w-3 h-3" />
                    </button>

                    {/* Deploy button */}
                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying || !hasCode}
                        className="flex items-center gap-1 px-3 py-1 rounded-md text-[10px] bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                    >
                        {isDeploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                        배포
                    </button>
                </div>
            </div>

            {/* Token input */}
            {showTokenInput && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-gray-900/30">
                    <KeyRound className="w-3 h-3 text-white/20 flex-shrink-0" />
                    <input
                        type="password"
                        value={vercelToken}
                        onChange={(e) => {
                            setVercelToken(e.target.value);
                            localStorage.setItem("vercel_token", e.target.value);
                        }}
                        placeholder="Vercel Access Token 입력 (vercel.com/account/tokens)"
                        className="flex-1 bg-transparent border-none outline-none text-[11px] text-white/70 placeholder-white/20 font-mono"
                    />
                    {vercelToken && (
                        <span className="text-[9px] text-emerald-400/70 flex-shrink-0">✓ 저장됨</span>
                    )}
                </div>
            )}

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
                        className={`bg-white rounded-lg overflow-hidden shadow-2xl shadow-black/60 transition-all duration-300 ${viewMode === "mobile" ? "w-[375px] h-[667px]" : "w-full h-full"
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

            {/* User feedback panel — 생성 완료 후 표시 */}
            {hasCode && !isRunning && previewUrl && !approved && (
                <div className="border-t border-white/[0.08] bg-gradient-to-r from-gray-900/80 to-gray-900/50 px-4 py-3">
                    {!showRevisionInput ? (
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/50">결과물이 마음에 드시나요?</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowRevisionInput(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                                        bg-amber-500/10 text-amber-300 border border-amber-500/20
                                        hover:bg-amber-500/20 transition-all"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    수정 요청
                                </button>
                                <button
                                    onClick={() => setApproved(true)}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium
                                        bg-emerald-500/15 text-emerald-300 border border-emerald-500/20
                                        hover:bg-emerald-500/25 transition-all"
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    만족! 승인
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-amber-300/80 font-medium">✏️ 수정할 부분을 알려주세요</span>
                                <button onClick={() => setShowRevisionInput(false)} className="text-[10px] text-white/30 hover:text-white/50">취소</button>
                            </div>
                            <textarea
                                value={revisionText}
                                onChange={(e) => setRevisionText(e.target.value)}
                                placeholder="예: 히어로 섹션 배경색을 파란색으로 변경해주세요&#10;네비게이션 메뉴에 '블로그' 링크 추가해주세요"
                                className="w-full h-20 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-amber-500/30 resize-none"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleRevisionSubmit}
                                    disabled={isRevising || !revisionText.trim()}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium
                                        bg-amber-500/15 text-amber-300 border border-amber-500/20
                                        hover:bg-amber-500/25 transition-all disabled:opacity-50"
                                >
                                    {isRevising ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                                    {isRevising ? "수정 중..." : "수정 요청 보내기"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Approved banner */}
            {approved && (
                <div className="border-t border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] text-emerald-300 font-medium">승인 완료! 배포하거나 코드를 다운로드하세요.</span>
                </div>
            )}
        </div>
    );
}

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
    Cloud,
} from "lucide-react";
import { useAgentStore } from "@/store";
import { useEditorStore } from "@/store/editorStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 프리뷰 + 배포 패널
 * - 생성된 코드를 라이브 프리뷰 (iframe)
 * - Vercel 원클릭 배포
 * - 사용자 피드백: 승인 / 수정요청
 */
export default function PreviewPanel() {
    const agentOutputData = useAgentStore((s) => s.agentOutputData);
    const isRunning = useAgentStore((s) => s.isRunning);
    const currentIR = useEditorStore((s) => s.currentIR);
    const updateSlot = useEditorStore((s) => s.updateSlot);
    const updateStyleColor = useEditorStore((s) => s.updateStyleColor);
    const updateStyleOption = useEditorStore((s) => s.updateStyleOption);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployUrl, setDeployUrl] = useState<string | null>(null);
    const [deployError, setDeployError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [copied, setCopied] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [deployTarget, setDeployTarget] = useState<"vercel" | "cloudflare">("vercel");
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [vercelToken, setVercelToken] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("vercel_token") || "";
        }
        return "";
    });
    const [cfToken, setCfToken] = useState(() =>
        typeof window !== "undefined" ? localStorage.getItem("cf_token") || "" : ""
    );
    const [cfAccountId, setCfAccountId] = useState(() =>
        typeof window !== "undefined" ? localStorage.getItem("cf_account_id") || "" : ""
    );

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

    async function handleDeployCloudflare() {
        if (!files || files.length === 0) return;
        setIsDeploying(true);
        setDeployError(null);
        try {
            const res = await fetch(`${API_BASE}/api/deploy/cloudflare`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    files,
                    project_name: "agentic-preview",
                    cf_token: cfToken || undefined,
                    cf_account_id: cfAccountId || undefined,
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

            // ── 1. 분류기 호출 ──
            const classifyRes = await fetch(`${API_BASE}/api/classify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: revisionText,
                    current_ir: currentIR ?? {},
                    provider,
                }),
            });

            if (classifyRes.ok) {
                const cls = await classifyRes.json();

                // ── slot_edit: IR 직접 수정 (LLM 무호출) ──
                if (cls.category === "slot_edit" && currentIR) {
                    const compId = resolveComponentId(cls.target_component);
                    const slotKey = cls.target_slot ?? "title";
                    const newValue = cls.new_value ?? revisionText;
                    if (compId) {
                        updateSlot(compId, slotKey, newValue);
                        setRevisionText("");
                        setShowRevisionInput(false);
                        setIsRevising(false);
                        return;
                    }
                }

                // ── style_edit: styleTokens 직접 수정 (LLM 무호출) ──
                if (cls.category === "style_edit" && cls.new_value) {
                    const key = cls.style_key ?? "primary";
                    if (["primary", "secondary", "accent", "background", "text", "muted"].includes(key)) {
                        updateStyleColor(key, cls.new_value);
                    } else if (["compact", "normal", "relaxed"].includes(cls.new_value)) {
                        updateStyleOption("spacing", cls.new_value);
                    } else if (["none", "sm", "md", "lg", "full"].includes(cls.new_value)) {
                        updateStyleOption("borderRadius", cls.new_value);
                    }
                    setRevisionText("");
                    setShowRevisionInput(false);
                    setIsRevising(false);
                    return;
                }
            }

            // ── structure: 기존 에이전트 파이프라인 ──
            const res = await fetch(`${API_BASE}/api/revise`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback: revisionText, provider }),
            });
            if (res.ok) {
                setRevisionText("");
                setShowRevisionInput(false);
                setTimeout(() => handleStartPreview(), 1000);
            }
        } catch {
            /* silent */
        } finally {
            setIsRevising(false);
        }
    }

    function resolveComponentId(targetType: string | null): string | null {
        if (!currentIR || !targetType) return null;
        for (const page of currentIR.pages) {
            const comp = page.components.find(
                (c) => c.type.toLowerCase() === targetType.toLowerCase()
            );
            if (comp) return comp.id;
        }
        return null;
    }

    if (!hasCode) return null;

    const containerClass = isFullscreen
        ? "fixed inset-0 z-50 flex flex-col bg-gray-950"
        : "flex flex-col h-full bg-gray-950";

    return (
        <div className={containerClass}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-[#070f1e]/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
                    <span className="text-[10px] text-white/35 font-medium tracking-wide uppercase">라이브 프리뷰</span>

                    <div className="w-px h-3 bg-white/[0.06] mx-0.5" />

                    {/* View mode toggle */}
                    <div className="flex items-center bg-white/[0.03] rounded-md border border-white/[0.06] p-0.5 gap-px">
                        <button
                            onClick={() => setViewMode("desktop")}
                            className={`p-1 rounded transition-all duration-150 ${viewMode === "desktop" ? "bg-indigo-500/20 text-indigo-300" : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"}`}
                            aria-label="데스크탑 뷰"
                        >
                            <Monitor className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setViewMode("mobile")}
                            className={`p-1 rounded transition-all duration-150 ${viewMode === "mobile" ? "bg-indigo-500/20 text-indigo-300" : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"}`}
                            aria-label="모바일 뷰"
                        >
                            <Smartphone className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Fullscreen toggle */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded-md transition-all text-white/20 hover:text-white/55 hover:bg-white/[0.04]"
                        title={isFullscreen ? "축소" : "전체화면"}
                    >
                        {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    {/* Preview controls */}
                    {previewUrl ? (
                        <>
                            <button
                                onClick={() => { setIframeKey(k => k + 1); }}
                                className="p-1.5 rounded-md text-white/25 hover:text-white/55 hover:bg-white/[0.04] transition-all"
                                title="새로고침"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </button>
                            <button
                                onClick={handleStopPreview}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
                            >
                                <Square className="w-2.5 h-2.5" /> 중지
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleStartPreview}
                            disabled={isPreviewLoading}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-500/[0.09] text-emerald-400/80 border border-emerald-500/20 hover:bg-emerald-500/[0.16] hover:text-emerald-300 transition-all disabled:opacity-50"
                        >
                            {isPreviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            프리뷰
                        </button>
                    )}

                    <div className="w-px h-3 bg-white/[0.06] mx-0.5" />

                    {/* Deploy target toggle */}
                    <div className="flex items-center bg-white/[0.03] rounded-md border border-white/[0.06] p-0.5 gap-px">
                        <button
                            onClick={() => setDeployTarget("vercel")}
                            className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${deployTarget === "vercel" ? "bg-indigo-500/20 text-indigo-300" : "text-white/22 hover:text-white/45"}`}
                        >
                            Vercel
                        </button>
                        <button
                            onClick={() => setDeployTarget("cloudflare")}
                            className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${deployTarget === "cloudflare" ? "bg-orange-500/20 text-orange-300" : "text-white/22 hover:text-white/45"}`}
                        >
                            <Cloud className="w-2 h-2" />CF
                        </button>
                    </div>

                    {/* Credential toggle */}
                    <button
                        onClick={() => setShowTokenInput(!showTokenInput)}
                        className={`p-1.5 rounded-md transition-all ${
                            (deployTarget === "vercel" && vercelToken) || (deployTarget === "cloudflare" && cfToken && cfAccountId)
                                ? "text-emerald-400/55 hover:text-emerald-400 hover:bg-emerald-500/[0.08]"
                                : "text-white/18 hover:text-white/40 hover:bg-white/[0.04]"
                        }`}
                        title="배포 자격증명 설정"
                    >
                        <KeyRound className="w-3 h-3" />
                    </button>

                    {/* Deploy button */}
                    <button
                        onClick={deployTarget === "vercel" ? handleDeploy : handleDeployCloudflare}
                        disabled={isDeploying || !hasCode}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-semibold border transition-all disabled:opacity-50 ${
                            deployTarget === "cloudflare"
                                ? "bg-orange-500/[0.09] text-orange-300/80 border-orange-500/20 hover:bg-orange-500/[0.16] hover:text-orange-200"
                                : "bg-indigo-500/[0.09] text-indigo-300/80 border-indigo-500/20 hover:bg-indigo-500/[0.16] hover:text-indigo-200"
                        }`}
                    >
                        {isDeploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                        배포
                    </button>
                </div>
            </div>

            {/* Credential input */}
            {showTokenInput && deployTarget === "vercel" && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-gray-900/30">
                    <KeyRound className="w-3 h-3 text-white/20 flex-shrink-0" />
                    <input
                        type="password"
                        value={vercelToken}
                        onChange={(e) => {
                            setVercelToken(e.target.value);
                            localStorage.setItem("vercel_token", e.target.value);
                        }}
                        placeholder="Vercel Access Token (vercel.com/account/tokens)"
                        className="flex-1 bg-transparent border-none outline-none text-[11px] text-white/70 placeholder-white/20 font-mono"
                    />
                    {vercelToken && <span className="text-[9px] text-emerald-400/70 flex-shrink-0">✓ 저장됨</span>}
                </div>
            )}
            {showTokenInput && deployTarget === "cloudflare" && (
                <div className="flex flex-col gap-1.5 px-3 py-2 border-b border-white/[0.06] bg-gray-900/30">
                    <div className="flex items-center gap-2">
                        <KeyRound className="w-3 h-3 text-white/20 flex-shrink-0" />
                        <input
                            type="password"
                            value={cfToken}
                            onChange={(e) => { setCfToken(e.target.value); localStorage.setItem("cf_token", e.target.value); }}
                            placeholder="Cloudflare API Token (dash.cloudflare.com/profile/api-tokens)"
                            className="flex-1 bg-transparent border-none outline-none text-[11px] text-white/70 placeholder-white/20 font-mono"
                        />
                        {cfToken && <span className="text-[9px] text-emerald-400/70 flex-shrink-0">✓</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Cloud className="w-3 h-3 text-white/20 flex-shrink-0" />
                        <input
                            type="text"
                            value={cfAccountId}
                            onChange={(e) => { setCfAccountId(e.target.value); localStorage.setItem("cf_account_id", e.target.value); }}
                            placeholder="Cloudflare Account ID (대시보드 우측 사이드바)"
                            className="flex-1 bg-transparent border-none outline-none text-[11px] text-white/70 placeholder-white/20 font-mono"
                        />
                        {cfAccountId && <span className="text-[9px] text-emerald-400/70 flex-shrink-0">✓</span>}
                    </div>
                </div>
            )}

            {/* Deploy URL banner */}
            {deployUrl && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/[0.05] border-b border-emerald-500/[0.18] animate-[fadeInDown_0.3s_ease-out]">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400/80 font-semibold">배포 완료</span>
                    </div>
                    <div className="w-px h-3 bg-white/[0.08]" />
                    <a
                        href={deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-[10px] text-indigo-400/80 hover:text-indigo-300 flex items-center gap-0.5 font-mono min-w-0 truncate"
                    >
                        <span className="truncate">{deployUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 ml-0.5" />
                    </a>
                    <button
                        onClick={handleCopyUrl}
                        className="p-1 rounded-md text-white/25 hover:text-white/55 hover:bg-white/[0.06] transition-all flex-shrink-0"
                        aria-label="URL 복사"
                    >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                </div>
            )}

            {/* Deploy error */}
            {deployError && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/[0.05] border-b border-red-500/[0.18] text-[10px] text-red-400/70 animate-[fadeInDown_0.3s_ease-out]">
                    <span className="text-red-500/70">⚠</span> {deployError}
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
                <div className="border-t border-white/[0.06] bg-[#070f1e]/70 backdrop-blur-sm px-4 py-2.5">
                    {!showRevisionInput ? (
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/35 font-medium">결과물이 마음에 드시나요?</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setShowRevisionInput(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold
                                        bg-amber-500/[0.08] text-amber-300/70 border border-amber-500/[0.18]
                                        hover:bg-amber-500/[0.15] hover:text-amber-200 transition-all"
                                >
                                    <MessageSquare className="w-3 h-3" />
                                    수정 요청
                                </button>
                                <button
                                    onClick={() => setApproved(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold
                                        bg-emerald-500/[0.1] text-emerald-300/80 border border-emerald-500/[0.22]
                                        hover:bg-emerald-500/[0.18] hover:text-emerald-200 transition-all"
                                >
                                    <ThumbsUp className="w-3 h-3" />
                                    승인
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-amber-300/70 font-semibold">수정할 부분을 알려주세요</span>
                                <button onClick={() => setShowRevisionInput(false)} className="text-[10px] text-white/25 hover:text-white/50 transition-colors">취소</button>
                            </div>
                            <textarea
                                value={revisionText}
                                onChange={(e) => setRevisionText(e.target.value)}
                                placeholder="예: 히어로 섹션 배경색을 파란색으로 변경해주세요"
                                className="w-full h-16 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] text-white/65 placeholder:text-white/18 outline-none focus:border-amber-500/25 resize-none transition-all"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleRevisionSubmit}
                                    disabled={isRevising || !revisionText.trim()}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-semibold
                                        bg-amber-500/[0.1] text-amber-300/80 border border-amber-500/[0.22]
                                        hover:bg-amber-500/[0.18] hover:text-amber-200 transition-all disabled:opacity-50"
                                >
                                    {isRevising ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                                    {isRevising ? "수정 중..." : "보내기"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Approved banner */}
            {approved && (
                <div className="border-t border-emerald-500/[0.18] bg-emerald-500/[0.05] px-4 py-2 flex items-center gap-2 animate-[fadeInUp_0.3s_ease-out]">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400/70" />
                    <span className="text-[10px] text-emerald-300/70 font-medium">승인 완료! 배포하거나 코드를 다운로드하세요.</span>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { Download, FileCode, Folder, Copy, Check } from "lucide-react";
import { useAgentStore } from "@/store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ── Language → syntax highlight color ── */
const langColors: Record<string, string> = {
    tsx: "text-blue-400",
    ts: "text-blue-400",
    jsx: "text-yellow-300",
    js: "text-yellow-300",
    python: "text-emerald-400",
    py: "text-emerald-400",
    css: "text-pink-400",
    json: "text-amber-300",
    html: "text-orange-400",
};

interface GeneratedFile {
    path: string;
    code: string;
    language: string;
}

export default function CodePreviewPanel() {
    const agentOutputData = useAgentStore((s) => s.agentOutputData);
    const isRunning = useAgentStore((s) => s.isRunning);
    const [activeFile, setActiveFile] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<"frontend" | "backend">("frontend");
    const [copied, setCopied] = useState(false);

    const feOutput = agentOutputData["frontend-agent"] as { type?: string; data?: { files?: GeneratedFile[]; framework?: string; summary?: string } } | undefined;
    const beOutput = agentOutputData["backend-agent"] as { type?: string; data?: { files?: GeneratedFile[]; framework?: string; summary?: string } } | undefined;

    const feFiles = feOutput?.data?.files || [];
    const beFiles = beOutput?.data?.files || [];
    const files = activeTab === "frontend" ? feFiles : beFiles;
    const currentFile = files[activeFile];

    const hasContent = feFiles.length > 0 || beFiles.length > 0;

    const handleCopy = async () => {
        if (!currentFile) return;
        await navigator.clipboard.writeText(currentFile.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadZip = async () => {
        const allFiles = [...feFiles, ...beFiles];
        if (allFiles.length === 0) return;

        try {
            const res = await fetch(`${API_BASE}/api/export/zip`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_name: "generated-project",
                    files: allFiles,
                }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "generated-project.zip";
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("ZIP 내보내기 실패:", err);
        }
    };

    if (!hasContent && !isRunning) return null;

    return (
        <div className="flex flex-col h-full border-t border-white/[0.06] bg-gray-950 animate-[fadeInUp_0.3s_ease-out]">
            {/* Header */}
            <div className="h-10 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400/70" />
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Generated Code</span>
                </div>
                {hasContent && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                            title="코드 복사"
                        >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={handleDownloadZip}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                            title="ZIP 다운로드"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {!hasContent && isRunning ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                    <p className="text-xs text-white/25">에이전트가 코드를 생성 중입니다...</p>
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* File sidebar */}
                    <div className="w-[180px] flex-shrink-0 border-r border-white/[0.06] overflow-y-auto">
                        {/* FE/BE tab */}
                        <div className="flex border-b border-white/[0.06]">
                            <button
                                onClick={() => { setActiveTab("frontend"); setActiveFile(0); }}
                                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${activeTab === "frontend" ? "text-pink-400 border-b border-pink-400" : "text-white/30 hover:text-white/50"}`}
                            >
                                Frontend ({feFiles.length})
                            </button>
                            <button
                                onClick={() => { setActiveTab("backend"); setActiveFile(0); }}
                                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${activeTab === "backend" ? "text-amber-400 border-b border-amber-400" : "text-white/30 hover:text-white/50"}`}
                            >
                                Backend ({beFiles.length})
                            </button>
                        </div>

                        {/* File list */}
                        <div className="p-1.5 space-y-0.5">
                            {files.map((f, i) => {
                                const fileName = f.path.split("/").pop() || f.path;
                                const folder = f.path.split("/").slice(0, -1).join("/");
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setActiveFile(i)}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                                            activeFile === i
                                                ? "bg-indigo-500/10 border border-indigo-500/20"
                                                : "hover:bg-white/[0.03]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Folder className="w-3 h-3 text-white/15 flex-shrink-0" />
                                            <span className="text-[10px] text-white/25 truncate">{folder || "."}</span>
                                        </div>
                                        <p className={`text-[11px] font-medium mt-0.5 truncate ${
                                            activeFile === i ? "text-white/80" : "text-white/50"
                                        }`}>
                                            {fileName}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Code content */}
                    <div className="flex-1 overflow-auto">
                        {currentFile ? (
                            <>
                                <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur border-b border-white/[0.06]">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500/60" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                                        <div className="w-2 h-2 rounded-full bg-green-500/60" />
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono">{currentFile.path}</span>
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 ${langColors[currentFile.language] || "text-white/40"}`}>
                                        {currentFile.language}
                                    </span>
                                </div>
                                <pre className="p-4 text-[11px] leading-relaxed">
                                    <code className={`font-mono whitespace-pre-wrap break-words ${langColors[currentFile.language] || "text-white/70"}`}>
                                        {currentFile.code}
                                    </code>
                                </pre>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-xs text-white/20">파일을 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

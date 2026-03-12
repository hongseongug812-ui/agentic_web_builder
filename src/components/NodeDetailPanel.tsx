"use client";

import { useState } from "react";
import {
    MessageSquare,
    ClipboardList,
    Code2,
    Loader2,
    Check,
    Circle,
    X,
    FileJson,
    Clock,
    MessagesSquare,
    AlertCircle,
    Server,
    Copy,
    MousePointerClick,
} from "lucide-react";
import { useUIStore, useAgentStore, AgentStatus, DebateMessage } from "@/store";

/* ── Role → Icon ── */
const roleIcons: Record<string, React.ReactNode> = {
    user:     <MessageSquare className="w-4 h-4" />,
    pm:       <ClipboardList className="w-4 h-4" />,
    frontend: <Code2 className="w-4 h-4" />,
    backend:  <Server className="w-4 h-4" />,
};

/* ── Role → Colors ── */
const roleColors: Record<string, { accent: string; bg: string; border: string }> = {
    user:     { accent: "#818cf8", bg: "rgba(99, 102, 241, 0.08)",  border: "rgba(99, 102, 241, 0.2)" },
    pm:       { accent: "#34d399", bg: "rgba(16, 185, 129, 0.08)",  border: "rgba(16, 185, 129, 0.2)" },
    frontend: { accent: "#f472b6", bg: "rgba(244, 114, 182, 0.08)", border: "rgba(244, 114, 182, 0.2)" },
    backend:  { accent: "#fbbf24", bg: "rgba(251, 191, 36, 0.08)",  border: "rgba(251, 191, 36, 0.2)" },
};

/* ── Message type labels ── */
const messageTypeLabels: Record<string, { label: string; color: string }> = {
    plan:     { label: "📋 기획서",       color: "text-emerald-400" },
    review:   { label: "🔍 FE 리뷰",     color: "text-pink-400" },
    be_review:{ label: "🔧 BE 리뷰",     color: "text-amber-400" },
    revision: { label: "✏️ 수정안",       color: "text-blue-400" },
    approval: { label: "✅ 승인",         color: "text-emerald-400" },
    code:     { label: "💻 FE 코드 생성", color: "text-purple-400" },
    be_code:  { label: "🖥️ BE 코드 생성", color: "text-amber-400" },
    qa_pass:  { label: "✅ QA 통과",      color: "text-emerald-400" },
    qa_fail:  { label: "❌ QA 재검수",    color: "text-red-400" },
};

/* ── Type helper (replaces repeated inline casts) ── */
function getSuggestions(data: unknown): string[] {
    if (!data || typeof data !== "object") return [];
    const arr = (data as Record<string, unknown>).suggestions;
    if (!Array.isArray(arr)) return [];
    return arr.filter((s): s is string => typeof s === "string");
}

/* ── Status label ── */
function StatusLabel({ status }: { status: AgentStatus }) {
    const map: Record<AgentStatus, React.ReactNode> = {
        working: (
            <div className="flex items-center gap-1.5 text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs font-medium">작업중...</span>
            </div>
        ),
        done: (
            <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">완료</span>
            </div>
        ),
        error: (
            <div className="flex items-center gap-1.5 text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">오류</span>
            </div>
        ),
        idle: (
            <div className="flex items-center gap-1.5 text-white/30">
                <Circle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">대기중</span>
            </div>
        ),
    };
    return <>{map[status] ?? map.idle}</>;
}

/* ── Debate Message Bubble ── */
function DebateBubble({ msg, index }: { msg: DebateMessage; index: number }) {
    const isPm    = msg.agent === "pm";
    const isBe    = msg.agent === "backend";
    const typeInfo = messageTypeLabels[msg.message_type] ?? { label: msg.message_type, color: "text-white/50" };
    const agentLabel = isPm ? "PM" : isBe ? "BE" : "FE";
    const isLeft  = isPm;

    const bubbleStyle = isPm
        ? "bg-emerald-500/[0.06] border border-emerald-500/20 text-emerald-200/80 mr-6"
        : isBe
        ? "bg-amber-500/[0.06] border border-amber-500/20 text-amber-200/80 ml-6"
        : "bg-pink-500/[0.06] border border-pink-500/20 text-pink-200/80 ml-6";

    const suggestions = getSuggestions(msg.data);

    return (
        <div
            className="animate-[fadeInUp_0.4s_ease-out] mb-3"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
        >
            <div className={`flex items-center gap-1.5 mb-1 ${isLeft ? "" : "justify-end"}`}>
                <span className="text-[9px] text-white/30 font-mono">R{msg.round}</span>
                <span className={`text-[10px] font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                <span className="text-[9px] text-white/20">{agentLabel}</span>
            </div>
            <div className={`rounded-xl p-3 text-[11px] leading-relaxed ${bubbleStyle}`}>
                {msg.content}
                {suggestions.length > 0 && (
                    <ul className="mt-2 space-y-1">
                        {suggestions.map((s, i) => (
                            <li key={i} className="text-[10px] text-white/40 flex items-start gap-1">
                                <span className="text-white/20 mt-px">•</span>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

/* ── Copy button for JSON output ── */
function CopyJsonButton({ data }: { data: unknown }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("클립보드 복사 실패:", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            title="JSON 복사"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
            {copied
                ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">복사됨</span></>
                : <><Copy className="w-3 h-3" /><span>복사</span></>
            }
        </button>
    );
}

export default function NodeDetailPanel() {
    const [activeTab, setActiveTab] = useState<"output" | "debate">("output");
    const selectedNodeId = useUIStore((s) => s.selectedNodeId);
    const selectNode     = useUIStore((s) => s.selectNode);
    const agents         = useAgentStore((s) => s.agents);
    const agentOutputData = useAgentStore((s) => s.agentOutputData);
    const debateMessages = useAgentStore((s) => s.debateMessages);
    const currentRound   = useAgentStore((s) => s.currentRound);

    const selectedAgent = agents.find((a) => a.id === selectedNodeId);

    const agentDebateMessages = debateMessages.filter((m) => {
        if (selectedAgent?.role === "pm")       return m.agent === "pm";
        if (selectedAgent?.role === "frontend") return m.agent === "frontend";
        if (selectedAgent?.role === "backend")  return m.agent === "backend";
        return false;
    });

    /* ── Empty state ── */
    if (!selectedAgent) {
        return (
            <aside className="hidden md:flex flex-col w-[320px] flex-shrink-0 border-l border-white/[0.06] bg-gray-950">
                <div className="h-10 flex items-center px-4 border-b border-white/[0.06]">
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Detail</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex items-center justify-center">
                        <MousePointerClick className="w-6 h-6 text-white/15" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-white/30">노드를 클릭하세요</p>
                        <p className="text-[10px] text-white/18 mt-1 leading-relaxed">
                            상세 모드에서 캔버스의 에이전트 노드를<br />클릭하면 출력 데이터가 표시됩니다
                        </p>
                    </div>
                </div>
            </aside>
        );
    }

    const colors = roleColors[selectedAgent.role] ?? roleColors.user;
    const icon   = (roleIcons[selectedAgent.role] ?? roleIcons.user) as React.ReactNode;
    const output = agentOutputData[selectedAgent.id] as Record<string, unknown> | undefined;

    return (
        <aside className="hidden md:flex flex-col w-[320px] flex-shrink-0 border-l border-white/[0.06] bg-gray-950">
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Detail</span>
                <button
                    onClick={() => selectNode(null)}
                    aria-label="패널 닫기"
                    className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Agent info card */}
                <div className="p-4 border-b border-white/[0.06]">
                    <div
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                    >
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${colors.accent}20`, color: colors.accent }}
                        >
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/90 truncate">{selectedAgent.name}</p>
                            <p className="text-[10px] text-white/30 font-mono uppercase mt-0.5">{selectedAgent.role}</p>
                        </div>
                    </div>
                </div>

                {/* Status + round */}
                <div className="px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40 font-medium">상태</span>
                        <StatusLabel status={selectedAgent.status} />
                    </div>
                    {currentRound > 0 && (
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-white/40 font-medium">토론 라운드</span>
                            <span className="text-xs text-indigo-400 font-mono">Round {currentRound}</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                {selectedAgent.role !== "user" && (
                    <div className="flex border-b border-white/[0.06]" role="tablist">
                        {(["output", "debate"] as const).map((t) => (
                            <button
                                key={t}
                                role="tab"
                                aria-selected={activeTab === t}
                                onClick={() => setActiveTab(t)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                                    activeTab === t
                                        ? "text-indigo-400 border-b-2 border-indigo-400"
                                        : "text-white/30 hover:text-white/50"
                                }`}
                            >
                                {t === "output"
                                    ? <><FileJson className="w-3 h-3" />출력 데이터</>
                                    : <>
                                        <MessagesSquare className="w-3 h-3" />
                                        토론 로그
                                        {agentDebateMessages.length > 0 && (
                                            <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-[9px] text-indigo-400 flex items-center justify-center font-bold">
                                                {agentDebateMessages.length}
                                            </span>
                                        )}
                                    </>
                                }
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab content */}
                <div className="p-4" role="tabpanel">
                    {activeTab === "output" || selectedAgent.role === "user" ? (
                        <>
                            {selectedAgent.status === "done" && output ? (
                                <div className="rounded-lg border border-white/[0.08] overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
                                    {/* File header bar */}
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                                                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                                                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                                            </div>
                                            <span className="text-[10px] text-white/30 font-mono">output.json</span>
                                        </div>
                                        <CopyJsonButton data={output} />
                                    </div>
                                    <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed bg-gray-900/50 max-h-[360px] overflow-y-auto">
                                        <code className="text-emerald-300/90 font-mono whitespace-pre-wrap break-words">
                                            {JSON.stringify(output, null, 2)}
                                        </code>
                                    </pre>
                                </div>
                            ) : selectedAgent.status === "working" ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="relative mb-3">
                                        <Loader2 className="w-8 h-8 text-blue-400/50 animate-spin" />
                                        <div className="absolute inset-0 w-8 h-8 rounded-full bg-blue-400/10 animate-ping" />
                                    </div>
                                    <p className="text-xs text-white/30">AI가 작업 중입니다...</p>
                                    {currentRound > 0 && (
                                        <p className="text-[10px] text-white/15 mt-1">토론 Round {currentRound}</p>
                                    )}
                                </div>
                            ) : selectedAgent.status === "error" ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <AlertCircle className="w-8 h-8 text-red-400/50 mb-2" />
                                    <p className="text-xs text-red-400/60">오류가 발생했습니다</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Clock className="w-6 h-6 text-white/15 mb-2" />
                                    <p className="text-xs text-white/25 leading-relaxed">
                                        작업이 완료되면<br />출력 데이터가 표시됩니다
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {agentDebateMessages.length > 0 ? (
                                <div className="space-y-1">
                                    {agentDebateMessages.map((msg, i) => (
                                        <DebateBubble key={i} msg={msg} index={i} />
                                    ))}
                                </div>
                            ) : selectedAgent.status === "working" ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <MessagesSquare className="w-6 h-6 text-white/15 animate-pulse mb-2" />
                                    <p className="text-xs text-white/25">토론이 진행 중입니다...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <MessagesSquare className="w-6 h-6 text-white/12 mb-2" />
                                    <p className="text-xs text-white/20">아직 토론 기록이 없습니다</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}

"use client";

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
} from "lucide-react";
import { useFlowStore, agentOutputs, AgentStatus } from "@/store/store";

/* ── Role → Icon ── */
const roleIcons: Record<string, React.ReactNode> = {
    user: <MessageSquare className="w-4 h-4" />,
    pm: <ClipboardList className="w-4 h-4" />,
    frontend: <Code2 className="w-4 h-4" />,
};

/* ── Role → Color ── */
const roleColors: Record<string, { accent: string; bg: string; border: string }> = {
    user: { accent: "#818cf8", bg: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.2)" },
    pm: { accent: "#34d399", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)" },
    frontend: { accent: "#f472b6", bg: "rgba(244, 114, 182, 0.08)", border: "rgba(244, 114, 182, 0.2)" },
};

/* ── Status label component ── */
function StatusLabel({ status }: { status: AgentStatus }) {
    if (status === "working") {
        return (
            <div className="flex items-center gap-1.5 text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs font-medium">작업중...</span>
            </div>
        );
    }
    if (status === "done") {
        return (
            <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">완료</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5 text-white/30">
            <Circle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">대기중</span>
        </div>
    );
}

export default function NodeDetailPanel() {
    const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
    const agents = useFlowStore((s) => s.agents);
    const selectNode = useFlowStore((s) => s.selectNode);

    const selectedAgent = agents.find((a) => a.id === selectedNodeId);

    // Empty state
    if (!selectedAgent) {
        return (
            <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-l border-white/[0.06] bg-gray-950">
                <div className="h-10 flex items-center px-4 border-b border-white/[0.06]">
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Detail
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                            <FileJson className="w-5 h-5 text-white/20" />
                        </div>
                        <p className="text-xs text-white/30 leading-relaxed">
                            캔버스에서 노드를 클릭하면
                            <br />
                            상세 정보가 여기에 표시됩니다
                        </p>
                    </div>
                </div>
            </aside>
        );
    }

    const colors = roleColors[selectedAgent.role] || roleColors.user;
    const icon = roleIcons[selectedAgent.role] || roleIcons.user;
    const output = agentOutputs[selectedAgent.id];

    return (
        <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-l border-white/[0.06] bg-gray-950">
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                    Detail
                </span>
                <button
                    onClick={() => selectNode(null)}
                    className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Agent Info Card */}
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
                            <p className="text-sm font-semibold text-white/90 truncate">
                                {selectedAgent.name}
                            </p>
                            <p className="text-[10px] text-white/30 font-mono uppercase mt-0.5">
                                {selectedAgent.role}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40 font-medium">상태</span>
                        <StatusLabel status={selectedAgent.status} />
                    </div>
                </div>

                {/* Output */}
                <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                        <FileJson className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-xs text-white/40 font-medium">출력 데이터</span>
                    </div>

                    {selectedAgent.status === "done" && output ? (
                        <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                            {/* Code block header */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                                </div>
                                <span className="text-[10px] text-white/30 font-mono">output.json</span>
                            </div>
                            {/* Code content */}
                            <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed bg-gray-900/50">
                                <code className="text-emerald-300/90 font-mono whitespace-pre-wrap break-words">
                                    {JSON.stringify(output, null, 2)}
                                </code>
                            </pre>
                        </div>
                    ) : selectedAgent.status === "working" ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Loader2 className="w-6 h-6 text-blue-400/50 animate-spin mb-2" />
                            <p className="text-xs text-white/25">데이터를 생성하는 중...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Clock className="w-6 h-6 text-white/15 mb-2" />
                            <p className="text-xs text-white/25">
                                작업이 완료되면
                                <br />
                                출력 데이터가 표시됩니다
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

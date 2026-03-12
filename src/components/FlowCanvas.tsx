"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import AgentNode from "./AgentNode";
import LetterEdge from "./LetterEdge";
import { useUIStore, useAgentStore } from "@/store";
import { GitBranch, LayoutList, Zap } from "lucide-react";

const nodeTypes = { agentNode: AgentNode };
const edgeTypes = { letterEdge: LetterEdge };

const initialNodes: Node[] = [
    { id: "user-input",       type: "agentNode", position: { x: 30,   y: 220 }, data: { label: "사용자 입력",  role: "user",     agentId: "user-input" } },
    { id: "classifier-agent", type: "agentNode", position: { x: 190,  y: 220 }, data: { label: "🔀 분류기",    role: "pm",       agentId: "classifier-agent" } },
    { id: "cto-agent",        type: "agentNode", position: { x: 380,  y: 220 }, data: { label: "🧑‍💼 CTO",      role: "pm",       agentId: "cto-agent" } },
    { id: "fe-lead-agent",    type: "agentNode", position: { x: 600,  y: 70  }, data: { label: "👨‍💻 FE Lead",  role: "frontend", agentId: "fe-lead-agent" } },
    { id: "fe-dev-agent",     type: "agentNode", position: { x: 820,  y: 70  }, data: { label: "👩‍💻 FE Dev",   role: "frontend", agentId: "fe-dev-agent" } },
    { id: "be-lead-agent",    type: "agentNode", position: { x: 600,  y: 370 }, data: { label: "🔧 BE Lead",  role: "backend",  agentId: "be-lead-agent" } },
    { id: "be-dev-agent",     type: "agentNode", position: { x: 820,  y: 370 }, data: { label: "🔩 BE Dev",   role: "backend",  agentId: "be-dev-agent" } },
    { id: "qa-agent",         type: "agentNode", position: { x: 1040, y: 220 }, data: { label: "🔍 QA",       role: "pm",       agentId: "qa-agent" } },
];

// Explicit bright colors per edge — no regex string manipulation
const EDGE_BASE: Record<string, string> = {
    "e-user-cls":     "rgba(99, 102, 241, 0.35)",
    "e-cls-cto":      "rgba(99, 102, 241, 0.35)",
    "e-cto-fe-lead":  "rgba(16, 185, 129, 0.35)",
    "e-cto-be-lead":  "rgba(251, 191, 36, 0.35)",
    "e-fe-lead-dev":  "rgba(244, 114, 182, 0.35)",
    "e-fe-dev-lead":  "rgba(244, 114, 182, 0.25)",
    "e-be-lead-dev":  "rgba(251, 191, 36, 0.35)",
    "e-be-dev-lead":  "rgba(251, 191, 36, 0.25)",
    "e-fe-lead-qa":   "rgba(139, 92, 246, 0.35)",
    "e-be-lead-qa":   "rgba(139, 92, 246, 0.35)",
};
const EDGE_BRIGHT: Record<string, string> = {
    "e-user-cls":     "rgba(99, 102, 241, 0.9)",
    "e-cls-cto":      "rgba(99, 102, 241, 0.9)",
    "e-cto-fe-lead":  "rgba(16, 185, 129, 0.9)",
    "e-cto-be-lead":  "rgba(251, 191, 36, 0.9)",
    "e-fe-lead-dev":  "rgba(244, 114, 182, 0.9)",
    "e-fe-dev-lead":  "rgba(244, 114, 182, 0.7)",
    "e-be-lead-dev":  "rgba(251, 191, 36, 0.9)",
    "e-be-dev-lead":  "rgba(251, 191, 36, 0.7)",
    "e-fe-lead-qa":   "rgba(139, 92, 246, 0.9)",
    "e-be-lead-qa":   "rgba(139, 92, 246, 0.9)",
};

const baseEdges: Edge[] = [
    { id: "e-user-cls",    source: "user-input",    target: "classifier-agent", type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-user-cls"],    strokeWidth: 2 }, data: { sourceAgentId: "user-input" } },
    { id: "e-cls-cto",     source: "classifier-agent", target: "cto-agent",     type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-cls-cto"],     strokeWidth: 2 }, data: { sourceAgentId: "classifier-agent" } },
    { id: "e-cto-fe-lead", source: "cto-agent",     target: "fe-lead-agent",    type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-cto-fe-lead"], strokeWidth: 2 }, data: { sourceAgentId: "cto-agent" } },
    { id: "e-cto-be-lead", source: "cto-agent",     target: "be-lead-agent",    type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-cto-be-lead"], strokeWidth: 2 }, data: { sourceAgentId: "cto-agent" } },
    { id: "e-fe-lead-dev", source: "fe-lead-agent", target: "fe-dev-agent",     type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-fe-lead-dev"], strokeWidth: 2 }, data: { sourceAgentId: "fe-lead-agent" } },
    { id: "e-fe-dev-lead", source: "fe-dev-agent",  target: "fe-lead-agent",    type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-fe-dev-lead"], strokeWidth: 2, strokeDasharray: "6 4" }, data: { sourceAgentId: "fe-dev-agent", isReview: true } },
    { id: "e-be-lead-dev", source: "be-lead-agent", target: "be-dev-agent",     type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-be-lead-dev"], strokeWidth: 2 }, data: { sourceAgentId: "be-lead-agent" } },
    { id: "e-be-dev-lead", source: "be-dev-agent",  target: "be-lead-agent",    type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-be-dev-lead"], strokeWidth: 2, strokeDasharray: "6 4" }, data: { sourceAgentId: "be-dev-agent", isReview: true } },
    { id: "e-fe-lead-qa",  source: "fe-lead-agent", target: "qa-agent",         type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-fe-lead-qa"],  strokeWidth: 2 }, data: { sourceAgentId: "fe-lead-agent" } },
    { id: "e-be-lead-qa",  source: "be-lead-agent", target: "qa-agent",         type: "letterEdge", animated: false, style: { stroke: EDGE_BASE["e-be-lead-qa"],  strokeWidth: 2 }, data: { sourceAgentId: "be-lead-agent" } },
];

// ── 파이프라인 단계 ──
const PIPELINE_STAGES = [
    { key: "classify", icon: "🔀", label: "분류",    agentIds: ["classifier-agent"] },
    { key: "plan",     icon: "📋", label: "기획",    agentIds: ["cto-agent"] },
    { key: "debate",   icon: "💬", label: "팀 토론", agentIds: ["fe-lead-agent", "fe-dev-agent", "be-lead-agent", "be-dev-agent"] },
    { key: "codegen",  icon: "💻", label: "코드 생성", agentIds: ["fe-lead-agent", "be-lead-agent"] },
    { key: "qa",       icon: "🔍", label: "QA",      agentIds: ["qa-agent"] },
] as const;

// ── 단계 커넥터 (단순 div보다 SVG로 fill animation) ──
function StageConnector({ filled }: { filled: boolean }) {
    return (
        <div className="w-14 h-[2px] mx-1 mb-6 relative bg-white/[0.05] overflow-hidden rounded-full flex-shrink-0">
            <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: filled ? "100%" : "0%" }}
            />
        </div>
    );
}

// ── 간단 모드 뷰 ──
function SimplePipelineView({ onToggleDetail }: { onToggleDetail: () => void }) {
    const agents       = useAgentStore((s) => s.agents);
    const pipelineLabel = useAgentStore((s) => s.pipelineLabel);
    const pipelineStep  = useAgentStore((s) => s.pipelineStep);
    const pipelineTotal = useAgentStore((s) => s.pipelineTotal);
    const isRunning     = useAgentStore((s) => s.isRunning);
    const error         = useAgentStore((s) => s.error);

    const isComplete = pipelineLabel === "완료";
    const pct = pipelineTotal > 0 ? Math.min((pipelineStep / pipelineTotal) * 100, 100) : 0;

    const currentStageIdx = isComplete
        ? PIPELINE_STAGES.length
        : pipelineTotal > 0
        ? Math.min(Math.floor((pipelineStep / pipelineTotal) * PIPELINE_STAGES.length), PIPELINE_STAGES.length - 1)
        : -1;

    const isIdle = !isRunning && !isComplete && !error && pipelineLabel === "";

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-8 px-10 relative select-none overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_60%,rgba(99,102,241,0.05),transparent)]" />

            {/* Detail mode toggle */}
            <button
                onClick={onToggleDetail}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/25 hover:text-white/55 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 text-[10px] font-medium z-10"
                title="상세 그래프 보기"
            >
                <GitBranch className="w-3 h-3" />
                상세 보기
            </button>

            {/* Stage row */}
            <div className="flex items-center relative z-10">
                {PIPELINE_STAGES.map((stage, i) => {
                    const isDone    = i < currentStageIdx || isComplete;
                    const isActive  = i === currentStageIdx && isRunning && !error;
                    const hasError  = i === currentStageIdx && !!error;

                    return (
                        <div key={stage.key} className="flex items-center">
                            <div className="flex flex-col items-center gap-2 w-[72px]">
                                {/* Icon bubble */}
                                <div className="relative">
                                    {/* Pulse ring when active */}
                                    {isActive && (
                                        <div className="absolute inset-[-10px] rounded-2xl bg-indigo-500/20 animate-ping" />
                                    )}
                                    <div
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${
                                            hasError
                                                ? "bg-red-500/12 border-2 border-red-500/40 shadow-lg shadow-red-500/15"
                                                : isDone
                                                ? "bg-emerald-500/12 border-2 border-emerald-500/35 shadow-lg shadow-emerald-500/15"
                                                : isActive
                                                ? "bg-indigo-500/15 border-2 border-indigo-400/50 shadow-lg shadow-indigo-500/25 scale-105"
                                                : "bg-white/[0.025] border border-white/[0.07]"
                                        }`}
                                    >
                                        {isDone
                                            ? <span className="text-emerald-400 text-lg">✓</span>
                                            : hasError
                                            ? <span className="text-red-400 text-lg">✗</span>
                                            : <span className={isActive ? "animate-bounce" : ""}>{stage.icon}</span>
                                        }
                                    </div>
                                    {/* Step number badge */}
                                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                                        isDone ? "bg-emerald-500/30 text-emerald-400" : isActive ? "bg-indigo-500/30 text-indigo-300" : "bg-white/[0.05] text-white/20"
                                    }`}>
                                        {i + 1}
                                    </div>
                                </div>
                                {/* Label */}
                                <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
                                    hasError    ? "text-red-400"
                                    : isDone    ? "text-emerald-400/70"
                                    : isActive  ? "text-indigo-300"
                                    : "text-white/18"
                                }`}>
                                    {stage.label}
                                </span>
                            </div>

                            {/* Connector */}
                            {i < PIPELINE_STAGES.length - 1 && (
                                <StageConnector filled={isDone} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Status area */}
            <div className="flex flex-col items-center gap-3 relative z-10 min-h-[52px]">
                {isIdle && (
                    <div className="flex flex-col items-center gap-2 animate-[fadeInUp_0.4s_ease-out]">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.07]">
                            <Zap className="w-3.5 h-3.5 text-indigo-400/60" />
                            <span className="text-[12px] text-white/30 font-medium">설정 완료 후 생성 버튼을 누르세요</span>
                        </div>
                    </div>
                )}

                {isRunning && !error && (
                    <div className="flex flex-col items-center gap-2 animate-[fadeInUp_0.3s_ease-out]">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                            </div>
                            <p className="text-[13px] font-semibold text-white/80">{pipelineLabel || "준비 중..."}</p>
                        </div>
                        {pipelineTotal > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="w-40 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-white/25 font-mono w-8">{Math.round(pct)}%</span>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center gap-1.5 animate-[fadeInUp_0.3s_ease-out]">
                        <p className="text-[13px] font-semibold text-red-300">파이프라인 오류 발생</p>
                        <p className="text-[11px] text-red-400/60 max-w-xs text-center line-clamp-2">{error}</p>
                    </div>
                )}

                {isComplete && !error && (
                    <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 animate-[scaleIn_0.3s_ease-out]">
                        <span className="text-emerald-400">✓</span>
                        <p className="text-[13px] font-semibold text-emerald-300">생성 완료 — 아래 탭에서 결과를 확인하세요</p>
                    </div>
                )}
            </div>

            {/* Agent status pills */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-sm relative z-10">
                {agents.filter((a) => a.id !== "user-input").map((agent) => (
                    <div
                        key={agent.id}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold border transition-all duration-300 ${
                            agent.status === "working"
                                ? "bg-indigo-500/12 border-indigo-500/25 text-indigo-300"
                                : agent.status === "done"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/70"
                                : agent.status === "error"
                                ? "bg-red-500/12 border-red-500/25 text-red-400"
                                : "bg-white/[0.02] border-white/[0.05] text-white/15"
                        }`}
                    >
                        {agent.name}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function FlowCanvas() {
    const [simpleMode, setSimpleMode] = useState(true);
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);
    const selectNode = useUIStore((s) => s.selectNode);
    const agents = useAgentStore((s) => s.agents);

    useEffect(() => {
        const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

        setEdges((eds) =>
            eds.map((edge) => {
                const sourceAgent = agentMap[edge.source];
                const targetAgent = agentMap[edge.target];
                const active = sourceAgent?.status === "done" && targetAgent?.status === "working";
                const base   = EDGE_BASE[edge.id]   ?? "rgba(99, 102, 241, 0.35)";
                const bright = EDGE_BRIGHT[edge.id] ?? "rgba(99, 102, 241, 0.9)";
                return {
                    ...edge,
                    animated: active,
                    style: {
                        ...edge.style,
                        stroke: active ? bright : base,
                        strokeWidth: active ? 3 : 2,
                    },
                };
            })
        );
    }, [agents, setEdges]);

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge(
                    { ...params, type: "smoothstep", animated: true, style: { stroke: "rgba(148,163,184,0.4)", strokeWidth: 2 } },
                    eds
                )
            ),
        [setEdges]
    );

    const onNodeClick  = useCallback((_: React.MouseEvent, node: Node) => selectNode(node.id), [selectNode]);
    const onPaneClick  = useCallback(() => selectNode(null), [selectNode]);
    const memoizedNodeTypes = useMemo(() => nodeTypes, []);
    const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

    if (simpleMode) {
        return <SimplePipelineView onToggleDetail={() => setSimpleMode(false)} />;
    }

    return (
        <div className="w-full h-full relative">
            <button
                onClick={() => setSimpleMode(true)}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/80 border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-gray-800/80 transition-all text-[10px] font-medium backdrop-blur-sm"
                title="간단 보기"
            >
                <LayoutList className="w-3.5 h-3.5" />
                간단 보기
            </button>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={memoizedNodeTypes}
                edgeTypes={memoizedEdgeTypes}
                fitView
                fitViewOptions={{ padding: 0.4 }}
                proOptions={{ hideAttribution: true }}
                className="!bg-transparent"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.04)" />
                <Controls className="!bg-gray-900/80 !border-white/10 !rounded-lg !shadow-xl [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-white/50 [&>button:hover]:!bg-white/5" />
                <MiniMap
                    nodeColor={() => "rgba(99,102,241,0.5)"}
                    maskColor="rgba(3,7,18,0.85)"
                    className="!bg-gray-900/60 !border-white/10 !rounded-lg"
                    style={{ width: 120, height: 80 }}
                />
            </ReactFlow>
        </div>
    );
}

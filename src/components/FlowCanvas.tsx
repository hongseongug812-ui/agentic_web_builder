"use client";

import { useCallback, useMemo, useEffect } from "react";
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
import { useFlowStore } from "@/store/store";

const nodeTypes = { agentNode: AgentNode };
const edgeTypes = { letterEdge: LetterEdge };

const initialNodes: Node[] = [
    {
        id: "user-input",
        type: "agentNode",
        position: { x: 30, y: 220 },
        data: { label: "사용자 입력", role: "user", agentId: "user-input" },
    },
    {
        id: "cto-agent",
        type: "agentNode",
        position: { x: 250, y: 220 },
        data: { label: "🧑‍💼 CTO", role: "pm", agentId: "cto-agent" },
    },
    {
        id: "fe-lead-agent",
        type: "agentNode",
        position: { x: 490, y: 80 },
        data: { label: "👨‍💻 FE Lead", role: "frontend", agentId: "fe-lead-agent" },
    },
    {
        id: "fe-dev-agent",
        type: "agentNode",
        position: { x: 710, y: 80 },
        data: { label: "👩‍💻 FE Dev", role: "frontend", agentId: "fe-dev-agent" },
    },
    {
        id: "be-lead-agent",
        type: "agentNode",
        position: { x: 490, y: 360 },
        data: { label: "🔧 BE Lead", role: "backend", agentId: "be-lead-agent" },
    },
    {
        id: "be-dev-agent",
        type: "agentNode",
        position: { x: 710, y: 360 },
        data: { label: "🔩 BE Dev", role: "backend", agentId: "be-dev-agent" },
    },
    {
        id: "qa-agent",
        type: "agentNode",
        position: { x: 930, y: 220 },
        data: { label: "🔍 QA", role: "pm", agentId: "qa-agent" },
    },
];

const baseEdges: Edge[] = [
    // User → CTO
    {
        id: "e-user-cto",
        source: "user-input",
        target: "cto-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(99, 102, 241, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "user-input" },
    },
    // CTO → FE Lead
    {
        id: "e-cto-fe-lead",
        source: "cto-agent",
        target: "fe-lead-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(16, 185, 129, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "cto-agent" },
    },
    // CTO → BE Lead
    {
        id: "e-cto-be-lead",
        source: "cto-agent",
        target: "be-lead-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(251, 191, 36, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "cto-agent" },
    },
    // FE Lead ↔ FE Dev (토론)
    {
        id: "e-fe-lead-dev",
        source: "fe-lead-agent",
        target: "fe-dev-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(244, 114, 182, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "fe-lead-agent" },
    },
    {
        id: "e-fe-dev-lead",
        source: "fe-dev-agent",
        target: "fe-lead-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(244, 114, 182, 0.3)", strokeWidth: 2, strokeDasharray: "6 4" },
        data: { sourceAgentId: "fe-dev-agent", isReview: true },
    },
    // BE Lead ↔ BE Dev (토론)
    {
        id: "e-be-lead-dev",
        source: "be-lead-agent",
        target: "be-dev-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(251, 191, 36, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "be-lead-agent" },
    },
    {
        id: "e-be-dev-lead",
        source: "be-dev-agent",
        target: "be-lead-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(251, 191, 36, 0.3)", strokeWidth: 2, strokeDasharray: "6 4" },
        data: { sourceAgentId: "be-dev-agent", isReview: true },
    },
    // FE Lead → QA
    {
        id: "e-fe-lead-qa",
        source: "fe-lead-agent",
        target: "qa-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(139, 92, 246, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "fe-lead-agent" },
    },
    // BE Lead → QA
    {
        id: "e-be-lead-qa",
        source: "be-lead-agent",
        target: "qa-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(139, 92, 246, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "be-lead-agent" },
    },
];

export default function FlowCanvas() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);
    const selectNode = useFlowStore((s) => s.selectNode);
    const agents = useFlowStore((s) => s.agents);

    useEffect(() => {
        const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

        setEdges((eds) =>
            eds.map((edge) => {
                const sourceAgent = agentMap[edge.source];
                const targetAgent = agentMap[edge.target];
                const active = sourceAgent?.status === "done" && targetAgent?.status === "working";
                const baseStroke = (edge.style?.stroke as string) || "rgba(99, 102, 241, 0.4)";
                const brightStroke = baseStroke.replace(/[\d.]+\)$/, "0.8)");
                return {
                    ...edge,
                    animated: active,
                    style: {
                        ...edge.style,
                        stroke: active ? brightStroke : baseStroke,
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

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => selectNode(node.id), [selectNode]);
    const onPaneClick = useCallback(() => selectNode(null), [selectNode]);
    const memoizedNodeTypes = useMemo(() => nodeTypes, []);
    const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

    return (
        <div className="w-full h-full">
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

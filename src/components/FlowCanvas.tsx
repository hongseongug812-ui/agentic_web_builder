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
        position: { x: 50, y: 200 },
        data: { label: "사용자 입력", role: "user", agentId: "user-input" },
    },
    {
        id: "pm-agent",
        type: "agentNode",
        position: { x: 320, y: 200 },
        data: { label: "PM 에이전트", role: "pm", agentId: "pm-agent" },
    },
    {
        id: "frontend-agent",
        type: "agentNode",
        position: { x: 590, y: 100 },
        data: { label: "Frontend 에이전트", role: "frontend", agentId: "frontend-agent" },
    },
    {
        id: "backend-agent",
        type: "agentNode",
        position: { x: 590, y: 300 },
        data: { label: "Backend 에이전트", role: "backend", agentId: "backend-agent" },
    },
];

const baseEdges: Edge[] = [
    {
        id: "e-user-pm",
        source: "user-input",
        target: "pm-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(99, 102, 241, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "user-input" },
    },
    {
        id: "e-pm-frontend",
        source: "pm-agent",
        target: "frontend-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(16, 185, 129, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "pm-agent" },
    },
    {
        id: "e-pm-backend",
        source: "pm-agent",
        target: "backend-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(251, 191, 36, 0.4)", strokeWidth: 2 },
        data: { sourceAgentId: "pm-agent" },
    },
    {
        id: "e-frontend-pm",
        source: "frontend-agent",
        target: "pm-agent",
        type: "letterEdge",
        animated: false,
        style: { stroke: "rgba(244, 114, 182, 0.3)", strokeWidth: 2, strokeDasharray: "6 4" },
        data: { sourceAgentId: "frontend-agent", isReview: true },
    },
];

export default function FlowCanvas() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);
    const selectNode = useFlowStore((s) => s.selectNode);
    const agents = useFlowStore((s) => s.agents);

    useEffect(() => {
        const pmAgent = agents.find((a) => a.id === "pm-agent");
        const feAgent = agents.find((a) => a.id === "frontend-agent");
        const beAgent = agents.find((a) => a.id === "backend-agent");
        const userAgent = agents.find((a) => a.id === "user-input");

        setEdges((eds) =>
            eds.map((edge) => {
                if (edge.id === "e-user-pm") {
                    const active = userAgent?.status === "done" && pmAgent?.status === "working";
                    return {
                        ...edge,
                        animated: active,
                        style: {
                            ...edge.style,
                            stroke: active ? "rgba(99, 102, 241, 0.8)" : "rgba(99, 102, 241, 0.4)",
                            strokeWidth: active ? 3 : 2,
                        },
                    };
                }
                if (edge.id === "e-pm-frontend") {
                    const active = pmAgent?.status === "done" && feAgent?.status === "working";
                    return {
                        ...edge,
                        animated: active,
                        style: {
                            ...edge.style,
                            stroke: active ? "rgba(16, 185, 129, 0.8)" : "rgba(16, 185, 129, 0.4)",
                            strokeWidth: active ? 3 : 2,
                        },
                    };
                }
                if (edge.id === "e-pm-backend") {
                    const active = pmAgent?.status === "done" && beAgent?.status === "working";
                    return {
                        ...edge,
                        animated: active,
                        style: {
                            ...edge.style,
                            stroke: active ? "rgba(251, 191, 36, 0.8)" : "rgba(251, 191, 36, 0.4)",
                            strokeWidth: active ? 3 : 2,
                        },
                    };
                }
                if (edge.id === "e-frontend-pm") {
                    const active = feAgent?.status === "done" && pmAgent?.status === "working";
                    return {
                        ...edge,
                        animated: active,
                        style: {
                            ...edge.style,
                            stroke: active ? "rgba(244, 114, 182, 0.7)" : "rgba(244, 114, 182, 0.3)",
                            strokeWidth: active ? 3 : 2,
                        },
                    };
                }
                return edge;
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

"use client";

import { useCallback, useMemo } from "react";
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

/* ── Custom Node & Edge Types ── */
const nodeTypes = { agentNode: AgentNode };
const edgeTypes = { letterEdge: LetterEdge };

/* ── Initial Nodes: Horizontal layout (person → person → person) ── */
const initialNodes: Node[] = [
    {
        id: "user-input",
        type: "agentNode",
        position: { x: 50, y: 180 },
        data: { label: "사용자 입력", role: "user", agentId: "user-input" },
    },
    {
        id: "pm-agent",
        type: "agentNode",
        position: { x: 350, y: 180 },
        data: { label: "PM 에이전트", role: "pm", agentId: "pm-agent" },
    },
    {
        id: "frontend-agent",
        type: "agentNode",
        position: { x: 650, y: 180 },
        data: { label: "Frontend 에이전트", role: "frontend", agentId: "frontend-agent" },
    },
];

/* ── Initial Edges: Letter-passing lines ── */
const initialEdges: Edge[] = [
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
];

export default function FlowCanvas() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const selectNode = useFlowStore((s) => s.selectNode);

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        type: "smoothstep",
                        animated: true,
                        style: { stroke: "rgba(148, 163, 184, 0.4)", strokeWidth: 2, strokeDasharray: "8 4" },
                    },
                    eds
                )
            ),
        [setEdges]
    );

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            selectNode(node.id);
        },
        [selectNode]
    );

    const onPaneClick = useCallback(() => {
        selectNode(null);
    }, [selectNode]);

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
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="rgba(255, 255, 255, 0.04)"
                />
                <Controls
                    className="!bg-gray-900/80 !border-white/10 !rounded-lg !shadow-xl [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-white/50 [&>button:hover]:!bg-white/5 [&>button:hover]:!text-white/80"
                />
                <MiniMap
                    nodeColor={() => "rgba(99, 102, 241, 0.5)"}
                    maskColor="rgba(3, 7, 18, 0.85)"
                    className="!bg-gray-900/60 !border-white/10 !rounded-lg"
                    style={{ width: 120, height: 80 }}
                />
            </ReactFlow>
        </div>
    );
}

"use client";

import { memo } from "react";
import {
    EdgeProps,
    getSmoothStepPath,
} from "reactflow";
import { useFlowStore } from "@/store/store";

/**
 * Custom edge that renders:
 * 1. A dashed path between nodes
 * 2. An envelope emoji (✉️) that slides along the path when the source agent is "working"
 */
function LetterEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
}: EdgeProps) {
    const sourceAgentId = data?.sourceAgentId as string | undefined;
    const agent = useFlowStore((s) =>
        s.agents.find((a) => a.id === sourceAgentId)
    );
    const isWorking = agent?.status === "working";
    const isDone = agent?.status === "done";

    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
    });

    return (
        <>
            {/* Base dashed path */}
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                style={{
                    ...style,
                    strokeDasharray: "8 4",
                    fill: "none",
                    transition: "stroke 0.5s",
                    stroke: isDone
                        ? (style.stroke as string)?.replace("0.4", "0.7") || "rgba(99, 102, 241, 0.7)"
                        : (style.stroke as string) || "rgba(99, 102, 241, 0.4)",
                }}
            />

            {/* Animated "glow" trail when working */}
            {isWorking && (
                <path
                    d={edgePath}
                    style={{
                        fill: "none",
                        stroke: (style.stroke as string)?.replace("0.4", "0.6") || "rgba(99, 102, 241, 0.6)",
                        strokeWidth: 3,
                        strokeDasharray: "12 60",
                        filter: "blur(2px)",
                    }}
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="72"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </path>
            )}

            {/* ✉️ Envelope sliding along the path */}
            {isWorking && (
                <g>
                    <text
                        fontSize="18"
                        dominantBaseline="central"
                        textAnchor="middle"
                    >
                        <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={edgePath}
                            rotate="auto"
                        />
                        ✉️
                    </text>
                </g>
            )}

            {/* ✅ Checkmark at midpoint when done */}
            {isDone && (
                <g>
                    <circle
                        cx={(sourceX + targetX) / 2}
                        cy={(sourceY + targetY) / 2}
                        r="10"
                        fill="rgba(16, 185, 129, 0.15)"
                        stroke="rgba(16, 185, 129, 0.5)"
                        strokeWidth="1"
                    />
                    <text
                        x={(sourceX + targetX) / 2}
                        y={(sourceY + targetY) / 2}
                        fontSize="10"
                        dominantBaseline="central"
                        textAnchor="middle"
                    >
                        ✓
                    </text>
                </g>
            )}
        </>
    );
}

export default memo(LetterEdge);

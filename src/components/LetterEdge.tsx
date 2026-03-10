"use client";

import { memo } from "react";
import {
    EdgeProps,
    getSmoothStepPath,
} from "reactflow";
import { useFlowStore } from "@/store/store";

/**
 * Custom edge with advanced animations:
 * - Dashed path with status-based coloring
 * - Glow trail when data is flowing
 * - Animated emoji (✉️/🔍/✅/⚡) sliding along the path
 * - Checkmark at midpoint when done
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
    const isReview = data?.isReview as boolean | undefined;
    const agent = useFlowStore((s) =>
        s.agents.find((a) => a.id === sourceAgentId)
    );
    const currentRound = useFlowStore((s) => s.currentRound);
    const isWorking = agent?.status === "working";
    const isDone = agent?.status === "done";
    const isError = agent?.status === "error";

    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
    });

    // Choose emoji based on edge type
    const emoji = isReview ? "🔍" : (sourceAgentId === "user-input" ? "📝" : "✉️");

    const baseStroke = (style.stroke as string) || "rgba(99, 102, 241, 0.4)";
    const activeStroke = baseStroke.replace(/[\d.]+\)$/, "0.8)");
    const doneStroke = baseStroke.replace(/[\d.]+\)$/, "0.6)");
    const errorStroke = "rgba(239, 68, 68, 0.4)";

    const currentStroke = isError ? errorStroke : isDone ? doneStroke : isWorking ? activeStroke : baseStroke;

    return (
        <>
            {/* Base dashed path */}
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                style={{
                    ...style,
                    strokeDasharray: isReview ? "6 4" : "8 4",
                    fill: "none",
                    transition: "stroke 0.5s, stroke-width 0.3s",
                    stroke: currentStroke,
                    strokeWidth: isWorking ? 3 : (style.strokeWidth as number) || 2,
                }}
            />

            {/* Animated glow trail */}
            {isWorking && (
                <path
                    d={edgePath}
                    style={{
                        fill: "none",
                        stroke: activeStroke,
                        strokeWidth: 5,
                        strokeDasharray: "12 60",
                        filter: "blur(3px)",
                        opacity: 0.6,
                    }}
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="72"
                        to="0"
                        dur="1.2s"
                        repeatCount="indefinite"
                    />
                </path>
            )}

            {/* Emoji sliding along path */}
            {isWorking && (
                <g>
                    <text
                        fontSize="16"
                        dominantBaseline="central"
                        textAnchor="middle"
                    >
                        <animateMotion
                            dur={isReview ? "1.8s" : "2.2s"}
                            repeatCount="indefinite"
                            path={edgePath}
                            rotate="auto"
                        />
                        {emoji}
                    </text>
                </g>
            )}

            {/* Done: checkmark */}
            {isDone && (
                <g>
                    <circle
                        cx={(sourceX + targetX) / 2}
                        cy={(sourceY + targetY) / 2}
                        r="10"
                        fill="rgba(16, 185, 129, 0.15)"
                        stroke="rgba(16, 185, 129, 0.5)"
                        strokeWidth="1"
                    >
                        <animate
                            attributeName="r"
                            from="0"
                            to="10"
                            dur="0.4s"
                            fill="freeze"
                        />
                    </circle>
                    <text
                        x={(sourceX + targetX) / 2}
                        y={(sourceY + targetY) / 2}
                        fontSize="10"
                        fill="rgba(16, 185, 129, 0.9)"
                        dominantBaseline="central"
                        textAnchor="middle"
                    >
                        ✓
                    </text>
                </g>
            )}

            {/* Error: X mark */}
            {isError && (
                <g>
                    <circle
                        cx={(sourceX + targetX) / 2}
                        cy={(sourceY + targetY) / 2}
                        r="10"
                        fill="rgba(239, 68, 68, 0.15)"
                        stroke="rgba(239, 68, 68, 0.5)"
                        strokeWidth="1"
                    />
                    <text
                        x={(sourceX + targetX) / 2}
                        y={(sourceY + targetY) / 2}
                        fontSize="10"
                        fill="rgba(239, 68, 68, 0.9)"
                        dominantBaseline="central"
                        textAnchor="middle"
                    >
                        ✗
                    </text>
                </g>
            )}

            {/* Round indicator during debate */}
            {isWorking && isReview && currentRound > 0 && (
                <g>
                    <circle
                        cx={(sourceX + targetX) / 2}
                        cy={(sourceY + targetY) / 2 - 18}
                        r="8"
                        fill="rgba(244, 114, 182, 0.2)"
                        stroke="rgba(244, 114, 182, 0.4)"
                        strokeWidth="1"
                    />
                    <text
                        x={(sourceX + targetX) / 2}
                        y={(sourceY + targetY) / 2 - 18}
                        fontSize="8"
                        fill="rgba(244, 114, 182, 0.9)"
                        dominantBaseline="central"
                        textAnchor="middle"
                        fontWeight="bold"
                    >
                        R{currentRound}
                    </text>
                </g>
            )}
        </>
    );
}

export default memo(LetterEdge);

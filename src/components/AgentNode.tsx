"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Loader2, Check, Circle, User, ClipboardList, Code2, AlertCircle, Server } from "lucide-react";
import { useAgentStore, AgentStatus } from "@/store";

/* ── Role config ── */
const roleConfig: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    glowColor: string;
    icon: typeof User;
}> = {
    user: { label: "사용자", color: "#818cf8", bgColor: "rgba(129,140,248,0.12)", glowColor: "129,140,248", icon: User },
    pm: { label: "PM", color: "#34d399", bgColor: "rgba(52,211,153,0.12)", glowColor: "52,211,153", icon: ClipboardList },
    frontend: { label: "개발자", color: "#f472b6", bgColor: "rgba(244,114,182,0.12)", glowColor: "244,114,182", icon: Code2 },
    backend: { label: "백엔드", color: "#fbbf24", bgColor: "rgba(251,191,36,0.12)", glowColor: "251,191,36", icon: Server },
};

/* ── Status badge ── */
function StatusBadge({ status }: { status: AgentStatus }) {
    if (status === "working") {
        return (
            <div className="flex items-center gap-1.5 mt-2">
                <div className="relative">
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-blue-400/20 animate-ping" />
                </div>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wide animate-pulse">작업중...</span>
            </div>
        );
    }
    if (status === "done") {
        return (
            <div className="flex items-center gap-1.5 mt-2 animate-[fadeInUp_0.3s_ease-out]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">완료</span>
            </div>
        );
    }
    if (status === "error") {
        return (
            <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] text-red-400 font-semibold">오류</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5 mt-2">
            <Circle className="w-3 h-3 text-white/15" />
            <span className="text-[10px] text-white/20 font-medium">대기중</span>
        </div>
    );
}

/* ── Agent Node ── */
function AgentNode({ data }: NodeProps) {
    const { role, agentId } = data as { role: string; label: string; agentId: string };
    const agent = useAgentStore((s) => s.agents.find((a) => a.id === agentId));
    const currentRound = useAgentStore((s) => s.currentRound);
    const config = roleConfig[role] || roleConfig.user;
    const status = agent?.status || "idle";
    const name = agent?.name || data.label;
    const isWorking = status === "working";
    const isDone = status === "done";
    const Icon = config.icon;

    return (
        <>
            <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-white/20 !border-white/10 !-left-1" />

            <div className="flex flex-col items-center select-none transition-transform duration-500 ease-out"
                style={{ transform: isWorking ? "scale(1.08)" : "scale(1)" }}>
                {/* Outer ring glow */}
                <div className={`relative transition-all duration-700 ${isWorking ? "scale-110" : "scale-100"}`}>
                    {/* Pulsing glow ring */}
                    {isWorking && (
                        <>
                            <div
                                className="absolute inset-[-8px] rounded-full animate-ping opacity-20"
                                style={{ backgroundColor: config.color }}
                            />
                            <div
                                className="absolute inset-[-4px] rounded-full animate-pulse opacity-30"
                                style={{ backgroundColor: config.color }}
                            />
                        </>
                    )}
                    {isDone && (
                        <div
                            className="absolute inset-[-3px] rounded-full opacity-15"
                            style={{ backgroundColor: config.color }}
                        />
                    )}

                    {/* Icon circle */}
                    <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500`}
                        style={{
                            backgroundColor: config.bgColor,
                            borderColor: isWorking ? config.color : isDone ? config.color : `rgba(${config.glowColor},0.15)`,
                            boxShadow: isWorking
                                ? `0 0 30px rgba(${config.glowColor},0.4), 0 0 60px rgba(${config.glowColor},0.15), inset 0 0 20px rgba(${config.glowColor},0.1)`
                                : isDone
                                    ? `0 0 15px rgba(${config.glowColor},0.2)`
                                    : "none",
                        }}
                    >
                        <Icon
                            className={`w-6 h-6 transition-all duration-300 ${isWorking ? "animate-bounce" : ""}`}
                            style={{ color: config.color }}
                        />
                    </div>
                </div>

                <div className="mt-2.5 text-center">
                    <p className={`text-xs font-bold transition-colors duration-300 ${isWorking ? "text-white" : isDone ? "text-white/90" : "text-white/70"}`}>
                        {name}
                    </p>
                    <p className="text-[9px] text-white/25 font-mono uppercase mt-0.5">{config.label}</p>
                    {role !== "user" && currentRound > 0 && isWorking && (
                        <p className="text-[9px] text-white/20 font-mono mt-0.5">Round {currentRound}</p>
                    )}
                    <StatusBadge status={status} />
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-white/20 !border-white/10 !-right-1" />
        </>
    );
}

export default memo(AgentNode);

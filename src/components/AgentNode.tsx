"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Loader2, Check, Circle, User, ClipboardList, Code2 } from "lucide-react";
import { useFlowStore, AgentStatus } from "@/store/store";

/* ── Role config ── */
const roleConfig: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    icon: typeof User;
}> = {
    user: { label: "사용자", color: "#818cf8", bgColor: "rgba(129,140,248,0.12)", icon: User },
    pm: { label: "PM", color: "#34d399", bgColor: "rgba(52,211,153,0.12)", icon: ClipboardList },
    frontend: { label: "개발자", color: "#f472b6", bgColor: "rgba(244,114,182,0.12)", icon: Code2 },
};

/* ── Status text ── */
function StatusText({ status }: { status: AgentStatus }) {
    if (status === "working") {
        return (
            <div className="flex items-center gap-1 mt-1.5">
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                <span className="text-[10px] text-blue-400 font-medium">전달 중...</span>
            </div>
        );
    }
    if (status === "done") {
        return (
            <div className="flex items-center gap-1 mt-1.5">
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">전달 완료</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 mt-1.5">
            <Circle className="w-3 h-3 text-white/20" />
            <span className="text-[10px] text-white/20 font-medium">대기중</span>
        </div>
    );
}

/* ── Agent Node ── */
function AgentNode({ data }: NodeProps) {
    const { role, agentId } = data as { role: string; label: string; agentId: string };
    const agent = useFlowStore((s) => s.agents.find((a) => a.id === agentId));
    const config = roleConfig[role] || roleConfig.user;
    const status = agent?.status || "idle";
    const name = agent?.name || data.label;
    const isWorking = status === "working";
    const Icon = config.icon;

    return (
        <>
            <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-white/20 !border-white/10" />

            <div className="flex flex-col items-center select-none">
                {/* Icon circle */}
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${isWorking ? "animate-pulse" : ""}`}
                    style={{
                        backgroundColor: config.bgColor,
                        borderColor: `${config.color}30`,
                        boxShadow: isWorking ? `0 0 20px ${config.color}20` : "none",
                    }}
                >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>

                <div className="mt-2 text-center">
                    <p className="text-xs font-semibold text-white/85">{name}</p>
                    <p className="text-[9px] text-white/30 font-mono uppercase">{config.label}</p>
                    <StatusText status={status} />
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-white/20 !border-white/10" />
        </>
    );
}

export default memo(AgentNode);

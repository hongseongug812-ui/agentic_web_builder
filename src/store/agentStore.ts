import { create } from "zustand";

/* ── API Config ── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

/* ── Types ── */
export type AgentStatus = "idle" | "working" | "done" | "error";

export interface AgentState {
    id: string;
    name: string;
    role: "user" | "pm" | "frontend" | "backend";
    status: AgentStatus;
}

export interface DebateMessage {
    agent: string;
    round: number;
    message_type: "plan" | "review" | "be_review" | "revision" | "approval" | "code" | "be_code" | "qa_pass" | "qa_fail";
    content: string;
    data?: Record<string, unknown>;
}

/* ── Default agents ── */
const defaultAgents: AgentState[] = [
    { id: "user-input", name: "사용자 입력", role: "user", status: "idle" },
    { id: "classifier-agent", name: "🔀 분류기", role: "pm", status: "idle" },
    { id: "cto-agent", name: "🧑‍💼 CTO", role: "pm", status: "idle" },
    { id: "fe-lead-agent", name: "👨‍💻 FE Lead", role: "frontend", status: "idle" },
    { id: "fe-dev-agent", name: "👩‍💻 FE Dev", role: "frontend", status: "idle" },
    { id: "be-lead-agent", name: "🔧 BE Lead", role: "backend", status: "idle" },
    { id: "be-dev-agent", name: "🔩 BE Dev", role: "backend", status: "idle" },
    { id: "qa-agent", name: "🔍 QA", role: "pm", status: "idle" },
];

/* ── Store Interface ── */
interface AgentStore {
    /* Agent state */
    agents: AgentState[];
    isRunning: boolean;
    lastGeneratedPrompt: string | null;
    setAgentStatus: (id: string, status: AgentStatus) => void;
    resetAllAgents: () => void;

    /* Debate & Output */
    agentOutputData: Record<string, unknown>;
    debateMessages: DebateMessage[];
    currentRound: number;
    error: string | null;
    warnings: string[];
    setError: (e: string | null) => void;
    clearDebate: () => void;

    /* Pipeline Progress */
    pipelineStep: number;
    pipelineTotal: number;
    pipelineLabel: string;
    retryAvailable: boolean;
    retryInfo: { agent: string; stage: string; attempt: number; maxAttempts: number } | null;

    /* Core actions */
    runSequence: () => void;
    retrySequence: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
    /* ── Agent state ── */
    agents: defaultAgents.map((a) => ({ ...a })),
    isRunning: false,
    lastGeneratedPrompt: null,

    setAgentStatus: (id, status) =>
        set((state) => ({
            agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

    resetAllAgents: () =>
        set({
            agents: defaultAgents.map((a) => ({
                ...a,
                status: "idle" as AgentStatus,
            })),
        }),

    /* ── Debate & Output ── */
    agentOutputData: {},
    debateMessages: [],
    currentRound: 0,
    error: null,
    warnings: [],
    setError: (e) => set({ error: e }),
    clearDebate: () => set({
        debateMessages: [],
        agentOutputData: {},
        currentRound: 0,
        error: null,
        warnings: [],
        pipelineStep: 0,
        pipelineLabel: "",
        retryInfo: null,
    }),

    /* ── Pipeline Progress ── */
    pipelineStep: 0,
    pipelineTotal: 20,
    pipelineLabel: "",
    retryAvailable: false,
    retryInfo: null,

    /* ── Run Sequence ── */
    runSequence: () => {
        const { isRunning, setAgentStatus } = get();
        if (isRunning) return;

        // Import projectStore lazily to avoid circular deps
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useProjectStore } = require("./projectStore");
        const projectState = useProjectStore.getState();
        const prompt = projectState.generatePrompt();
        const selectedProvider = projectState.selectedProvider;

        // Update UI store
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useUIStore } = require("./uiStore");
        useUIStore.getState().setView("canvas");
        useUIStore.getState().setSidebarCollapsed(true);

        set({
            lastGeneratedPrompt: prompt,
            isRunning: true,
            error: null,
            warnings: [],
            retryInfo: null,
        });
        get().resetAllAgents();
        get().clearDebate();

        // 1) 사용자 입력 노드 완료
        setAgentStatus("user-input", "working");
        setTimeout(() => {
            setAgentStatus("user-input", "done");
            set((state) => ({
                agentOutputData: {
                    ...state.agentOutputData,
                    "user-input": {
                        type: "user_prompt",
                        content: prompt,
                        timestamp: new Date().toISOString(),
                    },
                },
            }));
        }, 600);

        // 2) WebSocket 연결
        let ws: WebSocket | null = null;
        try {
            ws = new WebSocket(`${WS_BASE}/ws/status`);
        } catch {
            // WebSocket 연결 실패 시에도 API는 호출
        }

        if (ws) {
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    const { event: evtType, data } = msg;

                    if (evtType === "agent_start" && data?.agent) {
                        setAgentStatus(data.agent, "working");
                        if (data.round) set({ currentRound: data.round });

                        const labelMap: Record<string, string> = {
                            "cto-agent": data.action === "revising" ? `CTO 기획서 수정 (R${data.round})` : "CTO 기획서 작성",
                            "fe-lead-agent": data.action === "reviewing" ? `FE Lead 리뷰 (R${data.round})` : data.action === "generating" ? "FE Lead 코드 생성" : data.action === "revising" ? "FE Lead 코드 수정" : "FE Lead",
                            "fe-dev-agent": data.action === "reviewing" ? `FE Dev 리뷰 (R${data.round})` : data.action === "code_review" ? "FE Dev 코드 리뷰" : "FE Dev",
                            "be-lead-agent": data.action === "reviewing" ? `BE Lead 리뷰 (R${data.round})` : data.action === "generating" ? "BE Lead 코드 생성" : "BE Lead",
                            "be-dev-agent": data.action === "reviewing" ? `BE Dev 리뷰 (R${data.round})` : "BE Dev",
                            "qa-agent": "QA 최종 검수",
                        };
                        set((state) => ({
                            pipelineStep: state.pipelineStep + 0.5,
                            pipelineLabel: labelMap[data.agent] || data.action || "",
                        }));
                    } else if (evtType === "agent_done" && data?.agent) {
                        setAgentStatus(data.agent, "done");
                        set((state) => ({ pipelineStep: state.pipelineStep + 0.5 }));
                    } else if (evtType === "debate_message" && data) {
                        set((state) => ({
                            debateMessages: [...state.debateMessages, data as DebateMessage],
                        }));
                    } else if (evtType === "code_revised" && data?.files) {
                        set((state) => ({
                            agentOutputData: {
                                ...state.agentOutputData,
                                "frontend-agent": {
                                    type: "generated_code",
                                    data: { files: data.files, framework: "Next.js 14", summary: data.summary || "" },
                                },
                                "fe-lead-agent": {
                                    type: "generated_code",
                                    data: { files: data.files, framework: "Next.js 14", summary: data.summary || "" },
                                },
                            },
                        }));
                    } else if (evtType === "agent_retry" && data) {
                        set({ retryInfo: {
                            agent: data.agent as string,
                            stage: data.stage as string,
                            attempt: data.attempt as number,
                            maxAttempts: data.max_attempts as number,
                        }, pipelineLabel: `재시도 중... (${data.attempt}/${data.max_attempts})` });
                    } else if (evtType === "agent_warning" && data) {
                        set((state) => ({
                            warnings: [...state.warnings, data.message as string || "에이전트 경고"],
                            retryInfo: null,
                        }));
                    } else if (evtType === "pipeline_error" && data) {
                        set({
                            error: data.message as string || "파이프라인 오류",
                            isRunning: false,
                            retryAvailable: true,
                            retryInfo: null,
                        });
                    } else if (evtType === "pipeline_complete") {
                        set({ isRunning: false, pipelineLabel: "완료", retryAvailable: false, retryInfo: null });
                    } else if (evtType === "error") {
                        set({ error: data?.message || "알 수 없는 오류", isRunning: false, retryAvailable: true });
                    }
                } catch {
                    /* ignore parse errors */
                }
            };
            ws.onerror = () => {
                /* silent — API call will still work */
            };

            let wsRetryCount = 0;
            ws.onclose = () => {
                if (get().isRunning && wsRetryCount < 3) {
                    const delay = Math.min(1000 * Math.pow(2, wsRetryCount), 8000);
                    wsRetryCount++;
                    setTimeout(() => {
                        try {
                            const newWs = new WebSocket(`${WS_BASE}/ws/status`);
                            newWs.onmessage = ws!.onmessage;
                            newWs.onerror = ws!.onerror;
                            newWs.onclose = ws!.onclose;
                            ws = newWs;
                        } catch { /* silent */ }
                    }, delay);
                }
            };
        }

        // 3) POST /api/orchestrate
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/orchestrate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, max_rounds: 3, provider: selectedProvider }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({ detail: "서버 오류" }));
                    set({
                        error: errData.detail || `서버 오류 (${res.status})`,
                        isRunning: false,
                        retryAvailable: true,
                    });
                    setAgentStatus("cto-agent", "error");
                    setAgentStatus("fe-lead-agent", "error");
                    setAgentStatus("fe-dev-agent", "error");
                    setAgentStatus("be-lead-agent", "error");
                    setAgentStatus("be-dev-agent", "error");
                    setAgentStatus("qa-agent", "error");
                    ws?.close();
                    return;
                }

                const result = await res.json();

                set((state) => ({
                    agentOutputData: {
                        ...state.agentOutputData,
                        "cto-agent": {
                            type: "project_plan",
                            data: result.plan,
                            rounds: result.total_rounds,
                        },
                        "frontend-agent": {
                            type: "generated_code",
                            data: result.code,
                        },
                        "fe-lead-agent": {
                            type: "generated_code",
                            data: result.code,
                        },
                        "backend-agent": {
                            type: "generated_code",
                            data: result.backend_code,
                        },
                        "be-lead-agent": {
                            type: "generated_code",
                            data: result.backend_code,
                        },
                    },
                    debateMessages: result.debate_log || state.debateMessages,
                    isRunning: false,
                }));

                setAgentStatus("cto-agent", "done");
                setAgentStatus("fe-lead-agent", "done");
                setAgentStatus("fe-dev-agent", "done");
                setAgentStatus("be-lead-agent", result.backend_code ? "done" : "idle");
                setAgentStatus("be-dev-agent", result.backend_code ? "done" : "idle");
                setAgentStatus("qa-agent", "done");
            } catch (err) {
                set({
                    error: err instanceof Error ? err.message : "네트워크 오류",
                    isRunning: false,
                    retryAvailable: true,
                });
                setAgentStatus("cto-agent", "error");
                setAgentStatus("fe-lead-agent", "error");
                setAgentStatus("fe-dev-agent", "error");
                setAgentStatus("be-lead-agent", "error");
                setAgentStatus("be-dev-agent", "error");
                setAgentStatus("qa-agent", "error");
            } finally {
                ws?.close();
            }
        })();
    },

    /* ── Retry ── */
    retrySequence: () => {
        const { retryAvailable } = get();
        if (!retryAvailable) return;
        set({ error: null, retryAvailable: false, pipelineStep: 0, pipelineLabel: "" });
        get().runSequence();
    },
}));

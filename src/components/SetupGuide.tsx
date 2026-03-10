"use client";

import { Key, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { useFlowStore } from "@/store/store";

/**
 * API 키 설정 가이드 — 프로바이더가 전혀 설정되지 않았을 때 표시
 */
export default function SetupGuide() {
    const providers = useFlowStore((s) => s.availableProviders);

    // 로딩 중이거나 프로바이더가 아직 없으면 표시 X
    if (providers.length === 0) return null;

    const anyConfigured = providers.some((p) => p.configured);

    // 하나라도 설정되어 있으면 가이드 숨기기
    if (anyConfigured) return null;

    const providerLinks: Record<string, string> = {
        gemini: "https://aistudio.google.com/app/apikey",
        claude: "https://console.anthropic.com/settings/keys",
        gpt: "https://platform.openai.com/api-keys",
    };

    const envVarNames: Record<string, string> = {
        gemini: "GEMINI_API_KEY",
        claude: "ANTHROPIC_API_KEY",
        gpt: "OPENAI_API_KEY",
    };

    return (
        <div className="mx-auto max-w-md my-6 p-5 rounded-2xl bg-yellow-500/[0.04] border border-yellow-500/20 animate-[fadeInUp_0.4s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                    <Key className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="text-sm font-bold text-yellow-300">API 키 설정이 필요합니다</h3>
            </div>

            <p className="text-[11px] text-white/40 mb-4 leading-relaxed">
                AI 에이전트를 사용하려면 <code className="text-yellow-300/60 bg-white/[0.04] px-1 py-0.5 rounded">backend/.env</code> 파일에
                최소 하나의 API 키를 설정해야 합니다.
            </p>

            <div className="space-y-2">
                {providers.map((p) => (
                    <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{p.icon}</span>
                            <div>
                                <span className="text-[11px] text-white/70 font-medium">{p.name}</span>
                                <p className="text-[9px] text-white/25 font-mono">{envVarNames[p.id]}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {p.configured ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                                <XCircle className="w-3.5 h-3.5 text-white/15" />
                            )}
                            <a
                                href={providerLinks[p.id]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
                                aria-label={`${p.name} API 키 발급 페이지`}
                            >
                                키 발급
                                <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-white/20 mt-3 text-center">
                키 설정 후 서버가 자동 재시작됩니다 (uvicorn --reload)
            </p>
        </div>
    );
}

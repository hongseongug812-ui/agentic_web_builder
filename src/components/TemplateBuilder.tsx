"use client";

import { useState, useEffect } from "react";
import {
    Check,
    Sparkles,
    LogIn,
    CreditCard,
    SearchIcon,
    Moon,
    Smartphone,
    Globe,
    Cpu,
    ChevronRight,
    ChevronLeft,
    Rocket,
    Pencil,
} from "lucide-react";
import {
    useFlowStore,
    TEMPLATES,
    getStylesForTemplate,
    colorOptions,
    featureOptions,
    ColorName,
    FeatureName,
    AVAILABLE_SECTIONS,
    FONT_OPTIONS,
    RADIUS_OPTIONS,
    SPACING_OPTIONS,
    LAYOUT_OPTIONS,
} from "@/store/store";

/* ── Color swatches ── */
const colorSwatches: Record<string, string> = {
    Blue: "#3b82f6",
    Dark: "#1e1e2e",
    Neon: "#22d3ee",
    Sunset: "#f97316",
    Forest: "#22c55e",
    "Minimal White": "#f8fafc",
};

/* ── Feature icons ── */
const featureIcons: Record<string, React.ReactNode> = {
    로그인: <LogIn className="w-4 h-4" />,
    결제: <CreditCard className="w-4 h-4" />,
    검색: <SearchIcon className="w-4 h-4" />,
    다크모드: <Moon className="w-4 h-4" />,
    반응형: <Smartphone className="w-4 h-4" />,
    다국어: <Globe className="w-4 h-4" />,
};

const STEPS = [
    { id: "type", title: "웹사이트 종류", question: "어떤 웹사이트를 만들고 싶으세요?", desc: "AI가 만들 사이트의 컨셉을 선택하세요" },
    { id: "style", title: "스타일", question: "어떤 스타일이 좋으세요?", desc: "선택한 종류에 맞는 레이아웃 스타일" },
    { id: "color", title: "테마 컬러", question: "색상 분위기를 골라주세요", desc: "전체 사이트의 컬러 톤을 결정합니다" },
    { id: "sections", title: "섹션 구성", question: "어떤 섹션이 필요하세요?", desc: "페이지를 구성할 블록들을 선택하세요" },
    { id: "features", title: "추가 기능", question: "필요한 기능을 선택하세요", desc: "사이트에 넣을 기능을 토글하세요" },
    { id: "design", title: "디자인 세팅", question: "세부 디자인을 설정하세요", desc: "폰트, 모서리, 여백, AI 모델 선택" },
    { id: "prompt", title: "최종 확인", question: "프롬프트를 확인하고 시작하세요!", desc: "AI에게 전달할 전체 지시를 확인합니다" },
] as const;

export default function TemplateBuilder() {
    const [step, setStep] = useState(0);
    const selectedTemplateId = useFlowStore((s) => s.selectedTemplateId);
    const selectedStyleId = useFlowStore((s) => s.selectedStyleId);
    const selectedColor = useFlowStore((s) => s.selectedColor);
    const features = useFlowStore((s) => s.features);
    const isRunning = useFlowStore((s) => s.isRunning);
    const setTemplate = useFlowStore((s) => s.setTemplate);
    const setStyle = useFlowStore((s) => s.setStyle);
    const setColor = useFlowStore((s) => s.setColor);
    const toggleFeature = useFlowStore((s) => s.toggleFeature);
    const generatePrompt = useFlowStore((s) => s.generatePrompt);
    const promptMode = useFlowStore((s) => s.promptMode);
    const manualPrompt = useFlowStore((s) => s.manualPrompt);
    const setPromptMode = useFlowStore((s) => s.setPromptMode);
    const setManualPrompt = useFlowStore((s) => s.setManualPrompt);
    const selectedProvider = useFlowStore((s) => s.selectedProvider);
    const availableProviders = useFlowStore((s) => s.availableProviders);
    const setProvider = useFlowStore((s) => s.setProvider);
    const fetchProviders = useFlowStore((s) => s.fetchProviders);
    const selectedSections = useFlowStore((s) => s.selectedSections);
    const addSection = useFlowStore((s) => s.addSection);
    const removeSection = useFlowStore((s) => s.removeSection);
    const designTokens = useFlowStore((s) => s.designTokens);
    const setDesignToken = useFlowStore((s) => s.setDesignToken);
    const runSequence = useFlowStore((s) => s.runSequence);

    // URL analysis state
    const [urlInput, setUrlInput] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => { fetchProviders(); }, [fetchProviders]);

    const prompt = generatePrompt();
    const styleOptions = getStylesForTemplate(selectedTemplateId);
    const currentStep = STEPS[step];

    function handleStart() {
        if (isRunning) return;
        runSequence();
    }

    /* ── Step content ── */
    function renderStepContent() {
        switch (currentStep.id) {
            case "type":
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {TEMPLATES.map((t) => {
                            const sel = selectedTemplateId === t.id;
                            return (
                                <button key={t.id} onClick={() => setTemplate(t.id)}
                                    className={`group relative rounded-2xl overflow-hidden text-left transition-all duration-200
                                        ${sel ? "ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/20 -translate-y-1" : "ring-1 ring-white/[0.08] hover:ring-white/20 hover:-translate-y-1 hover:shadow-xl"}`}
                                >
                                    <div className="relative h-[120px] overflow-hidden bg-white/[0.03]">
                                        <img src={t.thumbnail} alt={t.name} className={`w-full h-full object-cover transition-all duration-300 ${sel ? "scale-110" : "group-hover:scale-110"}`} />
                                        <div className={`absolute inset-0 transition-all ${sel ? "bg-black/20" : "bg-black/50 group-hover:bg-black/20"}`} />
                                        {sel && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg"><Check className="w-3.5 h-3.5 text-white" /></div>}
                                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-8 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className={`text-xs font-bold ${sel ? "text-indigo-300" : "text-white/80"}`}>{t.name}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-2 ${sel ? "bg-indigo-500/[0.08]" : "bg-white/[0.02]"}`}>
                                        <p className={`text-[10px] line-clamp-1 ${sel ? "text-indigo-300/60" : "text-white/30"}`}>{t.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case "style":
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {styleOptions.map((s) => {
                            const sel = selectedStyleId === s.id;
                            return (
                                <button key={s.id} onClick={() => setStyle(s.id)}
                                    className={`group relative rounded-2xl overflow-hidden text-left transition-all duration-200
                                        ${sel ? "ring-2 ring-purple-500 shadow-xl shadow-purple-500/20 -translate-y-1" : "ring-1 ring-white/[0.06] hover:ring-white/15 hover:-translate-y-1"}`}
                                >
                                    <div className="relative h-[100px] overflow-hidden bg-white/[0.02]">
                                        <img src={s.thumbnail} alt={s.name} className={`w-full h-full object-cover transition-all duration-300 ${sel ? "scale-110" : "group-hover:scale-110"}`} />
                                        <div className={`absolute inset-0 ${sel ? "bg-black/20" : "bg-black/50 group-hover:bg-black/25"}`} />
                                        {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                    </div>
                                    <div className={`px-3 py-2 ${sel ? "bg-purple-500/[0.08]" : "bg-white/[0.02]"}`}>
                                        <p className={`text-[11px] font-semibold truncate ${sel ? "text-purple-300" : "text-white/50"}`}>{s.name}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case "color":
                return (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 max-w-[600px]">
                        {colorOptions.map((c) => (
                            <button key={c} onClick={() => setColor(c as ColorName)}
                                className={`group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-200
                                    ${selectedColor === c ? "bg-white/[0.06] ring-2 ring-indigo-500 shadow-lg" : "bg-white/[0.02] ring-1 ring-white/[0.06] hover:bg-white/[0.05] hover:ring-white/15"}`}
                            >
                                <div className={`w-14 h-14 rounded-full transition-all duration-200 ${selectedColor === c ? "ring-3 ring-offset-2 ring-offset-gray-950 ring-indigo-400 scale-110" : "hover:scale-105"}`}
                                    style={{ backgroundColor: colorSwatches[c] }}
                                >
                                    {selectedColor === c && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Check className="w-5 h-5" style={{ color: c === "Minimal White" || c === "Neon" ? "#000" : "#fff" }} />
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs font-medium ${selectedColor === c ? "text-white/80" : "text-white/35"}`}>{c}</span>
                            </button>
                        ))}
                    </div>
                );

            case "sections":
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-[900px]">
                        {AVAILABLE_SECTIONS.map((sec) => {
                            const on = selectedSections.includes(sec.id);
                            return (
                                <button key={sec.id} onClick={() => on ? removeSection(sec.id) : addSection(sec.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${on ? "bg-emerald-500/10 border border-emerald-500/30 shadow-sm" : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"}`}
                                >
                                    <span className="text-lg flex-shrink-0">{sec.icon}</span>
                                    <div className="flex-1 text-left">
                                        <p className={`text-xs font-semibold ${on ? "text-white/90" : "text-white/50"}`}>{sec.name}</p>
                                        <p className={`text-[10px] ${on ? "text-emerald-400/60" : "text-white/20"}`}>{sec.description}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${on ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10"}`}>
                                        {on && <Check className="w-3 h-3" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case "features":
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-[600px]">
                        {featureOptions.map((f) => {
                            const on = features[f as FeatureName];
                            return (
                                <button key={f} onClick={() => toggleFeature(f as FeatureName)}
                                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl transition-all duration-200
                                        ${on ? "bg-indigo-500/10 border border-indigo-500/30 shadow-md shadow-indigo-500/5" : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"}`}
                                >
                                    <span className={`${on ? "text-indigo-400" : "text-white/30"}`}>{featureIcons[f]}</span>
                                    <span className={`text-xs font-medium ${on ? "text-white/80" : "text-white/40"}`}>{f}</span>
                                    <div className={`w-9 h-[20px] rounded-full relative transition-colors ${on ? "bg-indigo-500" : "bg-white/10"}`}>
                                        <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case "design":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px]">
                        {/* Font */}
                        <div>
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5 block">폰트</label>
                            <div className="grid grid-cols-2 gap-2">
                                {FONT_OPTIONS.map((f) => (
                                    <button key={f.id} onClick={() => setDesignToken("font", f.id)}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${designTokens.font === f.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{f.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* Radius */}
                        <div>
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5 block">모서리</label>
                            <div className="flex gap-2">
                                {RADIUS_OPTIONS.map((r) => (
                                    <button key={r.id} onClick={() => setDesignToken("borderRadius", r.id)}
                                        className={`flex-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${designTokens.borderRadius === r.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{r.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* Spacing */}
                        <div>
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5 block">여백</label>
                            <div className="flex gap-2">
                                {SPACING_OPTIONS.map((s) => (
                                    <button key={s.id} onClick={() => setDesignToken("spacing", s.id)}
                                        className={`flex-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${designTokens.spacing === s.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{s.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* Layout */}
                        <div>
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5 block">레이아웃</label>
                            <div className="flex flex-col gap-2">
                                {LAYOUT_OPTIONS.map((l) => (
                                    <button key={l.id} onClick={() => setDesignToken("layout", l.id)}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${designTokens.layout === l.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{l.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* AI Model */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <Cpu className="w-3 h-3" /> AI 모델
                            </label>
                            <div className="grid grid-cols-3 gap-2 max-w-[400px]">
                                {(availableProviders.length > 0 ? availableProviders : [
                                    { id: "gemini", name: "Gemini", icon: "✨", configured: false },
                                    { id: "claude", name: "Claude", icon: "🟠", configured: false },
                                    { id: "gpt", name: "GPT-4o", icon: "🟢", configured: false },
                                ]).map((p) => {
                                    const sel = selectedProvider === p.id;
                                    return (
                                        <button key={p.id} onClick={() => setProvider(p.id)} disabled={!p.configured}
                                            className={`relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-all text-center
                                                ${sel ? "bg-indigo-500/15 border border-indigo-500/40" : p.configured ? "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05]" : "bg-white/[0.01] border border-white/[0.04] opacity-40 cursor-not-allowed"}`}
                                        >
                                            <span className="text-xl">{p.icon}</span>
                                            <span className={`text-xs font-medium ${sel ? "text-indigo-300" : p.configured ? "text-white/60" : "text-white/25"}`}>{p.name}</span>
                                            {!p.configured && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[9px] font-bold">!</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Vercel Token */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                🔑 Vercel 배포 토큰 <span className="text-white/20 normal-case">(선택사항)</span>
                            </label>
                            <input
                                type="password"
                                placeholder="vercel_xxxxxxxxxxxxxxxx"
                                defaultValue={typeof window !== "undefined" ? localStorage.getItem("vercel_token") || "" : ""}
                                onChange={(e) => { if (typeof window !== "undefined") localStorage.setItem("vercel_token", e.target.value); }}
                                className="w-full max-w-[500px] px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-white/70 font-mono outline-none focus:border-indigo-500/40 placeholder:text-white/15 transition-all"
                            />
                            <p className="text-[10px] text-white/20 mt-1.5">Vercel에 배포하려면 <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener" className="text-indigo-400/60 underline hover:text-indigo-400">여기서</a> 토큰을 생성하세요</p>
                        </div>
                    </div>
                );

            case "prompt":
                return (
                    <div className="max-w-[800px] space-y-4">
                        <div className="flex gap-2">
                            <button onClick={() => setPromptMode("auto")}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${promptMode === "auto"
                                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-white/30 hover:text-white/50 border border-transparent"}`}
                            >✨ 자동 생성 프롬프트</button>
                            <button onClick={() => setPromptMode("manual")}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${promptMode === "manual"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-white/30 hover:text-white/50 border border-transparent"}`}
                            >✏️ 직접 입력</button>
                            <button onClick={() => setPromptMode("url" as "auto" | "manual")}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${(promptMode as string) === "url"
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-white/30 hover:text-white/50 border border-transparent"}`}
                            >🔗 URL 분석</button>
                        </div>

                        {(promptMode as string) === "url" ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="비슷하게 만들고 싶은 웹사이트 URL을 입력하세요 (예: https://stripe.com)"
                                        className="flex-1 px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] text-sm text-white/80 outline-none focus:border-cyan-500/40 placeholder:text-white/20 transition-all"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!urlInput.trim()) return;
                                            setIsAnalyzing(true);
                                            setAnalysisResult(null);
                                            try {
                                                const res = await fetch(`${API_BASE}/api/analyze-url`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ url: urlInput, provider: selectedProvider }),
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setAnalysisResult(data);
                                                    if (data.generated_prompt) {
                                                        setManualPrompt(data.generated_prompt);
                                                    }
                                                }
                                            } catch { /* silent */ } finally {
                                                setIsAnalyzing(false);
                                            }
                                        }}
                                        disabled={isAnalyzing || !urlInput.trim()}
                                        className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 flex-shrink-0"
                                    >
                                        {isAnalyzing ? "분석 중..." : "🔍 분석 시작"}
                                    </button>
                                </div>

                                {isAnalyzing && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.03]">
                                        <div className="w-5 h-5 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
                                        <span className="text-xs text-cyan-300/60">사이트를 분석하고 프롬프트를 생성하는 중...</span>
                                    </div>
                                )}

                                {analysisResult && (
                                    <>
                                        {/* 분석 요약 */}
                                        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 space-y-2">
                                            <p className="text-sm font-semibold text-cyan-300">✅ 분석 완료: {analysisResult.site_name}</p>
                                            <p className="text-xs text-white/50">{analysisResult.description}</p>
                                            {analysisResult.sections && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {analysisResult.sections.slice(0, 8).map((s: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-white/50 border border-white/[0.06]">{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {analysisResult.design_features && (
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {analysisResult.design_features.slice(0, 5).map((f: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300/60">✦ {f}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 생성된 프롬프트 (수정 가능) */}
                                        <div>
                                            <label className="text-[11px] font-medium text-cyan-300/60 mb-2 block">📝 생성된 프롬프트 (수정 가능)</label>
                                            <textarea
                                                value={manualPrompt}
                                                onChange={(e) => setManualPrompt(e.target.value)}
                                                className="w-full h-48 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4 text-sm leading-relaxed text-white/80 font-mono resize-none outline-none focus:border-cyan-500/40 placeholder:text-white/20 transition-all"
                                            />
                                            <p className="text-[10px] text-white/20 mt-1.5 text-right">{manualPrompt.length}자</p>
                                        </div>
                                    </>
                                )}

                                {!analysisResult && !isAnalyzing && (
                                    <p className="text-[10px] text-white/20">참고 사이트의 구조와 디자인을 AI가 분석하여 비슷한 스타일의 프롬프트를 자동 생성합니다.</p>
                                )}
                            </div>
                        ) : promptMode === "manual" ? (
                            <div>
                                <textarea value={manualPrompt} onChange={(e) => setManualPrompt(e.target.value)}
                                    placeholder={"원하는 웹사이트를 자유롭게 설명하세요...\n\n예: 프리미엄 SaaS 랜딩페이지를 만들어줘.\n다크 테마에 네온 색상, 히어로에 그라데이션 배경,\n가격표 3단, FAQ 아코디언, 글래스모피즘 카드..."}
                                    className="w-full h-64 rounded-2xl border border-purple-500/30 bg-purple-500/[0.05] p-4 text-sm leading-relaxed text-white/80 font-mono resize-none outline-none focus:border-purple-500/60 placeholder:text-white/20 transition-all"
                                />
                                <p className="text-[10px] text-white/20 mt-2 text-right">{manualPrompt.length}자</p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                                <p className="text-xs leading-relaxed text-indigo-300/70 font-mono whitespace-pre-wrap">{prompt}</p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    }

    /* ── Main render: full page ── */
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
            {/* Progress bar + step info */}
            <div className="px-8 pt-6 pb-4 flex-shrink-0">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mb-4 max-w-[500px]">
                    {STEPS.map((s, i) => (
                        <button key={s.id} onClick={() => setStep(i)}
                            className={`flex-1 h-2 rounded-full transition-all duration-300 cursor-pointer hover:opacity-80
                                ${i < step ? "bg-indigo-500" : i === step ? "bg-indigo-400" : "bg-white/[0.08]"}`}
                            title={s.title}
                        />
                    ))}
                </div>
                <p className="text-[11px] text-white/25 mb-4">{step + 1}/{STEPS.length} · {currentStep.title}</p>
                {/* Question */}
                <h2 className="text-2xl font-bold text-white/90 mb-1">{currentStep.question}</h2>
                <p className="text-sm text-white/35">{currentStep.desc}</p>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-8 pb-8" style={{ scrollbarWidth: "thin" }}>
                {renderStepContent()}
            </div>

            {/* Bottom navigation */}
            <div className="px-8 py-4 border-t border-white/[0.06] flex items-center gap-3 flex-shrink-0 bg-gray-950/90 backdrop-blur-sm">
                <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" /> 이전
                </button>
                <div className="flex-1" />
                {step < STEPS.length - 1 ? (
                    <button onClick={() => setStep(step + 1)}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all"
                    >
                        다음 <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button onClick={handleStart} disabled={isRunning}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Rocket className="w-4 h-4" />
                        {isRunning ? "생성 중..." : "AI로 사이트 생성 시작!"}
                    </button>
                )}
            </div>
        </div>
    );
}

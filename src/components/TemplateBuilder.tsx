"use client";

import {
    Layout,
    Search,
    BarChart3,
    Palette,
    Check,
    Sparkles,
    LogIn,
    CreditCard,
    SearchIcon,
    Moon,
    Smartphone,
    Globe,
    PanelLeftOpen,
    PanelLeftClose,
} from "lucide-react";
import {
    useFlowStore,
    TEMPLATES,
    STYLES_MAP,
    getStylesForTemplate,
    colorOptions,
    featureOptions,
    ColorName,
    FeatureName,
} from "@/store/store";

/* ── Template icons ── */
const templateIcons: Record<string, React.ReactNode> = {
    "검색창 스타일": <Search className="w-3.5 h-3.5" />,
    "SaaS 랜딩페이지": <Layout className="w-3.5 h-3.5" />,
    쇼핑몰: <CreditCard className="w-3.5 h-3.5" />,
    포트폴리오: <Palette className="w-3.5 h-3.5" />,
    블로그: <Layout className="w-3.5 h-3.5" />,
    대시보드: <BarChart3 className="w-3.5 h-3.5" />,
};

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
    로그인: <LogIn className="w-3 h-3" />,
    결제: <CreditCard className="w-3 h-3" />,
    검색: <SearchIcon className="w-3 h-3" />,
    다크모드: <Moon className="w-3 h-3" />,
    반응형: <Smartphone className="w-3 h-3" />,
    다국어: <Globe className="w-3 h-3" />,
};

export default function TemplateBuilder() {
    const selectedTemplateId = useFlowStore((s) => s.selectedTemplateId);
    const selectedStyleId = useFlowStore((s) => s.selectedStyleId);
    const selectedColor = useFlowStore((s) => s.selectedColor);
    const features = useFlowStore((s) => s.features);
    const isRunning = useFlowStore((s) => s.isRunning);
    const isSidebarCollapsed = useFlowStore((s) => s.isSidebarCollapsed);
    const setTemplate = useFlowStore((s) => s.setTemplate);
    const setStyle = useFlowStore((s) => s.setStyle);
    const setColor = useFlowStore((s) => s.setColor);
    const toggleFeature = useFlowStore((s) => s.toggleFeature);
    const generatePrompt = useFlowStore((s) => s.generatePrompt);
    const setSidebarCollapsed = useFlowStore((s) => s.setSidebarCollapsed);
    const promptMode = useFlowStore((s) => s.promptMode);
    const manualPrompt = useFlowStore((s) => s.manualPrompt);
    const setPromptMode = useFlowStore((s) => s.setPromptMode);
    const setManualPrompt = useFlowStore((s) => s.setManualPrompt);

    const prompt = generatePrompt();
    const disabled = isRunning;
    const styleOptions = getStylesForTemplate(selectedTemplateId);

    /* ── Collapsed state: thin vertical strip ── */
    if (isSidebarCollapsed) {
        return (
            <aside className="hidden md:flex flex-col w-[48px] flex-shrink-0 border-r border-white/[0.06] bg-gray-950 transition-all duration-300 items-center">
                <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="mt-3 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
                    title="패널 열기"
                >
                    <PanelLeftOpen className="w-4 h-4" />
                </button>
                {/* Vertical label */}
                <div className="mt-4 flex flex-col items-center">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400/50" />
                </div>
            </aside>
        );
    }

    /* ── Expanded state ── */
    return (
        <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-r border-white/[0.06] bg-gray-950 transition-all duration-300">
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400/70" />
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Template Builder
                    </span>
                </div>
                <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                    title="패널 접기"
                >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Scrollable content — disabled overlay when running */}
            <div className={`flex-1 overflow-y-auto relative ${disabled ? "pointer-events-none" : ""}`}>
                {disabled && (
                    <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="text-center px-6">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                            </div>
                            <p className="text-xs text-white/40">에이전트가 작업 중입니다</p>
                            <p className="text-[10px] text-white/20 mt-1">완료 후 다시 설정할 수 있습니다</p>
                        </div>
                    </div>
                )}

                {/* ── Template Selection (Horizontal Scroll) ── */}
                <div className="border-b border-white/[0.06] pt-4 pb-4">
                    <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-3 block px-4">
                        템플릿 선택
                    </label>
                    <div
                        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-1"
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        {TEMPLATES.map((t) => {
                            const isSelected = selectedTemplateId === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTemplate(t.id)}
                                    className={`
                                    group relative flex-shrink-0 snap-start rounded-xl overflow-hidden text-left
                                    transition-all duration-200 ease-out
                                    ${isSelected
                                            ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 -translate-y-0.5"
                                            : "ring-1 ring-white/[0.08] hover:ring-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30"
                                        }
                                `}
                                    style={{ width: 160 }}
                                >
                                    {/* Thumbnail with dark overlay */}
                                    <div className="relative h-[96px] overflow-hidden bg-white/[0.03]">
                                        <img
                                            src={t.thumbnail}
                                            alt={t.name}
                                            className={`
                                            w-full h-full object-cover
                                            transition-all duration-300 ease-out
                                            ${isSelected
                                                    ? "scale-110"
                                                    : "group-hover:scale-110"
                                                }
                                        `}
                                        />
                                        {/* Dark overlay — brightens on hover */}
                                        <div className={`
                                        absolute inset-0 transition-all duration-200
                                        ${isSelected
                                                ? "bg-black/25"
                                                : "bg-black/55 group-hover:bg-black/25"
                                            }
                                    `} />
                                        {/* Selected check badge */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-in fade-in">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                        {/* Name on image with gradient */}
                                        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                            <p className={`text-[11px] font-bold leading-tight transition-colors duration-200 ${isSelected
                                                ? "text-blue-300"
                                                : "text-white/70 group-hover:text-white/95"
                                                }`}>
                                                {t.name}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Description below */}
                                    <div className={`px-2.5 py-2 transition-colors duration-200 ${isSelected
                                        ? "bg-blue-500/[0.08]"
                                        : "bg-white/[0.02] group-hover:bg-white/[0.04]"
                                        }`}>
                                        <p className={`text-[9px] leading-relaxed line-clamp-2 transition-colors duration-200 ${isSelected
                                            ? "text-blue-300/50"
                                            : "text-white/25 group-hover:text-white/40"
                                            }`}>
                                            {t.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Sub-Style Selector (Image Card Grid) ── */}
                <div className="px-4 pt-4 pb-4 border-b border-white/[0.06]">
                    <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-3 block">
                        스타일 선택
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                        {styleOptions.map((s) => {
                            const isActive = selectedStyleId === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setStyle(s.id)}
                                    className={`
                                        group relative rounded-lg overflow-hidden text-left
                                        transition-all duration-200 ease-out
                                        ${isActive
                                            ? "ring-2 ring-purple-600 shadow-lg shadow-purple-600/20"
                                            : "ring-1 ring-white/[0.06] hover:ring-white/15 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/25"
                                        }
                                    `}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-[72px] overflow-hidden bg-white/[0.02]">
                                        <img
                                            src={s.thumbnail}
                                            alt={s.name}
                                            className={`
                                                w-full h-full object-cover
                                                transition-all duration-300 ease-out
                                                ${isActive ? "scale-110" : "group-hover:scale-110"}
                                            `}
                                        />
                                        {/* Dark overlay */}
                                        <div className={`
                                            absolute inset-0 transition-all duration-200
                                            ${isActive
                                                ? "bg-black/20"
                                                : "bg-black/50 group-hover:bg-black/25"
                                            }
                                        `} />
                                        {/* Purple check badge */}
                                        {isActive && (
                                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-md shadow-purple-600/40">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Name */}
                                    <div className={`px-2 py-1.5 transition-colors duration-200 ${isActive
                                        ? "bg-purple-600/[0.08]"
                                        : "bg-white/[0.02] group-hover:bg-white/[0.04]"
                                        }`}>
                                        <p className={`text-[10px] font-semibold truncate transition-colors duration-200 ${isActive
                                            ? "text-purple-300"
                                            : "text-white/50 group-hover:text-white/75"
                                            }`}>
                                            {s.name}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Color Palette ── */}
                <div className="p-4 border-b border-white/[0.06]">
                    <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-3 block">
                        테마 컬러
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {colorOptions.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c as ColorName)}
                                className="group flex flex-col items-center gap-1"
                                title={c}
                            >
                                <div
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-150 ring-offset-1 ring-offset-gray-950
                    ${selectedColor === c
                                            ? "ring-2 ring-indigo-400 scale-110"
                                            : "ring-1 ring-white/10 hover:ring-white/30 hover:scale-105"
                                        }
                  `}
                                    style={{ backgroundColor: colorSwatches[c] }}
                                >
                                    {selectedColor === c && (
                                        <Check
                                            className="w-3.5 h-3.5"
                                            style={{
                                                color:
                                                    c === "Minimal White" || c === "Neon"
                                                        ? "#000"
                                                        : "#fff",
                                            }}
                                        />
                                    )}
                                </div>
                                <span
                                    className={`text-[9px] ${selectedColor === c
                                        ? "text-white/60"
                                        : "text-white/25 group-hover:text-white/40"
                                        }`}
                                >
                                    {c}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Feature Toggles ── */}
                <div className="p-4 border-b border-white/[0.06]">
                    <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5 block">
                        기능 토글
                    </label>
                    <div className="flex flex-col gap-1.5">
                        {featureOptions.map((f) => {
                            const enabled = features[f as FeatureName];
                            return (
                                <button
                                    key={f}
                                    onClick={() => toggleFeature(f as FeatureName)}
                                    className={`
                    flex items-center justify-between px-3 py-2 rounded-lg
                    transition-all duration-150
                    ${enabled
                                            ? "bg-indigo-500/10 border border-indigo-500/30"
                                            : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={
                                                enabled ? "text-indigo-400" : "text-white/30"
                                            }
                                        >
                                            {featureIcons[f]}
                                        </span>
                                        <span
                                            className={`text-xs font-medium ${enabled ? "text-white/80" : "text-white/40"
                                                }`}
                                        >
                                            {f}
                                        </span>
                                    </div>
                                    {/* Toggle Switch */}
                                    <div
                                        className={`
                      w-8 h-[18px] rounded-full relative transition-colors duration-200
                      ${enabled ? "bg-indigo-500" : "bg-white/10"}
                    `}
                                    >
                                        <div
                                            className={`
                        absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white
                        transition-transform duration-200 shadow-sm
                        ${enabled ? "translate-x-[16px]" : "translate-x-[2px]"}
                      `}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Prompt Preview / Editor ── */}
                <div className="p-4">
                    {/* Auto / Manual tabs */}
                    <div className="flex items-center gap-1 mb-2.5">
                        <button
                            onClick={() => setPromptMode("auto")}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${promptMode === "auto"
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "text-white/30 hover:text-white/50"
                                }`}
                        >
                            ✨ 자동 생성
                        </button>
                        <button
                            onClick={() => setPromptMode("manual")}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${promptMode === "manual"
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "text-white/30 hover:text-white/50"
                                }`}
                        >
                            ✏️ 직접 입력
                        </button>
                    </div>

                    {promptMode === "manual" ? (
                        <textarea
                            value={manualPrompt}
                            onChange={(e) => setManualPrompt(e.target.value)}
                            placeholder="직접 프롬프트를 입력하세요..."
                            className="w-full h-28 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-white/80 font-mono whitespace-pre-wrap resize-none outline-none focus:border-indigo-500/40 placeholder:text-white/20 transition-colors"
                        />
                    ) : (
                        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                            <p className="text-[11px] leading-relaxed text-indigo-300/80 font-mono whitespace-pre-wrap">
                                {prompt}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

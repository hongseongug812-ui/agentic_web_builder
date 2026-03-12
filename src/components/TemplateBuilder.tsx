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
    Rocket,
    Zap,
    Flame,
    Star,
    ImagePlus,
    X,
    Palette,
    Layout,
    Layers,
    Settings2,
    Camera,
    Type,
    Eye,
    EyeOff,
} from "lucide-react";
import {
    useProjectStore,
    useAgentStore,
    useUIStore,
    TEMPLATES,
    TEMPLATE_CATEGORIES,
    getStylesForTemplate,
    featureOptions,
    FeatureName,
    COLOR_PALETTE,
    AVAILABLE_SECTIONS,
    FONT_OPTIONS,
    RADIUS_OPTIONS,
    SPACING_OPTIONS,
    LAYOUT_OPTIONS,
    ANIMATION_OPTIONS,
} from "@/store";
import { useEditorStore } from "@/store/editorStore";
import type { TemplateIR } from "@/lib/template-ir/types";
import landingIR from "@/templates/landing/ir.json";
import businessIR from "@/templates/business/ir.json";
import portfolioIR from "@/templates/portfolio/ir.json";

/* ── Template ID → IR JSON mapping ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asIR(json: any): TemplateIR { return json as unknown as TemplateIR; }

const IR_MAP: Record<string, TemplateIR> = {
    // landing templates
    saas: asIR(landingIR),
    "startup-landing": asIR(landingIR),
    blog: asIR(landingIR),
    "travel-agency": asIR(landingIR),
    "fitness-gym": asIR(landingIR),
    // business templates
    construction: asIR(businessIR),
    "cafe-bistro": asIR(businessIR),
    "hair-salon": asIR(businessIR),
    "medical-clinic": asIR(businessIR),
    dashboard: asIR(businessIR),
    "crave-academy": asIR(businessIR),
    "campus-hub": asIR(businessIR),
    // portfolio / creative templates
    "mine-portfolio": asIR(portfolioIR),
    atelier: asIR(portfolioIR),
    "student-portfolio": asIR(portfolioIR),
    "fashion-mall": asIR(portfolioIR),
};

/* ── FONT_OPTIONS id → Google font name ── */
const FONT_NAME_MAP: Record<string, string> = {
    system: "Inter",
    inter: "Inter",
    pretendard: "Noto Sans KR",
    "plus-jakarta": "Plus Jakarta Sans",
    outfit: "Outfit",
    "space-grotesk": "Space Grotesk",
    playfair: "Playfair Display",
    merriweather: "Merriweather",
    "noto-sans-kr": "Noto Sans KR",
};

/* ── Tab Config ── */
const TABS = [
    { id: "type", label: "종류", icon: <Layout className="w-4 h-4" /> },
    { id: "style", label: "스타일", icon: <Sparkles className="w-4 h-4" /> },
    { id: "color", label: "컬러", icon: <Palette className="w-4 h-4" /> },
    { id: "sections", label: "섹션", icon: <Layers className="w-4 h-4" /> },
    { id: "features", label: "기능", icon: <Settings2 className="w-4 h-4" /> },
    { id: "design", label: "디자인", icon: <Type className="w-4 h-4" /> },
    { id: "images", label: "이미지", icon: <Camera className="w-4 h-4" /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ── Feature icons ── */
const featureIcons: Record<string, React.ReactNode> = {
    로그인: <LogIn className="w-4 h-4" />,
    결제: <CreditCard className="w-4 h-4" />,
    검색: <SearchIcon className="w-4 h-4" />,
    다크모드: <Moon className="w-4 h-4" />,
    반응형: <Smartphone className="w-4 h-4" />,
    다국어: <Globe className="w-4 h-4" />,
};

/* ── Badge Config ── */
const badgeConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    HOT: { bg: "bg-gradient-to-r from-orange-500 to-red-500", text: "text-white", icon: <Flame className="w-2.5 h-2.5" /> },
    NEW: { bg: "bg-gradient-to-r from-emerald-500 to-teal-500", text: "text-white", icon: <Zap className="w-2.5 h-2.5" /> },
    "AI추천": { bg: "bg-gradient-to-r from-purple-500 to-indigo-500", text: "text-white", icon: <Star className="w-2.5 h-2.5" /> },
};

/* ── Animation icons ── */
const animationIcons: Record<string, string> = {
    none: "⏹️",
    subtle: "🌊",
    dynamic: "⚡",
    playful: "🎪",
};

export default function TemplateBuilder() {
    const [activeTab, setActiveTab] = useState<TabId>("type");
    const [categoryFilter, setCategoryFilter] = useState("전체");
    const [showPrompt, setShowPrompt] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // URL analysis state
    const [urlInput, setUrlInput] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Project store
    const selectedTemplateId = useProjectStore((s) => s.selectedTemplateId);
    const selectedStyleId = useProjectStore((s) => s.selectedStyleId);
    const selectedColor = useProjectStore((s) => s.selectedColor);
    const features = useProjectStore((s) => s.features);
    const setTemplate = useProjectStore((s) => s.setTemplate);
    const setStyle = useProjectStore((s) => s.setStyle);
    const setColor = useProjectStore((s) => s.setColor);
    const toggleFeature = useProjectStore((s) => s.toggleFeature);
    const generatePrompt = useProjectStore((s) => s.generatePrompt);
    const promptMode = useProjectStore((s) => s.promptMode);
    const manualPrompt = useProjectStore((s) => s.manualPrompt);
    const setPromptMode = useProjectStore((s) => s.setPromptMode);
    const setManualPrompt = useProjectStore((s) => s.setManualPrompt);
    const selectedProvider = useProjectStore((s) => s.selectedProvider);
    const availableProviders = useProjectStore((s) => s.availableProviders);
    const setProvider = useProjectStore((s) => s.setProvider);
    const fetchProviders = useProjectStore((s) => s.fetchProviders);
    const selectedSections = useProjectStore((s) => s.selectedSections);
    const addSection = useProjectStore((s) => s.addSection);
    const removeSection = useProjectStore((s) => s.removeSection);
    const designTokens = useProjectStore((s) => s.designTokens);
    const setDesignToken = useProjectStore((s) => s.setDesignToken);
    const uploadedImages = useProjectStore((s) => s.uploadedImages);
    const addUploadedImage = useProjectStore((s) => s.addUploadedImage);
    const removeUploadedImage = useProjectStore((s) => s.removeUploadedImage);
    const updateImageLabel = useProjectStore((s) => s.updateImageLabel);
    // Agent store
    const isRunning = useAgentStore((s) => s.isRunning);
    const runSequence = useAgentStore((s) => s.runSequence);

    // UI store
    const setView = useUIStore((s) => s.setView);
    const setBottomTab = useUIStore((s) => s.setBottomTab);

    // Editor store (IR)
    const loadTemplate = useEditorStore((s) => s.loadTemplate);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => { fetchProviders(); }, [fetchProviders]);

    const prompt = generatePrompt();
    const styleOptions = getStylesForTemplate(selectedTemplateId);

    // Derived info
    const selectedTpl = TEMPLATES.find((t) => t.id === selectedTemplateId);
    const selectedColorInfo = COLOR_PALETTE.find((c) => c.name === selectedColor);
    const enabledFeatures = (Object.entries(features) as [FeatureName, boolean][])
        .filter(([, v]) => v).map(([k]) => k);
    const selectedFontName = FONT_OPTIONS.find((f) => f.id === designTokens.font)?.name ?? designTokens.font;
    const selectedRadiusName = RADIUS_OPTIONS.find((r) => r.id === designTokens.borderRadius)?.name ?? designTokens.borderRadius;
    const selectedAnimName = ANIMATION_OPTIONS.find((a) => a.id === designTokens.animation)?.name ?? designTokens.animation;

    const filteredTemplates = categoryFilter === "전체"
        ? TEMPLATES
        : TEMPLATES.filter((t) => t.category === categoryFilter);

    function handleStart() {
        if (isRunning) return;
        runSequence();
    }

    function handleIREdit() {
        const irBase = IR_MAP[selectedTemplateId] ?? asIR(landingIR);

        // Deep clone and apply current design tokens
        const ir: TemplateIR = JSON.parse(JSON.stringify(irBase));

        // Apply color palette
        const colorInfo = COLOR_PALETTE.find((c) => c.name === selectedColor);
        if (colorInfo) {
            ir.styleTokens.colors.primary = colorInfo.from;
            ir.styleTokens.colors.secondary = colorInfo.to;
            ir.styleTokens.colors.accent = colorInfo.from;
        }

        // Apply font
        const fontName = FONT_NAME_MAP[designTokens.font] ?? "Inter";
        ir.styleTokens.fonts.heading = fontName;
        ir.styleTokens.fonts.body = designTokens.font === "system" ? "Inter" : fontName;

        // Apply border radius (id matches IR type)
        const radiusId = designTokens.borderRadius as "none" | "sm" | "md" | "lg" | "full";
        ir.styleTokens.borderRadius = radiusId;

        // Apply spacing (compact/normal; "spacious" → "relaxed")
        const spacingRaw = designTokens.spacing;
        ir.styleTokens.spacing = spacingRaw === "spacious" ? "relaxed" : (spacingRaw as "compact" | "normal" | "relaxed");

        loadTemplate(ir);
        setView("canvas");
        setBottomTab("ir");
    }

    async function handleImageUpload(file: File) {
        if (!file.type.startsWith("image/")) return;
        if (file.size > 5 * 1024 * 1024) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${API_BASE}/api/upload-image`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                addUploadedImage({
                    id: data.filename,
                    filename: data.filename,
                    originalName: data.original_name,
                    url: data.url,
                    label: "",
                    size: data.size,
                });
            }
        } catch { /* silent */ } finally {
            setIsUploading(false);
        }
    }

    /* ── Tab content renderer ── */
    function renderTabContent() {
        switch (activeTab) {
            case "type":
                return (
                    <div className="space-y-3">
                        {/* Category Filter */}
                        <div className="flex items-center gap-1 flex-wrap">
                            {TEMPLATE_CATEGORIES.map((cat) => (
                                <button key={cat} onClick={() => setCategoryFilter(cat)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all duration-200
                                        ${categoryFilter === cat
                                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                            : "text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.03]"}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {/* Template Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {filteredTemplates.map((t) => {
                                const sel = selectedTemplateId === t.id;
                                const badge = t.badge ? badgeConfig[t.badge] : null;
                                return (
                                    <button key={t.id} onClick={() => setTemplate(t.id)}
                                        className={`group relative rounded-xl overflow-hidden text-left transition-all duration-300
                                            ${sel
                                                ? "ring-2 ring-indigo-500/80 shadow-xl shadow-indigo-500/20 scale-[1.02]"
                                                : "ring-1 ring-white/[0.07] hover:ring-white/18 hover:shadow-lg hover:scale-[1.01]"}`}
                                    >
                                        <div className="relative h-[115px] overflow-hidden bg-[#0c1729]">
                                            <img src={t.thumbnail} alt={t.name}
                                                className={`w-full h-full object-cover transition-all duration-700 ${sel ? "scale-110 brightness-90" : "group-hover:scale-105 group-hover:brightness-90"}`}
                                            />
                                            {/* Gradient overlay */}
                                            <div className={`absolute inset-0 transition-all duration-300 ${
                                                sel ? "bg-gradient-to-t from-indigo-950/80 via-black/20 to-transparent"
                                                    : "bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/55"
                                            }`} />
                                            {/* Badge */}
                                            {badge && (
                                                <div className={`absolute top-2 left-2 ${badge.bg} ${badge.text} px-1.5 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-0.5 shadow-lg`}>
                                                    {badge.icon} {t.badge}
                                                </div>
                                            )}
                                            {/* Selected check */}
                                            {sel && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/40 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            {/* Name */}
                                            <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2 pt-8">
                                                <p className={`text-[11px] font-bold leading-tight ${sel ? "text-indigo-200" : "text-white/90"}`}>{t.name}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case "style":
                return (
                    <div className="grid grid-cols-2 gap-2.5">
                        {styleOptions.map((s) => {
                            const sel = selectedStyleId === s.id;
                            return (
                                <button key={s.id} onClick={() => setStyle(s.id)}
                                    className={`group relative rounded-xl overflow-hidden text-left transition-all duration-300
                                        ${sel ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20" : "ring-1 ring-white/[0.06] hover:ring-white/15"}`}
                                >
                                    <div className="relative h-[80px] overflow-hidden bg-white/[0.02]">
                                        <img src={s.thumbnail} alt={s.name} className={`w-full h-full object-cover transition-all duration-500 ${sel ? "scale-110" : "group-hover:scale-110"}`} />
                                        <div className={`absolute inset-0 ${sel ? "bg-black/20" : "bg-black/50 group-hover:bg-black/25"}`} />
                                        {sel && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                                    </div>
                                    <div className={`px-2 py-1.5 ${sel ? "bg-purple-500/[0.08]" : "bg-white/[0.02]"}`}>
                                        <p className={`text-[10px] font-semibold truncate ${sel ? "text-purple-300" : "text-white/50"}`}>{s.name}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case "color":
                return (
                    <div className="grid grid-cols-4 gap-2.5">
                        {COLOR_PALETTE.map((c) => {
                            const sel = selectedColor === c.name;
                            return (
                                <button key={c.name} onClick={() => setColor(c.name)}
                                    className={`group flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-250
                                        ${sel
                                            ? "bg-white/[0.07] shadow-[inset_0_0_0_2px_rgba(99,102,241,0.6)] -translate-y-0.5"
                                            : "bg-white/[0.025] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.045] hover:-translate-y-0.5"}`}
                                >
                                    <div
                                        className={`w-11 h-11 rounded-full transition-all duration-300 shadow-lg
                                            ${sel ? "scale-110 shadow-2xl" : "group-hover:scale-105"}`}
                                        style={{
                                            background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                                            boxShadow: sel ? `0 6px 20px ${c.from}55` : undefined,
                                        }}
                                    >
                                        {sel && (
                                            <div className="w-full h-full flex items-center justify-center rounded-full">
                                                <Check className="w-4 h-4 drop-shadow" style={{ color: c.text }} />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-semibold ${sel ? "text-white/80" : "text-white/28 group-hover:text-white/50"} transition-colors`}>
                                        {c.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                );

            case "sections":
                return (
                    <div className="space-y-1.5">
                        {AVAILABLE_SECTIONS.map((sec) => {
                            const on = selectedSections.includes(sec.id);
                            return (
                                <button key={sec.id} onClick={() => on ? removeSection(sec.id) : addSection(sec.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-left
                                        ${on ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"}`}
                                >
                                    <span className="text-sm flex-shrink-0">{sec.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-semibold ${on ? "text-white/90" : "text-white/50"}`}>{sec.name}</p>
                                        <p className={`text-[9px] truncate ${on ? "text-emerald-400/60" : "text-white/20"}`}>{sec.description}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${on ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10"}`}>
                                        {on && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case "features":
                return (
                    <div className="grid grid-cols-2 gap-2.5">
                        {featureOptions.map((f) => {
                            const on = features[f as FeatureName];
                            return (
                                <button key={f} onClick={() => toggleFeature(f as FeatureName)}
                                    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl transition-all duration-200
                                        ${on ? "bg-indigo-500/10 border border-indigo-500/30 shadow-sm" : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"}`}
                                >
                                    <span className={`${on ? "text-indigo-400" : "text-white/30"}`}>{featureIcons[f]}</span>
                                    <span className={`text-[10px] font-medium ${on ? "text-white/80" : "text-white/40"}`}>{f}</span>
                                    <div className={`w-8 h-[18px] rounded-full relative transition-colors ${on ? "bg-indigo-500" : "bg-white/10"}`}>
                                        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case "design":
                return (
                    <div className="space-y-4">
                        {/* Font */}
                        <div>
                            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 block">폰트</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {FONT_OPTIONS.map((f) => (
                                    <button key={f.id} onClick={() => setDesignToken("font", f.id)}
                                        className={`px-2.5 py-2 rounded-lg text-[10px] font-medium transition-all ${designTokens.font === f.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{f.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* Radius */}
                        <div>
                            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 block">모서리</label>
                            <div className="flex gap-1.5">
                                {RADIUS_OPTIONS.map((r) => (
                                    <button key={r.id} onClick={() => setDesignToken("borderRadius", r.id)}
                                        className={`flex-1 px-1.5 py-2 rounded-lg text-[10px] font-medium transition-all ${designTokens.borderRadius === r.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{r.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* Spacing */}
                        <div>
                            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 block">여백</label>
                            <div className="flex gap-1.5">
                                {SPACING_OPTIONS.map((s) => (
                                    <button key={s.id} onClick={() => setDesignToken("spacing", s.id)}
                                        className={`flex-1 px-1.5 py-2 rounded-lg text-[10px] font-medium transition-all ${designTokens.spacing === s.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{s.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* Layout */}
                        <div>
                            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 block">레이아웃</label>
                            <div className="flex flex-col gap-1.5">
                                {LAYOUT_OPTIONS.map((l) => (
                                    <button key={l.id} onClick={() => setDesignToken("layout", l.id)}
                                        className={`px-2.5 py-2 rounded-lg text-[10px] font-medium text-left transition-all ${designTokens.layout === l.id
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:bg-white/[0.04]"}`}
                                    >{l.name}</button>
                                ))}
                            </div>
                        </div>
                        {/* Animation */}
                        <div>
                            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> 애니메이션
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {ANIMATION_OPTIONS.map((a) => {
                                    const sel = designTokens.animation === a.id;
                                    return (
                                        <button key={a.id} onClick={() => setDesignToken("animation", a.id)}
                                            className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl transition-all text-center
                                                ${sel ? "bg-indigo-500/15 border border-indigo-500/30" : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"}`}
                                        >
                                            <span className="text-base">{animationIcons[a.id]}</span>
                                            <span className={`text-[10px] font-semibold ${sel ? "text-indigo-300" : "text-white/50"}`}>{a.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {/* AI Model */}
                        <div>
                            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Cpu className="w-3 h-3" /> AI 모델
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(availableProviders.length > 0 ? availableProviders : [
                                    { id: "gemini", name: "Gemini", icon: "✨", configured: false },
                                    { id: "claude", name: "Claude", icon: "🟠", configured: false },
                                    { id: "gpt", name: "GPT-4o", icon: "🟢", configured: false },
                                ]).map((p) => {
                                    const sel = selectedProvider === p.id;
                                    return (
                                        <button key={p.id} onClick={() => setProvider(p.id)} disabled={!p.configured}
                                            className={`relative flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all text-center
                                                ${sel ? "bg-indigo-500/15 border border-indigo-500/40" : p.configured ? "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05]" : "bg-white/[0.01] border border-white/[0.04] opacity-40 cursor-not-allowed"}`}
                                        >
                                            <span className="text-lg">{p.icon}</span>
                                            <span className={`text-[10px] font-medium ${sel ? "text-indigo-300" : p.configured ? "text-white/60" : "text-white/25"}`}>{p.name}</span>
                                            {!p.configured && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[8px] font-bold">!</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Vercel Token */}
                        <div>
                            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 block">
                                🔑 Vercel 배포 토큰 <span className="text-white/20 normal-case">(선택사항)</span>
                            </label>
                            <input
                                type="password"
                                placeholder="vercel_xxxxxxxxxxxxxxxx"
                                defaultValue={typeof window !== "undefined" ? localStorage.getItem("vercel_token") || "" : ""}
                                onChange={(e) => { if (typeof window !== "undefined") localStorage.setItem("vercel_token", e.target.value); }}
                                className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[10px] text-white/70 font-mono outline-none focus:border-indigo-500/40 placeholder:text-white/15 transition-all"
                            />
                        </div>
                    </div>
                );

            case "images":
                return (
                    <div className="space-y-3">
                        {/* Drop zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={async (e) => {
                                e.preventDefault();
                                setIsDragOver(false);
                                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                                for (const file of files) await handleImageUpload(file);
                            }}
                            className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
                                ${isDragOver
                                    ? "border-indigo-400 bg-indigo-500/10"
                                    : "border-white/[0.1] bg-white/[0.02] hover:border-white/20"}`}
                            onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.multiple = true;
                                input.onchange = async () => {
                                    if (input.files) {
                                        for (const file of Array.from(input.files)) await handleImageUpload(file);
                                    }
                                };
                                input.click();
                            }}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDragOver ? "bg-indigo-500/20" : "bg-white/[0.04]"}`}>
                                {isUploading
                                    ? <div className="w-5 h-5 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
                                    : <ImagePlus className={`w-5 h-5 ${isDragOver ? "text-indigo-400" : "text-white/25"}`} />}
                            </div>
                            <p className={`text-[11px] font-semibold ${isDragOver ? "text-indigo-300" : "text-white/50"}`}>
                                {isUploading ? "업로드 중..." : "드래그 또는 클릭"}
                            </p>
                            <p className="text-[9px] text-white/20">JPG, PNG, GIF, WebP · 최대 5MB</p>
                        </div>
                        {uploadedImages.length === 0 && (
                            <p className="text-[10px] text-white/20 text-center">
                                💡 이미지 없이도 OK. AI가 CSS로 대체합니다.
                            </p>
                        )}
                        {uploadedImages.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-semibold text-white/50">
                                    업로드됨 ({uploadedImages.length}개)
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {uploadedImages.map((img) => (
                                        <div key={img.id} className="group relative rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                                            <div className="relative h-[70px] overflow-hidden bg-gray-900">
                                                <img src={`${API_BASE}${img.url}`} alt={img.originalName} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeUploadedImage(img.id);
                                                        fetch(`${API_BASE}/api/upload-image/${img.filename}`, { method: "DELETE" }).catch(() => {});
                                                    }}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                            <div className="px-2 py-1.5">
                                                <input
                                                    type="text"
                                                    value={img.label}
                                                    onChange={(e) => updateImageLabel(img.id, e.target.value)}
                                                    placeholder="용도 (히어로, 로고...)"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] text-white/70 placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    }

    /* ══════════════════════════════════════════════
       ██ PREVIEW CARD — Right Panel
       ══════════════════════════════════════════════ */
    function renderPreviewCard() {
        return (
            <div className="h-full flex flex-col gap-4">
                {/* ── Main Visual Card ── */}
                <div className="relative flex-shrink-0 rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60 group">
                    <div className="relative h-[220px] overflow-hidden bg-[#0c1729]">
                        <img
                            src={selectedTpl?.thumbnail || ""}
                            alt={selectedTpl?.name || ""}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        />
                        {/* Color tint overlay */}
                        {selectedColorInfo && (
                            <div
                                className="absolute inset-0 opacity-50 mix-blend-color transition-all duration-700"
                                style={{ background: `linear-gradient(135deg, ${selectedColorInfo.from}, ${selectedColorInfo.to})` }}
                            />
                        )}
                        {/* Dark gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/30 to-transparent" />
                        {/* Color accent bar at bottom */}
                        {selectedColorInfo && (
                            <div
                                className="absolute bottom-0 inset-x-0 h-0.5 opacity-80"
                                style={{ background: `linear-gradient(90deg, transparent, ${selectedColorInfo.from}, ${selectedColorInfo.to}, transparent)` }}
                            />
                        )}
                        {/* Template name overlay */}
                        <div className="absolute bottom-0 inset-x-0 px-5 pb-4">
                            <p className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.12em] mb-1">선택된 컨셉</p>
                            <h2 className="text-[20px] font-bold text-white tracking-tight leading-tight">
                                {selectedTpl?.name || "템플릿을 선택하세요"}
                            </h2>
                            {selectedTpl?.description && (
                                <p className="text-[11px] text-white/38 mt-1 line-clamp-1">{selectedTpl.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Selection Summary Badges ── */}
                <div className="flex flex-wrap gap-1.5">
                    {/* Color badge */}
                    {selectedColorInfo && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                            <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${selectedColorInfo.from}, ${selectedColorInfo.to})` }} />
                            <span className="text-[10px] text-white/50 font-medium">{selectedColor}</span>
                        </div>
                    )}
                    {/* Style badge */}
                    {selectedStyleId && (
                        <div className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300/70 font-medium">
                            {styleOptions.find(s => s.id === selectedStyleId)?.name || selectedStyleId}
                        </div>
                    )}
                    {/* Font badge */}
                    <div className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 font-medium">
                        🔤 {selectedFontName}
                    </div>
                    {/* Radius badge */}
                    <div className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 font-medium">
                        ◻️ {selectedRadiusName}
                    </div>
                    {/* Animation badge */}
                    <div className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 font-medium">
                        {animationIcons[designTokens.animation]} {selectedAnimName}
                    </div>
                    {/* Features badges */}
                    {enabledFeatures.map(f => (
                        <div key={f} className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300/70 font-medium">
                            {f}
                        </div>
                    ))}
                    {/* Images badge */}
                    {uploadedImages.length > 0 && (
                        <div className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300/70 font-medium">
                            📷 {uploadedImages.length}개 이미지
                        </div>
                    )}
                </div>

                {/* ── Section Minimap ── */}
                <div className="flex-shrink-0">
                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2">섹션 구성 ({selectedSections.length}개)</p>
                    <div className="flex flex-col gap-1">
                        {selectedSections.map((secId, i) => {
                            const sec = AVAILABLE_SECTIONS.find(s => s.id === secId);
                            const colorInfo = selectedColorInfo;
                            return (
                                <div
                                    key={secId}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.05]"
                                    style={{
                                        borderLeftWidth: "3px",
                                        borderLeftColor: colorInfo ? colorInfo.from : "#6366f1",
                                        opacity: 1 - (i * 0.03),
                                    }}
                                >
                                    <span className="text-xs">{sec?.icon || "📦"}</span>
                                    <span className="text-[10px] text-white/50 font-medium">{sec?.name || secId}</span>
                                </div>
                            );
                        })}
                        {selectedSections.length === 0 && (
                            <p className="text-[10px] text-white/20 italic py-2 text-center">섹션을 선택하세요</p>
                        )}
                    </div>
                </div>

                {/* ── Uploaded Images Mini Gallery ── */}
                {uploadedImages.length > 0 && (
                    <div className="flex-shrink-0">
                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2">업로드 이미지</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                            {uploadedImages.map(img => (
                                <div key={img.id} className="w-12 h-12 rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0">
                                    <img src={`${API_BASE}${img.url}`} alt={img.originalName} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Prompt Mode & Preview (collapsible) ── */}
                <div className="flex-1 min-h-0 flex flex-col">
                    {/* Prompt mode selector */}
                    <div className="flex items-center gap-1.5 mb-2">
                        <button onClick={() => setPromptMode("auto")}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${promptMode === "auto"
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-white/30 hover:text-white/50 border border-transparent"}`}
                        >✨ 자동</button>
                        <button onClick={() => setPromptMode("manual")}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${promptMode === "manual"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-white/30 hover:text-white/50 border border-transparent"}`}
                        >✏️ 직접</button>
                        <button onClick={() => setPromptMode("url" as "auto" | "manual")}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${(promptMode as string) === "url"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-white/30 hover:text-white/50 border border-transparent"}`}
                        >🔗 URL</button>
                        <div className="flex-1" />
                        <button onClick={() => setShowPrompt(!showPrompt)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/50 border border-white/[0.06] hover:bg-white/[0.03] transition-all"
                        >
                            {showPrompt ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            프롬프트
                        </button>
                    </div>

                    {/* Prompt content */}
                    {showPrompt && (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            {(promptMode as string) === "url" ? (
                                <div className="space-y-2 h-full">
                                    <div className="flex gap-1.5">
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="참고할 웹사이트 URL"
                                            className="flex-1 px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] text-[11px] text-white/80 outline-none focus:border-cyan-500/40 placeholder:text-white/20 transition-all"
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
                                                        if (data.generated_prompt) setManualPrompt(data.generated_prompt);
                                                    }
                                                } catch { /* silent */ } finally { setIsAnalyzing(false); }
                                            }}
                                            disabled={isAnalyzing || !urlInput.trim()}
                                            className="px-3 py-2 rounded-lg text-[10px] font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 flex-shrink-0"
                                        >
                                            {isAnalyzing ? "..." : "🔍"}
                                        </button>
                                    </div>
                                    {isAnalyzing && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03]">
                                            <div className="w-4 h-4 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
                                            <span className="text-[10px] text-cyan-300/60">분석 중...</span>
                                        </div>
                                    )}
                                    {analysisResult && (
                                        <div className="space-y-2">
                                            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
                                                <p className="text-[11px] font-semibold text-cyan-300">✅ {analysisResult.site_name}</p>
                                                <p className="text-[10px] text-white/50 mt-0.5">{analysisResult.description}</p>
                                            </div>
                                            <textarea
                                                value={manualPrompt}
                                                onChange={(e) => setManualPrompt(e.target.value)}
                                                className="w-full h-32 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-3 text-[10px] leading-relaxed text-white/80 font-mono resize-none outline-none focus:border-cyan-500/40 transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : promptMode === "manual" ? (
                                <textarea
                                    value={manualPrompt}
                                    onChange={(e) => setManualPrompt(e.target.value)}
                                    placeholder={"원하는 웹사이트를 자유롭게 설명하세요...\n\n예: 프리미엄 SaaS 랜딩페이지를 만들어줘."}
                                    className="w-full h-full min-h-[120px] rounded-xl border border-purple-500/30 bg-purple-500/[0.05] p-3 text-[10px] leading-relaxed text-white/80 font-mono resize-none outline-none focus:border-purple-500/60 placeholder:text-white/20 transition-all"
                                />
                            ) : (
                                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                                    <p className="text-[10px] leading-relaxed text-indigo-300/70 font-mono whitespace-pre-wrap">{prompt}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ══════════════════════════════════════════════
       ██ MAIN RENDER
       ══════════════════════════════════════════════ */
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
            <div className="flex-1 flex overflow-hidden">
                {/* ── LEFT: Tab Panel ── */}
                <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-gray-950">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-px px-2 py-2 border-b border-white/[0.055] flex-shrink-0 bg-[#070f1e]/60 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                        {TABS.map((tab) => {
                            const active = activeTab === tab.id;
                            let count: number | null = null;
                            if (tab.id === "sections") count = selectedSections.length;
                            if (tab.id === "features") count = enabledFeatures.length;
                            if (tab.id === "images") count = uploadedImages.length;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0
                                        ${active
                                            ? "bg-indigo-500/[0.12] text-indigo-300 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]"
                                            : "text-white/28 hover:text-white/55 hover:bg-white/[0.035]"}`}
                                >
                                    <span className={`transition-colors ${active ? "text-indigo-400" : "text-white/28"}`}>
                                        {tab.icon}
                                    </span>
                                    <span className={`text-[11px] font-semibold ${active ? "text-indigo-300" : ""}`}>{tab.label}</span>
                                    {count !== null && count > 0 && (
                                        <span className="ml-0.5 px-1.5 py-px rounded-full bg-indigo-500/25 text-indigo-300 text-[9px] font-bold border border-indigo-500/30">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
                        {renderTabContent()}
                    </div>
                </div>

                {/* ── RIGHT: Preview Panel ── */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[radial-gradient(ellipse_60%_60%_at_70%_40%,rgba(99,102,241,0.04),transparent)]">
                    <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: "thin" }}>
                        {renderPreviewCard()}
                    </div>
                </div>
            </div>

            {/* ── Bottom Action Bar ── */}
            <div className="relative px-5 py-3 border-t border-white/[0.06] flex items-center gap-3 flex-shrink-0 overflow-hidden">
                {/* Glass background */}
                <div className="absolute inset-0 bg-[#030712]/95 backdrop-blur-xl" />
                {/* Top gradient accent */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />

                {/* Summary chips */}
                <div className="relative flex items-center gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
                    {selectedTpl && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/38 font-medium whitespace-nowrap">
                            <Layout className="w-2.5 h-2.5 text-white/22 flex-shrink-0" />
                            {selectedTpl.name}
                        </span>
                    )}
                    {selectedColor && selectedColorInfo && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/38 font-medium whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${selectedColorInfo.from}, ${selectedColorInfo.to})` }} />
                            {selectedColor}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/38 font-medium whitespace-nowrap">
                        <Layers className="w-2.5 h-2.5 text-white/22 flex-shrink-0" />
                        {selectedSections.length}개 섹션
                    </span>
                    {enabledFeatures.length > 0 && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/[0.08] border border-indigo-500/[0.18] text-[10px] text-indigo-300/55 font-medium whitespace-nowrap">
                            <Settings2 className="w-2.5 h-2.5 flex-shrink-0" />
                            {enabledFeatures.length}개 기능
                        </span>
                    )}
                    {uploadedImages.length > 0 && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/[0.08] border border-cyan-500/[0.18] text-[10px] text-cyan-300/55 font-medium whitespace-nowrap">
                            <Camera className="w-2.5 h-2.5 flex-shrink-0" />
                            {uploadedImages.length}개 이미지
                        </span>
                    )}
                </div>

                {/* Quick IR edit button */}
                <button
                    onClick={handleIREdit}
                    className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold border transition-all duration-300 flex-shrink-0
                        bg-purple-500/[0.07] border-purple-500/[0.22] text-purple-300/75 hover:bg-purple-500/[0.14] hover:border-purple-500/40 hover:text-purple-200 hover:-translate-y-0.5 active:translate-y-0"
                    title="LLM 없이 IR 기반으로 즉시 편집"
                >
                    <Layers className="w-3.5 h-3.5" />
                    즉시 편집
                </button>

                {/* Generate button */}
                <button onClick={handleStart} disabled={isRunning}
                    className="group relative flex items-center gap-2 px-6 py-2 rounded-xl text-[13px] font-bold text-white flex-shrink-0 overflow-hidden
                        shadow-lg shadow-indigo-500/20 hover:shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-indigo-500/20"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-pink-500 transition-all duration-300" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)" }} />
                    <Rocket className="relative w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative">{isRunning ? "생성 중..." : "AI로 사이트 생성!"}</span>
                </button>
            </div>
        </div>
    );
}

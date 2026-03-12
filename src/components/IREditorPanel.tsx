"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { renderIRToCode } from "@/lib/template-ir/renderer";
import {
    Eye, EyeOff, Undo2, Redo2, Monitor, Smartphone,
    ChevronRight, Palette, Upload, MousePointerClick,
} from "lucide-react";
import type { SlotIR, ComponentIR } from "@/lib/template-ir/types";

/* ── Template loading ── */
import landingIR from "@/templates/landing/ir.json";
import businessIR from "@/templates/business/ir.json";
import portfolioIR from "@/templates/portfolio/ir.json";

const TEMPLATE_MAP: Record<string, object> = {
    landing: landingIR,
    business: businessIR,
    portfolio: portfolioIR,
};

/* ── Component display labels ── */
const COMP_INFO: Record<string, { label: string; icon: string }> = {
    Navbar:      { label: "내비게이션", icon: "🧭" },
    Hero:        { label: "히어로",     icon: "🌟" },
    Features:    { label: "기능 소개",  icon: "✨" },
    Stats:       { label: "통계",       icon: "📊" },
    Gallery:     { label: "갤러리",     icon: "🖼️" },
    Testimonials:{ label: "후기",       icon: "💬" },
    Pricing:     { label: "요금제",     icon: "💰" },
    About:       { label: "소개",       icon: "👤" },
    ContactForm: { label: "연락처",     icon: "📧" },
    CTA:         { label: "CTA 배너",   icon: "🚀" },
    Footer:      { label: "푸터",       icon: "📄" },
};

const BASE_INPUT =
    "w-full px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/80 placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all";

/* ── Object-list JSON editor ── */
function ObjectListEditor({ label, value, onChange }: {
    label: string;
    value: unknown[];
    onChange: (v: unknown) => void;
}) {
    const [jsonStr, setJsonStr] = useState(() => JSON.stringify(value, null, 2));
    const [jsonErr, setJsonErr] = useState(false);

    return (
        <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-wider">
                {label} <span className="text-white/20">(JSON)</span>
            </label>
            <textarea
                className={`${BASE_INPUT} min-h-[100px] resize-y font-mono text-[10px] ${jsonErr ? "border-red-500/50" : ""}`}
                value={jsonStr}
                onChange={(e) => {
                    setJsonStr(e.target.value);
                    try {
                        onChange(JSON.parse(e.target.value));
                        setJsonErr(false);
                    } catch {
                        setJsonErr(true);
                    }
                }}
            />
            {jsonErr && <p className="text-[9px] text-red-400">JSON 형식 오류</p>}
        </div>
    );
}

/* ── Slot editor ── */
function SlotEditor({ slot, onChange }: { slot: SlotIR; onChange: (value: unknown) => void }) {
    if (!slot.editable) return null;

    if (slot.type === "text" || slot.type === "button" || slot.type === "link") {
        return (
            <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">{slot.label}</label>
                <input className={BASE_INPUT} type="text" value={String(slot.value ?? "")} placeholder={slot.placeholder ?? ""} onChange={(e) => onChange(e.target.value)} />
            </div>
        );
    }
    if (slot.type === "richtext") {
        return (
            <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">{slot.label}</label>
                <textarea className={`${BASE_INPUT} min-h-[60px] resize-y`} value={String(slot.value ?? "")} placeholder={slot.placeholder ?? ""} onChange={(e) => onChange(e.target.value)} />
            </div>
        );
    }
    if (slot.type === "color") {
        return (
            <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">{slot.label}</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={String(slot.value ?? "#000000")} onChange={(e) => onChange(e.target.value)} className="w-8 h-7 rounded cursor-pointer border border-white/[0.08] bg-transparent" />
                    <input className={`${BASE_INPUT} flex-1 font-mono`} type="text" value={String(slot.value ?? "")} onChange={(e) => onChange(e.target.value)} />
                </div>
            </div>
        );
    }
    if (slot.type === "number") {
        return (
            <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">{slot.label}</label>
                <input className={`${BASE_INPUT} font-mono`} type="number" value={Number(slot.value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />
            </div>
        );
    }
    if (slot.type === "list") {
        const arr = Array.isArray(slot.value) ? slot.value : [];
        const isStringList = arr.length === 0 || typeof arr[0] === "string";

        if (isStringList) {
            return (
                <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider">{slot.label}</label>
                    <div className="space-y-1">
                        {(arr as string[]).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                                <span className="text-[9px] text-white/20 w-4 text-right flex-shrink-0">{idx + 1}</span>
                                <input
                                    className={BASE_INPUT}
                                    type="text"
                                    value={item}
                                    onChange={(e) => { const next = [...arr as string[]]; next[idx] = e.target.value; onChange(next); }}
                                />
                                <button
                                    onClick={() => onChange((arr as string[]).filter((_, i) => i !== idx))}
                                    className="text-white/20 hover:text-red-400 transition-colors text-xs flex-shrink-0"
                                >✕</button>
                            </div>
                        ))}
                        <button onClick={() => onChange([...arr as string[], ""])} className="text-[10px] text-indigo-400/60 hover:text-indigo-400 transition-colors">+ 항목 추가</button>
                    </div>
                </div>
            );
        }
        return <ObjectListEditor label={slot.label} value={arr} onChange={onChange} />;
    }
    return null;
}

/* ── Component slot panel ── */
function ComponentSlotPanel({ comp }: { comp: ComponentIR }) {
    const updateSlot = useEditorStore((s) => s.updateSlot);
    const editableSlots = Object.entries(comp.slots).filter(([, s]) => s.editable);

    if (editableSlots.length === 0) {
        return <p className="text-[11px] text-white/20 text-center py-4">편집 가능한 슬롯 없음</p>;
    }
    return (
        <div className="space-y-3">
            {editableSlots.map(([key, slot]) => (
                <SlotEditor key={key} slot={slot} onChange={(value) => updateSlot(comp.id, key, value)} />
            ))}
        </div>
    );
}

/* ── Style tokens panel ── */
function StylePanel() {
    const currentIR       = useEditorStore((s) => s.currentIR);
    const updateStyleColor  = useEditorStore((s) => s.updateStyleColor);
    const updateStyleFont   = useEditorStore((s) => s.updateStyleFont);
    const updateStyleOption = useEditorStore((s) => s.updateStyleOption);

    if (!currentIR) return null;
    const { colors, fonts, borderRadius, spacing } = currentIR.styleTokens;

    const colorKeys: Array<[keyof typeof colors, string]> = [
        ["primary", "Primary"], ["secondary", "Secondary"], ["accent", "Accent"],
        ["background", "배경"], ["text", "텍스트"], ["muted", "보조"],
    ];

    const baseSelect = "px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 outline-none focus:border-indigo-500/40 transition-all";

    return (
        <div className="space-y-4">
            <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> 색상
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {colorKeys.map(([key, label]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <input type="color" value={colors[key]} onChange={(e) => updateStyleColor(key, e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-white/[0.08] bg-transparent flex-shrink-0" title={label} />
                            <span className="text-[10px] text-white/50 truncate">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">폰트</p>
                <div className="space-y-1.5">
                    {(["heading", "body"] as const).map((k) => (
                        <div key={k}>
                            <label className="text-[10px] text-white/30">{k === "heading" ? "제목" : "본문"}</label>
                            <input className="w-full mt-0.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 outline-none focus:border-indigo-500/40" value={fonts[k]} onChange={(e) => updateStyleFont(k, e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider">모서리</label>
                    <select className={`w-full mt-1 ${baseSelect}`} value={borderRadius} onChange={(e) => updateStyleOption("borderRadius", e.target.value)}>
                        {["none", "sm", "md", "lg", "full"].map((v) => <option key={v} value={v} className="bg-gray-900">{v}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider">여백</label>
                    <select className={`w-full mt-1 ${baseSelect}`} value={spacing} onChange={(e) => updateStyleOption("spacing", e.target.value)}>
                        {["compact", "normal", "relaxed"].map((v) => <option key={v} value={v} className="bg-gray-900">{v}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Main IR Editor Panel
 * ───────────────────────────────────────────────────────────────────────── */
export default function IREditorPanel() {
    const currentIR           = useEditorStore((s) => s.currentIR);
    const selectedComponentId = useEditorStore((s) => s.selectedComponentId);
    const history             = useEditorStore((s) => s.history);
    const future              = useEditorStore((s) => s.future);
    const loadTemplate        = useEditorStore((s) => s.loadTemplate);
    const setSelectedComponent = useEditorStore((s) => s.setSelectedComponent);
    const toggleComponentVisible = useEditorStore((s) => s.toggleComponentVisible);
    const undo = useEditorStore((s) => s.undo);
    const redo = useEditorStore((s) => s.redo);

    const [rightTab, setRightTab]       = useState<"slots" | "style">("slots");
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
    const [blobUrl, setBlobUrl]         = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    /* ── Generate HTML and update blob URL ── */
    const generatedHtml = useMemo(() => {
        if (!currentIR) return null;
        try {
            return renderIRToCode(currentIR).files[0]?.code ?? null;
        } catch {
            return null;
        }
    }, [currentIR]);

    useEffect(() => {
        if (!generatedHtml) { setBlobUrl(null); return; }
        const blob = new Blob([generatedHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [generatedHtml]);

    /* ── Listen for click-to-select messages from the iframe ── */
    const handleMessage = useCallback((e: MessageEvent) => {
        if (e.data?.type === "ir-click") {
            setSelectedComponent(e.data.componentId ?? null);
            setRightTab("slots");
        }
    }, [setSelectedComponent]);

    useEffect(() => {
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [handleMessage]);

    /* ── Send highlight to iframe when selectedComponentId changes ── */
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        // Retry until iframe is ready (contentWindow may not exist immediately after blob URL change)
        const send = () => {
            try {
                iframe.contentWindow?.postMessage({ type: "ir-highlight", componentId: selectedComponentId }, "*");
            } catch {
                // iframe not ready yet
            }
        };
        // Small delay to let iframe finish loading new blob URL
        const t = setTimeout(send, 80);
        return () => clearTimeout(t);
    }, [selectedComponentId, blobUrl]);

    const components = currentIR?.pages[0]?.components ?? [];
    const selectedComp = components.find((c) => c.id === selectedComponentId) ?? null;

    /* ── No IR loaded state ── */
    if (!currentIR) {
        return (
            <div className="flex flex-col h-full bg-gray-950 items-center justify-center gap-4 p-6">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white/20" />
                </div>
                <div className="text-center">
                    <p className="text-[13px] font-semibold text-white/60 mb-1">IR 템플릿 로드</p>
                    <p className="text-[11px] text-white/25">시작할 템플릿을 선택하세요</p>
                </div>
                <div className="flex gap-2">
                    {Object.keys(TEMPLATE_MAP).map((key) => (
                        <button
                            key={key}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={() => loadTemplate(TEMPLATE_MAP[key] as any)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-gray-950 overflow-hidden">

            {/* ── Left: Component list ── */}
            <div className="w-[190px] flex-shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden">
                {/* Header + undo/redo */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold truncate">
                        {currentIR.name}
                    </span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={undo} disabled={!history.length} title="실행 취소 (Ctrl+Z)" className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-30 transition-colors">
                            <Undo2 className="w-3 h-3" />
                        </button>
                        <button onClick={redo} disabled={!future.length} title="다시 실행 (Ctrl+Y)" className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-30 transition-colors">
                            <Redo2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Component list */}
                <div className="flex-1 overflow-y-auto py-1">
                    {[...components].sort((a, b) => a.order - b.order).map((comp) => {
                        const info = COMP_INFO[comp.type] ?? { label: comp.type, icon: "📦" };
                        const isSelected = comp.id === selectedComponentId;
                        return (
                            <div
                                key={comp.id}
                                role="button"
                                onClick={() => setSelectedComponent(isSelected ? null : comp.id)}
                                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
                                    isSelected
                                        ? "bg-indigo-500/10 border-l-2 border-indigo-400"
                                        : "hover:bg-white/[0.03] border-l-2 border-transparent"
                                } ${!comp.visible ? "opacity-40" : ""}`}
                            >
                                <span className="text-sm flex-shrink-0">{info.icon}</span>
                                <span className={`flex-1 text-[11px] truncate ${isSelected ? "text-white/80 font-medium" : "text-white/50"}`}>
                                    {info.label}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleComponentVisible(comp.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70 flex-shrink-0"
                                    title={comp.visible ? "숨기기" : "보이기"}
                                >
                                    {comp.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                                {isSelected && <ChevronRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                            </div>
                        );
                    })}
                </div>

                {/* Template switcher */}
                <div className="border-t border-white/[0.06] px-3 py-2 flex-shrink-0">
                    <p className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5">템플릿 변경</p>
                    <div className="flex gap-1 flex-wrap">
                        {Object.keys(TEMPLATE_MAP).map((key) => (
                            <button
                                key={key}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                onClick={() => loadTemplate(TEMPLATE_MAP[key] as any)}
                                className="px-2 py-0.5 rounded text-[9px] bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-indigo-500/30 hover:text-indigo-300 transition-all"
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Center: Live preview iframe ── */}
            <div className="flex-[2] flex flex-col min-w-0 border-r border-white/[0.06]">
                {/* Preview toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
                    {/* Click-to-select hint */}
                    <div className="flex items-center gap-1.5 text-[10px] text-white/25">
                        <MousePointerClick className="w-3 h-3 text-indigo-400/50" />
                        <span>클릭으로 섹션 선택</span>
                    </div>

                    <div className="ml-auto flex items-center bg-white/[0.03] rounded border border-white/[0.06] p-0.5 gap-0.5">
                        <button
                            onClick={() => setPreviewDevice("desktop")}
                            className={`p-1 rounded transition-colors ${previewDevice === "desktop" ? "bg-indigo-500/20 text-indigo-300" : "text-white/25 hover:text-white/50"}`}
                            title="데스크탑"
                        >
                            <Monitor className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setPreviewDevice("mobile")}
                            className={`p-1 rounded transition-colors ${previewDevice === "mobile" ? "bg-indigo-500/20 text-indigo-300" : "text-white/25 hover:text-white/50"}`}
                            title="모바일"
                        >
                            <Smartphone className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* iframe */}
                <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] p-2 min-h-0 overflow-hidden">
                    {blobUrl ? (
                        <div
                            className={`bg-white rounded overflow-hidden shadow-xl transition-all duration-300 ${
                                previewDevice === "mobile"
                                    ? "w-[375px] h-[600px] shadow-2xl ring-1 ring-white/10"
                                    : "w-full h-full"
                            }`}
                        >
                            <iframe
                                ref={iframeRef}
                                src={blobUrl}
                                className="w-full h-full border-0"
                                title="IR 라이브 미리보기"
                                sandbox="allow-scripts"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/40 animate-bounce [animation-delay:0ms]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/40 animate-bounce [animation-delay:150ms]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/40 animate-bounce [animation-delay:300ms]" />
                            </div>
                            <p className="text-[11px] text-white/20">미리보기 로드 중...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right: Slot editor + Style panel ── */}
            <div className="w-[248px] flex-shrink-0 flex flex-col overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-white/[0.06] flex-shrink-0">
                    {(["slots", "style"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setRightTab(t)}
                            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                                rightTab === t
                                    ? t === "slots" ? "border-indigo-400 text-indigo-300" : "border-purple-400 text-purple-300"
                                    : "border-transparent text-white/30 hover:text-white/50"
                            }`}
                        >
                            {t === "slots" ? "슬롯 편집" : "스타일"}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3">
                    {rightTab === "slots" ? (
                        selectedComp ? (
                            <>
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
                                    <span className="text-lg">{COMP_INFO[selectedComp.type]?.icon ?? "📦"}</span>
                                    <span className="flex-1 text-[12px] font-semibold text-white/70">
                                        {COMP_INFO[selectedComp.type]?.label ?? selectedComp.type}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                        selectedComp.visible ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/30"
                                    }`}>
                                        {selectedComp.visible ? "표시" : "숨김"}
                                    </span>
                                </div>
                                <ComponentSlotPanel comp={selectedComp} />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                                <MousePointerClick className="w-8 h-8 text-white/10" />
                                <p className="text-[11px] text-white/25 leading-relaxed">
                                    왼쪽 목록이나<br />미리보기에서<br />섹션을 클릭하세요
                                </p>
                            </div>
                        )
                    ) : (
                        <StylePanel />
                    )}
                </div>
            </div>
        </div>
    );
}

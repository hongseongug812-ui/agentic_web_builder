"use client";

import { useState } from "react";
import {
    Plus,
    X,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Type,
    Box,
    Maximize2,
    Layout,
} from "lucide-react";
import {
    useFlowStore,
    AVAILABLE_SECTIONS,
    SECTION_CATEGORIES,
    FONT_OPTIONS,
    RADIUS_OPTIONS,
    SPACING_OPTIONS,
    LAYOUT_OPTIONS,
} from "@/store/store";

/**
 * 섹션 빌더 — 페이지 섹션 추가/삭제/재정렬 + 디자인 토큰 설정
 */
export default function SectionBuilder() {
    const selectedSections = useFlowStore((s) => s.selectedSections);
    const designTokens = useFlowStore((s) => s.designTokens);
    const addSection = useFlowStore((s) => s.addSection);
    const removeSection = useFlowStore((s) => s.removeSection);
    const reorderSections = useFlowStore((s) => s.reorderSections);
    const setDesignToken = useFlowStore((s) => s.setDesignToken);

    const [showPicker, setShowPicker] = useState(false);
    const [pickerFilter, setPickerFilter] = useState<string>("전체");

    const filteredSections = AVAILABLE_SECTIONS.filter(
        (s) => pickerFilter === "전체" || s.category === pickerFilter
    );

    function moveUp(index: number) {
        if (index > 0) reorderSections(index, index - 1);
    }

    function moveDown(index: number) {
        if (index < selectedSections.length - 1) reorderSections(index, index + 1);
    }

    return (
        <div className="space-y-4">
            {/* ────── 섹션 구성 ────── */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                        📐 페이지 섹션 구성
                    </h3>
                    <span className="text-[9px] text-white/25">{selectedSections.length}개</span>
                </div>

                {/* Selected sections list */}
                <div className="space-y-1 mb-2">
                    {selectedSections.map((id, index) => {
                        const section = AVAILABLE_SECTIONS.find((s) => s.id === id);
                        if (!section) return null;
                        return (
                            <div
                                key={id}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] group hover:border-indigo-500/30 transition-colors"
                            >
                                <GripVertical className="w-3 h-3 text-white/15 group-hover:text-white/30" />
                                <span className="text-xs">{section.icon}</span>
                                <span className="text-[10px] text-white/60 flex-1 truncate">
                                    {section.name}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => moveUp(index)}
                                        className="p-0.5 rounded text-white/20 hover:text-white/60 transition-colors"
                                        disabled={index === 0}
                                        aria-label="위로 이동"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        className="p-0.5 rounded text-white/20 hover:text-white/60 transition-colors"
                                        disabled={index === selectedSections.length - 1}
                                        aria-label="아래로 이동"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => removeSection(id)}
                                        className="p-0.5 rounded text-white/20 hover:text-red-400 transition-colors"
                                        aria-label="섹션 제거"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add section button */}
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-white/10 text-white/25 hover:border-indigo-500/30 hover:text-indigo-400 text-[10px] transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    섹션 추가
                </button>

                {/* Section picker dropdown */}
                {showPicker && (
                    <div className="mt-2 p-2 rounded-xl bg-gray-900/95 border border-white/[0.08] animate-[fadeInUp_0.2s_ease-out]">
                        {/* Category filter */}
                        <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                            {SECTION_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setPickerFilter(cat)}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-medium whitespace-nowrap transition-colors ${
                                        pickerFilter === cat
                                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                            : "text-white/30 hover:text-white/50 border border-transparent"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                            {filteredSections.map((section) => {
                                const isAdded = selectedSections.includes(section.id);
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            if (!isAdded) addSection(section.id);
                                        }}
                                        disabled={isAdded}
                                        className={`flex items-start gap-1.5 p-1.5 rounded-lg text-left transition-colors ${
                                            isAdded
                                                ? "bg-white/[0.02] opacity-40 cursor-not-allowed"
                                                : "bg-white/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/20 cursor-pointer"
                                        } border border-white/[0.04]`}
                                    >
                                        <span className="text-sm flex-shrink-0">{section.icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-white/60 font-medium truncate">
                                                {section.name}
                                            </p>
                                            <p className="text-[8px] text-white/20 truncate">
                                                {section.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ────── 디자인 토큰 ────── */}
            <div>
                <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
                    🎨 디자인 설정
                </h3>
                <div className="space-y-2">
                    {/* Font */}
                    <TokenSelect
                        icon={<Type className="w-3 h-3" />}
                        label="폰트"
                        value={designTokens.font}
                        options={FONT_OPTIONS.map((f) => ({ id: f.id, name: f.name }))}
                        onChange={(v) => setDesignToken("font", v)}
                    />
                    {/* Border Radius */}
                    <TokenSelect
                        icon={<Box className="w-3 h-3" />}
                        label="모서리"
                        value={designTokens.borderRadius}
                        options={RADIUS_OPTIONS.map((r) => ({ id: r.id, name: r.name }))}
                        onChange={(v) => setDesignToken("borderRadius", v)}
                    />
                    {/* Spacing */}
                    <TokenSelect
                        icon={<Maximize2 className="w-3 h-3" />}
                        label="여백"
                        value={designTokens.spacing}
                        options={SPACING_OPTIONS.map((s) => ({ id: s.id, name: s.name }))}
                        onChange={(v) => setDesignToken("spacing", v)}
                    />
                    {/* Layout */}
                    <TokenSelect
                        icon={<Layout className="w-3 h-3" />}
                        label="레이아웃"
                        value={designTokens.layout}
                        options={LAYOUT_OPTIONS.map((l) => ({ id: l.id, name: l.name }))}
                        onChange={(v) => setDesignToken("layout", v)}
                    />
                </div>
            </div>
        </div>
    );
}

/* ── Token Select Row ── */
function TokenSelect({
    icon,
    label,
    value,
    options,
    onChange,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    options: { id: string; name: string }[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-white/30 w-[60px] flex-shrink-0">
                {icon}
                <span className="text-[9px]">{label}</span>
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-[10px] text-white/70 appearance-none cursor-pointer hover:border-indigo-500/30 transition-colors focus:outline-none focus:border-indigo-500/40"
                aria-label={label}
            >
                {options.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-gray-900 text-white">
                        {opt.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

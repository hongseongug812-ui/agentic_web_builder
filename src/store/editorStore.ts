import { create } from "zustand";
import type { TemplateIR, ComponentIR } from "@/lib/template-ir/types";

/* ── Editor Store ──
 * Phase 01: previewMode, viewMode
 * Phase 02: IR state — currentIR, selectedComponentId, history/future, mutations
 */

export type PreviewMode = "desktop" | "tablet" | "mobile";
export type ViewMode = "visual" | "code";

/* ── helpers ── */
function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

const MAX_HISTORY = 30;

function patchComponent(
    ir: TemplateIR,
    componentId: string,
    updater: (comp: ComponentIR) => void,
): TemplateIR {
    const next = deepClone(ir);
    for (const page of next.pages) {
        for (const comp of page.components) {
            if (comp.id === componentId) {
                updater(comp);
                return next;
            }
        }
    }
    return next;
}

interface EditorStore {
    /* ── Preview / view ── */
    previewMode: PreviewMode;
    setPreviewMode: (mode: PreviewMode) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;

    /* ── IR state ── */
    currentIR: TemplateIR | null;
    selectedComponentId: string | null;
    history: TemplateIR[];
    future: TemplateIR[];

    /* ── IR actions ── */
    loadTemplate: (ir: TemplateIR) => void;
    setSelectedComponent: (id: string | null) => void;
    updateSlot: (componentId: string, slotKey: string, value: unknown) => void;
    toggleComponentVisible: (componentId: string) => void;
    updateStyleColor: (key: string, value: string) => void;
    updateStyleFont: (key: string, value: string) => void;
    updateStyleOption: (key: "borderRadius" | "spacing", value: string) => void;
    undo: () => void;
    redo: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
    /* preview */
    previewMode: "desktop",
    setPreviewMode: (mode) => set({ previewMode: mode }),
    viewMode: "visual",
    setViewMode: (mode) => set({ viewMode: mode }),

    /* IR */
    currentIR: null,
    selectedComponentId: null,
    history: [],
    future: [],

    loadTemplate: (ir) =>
        set({ currentIR: deepClone(ir), selectedComponentId: null, history: [], future: [] }),

    setSelectedComponent: (id) => set({ selectedComponentId: id }),

    updateSlot: (componentId, slotKey, value) => {
        const { currentIR, history } = get();
        if (!currentIR) return;
        const prev = deepClone(currentIR);
        const next = patchComponent(currentIR, componentId, (comp) => {
            if (comp.slots[slotKey]) comp.slots[slotKey].value = value;
        });
        set({ currentIR: next, history: [...history.slice(-MAX_HISTORY + 1), prev], future: [] });
    },

    toggleComponentVisible: (componentId) => {
        const { currentIR, history } = get();
        if (!currentIR) return;
        const prev = deepClone(currentIR);
        const next = patchComponent(currentIR, componentId, (comp) => {
            comp.visible = !comp.visible;
        });
        set({ currentIR: next, history: [...history.slice(-MAX_HISTORY + 1), prev], future: [] });
    },

    updateStyleColor: (key, value) => {
        const { currentIR, history } = get();
        if (!currentIR) return;
        const prev = deepClone(currentIR);
        const next = deepClone(currentIR);
        (next.styleTokens.colors as Record<string, string>)[key] = value;
        set({ currentIR: next, history: [...history.slice(-MAX_HISTORY + 1), prev], future: [] });
    },

    updateStyleFont: (key, value) => {
        const { currentIR, history } = get();
        if (!currentIR) return;
        const prev = deepClone(currentIR);
        const next = deepClone(currentIR);
        (next.styleTokens.fonts as Record<string, string>)[key] = value;
        set({ currentIR: next, history: [...history.slice(-MAX_HISTORY + 1), prev], future: [] });
    },

    updateStyleOption: (key, value) => {
        const { currentIR, history } = get();
        if (!currentIR) return;
        const prev = deepClone(currentIR);
        const next = deepClone(currentIR);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (next.styleTokens as any)[key] = value;
        set({ currentIR: next, history: [...history.slice(-MAX_HISTORY + 1), prev], future: [] });
    },

    undo: () => {
        const { currentIR, history, future } = get();
        if (!history.length || !currentIR) return;
        const prev = history[history.length - 1];
        set({
            currentIR: prev,
            history: history.slice(0, -1),
            future: [deepClone(currentIR), ...future.slice(0, MAX_HISTORY - 1)],
        });
    },

    redo: () => {
        const { currentIR, history, future } = get();
        if (!future.length || !currentIR) return;
        const next = future[0];
        set({
            currentIR: next,
            history: [...history.slice(-MAX_HISTORY + 1), deepClone(currentIR)],
            future: future.slice(1),
        });
    },
}));

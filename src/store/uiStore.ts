import { create } from "zustand";

export type BottomTab = "code" | "preview" | "ir";

interface UIStore {
    /* View */
    currentView: "setup" | "canvas";
    setView: (v: "setup" | "canvas") => void;

    /* Canvas bottom tab */
    bottomTab: BottomTab;
    setBottomTab: (tab: BottomTab) => void;

    /* Node selection */
    selectedNodeId: string | null;
    selectNode: (id: string | null) => void;

    /* Sidebar */
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    currentView: "setup",
    setView: (v) => set({ currentView: v }),

    bottomTab: "code",
    setBottomTab: (tab) => set({ bottomTab: tab }),

    selectedNodeId: null,
    selectNode: (id) => set({ selectedNodeId: id }),

    isSidebarCollapsed: false,
    setSidebarCollapsed: (v) => set({ isSidebarCollapsed: v }),
}));

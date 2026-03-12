export { useProjectStore } from "./projectStore";
export type {
    TemplateItem,
    StyleItem,
    ColorName,
    ColorInfo,
    FeatureName,
    FeaturesMap,
    SectionItem,
    DesignTokens,
    LLMProviderInfo,
    UploadedImage,
} from "./projectStore";
export {
    TEMPLATES,
    TEMPLATE_CATEGORIES,
    STYLES_MAP,
    COLOR_PALETTE,
    colorOptions,
    featureOptions,
    AVAILABLE_SECTIONS,
    SECTION_CATEGORIES,
    FONT_OPTIONS,
    RADIUS_OPTIONS,
    SPACING_OPTIONS,
    LAYOUT_OPTIONS,
    ANIMATION_OPTIONS,
    getTemplateName,
    getStyleName,
    getStylesForTemplate,
} from "./projectStore";

export { useAgentStore } from "./agentStore";
export type { AgentStatus, AgentState, DebateMessage } from "./agentStore";

export { useEditorStore } from "./editorStore";
export type { PreviewMode, ViewMode } from "./editorStore";
export type { TemplateIR, ComponentIR, SlotIR, SlotType, PageIR, StyleTokens } from "@/lib/template-ir/types";

export { useUIStore } from "./uiStore";
export type { BottomTab } from "./uiStore";

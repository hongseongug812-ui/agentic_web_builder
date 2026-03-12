/* ─────────────────────────────────────────────────────────────────────────
 * Template IR (Intermediate Representation) — 타입 정의
 * Phase 02: IR 시스템. 슬롯 수정 → LLM 무호출. 구조 변경만 에이전트 파이프라인.
 * ───────────────────────────────────────────────────────────────────────── */

export interface TemplateIR {
    id: string;
    name: string;
    category: "landing" | "portfolio" | "business" | "ecommerce" | "blog";
    description: string;
    previewImage: string;
    pages: PageIR[];
    styleTokens: StyleTokens;
    metadata: {
        version: number;
        createdAt: string;
        updatedAt: string;
    };
}

export interface PageIR {
    id: string;
    route: string;
    title: string;
    components: ComponentIR[];
}

export interface ComponentIR {
    id: string;           // 고유 ID
    type: string;         // 'Hero' | 'Features' | 'CTA' | 'Footer' | 'Navbar' | 'Gallery' | 'ContactForm' | 'Testimonials' | 'Pricing' | 'About' | 'Stats' | 'FAQ'
    order: number;        // 페이지 내 순서
    visible: boolean;     // 토글 가능
    slots: Record<string, SlotIR>;
    children?: ComponentIR[];
}

export type SlotType = "text" | "richtext" | "image" | "link" | "button" | "list" | "color" | "number";

export interface SlotIR {
    type: SlotType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    editable: boolean;
    label: string;           // UI에 표시할 라벨 (한글)
    placeholder?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any[];
    validation?: {
        required?: boolean;
        maxLength?: number;
        pattern?: string;
    };
}

export interface StyleTokens {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        muted: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
    borderRadius: "none" | "sm" | "md" | "lg" | "full";
    spacing: "compact" | "normal" | "relaxed";
}

/* ── Validation result ── */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/* ── Renderer output (matches existing agentOutputData format) ── */
export interface GeneratedFile {
    path: string;
    code: string;
    language: string;
}

export interface GeneratedFiles {
    files: GeneratedFile[];
    framework: string;
    summary: string;
}

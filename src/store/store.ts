import { create } from "zustand";

export type AgentStatus = "idle" | "working" | "done" | "error";

export interface AgentState {
    id: string;
    name: string;
    role: "user" | "pm" | "frontend" | "backend";
    status: AgentStatus;
}

/* ── Debate Message (matches backend) ── */
export interface DebateMessage {
    agent: string;
    round: number;
    message_type: "plan" | "review" | "revision" | "approval" | "code" | "be_code";
    content: string;
    data?: Record<string, unknown>;
}

/* ── Template Data ── */
export interface TemplateItem {
    id: string;
    name: string;
    category: string;
    description: string;
    thumbnail: string;
    previews: string[];
}

export const TEMPLATE_CATEGORIES = [
    "전체",
    "교육/캠퍼스",
    "음식점/카페",
    "포트폴리오",
    "쇼핑몰",
    "SaaS/IT",
    "블로그",
    "대시보드",
    "건설/부동산",
    "헤어샵",
] as const;

export const TEMPLATES: TemplateItem[] = [
    {
        id: "campus-hub",
        name: "Campus Hub",
        category: "교육/캠퍼스",
        description: "대학교 및 교육기관을 위한 모던한 캠퍼스 포털",
        thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=300&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?w=300&q=80",
        ],
    },
    {
        id: "mine-portfolio",
        name: "Mine Portfolio",
        category: "포트폴리오",
        description: "작업물을 돋보이게 하는 크리에이티브 쇼케이스",
        thumbnail: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=300&q=80",
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&q=80",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80",
        ],
    },
    {
        id: "construction",
        name: "Construction Firm",
        category: "건설/부동산",
        description: "건설사와 부동산 기업을 위한 신뢰감 있는 웹사이트",
        thumbnail: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&q=80",
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80",
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&q=80",
        ],
    },
    {
        id: "atelier",
        name: "Atelier Handmade",
        category: "쇼핑몰",
        description: "핸드메이드 제품을 돋보이게 하는 감성 커머스",
        thumbnail: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=300&q=80",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80",
        ],
    },
    {
        id: "saas",
        name: "SaaS 랜딩페이지",
        category: "SaaS/IT",
        description: "제품 소개와 가격표가 포함된 전환율 높은 페이지",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80",
            "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=300&q=80",
            "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&q=80",
        ],
    },
    {
        id: "cafe-bistro",
        name: "Cafe Bistro",
        category: "음식점/카페",
        description: "카페와 레스토랑을 위한 따뜻한 분위기의 웹사이트",
        thumbnail: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&q=80",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80",
        ],
    },
    {
        id: "crave-academy",
        name: "Crave Academy",
        category: "교육/캠퍼스",
        description: "온라인 교육 플랫폼을 위한 세련된 학습 환경",
        thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&q=80",
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&q=80",
            "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&q=80",
        ],
    },
    {
        id: "student-portfolio",
        name: "Student Portfolio",
        category: "포트폴리오",
        description: "학생과 주니어를 위한 깔끔한 포트폴리오",
        thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
            "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=300&q=80",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80",
        ],
    },
    {
        id: "fashion-mall",
        name: "Fashion Mall",
        category: "쇼핑몰",
        description: "트렌디한 패션 쇼핑몰 디자인",
        thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=80",
            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&q=80",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80",
        ],
    },
    {
        id: "blog",
        name: "Modern Blog",
        category: "블로그",
        description: "읽기 좋은 타이포그래피 중심 콘텐츠 레이아웃",
        thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300&q=80",
            "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=300&q=80",
            "https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=300&q=80",
        ],
    },
    {
        id: "dashboard",
        name: "Admin Dashboard",
        category: "대시보드",
        description: "데이터 시각화와 관리 기능이 통합된 어드민 패널",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80",
            "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=300&q=80",
        ],
    },
    {
        id: "hair-salon",
        name: "Hair Salon",
        category: "헤어샵",
        description: "헤어샵과 뷰티 살롱을 위한 세련된 예약 페이지",
        thumbnail: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80",
            "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300&q=80",
        ],
    },
];

/* ── Style Data ── */
export interface StyleItem {
    id: string;
    name: string;
    thumbnail: string;
}

export const STYLES_MAP: Record<string, StyleItem[]> = {
    search: [
        { id: "dropdown", name: "드롭다운 검색", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&q=80" },
        { id: "autocomplete", name: "자동완성 검색", thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&q=80" },
        { id: "command-palette", name: "커맨드 팔레트 (⌘K)", thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=200&q=80" },
        { id: "minimal-bar", name: "미니멀 검색바", thumbnail: "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=200&q=80" },
        { id: "filter-search", name: "필터 검색", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=80" },
    ],
    saas: [
        { id: "hero-cta", name: "히어로 + CTA", thumbnail: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=200&q=80" },
        { id: "feature-showcase", name: "기능 쇼케이스", thumbnail: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200&q=80" },
        { id: "pricing-focus", name: "가격표 중심", thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&q=80" },
        { id: "video-bg", name: "비디오 배경", thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=200&q=80" },
        { id: "scroll-story", name: "스크롤 스토리", thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&q=80" },
    ],
    shop: [
        { id: "card-grid", name: "카드 그리드", thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80" },
        { id: "carousel-slider", name: "캐러셀 슬라이더", thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&q=80" },
        { id: "mega-menu", name: "카테고리 메가메뉴", thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80" },
        { id: "single-product", name: "싱글 상품 포커스", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80" },
        { id: "marketplace", name: "마켓플레이스", thumbnail: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=200&q=80" },
    ],
    portfolio: [
        { id: "gallery-grid", name: "갤러리 그리드", thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&q=80" },
        { id: "timeline", name: "타임라인", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80" },
        { id: "one-page", name: "원페이지 스크롤", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&q=80" },
        { id: "case-study", name: "케이스 스터디", thumbnail: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&q=80" },
        { id: "interactive-3d", name: "인터랙티브 3D", thumbnail: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&q=80" },
    ],
    blog: [
        { id: "magazine", name: "매거진 레이아웃", thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=200&q=80" },
        { id: "minimal-list", name: "미니멀 리스트", thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&q=80" },
        { id: "blog-card-grid", name: "카드 그리드", thumbnail: "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=200&q=80" },
        { id: "newsletter", name: "뉴스레터 스타일", thumbnail: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=200&q=80" },
        { id: "wiki", name: "위키 스타일", thumbnail: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=200&q=80" },
    ],
    dashboard: [
        { id: "dash-card-grid", name: "카드 그리드", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=80" },
        { id: "table-focus", name: "테이블 중심", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&q=80" },
        { id: "chart-focus", name: "차트 중심", thumbnail: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=200&q=80" },
        { id: "kanban", name: "칸반 보드", thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&q=80" },
        { id: "sidebar-nav", name: "사이드바 내비게이션", thumbnail: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200&q=80" },
    ],
};

/* ── Helpers ── */
export function getTemplateName(templateId: string): string {
    return TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId;
}
export function getStyleName(templateId: string, styleId: string): string {
    return STYLES_MAP[templateId]?.find((s) => s.id === styleId)?.name ?? styleId;
}
export function getStylesForTemplate(templateId: string): StyleItem[] {
    return STYLES_MAP[templateId] ?? [];
}

/* ── Color & Feature Options ── */
export const colorOptions = ["Blue", "Dark", "Neon", "Sunset", "Forest", "Minimal White"] as const;
export type ColorName = (typeof colorOptions)[number];

export const featureOptions = ["로그인", "결제", "검색", "다크모드", "반응형", "다국어"] as const;
export type FeatureName = (typeof featureOptions)[number];
export type FeaturesMap = Record<FeatureName, boolean>;

/* ── Section Builder ── */
export interface SectionItem {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: "layout" | "content" | "conversion" | "social";
}

export const AVAILABLE_SECTIONS: SectionItem[] = [
    { id: "nav", name: "내비게이션 바", icon: "🧭", description: "로고 + 메뉴 + CTA 버튼", category: "layout" },
    { id: "hero", name: "히어로 섹션", icon: "🎯", description: "대형 타이틀 + 서브텍스트 + CTA", category: "layout" },
    { id: "features", name: "기능 소개", icon: "✨", description: "아이콘 카드 3~4열 그리드", category: "content" },
    { id: "about", name: "소개 / About", icon: "📝", description: "이미지 + 텍스트 2단 레이아웃", category: "content" },
    { id: "gallery", name: "갤러리 / 포트폴리오", icon: "🖼️", description: "이미지 그리드 or 메이슨리", category: "content" },
    { id: "pricing", name: "가격표", icon: "💰", description: "요금제 비교 카드", category: "conversion" },
    { id: "testimonials", name: "고객 후기", icon: "💬", description: "리뷰 카드 캐러셀", category: "social" },
    { id: "team", name: "팀 소개", icon: "👥", description: "팀원 프로필 카드", category: "social" },
    { id: "stats", name: "숫자 통계", icon: "📊", description: "카운터 숫자 강조", category: "content" },
    { id: "faq", name: "FAQ", icon: "❓", description: "아코디언 질문/답변", category: "content" },
    { id: "cta", name: "CTA 배너", icon: "🚀", description: "전환 유도 큰 배너", category: "conversion" },
    { id: "contact", name: "문의 폼", icon: "📧", description: "폼 + 지도/연락처", category: "conversion" },
    { id: "blog-list", name: "블로그 목록", icon: "📰", description: "최신 글 카드 3열", category: "content" },
    { id: "footer", name: "푸터", icon: "🔻", description: "링크 + 소셜 + 저작권", category: "layout" },
];

export const SECTION_CATEGORIES = ["전체", "layout", "content", "conversion", "social"] as const;

export interface DesignTokens {
    font: string;
    borderRadius: string;
    spacing: string;
    layout: string;
}

export const FONT_OPTIONS = [
    { id: "system", name: "시스템 기본", preview: "font-family: -apple-system, sans-serif" },
    { id: "inter", name: "Inter", preview: "font-family: Inter" },
    { id: "pretendard", name: "Pretendard", preview: "font-family: Pretendard" },
    { id: "noto-sans", name: "Noto Sans KR", preview: "font-family: Noto Sans KR" },
    { id: "poppins", name: "Poppins", preview: "font-family: Poppins" },
    { id: "playfair", name: "Playfair Display", preview: "font-family: Playfair Display" },
] as const;

export const RADIUS_OPTIONS = [
    { id: "none", name: "각진", value: "0px" },
    { id: "sm", name: "약간 둥근", value: "4px" },
    { id: "md", name: "보통", value: "8px" },
    { id: "lg", name: "많이 둥근", value: "16px" },
    { id: "full", name: "완전 둥근", value: "9999px" },
] as const;

export const SPACING_OPTIONS = [
    { id: "compact", name: "컴팩트" },
    { id: "normal", name: "보통" },
    { id: "spacious", name: "넉넉한" },
] as const;

export const LAYOUT_OPTIONS = [
    { id: "centered", name: "중앙 정렬 (max-w)" },
    { id: "full-width", name: "전체 너비" },
    { id: "sidebar", name: "사이드바" },
] as const;

const defaultFeatures: FeaturesMap = Object.fromEntries(
    featureOptions.map((f) => [f, false])
) as FeaturesMap;

/* ── Provider Types ── */
export interface LLMProviderInfo {
    id: string;
    name: string;
    icon: string;
    configured: boolean;
}

/* ── API Config ── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

/* ── Store Interface ── */
interface FlowStore {
    /* View */
    currentView: "setup" | "canvas";
    setView: (v: "setup" | "canvas") => void;

    /* React Flow */
    agents: AgentState[];
    isRunning: boolean;
    selectedNodeId: string | null;
    lastGeneratedPrompt: string | null;
    isSidebarCollapsed: boolean;
    setAgentStatus: (id: string, status: AgentStatus) => void;
    resetAllAgents: () => void;
    selectNode: (id: string | null) => void;
    setSidebarCollapsed: (v: boolean) => void;

    /* Debate & Output */
    agentOutputData: Record<string, unknown>;
    debateMessages: DebateMessage[];
    currentRound: number;
    error: string | null;
    setError: (e: string | null) => void;
    clearDebate: () => void;

    /* Pipeline Progress */
    pipelineStep: number;
    pipelineTotal: number;
    pipelineLabel: string;
    retryAvailable: boolean;

    /* Template Builder */
    selectedTemplateId: string;
    selectedStyleId: string;
    styleHistory: Record<string, string>;
    selectedColor: ColorName;
    features: FeaturesMap;
    promptMode: "auto" | "manual";
    manualPrompt: string;
    setTemplate: (templateId: string) => void;
    setStyle: (styleId: string) => void;
    setColor: (c: ColorName) => void;
    toggleFeature: (f: FeatureName) => void;
    setPromptMode: (m: "auto" | "manual") => void;
    setManualPrompt: (p: string) => void;
    generatePrompt: () => string;

    /* Section Builder */
    selectedSections: string[];
    designTokens: DesignTokens;
    addSection: (id: string) => void;
    removeSection: (id: string) => void;
    reorderSections: (from: number, to: number) => void;
    setDesignToken: (key: keyof DesignTokens, value: string) => void;

    /* LLM Provider */
    selectedProvider: string;
    availableProviders: LLMProviderInfo[];
    setProvider: (p: string) => void;
    fetchProviders: () => void;

    /* Core action */
    runSequence: () => void;
    retrySequence: () => void;
}

const defaultAgents: AgentState[] = [
    { id: "user-input", name: "사용자 입력", role: "user", status: "idle" },
    { id: "pm-agent", name: "PM 에이전트", role: "pm", status: "idle" },
    { id: "frontend-agent", name: "Frontend 에이전트", role: "frontend", status: "idle" },
    { id: "backend-agent", name: "Backend 에이전트", role: "backend", status: "idle" },
];

const defaultStyleHistory: Record<string, string> = Object.fromEntries(
    TEMPLATES.map((t) => [t.id, STYLES_MAP[t.id]?.[0]?.id ?? ""])
);

export const useFlowStore = create<FlowStore>((set, get) => ({
    /* ── View ── */
    currentView: "setup" as "setup" | "canvas",
    setView: (v) => set({ currentView: v }),

    /* ── React Flow ── */
    agents: defaultAgents.map((a) => ({ ...a })),
    isRunning: false,
    selectedNodeId: null,
    lastGeneratedPrompt: null,
    isSidebarCollapsed: false,

    setAgentStatus: (id, status) =>
        set((state) => ({
            agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

    resetAllAgents: () =>
        set({
            agents: defaultAgents.map((a) => ({
                ...a,
                status: "idle" as AgentStatus,
            })),
        }),

    selectNode: (id) => set({ selectedNodeId: id }),
    setSidebarCollapsed: (v) => set({ isSidebarCollapsed: v }),

    /* ── Debate & Output ── */
    agentOutputData: {},
    debateMessages: [],
    currentRound: 0,
    error: null,
    setError: (e) => set({ error: e }),
    clearDebate: () => set({ debateMessages: [], agentOutputData: {}, currentRound: 0, error: null, pipelineStep: 0, pipelineLabel: "" }),

    /* Pipeline Progress */
    pipelineStep: 0,
    pipelineTotal: 6,
    pipelineLabel: "",
    retryAvailable: false,

    /* ── Template Builder ── */
    selectedTemplateId: "campus-hub",
    selectedStyleId: STYLES_MAP["saas"]?.[0]?.id ?? "hero-cta",
    styleHistory: { ...defaultStyleHistory },
    selectedColor: "Dark" as ColorName,
    features: { ...defaultFeatures },
    promptMode: "auto" as "auto" | "manual",
    manualPrompt: "",

    setTemplate: (templateId) => {
        const history = get().styleHistory;
        const fallback = STYLES_MAP[templateId]?.[0]?.id ?? "";
        set({
            selectedTemplateId: templateId,
            selectedStyleId: history[templateId] || fallback,
        });
    },
    setStyle: (styleId) =>
        set((state) => ({
            selectedStyleId: styleId,
            styleHistory: { ...state.styleHistory, [state.selectedTemplateId]: styleId },
        })),
    setColor: (c) => set({ selectedColor: c }),
    toggleFeature: (f) =>
        set((state) => ({
            features: { ...state.features, [f]: !state.features[f] },
        })),
    setPromptMode: (m) => set({ promptMode: m }),
    setManualPrompt: (p) => set({ manualPrompt: p }),

    /* Section Builder */
    selectedSections: ["nav", "hero", "features", "footer"],
    designTokens: { font: "inter", borderRadius: "md", spacing: "normal", layout: "centered" },
    addSection: (id) => set((s) => ({
        selectedSections: s.selectedSections.includes(id) ? s.selectedSections : [...s.selectedSections, id],
    })),
    removeSection: (id) => set((s) => ({
        selectedSections: s.selectedSections.filter((sId) => sId !== id),
    })),
    reorderSections: (from, to) => set((s) => {
        const arr = [...s.selectedSections];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        return { selectedSections: arr };
    }),
    setDesignToken: (key, value) => set((s) => ({
        designTokens: { ...s.designTokens, [key]: value },
    })),

    /* ── LLM Provider ── */
    selectedProvider: "gemini",
    availableProviders: [],
    setProvider: (p) => set({ selectedProvider: p }),
    fetchProviders: async () => {
        try {
            const res = await fetch(`${API_BASE}/api/providers`);
            if (res.ok) {
                const providers = await res.json();
                set({ availableProviders: providers });
                // Auto-select first configured provider
                const configured = providers.find((p: LLMProviderInfo) => p.configured);
                if (configured) set({ selectedProvider: configured.id });
            }
        } catch { /* silent */ }
    },

    generatePrompt: () => {
        const { promptMode, manualPrompt, selectedTemplateId, selectedStyleId, selectedColor, features, selectedSections, designTokens } = get();
        if (promptMode === "manual" && manualPrompt.trim()) return manualPrompt;

        const templateName = getTemplateName(selectedTemplateId);
        const styleName = getStyleName(selectedTemplateId, selectedStyleId);
        const enabledFeatures = (Object.entries(features) as [FeatureName, boolean][])
            .filter(([, v]) => v)
            .map(([k]) => k);
        const featureStr = enabledFeatures.length > 0 ? enabledFeatures.join(", ") : "없음";

        // 섹션 구성
        const sectionNames = selectedSections
            .map((id) => AVAILABLE_SECTIONS.find((s) => s.id === id))
            .filter(Boolean)
            .map((s) => `${s!.icon} ${s!.name} (${s!.description})`)
            .join("\n- ");

        // 디자인 토큰
        const fontName = FONT_OPTIONS.find((f) => f.id === designTokens.font)?.name ?? designTokens.font;
        const radiusName = RADIUS_OPTIONS.find((r) => r.id === designTokens.borderRadius)?.name ?? designTokens.borderRadius;
        const spacingName = SPACING_OPTIONS.find((s) => s.id === designTokens.spacing)?.name ?? designTokens.spacing;
        const layoutName = LAYOUT_OPTIONS.find((l) => l.id === designTokens.layout)?.name ?? designTokens.layout;

        return `너는 전문 웹 개발자야. ${templateName} 템플릿을 기반으로 사이트를 만들어줘.

## 스타일
- 레이아웃 스타일: "${styleName}"
- 메인 컬러: ${selectedColor}
- 폰트: ${fontName}
- 모서리: ${radiusName}
- 여백: ${spacingName}
- 레이아웃: ${layoutName}

## 페이지 섹션 구성 (위→아래 순서)
- ${sectionNames}

## 필수 기능
${featureStr}

위 구성을 정확히 반영해서 모든 섹션을 포함한 완성된 웹사이트를 만들어줘.`;
    },

    /* ── Run Sequence: WebSocket + API 호출 ── */
    runSequence: () => {
        const { isRunning, generatePrompt, setAgentStatus } = get();
        if (isRunning) return;

        const prompt = generatePrompt();
        set({
            lastGeneratedPrompt: prompt,
            currentView: "canvas",
            isSidebarCollapsed: true,
            isRunning: true,
            error: null,
        });
        get().resetAllAgents();
        get().clearDebate();

        // 1) 사용자 입력 노드 완료
        setAgentStatus("user-input", "working");
        setTimeout(() => {
            setAgentStatus("user-input", "done");
            set((state) => ({
                agentOutputData: {
                    ...state.agentOutputData,
                    "user-input": {
                        type: "user_prompt",
                        content: prompt,
                        timestamp: new Date().toISOString(),
                    },
                },
            }));
        }, 600);

        // 2) WebSocket 연결
        let ws: WebSocket | null = null;
        try {
            ws = new WebSocket(`${WS_BASE}/ws/status`);
        } catch {
            // WebSocket 연결 실패 시에도 API는 호출
        }

        if (ws) {
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    const { event: evtType, data } = msg;

                    if (evtType === "agent_start" && data?.agent) {
                        setAgentStatus(data.agent, "working");
                        if (data.round) set({ currentRound: data.round });

                        // Pipeline progress tracking
                        const labelMap: Record<string, string> = {
                            "pm-agent": data.action === "revising" ? `PM 기획서 수정 (R${data.round})` : "PM 기획서 작성",
                            "frontend-agent": data.action === "reviewing" ? `FE 리뷰 (R${data.round})` : "FE 코드 생성",
                            "backend-agent": "BE 코드 생성",
                        };
                        set((state) => ({
                            pipelineStep: state.pipelineStep + 0.5,
                            pipelineLabel: labelMap[data.agent] || data.action || "",
                        }));
                    } else if (evtType === "agent_done" && data?.agent) {
                        setAgentStatus(data.agent, "done");
                        set((state) => ({ pipelineStep: state.pipelineStep + 0.5 }));
                    } else if (evtType === "debate_message" && data) {
                        set((state) => ({
                            debateMessages: [...state.debateMessages, data as DebateMessage],
                        }));
                    } else if (evtType === "pipeline_complete") {
                        set({ isRunning: false, pipelineLabel: "완료", retryAvailable: false });
                    } else if (evtType === "error") {
                        set({ error: data?.message || "알 수 없는 오류", isRunning: false, retryAvailable: true });
                    }
                } catch {
                    /* ignore parse errors */
                }
            };
            ws.onerror = () => {
                /* silent — API call will still work */
            };
            // WebSocket reconnection with exponential backoff
            let wsRetryCount = 0;
            ws.onclose = () => {
                if (get().isRunning && wsRetryCount < 3) {
                    const delay = Math.min(1000 * Math.pow(2, wsRetryCount), 8000);
                    wsRetryCount++;
                    setTimeout(() => {
                        try {
                            const newWs = new WebSocket(`${WS_BASE}/ws/status`);
                            newWs.onmessage = ws!.onmessage;
                            newWs.onerror = ws!.onerror;
                            newWs.onclose = ws!.onclose;
                            ws = newWs;
                        } catch { /* silent */ }
                    }, delay);
                }
            };
        }

        // 3) POST /api/orchestrate 호출 (WebSocket 연결 후 바로 실행)
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/orchestrate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, max_rounds: 3, provider: get().selectedProvider }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({ detail: "서버 오류" }));
                    set({
                        error: errData.detail || `서버 오류 (${res.status})`,
                        isRunning: false,
                        retryAvailable: true,
                    });
                    setAgentStatus("pm-agent", "error");
                    setAgentStatus("frontend-agent", "error");
                    setAgentStatus("backend-agent", "error");
                    ws?.close();
                    return;
                }

                const result = await res.json();

                // 에이전트 출력 저장
                set((state) => ({
                    agentOutputData: {
                        ...state.agentOutputData,
                        "pm-agent": {
                            type: "project_plan",
                            data: result.plan,
                            rounds: result.total_rounds,
                        },
                        "frontend-agent": {
                            type: "generated_code",
                            data: result.code,
                        },
                        "backend-agent": {
                            type: "generated_code",
                            data: result.backend_code,
                        },
                    },
                    debateMessages: result.debate_log || state.debateMessages,
                    isRunning: false,
                }));

                setAgentStatus("pm-agent", "done");
                setAgentStatus("frontend-agent", "done");
                setAgentStatus("backend-agent", result.backend_code ? "done" : "idle");
            } catch (err) {
                set({
                    error: err instanceof Error ? err.message : "네트워크 오류",
                    isRunning: false,
                    retryAvailable: true,
                });
                setAgentStatus("pm-agent", "error");
                setAgentStatus("frontend-agent", "error");
                setAgentStatus("backend-agent", "error");
            } finally {
                ws?.close();
            }
        })();
    },

    /* ── Retry ── */
    retrySequence: () => {
        const { retryAvailable } = get();
        if (!retryAvailable) return;
        set({ error: null, retryAvailable: false, pipelineStep: 0, pipelineLabel: "" });
        get().runSequence();
    },
}));

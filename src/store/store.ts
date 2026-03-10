import { create } from "zustand";

export type AgentStatus = "idle" | "working" | "done";

export interface AgentState {
    id: string;
    name: string;
    role: "user" | "pm" | "frontend";
    status: AgentStatus;
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

/* ── Style Data (per template) ── */
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

/* ── Helper: look up names from IDs ── */
export function getTemplateName(templateId: string): string {
    return TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId;
}
export function getStyleName(templateId: string, styleId: string): string {
    return STYLES_MAP[templateId]?.find((s) => s.id === styleId)?.name ?? styleId;
}
export function getStylesForTemplate(templateId: string): StyleItem[] {
    return STYLES_MAP[templateId] ?? [];
}

/* ── Color Options ── */
export const colorOptions = [
    "Blue",
    "Dark",
    "Neon",
    "Sunset",
    "Forest",
    "Minimal White",
] as const;
export type ColorName = (typeof colorOptions)[number];

/* ── Feature Options ── */
export const featureOptions = [
    "로그인",
    "결제",
    "검색",
    "다크모드",
    "반응형",
    "다국어",
] as const;
export type FeatureName = (typeof featureOptions)[number];

export type FeaturesMap = Record<FeatureName, boolean>;

const defaultFeatures: FeaturesMap = Object.fromEntries(
    featureOptions.map((f) => [f, false])
) as FeaturesMap;

/* ── Fake output data for each agent ── */
export const agentOutputs: Record<string, object> = {
    "user-input": {
        type: "user_prompt",
        content: "쇼핑몰 메인 페이지를 만들어줘",
        timestamp: "2026-03-10T07:42:00Z",
        metadata: {
            language: "ko",
            complexity: "medium",
            estimated_components: 5,
        },
    },
    "pm-agent": {
        type: "project_plan",
        title: "쇼핑몰 메인 페이지 기획서",
        sections: [
            {
                name: "Hero Banner",
                description: "메인 비주얼 슬라이드 영역",
                priority: "high",
            },
            {
                name: "Category Grid",
                description: "상품 카테고리 그리드 (4열)",
                priority: "high",
            },
            {
                name: "Featured Products",
                description: "추천 상품 캐러셀",
                priority: "medium",
            },
            {
                name: "Newsletter CTA",
                description: "뉴스레터 구독 섹션",
                priority: "low",
            },
        ],
        tech_stack: ["Next.js 14", "Tailwind CSS", "Framer Motion"],
        estimated_time: "2h",
    },
    "frontend-agent": {
        type: "generated_code",
        framework: "Next.js 14",
        files: [
            { path: "src/app/page.tsx", status: "created", lines: 142 },
            { path: "src/components/HeroBanner.tsx", status: "created", lines: 58 },
            { path: "src/components/CategoryGrid.tsx", status: "created", lines: 73 },
            { path: "src/components/FeaturedProducts.tsx", status: "created", lines: 95 },
        ],
        build_status: "success",
        preview_url: "https://preview.vercel.app/abc123",
    },
};
interface FlowStore {
    /* ── View state ── */
    currentView: "setup" | "canvas";
    setView: (v: "setup" | "canvas") => void;

    /* ── React Flow state ── */
    agents: AgentState[];
    isRunning: boolean;
    selectedNodeId: string | null;
    lastGeneratedPrompt: string | null;
    isSidebarCollapsed: boolean;
    setAgentStatus: (id: string, status: AgentStatus) => void;
    resetAllAgents: () => void;
    selectNode: (id: string | null) => void;
    setSidebarCollapsed: (v: boolean) => void;
    runSequence: () => void;

    /* ── Template builder state (IDs) ── */
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
}

const defaultAgents: AgentState[] = [
    { id: "user-input", name: "사용자 입력", role: "user", status: "idle" },
    { id: "pm-agent", name: "PM 에이전트", role: "pm", status: "idle" },
    {
        id: "frontend-agent",
        name: "Frontend 에이전트",
        role: "frontend",
        status: "idle",
    },
];

/* ── Build default style history (first style per template) ── */
const defaultStyleHistory: Record<string, string> = Object.fromEntries(
    TEMPLATES.map((t) => [t.id, STYLES_MAP[t.id]?.[0]?.id ?? ""])
);

export const useFlowStore = create<FlowStore>((set, get) => ({
    /* ── View state ── */
    currentView: "setup" as "setup" | "canvas",
    setView: (v) => set({ currentView: v }),

    /* ── React Flow state ── */
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

    /* ── Template builder state (ID-based) ── */
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

    generatePrompt: () => {
        const { promptMode, manualPrompt, selectedTemplateId, selectedStyleId, selectedColor, features } = get();
        if (promptMode === "manual" && manualPrompt.trim()) {
            return manualPrompt;
        }
        const templateName = getTemplateName(selectedTemplateId);
        const styleName = getStyleName(selectedTemplateId, selectedStyleId);
        const enabledFeatures = (Object.entries(features) as [FeatureName, boolean][])
            .filter(([, v]) => v)
            .map(([k]) => k);
        const featureStr =
            enabledFeatures.length > 0 ? enabledFeatures.join(", ") : "없음";
        return `너는 전문 웹 개발자야. ${templateName} 템플릿을 기반으로 사이트를 만들어줘. 스타일은 "${styleName}" 방식으로 구성해. 메인 컬러는 ${selectedColor}를 사용하고, 필수 기능으로 ${featureStr}를 포함해서 설계해.`;
    },

    runSequence: () => {
        const { isRunning, agents, setAgentStatus, generatePrompt } = get();
        if (isRunning) return;

        // 1. Generate and store the prompt
        const prompt = generatePrompt();
        set({ lastGeneratedPrompt: prompt });

        // 2. Switch to canvas view and start running
        set({ currentView: "canvas", isSidebarCollapsed: true, isRunning: true });
        get().resetAllAgents();

        const nodeIds = agents.map((a) => a.id);
        let delay = 0;

        nodeIds.forEach((id, index) => {
            setTimeout(() => {
                setAgentStatus(id, "working");
            }, delay);

            setTimeout(() => {
                setAgentStatus(id, "done");
                if (index === nodeIds.length - 1) {
                    set({ isRunning: false });
                }
            }, delay + 2000);

            delay += 2000;
        });
    },
}));

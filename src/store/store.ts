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
    message_type: "plan" | "review" | "be_review" | "revision" | "approval" | "code" | "be_code" | "qa_pass" | "qa_fail";
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
    "campus-hub": [
        { id: "info-portal", name: "정보 포털", thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&q=80" },
        { id: "event-hero", name: "이벤트 히어로", thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=200&q=80" },
        { id: "card-directory", name: "카드 디렉토리", thumbnail: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&q=80" },
        { id: "timeline-feed", name: "타임라인 피드", thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&q=80" },
    ],
    "mine-portfolio": [
        { id: "gallery-grid", name: "갤러리 그리드", thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&q=80" },
        { id: "timeline", name: "타임라인", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80" },
        { id: "one-page", name: "원페이지 스크롤", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&q=80" },
        { id: "case-study", name: "케이스 스터디", thumbnail: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&q=80" },
        { id: "interactive-3d", name: "인터랙티브 3D", thumbnail: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&q=80" },
    ],
    construction: [
        { id: "corporate-hero", name: "기업형 히어로", thumbnail: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&q=80" },
        { id: "project-showcase", name: "프로젝트 쇼케이스", thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80" },
        { id: "full-width-banner", name: "전체 너비 배너", thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80" },
        { id: "stats-focus", name: "수치 중심", thumbnail: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80" },
    ],
    atelier: [
        { id: "card-grid", name: "카드 그리드", thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80" },
        { id: "carousel-slider", name: "캐러셀 슬라이더", thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&q=80" },
        { id: "single-product", name: "싱글 상품 포커스", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80" },
        { id: "marketplace", name: "마켓플레이스", thumbnail: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=200&q=80" },
    ],
    saas: [
        { id: "hero-cta", name: "히어로 + CTA", thumbnail: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=200&q=80" },
        { id: "feature-showcase", name: "기능 쇼케이스", thumbnail: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200&q=80" },
        { id: "pricing-focus", name: "가격표 중심", thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&q=80" },
        { id: "video-bg", name: "비디오 배경", thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=200&q=80" },
        { id: "scroll-story", name: "스크롤 스토리", thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&q=80" },
    ],
    "cafe-bistro": [
        { id: "warm-hero", name: "따뜻한 히어로", thumbnail: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80" },
        { id: "menu-grid", name: "메뉴 그리드", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80" },
        { id: "gallery-mood", name: "갤러리 무드", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&q=80" },
        { id: "reservation-focus", name: "예약 중심", thumbnail: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=200&q=80" },
    ],
    "crave-academy": [
        { id: "course-grid", name: "코스 그리드", thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=200&q=80" },
        { id: "platform-hero", name: "플랫폼 히어로", thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&q=80" },
        { id: "instructor-focus", name: "강사 중심", thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=200&q=80" },
        { id: "dashboard-learn", name: "대시보드 학습", thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80" },
    ],
    "student-portfolio": [
        { id: "minimal-clean", name: "미니멀 클린", thumbnail: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=200&q=80" },
        { id: "dark-creative", name: "다크 크리에이티브", thumbnail: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&q=80" },
        { id: "resume-style", name: "이력서 스타일", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&q=80" },
        { id: "project-cards", name: "프로젝트 카드", thumbnail: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&q=80" },
    ],
    "fashion-mall": [
        { id: "lookbook", name: "룩북 스타일", thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&q=80" },
        { id: "brand-story", name: "브랜드 스토리", thumbnail: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&q=80" },
        { id: "product-grid", name: "상품 그리드", thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80" },
        { id: "mega-menu", name: "메가메뉴", thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80" },
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
    "hair-salon": [
        { id: "elegant-booking", name: "엘레강스 예약", thumbnail: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&q=80" },
        { id: "stylist-showcase", name: "스타일리스트 쇼케이스", thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80" },
        { id: "gallery-before-after", name: "비포&애프터 갤러리", thumbnail: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=200&q=80" },
        { id: "price-menu", name: "가격 메뉴", thumbnail: "https://images.unsplash.com/photo-1521590832167-7228f0735720?w=200&q=80" },
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
    { id: "cto-agent", name: "🧑‍💼 CTO", role: "pm", status: "idle" },
    { id: "fe-lead-agent", name: "👨‍💻 FE Lead", role: "frontend", status: "idle" },
    { id: "fe-dev-agent", name: "👩‍💻 FE Dev", role: "frontend", status: "idle" },
    { id: "be-lead-agent", name: "🔧 BE Lead", role: "backend", status: "idle" },
    { id: "be-dev-agent", name: "🔩 BE Dev", role: "backend", status: "idle" },
    { id: "qa-agent", name: "🔍 QA", role: "pm", status: "idle" },
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
    pipelineTotal: 20,
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
    selectedProvider: "gpt",
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

        // 섹션별 상세 스펙 매핑
        const sectionSpecs: Record<string, string> = {
            nav: `🧭 내비게이션 바:
  - 고정 위치 (sticky/fixed), 스크롤 시 배경 불투명 전환
  - 왼쪽: 로고 (그라데이션 텍스트 또는 아이콘), 오른쪽: 메뉴 링크 3~5개 + CTA 버튼
  - 모바일: 햄버거 메뉴 → 슬라이드 패널
  - 글래스모피즘 효과 (backdrop-blur, 반투명 배경)`,

            hero: `🎯 히어로 섹션:
  - 최소 화면 높이 (min-h-screen), 중앙 정렬
  - 대형 제목 (text-5xl~7xl, 그라데이션 텍스트), 서브타이틀 (text-lg, text-gray-400)
  - CTA 버튼 2개 (주요: 그라데이션 배경 + 아이콘, 보조: 아웃라인)
  - 배경: 그라데이션 + 도트/그리드 패턴 또는 글로우 효과
  - 스크롤 다운 인디케이터 애니메이션`,

            features: `✨ 기능 소개:
  - 3~4열 카드 그리드 (lg:grid-cols-3 또는 4)
  - 각 카드: 아이콘 (이모지 또는 SVG) + 제목 + 설명 + hover 시 scale + shadow 변화
  - 카드 배경: 글래스모피즘 (bg-white/5, border-white/10, backdrop-blur)
  - 최소 6개 기능 항목 (의미 있는 내용으로)`,

            about: `📝 소개 섹션:
  - 2단 레이아웃: 좌측 이미지 (둥근 모서리) + 우측 텍스트
  - 숫자 통계 포함 (예: "10년+ 경력", "200+ 프로젝트")
  - 강조 텍스트에 그라데이션 색상`,

            gallery: `🖼️ 갤러리:
  - 메이슨리 또는 그리드 레이아웃 (3~4열)
  - hover 시 오버레이 + 프로젝트 정보 표시
  - 이미지 placeholder는 그라데이션 블록으로 대체`,

            pricing: `💰 가격표:
  - 3단 가격 카드 (기본/추천/프리미엄), 추천 카드에 강조 테두리 + "POPULAR" 뱃지
  - 각 카드: 가격(큰 글씨) + 기능 목록(체크 아이콘) + CTA 버튼
  - 월간/연간 토글 스위치`,

            testimonials: `💬 고객 후기:
  - 카드형 후기 3개 (아바타 + 이름 + 직함 + 인용문)
  - 별점 표시 (★★★★★)
  - 카드 배경 글래스모피즘, hover 시 살짝 확대`,

            team: `👥 팀 소개:
  - 프로필 카드 4열: 원형 아바타 + 이름 + 역할 + 소셜 링크 아이콘
  - hover 시 카드 flip 또는 확대 + 소셜 아이콘 표시`,

            stats: `📊 숫자 통계:
  - 4열 큰 숫자 (text-4xl font-bold) + 라벨
  - 그라데이션 숫자 텍스트 또는 카운트업 애니메이션 효과`,

            faq: `❓ FAQ:
  - 아코디언 UI (클릭 시 펼침/접힘)
  - 좌우 2단 레이아웃: 좌측 섹션 제목 + 우측 질문/답변
  - 최소 5개 질문 (의미 있는 Q&A 내용으로)`,

            cta: `🚀 CTA 배너:
  - 전체 너비 그라데이션 배경 (from-indigo-600 to-purple-600)
  - 큰 제목 + 서브텍스트 + 흰색 CTA 버튼
  - 배경에 미묘한 패턴 또는 글로우`,

            contact: `📧 문의 폼:
  - 2단: 좌측 연락처 정보 (주소, 전화, 이메일, 운영시간) + 우측 입력 폼
  - 폼 필드: 이름, 이메일, 메시지(textarea), 전송 버튼
  - 입력 필드에 focus 시 보더 색상 전환`,

            "blog-list": `📰 블로그 목록:
  - 3열 카드 그리드: 이미지(상단) + 카테고리 뱃지 + 제목 + 요약 + 날짜
  - hover 시 이미지 확대 + shadow 증가
  - "더 보기" 링크`,

            footer: `🔻 푸터:
  - 4열 그리드: 회사 소개 + 빠른 링크 + 서비스 + 소셜
  - 소셜 미디어 아이콘 (인스타, 트위터, 깃허브 등)
  - 하단: 수평 구분선 + 저작권 문구
  - 배경: 가장 어둡게 (bg-gray-950)`,
        };

        // 색상별 상세 팔레트
        const colorPalettes: Record<string, string> = {
            Blue: "메인: blue-500/600, 배경: gray-950, 텍스트: white/gray-300, 액센트: cyan-400",
            Dark: "메인: indigo-500/violet-500, 배경: gray-950/900, 텍스트: white/gray-400, 액센트: purple-400",
            Neon: "메인: cyan-400/emerald-400, 배경: gray-950, 텍스트: white/gray-300, 액센트: pink-500, 네온 글로우 효과",
            Sunset: "메인: orange-500/rose-500, 배경: gray-950, 텍스트: white/gray-300, 액센트: amber-400, 따뜻한 그라데이션",
            Forest: "메인: emerald-500/teal-500, 배경: gray-950, 텍스트: white/gray-300, 액센트: lime-400, 자연 느낌",
            "Minimal White": "메인: gray-900, 배경: white/gray-50, 텍스트: gray-900/gray-600, 액센트: blue-500, 깔끔한 라이트 모드",
        };

        // 디자인 토큰 상세 설명
        const fontName = FONT_OPTIONS.find((f) => f.id === designTokens.font)?.name ?? designTokens.font;
        const radiusName = RADIUS_OPTIONS.find((r) => r.id === designTokens.borderRadius)?.name ?? designTokens.borderRadius;
        const spacingName = SPACING_OPTIONS.find((s) => s.id === designTokens.spacing)?.name ?? designTokens.spacing;
        const layoutName = LAYOUT_OPTIONS.find((l) => l.id === designTokens.layout)?.name ?? designTokens.layout;

        // 섹션 상세 스펙
        const sectionDetails = selectedSections
            .map((id) => sectionSpecs[id] || `- ${id}`)
            .join("\n\n");

        // 기능 상세 스펙
        const featureDetails = enabledFeatures.map((f) => {
            const specs: Record<string, string> = {
                "로그인": "로그인/회원가입 버튼 (네비게이션 바 우측), 모달 또는 별도 페이지",
                "결제": "가격표 섹션 + 결제 CTA, 카드 UI 포함",
                "검색": "네비게이션 바에 검색 아이콘 → 풀스크린 또는 드롭다운 검색 UI",
                "다크모드": "다크 모드 기본, 토글 스위치로 라이트 모드 전환 가능",
                "반응형": "모바일(1열) → 태블릿(2열) → 데스크톱(3~4열) 반응형 그리드",
                "다국어": "언어 선택 드롭다운 (KO/EN), 네비게이션 바 우측",
            };
            return `- ${f}: ${specs[f] || f}`;
        }).join("\n");

        return `너는 전문 웹 개발자야. "${templateName}" 컨셉의 프리미엄 웹사이트를 만들어줘.

## 디자인 시스템
- 레이아웃 스타일: "${styleName}"
- 컬러 팔레트: ${colorPalettes[selectedColor] || selectedColor}
- 폰트: ${fontName} (Google Fonts)
- 모서리: ${radiusName}
- 여백: ${spacingName} (섹션 간 py-16~24, 내부 px-4~8)
- 전체 레이아웃: ${layoutName}

## 전체 톤 & 무드
- 프리미엄 & 현대적 느낌, 절대 단조롭거나 밋밋하지 않게
- 모든 인터랙티브 요소에 hover 효과 (scale, shadow, color 전환)
- 부드러운 transition-all duration-300
- 그라데이션, 글래스모피즘, 미묘한 그림자를 적극 활용

## 페이지 섹션 (위→아래 순서, 모두 필수 구현)

${sectionDetails}

${enabledFeatures.length > 0 ? `## 추가 기능\n${featureDetails}` : ""}

위 모든 섹션과 디자인 시스템을 정확히 반영해서 완성된 웹사이트를 만들어줘. 각 섹션에는 실제 의미 있는 텍스트 내용을 넣어. placeholder나 Lorem ipsum은 절대 사용하지 마.`;
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
                            "cto-agent": data.action === "revising" ? `CTO 기획서 수정 (R${data.round})` : "CTO 기획서 작성",
                            "fe-lead-agent": data.action === "reviewing" ? `FE Lead 리뷰 (R${data.round})` : data.action === "generating" ? "FE Lead 코드 생성" : data.action === "revising" ? "FE Lead 코드 수정" : "FE Lead",
                            "fe-dev-agent": data.action === "reviewing" ? `FE Dev 리뷰 (R${data.round})` : data.action === "code_review" ? "FE Dev 코드 리뷰" : "FE Dev",
                            "be-lead-agent": data.action === "reviewing" ? `BE Lead 리뷰 (R${data.round})` : data.action === "generating" ? "BE Lead 코드 생성" : "BE Lead",
                            "be-dev-agent": data.action === "reviewing" ? `BE Dev 리뷰 (R${data.round})` : "BE Dev",
                            "qa-agent": "QA 최종 검수",
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
                    } else if (evtType === "code_revised" && data?.files) {
                        // 수정된 코드를 store에 업데이트
                        set((state) => ({
                            agentOutputData: {
                                ...state.agentOutputData,
                                "frontend-agent": {
                                    type: "generated_code",
                                    data: { files: data.files, framework: "Next.js 14", summary: data.summary || "" },
                                },
                                "fe-lead-agent": {
                                    type: "generated_code",
                                    data: { files: data.files, framework: "Next.js 14", summary: data.summary || "" },
                                },
                            },
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
                    setAgentStatus("cto-agent", "error");
                    setAgentStatus("fe-lead-agent", "error");
                    setAgentStatus("fe-dev-agent", "error");
                    setAgentStatus("be-lead-agent", "error");
                    setAgentStatus("be-dev-agent", "error");
                    setAgentStatus("qa-agent", "error");
                    ws?.close();
                    return;
                }

                const result = await res.json();

                // 에이전트 출력 저장
                set((state) => ({
                    agentOutputData: {
                        ...state.agentOutputData,
                        "cto-agent": {
                            type: "project_plan",
                            data: result.plan,
                            rounds: result.total_rounds,
                        },
                        "frontend-agent": {
                            type: "generated_code",
                            data: result.code,
                        },
                        "fe-lead-agent": {
                            type: "generated_code",
                            data: result.code,
                        },
                        "backend-agent": {
                            type: "generated_code",
                            data: result.backend_code,
                        },
                        "be-lead-agent": {
                            type: "generated_code",
                            data: result.backend_code,
                        },
                    },
                    debateMessages: result.debate_log || state.debateMessages,
                    isRunning: false,
                }));

                setAgentStatus("cto-agent", "done");
                setAgentStatus("fe-lead-agent", "done");
                setAgentStatus("fe-dev-agent", "done");
                setAgentStatus("be-lead-agent", result.backend_code ? "done" : "idle");
                setAgentStatus("be-dev-agent", result.backend_code ? "done" : "idle");
                setAgentStatus("qa-agent", "done");
            } catch (err) {
                set({
                    error: err instanceof Error ? err.message : "네트워크 오류",
                    isRunning: false,
                    retryAvailable: true,
                });
                setAgentStatus("cto-agent", "error");
                setAgentStatus("fe-lead-agent", "error");
                setAgentStatus("fe-dev-agent", "error");
                setAgentStatus("be-lead-agent", "error");
                setAgentStatus("be-dev-agent", "error");
                setAgentStatus("qa-agent", "error");
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

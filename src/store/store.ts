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
    badge?: "HOT" | "NEW" | "AI추천";
}

export const TEMPLATE_CATEGORIES = [
    "전체",
    "비즈니스",
    "크리에이티브",
    "커머스",
    "교육",
    "라이프",
    "테크",
] as const;

export const TEMPLATES: TemplateItem[] = [
    {
        id: "saas",
        name: "SaaS 랜딩페이지",
        category: "테크",
        description: "제품 소개와 가격표가 포함된 전환율 높은 페이지",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80",
            "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=300&q=80",
            "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&q=80",
        ],
        badge: "HOT",
    },
    {
        id: "startup-landing",
        name: "Startup Landing",
        category: "비즈니스",
        description: "투자 유치와 고객 획득을 위한 스타트업 랜딩페이지",
        thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&q=80",
            "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&q=80",
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&q=80",
        ],
        badge: "NEW",
    },
    {
        id: "mine-portfolio",
        name: "Mine Portfolio",
        category: "크리에이티브",
        description: "작업물을 돋보이게 하는 크리에이티브 쇼케이스",
        thumbnail: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=300&q=80",
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&q=80",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80",
        ],
        badge: "AI추천",
    },
    {
        id: "construction",
        name: "Construction Firm",
        category: "비즈니스",
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
        category: "커머스",
        description: "핸드메이드 제품을 돋보이게 하는 감성 커머스",
        thumbnail: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=300&q=80",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80",
        ],
    },
    {
        id: "cafe-bistro",
        name: "Cafe Bistro",
        category: "라이프",
        description: "카페와 레스토랑을 위한 따뜻한 분위기의 웹사이트",
        thumbnail: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&q=80",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80",
        ],
    },
    {
        id: "campus-hub",
        name: "Campus Hub",
        category: "교육",
        description: "대학교 및 교육기관을 위한 모던한 캠퍼스 포털",
        thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=300&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?w=300&q=80",
        ],
    },
    {
        id: "crave-academy",
        name: "Crave Academy",
        category: "교육",
        description: "온라인 교육 플랫폼을 위한 세련된 학습 환경",
        thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&q=80",
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&q=80",
            "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&q=80",
        ],
        badge: "HOT",
    },
    {
        id: "student-portfolio",
        name: "Student Portfolio",
        category: "크리에이티브",
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
        category: "커머스",
        description: "트렌디한 패션 쇼핑몰 디자인",
        thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=80",
            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&q=80",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80",
        ],
        badge: "HOT",
    },
    {
        id: "blog",
        name: "Modern Blog",
        category: "크리에이티브",
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
        category: "테크",
        description: "데이터 시각화와 관리 기능이 통합된 어드민 패널",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80",
            "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=300&q=80",
        ],
        badge: "AI추천",
    },
    {
        id: "hair-salon",
        name: "Hair Salon",
        category: "라이프",
        description: "헤어샵과 뷰티 살롱을 위한 세련된 예약 페이지",
        thumbnail: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80",
            "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300&q=80",
        ],
    },
    {
        id: "medical-clinic",
        name: "Medical Clinic",
        category: "라이프",
        description: "병원·클리닉을 위한 신뢰감 있는 의료 웹사이트",
        thumbnail: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=300&q=80",
            "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80",
            "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=300&q=80",
        ],
        badge: "NEW",
    },
    {
        id: "travel-agency",
        name: "Travel Agency",
        category: "라이프",
        description: "여행사와 투어를 위한 몰입감 있는 비주얼 사이트",
        thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&q=80",
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&q=80",
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&q=80",
        ],
        badge: "NEW",
    },
    {
        id: "fitness-gym",
        name: "Fitness Gym",
        category: "라이프",
        description: "피트니스·헬스장을 위한 에너지 넘치는 웹사이트",
        thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
        previews: [
            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80",
            "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80",
            "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=300&q=80",
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
    "startup-landing": [
        { id: "hero-pitch", name: "히어로 피치", thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200&q=80" },
        { id: "product-demo", name: "제품 데모", thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&q=80" },
        { id: "investor-deck", name: "투자 덱", thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&q=80" },
        { id: "growth-metrics", name: "성장 지표", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=80" },
    ],
    "medical-clinic": [
        { id: "trust-hero", name: "신뢰 히어로", thumbnail: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200&q=80" },
        { id: "service-cards", name: "진료 카드", thumbnail: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&q=80" },
        { id: "doctor-profiles", name: "의료진 소개", thumbnail: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=200&q=80" },
        { id: "appointment-focus", name: "예약 중심", thumbnail: "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=200&q=80" },
    ],
    "travel-agency": [
        { id: "destination-hero", name: "여행지 히어로", thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&q=80" },
        { id: "tour-cards", name: "투어 카드", thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&q=80" },
        { id: "photo-gallery", name: "포토 갤러리", thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=80" },
        { id: "booking-cta", name: "예약 CTA", thumbnail: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=200&q=80" },
    ],
    "fitness-gym": [
        { id: "energy-hero", name: "에너지 히어로", thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80" },
        { id: "class-schedule", name: "클래스 스케줄", thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&q=80" },
        { id: "trainer-profiles", name: "트레이너 소개", thumbnail: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&q=80" },
        { id: "membership-plans", name: "멤버십 플랜", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=80" },
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
export const colorOptions = ["Blue", "Dark", "Neon", "Sunset", "Forest", "Minimal White", "Ocean", "Cherry", "Lavender", "Cyber"] as const;
export type ColorName = (typeof colorOptions)[number];

export interface ColorInfo {
    name: ColorName;
    from: string;
    to: string;
    text: string;
}

export const COLOR_PALETTE: ColorInfo[] = [
    { name: "Blue", from: "#3b82f6", to: "#06b6d4", text: "#fff" },
    { name: "Dark", from: "#312e81", to: "#1e1b4b", text: "#e0e7ff" },
    { name: "Neon", from: "#22d3ee", to: "#a78bfa", text: "#000" },
    { name: "Sunset", from: "#f97316", to: "#ec4899", text: "#fff" },
    { name: "Forest", from: "#22c55e", to: "#14b8a6", text: "#fff" },
    { name: "Minimal White", from: "#f8fafc", to: "#e2e8f0", text: "#1e293b" },
    { name: "Ocean", from: "#0ea5e9", to: "#6366f1", text: "#fff" },
    { name: "Cherry", from: "#e11d48", to: "#be123c", text: "#fff" },
    { name: "Lavender", from: "#a78bfa", to: "#c084fc", text: "#fff" },
    { name: "Cyber", from: "#facc15", to: "#84cc16", text: "#000" },
];

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
    animation: string;
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

export const ANIMATION_OPTIONS = [
    { id: "none", name: "없음", description: "애니메이션 없이 깔끔하게" },
    { id: "subtle", name: "은은하게", description: "fade-in, 부드러운 전환" },
    { id: "dynamic", name: "다이나믹", description: "스크롤 트리거, 슬라이드-인" },
    { id: "playful", name: "플레이풀", description: "바운스, 스프링, 패럴랙스" },
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
    designTokens: { font: "inter", borderRadius: "md", spacing: "normal", layout: "centered", animation: "subtle" },
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

        // ──────────────────────────────────────
        // 🎨 템플릿 컨셉별 톤 & 무드 가이드
        // ──────────────────────────────────────
        const templateToneGuides: Record<string, string> = {
            "saas": `B2B SaaS 전환 최적화 랜딩. 신뢰감 + 기술력을 동시에 전달.
  - 히어로에 제품 대시보드 목업 또는 3D 일러스트 공간을 비워둬
  - 소셜 프루프 (고객 로고 배너, 사용자 수 카운터) 필수
  - CTA는 "무료 체험 시작" / "데모 요청" 등 전환 액션 위주
  - 가격표가 있다면 "연간 결제 시 20% 할인" 토글 포함`,
            "startup-landing": `스타트업 피칭용 랜딩. 임팩트 + 스토리텔링 중심.
  - 히어로는 비전 선언문 스타일의 대형 타이포그래피
  - "왜 우리인가?" 섹션으로 문제→해결 흐름 (Before/After)
  - 투자 배경 또는 미디어 노출 로고 배너
  - CTA는 "얼리 액세스 신청" / "뉴스레터 구독" 위주`,
            "mine-portfolio": `크리에이터/디자이너 포트폴리오. 작업물이 주인공.
  - 텍스트는 최소화, 비주얼 중심 (이미지 그리드/캐러셀)
  - 부드러운 스크롤 애니메이션으로 작업물 순차 등장
  - 프로젝트 클릭 시 상세 페이지 느낌의 모달/오버레이
  - About에 감성적 한 줄 소개 + 스킬 태그`,
            "construction": `건설/부동산 기업. 신뢰 + 실적 강조.
  - 히어로에 파노라마/항공뷰 건축 이미지
  - 프로젝트 실적을 숫자로 강조 (시공면적, 완공 건수 등)
  - 시공 사례 갤러리에 위치/규모/연도 정보
  - 색상은 네이비/그레이 계열의 차분한 톤`,
            "atelier": `핸드메이드/공예 커머스. 따뜻함 + 수공예 감성.
  - 상품 이미지는 라이프스타일 컷처럼 (자연광, 리넨 배경)
  - 장인 스토리 섹션으로 브랜드 가치 전달
  - 가격 표기는 콤마(,)가 포함된 원화(₩) 포맷
  - "수작업이라 재고가 한정됩니다" 같은 스캐시티 문구`,
            "cafe-bistro": `카페/레스토랑. 따뜻함 + 식욕 자극.
  - 남색/갈색/베이지 톤의 따뜻한 무드가 어울림
  - 메뉴 섹션은 카테고리별 탭 (음료/디저트/브런치)
  - 각 메뉴에 가격 + 간단한 설명 + 알레르기 정보 뱃지
  - 영업시간/위치 지도는 하단에 눈에 띄게`,
            "campus-hub": `대학/교육기관 포털. 정보 전달 + 활력.
  - 공지사항/이벤트 피드 카드가 중심
  - 학과별, 시설별 카드 네비게이션
  - 캠퍼스 투어 갤러리 (슬라이더)
  - 신입생 안내, 학사일정 등 실용 정보`,
            "crave-academy": `온라인 교육 플랫폼. 학습 욕구 자극.
  - 히어로에 "지금 시작하면 7일 무료" 같은 프로모션
  - 인기 코스 카드 그리드 (썸네일 + 강사 + 수강생수 + 별점)
  - 강사 소개 섹션 (경력, 전문분야 포함)
  - 과정 가격은 "월 19,900원부터" 형식`,
            "student-portfolio": `학생/주니어 포트폴리오. 깔끔 + 잠재력 어필.
  - 미니멀한 레이아웃에 프로젝트 카드 중심
  - 기술 스택을 태그 또는 프로그래스 바로 시각화
  - GitHub/LinkedIn 소셜 링크 강조
  - "함께 성장할 팀을 찾고 있습니다" 같은 CTA`,
            "fashion-mall": `패션 쇼핑몰. 트렌디 + 시각적 임팩트.
  - 히어로에 풀스크린 룩북 스타일 이미지
  - 상품 카드: 이미지 + 브랜드명 + 상품명 + 가격 (할인가 강조)
  - "NEW IN" / "BEST SELLER" 뱃지
  - 하단에 사이즈 가이드, 교환/반품 정보`,
            "blog": `콘텐츠 블로그. 가독성이 최우선.
  - 본문 영역 max-w-2xl~3xl로 최적 줄 길이
  - 카테고리 필터 탭 (전체/기술/디자인/라이프 등)
  - 각 글 카드에 읽기 시간 표시 (예: "5분 읽기")
  - 뉴스레터 구독 CTA 배너`,
            "dashboard": `어드민 대시보드. 정보 밀도 + 스캔 용이성.
  - 상단 KPI 카드 4개 (숫자 + 전주 대비 증감%)
  - 차트 영역 (라인/바 차트 placeholder)
  - 테이블 영역 (정렬, 페이지네이션 UI)
  - 좌측 사이드바 내비게이션`,
            "hair-salon": `헤어샵/뷰티. 세련됨 + 예약 유도.
  - 비포&애프터 갤러리 (슬라이더)
  - 시술 메뉴 + 가격표 (카트/컷/염색/펌 등)
  - 스타일리스트별 프로필 (경력, 전문 분야)
  - 온라인 예약 CTA가 모든 섹션에서 접근 가능`,
            "medical-clinic": `병원/클리닉. 신뢰 + 전문성 + 접근성.
  - 의료진 소개 (학력, 자격, 전문 분야)
  - 진료 과목 카드 (아이콘 + 설명)
  - 진료시간/휴진일 정보 눈에 띄게
  - "전화 상담" / "온라인 예약" CTA 고정`,
            "travel-agency": `여행사. 몰입감 + 영감.
  - 히어로에 풀스크린 여행지 이미지 (패럴랙스)
  - 목적지별 카드 그리드 (도시명 + 가격 + 일수)
  - 여행 후기/사진 갤러리
  - "맞춤 여행 상담" CTA`,
            "fitness-gym": `피트니스. 에너지 + 동기부여.
  - 다크 배경 + 강렬한 액센트 색상 (레드/오렌지)
  - 프로그램 카드 (웨이트/요가/크로스핏/PT 등)
  - 멤버십 가격표 (월/연 토글)
  - 트레이너 프로필 (수상 경력, 전문 분야)`,
        };

        // ──────────────────────────────────────
        // 🏗️ 섹션별 하이퀄리티 상세 스펙
        // ──────────────────────────────────────
        const sectionSpecs: Record<string, string> = {
            nav: `🧭 내비게이션 바:
  [구조]
  - position: fixed; top:0; width:100%; z-index:50
  - 스크롤 시 backdrop-filter: blur(12px); background: rgba(0,0,0,0.7) 전환 (onscroll JS)
  - 좌: 로고 (background: linear-gradient 텍스트 or SVG 아이콘 + 텍스트)
  - 우: 메뉴 링크 3~5개 (a 태그, hover시 color + translateY(-1px) 전환) + CTA 버튼
  [모바일 반응형]
  - 768px 이하에서 햄버거 아이콘 (☰) 버튼 → 전체화면 슬라이드 오버레이
  - 모바일 메뉴: 세로 방향, 큰 터치 타깃 (최소 48px 높이)
  [디자인 디테일]
  - 로고와 메뉴 사이 flex justify-between align-center
  - border-bottom: 1px solid rgba(255,255,255,0.06) 으로 은은한 구분선
  - max-width 컨테이너 안에 내용 배치 (padding: 0 2rem)`,

            hero: `🎯 히어로 섹션:
  [구조]
  - min-height: 100vh; display:flex; align-items:center; justify-content:center
  - 텍스트 중앙 정렬, max-width: 800px 이내
  [타이포그래피]
  - 제목: font-size 3.5rem~4.5rem (모바일 2rem), font-weight:800, line-height:1.1
  - 제목에 background: linear-gradient + background-clip: text 그라데이션 효과
  - 서브타이틀: font-size 1.125rem, color: 반투명 텍스트, max-width: 600px, margin: 1.5rem auto
  [CTA 버튼]
  - 주요 CTA: padding 16px 32px, border-radius 12px, background: gradient, font-weight: 700
  - 보조 CTA: border: 1px solid rgba(255,255,255,0.2), background: transparent
  - 두 버튼을 flex gap-4로 나란히, 모바일은 flex-col
  [배경 효과]
  - radial-gradient 글로우 (opacity 0.1~0.15) 배경
  - 또는 dots/grid SVG 패턴 (opacity 0.03~0.05)
  [추가]
  - 하단에 스크롤 다운 인디케이터 (animate-bounce 화살표)
  - 히어로 텍스트 아래 신뢰 배지 (예: 소셜 프루프 로고 3~5개)`,

            features: `✨ 기능 소개:
  [구조]
  - 섹션 제목 + 서브텍스트 (text-align:center, mb 4rem)
  - 카드 그리드: display:grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem
  - 모바일: grid-cols-1, 태블릿: grid-cols-2
  [각 카드 상세]
  - padding: 2rem, border-radius: 값에 맞게, border: 1px solid rgba(255,255,255,0.06)
  - 상단: 48x48px 아이콘 영역 (이모지 크기 2rem 또는 SVG)
  - 아이콘 배경: width 48px, height 48px, border-radius: 12px, gradient 배경
  - 제목: font-weight: 600, font-size: 1.125rem, margin: 1rem 0 0.5rem
  - 설명: font-size: 0.875rem, color 반투명, line-height: 1.6
  - hover: transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3)
  [콘텐츠]
  - 최소 6개 기능을 "${templateName}" 비즈니스에 맞는 실제 기능으로 작성
  - 예) SaaS → "실시간 분석", "팀 협업", "API 연동", "자동 보고서" 등`,

            about: `📝 소개 / About 섹션:
  [구조]
  - 2단 레이아웃: display:grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center
  - 모바일: grid-cols-1, 이미지 먼저
  [좌측 - 이미지]
  - border-radius: 16px, overflow: hidden
  - 이미지 대신 gradient 배경 + 아이콘 조합으로 플레이스 홀더
  - 또는 aspect-ratio: 4/3 의 그라데이션 박스
  [우측 - 텍스트]
  - 섹션 라벨 (text-sm uppercase tracking-widest, 메인 컬러)
  - 제목: 2rem font-bold, 강조 단어에 gradient text
  - 본문 2~3 단락, line-height: 1.75
  - 하단에 숫자 통계 3~4개 가로 배치: "10년+" "200+" "50+" 등
  - 통계 숫자는 text-3xl font-bold로 강조, 라벨은 text-sm 반투명`,

            gallery: `🖼️ 갤러리 / 포트폴리오:
  [구조]
  - 3~4열 그리드 또는 masonry 느낌 (grid-auto-rows: 250px 등)
  - 최소 6장 이상
  [각 항목]
  - position: relative; overflow: hidden; border-radius
  - 이미지 대신 다양한 gradient 색상 조합의 플레이스홀더 박스
  - hover 시 scale(1.05) + 오버레이 (dark overlay + 프로젝트명/카테고리 텍스트)
  - transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,

            pricing: `💰 가격표:
  [구조]
  - 상단에 월간/연간 토글 (라벨 + switch UI)
  - 3단 카드: display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem
  - 모바일: grid-cols-1
  [카드 상세]
  - 가운데(추천) 카드: scale(1.05), ring-2, "POPULAR" 뱃지 (position: absolute, top: -12px)
  - 플랜명: text-lg font-semibold
  - 가격: text-4xl font-bold + "/월" 작은 텍스트
  - 기능 리스트: 체크(✓) 아이콘 + 텍스트, 최소 5개씩
  - 불포함 기능: text-through + 어둡게
  - CTA 버튼: width 100%, 추천은 gradient 배경, 나머지는 outline
  [콘텐츠]
  - "${templateName}" 비즈니스에 맞는 실제 요금제 (Basic/Pro/Enterprise 등)
  - 실제적인 가격 (예: ₩19,900/월, $29/mo 등)`,

            testimonials: `💬 고객 후기:
  [구조]
  - 3열 카드 또는 슬라이더
  [카드 상세]
  - 상단: 큰 따옴표 아이콘 " (text-4xl, opacity 0.2)
  - 인용문: font-size: 1rem, line-height: 1.7, font-style: italic
  - 하단: flex align-center gap-3 → 원형 아바타(40px, gradient 배경) + 이름/직함
  - 별점: ★★★★★ (text-yellow-400)
  - card: bg-white/5, border: 1px solid white/8, hover: translateY(-4px) shadow
  [콘텐츠]
  - "${templateName}" 서비스에 대한 구체적이고 긍정적인 후기 3개
  - 이름은 한국식 (예: 김민수, 이지원) 또는 비즈니스에 맞게`,

            team: `👥 팀 소개:
  [구조]
  - 3~4열 카드 그리드, 중앙 정렬
  [카드 상세]
  - 원형 아바타: width 96px, height 96px, gradient 배경, 이니셜 텍스트
  - 이름: font-semibold text-lg
  - 역할: text-sm color 반투명
  - 소셜 아이콘: GitHub, LinkedIn, Twitter (hover시 메인 컬러)
  - hover: translateY(-4px) + 글로우 shadow`,

            stats: `📊 숫자 통계:
  [구조]
  - 4열 균등 그리드, 중앙 정렬
  - 배경: 별도 어두운 톤 또는 subtle gradient
  [각 항목]
  - 숫자: text-4xl~5xl, font-weight: 800, gradient text
  - + 접미사 ("+", "%", "K" 등)은 별도 span, 같은 gradient
  - 라벨: text-sm, 반투명 색상, mt-2
  - 구분: 세로 구분선 (border-right: 1px solid white/10)
  [콘텐츠]
  - "${templateName}" 분야에 맞는 의미 있는 수치 4개`,

            faq: `❓ FAQ:
  [구조]
  - 2단: 좌측(1/3) 제목 영역 + 우측(2/3) 아코디언 영역
  - 모바일: 단일 컬럼
  [아코디언 상세]
  - 각 항목: border-bottom: 1px solid white/8
  - 질문 (버튼): flex justify-between, font-weight: 600, padding: 1.25rem 0
  - 열림/닫힘 아이콘: + / − 또는 chevron (rotate transition)
  - 답변: max-height transition (CSS only 가능), padding-bottom: 1.25rem
  - 답변 텍스트: line-height: 1.7, 반투명 색상
  [콘텐츠]
  - "${templateName}" 서비스 관련 실제적인 Q&A 최소 5개
  - 첫 번째 항목은 기본 열림 상태`,

            cta: `🚀 CTA 배너:
  [구조]
  - 전체 너비, padding: 5rem 2rem, text-align: center
  - background: linear-gradient(135deg, 메인컬러 from, 액센트 to)
  - 위에 subtle dot/grid 패턴 오버레이 (opacity 0.05)
  [콘텐츠]
  - 제목: text-3xl font-bold, 흰색
  - 서브텍스트: text-lg, white/80
  - CTA 버튼: 흰색 배경, 어두운 텍스트, padding 16px 40px, hover: scale(1.05) shadow`,

            contact: `📧 문의 폼:
  [구조]
  - 2단 그리드 (1fr 1fr, gap 4rem), 모바일 grid-cols-1
  [좌측 - 정보]
  - 회사/서비스명, 주소, 전화번호, 이메일, 운영시간
  - 각 항목에 아이콘 (📍📞✉️🕐) + 텍스트
  - 하단에 소셜 미디어 아이콘 row
  [우측 - 폼]
  - 입력 필드: 이름, 이메일 (2열), 주제(선택), 메시지(textarea 4줄)
  - 필드 스타일: bg-white/5, border: 1px solid white/10, 
    focus: border-color 메인컬러, outline: none, ring: 2px 메인컬러/30
  - 전송 버튼: width 100%, gradient 배경, font-weight: 700
  - 하단 disclaimer: text-xs, "제출 시 개인정보처리방침에 동의합니다"`,

            "blog-list": `📰 블로그 / 뉴스 목록:
  [구조]
  - 3열 카드 그리드 (모바일 1열)
  [카드 상세]
  - 이미지 영역: aspect-ratio 16/9, gradient 플레이스홀더
  - 이미지 위 카테고리 뱃지: position absolute, top 12px left 12px, pill shape
  - 제목: text-lg font-semibold, mt-4, line-clamp-2
  - 요약: text-sm color 반투명, mt-2, line-clamp-3
  - 메타: 날짜 + 읽기시간 (예: "2025.03.10 · 5분 읽기"), mt-3, text-xs
  - hover: 이미지 scale(1.05), card shadow 증가
  [콘텐츠]
  - "${templateName}" 관련 실제적인 글 제목과 요약 3~6개`,

            footer: `🔻 푸터:
  [구조]
  - background: gray-950 또는 가장 어두운 톤
  - padding: 4rem 2rem
  - 상단: 4열 그리드 (모바일 2x2)
  [열 구성]
  1. 회사/로고 + 한 줄 소개 + 소셜 아이콘 (인스타, 트위터, GitHub...)
  2. 빠른 링크 (4~5개 메뉴 링크)
  3. 서비스/제품 (4~5개 링크)
  4. 연락처 (주소, 전화, 이메일)
  [하단]
  - border-top: 1px solid white/8
  - flex justify-between: 저작권 "© 2025 ${templateName}. All rights reserved." + 약관/개인정보
  - padding-top: 2rem, mt-3rem`,
        };

        // ──────────────────────────────────────
        // 🎨 색상별 정밀 CSS 변수 가이드
        // ──────────────────────────────────────
        const colorPalettes: Record<string, string> = {
            Blue: `메인: #3b82f6(blue-500), 서브: #06b6d4(cyan-500)
  배경: #030712(gray-950), 서피스: rgba(255,255,255,0.03)
  텍스트: #ffffff / #9ca3af(gray-400), 액센트: #22d3ee(cyan-400)
  그라데이션: linear-gradient(135deg, #3b82f6, #06b6d4)
  글로우: box-shadow: 0 0 60px rgba(59,130,246,0.15)`,
            Dark: `메인: #6366f1(indigo-500), 서브: #8b5cf6(violet-500)
  배경: #030712(gray-950) / #111827(gray-900), 서피스: rgba(255,255,255,0.04)
  텍스트: #ffffff / #9ca3af(gray-400), 액센트: #a78bfa(purple-400)
  그라데이션: linear-gradient(135deg, #6366f1, #8b5cf6)
  글로우: box-shadow: 0 0 60px rgba(99,102,241,0.12)`,
            Neon: `메인: #22d3ee(cyan-400), 서브: #34d399(emerald-400)
  배경: #030712(gray-950), 서피스: rgba(34,211,238,0.03)
  텍스트: #ffffff / #d1d5db(gray-300), 액센트: #ec4899(pink-500)
  그라데이션: linear-gradient(135deg, #22d3ee, #34d399)
  특수: 네온 글로우 — text-shadow: 0 0 20px rgba(34,211,238,0.5); box-shadow: 0 0 30px rgba(34,211,238,0.2)
  카드 보더: border-color rgba(34,211,238,0.2) → hover시 rgba(34,211,238,0.5)`,
            Sunset: `메인: #f97316(orange-500), 서브: #f43f5e(rose-500)
  배경: #030712(gray-950), 서피스: rgba(249,115,22,0.03)
  텍스트: #ffffff / #d1d5db, 액센트: #fbbf24(amber-400)
  그라데이션: linear-gradient(135deg, #f97316, #f43f5e)`,
            Forest: `메인: #22c55e(emerald-500), 서브: #14b8a6(teal-500)
  배경: #030712, 서피스: rgba(34,197,94,0.03)
  텍스트: #ffffff / #d1d5db, 액센트: #a3e635(lime-400)
  그라데이션: linear-gradient(135deg, #22c55e, #14b8a6)`,
            "Minimal White": `메인: #111827(gray-900), 서브: #1f2937(gray-800)
  배경: #ffffff / #f9fafb(gray-50), 서피스: #f3f4f6(gray-100)
  텍스트: #111827(gray-900) / #4b5563(gray-600), 액센트: #3b82f6(blue-500)
  그라데이션: linear-gradient(135deg, #3b82f6, #6366f1)
  보더: #e5e7eb(gray-200), 그림자: rgba(0,0,0,0.05)
  ★ 이 테마는 라이트 모드! bg-white 기반, 텍스트는 어두운색`,
            Ocean: `메인: #0ea5e9(sky-500), 서브: #6366f1(indigo-500)
  배경: #020617(slate-950), 서피스: rgba(14,165,233,0.03)
  텍스트: #ffffff / #94a3b8(slate-400), 액센트: #60a5fa(blue-400)
  그라데이션: linear-gradient(135deg, #0ea5e9, #6366f1)`,
            Cherry: `메인: #e11d48(rose-600), 서브: #dc2626(red-600)
  배경: #030712, 서피스: rgba(225,29,72,0.03)
  텍스트: #ffffff / #d1d5db, 액센트: #f472b6(pink-400)
  그라데이션: linear-gradient(135deg, #e11d48, #dc2626)`,
            Lavender: `메인: #a78bfa(violet-400), 서브: #c084fc(purple-400)
  배경: #030712, 서피스: rgba(167,139,250,0.04)
  텍스트: #ffffff / #d1d5db, 액센트: #e879f9(fuchsia-300)
  그라데이션: linear-gradient(135deg, #a78bfa, #c084fc)`,
            Cyber: `메인: #facc15(yellow-400), 서브: #84cc16(lime-400)
  배경: #030712, 서피스: rgba(250,204,21,0.03)
  텍스트: #ffffff / #d1d5db, 액센트: #4ade80(green-400)
  그라데이션: linear-gradient(135deg, #facc15, #84cc16)
  특수: 사이버펑크 — 글리치/스캔라인 효과 고려`,
        };

        // ──────────────────────────────────────
        // 🎬 애니메이션 레벨별 구현 가이드
        // ──────────────────────────────────────
        const animationGuides: Record<string, string> = {
            none: `애니메이션 없음. hover 효과만 적용.
  - transition: all 0.3s ease on interactive elements
  - hover: translateY(-2px), shadow 증가, color 전환
  - 그 외 등장/스크롤 애니메이션 일절 없음`,
            subtle: `은은한 등장 애니메이션:
  - 각 섹션 진입 시 fade-in (opacity 0→1, translateY(20px→0))
  - transition duration: 0.6s, ease-out
  - CSS 구현: @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  - 각 섹션에 animation: fadeInUp 0.6s ease-out forwards; (IntersectionObserver로 트리거)
  - 카드는 stagger 효과: nth-child로 animation-delay 0.1s씩 증가
  - 부드러운 hover transition (0.3s ease)`,
            dynamic: `다이나믹 스크롤 애니메이션:
  - IntersectionObserver API로 뷰포트 진입 시 애니메이션 트리거
  - 좌측 요소: translateX(-40px→0) + opacity 0→1 (slide-in-left)
  - 우측 요소: translateX(40px→0) + opacity 0→1 (slide-in-right)
  - 카드 그리드: scale(0.9→1) + opacity, stagger delay 0.1s
  - 숫자 통계: 카운트업 애니메이션 (0에서 목표치까지)
  - 히어로 텍스트: 단어별 순차 등장 (delay 0.05s씩)
  - 배경에 미묘한 패럴랙스 (스크롤 속도 0.3x)
  - duration: 0.8s, easing: cubic-bezier(0.16, 1, 0.3, 1)`,
            playful: `플레이풀 & 인터랙티브:
  - spring 물리 기반 애니메이션 느낌:
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1)
  - 카드 hover: scale(1.05) + rotate(1deg) + shadow pop
  - 버튼 click: scale(0.95) → scale(1) 바운스
  - 스크롤 진입: bounce 효과 (translateY 오버슈팅)
  - 숫자: 카운트업 + 도착 시 살짝 scale(1.1→1) 바운스
  - 헤더 요소: typewriter 효과 (글자 하나씩 등장)
  - 배경: floating shapes (CSS animation, position absolute, 느린 움직임)
  - 마우스 따라 미묘한 패럴랙스 (mouse parallax)
  - 이미지 hover: 3D tilt 효과 (perspective + rotateX/Y)`,
        };

        // ──────────────────────────────────────
        // 📝 디자인 토큰 정밀 설명
        // ──────────────────────────────────────
        const fontName = FONT_OPTIONS.find((f) => f.id === designTokens.font)?.name ?? designTokens.font;
        const fontPreview = FONT_OPTIONS.find((f) => f.id === designTokens.font)?.preview ?? "";
        const radiusName = RADIUS_OPTIONS.find((r) => r.id === designTokens.borderRadius)?.name ?? designTokens.borderRadius;
        const radiusValue = RADIUS_OPTIONS.find((r) => r.id === designTokens.borderRadius)?.value ?? "8px";
        const spacingName = SPACING_OPTIONS.find((s) => s.id === designTokens.spacing)?.name ?? designTokens.spacing;
        const layoutName = LAYOUT_OPTIONS.find((l) => l.id === designTokens.layout)?.name ?? designTokens.layout;
        const animName = ANIMATION_OPTIONS.find((a) => a.id === designTokens.animation)?.name ?? designTokens.animation;

        const spacingGuide: Record<string, string> = {
            compact: "섹션 padding: 3rem 1rem, 요소 간 gap: 1rem, 카드 padding: 1.25rem",
            normal: "섹션 padding: 5rem 2rem, 요소 간 gap: 1.5rem, 카드 padding: 1.5rem~2rem",
            spacious: "섹션 padding: 7rem 2rem, 요소 간 gap: 2rem, 카드 padding: 2rem~2.5rem",
        };
        const layoutGuide: Record<string, string> = {
            centered: "max-width: 1200px, margin: 0 auto, 양쪽 padding 포함",
            "full-width": "max-width: 100%, 섹션 배경은 전체 너비, 내부 콘텐츠만 max-width",
            sidebar: "좌측 사이드바(width 260px, fixed) + 우측 메인 콘텐츠 (margin-left: 260px)",
        };

        // 섹션 스펙 조합
        const sectionDetails = selectedSections
            .map((id) => sectionSpecs[id] || `- ${id}`)
            .join("\n\n");

        // 기능 상세
        const featureDetails = enabledFeatures.map((f) => {
            const specs: Record<string, string> = {
                "로그인": `로그인/회원가입:
    - 네비게이션 바 우측에 "로그인" 텍스트 링크 + "시작하기" CTA 버튼
    - 클릭 시 모달 오버레이 (backdrop-blur, 중앙 폼)
    - 폼: 이메일 + 비밀번호 + 로그인 버튼 + "회원가입" 링크
    - 소셜 로그인 버튼 (Google, GitHub 아이콘)`,
                "결제": `결제 시스템:
    - 가격표 카드의 CTA 버튼 → 결제 모달 또는 체크아웃 페이지 UI
    - 카드 정보 입력 폼 (카드번호/만료일/CVC)
    - 결제 수단 아이콘 (Visa, Mastercard 등)`,
                "검색": `검색 기능:
    - 네비게이션 바 우측에 🔍 아이콘 버튼
    - 클릭 시 풀스크린 오버레이 (backdrop-blur, 중앙에 큰 input)
    - input에 "무엇을 찾고 계신가요?" placeholder
    - 최근 검색어 / 인기 키워드 태그
    - ESC 또는 바깥 클릭으로 닫기`,
                "다크모드": `다크모드 토글:
    - 네비게이션 바에 🌙/☀️ 토글 스위치
    - CSS 변수 기반 테마 전환 (--bg, --text, --surface, --border)
    - transition: background 0.3s, color 0.3s
    - 기본값: 다크모드 (현재 테마가 Minimal White가 아닌 경우)`,
                "반응형": `반응형 디자인 (필수):
    - 모바일(~640px): 1열 레이아웃, 네비 → 햄버거
    - 태블릿(641~1024px): 2열 그리드
    - 데스크톱(1025px+): 3~4열 그리드
    - 이미지/비디오: max-width: 100%, height: auto
    - 폰트: clamp()로 반응형 크기 (예: font-size: clamp(1.5rem, 4vw, 3.5rem))`,
                "다국어": `다국어 지원:
    - 네비게이션 바 우측에 🌐 + "KO" 드롭다운
    - 옵션: 한국어(KO), English(EN)
    - 선택 시 페이지 텍스트 전환 (실제 번역 구현 불필요, UI만)`,
            };
            return `${specs[f] || `- ${f}`}`;
        }).join("\n\n");

        // 톤 가이드
        const toneGuide = templateToneGuides[selectedTemplateId] || `${templateName} 컨셉에 맞는 전문적이고 현대적인 분위기.`;

        // ──────────────────────────────────────
        // 📋 최종 프롬프트 조합
        // ──────────────────────────────────────
        return `너는 세계적 수준의 프론트엔드 개발자 겸 UI/UX 디자이너야.
"${templateName}" 컨셉의 프리미엄 웹사이트를 만들어줘.
스타일: "${styleName}" 레이아웃.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 컨셉 & 톤 가이드
${toneGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎨 디자인 시스템 (반드시 준수)

### 컬러 팔레트
${colorPalettes[selectedColor] || selectedColor}

### 타이포그래피
- 폰트: ${fontName} (${fontPreview})
- <head>에 Google Fonts CDN 링크 포함
- 제목: clamp(2rem, 5vw, 4rem), font-weight: 800, line-height: 1.1
- 본문: 1rem, line-height: 1.7, 반투명 색상
- 소제목: 1.25rem, font-weight: 600

### 모서리 & 여백
- border-radius: ${radiusValue} (${radiusName})
- ${spacingGuide[designTokens.spacing] || spacingGuide.normal}

### 레이아웃
- ${layoutGuide[designTokens.layout] || layoutGuide.centered}

### 애니메이션 (${animName})
${animationGuides[designTokens.animation] || animationGuides.subtle}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🏗️ 페이지 섹션 (위→아래 순서, 모두 필수)

${sectionDetails}

${enabledFeatures.length > 0 ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n## ⚙️ 추가 기능\n\n${featureDetails}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🛡️ 품질 기준 (반드시 지켜)

### 필수 준수 사항
1. **실제 콘텐츠**: 모든 텍스트는 "${templateName}" 비즈니스에 맞는 구체적이고 의미 있는 내용. Lorem ipsum, "여기에 내용", 빈 텍스트 절대 금지
2. **완성된 디자인**: 모든 섹션이 실제 서비스처럼 완성된 느낌. 미완성/임시 영역 없음
3. **시각적 깊이**: 그라데이션, 글래스모피즘(backdrop-blur), layered shadows, 반투명 보더를 적극 활용
4. **호버 상태 필수**: 모든 클릭 가능한 요소에 hover 효과 (transform, shadow, color 전환). transition: all 0.3s ease
5. **반응형**: 모바일(640px↓) → 태블릿(641~1024px) → 데스크톱(1025px+) 3단계 반응형
6. **접근성**: 충분한 색상 대비(WCAG AA), alt 텍스트, semantic HTML (nav, main, section, footer)
7. **이미지 없이도 예쁘게**: img 태그 대신 CSS gradient 배경 + 아이콘으로 이미지 플레이스홀더 표현. 절대 깨진 이미지 없게
8. **가격/숫자**: 한국 원화(₩) 또는 달러($) 포맷으로, 천 단위 콤마 포함

### ❌ 하지 말 것 (안티 패턴)
- 외부 이미지 URL 사용 금지 (깨질 수 있음) → CSS gradient/SVG/이모지로 대체
- 빈 href="#" 링크만 나열하지 말 것 → 실제 메뉴명/텍스트 포함
- 카드 내용이 전부 동일하면 안 됨 → 각 카드마다 다른 구체적 내용
- 너무 작은 텍스트(12px↓) 또는 너무 낮은 대비 금지
- JavaScript 프레임워크 의존 금지 → 순수 HTML + CSS + 최소 vanilla JS만`;
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

/**
 * 플랜별 기능 게이팅
 * Free / Pro / Team 플랜에서 사용 가능한 기능을 제어합니다.
 */

export type Plan = "free" | "pro" | "team";
export type Feature =
    | "basic_templates"
    | "all_templates"
    | "ir_edit"
    | "preview"
    | "deploy"
    | "custom_domain"
    | "ai_customize"
    | "no_watermark"
    | "unlimited_projects"
    | "collaboration"
    | "priority_support";

const PLAN_FEATURES: Record<Plan, Feature[]> = {
    free: ["basic_templates", "ir_edit", "preview"],
    pro: [
        "basic_templates", "all_templates",
        "ir_edit", "preview",
        "deploy", "custom_domain",
        "ai_customize", "no_watermark",
        "unlimited_projects",
    ],
    team: [
        "basic_templates", "all_templates",
        "ir_edit", "preview",
        "deploy", "custom_domain",
        "ai_customize", "no_watermark",
        "unlimited_projects",
        "collaboration", "priority_support",
    ],
};

export function canUseFeature(plan: Plan | null | undefined, feature: Feature): boolean {
    const safePlan = plan ?? "free";
    return PLAN_FEATURES[safePlan]?.includes(feature) ?? false;
}

export function requiresPro(feature: Feature): boolean {
    return !PLAN_FEATURES.free.includes(feature);
}

export const FREE_PROJECT_LIMIT = 1;
export const FREE_AI_CUSTOMIZE_LIMIT = 3;

export const PLANS = [
    {
        id: "free" as Plan,
        name: "Free",
        price: 0,
        period: "month",
        description: "AI 웹빌더 시작하기",
        features: [
            "월 1개 프로젝트",
            "기본 템플릿 3종",
            "IR 비주얼 편집",
            "라이브 프리뷰",
            "워터마크 포함",
        ],
        cta: "무료 시작",
        highlighted: false,
    },
    {
        id: "pro" as Plan,
        name: "Pro",
        price: 20,
        period: "month",
        description: "제한 없이 제작하기",
        features: [
            "무제한 프로젝트",
            "모든 템플릿",
            "AI 구조 커스터마이징",
            "원클릭 배포",
            "커스텀 도메인",
            "워터마크 제거",
        ],
        cta: "Pro 시작하기",
        highlighted: true,
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
    },
    {
        id: "team" as Plan,
        name: "Team",
        price: 50,
        period: "month",
        description: "팀과 함께 제작하기",
        features: [
            "Pro 모든 기능",
            "팀 협업",
            "우선 서포트",
            "팀 대시보드",
        ],
        cta: "Team 시작하기",
        highlighted: false,
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID || "",
    },
] as const;

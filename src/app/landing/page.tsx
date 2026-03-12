import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Website Builder — Watch AI Agents Build Your Site | Agentic Builder",
    description: "Template-based AI web builder where multiple agents collaborate in real-time. Pick a template, customize with AI, deploy in one click.",
    keywords: "ai website builder, no code ai, ai web development, multi agent, agentic ai",
    openGraph: {
        title: "AI Website Builder — Watch AI Agents Build Your Site",
        description: "Multi-agent AI collaboration for web development. Free to start.",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "AI Website Builder — Watch AI Agents Build Your Site",
        description: "Multi-agent AI collaboration for web development.",
    },
};

const FEATURES = [
    {
        icon: "🧑‍💼",
        title: "멀티 에이전트 협업",
        desc: "CTO, FE Lead, FE Dev, BE Lead, BE Dev, QA — 6명의 전문 에이전트가 실제 회사처럼 토론하며 코드를 생성합니다.",
    },
    {
        icon: "🎨",
        title: "비주얼 IR 편집",
        desc: "슬롯 드래그·텍스트 편집으로 즉시 반영. LLM 호출 없이 실시간 미리보기.",
    },
    {
        icon: "⚡",
        title: "Lite Mode — 30초",
        desc: "간단한 요청은 3번의 LLM 호출로 완성. CTO 기획 → FE 생성 → QA 검수.",
    },
    {
        icon: "🚀",
        title: "원클릭 배포",
        desc: "Vercel 연동으로 생성 즉시 라이브 URL. 커스텀 도메인 설정까지.",
    },
    {
        icon: "🔒",
        title: "보안 내장",
        desc: "프롬프트 인젝션 탐지, 코드 정적 검증, XSS 방어가 파이프라인에 내장.",
    },
    {
        icon: "📊",
        title: "스마트 컨텍스트",
        desc: "토큰 예산 기반 컨텍스트 최적화로 Lost-in-the-middle 없이 고품질 코드 생성.",
    },
];

const STEPS = [
    { step: "01", title: "템플릿 선택", desc: "랜딩 / 비즈니스 / 포트폴리오 중 선택하고 컬러·폰트·애니메이션을 설정합니다." },
    { step: "02", title: "AI 에이전트 실행", desc: "6명의 AI 에이전트가 실시간으로 협업하며 코드를 생성합니다. 노드 그래프로 진행 상황을 확인하세요." },
    { step: "03", title: "편집 후 배포", desc: "IR 에디터로 즉시 수정하거나 AI에게 수정을 요청하세요. 완성되면 원클릭으로 배포합니다." },
];

export default function LandingPage() {
    return (
        <div className="bg-gray-950 text-white">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-lg border-b border-white/[0.06]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="font-bold text-white">⚡ Agentic Builder</span>
                    <div className="flex items-center gap-4">
                        <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">가격</Link>
                        <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">로그인</Link>
                        <Link
                            href="/auth/signup"
                            className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                        >
                            무료 시작
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/15 border border-indigo-500/30 rounded-full text-xs text-indigo-300 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        베타 런칭 중 — 무료로 시작하세요
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                        AI 에이전트가{" "}
                        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            협업하여
                        </span>
                        <br />
                        웹사이트를 만들어드립니다
                    </h1>

                    <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
                        템플릿 선택 → AI 에이전트 시각화 → 비주얼 편집 → 원클릭 배포.
                        전체 과정을 실시간으로 지켜보세요.
                    </p>

                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Link
                            href="/auth/signup"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition-colors"
                        >
                            무료로 시작하기 →
                        </Link>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] rounded-xl text-sm font-medium transition-colors"
                        >
                            데모 보기
                        </Link>
                    </div>
                </div>

                {/* Demo UI mockup */}
                <div className="max-w-5xl mx-auto mt-16 rounded-2xl overflow-hidden border border-white/[0.08] bg-gray-900/50 shadow-2xl shadow-indigo-500/10">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                        </div>
                        <span className="text-xs text-white/30 ml-2">Agentic Web Builder — AI Collaboration</span>
                    </div>
                    <div className="p-8 grid grid-cols-3 gap-4 min-h-[240px]">
                        {/* Agent nodes mockup */}
                        {["🧑‍💼 CTO", "👨‍💻 FE Lead", "🔧 BE Lead", "👩‍💻 FE Dev", "🔩 BE Dev", "🔍 QA"].map((agent, i) => (
                            <div
                                key={agent}
                                className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className={`w-2 h-2 rounded-full ${i < 3 ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                                <span className="text-xs text-white/60">{agent}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-6 border-t border-white/[0.05]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-14">이렇게 작동합니다</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {STEPS.map((s) => (
                            <div key={s.step} className="text-center">
                                <div className="text-5xl font-bold text-indigo-500/30 mb-4">{s.step}</div>
                                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 bg-white/[0.02] border-y border-white/[0.05]">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-14">주요 기능</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="bg-gray-900/50 border border-white/[0.07] rounded-xl p-5">
                                <div className="text-2xl mb-3">{f.icon}</div>
                                <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                                <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing preview */}
            <section className="py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">심플한 가격</h2>
                    <p className="text-white/50 mb-10">무료로 시작하고, 필요할 때 업그레이드하세요.</p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-left">
                            <p className="text-sm font-bold text-white mb-1">Free</p>
                            <p className="text-2xl font-bold text-white mb-3">$0</p>
                            <p className="text-xs text-white/40">월 1 프로젝트, 기본 템플릿</p>
                        </div>
                        <div className="bg-indigo-600 rounded-xl p-5 text-left">
                            <p className="text-sm font-bold text-white mb-1">Pro</p>
                            <p className="text-2xl font-bold text-white mb-3">$20<span className="text-sm font-normal text-indigo-200">/월</span></p>
                            <p className="text-xs text-indigo-200">무제한 + 배포 + 커스텀 도메인</p>
                        </div>
                    </div>
                    <Link href="/pricing" className="inline-block mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        전체 가격 비교 보기 →
                    </Link>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 bg-gradient-to-b from-indigo-950/30 to-transparent border-t border-white/[0.05]">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-4">지금 바로 시작하세요</h2>
                    <p className="text-white/50 mb-8">신용카드 없이 무료로 시작할 수 있습니다.</p>
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-base font-medium transition-colors"
                    >
                        무료로 시작하기 →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.06] px-6 py-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
                    <span>⚡ Agentic Web Builder — AI Website Builder</span>
                    <div className="flex items-center gap-4">
                        <Link href="/pricing" className="hover:text-white/60 transition-colors">가격</Link>
                        <Link href="/dashboard" className="hover:text-white/60 transition-colors">대시보드</Link>
                        <Link href="/auth/login" className="hover:text-white/60 transition-colors">로그인</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

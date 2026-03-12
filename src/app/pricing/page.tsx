"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plan-check";
import { useAuthStore } from "@/store";

export default function PricingPage() {
    const router = useRouter();
    const { user, plan: currentPlan } = useAuthStore();
    const [loading, setLoading] = useState<string | null>(null);

    async function handleSubscribe(planId: string, stripePriceId?: string) {
        if (planId === "free") {
            router.push("/auth/signup");
            return;
        }
        if (!user) {
            router.push(`/auth/login?next=/pricing`);
            return;
        }
        if (!stripePriceId) return;

        setLoading(planId);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId: stripePriceId }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 py-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl font-bold text-white mb-3">심플한 가격 정책</h1>
                    <p className="text-white/50 text-lg">무료로 시작, 필요할 때 업그레이드</p>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const isCurrent = currentPlan === plan.id;
                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-6 flex flex-col ${
                                    plan.highlighted
                                        ? "bg-indigo-600 border border-indigo-500"
                                        : "bg-white/[0.04] border border-white/[0.08]"
                                }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-amber-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                                            인기
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                    <p className={`text-sm mt-1 ${plan.highlighted ? "text-indigo-200" : "text-white/50"}`}>
                                        {plan.description}
                                    </p>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                                        {plan.price > 0 && (
                                            <span className={`text-sm ${plan.highlighted ? "text-indigo-200" : "text-white/40"}`}>
                                                /월
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-2.5 flex-1 mb-6">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm">
                                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-indigo-200" : "text-indigo-400"}`} />
                                            <span className={plan.highlighted ? "text-white" : "text-white/70"}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan.id, "stripePriceId" in plan ? plan.stripePriceId : undefined)}
                                    disabled={!!loading || isCurrent}
                                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isCurrent
                                            ? "bg-white/10 text-white/40 cursor-default"
                                            : plan.highlighted
                                            ? "bg-white text-indigo-700 hover:bg-indigo-50"
                                            : "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30"
                                    }`}
                                >
                                    {isCurrent ? "현재 플랜" : loading === plan.id ? "처리 중..." : plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">자주 묻는 질문</h2>
                    <div className="space-y-4 max-w-2xl mx-auto">
                        {[
                            { q: "무료 플랜에서 Pro로 언제든지 업그레이드할 수 있나요?", a: "네, 언제든지 업그레이드 가능하고 즉시 적용됩니다." },
                            { q: "구독을 취소하면 어떻게 되나요?", a: "현재 결제 기간이 끝날 때까지 Pro 기능을 유지하며, 이후 Free 플랜으로 전환됩니다." },
                            { q: "팀 플랜은 몇 명까지 사용할 수 있나요?", a: "현재 팀 플랜은 베타 준비 중입니다. 관심이 있으시면 디스코드에서 알려주세요." },
                            { q: "생성된 코드의 소유권은 누구에게 있나요?", a: "생성된 모든 코드의 소유권은 사용자에게 있습니다." },
                            { q: "환불 정책이 있나요?", a: "구독 후 7일 이내에 연락주시면 전액 환불해드립니다." },
                        ].map((faq) => (
                            <div key={faq.q} className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
                                <h4 className="text-sm font-medium text-white mb-2">{faq.q}</h4>
                                <p className="text-sm text-white/50">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

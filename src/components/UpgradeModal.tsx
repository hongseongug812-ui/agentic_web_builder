"use client";

import { useState } from "react";
import { X, Zap } from "lucide-react";
import { PLANS } from "@/lib/plan-check";

interface UpgradeModalProps {
    feature: string;
    onClose: () => void;
}

export default function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
    const [loading, setLoading] = useState(false);

    const proPlan = PLANS.find((p) => p.id === "pro") as typeof PLANS[1];

    async function handleUpgrade() {
        const priceId = (proPlan as { stripePriceId?: string }).stripePriceId;
        if (!priceId) {
            window.location.href = "/pricing";
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/[0.1] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-base font-bold text-white">Pro 기능</h2>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-sm text-white/60 mb-4">
                    <span className="text-white font-medium">{feature}</span>은 Pro 플랜에서 사용할 수 있습니다.
                </p>

                {/* Pro features highlight */}
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 mb-5">
                    <p className="text-xs text-indigo-300 font-medium mb-2">Pro 플랜 혜택</p>
                    <ul className="space-y-1.5">
                        {proPlan.features.map((f) => (
                            <li key={f} className="text-xs text-white/70 flex items-center gap-1.5">
                                <span className="text-indigo-400">✓</span> {f}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 hover:text-white/80 transition-colors"
                    >
                        나중에
                    </button>
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm text-white font-medium transition-colors"
                    >
                        {loading ? "처리 중..." : `$${(proPlan as { price: number }).price}/월 시작`}
                    </button>
                </div>
            </div>
        </div>
    );
}

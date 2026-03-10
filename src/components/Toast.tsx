"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, RotateCcw } from "lucide-react";
import { useFlowStore } from "@/store/store";

interface ToastItem {
    id: number;
    type: "success" | "error" | "info";
    message: string;
}

const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
};

const borders = {
    success: "border-emerald-500/30",
    error: "border-red-500/30",
    info: "border-blue-500/30",
};

let nextId = 0;

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const error = useFlowStore((s) => s.error);
    const setError = useFlowStore((s) => s.setError);
    const retryAvailable = useFlowStore((s) => s.retryAvailable);
    const retrySequence = useFlowStore((s) => s.retrySequence);

    // Show error toast when store error changes
    useEffect(() => {
        if (error) {
            const id = nextId++;
            setToasts((prev) => [...prev, { id, type: "error", message: error }]);
            setError(null);

            // Auto-dismiss after 8s (longer for error to give time for retry)
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 8000);
        }
    }, [error, setError]);

    const dismiss = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleRetry = (id: number) => {
        dismiss(id);
        retrySequence();
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    className={`
                        flex items-start gap-3 px-4 py-3 rounded-xl
                        bg-gray-900/95 backdrop-blur-md border ${borders[toast.type]}
                        shadow-2xl shadow-black/40
                        animate-[slideInRight_0.35s_ease-out]
                    `}
                    style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "both",
                    }}
                >
                    {icons[toast.type]}
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-white/80 leading-relaxed">{toast.message}</p>
                        {toast.type === "error" && retryAvailable && (
                            <button
                                onClick={() => handleRetry(toast.id)}
                                className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-[10px] text-indigo-300 font-medium hover:bg-indigo-500/25 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                재시도
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => dismiss(toast.id)}
                        className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
}


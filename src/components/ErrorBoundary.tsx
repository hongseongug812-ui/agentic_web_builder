"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary — 런타임 에러 시 크래시 방지
 * 에러 발생 시 우아한 폴백 UI 표시 + 재시도 버튼
 */
export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-screen w-screen bg-gray-950">
                    <div className="max-w-sm text-center p-8 rounded-2xl bg-white/[0.02] border border-red-500/20 animate-[scaleIn_0.3s_ease-out]">
                        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white/90 mb-2">
                            예기치 않은 오류
                        </h2>
                        <p className="text-xs text-white/40 leading-relaxed mb-1">
                            애플리케이션에서 오류가 발생했습니다.
                        </p>
                        <p className="text-[10px] text-red-400/60 font-mono mb-4 px-3 py-2 rounded-lg bg-red-500/[0.05] border border-red-500/10 break-all">
                            {this.state.error?.message || "Unknown error"}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            다시 시도
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

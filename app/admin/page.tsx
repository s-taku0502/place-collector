"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [isAdminSession, setIsAdminSession] = useState(false);
    const [loading, setLoading] = useState(true);
    const requests = useQuery(api.users.listPasswordResetRequests, {});
    const rows = useMemo(() => requests ?? [], [requests]);

    // 管理者セッションをチェック
    useEffect(() => {
        const adminToken = sessionStorage.getItem("adminSessionToken");
        if (!adminToken) {
            router.replace("/admin/login");
            return;
        }
        setIsAdminSession(true);
        setLoading(false);
    }, [router]);

    // ログアウト時のセッション削除
    useEffect(() => {
        const handleStorageChange = () => {
            const token = sessionStorage.getItem("adminSessionToken");
            if (!token && isAdminSession) {
                router.push("/admin/login");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [isAdminSession, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAdminSession) {
        return null;
    }

    const total = rows.length;
    const sent = rows.filter((row) => row.status === "sent").length;
    const pending = total - sent;
    const recent = rows.slice(0, 5);

    return (
        <main
            className="min-h-screen bg-slate-950 text-white px-6 py-10 relative overflow-hidden"
            style={{ fontFamily: '"Space Grotesk", "Noto Sans JP", sans-serif' }}
        >
            <div className="pointer-events-none absolute -top-24 -right-32 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />

            <div className="mx-auto max-w-6xl flex flex-col gap-10">
                <header className="flex flex-col gap-4 animate-fade">
                    <p className="text-xs tracking-[0.3em] text-cyan-300/80">ADMIN CONSOLE</p>
                    <h1 className="text-3xl md:text-4xl font-semibold">
                        管理者ダッシュボード
                    </h1>
                    <p className="text-slate-300 max-w-2xl">
                        パスワード再設定の申請状況と対応アクションをここで管理します。
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: "申請総数", value: total, accent: "from-cyan-500/40" },
                        { label: "未送信", value: pending, accent: "from-amber-500/40" },
                        { label: "送信済み", value: sent, accent: "from-emerald-500/40" },
                    ].map((card) => (
                        <div
                            key={card.label}
                            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm animate-rise"
                        >
                            <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${card.accent} to-transparent`} />
                            <p className="mt-4 text-sm text-slate-300">{card.label}</p>
                            <p className="text-3xl font-semibold mt-1">{card.value}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm animate-rise">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">最新の申請</h2>
                            <Link
                                href="/admin/reset"
                                className="text-xs font-semibold text-cyan-200 hover:text-cyan-100"
                            >
                                管理ページへ
                            </Link>
                        </div>
                        <div className="mt-4 divide-y divide-white/10">
                            {recent.length === 0 && (
                                <div className="py-6 text-sm text-slate-400">申請はまだありません。</div>
                            )}
                            {recent.map((row) => (
                                <div key={row._id} className="py-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-white">{row.email}</p>
                                        <p className="text-xs text-slate-400">{new Date(row.createdAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${row.status === "sent"
                                            ? "bg-emerald-500/20 text-emerald-100"
                                            : "bg-amber-500/20 text-amber-100"
                                            }`}
                                    >
                                        {row.status === "sent" ? "送信済み" : "未送信"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm animate-rise">
                        <h2 className="text-lg font-semibold">クイックアクション</h2>
                        <p className="text-sm text-slate-300 mt-2">
                            申請の処理や通知送信をここから実行します。
                        </p>
                        <div className="mt-6 flex flex-col gap-3">
                            <Link
                                href="/admin/reset"
                                className="rounded-xl bg-cyan-400/20 px-4 py-3 text-sm font-semibold text-cyan-50 hover:bg-cyan-400/30 transition-colors"
                            >
                                再設定申請を管理する
                            </Link>
                            <button
                                type="button"
                                className="rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition-colors"
                                onClick={() => {
                                    window.location.href = "/admin/reset?filter=sent";
                                }}
                            >
                                送信済み申請を確認する
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes riseIn {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade {
                    animation: fadeIn 600ms ease-out both;
                }
                .animate-rise {
                    animation: riseIn 600ms ease-out both;
                }
            `}</style>
        </main>
    );
}

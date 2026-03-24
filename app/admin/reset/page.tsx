"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};


export default function PasswordResetAdminPage() {
    const router = useRouter();
    const [isAdminSession, setIsAdminSession] = useState(false);
    const [loading, setLoading] = useState(true);
    const requests = useQuery(api.users.listPasswordResetRequests, {});
    const issueToken = useMutation(api.users.issuePasswordResetToken);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const searchParams = useSearchParams();

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAdminSession) {
        return null;
    }

    const rows = useMemo(() => requests ?? [], [requests]);
    const filter = searchParams?.get("filter") ?? "all";
    const filteredRows = rows.filter((row) => {
        if (filter === "sent") return row.status === "sent";
        if (filter === "pending") return row.status !== "sent";
        return true;
    });

    return (
        <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
            <div className="mx-auto max-w-6xl">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">パスワード再設定管理</h1>
                        <p className="text-slate-300">ユーザーからのパスワード再設定申請を処理します</p>
                    </div>
                    <Link
                        href="/admin"
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        戻る
                    </Link>
                </header>

                {notice && (
                    <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-lg">
                        <p className="text-emerald-300">{notice}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => window.location.href = "/admin/reset"}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filter === "all"
                                        ? "bg-cyan-600 text-white"
                                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                                }`}
                            >
                                すべて
                            </button>
                            <button
                                onClick={() => window.location.href = "/admin/reset?filter=pending"}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filter === "pending"
                                        ? "bg-amber-600 text-white"
                                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                                }`}
                            >
                                未送信
                            </button>
                            <button
                                onClick={() => window.location.href = "/admin/reset?filter=sent"}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filter === "sent"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                                }`}
                            >
                                送信済み
                            </button>
                        </div>

                        <div className="divide-y divide-white/10">
                            {filteredRows.length === 0 ? (
                                <div className="py-6 text-center text-slate-400">
                                    申請がありません
                                </div>
                            ) : (
                                filteredRows.map((row) => (
                                    <div key={row._id} className="py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">{row.email}</p>
                                            <p className="text-sm text-slate-400">{formatDateTime(row.createdAt)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    row.status === "sent"
                                                        ? "bg-emerald-500/20 text-emerald-100"
                                                        : "bg-amber-500/20 text-amber-100"
                                                }`}
                                            >
                                                {row.status === "sent" ? "送信済み" : "未送信"}
                                            </span>
                                            {row.status !== "sent" && (
                                                <button
                                                    onClick={async () => {
                                                        setBusyId(row._id);
                                                        try {
                                                            await issueToken({ resetId: row._id });
                                                            setNotice("トークンを送信しました");
                                                        } catch (err) {
                                                            console.error(err);
                                                        } finally {
                                                            setBusyId(null);
                                                        }
                                                    }}
                                                    disabled={busyId === row._id}
                                                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {busyId === row._id ? "送信中..." : "トークン送信"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

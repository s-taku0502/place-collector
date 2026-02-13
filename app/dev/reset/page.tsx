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

export default function PasswordResetDevPage() {
    const router = useRouter();
    const user = useQuery(api.users.getCurrentUser, {});
    const requests = useQuery(api.users.listPasswordResetRequests, {});
    const issueToken = useMutation(api.users.issuePasswordResetToken);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const searchParams = useSearchParams();

    // 先にuserのロード状態でreturnし、以降のHooksの順序を保証
    useEffect(() => {
        if (user && !user.isSuperAdmin) {
            router.replace("/dev/login");
        }
    }, [user, router]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    if (!user.isSuperAdmin) {
        return null;
    }

    const rows = useMemo(() => requests ?? [], [requests]);
    const filter = searchParams.get("filter") ?? "all";
    const filteredRows = rows.filter((row) => {
        if (filter === "sent") return row.status === "sent";
        if (filter === "pending") return row.status !== "sent";
        return true;
    });

    // ここから先は管理者画面と同じUIを流用可能
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">開発者用パスワードリセット管理</h1>
                    <div className="mb-4 flex gap-2">
                        <Link href="/dev" className="text-blue-600 hover:underline">開発者ダッシュボードへ</Link>
                        <Link href="/dev/login" className="text-blue-600 hover:underline">開発者ログイン</Link>
                    </div>
                    <div className="mb-4">
                        <button onClick={() => router.push("?filter=all")}>全て</button>
                        <button onClick={() => router.push("?filter=sent")}>送信済み</button>
                        <button onClick={() => router.push("?filter=pending")}>未送信</button>
                    </div>
                    <table className="w-full border mt-4">
                        <thead>
                            <tr>
                                <th className="border px-2 py-1">メール</th>
                                <th className="border px-2 py-1">申請日時</th>
                                <th className="border px-2 py-1">状態</th>
                                <th className="border px-2 py-1">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row) => (
                                <tr key={row.email + row.createdAt}>
                                    <td className="border px-2 py-1">{row.email}</td>
                                    <td className="border px-2 py-1">{formatDateTime(row.createdAt)}</td>
                                    <td className="border px-2 py-1">{row.status || "-"}</td>
                                    <td className="border px-2 py-1">
                                        <button
                                            disabled={busyId === row.email}
                                            onClick={async () => {
                                                setBusyId(row.email);
                                                setNotice(null);
                                                try {
                                                    await issueToken({ resetId: row._id });
                                                    setNotice("トークン発行済み");
                                                } catch (e) {
                                                    setNotice("エラー: " + (e instanceof Error ? e.message : ""));
                                                } finally {
                                                    setBusyId(null);
                                                }
                                            }}
                                            className="bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50"
                                        >
                                            トークン発行
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {notice && <div className="mt-4 text-green-600">{notice}</div>}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function DevLoginPage() {
    const router = useRouter();
    const user = useQuery(api.users.getCurrentUser, {});

    useEffect(() => {
        if (user && user.isSuperAdmin) {
            router.replace("/admin"); // 開発者用ダッシュボードがあればそちらに変更可
        }
    }, [user, router]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="bg-slate-800 rounded-xl p-8 shadow-lg flex flex-col gap-6 min-w-[320px]">
                <h1 className="text-2xl font-bold text-center">開発者ログイン</h1>
                <p className="text-sm text-slate-300 text-center">
                    開発者（super admin）権限が必要です。
                </p>
                {!user.isSuperAdmin && (
                    <p className="text-sm text-red-400 text-center">
                        あなたは開発者権限を持っていません。
                    </p>
                )}
                {user.isSuperAdmin && (
                    <p className="text-sm text-emerald-400 text-center">
                        開発者権限でログイン済みです。
                    </p>
                )}
            </div>
        </main>
    );
}

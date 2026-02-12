"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function AdminLoginPage() {
    const router = useRouter();
    const user = useQuery(api.users.getCurrentUser, {});
    // 管理者昇格APIは削除済み

    useEffect(() => {
        if (user && user.isAdmin) {
            router.replace("/admin");
        }
    }, [user, router]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="bg-slate-800 rounded-xl p-8 shadow-lg flex flex-col gap-6 min-w-[320px]">
                <h1 className="text-2xl font-bold text-center">管理者ログイン</h1>
                <p className="text-sm text-slate-300 text-center">
                    管理者権限が必要です。
                </p>
                {!user.isAdmin && (
                    <p className="text-sm text-red-400 text-center">
                        あなたは管理者権限を持っていません。
                    </p>
                )}
                {user.isAdmin && (
                    <p className="text-sm text-emerald-400 text-center">
                        管理者権限でログイン済みです。
                    </p>
                )}
            </div>
        </main>
    );
}
"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Header() {
    const { signOut } = useAuthActions();
    const router = useRouter();
    const currentUser = useQuery(api.users.getCurrentUser, {});

    // 未ログイン時はヘッダーを非表示
    if (!currentUser) {
        return null;
    }

    const handleSignOut = async () => {
        await signOut();
        router.push("/signin");
    };

    // ページに応じたタイトルを取得
    const getPageTitle = () => {
        // シンプル化：ページ共通タイトル
        return "行きたい場所リスト";
    };

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                </Link>
                <button onClick={handleSignOut}
                className="flex items-center gap-4 hover:opacity-80 transition-opacity text-sm text-gray-600">
                    ログアウト
                </button>
            </div>
        </header >
    );
}

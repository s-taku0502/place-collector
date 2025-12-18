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
                <div className="flex items-center gap-3">
                    <Link
                        href="/mypage"
                        aria-label="マイページ"
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-100"
                        title="マイページ"
                    >
                        {/* ユーザーアイコン（SVG） */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity text-sm text-gray-600"
                    >
                        ログアウト
                    </button>
                </div>
            </div>
        </header >
    );
}

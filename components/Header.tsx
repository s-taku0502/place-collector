"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
    const { signOut } = useAuthActions();
    const router = useRouter();
    const pathname = usePathname();

    // サインインページではヘッダーを表示しない
    if (pathname === "/signin") {
        return null;
    }

    const handleSignOut = async () => {
        await signOut();
        router.push("/signin");
    };

    // ページに応じたタイトルを取得
    const getPageTitle = () => {
        if (pathname === "/") return "行きたい場所リスト";
        if (pathname === "/place/new") return "新しい場所を追加";
        if (pathname === "/place/list") return "リスト";
        if (pathname?.includes("/edit")) return "場所を編集";
        if (pathname?.includes("/detail")) return "場所の詳細";
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

"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Header() {
    const { signOut } = useAuthActions();
    const router = useRouter();
    const pathname = usePathname();
    const currentUser = useQuery(api.users.getCurrentUser, {});

    // 未ログイン時はヘッダーを非表示
    if (!currentUser) {
        return null;
    }

    const handleSignOut = async () => {
        // 管理者セッションをクリア
        sessionStorage.removeItem("adminSessionToken");
        
        await signOut();
        // 管理者は /admin/login へ、それ以外は /signin へリダイレクト
        const redirectPath = currentUser.isAdmin ? "/admin/login" : "/signin";
        router.push(redirectPath);
    };

    // 管理者かどうかでタイトルとリンクを変更
    const isAdmin = currentUser.isAdmin;
    const pageTitle = isAdmin ? "管理者ダッシュボード" : "行きたい場所リスト";
    const homeLink = isAdmin ? "/admin" : "/";
    const myPageLink = isAdmin ? "/admin" : "/mypage";

    return (
        <header className={`border-b shadow-sm ${isAdmin ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"}`}>
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                <Link href={homeLink} className={`hover:opacity-80 transition-opacity ${isAdmin ? "text-white" : "text-gray-900"}`}>
                    <h1 className="text-2xl font-bold">{pageTitle}</h1>
                </Link>
                <div className="flex items-center gap-3">
                    <Link
                        href={myPageLink}
                        aria-label={isAdmin ? "ダッシュボード" : "マイページ"}
                        className={`inline-flex items-center justify-center rounded-full border bg-opacity-50 p-2 transition ${
                            isAdmin
                                ? "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        title={isAdmin ? "ダッシュボード" : "マイページ"}
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
                        className={`flex items-center gap-2 hover:opacity-80 transition-opacity text-sm ${isAdmin ? "text-slate-300" : "text-gray-600"}`}
                    >
                        ログアウト
                    </button>
                </div>
            </div>
        </header>
    );
}

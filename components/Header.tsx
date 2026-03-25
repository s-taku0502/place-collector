"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function Header() {
    const { signOut } = useAuthActions();
    const router = useRouter();
    const pathname = usePathname();
    const currentUser = useQuery(api.users.getCurrentUser, {});
    const [mobileOpen, setMobileOpen] = useState(false);

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

    const navLinkClass = (path: string) =>
        `px-3 py-2 rounded text-sm transition ${
            pathname === path
                ? isAdmin
                    ? "bg-slate-700 text-white"
                    : "bg-gray-100 text-gray-900"
                : isAdmin
                ? "text-slate-200 hover:bg-slate-700"
                : "text-gray-700 hover:bg-gray-100"
        }`;

    return (
        <header className={`border-b shadow-sm ${isAdmin ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"}`}>
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={homeLink} className={`hover:opacity-80 transition-opacity ${isAdmin ? "text-white" : "text-gray-900"}`}>
                        <h1 className="text-2xl font-bold">{pageTitle}</h1>
                    </Link>
                    {/* Desktop navigation */}
                    <nav className="hidden md:flex items-center gap-1 ml-4">
                        <Link href="/place" className={navLinkClass("/place")} aria-current={pathname === "/place" ? "page" : undefined}>
                            場所一覧
                        </Link>
                        <Link href="/map" className={navLinkClass("/map")} aria-current={pathname === "/map" ? "page" : undefined}>
                            マップ
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`md:hidden p-2 rounded ${isAdmin ? "text-slate-200 hover:bg-slate-700" : "text-gray-700 hover:bg-gray-100"}`}
                        aria-label="メニューを開く"
                        aria-expanded={mobileOpen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {mobileOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <>
                                    <path d="M3 12h18" />
                                    <path d="M3 6h18" />
                                    <path d="M3 18h18" />
                                </>
                            )}
                        </svg>
                    </button>

                    <div className="hidden md:flex items-center gap-3">
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            type="button"
                            className={`px-3 py-2 rounded text-sm transition ${
                                isAdmin
                                    ? "border border-slate-600 bg-slate-700 text-red-300 hover:bg-slate-600"
                                    : "border border-gray-200 bg-gray-100 text-red-600 hover:bg-gray-200"
                            }`}
                        >
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile navigation panel */}
            {mobileOpen && (
                <div className={`md:hidden px-4 pb-4 ${isAdmin ? "bg-slate-800 border-t border-slate-700 text-white" : "bg-white border-t border-gray-200 text-gray-900"}`}>
                    <nav className="flex flex-col gap-1">
                        <Link href="/place" className={navLinkClass("/place")} onClick={() => setMobileOpen(false)}>
                            場所一覧
                        </Link>
                        <Link href="/map" className={navLinkClass("/map")} onClick={() => setMobileOpen(false)}>
                            マップ
                        </Link>
                        <Link href={myPageLink} className={navLinkClass(myPageLink)} onClick={() => setMobileOpen(false)}>
                            {isAdmin ? "ダッシュボード" : "マイページ"}
                        </Link>
                        <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className={`px-3 py-2 rounded text-sm transition ${isAdmin ? "border border-slate-600 bg-slate-700 text-red-300 hover:bg-slate-600" : "border border-gray-200 bg-gray-100 text-red-600 hover:bg-gray-200"}`}>ログアウト</button>
                    </nav>
                </div>
            )}
        </header>
    );
}

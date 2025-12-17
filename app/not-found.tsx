"use client";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-8">
            <div className="mx-auto max-w-md px-4 text-center">
                <div className="mb-8">
                    <Image
                        src="/NotFound.png"
                        alt="404 - ページが見つかりません"
                        width={300}
                        height={300}
                        className="mx-auto mb-8"
                        priority
                    />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                        ページが見つかりません
                    </h2>
                    <p className="text-gray-600 mb-8">
                        申し訳ございません。アクセスしようとしたページは存在しません。
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/place/list"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                        ホームに戻る
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:scale-105 active:scale-95"
                    >
                        トップページ
                    </Link>
                </div>
            </div>
        </main>
    );
}

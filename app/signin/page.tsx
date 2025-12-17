"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
      <form
        className="w-full max-w-sm flex flex-col gap-6 bg-white/85 dark:bg-slate-800/80 backdrop-blur rounded-xl p-6 shadow-lg dark:shadow-slate-900/40 transition-colors"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          const formData = new FormData(e.currentTarget);
          formData.set("flow", flow);

          void signIn("password", formData)
            .then(() => router.push("/"))
            .catch((err) => {
              setError(err.message);
              setLoading(false);
            });
        }}
      >
        {/* アプリアイコン */}
        <div className="flex justify-center mb-2">
          <Image
            src="/convex.svg"
            alt="アプリアイコン"
            width={96}
            height={96}
            priority
          />
        </div>

        {/* タイトル（ログイン画面のみ） */}
        {flow === "signIn" && (
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">アプリ名</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              へようこそ！
              <br />
              さあ、楽しい時間を作りにいこう
            </p>
          </div>
        )}

        {/* ユーザーID（新規登録のみ） */}
        {flow === "signUp" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm">ユーザーID</label>
            <input
              name="username"
              placeholder="@"
              className="border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
        )}

        {/* メールアドレス */}
        <div className="flex flex-col gap-1">
          <label className="text-sm">メールアドレス</label>
          <input
            type="email"
            name="email"
            className="border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:border-slate-600"
            required
          />
        </div>

        {/* パスワード */}
        <div className="flex flex-col gap-1">
          <label className="text-sm">パスワード</label>
          <input
            type="password"
            name="password"
            minLength={8}
            className="border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:border-slate-600"
            required
          />
        </div>

        {/* パスワード確認（新規登録のみ） */}
        {flow === "signUp" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm">パスワード（確認用）</label>
            <input
              type="password"
              name="confirmPassword"
              minLength={8}
              className="border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
        )}

        {/* 利用規約（新規登録のみ） */}
        {flow === "signUp" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" required />
            利用規約に同意する
          </label>
        )}

        {/* エラー */}
        {error && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        {/* メインボタン */}
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-300 text-black py-2 rounded disabled:opacity-50 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500 transition-colors"
        >
          {flow === "signIn" ? "ログイン" : "登録"}
        </button>

        {/* サブボタン */}
        {flow === "signIn" ? (
          <>
            <button
              type="button"
              className="bg-slate-200 py-2 rounded dark:bg-slate-700 dark:text-white transition-colors"
            >
              パスワード再設定
            </button>
            <button
              type="button"
              className="bg-slate-200 py-2 rounded dark:bg-slate-700 dark:text-white transition-colors"
              onClick={() => setFlow("signUp")}
            >
              新規登録
            </button>
          </>
        ) : (
          <button
            type="button"
            className="bg-slate-200 py-2 rounded dark:bg-slate-700 dark:text-white transition-colors"
            onClick={() => setFlow("signIn")}
          >
            ログイン画面へ
          </button>
        )}
      </form>
    </div>
  );
}

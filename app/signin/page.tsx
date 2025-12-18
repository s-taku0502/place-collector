"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { validateUserIdentifier } from "@/lib/ng_list";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const updateUserProfile = useMutation(api.users.updateUserProfile);

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
          const desiredUserIdentifier = (formData.get("userIdentifier") || "") as string;

          void signIn("password", formData)
            .then(async () => {
              if (flow === "signUp" && desiredUserIdentifier) {
                try {
                  await updateUserProfile({ userIdentifier: desiredUserIdentifier });
                } catch (err: unknown) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "ユーザーIDの初期設定に失敗しました"
                  );
                  setLoading(false);
                  return;
                }
              }
              router.push("/");
            })
            .catch((err) => {
              setError(err.message);
              setLoading(false);
            });
        }}
      >
        {/* アプリアイコン */}
        <div className="flex justify-center mb-2">
          <Image
            src="/place-collector-icon.png"
            alt="アプリアイコン"
            width={96}
            height={96}
            priority
          />
        </div>

        {/* モード切替 */}
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setFlow("signIn")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${flow === "signIn"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
              : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setFlow("signUp")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${flow === "signUp"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
              : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            }`}
          >
            新規登録
          </button>
        </div>

        {/* タイトル */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {flow === "signIn" ? "ログイン" : "新規登録"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {flow === "signIn"
              ? "アカウントにサインインして続けましょう"
              : "必要事項を入力してアカウントを作成します"}
          </p>
        </div>

        {/* ユーザーID（新規登録のみ／一度のみ設定可能） */}
        {flow === "signUp" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm">ユーザーID</label>
            <input
              name="userIdentifier"
              placeholder="@"
              className="border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:border-slate-600"
              onChange={(e) => {
                const validation = validateUserIdentifier(e.target.value);
                if (!validation.valid) {
                  e.target.setCustomValidity(validation.reason || "");
                } else {
                  e.target.setCustomValidity("");
                }
              }}
              required
            />
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              一度設定すると変更できません。英数字とアンダースコアのみ。
            </p>
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
          {flow === "signIn" ? "ログインする" : "新規登録する"}
        </button>

        {/* サブアクション（タブと重複しない範囲で最小限に） */}
        {flow === "signIn" && (
          <button
            type="button"
            className="bg-slate-200 py-2 rounded dark:bg-slate-700 dark:text-white transition-colors"
          >
            パスワード再設定
          </button>
        )}
      </form>
    </div>
  );
}

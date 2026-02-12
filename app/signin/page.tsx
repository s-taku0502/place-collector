"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { validateUserIdentifier } from "@/lib/ng_list";

const toFriendlyError = (err: unknown): string => {
  const message = err instanceof Error ? err.message : "";

  if (message.includes("ユーザーIDは既に使用されています")) {
    return "このユーザーIDは既に使用されています。他のIDをお試しください。";
  }
  if (message.includes("ユーザーIDは空にできません")) {
    return "ユーザーIDを入力してください。";
  }
  if (message.toLowerCase().includes("password")) {
    // Convexのpasswordプロバイダは汎用的なメッセージを返すため、簡潔に案内する
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (message.includes("認証が必要です")) {
    return "処理に少し時間がかかっています。もう一度お試しください。";
  }

  return "エラーが発生しました。時間をおいて再度お試しください。";
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const assertUserIdentifierAvailable = useMutation(api.users.assertUserIdentifierAvailable);
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const currentUser = useQuery(api.users.getCurrentUser, {});

  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserIdentifier, setPendingUserIdentifier] = useState<string | null>(null);
  const [profileUpdateDone, setProfileUpdateDone] = useState(false);

  // 認証が有効になったら、サインアップ時はプロフィール更新、ログイン時は遷移
  useEffect(() => {
    const run = async () => {
      if (!currentUser) return;

      // サインアップ時は userIdentifier を設定してから遷移
      if (flow === "signUp" && pendingUserIdentifier && !profileUpdateDone) {
        const maxAttempts = 5;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            await updateUserProfile({ userIdentifier: pendingUserIdentifier });
            setProfileUpdateDone(true);
            break;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("認証が必要です") && attempt < maxAttempts - 1) {
              await sleep(250);
              continue;
            }
            setError(toFriendlyError(err));
            break;
          }
        }
      }

      // プロフィール更新が不要/完了したら遷移
      if (flow === "signUp") {
        if (profileUpdateDone) {
          router.push("/mypage");
        }
      } else if (flow === "signIn") {
        router.push("/place");
      }
    };

    void run();
  }, [currentUser, flow, pendingUserIdentifier, profileUpdateDone, updateUserProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
      <form
        className="w-full max-w-sm flex flex-col gap-6 bg-white/85 dark:bg-slate-800/80 backdrop-blur rounded-xl p-6 shadow-lg dark:shadow-slate-900/40 transition-colors"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          const formData = new FormData(e.currentTarget);
          formData.set("flow", flow);
          const desiredUserIdentifier = (formData.get("userIdentifier") || "") as string;
          const normalizedUserIdentifier = desiredUserIdentifier.trim();

          if (flow === "signUp") {
            const password = (formData.get("password") || "") as string;
            const confirmPassword = (formData.get("confirmPassword") || "") as string;
            if (password !== confirmPassword) {
              setError("パスワードが一致しません。もう一度確認してください。");
              setLoading(false);
              return;
            }
          }

          if (flow === "signUp") {
            try {
              await assertUserIdentifierAvailable({ userIdentifier: normalizedUserIdentifier });
            } catch (err: unknown) {
              setError(toFriendlyError(err));
              setLoading(false);
              return;
            }
          }

          try {
            await signIn("password", formData);
            if (flow === "signUp") {
              setPendingUserIdentifier(normalizedUserIdentifier || null);
            }
          } catch (err: unknown) {
            setError(toFriendlyError(err));
            setLoading(false);
            return;
          }

          setLoading(false);
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
            onClick={() => {
              setFlow("signIn");
              setError(null);
              setLoading(false);
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${flow === "signIn"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
              : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setFlow("signUp");
              setError(null);
              setLoading(false);
            }}
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
            onClick={() => router.push("/signin/reset")}
          >
            パスワード再設定
          </button>
        )}
      </form>
    </div>
  );

  //

}

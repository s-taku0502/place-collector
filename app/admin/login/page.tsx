"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const toFriendlyError = (err: unknown): string => {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("401")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (message.includes("500")) {
    return "サーバーエラーが発生しました。管理者に連絡してください。";
  }
  return "エラーが発生しました。時間をおいて再度お試しください。";
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maskEmail = (email: string) => {
    const [local = "", domain = ""] = email.split("@");
    if (!local || !domain) return "(invalid-email)";
    if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-4">
      <form
        className="w-full max-w-sm flex flex-col gap-6 bg-slate-800 rounded-xl p-8 shadow-lg"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          const formData = new FormData(e.currentTarget);
          const email = (formData.get("email") as string).trim();
          const password = (formData.get("password") as string).trim();

          console.log("[auth][admin-login] submit", {
            email: maskEmail(email),
            passwordLength: password.length,
          });

          try {
            const response = await fetch("/api/admin/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });

            console.log("[auth][admin-login] response received", {
              status: response.status,
              ok: response.ok,
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.log("[auth][admin-login] authentication failed", {
                status: response.status,
                message: errorData.error || "認証に失敗しました",
              });
              throw new Error(errorData.error || "認証に失敗しました");
            }

            const result = await response.json();

            if (result.authenticated) {
              console.log("[auth][admin-login] authentication succeeded", {
                email: maskEmail(email),
              });
              // 認証成功 → セッションを保存してダッシュボードへ遷移
              const sessionToken = btoa(JSON.stringify({ email, timestamp: Date.now() }));
              sessionStorage.setItem("adminSessionToken", sessionToken);
              console.log("[auth][admin-login] session token stored, redirecting to /admin");
              router.push("/admin");
            }
          } catch (err: unknown) {
            console.log("[auth][admin-login] submit error", {
              message: err instanceof Error ? err.message : "unknown-error",
            });
            setError(toFriendlyError(err));
            setLoading(false);
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">管理者ログイン</h1>
          <p className="text-sm text-slate-400">
            管理者認証情報でログインしてください
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="example@example.com"
              required
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        <div className="border-t border-slate-700 pt-4">
          <p className="text-xs text-slate-400 text-center">
            通常アカウントでログインしたい場合は{" "}
            <button
              type="button"
              onClick={() => router.push("/signin")}
              className="text-cyan-400 hover:underline"
            >
              こちら
            </button>
          </p>
        </div>
      </form>
    </main>
  );
}
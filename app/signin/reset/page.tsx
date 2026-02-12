"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PasswordResetPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const [emailInput, setEmailInput] = useState("");
	const [emailToCheck, setEmailToCheck] = useState<string | null>(null);
	const [emailCheckHint, setEmailCheckHint] = useState<string | null>(null);

	const requestPasswordReset = useMutation(api.users.requestPasswordReset);
	const emailCheck = useQuery(
		api.users.checkEmailExists,
		emailToCheck ? { email: emailToCheck } : "skip"
	);

	const isCheckingEmail = Boolean(emailToCheck && emailCheck === undefined);
	const emailCheckMessage = emailToCheck && emailCheck !== undefined
		? (emailCheck.exists
			? "このメールアドレスは登録されています。"
			: "このメールアドレスは登録されていません。")
		: null;

	return (
		<div className="min-h-screen flex items-center justify-center px-6 bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
			<form
				className="w-full max-w-sm flex flex-col gap-6 bg-white/85 dark:bg-slate-800/80 backdrop-blur rounded-xl p-6 shadow-lg dark:shadow-slate-900/40 transition-colors"
				onSubmit={async (e) => {
					e.preventDefault();
					setLoading(true);
					setError(null);
					setDone(false);

					const trimmed = emailInput.trim();
					if (!trimmed) {
						setError("メールアドレスを入力してください。");
						setLoading(false);
						return;
					}

					try {
						const result = await requestPasswordReset({ email: trimmed });
						if (!result.exists) {
							setError("このメールアドレスは登録されていません。");
							setLoading(false);
							return;
						}
						setDone(true);
					} catch (err: unknown) {
						const msg = err instanceof Error ? err.message : "";
						setError(msg || "エラーが発生しました。時間をおいて再度お試しください。");
					} finally {
						setLoading(false);
					}
				}}
			>
				<div className="flex justify-center mb-2">
					<Image
						src="/place-collector-icon.png"
						alt="アプリアイコン"
						width={96}
						height={96}
						priority
					/>
				</div>

				<div className="text-center space-y-2">
					<h1 className="text-2xl font-bold">パスワード再設定</h1>
					<p className="text-sm text-slate-600 dark:text-slate-300">
						メールアドレスを送信すると再設定の案内が届きます
					</p>
				</div>

				<div className="flex flex-col gap-1">
					<label className="text-sm">メールアドレス確認</label>
					<input
						type="email"
						name="email"
						value={emailInput}
						onChange={(e) => {
							setEmailInput(e.target.value);
							setEmailToCheck(null);
							setEmailCheckHint(null);
						}}
						className="border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:border-slate-600"
						required
					/>
				</div>

				<button
					type="button"
					disabled={loading || isCheckingEmail}
					onClick={() => {
						const trimmed = emailInput.trim();
						if (!trimmed) {
							setEmailCheckHint("メールアドレスを入力してください。");
							return;
						}
						setEmailCheckHint(null);
						setEmailToCheck(trimmed);
					}}
					className="bg-slate-200 py-2 rounded disabled:opacity-50 dark:bg-slate-700 dark:text-white transition-colors"
				>
					メールアドレスが存在するかを確認する
				</button>

				{emailCheckHint && (
					<p className="text-sm text-slate-700 dark:text-slate-300 text-center">
						{emailCheckHint}
					</p>
				)}

				{emailCheckMessage && (
					<p className="text-sm text-slate-700 dark:text-slate-300 text-center">
						{emailCheckMessage}
					</p>
				)}

				{error && <p className="text-sm text-red-600 text-center">{error}</p>}

				{done && (
					<p className="text-sm text-emerald-600 text-center">
						送信が完了しました。メールをご確認ください。
					</p>
				)}

				<button
					type="submit"
					disabled={loading}
					className="bg-slate-300 text-black py-2 rounded disabled:opacity-50 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500 transition-colors"
				>
					送信する
				</button>

				<button
					type="button"
					onClick={() => router.push("/signin")}
					className="bg-slate-200 py-2 rounded dark:bg-slate-700 dark:text-white transition-colors"
				>
					ログインに戻る
				</button>
			</form>
		</div>
	);
}

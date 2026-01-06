"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { PREFECTURES } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyPage() {
    const router = useRouter();
    const user = useQuery(api.users.getCurrentUser);
    const updateUserProfile = useMutation(api.users.updateUserProfile);
    const deleteAccount = useMutation(api.users.deleteAccount);

    const [isEditing, setIsEditing] = useState(false);
    const [userIdentifier, setUserIdentifier] = useState("");
    const [username, setUsername] = useState("");
    const [prefecture, setPrefecture] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    // ユーザー情報が読み込まれたらフォームに反映
    useEffect(() => {
        if (user) {
            setUserIdentifier(user.userIdentifier || "");
            setUsername(user.username || "");
            setPrefecture(user.prefecture || "");
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage("");
        setIsError(false);

        try {
            await updateUserProfile({
                userIdentifier: userIdentifier || undefined,
                username: username || undefined,
                prefecture: prefecture || undefined,
            });
            setMessage("プロフィールを更新しました");
            setIsError(false);
            setIsEditing(false);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "プロフィールの更新に失敗しました";
            setMessage(errorMessage);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // 元の値に戻す
        setUserIdentifier(user?.userIdentifier || "");
        setUsername(user?.username || "");
        setPrefecture(user?.prefecture || "");
        setIsEditing(false);
        setMessage("");
    };

    const handleDeleteAccount = async () => {
        if (
            !window.confirm(
                "本当にアカウントを削除しますか？\n登録した全ての場所のデータも削除されます。\nこの操作は取り消せません。"
            )
        ) {
            return;
        }

        setIsSaving(true);
        setMessage("");
        setIsError(false);

        try {
            await deleteAccount();
            setMessage("アカウントを削除しました");
            setIsError(false);
            // 2秒後にサインインページにリダイレクト
            setTimeout(() => {
                router.push("/signin");
            }, 2000);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "アカウント削除に失敗しました";
            setMessage(errorMessage);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (user === undefined) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">読み込み中...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <p className="text-gray-600 mb-4">
                        マイページを表示するにはログインが必要です
                    </p>
                    <Link
                        href="/signin"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        ログインページへ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">マイページ</h1>
                        <div className="flex gap-2">
                            <Link
                                href="/place"
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                            >
                                ホームに戻る
                            </Link>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                >
                                    編集
                                </button>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div
                            className={`mb-4 p-3 rounded ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                        >
                            {message}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* メールアドレス */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                メールアドレス
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-4 py-2 bg-gray-100 rounded">
                                    {user.email || "未設定"}
                                </div>
                                <button
                                    onClick={() =>
                                        alert(
                                            "メールアドレス変更機能は現在開発中です。しばらくお待ちください。"
                                        )
                                    }
                                    className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                                >
                                    変更
                                </button>
                            </div>
                        </div>

                        {/* パスワード */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                パスワード
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-4 py-2 bg-gray-100 rounded">
                                    ••••••••
                                </div>
                                <button
                                    onClick={() =>
                                        alert(
                                            "パスワード変更機能は現在開発中です。しばらくお待ちください。"
                                        )
                                    }
                                    className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                                >
                                    変更
                                </button>
                            </div>
                        </div>

                        {/* ユーザーID（重複不可／登録時のみ設定可能） */}
                        <div>
                            <label
                                htmlFor="userIdentifier"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                ユーザーID（重複不可）
                            </label>
                            <div className="px-4 py-2 bg-gray-100 rounded">
                                {userIdentifier || "未設定"}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                ユーザーIDは登録時のみ設定可能です。変更はできません。
                            </p>
                        </div>

                        {/* ユーザー名 */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                ユーザー名（重複可）
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="ユーザー名を入力"
                                />
                            ) : (
                                <div className="px-4 py-2 bg-gray-100 rounded">
                                    {username || "未設定"}
                                </div>
                            )}
                        </div>

                        {/* 居住地（都道府県） */}
                        <div>
                            <label
                                htmlFor="prefecture"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                居住地（都道府県）
                            </label>
                            {isEditing ? (
                                <select
                                    id="prefecture"
                                    value={prefecture}
                                    onChange={(e) => setPrefecture(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">選択してください</option>
                                    {PREFECTURES.map((pref) => (
                                        <option key={pref} value={pref}>
                                            {pref}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="px-4 py-2 bg-gray-100 rounded">
                                    {prefecture || "未設定"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 編集モードのボタン */}
                    {isEditing && (
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {isSaving ? "保存中..." : "保存"}
                            </button>
                        </div>
                    )}

                    {/* アカウント削除セクション */}
                    <div className="mt-8 border-t pt-6">
                        <h2 className="text-sm font-medium text-gray-800 mb-4">危険なアクション</h2>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={isSaving}
                            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                        >
                            {isSaving ? "削除中..." : "アカウント削除"}
                        </button>
                        <p className="mt-2 text-xs text-gray-600">
                            アカウントを削除すると、登録した全ての場所のデータも削除されます。この操作は取り消せません。
                        </p>
                    </div>
                </div>

                {/* 内部IDの表示は避ける（共有用はユーザーID= userIdentifier を使用予定） */}
            </div>
        </div>
    );
}

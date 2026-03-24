import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const adminEmail = process.env.ADMIN_MAIL;
    const adminPassword = process.env.ADMIN_PASS;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "管理者認証情報が設定されていません" },
        { status: 500 }
      );
    }

    const trimmedEmail = email?.trim() || "";
    const trimmedPassword = password?.trim() || "";

    // 環境変数と照合
    if (trimmedEmail === adminEmail && trimmedPassword === adminPassword) {
      return NextResponse.json({
        authenticated: true,
        message: "管理者認証成功",
      });
    }

    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません。" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "認証処理に失敗しました" },
      { status: 500 }
    );
  }
}

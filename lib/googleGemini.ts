// Google Gemini API呼び出しラッパー例
// GOOGLE_AI_AEY（APIキー）は環境変数などで安全に管理してください

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export async function fetchGeminiLocationResult(addressText: string, apiKey: string): Promise<{ internationalType: string, region: string }> {
    const { createLocationPrompt } = await import("./googleGeminiPrompt");
    const prompt = createLocationPrompt(addressText);

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0 }
        })
    });
    if (!res.ok) throw new Error("Gemini API error");
    const data = await res.json();
    // Geminiの返答例: "日本, 東京都" など
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "不明, 不明";
    const [internationalType, region] = text.split(/,\s*/);
    return {
        internationalType: internationalType || "不明",
        region: region || "不明"
    };
}

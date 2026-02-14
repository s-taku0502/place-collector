// Google Gemini API用プロンプト生成関数
// 住所や地名から「国際区分（日本/海外）」と「都道府県/国名」を判別するためのプロンプト例

/**
 * Gemini API用プロンプトを生成
 * @param addressText ユーザーが入力した住所や地名
 */
export function createLocationPrompt(addressText: string): string {
    return `
次のテキストが日本国内の住所なら「日本, 都道府県名」、海外なら「海外, 国名」を返してください。
都道府県や国名が特定できない場合は「不明, 不明」と返してください。

例:
- "東京都渋谷区道玄坂2-24-1" → 日本, 東京都
- "大阪府大阪市北区梅田3-1-1" → 日本, 大阪府
- "New York, USA" → 海外, アメリカ合衆国
- "Paris, France" → 海外, フランス
- "" → 不明, 不明

入力: ${addressText}
出力:`;
}

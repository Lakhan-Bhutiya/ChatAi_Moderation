import { callGroq } from './groq.client';

export type ModerationSeverity = 'none' | 'minor' | 'major';

/**
 * Batch moderation prompt for processing multiple messages at once
 */
const MODERATION_BATCH_SYSTEM_PROMPT = `
You are an expert AI content moderator with a deep understanding of human nuance, internet culture, and casual chat dynamics.
Your goal is to classify a list of chat messages based on safety while allowing for a vibrant, funny, and safe community.

CLASSIFICATION CATEGORIES:
1. SAFE: Casual conversation, greetings, humor, friendly banter, gaming slang (e.g., "noob", "rekt"), expressions of laughter (e.g., "I'm dead", "stopppp"), and constructive debate.
2. MINOR: Mild profanity, playful insults among friends that aren't malicious, annoyance, or excessive repetitive spam.
3. MAJOR: Hate speech, real threats of violence, self-harm encouragement, sexual harassment, doxxing, or illegal content.

CRITICAL HUMAN-LIKE LOGIC:
- Context is Everything: Distinguish between "I'm dead" (laughing -> SAFE) and "You are dead" (threat -> MAJOR).
- Understand Humor/Sarcasm: Allow for jokes and sarcasm unless they are used to attack or belittle protected groups.
- Gaming/Internet Slang: Terms like "kill it", "shoot them", "get rekt" in a casual context are generally SAFE.
- Don't be a Robot: Do not flag everything that looks like a "bad word" if it's being used in a friendly or harmless way.
- Default to SAFE: If you are genuinely unsure if a message is a joke or a threat, err on the side of SAFE.

INPUT FORMAT: A JSON array of strings.
OUTPUT FORMAT: A raw JSON array of objects with "index" and "verdict" keys. 
Example Output: [{"index": 0, "verdict": "SAFE"}, {"index": 1, "verdict": "MAJOR"}]

CRITICAL: Return ONLY the JSON array. No markdown, no explanations.
`.trim();

/**
 * Fallback keyword-based moderation when Groq/AI is unavailable
 */
function fallbackModeration(content: string): { flagged: boolean; severity: ModerationSeverity } {
  const lowerContent = content.toLowerCase();

  const majorPatterns = [
    /\bkill\s+(yourself|you|them|him|her)\b/i,
    /\bdie\s+(you|they|he|she)\b/i,
    /\b(rape|sexual\s+assault|molest)/i,
    /\b(bomb|terrorist|terrorism|explosive)/i,
    /\b(suicide|self\s*harm|cut\s+yourself)/i,
  ];

  const minorPatterns = [
    /\b(fuck|shit|damn|bitch|asshole)\s+(you|your|u)\b/i,
    /\b(you're|you\s+are)\s+(stupid|idiot|dumb|retarded)/i,
    /\b(shut\s+up|fuck\s+off|piss\s+off)/i,
  ];

  for (const pattern of majorPatterns) {
    if (pattern.test(lowerContent)) return { flagged: true, severity: 'major' };
  }

  for (const pattern of minorPatterns) {
    if (pattern.test(lowerContent)) return { flagged: true, severity: 'minor' };
  }

  return { flagged: false, severity: 'none' };
}

/**
 * Main function to moderate a batch of messages using Groq AI
 */
export async function moderateContentBatch(
  contents: string[],
): Promise<Array<{ flagged: boolean; severity: ModerationSeverity }>> {
  if (contents.length === 0) return [];

  try {
    const prompt = JSON.stringify(contents);
    const response = await callGroq(prompt, MODERATION_BATCH_SYSTEM_PROMPT);

    // Clean response to ensure it's valid JSON (strip markdown)
    const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResults = JSON.parse(cleanResponse);

    if (!Array.isArray(aiResults)) throw new Error('AI Response is not an array');

    // Create a result array filled with fallback by default
    const finalResults = contents.map(c => fallbackModeration(c));
    const aiIndices = new Set<number>();

    // Overlay AI verdicts on top of fallback
    aiResults.forEach((item: any) => {
      const idx = item.index;
      if (typeof idx === 'number' && idx >= 0 && idx < contents.length) {
        aiIndices.add(idx);
        const v = (item.verdict || '').toUpperCase();
        if (v.includes('MAJOR')) finalResults[idx] = { flagged: true, severity: 'major' };
        else if (v.includes('MINOR')) finalResults[idx] = { flagged: true, severity: 'minor' };
        else if (v.includes('SAFE')) finalResults[idx] = { flagged: false, severity: 'none' };
      }
    });

    //  NEW: Detailed Logging
    contents.forEach((_, i) => {
      if (aiIndices.has(i)) {
        console.log(` AI Moderated [index:${i}]`);
      } else {
        console.log(` Fallback Checked [index:${i}] (AI skipped or invalid response)`);
      }
    });

    return finalResults;

  } catch (error) {
    console.error('Batch Moderation AI Error:', error);
    // If AI fails completely, return keyword-based moderation for all
    return contents.map(c => fallbackModeration(c));
  }
}

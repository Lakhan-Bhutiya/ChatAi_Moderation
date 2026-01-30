import { groq } from './groq.client';

export type ModerationSeverity = 'none' | 'minor' | 'major';

export async function moderateContent(
  content: string,
): Promise<{ flagged: boolean; severity: ModerationSeverity }> {
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-guard-4-12b',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `
You are a STRICT content moderation classifier.

Classify the USER MESSAGE into EXACTLY ONE of these labels:
- SAFE
- MINOR
- MAJOR

Definitions:
SAFE:
- Normal conversation
- Neutral statements
- Polite language

MINOR:
- Insults
- Harassment
- Profanity
- Abusive language

MAJOR:
- Threats
- Violence
- Hate speech
- Sexual violence
- Terrorism

Rules:
- Respond with ONLY one word: SAFE, MINOR, or MAJOR
- No punctuation
- No explanation
- No extra text

Examples:
"hello" -> SAFE
"you are stupid" -> MINOR
"fuck you" -> MINOR
"I will kill you" -> MAJOR
        `.trim(),
      },
      {
        role: 'user',
        content,
      },
    ],
  });

  const verdict =
    response.choices[0]?.message?.content?.trim().toUpperCase();

  if (verdict === 'SAFE') {
    return { flagged: false, severity: 'none' };
  }

  if (verdict === 'MAJOR') {
    return { flagged: true, severity: 'major' };
  }

  // default = MINOR
  return { flagged: true, severity: 'minor' };
}

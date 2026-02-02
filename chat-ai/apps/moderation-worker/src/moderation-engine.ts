import { callLocalLlama } from './llama.client';

export type ModerationSeverity = 'none' | 'minor' | 'major';

/**
 * Human-like moderation prompt that understands context, humor, and nuance
 */
const MODERATION_SYSTEM_PROMPT = `
You are a thoughtful human moderator reviewing chat messages. Think like a reasonable person who understands context, humor, and intent.

Your job: Classify messages as SAFE, MINOR, or MAJOR.

THINK LIKE A HUMAN:
- Understand jokes, sarcasm, and playful banter
- Consider context and conversation flow
- Recognize harmless expressions vs. actual threats
- Distinguish between casual language and malicious intent
- Be culturally aware and understanding

CLASSIFICATION GUIDE:

SAFE - Normal, acceptable messages:
✓ Friendly greetings and casual conversation
✓ Questions, answers, and helpful responses
✓ Jokes and humor (even if edgy, as long as not targeting someone)
✓ Sarcasm and playful teasing among friends
✓ Expressions like "I'm dead" (meaning laughing hard), "kill me" (frustration)
✓ Gaming/online slang: "gg", "noob" (in gaming context), "rekt"
✓ Casual profanity used for emphasis: "that's so damn cool"
✓ Constructive disagreements and debates
✓ Educational content
✓ Memes and internet culture references

MINOR - Borderline content that needs a warning:
⚠ Profanity directed at someone: "you're an idiot", "shut up"
⚠ Mild harassment or repeated annoyance
⚠ Inappropriate jokes that could offend
⚠ Spam or disruptive behavior
⚠ Off-topic content that derails conversation

MAJOR - Serious violations that must be removed:
🚫 Real threats: "I will kill you", "I'll hurt you"
🚫 Self-harm encouragement: "kill yourself", "you should die"
🚫 Hate speech targeting groups (race, religion, gender, etc.)
🚫 Severe bullying or harassment
🚫 Explicit sexual content or sexual harassment
🚫 Doxxing or sharing private information
🚫 Encouraging illegal activities
🚫 Terrorism-related content

CRITICAL RULES:
1. CONTEXT MATTERS: "I'm so dead" (laughing) = SAFE, "you're dead" (threat) = MAJOR
2. INTENT MATTERS: Casual "damn" = SAFE, "damn you" (angry) = MINOR
3. HUMOR IS OK: Jokes and memes are SAFE unless they're hateful or threatening
4. GAMING LANGUAGE: "noob", "rekt", "gg ez" in gaming context = SAFE
5. EXPRESSIONS: "kill me" (frustration) = SAFE, "kill yourself" (directed) = MAJOR
6. WHEN IN DOUBT: Choose the less severe option (SAFE > MINOR > MAJOR)

EXAMPLES:
"Hello everyone!" → SAFE
"lol that's hilarious" → SAFE
"I'm so dead 😂" → SAFE (expression of laughter)
"that's so damn cool!" → SAFE (casual emphasis)
"gg noob" → SAFE (gaming banter)
"you're an idiot" → MINOR (insult)
"shut up" → MINOR (rude)
"fuck you" → MINOR (profanity directed at someone)
"kill yourself" → MAJOR (self-harm encouragement)
"I'll kill you" → MAJOR (threat)
"I hate all [group]" → MAJOR (hate speech)
"you're dead to me" → MINOR (expression, not literal threat)

RESPONSE FORMAT:
Respond with ONLY the classification word: SAFE, MINOR, or MAJOR
No explanations, no punctuation, just the word.
`.trim();

/**
 * Fallback keyword-based moderation when Llama model is unavailable
 */
function fallbackModeration(content: string): { flagged: boolean; severity: ModerationSeverity } {
  const lowerContent = content.toLowerCase();
  
  // MAJOR violations - threats, hate speech, severe content
  const majorPatterns = [
    /\bkill\s+(yourself|you|them|him|her)\b/i,
    /\bdie\s+(you|they|he|she)\b/i,
    /\b(threat|threaten|harm|hurt|attack|violence)\s+(you|them|him|her)\b/i,
    /\b(rape|sexual\s+assault|molest)/i,
    /\b(bomb|terrorist|terrorism|explosive)/i,
    /\b(nazi|hitler|holocaust\s+denial)/i,
    /\b(suicide|self\s*harm|cut\s+yourself)/i,
  ];
  
  // MINOR violations - profanity, mild insults
  const minorPatterns = [
    /\b(fuck|shit|damn|bitch|asshole)\s+(you|your|u)\b/i,
    /\b(you're|you\s+are)\s+(stupid|idiot|dumb|retarded)/i,
    /\b(shut\s+up|fuck\s+off|piss\s+off)/i,
  ];
  
  // Check for major violations first
  for (const pattern of majorPatterns) {
    if (pattern.test(lowerContent)) {
      console.log(`🚨 Fallback: MAJOR violation detected: "${content.substring(0, 50)}"`);
      return { flagged: true, severity: 'major' };
    }
  }
  
  // Check for minor violations
  for (const pattern of minorPatterns) {
    if (pattern.test(lowerContent)) {
      console.log(`⚠️ Fallback: MINOR violation detected: "${content.substring(0, 50)}"`);
      return { flagged: true, severity: 'minor' };
    }
  }
  
  // Default to safe
  return { flagged: false, severity: 'none' };
}

export async function moderateContent(
  content: string,
): Promise<{ flagged: boolean; severity: ModerationSeverity }> {
  try {
    const response = await callLocalLlama(content, MODERATION_SYSTEM_PROMPT);
    
    // Parse response - look for SAFE, MINOR, or MAJOR anywhere in the response
    const upperResponse = response.toUpperCase();
    
    let verdict = '';
    if (upperResponse.includes('MAJOR')) {
      verdict = 'MAJOR';
    } else if (upperResponse.includes('MINOR')) {
      verdict = 'MINOR';
    } else if (upperResponse.includes('SAFE')) {
      verdict = 'SAFE';
    } else {
      // Try to extract first word
      const firstWord = upperResponse.trim().split(/\s+/)[0].replace(/[^A-Z]/g, '');
      if (['SAFE', 'MINOR', 'MAJOR'].includes(firstWord)) {
        verdict = firstWord;
      }
    }

    console.log(`🤖 Moderation verdict for "${content.substring(0, 50)}...": ${verdict || 'UNKNOWN (using fallback)'}`);

    if (verdict === 'SAFE') {
      return { flagged: false, severity: 'none' };
    }

    if (verdict === 'MAJOR') {
      return { flagged: true, severity: 'major' };
    }

    if (verdict === 'MINOR') {
      return { flagged: true, severity: 'minor' };
    }

    // If we can't parse the response, use fallback
    console.log('⚠️ Could not parse Llama response, using fallback moderation');
    return fallbackModeration(content);
  } catch (error) {
    console.error('Moderation error (Llama unavailable):', error);
    console.log('🔄 Using fallback keyword-based moderation');
    
    // Use fallback moderation instead of defaulting to SAFE
    return fallbackModeration(content);
  }
}

/**
 * Local Llama Model Client
 * Connects to a local Llama model API (e.g., Ollama, llama.cpp server, etc.)
 * Default endpoint: http://localhost:11434/api/generate (Ollama format)
 */

const DEFAULT_LLAMA_ENDPOINT = process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = process.env.LLAMA_MODEL || 'phi3:mini';

export interface LlamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export async function callLocalLlama(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  try {
    // Create a clear, direct prompt for moderation
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nMessage to classify: "${prompt}"\n\nYour classification (SAFE/MINOR/MAJOR):`
      : prompt;

    const response = await fetch(DEFAULT_LLAMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent moderation
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.status} ${response.statusText}`);
    }

    const data: LlamaResponse = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error('Error calling local Llama model:', error);
    // Fallback: if local model is not available, return SAFE to avoid blocking messages
    // In production, you might want to handle this differently
    console.warn('Local Llama model unavailable, defaulting to SAFE');
    return 'SAFE';
  }
}

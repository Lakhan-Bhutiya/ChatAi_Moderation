import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the root of the worker app
dotenv.config({ path: path.join(__dirname, '../.env') });

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt || '' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
}

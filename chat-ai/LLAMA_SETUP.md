# Local Llama Model Setup

This project uses a local Llama model for content moderation instead of external APIs like Groq.

## Setup Options

### Option 1: Ollama (Recommended - Easiest)

1. **Install Ollama**: Download from https://ollama.ai

2. **Pull a model**:
   ```bash
   ollama pull llama2
   # or
   ollama pull llama3
   ```

3. **Start Ollama** (usually runs automatically):
   ```bash
   ollama serve
   ```

4. **Configure endpoint** (default works):
   - Default endpoint: `http://localhost:11434/api/generate`
   - Default model: `llama2`
   - These are already set in `apps/moderation-worker/src/llama.client.ts`

### Option 2: llama.cpp Server

1. **Build llama.cpp**:
   ```bash
   git clone https://github.com/ggerganov/llama.cpp
   cd llama.cpp
   make
   ```

2. **Download a model** (e.g., from HuggingFace)

3. **Start the server**:
   ```bash
   ./server -m /path/to/model.gguf --port 8080
   ```

4. **Update the endpoint** in `apps/moderation-worker/src/llama.client.ts`:
   ```typescript
   const DEFAULT_LLAMA_ENDPOINT = 'http://localhost:8080/completion';
   ```

### Option 3: Custom API

If you have your own Llama API endpoint, update:
- `LLAMA_ENDPOINT` environment variable, or
- `DEFAULT_LLAMA_ENDPOINT` in `apps/moderation-worker/src/llama.client.ts`

## Environment Variables

You can configure via environment variables:

```bash
export LLAMA_ENDPOINT=http://localhost:11434/api/generate
export LLAMA_MODEL=llama2
```

## Testing

To test if your local model is working:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "SAFE",
  "stream": false
}'
```

## Fallback Behavior

If the local Llama model is unavailable, the moderation worker will:
- Log an error
- Default to `SAFE` (approve messages) to avoid blocking legitimate content
- Continue operating normally

This ensures the chat system remains functional even if the moderation service is down.

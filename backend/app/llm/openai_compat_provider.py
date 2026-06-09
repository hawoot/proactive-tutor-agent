"""Any OpenAI-compatible /chat/completions endpoint: OpenAI, DeepSeek,
Mistral, Ollama, vLLM, LM Studio... Just set LLM_BASE_URL + LLM_MODEL + key."""
import httpx
from .base import LLMProvider


class OpenAICompatProvider(LLMProvider):
    def __init__(self, api_key: str, model: str, base_url: str):
        self.api_key, self.model = api_key, model
        self.base_url = base_url.rstrip("/")

    def ask(self, prompt: str, max_tokens: int = 500) -> str:
        r = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()

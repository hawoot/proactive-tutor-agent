"""Any OpenAI-compatible /chat/completions endpoint: OpenAI, DeepSeek,
Mistral, Ollama, vLLM, LM Studio... Just set LLM_BASE_URL + LLM_MODEL + key."""
import httpx
from .base import LLMProvider


class OpenAICompatProvider(LLMProvider):
    def __init__(self, api_key: str, model: str, base_url: str):
        self.api_key, self.model = api_key, model
        self.base_url = base_url.rstrip("/")

    def ask(self, prompt: str, max_tokens: int = 500,
            images: list[str] | None = None) -> str:
        if images:
            content = [{"type": "text", "text": prompt}]
            content += [
                {"type": "image_url",
                 "image_url": {"url": f"data:image/jpeg;base64,{img}"}}
                for img in images
            ]
            message_content = content
        else:
            message_content = prompt
        r = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": message_content}],
            },
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()

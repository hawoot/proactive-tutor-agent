from anthropic import Anthropic
from .base import LLMProvider


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = Anthropic(api_key=api_key)
        self.model = model

    def ask(self, prompt: str, max_tokens: int = 500,
            images: list[str] | None = None) -> str:
        # Images first, then the text - Claude reads the photo, then the task.
        content = [
            {"type": "image",
             "source": {"type": "base64", "media_type": "image/jpeg", "data": img}}
            for img in (images or [])
        ]
        content.append({"type": "text", "text": prompt})
        msg = self.client.messages.create(
            model=self.model, max_tokens=max_tokens,
            messages=[{"role": "user", "content": content}],
        )
        return msg.content[0].text.strip()

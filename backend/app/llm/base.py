"""Provider interface. The rest of the codebase only ever imports `ask()`
from app.llm - it never knows (or cares) which vendor is behind it.

`images` (optional) are base64-encoded JPEG bytes; vision-capable providers
attach them to the message so the model can read a photo of the student's work."""
from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def ask(self, prompt: str, max_tokens: int = 500,
            images: list[str] | None = None) -> str: ...

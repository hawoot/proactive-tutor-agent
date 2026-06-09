"""Provider interface. The rest of the codebase only ever imports `ask()`
from app.llm - it never knows (or cares) which vendor is behind it."""
from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def ask(self, prompt: str, max_tokens: int = 500) -> str: ...

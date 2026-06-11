"""Deterministic offline provider: develop and smoke-test the whole loop
(questions, marking, scheduler) without an API key or network access."""
from .base import LLMProvider


class FakeProvider(LLMProvider):
    def ask(self, prompt: str, max_tokens: int = 500) -> str:
        if "VERDICT" in prompt:  # marking prompt
            return "VERDICT: correct\nFEEDBACK: (fake provider) Marked correct for testing."
        return "(fake provider) Practice question: what is 2 + 2?"

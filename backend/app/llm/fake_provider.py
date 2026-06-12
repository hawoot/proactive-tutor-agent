"""Deterministic offline provider: develop and smoke-test the whole loop
(questions, marking, scheduler) without an API key or network access."""
from .base import LLMProvider


class FakeProvider(LLMProvider):
    def ask(self, prompt: str, max_tokens: int = 500) -> str:
        if "FOLLOW-UP" in prompt:  # post-verdict drill-down
            return "(fake provider) Good follow-up - here is a fuller explanation."
        if "MODE: COACH" in prompt:  # conversation turn
            last = prompt.rsplit("STUDENT:", 1)[-1].split("\n", 1)[0]
            if "answer" in last.lower() or "= " in last:
                return "MODE: MARK\nVERDICT: correct\nFEEDBACK: (fake provider) Marked correct."
            return "MODE: COACH\n(fake provider) What rule applies to the first term?"
        if "VERDICT" in prompt:  # marking prompt
            return "VERDICT: correct\nFEEDBACK: (fake provider) Marked correct for testing."
        if "QUESTION:" in prompt:  # generation prompt - exercise the reasoning-strip parser
            return "Some models ramble first.\n\nQUESTION: (fake provider) What is 2 + 2?"
        return "(fake provider) Practice question: what is 2 + 2?"

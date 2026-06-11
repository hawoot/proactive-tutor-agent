"""Factory: pick the provider from config. Adding a vendor = one new file
+ one elif. Nothing else in the codebase changes."""
from .. import config
from .base import LLMProvider


def _build() -> LLMProvider:
    if config.LLM_PROVIDER == "anthropic":
        from .anthropic_provider import AnthropicProvider
        return AnthropicProvider(config.LLM_API_KEY, config.LLM_MODEL)
    elif config.LLM_PROVIDER == "openai_compat":
        from .openai_compat_provider import OpenAICompatProvider
        if not config.LLM_BASE_URL:
            raise RuntimeError("LLM_BASE_URL required for openai_compat")
        return OpenAICompatProvider(config.LLM_API_KEY, config.LLM_MODEL, config.LLM_BASE_URL)
    elif config.LLM_PROVIDER == "fake":
        from .fake_provider import FakeProvider
        return FakeProvider()
    raise RuntimeError(f"Unknown LLM_PROVIDER: {config.LLM_PROVIDER}")


_provider: LLMProvider | None = None


def ask(prompt: str, max_tokens: int = 500) -> str:
    global _provider
    if _provider is None:
        _provider = _build()
    return _provider.ask(prompt, max_tokens)

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Boss 投递助手"
    database_url: str = "sqlite:///./resume_matcher.db"
    ai_provider: str = "local"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = ""
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    kimi_api_key: str = ""
    kimi_base_url: str = "https://api.moonshot.ai/v1"
    kimi_model: str = "kimi-k2.6"
    qwen_api_key: str = ""
    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_model: str = "qwen-plus"
    backend_cors_origins: str = "http://localhost:3000,http://localhost:3001"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def provider_configs(self) -> dict[str, dict[str, str]]:
        return {
            "local": {
                "name": "本地关键词分析",
                "base_url": "",
                "api_key": "",
                "model": "local-keyword-analyzer",
            },
            "openai": {
                "name": "OpenAI",
                "base_url": self.openai_base_url,
                "api_key": self.openai_api_key,
                "model": self.openai_model,
            },
            "deepseek": {
                "name": "DeepSeek",
                "base_url": self.deepseek_base_url,
                "api_key": self.deepseek_api_key,
                "model": self.deepseek_model,
            },
            "kimi": {
                "name": "Kimi / Moonshot",
                "base_url": self.kimi_base_url,
                "api_key": self.kimi_api_key,
                "model": self.kimi_model,
            },
            "qwen": {
                "name": "通义千问 / Qwen",
                "base_url": self.qwen_base_url,
                "api_key": self.qwen_api_key,
                "model": self.qwen_model,
            },
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()

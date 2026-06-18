from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://paperqa:paperqa@localhost:5432/paperqa"
    app_name: str = "Research Paper Q&A API"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="PAPERQA_")


settings = Settings()

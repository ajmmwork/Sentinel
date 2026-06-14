from pydantic import BaseModel


class SaveApiKeyRequest(BaseModel):
    provider_id: int
    model_id: int
    api_key: str

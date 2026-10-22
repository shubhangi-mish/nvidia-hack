"""Fail-closed Nebius Token Factory adapter; never substitutes another model."""
import os
import httpx

class NebiusNotConfigured(RuntimeError): pass

def config() -> tuple[str, str, str]:
    key, base, model = os.getenv("NEBIUS_API_KEY"), os.getenv("NEBIUS_BASE_URL"), os.getenv("NEBIUS_NVIDIA_MODEL_ID")
    if not key or not base or not model:
        raise NebiusNotConfigured("Set NEBIUS_API_KEY, NEBIUS_BASE_URL, and NEBIUS_NVIDIA_MODEL_ID")
    return key, base.rstrip("/"), model

def smoke_test() -> dict:
    key, base, model = config()
    response = httpx.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"}, timeout=20)
    response.raise_for_status()
    model_ids = {item.get("id") for item in response.json().get("data", [])}
    if model not in model_ids:
        raise NebiusNotConfigured("Configured model is not present in this account's Token Factory catalog")
    completion = httpx.post(f"{base}/chat/completions", headers={"Authorization": f"Bearer {key}"}, json={"model": model, "temperature": 0, "max_tokens": 16, "messages": [{"role": "user", "content": "Return only: LASTLINE_SMOKE_OK"}]}, timeout=45)
    completion.raise_for_status()
    return {"provider": "Nebius Token Factory", "model_id": model, "response_id": completion.json().get("id")}

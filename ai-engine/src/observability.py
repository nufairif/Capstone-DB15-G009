import logging
import os
import threading
import time
from collections import deque
from functools import wraps
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger("firaza.observability")

# Biaya referensi cloud GPU T4/L4 atau API open-weights (estimasi per 1M token dalam USD -> IDR kurs Rp16.000)
DEFAULT_USD_TO_IDR = 16000.0
DEFAULT_INPUT_COST_PER_1M_USD = 0.08
DEFAULT_OUTPUT_COST_PER_1M_USD = 0.16


def is_langfuse_configured() -> bool:
    """Mengembalikan True hanya jika kredensial Langfuse tersedia di environment."""
    return bool(
        os.getenv("LANGFUSE_PUBLIC_KEY", "").strip()
        and os.getenv("LANGFUSE_SECRET_KEY", "").strip()
    )


def observe_span(name: Optional[str] = None, as_type: Optional[str] = None):
    """
    Decorator wrapper aman untuk Langfuse `@observe()`.
    Jika kredensial Langfuse belum diatur atau SDK tidak aktif, tetap mencatat log latensi
    lokal tanpa menyebabkan crash aplikasi.
    """

    def decorator(func: Callable) -> Callable:
        decorated_func = func
        if is_langfuse_configured():
            try:
                from langfuse import observe as langfuse_observe

                kwargs: Dict[str, Any] = {}
                if name:
                    kwargs["name"] = name
                if as_type:
                    kwargs["as_type"] = as_type
                decorated_func = langfuse_observe(**kwargs)(func)
            except Exception as exc:
                logger.warning("Langfuse observe unavailable, falling back to local logging: %s", exc)

        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                return decorated_func(*args, **kwargs)
            finally:
                elapsed_ms = (time.perf_counter() - start) * 1000.0
                logger.debug("[trace:%s] elapsed_ms=%.2f", name or func.__name__, elapsed_ms)

        return wrapper

    return decorator


def update_langfuse_observation(
    *,
    output: Any = None,
    model: Optional[str] = None,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    metadata: Optional[Dict[str, Any]] = None,
    level: Optional[str] = None,
    status_message: Optional[str] = None,
):
    """Memperbarui metadata & usage token ke observation Langfuse aktif (jika dikonfigurasi)."""
    if not is_langfuse_configured():
        return
    try:
        from langfuse import get_client

        client = get_client()
        update_kwargs: Dict[str, Any] = {}
        if output is not None:
            update_kwargs["output"] = output
        if model:
            update_kwargs["model"] = model
        if prompt_tokens or completion_tokens:
            update_kwargs["usage_details"] = {
                "input": prompt_tokens,
                "output": completion_tokens,
                "total": prompt_tokens + completion_tokens,
            }
        if metadata:
            update_kwargs["metadata"] = metadata
        if level:
            update_kwargs["level"] = level
        if status_message:
            update_kwargs["status_message"] = status_message

        if hasattr(client, "update_current_generation") and model:
            client.update_current_generation(**update_kwargs)
        elif hasattr(client, "update_current_span"):
            client.update_current_span(**update_kwargs)
    except Exception as exc:
        logger.debug("Skipping Langfuse observation update: %s", exc)


def estimate_llm_cost(prompt_tokens: int, completion_tokens: int) -> Dict[str, float]:
    """Menghitung estimasi metrik biaya komputasi (Cost Metric) per permintaan LLM."""
    input_usd = (prompt_tokens / 1_000_000.0) * DEFAULT_INPUT_COST_PER_1M_USD
    output_usd = (completion_tokens / 1_000_000.0) * DEFAULT_OUTPUT_COST_PER_1M_USD
    total_usd = input_usd + output_usd
    total_idr = total_usd * DEFAULT_USD_TO_IDR
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": prompt_tokens + completion_tokens,
        "estimated_cost_usd": round(total_usd, 6),
        "estimated_cost_idr": round(total_idr, 4),
    }


class TelemetryMetricsStore:
    """Penyimpanan metrik observabilitas (latency, token, retry, validation) in-memory."""

    def __init__(self, max_events: int = 200):
        self._lock = threading.Lock()
        self._events: deque[Dict[str, Any]] = deque(maxlen=max_events)

    def record(self, event: Dict[str, Any]):
        with self._lock:
            self._events.append(
                {
                    "timestamp": time.time(),
                    **event,
                }
            )

    def summary(self) -> Dict[str, Any]:
        with self._lock:
            events = list(self._events)

        if not events:
            return {
                "total_requests": 0,
                "avg_latency_ms": 0.0,
                "p95_latency_ms": 0.0,
                "total_tokens": 0,
                "total_estimated_cost_idr": 0.0,
                "validation_success_rate": 1.0,
                "system1_short_circuits": 0,
                "langfuse_enabled": is_langfuse_configured(),
            }

        latencies = sorted(float(e.get("latency_ms", 0.0)) for e in events)
        p95_idx = min(len(latencies) - 1, int(0.95 * (len(latencies) - 1)))
        total_tokens = sum(int(e.get("total_tokens", 0)) for e in events)
        total_cost_idr = sum(float(e.get("estimated_cost_idr", 0.0)) for e in events)
        validated_events = [e for e in events if "validation_passed" in e]
        val_ok = sum(1 for e in validated_events if e["validation_passed"])
        val_rate = (val_ok / len(validated_events)) if validated_events else 1.0
        s1_saved = sum(1 for e in events if e.get("system1_short_circuit"))

        return {
            "total_requests": len(events),
            "avg_latency_ms": round(sum(latencies) / len(latencies), 2),
            "p95_latency_ms": round(latencies[p95_idx], 2),
            "total_tokens": total_tokens,
            "total_estimated_cost_idr": round(total_cost_idr, 4),
            "validation_success_rate": round(val_rate, 4),
            "system1_short_circuits": s1_saved,
            "langfuse_enabled": is_langfuse_configured(),
        }


telemetry_store = TelemetryMetricsStore()

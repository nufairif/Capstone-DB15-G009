from .health import router as health_router
from .auth import router as auth_router
from .stats import router as stats_router
from .customers import router as customers_router
from .orders import router as orders_router
from .ai import router as ai_router

__all__ = [
    "health_router",
    "auth_router",
    "stats_router",
    "customers_router",
    "orders_router",
    "ai_router",
]


from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db_and_seed
from services.ai_service import init_ai_models
from routers import (
    health_router,
    auth_router,
    stats_router,
    customers_router,
    orders_router,
    ai_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_db_and_seed()
    init_ai_models()
    yield
    # Shutdown cleanup (jika dibutuhkan)


app = FastAPI(
    title="Toko Firaza Full-Stack Backend & AI Order Management API",
    description="RESTful API untuk CRUD Customer, Custom Order, Pelacakan Produksi, serta Integrasi Predictive/Generative AI & Local RAG (DB15-G009).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registrasi Router Modular (Best Practice)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(stats_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(ai_router)

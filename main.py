"""
Punto de entrada del módulo de seguridad — Para desarrollo y pruebas.
Levantá este server y probá los endpoints en http://localhost:8000/docs

Uso:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from backend.seguridad.dependencias import engine
from backend.seguridad.router import router
from backend.seguridad.seed import sembrar


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    sembrar()
    yield


app = FastAPI(title="Seguridad", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://seguridad-front.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}

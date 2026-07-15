"""
Punto de entrada del módulo de seguridad — Para desarrollo y pruebas.
Levantá este server y probá los endpoints en http://localhost:8000/docs

Uso:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
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
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}

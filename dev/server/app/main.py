from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.setup import router as setup_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title = "Sentinel API")

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(setup_router, prefix="/api/setup", tags=["setup"])
@app.get("/health")
def health_check():
    return {"status" : "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:5176",
        "http://localhost:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

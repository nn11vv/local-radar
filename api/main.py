from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import leads, stats, scraper

app = FastAPI(title="Local Radar API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(scraper.router, prefix="/api")

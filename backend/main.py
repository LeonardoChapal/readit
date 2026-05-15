from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

import models
from database import engine, Base
from routers import auth as auth_router
from routers import books as books_router
from routers import reviews as reviews_router
from routers import genres as genres_router
from routers import comments as comments_router
from routers.comments import comment_router
from routers import admin as admin_router
from routers import users as users_router
from routers import search as search_router
from routers import reading_list as reading_list_router
from routers import notifications as notifications_router
from routers import feed as feed_router
from routers import tags as tags_router
from routers import onboarding as onboarding_router
from routers import activity as activity_router
from routers import recommendations as recommendations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Readit API", lifespan=lifespan)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(books_router.router)
app.include_router(reviews_router.router)
app.include_router(genres_router.router)
app.include_router(comments_router.router)
app.include_router(comment_router)
app.include_router(admin_router.router)
app.include_router(users_router.router)
app.include_router(search_router.router)
app.include_router(reading_list_router.router)
app.include_router(notifications_router.router)
app.include_router(feed_router.router)
app.include_router(tags_router.router)
app.include_router(onboarding_router.router)
app.include_router(activity_router.router)
app.include_router(recommendations_router.router)


@app.get("/")
def root():
    return {"message": "Readit API funcionando"}

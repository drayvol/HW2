from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from routes.auth import auth_route
from routes.users import users_route
from routes.balance import balance_route
from routes.predict import predict_route
from routes.history import history_route
from database.config import get_settings
from init_db import init_db
import uvicorn
import logging

logger = logging.getLogger(__name__)
settings = get_settings()
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.API_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )
    #Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    #register routes
    app.include_router(auth_route, prefix="/auth", tags=["auth"])
    app.include_router(users_route, prefix="/users", tags=["users"])
    app.include_router(balance_route, prefix="/balance", tags=["balance"])
    app.include_router(predict_route, prefix="/predict", tags=["predict"])
    app.include_router(history_route, prefix="/history", tags=["history"])
    return app

app = create_app()


@app.on_event("startup")
def on_startup():
    try:
        logger.info("Initializing database...")
        init_db()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Application shutting down...")


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    uvicorn.run(
        'api:app',
        host='0.0.0.0',
        port=8080,
        reload=True,
        log_level="info"
    )

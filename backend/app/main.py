import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

load_dotenv()

from . import cache, pipeline  # noqa: E402
from .models import AnalyzeRequest, AnalyzeResponse, GraderBusy, UserError  # noqa: E402

# Comma-separated list, e.g. "https://blindspot.vercel.app,http://localhost:5173"
FRONTEND_ORIGINS = [o.strip().rstrip("/") for o in os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",") if o.strip()]

app = FastAPI(title="Blindspot")
app.add_middleware(
    CORSMiddleware, allow_origins=FRONTEND_ORIGINS, allow_methods=["POST", "GET"], allow_headers=["*"]
)
cache.load()


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Invalid request.") if errors else "Invalid request."
    return JSONResponse(status_code=422, content={"detail": msg.removeprefix("Value error, ")})


@app.exception_handler(UserError)
async def user_error_handler(_: Request, exc: UserError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(GraderBusy)
async def busy_handler(_: Request, exc: GraderBusy):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest, nocache: bool = False):
    key = cache.make_key(req.code, req.language, req.transcript)
    bypass = nocache and os.environ.get("DEBUG") == "1"
    if not bypass and (hit := cache.get(key)) is not None:
        return {**hit, "cached": True}
    result = await run_in_threadpool(pipeline.run, req.code, req.language, req.transcript)
    cache.put(key, result)
    return {**result, "cached": False}

# api.py - Оставляем как было

from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
import threading

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Эндпоинты, связанные с ботом, удалены или отключены, т.к. не вписываются в stateful логику опросников
# при запуске бота через main.py

@app.get("/")
def read_root():
    return {"message": "Welcome to the chatbot API! Telegram bot is running via main.py and using DB."}

# Эндпоинт для запуска бота через API отключен, т.к. бот запускается main.py
@app.get("/start_bots/")
async def start_bots_endpoint():
    raise HTTPException(status_code=405, detail="Запуск бота через этот эндпоинт отключен. Используйте main.py для запуска.")


if __name__ == "__main__":
    # Запуск FastAPI изолированно (для тестирования API отдельно)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
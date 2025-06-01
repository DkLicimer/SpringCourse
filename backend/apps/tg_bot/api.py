from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
import threading
from PALENO_telegrm_logic import handle_message
from PALENO_telegram_connector import run_bot


app = FastAPI()
api_router = APIRouter(prefix="/api")


class MessageRequest(BaseModel):
    text: str
    user_id: str  # Идентификатор пользователя в внешней системе

class MessageResponse(BaseModel):
    response: str
    buttons: list  # Кнопки для отображения в интерфейсе


@app.get("/")
def read_root():
    return {"message": "Welcome to the chatbot API!"}

@app.post("/qa/", response_model=MessageResponse)
async def handle_external_message(request: MessageRequest):
    """Обработка сообщений от внешней системы."""
    try:
        response, buttons = handle_message(request.text)
        return MessageResponse(response=response, buttons=buttons)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/start_bots/")
async def start_bots():
    try:
        telegram_thread = threading.Thread(target=run_bot())
        telegram_thread.start()
        return {"status": "Боты запущены!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
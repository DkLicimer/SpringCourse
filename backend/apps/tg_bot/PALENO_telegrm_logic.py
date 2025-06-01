from LLM_integration import GigaChatIntegration

def handle_message(message):
    gigachat_helper = GigaChatIntegration()
    ai_response = gigachat_helper.get_response(json_file_path = "neymark/backend/apps/tg_bot/d.json")
    return ai_response
import datetime
import threading
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
import uvicorn

# === Конфіг ===
BOT_TOKEN = "5302824520:AAG6D_Rjn0atmuB99G3U9drbzpaF_hXhMeI"
CHAT_ID = "577102344"
bot = telebot.TeleBot(BOT_TOKEN)
app = FastAPI()

# ✅ Дозволяємо CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # можна замінити на ["http://localhost:5173"] для безпеки
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Лічильник замовлень
daily_order_counter = 0
last_order_date = ""

# === API маршрут для прийому замовлень ===
@app.post("/order")
async def new_order(request: Request):
    global daily_order_counter, last_order_date

    data = await request.json()
    name = data["name"]
    phone = data["phone"]
    qty = data["qty"]
    delivery = data["delivery"]
    address = data["address"]
    contact_method = data["contactMethod"]
    total = data["total"]

    now = datetime.datetime.now()
    date = now.strftime("%d.%m.%Y")
    time = now.strftime("%H:%M:%S")

    # номер замовлення
    today_str = now.strftime("%Y%m%d")
    if today_str != last_order_date:
        daily_order_counter = 0
        last_order_date = today_str
    daily_order_counter += 1
    order_number = f"#{today_str}-{daily_order_counter:03d}"

    delivery_text = {
        "0": "Самовивіз (0 грн)",
        "80": "Нова пошта (80 грн)",
        "60": "Укрпошта (60 грн)"
    }.get(delivery, "Невідомо")

    # Формуємо повідомлення
    message = f"""
🛒 НОВЕ ЗАМОВЛЕННЯ {order_number}
📅 Дата: {date}
⏰ Час: {time}

👤 Ім'я: {name}
📞 Телефон: {phone}
💬 Зв'язок: {contact_method}
📦 Кількість: {qty}
🚚 Доставка: {delivery_text}
🏠 Адреса: {address}
💰 Сума: {total} грн

📌 Статус: Нове (неопрацьоване)
    """

    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton("Відмітити", callback_data=f"mark_{order_number}"))

    bot.send_message(CHAT_ID, message, reply_markup=markup)

    return JSONResponse(content={"status": "ok", "orderNumber": order_number})


@bot.callback_query_handler(func=lambda call: call.data.startswith("mark_"))
def callback_mark(call):
    order_id = call.data.split("_")[1]

    markup = InlineKeyboardMarkup()
    markup.add(
        InlineKeyboardButton("✅ Так", callback_data=f"confirm_{order_id}_yes"),
        InlineKeyboardButton("❌ Ні", callback_data=f"confirm_{order_id}_no")
    )

    bot.edit_message_reply_markup(
        chat_id=call.message.chat.id,
        message_id=call.message.message_id,
        reply_markup=markup
    )

@bot.callback_query_handler(func=lambda call: call.data.startswith("confirm_"))
def callback_confirm(call):
    _, order_id, answer = call.data.split("_")

    if answer == "yes":
        # Час опрацювання
        now = datetime.datetime.now().strftime("%d.%m %H:%M")

        # Міняємо статус на "Опрацьоване"
        text_lines = call.message.text.split("\n")
        for i, line in enumerate(text_lines):
            if line.startswith("📌 Статус:"):
                text_lines[i] = f"📌 Статус: ✅ Опрацьоване ({now})"
        updated_text = "\n".join(text_lines)

        bot.edit_message_text(
            updated_text,
            chat_id=call.message.chat.id,
            message_id=call.message.message_id
        )

    else:  # Якщо "Ні"
        # Повертаємо кнопку "Відмітити"
        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Відмітити", callback_data=f"mark_{order_id}"))

        bot.edit_message_reply_markup(
            chat_id=call.message.chat.id,
            message_id=call.message.message_id,
            reply_markup=markup
        )

@bot.callback_query_handler(func=lambda call: call.data.startswith("status_"))
def callback_status(call):
    _, order_id, status = call.data.split("_")
    status_map = {
        "sent": "✅ Відправлено",
        "active": "🟡 Активне",
        "cancelled": "❌ Скасовано"
    }
    new_status = status_map.get(status, "Невідомо")

    text = call.message.text.split("\n")
    for i, line in enumerate(text):
        if line.startswith("📌 Статус:"):
            text[i] = f"📌 Статус: {new_status}"
    updated_text = "\n".join(text)

    bot.edit_message_text(updated_text, call.message.chat.id, call.message.message_id)


# === Запуск FastAPI + бота паралельно ===
def run_api():
    uvicorn.run(app, host="0.0.0.0", port=8000)

def run_bot():
    bot.polling()

if __name__ == "__main__":
    threading.Thread(target=run_api).start()
    run_bot()

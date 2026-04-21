require("dotenv").config();

const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");

// Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Express (для Render + ping)
const app = express();

// =====================
// HEALTH CHECK (ping)
// =====================
app.get("/ping", (req, res) => {
  res.send("pong");
});

// =====================
// TELEGRAM HANDLER
// =====================
bot.start((ctx) => {
  ctx.reply("Привет 👋 Я бесплатный AI бот. Напиши сообщение.");
});

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: "Ты полезный, краткий и умный ассистент."
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://telegram-bot",
          "X-Title": "tg-bot"
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    ctx.reply(reply);

  } catch (error) {
    console.log("AI ERROR:", error.response?.data || error.message);

    ctx.reply(
      "Ошибка AI 😢\n\n" +
      (error.response?.data?.error?.message || "unknown error")
    );
  }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});

bot.launch();

// graceful stop (важно для Render)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

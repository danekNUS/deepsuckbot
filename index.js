require("dotenv").config();

const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");

// =====================
// INIT
// =====================
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// =====================
// HEALTHCHECK (Render)
// =====================
app.get("/ping", (req, res) => {
  res.send("pong");
});

// =====================
// AI MODELS (fallback chain)
// =====================
const models = [
  "google/gemma-4-31b-it:free",
  "minimax/minimax-m2.5:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-coder:free",
  "liquid/lfm-2.5-1.2b-thinking:free"
];

// =====================
// TELEGRAM START
// =====================
bot.start((ctx) => {
  ctx.reply("Привет 👋 Я AI бот. Напиши сообщение.");
});

// =====================
// MAIN HANDLER
// =====================
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  try {
    let response;
    let lastError;

    // пробуем модели по очереди
    for (const model of models) {
      try {
        response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages: [
              {
                role: "system",
                content: "Ты умный, краткий и полезный ассистент."
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

        break; // если успешно — выходим
      } catch (err) {
        console.log(`Model failed: ${model}`);
        lastError = err;
      }
    }

    if (!response) throw lastError;

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
// ERROR SAFETY
// =====================
process.on("unhandledRejection", (err) => {
  console.log("Unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.log("Crash:", err);
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});

// =====================
// START BOT
// =====================
bot.launch();

// graceful stop (Render safe shutdown)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

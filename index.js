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
// HEALTHCHECK
// =====================
app.get("/ping", (req, res) => {
  res.send("pong");
});

// =====================
// MODELS LIST
// =====================
const models = [
  "google/gemma-4-31b-it:free",
  "minimax/minimax-m2.5:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-coder:free",
  "liquid/lfm-2.5-1.2b-thinking:free"
];

// =====================
// BOT START
// =====================
bot.start((ctx) => {
  ctx.reply("Привет 👋 Я AI бот. Напиши сообщение.");
});

// =====================
// MAIN LOGIC
// =====================
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  const startTime = Date.now(); // ⏱ старт таймера

  let response;
  let usedModel = null;
  let triedCount = 0;

  try {
    for (const model of models) {
      triedCount++;

      try {
        response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
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

        usedModel = model;
        break; // 🧠 остановились на первой рабочей

      } catch (err) {
        console.log(`Model failed: ${model}`);
      }
    }

    if (!response) {
      throw new Error("All models failed");
    }

    const reply = response.data.choices[0].message.content;

    const endTime = Date.now();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

    ctx.reply(
      `🤖 Модель: ${usedModel}\n` +
      `🔁 Попыток: ${triedCount}\n` +
      `⏱ Время: ${timeTaken}s\n\n` +
      reply
    );

  } catch (error) {
    console.log("AI ERROR:", error.response?.data || error.message);

    ctx.reply(
      "Ошибка AI 😢\n\n" +
      (error.response?.data?.error?.message || error.message)
    );
  }
});

// =====================
// SAFETY
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

// graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

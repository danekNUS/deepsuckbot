require("dotenv").config();

const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// ===== Telegram =====
bot.start((ctx) => ctx.reply("Привет! Я бот с DeepSeek 🚀"));

bot.on("text", async (ctx) => {
  try {
    const userMessage = ctx.message.text;

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Ты полезный ассистент" },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;

    await ctx.reply(reply);
  } catch (e) {
    console.error(e.response?.data || e.message);
    ctx.reply("Ошибка 😢");
  }
});

// ===== Ping endpoint =====
app.get("/ping", (req, res) => {
  res.send("pong");
});

// ===== Start =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started");
});

bot.launch();

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import fs from 'fs';
import { createPartFromUri, createUserContent, GoogleGenAI } from "@google/genai";

dotenv.config(); // load file .env

const app = express(); // setup aplikasi express
const PORT = process.env.PORT || 3000;
const STATIC_PATH = 'public';

app.use(cors());
app.use(express.json()); // parse jsonconst form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async function (e) { // Menjadikan fungsi ini async
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  // Menampilkan pesan "thinking" sementara menunggu respons
  appendMessage('bot', 'Gemini is thinking...');

  try {
    const response = await fetch('/api/chat', { // Mengirim permintaan ke backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    // Menghapus pesan "thinking" setelah respons diterima atau jika ada error
    const thinkingMessage = chatBox.querySelector('.message.bot:last-child');
    if (thinkingMessage && thinkingMessage.textContent.includes('Gemini is thinking...')) {
        chatBox.removeChild(thinkingMessage);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.reply || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    appendMessage('bot', data.reply); // Menampilkan balasan dari bot

  } catch (error) {
    console.error('Error sending message to backend:', error);
    // Menghapus pesan "thinking" jika masih ada saat error
    const thinkingMessageOnError = chatBox.querySelector('.message.bot:last-child');
    if (thinkingMessageOnError && thinkingMessageOnError.textContent.includes('Gemini is thinking...')) {
        chatBox.removeChild(thinkingMessageOnError);
    }
    appendMessage('bot', `Sorry, something went wrong: ${error.message}`);
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll ke pesan terbaru
}

app.use(express.static(STATIC_PATH));

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
}); // inisiaasi model google genai

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
  
    // validate user message
    // guard clause
    if (!message) {
      return res.status(400).json({ reply: 'Message is required.' });
    }
  
    try {
      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: message,
      });
      const text = result.text;
      return res.status(200).json({ reply: text });
  } catch (err) {
      console.log(err);
      return res.status(500).json({ reply: 'Something went wrong.' });
    }
  });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  }); 



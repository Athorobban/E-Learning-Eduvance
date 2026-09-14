"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMsg = "👤: " + message;
    setChat((prev) => [...prev, userMsg]);

    const res = await fetch("/api/chatbot", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    const botMsg = "🤖: " + data.reply;
    setChat((prev) => [...prev, botMsg]);

    setMessage("");
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition">
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 bg-white shadow-xl rounded-xl p-4 border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-blue-700 font-semibold">AI Chat Assistant</h3>
            <button onClick={() => setOpen(false)}>
              <X className="text-gray-500 hover:text-red-500" />
            </button>
          </div>

          <div className="h-64 overflow-y-auto bg-blue-50 rounded-lg p-2 text-sm">
            {chat.map((c, i) => (
              <p key={i} className="mb-1 whitespace-pre-wrap">
                {c}
              </p>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Tulis pesan..." value={message} onChange={(e) => setMessage(e.target.value)} />

            <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded-lg">
              Kirim
            </button>
          </div>
        </div>
      )}
    </>
  );
}

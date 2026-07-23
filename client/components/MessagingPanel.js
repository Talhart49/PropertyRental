"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../app/providers";
import { API_URL, apiRequest } from "../lib/api";

function formatTime(value) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export default function MessagingPanel({ bookingId, compact = false, propertyId }) {
  const { isAuthenticated, token, user } = useAuth();
  const [body, setBody] = useState("");
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  async function openConversation() {
    setError("");
    setIsOpen(true);

    try {
      const conversationPayload = await apiRequest("/api/messages/conversations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId, bookingId })
      });
      const nextConversation = conversationPayload.data.conversation;
      setConversation(nextConversation);

      const messagePayload = await apiRequest(
        `/api/messages/conversations/${nextConversation._id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMessages(messagePayload.data.messages);
    } catch (openError) {
      setError(openError.message);
    }
  }

  useEffect(() => {
    if (!conversation?._id || !isOpen) {
      return undefined;
    }

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { token }
    });
    socketRef.current = socket;
    socket.emit("conversation:join", conversation._id);
    socket.on("message:new", (payload) => {
      if (payload.conversationId === conversation._id) {
        setMessages((current) => {
          if (current.some((message) => message._id === payload.message._id)) {
            return current;
          }

          return [...current, payload.message];
        });
      }
    });

    return () => {
      socket.emit("conversation:leave", conversation._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversation?._id, isOpen]);

  async function sendMessage(event) {
    event.preventDefault();

    if (!body.trim() || !conversation?._id) {
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const payload = await apiRequest(
        `/api/messages/conversations/${conversation._id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ body })
        }
      );
      setMessages((current) => {
        if (current.some((message) => message._id === payload.data.message._id)) {
          return current;
        }

        return [...current, payload.data.message];
      });
      setBody("");
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSending(false);
    }
  }

  if (!isAuthenticated || !["tenant", "landlord"].includes(user?.role)) {
    return null;
  }

  return (
    <div className={compact ? "mt-4" : ""}>
      {!isOpen ? (
        <button
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700 hover:bg-teal-50"
          onClick={openConversation}
          type="button"
        >
          Open chat
        </button>
      ) : (
        <div className="rounded-md border border-stone-200 bg-white/95 p-4 shadow-lg shadow-stone-200/60">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-stone-950">Messages</h3>
            <button
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:bg-teal-50"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          {error ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto rounded-md border border-stone-100 bg-stone-50 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-stone-600">No messages yet.</p>
            ) : null}

            {messages.map((message) => {
              const isMine = String(message.sender?._id) === String(user?._id);

              return (
                <div
                  className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                    isMine
                      ? "ml-auto bg-teal-700 text-white shadow-sm"
                      : "bg-white text-stone-800"
                  }`}
                  key={message._id}
                >
                  <p className="font-semibold">{message.sender?.name}</p>
                  <p className="mt-1 leading-6">{message.body}</p>
                  <p className={`mt-1 text-xs ${isMine ? "text-emerald-50" : "text-stone-500"}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>

          <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
            <input
              className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-700"
              maxLength={2000}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Type a message"
              value={body}
            />
            <button
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={isSending}
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import { useAuth } from "../app/providers";
import { API_URL, apiRequest } from "../lib/api";

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleString("en-GB", { weekday: "short" });
  return date.toLocaleString("en-GB", { dateStyle: "short" });
}

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const avatarColors = [
  "bg-brand-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500"
];

function getAvatarColor(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function otherParticipant(conversation, userId) {
  const isLandlord = String(conversation.landlord?._id) === String(userId);
  return isLandlord ? conversation.tenant : conversation.landlord;
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3 animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded-full bg-surface-200" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-32 bg-surface-200 rounded" />
        <div className="h-3 w-48 bg-surface-100 rounded" />
      </div>
    </div>
  );
}

function MessageBubble({ message, isMine }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isMine
            ? "bg-brand-500 text-white rounded-br-md"
            : "bg-surface-100 text-surface-900 rounded-bl-md"
        }`}
      >
        {!isMine && (
          <p className="text-xs font-semibold text-surface-500 mb-0.5">
            {message.sender?.name}
          </p>
        )}
        <p className="leading-6 whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={`mt-1 text-[10px] text-right ${
            isMine ? "text-white/60" : "text-surface-400"
          }`}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function ConversationsInbox() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when conversation opens
  useEffect(() => {
    if (activeConversation) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversation]);

  async function loadConversations() {
    setError("");
    setIsLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [convPayload, unreadPayload] = await Promise.all([
        apiRequest("/api/messages/conversations", { headers }),
        apiRequest("/api/messages/conversations/unread-counts", { headers })
      ]);

      setConversations(convPayload.data.conversations);
      setUnreadCounts(unreadPayload.data.unreadCounts);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-open a conversation when navigating from a notification link
  // that includes ?conversation=<id>
  const openConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Mark messages as read
      await apiRequest(`/api/messages/conversations/${conversation._id}/read`, {
        method: "PATCH",
        headers
      });

      // Update local unread count
      setUnreadCounts((prev) => ({ ...prev, [conversation._id]: 0 }));

      // Load messages
      const msgPayload = await apiRequest(
        `/api/messages/conversations/${conversation._id}/messages`,
        { headers }
      );
      setMessages(msgPayload.data.messages);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  // When conversations load, check if there's a ?conversation= param to auto-open
  useEffect(() => {
    const conversationId = searchParams?.get("conversation");
    if (!conversationId || conversations.length === 0) {
      return;
    }

    const target = conversations.find((c) => String(c._id) === conversationId);
    if (target && !activeConversation) {
      openConversation(target);
    }
  }, [searchParams, conversations, activeConversation, openConversation]);


  function closeConversation() {
    setActiveConversation(null);
    setMessages([]);
    setBody("");
  }

  // Socket.io for real-time updates
  useEffect(() => {
    if (!activeConversation?._id) {
      return undefined;
    }

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { token }
    });
    socketRef.current = socket;
    socket.emit("conversation:join", activeConversation._id);

    socket.on("message:new", (payload) => {
      if (payload.conversationId === activeConversation._id) {
        setMessages((current) => {
          if (current.some((m) => m._id === payload.message._id)) {
            return current;
          }
          return [...current, payload.message];
        });

        // Update lastMessage in the conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? {
                  ...c,
                  lastMessage: payload.message.body,
                  lastMessageAt: payload.message.createdAt
                }
              : c
          )
        );
      }
    });

    socket.on("message:read", (payload) => {
      if (payload.conversationId === activeConversation._id) {
        setUnreadCounts((prev) => ({ ...prev, [activeConversation._id]: 0 }));
      }
    });

    return () => {
      socket.emit("conversation:leave", activeConversation._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeConversation?._id]);

  async function sendMessage(event) {
    event.preventDefault();

    if (!body.trim() || !activeConversation?._id) {
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const payload = await apiRequest(
        `/api/messages/conversations/${activeConversation._id}/messages`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ body })
        }
      );

      setMessages((current) => {
        if (current.some((m) => m._id === payload.data.message._id)) {
          return current;
        }
        return [...current, payload.data.message];
      });
      setBody("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  }

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = otherParticipant(c, user?._id);
    return (
      c.property?.title?.toLowerCase().includes(q) ||
      other?.name?.toLowerCase().includes(q) ||
      other?.email?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  if (!user || !["tenant", "landlord"].includes(user.role)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0 lg:flex-row lg:h-[calc(100vh-280px)] min-h-[600px] rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
      {/* ── Conversation list sidebar ───────────────────── */}
      <aside className="flex w-full flex-col border-b border-surface-200 lg:w-[380px] lg:border-b-0 lg:border-r">
        {/* Header */}
        <div className="border-b border-surface-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-surface-900">Messages</h2>
              <p className="text-xs text-surface-500">
                {isLoading
                  ? "Loading..."
                  : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}
                {totalUnread > 0 ? (
                  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    {totalUnread} unread
                  </span>
                ) : null}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3.5 py-2 text-xs font-semibold text-surface-600 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:border-surface-300 active:scale-95"
              onClick={loadConversations}
              type="button"
              title="Refresh conversations"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Refresh
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        ) : null}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-3">
              {[1, 2, 3, 4, 5].map((i) => <ConversationSkeleton key={i} />)}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 mb-3">
                <svg className="h-6 w-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-surface-900">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </h3>
              <p className="mt-1 text-xs text-surface-500 max-w-[200px]">
                {searchQuery
                  ? "Try a different search term."
                  : "Start a chat from a property or booking."}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filteredConversations.map((conversation) => {
                const isActive = activeConversation?._id === conversation._id;
                const other = otherParticipant(conversation, user?._id);
                const unread = unreadCounts[conversation._id] || 0;

                return (
                  <button
                    className={`w-full px-4 py-3 text-left transition-all duration-150 border-l-2 ${
                      isActive
                        ? "bg-brand-50/50 border-l-brand-500"
                        : "border-l-transparent hover:bg-surface-50"
                    }`}
                    key={conversation._id}
                    onClick={() => openConversation(conversation)}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`relative shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(conversation._id)}`}>
                        {initials(other?.name)}
                        {unread > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`truncate text-sm ${unread > 0 ? "font-bold text-surface-900" : "font-semibold text-surface-900"}`}>
                            {other?.name || "Unknown"}
                          </h3>
                          {conversation.lastMessageAt && (
                            <span className="shrink-0 text-[10px] text-surface-400">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-500 truncate mt-0.5">
                          {conversation.property?.title || "Property"}
                        </p>
                        {conversation.lastMessage ? (
                          <p className={`mt-1 truncate text-xs ${unread > 0 ? "font-semibold text-surface-700" : "text-surface-500"}`}>
                            {conversation.lastMessage}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs italic text-surface-400">No messages yet</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Active conversation / Chat area ─────────────── */}
      <section className="flex flex-1 flex-col">
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-100 mb-6">
              <svg className="h-10 w-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-surface-900">Your messages</h3>
            <p className="mt-1 text-sm text-surface-500 max-w-sm">
              Select a conversation from the sidebar to start chatting.
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 border-b border-surface-100 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button for mobile */}
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-surface-600 hover:bg-surface-200 transition-colors lg:hidden"
                  onClick={closeConversation}
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(activeConversation._id)}`}>
                  {initials(otherParticipant(activeConversation, user?._id)?.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-surface-900">
                    {otherParticipant(activeConversation, user?._id)?.name || "Unknown"}
                  </h2>
                  <p className="truncate text-xs text-surface-500">
                    {activeConversation.property?.title}
                    {activeConversation.property?.city && ` · ${activeConversation.property.city}`}
                  </p>
                </div>
              </div>
              <button
                className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3.5 py-2 text-xs font-semibold text-surface-600 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:border-surface-300 active:scale-95 lg:inline-flex"
                onClick={closeConversation}
                type="button"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto bg-surface-50/50 px-5 py-5 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 mb-3">
                    <svg className="h-6 w-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-surface-900">No messages yet</p>
                  <p className="mt-1 text-xs text-surface-500">Send the first message to start the conversation.</p>
                </div>
              ) : (
                <>
                  {/* Date separator for today */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 border-t border-surface-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                      Messages
                    </span>
                    <div className="flex-1 border-t border-surface-200" />
                  </div>
                  {messages.map((message) => {
                    const isMine = String(message.sender?._id) === String(user?._id);
                    return (
                      <MessageBubble
                        key={message._id}
                        message={message}
                        isMine={isMine}
                      />
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-surface-100 px-5 py-4">
              <form className="flex items-end gap-3" onSubmit={sendMessage}>
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    className="min-h-[44px] max-h-32 w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50 resize-none"
                    maxLength={2000}
                    onChange={(event) => setBody(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    value={body}
                    rows={1}
                  />
                </div>
                <button
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  disabled={isSending || !body.trim()}
                  type="submit"
                  title="Send message"
                >
                  {isSending ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </form>
              <p className="mt-1.5 text-[10px] text-surface-400 text-center">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
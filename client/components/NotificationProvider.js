"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL, apiRequest } from "../lib/api";
import ToastContainer from "./Toast";
import { useAuth } from "../app/providers";

const NotificationContext = createContext(null);

let toastIdCounter = 0;

function nextToastId() {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}-${Date.now()}`;
}

/**
 * Create a notification entry for the bell dropdown.
 * type: "booking_request" | "booking_approved" | "booking_rejected" | "booking_cancelled" | "message_new"
 */
function createNotification(type, message, linkHref) {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    linkHref,
    read: false,
    createdAt: new Date().toISOString()
  };
}

export function NotificationProvider({ children }) {
  const { isAuthenticated, token, user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const prevSocketRef = useRef(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const addToast = useCallback((message, type = "info") => {
    const id = nextToastId();
    setToasts((current) => [...current.slice(-4), { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message) => addToast(message, "success"),
    [addToast]
  );

  const showError = useCallback(
    (message) => addToast(message, "error"),
    [addToast]
  );

  const showInfo = useCallback(
    (message) => addToast(message, "info"),
    [addToast]
  );

  const showWarning = useCallback(
    (message) => addToast(message, "warning"),
    [addToast]
  );

  // Add a notification to the bell dropdown list
  const addNotification = useCallback((type, message, linkHref) => {
    const entry = createNotification(type, message, linkHref);
    setNotifications((current) => [entry, ...current].slice(0, 50));
  }, []);

  // Mark a single notification as read
  const markNotificationRead = useCallback((id) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    // Sync with server (fire-and-forget)
    if (token) {
      apiRequest(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  }, [token]);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((n) => ({ ...n, read: true }))
    );
    // Sync with server (fire-and-forget)
    if (token) {
      apiRequest("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  }, [token]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    // Sync with server (fire-and-forget)
    if (token) {
      apiRequest("/api/notifications", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  }, [token]);

  // Compute unread count
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Fetch persisted notifications from the server on mount (catches notifications
  // that arrived while the user was logged out)
  useEffect(() => {
    if (!isAuthenticated || !token || !user || !["tenant", "landlord"].includes(user.role)) {
      setNotifications([]);
      setInitialFetchDone(true);
      return;
    }

    async function fetchPersistedNotifications() {
      try {
        const payload = await apiRequest("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const serverNotifs = (payload.data?.notifications || []).map((n) => ({
          id: n._id,
          type: n.type,
          message: n.message,
          linkHref: n.linkHref,
          read: n.read,
          createdAt: n.createdAt
        }));
        setNotifications(serverNotifs);
      } catch (_error) {
        // Silently fail
      } finally {
        setInitialFetchDone(true);
      }
    }

    fetchPersistedNotifications();
  }, [isAuthenticated, token, user]);

  // Poll for unread message count (for badge)
  useEffect(() => {
    if (!isAuthenticated || !token || !user || !["tenant", "landlord"].includes(user.role)) {
      setUnreadMessages(0);
      return;
    }

    async function fetchUnreadCount() {
      try {
        const payload = await apiRequest("/api/messages/conversations/unread-counts", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const counts = payload.data.unreadCounts || {};
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        setUnreadMessages(total);
      } catch (_error) {
        // Silently fail
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token, user]);

  // Socket.io connection for real-time notifications
  const notificationSocket = useMemo(() => {
    if (!isAuthenticated || !token) {
      return null;
    }

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { token }
    });

    socket.on("connect", () => {
      socket.emit("notifications:register", user?._id);
    });

    // New booking request → notify landlord, link to landlord dashboard
    socket.on("notification:booking", (data) => {
      const { type, message } = data;
      addToast(message, type || "info");

      if (user?.role === "landlord") {
        addNotification("booking_request", message, "/landlord");
      } else if (user?.role === "tenant") {
        addNotification("booking_" + (type === "success" ? "approved" : "rejected"), message, "/tenant");
      }
    });

    // General notifications
    socket.on("notification:general", (data) => {
      const { message, type } = data;
      addToast(message, type || "info");
    });

    // Real-time unread message count update
    socket.on("message:new", (payload) => {
      if (String(payload.message?.sender?._id) !== String(user?._id)) {
        setUnreadMessages((prev) => prev + 1);
        const otherName = payload.message?.sender?.name || "Someone";
        addToast(`New message from ${otherName}`, "info");
        addNotification("message_new", `New message from ${otherName}`, "/messages");
      }
    });

    return socket;
  }, [isAuthenticated, token, user?._id, user?.role, addToast, addNotification]);

  // Cleanup socket on change
  useMemo(() => {
    if (prevSocketRef.current && prevSocketRef.current !== notificationSocket) {
      prevSocketRef.current.disconnect();
    }
    prevSocketRef.current = notificationSocket;
  }, [notificationSocket]);

  const value = useMemo(
    () => ({
      addToast,
      removeToast,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      notificationSocket,
      unreadMessages,
      // Notification bell data
      notifications,
      unreadNotificationCount,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications
    }),
    [
      addToast, removeToast, showSuccess, showError, showInfo, showWarning,
      notificationSocket, unreadMessages,
      notifications, unreadNotificationCount, addNotification,
      markNotificationRead, markAllNotificationsRead, clearNotifications
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer
        onDismiss={removeToast}
        toasts={toasts}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider.");
  }

  return context;
}
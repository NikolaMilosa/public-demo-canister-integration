import { useState, useEffect, useRef, useCallback } from "react";
import { chatBackend } from "./actor";

const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F0B27A", "#82E0AA", "#F1948A", "#AED6F1", "#D7BDE2",
];

function LoginScreen({ onJoin }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Group Chat</h1>
        <p>Pick a name to join the conversation</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <button type="submit" disabled={!name.trim()}>
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ message, isOwn }) {
  const color = USER_COLORS[Number(message.color) % USER_COLORS.length];

  return (
    <div className={`message ${isOwn ? "own" : "other"}`}>
      {!isOwn && (
        <span className="message-name" style={{ color }}>
          {message.name}
        </span>
      )}
      <div
        className="message-bubble"
        style={
          isOwn
            ? {}
            : { borderLeftColor: color }
        }
      >
        {message.content}
      </div>
    </div>
  );
}

function ChatScreen({ username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const nextIdRef = useRef(0n);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const addNewMessages = useCallback((newMsgs) => {
    if (newMsgs.length === 0) return;
    setMessages((prev) => {
      const filtered = newMsgs.filter((m) => m.id >= nextIdRef.current);
      if (filtered.length === 0) return prev;
      nextIdRef.current = filtered[filtered.length - 1].id + 1n;
      return [...prev, ...filtered];
    });
  }, []);

  // Check if user is scrolled near the bottom
  const checkAutoScroll = useCallback(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const threshold = 100;
    shouldAutoScrollRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Scroll to bottom when new messages arrive (if near bottom)
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initial load + polling
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const newMsgs = await chatBackend.getMessages(nextIdRef.current);
        if (active) addNewMessages(newMsgs);
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addNewMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    shouldAutoScrollRef.current = true;

    try {
      const msg = await chatBackend.sendMessage(username, text);
      addNewMessages([msg]);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <h2>Group Chat</h2>
        <span className="header-user">Chatting as <strong>{username}</strong></span>
      </div>

      <div
        className="messages-area"
        ref={messagesAreaRef}
        onScroll={checkAutoScroll}
      >
        {messages.length === 0 && (
          <div className="empty-state">
            No messages yet. Say something!
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={Number(msg.id)}
            message={msg}
            isOwn={msg.name === username}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!input.trim() || sending}>
          Send
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState(null);

  if (!username) {
    return <LoginScreen onJoin={setUsername} />;
  }

  return <ChatScreen username={username} />;
}

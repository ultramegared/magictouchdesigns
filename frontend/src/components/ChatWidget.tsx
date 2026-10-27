import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./ChatWidget.css";

type ChatMessage = {
    role: "user" | "assistant";
    text: string;
};

const WHATSAPP_URL = "https://wa.me/13467603007";
const SHOP_URL = "https://www.jqydesigns.com";

const GREETING =
    "Hi! 👋 I'm the JQYDesigns assistant. Ask me about our personalized mugs, prices, shipping, or how to order — I'm happy to help!";

const OFFLINE_REPLY =
    "Sorry, I couldn't reach the assistant just now. You can message us on WhatsApp at 346-760-3007 (https://wa.me/13467603007) and we'll help you right away.";

const QUICK_REPLIES = [
    { label: "Price", question: "How much does a personalized mug cost?" },
    { label: "How to order", question: "How do I place an order?" },
    { label: "Shipping & pickup", question: "What are the shipping and pickup options?" },
    { label: "Turnaround time", question: "How long does my order take?" },
];

// Renders plain-text replies with bare URLs turned into clickable links.
function renderMessageText(text: string) {
    const parts = text.split(/(https?:\/\/[^\s)]+)/g);
    return parts.map((part, index) => {
        if (/^https?:\/\//.test(part)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noreferrer"
                    className="jqy-chat-link"
                >
                    {part}
                </a>
            );
        }
        return <span key={index}>{part}</span>;
    });
}

function ChatWidget() {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: GREETING }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = messagesRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading, open]);

    // The assistant serves storefront visitors only, never the admin panel.
    if (pathname === "/admin-login" || pathname.startsWith("/admin")) return null;

    const sendMessage = async (rawText: string) => {
        const text = rawText.trim();
        if (!text || loading) return;
        setMessages((prev) => [...prev, { role: "user", text }]);
        setInput("");
        setLoading(true);
        try {
            const result = await apiRequest<{ status: string; reply: string }>("/api/chat", {
                method: "POST",
                body: JSON.stringify({ message: text }),
            });
            const reply = result.reply?.trim() || OFFLINE_REPLY;
            setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", text: OFFLINE_REPLY }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void sendMessage(input);
    };

    return (
        <div className="jqy-chat-root">
            {open && (
                <div className="jqy-chat-panel" role="dialog" aria-label="JQYDesigns assistant chat">
                    <div className="jqy-chat-header">
                        <div>
                            <strong>JQYDesigns Assistant</strong>
                            <span>Personalized mugs · Katy, TX</span>
                        </div>
                        <button
                            type="button"
                            className="jqy-chat-close"
                            aria-label="Close chat"
                            onClick={() => setOpen(false)}
                        >
                            ×
                        </button>
                    </div>

                    <div className="jqy-chat-messages" ref={messagesRef}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`jqy-chat-bubble jqy-chat-bubble--${message.role}`}
                            >
                                {renderMessageText(message.text)}
                            </div>
                        ))}
                        {loading && (
                            <div className="jqy-chat-bubble jqy-chat-bubble--assistant jqy-chat-typing">
                                Typing…
                            </div>
                        )}
                    </div>

                    <div className="jqy-chat-chips">
                        {QUICK_REPLIES.map((chip) => (
                            <button
                                key={chip.label}
                                type="button"
                                disabled={loading}
                                onClick={() => void sendMessage(chip.question)}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    <form className="jqy-chat-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            maxLength={1000}
                            placeholder="Ask about mugs, prices, shipping…"
                            aria-label="Type your message"
                            disabled={loading}
                            onChange={(event) => setInput(event.target.value)}
                        />
                        <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
                            ➤
                        </button>
                    </form>

                    <div className="jqy-chat-footer">
                        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                            Order on WhatsApp
                        </a>
                        <span>
                            or browse <a href={SHOP_URL} target="_blank" rel="noreferrer">jqydesigns.com</a>
                        </span>
                    </div>
                </div>
            )}

            <button
                type="button"
                className="jqy-chat-button"
                aria-label={open ? "Close chat" : "Open chat"}
                onClick={() => setOpen((prev) => !prev)}
            >
                {open ? (
                    <span aria-hidden="true">×</span>
                ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 3C7.03 3 3 6.58 3 11c0 2.45 1.22 4.64 3.15 6.08-.1 1.08-.55 2.72-1.65 3.92 0 0 2.9-.15 5.23-1.42A8.6 8.6 0 0 0 12 19c4.97 0 9-3.58 9-8s-4.03-8-9-8Z" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default ChatWidget;

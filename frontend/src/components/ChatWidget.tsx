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

// Idle-timeout: after 5 minutes with no user reply, the bot gently checks in;
// if there is still no reply 3 minutes after the check-in, it says a warm
// farewell and collapses the panel (chat history is never deleted).
const IDLE_CHECK_MS = 5 * 60 * 1000;
const FAREWELL_AFTER_CHECK_MS = 3 * 60 * 1000;
const FAREWELL_CLOSE_MS = 4000;
const IDLE_TICK_MS = 15 * 1000;
const TYPING_QUIET_MS = 3000;

const IDLE_CHECK_IN: Record<"es" | "en", string> = {
    es: "¿Sigues por aquí? 😊 Con gusto te sigo ayudando con tu consulta. ¿Seguimos o damos por finalizado el chat por ahora?",
    en: "Still here? 😊 I'm happy to keep helping with your question. Shall we keep going, or close the chat for now?",
};

const IDLE_FAREWELL: Record<"es" | "en", string> = {
    es: "¡Gracias por visitarnos! Fue un gusto atenderte. Cuando quieras, aquí estamos para ayudarte con tu taza personalizada. ¡Que tengas un lindo día! ☕",
    en: "Thanks for visiting! It was a pleasure helping you. Whenever you like, we're here to help with your personalized mug. Have a lovely day! ☕",
};

// Small heuristic for language-matching the idle messages: Spanish markers
// (inverted punctuation, accents, ñ) or common Spanish words. Defaults to English.
function detectSpanish(text: string): boolean {
    if (/[¿¡áéíóúñü]/i.test(text)) return true;
    return /\b(hola|gracias|quiero|quieres|cuesta|cuestan|precio|precios|taza|tazas|pedido|pedidos|env[ií]o|cu[aá]nto|cu[aá]l|c[oó]mo|d[oó]nde|cu[aá]ndo|personalizada|personalizado|personalizar|ayuda|comprar|hacer|qué)\b/i.test(
        text,
    );
}

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

    // Idle-timeout bookkeeping (refs so the interval tick never reads stale state).
    const lastUserActivityRef = useRef<number | null>(null);
    const lastTypingRef = useRef<number>(0);
    const langRef = useRef<"es" | "en">("en");
    const hasUserMessageRef = useRef(false);
    const idleCheckedInRef = useRef(false);
    const checkInAtRef = useRef<number | null>(null);
    const farewellSentRef = useRef(false);
    const loadingRef = useRef(false);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    // Any user activity (send or typing) restarts the idle clock and cancels
    // a pending check-in/farewell cycle.
    const noteUserActivity = () => {
        lastUserActivityRef.current = Date.now();
        lastTypingRef.current = Date.now();
        idleCheckedInRef.current = false;
        checkInAtRef.current = null;
        farewellSentRef.current = false;
    };

    useEffect(() => {
        const el = messagesRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading, open]);

    // Reopening the panel counts as activity: restart the idle clock so the
    // bot never greets a returning visitor with an instant check-in.
    useEffect(() => {
        if (open) {
            lastUserActivityRef.current = Date.now();
            idleCheckedInRef.current = false;
            checkInAtRef.current = null;
            farewellSentRef.current = false;
        }
    }, [open ]);

    // Idle tick: only while the panel is open and the visitor has written at
    // least once. Never fires while a bot reply is pending or the visitor is
    // typing, and never deletes history — closing only collapses the panel.
    useEffect(() => {
        if (!open) return;
        const tick = () => {
            if (!hasUserMessageRef.current || farewellSentRef.current) return;
            if (loadingRef.current) return;
            if (Date.now() - lastTypingRef.current < TYPING_QUIET_MS) return;
            const last = lastUserActivityRef.current;
            if (last === null) return;
            const now = Date.now();
            if (!idleCheckedInRef.current) {
                if (now - last >= IDLE_CHECK_MS) {
                    setMessages((prev) => [...prev, { role: "assistant", text: IDLE_CHECK_IN[langRef.current] }]);
                    idleCheckedInRef.current = true;
                    checkInAtRef.current = now;
                }
            } else if (
                checkInAtRef.current !== null &&
                now - checkInAtRef.current >= FAREWELL_AFTER_CHECK_MS
            ) {
                const farewellAt = now;
                farewellSentRef.current = true;
                setMessages((prev) => [...prev, { role: "assistant", text: IDLE_FAREWELL[langRef.current] }]);
                window.setTimeout(() => {
                    // If the visitor came back and typed meanwhile, stay open.
                    if (
                        lastUserActivityRef.current !== null &&
                        lastUserActivityRef.current > farewellAt
                    ) {
                        return;
                    }
                    setOpen(false);
                }, FAREWELL_CLOSE_MS);
            }
        };
        const id = window.setInterval(tick, IDLE_TICK_MS);
        return () => window.clearInterval(id);
    }, [open ]);

    // The assistant serves storefront visitors only, never the admin panel.
    if (pathname === "/admin-login" || pathname.startsWith("/admin")) return null;

    const sendMessage = async (rawText: string) => {
        const text = rawText.trim();
        if (!text || loading) return;
        langRef.current = detectSpanish(text) ? "es" : "en";
        hasUserMessageRef.current = true;
        noteUserActivity();
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
                            onChange={(event) => {
                                setInput(event.target.value);
                                noteUserActivity();
                            }}
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

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import { apiRequest } from "../../services/api";

interface WhatsappConversation {
    sender: string;
    lastAt: string;
    lastBody: string;
    lastDirection: string;
    inboundCount: number;
    totalCount: number;
}

interface WhatsappWebhookEvent {
    id: number;
    eventPhoneId: string;
    savedPhoneId: string;
    matched: boolean;
    messageCount: number;
    outcome: string;
    createdAt: string;
}

interface WhatsappMessage {
    id: number;
    sender: string;
    direction: string;
    messageType: string;
    body: string;
    autoReply: boolean;
    createdAt: string;
}

export default function WhatsAppInbox() {
    const [conversations, setConversations] = useState<WhatsappConversation[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [messages, setMessages] = useState<WhatsappMessage[]>([]);
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<WhatsappWebhookEvent[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadConversations = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await apiRequest<{ conversations: WhatsappConversation[] }>(
                `/api/admin/marketing/social/whatsapp/inbox?_=${Date.now()}`
            );
            setConversations(result.conversations || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar la bandeja.");
        } finally {
            setLoading(false);
        }
        try {
            const diag = await apiRequest<{ events: WhatsappWebhookEvent[] }>(
                `/api/admin/marketing/social/whatsapp/diagnostics?_=${Date.now()}`
            );
            setEvents(diag.events || []);
        } catch {
            // Diagnostics are best-effort; the inbox still works without them.
        }
    }, []);

    const loadMessages = useCallback(async (sender: string) => {
        setLoadingMessages(true);
        setError("");
        try {
            const result = await apiRequest<{ messages: WhatsappMessage[] }>(
                `/api/admin/marketing/social/whatsapp/inbox/${encodeURIComponent(sender)}?_=${Date.now()}`
            );
            setMessages(result.messages || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron cargar los mensajes.");
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    const selectConversation = (sender: string) => {
        setSelected(sender);
        setReply("");
        setNotice("");
        void loadMessages(sender);
    };

    const sendReply = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        setError("");
        setNotice("");
        try {
            await apiRequest("/api/admin/marketing/social/whatsapp/reply", {
                method: "POST",
                body: JSON.stringify({ to: selected, text: reply }),
            });
            setReply("");
            setNotice("Mensaje enviado.");
            await loadMessages(selected);
            await loadConversations();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="section">
            <div className="section-title">
                <div className="integration-head">
                    <div>
                        <h2>WhatsApp Inbox · mensajes de clientes</h2>
                        <p>Cuando un cliente escribe, su mensaje queda aquí y recibe la bienvenida automática. Responde desde esta bandeja o desde la app.</p>
                    </div>
                    <button className="btn" onClick={() => void loadConversations()} disabled={loading}>
                        <RefreshCw size={14} />{loading ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>
            </div>
            {error && <div className="notice" role="status">{error}</div>}
            {notice && <div className="notice" role="status">{notice}</div>}
            <article className="card" style={{ padding: 16 }}>
                {conversations.length === 0 ? (
                    <div className="notice">
                        {loading
                            ? "Cargando conversaciones..."
                            : "Aún no hay mensajes. Cuando un cliente escriba a tu número de WhatsApp, aparecerá aquí y recibirá la bienvenida automática."}
                    </div>
                ) : (
                    <div className="quick">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.sender}
                                type="button"
                                className="btn"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 2,
                                    width: "100%",
                                    textAlign: "left",
                                    marginBottom: 8,
                                }}
                                onClick={() => selectConversation(conversation.sender)}
                            >
                                <span>
                                    <MessageCircle size={13} /> +{conversation.sender}
                                </span>
                                <span style={{ opacity: 0.8 }}>
                                    {conversation.lastDirection === "out" ? "Tú: " : ""}
                                    {conversation.lastBody || "(sin texto)"}
                                </span>
                                <small>
                                    {conversation.lastAt
                                        ? new Date(conversation.lastAt).toLocaleString()
                                        : ""}{" "}
                                    · {conversation.totalCount} mensajes
                                </small>
                            </button>
                        ))}
                    </div>
                )}
            </article>
            <article className="card" style={{ padding: 16, marginTop: 10 }}>
                <h3>Diagnóstico webhook · últimos eventos</h3>
                <p style={{ opacity: 0.8 }}>
                    Cada evento que Meta entrega queda aquí, aunque se ignore. Si mandas un mensaje y no aparece ninguna fila nueva, Meta no lo está entregando. Si aparece con &quot;No coincide&quot;, el ID del evento no es el número guardado en el panel.
                </p>
                {events.length === 0 ? (
                    <div className="notice">Sin eventos registrados todavía.</div>
                ) : (
                    <div className="quick">
                        {events.map((event) => (
                            <div className="notice" key={event.id}>
                                <b>
                                    {event.createdAt
                                        ? new Date(event.createdAt).toLocaleString()
                                        : ""}
                                </b>{" "}
                                · {event.messageCount} mensaje(s) · ¿Coincide?{" "}
                                {event.matched ? "Sí" : "No"} ·{" "}
                                {event.outcome === "processed"
                                    ? "Procesado"
                                    : event.outcome === "skipped_phone_mismatch"
                                      ? "Ignorado: el ID no coincide con el guardado"
                                      : event.outcome === "no_connection"
                                        ? "Sin conexión guardada"
                                        : event.outcome}
                                <div>
                                    ID recibido: {event.eventPhoneId || "(vacío)"} · ID guardado:{" "}
                                    {event.savedPhoneId || "(vacío)"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </article>
            {selected && (
                <article className="card" style={{ padding: 16, marginTop: 10 }}>
                    <div className="integration-head">
                        <h3>Conversación +{selected}</h3>
                        <button className="btn" onClick={() => void loadMessages(selected)} disabled={loadingMessages}>
                            <RefreshCw size={14} />{loadingMessages ? "Cargando..." : "Actualizar"}
                        </button>
                    </div>
                    <div className="quick" style={{ marginTop: 12 }}>
                        {messages.length === 0 ? (
                            <div className="notice">
                                {loadingMessages ? "Cargando mensajes..." : "Sin mensajes en esta conversación."}
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div className="notice" key={message.id}>
                                    <b>
                                        {message.direction === "in"
                                            ? "Cliente"
                                            : message.autoReply
                                              ? "Tú 🤖 auto"
                                              : "Tú"}
                                    </b>{" "}
                                    ·{" "}
                                    {message.createdAt
                                        ? new Date(message.createdAt).toLocaleString()
                                        : ""}
                                    <div style={{ whiteSpace: "pre-wrap" }}>
                                        {message.body || `(${message.messageType || "mensaje"} sin texto)`}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <textarea
                            className="textarea"
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            placeholder="Escribe tu respuesta..."
                            rows={3}
                        />
                        <div className="actions" style={{ marginTop: 8 }}>
                            <button className="btn primary" onClick={() => void sendReply()} disabled={sending || !reply.trim()}>
                                <Send size={14} />{sending ? "Enviando..." : "Enviar por WhatsApp"}
                            </button>
                        </div>
                    </div>
                </article>
            )}
        </section>
    );
}

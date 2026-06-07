// Импорт React хуки (функции для управления состоянием и эффектами)
import { useEffect, useState, useRef } from "react";
// useParams — для получения параметров из URL (например, userId из /chat/:userId)
// useNavigate — для программной навигации (переход на другие страницы)
import useAuthStore from "../store/authStore";
import {
  getChatMessages,
  sendMessage,
  getUserProfile,
  updateMessage,
  deleteMessage as deleteMessageApi,
} from "../services/api";
import signalRService from "../services/signalr";

export default function ChatWindow({ userId }) {
  const { user } = useAuthStore(); // Достает текущего пользователя из глобального хранилища

  //#region Локальное состояние компонента
  const [messages, setMessages] = useState([]); // Создает переменную состояния и функцию для ее изменения. Message - массив сообщений в чате, setMessages - функция для обновления messages

  const [recipient, setRecipient] = useState(null); // recipient - данные собеседника

  const [newMessage, setNewMessage] = useState(""); // newMessage - текст нового сообщения

  const [loading, setLoading] = useState(true); // Идет ли загрузка данных

  const [sending, setSending] = useState(false); // Идет ли отправка сообщения

  const [isTyping, setIsTyping] = useState(false); // Печатает ли собеседник

  const messagesEndRef = useRef(null); // Создает ссылку на DOM элемент

  const typingTimeout = useRef(null); // Для debounce индикатора печати

  const [contextMenu, setContextMenu] = useState(null); // {x, y, messageId}
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  const groupMessagesByDate = (messages) => {
    const groups = [];
    const dates = new Set();

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      const dateKey = messageDate.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const now = new Date();
      const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

      let displayDate = dateKey;
      if (diffDays === 0) displayDate = "Сегодня";
      else if (diffDays === 1) displayDate = "Вчера";

      if (!dates.has(dateKey)) {
        dates.add(dateKey);
        groups.push({ type: "date", date: displayDate, key: dateKey });
      }

      groups.push({ type: "message", data: message });
    });

    return groups;
  };

  const startEditing = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
  };

  const saveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      const result = await updateMessage(editingMessage.id, editText);

      setMessages((prev) =>
        prev.map((msg) => (msg.id === editingMessage.id ? result.data : msg)),
      );

      setEditingMessage(null);
      setEditText("");
    } catch (err) {
      console.error("Ошибка редактирования:", err);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault(); // Отключение стандартного контекстного меню браузера

    const messageDate = new Date(message.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = messageDate >= today;
    const isMyMessage = message.senderId === user.id;

    if (!isMyMessage || !isToday) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: message.id,
      message: message,
    });
  };
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleEditFromMenu = () => {
    if (contextMenu?.message) {
      startEditing(contextMenu.message);
      closeContextMenu();
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await deleteMessageApi(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      closeContextMenu();
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Ошибка удаления сообщения");
    }
  };

  //#endregion

  //#region загрузка данных при открытии чата
  // useEffect() - выполняет код при монтировании компонента
  useEffect(() => {
    // Асинхронная функция для загрузки данных
    const fetchData = async () => {
      try {
        // Загрузка профиля собеседника (имя, email, статус)
        const recipientData = await getUserProfile(userId);
        setRecipient(recipientData.user);

        // Загрузка истории сообщений с этим пользователем
        const messageData = await getChatMessages(userId);
        setMessages(messageData.messages);

        //Отключение индикатора загрузки
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    // Вызов функции загрузки
    fetchData();

    // Подпска на SignalR события

    // Слушаем событие "ReceiveMessage" (новое сообщение от собеседника)
    signalRService.onReceiveMessage((message) => {
      // Проеряем, что сообщение от текущего собеседника
      if (message.senderId === userId) {
        // Добавляем новое сообщение в массив messages
        // prevMessages - предыдущее состояние массива
        // [...prevMessages, message] - создаем новый массив со старыми + новое сообщение
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    // Слушаем событие "UserTyping"
    signalRService.onUserTyping((data) => {
      // Обновляем состояние isTyping
      setIsTyping(data.isTyping);

      // Если собеседник печатает, через 3 секунды скрываем индикатор
      if (data.isTyping) {
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Cleanup - вызывается при размонитровании компонента (когда пользователь уходит с этой страницы)
    return () => {
      // Отписка от событий
    };
  }, [userId]);
  //#endregion

  //#region Автоскролл вниз при новых сообщениях и иные обработчки
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  //#endregion

  //#region Отправка сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const data = await sendMessage(userId, newMessage);

      // Добавление нового сообщения в локальный state
      setMessages([...messages, data.data]);

      setNewMessage("");
    } catch (err) {
      console.error("Ошибка отправки:", err);
      alert("Ошибка отправки сообщения");
    } finally {
      setSending(false);
    }
  };

  //#endregion

  //#region Индикатор "ПЕЧАТАЕТ..."
  const handleTyping = () => {
    // Отправка сообщения на сервер, что пользователь набирает сообщение
    signalRService.sendTyping(userId, true);

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      signalRService.sendTyping(userId, false);
    }, 1000);
  };

  //#endregion

  //#region Форматирование времени
  const formatTime = (date) => {
    if (!date) return "";

    // Универсальный парсинг
    let d;
    if (typeof date === "string") {
      // Добавляем Z если нет
      if (date.includes("T") && !date.endsWith("Z")) {
        d = new Date(date + "Z");
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date);
    }

    // Если дата невалидная - показываем пустую строку
    if (isNaN(d.getTime())) return "";

    const now = new Date();

    if (d.getDay() == now.getDay()) {
      return d.toLocaleString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return d.toLocaleString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }
  };

  //#endregion

  //#region Отображение индикатора загрузки
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Загрузка...</h2>
      </div>
    );
  }

  //#endregion

  //#region Основной рендер (html разметка)
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.recipientInfo}>
          <div style={styles.avatarSmall}>
            {recipient?.avatar ? (
              <img
                src={recipient.avatar}
                alt={recipient.name}
                style={styles.avatarImg}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {recipient?.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <div style={styles.recipientName}>{recipient?.name}</div>
            <div style={styles.recipientStatus}>
              {recipient?.status === "online" ? "🟢 Онлайн" : "⚫ Офлайн"}
            </div>
          </div>
        </div>
      </div>
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyChat}>
            <p>Начните диалог с {recipient?.name}</p>
          </div>
        ) : (
          (() => {
            const groupedMessages = groupMessagesByDate(messages);
            return groupedMessages.map((item) =>
              item.type === "date" ? (
                // 🔥 РАЗДЕЛИТЕЛЬ ДАТЫ
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "20px 0",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#e5e5e5",
                      color: "#666",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {item.date}
                  </div>
                </div>
              ) : (
                (() => {
                  const msg = item.data;
                  const isMyMessage = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        ...styles.messageWrapper,
                        justifyContent: isMyMessage ? "flex-end" : "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      {editingMessage?.id === msg.id ? (
                        // РЕЖИМ РЕДАКТИРОВАНИЯ
                        <div
                          style={{
                            ...styles.messageBubble,
                            maxWidth: "70%",
                            backgroundColor: "#fff3cd",
                            border: "2px solid #ffc107",
                          }}
                        >
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            style={{
                              width: "100%",
                              minHeight: "40px",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              padding: "8px",
                              resize: "vertical",
                              fontSize: "15px",
                              fontFamily: "inherit",
                              outline: "none",
                            }}
                            autoFocus
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginTop: "8px",
                            }}
                          >
                            <button
                              onClick={saveEdit}
                              style={{
                                background: "#28a745",
                                color: "white",
                                border: "none",
                                padding: "4px 12px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer",
                                flex: 1,
                              }}
                            >
                              ✅ Сохранить
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                background: "#6c757d",
                                color: "white",
                                border: "none",
                                padding: "4px 12px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              ❌ Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 🔥 ОБЫЧНОЕ СООБЩЕНИЕ
                        <div
                          style={{
                            ...styles.messageBubble,
                            backgroundColor: isMyMessage
                              ? "#667eea"
                              : "#e9ecef",
                            color: isMyMessage ? "white" : "#333",
                            maxWidth: "70%",
                            borderTopLeftRadius: isMyMessage ? "18px" : "4px",
                            borderTopRightRadius: isMyMessage ? "4px" : "18px",
                            borderBottomLeftRadius: "18px",
                            borderBottomRightRadius: "18px",
                          }}
                          onContextMenu={(e) => handleContextMenu(e, msg)}
                        >
                          <div style={styles.messageText}>{msg.text}</div>

                          {/* 🔥 НОВЫЙ ФУТЕР */}

                          <div>
                            <div
                              style={{
                                ...styles.messageTime,
                                textAlign: isMyMessage ? "right" : "left",
                                marginTop: "4px",
                                display: "flex",
                                justifyContent: isMyMessage
                                  ? "flex-end"
                                  : "flex-start",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span style={{ fontSize: "11px" }}>
                                {formatTime(msg.createdAt)}
                              </span>

                              {msg.isEdited && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: isMyMessage
                                      ? "rgba(255,255,255,0.6)"
                                      : "rgba(0,0,0,0.5)",
                                    fontStyle: "italic",
                                  }}
                                >
                                  отр. {formatTime(msg.editedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ),
            );
          })()
        )}

        {isTyping && (
          <div style={styles.typingIndicator}>
            {recipient?.name} печатает...
          </div>
        )}

        {contextMenu && (
          <div
            style={{
              position: "fixed",
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
              padding: 0,
              zIndex: 10000,
              minWidth: "160px",
            }}
          >
            <button onClick={handleEditFromMenu} style={styles.menuButtonStyle}>
              ✏️ Редактировать
            </button>
            <button
              onClick={() => deleteMessage(contextMenu.messageId)}
              style={styles.menuButtonStyle}
            >
              🗑️ Удалить
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Введите сообщение..."
          style={styles.input}
          disabled={sending}
        />
        <button
          type="submit"
          style={styles.sendBtn}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? "⏳" : "📤"}
        </button>
      </form>
    </div>
  );
}
//#endregion

//#region Стили
const styles = {
  menuButtonStyle: {
    display: "block",
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    textAlign: "left",
    fontSize: "14px",
    cursor: "pointer",
    color: "#333",
  },

  container: {
    display: "flex",
    flexDirection: "column", // Элементы расположены вертикально
    height: "100vh", // 100% высоты экрана
    backgroundColor: "#f0f2f5",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  header: {
    backgroundColor: "#667eea",
    color: "white",
    padding: "15px 20px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  backBtn: {
    backgroundColor: "transparent",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  recipientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  avatarSmall: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    color: "#667eea",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
    fontWeight: "bold",
  },
  recipientName: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  recipientStatus: {
    fontSize: "13px",
    opacity: 0.9,
  },
  messagesContainer: {
    flex: 1, // Занимает всё доступное пространство
    overflowY: "auto", // Вертикальная прокрутка
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  emptyChat: {
    textAlign: "center",
    color: "#999",
    marginTop: "50px",
    fontSize: "16px",
  },
  messageWrapper: {
    display: "flex",
    width: "100%",
    marginBottom: "8px", // Отступ между сообщениями
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: "18px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
    position: "relative",
  },
  messageText: {
    fontSize: "15px",
    lineHeight: "1.4",
    wordWrap: "break-word",
    marginBottom: "2px",
  },
  messageTime: {
    fontSize: "11px",
    opacity: 0.7,
  },
  typingIndicator: {
    fontSize: "14px",
    color: "#666",
    fontStyle: "italic",
    marginLeft: "10px",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
    padding: "15px 20px",
    backgroundColor: "white",
    borderTop: "1px solid #ddd",
  },
  input: {
    flex: 1, // Занимает всё доступное пространство
    padding: "12px 16px",
    border: "2px solid #e0e0e0",
    borderRadius: "25px",
    fontSize: "15px",
    outline: "none",
  },
  sendBtn: {
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    padding: "10px 25px",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
    transition: "background 0.3s",
  },
  dateSeparator: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "20px 0",
    width: "100%",
  },
  dateLabel: {
    backgroundColor: "#e5e5e5",
    color: "#666",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
};
//#endregion

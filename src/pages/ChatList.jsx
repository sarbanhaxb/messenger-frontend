import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getChats } from "../services/api";
import signalRService from "../services/signalr";
import "../styles/ChatList.css";

export default function ChatList() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Загрузка списка чатов
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await getChats();
        setChats(data.chats);
        setLoading(false);
      } catch (err) {
        console.error("Ошибка загрузки чатов:", err);
        setLoading(false);
      }
    };

    fetchChats();

    // Подписка на изменение статусов через SignalR
    signalRService.onUserStatusChange((data) => {
      // Обновление статуса пользователя в списке чатов
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.user.id === data.userId
            ? { ...chat, user: { ...chat.user, status: data.status } }
            : chat,
        ),
      );
    });

    // Подписка на новые сообщения
    signalRService.onReceiveMessage((message) => {
      setChats((prevChats) => {
        // Поиск чата с отправителем сообщения
        const chatIndex = prevChats.findIndex(
          (chat) => chat.user.id === message.senderId,
        );

        if (chatIndex !== -1) {
          // Обновление существующего чата
          const updatedChats = [...prevChats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: {
              id: message.id,
              text: message.text,
              senderId: message.senderId,
              createdAt: message.createdAt,
              isRead: message.isRead,
            },
            updatedAt: message.createdAt,
          };

          // Сортировка чата по времени последнего сообщения
          return updatedChats.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
          );
        }

        return prevChats;
      });
    });
  }, []);

  // Открыть чат с пользователем
  const openChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  // Выход из системы
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Форматирование времени
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Если вчера
    const diff = now - date;
    if (diff < 86400000 * 2) {
      return "вчера";
    }

    // Если в этом году - показываем дату без года

    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });
    }

    // Иначе полная дата
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Получение preview последнего сообщения
  const getMessagePreview = (chat) => {
    if (!chat.lastMessage) {
      return (
        <span style={{ color: "var(--text-muted", fontStyle: "italic" }}>
          Нет сообщений
        </span>
      );
    }

    const msg = chat.lastMessage;
    const isMyMessage = msg.senderId === user?.id;
    const prefix = isMyMessage ? "Вы: " : "";
    const text =
      msg.text.length > 35 ? msg.text.substring(0, 35) + "..." : msg.text;

    return (
      <>
        {isMyMessage && (
          <span style={{ color: "var(--primary-color)", marginRight: "4px" }}>
            {msg.isRead ? "✓✓" : "✓"}
          </span>
        )}
        <span style={{ color: "var(--text-secondary)" }}>
          {prefix}
          {text}
        </span>
      </>
    );
  };

  // Фильтрация чатов по поиску
  const filteredChats = chats.filter(
    (chat) =>
      chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="container">
        <div className="sidebar">
          <div style={{ padding: "40px", textAlign: "center" }}>
            Загрузка...
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="container">
      {/* БОКОВАЯ ПАНЕЛЬ */}
      <div className="sidebar slide-in">
        {/* Шапка */}
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>

        {/* Поиск */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Список чатов */}
        <div className="chats-list">
          {filteredChats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">
                {chats.length === 0 ? "Нет активных чатов" : "Чатов не найдено"}
              </div>
              <div className="empty-state-subtext">
                {chats.length === 0
                  ? "Начните диалог с пользователем"
                  : "Попробуйте изменить поисковый запрос"}
              </div>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.chatId}
                className="chat-item fade-in"
                onClick={() => openChat(chat.user.id)}
              >
                <div className="chat-avatar">
                  {chat.user.avatar ? (
                    <img src={chat.user.avatar} alt={chat.user.name} />
                  ) : (
                    chat.user.name.charAt(0).toUpperCase()
                  )}
                  <span
                    className={`online-indicator ${
                      chat.user.status === "online" ? "online" : "offline"
                    }`}
                  />
                </div>

                <div className="chat-info">
                  <div className="chat-header">
                    <span className="chat-name">{chat.user.name}</span>
                    <span className="chat-time">
                      {formatTime(chat.lastMessage?.createdAt)}
                    </span>
                  </div>
                  <div className="chat-preview truncate">
                    {getMessagePreview(chat)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

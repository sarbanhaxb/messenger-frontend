import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getChats, getAllUsers } from "../services/api";
import signalRService from "../services/signalr";
import "../styles/ChatList.css";

export default function ChatList() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Загрузка списка чатов
  useEffect(() => {
    const fetchChats = async () => {
      try {
        // Загрузка чатов
        const chatsData = await getChats();
        setChats(chatsData.chats);

        // Загрузка всех пользователей
        const usersData = await getAllUsers();
        setAllUsers(usersData.users);
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
        } else{
          fetchChats();
          return prevChats;
        }
      });
    });
  });

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
  // Получаем ID пользователей, с которыми уже есть чаты
  const userIdsWithChats = chats.map((chat) => chat.user.id);

  // Фильтруем пользователей БЕЗ чатов
  const usersWithoutChats = allUsers.filter(
    (user) => !userIdsWithChats.includes(user.id),
  );

  // Фильтрация чатов по поиску
  const filteredChats = chats.filter(
    (chat) =>
      chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Фильтрация пользователей без чатов по поиску
  const filteredUsersWithoutChats = usersWithoutChats.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
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
          {/* Если ничего не найдено */}
          {filteredChats.length === 0 &&
          filteredUsersWithoutChats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">
                {chats.length === 0 && allUsers.length === 0
                  ? "Нет пользователей"
                  : "Ничего не найдено"}
              </div>
              <div className="empty-state-subtext">
                Попробуйте изменить поисковый запрос
              </div>
            </div>
          ) : (
            <>
              {/* СЕКЦИЯ 1: ЧАТЫ (с историей сообщений) */}
              {filteredChats.length > 0 && (
                <>
                  {filteredChats.map((chat) => (
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
                  ))}

                  {/* Разделитель между чатами и контактами */}
                  {filteredUsersWithoutChats.length > 0 && (
                    <div
                      style={{
                        padding: "10px 15px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Все контакты
                    </div>
                  )}
                </>
              )}

              {/* СЕКЦИЯ 2: ПОЛЬЗОВАТЕЛИ БЕЗ ЧАТОВ */}
              {filteredUsersWithoutChats.map((user) => (
                <div
                  key={user.id}
                  className="chat-item fade-in"
                  onClick={() => openChat(user.id)}
                >
                  <div className="chat-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                    <span
                      className={`online-indicator ${
                        user.status === "online" ? "online" : "offline"
                      }`}
                    />
                  </div>

                  <div className="chat-info">
                    <div className="chat-header">
                      <span className="chat-name">{user.name}</span>
                    </div>
                    <div className="chat-preview truncate">
                      {user.status === "online" ? (
                        <span style={{ color: "var(--online-color)" }}>
                          ● онлайн
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>
                          Нажмите, чтобы написать
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

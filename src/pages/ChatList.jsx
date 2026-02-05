import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useEffect, useState } from "react";
import { getAllUsers } from "../services/api";
import signalRService from "../services/signalr";

export default function ChatList() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Загружаем список пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data.users);
        setLoading(false);
      } catch {
        setError("Ошибка загрузки пользователей");
        setLoading(false);
      }
    };

    fetchUsers();

    // Подписываемся на изменение статусов через SignalR
    signalRService.onUserStatusChange((data) => {
      // Обновление статуса пользователя в списке
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === data.userId ? { ...u, status: data.status } : u,
        ),
      );
    });
  }, []);

  // Открыть чат с пользовтаелем
  const openChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  // Выход из системы
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Загрузка...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Шапка */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>✌️💬Мессенджер</h2>
        <div style={styles.userInfo}>
          <span style={styles.userName}>👤 {user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Выйти
          </button>
        </div>
      </div>
      {/* Список пользователей */}
      <div style={styles.content}>
        <h3 style={styles.title}>Контакты ({users.length})</h3>
        {error && <div style={styles.error}>{error}</div>}

        {users.length === 0 ? (
          <p style={styles.emptyText}>Нет доступных пользователей</p>
        ) : (
          <div style={styles.userList}>
            {users.map((u) => (
              <div
                key={u.id}
                style={styles.userCard}
                onClick={() => openChat(u.id)}
              >
                <div style={styles.avatar}>
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={styles.userInfoSection}>
                  <div style={styles.userNameText}>{u.name}</div>
                  <div style={styles.userEmail}>{u.email}</div>
                  {u.position && (
                    <div style={styles.userPosition}>{u.position}</div>
                  )}
                </div>
                <div style={styles.statusContainer}>
                  <span
                    style={{
                      ...styles.statusDot,
                      backgroundColor:
                        u.status === "online" ? "#4caf50" : "#9e9e9e",
                    }}
                  />
                  <span style={styles.statusText}>
                    {u.status === "online" ? "Онлайн" : "Офлайн"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
const styles = {
  container: {
    minHeight: "100vh",
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
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  headerTitle: {
    margin: 0,
    fontSize: "24px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  userName: {
    fontSize: "16px",
  },
  logoutBtn: {
    backgroundColor: "#ff5252",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background 0.3s",
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "30px 20px",
  },
  title: {
    marginBottom: "25px",
    color: "#333",
    fontSize: "20px",
  },
  userList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  userCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#667eea",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px",
    fontWeight: "bold",
  },
  userInfoSection: {
    flex: 1,
  },
  userNameText: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "5px",
  },
  userEmail: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "3px",
  },
  userPosition: {
    fontSize: "13px",
    color: "#999",
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  statusText: {
    fontSize: "14px",
    color: "#666",
  },
  error: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    padding: "40px",
    fontSize: "16px",
  },
};

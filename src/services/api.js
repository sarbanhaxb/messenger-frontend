import axios from "axios";

// URL Backend
const API_URL = "https://localhost:7104/api";

// создание экзмепляра axios с настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: автоматически добавляет JWT токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    // Достает токен из localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // Добавляет в заголовок Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

//#region АВТОРИЗАЦИЯ

// Регистрация. api - это экземпляр axios с настройками. Axios - это библиотека для выполнения запросов на сервер из Frontend.
export const register = async (name, email, password) => {
  // export делает переменную доступной в других файлах
  const response = await api.post("/auth/register", { name, email, password }); // api выполняет запрос на контроллер в Backend и получает оттуда результат
  return response.data;
};

// Вход
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

// Получить текущего пользователя
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Забыли пароль
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// Сбросить пароль
export const resetPassword = async ({ email, password, token }) => {
  const response = await api.post("/auth/reset-password", {
    email,
    password,
    token,
  });
  return response.data;
};

//#endregion

//#region ПОЛЬЗОВАТЕЛИ

// Получить всех пользователей
export const getAllUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

// Получить профиль пользователя
export const getUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// Обновить статус
export const updateStatus = async (status) => {
  const response = await api.put("/users/status", { status });
  return response.data;
};

//#endregion

//#region СООБЩЕНИЯ
// Получить историю чата с пользователями
export const getChatMessages = async (recipientId) => {
  const response = await api.get(`/messages/chat/${recipientId}`);
  return response.data;
};

// Отправить сообщение
export const sendMessage = async (recipientId, text) => {
  const response = await api.post("/messages/send", { recipientId, text });
  return response.data;
};

// Получить список всех чатов с последними сообщениями
export const getChats = async () => {
  const response = await api.get("/chats");
  return response.data;
};

// Метод редактирования сообщения
export const updateMessage = async (messageId, text) => {
  const response = await api.put(`/messages/${messageId}`, { text });
  return response.data;
};

// Удаление сообщения
export const deleteMessage = (messageId) =>
  api.delete(`/messages/${messageId}`);

export default api;
//#endregion

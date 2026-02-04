import axios from "axios";

// URL Backend
const API_URL = 'https://localhost:7104/api';

// создание экзмепляра axios с настройками
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: автоматически добавляет JWT токен к каждому запросу
api.interceptors.request.use(
    (config) => {
        // Достает токен из localStorage
        const token = localStorage.getItem('token');

        if(token) {
            // Добавляет в заголовок Authorization
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//#region АВТОРИЗАЦИЯ

// Регистрация
export const register = async (name, email, password) => {
    const response = await api.post('/auth/register', {name, email, password});
    return response.data;
};

// Вход
export const login = async (email, password) => {
    const response = await api.post('/auth/login', {email, password});
    return response.data;
}

// Получить текущего пользователя
export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

//#endregion

//#region ПОЛЬЗОВАТЕЛИ

// Получить всех пользователей
export const getAllUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

// Получить профиль пользователя
export const getUserProfile = async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
};

// Обновить статус
export const updateStatus = async (status) => {
    const response = await api.put('/users/status', {status});
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
    const response = await api.post('/messages/send', { recipientId, text});
    return response.data;
};

export default api;
//#endregion
import { create } from "zustand";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
} from "../services/api";
import signalRService from "../services/signalr";

// Глобальное хранилище для авторизации
const useAuthStore = create((set) => ({
  // Состояние
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  //#region РЕГИСТРАЦИЯ
  register: async (name, email, password) => {
    // Установка состояния загрузки
    set({ isLoading: true, error: null });
    try {
      // Отправка запроса на backend
      const data = await apiRegister(name, email, password);

      // Сохранение токена в хранилище (Store)
      localStorage.setItem("token", data.token);

      // Подключение к SignalR
      signalRService.createConnection(data.token);
      await signalRService.start();

      // Обновление состояния в хранилище (записываем данные текущего пользователя)
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false, // Данные загружены, соответственно выключаем состояния загрузки
      });

      return { success: true }; // Если всё прошло как надо, то возвращаем успешный статус
    } catch (error) {
      // Если получили ошику, возвращаем статус с ошибкой регистрации и саму ошибку
      // Тут обновляем статус в хранилище
      set({
        error: error.response?.data?.message || "Ошибка регистрации",
        isLoading: false,
      });
      // Тут возвращаем ошибку
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },

  //#endregion

  //#region ВХОД
  login: async (email, password) => {
    // Установка в хранилище статуса isLoading, чтобы отслеживать загрузку с сервера
    set({ isLoading: true, error: null });

    // Получение данных с сервера (запрос с целью получения данных пользователя)
    try {
      // Сам запрос
      const data = await apiLogin(email, password);

      // Извлечение токена из запроса и устанавливаем его в хранилище
      localStorage.setItem("token", data.token);

      // Подключение к SignalR, если все шаги выше выполнены успешно
      signalRService.createConnection(data.token);

      // Запуск signalRService (пользователь онлайн)
      await signalRService.start();

      // Обновляем данные в хранилище
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      // Возвращаем успешный статус операции
      return { success: true };
      // Аналогично регистрации - отлавливаем ошибку и возвращаем
    } catch (error) {
      set({
        error: error.response?.data?.message || "Ошибка входа",
        isLoading: false,
      });
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },
  //#endregion

  //#region ВЫХОД
  logout: async () => {
    // Отключение от SignalR при выходе
    await signalRService.stop();

    // Удаление токена из хранилища
    localStorage.removeItem("token");

    // Обнуление данных пользователя в хранилище
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  //#endregion

  //#region ЗАГРУЗИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  loadUser: async () => {
    // Обращение к хранилищу за получением токена, если токена нет, то устанавливаем статус в хранилище - неавторизован (isAuthenticated: false)
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    // Установка статуса "загружается" в хранилище
    set({ isLoading: true });

    try {
      // Обращение к бэкенду для получения данных пользователя
      const data = await getMe();

      // Подключение к SignalR
      signalRService.createConnection(token);
      await signalRService.start();

      // Запись в хранилище данных загруженного пользователя
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Обработка ошибок
    } catch {
      localStorage.removeItem("token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  //#endregion
}));

export default useAuthStore;

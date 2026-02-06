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

  // ============== РЕГИСТРАЦИЯ ==============
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRegister(name, email, password);

      // Сохраняем токен
      localStorage.setItem("token", data.token);

      // Подключаемся к SignalR
      signalRService.createConnection(data.token);
      await signalRService.start();

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || "Ошибка регистрации",
        isLoading: false,
      });
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },

  //  ВХОД
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiLogin(email, password);

      localStorage.setItem("token", data.token);

      // Подключаемся к SignalR
      signalRService.createConnection(data.token);
      await signalRService.start();

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
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

  //  ВЫХОД
  logout: async () => {
    // Отключаемся от SignalR
    await signalRService.stop();

    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  //  ЗАГРУЗИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const data = await getMe();

      // Подключаемся к SignalR
      signalRService.createConnection(token);
      await signalRService.start();

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
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
}));

export default useAuthStore;

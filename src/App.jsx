import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chats from "./pages/Chats";
import "./App.css";
// import ChatList from "./pages/ChatList";
// import ChatWindow from "./pages/ChatWindow";

// BrowserRouter - обертка для маршрутизации
// Routes - контейнер для всех Route
// Route - один маршрут
// Navigate - компонент для перенаправления

function App() {
  const { isAuthenticated, loadUser, isLoading } = useAuthStore();

  //#region Проверка авторизации при запуске
  useEffect(() => {
    loadUser(); // загружает данные пользователя по токену, если он валиден, то пользователь будет авторизован
  }, []);
  //#endregion

  //#region Индикатор загрузки
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }
  //#endregion
  //#region Маршрутизация
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/chats" />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/chats" />}
        />

        <Route
          path="/chats/:userId?"
          element={isAuthenticated ? <Chats /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/chats" : "/login"} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>

    // <Router>
    //   <Routes>
    //     {/* Публичные маршруты*/}
    //     {/*Если пользователь авторизован, то перенаправляет на /chats */}
    //     <Route
    //       path="/login"
    //       element={isAuthenticated ? <Navigate to="/chats" /> : <Login />}
    //     />
    //     <Route
    //       path="/register"
    //       element={isAuthenticated ? <Navigate to="/chats" /> : <Register />}
    //     />

    //     {/* Защищеные маршруты*/}
    //     {/* Если не авторизован, перенаправляется на /login */}
    //     <Route
    //       path="/chats"
    //       element={isAuthenticated ? <ChatList /> : <Navigate to="/login" />}
    //     />

    //     {/* :userId - динамический параметр (получаем через useParams) */}
    //     <Route
    //       path="/chat/:userId"
    //       element={isAuthenticated ? <ChatWindow /> : <Navigate to="/login" />}
    //     />

    //     {/* Дефолтный маршрут */}
    //     {/* Если URL = /, перенаправляет в зависимости от авторизации */}
    //     <Route
    //       path="/"
    //       element={<Navigate to={isAuthenticated ? "/chats" : "/login"} />}
    //     />
    //     {/* Если маршрут не найден, перенаправляет на главную */}
    //     <Route path="*" element={<Navigate to="/" />} />
    //   </Routes>
    // </Router>
  );
  //#endregion
}

export default App;

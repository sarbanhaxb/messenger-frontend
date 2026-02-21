// import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatWindow from "./ChatWindow";
import ChatList from "./ChatList";
import "../styles/Chats.css";

export default function Chats() {
  const { userId } = useParams(); // ID выбранного пользователя из URL
  const navigate = useNavigate();

  // Функция выбора чата
  const handleSelectChat = (selectedUserId) => {
    navigate(`/chats/${selectedUserId}`);
  };

  return (
    <div className="chats-container">
      {/* Левая панель - список чатов */}
      <div className="chats-sidebar" style={{width: "Auto", background: "black"}}>
        <ChatList onSelectChat={handleSelectChat} selectedUserId={userId} />
      </div>

      {/* Правая панель - окно чата */}
      <div className="chats-main">
        {userId ? (
          <ChatWindow userId={userId} />
        ) : (
          <div className="chats-empty">
            <div className="empty-state">
              <h2>Выберите чат</h2>
              <p>Выберите диалог из списка слева, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

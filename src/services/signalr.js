import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://localhost:7104/chathub";

class SignalRService {
  constructor() {
    this.connection = null;
  }

  // Подключение к SignalR Hub
  createConnection(token) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  // Запуск подключения
  async start() {
    if (this.connection) {
      try {
        await this.connection.start();
      } catch (err) {
        console.error("Ошибка подключения SignalR:", err);
      }
    }
  }

  // Остановить подключение
  async stop() {
    if (this.connection) {
      await this.connection.stop();
    }
  }

  // Подписаться на событие "ReceiveMessage"
  onUserStatusChange(callback) {
    if (this.connection) {
      this.connection.on("UserStatusChange", callback);
    }
  }

  onReceiveMessage(callback) {
    if (this.connection) {
      this.connection.on("ReceiveMessage", callback);
    }
  }

  // Подписаться на событие "UserTyping"
  onUserTyping(callback) {
    if (this.connection) {
      this.connection.on("UserTyping", callback);
    }
  }

  // Отправить индикатор "печатает..."
  async sendTyping(recipientId, isTyping) {
    if (this.connection) {
      await this.connection.invoke("Typing", recipientId, isTyping);
    }
  }
}

export default new SignalRService();
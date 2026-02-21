import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      if (result.success) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setMessage(err.message || "Ошибка");
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Забыли пароль?</h1>
        <p>Введите email для восстановления</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        {message && (
          <div
            className={`message ${message.includes("успешно") ? "success" : "error"}`}
          >
            {message}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Отправляем..." : "Отправить ссылку"}
        </button>
      </form>
      <div className="auth-footer">
        <Link to="/login" className="auth-link">
          Вернуться к входу
        </Link>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get("token") || "";
  const email = decodeURIComponent(searchParams.get("email") || "");

  console.log("🔍 URL TOKEN:", urlToken.substring(0, 20)); // FjlLFsZs5S6L...

  const [formData, setFormData] = useState({
    email: email,
    password: "",
    token: urlToken,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("📤 ОТПРАВЛЯЕМ:", formData); // Проверьте токен!
    try {
      const result = await resetPassword(formData);
      setMessage(result.message);
      if (result.success) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Новый пароль</h1>
        <p>Введите новый пароль</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Новый пароль</label>
          <input
            type="password"
            className="form-input"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            minLength="6"
            required
          />
        </div>
        {message && <div className="error-message">{message}</div>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Сохраняем..." : "Установить пароль"}
        </button>
      </form>
    </div>
  );
}

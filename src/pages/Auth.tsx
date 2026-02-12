import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InputField from "../components/InputFields";
import "./Auth.css";

type AuthMode = "login" | "register";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as AuthMode) || "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email, password });
    // TODO: 登录逻辑
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register:", { email, username, password });
    // TODO: 注册逻辑 
  };

  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="auth-header"></div>

        {/* 模式切换标签 */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Sign Up
          </button>
        </div>

        {/* 表单内容 */}
        <div className="auth-form-content">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="auth-form">
              <InputField
                label="Email"
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <InputField
                label="Password"
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="auth-form-footer">
                <button type="submit" className="btn btn-primary btn-block">
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => navigate("/")}
                >
                  Back to Welcome
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <InputField
                label="Email"
                type="email"
                id="register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <InputField
                label="Username"
                type="text"
                id="register-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <InputField
                label="Password"
                type="password"
                id="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="auth-form-footer">
                <button type="submit" className="btn btn-primary btn-block">
                  Create Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="auth-brand-section">
        <div className="brand-content">
          <h2 className="brand-title">Welcome to HeurAIDEAS</h2>
          <div className="brand-illustration">
            {/* 这里可以放 SVG 插图或图片 */}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export default function AdminLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      router.push("/admin");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message || "Không thể đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeading}>
          <span className={styles.kicker}>San Hô Đỏ Admin</span>
          <h1>Đăng nhập dashboard quản lý đặt bàn</h1>
          <p>Quản lý lead đặt bàn, voucher, ghi chú CSKH, trạng thái xử lý và xuất dữ liệu.</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <label>
            <span>Tài khoản</span>
            <input
              type="text"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Mật khẩu</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Vào dashboard"}
          </button>
          {error ? <p className={styles.loginError}>{error}</p> : null}
        </form>
      </div>
    </main>
  );
}

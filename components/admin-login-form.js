"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import styles from "./admin.module.css";

export default function AdminLoginForm({ initialError = "" }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
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
      <Card className={styles.loginCard}>
        <CardContent className="space-y-6 p-8">
        <div className={styles.loginHeading}>
          <span className={styles.kicker}>San Hô Đỏ Admin</span>
          <h1>Đăng nhập dashboard nhà hàng</h1>
          <p>
            Đăng nhập bằng tài khoản Supabase Auth để quản lý đặt bàn, món ăn, đơn món, bàn,
            voucher và cấu hình tích hợp.
          </p>
          {process.env.NEXT_PUBLIC_LOCAL_ADMIN_HINT ? (
            <p>
              Tài khoản local dev: <strong>{process.env.NEXT_PUBLIC_LOCAL_ADMIN_HINT}</strong>
            </p>
          ) : null}
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <label>
            <span>Email admin</span>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Mật khẩu</span>
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Vào dashboard"}
          </Button>
          {error ? <p className={styles.loginError}>{error}</p> : null}
        </form>
        </CardContent>
      </Card>
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, Field, TextInput } from "../components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        email: email.trim(),
      });
      setDone(true);
      setResetToken(res.data.resetToken ?? null);
    } catch {
      setDone(true);
      setResetToken(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2ff] p-4">
      <div style={{ width: 380 }} className="max-w-full">
        <Card className="p-7">
          <div className="mb-5 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              1i
            </span>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">Quên mật khẩu</h1>
            <p className="mt-0.5 text-sm text-slate-500">Nhập email để đặt lại mật khẩu</p>
          </div>
          {done ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Nếu email tồn tại, hướng dẫn đặt lại đã được gửi. Token có hiệu lực 15 phút.
              </p>
              {resetToken && (
                <Link to={`/reset-password?token=${encodeURIComponent(resetToken)}`}>
                  <Button className="w-full">Đặt lại mật khẩu ngay</Button>
                </Link>
              )}
              <p className="text-center text-sm text-slate-600">
                <Link to="/login" className="font-medium text-indigo-700 hover:underline">
                  Về đăng nhập
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              <Field label="Email">
                <TextInput
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@example.com"
                  required
                />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Đang gửi…" : "Gửi yêu cầu"}
              </Button>
              <p className="text-center text-sm text-slate-600">
                <Link to="/login" className="font-medium text-indigo-700 hover:underline">
                  Về đăng nhập
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

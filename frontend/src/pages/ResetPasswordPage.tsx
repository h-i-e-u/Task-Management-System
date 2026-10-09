import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, backendMessage } from "../lib/api";
import { Button, Card, Field, TextInput } from "../components/ui";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [token] = useState(params.get("token") ?? "");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: next });
      setDone(true);
    } catch (err: unknown) {
      const msg = backendMessage(err, "Đặt lại mật khẩu thất bại");
      setError(
        msg === "Invalid or expired reset token"
          ? "Link đã hết hạn hoặc không hợp lệ, hãy yêu cầu lại"
          : msg,
      );
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
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">Đặt lại mật khẩu</h1>
          </div>
          {done ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-emerald-700">Đặt lại thành công. Hãy đăng nhập bằng mật khẩu mới.</p>
              <Link to="/login">
                <Button className="w-full">Về đăng nhập</Button>
              </Link>
            </div>
          ) : !token ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-600">Thiếu token. Hãy bắt đầu lại từ trang quên mật khẩu.</p>
              <Link to="/forgot-password">
                <Button className="w-full">Quên mật khẩu</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              <Field label="Mật khẩu mới">
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  maxLength={72}
                />
              </Field>
              <Field label="Nhập lại mật khẩu mới">
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </Field>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Đang lưu…" : "Đặt lại mật khẩu"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

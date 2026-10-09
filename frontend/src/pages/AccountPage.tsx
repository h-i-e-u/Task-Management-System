import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Field, TextInput } from "../components/ui";

export default function AccountPage() {
  const { user, changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setDone("");
    if (next !== confirm) {
      setError("Mật khẩu mới nhập lại không khớp");
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone("Đổi mật khẩu thành công. Các phiên đăng nhập khác đã bị đăng xuất.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      setError(msg === "Current password is incorrect" ? "Mật khẩu hiện tại không đúng" : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Tài khoản</h1>
      <Card className="p-4">
        <p className="text-sm text-slate-600">
          {user?.email} · {user?.role}
        </p>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold tracking-tight text-slate-900">Đổi mật khẩu</h2>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <Field label="Mật khẩu hiện tại">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </Field>
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
          {done && <p className="text-xs text-emerald-700">{done}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Đang đổi…" : "Đổi mật khẩu"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

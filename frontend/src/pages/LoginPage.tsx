import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Field, TextInput } from "../components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
      emailRef.current?.focus();
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
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">Chào mừng trở lại</h1>
            <p className="mt-0.5 text-sm text-slate-500">Đăng nhập để quản lý công việc nhóm</p>
          </div>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <Field label="Email" error={undefined}>
              <TextInput
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </Field>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-slate-500">
          Hệ thống quản lý công việc nhóm — an toàn, nhanh, đơn giản.
        </p>
      </div>
    </div>
  );
}

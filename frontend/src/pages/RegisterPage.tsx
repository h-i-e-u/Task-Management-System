import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Field, TextInput } from "../components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    setBusy(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại";
      setError(
        msg === "Resource already exists" ? "Email này đã được đăng ký, hãy đăng nhập." : msg,
      );
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
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">Tạo tài khoản</h1>
            <p className="mt-0.5 text-sm text-slate-500">Tham gia quản lý công việc cùng nhóm</p>
          </div>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <Field label="Tên">
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn"
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <TextInput
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@example.com"
                required
              />
            </Field>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  maxLength={72}
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
            </div>
            <Field label="Nhập lại mật khẩu">
              <TextInput
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </Field>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Đang tạo…" : "Đăng ký"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-medium text-indigo-700 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

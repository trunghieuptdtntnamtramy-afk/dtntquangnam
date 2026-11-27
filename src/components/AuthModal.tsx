
import React, { useState } from 'react';
import {
  GraduationCap,
  Play,
  ShieldCheck,
  X,
  Mail,
  Lock
} from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onEmailPasswordSignIn: (
    email: string,
    password: string
  ) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onEnterDemo: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  onEmailPasswordSignIn,
  onForgotPassword,
  onEnterDemo,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!open) return null;

  const handleSignIn = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await onEmailPasswordSignIn(email.trim(), password);
      onClose();
    } catch (error: any) {
      const messages: Record<string, string> = {
        'auth/invalid-credential':
          'Gmail hoặc mật khẩu không chính xác.',
        'auth/user-not-found':
          'Tài khoản chưa được đăng ký.',
        'auth/wrong-password':
          'Mật khẩu không chính xác.',
        'auth/too-many-requests':
          'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.',
        'auth/network-request-failed':
          'Không thể kết nối mạng. Vui lòng kiểm tra Internet.',
        'auth/invalid-email':
          'Địa chỉ Gmail không hợp lệ.',
      };

      setErrorMsg(
        messages[error?.code] ||
        error?.message ||
        'Đăng nhập không thành công. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập Gmail trước khi đặt lại mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      await onForgotPassword(email.trim());
      setSuccessMsg(
        'Nếu Gmail hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.'
      );
    } catch {
      setErrorMsg('Chưa thể gửi email đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-7 shadow-xl relative">

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại đăng nhập"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div>
            <h2
              id="auth-modal-title"
              className="text-lg font-extrabold text-slate-900"
            >
              Đăng nhập EDU SMART
            </h2>
            <p className="text-xs text-slate-500">
              Trường PTDTNT THPT Quảng Nam
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          Sử dụng Gmail và mật khẩu đã đăng ký để truy cập
          không gian học tập EDU SMART.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700"
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">

          <div>
            <label
              htmlFor="edu-email"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Địa chỉ Gmail
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                id="edu-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                autoComplete="username"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edu-password"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Mật khẩu
            </label>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                id="edu-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm text-sky-700 hover:text-sky-900 font-semibold"
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
          </button>

        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs text-slate-400">HOẶC</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onEnterDemo();
          }}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Play className="w-4 h-4 text-sky-600" />
          <span>Trải nghiệm nhanh không gian tự học</span>
        </button>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Xác thực tài khoản qua Firebase Authentication.
          </span>
        </div>

      </div>
    </div>
  );
};

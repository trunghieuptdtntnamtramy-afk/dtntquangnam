import React, { useState } from 'react';
import { GraduationCap, Play, ShieldCheck, X } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEnterDemo: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  onGoogleSignIn,
  onEnterDemo,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể đăng nhập bằng Google. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-lg font-extrabold text-slate-900">
              Đăng nhập EDU SMART
            </h2>
            <p className="text-xs text-slate-500">
              Trường PTDTNT THPT Quảng Nam
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Sử dụng tài khoản Google của bạn để lưu tiến trình 05 phân hệ trên Firestore và đồng bộ với Google Drive, Sheets, Docs, Slides, Forms, Meet và Gmail.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="gsi-material-button w-full"
          >
            <span className="gsi-material-button-icon">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                style={{ display: 'block' }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            </span>
            <span>{loading ? 'Đang kết nối Google...' : 'Sign in with Google'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEnterDemo();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 text-sky-600" />
            <span>Trải nghiệm nhanh không gian tự học</span>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Xác thực bảo mật qua Firebase Authentication & Google OAuth.</span>
        </div>
      </div>
    </div>
  );
};

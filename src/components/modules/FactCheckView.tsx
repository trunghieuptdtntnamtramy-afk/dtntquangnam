import React, { useState } from 'react';
import { CheckCircle, HelpCircle, SearchCheck, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import {
  FactCheckItem,
  FactCheckStatus,
  SUBJECTS,
  validateFactCheckInput,
} from '../../utils/learningLogic';

interface FactCheckViewProps {
  factChecks: FactCheckItem[];
  onCreateFactCheck: (input: {
    subject: string;
    aiClaim: string;
    textbookSource: string;
    verificationStatus: FactCheckStatus;
    studentArgument: string;
    aiDeepReview: string;
  }) => Promise<void>;
  onDeleteFactCheck: (id: string) => Promise<void>;
}

const VERIFICATION_OPTIONS: Array<{
  id: FactCheckStatus;
  label: string;
  desc: string;
}> = [
  { id: 'accurate', label: 'Chính xác', desc: 'Khớp với SGK và tài liệu chuẩn' },
  { id: 'needs_context', label: 'Cần bổ sung', desc: 'Đúng một phần nhưng thiếu điều kiện/ngữ cảnh' },
  { id: 'inaccurate', label: 'Có sai lệch', desc: 'Không khớp SGK hoặc sai kiến thức' },
];

export const FactCheckView: React.FC<FactCheckViewProps> = ({
  factChecks,
  onCreateFactCheck,
  onDeleteFactCheck,
}) => {
  const [subject, setSubject] = useState<string>(SUBJECTS[6]);
  const [aiClaim, setAiClaim] = useState('');
  const [textbookSource, setTextbookSource] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<FactCheckStatus>('needs_context');
  const [studentArgument, setStudentArgument] = useState('');
  const [aiDeepReview, setAiDeepReview] = useState('');
  const [checkingAi, setCheckingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeepReview = async () => {
    setErrorMsg(null);
    const err = validateFactCheckInput({
      subject,
      aiClaim,
      textbookSource,
      studentArgument,
    });
    if (err) {
      setErrorMsg(err);
      return;
    }

    setCheckingAi(true);
    try {
      const res = await fetch('/api/gemini/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          aiClaim: aiClaim.trim(),
          textbookSource: textbookSource.trim(),
          studentArgument: studentArgument.trim(),
        }),
      });
      const data = (await res.json()) as { review?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Không thể chạy phân tích phản biện.');
      }
      setAiDeepReview(data.review || '');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Lỗi kết nối Gemini.');
    } finally {
      setCheckingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const err = validateFactCheckInput({
      subject,
      aiClaim,
      textbookSource,
      studentArgument,
    });
    if (err) {
      setErrorMsg(err);
      return;
    }

    setSubmitting(true);
    try {
      await onCreateFactCheck({
        subject,
        aiClaim: aiClaim.trim(),
        textbookSource: textbookSource.trim(),
        verificationStatus,
        studentArgument: studentArgument.trim(),
        aiDeepReview: aiDeepReview.trim(),
      });
      setAiClaim('');
      setTextbookSource('');
      setStudentArgument('');
      setAiDeepReview('');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể lưu phiếu kiểm chứng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Phân hệ 04 · Fact Check
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
          Đối chiếu sách giáo khoa & Kiểm chứng thông tin
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Không tin tưởng tuyệt đối vào AI — đối chiếu từng nhận định với SGK, phát hiện sai lệch và đưa ra lập luận cá nhân.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 h-fit"
        >
          <h3 className="text-base font-bold text-slate-900">Phiếu kiểm chứng tri thức</h3>

          <div>
            <label htmlFor="fact-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Môn học
            </label>
            <select
              id="fact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fact-claim" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nhận định / Thông tin cần kiểm chứng
            </label>
            <textarea
              id="fact-claim"
              rows={3}
              value={aiClaim}
              onChange={(e) => setAiClaim(e.target.value)}
              placeholder="Dán đoạn giải thích từ AI hoặc một nhận định khoa học/lịch sử cần đối chiếu..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="fact-source" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nguồn đối chiếu (SGK, trang, bài học, tài liệu chính thống)
            </label>
            <input
              id="fact-source"
              type="text"
              value={textbookSource}
              onChange={(e) => setTextbookSource(e.target.value)}
              placeholder="Ví dụ: SGK Lịch sử 12 Kết nối tri thức · Bài 7, trang 45"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Kết luận đối chiếu của bạn
            </span>
            <div className="grid sm:grid-cols-3 gap-2">
              {VERIFICATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVerificationStatus(opt.id)}
                  className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                    verificationStatus === opt.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="fact-arg" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lập luận phản biện cá nhân của bạn
            </label>
            <textarea
              id="fact-arg"
              rows={3}
              value={studentArgument}
              onChange={(e) => setStudentArgument(e.target.value)}
              placeholder="Giải thích vì sao thông tin trên đúng, thiếu ngữ cảnh hay sai lệch dựa trên SGK..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </div>

          {aiDeepReview && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              <strong className="block text-emerald-800 mb-1">
                Phân tích đối chiếu sâu (Gemini 4 Hydrogen · High Thinking):
              </strong>
              {aiDeepReview}
            </div>
          )}

          {errorMsg && (
            <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleDeepReview}
              disabled={checkingAi}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>{checkingAi ? 'Đang thẩm định...' : 'Thẩm định sâu bằng Gemini'}</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <SearchCheck className="w-4 h-4" />
              <span>{submitting ? 'Đang lưu...' : 'Lưu phiếu kiểm chứng'}</span>
            </button>
          </div>
        </form>

        {/* Saved Fact Checks */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Hồ sơ kiểm chứng ({factChecks.length})
          </h3>

          {factChecks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <SearchCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Chưa có phiếu kiểm chứng nào</p>
              <p className="text-xs text-slate-500 mt-1">
                Thực hành đối chiếu SGK giúp bạn rèn luyện tư duy phản biện trước mọi câu trả lời của AI.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {factChecks.map((item) => {
                const statusBadge =
                  item.verificationStatus === 'accurate'
                    ? { icon: CheckCircle, label: 'Chính xác', cls: 'text-emerald-700' }
                    : item.verificationStatus === 'inaccurate'
                    ? { icon: ShieldAlert, label: 'Phát hiện sai lệch', cls: 'text-rose-700' }
                    : { icon: HelpCircle, label: 'Cần bổ sung', cls: 'text-amber-700' };
                const StatusIcon = statusBadge.icon;

                return (
                  <article
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-800">{item.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`inline-flex items-center gap-1 font-bold ${statusBadge.cls}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusBadge.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteFactCheck(item.id)}
                        aria-label={`Xóa phiếu kiểm chứng ${item.subject}`}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-slate-900">“{item.aiClaim}”</p>
                    <p className="text-xs text-slate-500">
                      <strong>Nguồn đối chiếu:</strong> {item.textbookSource}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong>Lập luận học sinh:</strong> {item.studentArgument}
                    </p>
                    {item.aiDeepReview && (
                      <p className="text-xs text-emerald-900 leading-relaxed bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                        <strong>Nhận xét chuyên sâu:</strong> {item.aiDeepReview}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

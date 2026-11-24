import React, { useState } from 'react';
import { ArrowRight, Lightbulb, LockOpen } from 'lucide-react';
import {
  SUBJECTS,
  ThinkFirstItem,
  validateThinkFirstInput,
  VALIDATION_LIMITS,
} from '../../utils/learningLogic';

interface ThinkFirstViewProps {
  entries: ThinkFirstItem[];
  onCreateEntry: (input: {
    subject: string;
    promptTitle: string;
    studentHypothesis: string;
    confidenceLevel: number;
  }) => Promise<ThinkFirstItem>;
  onLaunchCoach: (entry: ThinkFirstItem) => void;
}

const SAMPLE_PROMPTS = [
  {
    subject: 'Vật lí',
    title: 'Vì sao khi ném vật thẳng đứng lên cao, động năng giảm nhưng tổng cơ năng vẫn bảo toàn (bỏ qua lực cản)?',
  },
  {
    subject: 'Ngữ văn',
    title: 'Chi tiết bát cháo cám trong truyện ngắn Vợ nhặt của Kim Lân mang ý nghĩa hiện thực và nhân đạo gì?',
  },
  {
    subject: 'Hóa học',
    title: 'Vì sao tốc độ phản ứng hóa học thường tăng nhanh khi tăng nhiệt độ hoặc tăng diện tích bề mặt tiếp xúc?',
  },
];

export const ThinkFirstView: React.FC<ThinkFirstViewProps> = ({
  entries,
  onCreateEntry,
  onLaunchCoach,
}) => {
  const [subject, setSubject] = useState<string>(SUBJECTS[3]);
  const [promptTitle, setPromptTitle] = useState('');
  const [studentHypothesis, setStudentHypothesis] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmedLen = studentHypothesis.trim().length;
  const minLen = VALIDATION_LIMITS.thinkHypothesisMin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const err = validateThinkFirstInput({
      subject,
      promptTitle,
      studentHypothesis,
      confidenceLevel,
    });
    if (err) {
      setErrorMsg(err);
      return;
    }

    setSubmitting(true);
    try {
      const created = await onCreateEntry({
        subject,
        promptTitle: promptTitle.trim(),
        studentHypothesis: studentHypothesis.trim(),
        confidenceLevel,
      });
      setPromptTitle('');
      setStudentHypothesis('');
      onLaunchCoach(created);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể lưu bài Think First.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Phân hệ 02 · Think First
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
          Tư duy độc lập trước khi sử dụng AI
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Hình thành lập luận và câu trả lời ban đầu của riêng bạn (tối thiểu {minLen} ký tự) để mở khóa trợ lý AI Coach.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">Bản nháp tư duy cá nhân</h3>
            <span className="text-xs font-mono-num text-slate-500">
              {trimmedLen}/{minLen} ký tự tối thiểu
            </span>
          </div>

          {/* Quick sample prompts */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500">Chọn nhanh câu hỏi gợi ý:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => {
                    setSubject(sample.subject);
                    setPromptTitle(sample.title);
                  }}
                  className="text-left px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-xs font-medium text-amber-900 transition-colors cursor-pointer"
                >
                  {sample.subject}: {sample.title.slice(0, 44)}...
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="think-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Môn học
            </label>
            <select
              id="think-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="think-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Vấn đề / Câu hỏi cần giải quyết
            </label>
            <input
              id="think-title"
              type="text"
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder="Nhập câu hỏi hoặc đề bài bạn đang tự tìm hiểu..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label htmlFor="think-hypothesis" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Suy nghĩ và lập luận ban đầu của bạn (không dùng AI)
            </label>
            <textarea
              id="think-hypothesis"
              rows={5}
              value={studentHypothesis}
              onChange={(e) => setStudentHypothesis(e.target.value)}
              placeholder="Viết những gì bạn đã biết, hướng giải quyết dự kiến hoặc giả thuyết của bạn trước khi hỏi AI..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Mức độ tự tin với lập luận hiện tại ({confidenceLevel}/5)
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setConfidenceLevel(lvl)}
                  className={`w-10 h-10 rounded-xl font-mono-num text-sm font-bold border transition-colors cursor-pointer ${
                    confidenceLevel === lvl
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            <LockOpen className="w-4 h-4" />
            <span>{submitting ? 'Đang lưu...' : 'Lưu tư duy độc lập & Mở khóa AI Coach'}</span>
          </button>
        </form>

        {/* Past Think First records */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Lịch sử tư duy độc lập ({entries.length})
          </h3>

          {entries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <Lightbulb className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Chưa có bản ghi Think First</p>
              <p className="text-xs text-slate-500 mt-1">
                Hoàn thành suy nghĩ cá nhân để mở khóa AI Coach ở Phân hệ 03.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-amber-700">{entry.subject}</span>
                    <span className="font-mono-num">Tự tin: {entry.confidenceLevel}/5</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{entry.promptTitle}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {entry.studentHypothesis}
                  </p>
                  <button
                    type="button"
                    onClick={() => onLaunchCoach(entry)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 pt-1 cursor-pointer"
                  >
                    <span>Thảo luận tiếp với AI Coach</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

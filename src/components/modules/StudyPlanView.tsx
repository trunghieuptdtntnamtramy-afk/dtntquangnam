import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  StudyPlanItem,
  StudyPlanStatus,
  SUBJECTS,
  validateStudyPlanInput,
} from '../../utils/learningLogic';

interface StudyPlanViewProps {
  plans: StudyPlanItem[];
  onCreatePlan: (input: {
    subject: string;
    title: string;
    goal: string;
    targetMinutes: number;
    scheduledDate: string;
  }) => Promise<void>;
  onUpdatePlan: (planId: string, status: StudyPlanStatus, reflectionReason: string) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  plans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
}) => {
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(40);
  const [scheduledDate, setScheduledDate] = useState('2026-11-24');
  const [filterStatus, setFilterStatus] = useState<'all' | StudyPlanStatus>('all');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [aiHint, setAiHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  const [reflectingId, setReflectingId] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const err = validateStudyPlanInput({
      subject,
      title,
      goal,
      targetMinutes: Number(targetMinutes),
      scheduledDate,
    });
    if (err) {
      setFormError(err);
      return;
    }

    setSubmitting(true);
    try {
      await onCreatePlan({
        subject,
        title: title.trim(),
        goal: goal.trim(),
        targetMinutes: Number(targetMinutes),
        scheduledDate,
      });
      setTitle('');
      setGoal('');
      setAiHint(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu kế hoạch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateQuickHint = async () => {
    setHintError(null);
    if (!title.trim()) {
      setHintError('Hãy nhập tên nhiệm vụ trước khi yêu cầu gợi ý lộ trình.');
      return;
    }
    setHintLoading(true);
    try {
      const res = await fetch('/api/gemini/quick-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, title, goal }),
      });
      const data = (await res.json()) as { suggestion?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lấy gợi ý từ Gemini.');
      }
      setAiHint(data.suggestion || '');
    } catch (error) {
      setHintError(error instanceof Error ? error.message : 'Lỗi kết nối Gemini.');
    } finally {
      setHintLoading(false);
    }
  };

  const filteredPlans =
    filterStatus === 'all' ? plans : plans.filter((p) => p.status === filterStatus);

  const completedCount = plans.filter((p) => p.status === 'completed').length;
  const totalMinutes = plans.reduce((sum, p) => sum + p.targetMinutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
            Phân hệ 01 · Study Plan
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Lập kế hoạch & Quản lý thời gian tự học
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Thiết lập nhiệm vụ cụ thể, phân bổ thời lượng hợp lý và tự phản tư nguyên nhân nếu chưa hoàn thành.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500">Hoàn thành</span>
            <p className="font-mono-num font-bold text-slate-900 text-lg">
              {completedCount}/{plans.length}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Tổng thời lượng</span>
            <p className="font-mono-num font-bold text-sky-700 text-lg">
              {totalMinutes} phút
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form creating a study plan */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 h-fit"
        >
          <h3 className="text-base font-bold text-slate-900">Thêm nhiệm vụ tự học mới</h3>

          <div>
            <label htmlFor="plan-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Môn học
            </label>
            <select
              id="plan-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-sky-500"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="plan-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên nhiệm vụ học tập
            </label>
            <input
              id="plan-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Ôn tập phương trình lượng giác cơ bản"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label htmlFor="plan-goal" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mục tiêu cần đạt
            </label>
            <textarea
              id="plan-goal"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ví dụ: Tự tóm tắt 4 công thức nghiệm và giải đúng 5 bài tập mức độ vận dụng."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="plan-minutes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Thời lượng (phút)
              </label>
              <input
                id="plan-minutes"
                type="number"
                min={5}
                max={480}
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono-num text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="plan-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngày thực hiện
              </label>
              <input
                id="plan-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono-num text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {formError}
            </p>
          )}

          {hintError && (
            <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
              {hintError}
            </p>
          )}

          {aiHint && (
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
              <strong className="block text-sky-800 mb-1">Gợi ý lộ trình nhanh (Gemini 3.1 Flash Lite):</strong>
              {aiHint}
            </div>
          )}

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Đang lưu...' : 'Lưu kế hoạch'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateQuickHint}
              disabled={hintLoading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>{hintLoading ? 'Đang gợi ý...' : 'Gợi ý 3 bước'}</span>
            </button>
          </div>
        </form>

        {/* Task list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">Danh sách nhiệm vụ</h3>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'pending', label: 'Đang làm' },
                  { id: 'completed', label: 'Hoàn thành' },
                  { id: 'incomplete', label: 'Chưa xong' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterStatus === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Chưa có nhiệm vụ nào trong mục này</p>
              <p className="text-xs text-slate-500 mt-1">
                Hãy tạo một nhiệm vụ học tập ở khung bên trái để bắt đầu rèn luyện kỷ luật tự học.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlans.map((plan) => (
                <article
                  key={plan.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-sky-700">{plan.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{plan.scheduledDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono-num">
                          <Clock className="w-3.5 h-3.5" />
                          {plan.targetMinutes} phút
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{plan.title}</h4>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{plan.goal}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeletePlan(plan.id)}
                      aria-label={`Xóa nhiệm vụ ${plan.title}`}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {plan.reflectionReason && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <strong>Nguyên nhân chưa hoàn thành:</strong> {plan.reflectionReason}
                    </div>
                  )}

                  {reflectingId === plan.id ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <label
                        htmlFor={`reflect-${plan.id}`}
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Tự đánh giá nguyên nhân chưa hoàn thành & cách khắc phục:
                      </label>
                      <input
                        id={`reflect-${plan.id}`}
                        type="text"
                        value={reflectionText}
                        onChange={(e) => setReflectionText(e.target.value)}
                        placeholder="Ví dụ: Chưa nắm vững công thức nền tảng, cần xem lại SGK trước."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onUpdatePlan(plan.id, 'incomplete', reflectionText.trim() || 'Cần điều chỉnh quỹ thời gian.');
                            setReflectingId(null);
                            setReflectionText('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Lưu phản tư
                        </button>
                        <button
                          type="button"
                          onClick={() => setReflectingId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <span
                        className={`text-xs font-bold ${
                          plan.status === 'completed'
                            ? 'text-emerald-700'
                            : plan.status === 'incomplete'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        Trạng thái:{' '}
                        {plan.status === 'completed'
                          ? 'Đã hoàn thành'
                          : plan.status === 'incomplete'
                          ? 'Chưa hoàn thành'
                          : 'Đang thực hiện'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdatePlan(plan.id, 'completed', '')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hoàn thành</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReflectingId(plan.id);
                            setReflectionText(plan.reflectionReason || '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Chưa xong · Tự đánh giá</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

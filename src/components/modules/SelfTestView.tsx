import React, { useState } from 'react';
import { Award, ClipboardCheck, ShieldCheck } from 'lucide-react';
import {
  evaluateSelfTestLocally,
  SelfTestItem,
  SUBJECTS,
  validateSelfTestInput,
} from '../../utils/learningLogic';

interface SelfTestViewProps {
  selfTests: SelfTestItem[];
  onSubmitSelfTest: (input: {
    subject: string;
    topic: string;
    questionPrompt: string;
    studentExplanation: string;
    applicationAnswer: string;
    score: number;
    feedbackSummary: string;
  }) => Promise<void>;
}

const TEST_TEMPLATES = [
  {
    subject: 'Vật lí',
    topic: 'Định luật bảo toàn cơ năng',
    prompt: 'Hãy trình bày bằng ngôn ngữ của em điều kiện bảo toàn cơ năng và cho một ví dụ thực tiễn.',
  },
  {
    subject: 'Ngữ văn',
    topic: 'Giá trị nhân đạo trong văn học hiện đại',
    prompt: 'Giải thích khái niệm giá trị nhân đạo bằng lời của em và liên hệ với một tác phẩm đã học.',
  },
  {
    subject: 'Toán học',
    topic: 'Ứng dụng đạo hàm tìm cực trị',
    prompt: 'Nêu quy trình tìm cực trị của hàm số bằng lời và áp dụng vào bài toán tối ưu diện tích thực tế.',
  },
];

export const SelfTestView: React.FC<SelfTestViewProps> = ({ selfTests, onSubmitSelfTest }) => {
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [questionPrompt, setQuestionPrompt] = useState('');
  const [studentExplanation, setStudentExplanation] = useState('');
  const [applicationAnswer, setApplicationAnswer] = useState('');
  const [submittingMode, setSubmittingMode] = useState<'none' | 'local' | 'ai'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEvaluateAndSave = async (useAiEvaluator: boolean) => {
    setErrorMsg(null);
    const err = validateSelfTestInput({
      subject,
      topic,
      questionPrompt,
      studentExplanation,
      applicationAnswer,
    });
    if (err) {
      setErrorMsg(err);
      return;
    }

    setSubmittingMode(useAiEvaluator ? 'ai' : 'local');
    try {
      let score = 0;
      let feedbackSummary = '';

      if (useAiEvaluator) {
        const res = await fetch('/api/gemini/evaluate-self-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            topic: topic.trim(),
            questionPrompt: questionPrompt.trim(),
            studentExplanation: studentExplanation.trim(),
            applicationAnswer: applicationAnswer.trim(),
          }),
        });
        const data = (await res.json()) as {
          score?: number;
          feedbackSummary?: string;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || 'Không thể chấm bài bằng Gemini.');
        }
        score = data.score ?? 75;
        feedbackSummary = data.feedbackSummary ?? 'Đã đánh giá bài tự kiểm tra.';
      } else {
        const localResult = evaluateSelfTestLocally({
          studentExplanation,
          applicationAnswer,
        });
        score = localResult.score;
        feedbackSummary = `${localResult.feedbackSummary} (Chấm theo tiêu chí tự luận độc lập không dùng AI)`;
      }

      await onSubmitSelfTest({
        subject,
        topic: topic.trim(),
        questionPrompt: questionPrompt.trim(),
        studentExplanation: studentExplanation.trim(),
        applicationAnswer: applicationAnswer.trim(),
        score,
        feedbackSummary,
      });

      setTopic('');
      setQuestionPrompt('');
      setStudentExplanation('');
      setApplicationAnswer('');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể nộp bài tự kiểm tra.');
    } finally {
      setSubmittingMode('none');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Phân hệ 05 · Self Test (No-AI Mode)
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Tự kiểm tra năng lực không có AI hỗ trợ
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Tự diễn đạt lại kiến thức bằng ngôn ngữ bản thân và vận dụng vào tình huống mới trước khi chấm điểm.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-50 border border-violet-200 text-xs font-bold text-violet-800">
          <ShieldCheck className="w-4 h-4" />
          <span>Môi trường tự lực · Không gợi ý đáp án</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500">Chọn nhanh đề tự kiểm tra mẫu:</span>
            <div className="flex flex-wrap gap-2">
              {TEST_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.topic}
                  type="button"
                  onClick={() => {
                    setSubject(tpl.subject);
                    setTopic(tpl.topic);
                    setQuestionPrompt(tpl.prompt);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50/70 hover:bg-violet-100/70 text-xs font-medium text-violet-900 cursor-pointer"
                >
                  {tpl.subject}: {tpl.topic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="selftest-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Môn học
              </label>
              <select
                id="selftest-subject"
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
              <label htmlFor="selftest-topic" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chủ đề kiểm tra
              </label>
              <input
                id="selftest-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Nguyên lý I Nhiệt động lực học"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="selftest-prompt" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Câu hỏi / Yêu cầu tự kiểm tra
            </label>
            <input
              id="selftest-prompt"
              type="text"
              value={questionPrompt}
              onChange={(e) => setQuestionPrompt(e.target.value)}
              placeholder="Nhập câu hỏi bạn muốn tự kiểm tra mức độ hiểu bài..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="selftest-explain" className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Giải thích kiến thức bằng ngôn ngữ của chính bạn
            </label>
            <textarea
              id="selftest-explain"
              rows={4}
              value={studentExplanation}
              onChange={(e) => setStudentExplanation(e.target.value)}
              placeholder="Không nhìn tài liệu hay AI — hãy diễn đạt lại bản chất kiến thức..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="selftest-apply" className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. Vận dụng vào một tình huống hoặc bài toán mới
            </label>
            <textarea
              id="selftest-apply"
              rows={4}
              value={applicationAnswer}
              onChange={(e) => setApplicationAnswer(e.target.value)}
              placeholder="Đưa ra một tình huống thực tế hoặc ví dụ mới và giải thích cách áp dụng kiến thức..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              disabled={submittingMode !== 'none'}
              onClick={() => handleEvaluateAndSave(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>
                {submittingMode === 'local' ? 'Đang ghi nhận...' : 'Nộp bài & Tự chấm (Không AI)'}
              </span>
            </button>

            <button
              type="button"
              disabled={submittingMode !== 'none'}
              onClick={() => handleEvaluateAndSave(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 disabled:opacity-60 text-violet-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Award className="w-4 h-4" />
              <span>
                {submittingMode === 'ai' ? 'Đang chấm...' : 'Nộp bài & Đánh giá Rubric (Gemini)'}
              </span>
            </button>
          </div>
        </div>

        {/* Submitted Self Tests */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Kết quả tự kiểm tra ({selfTests.length})
          </h3>

          {selfTests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Chưa có bài Self Test nào</p>
              <p className="text-xs text-slate-500 mt-1">
                Hoàn thành bài tự kiểm tra để khóa kết quả và cập nhật điểm làm chủ tri thức.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selfTests.map((test) => (
                <article
                  key={test.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-700">
                      {test.subject} · {test.topic}
                    </span>
                    <span className="font-mono-num text-sm font-extrabold text-slate-900">
                      {test.score}/100 điểm
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{test.questionPrompt}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Diễn đạt:</strong> {test.studentExplanation}
                  </p>
                  <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-100 text-xs text-violet-950 leading-relaxed">
                    <strong>Nhận xét:</strong> {test.feedbackSummary}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

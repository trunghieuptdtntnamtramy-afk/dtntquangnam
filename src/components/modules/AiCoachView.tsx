import React, { useEffect, useRef, useState } from 'react';
import { Bot, Lightbulb, Send, Sparkles } from 'lucide-react';
import {
  AiCoachMessageItem,
  AiCoachSessionItem,
  ThinkFirstItem,
} from '../../utils/learningLogic';

interface AiCoachViewProps {
  thinkFirstEntries: ThinkFirstItem[];
  sessions: AiCoachSessionItem[];
  selectedThinkFirstId: string | null;
  activeSessionId: string | null;
  messages: AiCoachMessageItem[];
  onSelectThinkFirst: (id: string) => void;
  onStartOrSelectSession: (entry: ThinkFirstItem) => Promise<string>;
  onPersistMessage: (
    sessionId: string,
    msg: { role: 'user' | 'assistant'; content: string; modelUsed: string }
  ) => Promise<void>;
  onGoThinkFirst: () => void;
}

const STARTER_CHIPS = [
  'Hãy nhận xét lập luận Think First của em và đặt câu hỏi gợi mở bước tiếp theo.',
  'Lập luận của em còn thiếu điều kiện hoặc bước suy luận nào quan trọng?',
  'Hãy gợi ý cách em tự kiểm chứng lại giả thuyết này bằng sách giáo khoa.',
];

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  thinkFirstEntries,
  sessions,
  selectedThinkFirstId,
  activeSessionId,
  messages,
  onSelectThinkFirst,
  onStartOrSelectSession,
  onPersistMessage,
  onGoThinkFirst,
}) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const unlockedEntries = thinkFirstEntries.filter((e) => e.unlockedAiCoach);
  const currentEntry =
    unlockedEntries.find((e) => e.id === selectedThinkFirstId) || unlockedEntries[0] || null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const sendMessageToCoach = async (textToSend: string) => {
    if (!currentEntry || !textToSend.trim() || sending) return;
    setErrorMsg(null);
    setSending(true);
    try {
      const sessionId = activeSessionId || (await onStartOrSelectSession(currentEntry));

      await onPersistMessage(sessionId, {
        role: 'user',
        content: textToSend.trim(),
        modelUsed: 'student',
      });

      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: currentEntry.subject,
          topic: currentEntry.promptTitle,
          studentHypothesis: currentEntry.studentHypothesis,
          message: textToSend.trim(),
          history: historyPayload,
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        modelUsed?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Không thể nhận phản hồi từ AI Coach.');
      }

      await onPersistMessage(sessionId, {
        role: 'assistant',
        content: data.reply || 'Hãy thử giải thích rõ hơn bước suy luận của em nhé.',
        modelUsed: data.modelUsed || 'gemini-4-hydrogen (High Thinking)',
      });
      setInput('');
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Đã xảy ra lỗi khi trò chuyện với AI Coach.'
      );
    } finally {
      setSending(false);
    }
  };

  if (unlockedEntries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          AI Coach đang khóa — Cần hoàn thành Think First trước
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Theo nguyên tắc tự học của EDU SMART, bạn cần ghi lại suy nghĩ độc lập ở Phân hệ 02 (Think First) trước khi trao đổi với trợ lý AI gợi mở.
        </p>
        <button
          type="button"
          onClick={onGoThinkFirst}
          className="mt-6 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          Chuyển sang Phân hệ 02 · Think First
        </button>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Phân hệ 03 · AI Coach (Socratic Thinking)
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Trợ lý gợi mở & Định hướng tư duy
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Sử dụng Gemini 4 Hydrogen với chế độ suy luận sâu để gợi mở từng bước thay vì giải hộ.
          </p>
        </div>

        <div className="min-w-[240px]">
          <label htmlFor="coach-topic-select" className="block text-xs font-semibold text-slate-600 mb-1">
            Chủ đề Think First đang thảo luận
          </label>
          <select
            id="coach-topic-select"
            value={currentEntry?.id || ''}
            onChange={(e) => onSelectThinkFirst(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
          >
            {unlockedEntries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                [{entry.subject}] {entry.promptTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Context sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
              <Sparkles className="w-4 h-4" />
              <span>Bối cảnh Think First của bạn</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{currentEntry?.promptTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {currentEntry?.studentHypothesis}
            </p>
            <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
              <span>Môn: {currentEntry?.subject}</span>
              <span className="font-mono-num">
                Lượt trao đổi: {currentSession?.messageCount ?? messages.length}
              </span>
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Gợi ý câu hỏi cho AI Coach
            </h4>
            <div className="space-y-2">
              {STARTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={sending}
                  onClick={() => sendMessageToCoach(chip)}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Scrollable multi-turn chat thread */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col h-[540px]">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Phiên đối thoại Socratic</h3>
                <p className="text-[11px] text-slate-500">
                  Nguyên tắc: Gợi ý định hướng · Không chép sẵn đáp án
                </p>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40"
            data-testid="ai-coach-thread"
          >
            {messages.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bot className="w-9 h-9 text-indigo-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  Sẵn sàng đồng hành cùng lập luận của bạn
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Hãy chọn một câu hỏi gợi ý bên trái hoặc nhập điều bạn còn băn khoăn để AI Coach đặt câu hỏi định hướng.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {msg.content}
                    {msg.role === 'assistant' && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-400">
                        {msg.modelUsed}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-white border border-slate-200 text-xs text-slate-500">
                  AI Coach đang suy nghĩ gợi ý Socratic...
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mx-5 mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessageToCoach(input);
            }}
            className="p-4 border-t border-slate-100 flex items-center gap-2.5 bg-white rounded-b-2xl"
          >
            <label htmlFor="coach-chat-input" className="sr-only">
              Nhập câu hỏi cho AI Coach
            </label>
            <input
              id="coach-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi AI Coach về bước em đang vướng..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

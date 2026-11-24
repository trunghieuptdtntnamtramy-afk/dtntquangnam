import React, { useMemo, useState } from 'react';
import { BarChart3, BookOpenCheck, CalendarCheck, ClipboardCheck, Lightbulb, Users } from 'lucide-react';
import {
  computeLearningProgress,
  FactCheckItem,
  SelfTestItem,
  StudyPlanItem,
  ThinkFirstItem,
  AiCoachSessionItem,
} from '../../utils/learningLogic';

interface LearningProgressViewProps {
  isTeacherRole: boolean;
  studentName: string;
  plans: StudyPlanItem[];
  thinkFirsts: ThinkFirstItem[];
  coachSessions: AiCoachSessionItem[];
  factChecks: FactCheckItem[];
  selfTests: SelfTestItem[];
  onNavigateTab: (tab: string) => void;
}

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({
  isTeacherRole,
  studentName,
  plans,
  thinkFirsts,
  coachSessions,
  factChecks,
  selfTests,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>(
    isTeacherRole ? 'teacher' : 'student'
  );

  const summary = useMemo(
    () =>
      computeLearningProgress({
        plans,
        thinkFirsts,
        coachSessions,
        factChecks,
        selfTests,
      }),
    [plans, thinkFirsts, coachSessions, factChecks, selfTests]
  );

  // Group records by student for teacher oversight
  const studentRoster = useMemo(() => {
    const map = new Map<
      string,
      {
        studentName: string;
        plans: number;
        completedPlans: number;
        thinkFirsts: number;
        factChecks: number;
        selfTests: number;
        avgScore: number;
        scoreSum: number;
      }
    >();
    const ensure = (uid: string, name: string) => {
      if (!map.has(uid)) {
        map.set(uid, {
          studentName: name || 'Học sinh',
          plans: 0,
          completedPlans: 0,
          thinkFirsts: 0,
          factChecks: 0,
          selfTests: 0,
          avgScore: 0,
          scoreSum: 0,
        });
      }
      return map.get(uid)!;
    };

    for (const p of plans) {
      const s = ensure(p.userId, p.studentName);
      s.plans += 1;
      if (p.status === 'completed') s.completedPlans += 1;
    }
    for (const t of thinkFirsts) {
      ensure(t.userId, t.studentName).thinkFirsts += 1;
    }
    for (const f of factChecks) {
      ensure(f.userId, f.studentName).factChecks += 1;
    }
    for (const st of selfTests) {
      const s = ensure(st.userId, st.studentName);
      s.selfTests += 1;
      s.scoreSum += st.score;
      s.avgScore = Math.round(s.scoreSum / s.selfTests);
    }

    return Array.from(map.entries()).map(([uid, row]) => ({ uid, ...row }));
  }, [plans, thinkFirsts, factChecks, selfTests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
            Hệ thống hỗ trợ · Learning Progress
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Tổng quan tiến độ & Đánh giá năng lực tự học
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Theo dõi đồng bộ 05 phân hệ của {studentName} và bảng tổng hợp dành cho giáo viên hướng dẫn.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('student')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'student'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Góc nhìn Học sinh
          </button>
          <button
            type="button"
            onClick={() => setViewMode('teacher')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'teacher'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Góc nhìn Giáo viên
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Chỉ số tự chủ tri thức</span>
            <BarChart3 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono-num">
            {summary.masteryIndex}/100
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp từ cả 5 phân hệ học tập
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Hoàn thành kế hoạch</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono-num">
            {summary.planCompletionRate}%
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono-num">
            {summary.completedMinutes}/{summary.totalPlannedMinutes} phút đã hoàn thành
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tư duy & Phản biện</span>
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono-num">
            {summary.thinkFirstCount + summary.factCheckCount}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono-num">
            {summary.thinkFirstCount} Think First · {summary.factCheckCount} Fact Check
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Điểm Self Test TB</span>
            <ClipboardCheck className="w-4 h-4 text-violet-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono-num">
            {summary.averageSelfTestScore}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono-num">
            Trên {summary.selfTestCount} bài tự kiểm tra
          </p>
        </div>
      </div>

      {viewMode === 'student' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Subject Breakdown Table */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Thống kê rèn luyện theo môn học
            </h3>

            {summary.bySubject.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Chưa có dữ liệu môn học. Hãy bắt đầu tạo kế hoạch ở Phân hệ 01.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="py-2.5 pr-4">Môn học</th>
                      <th className="py-2.5 px-3 text-right">Study Plan</th>
                      <th className="py-2.5 px-3 text-right">Think First</th>
                      <th className="py-2.5 px-3 text-right">Fact Check</th>
                      <th className="py-2.5 pl-3 text-right">Self Test</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.bySubject.map((row) => (
                      <tr key={row.subject} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-4 font-semibold text-slate-900">{row.subject}</td>
                        <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                          {row.completedPlans}/{row.plans}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                          {row.thinkFirsts}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                          {row.factChecks}
                        </td>
                        <td className="py-3 pl-3 text-right font-mono-num text-slate-700">
                          {row.selfTests}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Jump Checklist */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Chu trình tự học đề xuất</h3>
            <div className="space-y-2.5">
              {[
                {
                  tab: 'study-plan',
                  title: '01. Lập kế hoạch học tập',
                  meta: `${summary.totalPlans} nhiệm vụ`,
                },
                {
                  tab: 'think-first',
                  title: '02. Suy nghĩ độc lập (Think First)',
                  meta: `${summary.thinkFirstCount} bản nháp`,
                },
                {
                  tab: 'ai-coach',
                  title: '03. Đối thoại gợi mở với AI Coach',
                  meta: `${summary.coachSessionCount} phiên`,
                },
                {
                  tab: 'fact-check',
                  title: '04. Đối chiếu SGK & Kiểm chứng',
                  meta: `${summary.factCheckCount} phiếu`,
                },
                {
                  tab: 'self-test',
                  title: '05. Tự kiểm tra không có AI',
                  meta: `${summary.selfTestCount} bài nộp`,
                },
              ].map((step) => (
                <button
                  key={step.tab}
                  type="button"
                  onClick={() => onNavigateTab(step.tab)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-left transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-900">{step.title}</span>
                  <span className="text-xs font-mono-num font-bold text-sky-700">{step.meta}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-bold text-slate-900">
                Bảng theo dõi tiến độ học sinh (Dành cho Giáo viên)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {isTeacherRole
                ? 'Đang hiển thị dữ liệu lớp từ tài khoản giáo viên'
                : 'Đang xem dữ liệu cá nhân (Đăng nhập bằng tài khoản giáo viên để xem toàn lớp)'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-2.5 pr-4">Học sinh</th>
                  <th className="py-2.5 px-3 text-right">Kế hoạch HT</th>
                  <th className="py-2.5 px-3 text-right">Think First</th>
                  <th className="py-2.5 px-3 text-right">Fact Check</th>
                  <th className="py-2.5 px-3 text-right">Self Test</th>
                  <th className="py-2.5 pl-3 text-right">Điểm TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRoster.map((row) => (
                  <tr key={row.uid} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{row.studentName}</td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                      {row.completedPlans}/{row.plans}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                      {row.thinkFirsts}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                      {row.factChecks}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                      {row.selfTests}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono-num font-bold text-sky-700">
                      {row.avgScore}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-start gap-3 text-xs text-slate-700">
            <BookOpenCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Giáo viên có thể xuất bảng tiến độ này sang <strong>Google Sheets</strong>, gửi phản hồi cho học sinh qua <strong>Gmail</strong>, hoặc mở phòng phụ đạo trực tuyến qua <strong>Google Meet</strong> ngay trong mục <strong>Google Workspace</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

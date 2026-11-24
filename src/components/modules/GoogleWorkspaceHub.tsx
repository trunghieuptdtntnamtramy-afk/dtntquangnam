import React, { useState } from 'react';
import {
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  FormInput,
  Mail,
  Presentation,
  RefreshCw,
  Send,
  Video,
} from 'lucide-react';
import {
  createGoogleMeetSpace,
  createSelfTestGoogleForm,
  createStudyGoogleDoc,
  createSummaryGoogleSlides,
  DriveFileItem,
  exportProgressToGoogleSheets,
  GmailMessageSummary,
  listDriveFiles,
  listRecentGmailMessages,
  sendGmailMessage,
} from '../../lib/workspaceApi';
import {
  computeLearningProgress,
  FactCheckItem,
  SelfTestItem,
  StudyPlanItem,
  ThinkFirstItem,
  AiCoachSessionItem,
} from '../../utils/learningLogic';
import { ConfirmActionModal } from '../ConfirmActionModal';

interface GoogleWorkspaceHubProps {
  accessToken: string | null;
  studentName: string;
  userEmail: string;
  plans: StudyPlanItem[];
  thinkFirsts: ThinkFirstItem[];
  coachSessions: AiCoachSessionItem[];
  factChecks: FactCheckItem[];
  selfTests: SelfTestItem[];
  onTriggerGoogleSignIn: () => Promise<void>;
}

interface PendingConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<void>;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  accessToken,
  studentName,
  userEmail,
  plans,
  thinkFirsts,
  coachSessions,
  factChecks,
  selfTests,
  onTriggerGoogleSignIn,
}) => {
  const [driveSearch, setDriveSearch] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [emailTo, setEmailTo] = useState(userEmail || '');
  const [emailSubject, setEmailSubject] = useState(`Báo cáo tự học EDU SMART — ${studentName}`);
  const [emailBody, setEmailBody] = useState('');

  const [createdLinks, setCreatedLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [loadingOp, setLoadingOp] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<PendingConfirmState | null>(null);

  const summary = computeLearningProgress({
    plans,
    thinkFirsts,
    coachSessions,
    factChecks,
    selfTests,
  });

  const requireTokenOrPrompt = (): string | null => {
    if (!accessToken) {
      setErrorMsg('Phiên Google Workspace chưa được kết nối. Vui lòng nhấn "Kết nối Google Workspace" hoặc "Sign in with Google" bên trên.');
      return null;
    }
    return accessToken;
  };

  const handleLoadDrive = async () => {
    const token = requireTokenOrPrompt();
    if (!token) return;
    setErrorMsg(null);
    setLoadingOp('drive');
    try {
      const files = await listDriveFiles(token, driveSearch);
      setDriveFiles(files);
      setStatusMsg(`Đã tải ${files.length} tệp từ Google Drive.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể đọc Google Drive.');
    } finally {
      setLoadingOp(null);
    }
  };

  const handleLoadGmail = async () => {
    const token = requireTokenOrPrompt();
    if (!token) return;
    setErrorMsg(null);
    setLoadingOp('gmail-read');
    try {
      const msgs = await listRecentGmailMessages(token);
      setGmailMessages(msgs);
      setStatusMsg(`Đã tải ${msgs.length} email gần đây từ Gmail.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể đọc hộp thư Gmail.');
    } finally {
      setLoadingOp(null);
    }
  };

  const requestExportSheets = () => {
    const token = requireTokenOrPrompt();
    if (!token) return;
    const title = `EDU SMART · Tiến độ tự học (${studentName})`;
    setConfirmState({
      title: 'Tạo bảng tính Google Sheets mới?',
      description: `Hệ thống sẽ tạo tệp Google Sheets "${title}" chứa ${plans.length} nhiệm vụ Study Plan và chỉ số tiến độ hiện tại trong tài khoản Google của bạn.`,
      confirmLabel: 'Tạo Google Sheets',
      action: async () => {
        const rows: (string | number)[][] = [
          ['Môn học', 'Nhiệm vụ', 'Mục tiêu', 'Thời lượng (phút)', 'Ngày', 'Trạng thái'],
          ...plans.map((p) => [p.subject, p.title, p.goal, p.targetMinutes, p.scheduledDate, p.status]),
          [],
          ['Tổng kết Chỉ số Tự chủ Tri thức', `${summary.masteryIndex}/100`],
          ['Tỷ lệ hoàn thành Study Plan', `${summary.planCompletionRate}%`],
        ];
        const result = await exportProgressToGoogleSheets(token, title, rows);
        setCreatedLinks((prev) => [
          { label: `Google Sheets: ${title}`, url: result.spreadsheetUrl },
          ...prev,
        ]);
        setStatusMsg(`Đã tạo bảng tính Google Sheets thành công (tab ${result.sheetTitle}).`);
      },
    });
  };

  const requestCreateDoc = () => {
    const token = requireTokenOrPrompt();
    if (!token) return;
    const title = `EDU SMART · Nhật ký Think First & Fact Check (${studentName})`;
    const bodyText = [
      `NHẬT KÝ TỰ HỌC EDU SMART — ${studentName}`,
      `Chỉ số tự chủ: ${summary.masteryIndex}/100 | Hoàn thành kế hoạch: ${summary.planCompletionRate}%`,
      '',
      '=== PHÂN HỆ 02: THINK FIRST ===',
      ...thinkFirsts.map(
        (t, idx) =>
          `${idx + 1}. [${t.subject}] ${t.promptTitle}\n   Suy nghĩ độc lập: ${t.studentHypothesis}`
      ),
      '',
      '=== PHÂN HỆ 04: FACT CHECK ===',
      ...factChecks.map(
        (f, idx) =>
          `${idx + 1}. [${f.subject}] Nhận định: ${f.aiClaim}\n   Nguồn SGK: ${f.textbookSource}\n   Lập luận: ${f.studentArgument}`
      ),
    ].join('\n');

    setConfirmState({
      title: 'Tạo tài liệu Google Docs mới?',
      description: `Hệ thống sẽ tạo Google Docs "${title}" tổng hợp ${thinkFirsts.length} ghi chú Think First và ${factChecks.length} phiếu Fact Check.`,
      confirmLabel: 'Tạo Google Docs',
      action: async () => {
        const result = await createStudyGoogleDoc(token, title, bodyText);
        setCreatedLinks((prev) => [
          { label: `Google Docs: ${title}`, url: result.documentUrl },
          ...prev,
        ]);
        setStatusMsg('Đã tạo tài liệu Google Docs thành công.');
      },
    });
  };

  const requestCreateSlides = () => {
    const token = requireTokenOrPrompt();
    if (!token) return;
    const title = `EDU SMART · Tóm tắt bài học (${studentName})`;
    const bulletSummary = [
      `Môn học đã rèn luyện: ${summary.bySubject.map((s) => s.subject).join(', ') || 'Tổng hợp'}`,
      `Hoàn thành ${summary.completedPlans}/${summary.totalPlans} kế hoạch (${summary.completedMinutes} phút)`,
      `Điểm Self Test trung bình: ${summary.averageSelfTestScore}/100`,
    ].join('\n');

    setConfirmState({
      title: 'Tạo bản trình chiếu Google Slides mới?',
      description: `Hệ thống sẽ tạo bài thuyết trình "${title}" trên Google Slides để phục vụ báo cáo học tập.`,
      confirmLabel: 'Tạo Google Slides',
      action: async () => {
        const result = await createSummaryGoogleSlides(token, title, bulletSummary);
        setCreatedLinks((prev) => [
          { label: `Google Slides: ${title}`, url: result.presentationUrl },
          ...prev,
        ]);
        setStatusMsg('Đã tạo bản trình chiếu Google Slides thành công.');
      },
    });
  };

  const requestCreateForm = () => {
    const token = requireTokenOrPrompt();
    if (!token) return;
    const title = `EDU SMART · Phiếu Self Test (${studentName})`;
    const questions = [
      'Hãy giải thích khái niệm trọng tâm em vừa học bằng ngôn ngữ của chính em:',
      'Nêu một ví dụ thực tiễn hoặc tình huống mới áp dụng kiến thức này:',
      'Điểm nào em thấy cần kiểm chứng thêm trong sách giáo khoa?',
    ];

    setConfirmState({
      title: 'Tạo biểu mẫu Google Forms mới?',
      description: `Hệ thống sẽ tạo biểu mẫu "${title}" gồm 3 câu hỏi tự luận kiểm tra năng lực không dùng AI.`,
      confirmLabel: 'Tạo Google Forms',
      action: async () => {
        const result = await createSelfTestGoogleForm(token, title, questions);
        setCreatedLinks((prev) => [
          { label: `Google Forms: ${title}`, url: result.responderUri },
          ...prev,
        ]);
        setStatusMsg('Đã tạo biểu mẫu Google Forms thành công.');
      },
    });
  };

  const requestCreateMeet = () => {
    const token = requireTokenOrPrompt();
    if (!token) return;
    setConfirmState({
      title: 'Tạo phòng học Google Meet mới?',
      description:
        'Hệ thống sẽ khởi tạo một phòng họp Google Meet mới để học sinh trao đổi hướng dẫn trực tiếp cùng giáo viên.',
      confirmLabel: 'Tạo phòng Meet',
      action: async () => {
        const result = await createGoogleMeetSpace(token);
        setCreatedLinks((prev) => [
          { label: `Google Meet (${result.meetingCode})`, url: result.meetingUri },
          ...prev,
        ]);
        setStatusMsg(`Đã tạo phòng Google Meet: ${result.meetingCode}`);
      },
    });
  };

  const requestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const token = requireTokenOrPrompt();
    if (!token) return;
    if (!emailTo.trim() || !emailSubject.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ địa chỉ người nhận và tiêu đề email.');
      return;
    }
    const content =
      emailBody.trim() ||
      `Kính gửi thầy/cô,\n\nEm là ${studentName}. Em xin gửi báo cáo tiến độ tự học trên EDU SMART:\n- Chỉ số tự chủ tri thức: ${summary.masteryIndex}/100\n- Kế hoạch hoàn thành: ${summary.completedPlans}/${summary.totalPlans}\n- Điểm Self Test TB: ${summary.averageSelfTestScore}/100.\n\nTrân trọng.`;

    setConfirmState({
      title: 'Xác nhận gửi email qua Gmail?',
      description: `Email sẽ được gửi trực tiếp từ tài khoản Gmail của bạn.\nNgười nhận: ${emailTo.trim()}\nTiêu đề: ${emailSubject.trim()}`,
      confirmLabel: 'Gửi Gmail',
      action: async () => {
        await sendGmailMessage(token, emailTo.trim(), emailSubject.trim(), content);
        setStatusMsg(`Đã gửi email thành công tới ${emailTo.trim()}.`);
        setEmailBody('');
      },
    });
  };

  const runConfirmedAction = async () => {
    if (!confirmState) return;
    setErrorMsg(null);
    setLoadingOp('confirm');
    try {
      await confirmState.action();
      setConfirmState(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Thao tác Google Workspace thất bại.');
      setConfirmState(null);
    } finally {
      setLoadingOp(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
            Tích hợp hệ sinh thái học tập
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Google Workspace cho Giáo dục
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Kết nối trực tiếp Google Drive, Sheets, Docs, Slides, Forms, Meet và Gmail để lưu trữ và chia sẻ kết quả tự học.
          </p>
        </div>

        <button
          type="button"
          onClick={onTriggerGoogleSignIn}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4 text-sky-600" />
          <span>{accessToken ? 'Làm mới kết nối Google Workspace' : 'Kết nối Google Workspace'}</span>
        </button>
      </div>

      {!accessToken && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            Bạn cần đăng nhập bằng Google (và cấp quyền Workspace trong cửa sổ bật lên) để sử dụng các tác vụ đọc/tạo tệp thực tế trên Google Drive, Sheets, Docs, Slides, Forms, Meet và Gmail.
          </span>
          <button
            type="button"
            onClick={onTriggerGoogleSignIn}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Quick Export & Creation Actions (Sheets, Docs, Slides, Forms, Meet) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={requestExportSheets}
          className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer space-y-2"
        >
          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          <div className="text-sm font-bold text-slate-900">Google Sheets</div>
          <p className="text-xs text-slate-500">Xuất bảng kế hoạch & tiến độ học tập</p>
        </button>

        <button
          type="button"
          onClick={requestCreateDoc}
          className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-colors cursor-pointer space-y-2"
        >
          <FileText className="w-6 h-6 text-sky-600" />
          <div className="text-sm font-bold text-slate-900">Google Docs</div>
          <p className="text-xs text-slate-500">Xuất nhật ký Think First & Fact Check</p>
        </button>

        <button
          type="button"
          onClick={requestCreateSlides}
          className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer space-y-2"
        >
          <Presentation className="w-6 h-6 text-amber-600" />
          <div className="text-sm font-bold text-slate-900">Google Slides</div>
          <p className="text-xs text-slate-500">Tạo slide tóm tắt kết quả rèn luyện</p>
        </button>

        <button
          type="button"
          onClick={requestCreateForm}
          className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-colors cursor-pointer space-y-2"
        >
          <FormInput className="w-6 h-6 text-violet-600" />
          <div className="text-sm font-bold text-slate-900">Google Forms</div>
          <p className="text-xs text-slate-500">Tạo phiếu tự kiểm tra Self Test</p>
        </button>

        <button
          type="button"
          onClick={requestCreateMeet}
          className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer space-y-2"
        >
          <Video className="w-6 h-6 text-indigo-600" />
          <div className="text-sm font-bold text-slate-900">Google Meet</div>
          <p className="text-xs text-slate-500">Mở phòng trao đổi cùng giáo viên</p>
        </button>
      </div>

      {createdLinks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">Tài nguyên vừa tạo trong phiên này</h3>
          <div className="space-y-1.5">
            {createdLinks.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs font-semibold text-sky-700"
              >
                <span className="truncate">{item.label}</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Drive Browser & Gmail Panel */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-bold text-slate-900">Học liệu trên Google Drive</h3>
            </div>
            <button
              type="button"
              onClick={handleLoadDrive}
              disabled={loadingOp === 'drive'}
              className="px-3.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold cursor-pointer"
            >
              {loadingOp === 'drive' ? 'Đang tải...' : 'Tải danh sách tệp'}
            </button>
          </div>

          <div className="flex gap-2">
            <label htmlFor="drive-search" className="sr-only">Tìm tệp trong Google Drive</label>
            <input
              id="drive-search"
              type="text"
              value={driveSearch}
              onChange={(e) => setDriveSearch(e.target.value)}
              placeholder="Tìm tên tài liệu học tập..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
            />
            <button
              type="button"
              onClick={handleLoadDrive}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Tìm
            </button>
          </div>

          {driveFiles.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nhấn “Tải danh sách tệp” sau khi kết nối Google để xem học liệu của bạn trên Drive.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-slate-900 truncate">{file.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{file.mimeType}</div>
                  </div>
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-sky-700 hover:underline shrink-0"
                    >
                      Mở
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gmail Panel */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Trao đổi qua Gmail</h3>
            </div>
            <button
              type="button"
              onClick={handleLoadGmail}
              disabled={loadingOp === 'gmail-read'}
              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
            >
              {loadingOp === 'gmail-read' ? 'Đang tải...' : 'Đọc hộp thư'}
            </button>
          </div>

          <form onSubmit={requestSendEmail} className="space-y-3 border-b border-slate-100 pb-4">
            <div className="grid sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="gmail-to" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Gửi tới email
                </label>
                <input
                  id="gmail-to"
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="giaovien@truong.edu.vn"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="gmail-subject" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tiêu đề
                </label>
                <input
                  id="gmail-subject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>
            <div>
              <label htmlFor="gmail-body" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nội dung (để trống sẽ tự điền tóm tắt tiến độ tự học)
              </label>
              <textarea
                id="gmail-body"
                rows={2}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Nhập lời nhắn gửi giáo viên hoặc bản thân..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Soạn & Gửi qua Gmail</span>
            </button>
          </form>

          {gmailMessages.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {gmailMessages.map((msg) => (
                <div key={msg.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate">{msg.subject}</div>
                  <div className="text-[11px] text-slate-500 truncate">{msg.from}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmActionModal
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        description={confirmState?.description || ''}
        confirmLabel={confirmState?.confirmLabel}
        isBusy={loadingOp === 'confirm'}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
};

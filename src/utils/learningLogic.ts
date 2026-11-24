export type UserRole = 'student' | 'teacher';
export type StudyPlanStatus = 'pending' | 'completed' | 'incomplete';
export type FactCheckStatus = 'accurate' | 'needs_context' | 'inaccurate';
export type SelfTestStatus = 'draft' | 'submitted';

export const BOOTSTRAP_ADMIN_EMAIL = 'trunghieuptdtntnamtramy@gmail.com';

export const SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'GDKT & PL',
  'Tin học',
] as const;

export const VALIDATION_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  idMaxLength: 128,
  displayNameMax: 100,
  emailMax: 150,
  classNameMax: 50,
  schoolNameMax: 120,
  subjectMax: 60,
  planTitleMin: 2,
  planTitleMax: 160,
  planGoalMin: 2,
  planGoalMax: 500,
  planMinutesMin: 5,
  planMinutesMax: 480,
  reflectionMax: 500,
  thinkTitleMin: 2,
  thinkTitleMax: 200,
  thinkHypothesisMin: 20,
  thinkHypothesisMax: 4000,
  confidenceMin: 1,
  confidenceMax: 5,
  sessionTopicMin: 2,
  sessionTopicMax: 200,
  coachMessageMax: 8000,
  modelUsedMax: 80,
  factClaimMin: 5,
  factClaimMax: 2000,
  textbookSourceMin: 2,
  textbookSourceMax: 300,
  studentArgumentMin: 10,
  studentArgumentMax: 3000,
  aiDeepReviewMax: 4000,
  selfTestTopicMin: 2,
  selfTestTopicMax: 200,
  selfTestPromptMin: 5,
  selfTestPromptMax: 1000,
  selfTestExplanationMin: 15,
  selfTestExplanationMax: 4000,
  selfTestApplicationMin: 10,
  selfTestApplicationMax: 4000,
  feedbackSummaryMax: 3000,
} as const;

export interface StudyPlanItem {
  id: string;
  userId: string;
  studentName: string;
  subject: string;
  title: string;
  goal: string;
  targetMinutes: number;
  scheduledDate: string;
  status: StudyPlanStatus;
  reflectionReason: string;
  createdAtMs?: number;
}

export interface ThinkFirstItem {
  id: string;
  userId: string;
  studentName: string;
  subject: string;
  promptTitle: string;
  studentHypothesis: string;
  confidenceLevel: number;
  unlockedAiCoach: boolean;
  createdAtMs?: number;
}

export interface AiCoachSessionItem {
  id: string;
  userId: string;
  thinkFirstId: string;
  subject: string;
  topic: string;
  messageCount: number;
  createdAtMs?: number;
}

export interface AiCoachMessageItem {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed: string;
  createdAtMs?: number;
}

export interface FactCheckItem {
  id: string;
  userId: string;
  studentName: string;
  subject: string;
  aiClaim: string;
  textbookSource: string;
  verificationStatus: FactCheckStatus;
  studentArgument: string;
  aiDeepReview: string;
  createdAtMs?: number;
}

export interface SelfTestItem {
  id: string;
  userId: string;
  studentName: string;
  subject: string;
  topic: string;
  questionPrompt: string;
  studentExplanation: string;
  applicationAnswer: string;
  score: number;
  feedbackSummary: string;
  status: SelfTestStatus;
  createdAtMs?: number;
}

export interface LearningProgressSummary {
  totalPlans: number;
  completedPlans: number;
  incompletePlans: number;
  planCompletionRate: number;
  totalPlannedMinutes: number;
  completedMinutes: number;
  thinkFirstCount: number;
  unlockedCoachCount: number;
  coachSessionCount: number;
  factCheckCount: number;
  factInaccurateCaught: number;
  selfTestCount: number;
  averageSelfTestScore: number;
  masteryIndex: number;
  bySubject: Array<{
    subject: string;
    plans: number;
    completedPlans: number;
    thinkFirsts: number;
    factChecks: number;
    selfTests: number;
  }>;
}

export function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function isValidDocumentId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= VALIDATION_LIMITS.idMaxLength &&
    VALIDATION_LIMITS.idPattern.test(id)
  );
}

export function validateStudyPlanInput(input: {
  subject: string;
  title: string;
  goal: string;
  targetMinutes: number;
  scheduledDate: string;
}): string | null {
  const title = input.title.trim();
  const goal = input.goal.trim();
  const subject = input.subject.trim();
  const scheduledDate = input.scheduledDate.trim();

  if (!subject || subject.length > VALIDATION_LIMITS.subjectMax) {
    return 'Vui lòng chọn môn học hợp lệ.';
  }
  if (title.length < VALIDATION_LIMITS.planTitleMin || title.length > VALIDATION_LIMITS.planTitleMax) {
    return `Tên nhiệm vụ phải từ ${VALIDATION_LIMITS.planTitleMin} đến ${VALIDATION_LIMITS.planTitleMax} ký tự.`;
  }
  if (goal.length < VALIDATION_LIMITS.planGoalMin || goal.length > VALIDATION_LIMITS.planGoalMax) {
    return `Mục tiêu học tập phải từ ${VALIDATION_LIMITS.planGoalMin} đến ${VALIDATION_LIMITS.planGoalMax} ký tự.`;
  }
  if (
    !Number.isInteger(input.targetMinutes) ||
    input.targetMinutes < VALIDATION_LIMITS.planMinutesMin ||
    input.targetMinutes > VALIDATION_LIMITS.planMinutesMax
  ) {
    return `Thời lượng dự kiến phải từ ${VALIDATION_LIMITS.planMinutesMin} đến ${VALIDATION_LIMITS.planMinutesMax} phút.`;
  }
  if (scheduledDate.length < 8 || scheduledDate.length > 20) {
    return 'Vui lòng chọn ngày thực hiện hợp lệ.';
  }
  return null;
}

export function validateThinkFirstInput(input: {
  subject: string;
  promptTitle: string;
  studentHypothesis: string;
  confidenceLevel: number;
}): string | null {
  const title = input.promptTitle.trim();
  const hypothesis = input.studentHypothesis.trim();
  if (!input.subject.trim() || input.subject.trim().length > VALIDATION_LIMITS.subjectMax) {
    return 'Vui lòng chọn môn học hợp lệ.';
  }
  if (title.length < VALIDATION_LIMITS.thinkTitleMin || title.length > VALIDATION_LIMITS.thinkTitleMax) {
    return `Chủ đề hoặc câu hỏi phải từ ${VALIDATION_LIMITS.thinkTitleMin} đến ${VALIDATION_LIMITS.thinkTitleMax} ký tự.`;
  }
  if (hypothesis.length < VALIDATION_LIMITS.thinkHypothesisMin) {
    return `Hãy trình bày suy nghĩ độc lập của bạn ít nhất ${VALIDATION_LIMITS.thinkHypothesisMin} ký tự trước khi mở khóa AI Coach.`;
  }
  if (hypothesis.length > VALIDATION_LIMITS.thinkHypothesisMax) {
    return `Nội dung suy nghĩ vượt quá ${VALIDATION_LIMITS.thinkHypothesisMax} ký tự.`;
  }
  if (
    !Number.isInteger(input.confidenceLevel) ||
    input.confidenceLevel < VALIDATION_LIMITS.confidenceMin ||
    input.confidenceLevel > VALIDATION_LIMITS.confidenceMax
  ) {
    return 'Mức độ tự tin phải nằm trong khoảng 1 đến 5.';
  }
  return null;
}

export function validateFactCheckInput(input: {
  subject: string;
  aiClaim: string;
  textbookSource: string;
  studentArgument: string;
}): string | null {
  if (!input.subject.trim()) return 'Vui lòng chọn môn học.';
  if (input.aiClaim.trim().length < VALIDATION_LIMITS.factClaimMin) {
    return `Nội dung cần kiểm chứng phải có ít nhất ${VALIDATION_LIMITS.factClaimMin} ký tự.`;
  }
  if (input.textbookSource.trim().length < VALIDATION_LIMITS.textbookSourceMin) {
    return 'Vui lòng nêu rõ nguồn đối chiếu (SGK, trang, bài học hoặc tài liệu chính thống).';
  }
  if (input.studentArgument.trim().length < VALIDATION_LIMITS.studentArgumentMin) {
    return `Lập luận cá nhân phải có ít nhất ${VALIDATION_LIMITS.studentArgumentMin} ký tự.`;
  }
  return null;
}

export function validateSelfTestInput(input: {
  subject: string;
  topic: string;
  questionPrompt: string;
  studentExplanation: string;
  applicationAnswer: string;
}): string | null {
  if (!input.subject.trim()) return 'Vui lòng chọn môn học.';
  if (input.topic.trim().length < VALIDATION_LIMITS.selfTestTopicMin) {
    return 'Vui lòng nhập chủ đề tự kiểm tra.';
  }
  if (input.questionPrompt.trim().length < VALIDATION_LIMITS.selfTestPromptMin) {
    return 'Vui lòng nhập hoặc chọn câu hỏi tự kiểm tra.';
  }
  if (input.studentExplanation.trim().length < VALIDATION_LIMITS.selfTestExplanationMin) {
    return `Phần giải thích bằng ngôn ngữ của bạn cần ít nhất ${VALIDATION_LIMITS.selfTestExplanationMin} ký tự.`;
  }
  if (input.applicationAnswer.trim().length < VALIDATION_LIMITS.selfTestApplicationMin) {
    return `Phần vận dụng vào tình huống mới cần ít nhất ${VALIDATION_LIMITS.selfTestApplicationMin} ký tự.`;
  }
  return null;
}

export function evaluateSelfTestLocally(input: {
  studentExplanation: string;
  applicationAnswer: string;
}): { score: number; feedbackSummary: string } {
  const explanationWords = input.studentExplanation.trim().split(/\s+/).filter(Boolean).length;
  const applicationWords = input.applicationAnswer.trim().split(/\s+/).filter(Boolean).length;

  let score = 40;
  if (explanationWords >= 12) score += 20;
  if (explanationWords >= 28) score += 10;
  if (applicationWords >= 10) score += 20;
  if (applicationWords >= 22) score += 10;

  score = Math.max(0, Math.min(100, score));

  const feedbackParts: string[] = [];
  if (explanationWords >= 25) {
    feedbackParts.push('Bạn đã diễn đạt khái niệm bằng ngôn ngữ cá nhân tương đối mạch lạc.');
  } else {
    feedbackParts.push('Phần giải thích còn ngắn; hãy bổ sung định nghĩa cốt lõi và mối liên hệ nhân quả.');
  }
  if (applicationWords >= 18) {
    feedbackParts.push('Ví dụ vận dụng thực tế rõ ràng, thể hiện khả năng chuyển hóa kiến thức.');
  } else {
    feedbackParts.push('Nên cụ thể hóa tình huống vận dụng bằng số liệu hoặc dẫn chứng thực tế.');
  }

  return {
    score,
    feedbackSummary: feedbackParts.join(' '),
  };
}

export function computeLearningProgress(data: {
  plans: StudyPlanItem[];
  thinkFirsts: ThinkFirstItem[];
  coachSessions: AiCoachSessionItem[];
  factChecks: FactCheckItem[];
  selfTests: SelfTestItem[];
}): LearningProgressSummary {
  const totalPlans = data.plans.length;
  const completedPlans = data.plans.filter((p) => p.status === 'completed').length;
  const incompletePlans = data.plans.filter((p) => p.status === 'incomplete').length;
  const planCompletionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  const totalPlannedMinutes = data.plans.reduce((acc, p) => acc + p.targetMinutes, 0);
  const completedMinutes = data.plans
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + p.targetMinutes, 0);

  const thinkFirstCount = data.thinkFirsts.length;
  const unlockedCoachCount = data.thinkFirsts.filter((t) => t.unlockedAiCoach).length;
  const coachSessionCount = data.coachSessions.length;
  const factCheckCount = data.factChecks.length;
  const factInaccurateCaught = data.factChecks.filter((f) => f.verificationStatus === 'inaccurate').length;

  const submittedTests = data.selfTests.filter((t) => t.status === 'submitted');
  const selfTestCount = submittedTests.length;
  const averageSelfTestScore =
    selfTestCount > 0
      ? Math.round(submittedTests.reduce((acc, t) => acc + t.score, 0) / selfTestCount)
      : 0;

  // Weighted mastery index (0..100) across the 5 modules
  const planWeight = totalPlans > 0 ? Math.min(25, Math.round((planCompletionRate / 100) * 25)) : 0;
  const thinkWeight = Math.min(20, thinkFirstCount * 7);
  const coachWeight = Math.min(15, coachSessionCount * 5);
  const factWeight = Math.min(20, factCheckCount * 7);
  const testWeight = selfTestCount > 0 ? Math.round((averageSelfTestScore / 100) * 20) : 0;
  const masteryIndex = Math.min(100, planWeight + thinkWeight + coachWeight + factWeight + testWeight);

  const subjectMap = new Map<
    string,
    { subject: string; plans: number; completedPlans: number; thinkFirsts: number; factChecks: number; selfTests: number }
  >();

  const ensureSubject = (subject: string) => {
    const key = subject.trim() || 'Khác';
    if (!subjectMap.has(key)) {
      subjectMap.set(key, {
        subject: key,
        plans: 0,
        completedPlans: 0,
        thinkFirsts: 0,
        factChecks: 0,
        selfTests: 0,
      });
    }
    return subjectMap.get(key)!;
  };

  for (const plan of data.plans) {
    const entry = ensureSubject(plan.subject);
    entry.plans += 1;
    if (plan.status === 'completed') entry.completedPlans += 1;
  }
  for (const tf of data.thinkFirsts) {
    ensureSubject(tf.subject).thinkFirsts += 1;
  }
  for (const fc of data.factChecks) {
    ensureSubject(fc.subject).factChecks += 1;
  }
  for (const st of submittedTests) {
    ensureSubject(st.subject).selfTests += 1;
  }

  return {
    totalPlans,
    completedPlans,
    incompletePlans,
    planCompletionRate,
    totalPlannedMinutes,
    completedMinutes,
    thinkFirstCount,
    unlockedCoachCount,
    coachSessionCount,
    factCheckCount,
    factInaccurateCaught,
    selfTestCount,
    averageSelfTestScore,
    masteryIndex,
    bySubject: Array.from(subjectMap.values()).sort((a, b) => a.subject.localeCompare(b.subject, 'vi')),
  };
}

export function createInitialDemoWorkspaceData(userId: string, studentName: string): {
  plans: StudyPlanItem[];
  thinkFirsts: ThinkFirstItem[];
  coachSessions: AiCoachSessionItem[];
  factChecks: FactCheckItem[];
  selfTests: SelfTestItem[];
} {
  return {
    plans: [
      {
        id: 'demo-plan-1',
        userId,
        studentName,
        subject: 'Vật lí',
        title: 'Ôn tập Định luật bảo toàn cơ năng',
        goal: 'Tự chứng minh công thức thế năng trọng trường và giải 3 bài tập con lắc đơn.',
        targetMinutes: 45,
        scheduledDate: '2026-11-24',
        status: 'completed',
        reflectionReason: '',
        createdAtMs: Date.now() - 86400000,
      },
      {
        id: 'demo-plan-2',
        userId,
        studentName,
        subject: 'Ngữ văn',
        title: 'Phân tích hình tượng nhân vật Tràng (Vợ nhặt)',
        goal: 'Lập dàn ý 3 luận điểm chính trước khi tham khảo AI gợi mở.',
        targetMinutes: 40,
        scheduledDate: '2026-11-24',
        status: 'pending',
        reflectionReason: '',
        createdAtMs: Date.now() - 3600000,
      },
    ],
    thinkFirsts: [
      {
        id: 'demo-think-1',
        userId,
        studentName,
        subject: 'Vật lí',
        promptTitle: 'Vì sao cơ năng được bảo toàn khi vật chỉ chịu tác dụng của trọng lực?',
        studentHypothesis:
          'Khi chỉ có trọng lực (lực thế) sinh công, công của trọng lực bằng độ giảm thế năng và bằng độ tăng động năng, nên tổng động năng và thế năng không đổi theo thời gian.',
        confidenceLevel: 4,
        unlockedAiCoach: true,
        createdAtMs: Date.now() - 7200000,
      },
    ],
    coachSessions: [
      {
        id: 'demo-session-1',
        userId,
        thinkFirstId: 'demo-think-1',
        subject: 'Vật lí',
        topic: 'Bảo toàn cơ năng trong trường trọng lực',
        messageCount: 2,
        createdAtMs: Date.now() - 7000000,
      },
    ],
    factChecks: [
      {
        id: 'demo-fact-1',
        userId,
        studentName,
        subject: 'Lịch sử',
        aiClaim: 'Phong trào Đồng khởi (1959-1960) diễn ra đồng loạt ở tất cả các tỉnh miền Bắc.',
        textbookSource: 'SGK Lịch sử 12 (Kết nối tri thức) — Bài Kháng chiến chống Mỹ',
        verificationStatus: 'inaccurate',
        studentArgument:
          'Phong trào Đồng khởi diễn ra ở miền Nam (tiêu biểu ở Bến Tre), không phải ở miền Bắc. Đây là bước ngoặt chuyển cách mạng miền Nam từ giữ gìn lực lượng sang thế tiến công.',
        aiDeepReview:
          'Nhận định của học sinh hoàn toàn chính xác. Nguồn SGK xác nhận Đồng khởi bùng nổ ở miền Nam, mở đầu tại Mỏ Cày (Bến Tre).',
        createdAtMs: Date.now() - 5400000,
      },
    ],
    selfTests: [
      {
        id: 'demo-test-1',
        userId,
        studentName,
        subject: 'Vật lí',
        topic: 'Bảo toàn cơ năng',
        questionPrompt: 'Giải thích bằng lời của em điều kiện áp dụng định luật bảo toàn cơ năng và lấy ví dụ thực tế.',
        studentExplanation:
          'Cơ năng của vật chỉ bảo toàn khi vật chuyển động chỉ dưới tác dụng của trọng lực hoặc lực đàn hồi, không có lực ma sát hay lực cản làm tiêu hao năng lượng.',
        applicationAnswer:
          'Khi thả một viên bi từ đỉnh máng trượt nhẵn không ma sát, thế năng ở đỉnh chuyển hóa dần thành động năng ở đáy máng.',
        score: 88,
        feedbackSummary: 'Giải thích chính xác điều kiện lực thế và đưa ra ví dụ trực quan.',
        status: 'submitted',
        createdAtMs: Date.now() - 3200000,
      },
    ],
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampString,
  computeLearningProgress,
  createInitialDemoWorkspaceData,
  evaluateSelfTestLocally,
  isValidDocumentId,
  validateFactCheckInput,
  validateSelfTestInput,
  validateStudyPlanInput,
  validateThinkFirstInput,
} from './learningLogic';

test('isValidDocumentId enforces Firestore ID regex and length bounds', () => {
  assert.equal(isValidDocumentId('plan_123-abc'), true);
  assert.equal(isValidDocumentId(''), false);
  assert.equal(isValidDocumentId('../hack'), false);
  assert.equal(isValidDocumentId('a'.repeat(129)), false);
});

test('validateStudyPlanInput catches empty titles and out-of-range durations', () => {
  assert.ok(
    validateStudyPlanInput({
      subject: 'Toán học',
      title: 'A',
      goal: 'Hoàn thành bài tập',
      targetMinutes: 30,
      scheduledDate: '2026-11-24',
    })
  );
  assert.ok(
    validateStudyPlanInput({
      subject: 'Toán học',
      title: 'Giải phương trình bậc hai',
      goal: 'Làm 5 bài tập SGK',
      targetMinutes: 2,
      scheduledDate: '2026-11-24',
    })
  );
  assert.equal(
    validateStudyPlanInput({
      subject: 'Toán học',
      title: 'Giải phương trình bậc hai',
      goal: 'Làm 5 bài tập SGK',
      targetMinutes: 45,
      scheduledDate: '2026-11-24',
    }),
    null
  );
});

test('validateThinkFirstInput blocks hypotheses under 20 characters', () => {
  const err = validateThinkFirstInput({
    subject: 'Vật lí',
    promptTitle: 'Định luật Ôm',
    studentHypothesis: 'Quá ngắn',
    confidenceLevel: 3,
  });
  assert.ok(err && err.includes('20'));

  const ok = validateThinkFirstInput({
    subject: 'Vật lí',
    promptTitle: 'Định luật Ôm',
    studentHypothesis: 'Cường độ dòng điện tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với điện trở của dây dẫn.',
    confidenceLevel: 4,
  });
  assert.equal(ok, null);
});

test('validateFactCheckInput and validateSelfTestInput validate required fields', () => {
  assert.ok(
    validateFactCheckInput({
      subject: 'Lịch sử',
      aiClaim: 'abc',
      textbookSource: 'SGK',
      studentArgument: 'Ngắn',
    })
  );
  assert.equal(
    validateFactCheckInput({
      subject: 'Lịch sử',
      aiClaim: 'Chiến thắng Điện Biên Phủ diễn ra năm 1954.',
      textbookSource: 'SGK Lịch sử 12 trang 88',
      studentArgument: 'Đúng, chiến dịch kết thúc thắng lợi vào ngày 7/5/1954.',
    }),
    null
  );

  assert.ok(
    validateSelfTestInput({
      subject: 'Sinh học',
      topic: 'Quang hợp',
      questionPrompt: 'Trình bày phương trình quang hợp',
      studentExplanation: 'Ngắn',
      applicationAnswer: 'Ngắn',
    })
  );
});

test('computeLearningProgress calculates completion rates, averages, and mastery index accurately', () => {
  const demo = createInitialDemoWorkspaceData('user-1', 'Nguyễn Văn A');
  const summary = computeLearningProgress(demo);

  assert.equal(summary.totalPlans, 2);
  assert.equal(summary.completedPlans, 1);
  assert.equal(summary.planCompletionRate, 50);
  assert.equal(summary.totalPlannedMinutes, 85);
  assert.equal(summary.completedMinutes, 45);
  assert.equal(summary.thinkFirstCount, 1);
  assert.equal(summary.factCheckCount, 1);
  assert.equal(summary.factInaccurateCaught, 1);
  assert.equal(summary.selfTestCount, 1);
  assert.equal(summary.averageSelfTestScore, 88);
  assert.ok(summary.masteryIndex > 0 && summary.masteryIndex <= 100);
});

test('evaluateSelfTestLocally scores detailed answers higher than minimal ones', () => {
  const brief = evaluateSelfTestLocally({
    studentExplanation: 'Khái niệm cơ năng gồm động năng.',
    applicationAnswer: 'Ví dụ viên bi rơi.',
  });
  const detailed = evaluateSelfTestLocally({
    studentExplanation:
      'Cơ năng bằng tổng động năng và thế năng của vật. Khi chỉ có lực thế như trọng lực hoặc lực đàn hồi thực hiện công và không có lực cản thì cơ năng được bảo toàn tuyệt đối theo thời gian.',
    applicationAnswer:
      'Trong trò chơi tàu lượn siêu tốc không tính ma sát, tại điểm cao nhất thế năng cực đại và chuyển dần thành động năng khi lao xuống dốc.',
  });
  assert.ok(detailed.score > brief.score);
  assert.equal(clampString('  abc  ', 2), 'ab');
});

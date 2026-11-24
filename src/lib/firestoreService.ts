import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  AiCoachMessageItem,
  AiCoachSessionItem,
  BOOTSTRAP_ADMIN_EMAIL,
  clampString,
  FactCheckItem,
  FactCheckStatus,
  SelfTestItem,
  SelfTestStatus,
  StudyPlanItem,
  StudyPlanStatus,
  ThinkFirstItem,
  UserRole,
  VALIDATION_LIMITS,
} from '../utils/learningLogic';

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  className: string;
  schoolName: string;
}

function tsToMs(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  return Date.now();
}

export async function getOrCreateUserProfile(user: User): Promise<UserProfileRecord> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        role: data.role as UserRole,
        className: data.className ?? '',
        schoolName: data.schoolName ?? 'Trường PTDTNT THPT Quảng Nam',
      };
    }

    const isAdminEmail =
      Boolean(user.emailVerified) &&
      user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    const payload = {
      uid: user.uid,
      displayName: clampString(user.displayName || user.email?.split('@')[0] || 'Học sinh', VALIDATION_LIMITS.displayNameMax),
      email: clampString(user.email || 'unknown@example.com', VALIDATION_LIMITS.emailMax),
      role: isAdminEmail ? 'teacher' : 'student',
      className: isAdminEmail ? 'Tổ chuyên môn' : '12A1',
      schoolName: 'Trường PTDTNT THPT Quảng Nam',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    return {
      uid: payload.uid,
      displayName: payload.displayName,
      email: payload.email,
      role: payload.role as UserRole,
      className: payload.className,
      schoolName: payload.schoolName,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileDetails(
  uid: string,
  updates: { displayName: string; className: string; schoolName: string }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clampString(updates.displayName || 'Học sinh', VALIDATION_LIMITS.displayNameMax),
      className: clampString(updates.className, VALIDATION_LIMITS.classNameMax),
      schoolName: clampString(updates.schoolName, VALIDATION_LIMITS.schoolNameMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Study Plans ---
export function subscribeStudyPlans(
  userId: string,
  isAdminView: boolean,
  onData: (items: StudyPlanItem[]) => void
) {
  const colRef = collection(db, 'studyPlans');
  const q = isAdminView
    ? query(colRef, orderBy('createdAt', 'desc'))
    : query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: StudyPlanItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          studentName: data.studentName,
          subject: data.subject,
          title: data.title,
          goal: data.goal,
          targetMinutes: data.targetMinutes,
          scheduledDate: data.scheduledDate,
          status: data.status as StudyPlanStatus,
          reflectionReason: data.reflectionReason ?? '',
          createdAtMs: tsToMs(data.createdAt),
        };
      });
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'studyPlans')
  );
}

export async function createStudyPlan(
  userId: string,
  studentName: string,
  input: {
    subject: string;
    title: string;
    goal: string;
    targetMinutes: number;
    scheduledDate: string;
  }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'studyPlans'), {
      userId,
      studentName: clampString(studentName, VALIDATION_LIMITS.displayNameMax),
      subject: clampString(input.subject, VALIDATION_LIMITS.subjectMax),
      title: clampString(input.title, VALIDATION_LIMITS.planTitleMax),
      goal: clampString(input.goal, VALIDATION_LIMITS.planGoalMax),
      targetMinutes: Math.max(5, Math.min(480, Math.round(input.targetMinutes))),
      scheduledDate: clampString(input.scheduledDate, 20),
      status: 'pending',
      reflectionReason: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'studyPlans');
  }
}

export async function updateStudyPlanStatus(
  planId: string,
  status: StudyPlanStatus,
  reflectionReason: string
): Promise<void> {
  const path = `studyPlans/${planId}`;
  try {
    await updateDoc(doc(db, 'studyPlans', planId), {
      status,
      reflectionReason: clampString(reflectionReason, VALIDATION_LIMITS.reflectionMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudyPlanDoc(planId: string): Promise<void> {
  const path = `studyPlans/${planId}`;
  try {
    await deleteDoc(doc(db, 'studyPlans', planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Think First ---
export function subscribeThinkFirst(
  userId: string,
  isAdminView: boolean,
  onData: (items: ThinkFirstItem[]) => void
) {
  const colRef = collection(db, 'thinkFirstEntries');
  const q = isAdminView
    ? query(colRef, orderBy('createdAt', 'desc'))
    : query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: ThinkFirstItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          studentName: data.studentName,
          subject: data.subject,
          promptTitle: data.promptTitle,
          studentHypothesis: data.studentHypothesis,
          confidenceLevel: data.confidenceLevel,
          unlockedAiCoach: Boolean(data.unlockedAiCoach),
          createdAtMs: tsToMs(data.createdAt),
        };
      });
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'thinkFirstEntries')
  );
}

export async function createThinkFirstEntry(
  userId: string,
  studentName: string,
  input: {
    subject: string;
    promptTitle: string;
    studentHypothesis: string;
    confidenceLevel: number;
  }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'thinkFirstEntries'), {
      userId,
      studentName: clampString(studentName, VALIDATION_LIMITS.displayNameMax),
      subject: clampString(input.subject, VALIDATION_LIMITS.subjectMax),
      promptTitle: clampString(input.promptTitle, VALIDATION_LIMITS.thinkTitleMax),
      studentHypothesis: clampString(input.studentHypothesis, VALIDATION_LIMITS.thinkHypothesisMax),
      confidenceLevel: Math.max(1, Math.min(5, Math.round(input.confidenceLevel))),
      unlockedAiCoach: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'thinkFirstEntries');
  }
}

// --- AI Coach Sessions & Messages ---
export function subscribeAiCoachSessions(
  userId: string,
  isAdminView: boolean,
  onData: (items: AiCoachSessionItem[]) => void
) {
  const colRef = collection(db, 'aiCoachSessions');
  const q = isAdminView
    ? query(colRef, orderBy('createdAt', 'desc'))
    : query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: AiCoachSessionItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          thinkFirstId: data.thinkFirstId,
          subject: data.subject,
          topic: data.topic,
          messageCount: data.messageCount,
          createdAtMs: tsToMs(data.createdAt),
        };
      });
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'aiCoachSessions')
  );
}

export async function createAiCoachSession(
  userId: string,
  input: { thinkFirstId: string; subject: string; topic: string }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'aiCoachSessions'), {
      userId,
      thinkFirstId: input.thinkFirstId,
      subject: clampString(input.subject, VALIDATION_LIMITS.subjectMax),
      topic: clampString(input.topic, VALIDATION_LIMITS.sessionTopicMax),
      messageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'aiCoachSessions');
  }
}

export function subscribeAiCoachMessages(
  sessionId: string,
  userId: string,
  isAdminView: boolean,
  onData: (items: AiCoachMessageItem[]) => void
) {
  const path = `aiCoachSessions/${sessionId}/messages`;
  const colRef = collection(db, 'aiCoachSessions', sessionId, 'messages');
  const q = isAdminView
    ? query(colRef, orderBy('createdAt', 'asc'))
    : query(colRef, where('userId', '==', userId), orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: AiCoachMessageItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          role: data.role as 'user' | 'assistant',
          content: data.content,
          modelUsed: data.modelUsed,
          createdAtMs: tsToMs(data.createdAt),
        };
      });
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function addAiCoachMessage(
  sessionId: string,
  userId: string,
  messageCount: number,
  msg: { role: 'user' | 'assistant'; content: string; modelUsed: string }
): Promise<void> {
  const path = `aiCoachSessions/${sessionId}/messages`;
  try {
    await addDoc(collection(db, 'aiCoachSessions', sessionId, 'messages'), {
      userId,
      role: msg.role,
      content: clampString(msg.content, VALIDATION_LIMITS.coachMessageMax),
      modelUsed: clampString(msg.modelUsed, VALIDATION_LIMITS.modelUsedMax),
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'aiCoachSessions', sessionId), {
      messageCount: Math.min(200, messageCount),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// --- Fact Checks ---
export function subscribeFactChecks(
  userId: string,
  isAdminView: boolean,
  onData: (items: FactCheckItem[]) => void
) {
  const colRef = collection(db, 'factChecks');
  const q = isAdminView
    ? query(colRef, orderBy('createdAt', 'desc'))
    : query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: FactCheckItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          studentName: data.studentName,
          subject: data.subject,
          aiClaim: data.aiClaim,
          textbookSource: data.textbookSource,
          verificationStatus: data.verificationStatus as FactCheckStatus,
          studentArgument: data.studentArgument,
          aiDeepReview: data.aiDeepReview ?? '',
          createdAtMs: tsToMs(data.createdAt),
        };
      });
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'factChecks')
  );
}

export async function createFactCheckRecord(
  userId: string,
  studentName: string,
  input: {
    subject: string;
    aiClaim: string;
    textbookSource: string;
    verificationStatus: FactCheckStatus;
    studentArgument: string;
    aiDeepReview: string;
  }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'factChecks'), {
      userId,
      studentName: clampString(studentName, VALIDATION_LIMITS.displayNameMax),
      subject: clampString(input.subject, VALIDATION_LIMITS.subjectMax),
      aiClaim: clampString(input.aiClaim, VALIDATION_LIMITS.factClaimMax),
      textbookSource: clampString(input.textbookSource, VALIDATION_LIMITS.textbookSourceMax),
      verificationStatus: input.verificationStatus,
      studentArgument: clampString(input.studentArgument, VALIDATION_LIMITS.studentArgumentMax),
      aiDeepReview: clampString(input.aiDeepReview, VALIDATION_LIMITS.aiDeepReviewMax),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'factChecks');
  }
}

export async function deleteFactCheckDoc(checkId: string): Promise<void> {
  const path = `factChecks/${checkId}`;
  try {
    await deleteDoc(doc(db, 'factChecks', checkId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Self Tests ---
export function subscribeSelfTests(
  userId: string,
  isAdminView: boolean,
  onData: (items: SelfTestItem[]) => void
) {
  const colRef = collection(db, 'selfTests');
  const q = isAdminView
    ? query(colRef, orderBy('createdAt', 'desc'))
    : query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: SelfTestItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          studentName: data.studentName,
          subject: data.subject,
          topic: data.topic,
          questionPrompt: data.questionPrompt,
          studentExplanation: data.studentExplanation,
          applicationAnswer: data.applicationAnswer,
          score: data.score,
          feedbackSummary: data.feedbackSummary ?? '',
          status: data.status as SelfTestStatus,
          createdAtMs: tsToMs(data.createdAt),
        };
      });
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'selfTests')
  );
}

export async function createSubmittedSelfTest(
  userId: string,
  studentName: string,
  input: {
    subject: string;
    topic: string;
    questionPrompt: string;
    studentExplanation: string;
    applicationAnswer: string;
    score: number;
    feedbackSummary: string;
  }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'selfTests'), {
      userId,
      studentName: clampString(studentName, VALIDATION_LIMITS.displayNameMax),
      subject: clampString(input.subject, VALIDATION_LIMITS.subjectMax),
      topic: clampString(input.topic, VALIDATION_LIMITS.selfTestTopicMax),
      questionPrompt: clampString(input.questionPrompt, VALIDATION_LIMITS.selfTestPromptMax),
      studentExplanation: clampString(input.studentExplanation, VALIDATION_LIMITS.selfTestExplanationMax),
      applicationAnswer: clampString(input.applicationAnswer, VALIDATION_LIMITS.selfTestApplicationMax),
      score: Math.max(0, Math.min(100, Math.round(input.score))),
      feedbackSummary: clampString(input.feedbackSummary, VALIDATION_LIMITS.feedbackSummaryMax),
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'selfTests');
  }
}

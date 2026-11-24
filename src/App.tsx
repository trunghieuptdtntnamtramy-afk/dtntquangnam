import { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
  testFirestoreConnection,
} from './lib/firebase';
import {
  addAiCoachMessage,
  createAiCoachSession,
  createFactCheckRecord,
  createStudyPlan,
  createSubmittedSelfTest,
  createThinkFirstEntry,
  deleteFactCheckDoc,
  deleteStudyPlanDoc,
  getOrCreateUserProfile,
  subscribeAiCoachMessages,
  subscribeAiCoachSessions,
  subscribeFactChecks,
  subscribeSelfTests,
  subscribeStudyPlans,
  subscribeThinkFirst,
  updateStudyPlanStatus,
  UserProfileRecord,
} from './lib/firestoreService';
import {
  AiCoachMessageItem,
  AiCoachSessionItem,
  BOOTSTRAP_ADMIN_EMAIL,
  createInitialDemoWorkspaceData,
  FactCheckItem,
  SelfTestItem,
  StudyPlanItem,
  ThinkFirstItem,
} from './utils/learningLogic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { WorkspaceShell, WorkspaceTab } from './components/WorkspaceShell';
import { StudyPlanView } from './components/modules/StudyPlanView';
import { ThinkFirstView } from './components/modules/ThinkFirstView';
import { AiCoachView } from './components/modules/AiCoachView';
import { FactCheckView } from './components/modules/FactCheckView';
import { SelfTestView } from './components/modules/SelfTestView';
import { LearningProgressView } from './components/modules/LearningProgressView';
import { GoogleWorkspaceHub } from './components/modules/GoogleWorkspaceHub';

function EduSmartApp() {
  const initialAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [view, setView] = useState<'landing' | 'workspace'>(
    initialAutostart ? 'workspace' : 'landing'
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);

  // Real Firestore state (when authenticated) vs Demo Sandbox state (when previewing unauthenticated)
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [thinkFirsts, setThinkFirsts] = useState<ThinkFirstItem[]>([]);
  const [coachSessions, setCoachSessions] = useState<AiCoachSessionItem[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheckItem[]>([]);
  const [selfTests, setSelfTests] = useState<SelfTestItem[]>([]);

  const [selectedThinkFirstId, setSelectedThinkFirstId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [coachMessages, setCoachMessages] = useState<AiCoachMessageItem[]>([]);

  // Demo-mode local message map (keyed by sessionId)
  const [demoMessagesBySession, setDemoMessagesBySession] = useState<
    Record<string, AiCoachMessageItem[]>
  >({
    'demo-session-1': [
      {
        id: 'demo-msg-1',
        userId: 'demo-student',
        role: 'user',
        content: 'Em muốn kiểm tra lại phần giải thích của mình về lực thế.',
        modelUsed: 'student',
      },
      {
        id: 'demo-msg-2',
        userId: 'demo-student',
        role: 'assistant',
        content:
          'Lập luận ban đầu của em rất đúng hướng khi nhắc đến công của trọng lực! Hãy thử suy nghĩ thêm: nếu có thêm lực ma sát trượt trên mặt phẳng nghiêng, công của lực ma sát có phụ thuộc vào đường đi hay không và điều đó ảnh hưởng thế nào đến tổng cơ năng?',
        modelUsed: 'gemini-4-hydrogen (High Thinking)',
      },
    ],
  });

  // Initialize demo seed data if unauthenticated
  useEffect(() => {
    if (!firebaseUser) {
      const seed = createInitialDemoWorkspaceData('demo-student', 'Học sinh trải nghiệm');
      setPlans(seed.plans);
      setThinkFirsts(seed.thinkFirsts);
      setCoachSessions(seed.coachSessions);
      setFactChecks(seed.factChecks);
      setSelfTests(seed.selfTests);
      setSelectedThinkFirstId(seed.thinkFirsts[0]?.id ?? null);
      setActiveSessionId(seed.coachSessions[0]?.id ?? null);
    }
  }, [firebaseUser]);

  // Startup Firestore connection check + Auth listener
  useEffect(() => {
    testFirestoreConnection();
    const unsub = initAuth(async (user, token) => {
      setFirebaseUser(user);
      setAccessToken(token || getAccessToken());
      if (user) {
        try {
          const prof = await getOrCreateUserProfile(user);
          setProfile(prof);
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  const isTeacherAdmin = Boolean(
    firebaseUser?.emailVerified &&
      (firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
        profile?.role === 'teacher')
  );

  // Attach Firestore subscriptions ONLY when authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const isBootstrapAdmin =
      Boolean(firebaseUser.emailVerified) &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    const unsubs = [
      subscribeStudyPlans(uid, isBootstrapAdmin, setPlans),
      subscribeThinkFirst(uid, isBootstrapAdmin, setThinkFirsts),
      subscribeAiCoachSessions(uid, isBootstrapAdmin, setCoachSessions),
      subscribeFactChecks(uid, isBootstrapAdmin, setFactChecks),
      subscribeSelfTests(uid, isBootstrapAdmin, setSelfTests),
    ];

    return () => {
      for (const u of unsubs) u();
    };
  }, [firebaseUser]);

  // Subscribe to messages for active AI Coach session
  useEffect(() => {
    if (!activeSessionId) {
      setCoachMessages([]);
      return;
    }

    if (!firebaseUser) {
      setCoachMessages(demoMessagesBySession[activeSessionId] || []);
      return;
    }

    const isBootstrapAdmin =
      Boolean(firebaseUser.emailVerified) &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    return subscribeAiCoachMessages(
      activeSessionId,
      firebaseUser.uid,
      isBootstrapAdmin,
      setCoachMessages
    );
  }, [activeSessionId, firebaseUser, demoMessagesBySession]);

  // Sync activeSessionId when selectedThinkFirstId changes
  useEffect(() => {
    if (!selectedThinkFirstId) return;
    const matching = coachSessions.find((s) => s.thinkFirstId === selectedThinkFirstId);
    setActiveSessionId(matching ? matching.id : null);
  }, [selectedThinkFirstId, coachSessions]);

  const handleGoogleSignIn = async () => {
    const res = await googleSignIn();
    setFirebaseUser(res.user);
    setAccessToken(res.accessToken);
    const prof = await getOrCreateUserProfile(res.user);
    setProfile(prof);
    setView('workspace');
  };

  const handleLogout = async () => {
    await logout();
    setFirebaseUser(null);
    setAccessToken(null);
    setProfile(null);
    setView('landing');
  };

  const studentName =
    profile?.displayName || firebaseUser?.displayName || 'Học sinh trải nghiệm';
  const currentUserId = firebaseUser?.uid || 'demo-student';

  // --- Handlers bridging Firestore (signed-in) and Local Preview (demo) ---
  const handleCreatePlan = async (input: {
    subject: string;
    title: string;
    goal: string;
    targetMinutes: number;
    scheduledDate: string;
  }) => {
    if (firebaseUser) {
      await createStudyPlan(firebaseUser.uid, studentName, input);
    } else {
      setPlans((prev) => [
        {
          id: `demo-plan-${Date.now()}`,
          userId: currentUserId,
          studentName,
          ...input,
          status: 'pending',
          reflectionReason: '',
          createdAtMs: Date.now(),
        },
        ...prev,
      ]);
    }
  };

  const handleUpdatePlan = async (
    planId: string,
    status: 'pending' | 'completed' | 'incomplete',
    reflectionReason: string
  ) => {
    if (firebaseUser) {
      await updateStudyPlanStatus(planId, status, reflectionReason);
    } else {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, status, reflectionReason } : p))
      );
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (firebaseUser) {
      await deleteStudyPlanDoc(planId);
    } else {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    }
  };

  const handleCreateThinkFirst = async (input: {
    subject: string;
    promptTitle: string;
    studentHypothesis: string;
    confidenceLevel: number;
  }): Promise<ThinkFirstItem> => {
    if (firebaseUser) {
      const id = await createThinkFirstEntry(firebaseUser.uid, studentName, input);
      return {
        id,
        userId: firebaseUser.uid,
        studentName,
        ...input,
        unlockedAiCoach: true,
        createdAtMs: Date.now(),
      };
    }

    const created: ThinkFirstItem = {
      id: `demo-think-${Date.now()}`,
      userId: currentUserId,
      studentName,
      ...input,
      unlockedAiCoach: true,
      createdAtMs: Date.now(),
    };
    setThinkFirsts((prev) => [created, ...prev]);
    return created;
  };

  const handleStartOrSelectSession = async (entry: ThinkFirstItem): Promise<string> => {
    const existing = coachSessions.find((s) => s.thinkFirstId === entry.id);
    if (existing) {
      setActiveSessionId(existing.id);
      return existing.id;
    }

    if (firebaseUser) {
      const id = await createAiCoachSession(firebaseUser.uid, {
        thinkFirstId: entry.id,
        subject: entry.subject,
        topic: entry.promptTitle,
      });
      setActiveSessionId(id);
      return id;
    }

    const newSessionId = `demo-session-${Date.now()}`;
    setCoachSessions((prev) => [
      {
        id: newSessionId,
        userId: currentUserId,
        thinkFirstId: entry.id,
        subject: entry.subject,
        topic: entry.promptTitle,
        messageCount: 0,
        createdAtMs: Date.now(),
      },
      ...prev,
    ]);
    setActiveSessionId(newSessionId);
    return newSessionId;
  };

  const handlePersistCoachMessage = async (
    sessionId: string,
    msg: { role: 'user' | 'assistant'; content: string; modelUsed: string }
  ) => {
    if (firebaseUser) {
      const currentCount = coachMessages.length + 1;
      await addAiCoachMessage(sessionId, firebaseUser.uid, currentCount, msg);
    } else {
      const newMsg: AiCoachMessageItem = {
        id: `demo-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: currentUserId,
        ...msg,
        createdAtMs: Date.now(),
      };
      setDemoMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] || []), newMsg],
      }));
      setCoachSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messageCount: s.messageCount + 1 } : s))
      );
    }
  };

  const handleCreateFactCheck = async (input: {
    subject: string;
    aiClaim: string;
    textbookSource: string;
    verificationStatus: 'accurate' | 'needs_context' | 'inaccurate';
    studentArgument: string;
    aiDeepReview: string;
  }) => {
    if (firebaseUser) {
      await createFactCheckRecord(firebaseUser.uid, studentName, input);
    } else {
      setFactChecks((prev) => [
        {
          id: `demo-fact-${Date.now()}`,
          userId: currentUserId,
          studentName,
          ...input,
          createdAtMs: Date.now(),
        },
        ...prev,
      ]);
    }
  };

  const handleDeleteFactCheck = async (id: string) => {
    if (firebaseUser) {
      await deleteFactCheckDoc(id);
    } else {
      setFactChecks((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleSubmitSelfTest = async (input: {
    subject: string;
    topic: string;
    questionPrompt: string;
    studentExplanation: string;
    applicationAnswer: string;
    score: number;
    feedbackSummary: string;
  }) => {
    if (firebaseUser) {
      await createSubmittedSelfTest(firebaseUser.uid, studentName, input);
    } else {
      setSelfTests((prev) => [
        {
          id: `demo-test-${Date.now()}`,
          userId: currentUserId,
          studentName,
          ...input,
          status: 'submitted',
          createdAtMs: Date.now(),
        },
        ...prev,
      ]);
    }
  };

  return (
    <>
      {view === 'landing' ? (
        <LandingPage
          isAuthenticated={Boolean(firebaseUser)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onEnterWorkspace={(tab) => {
            if (tab) setActiveTab(tab as WorkspaceTab);
            setView('workspace');
          }}
          onEnterDemo={() => {
            setActiveTab('study-plan');
            setView('workspace');
          }}
        />
      ) : (
        <WorkspaceShell
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userName={studentName}
          userRoleLabel={
            firebaseUser
              ? isTeacherAdmin
                ? 'Giáo viên · Quản lý lớp'
                : 'Học sinh · Đã đồng bộ'
              : 'Chế độ trải nghiệm cục bộ'
          }
          isDemoMode={!firebaseUser}
          onGoHome={() => setView('landing')}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
        >
          {activeTab === 'overview' && (
            <LearningProgressView
              isTeacherRole={isTeacherAdmin}
              studentName={studentName}
              plans={plans}
              thinkFirsts={thinkFirsts}
              coachSessions={coachSessions}
              factChecks={factChecks}
              selfTests={selfTests}
              onNavigateTab={(tab) => setActiveTab(tab as WorkspaceTab)}
            />
          )}

          {activeTab === 'study-plan' && (
            <StudyPlanView
              plans={plans}
              onCreatePlan={handleCreatePlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
            />
          )}

          {activeTab === 'think-first' && (
            <ThinkFirstView
              entries={thinkFirsts}
              onCreateEntry={handleCreateThinkFirst}
              onLaunchCoach={(entry) => {
                setSelectedThinkFirstId(entry.id);
                setActiveTab('ai-coach');
              }}
            />
          )}

          {activeTab === 'ai-coach' && (
            <AiCoachView
              thinkFirstEntries={thinkFirsts}
              sessions={coachSessions}
              selectedThinkFirstId={selectedThinkFirstId}
              activeSessionId={activeSessionId}
              messages={coachMessages}
              onSelectThinkFirst={setSelectedThinkFirstId}
              onStartOrSelectSession={handleStartOrSelectSession}
              onPersistMessage={handlePersistCoachMessage}
              onGoThinkFirst={() => setActiveTab('think-first')}
            />
          )}

          {activeTab === 'fact-check' && (
            <FactCheckView
              factChecks={factChecks}
              onCreateFactCheck={handleCreateFactCheck}
              onDeleteFactCheck={handleDeleteFactCheck}
            />
          )}

          {activeTab === 'self-test' && (
            <SelfTestView selfTests={selfTests} onSubmitSelfTest={handleSubmitSelfTest} />
          )}

          {activeTab === 'workspace' && (
            <GoogleWorkspaceHub
              accessToken={accessToken}
              studentName={studentName}
              userEmail={firebaseUser?.email || ''}
              plans={plans}
              thinkFirsts={thinkFirsts}
              coachSessions={coachSessions}
              factChecks={factChecks}
              selfTests={selfTests}
              onTriggerGoogleSignIn={handleGoogleSignIn}
            />
          )}
        </WorkspaceShell>
      )}

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEnterDemo={() => {
          setActiveTab('overview');
          setView('workspace');
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <EduSmartApp />
    </ErrorBoundary>
  );
}

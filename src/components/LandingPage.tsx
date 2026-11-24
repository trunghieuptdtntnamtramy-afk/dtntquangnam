import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Layers,
  Lightbulb,
  Quote,
  SearchCheck,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onEnterWorkspace: (initialTab?: string) => void;
  onEnterDemo: () => void;
}

const DEMO_STEPS = [
  {
    code: '01',
    title: 'STUDY PLAN',
    subtitle: 'Lập kế hoạch & quản lý thời gian',
    detailTitle: 'Mục tiêu Phân hệ 01:',
    detailText:
      'Học sinh chủ động thiết lập nhiệm vụ học tập, phân bổ khung giờ tự học hợp lý và tự đánh giá nguyên nhân nếu chưa hoàn thành kế hoạch.',
    icon: CalendarCheck,
    accent: 'text-sky-700',
    iconBg: 'bg-sky-600 text-white',
    detailBg: 'bg-sky-50/90 border-sky-200',
  },
  {
    code: '02',
    title: 'THINK FIRST',
    subtitle: 'Suy nghĩ độc lập trước khi dùng AI',
    detailTitle: 'Mục tiêu Phân hệ 02:',
    detailText:
      'Kích hoạt tư duy cá nhân! Học sinh tự đưa ra câu trả lời và lập luận ban đầu trước khi mở khóa tính năng hỗ trợ từ AI.',
    icon: Lightbulb,
    accent: 'text-amber-700',
    iconBg: 'bg-amber-100 text-amber-700',
    detailBg: 'bg-amber-50/90 border-amber-200',
  },
  {
    code: '03',
    title: 'AI COACH',
    subtitle: 'Trợ lý gợi mở & định hướng tư duy',
    detailTitle: 'Mục tiêu Phân hệ 03:',
    detailText:
      'AI đóng vai trò người huấn luyện gợi mở từng bước bằng câu hỏi định hướng thay vì đưa sẵn đáp án.',
    icon: Bot,
    accent: 'text-indigo-700',
    iconBg: 'bg-indigo-100 text-indigo-700',
    detailBg: 'bg-indigo-50/90 border-indigo-200',
  },
  {
    code: '04',
    title: 'FACT CHECK',
    subtitle: 'Đối chiếu SGK & kiểm chứng nguồn',
    detailTitle: 'Mục tiêu Phân hệ 04:',
    detailText:
      'Rèn luyện tư duy phản biện thông qua việc đối chiếu câu trả lời của AI với sách giáo khoa và tài liệu chuẩn.',
    icon: SearchCheck,
    accent: 'text-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-700',
    detailBg: 'bg-emerald-50/90 border-emerald-200',
  },
  {
    code: '05',
    title: 'SELF TEST',
    subtitle: 'Tự kiểm tra không có AI hỗ trợ',
    detailTitle: 'Mục tiêu Phân hệ 05:',
    detailText:
      'Tự kiểm tra năng lực thực chất trong môi trường không có AI, diễn đạt lại kiến thức bằng ngôn ngữ của chính mình.',
    icon: FileCheck2,
    accent: 'text-violet-700',
    iconBg: 'bg-violet-100 text-violet-700',
    detailBg: 'bg-violet-50/90 border-violet-200',
  },
] as const;

export const LandingPage: React.FC<LandingPageProps> = ({
  isAuthenticated,
  onOpenAuth,
  onEnterWorkspace,
  onEnterDemo,
}) => {
  const [selectedStep, setSelectedStep] = useState(0);
  const activeStep = DEMO_STEPS[selectedStep];

  const handlePrimaryStart = () => {
    if (isAuthenticated) {
      onEnterWorkspace('overview');
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Bar: Clean 3-zone contract */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#home"
            className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-sky-700 whitespace-nowrap shrink-0"
          >
            <GraduationCap className="w-6 h-6 text-sky-600" />
            <span>EDU SMART</span>
          </a>

          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600"
          >
            <a href="#home" className="hover:text-sky-600 transition-colors whitespace-nowrap shrink-0">
              Trang chủ
            </a>
            <a href="#intro" className="hover:text-sky-600 transition-colors whitespace-nowrap shrink-0">
              Giới thiệu
            </a>
            <a href="#modules" className="hover:text-sky-600 transition-colors whitespace-nowrap shrink-0">
              05 Phân hệ
            </a>
            <a href="#process" className="hover:text-sky-600 transition-colors whitespace-nowrap shrink-0">
              Quy trình
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handlePrimaryStart}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? 'Vào không gian học' : 'Đăng nhập'}
            </button>
          </div>
        </div>

        {/* Mobile quick links */}
        <nav
          aria-label="Điều hướng di động"
          className="md:hidden border-t border-sky-50 px-4 py-2 flex justify-around text-xs font-semibold text-slate-600 bg-white"
        >
          <a href="#home" className="py-1 hover:text-sky-600 whitespace-nowrap">Trang chủ</a>
          <a href="#intro" className="py-1 hover:text-sky-600 whitespace-nowrap">Giới thiệu</a>
          <a href="#modules" className="py-1 hover:text-sky-600 whitespace-nowrap">05 Phân hệ</a>
          <a href="#process" className="py-1 hover:text-sky-600 whitespace-nowrap">Quy trình</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-blue-50/40 bg-grid-pattern pt-12 pb-20 lg:pt-16 lg:pb-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-bold tracking-wider text-sky-700 uppercase">
                Sở Giáo dục và Đào tạo Thành phố Đà Nẵng · Trường PTDTNT THPT Quảng Nam
              </p>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.2] tracking-tight [text-wrap:balance]">
                CHỦ ĐỘNG TỰ HỌC
                <span className="block bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                  LÀM CHỦ TRI THỨC
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                EDU SMART là nền tảng hỗ trợ học sinh xây dựng kế hoạch học tập, rèn luyện tư duy độc lập, kiểm chứng thông tin và sử dụng trí tuệ nhân tạo một cách chủ động, có trách nhiệm.
              </p>

              {/* Ho Chi Minh Quote */}
              <div className="mt-7 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-sky-50/90 border border-amber-300/80 p-5 sm:p-6 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Quote className="w-5 h-5" />
                  </div>
                  <div>
                    <blockquote className="font-serif-quote font-bold italic text-slate-900 text-base sm:text-lg leading-relaxed">
                      “Trong cách học phải lấy tự học làm cốt. Học ở trường, học trong sách vở, học lẫn nhau và học dân.”
                    </blockquote>
                    <p className="mt-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-800">
                      — Chủ tịch Hồ Chí Minh
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handlePrimaryStart}
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-200/70 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>BẮT ĐẦU HỌC TẬP</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={onEnterDemo}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm sm:text-base font-bold text-slate-700 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Layers className="w-5 h-5 text-sky-600" />
                  <span>TRẢI NGHIỆM 05 PHÂN HỆ</span>
                </button>
              </div>
            </div>

            {/* Interactive 5-module Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-sky-100 shadow-lg shadow-sky-100/60 p-6 sm:p-7">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Lộ trình tự học thông minh
                  </span>
                  <span className="text-xs font-bold text-sky-700">
                    05 Phân hệ
                  </span>
                </div>

                <div className="mt-4 space-y-2.5" role="tablist" aria-label="Mô phỏng 5 phân hệ học tập">
                  {DEMO_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isSelected = selectedStep === idx;
                    return (
                      <button
                        key={step.code}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedStep(idx)}
                        className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-sky-300 bg-sky-50/90 shadow-xs'
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl font-mono-num font-bold text-xs flex items-center justify-center shrink-0 ${step.iconBg}`}
                          >
                            {step.code}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{step.title}</div>
                            <div className="text-xs text-slate-500 truncate">{step.subtitle}</div>
                          </div>
                        </div>
                        <Icon className={`w-5 h-5 shrink-0 ${step.accent}`} />
                      </button>
                    );
                  })}
                </div>

                <div className={`mt-4 p-4 rounded-2xl border text-xs sm:text-sm text-slate-700 leading-relaxed ${activeStep.detailBg}`}>
                  <strong className={activeStep.accent}>{activeStep.detailTitle}</strong>{' '}
                  {activeStep.detailText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section id="intro" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6">
              <p className="text-xs font-extrabold uppercase tracking-widest text-sky-600">
                Về nền tảng học tập
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
                GIỚI THIỆU VỀ EDU SMART
              </h2>

              <div className="mt-6 space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Trong thời đại chuyển đổi số và sự phát triển mạnh mẽ của trí tuệ nhân tạo, việc hình thành năng lực tự học và tư duy phản biện là yêu cầu quan trọng đối với học sinh.
                </p>
                <p>
                  <strong className="text-slate-900">EDU SMART</strong> được xây dựng nhằm tạo ra môi trường học tập có định hướng, giúp học sinh biết lập kế hoạch, chủ động tìm hiểu, kiểm chứng kiến thức và tự đánh giá kết quả học tập của bản thân.
                </p>
                <p>
                  Hệ thống đồng thời hỗ trợ giáo viên theo dõi quá trình học tập và sự tiến bộ của học sinh một cách trực quan, khoa học, tích hợp đồng bộ với Google Workspace.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div>
                  <div className="text-2xl font-extrabold text-sky-600 font-mono-num">05</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">Phân hệ cốt lõi</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-blue-600 font-mono-num">100%</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">Chủ động tư duy</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600 font-mono-num">24/7</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">Đồng hành tự học</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-gradient-to-br from-sky-100/80 via-blue-50 to-indigo-100/70 p-7 sm:p-9 border border-sky-200/70">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-sky-100">
                    <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3.5">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Tư duy phản biện</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Rèn thói quen đặt câu hỏi, suy nghĩ độc lập trước khi tham khảo AI.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-sky-100">
                    <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3.5">
                      <BookOpenCheck className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Kiểm chứng tri thức</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Đối chiếu thông tin với sách giáo khoa và nguồn học liệu tin cậy.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-sky-100">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3.5">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Kỷ luật tự học</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Xây dựng mục tiêu rõ ràng, quản lý tiến độ và tự đánh giá năng lực.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-sky-100">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3.5">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Kết nối Giáo viên</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Ghi nhận hành trình rèn luyện giúp thầy cô đồng hành kịp thời.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 Learning Modules */}
      <section id="modules" className="py-16 lg:py-24 bg-gradient-to-b from-sky-50/70 to-blue-50/40 border-y border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-extrabold uppercase tracking-widest text-sky-700 mb-2">
              Cấu trúc hệ thống
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
              05 PHÂN HỆ HỌC TẬP
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Quy trình rèn luyện năng lực tự học và tư duy độc lập thông qua 5 phân hệ liên kết chặt chẽ.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="bg-white rounded-2xl p-7 border border-sky-100 hover:border-sky-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-sky-700">Phân hệ 01 · Kế hoạch</span>
                <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">STUDY PLAN</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Lập kế hoạch, nhập nhiệm vụ, xác định mục tiêu, quản lý thời gian tự học và đánh giá nguyên nhân chưa hoàn thành.
              </p>
            </article>

            <article className="bg-white rounded-2xl p-7 border border-amber-100 hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-amber-700">Phân hệ 02 · Tư duy độc lập</span>
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">THINK FIRST</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Khuyến khích học sinh suy nghĩ, trả lời câu hỏi và hình thành lập luận cá nhân trước khi sử dụng AI.
              </p>
            </article>

            <article className="bg-white rounded-2xl p-7 border border-indigo-100 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-indigo-700">Phân hệ 03 · Huấn luyện viên AI</span>
                <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">AI COACH</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trợ lý AI gợi mở, đặt câu hỏi định hướng, hướng dẫn học sinh tự tìm hiểu và giải quyết vấn đề.
              </p>
            </article>

            <article className="bg-white rounded-2xl p-7 border border-emerald-100 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-emerald-700">Phân hệ 04 · Phản biện</span>
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <SearchCheck className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">FACT CHECK</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kiểm chứng nguồn thông tin, đối chiếu sách giáo khoa, phát hiện sai lệch và đưa ra lập luận cá nhân.
              </p>
            </article>

            <article className="bg-white rounded-2xl p-7 border border-violet-100 hover:border-violet-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-violet-700">Phân hệ 05 · Không dùng AI</span>
                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">SELF TEST</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tự kiểm tra kiến thức không có AI hỗ trợ, giải thích bằng ngôn ngữ bản thân và vận dụng vào tình huống mới.
              </p>
            </article>

            <article className="bg-gradient-to-br from-sky-600 to-blue-700 text-white rounded-2xl p-7">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-sky-100">Hệ thống hỗ trợ · Học sinh & Giáo viên</span>
                <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-2">LEARNING PROGRESS</h3>
              <p className="text-sm text-sky-50 leading-relaxed">
                Theo dõi tiến độ, ghi nhận quá trình rèn luyện và hỗ trợ giáo viên đánh giá sự tiến bộ của học sinh.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 4-step Process */}
      <section id="process" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-extrabold uppercase tracking-widest text-blue-700 mb-2">
              Lộ trình rèn luyện
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
              QUY TRÌNH HỌC TẬP
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Học sinh trải qua quá trình khoa học từ lập kế hoạch đến tự kiểm tra và đánh giá.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-sky-50/70 rounded-2xl p-7 border border-sky-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-mono-num font-extrabold text-xl flex items-center justify-center">
                01
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-900">LẬP KẾ HOẠCH</h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Xác định nhiệm vụ và mục tiêu học tập.
              </p>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-7 border border-amber-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-mono-num font-extrabold text-xl flex items-center justify-center">
                02
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-900">TƯ DUY ĐỘC LẬP</h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Hình thành nhận định trước khi dùng AI.
              </p>
            </div>

            <div className="bg-emerald-50/60 rounded-2xl p-7 border border-emerald-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-mono-num font-extrabold text-xl flex items-center justify-center">
                03
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-900">HỌC VÀ KIỂM CHỨNG</h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Tiếp nhận gợi ý, đối chiếu và phản biện.
              </p>
            </div>

            <div className="bg-indigo-50/60 rounded-2xl p-7 border border-indigo-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-mono-num font-extrabold text-xl flex items-center justify-center">
                04
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-900">TỰ ĐÁNH GIÁ</h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Kiểm tra kiến thức và vận dụng thực tế.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-sky-50">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-8 sm:p-14 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            SẴN SÀNG KHÁM PHÁ EDU SMART?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-sky-100 max-w-xl mx-auto leading-relaxed">
            Hãy bắt đầu hành trình học tập chủ động, phát triển tư duy và làm chủ tri thức ngay hôm nay.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={handlePrimaryStart}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-700 hover:bg-sky-50 font-extrabold text-sm sm:text-base transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-5 h-5" />
              <span>{isAuthenticated ? 'MỞ BẢNG ĐIỀU KHIỂN' : 'ĐĂNG NHẬP GOOGLE NGAY'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sky-50 border-t border-sky-100 py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-sky-700 font-extrabold text-base sm:text-lg">
            <GraduationCap className="w-5 h-5" />
            <span>EDU SMART — NỀN TẢNG HỖ TRỢ NĂNG LỰC TỰ HỌC</span>
          </div>
          <div className="mt-3 space-y-1 text-xs sm:text-sm font-semibold text-slate-600">
            <p>SỞ GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ ĐÀ NẴNG</p>
            <p>TRƯỜNG PTDTNT THPT QUẢNG NAM</p>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            © 2026 EDU SMART · Hệ thống học tập thông minh
          </p>
        </div>
      </footer>
    </div>
  );
};

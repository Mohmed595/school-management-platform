import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  Users,
  ShieldCheck,
  GraduationCap,
  Download,
  Key,
} from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface FaqPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export function FaqPage({ onBackToHome, onNavigateToPage }: FaqPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    'الكل',
    'تسجيل الدخول والحسابات',
    'الطالب وولي الأمر (الحساب المشترك)',
    'الانضباط والمميزات المدعومة',
    'المعلمون والإدارة',
    'الأجهزة الموثوقة والتطبيق',
  ];

  const faqItems: FaqItem[] = [
    {
      category: 'تسجيل الدخول والحسابات',
      question: 'هل يمتلك ولي الأمر حساباً منفصلاً عن حساب الطالب؟',
      answer: 'لا، في منصة EduPortal حساب الطالب وحساب ولي الأمر هما نفس الحساب الموحد تماماً. لا يحتاج ولي الأمر إلى حساب منفصل أو تسجيل برقم هاتف، بل يدخل ولي الأمر والطالب بنفس البيانات للاطلاع المشترك على الحضور، السلوك، والأوسمة.',
    },
    {
      category: 'تسجيل الدخول والحسابات',
      question: 'كيف يسجل الطالب أو ولي الأمر الدخول؟ وهل يحتاج لاختيار المدرسة أولاً؟',
      answer: 'لا يُطلب منك اختيار المدرسة أولاً! يتم الدخول مباشرة بكتابة 3 بيانات فقط: (1) اسم الطالب، (2) كود الوزارة (Ministry Code)، (3) الرقم القومي للطالب (Gov ID / National ID). يتعرف النظام تلقائياً وبشكل فوري على مدرسة الطالب وبيانات صفه ويفتح حسابه مباشرة.',
    },
    {
      category: 'تسجيل الدخول والحسابات',
      question: 'هل يُطلب من الطالب أو ولي الأمر إدخال كلمة مرور؟',
      answer: 'لا، تسجيل دخول الطالب وولي الأمر لا يستخدم كلمة مرور نهائياً! يعتمد الدخول فقط على مطابقة الاسم، الرقم القومي، وكود الوزارة المسجلين رسمياً بالمدرسة. كلمات المرور مخصصة فقط للكوادر التعليمية (المعلمين ومحضري الغياب) وإدارة المدرسة.',
    },
    {
      category: 'تسجيل الدخول والحسابات',
      question: 'ماذا أفعل إذا ظهرت رسالة "لم يتم العثور على حساب الطالب"؟',
      answer: 'تأكد أولاً من كتابة اسم الطالب مطابقاً للمسجل في شهادة الميلاد والمدرسة، والتأكد من إدخال كود الوزارة بدقة والرقم القومي المكون من 14 رقماً. إذا استمر التعذر، يمكنك التوجه إلى "مركز الدعم الفني" وفتح تذكرة فورية دون تسجيل دخول، أو مراجعة إدارة المدرسة للتحقق من كود الوزارة.',
    },
    {
      category: 'الانضباط والمميزات المدعومة',
      question: 'هل تدعم منصة EduPortal الامتحانات والتقييمات أو الاختبارات الأونلاين؟',
      answer: 'لا، منصة EduPortal لا تدعم إجراء الامتحانات أو الاختبارات والتقييمات الأكاديمية. تركيز المنصة موجه بالكامل وباحترافية نحو: رصد ومتابعة الحضور والغياب اليومي، الملاحظات السلوكية الإيجابية والسلبية اللحظية، نظام نقاط التميز والأوسمة التشجيعية، والتنبيهات المدرسية الرسمية.',
    },
    {
      category: 'الطالب وولي الأمر (الحساب المشترك)',
      question: 'ما الذي يستطيع ولي الأمر والطالب متابعته داخل المنصة؟',
      answer: 'يتيح الحساب الموحد استعراض نسبة وسجلات الحضور والغياب اليومي، الملاحظات السلوكية الإيجابية والسلبية التي يرصدها المعلمون فورياً، رصيد نقاط التميز والأوسمة المحصلة، إعلانات وتنبيهات المدرسة، وتقديم تذاكر تواصل واستفسار مع إدارة المدرسة.',
    },
    {
      category: 'الطالب وولي الأمر (الحساب المشترك)',
      question: 'ما هو نظام الأوسمة ونقاط التميز وتخصيص الأفاتار؟',
      answer: 'هو نظام تحفيزي وسلوكي متكامل؛ يمنح المعلم الطالب أوسمة ونقاط تقديرية عند المشاركة الإيجابية والالتزام والانضباط داخل الفصل. تظهر هذه الأوسمة في ملف الطالب مع إمكانية اختيار أفاتار مميز يعزز من معنويات الطالب وشغفه بالانضباط المدرسي.',
    },
    {
      category: 'الأجهزة الموثوقة والتطبيق',
      question: 'ما هي ميزة "الأجهزة الموثوقة" لمدة 300 يوم؟',
      answer: 'تتيح ميزة الأجهزة الموثوقة حفظ جلسة الدخول بأمان على هاتفك أو جهازك الشخصي لمدة 300 يوم. تمكّن أولياء الأمور الذين لديهم عدة أبناء في نفس المدرسة أو مدارس مختلفة من التبديل الفوري بين ملفات أبنائهم بنقرة واحدة، دون الحاجة لإعادة كتابة الرقم القومي وكود الوزارة في كل مرة.',
    },
    {
      category: 'المعلمون والإدارة',
      question: 'كيف يسجل المعلمون وإدارة المدرسة الدخول إلى المنصة؟',
      answer: 'من خلال الضغط على زر "دخول الكوادر والإدارة"؛ حيث يسجل المعلمون ومحضرو الغياب الدخول باسم المستخدم وكلمة المرور الخاصة بهم، بينما تسجل إدارة المدرسة الدخول باستخدام "كود المدرسة" و"كود الترخيص المعتمد".',
    },
    {
      category: 'المعلمون والإدارة',
      question: 'كيف يقوم المعلم برصد الحضور والسلوك اليومي؟',
      answer: 'من خلال لوحة تحكم المعلم، يختار المعلم فصوله وطلابه، ويسجل الحضور بنقرة زر، أو يضيف ملاحظة سلوكية (إيجابية لتعزيز الطالب أو سلبية للتوجيه) لتصل للمنظومة ولحساب ولي الأمر فوراً.',
    },
    {
      category: 'الأجهزة الموثوقة والتطبيق',
      question: 'هل يمكن تثبيت المنصة كتطبيق على الهاتف (PWA)؟',
      answer: 'نعم! تدعم EduPortal تقنية تطبيق الويب التقدمي (Progressive Web App) بالكامل؛ يمكنك إضافة المنصة إلى الشاشة الرئيسية لهاتفك (iPhone أو Android) لتعمل كتطبيق سريع وخفيف دون الحاجة للتنزيل من المتاجر ودون استهلاك سعة تخزين.',
    },
    {
      category: 'الأجهزة الموثوقة والتطبيق',
      question: 'هل بيانات الطلاب وسجلات الانضباط مشفرة ومحمية؟',
      answer: 'نعم تماماً، جميع البيانات مشفرة باستخدام بروتوكولات TLS/HTTPS المتقدمة 256-bit، وقواعد البيانات محمية بصلاحيات وصول صارمة مبنية على الأدوار، ولا يتم بيع أو مشاركة أي بيانات إطلاقاً.',
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesCategory = selectedCategory === 'الكل' || item.category === selectedCategory;
      const matchesSearch =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, faqItems]);

  return (
    <PublicPageLayout
      title="الأسئلة الأكثر شيوعاً (FAQ)"
      subtitle="إليك إجابات وافية وشاملة عن أبرز الاستفسارات المتكررة حول استخدام منصة EduPortal، حسابات الدخول، ومتابعة الطلاب."
      categoryBadge="مركز الإجابات المعتمدة"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن سؤالك (مثال: كود الوزارة، الرقم القومي، الأجهزة الموثوقة، السلوك، الحضور...)"
            className="w-full pr-11 pl-4 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setOpenIndex(null);
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-white">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium border-t border-slate-800/60 bg-slate-950/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 font-bold space-y-2">
              <p>لم نجد أي أسئلة مطابقة لبحثك "{searchQuery}"</p>
              <button
                onClick={() => onNavigateToPage?.('support')}
                className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
              >
                تواصل مع الدعم الفني لطرح سؤالك
              </button>
            </div>
          )}
        </div>

        {/* Still Need Help Box */}
        <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/40 rounded-3xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-white">لم تجد إجابة لاستفسارك؟</h4>
            <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
              فريق دعم EduPortal متواجد دائماً للرد على أسئلتك ومساعدتك في أي استفسار أكاديمي أو تقني.
            </p>
          </div>
          <button
            onClick={() => onNavigateToPage?.('support')}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            فتح تذكرة دعم فني مباشرة
          </button>
        </div>
      </div>
    </PublicPageLayout>
  );
}

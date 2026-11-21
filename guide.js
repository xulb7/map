/*!
 * guide.js — دليل المستجدين (مسار)
 * ---------------------------------------------------------------
 * - ملف مستقل: يضيف زر «دليل المستجدين» ونافذة فيها: التخصصات (الخطط)، الأنظمة واللوائح، أسئلة شائعة.
 * - الربط: أضيفي السطر التالي في index.html قبل assistant.js:
 *       <script src="guide.js" defer></script>
 * - لا يعدّل الخريطة ولا الملاحة. يعرّف window.MASAR_GUIDE ليستفيد منه المساعد في الإجابة.
 * - المصدر: الخطط التدريبية + اللائحة الأساسية للتدريب والتقويم (1445هـ) + قواعد تنظيم السلوك (1446هـ).
 *   المحتوى هنا ملخّص مبسّط، والمرجع الرسمي هو نصوص اللوائح (ملفات PDF).
 */
(function () {
  'use strict';

  if (window.__masarGuideLoaded) return;
  window.__masarGuideLoaded = true;

  /* ================================ المصادر ================================ */
  var SRC = {
    reg: { name: 'اللائحة الأساسية للتدريب والتقويم (1445هـ)', file: 'regulation-basic.pdf' },
    conduct: { name: 'قواعد تنظيم السلوك للمتدربين والمتدربات (1446هـ)', file: 'rules-conduct.pdf' }
  };

  /* ================================ التخصصات ================================ */
  // كل مقرر: [الرمز, الاسم, المتطلب السابق, الوحدات (اختياري)]
  var MAJORS = [
    {
      id: 'office',
      name: 'تقنيات الأعمال المكتبية',
      dept: 'الكلية التقنية للبنات بالزلفي',
      k: 'مكتبي',
      office: { b: 'B', floor: 'الدور الثاني', id: 'B-S-04', label: 'مكتب رئيسة القسم' },
      note: 'الخطة موزعة على أربعة مستويات (فصول) ثم مستوى التدريب التعاوني. الوحدات وساعات الاتصال التفصيلية موجودة في الخطة الرسمية.',
      levels: [
        { name: 'المستوى الأول', courses: [
          ['ENG1101', 'لغة إنجليزية 1', '-'],
          ['MATH1001', 'الرياضيات لتطبيقات الحاسب', '-'],
          ['MANA1001', 'مقدمة في الأعمال', '-'],
          ['IT1001', 'مهارات الحاسب الآلي', '-'],
          ['ECON1011', 'مبادئ الاقتصاد', '-'],
          ['ARAB1011', 'اللغة العربية والتواصل', '-']
        ] },
        { name: 'المستوى الثاني', courses: [
          ['ENG2101', 'لغة إنجليزية 2', 'ENG1101'],
          ['BUS2101', 'إدارة الأعمال', 'MANA1001'],
          ['STAT2011', 'الإحصاء للأعمال', 'MATH1001'],
          ['COMP2101', 'تطبيقات الحاسب', 'IT1001'],
          ['LNG2101', 'مهارات الاتصال', 'ENG1101'],
          ['ISLM2011', 'الثقافة الإسلامية', '-']
        ] },
        { name: 'المستوى الثالث', courses: [
          ['ENG3101', 'لغة إنجليزية 3', 'ENG2101'],
          ['FIN3201', 'المحاسبة المالية والإدارية', 'BUS2101'],
          ['MANA3201', 'إدارة الموارد البشرية', 'MANA2101'],
          ['OMAN3211', 'إدارة المكاتب والتقنية', 'COMP2101'],
          ['LNG3201', 'مهارات الكتابة باللغة الإنجليزية', 'LNG2101'],
          ['PRJ3011', 'مشروع التدريب', 'MANA3201']
        ] },
        { name: 'المستوى الرابع', courses: [
          ['ENG4101', 'اللغة الإنجليزية المهنية والتقنية', 'ENG3101'],
          ['MANA4101', 'إدارة المشاريع', 'MANA3201'],
          ['LNG4101', 'المراسلات التجارية باللغة الإنجليزية', 'LNG3201'],
          ['OMAN4211', 'الأنظمة المكتبية المتقدمة', 'OMAN3211'],
          ['TRN4101', 'التدريب الميداني', 'MANA3201'],
          ['PRJ4011', 'مشروع التخرج', 'PRJ3011']
        ] },
        { name: 'المستوى التعاوني', courses: [
          ['TGT5001', 'التدريب التعاوني', '-']
        ] }
      ]
    },
    {
      id: 'multimedia',
      name: 'تقنية الوسائط المتعددة وتقنيات الويب',
      dept: 'قسم الحاسب وتقنية المعلومات',
      k: 'وسا.ط|ويب|ميديا|ملتيميديا',
      note: 'دبلوم بالنظام النصفي (خمسة فصول، آخرها التدريب التعاوني) ومجموع وحداتها 70 وحدة معتمدة.',
      office: { b: 'A', floor: 'الدور الأول', id: 'A-F-7', label: 'مكتب رئيسة القسم' },
      levels: [
        { name: 'الفصل الأول', courses: [
          ['ENGL 101', 'لغة إنجليزية 1', '-', 3],
          ['ICMT 101', 'مقدمة تطبيقات الحاسب', '-', 2],
          ['MATH 101', 'الرياضيات', '-', 3],
          ['PHYS 101', 'الفيزياء', '-', 3],
          ['IMUL 141', 'التصميم المرئي 1', '-', 4],
          ['IMUL 101', 'المهارات الأساسية للمصممين', '-', 3]
        ] },
        { name: 'الفصل الثاني', courses: [
          ['ENGL 102', 'لغة إنجليزية 2', 'ENGL 101', 3],
          ['ARAB 101', 'الكتابة الفنية', '-', 2],
          ['ISLM 101', 'الدراسات الإسلامية', '-', 2],
          ['ENTR 101', 'أساسيات ريادة الأعمال', '-', 2],
          ['ICMT 102', 'تطبيقات الحاسب المتقدمة', 'ICMT 101', 2],
          ['IMUL 121', 'معالجة الصوت الرقمي', '-', 2],
          ['IMUL 131', 'معالجة الفيديو الرقمي 1', '-', 4]
        ] },
        { name: 'الفصل الثالث', courses: [
          ['ENGL 103', 'لغة إنجليزية 3', 'ENGL 102', 3],
          ['ENTR 212', 'ريادة الأعمال التخصصية', 'ENTR 101', 2],
          ['IMUL 242', 'التصميم المرئي 2', 'IMUL 141', 4],
          ['IMUL 232', 'معالجة الفيديو الرقمي 2', 'IMUL 131', 4],
          ['IMUL 251', 'التصميم الرقمي', 'IMUL 141', 4]
        ] },
        { name: 'الفصل الرابع', courses: [
          ['ENGL 204', 'لغة إنجليزية 4', 'ENGL 103', 3],
          ['ETHS 201', 'السلوك الوظيفي والمستقبل المهني', '-', 2],
          ['ICMT 280', 'التأهيل للشهادات الاحترافية', '-', 1],
          ['IMUL 271', 'النشر الإلكتروني', '-', 2],
          ['IMUL 261', 'التصميم التفاعلي', 'IMUL 141', 4],
          ['IMUL 285', 'موضوعات مختارة', '-', 2],
          ['IMUL 295', 'مشروع', 'IMUL 232 + IMUL 251', 2]
        ] },
        { name: 'الفصل الخامس (تعاوني)', courses: [
          ['IMUL 299', 'التدريب التعاوني', '-', 2]
        ] }
      ]
    }
  ];

  /* ============================ الأنظمة واللوائح ============================ */
  var REGS = [
    {
      id: 'study', title: 'الدراسة والحضور', src: 'reg',
      items: [
        { t: 'الفصل التدريبي', d: 'مدته لا تقل عن 15 أسبوعاً ولا تزيد على 18 أسبوعاً، وتشمل فترتي الإعداد والتقويم النهائي. والعام التدريبي فصلان، ومعهما فصل صيفي اختياري إن وُجد.' },
        { t: 'ساعة الاتصال', d: 'الوقت الفعلي للتدريب خلال الأسبوع، ولا تقل عن 50 دقيقة في المحاضرات النظرية أو التدريب العملي والميداني.' },
        { t: 'الغياب والحرمان', d: 'إذا زادت نسبة غيابك على 20% من إجمالي ساعات الاتصال للمقرر تُحرمين من الاستمرار فيه ويُرصد لك تقدير «محروم» (ح أو DN). ويجوز لمجلس المنشأة رفع الحرمان إذا قدمتِ عذراً يقبله، بشرط ألا يتجاوز غيابك 40% من ساعات الاتصال.' },
        { t: 'إلغاء قبول المستجدة', d: 'يُلغى قبول المتدربة المستجدة إذا لم تنتظم في التدريب حتى نهاية الأسبوع الثاني من بدايته دون عذر يقبله عميد الكلية.' },
        { t: 'الحذف والإضافة', d: 'يُسمح بالحذف والإضافة خلال الأسبوع الأول من الفصل. وفي الكليات يُسمح بالحذف فقط حتى نهاية الأسبوع السادس، بشرط ألا ينقص عدد الوحدات المسجلة عن الحد الأدنى.' }
      ]
    },
    {
      id: 'grades', title: 'التقويم والنجاح والمعدل', src: 'reg',
      items: [
        { t: 'الدرجة النهائية', d: 'تُحسب الدرجة النهائية لكل مقرر من 100 درجة، وتتوزع حسب وسائل التقويم (اختبارات، تمارين، مشاريع...) وفق التعليمات التنفيذية.' },
        { t: 'درجة النجاح', d: 'الحد الأدنى للنجاح 60 درجة في الكليات (و50 في المعاهد). وتجتازين المقرر بإتقان الحد الأدنى من المعارف والمهارات وحصولك على درجة النجاح.' },
        { t: 'المعدل الفصلي والتراكمي', d: 'نقاط كل مقرر = وزن التقدير × عدد وحدات المقرر. المعدل الفصلي هو مجموع نقاط مقررات الفصل ÷ مجموع وحداتها، والمعدل التراكمي هو مجموع نقاط كل المقررات منذ الالتحاق ÷ مجموع وحداتها.' },
        { t: 'إعادة التقييم', d: 'يجوز طلب إعادة تقييم مقرر أو أكثر خلال مدة أقصاها الأسبوع الثاني من الفصل الذي يليه، وفق التعليمات التنفيذية.' },
        { t: 'تقدير «غير مكتمل»', d: 'يجوز إعطاء المتدربة تقدير (غير مكتمل) إذا لم تتمكن من استكمال متطلبات اجتياز المقرر، وفق التعليمات التنفيذية.' }
      ]
    },
    {
      id: 'status', title: 'التأجيل والانسحاب والتحويل', src: 'reg',
      items: [
        { t: 'تأجيل بدء التدريب', d: 'يجوز تقديم طلب تأجيل بدء التدريب وفق التعليمات التنفيذية، ولا تُحتسب مدة التأجيل ضمن المدة النظامية لإنهاء متطلبات التخرج.' },
        { t: 'الانسحاب من الفصل', d: 'يجوز الانسحاب من الفصل التدريبي. ويُحتسب الفصل المنسحب منه من المدة النظامية، ويُرصد لك تقدير «منسحبة بعذر» (ع أو W).' },
        { t: 'المدة النظامية', d: 'هي عدد فصول الخطة التدريبية متضمنة فصول التعثر والانسحاب الفصلي، ولا تشمل الفصول الصيفية.' },
        { t: 'التحويل بين البرامج', d: 'يجوز التحويل من برنامج إلى آخر مماثل له في الشهادة الممنوحة مرة واحدة فقط. ويجوز الانتقال من منشأة تدريبية إلى مماثلة قبل بداية الفصل وفق التعليمات التنفيذية.' },
        { t: 'طي القيد', d: 'يجوز طي القيد بناءً على طلبك. ويُطوى قيد المنقطعة عن التدريب أسبوعين متتاليين خلال الفصل (ويُستثنى من تقدّم بعذر يقبله المجلس)، وكذلك المتجاوزة للمدة النظامية.' },
        { t: 'إعادة القيد', d: 'يجوز لمن طُوي قيدها التقدم بطلب إعادة القيد، بعد موافقة مجلس المنشأة، على ألا تتجاوز مدة الانقطاع فصلين تدريبيين (ويُستثنى ما ورد في التعليمات التنفيذية).' }
      ]
    },
    {
      id: 'warn', title: 'الإنذارات والمكافأة', src: 'reg',
      items: [
        { t: 'الإنذار التدريبي', d: 'يوجَّه إنذار كتابي أو إلكتروني عند انخفاض معدلك التراكمي عن الحد الأدنى المحدد.' },
        { t: 'الفصل من التدريب', d: 'يُفصل المتدرب إذا حصل على إنذارين متتاليين أو ثلاثة إنذارات متفرقة خلال فترة التدريب. ويُفصل تأديبياً عند ارتكاب مخالفة سلوكية تقتضي ذلك.' },
        { t: 'المكافأة الشهرية', d: 'تُصرف مكافأة شهرية للمتدربة المنتظمة حسب ضوابط الصرف والتعليمات التنفيذية.' },
        { t: 'متى تتوقف المكافأة؟', d: 'عند تجاوز المدة النظامية لإنهاء متطلبات التخرج، أو الانسحاب أو التأجيل أو طي القيد، أو الحصول على إنذار نتيجة التعثر مع معدل تراكمي أقل من 2، أو الإيقاف عن التدريب بسبب مخالفة قواعد السلوك.' }
      ]
    },
    {
      id: 'grad', title: 'التخرج', src: 'reg',
      items: [
        { t: 'شروط التخرج', d: 'تتخرجين بعد إنهاء جميع متطلبات الخطة التدريبية بنجاح، على ألا يقل معدلك التراكمي عن 2.00 من 5.00.' },
        { t: 'التقدير العام عند التخرج (الكليات)', d: 'ممتاز: من 4.50 إلى 5.00. جيد جداً: من 3.75 إلى أقل من 4.50. جيد: من 2.75 إلى أقل من 3.75. مقبول: من 2.00 إلى أقل من 2.75.' },
        { t: 'مرتبة الشرف', d: 'تُمنح المتدربة المتفوقة مرتبة الشرف الأولى أو الثانية وفق التعليمات التنفيذية، وتُدرج ضمن شهادة التخرج.' },
        { t: 'التدريب التعاوني', d: 'مقرر ضمن الخطة التدريبية في الكليات، يُنفَّذ بالتكامل مع جهات التوظيف بسوق العمل لتكتسبي مهارات في مجال تخصصك.' },
        { t: 'الشهادة والسجل', d: 'تُمنح المتدربة شهادة تخرج وسجلاً تدريبياً من المنشأة عند اجتياز كامل متطلبات الخطة بنجاح.' }
      ]
    },
    {
      id: 'conduct', title: 'قواعد السلوك', src: 'conduct',
      items: [
        { t: 'واجباتك', d: 'المحافظة على ممتلكات المنشأة، وحضور ساعات التدريب في وقتها بلا تأخير أو غياب، والتزام السلوك الفاضل مع الزميلات والمدربات ومنسوبات المنشأة، والتقيد بالزي الرسمي والظهور بمظهر لائق، والالتزام بالأنظمة والتعليمات.' },
        { t: 'درجات المخالفة', d: 'تُصنف المخالفات السلوكية إلى أربع درجات، من الدرجة الأولى (الأقل) إلى الرابعة (الأعلى).' },
        { t: 'الدرجة الأولى (أمثلة)', d: 'الحديث الجانبي أو استخدام أجهزة الاتصال الشخصية أثناء التدريب بما يعيق سيره، عدم التقيد بالزي الرسمي، عدم إبراز بطاقة المتدربة، عدم إحضار الحقائب والأدوات التدريبية، إطالة الشعر بشكل لافت أو قصات وصبغات مخالفة للذوق العام، رفع الصوت أو الإزعاج غير المبرر، الإخلال بنظافة المنشأة، حمل الدخان أو السجائر الإلكترونية.' },
        { t: 'الدرجة الثانية (أمثلة)', d: 'ممارسة التدخين داخل حرم المنشأة، الامتناع عن الحضور عند الاستدعاء، إثارة الفوضى، الامتناع عن تقديم البطاقة التعريفية، المخالفة المرورية في الحرم، محاولة الغش في الاختبار أو التقويم، المظهر أو الهيئة المخالفة، التعنت ورفض الامتثال للتوجيهات، التشبه بالجنس الآخر.' },
        { t: 'الدرجة الثالثة (أمثلة)', d: 'تسهيل دخول من لا ينتمي للمنشأة بدون تصريح، الغش في الاختبار أو المساعدة عليه، تصوير المنشأة ومرافقها بغرض الإساءة، عرض محتوى منافٍ للأخلاق، التهديد أو التلفظ بألفاظ غير لائقة على المنسوبات أو التنمر عليهن، تعطيل التدريب أثناء المحاضرات والاختبارات، السرقة، الدخول أو الخروج من المنشأة بطريقة غير نظامية.' },
        { t: 'الدرجة الرابعة (أمثلة)', d: 'نشر الأفكار المنافية للدين أو المعادية للوطن، ترويج المخدرات أو تعاطيها، التحرش، حيازة الأسلحة أو إحضار مواد خطرة، تزوير الوثائق أو الأختام الرسمية، الاعتداء على المنسوبات أو المتدربات، المخالفات المعلوماتية، التعدي على المال العام.' },
        { t: 'كيف تتدرج الإجراءات؟', d: 'يُراعى التدرج بحسب تكرار المخالفة ودرجتها: تعهد كتابي وحسم من المكافأة، ثم إحالة لرئيسة القسم أو لمشرفة وحدة الخدمات الإرشادية، ثم إحالة إلى اللجنة الفرعية للانضباط عند التكرار. ومخالفات الدرجة الرابعة تُشعَر بها الإدارة العامة لشؤون المتدربين في اليوم نفسه، وتُحال إلى اللجنة الفرعية للانضباط، ويُبلَّغ ولي الأمر رسمياً.' },
        { t: 'حقوقك عند المخالفة', d: 'لا تُوقع العقوبة إلا بعد استدعائك للتحقيق وسماع أقوالك، ولك الحق في الدفاع عن نفسك وتقديم الإثباتات. وتُعقد جلسات اللجان بسرية تامة. ولك رفع اعتراض على العقوبة لدى عميدة الكلية خلال أسبوع من تاريخ صدور القرار.' },
        { t: 'الإيقاف عن التدريب', d: 'قرار إداري يصدر بحق المتدربة بناءً على مخالفتها لقواعد تنظيم السلوك. والحد الأدنى للإيقاف عن التدريب فصل تدريبي أو أكثر مع إيقاف المكافأة.' }
      ]
    }
  ];

  /* ============================== أسئلة شائعة ============================== */
  // k = تعبير نمطي على النص بعد التطبيع (بدون تشكيل، ة=ه، ى=ي، أإآ=ا)
  var FAQ = [
    { q: 'كم نسبة الغياب المسموحة؟',
      a: 'إذا زادت نسبة غيابك على 20% من ساعات الاتصال للمقرر تُحرمين من الاستمرار فيه ويُرصد لك تقدير «محروم» (ح أو DN). ويجوز لمجلس المنشأة رفع الحرمان إذا قدمتِ عذراً يقبله، بشرط ألا يتجاوز غيابك 40%.',
      s: 'اللائحة الأساسية، المادة الخامسة', k: 'غياب|اغيب|غايب|حرمان|محروم|احرم|نسبه الحضور|الحضور' },
    { q: 'متى يُلغى قبول المستجدة؟',
      a: 'يُلغى قبول المتدربة المستجدة إذا لم تنتظم في التدريب حتى نهاية الأسبوع الثاني من بدايته دون عذر يقبله عميد الكلية.',
      s: 'اللائحة الأساسية، المادة الخامسة', k: 'الغاء القبول|الغاء قبولي|الغاء قبول|لم انتظم|الغي قبولي' },
    { q: 'كم درجة النجاح؟',
      a: 'درجة النجاح 60 من 100 في الكليات (و50 في المعاهد). الدرجة النهائية لكل مقرر تُحسب من 100 درجة.',
      s: 'اللائحة الأساسية، التعريفات والمادة 15', k: 'درجه النجاح|درجه نجاح|اجتاز|انجح|ارسب|رسوب|الحد الادني للنجاح' },
    { q: 'كيف يُحسب المعدل؟',
      a: 'نقاط كل مقرر = وزن التقدير × عدد وحداته. المعدل الفصلي = مجموع نقاط مقررات الفصل ÷ مجموع وحداتها، والمعدل التراكمي = مجموع نقاط كل المقررات منذ الالتحاق ÷ مجموع وحداتها. التقديرات والرموز في التعليمات التنفيذية.',
      s: 'اللائحة الأساسية، التعريفات والمادة 18', k: 'حساب المعدل|يحسب المعدل|المعدل الفصلي|المعدل التراكمي|احسب معدلي|كيف المعدل|النقاط' },
    { q: 'كيف أنسحب من الفصل؟',
      a: 'يجوز الانسحاب من الفصل التدريبي وفق التعليمات التنفيذية. الفصل المنسحب منه يُحتسب من المدة النظامية، ويُرصد لك تقدير «منسحبة بعذر» (ع أو W).',
      s: 'اللائحة الأساسية، المادة السادسة', k: 'انسحاب|انسحب|اسحب' },
    { q: 'هل أقدر أؤجل الدراسة؟',
      a: 'نعم، يجوز تقديم طلب تأجيل بدء التدريب وفق التعليمات التنفيذية، ولا تُحتسب مدة التأجيل ضمن المدة النظامية لإنهاء متطلبات التخرج.',
      s: 'اللائحة الأساسية، المادة السادسة', k: 'تاجيل|اوجل|اؤجل|اجل دراستي|اجل الفصل|ابغي اجل|ابي اجل' },
    { q: 'متى أحذف أو أضيف مقرر؟',
      a: 'الحذف والإضافة خلال الأسبوع الأول من الفصل. وفي الكليات يُسمح بالحذف فقط حتى نهاية الأسبوع السادس، بشرط ألا ينقص عدد الوحدات المسجلة عن الحد الأدنى.',
      s: 'اللائحة الأساسية، المادة 19', k: 'حذف|احذف|اضافه مقرر|اضيف مقرر|الحذف والاضافه' },
    { q: 'كيف أطلب إعادة تقييم لمقرر؟',
      a: 'يجوز طلب إعادة تقييم مقرر أو أكثر خلال مدة أقصاها الأسبوع الثاني من الفصل الذي يليه، وفق التعليمات التنفيذية.',
      s: 'اللائحة الأساسية، المادة 17', k: 'اعاده تقييم|اعاده تصحيح|مراجعه الدرجه|راجع درجتي|اعاده رصد|اعاده الدرجه' },
    { q: 'متى أحصل على إنذار؟ ومتى أُفصل؟',
      a: 'يُوجَّه إنذار عند انخفاض معدلك التراكمي عن الحد الأدنى. ويُفصل المتدرب إذا حصل على إنذارين متتاليين أو ثلاثة إنذارات متفرقة خلال فترة التدريب.',
      s: 'اللائحة الأساسية، المادة 12', k: 'انذار|فصل من الكليه|يفصلوني|افصل|فصلوني|يفصل المتدرب' },
    { q: 'كيف تُصرف المكافأة؟ ومتى تتوقف؟',
      a: 'تُصرف مكافأة شهرية للمتدربة المنتظمة حسب ضوابط الصرف. وتتوقف عند تجاوز المدة النظامية، أو الانسحاب أو التأجيل أو طي القيد، أو إنذار التعثر مع معدل تراكمي أقل من 2، أو الإيقاف بسبب مخالفة السلوك.',
      s: 'اللائحة الأساسية، المادة 11', k: 'مكافاه|مكافات|المكافاه|راتب' },
    { q: 'متى أتخرج؟ وما التقديرات؟',
      a: 'بعد إنهاء كل متطلبات الخطة بنجاح بمعدل تراكمي لا يقل عن 2.00 من 5.00. التقديرات في الكليات: ممتاز من 4.50 إلى 5.00، جيد جداً من 3.75 إلى أقل من 4.50، جيد من 2.75 إلى أقل من 3.75، مقبول من 2.00 إلى أقل من 2.75. وتُمنح المتفوقة مرتبة الشرف الأولى أو الثانية.',
      s: 'اللائحة الأساسية، المواد 22 و23', k: 'تخرج|اتخرج|تقدير التخرج|مرتبه الشرف|مرتبه شرف|شروط التخرج' },
    { q: 'وش التدريب التعاوني؟',
      a: 'مقرر ضمن الخطة التدريبية في الكليات، يُنفَّذ بالتكامل مع جهات التوظيف بسوق العمل لتكتسبي مهارات تطبيقية في مجال تخصصك.',
      s: 'اللائحة الأساسية، التعريفات والمادة 20', k: 'تعاوني|التدريب التعاوني|تدريب ميداني' },
    { q: 'هل أقدر أحوّل تخصصي؟',
      a: 'يجوز التحويل من برنامج إلى آخر مماثل له في الشهادة الممنوحة مرة واحدة فقط. ويجوز الانتقال من منشأة تدريبية إلى مماثلة قبل بداية الفصل وفق التعليمات التنفيذية.',
      s: 'اللائحة الأساسية، المادتان 7 و8', k: 'تحويل|احول تخصصي|احول|غير تخصصي|اغير تخصص|انقل تخصص|تغيير التخصص|تغيير تخصصي' },
    { q: 'وش طي القيد وإعادته؟',
      a: 'طي القيد: بطلبك، أو عند انقطاعك عن التدريب أسبوعين متتاليين خلال الفصل دون عذر يقبله المجلس، أو عند تجاوز المدة النظامية. وإعادة القيد بطلب وموافقة مجلس المنشأة على ألا تتجاوز مدة الانقطاع فصلين تدريبيين.',
      s: 'اللائحة الأساسية، المادة 13', k: 'طي القيد|طي قيد|اعاده القيد|اعاده قيد|انقطع|انقطاع' },
    { q: 'كم مدة الفصل وساعة الاتصال؟',
      a: 'الفصل التدريبي من 15 إلى 18 أسبوعاً شاملة فترتي الإعداد والتقويم النهائي. وساعة الاتصال لا تقل عن 50 دقيقة.',
      s: 'اللائحة الأساسية، التعريفات', k: 'كم اسبوع|مده الفصل|طول الفصل|ساعه الاتصال|عدد اسابيع' },
    { q: 'وش الزي المطلوب؟',
      a: 'يُلزم المتدرب بالزي الرسمي للتدريب والظهور بمظهر لائق وحسن. وعدم التقيد بالزي الرسمي مخالفة من الدرجة الأولى، والمظهر أو الهيئة المخالفة من الدرجة الثانية.',
      s: 'قواعد تنظيم السلوك، المواد 4 و8', k: 'الزي|زي رسمي|لبس|لباس|مظهر|الهيي|قصه شعر|صبغه' },
    { q: 'هل يمنع الجوال في التدريب؟',
      a: 'استخدام أجهزة الاتصال الشخصية أو الحديث الجانبي أثناء التدريب بما يعيق سيره مخالفة من الدرجة الأولى.',
      s: 'قواعد تنظيم السلوك، المادة الثامنة', k: 'جوال|هاتف|موبايل|اجهزه الاتصال|تلفون|الجوالات' },
    { q: 'وش عقوبة الغش؟',
      a: 'محاولة الغش في الاختبار أو التقويم مخالفة من الدرجة الثانية، والغش في الاختبار أو التقويم أو المساعدة عليه مخالفة من الدرجة الثالثة. وتتدرج العقوبة بحسب الدرجة والتكرار، وقد تصل إلى الإحالة للجنة الفرعية للانضباط.',
      s: 'قواعد تنظيم السلوك، المادة الثامنة', k: 'غش|اغش|الغش' },
    { q: 'وش درجات المخالفات السلوكية؟',
      a: 'أربع درجات من الأولى (الأقل) إلى الرابعة (الأعلى). تتدرج الإجراءات بحسب تكرار المخالفة: تعهد كتابي وحسم من المكافأة، ثم إحالة لرئيسة القسم أو وحدة الخدمات الإرشادية، ثم اللجنة الفرعية للانضباط. ومخالفات الدرجة الرابعة تُحال إلى اللجنة الفرعية وتُشعَر بها الإدارة العامة لشؤون المتدربين ويُبلَّغ ولي الأمر.',
      s: 'قواعد تنظيم السلوك، المواد 2 و3 و8', k: 'درجات المخالف|درجه المخالف|مخالفه|مخالفات|عقوبه|عقوبات|لجنه الانضباط|لجنه ضبط|قواعد السلوك|تنظيم السلوك' }
  ];

  window.MASAR_GUIDE = { majors: MAJORS, regs: REGS, faq: FAQ, sources: SRC };

  /* ================================= الواجهة ================================= */
  var CSS = [
    '#masar-guide{--mg-primary:#0f766e;--mg-on:#fff;--mg-bg:#fff;--mg-surface:#f1f5f4;--mg-text:#1b2a28;--mg-muted:#62726f;--mg-border:rgba(15,40,35,.14);direction:rtl;font-family:inherit;line-height:1.6}',
    '#masar-guide *{box-sizing:border-box;font-family:inherit}',
    '#masar-guide.mg-dark{--mg-bg:#1b2321;--mg-surface:#26302d;--mg-text:#e8f0ee;--mg-muted:#9db0ab;--mg-border:rgba(255,255,255,.16)}',
    '.mg-floating{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:99990;border:0;border-radius:999px;padding:11px 16px;font-size:14px;font-weight:700;cursor:pointer;background:#0f766e;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.28);direction:rtl;font-family:inherit}',
    '#masar-guide .mg-overlay{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.5);display:none;align-items:flex-end;justify-content:center}',
    '#masar-guide .mg-overlay.mg-open{display:flex}',
    '#masar-guide .mg-sheet{width:min(620px,100%);height:min(92vh,880px);height:min(92dvh,880px);display:flex;flex-direction:column;background:var(--mg-bg);color:var(--mg-text);border-radius:18px 18px 0 0;overflow:hidden;box-shadow:0 -10px 40px rgba(0,0,0,.3)}',
    '@media (min-width:700px){#masar-guide .mg-overlay{align-items:center}#masar-guide .mg-sheet{border-radius:18px}}',
    '#masar-guide .mg-head{display:flex;align-items:center;gap:10px;padding:13px 14px;background:var(--mg-primary);color:var(--mg-on)}',
    '#masar-guide .mg-title{flex:1;margin:0;font-size:17px;font-weight:700}',
    '#masar-guide .mg-x,#masar-guide .mg-back{background:transparent;border:0;color:inherit;cursor:pointer;min-width:36px;height:36px;border-radius:18px;font-size:18px;padding:0 8px}',
    '#masar-guide .mg-x:hover,#masar-guide .mg-back:hover{background:rgba(255,255,255,.18)}',
    '#masar-guide .mg-tabs{display:flex;gap:6px;padding:10px 10px 0;background:var(--mg-bg);border-bottom:1px solid var(--mg-border)}',
    '#masar-guide .mg-tab{flex:1;border:0;background:transparent;color:var(--mg-muted);padding:9px 4px;font-size:14px;font-weight:700;cursor:pointer;border-bottom:3px solid transparent}',
    '#masar-guide .mg-tab.mg-on{color:var(--mg-primary);border-bottom-color:var(--mg-primary)}',
    '#masar-guide.mg-dark .mg-tab.mg-on{color:var(--mg-text)}',
    '#masar-guide .mg-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 12px calc(18px + env(safe-area-inset-bottom,0px))}',
    '#masar-guide .mg-card{display:block;width:100%;text-align:right;border:1px solid var(--mg-border);background:var(--mg-surface);color:inherit;border-radius:14px;padding:13px 14px;margin-bottom:10px;cursor:pointer}',
    '#masar-guide .mg-card b{display:block;font-size:16px;margin-bottom:2px}',
    '#masar-guide .mg-card span{font-size:13px;color:var(--mg-muted)}',
    '#masar-guide .mg-note{font-size:13px;color:var(--mg-muted);background:var(--mg-surface);border-radius:12px;padding:10px 12px;margin:0 0 12px}',
    '#masar-guide details{border:1px solid var(--mg-border);border-radius:12px;margin-bottom:9px;background:var(--mg-bg);overflow:hidden}',
    '#masar-guide summary{cursor:pointer;padding:12px 14px;font-weight:700;font-size:15px;list-style:none;background:var(--mg-surface)}',
    '#masar-guide summary::-webkit-details-marker{display:none}',
    '#masar-guide summary::after{content:"\\25BE";float:left;color:var(--mg-muted)}',
    '#masar-guide details[open] summary::after{content:"\\25B4"}',
    '#masar-guide .mg-in{padding:10px 14px 12px}',
    '#masar-guide .mg-item{margin:0 0 10px;font-size:14.5px}',
    '#masar-guide .mg-item b{color:var(--mg-primary)}',
    '#masar-guide.mg-dark .mg-item b{color:#7dd3c8}',
    '#masar-guide .mg-src{font-size:12.5px;color:var(--mg-muted);margin:2px 0 0}',
    '#masar-guide a{color:var(--mg-primary);font-weight:700}',
    '#masar-guide.mg-dark a{color:#7dd3c8}',
    '#masar-guide .mg-scroll{overflow-x:auto}',
    '#masar-guide table{width:100%;border-collapse:collapse;font-size:13.5px}',
    '#masar-guide th,#masar-guide td{padding:7px 8px;border-bottom:1px solid var(--mg-border);text-align:right;vertical-align:top}',
    '#masar-guide th{color:var(--mg-muted);font-weight:700;font-size:12.5px}',
    '#masar-guide td.mg-code{direction:ltr;text-align:left;white-space:nowrap;font-size:12.5px}',
    '#masar-guide .mg-go{display:inline-block;margin:0 0 12px;border:0;border-radius:999px;padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer;background:var(--mg-primary);color:var(--mg-on)}',
    '#masar-guide .mg-search{width:100%;height:42px;border:1px solid var(--mg-border);border-radius:21px;padding:0 14px;margin-bottom:12px;background:var(--mg-surface);color:var(--mg-text);font-size:16px;outline:none}',
    '#masar-guide .mg-empty{text-align:center;color:var(--mg-muted);padding:20px 0}'
  ].join('');

  var ui = {};
  var state = { tab: 'majors', major: null };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function pickBrandColor() {
    try {
      var cs = getComputedStyle(document.documentElement);
      var names = ['--primary', '--primary-color', '--main-color', '--brand', '--brand-color',
                   '--accent', '--accent-color', '--color-primary', '--theme-color', '--main', '--theme'];
      for (var i = 0; i < names.length; i++) {
        var v = cs.getPropertyValue(names[i]).trim();
        if (v) return v;
      }
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta && meta.content) return meta.content;
    } catch (e) {}
    return '#0f766e';
  }

  function isPageDark() {
    var els = [document.documentElement, document.body];
    for (var i = 0; i < els.length; i++) {
      var n = els[i];
      if (!n) continue;
      var cls = (n.className && n.className.toString ? n.className.toString() : '').toLowerCase();
      if (/(^|[\s_-])(dark|night)([\s_-]|$)/.test(cls)) return true;
      var attrs = [n.getAttribute('data-theme'), n.getAttribute('data-bs-theme'), n.getAttribute('data-mode')];
      for (var j = 0; j < attrs.length; j++) if (attrs[j] && /dark|night/i.test(attrs[j])) return true;
    }
    return false;
  }

  function srcLink(key) {
    var s = SRC[key];
    return s ? '<p class="mg-src">المصدر: <a href="' + esc(s.file) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></p>' : '';
  }

  /* ------------------------------ التخصصات ------------------------------ */
  function renderMajors() {
    var body = ui.body;
    body.innerHTML = '';
    if (state.major == null) {
      body.appendChild(el('p', 'mg-note', 'اختاري تخصصك'));
      MAJORS.forEach(function (m, i) {
        var total = m.levels.reduce(function (a, l) { return a + l.courses.length; }, 0);
        var c = el('button', 'mg-card', '<b>' + esc(m.name) + '</b><span>' + esc(m.dept) + ' · ' + m.levels.length + ' مستويات · ' + total + ' مقرر</span>');
        c.type = 'button';
        c.addEventListener('click', function () { state.major = i; renderMajors(); });
        body.appendChild(c);
      });
      return;
    }
    var m = MAJORS[state.major];
    body.appendChild(el('p', 'mg-note', '<b>' + esc(m.name) + '</b><br>' + esc(m.dept) + '<br>' + esc(m.note)));
    if (m.office) {
      var go = el('button', 'mg-go', 'دلّيني على ' + esc(m.office.label));
      go.type = 'button';
      go.addEventListener('click', function () { goToRoom(m.office); });
      body.appendChild(go);
    }
    var hasUnits = m.levels.some(function (l) { return l.courses.some(function (c) { return c[3] != null; }); });
    m.levels.forEach(function (lv, i) {
      var d = el('details');
      if (i === 0) d.open = true;
      d.appendChild(el('summary', null, esc(lv.name) + ' (' + lv.courses.length + ')'));
      var rows = lv.courses.map(function (c) {
        return '<tr><td class="mg-code">' + esc(c[0]) + '</td><td>' + esc(c[1]) + '</td><td class="mg-code">' + esc(c[2]) + '</td>' +
               (hasUnits ? '<td>' + (c[3] != null ? esc(c[3]) : '') + '</td>' : '') + '</tr>';
      }).join('');
      var inner = el('div', 'mg-in');
      inner.innerHTML = '<div class="mg-scroll"><table><thead><tr><th>الرمز</th><th>المقرر</th><th>المتطلب السابق</th>' +
                        (hasUnits ? '<th>الوحدات</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      d.appendChild(inner);
      body.appendChild(d);
    });
  }

  function goToRoom(o) {
    try {
      close();
      selectBuilding(o.b);
      selectedFloor = o.floor;
      renderFloorsMenu();
      renderBlueprint();
      setTimeout(function () {
        document.getElementById('roomDropdown').value = o.id;
        highlightAndRoute();
      }, 100);
    } catch (e) {
      try { alert('ما قدرت أفتح الخريطة تلقائياً. ابحثي عن ' + o.id + ' من قائمة القاعات.'); } catch (e2) {}
    }
  }

  /* ------------------------------ الأنظمة ------------------------------ */
  function renderRegs() {
    var body = ui.body;
    body.innerHTML = '';
    body.appendChild(el('p', 'mg-note', 'ملخّص مبسّط لأهم ما يخص المتدربة في الكلية. المرجع الرسمي هو نصوص اللوائح، وروابطها في آخر الصفحة.'));
    REGS.forEach(function (sec) {
      var d = el('details');
      d.appendChild(el('summary', null, esc(sec.title)));
      var inner = el('div', 'mg-in');
      inner.innerHTML = sec.items.map(function (it) {
        return '<p class="mg-item"><b>' + esc(it.t) + ':</b> ' + esc(it.d) + '</p>';
      }).join('') + srcLink(sec.src);
      d.appendChild(inner);
      body.appendChild(d);
    });
    body.appendChild(el('p', 'mg-note', 'الملفات الرسمية: <a href="' + esc(SRC.reg.file) + '" target="_blank" rel="noopener">' + esc(SRC.reg.name) + '</a> · <a href="' + esc(SRC.conduct.file) + '" target="_blank" rel="noopener">' + esc(SRC.conduct.name) + '</a>'));
  }

  /* ------------------------------ الأسئلة ------------------------------ */
  function renderFaq() {
    var body = ui.body;
    body.innerHTML = '';
    var input = el('input', 'mg-search');
    input.type = 'search';
    input.placeholder = 'ابحثي في الأسئلة...';
    input.setAttribute('aria-label', 'بحث في الأسئلة');
    var list = el('div');
    function draw(filter) {
      list.innerHTML = '';
      var f = String(filter || '').trim().toLowerCase();
      var n = 0;
      FAQ.forEach(function (it) {
        if (f && (it.q + ' ' + it.a).toLowerCase().indexOf(f) < 0) return;
        n++;
        var d = el('details');
        d.appendChild(el('summary', null, esc(it.q)));
        d.appendChild(el('div', 'mg-in', '<p class="mg-item">' + esc(it.a) + '</p><p class="mg-src">' + esc(it.s) + '</p>'));
        list.appendChild(d);
      });
      if (!n) list.appendChild(el('p', 'mg-empty', 'ما لقيت سؤال بهالكلمة. جربي تسألين مساعد مسار'));
    }
    input.addEventListener('input', function () { draw(input.value); });
    body.appendChild(input);
    body.appendChild(list);
    draw('');
  }

  function render() {
    var tabs = ui.tabs.querySelectorAll('.mg-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('mg-on', tabs[i].getAttribute('data-tab') === state.tab);
    ui.back.style.display = (state.tab === 'majors' && state.major != null) ? '' : 'none';
    ui.title.textContent = (state.tab === 'majors' && state.major != null) ? MAJORS[state.major].name : 'دليل المستجدين';
    if (state.tab === 'majors') renderMajors();
    else if (state.tab === 'regs') renderRegs();
    else renderFaq();
    ui.body.scrollTop = 0;
  }

  function open(tab) {
    build();
    if (tab === 'majors' || tab === 'regs' || tab === 'faq') { state.tab = tab; state.major = null; }
    ui.root.classList.toggle('mg-dark', isPageDark());
    ui.overlay.classList.add('mg-open');
    render();
  }

  function close() {
    if (ui.overlay) ui.overlay.classList.remove('mg-open');
  }

  function build() {
    if (ui.root) return;
    var style = el('style');
    style.id = 'masar-guide-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = el('div');
    root.id = 'masar-guide';
    root.style.setProperty('--mg-primary', pickBrandColor());

    var overlay = el('div', 'mg-overlay');
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) close(); });

    var sheet = el('section', 'mg-sheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'دليل المستجدين');

    var head = el('div', 'mg-head');
    var back = el('button', 'mg-back', '→');
    back.type = 'button';
    back.setAttribute('aria-label', 'رجوع');
    back.addEventListener('click', function () { state.major = null; render(); });
    var title = el('h2', 'mg-title', 'دليل المستجدين');
    var x = el('button', 'mg-x', '✕');
    x.type = 'button';
    x.setAttribute('aria-label', 'إغلاق');
    x.addEventListener('click', close);
    head.appendChild(back);
    head.appendChild(title);
    head.appendChild(x);

    var tabs = el('div', 'mg-tabs');
    [['majors', 'التخصصات'], ['regs', 'الأنظمة'], ['faq', 'أسئلة شائعة']].forEach(function (t) {
      var b = el('button', 'mg-tab', t[1]);
      b.type = 'button';
      b.setAttribute('data-tab', t[0]);
      b.addEventListener('click', function () { state.tab = t[0]; state.major = null; render(); });
      tabs.appendChild(b);
    });

    var body = el('div', 'mg-body');

    sheet.appendChild(head);
    sheet.appendChild(tabs);
    sheet.appendChild(body);
    overlay.appendChild(sheet);
    root.appendChild(overlay);
    document.body.appendChild(root);

    ui = { root: root, overlay: overlay, back: back, title: title, tabs: tabs, body: body };
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') close(); });
  }

  /* ------------------------------- الزر ------------------------------- */
  function addButton() {
    if (document.getElementById('masar-guide-btn')) return;
    var anchor = null;
    try { anchor = document.querySelector('[onclick*="openTrainers"]'); } catch (e) {}
    var btn;
    if (anchor && anchor.parentNode) {
      btn = document.createElement('button');
      btn.className = anchor.className;
      btn.type = 'button';
      btn.textContent = 'دليل المستجدين';
      anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    } else {
      btn = el('button', 'mg-floating', 'دليل المستجدين');
      btn.type = 'button';
      document.body.appendChild(btn);
    }
    btn.id = 'masar-guide-btn';
    btn.addEventListener('click', function () { open(); });
  }

  window.MasarGuide = { open: open, close: close };

  function init() { addButton(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

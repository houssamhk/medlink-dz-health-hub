# مذكرة تقنية شاملة - منصة MEDLINK DZ

## الفهرس

1. [مقدمة عامة عن المشروع](#1-مقدمة-عامة)
2. [الهندسة المعمارية والتقنيات المستخدمة](#2-الهندسة-المعمارية)
3. [هيكل الملفات والمجلدات](#3-هيكل-الملفات)
4. [شرح تفصيلي لكل ملف](#4-شرح-الملفات)
5. [قاعدة البيانات والجداول](#5-قاعدة-البيانات)
6. [نظام المصادقة والأدوار](#6-المصادقة-والأدوار)
7. [مخططات UML](#7-مخططات-UML)
8. [الوظائف الخلفية (Edge Functions)](#8-الوظائف-الخلفية)
9. [نظام الإشعارات](#9-نظام-الإشعارات)
10. [أنظمة الذكاء الاصطناعي](#10-الذكاء-الاصطناعي)

---

## 1. مقدمة عامة

**MEDLINK DZ** هي منصة صحية رقمية شاملة مصممة للسوق الجزائري، تهدف إلى تحسين الوصول للخدمات الصحية عبر الرقمنة. تتيح للمرضى حجز المواعيد مع الأطباء، إدارة السجلات الطبية، استشارة الذكاء الاصطناعي، الطب عن بعد عبر الفيديو، وإدارة الوصفات الطبية إلكترونياً.

### الفئات المستهدفة:
| الفئة | الدور | الوظائف الرئيسية |
|-------|------|-----------------|
| المرضى (patient) | المستخدم الأساسي | حجز مواعيد، رفع تحاليل، استشارات ذكية، وصفات طبية |
| الأطباء (doctor) | مقدم الخدمة | إدارة مواعيد، تقييم ملفات، كتابة وصفات، طب عن بعد |
| الصيادلة (pharmacist) | إدارة الصيدلية | إدارة المخزون، صرف الوصفات، حالة المناوبة |
| أصحاب العيادات (clinic) | إدارة العيادة | إدارة السعة، المواعيد، ساعات العمل |
| المخابر (lab_admin) | إدارة المخبر | رفع نتائج التحاليل |
| المسؤولون (admin) | إدارة المنصة | توثيق أطباء، إحصائيات، تقارير |

---

## 2. الهندسة المعمارية

### التقنيات المستخدمة:

| الطبقة | التقنية | الغرض |
|--------|---------|-------|
| الواجهة الأمامية | React 18 + TypeScript | بناء واجهة المستخدم التفاعلية |
| أداة البناء | Vite | بناء سريع وتطوير محلي |
| التنسيق | Tailwind CSS + shadcn/ui | تصميم متجاوب وعصري |
| إدارة الحالة | React Query (TanStack) | جلب البيانات وتخزينها مؤقتاً |
| التوجيه | React Router v6 | التنقل بين الصفحات |
| قاعدة البيانات | PostgreSQL (Supabase) | تخزين البيانات |
| المصادقة | Supabase Auth | تسجيل الدخول والتحقق |
| الوظائف الخلفية | Supabase Edge Functions (Deno) | معالجة خلفية (ذكاء اصطناعي، SMS) |
| الاتصال المرئي | WebRTC + Supabase Realtime | الطب عن بعد |
| الذكاء الاصطناعي | Lovable AI Gateway | فرز الأعراض، تحليل التحاليل |
| الخرائط | Mapbox GL | عرض مواقع الصيدليات |
| الرسوم البيانية | Recharts | رسوم بيانية في لوحة المدير |

### النمط المعماري:
```
┌─────────────────────────────────────────────────┐
│                  المستخدم (المتصفح)                │
├─────────────────────────────────────────────────┤
│        React App (SPA - Single Page App)        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ الصفحات  │ │ المكونات │ │ Hooks مخصصة      │ │
│  │ Pages    │ │Components│ │ useAuth, useRole  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────┤
│         Supabase Client SDK (supabase-js)        │
├─────────────────────────────────────────────────┤
│                 Supabase Backend                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Auth     │ │PostgreSQL│ │ Edge Functions    │ │
│  │ المصادقة │ │ قاعدة    │ │ ai-triage        │ │
│  │          │ │ البيانات │ │ analyze-lab      │ │
│  │          │ │          │ │ smart-assistant  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────────────────────────┐  │
│  │ Storage  │ │ Realtime (WebRTC Signaling)   │  │
│  │ ملفات   │ │ إشارات المكالمات المرئية     │  │
│  └──────────┘ └──────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 3. هيكل الملفات والمجلدات

```
medlink-dz/
├── public/                    # ملفات عامة ثابتة
│   ├── favicon.ico           # أيقونة التطبيق
│   ├── placeholder.svg       # صورة مكان فارغ
│   └── robots.txt           # توجيهات محركات البحث
│
├── src/                       # الكود المصدري الرئيسي
│   ├── main.tsx              # نقطة الدخول - يقوم بتحميل App
│   ├── App.tsx               # المكون الجذري - يحتوي التوجيه
│   ├── App.css               # أنماط CSS عامة
│   ├── index.css             # متغيرات Tailwind وألوان التصميم
│   ├── vite-env.d.ts         # تعريفات TypeScript لـ Vite
│   │
│   ├── pages/                 # صفحات التطبيق (كل صفحة = مسار)
│   │   ├── Index.tsx         # الصفحة الرئيسية العامة
│   │   ├── Auth.tsx          # صفحة تسجيل الدخول/التسجيل
│   │   ├── Dashboard.tsx     # لوحة تحكم المريض
│   │   ├── DoctorDashboard   # لوحة تحكم الطبيب
│   │   ├── PharmacyDashboard # لوحة تحكم الصيدلي
│   │   ├── ClinicDashboard   # لوحة تحكم العيادة
│   │   ├── AdminDashboard    # لوحة تحكم المسؤول
│   │   ├── LabDashboard      # لوحة تحكم المخبر
│   │   ├── Doctors.tsx       # صفحة البحث عن أطباء
│   │   ├── BookAppointment   # صفحة حجز موعد (3 خطوات)
│   │   ├── AITriage.tsx      # الفرز الطبي الذكي
│   │   ├── LabResults.tsx    # رفع وتحليل التحاليل
│   │   ├── Prescriptions     # إدارة الوصفات الطبية
│   │   ├── Telemedicine.tsx  # جلسات الطب عن بعد
│   │   ├── MedicalRecord     # السجل الطبي الشامل
│   │   ├── Pharmacies.tsx    # قائمة الصيدليات
│   │   ├── Profile.tsx       # الملف الشخصي الموحد
│   │   ├── FamilyMembers     # إدارة أفراد العائلة
│   │   ├── SendToDoctor      # إرسال تحاليل لطبيب
│   │   ├── DoctorProfile     # ملف الطبيب الشخصي
│   │   ├── PaymentPage       # صفحة الدفع
│   │   ├── Chat.tsx          # المحادثات
│   │   ├── PharmacyInventory # مخزون الصيدلية
│   │   ├── UserSettings      # إعدادات المستخدم
│   │   └── NotFound.tsx      # صفحة 404
│   │
│   ├── components/            # المكونات القابلة لإعادة الاستخدام
│   │   ├── Navbar.tsx        # شريط التنقل الرئيسي
│   │   ├── ProtectedRoute    # حماية المسارات حسب الدور
│   │   ├── EmergencySOS      # زر الطوارئ SOS
│   │   ├── SmartAssistant    # المساعد الذكي (chatbot)
│   │   ├── VideoCall.tsx     # مكون مكالمة الفيديو
│   │   ├── PrescriptionForm  # نموذج كتابة الوصفة
│   │   ├── DoctorCard.tsx    # بطاقة عرض الطبيب
│   │   ├── DoctorReviewForm  # نموذج تقييم الطبيب
│   │   ├── DoctorReviews     # عرض تقييمات الطبيب
│   │   ├── HeroSection.tsx   # قسم البطل (الصفحة الرئيسية)
│   │   ├── ServicesSection   # قسم الخدمات
│   │   ├── DoctorsSection    # قسم الأطباء المميزين
│   │   ├── PharmacySection   # قسم الصيدليات
│   │   ├── PharmacyMap.tsx   # خريطة الصيدليات
│   │   ├── AIAssistantSection# قسم المساعد الذكي
│   │   ├── CTASection.tsx    # قسم دعوة للعمل
│   │   ├── Footer.tsx        # التذييل
│   │   ├── NavLink.tsx       # رابط التنقل
│   │   ├── NotificationBell  # جرس الإشعارات
│   │   ├── PermissionPrompt  # طلب أذونات المتصفح
│   │   │
│   │   ├── ui/               # مكونات shadcn/ui الأساسية
│   │   │   ├── button.tsx    # الأزرار
│   │   │   ├── card.tsx      # البطاقات
│   │   │   ├── dialog.tsx    # النوافذ المنبثقة
│   │   │   ├── input.tsx     # حقول الإدخال
│   │   │   ├── select.tsx    # القوائم المنسدلة
│   │   │   ├── tabs.tsx      # التبويبات
│   │   │   ├── toast.tsx     # الإشعارات المؤقتة
│   │   │   └── ...           # (60+ مكون UI إضافي)
│   │   │
│   │   ├── analytics/        # مكونات التحليلات
│   │   │   └── AnalyticsCharts.tsx  # رسوم بيانية للمدير
│   │   │
│   │   ├── pharmacy/         # مكونات خاصة بالصيدلية
│   │   │   └── RecentPrescriptions  # الوصفات الأخيرة
│   │   │
│   │   └── reports/          # مكونات التقارير
│   │       └── DataExport.tsx # تصدير البيانات
│   │
│   ├── hooks/                 # خطافات React مخصصة
│   │   ├── useAuth.tsx       # إدارة المصادقة (Context)
│   │   ├── useUserRole.tsx   # تحديد دور المستخدم
│   │   ├── useWebRTC.tsx     # إدارة اتصالات WebRTC
│   │   ├── usePushNotifications # إشعارات المتصفح
│   │   ├── usePermissions    # إدارة أذونات المتصفح
│   │   ├── use-mobile.tsx    # كشف الأجهزة المحمولة
│   │   └── use-toast.ts      # نظام الإشعارات المؤقتة
│   │
│   ├── integrations/supabase/ # تكامل Supabase
│   │   ├── client.ts         # عميل Supabase (تلقائي)
│   │   └── types.ts          # أنواع قاعدة البيانات (تلقائي)
│   │
│   └── lib/
│       └── utils.ts          # دوال مساعدة (cn لدمج CSS)
│
├── supabase/                  # إعدادات وأكواد Supabase
│   ├── config.toml           # إعدادات المشروع
│   ├── migrations/           # هجرات قاعدة البيانات
│   └── functions/            # وظائف خلفية (Edge Functions)
│       ├── ai-triage/        # فرز الأعراض بالذكاء الاصطناعي
│       ├── analyze-lab-results/ # تحليل نتائج المخبر
│       ├── smart-assistant/  # المساعد الذكي
│       └── send-sms/         # إرسال SMS
│
├── index.html                # صفحة HTML الأساسية
├── tailwind.config.ts        # إعدادات Tailwind CSS
├── vite.config.ts            # إعدادات Vite
├── tsconfig.json             # إعدادات TypeScript
├── components.json           # إعدادات shadcn/ui
└── package.json              # الحزم والتبعيات
```

---

## 4. شرح تفصيلي لكل ملف

### 4.1 نقاط الدخول

#### `src/main.tsx`
نقطة الدخول الرئيسية للتطبيق. يقوم بتحميل مكون `App` داخل عنصر `root` في HTML.

#### `src/App.tsx`
المكون الجذري للتطبيق. يحتوي على:
- **QueryClientProvider**: يوفر React Query لجلب البيانات
- **AuthProvider**: يوفر سياق المصادقة لكل التطبيق
- **TooltipProvider**: يوفر التلميحات
- **BrowserRouter + Routes**: يعرّف كل مسارات التطبيق

المسارات المحمية تستخدم `ProtectedRoute` مع `allowedRoles`:
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['patient']}>
    <Dashboard />
  </ProtectedRoute>
} />
```

المسارات الرئيسية:
| المسار | الصفحة | الدور المطلوب |
|--------|--------|-------------|
| `/` | الرئيسية | عام |
| `/auth` | المصادقة | عام |
| `/dashboard` | لوحة المريض | patient |
| `/doctor-dashboard` | لوحة الطبيب | doctor |
| `/pharmacy-dashboard` | لوحة الصيدلي | pharmacist |
| `/clinic-dashboard` | لوحة العيادة | clinic |
| `/admin` | لوحة المسؤول | admin |
| `/lab-dashboard` | لوحة المخبر | lab_admin |
| `/doctors` | البحث عن أطباء | مصادق |
| `/book-appointment` | حجز موعد | مصادق |
| `/ai-triage` | الفرز الذكي | مصادق |
| `/lab-results` | رفع تحاليل | مصادق |
| `/prescriptions` | الوصفات | مصادق |
| `/telemedicine` | الطب عن بعد | مصادق |
| `/medical-record` | السجل الطبي | مصادق |
| `/pharmacies` | الصيدليات | مصادق |
| `/profile` | الملف الشخصي | مصادق |
| `/family` | أفراد العائلة | مصادق |
| `/settings` | الإعدادات | مصادق |

---

### 4.2 الخطافات المخصصة (Hooks)

#### `src/hooks/useAuth.tsx`
**الغرض**: إدارة حالة المصادقة عبر التطبيق بالكامل.

**آلية العمل**:
1. يُنشئ `AuthContext` باستخدام React Context API
2. عند تحميل التطبيق، يتحقق من وجود جلسة (session) سابقة
3. يستمع لتغييرات حالة المصادقة عبر `onAuthStateChange`
4. يوفر الدوال: `signUp`, `signIn`, `signOut`

```
المستخدم → signIn(email, password) → Supabase Auth → JWT Token → Session
                                                    ↓
                                              onAuthStateChange
                                                    ↓
                                         setUser(session.user)
```

**القيم المُرجعة**: `user`, `session`, `loading`, `signUp`, `signIn`, `signOut`

#### `src/hooks/useUserRole.tsx`
**الغرض**: تحديد دور المستخدم الحالي من جدول `user_roles`.

**آلية العمل**:
1. عند تغيير المستخدم، يستعلم عن أدواره من جدول `user_roles`
2. إذا كان لديه أكثر من دور، يتبع أولوية: admin > doctor > pharmacist > lab_admin > clinic > patient
3. إذا لم يُوجد دور، يتحقق من جدول `clinics` (مالك عيادة)
4. القيمة الافتراضية: `patient`

**القيم المُرجعة**: `role`, `loading`, `getDashboardRoute()`, `getRoleName()`

#### `src/hooks/useWebRTC.tsx`
**الغرض**: إدارة اتصالات الفيديو بتقنية WebRTC.

**آلية العمل**:
1. **Signaling (الإشارات)**: يستخدم Supabase Realtime كقناة لتبادل عروض SDP وICE Candidates
2. **Media**: يطلب إذن الكاميرا والميكروفون عبر `getUserMedia`
3. **Peer Connection**: ينشئ اتصال `RTCPeerConnection` مع خوادم STUN/TURN
4. **التدفق**:
```
المتصل (Caller):
  initializeMedia() → createPeerConnection() → createOffer() → sendSignalingMessage(offer)

المستقبل (Callee):
  joinCall() → handleSignalingMessage(offer) → createAnswer() → sendSignalingMessage(answer)

بعد الاتصال:
  ICE Candidates تُتبادل تلقائياً حتى ينجح الاتصال المباشر (P2P)
```

**القيم المُرجعة**: `localStream`, `remoteStream`, `connectionState`, `startCall`, `joinCall`, `endCall`, `toggleVideo`, `toggleAudio`

#### `src/hooks/usePushNotifications.tsx`
**الغرض**: إدارة إشعارات المتصفح (Push Notifications).

**آلية العمل**:
1. يطلب إذن الإشعارات من المستخدم
2. يجلب الإشعارات من جدول `notifications`
3. يشترك في التحديثات الفورية عبر Supabase Realtime
4. عند وصول إشعار جديد، يعرض إشعاراً في المتصفح + Toast

---

### 4.3 المكونات الأساسية

#### `src/components/ProtectedRoute.tsx`
**الغرض**: حماية المسارات والتأكد من الأدوار المناسبة.

**آلية العمل**:
1. يتحقق من وجود مستخدم مصادق عليه
2. إذا لم يكن مصادقاً → يحول إلى `/auth`
3. إذا كان الدور غير مسموح → يحول للوحة التحكم المناسبة
4. أثناء التحميل، يعرض spinner

#### `src/components/Navbar.tsx`
**الغرض**: شريط التنقل الرئيسي المتجاوب.

**الميزات**:
- يتكيف مع دور المستخدم (يعرض روابط مختلفة لكل دور)
- قائمة محمول (hamburger menu)
- جرس الإشعارات (`NotificationBell`)
- زر تسجيل الدخول/الخروج

#### `src/components/EmergencySOS.tsx`
**الغرض**: زر الطوارئ العائم (SOS).

**آلية العمل**:
1. زر أحمر عائم في أسفل الشاشة (دائماً ظاهر)
2. عند الضغط، يفتح نافذة لتحديد:
   - الموقع الجغرافي (عبر Geolocation API)
   - نوع الطوارئ (قلبية، حادث، سكتة دماغية، أخرى)
   - وصف الحالة
3. يحفظ الطلب في جدول `emergency_requests`
4. ينشئ إشعاراً للمستخدم
5. يعرض أرقام الطوارئ الجزائرية (14 و 1021)

#### `src/components/SmartAssistant.tsx`
**الغرض**: المساعد الذكي (Chatbot) العائم.

**آلية العمل**:
1. واجهة محادثة عائمة في أسفل الشاشة
2. يرسل رسائل المستخدم إلى Edge Function `smart-assistant`
3. يعالج الردود: نص عادي، اقتراحات أطباء، صيدليات، حجز مواعيد
4. يعرض أزرار إجراءات سريعة

#### `src/components/VideoCall.tsx`
**الغرض**: واجهة مكالمة الفيديو.

**الميزات**:
- عرض الفيديو المحلي والبعيد
- أزرار تبديل الكاميرا/الميكروفون
- وضع ملء الشاشة
- عداد مدة المكالمة
- ملاحظات الطبيب (للأطباء فقط)
- شارة حالة الاتصال (متصل، قيد الاتصال، منقطع)

#### `src/components/NotificationBell.tsx`
**الغرض**: جرس الإشعارات في شريط التنقل.

**الميزات**:
- يعرض عدد الإشعارات غير المقروءة
- قائمة منسدلة بالإشعارات
- إمكانية تعليمها كمقروءة
- يدعم الاشتراك الفوري (Realtime)
- توجيه عند النقر على الإشعار حسب نوعه

---

### 4.4 الصفحات الرئيسية

#### `src/pages/Index.tsx` - الصفحة الرئيسية
الصفحة العامة التي يراها الزائر غير المسجل. تتكون من:
- `HeroSection`: قسم البطل مع عنوان جذاب وأزرار CTA
- `ServicesSection`: عرض الخدمات الرئيسية (حجز، تحاليل، صيدليات، ذكاء اصطناعي)
- `DoctorsSection`: عرض أطباء مميزين
- `PharmacySection`: معلومات عن الصيدليات
- `AIAssistantSection`: تقديم المساعد الذكي
- `CTASection`: دعوة للتسجيل

#### `src/pages/Auth.tsx` - صفحة المصادقة
**الميزات**:
- وضعان: تسجيل الدخول / إنشاء حساب
- اختيار نوع الحساب عند التسجيل (مريض، طبيب، عيادة، صيدلي)
- التحقق من المدخلات باستخدام Zod
- بعد التسجيل الناجح:
  1. إنشاء المستخدم في Supabase Auth
  2. تعيين الدور في `user_roles`
  3. إنشاء سجل في الجدول المناسب (doctors, clinics, pharmacies)
- بعد تسجيل الدخول: توجيه تلقائي للوحة التحكم المناسبة

#### `src/pages/Dashboard.tsx` - لوحة تحكم المريض
**المحتويات**:
- ترحيب بالمستخدم
- إحصائيات سريعة (مواعيد قادمة، سجلات طبية، ساعات محفوظة)
- إجراءات سريعة (حجز موعد، ملف طبي، إرسال تحاليل، رفع تحاليل)
- اختصارات إضافية (وصفات، أفراد عائلة، طب عن بعد)
- قائمة المواعيد القادمة مع إمكانية الإلغاء

**تدفق البيانات**:
```
useAuth() → user.id → fetch appointments + records count → عرض البيانات
```

#### `src/pages/DoctorDashboard.tsx` - لوحة تحكم الطبيب
**أكبر ملف في المشروع (~1095 سطر)**

**التبويبات**:
1. **نظرة عامة**: إحصائيات (مرضى اليوم، ملفات معلقة، مراجعات، إشعارات)
2. **الملفات الطبية**: مراجعة ملفات المرضى المرسلة، تقييم الحالة (مستوى الإلحاح، التشخيص، التوصيات)
3. **مواعيد اليوم**: عرض مواعيد اليوم مع إمكانية بدء جلسة طب عن بعد
4. **كتابة وصفة**: نظام متكامل لكتابة الوصفات مع:
   - قاعدة بيانات 15 دواء شائع
   - اقتراحات تلقائية عند الكتابة
   - قوائم جرعات، تكرار، مدة
   - معاينة مباشرة للوصفة
5. **المراسلات**: نظام الرسائل مع المرضى
6. **سجل المراجعات**: الملفات المراجعة سابقاً

**الميزات التقنية**:
- اشتراك Realtime لاستلام ملفات جديدة فوراً
- إشعار المريض تلقائياً عند تقييم الملف (عبر RPC `create_notification`)
- التحقق من وقت بدء الجلسة (15 دقيقة قبل الموعد)

#### `src/pages/PharmacyDashboard.tsx` - لوحة تحكم الصيدلي
**المحتويات**:
- معلومات الصيدلية (الاسم، العنوان، الهاتف)
- تبديل حالة المناوبة (Switch)
- إحصائيات (زيارات اليوم، وصفات مستلمة، مخزون منخفض، إجمالي الأصناف)
- حالة المخزون مع تنبيهات
- الوصفات الأخيرة (مكون `RecentPrescriptions`)
- ساعات العمل
- حالة الموقع الجغرافي

#### `src/pages/ClinicDashboard.tsx` - لوحة تحكم العيادة
**المحتويات**:
- معلومات العيادة مع شارة التوثيق
- تبديل حالة التوفر
- إحصائيات (مواعيد اليوم، السعة، المنتظرون)
- المواعيد الحضورية لليوم
- إدارة السعة والغرف
- ساعات العمل
- الموقع الجغرافي
- سعر الاستشارة

#### `src/pages/AdminDashboard.tsx` - لوحة تحكم المسؤول
**التبويبات**:
1. **التحليلات**: رسوم بيانية (مواعيد حسب الحالة، توزيع التخصصات، بيانات شهرية، توزيع حسب الولايات)
2. **إدارة الأطباء**: قائمة الأطباء مع بحث + توثيق/إلغاء التوثيق
3. **التقارير**: تصدير بيانات CSV (أطباء موثقين، مواعيد شهرية، صيدليات مناوبة)
4. **الإعدادات**: حالة النظام وإحصائيات

#### `src/pages/Doctors.tsx` - البحث عن أطباء
**الميزات**:
- بحث بالاسم أو التخصص
- فلترة حسب الولاية والتخصص
- عرض بطاقات الأطباء (الاسم، التخصص، التقييم، السعر، خبرة، طب عن بعد)
- زر حجز موعد مباشر
- جلب أسماء الأطباء من جدول `profiles`

#### `src/pages/BookAppointment.tsx` - حجز موعد
**نظام خطوات (3 خطوات)**:
1. **اختيار الطبيب**: فلترة حسب التخصص والولاية، عرض المواعيد المتاحة
2. **اختيار التاريخ والوقت**: تقويم + فترات زمنية (8:00-17:30)
3. **التأكيد**: ملخص الحجز + سبب الزيارة + إمكانية طب عن بعد

**آلية حساب المواعيد المتاحة**:
```
جلب جدول doctor_capacity → max_appointments - current_appointments = available_slots
فلترة الأطباء بـ available_slots > 0
```

#### `src/pages/AITriage.tsx` - الفرز الطبي الذكي
**آلية العمل**:
1. المريض يختار أعراضه من قائمة 20 عرض شائع أو يكتب أعراضاً مخصصة
2. يُدخل معلومات إضافية (العمر، الجنس، التاريخ الطبي)
3. يُرسل البيانات إلى Edge Function `ai-triage`
4. يعرض النتيجة: مستوى الإلحاح + التخصص المقترح + التقييم + نصائح + علامات تحذيرية
5. يحفظ الجلسة في `ai_triage_sessions`

**مستويات الإلحاح**:
| المستوى | اللون | الوصف |
|---------|-------|-------|
| normal | أخضر | حالة عادية |
| attention | أصفر | يحتاج متابعة |
| urgent | برتقالي | عاجل |
| critical | أحمر | حالة طوارئ! |

#### `src/pages/LabResults.tsx` - رفع وتحليل التحاليل
**الميزات**:
- رفع صورة التحاليل (JPG, PNG, PDF)
- إدخال النتائج يدوياً (نصياً)
- إدخال كود التحليل (barcode)
- تحليل أولي بالذكاء الاصطناعي عبر Edge Function `analyze-lab-results`
- حفظ في `medical_records` بحالة `pending` للمراجعة من طبيب

#### `src/pages/Prescriptions.tsx` - الوصفات الطبية
**الميزات**:
- عرض جميع وصفات المريض
- عرض تفاصيل الأدوية (الاسم، الجرعة، التكرار، المدة)
- إرسال الوصفة لصيدلية مناوبة
- حالات الوصفة: بانتظار الإرسال → في الصيدلية → تم الصرف

#### `src/pages/Telemedicine.tsx` - الطب عن بعد
**آلية العمل**:
1. يعرض الجلسات المجدولة والنشطة والمكتملة
2. يتحقق من الأذونات (كاميرا + ميكروفون)
3. يبدأ/ينضم للمكالمة عبر مكون `VideoCall`
4. يدعم الانضمام التلقائي عبر رابط URL (`?session=...`)
5. عند الإنهاء، يحفظ ملاحظات الطبيب

#### `src/pages/Profile.tsx` - الملف الشخصي الموحد
صفحة واحدة تتكيف مع دور المستخدم:
- **المريض**: بيانات شخصية + فصيلة الدم + حساسيات + أمراض مزمنة
- **الطبيب**: رقم الرخصة + التخصص + ساعات العمل + سعر الاستشارة + السيرة
- **الصيدلي**: اسم الصيدلية + العنوان + ساعات العمل + الموقع الجغرافي
- **العيادة**: اسم العيادة + التخصص + السعة + ساعات العمل + الموقع

---

## 5. قاعدة البيانات

### 5.1 مخطط الجداول الرئيسية

| الجدول | الغرض | العلاقات |
|--------|-------|---------|
| `profiles` | بيانات المستخدمين الشخصية | id = auth.users.id |
| `user_roles` | أدوار المستخدمين | user_id → profiles |
| `doctors` | بيانات الأطباء المهنية | user_id → profiles, specialty_id → specialties |
| `specialties` | التخصصات الطبية | مرجعي |
| `appointments` | المواعيد | patient_id → profiles, doctor_id → doctors |
| `medical_records` | السجلات الطبية | patient_id → profiles, doctor_id → doctors |
| `prescriptions` | الوصفات الطبية | doctor_id → doctors, patient_id → profiles, pharmacy_id → pharmacies |
| `pharmacies` | بيانات الصيدليات | user_id → profiles |
| `pharmacy_inventory` | مخزون الصيدلية | pharmacy_id → pharmacies |
| `clinics` | بيانات العيادات | user_id → profiles, specialty_id → specialties |
| `clinic_capacity` | سعة العيادات | clinic_id → clinics |
| `doctor_capacity` | سعة الأطباء اليومية | doctor_id → doctors |
| `doctor_evaluations` | تقييمات الأطباء للملفات | doctor_id → doctors, medical_record_id → medical_records |
| `reviews` | تقييمات المرضى للأطباء | patient_id → profiles, doctor_id → doctors |
| `telemedicine_sessions` | جلسات الطب عن بعد | doctor_id → doctors, patient_id → profiles |
| `messages` | الرسائل | sender_id → profiles, receiver_id → profiles |
| `notifications` | الإشعارات | user_id → profiles |
| `emergency_requests` | طلبات الطوارئ | user_id → profiles |
| `family_members` | أفراد العائلة | primary_user_id → profiles |
| `patient_medical_data` | بيانات المريض الطبية | patient_id → profiles |
| `ai_triage_sessions` | جلسات الفرز الذكي | user_id → profiles |
| `ai_learning_data` | بيانات تعلم الذكاء | evaluation_id → doctor_evaluations |
| `system_settings` | إعدادات النظام | مستقل |

### 5.2 سياسات أمن الصفوف (RLS)

كل جدول محمي بسياسات RLS تضمن:
- **المرضى**: يرون بياناتهم فقط
- **الأطباء**: يرون ملفات المرضى ذوي المواعيد النشطة فقط
- **الصيادلة**: يديرون مخزونهم ويرون الوصفات المرسلة لهم
- **المسؤولون**: صلاحيات كاملة على إدارة النظام

### 5.3 الدوال المخزنة (Database Functions)

| الدالة | الغرض |
|--------|-------|
| `handle_new_user()` | تُنشئ ملفاً شخصياً ودور "patient" لكل مستخدم جديد |
| `update_doctor_rating()` | تحدث تقييم الطبيب تلقائياً عند إضافة مراجعة |
| `update_doctor_capacity()` | تحدث سعة الطبيب عند إنشاء موعد |
| `create_appointment_reminders()` | تنشئ تذكيرات تلقائية (24 ساعة + ساعة قبل الموعد) |
| `create_notification()` | تنشئ إشعاراً لمستخدم محدد (RPC) |
| `notify_patient_on_evaluation()` | تُشعر المريض عند تقييم ملفه الطبي |
| `notify_doctor_on_new_record()` | تُشعر الطبيب عند استلام ملف جديد |
| `get_patient_basic_info()` | تُرجع بيانات المريض الأساسية (محمية) |
| `get_patient_medical_info()` | تُرجع بيانات المريض الطبية (محمية) |
| `get_doctor_license_number()` | تُرجع رقم رخصة الطبيب (للمسؤولين فقط) |
| `get_my_doctor_profile()` | تُرجع ملف الطبيب الحالي |
| `save_learning_data()` | تحفظ بيانات للتعلم الآلي بعد كل تقييم |

### 5.4 العروض (Views)

| العرض | الغرض |
|-------|-------|
| `doctors_public_safe` | بيانات الأطباء العامة (بدون معلومات حساسة) |
| `doctors_public` | بيانات الأطباء الأساسية |
| `doctors_full` | بيانات الأطباء الكاملة |
| `pharmacies_public` | الصيدليات العامة |
| `pharmacies_full` | بيانات الصيدليات الكاملة |
| `pharmacy_inventory_public` | المخزون العام |
| `platform_stats` | إحصائيات المنصة |

---

## 6. نظام المصادقة والأدوار

### 6.1 تدفق التسجيل

```
المستخدم يملأ النموذج
    ↓
Supabase Auth → إنشاء حساب + إرسال رسالة تأكيد
    ↓
Trigger: handle_new_user() → إنشاء profile + دور patient
    ↓
(إذا اختار دور طبيب/صيدلي/عيادة):
    الكود يعدّل user_roles + ينشئ سجلاً في الجدول المناسب
    ↓
توجيه للوحة التحكم المناسبة
```

### 6.2 تدفق تسجيل الدخول

```
المستخدم يُدخل email + password
    ↓
supabase.auth.signInWithPassword()
    ↓
JWT Token → Session مخزنة في localStorage
    ↓
onAuthStateChange → setUser(user)
    ↓
useUserRole() → fetch role from user_roles
    ↓
getDashboardRoute() → redirect
```

### 6.3 حماية المسارات

```
ProtectedRoute({ allowedRoles: ['doctor'] })
    ↓
هل المستخدم مصادق؟
    لا → redirect /auth
    نعم ↓
هل الدور مسموح؟
    لا → redirect getDashboardRoute()
    نعم → عرض المحتوى
```

---

## 7. مخططات UML

### 7.1 مخطط علاقات الكيانات (ERD)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │     │  user_roles  │     │  specialties │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │←───→│ user_id (FK) │     │ id (PK)      │
│ email        │     │ role         │     │ name_ar      │
│ full_name    │     └──────────────┘     │ name_fr      │
│ phone        │                          │ icon         │
│ wilaya       │                          └──────┬───────┘
│ gender       │                                 │
│ date_of_birth│                                 │
│ avatar_url   │                                 │
└──────┬───────┘                                 │
       │                                         │
       │  ┌──────────────────┐                   │
       ├──┤    doctors       │←──────────────────┘
       │  │──────────────────│
       │  │ id (PK)          │
       │  │ user_id (FK)     │←─────────┐
       │  │ specialty_id (FK)│          │
       │  │ license_number   │          │
       │  │ clinic_name      │          │
       │  │ wilaya           │          │
       │  │ consultation_price│         │
       │  │ rating           │          │
       │  │ is_verified      │          │
       │  │ is_available     │          │
       │  │ telemedicine_en  │          │
       │  └──────┬───────────┘          │
       │         │                      │
       │         │  ┌───────────────┐   │
       │         ├──┤ appointments  │   │
       │         │  │───────────────│   │
       │         │  │ id (PK)       │   │
       │         │  │ patient_id(FK)│───┤ (→ profiles)
       │         │  │ doctor_id(FK) │   │
       │         │  │ appointment_date  │
       │         │  │ appointment_time  │
       │         │  │ status        │   │
       │         │  │ is_telemedicine│  │
       │         │  │ reason        │   │
       │         │  └───────┬───────┘   │
       │         │          │           │
       │         │  ┌───────┴────────┐  │
       │         │  │ telemedicine   │  │
       │         │  │ _sessions      │  │
       │         │  │────────────────│  │
       │         │  │ id (PK)        │  │
       │         │  │ appointment_id │  │
       │         │  │ doctor_id (FK) │  │
       │         │  │ patient_id(FK) │──┘
       │         │  │ status         │
       │         │  │ scheduled_at   │
       │         │  │ notes          │
       │         │  └────────────────┘
       │         │
       │         │  ┌────────────────┐
       │         ├──┤ prescriptions  │
       │         │  │────────────────│
       │         │  │ id (PK)        │
       │         │  │ doctor_id (FK) │
       │         │  │ patient_id(FK) │
       │         │  │ pharmacy_id(FK)│──→ pharmacies
       │         │  │ medications    │  (JSONB)
       │         │  │ notes          │
       │         │  │ status         │
       │         │  └────────────────┘
       │         │
       │         │  ┌────────────────┐
       │         └──┤medical_records │
       │            │────────────────│
       │            │ id (PK)        │
       │            │ patient_id(FK) │
       │            │ doctor_id (FK) │
       │            │ record_type    │
       │            │ title          │
       │            │ file_url       │
       │            │ ai_analysis    │
       │            │ urgency_level  │
       │            │ review_status  │
       │            │ assigned_doctor│
       │            └────────┬───────┘
       │                     │
       │            ┌────────┴───────┐
       │            │doctor_         │
       │            │evaluations     │
       │            │────────────────│
       │            │ id (PK)        │
       │            │ doctor_id (FK) │
       │            │ medical_record │
       │            │ urgency_level  │
       │            │ diagnosis      │
       │            │ recommendations│
       │            └────────────────┘
       │
       │  ┌──────────────────┐
       ├──┤   pharmacies     │
       │  │──────────────────│
       │  │ id (PK)          │
       │  │ user_id (FK)     │
       │  │ name             │
       │  │ address          │
       │  │ wilaya           │
       │  │ is_on_duty       │
       │  │ latitude/longitude│
       │  │ opening_hours    │
       │  └──────┬───────────┘
       │         │
       │  ┌──────┴───────────┐
       │  │pharmacy_inventory│
       │  │──────────────────│
       │  │ id (PK)          │
       │  │ pharmacy_id (FK) │
       │  │ medication_name  │
       │  │ quantity         │
       │  │ min_quantity     │
       │  │ price            │
       │  │ expiry_date      │
       │  └──────────────────┘
       │
       │  ┌──────────────────┐
       ├──┤    clinics       │
       │  │──────────────────│
       │  │ id (PK)          │
       │  │ user_id (FK)     │
       │  │ specialty_id (FK)│
       │  │ name             │
       │  │ wilaya           │
       │  │ is_available     │
       │  │ is_verified      │
       │  │ consultation_price│
       │  └──────────────────┘
       │
       │  ┌──────────────────┐
       ├──┤  notifications   │
       │  │──────────────────│
       │  │ id (PK)          │
       │  │ user_id (FK)     │
       │  │ title            │
       │  │ message          │
       │  │ type             │
       │  │ is_read          │
       │  │ related_type     │
       │  │ related_id       │
       │  └──────────────────┘
       │
       │  ┌──────────────────┐
       └──┤ family_members   │
          │──────────────────│
          │ id (PK)          │
          │ primary_user_id  │
          │ member_name      │
          │ relationship     │
          │ date_of_birth    │
          │ blood_type       │
          │ allergies        │
          └──────────────────┘
```

### 7.2 مخطط الأصناف (Class Diagram)

```
┌─────────────────────────┐
│       AuthContext        │
├─────────────────────────┤
│ - user: User | null     │
│ - session: Session|null │
│ - loading: boolean      │
├─────────────────────────┤
│ + signUp()              │
│ + signIn()              │
│ + signOut()             │
└────────────┬────────────┘
             │ provides
             ▼
┌─────────────────────────┐     ┌──────────────────────┐
│     useUserRole()       │     │   ProtectedRoute     │
├─────────────────────────┤     ├──────────────────────┤
│ - role: UserRole        │────→│ - allowedRoles[]     │
│ - loading: boolean      │     │ + checkAccess()      │
├─────────────────────────┤     │ + redirect()         │
│ + getDashboardRoute()   │     └──────────────────────┘
│ + getRoleName()         │
└─────────────────────────┘

┌─────────────────────────┐     ┌──────────────────────┐
│      useWebRTC()        │     │     VideoCall         │
├─────────────────────────┤     ├──────────────────────┤
│ - localStream           │────→│ - containerRef       │
│ - remoteStream          │     │ - localVideoRef      │
│ - connectionState       │     │ - remoteVideoRef     │
├─────────────────────────┤     ├──────────────────────┤
│ + initializeMedia()     │     │ + toggleVideo()      │
│ + startCall()           │     │ + toggleAudio()      │
│ + joinCall()            │     │ + toggleFullscreen() │
│ + endCall()             │     │ + formatDuration()   │
│ + toggleVideo()         │     └──────────────────────┘
│ + toggleAudio()         │
└─────────────────────────┘

┌─────────────────────────┐
│   usePushNotifications  │
├─────────────────────────┤
│ - notifications[]       │
│ - unreadCount           │
│ - permission            │
├─────────────────────────┤
│ + requestPermission()   │
│ + fetchNotifications()  │
│ + markAsRead()          │
│ + markAllAsRead()       │
│ + showBrowserNotif()    │
└─────────────────────────┘
```

### 7.3 مخطط التتابع: حجز موعد (Sequence Diagram)

```
  المريض          الواجهة         Supabase DB        Edge Function
    │                │                │                    │
    │  اختيار تخصص   │                │                    │
    │───────────────→│                │                    │
    │                │ SELECT doctors │                    │
    │                │───────────────→│                    │
    │                │  doctors[]     │                    │
    │                │←───────────────│                    │
    │  عرض الأطباء   │                │                    │
    │←───────────────│                │                    │
    │                │                │                    │
    │  اختيار طبيب   │                │                    │
    │───────────────→│                │                    │
    │  اختيار تاريخ  │                │                    │
    │───────────────→│                │                    │
    │  اختيار وقت    │                │                    │
    │───────────────→│                │                    │
    │                │                │                    │
    │  تأكيد الحجز   │                │                    │
    │───────────────→│                │                    │
    │                │ INSERT         │                    │
    │                │ appointment    │                    │
    │                │───────────────→│                    │
    │                │                │ Trigger:           │
    │                │                │ update_capacity()  │
    │                │                │ create_reminders() │
    │                │  success       │                    │
    │                │←───────────────│                    │
    │  تأكيد الحجز   │                │                    │
    │←───────────────│                │                    │
```

### 7.4 مخطط التتابع: الفرز الذكي (AI Triage)

```
  المريض          الواجهة         Edge Function      AI Gateway
    │                │                │                  │
    │  اختيار أعراض  │                │                  │
    │───────────────→│                │                  │
    │  إدخال معلومات │                │                  │
    │───────────────→│                │                  │
    │                │                │                  │
    │  تقييم الأعراض │                │                  │
    │───────────────→│                │                  │
    │                │ invoke         │                  │
    │                │ ai-triage      │                  │
    │                │───────────────→│                  │
    │                │                │  POST /v1/chat   │
    │                │                │  completions     │
    │                │                │─────────────────→│
    │                │                │                  │
    │                │                │  AI Response     │
    │                │                │  (JSON)          │
    │                │                │←─────────────────│
    │                │                │                  │
    │                │  triage result │                  │
    │                │←───────────────│                  │
    │                │                │                  │
    │                │ INSERT         │                  │
    │                │ ai_triage_     │                  │
    │                │ sessions       │                  │
    │                │───────────────→│ (Supabase DB)    │
    │                │                │                  │
    │  عرض النتيجة   │                │                  │
    │←───────────────│                │                  │
```

### 7.5 مخطط التتابع: الطب عن بعد (WebRTC)

```
  الطبيب         Supabase Realtime      المريض
    │                  │                   │
    │ startCall()      │                   │
    │  createOffer()   │                   │
    │─────────────────→│                   │
    │                  │ broadcast offer   │
    │                  │──────────────────→│
    │                  │                   │ handleOffer()
    │                  │                   │ createAnswer()
    │                  │  broadcast answer │
    │                  │←──────────────────│
    │ handleAnswer()   │                   │
    │←─────────────────│                   │
    │                  │                   │
    │  ICE Candidates  │                   │
    │←────────────────→│←─────────────────→│
    │                  │                   │
    │     P2P Video/Audio Connection       │
    │←════════════════════════════════════→│
    │                  │                   │
    │ endCall()        │                   │
    │─────────────────→│                   │
    │                  │  session ended    │
    │                  │──────────────────→│
```

### 7.6 مخطط التتابع: دورة حياة الوصفة الطبية

```
  الطبيب          Supabase DB        المريض          الصيدلي
    │                │                  │                │
    │ كتابة وصفة     │                  │                │
    │ INSERT          │                  │                │
    │ prescription    │                  │                │
    │───────────────→│                  │                │
    │                │  create_         │                │
    │                │  notification    │                │
    │                │─────────────────→│                │
    │                │                  │                │
    │                │                  │ إرسال          │
    │                │                  │ للصيدلية       │
    │                │  UPDATE          │                │
    │                │  pharmacy_id     │                │
    │                │←─────────────────│                │
    │                │                  │                │
    │                │  status:         │                │
    │                │  sent_to_pharmacy│                │
    │                │─────────────────────────────────→│
    │                │                  │                │
    │                │                  │    صرف الوصفة  │
    │                │  UPDATE          │                │
    │                │  status:dispensed│                │
    │                │←─────────────────────────────────│
    │                │                  │                │
```

### 7.7 مخطط المكونات المعمارية (Component Diagram)

```
┌──────────────────────────────────────────────────────────┐
│                    React Application                      │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ Auth Pages │  │ Dashboard  │  │ Feature Pages      │  │
│  │            │  │ Pages      │  │                    │  │
│  │ • Auth.tsx │  │ • Patient  │  │ • Doctors.tsx      │  │
│  │            │  │ • Doctor   │  │ • BookAppointment  │  │
│  │            │  │ • Pharmacy │  │ • AITriage.tsx     │  │
│  │            │  │ • Clinic   │  │ • LabResults.tsx   │  │
│  │            │  │ • Admin    │  │ • Prescriptions    │  │
│  │            │  │ • Lab      │  │ • Telemedicine     │  │
│  │            │  │            │  │ • MedicalRecord    │  │
│  │            │  │            │  │ • Pharmacies       │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Shared Components                      │  │
│  │ • Navbar • EmergencySOS • SmartAssistant            │  │
│  │ • VideoCall • NotificationBell • ProtectedRoute     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Custom Hooks                           │  │
│  │ • useAuth • useUserRole • useWebRTC                 │  │
│  │ • usePushNotifications • usePermissions             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              UI Components (shadcn/ui)              │  │
│  │ Button, Card, Dialog, Input, Select, Tabs,         │  │
│  │ Badge, Toast, Calendar, Table, Form, etc.          │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                    Supabase Backend                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │   Auth   │  │PostgreSQL│  │ Edge     │  │Realtime │  │
│  │          │  │          │  │Functions │  │         │  │
│  │ Sign Up  │  │ 20+ جدول │  │          │  │ WebRTC  │  │
│  │ Sign In  │  │ RLS      │  │ AI Triage│  │Signaling│  │
│  │ JWT      │  │ Views    │  │ Lab      │  │         │  │
│  │ Sessions │  │ Functions│  │ Analysis │  │ Live    │  │
│  │          │  │ Triggers │  │ Smart    │  │ Notifs  │  │
│  │          │  │          │  │ Assistant│  │         │  │
│  └──────────┘  └──────────┘  │ SMS      │  └─────────┘  │
│                              └──────────┘               │
│  ┌──────────┐                                           │
│  │ Storage  │  medical-files bucket                     │
│  └──────────┘                                           │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                External Services                         │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Lovable AI   │  │ Mapbox   │  │ STUN/TURN        │   │
│  │ Gateway      │  │ GL       │  │ Servers           │   │
│  │              │  │          │  │ (Google, Twilio)  │   │
│  │ Gemini/GPT   │  │ خرائط   │  │ WebRTC NAT       │   │
│  └──────────────┘  └──────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 7.8 مخطط حالات الاستخدام (Use Case Diagram)

```
                    ┌─────────────────────────────────────┐
                    │           MEDLINK DZ                 │
                    │                                     │
    ┌───────┐       │   ┌──────────────────────┐          │
    │ مريض  │──────────→│ تسجيل الدخول/التسجيل │          │
    │Patient│       │   └──────────────────────┘          │
    │       │──────────→│ البحث عن طبيب         │          │
    │       │──────────→│ حجز موعد              │          │
    │       │──────────→│ الفرز الذكي (AI)      │          │
    │       │──────────→│ رفع تحاليل            │          │
    │       │──────────→│ عرض الوصفات           │          │
    │       │──────────→│ إرسال وصفة لصيدلية    │          │
    │       │──────────→│ جلسة طب عن بعد        │          │
    │       │──────────→│ طلب طوارئ SOS         │          │
    │       │──────────→│ إدارة أفراد العائلة    │          │
    │       │──────────→│ المساعد الذكي          │          │
    └───────┘       │   │ إدارة الملف الشخصي    │          │
                    │   └──────────────────────┘          │
    ┌───────┐       │                                     │
    │ طبيب  │──────────→│ مراجعة ملفات المرضى    │          │
    │Doctor │──────────→│ تقييم التحاليل         │          │
    │       │──────────→│ كتابة وصفة طبية       │          │
    │       │──────────→│ بدء جلسة فيديو        │          │
    │       │──────────→│ إدارة المواعيد         │          │
    │       │──────────→│ المراسلات مع المرضى    │          │
    └───────┘       │                                     │
                    │                                     │
    ┌───────┐       │                                     │
    │ صيدلي │──────────→│ إدارة المخزون          │          │
    │Pharma │──────────→│ استقبال الوصفات        │          │
    │       │──────────→│ صرف الأدوية           │          │
    │       │──────────→│ تبديل حالة المناوبة    │          │
    └───────┘       │                                     │
                    │                                     │
    ┌───────┐       │                                     │
    │ عيادة │──────────→│ إدارة السعة            │          │
    │Clinic │──────────→│ تبديل حالة التوفر      │          │
    │       │──────────→│ عرض مواعيد اليوم       │          │
    └───────┘       │                                     │
                    │                                     │
    ┌───────┐       │                                     │
    │ مسؤول │──────────→│ توثيق الأطباء          │          │
    │ Admin │──────────→│ عرض التحليلات          │          │
    │       │──────────→│ تصدير التقارير         │          │
    │       │──────────→│ إدارة إعدادات النظام   │          │
    └───────┘       │                                     │
                    └─────────────────────────────────────┘
```

---

## 8. الوظائف الخلفية (Edge Functions)

### 8.1 `ai-triage/index.ts` - فرز الأعراض بالذكاء الاصطناعي

**المدخلات**: `symptoms[]`, `age`, `gender`, `medicalHistory`

**آلية العمل**:
1. يستقبل بيانات المريض
2. يبني System Prompt طبي مفصل باللغة العربية
3. يرسل للذكاء الاصطناعي عبر Lovable AI Gateway
4. يحلل الرد ويستخرج JSON

**المخرجات**:
```json
{
  "urgency_level": "normal|attention|urgent|critical",
  "recommended_specialty": "طب القلب",
  "specialty_fr": "Cardiologie",
  "assessment": "تقييم مفصل...",
  "advice": ["نصيحة 1", "نصيحة 2"],
  "warning_signs": ["علامة 1"]
}
```

### 8.2 `analyze-lab-results/index.ts` - تحليل التحاليل المخبرية

**المدخلات**: `labResults` (نص) أو `imageBase64` (صورة)

**آلية العمل**:
1. يدعم النص والصور
2. يرسل للذكاء الاصطناعي مع تعليمات طبية مفصلة
3. يستخرج القيم غير الطبيعية ويصنفها

**المخرجات**:
```json
{
  "urgency_level": "normal|attention|urgent|critical",
  "analysis": "تحليل مفصل...",
  "recommendations": ["توصية 1", "توصية 2"],
  "abnormal_values": [
    {"name": "Glucose", "value": "180", "normal_range": "70-110", "status": "high"}
  ]
}
```

### 8.3 `smart-assistant/index.ts` - المساعد الذكي

**المدخلات**: `message`, `userId`, `context`

**آلية العمل**:
1. يجلب بيانات المستخدم + الأطباء المتاحين + الصيدليات المناوبة
2. يبني System Prompt شامل بكل سياق المنصة
3. يمكنه تنفيذ إجراءات: حجز مواعيد، البحث عن أطباء، معلومات صيدليات
4. يُرجع رداً منظماً مع إجراءات مقترحة

### 8.4 `send-sms/index.ts` - إرسال SMS

**الإجراءات المدعومة**:
- `send_notification_sms`: إرسال إشعارات معلقة عبر SMS
- `send_direct_sms`: إرسال SMS مباشر لرقم محدد
- `send_appointment_reminder`: تذكيرات المواعيد التلقائية

---

## 9. نظام الإشعارات

### أنواع الإشعارات:

| النوع | المُطلق | المستقبل | الحدث |
|-------|---------|----------|-------|
| info | النظام | المريض | وصفة جديدة |
| success | النظام | المريض | تقييم ملف طبي |
| warning | النظام | المريض | تحذير طبي |
| critical | النظام | المريض | حالة حرجة |
| info | النظام | الطبيب | ملف جديد للمراجعة |
| emergency | النظام | المستخدم | تأكيد طلب طوارئ |

### قنوات الإشعارات:
1. **داخل التطبيق**: جرس الإشعارات في Navbar
2. **Toast**: رسائل مؤقتة في أسفل الشاشة
3. **Push Notification**: إشعارات المتصفح
4. **SMS**: عبر Edge Function (مجهز، يحتاج مزود SMS)
5. **Realtime**: تحديثات فورية عبر Supabase Realtime

---

## 10. أنظمة الذكاء الاصطناعي

### 10.1 نظام الفرز الطبي الذكي (AI Triage)
- **الهدف**: تقييم أولي للأعراض وتوجيه المريض للتخصص المناسب
- **النموذج**: Lovable AI Gateway (Gemini/GPT)
- **الدقة**: تقييم أولي فقط، ليس تشخيصاً طبياً
- **التخزين**: جلسات الفرز تُحفظ في `ai_triage_sessions`

### 10.2 نظام تحليل التحاليل المخبرية
- **الهدف**: تصنيف أولي للتحاليل ومساعدة الطبيب
- **الدعم**: نصوص + صور
- **التدفق**: تحليل AI أولي → مراجعة طبيب → تقييم نهائي

### 10.3 المساعد الذكي
- **الهدف**: مساعدة المستخدمين في التنقل والحجز والاستفسارات
- **القدرات**: الرد على الأسئلة، اقتراح أطباء، البحث عن صيدليات

### 10.4 نظام التعلم المستمر
- **الجدول**: `ai_learning_data`
- **الآلية**: عند كل تقييم طبي، تُحفظ بيانات مجهولة للتحسين المستقبلي

---

## ملحق: قائمة الحزم المستخدمة

| الحزمة | الإصدار | الغرض |
|--------|---------|-------|
| react | 18.3.1 | مكتبة UI الأساسية |
| react-router-dom | 6.30.1 | التوجيه |
| @supabase/supabase-js | 2.86.2 | عميل Supabase |
| @tanstack/react-query | 5.83.0 | إدارة حالة البيانات |
| tailwindcss-animate | 1.0.7 | أنيميشن Tailwind |
| lucide-react | 0.462.0 | أيقونات |
| date-fns | 3.6.0 | معالجة التواريخ |
| recharts | 2.15.4 | رسوم بيانية |
| mapbox-gl | 3.17.0 | خرائط |
| sonner | 1.7.4 | إشعارات Toast |
| zod | 3.25.76 | التحقق من البيانات |
| react-hook-form | 7.61.1 | إدارة النماذج |
| class-variance-authority | 0.7.1 | متغيرات المكونات |
| cmdk | 1.1.1 | أوامر (Command Palette) |
| vaul | 0.9.9 | مكون Drawer |
| input-otp | 1.4.2 | إدخال OTP |
| embla-carousel-react | 8.6.0 | كاروسيل |
| react-resizable-panels | 2.1.9 | ألواح قابلة للتحجيم |
| react-day-picker | 8.10.1 | اختيار التاريخ |

---

## ملحق: التعدادات (Enums)

```sql
-- أدوار المستخدمين
CREATE TYPE app_role AS ENUM ('patient', 'doctor', 'pharmacist', 'lab_admin', 'admin', 'clinic');

-- حالات المواعيد
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- أنواع السجلات الطبية
CREATE TYPE record_type AS ENUM ('lab_result', 'prescription', 'imaging', 'consultation', 'report');
```

---

*تم إعداد هذه المذكرة التقنية لمنصة MEDLINK DZ - جميع الحقوق محفوظة*

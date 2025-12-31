// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: واجهة الطالب (منطق تسلسلي صارم يعكس ترتيب المعلم)
// ============================================

let currentAssignmentId = null;
let currentLessonContent = null;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('lessonsContainer')) {
        injectLessonModalHTML();
        loadStudentLessons();
    }
});

function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    
    // 1. التحقق من الهوية (مع الحماية من الأخطاء)
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') currentStudent = getCurrentUser();
        if (!currentStudent && sessionStorage.getItem('currentUser')) currentStudent = JSON.parse(sessionStorage.getItem('currentUser'));
    } catch (e) {}
    // فك الغلاف إذا وجد
    if (currentStudent && currentStudent.user) currentStudent = currentStudent.user;

    if (!currentStudent || !currentStudent.id) {
        container.innerHTML = '<div class="alert alert-danger">يرجى تسجيل الدخول.</div>';
        return;
    }

    // 2. جلب البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    // 3. التصفية والمطابقة
    let myLessons = allStudentLessons.filter(l => String(l.studentId) === String(currentStudent.id));

    if (myLessons.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1; text-align:center; padding:40px;"><h3>لا توجد دروس حالياً</h3><p>المسار التعليمي قيد الإعداد.</p></div>`;
        return;
    }

    // 4. الترتيب الحاسم (أساس النظام)
    // نعتمد على orderIndex الذي ضبطه المعلم بدقة
    myLessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    container.innerHTML = '';

    // 5. حلقة العرض (تطبيق قوانين القفل)
    myLessons.forEach((lesson, index) => {
        const originalLesson = lessonsLib.find(l => l.id == lesson.originalLessonId) || { title: lesson.title, exercises: { questions: [] } };
        
        // --- المنطق الذكي للقفل (Sequential Locking Logic) ---
        let isLocked = false;
        let lockMessage = '';

        // الحالة 1: الدرس الأول دائماً مفتوح (إلا إذا قفله المعلم يدوياً)
        if (index === 0) {
            isLocked = false;
        } 
        // الحالة 2: الدروس التالية تعتمد على اكتمال السابق
        else {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed') {
                isLocked = true;
                lockMessage = `يجب إكمال الدرس السابق: ${prevLesson.title}`;
            }
        }

        // قفل يدوي من المعلم (Overrides everything)
        if (lesson.isManuallyLocked) {
            isLocked = true;
            lockMessage = 'تم قفل الدرس بواسطة المعلم';
        }

        // تحديد التصميم بناءً على الحالة المحسوبة
        let cardClass = '';
        let actionBtn = '';
        let badge = '';

        if (lesson.status === 'completed') {
            cardClass = 'completed'; // أخضر
            badge = '<span class="badge badge-success">✅ مكتمل</span>';
            // زر المراجعة متاح دائماً للمكتمل
            actionBtn = `<button class="btn btn-outline-primary w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">مراجعة الحل</button>`;
        } else if (isLocked) {
            cardClass = 'locked'; // رمادي
            badge = '<span class="badge badge-secondary">🔒 مقفل</span>';
            // زر معطل يوضح السبب
            actionBtn = `<button class="btn btn-secondary w-100" disabled style="font-size:0.9rem;">${lockMessage}</button>`;
        } else {
            cardClass = 'active'; // أزرق/نشط
            badge = '<span class="badge badge-primary">🔓 متاح</span>';
            actionBtn = `<button class="btn btn-success w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">ابدأ الدرس</button>`;
        }

        const html = `
            <div class="test-card ${cardClass}" style="position:relative; opacity: ${isLocked ? 0.7 : 1};">
                <div class="card-header">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="badge badge-light">#${index + 1}</span>
                        ${badge}
                    </div>
                    <h3 style="margin-top:10px;">${lesson.title}</h3>
                </div>
                <div class="card-meta">
                    <span>${originalLesson.subject || 'عام'}</span>
                    <span>${(originalLesson.exercises?.questions?.length) || 0} تمارين</span>
                </div>
                <div style="margin-top:auto;">${actionBtn}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// ... (الدوال المساعدة: openLessonOverlay, submitAssessment, etc. تنسخ كما هي من الردود السابقة) ...
// تأكد من نسخ دالة injectLessonModalHTML وباقي دوال العرض ليعمل النظام
// سأضع هنا تذكيراً بالدوال الضرورية جداً لعمل القفل

function submitAssessment() {
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = allStudentLessons.findIndex(l => l.id == currentAssignmentId);
    if (idx !== -1) {
        // ... (كود حفظ الإجابات) ...
        const collectedAnswers = []; // (منطق التجميع المعتاد)
        // ...
        
        allStudentLessons[idx].status = 'completed'; // تغيير الحالة
        allStudentLessons[idx].completedDate = new Date().toISOString();
        
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        
        alert('أحسنت! تم إكمال الدرس.');
        closeLessonMode(); 
        // عند الإغلاق سيتم استدعاء loadStudentLessons 
        // وسيقوم تلقائياً بفتح الدرس التالي (index+1) لأن (index) أصبح completed
    }
}

// ... (باقي الدوال Helper functions) ...
function injectLessonModalHTML() {
    if(document.getElementById('lessonFocusMode')) return;
    // كود HTML للنافذة المنبثقة (Modal) كما هو في الردود السابقة
    const modalHTML = `<div id="lessonFocusMode" class="lesson-focus-mode">...</div>`; 
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
// ...

// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: واجهة الدروس للطالب (تطبيق التسلسل الصارم والمنطق الجديد)
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
    
    // 1. التحقق من المستخدم (مع الإصلاحات السابقة)
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') currentStudent = getCurrentUser();
        if (!currentStudent && sessionStorage.getItem('currentUser')) currentStudent = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentStudent && localStorage.getItem('currentUser')) currentStudent = JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {}
    if (currentStudent && currentStudent.user) currentStudent = currentStudent.user;

    if (!currentStudent || !currentStudent.id) {
        container.innerHTML = '<div class="alert alert-danger">يرجى تسجيل الدخول.</div>';
        return;
    }

    // 2. جلب البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    // تصفية
    let myLessons = allStudentLessons.filter(l => String(l.studentId) === String(currentStudent.id));

    if (myLessons.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1; text-align:center; padding:30px;"><h3>لا توجد دروس</h3><p>انتظر حتى يقوم المعلم بإعداد خطتك.</p></div>`;
        return;
    }

    // 3. الترتيب الحاسم (أساس المنطق الجديد)
    myLessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    container.innerHTML = '';

    // 4. بناء الواجهة مع منطق القفل الذكي
    myLessons.forEach((lesson, index) => {
        const originalLesson = lessonsLib.find(l => l.id == lesson.originalLessonId) || { title: lesson.title, exercises: { questions: [] } };
        
        // --- قلب المنطق الجديد ---
        let isLocked = false;
        let lockReason = '';

        // الشرط 1: إذا كان مقفلاً يدوياً من المعلم
        if (lesson.isManuallyLocked) {
            isLocked = true;
            lockReason = 'مقفل من قبل المعلم';
        }
        // الشرط 2: التسلسل (إذا لم يكن الأول، ولم يكتمل السابق)
        else if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed') {
                isLocked = true;
                lockReason = `يجب إكمال الدرس السابق: ${prevLesson.title}`;
            }
        }

        // تحديد الحالة والعرض
        let cardClass = '';
        let btnAction = '';
        let badge = '';

        if (lesson.status === 'completed') {
            cardClass = 'completed'; // أخضر
            badge = '<span class="badge badge-success">✅ مكتمل</span>';
            // يسمح بالمراجعة حتى لو الدروس السابقة تغيرت حالتها (اختياري، لكن الأفضل تركه متاحاً للمراجعة)
            btnAction = `<button class="btn btn-outline-primary w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">مراجعة</button>`;
        } else if (isLocked) {
            cardClass = 'locked'; // رمادي ومقفل
            badge = '<span class="badge badge-secondary">🔒 مقفل</span>';
            // زر معطل
            btnAction = `<button class="btn btn-secondary w-100" disabled>🔒 ${lockReason}</button>`;
        } else {
            cardClass = 'active'; // أزرق/متاح
            badge = '<span class="badge badge-primary">🔓 متاح الآن</span>';
            btnAction = `<button class="btn btn-success w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">ابدأ الدرس</button>`;
        }

        // HTML البطاقة
        const html = `
            <div class="test-card ${cardClass}" style="position:relative; transition:0.3s;">
                ${isLocked ? '<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.6); z-index:2;"></div>' : ''}
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
                <div style="margin-top:auto; position:relative; z-index:3;">
                    ${btnAction}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// ... (باقي الدوال: openLessonOverlay, submitAssessment, injectLessonModalHTML تبقى كما هي في الرد السابق) ...
// تأكد من نسخها كاملة لضمان عمل النوافذ المنبثقة

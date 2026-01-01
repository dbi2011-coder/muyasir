// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: واجهة الطالب (المسار الصارم + تسجيل الغياب والتمديد)
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
    
    // 1. التحقق من المستخدم
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') currentStudent = getCurrentUser();
        if (!currentStudent && sessionStorage.getItem('currentUser')) currentStudent = JSON.parse(sessionStorage.getItem('currentUser'));
    } catch (e) {}
    if (currentStudent && currentStudent.user) currentStudent = currentStudent.user;

    if (!currentStudent || !currentStudent.id) {
        container.innerHTML = '<div class="alert alert-danger">يرجى تسجيل الدخول.</div>';
        return;
    }

    // 2. جلب البيانات
    let allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    let myLessons = allStudentLessons.filter(l => String(l.studentId) === String(currentStudent.id));
    
    if (myLessons.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس حالياً</h3></div>`;
        return;
    }

    // 3. الترتيب الحاسم
    myLessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    // 4. (الجديد) فحص الغياب الذكي وتسجيله قبل العرض
    let dataChanged = false;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // البحث عن الدرس "النشط" المفترض (أول درس غير مكتمل)
    const activeLessonIndex = myLessons.findIndex(l => l.status !== 'completed' && l.status !== 'accelerated');
    
    if (activeLessonIndex !== -1) {
        const activeLesson = myLessons[activeLessonIndex];
        
        // إذا كان للدرس سجل سابق
        if (activeLesson.historyLog && activeLesson.historyLog.length > 0) {
            const lastLogDate = activeLesson.historyLog[activeLesson.historyLog.length - 1].date.split('T')[0];
            
            // إذا كان آخر سجل ليس اليوم، وهناك فرق أيام
            if (lastLogDate !== todayStr) {
                const lastDateObj = new Date(lastLogDate);
                const todayObj = new Date();
                const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));
                
                // نفحص الأيام البينية بحثاً عن غياب
                if (diffDays > 1) {
                    // (هنا يمكن إضافة منطق فحص جدول الطالب الحقيقي، للتبسيط سنفترض كل يوم هو يوم دراسي)
                    // نسجل غياب لليوم السابق مباشرة كمثال
                    activeLesson.historyLog.push({
                        date: new Date(Date.now() - 86400000).toISOString(), // الأمس
                        status: 'absence'
                    });
                    dataChanged = true;
                }
            }
        }
    }

    if (dataChanged) {
        // حفظ التحديثات (الغياب) في قاعدة البيانات
        // يجب تحديث المصفوفة الأصلية
        myLessons.forEach(myL => {
            const mainIdx = allStudentLessons.findIndex(al => al.id == myL.id);
            if(mainIdx !== -1) allStudentLessons[mainIdx] = myL;
        });
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
    }

    // 5. بناء الواجهة
    container.innerHTML = '';
    myLessons.forEach((lesson, index) => {
        const originalLesson = lessonsLib.find(l => l.id == lesson.originalLessonId) || { title: lesson.title, exercises: { questions: [] } };
        
        // --- منطق القفل الصارم (Strict Locking) ---
        let isLocked = false;
        let lockMessage = '';

        if (index === 0) {
            isLocked = false; // الأول دائماً مفتوح
        } else {
            const prevLesson = myLessons[index - 1];
            // الشرط الجديد: السابق يجب أن يكون (completed) أو (accelerated)
            if (prevLesson.status !== 'completed' && prevLesson.status !== 'accelerated') {
                isLocked = true;
                lockMessage = `أكمل السابق: ${prevLesson.title}`;
            }
        }

        // العرض
        let cardClass = '';
        let badge = '';
        let btnAction = '';

        if (lesson.status === 'completed') {
            cardClass = 'completed';
            badge = '<span class="badge badge-success">✅ مكتمل</span>';
            btnAction = `<button class="btn btn-outline-primary w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">مراجعة</button>`;
        } else if (lesson.status === 'accelerated') {
            cardClass = 'accelerated'; // كلاس جديد للتسريع (يمكن تنسيقه بـ CSS ليظهر ذهبياً)
            badge = '<span class="badge badge-warning" style="background:gold; color:black;">⚡ تم التسريع</span>';
            btnAction = `<button class="btn btn-outline-warning w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">مراجعة (تفوق)</button>`;
        } else if (isLocked) {
            cardClass = 'locked';
            badge = '<span class="badge badge-secondary">🔒 مقفل</span>';
            btnAction = `<button class="btn btn-secondary w-100" disabled>${lockMessage}</button>`;
        } else {
            cardClass = 'active';
            badge = '<span class="badge badge-primary">🔓 ابدأ الآن</span>';
            // زر البدء سيسجل الدخول (Start/Extension)
            btnAction = `<button class="btn btn-success w-100" onclick="startAndOpenLesson(${lesson.id}, ${lesson.originalLessonId})">ابدأ الدرس</button>`;
        }

        const html = `
            <div class="test-card ${cardClass}" style="${lesson.status === 'accelerated' ? 'border: 2px solid gold; background: #fffbf0;' : ''}">
                <div class="card-header">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="badge badge-light">#${index + 1}</span>
                        ${badge}
                    </div>
                    <h3 style="margin-top:10px;">${lesson.title}</h3>
                </div>
                <div style="margin-top:auto;">${btnAction}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// دالة جديدة: تسجيل الدخول (بدأ/تمديد) ثم الفتح
function startAndOpenLesson(assignmentId, originalLessonId) {
    let allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = allStudentLessons.findIndex(l => l.id == assignmentId);
    
    if (idx !== -1) {
        const lesson = allStudentLessons[idx];
        if (!lesson.historyLog) lesson.historyLog = [];
        
        const todayStr = new Date().toISOString();
        const todayDateOnly = todayStr.split('T')[0];
        
        // هل سجلنا دخولاً اليوم؟
        const hasLogToday = lesson.historyLog.some(log => log.date.startsWith(todayDateOnly));
        
        if (!hasLogToday) {
            // تحديد نوع السجل: إذا كان الأول فهو "بدأ"، وإلا فهو "تمديد"
            const type = lesson.historyLog.length === 0 ? 'started' : 'extension';
            lesson.historyLog.push({ date: todayStr, status: type });
            
            localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        }
    }
    
    openLessonOverlay(assignmentId, originalLessonId);
}

// دالة التسليم (تسجل الإنجاز في السجل + الحالة النهائية)
function submitAssessment() {
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = allStudentLessons.findIndex(l => l.id == currentAssignmentId);
    if (idx !== -1) {
        // ... (كود تجميع الإجابات نفسه) ...
        const collectedAnswers = []; // افترض وجود كود التجميع هنا
        
        const lesson = allStudentLessons[idx];
        lesson.status = 'completed';
        lesson.completedDate = new Date().toISOString();
        
        // تسجيل الإنجاز في السجل التاريخي
        if (!lesson.historyLog) lesson.historyLog = [];
        lesson.historyLog.push({ date: new Date().toISOString(), status: 'completed' });
        
        lesson.answers = collectedAnswers;
        
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        
        alert('أحسنت! تم إكمال الدرس.');
        closeLessonMode();
    }
}

// تصدير الدوال لتكون متاحة للـ HTML
window.openLessonOverlay = openLessonOverlay;
window.startAndOpenLesson = startAndOpenLesson;
window.submitAssessment = submitAssessment;
window.submitExercises = submitExercises;
window.closeLessonMode = closeLessonMode;
window.showStage = showStage;

// (بقية دوال العرض والـ Modal تنسخ كما هي من الردود السابقة لضمان عمل الواجهة)
function openLessonOverlay(aid, oid) { /* ... نفس الكود السابق ... */ }
function submitExercises() { /* ... */ }
function closeLessonMode() { document.getElementById('lessonFocusMode').style.display = 'none'; loadStudentLessons(); }
function showStage(s) { /* ... */ }
function injectLessonModalHTML() { /* ... */ }

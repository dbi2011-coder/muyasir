// إدارة دروس الطالب - نظام المسار المتسلسل (Sequential Learning Path)
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-lessons.html')) {
        loadStudentLessons();
    }
});

function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    const currentStudent = getCurrentUser(); // من auth.js
    
    // 1. جلب الدروس المسندة للطالب من LocalStorage (نفس مصدر المعلم)
    // studentLessons يحتوي على {studentId, objective, status, ...}
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    // تصفية الدروس الخاصة بالطالب الحالي فقط
    let myLessons = allStudentLessons.filter(l => l.studentId === currentStudent.id);

    // التحقق من وجود دروس
    if (myLessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
                <h3>لا توجد دروس مسندة حالياً</h3>
                <p>لم يقم المعلم بإدراج دروس في خطتك بعد. يرجى الانتظار.</p>
            </div>
        `;
        return;
    }

    // 2. ترتيب الدروس (مهم جداً للتسلسل)
    // نرتبها حسب تاريخ الإسناد أو المعرف لضمان تسلسل منطقي (الدرس 1 ثم 2 ثم 3)
    myLessons.sort((a, b) => {
        return new Date(a.assignedDate || 0) - new Date(b.assignedDate || 0) || a.id - b.id;
    });

    container.innerHTML = ''; // مسح رسالة التحميل

    // 3. حلقة التكرار لبناء البطاقات وتحديد القفل (The Locking Logic)
    myLessons.forEach((lesson, index) => {
        let isLocked = false;
        let prevLessonCompleted = true; // نفترض أن السابق مكتمل للدرس الأول

        // إذا لم يكن الدرس الأول، نتحقق من حالة الدرس السابق
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            // الشرط: يفتح الدرس إذا كان الدرس السابق مكتمل
            if (prevLesson.status !== 'completed') {
                prevLessonCompleted = false;
            }
        }

        // تحديد القفل:
        // الدرس يُقفل إذا:
        // 1. لم يكتمل الدرس السابق.
        // 2. والدرس الحالي نفسه ليس مكتمل (لأن المعلم قد يكمل درس متقدم يدوياً)
        if (!prevLessonCompleted && lesson.status !== 'completed') {
            isLocked = true;
        }

        // تحديد المظهر بناءً على الحالة
        let cardClass = '';
        let btnText = '';
        let btnClass = '';
        let statusBadge = '';
        let lockOverlay = '';
        let actionFunction = '';

        if (lesson.status === 'completed') {
            // حالة: مكتمل
            cardClass = 'completed';
            btnText = 'مراجعة الدرس';
            btnClass = 'btn-outline-primary';
            statusBadge = `<div class="completed-badge">✅ تم الإنجاز (${formatDateShort(lesson.completedDate)})</div>`;
            actionFunction = `goToLessonPage(${lesson.originalLessonId || lesson.id}, 'review')`;
        } else if (isLocked) {
            // حالة: مغلق
            cardClass = 'locked';
            btnText = 'مغلق';
            btnClass = 'btn-secondary';
            statusBadge = `<div style="color: #7f8c8d; font-size: 0.8rem;">🔒 يتطلب إكمال الدرس السابق</div>`;
            lockOverlay = `
                <div class="lock-overlay">
                    <span class="lock-icon">🔒</span>
                </div>
            `;
            actionFunction = ''; // لا يوجد إجراء
        } else {
            // حالة: مفتوح (الحالي)
            cardClass = 'active';
            btnText = 'ابدأ الدرس الآن';
            btnClass = 'btn-success';
            statusBadge = `<div style="color: #2ecc71; font-weight: bold;">🔓 متاح للدراسة</div>`;
            actionFunction = `goToLessonPage(${lesson.originalLessonId || lesson.id}, 'start')`;
        }

        // 4. إنشاء HTML البطاقة
        const cardHTML = `
            <div class="lesson-card ${cardClass}">
                ${lockOverlay}
                <div class="card-body">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="background:#eee; padding:2px 8px; border-radius:4px; font-size:0.8rem;">درس ${index + 1}</span>
                        ${statusBadge}
                    </div>
                    <h3 class="lesson-title">${lesson.title}</h3>
                    <p class="lesson-objective">
                        <strong>الهدف:</strong> ${lesson.objective || 'غير محدد'}
                    </p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-start ${btnClass}" 
                            onclick="${actionFunction}" 
                            ${isLocked ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// دالة الانتقال لصفحة الدرس الفعلية
function goToLessonPage(lessonId, mode) {
    // =========================================================
    // ⚠️ هام جداً: قم بتعديل هذا الرابط لاسم صفحة الدرس لديك
    // =========================================================
    
    // مثال: الانتقال لصفحة عرض الدرس مع تمرير المعرف
    // mode يمكن استخدامه لفتح الدرس في وضع "المراجعة" أو "الحل"
    
    console.log(`Navigating to lesson ID: ${lessonId}, Mode: ${mode}`);
    
    // استبدل 'lesson-view.html' باسم ملفك الحقيقي
    window.location.href = `lesson-view.html?id=${lessonId}&mode=${mode}`;
}

// دالة مساعدة لتنسيق التاريخ
function formatDateShort(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

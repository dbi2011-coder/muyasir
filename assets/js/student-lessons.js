// إدارة دروس الطالب - نظام المسار المتسلسل (Sequential Learning Path)
// تم التحديث: إصلاح مشكلة عدم ظهور الدروس ومطابقة معرف الطالب

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-lessons.html')) {
        loadStudentLessons();
    }
});

function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    
    // تأكد من وجود دالة جلب المستخدم
    if (typeof getCurrentUser !== 'function') {
        console.error("خطأ: دالة getCurrentUser غير موجودة. تأكد من ربط ملف auth.js");
        container.innerHTML = '<div style="padding:20px; color:red;">خطأ في النظام: لم يتم التعرف على المستخدم.</div>';
        return;
    }

    const currentStudent = getCurrentUser();
    
    if (!currentStudent || !currentStudent.id) {
        console.error("لا يوجد طالب مسجل دخول");
        window.location.href = 'login.html'; // إعادة توجيه إذا لم يكن مسجلاً
        return;
    }
    
    console.log("الطالب الحالي:", currentStudent.id, currentStudent.name);

    // 1. جلب الدروس من LocalStorage
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    console.log("جميع الدروس في النظام:", allStudentLessons.length);

    // 2. تصفية الدروس الخاصة بالطالب الحالي (باستخدام == بدلاً من === لتجاهل الفرق بين النص والرقم)
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);
    console.log("دروس هذا الطالب بعد التصفية:", myLessons.length);

    // التحقق من وجود دروس
    if (myLessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📂</div>
                <h3>لا توجد دروس مسندة حالياً</h3>
                <p>لم يقم المعلم بإسناد دروس لك بعد، أو لم يقم بالضغط على زر "تحديث" في لوحته.</p>
                <button onclick="location.reload()" class="btn btn-sm btn-outline-primary" style="margin-top:10px;">تحديث الصفحة</button>
            </div>
        `;
        return;
    }

    // ترتيب الدروس حسب التاريخ لضمان التسلسل
    myLessons.sort((a, b) => {
        return new Date(a.assignedDate || 0) - new Date(b.assignedDate || 0) || a.id - b.id;
    });

    container.innerHTML = ''; // مسح رسالة التحميل

    // 3. بناء البطاقات ومنطق القفل
    myLessons.forEach((lesson, index) => {
        let isLocked = false;
        let prevLessonCompleted = true; 

        // التحقق من الدرس السابق (إذا لم يكن الأول)
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed') {
                prevLessonCompleted = false;
            }
        }

        // قفل الدرس إذا لم يكتمل سابقه، وإذا لم يكن الدرس الحالي مكتملًا بالفعل
        if (!prevLessonCompleted && lesson.status !== 'completed') {
            isLocked = true;
        }

        // تحديد المظهر والنصوص
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
            statusBadge = `<div class="completed-badge">✅ تم الإنجاز</div>`;
            // لاحظ: هنا نستخدم الرابط الافتراضي، غيره حسب حاجتك
            actionFunction = `goToLessonPage(${lesson.originalLessonId || lesson.id}, 'review')`;
        } else if (isLocked) {
            // حالة: مغلق
            cardClass = 'locked';
            btnText = 'مغلق';
            btnClass = 'btn-secondary';
            statusBadge = `<div style="color: #7f8c8d; font-size: 0.8rem;">🔒 يتطلب إكمال السابق</div>`;
            lockOverlay = `<div class="lock-overlay"><span class="lock-icon">🔒</span></div>`;
            actionFunction = '';
        } else {
            // حالة: مفتوح (الحالي)
            cardClass = 'active';
            btnText = 'ابدأ الدرس الآن';
            btnClass = 'btn-success';
            statusBadge = `<div style="color: #2ecc71; font-weight: bold;">🔓 متاح للدراسة</div>`;
            actionFunction = `goToLessonPage(${lesson.originalLessonId || lesson.id}, 'start')`;
        }

        // HTML البطاقة
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

function goToLessonPage(lessonId, mode) {
    // توجيه الطالب لصفحة عرض الدرس
    // تأكد أن لديك ملف باسم lesson-view.html أو غير الاسم هنا
    console.log(`Open Lesson: ${lessonId}, Mode: ${mode}`);
    window.location.href = `lesson-view.html?id=${lessonId}&mode=${mode}`;
}

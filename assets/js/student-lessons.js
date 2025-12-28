// ==========================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: إدارة مسار التعلم التسلسلي (القفل والفتح)
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-lessons.html')) {
        loadStudentLessons();
    }
});

function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    
    // التحقق من نظام التوثيق
    if (typeof getCurrentUser !== 'function') {
        container.innerHTML = '<div class="alert alert-danger">خطأ: ملف auth.js غير مرتبط بالصفحة.</div>';
        return;
    }

    const currentStudent = getCurrentUser();
    
    // تصحيح الخطأ هنا: إذا لم يكن الطالب مسجلاً، وجهه لصفحة الدخول في المسار الصحيح
    if (!currentStudent || !currentStudent.id) {
        // نستخدم ../../ للعودة للمجلد الرئيسي حيث توجد صفحة login.html عادة
        window.location.href = '../../login.html'; 
        return;
    }

    // 1. جلب البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    // 2. تصفية دروس الطالب الحالي
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);

    // حالة عدم وجود دروس
    if (myLessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <h3>لا توجد دروس حالياً</h3>
                <p>لم يقم المعلم بنشر الدروس في خطتك بعد.</p>
                <button onclick="location.reload()" class="btn btn-sm btn-primary" style="margin-top:10px;">تحديث الصفحة</button>
            </div>
        `;
        return;
    }

    // ترتيب الدروس لضمان التسلسل المنطقي
    myLessons.sort((a, b) => {
        return new Date(a.assignedDate || 0) - new Date(b.assignedDate || 0) || a.id - b.id;
    });

    container.innerHTML = ''; // تنظيف الحاوية

    // 3. بناء البطاقات ومنطق القفل
    myLessons.forEach((lesson, index) => {
        let isLocked = false;
        
        // الدرس يُقفل إذا كان الدرس السابق غير مكتمل، والدرس الحالي نفسه غير مكتمل
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed' && lesson.status !== 'completed') {
                isLocked = true;
            }
        }

        // إعداد متغيرات العرض
        let cardClass = '';
        let btnText = '';
        let btnClass = '';
        let statusBadge = '';
        let lockOverlay = '';
        let actionOnClick = '';

        if (lesson.status === 'completed') {
            // ✅ حالة: مكتمل
            cardClass = 'completed';
            btnText = 'مراجعة الدرس';
            btnClass = 'btn-outline-primary';
            statusBadge = `<div class="completed-badge">✅ مكتمل</div>`;
            actionOnClick = `goToLessonPage(${lesson.originalLessonId || lesson.id}, 'review')`;
            
        } else if (isLocked) {
            // 🔒 حالة: مغلق
            cardClass = 'locked';
            btnText = 'مغلق';
            btnClass = 'btn-secondary';
            statusBadge = `<div style="color: #95a5a6; font-size: 0.85rem;"><i class="fas fa-lock"></i> مقفل</div>`;
            lockOverlay = `<div class="lock-overlay"><span class="lock-icon">🔒</span></div>`;
            actionOnClick = `alert('يجب إكمال الدرس السابق (${myLessons[index-1].title}) أولاً!')`;
            
        } else {
            // 🔓 حالة: مفتوح (الدرس الحالي)
            cardClass = 'active';
            btnText = 'ابدأ الدرس الآن';
            btnClass = 'btn-success';
            statusBadge = `<div style="color: #2ecc71; font-weight: bold;">🔓 متاح</div>`;
            actionOnClick = `goToLessonPage(${lesson.originalLessonId || lesson.id}, 'start')`;
        }

        // إنشاء HTML البطاقة
        const cardHTML = `
            <div class="lesson-card ${cardClass}">
                ${lockOverlay}
                <div class="card-body">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span class="lesson-number">درس ${index + 1}</span>
                        ${statusBadge}
                    </div>
                    <h3 class="lesson-title">${lesson.title}</h3>
                    <p class="lesson-objective">
                        <strong>الهدف:</strong> ${lesson.objective || 'غير محدد'}
                    </p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-start ${btnClass}" 
                            onclick="${actionOnClick}" 
                            ${isLocked ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// دالة الانتقال لصفحة الدرس
function goToLessonPage(lessonId, mode) {
    console.log(`Navigating to lesson: ${lessonId}, Mode: ${mode}`);
    // تأكد أن ملف الدرس اسمه lesson.html وموجود بجانب ملف my-lessons.html
    window.location.href = `lesson.html?id=${lessonId}&mode=${mode}`;
}

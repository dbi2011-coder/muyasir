// إدارة دروس الطالب
let currentLessonId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-lessons.html')) {
        loadStudentLessons();
        updateCurrentLessonSection();
    }
});

function loadStudentLessons() {
    const lessonsList = document.getElementById('lessonsList');
    const currentStudent = getCurrentUser();
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    const studentLessonsFiltered = studentLessons.filter(lesson => 
        lesson.studentId === currentStudent.id
    );
    
    if (studentLessonsFiltered.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس مخصصة</h3>
                <p>سيتم إضافة الدروس المخصصة لك هنا</p>
            </div>
        `;
        return;
    }
    
    lessonsList.innerHTML = studentLessonsFiltered.map(lesson => {
        const statusClass = getLessonStatusClass(lesson.status);
        const statusText = getLessonStatusText(lesson.status);
        
        return `
            <div class="lesson-card ${statusClass}">
                <div class="card-header">
                    <h3 class="card-title">${lesson.title}</h3>
                    <span class="card-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-item">
                        <span>المادة:</span>
                        <strong>${lesson.subject}</strong>
                    </div>
                    <div class="meta-item">
                        <span>تاريخ الإضافة:</span>
                        <strong>${formatDate(lesson.assignedDate)}</strong>
                    </div>
                    ${lesson.progress !== undefined ? `
                    <div class="meta-item">
                        <span>التقدم:</span>
                        <strong>${lesson.progress}%</strong>
                    </div>
                    ` : ''}
                </div>
                <div class="card-actions">
                    ${lesson.status === 'current' ? `
                    <button class="btn btn-success" onclick="startLesson(${lesson.id})">بدء الدرس</button>
                    ` : ''}
                    ${lesson.status === 'completed' ? `
                    <button class="btn btn-primary" onclick="viewLesson(${lesson.id})">عرض الدرس</button>
                    ` : ''}
                    ${lesson.status === 'upcoming' ? `
                    <button class="btn btn-outline-secondary" onclick="viewLessonDetails(${lesson.id})">عرض التفاصيل</button>
                    ` : ''}
                    ${lesson.status === 'accelerated' ? `
                    <button class="btn btn-outline-warning" onclick="viewLesson(${lesson.id})">عرض (مسرع)</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updateCurrentLessonSection() {
    const currentLessonSection = document.getElementById('currentLessonSection');
    const currentStudent = getCurrentUser();
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    const currentLesson = studentLessons.find(lesson => 
        lesson.studentId === currentStudent.id && lesson.status === 'current'
    );
    
    if (!currentLesson) {
        currentLessonSection.innerHTML = `
            <div class="current-lesson-content">
                <h3 class="current-lesson-title">لا توجد دروس حالية</h3>
                <p class="current-lesson-description">جميع الدروس المخصصة لك مكتملة أو سيتم إضافتها قريباً</p>
            </div>
        `;
        return;
    }
    
    currentLessonSection.innerHTML = `
        <div class="current-lesson-content">
            <h3 class="current-lesson-title">الدرس الحالي: ${currentLesson.title}</h3>
            <p class="current-lesson-description">تابع تقدمك في هذا الدرس لتحقيق أهدافك التعليمية</p>
            <button class="btn btn-light btn-large" onclick="startLesson(${currentLesson.id})">
                🚀 دخول الدرس
            </button>
        </div>
    `;
}

function filterLessons() {
    const filter = document.getElementById('lessonFilter').value;
    const lessonCards = document.querySelectorAll('.lesson-card');
    
    lessonCards.forEach(card => {
        switch (filter) {
            case 'all':
                card.style.display = 'block';
                break;
            case 'current':
                card.style.display = card.classList.contains('current') ? 'block' : 'none';
                break;
            case 'completed':
                card.style.display = card.classList.contains('completed') ? 'block' : 'none';
                break;
            case 'accelerated':
                card.style.display = card.classList.contains('accelerated') ? 'block' : 'none';
                break;
            case 'upcoming':
                card.style.display = card.classList.contains('upcoming') ? 'block' : 'none';
                break;
        }
    });
}

function startLesson(lessonId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonIndex = studentLessons.findIndex(lesson => lesson.id === lessonId);
    
    if (lessonIndex === -1) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    // في تطبيق حقيقي، سيتم توجيه الطالب إلى صفحة الدرس
    showAuthNotification('جاري تحميل الدرس...', 'info');
    
    setTimeout(() => {
        // محاكاة بدء الدرس
        studentLessons[lessonIndex].status = 'in-progress';
        studentLessons[lessonIndex].startedAt = new Date().toISOString();
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        
        // إضافة نشاط
        addStudentActivity({
            type: 'lesson',
            title: 'بدأت درساً',
            description: studentLessons[lessonIndex].title
        });
        
        showAuthNotification('تم بدء الدرس بنجاح', 'success');
        loadStudentLessons();
        updateCurrentLessonSection();
    }, 2000);
}

function viewLesson(lessonId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lesson = studentLessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    currentLessonId = lessonId;
    
    document.getElementById('viewLessonTitle').textContent = lesson.title;
    document.getElementById('viewLessonContent').innerHTML = `
        <div class="lesson-details">
            <div class="detail-section">
                <h4>معلومات الدرس:</h4>
                <p><strong>المادة:</strong> ${lesson.subject}</p>
                <p><strong>الحالة:</strong> ${getLessonStatusText(lesson.status)}</p>
                ${lesson.progress ? `<p><strong>التقدم:</strong> ${lesson.progress}%</p>` : ''}
                ${lesson.assignedDate ? `<p><strong>تاريخ الإضافة:</strong> ${formatDate(lesson.assignedDate)}</p>` : ''}
            </div>
            <div class="detail-section">
                <h4>وصف الدرس:</h4>
                <p>${lesson.description || 'لا يوجد وصف متاح للدرس.'}</p>
            </div>
            ${lesson.status === 'completed' ? `
            <div class="alert alert-success">
                <strong>مكتمل:</strong> لقد أكملت هذا الدرس بنجاح
            </div>
            ` : ''}
            ${lesson.status === 'accelerated' ? `
            <div class="alert alert-warning">
                <strong>مسرع:</strong> هذا الدرس تم تسريعه وتخطيه إلى الدرس التالي
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('viewLessonModal').classList.add('show');
}

function closeViewLessonModal() {
    document.getElementById('viewLessonModal').classList.remove('show');
    currentLessonId = null;
}

function viewLessonDetails(lessonId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lesson = studentLessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    const detailsMessage = `
        تفاصيل الدرس:
        العنوان: ${lesson.title}
        المادة: ${lesson.subject}
        الحالة: ${getLessonStatusText(lesson.status)}
        ${lesson.description ? `الوصف: ${lesson.description}` : ''}
    `;
    
    alert(detailsMessage);
}

function getLessonStatusClass(status) {
    const statusClasses = {
        'current': 'current',
        'completed': 'completed',
        'accelerated': 'accelerated',
        'upcoming': 'upcoming',
        'in-progress': 'current'
    };
    return statusClasses[status] || 'upcoming';
}

function getLessonStatusText(status) {
    const statusTexts = {
        'current': 'الدرس الحالي',
        'completed': 'تم الإنجاز',
        'accelerated': 'تم التسريع',
        'upcoming': 'درس قادم',
        'in-progress': 'قيد التنفيذ'
    };
    return statusTexts[status] || 'غير محدد';
}

// تصدير الدوال للاستخدام العالمي
window.filterLessons = filterLessons;
window.startLesson = startLesson;
window.viewLesson = viewLesson;
window.closeViewLessonModal = closeViewLessonModal;
window.viewLessonDetails = viewLessonDetails;
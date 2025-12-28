// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: إدارة الدروس + عرض المحتوى في نافذة منبثقة
// ============================================

let currentAssignmentId = null;
let currentLessonContent = null;

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من تحميل الدروس فقط في صفحة الدروس
    if (document.getElementById('lessonsContainer')) {
        loadStudentLessons();
    }
});

function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    
    // 1. التحقق من تسجيل الدخول (بدون إعادة توجيه تسبب 404)
    let currentStudent = null;
    try {
        // محاولة استخدام auth.js أو sessionStorage مباشرة
        if (typeof getCurrentUser === 'function') {
            currentStudent = getCurrentUser();
        } else {
            const stored = sessionStorage.getItem('currentUser');
            if (stored) currentStudent = JSON.parse(stored).user;
        }
    } catch (e) { console.error(e); }

    if (!currentStudent || !currentStudent.id) {
        // بدلاً من التوجيه لصفحة 404، نعرض رسالة هنا
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #721c24; background: #f8d7da; border-radius: 8px;">
                <h3>⚠️ يجب تسجيل الدخول</h3>
                <p>لم نتمكن من التعرف على الطالب. يرجى تسجيل الدخول مرة أخرى.</p>
                <a href="../../login.html" class="btn btn-primary">الذهاب لصفحة الدخول</a>
            </div>
        `;
        return;
    }

    // 2. جلب الدروس
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');

    if (myLessons.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <h3>📭 لا توجد دروس</h3>
                <p>لم يقم المعلم بإسناد دروس لك بعد.</p>
            </div>`;
        return;
    }

    // الترتيب
    myLessons.sort((a, b) => new Date(a.assignedDate || 0) - new Date(b.assignedDate || 0) || a.id - b.id);
    container.innerHTML = '';

    // 3. رسم البطاقات
    myLessons.forEach((lessonAssignment, index) => {
        // بيانات الدرس الأصلي (للتمارين والصور)
        const originalLesson = lessonsLib.find(l => l.id == lessonAssignment.originalLessonId) || {};
        
        // منطق القفل
        let isLocked = false;
        if (index > 0) {
            const prev = myLessons[index - 1];
            if (prev.status !== 'completed' && lessonAssignment.status !== 'completed') {
                isLocked = true;
            }
        }

        let btnHtml = '';
        let statusBadge = '';
        let cardClass = isLocked ? 'locked' : (lessonAssignment.status === 'completed' ? 'completed' : 'active');

        if (lessonAssignment.status === 'completed') {
            statusBadge = '<span style="color:#28a745; font-weight:bold;">✅ مكتمل</span>';
            btnHtml = `<button class="btn btn-outline-primary" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">مراجعة</button>`;
        } else if (isLocked) {
            statusBadge = '<span style="color:#6c757d;">🔒 مقفل</span>';
            btnHtml = `<button class="btn btn-secondary" style="width:100%" disabled>مقفل</button>`;
        } else {
            statusBadge = '<span style="color:#007bff; font-weight:bold;">🔓 متاح</span>';
            btnHtml = `<button class="btn btn-success" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">ابدأ الدرس</button>`;
        }

        const html = `
            <div class="test-card ${cardClass}">
                <div class="card-header">
                    <div style="display:flex; justify-content:space-between;">
                        <span>درس ${index + 1}</span>
                        ${statusBadge}
                    </div>
                    <h3>${lessonAssignment.title}</h3>
                </div>
                <div class="card-meta">
                    <span>${originalLesson.subject || 'عام'}</span>
                    <span>${originalLesson.exercises?.questions?.length || 0} تمرين</span>
                </div>
                <div>${btnHtml}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    // حقن هيكل المودال مرة واحدة
    injectLessonModalHTML();
}

// ----------------------------------------------
// منطق النافذة المنبثقة (Overlay)
// ----------------------------------------------
function openLessonOverlay(assignmentId, originalLessonId) {
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    currentLessonContent = lessonsLib.find(l => l.id == originalLessonId);
    currentAssignmentId = assignmentId;

    if (!currentLessonContent) {
        alert('محتوى الدرس غير موجود!');
        return;
    }

    // تعبئة البيانات
    document.getElementById('lessonFocusTitle').textContent = currentLessonContent.title;
    document.getElementById('reqScore').textContent = currentLessonContent.exercises?.passScore || 50;

    // رسم المحتويات
    renderIntro();
    renderQuestions(currentLessonContent.exercises?.questions || [], 'exercisesList');
    renderQuestions(currentLessonContent.assessment?.questions || [], 'assessmentList');

    // إظهار النافذة
    document.getElementById('lessonFocusMode').style.display = 'block';
    showStage('intro');
}

function renderIntro() {
    const container = document.getElementById('introContent');
    const intro = currentLessonContent.intro || {};
    container.innerHTML = '';
    
    if(intro.text) container.innerHTML += `<div class="alert alert-info">${intro.text}</div>`;
    
    if (intro.type === 'video' && intro.url) {
        let videoId = intro.url.split('v=')[1];
        if (!videoId && intro.url.includes('youtu.be')) videoId = intro.url.split('/').pop();
        const embed = videoId ? `https://www.youtube.com/embed/${videoId}` : intro.url;
        container.innerHTML += `<iframe width="100%" height="350" src="${embed}" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>`;
    } else if (intro.type === 'image') {
        container.innerHTML += `<img src="${intro.url}" style="max-width:100%; border-radius:8px;">`;
    }
}

function showStage(stage) {
    document.querySelectorAll('.lesson-stage').forEach(s => s.classList.remove('active'));
    document.getElementById('stage-'+stage).classList.add('active');
    
    // تحديث الخطوات
    const steps = ['intro', 'exercises', 'assessment'];
    const currentIdx = steps.indexOf(stage);
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.className = 'progress-step';
        if(idx < currentIdx) el.classList.add('completed');
        if(idx === currentIdx) el.classList.add('active');
    });
}

function submitExercises() {
    // محاكاة تصحيح (نفترض النجاح للتجربة)
    alert('أحسنت! تم اجتياز التمارين.');
    showStage('assessment');
}

function submitAssessment() {
    alert('🎉 مبروك! تم إكمال الدرس.');
    
    // تحديث الحالة في LocalStorage
    const all = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = all.findIndex(l => l.id == currentAssignmentId);
    if(idx !== -1) {
        all[idx].status = 'completed';
        all[idx].completedDate = new Date().toISOString();
        localStorage.setItem('studentLessons', JSON.stringify(all));
    }
    
    closeLessonMode();
    loadStudentLessons(); // تحديث القائمة لفتح الدرس التالي
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
}

function renderQuestions(questions, containerId) {
    const box = document.getElementById(containerId);
    if(!questions || !questions.length) {
        box.innerHTML = '<p>لا توجد أسئلة.</p>';
        return;
    }
    box.innerHTML = questions.map((q, i) => `
        <div style="background:#f8f9fa; padding:15px; margin-bottom:10px; border-radius:8px;">
            <strong>س${i+1}: ${q.text}</strong>
            <input type="text" class="form-control" style="margin-top:5px;" placeholder="الإجابة...">
        </div>
    `).join('');
}

function injectLessonModalHTML() {
    if(document.getElementById('lessonFocusMode')) return;
    
    const html = `
    <div id="lessonFocusMode" class="lesson-focus-mode">
        <div class="focus-header">
            <div style="display:flex; align-items:center;">
                <button onclick="closeLessonMode()" class="btn btn-outline-danger btn-sm" style="margin-left:15px;">خروج ✕</button>
                <h3 id="lessonFocusTitle" style="margin:0">عنوان الدرس</h3>
            </div>
            <div style="display:flex;">
                <div class="progress-step">1. شرح</div>
                <div class="progress-step">2. تمارين</div>
                <div class="progress-step">3. تقييم</div>
            </div>
        </div>
        
        <div style="max-width:800px; margin:20px auto; padding:20px;">
            <div id="stage-intro" class="lesson-stage">
                <div id="introContent"></div>
                <button class="btn btn-primary btn-block mt-3" onclick="showStage('exercises')">التالي: التمارين</button>
            </div>
            <div id="stage-exercises" class="lesson-stage">
                <div class="alert alert-warning">يجب حل التمارين لاجتياز المحك: <span id="reqScore"></span>%</div>
                <div id="exercisesList"></div>
                <button class="btn btn-success btn-block mt-3" onclick="submitExercises()">تسليم</button>
            </div>
            <div id="stage-assessment" class="lesson-stage">
                <div class="alert alert-success">التقييم النهائي</div>
                <div id="assessmentList"></div>
                <button class="btn btn-primary btn-block mt-3" onclick="submitAssessment()">إنهاء الدرس</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

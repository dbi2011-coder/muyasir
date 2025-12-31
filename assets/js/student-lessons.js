// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: إدارة الدروس في واجهة الطالب (إصلاح قراءة بيانات المستخدم المغلفة)
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
    
    // 1. جلب المستخدم الحالي
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') {
            currentStudent = getCurrentUser();
        }
        if (!currentStudent && sessionStorage.getItem('currentUser')) {
            currentStudent = JSON.parse(sessionStorage.getItem('currentUser'));
        }
        if (!currentStudent && localStorage.getItem('currentUser')) {
            currentStudent = JSON.parse(localStorage.getItem('currentUser'));
        }
    } catch (e) { console.error('خطأ في جلب بيانات المستخدم:', e); }

    // ✅ إصلاح جوهري: فك الغلاف إذا كانت البيانات داخل خاصية "user"
    if (currentStudent && currentStudent.user) {
        currentStudent = currentStudent.user;
    }

    // التحقق من وجود المعرف (ID)
    if (!currentStudent || !currentStudent.id) {
        console.log('بيانات المستخدم غير صالحة:', currentStudent);
        container.innerHTML = `
            <div class="alert alert-danger" style="grid-column: 1/-1; text-align:center;">
                <strong>⚠️ تعذر التحقق من هويتك.</strong><br>
                يرجى تسجيل الخروج ثم الدخول مرة أخرى.
            </div>`;
        return;
    }

    // 2. جلب البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    // 3. التصفية ومقارنة المعرفات
    let myLessons = allStudentLessons.filter(l => String(l.studentId) === String(currentStudent.id));

    if (myLessons.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background:#fff; border-radius:10px; border:1px solid #eee;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📚</div>
                <h3>لا توجد دروس مسندة حالياً</h3>
                <p>لم يقم المعلم بإضافة دروس لخطتك بعد.</p>
            </div>`;
        return;
    }

    // 4. الترتيب
    myLessons.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
        const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
        return orderA - orderB || new Date(a.assignedDate) - new Date(b.assignedDate);
    });
    
    container.innerHTML = '';

    // 5. رسم البطاقات
    myLessons.forEach((lessonAssignment, index) => {
        const originalLesson = lessonsLib.find(l => l.id == lessonAssignment.originalLessonId) || { 
            title: lessonAssignment.title, 
            subject: 'عام',
            exercises: { questions: [] }
        };
        
        // منطق القفل
        let isLocked = false;
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed' && lessonAssignment.status !== 'completed') {
                isLocked = true;
            }
        }
        if (lessonAssignment.isManuallyLocked) isLocked = true;

        // العرض
        let cardClass = '';
        let btnHtml = '';
        let statusBadge = '';
        let lockOverlay = '';

        if (lessonAssignment.status === 'completed') {
            cardClass = 'completed';
            statusBadge = '<span class="badge badge-success" style="background:#28a745; color:white;">✅ مكتمل</span>';
            btnHtml = `<button class="btn btn-outline-primary" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">مراجعة الدرس</button>`;
        } else if (isLocked) {
            cardClass = 'locked';
            statusBadge = '<span class="badge badge-secondary" style="background:#6c757d; color:white;">🔒 مقفل</span>';
            lockOverlay = '<div class="lock-overlay"><span style="font-size:2rem; color:#555;">🔒</span></div>';
            btnHtml = `<button class="btn btn-secondary" style="width:100%; background:#ccc;" disabled>${lessonAssignment.isManuallyLocked ? 'مقفل من المعلم' : 'أكمل الدرس السابق'}</button>`;
        } else {
            cardClass = 'active';
            statusBadge = '<span class="badge badge-primary" style="background:#007bff; color:white;">🔓 متاح</span>';
            btnHtml = `<button class="btn btn-success" style="width:100%; background:#28a745;" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">ابدأ الدرس الآن</button>`;
        }

        const html = `
            <div class="test-card ${cardClass}">
                ${lockOverlay}
                <div class="card-header">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:0.85rem; background:#eee; padding:2px 8px; border-radius:4px;">درس ${index + 1}</span>
                        ${statusBadge}
                    </div>
                    <h3>${lessonAssignment.title}</h3>
                </div>
                <div class="card-meta">
                    <span>${originalLesson.subject || 'عام'}</span>
                    <span>${(originalLesson.exercises?.questions?.length) || 0} تمارين</span>
                </div>
                <div style="margin-top:auto;">${btnHtml}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// ... الدوال المساعدة (Modal, Render, Submit) تبقى كما هي ...
// لضمان عملها، سأرفق أهمها هنا بشكل مختصر

function openLessonOverlay(assignmentId, originalLessonId) {
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    currentLessonContent = lessonsLib.find(l => l.id == originalLessonId);
    currentAssignmentId = assignmentId;

    if (!currentLessonContent) { alert('محتوى الدرس غير متوفر.'); return; }

    document.getElementById('lessonFocusTitle').textContent = currentLessonContent.title;
    document.getElementById('reqScore').textContent = currentLessonContent.exercises?.passScore || 50;

    renderIntro();
    renderQuestions((currentLessonContent.exercises?.questions || []), 'exercisesList');
    renderQuestions((currentLessonContent.assessment?.questions || []), 'assessmentList');

    const modal = document.getElementById('lessonFocusMode');
    if(modal) { modal.style.display = 'block'; showStage('intro'); }
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
    loadStudentLessons();
}

function showStage(stageName) {
    document.querySelectorAll('.lesson-stage').forEach(el => el.classList.remove('active'));
    document.getElementById(`stage-${stageName}`).classList.add('active');
    
    const steps = ['intro', 'exercises', 'assessment'];
    const currentIdx = steps.indexOf(stageName);
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.className = 'progress-step';
        if (idx < currentIdx) el.classList.add('completed');
        if (idx === currentIdx) el.classList.add('active');
    });
}

function renderIntro() {
    const container = document.getElementById('introContent');
    const intro = currentLessonContent.intro || {};
    container.innerHTML = '';
    if (intro.text) container.innerHTML += `<div class="alert alert-info">${intro.text}</div>`;
    if (intro.type === 'video' && intro.url) {
        let vid = intro.url.split('v=')[1] || intro.url.split('/').pop();
        container.innerHTML += `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;"><iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" src="https://www.youtube.com/embed/${vid}" frameborder="0"></iframe></div>`;
    } else if (intro.type === 'image' && intro.url) {
        container.innerHTML += `<img src="${intro.url}" style="max-width:100%;">`;
    }
}

function renderQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!questions || !questions.length) { container.innerHTML = '<p>لا توجد أسئلة.</p>'; return; }
    container.innerHTML = questions.map((q, i) => {
        let input = q.type === 'multiple-choice' 
            ? q.choices.map((c, idx) => `<div class="form-check"><input class="form-check-input" type="radio" name="${containerId}_q_${i}" value="${c}"><label>${c}</label></div>`).join('')
            : `<input type="text" class="form-control" name="${containerId}_q_${i}" placeholder="الإجابة...">`;
        return `<div class="question-box" style="margin-bottom:15px; padding:10px; background:#f9f9f9;"><h5>س${i+1}: ${q.text}</h5>${input}</div>`;
    }).join('');
}

function submitExercises() { showStage('assessment'); }

function submitAssessment() {
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = allStudentLessons.findIndex(l => l.id == currentAssignmentId);
    if (idx !== -1) {
        const answers = [];
        const questions = currentLessonContent.assessment?.questions || [];
        questions.forEach((q, i) => {
            const txt = document.querySelector(`input[name="assessmentList_q_${i}"][type="text"]`);
            const rad = document.querySelector(`input[name="assessmentList_q_${i}"]:checked`);
            answers.push({ questionText: q.text, value: txt ? txt.value : (rad ? rad.value : '') });
        });
        allStudentLessons[idx].status = 'completed';
        allStudentLessons[idx].completedDate = new Date().toISOString();
        allStudentLessons[idx].answers = answers;
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        alert('تم الحفظ!');
        closeLessonMode();
    }
}

function injectLessonModalHTML() {
    if (document.getElementById('lessonFocusMode')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div id="lessonFocusMode" class="lesson-focus-mode">
        <div class="focus-header"><h3><span id="lessonFocusTitle"></span></h3><button onclick="closeLessonMode()" class="btn btn-sm btn-danger">X</button></div>
        <div class="lesson-container">
            <div id="stage-intro" class="lesson-stage"><div id="introContent"></div><button class="btn btn-primary btn-block mt-3" onclick="showStage('exercises')">التالي</button></div>
            <div id="stage-exercises" class="lesson-stage"><div class="alert alert-warning">المحك: <span id="reqScore"></span>%</div><div id="exercisesList"></div><button class="btn btn-success btn-block mt-3" onclick="submitExercises()">التالي</button></div>
            <div id="stage-assessment" class="lesson-stage"><div id="assessmentList"></div><button class="btn btn-primary btn-block mt-3" onclick="submitAssessment()">تسليم</button></div>
        </div>
    </div>`);
}

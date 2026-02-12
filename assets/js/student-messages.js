// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: واجهة الطالب (كاملة: عرض، قفل صارم، سجل تاريخي، نوافذ العرض)
// ============================================

let currentAssignmentId = null;
let currentLessonContent = null;

document.addEventListener('DOMContentLoaded', function() {
    // حقن كود النافذة المنبثقة أولاً
    injectLessonModalHTML();
    
    if (document.getElementById('lessonsContainer')) {
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

    // 4. فحص الغياب الذكي وتسجيله قبل العرض
    let dataChanged = false;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const activeLessonIndex = myLessons.findIndex(l => l.status !== 'completed' && l.status !== 'accelerated');
    
    if (activeLessonIndex !== -1) {
        const activeLesson = myLessons[activeLessonIndex];
        if (activeLesson.historyLog && activeLesson.historyLog.length > 0) {
            const lastLogDate = activeLesson.historyLog[activeLesson.historyLog.length - 1].date.split('T')[0];
            if (lastLogDate !== todayStr) {
                const diffDays = Math.floor((new Date() - new Date(lastLogDate)) / (1000 * 60 * 60 * 24));
                if (diffDays > 1) {
                    activeLesson.historyLog.push({
                        date: new Date(Date.now() - 86400000).toISOString(),
                        status: 'absence'
                    });
                    dataChanged = true;
                }
            }
        }
    }

    if (dataChanged) {
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
        
        // منطق القفل الصارم
        let isLocked = false;
        let lockMessage = '';

        if (index === 0) {
            isLocked = false;
        } else {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed' && prevLesson.status !== 'accelerated') {
                isLocked = true;
                lockMessage = `أكمل السابق: ${prevLesson.title}`;
            }
        }

        let cardClass = '';
        let badge = '';
        let btnAction = '';

        if (lesson.status === 'completed') {
            cardClass = 'completed';
            badge = '<span class="badge badge-success">✅ مكتمل</span>';
            btnAction = `<button class="btn btn-outline-primary w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">مراجعة</button>`;
        } else if (lesson.status === 'accelerated') {
            cardClass = 'accelerated';
            badge = '<span class="badge badge-warning" style="background:gold; color:black;">⚡ تم التسريع</span>';
            btnAction = `<button class="btn btn-outline-warning w-100" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId})">مراجعة (تفوق)</button>`;
        } else if (isLocked) {
            cardClass = 'locked';
            badge = '<span class="badge badge-secondary">🔒 مقفل</span>';
            btnAction = `<button class="btn btn-secondary w-100" disabled>${lockMessage}</button>`;
        } else {
            cardClass = 'active';
            badge = '<span class="badge badge-primary">🔓 ابدأ الآن</span>';
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

// دالة تسجيل الدخول (بدأ/تمديد) ثم الفتح
function startAndOpenLesson(assignmentId, originalLessonId) {
    let allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = allStudentLessons.findIndex(l => l.id == assignmentId);
    
    if (idx !== -1) {
        const lesson = allStudentLessons[idx];
        if (!lesson.historyLog) lesson.historyLog = [];
        
        const todayStr = new Date().toISOString();
        const todayDateOnly = todayStr.split('T')[0];
        const hasLogToday = lesson.historyLog.some(log => log.date.startsWith(todayDateOnly));
        
        if (!hasLogToday) {
            const type = lesson.historyLog.length === 0 ? 'started' : 'extension';
            lesson.historyLog.push({ date: todayStr, status: type });
            localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        }
    }
    
    openLessonOverlay(assignmentId, originalLessonId);
}

// ============================================
// دوال العرض والنافذة (تمت كتابتها بالكامل)
// ============================================

function openLessonOverlay(assignmentId, originalLessonId) {
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    currentLessonContent = lessonsLib.find(l => l.id == originalLessonId);
    currentAssignmentId = assignmentId;

    if (!currentLessonContent) {
        alert('عذراً، محتوى هذا الدرس غير متوفر.');
        return;
    }

    const modal = document.getElementById('lessonFocusMode');
    if(modal) {
        document.getElementById('lessonFocusTitle').textContent = currentLessonContent.title;
        const passScore = (currentLessonContent.exercises && currentLessonContent.exercises.passScore) ? currentLessonContent.exercises.passScore : 50;
        const scoreSpan = document.getElementById('reqScore');
        if(scoreSpan) scoreSpan.textContent = passScore;

        renderIntro();
        renderQuestions((currentLessonContent.exercises ? currentLessonContent.exercises.questions : []), 'exercisesList');
        renderQuestions((currentLessonContent.assessment ? currentLessonContent.assessment.questions : []), 'assessmentList');

        modal.style.display = 'block';
        showStage('intro');
    } else {
        console.error('Modal not found');
    }
}

function renderIntro() {
    const container = document.getElementById('introContent');
    const intro = currentLessonContent.intro || {};
    container.innerHTML = '';
    
    if (intro.text) container.innerHTML += `<div class="alert alert-info" style="font-size:1.1rem; line-height:1.6;">${intro.text}</div>`;
    
    if (intro.type === 'video' && intro.url) {
        let videoId = intro.url.split('v=')[1];
        if (!videoId && intro.url.includes('youtu.be')) videoId = intro.url.split('/').pop();
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : intro.url;
        container.innerHTML += `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:10px; margin-top:15px;"><iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
    } else if (intro.type === 'image' && intro.url) {
        container.innerHTML += `<img src="${intro.url}" style="max-width:100%; border-radius:10px; margin-top:15px;">`;
    }
}

function renderQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!questions || questions.length === 0) { container.innerHTML = '<p class="text-muted text-center">لا توجد أسئلة.</p>'; return; }
    
    container.innerHTML = questions.map((q, i) => {
        let inputHtml = '';
        if (q.type === 'multiple-choice') {
            inputHtml = (q.choices || []).map((c, idx) => `
                <div class="form-check" style="margin-bottom:8px; background:white; padding:10px; border-radius:5px; border:1px solid #eee;">
                    <input class="form-check-input" type="radio" name="${containerId}_q_${i}" id="${containerId}_q_${i}_${idx}" value="${c}">
                    <label class="form-check-label" for="${containerId}_q_${i}_${idx}" style="margin-right:10px; width:100%; cursor:pointer;">${c}</label>
                </div>`).join('');
        } else {
            inputHtml = `<input type="text" class="form-control" name="${containerId}_q_${i}" placeholder="الإجابة..." style="padding:10px;">`;
        }
        return `<div class="question-box" style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #ddd;"><h5 style="margin-bottom:15px;"><strong>س${i+1}:</strong> ${q.text}</h5>${inputHtml}</div>`;
    }).join('');
}

function showStage(stageName) {
    document.querySelectorAll('.lesson-stage').forEach(el => el.classList.remove('active'));
    const stage = document.getElementById(`stage-${stageName}`);
    if(stage) stage.classList.add('active');
    
    const steps = ['intro', 'exercises', 'assessment'];
    const currentIdx = steps.indexOf(stageName);
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.className = 'progress-step';
        if (idx < currentIdx) el.classList.add('completed');
        if (idx === currentIdx) el.classList.add('active');
    });
}

function submitExercises() { showStage('assessment'); }

function submitAssessment() {
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = allStudentLessons.findIndex(l => l.id == currentAssignmentId);
    if (idx !== -1) {
        const answers = [];
        const questions = (currentLessonContent.assessment && currentLessonContent.assessment.questions) ? currentLessonContent.assessment.questions : [];
        
        questions.forEach((q, i) => {
            const txt = document.querySelector(`input[name="assessmentList_q_${i}"][type="text"]`);
            const rad = document.querySelector(`input[name="assessmentList_q_${i}"]:checked`);
            let val = '';
            if (txt) val = txt.value;
            if (rad) val = rad.value;
            answers.push({ questionText: q.text, value: val });
        });

        allStudentLessons[idx].status = 'completed';
        allStudentLessons[idx].completedDate = new Date().toISOString();
        
        if (!allStudentLessons[idx].historyLog) allStudentLessons[idx].historyLog = [];
        allStudentLessons[idx].historyLog.push({ date: new Date().toISOString(), status: 'completed' });
        
        allStudentLessons[idx].answers = answers;
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        
        alert('أحسنت! تم إكمال الدرس.');
        closeLessonMode();
    }
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
    loadStudentLessons(); // تحديث القائمة لفتح الدرس التالي
}

function injectLessonModalHTML() {
    if (document.getElementById('lessonFocusMode')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div id="lessonFocusMode" class="lesson-focus-mode">
        <div class="focus-header">
            <h3 style="margin:0;"><span id="lessonFocusTitle">عنوان الدرس</span></h3>
            <div class="lesson-progress-bar"><span class="progress-step">1. الشرح</span><span class="progress-step">2. التمارين</span><span class="progress-step">3. التقييم</span></div>
            <button onclick="closeLessonMode()" class="btn btn-sm btn-danger">خروج ✕</button>
        </div>
        <div class="lesson-container">
            <div id="stage-intro" class="lesson-stage"><div id="introContent"></div><hr style="margin:20px 0;"><button class="btn btn-primary btn-block mt-3" onclick="showStage('exercises')">التالي: التمارين ⬅</button></div>
            <div id="stage-exercises" class="lesson-stage"><div class="alert alert-warning">المحك: <span id="reqScore"></span>%</div><div id="exercisesList"></div><button class="btn btn-success btn-block mt-3" onclick="submitExercises()">التالي: التقييم النهائي ⬅</button></div>
            <div id="stage-assessment" class="lesson-stage"><div class="alert alert-info">التقييم النهائي:</div><div id="assessmentList"></div><button class="btn btn-primary btn-block mt-3" onclick="submitAssessment()">✅ تسليم وإنهاء</button></div>
        </div>
    </div>`);
}

// تصدير الدوال
window.openLessonOverlay = openLessonOverlay;
window.startAndOpenLesson = startAndOpenLesson;
window.submitAssessment = submitAssessment;
window.submitExercises = submitExercises;
window.closeLessonMode = closeLessonMode;
window.showStage = showStage;

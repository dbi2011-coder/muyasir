// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: إدارة الدروس المتسلسلة (حفظ الإجابات + ترتيب بالأسهم)
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
    
    // التحقق من المستخدم
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') currentStudent = getCurrentUser();
        if (!currentStudent && sessionStorage.getItem('currentUser')) {
            currentStudent = JSON.parse(sessionStorage.getItem('currentUser')).user;
        }
    } catch (e) {}

    if (!currentStudent || !currentStudent.id) {
        container.innerHTML = '<div class="alert alert-danger">يرجى تسجيل الدخول</div>';
        return;
    }

    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);

    if (myLessons.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>لا توجد دروس مسندة</h3></div>';
        return;
    }

    // الترتيب: الاعتماد على orderIndex (الذي تحدده الأسهم)
    myLessons.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
        const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
        return orderA - orderB || new Date(a.assignedDate) - new Date(b.assignedDate);
    });
    
    container.innerHTML = '';

    myLessons.forEach((lessonAssignment, index) => {
        const originalLesson = lessonsLib.find(l => l.id == lessonAssignment.originalLessonId) || {};
        
        // --- منطق القفل ---
        let isLocked = false;
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed' && lessonAssignment.status !== 'completed') {
                isLocked = true;
            }
        }
        if (lessonAssignment.isManuallyLocked) {
            isLocked = true;
        }

        // --- العرض ---
        let cardClass = '';
        let btnHtml = '';
        let statusBadge = '';
        let lockOverlay = '';

        if (lessonAssignment.status === 'completed') {
            cardClass = 'completed';
            statusBadge = '<span class="badge badge-success">✅ مكتمل</span>';
            btnHtml = `<button class="btn btn-outline-primary" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">مراجعة الدرس</button>`;
        } else if (isLocked) {
            cardClass = 'locked';
            statusBadge = '<span class="badge badge-secondary">🔒 مقفل</span>';
            lockOverlay = '<div class="lock-overlay"><span style="font-size:2rem; color:#666;">🔒</span></div>';
            btnHtml = `<button class="btn btn-secondary" style="width:100%" disabled>${lessonAssignment.isManuallyLocked ? 'مقفل من المعلم' : 'أكمل السابق'}</button>`;
        } else {
            cardClass = 'active';
            statusBadge = '<span class="badge badge-primary">🔓 متاح للدراسة</span>';
            btnHtml = `<button class="btn btn-success" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">ابدأ الدرس الآن</button>`;
        }

        const html = `
            <div class="test-card ${cardClass}">
                ${lockOverlay}
                <div class="card-header">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="font-size:0.85rem; background:#eee; padding:2px 8px; border-radius:4px;">درس ${index + 1}</span>
                        ${statusBadge}
                    </div>
                    <h3>${lessonAssignment.title}</h3>
                </div>
                <div class="card-meta">
                    <span>${originalLesson.subject || 'عام'}</span>
                    <span>${originalLesson.exercises?.questions?.length || 0} تمارين</span>
                </div>
                <div style="margin-top:auto;">${btnHtml}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function openLessonOverlay(assignmentId, originalLessonId) {
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    currentLessonContent = lessonsLib.find(l => l.id == originalLessonId);
    currentAssignmentId = assignmentId;

    if (!currentLessonContent) return;

    document.getElementById('lessonFocusTitle').textContent = currentLessonContent.title;
    document.getElementById('reqScore').textContent = currentLessonContent.exercises?.passScore || 50;

    renderIntro();
    renderQuestions(currentLessonContent.exercises?.questions || [], 'exercisesList');
    renderQuestions(currentLessonContent.assessment?.questions || [], 'assessmentList');

    const modal = document.getElementById('lessonFocusMode');
    if(modal) {
        modal.style.display = 'block';
        showStage('intro');
    }
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
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
        let videoId = intro.url.split('v=')[1];
        if (!videoId && intro.url.includes('youtu.be')) videoId = intro.url.split('/').pop();
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : intro.url;
        container.innerHTML += `<iframe width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>`;
    } else if (intro.type === 'image') {
        container.innerHTML += `<img src="${intro.url}" style="max-width:100%;">`;
    }
}

function renderQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!questions || questions.length === 0) { container.innerHTML = '<p>لا توجد أسئلة.</p>'; return; }
    container.innerHTML = questions.map((q, i) => {
        let inputHtml = '';
        if (q.type === 'multiple-choice') {
            inputHtml = (q.choices || []).map((c, idx) => `
                <div class="form-check"><input class="form-check-input" type="radio" name="${containerId}_q_${i}" value="${c}"><label>${c}</label></div>
            `).join('');
        } else {
            inputHtml = `<input type="text" class="form-control" name="${containerId}_q_${i}">`;
        }
        return `<div class="question-box"><h5>س${i+1}: ${q.text}</h5>${inputHtml}</div>`;
    }).join('');
}

function submitExercises() {
    showStage('assessment');
}

// ✅ دالة التقييم: تجمع الإجابات وتحفظها
function submitAssessment() {
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonIndex = allStudentLessons.findIndex(l => l.id == currentAssignmentId);

    if (lessonIndex !== -1) {
        const collectedAnswers = [];
        const questions = currentLessonContent.assessment?.questions || [];
        
        questions.forEach((q, i) => {
            let val = '';
            const textInput = document.querySelector(`input[name="assessmentList_q_${i}"][type="text"]`);
            const radioInput = document.querySelector(`input[name="assessmentList_q_${i}"]:checked`);
            if (textInput) val = textInput.value;
            if (radioInput) val = radioInput.value;
            
            collectedAnswers.push({
                questionText: q.text,
                value: val
            });
        });

        allStudentLessons[lessonIndex].status = 'completed';
        allStudentLessons[lessonIndex].completedDate = new Date().toISOString(); 
        allStudentLessons[lessonIndex].answers = collectedAnswers; 
        
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        
        alert('🎉 مبروك! تم إكمال الدرس وحفظ الإجابات.');
        closeLessonMode();
        loadStudentLessons(); 
    }
}

function injectLessonModalHTML() {
    if (document.getElementById('lessonFocusMode')) return;
    const modalHTML = `
    <div id="lessonFocusMode" class="lesson-focus-mode">
        <div class="focus-header">
            <h3>عنوان الدرس</h3>
            <button onclick="closeLessonMode()" class="btn btn-sm btn-danger">خروج</button>
            <div class="lesson-progress-bar"><span class="progress-step">1</span><span class="progress-step">2</span><span class="progress-step">3</span></div>
        </div>
        <div class="lesson-container">
            <div id="stage-intro" class="lesson-stage"><div id="introContent"></div><button class="btn btn-primary btn-block mt-3" onclick="showStage('exercises')">التالي</button></div>
            <div id="stage-exercises" class="lesson-stage">
                <div class="alert alert-warning">المحك: <span id="reqScore"></span>%</div>
                <div id="exercisesList"></div>
                <button class="btn btn-success btn-block mt-3" onclick="submitExercises()">التالي</button>
            </div>
            <div id="stage-assessment" class="lesson-stage">
                <div class="alert alert-info">التقييم النهائي</div>
                <div id="assessmentList"></div>
                <button class="btn btn-primary btn-block mt-3" onclick="submitAssessment()">إنهاء وحفظ</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

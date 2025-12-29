// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: إدارة الدروس المتسلسلة (مصحح)
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
        if (typeof getCurrentUser === 'function') {
            currentStudent = getCurrentUser();
        } 
        if (!currentStudent || !currentStudent.id) {
            const stored = sessionStorage.getItem('currentUser');
            if (stored) currentStudent = JSON.parse(stored).user;
        }
    } catch (e) { console.error(e); }

    if (!currentStudent || !currentStudent.id) {
        container.innerHTML = `
            <div class="alert alert-danger" style="grid-column: 1/-1; text-align: center; padding: 30px;">
                <h3>⚠️ خطأ في الجلسة</h3>
                <p>لم نتمكن من التحقق من هويتك. يرجى تسجيل الخروج والدخول مجدداً.</p>
                <button onclick="logout()" class="btn btn-outline-danger">تسجيل الخروج</button>
            </div>`;
        return;
    }

    if(document.getElementById('userName')) document.getElementById('userName').textContent = currentStudent.name;

    // 2. جلب البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');

    // 3. الفلترة
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);

    if (myLessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <div style="font-size: 3rem;">📭</div>
                <h3>لا توجد دروس مسندة</h3>
                <p>لم يقم المعلم بإضافة دروس لخطتك التعليمية بعد.</p>
            </div>`;
        return;
    }

    // الترتيب
    myLessons.sort((a, b) => new Date(a.assignedDate || 0) - new Date(b.assignedDate || 0) || a.id - b.id);
    
    container.innerHTML = '';

    // 4. رسم البطاقات
    myLessons.forEach((lessonAssignment, index) => {
        const originalLesson = lessonsLib.find(l => l.id == lessonAssignment.originalLessonId) || {};
        
        // القفل
        let isLocked = false;
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed' && lessonAssignment.status !== 'completed') {
                isLocked = true;
            }
        }

        let cardClass = '';
        let btnHtml = '';
        let statusBadge = '';
        let lockOverlay = '';

        if (lessonAssignment.status === 'completed') {
            cardClass = 'completed';
            statusBadge = '<span class="badge badge-success" style="background:#d4edda; color:#155724; padding:5px 10px;">✅ مكتمل</span>';
            btnHtml = `<button class="btn btn-outline-primary" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">مراجعة الدرس</button>`;
        } else if (isLocked) {
            cardClass = 'locked';
            statusBadge = '<span class="badge badge-secondary" style="background:#e2e3e5; color:#383d41; padding:5px 10px;">🔒 مقفل</span>';
            lockOverlay = '<div class="lock-overlay"><span style="font-size:2rem; color:#666;">🔒</span></div>';
            btnHtml = `<button class="btn btn-secondary" style="width:100%" disabled>يجب إكمال السابق</button>`;
        } else {
            cardClass = 'active';
            statusBadge = '<span class="badge badge-primary" style="background:#cce5ff; color:#004085; padding:5px 10px;">🔓 متاح للدراسة</span>';
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

// ---------------------------------------------------------
// منطق النافذة المنبثقة
// ---------------------------------------------------------
function openLessonOverlay(assignmentId, originalLessonId) {
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    currentLessonContent = lessonsLib.find(l => l.id == originalLessonId);
    currentAssignmentId = assignmentId;

    if (!currentLessonContent) {
        alert('عذراً، محتوى هذا الدرس غير موجود.');
        return;
    }

    // تعبئة العناوين
    const titleEl = document.getElementById('lessonFocusTitle');
    if(titleEl) titleEl.textContent = currentLessonContent.title;

    // ✅ التصحيح هنا: التأكد من وجود العنصر قبل تحديثه لتجنب الخطأ
    const scoreEl = document.getElementById('reqScore');
    if(scoreEl) {
        scoreEl.textContent = currentLessonContent.exercises?.passScore || 50;
    }

    // تجهيز المحتوى
    renderIntro();
    renderQuestions(currentLessonContent.exercises?.questions || [], 'exercisesList');
    renderQuestions(currentLessonContent.assessment?.questions || [], 'assessmentList');

    // فتح النافذة
    const modal = document.getElementById('lessonFocusMode');
    if(modal) {
        modal.style.display = 'block';
        showStage('intro');
    }
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
    currentAssignmentId = null;
    currentLessonContent = null;
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

    if (intro.text) container.innerHTML += `<div class="alert alert-info" style="font-size:1.1rem; line-height:1.6;">${intro.text}</div>`;

    if (intro.type === 'video' && intro.url) {
        let videoId = intro.url.split('v=')[1];
        if (!videoId && intro.url.includes('youtu.be')) videoId = intro.url.split('/').pop();
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : intro.url;
        container.innerHTML += `<iframe width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen style="border-radius:10px; margin-top:15px;"></iframe>`;
    } else if (intro.type === 'image') {
        container.innerHTML += `<div style="text-align:center; margin-top:15px;"><img src="${intro.url}" style="max-width:100%; border-radius:10px;"></div>`;
    }
}

function renderQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">لا توجد أسئلة.</p>';
        return;
    }

    container.innerHTML = questions.map((q, i) => {
        let inputHtml = '';
        if (q.type === 'multiple-choice' && q.choices) {
            inputHtml = q.choices.map((c, idx) => `
                <div class="form-check" style="margin-bottom:8px;">
                    <input class="form-check-input" type="radio" name="${containerId}_q_${i}" id="${containerId}_q_${i}_${idx}" value="${idx}">
                    <label class="form-check-label" for="${containerId}_q_${i}_${idx}">${c}</label>
                </div>
            `).join('');
        } else {
            inputHtml = `<input type="text" class="form-control" name="${containerId}_q_${i}" placeholder="اكتب الإجابة...">`;
        }
        return `
            <div style="background:#f8f9fa; border:1px solid #e9ecef; padding:15px; margin-bottom:15px; border-radius:8px;">
                <h5 style="font-size:1rem; font-weight:bold; margin-bottom:10px;">س${i+1}: ${q.text}</h5>
                ${q.mediaUrl ? `<div class="text-center mb-2"><img src="${q.mediaUrl}" style="max-height:150px;"></div>` : ''}
                <div>${inputHtml}</div>
            </div>
        `;
    }).join('');
}

function submitExercises() {
    alert(`أحسنت! انتقل للتقييم النهائي.`);
    showStage('assessment');
}

function submitAssessment() {
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonIndex = allStudentLessons.findIndex(l => l.id == currentAssignmentId);

    if (lessonIndex !== -1) {
        allStudentLessons[lessonIndex].status = 'completed';
        allStudentLessons[lessonIndex].completedDate = new Date().toISOString();
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        
        alert('🎉 مبروك! تم إكمال الدرس بنجاح.');
        closeLessonMode();
        loadStudentLessons(); 
    } else {
        alert('خطأ: لم يتم العثور على الدرس.');
    }
}

// حقن الهيكل (تمت إضافة span id="reqScore" لحل المشكلة)
function injectLessonModalHTML() {
    if (document.getElementById('lessonFocusMode')) return;

    const modalHTML = `
    <div id="lessonFocusMode" class="lesson-focus-mode">
        <div class="focus-header">
            <div style="display:flex; align-items:center; gap:15px;">
                <button onclick="closeLessonMode()" class="btn btn-outline-danger btn-sm">✕ خروج</button>
                <h3 id="lessonFocusTitle" style="margin:0; font-size:1.1rem;">عنوان الدرس</h3>
            </div>
            <div class="lesson-progress-bar">
                <div class="progress-step">1. شرح</div>
                <div class="progress-step">2. تمارين</div>
                <div class="progress-step">3. تقييم</div>
            </div>
        </div>

        <div class="lesson-container">
            <div id="stage-intro" class="lesson-stage">
                <h4 style="margin-bottom:20px; color:#2c3e50;">الشرح والتمهيد</h4>
                <div id="introContent"></div>
                <button class="btn btn-primary btn-block btn-lg mt-4" onclick="showStage('exercises')">التالي: التمارين ⬅</button>
            </div>
            <div id="stage-exercises" class="lesson-stage">
                <div class="alert alert-warning">
                    يجب حل التمارين لاجتياز المحك: <strong><span id="reqScore">50</span>%</strong>
                </div>
                <div id="exercisesList"></div>
                <button class="btn btn-success btn-block btn-lg mt-4" onclick="submitExercises()">تسليم الإجابات</button>
            </div>
            <div id="stage-assessment" class="lesson-stage">
                <div class="alert alert-info">التقييم النهائي</div>
                <div id="assessmentList"></div>
                <button class="btn btn-primary btn-block btn-lg mt-4" onclick="submitAssessment()">إنهاء الدرس</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

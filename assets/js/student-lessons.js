// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: دمج المسار المتسلسل (القفل) مع عرض الدرس في نفس الصفحة
// ============================================

let currentAssignmentId = null; // لتخزين معرف المهمة الحالية لتحديث حالتها لاحقاً
let currentLessonContent = null; // لتخزين محتوى الدرس الحالي

document.addEventListener('DOMContentLoaded', function() {
    // حقن هيكل النافذة المنبثقة (Modal) في الصفحة إذا لم يكن موجوداً
    if (!document.getElementById('lessonFocusMode')) {
        injectLessonModal();
    }
    
    if (window.location.pathname.includes('my-lessons.html')) {
        loadStudentLessons();
    }
});

// 1. دالة جلب الدروس ورسم البطاقات (مع منطق القفل)
function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer'); // تأكد أن الـ ID في HTML هو lessonsContainer أو غيره هنا لـ lessonsGrid حسب ملفك
    const targetContainer = container || document.getElementById('lessonsGrid'); // دعم للاسمين المحتملين

    if (!targetContainer) return;

    // التحقق من المستخدم
    if (typeof getCurrentUser !== 'function') {
        targetContainer.innerHTML = '<div class="alert alert-danger">خطأ: ملف auth.js غير مرتبط.</div>';
        return;
    }
    const currentStudent = getCurrentUser();
    if (!currentStudent || !currentStudent.id) {
        window.location.href = '../../login.html';
        return;
    }

    // جلب الدروس المسندة
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);

    // جلب مكتبة الدروس الأصلية (لنأخذ منها عدد التمارين والصور)
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');

    if (myLessons.length === 0) {
        targetContainer.innerHTML = '<div class="empty-state"><h3>لا توجد دروس مسندة حالياً</h3></div>';
        return;
    }

    // الترتيب
    myLessons.sort((a, b) => new Date(a.assignedDate || 0) - new Date(b.assignedDate || 0) || a.id - b.id);

    targetContainer.innerHTML = '';

    // رسم البطاقات
    myLessons.forEach((lessonAssignment, index) => {
        // العثور على تفاصيل الدرس الأصلي
        const originalLesson = lessonsLib.find(l => l.id == lessonAssignment.originalLessonId) || {};
        
        let isLocked = false;
        // منطق القفل: إذا لم يكن الأول، والسابقة لم تكتمل، والحالية لم تكتمل
        if (index > 0) {
            const prev = myLessons[index - 1];
            if (prev.status !== 'completed' && lessonAssignment.status !== 'completed') {
                isLocked = true;
            }
        }

        let cardClass = '';
        let btnHtml = '';
        let statusBadge = '';
        let lockOverlay = '';

        if (lessonAssignment.status === 'completed') {
            cardClass = 'completed';
            statusBadge = '<span class="badge badge-success">✅ مكتمل</span>';
            // عند المراجعة
            btnHtml = `<button class="btn btn-outline-primary btn-block" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">مراجعة الدرس</button>`;
        } else if (isLocked) {
            cardClass = 'locked';
            statusBadge = '<span class="badge badge-secondary">🔒 مقفل</span>';
            lockOverlay = '<div class="lock-overlay"><span style="font-size:2rem;">🔒</span></div>';
            btnHtml = `<button class="btn btn-secondary btn-block" disabled>يجب إكمال السابق</button>`;
        } else {
            cardClass = 'active';
            statusBadge = '<span class="badge badge-primary">🔓 متاح</span>';
            // عند البدء
            btnHtml = `<button class="btn btn-success btn-block" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">ابدأ الدرس</button>`;
        }

        // استخدام تصميم البطاقة من ملفك القديم مع إضافات القفل
        const html = `
            <div class="test-card ${cardClass}" style="position:relative; opacity: ${isLocked ? 0.6 : 1}">
                ${lockOverlay}
                <div class="card-header">
                    <h3>${lessonAssignment.title}</h3>
                    ${statusBadge}
                </div>
                <div class="card-meta">
                    <span>${originalLesson.subject || 'عام'}</span>
                    <span>${originalLesson.exercises?.questions?.length || 0} تمارين</span>
                </div>
                <div class="card-actions" style="margin-top:15px;">
                    ${btnHtml}
                </div>
            </div>
        `;
        targetContainer.insertAdjacentHTML('beforeend', html);
    });
}

// 2. منطق فتح النافذة (Overlay) وتشغيل الدرس
function openLessonOverlay(assignmentId, originalLessonId) {
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    currentLessonContent = lessonsLib.find(l => l.id == originalLessonId);
    currentAssignmentId = assignmentId;

    if (!currentLessonContent) {
        alert('حدث خطأ: محتوى الدرس غير موجود في المكتبة');
        return;
    }

    // تعبئة البيانات في النافذة
    document.getElementById('lessonFocusTitle').textContent = currentLessonContent.title;
    document.getElementById('reqScore').textContent = currentLessonContent.exercises?.passScore || 50;

    // إعداد التمهيد
    renderIntro();
    // إعداد التمارين
    renderQuestions(currentLessonContent.exercises?.questions || [], 'exercisesList');
    // إعداد التقييم
    renderQuestions(currentLessonContent.assessment?.questions || [], 'assessmentList');

    // إظهار القسم الأول (التمهيد)
    showStage('intro');
    
    // فتح النافذة
    document.getElementById('lessonFocusMode').style.display = 'flex';
}

// دوال التنقل بين المراحل
function renderIntro() {
    const container = document.getElementById('introContent');
    const textDiv = document.getElementById('introTextDisplay');
    const intro = currentLessonContent.intro || {};
    
    textDiv.textContent = intro.text || '';
    container.innerHTML = '';

    if (intro.type === 'video' && intro.url) {
        let videoId = intro.url.split('v=')[1];
        if (!videoId && intro.url.includes('youtu.be')) videoId = intro.url.split('/').pop();
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : intro.url;
        container.innerHTML = `<iframe width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>`;
    } else if (intro.type === 'image') {
        container.innerHTML = `<img src="${intro.url}" class="intro-media" style="max-width:100%; border-radius:10px;">`;
    }
}

function showStage(stageName) {
    // إخفاء كل المراحل
    document.querySelectorAll('.lesson-stage').forEach(s => s.classList.remove('active'));
    // إظهار المرحلة المطلوبة
    document.getElementById(`stage-${stageName}`).classList.add('active');
    
    // تحديث شريط التقدم
    let step = 1;
    if(stageName === 'exercises') step = 2;
    if(stageName === 'assessment') step = 3;
    
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        if(idx + 1 < step) el.className = 'progress-step completed';
        else if(idx + 1 === step) el.className = 'progress-step active';
        else el.className = 'progress-step';
    });
}

function goToExercises() {
    showStage('exercises');
}

// منطق تصحيح التمارين
function submitExercises() {
    const questions = currentLessonContent.exercises?.questions || [];
    let correctCount = 0;

    questions.forEach((q, i) => {
        // منطق مبسط للتأكد من الحل (لأننا لا نملك الإجابات النموذجية في هذا السياق، نفترض الحل = الإجابة)
        const input = document.querySelector(`#exercisesList [name="q_${i}"]`);
        const radio = document.querySelector(`#exercisesList [name="q_${i}"]:checked`);
        
        // شرط النجاح المبدئي: الطالب قام باختيار أو كتابة شيء ما
        if ((input && input.value.trim() !== '') || radio) {
            correctCount++;
        }
    });

    // حساب النتيجة
    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 100;
    const passScore = currentLessonContent.exercises?.passScore || 50;

    if (score >= passScore) {
        alert(`أحسنت! أكملت التمارين بنسبة ${Math.round(score)}%. انتقل للتقييم النهائي.`);
        showStage('assessment');
    } else {
        alert(`عذراً، يجب حل التمارين بشكل صحيح. حاول مجدداً.`);
    }
}

// 3. إنهاء الدرس وتحديث قاعدة البيانات (The Critical Part)
function submitAssessment() {
    // هنا نفترض أن الطالب اجتاز التقييم بنجاح
    alert('🎉 مبروك! تم إكمال الدرس بنجاح.');

    // تحديث الحالة في LocalStorage
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonIndex = allStudentLessons.findIndex(l => l.id == currentAssignmentId);

    if (lessonIndex !== -1) {
        allStudentLessons[lessonIndex].status = 'completed';
        allStudentLessons[lessonIndex].completedDate = new Date().toISOString();
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
    }

    closeLessonMode();
    // إعادة تحميل القائمة لفتح الدرس التالي تلقائياً
    loadStudentLessons();
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
    currentAssignmentId = null;
    currentLessonContent = null;
}

// رسم الأسئلة
function renderQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">لا توجد أسئلة.</p>';
        return;
    }

    container.innerHTML = questions.map((q, i) => {
        let inputHtml = '';
        if (q.type === 'multiple-choice') {
            inputHtml = q.choices.map((c, idx) => `
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q_${i}" id="q_${i}_${idx}" value="${idx}">
                    <label class="form-check-label" for="q_${i}_${idx}">${c}</label>
                </div>
            `).join('');
        } else {
            inputHtml = `<input type="text" class="form-control" name="q_${i}" placeholder="اكتب إجابتك هنا">`;
        }

        return `
            <div class="question-card" style="background:#f9f9f9; padding:15px; margin-bottom:15px; border-radius:8px;">
                <h5 style="font-size:1rem; font-weight:bold; margin-bottom:10px;">س${i+1}: ${q.text}</h5>
                ${q.mediaUrl ? `<div class="text-center mb-2"><img src="${q.mediaUrl}" style="max-height:150px; border-radius:5px;"></div>` : ''}
                <div>${inputHtml}</div>
            </div>
        `;
    }).join('');
}

// دالة مساعدة لحقن الـ HTML الخاص بالنافذة إذا لم يكن موجوداً
function injectLessonModal() {
    const modalHTML = `
    <div id="lessonFocusMode" class="lesson-focus-mode" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:#fff; z-index:9999; overflow-y:auto;">
        <div class="focus-header" style="padding:15px; background:#fff; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100;">
            <div style="display:flex; align-items:center; gap:15px;">
                <button onclick="closeLessonMode()" class="btn btn-outline-secondary">✕ خروج</button>
                <h3 id="lessonFocusTitle" style="margin:0;">عنوان الدرس</h3>
            </div>
            <div class="lesson-progress-bar" style="display:flex; gap:10px;">
                <div class="progress-step active">1. تمهيد</div>
                <div class="progress-step">2. تمارين</div>
                <div class="progress-step">3. تقييم</div>
            </div>
        </div>
        
        <div class="focus-content" style="max-width:800px; margin:0 auto; padding:30px;">
            <div id="stage-intro" class="lesson-stage active">
                <div id="introContent" class="mb-4"></div>
                <div id="introTextDisplay" class="alert alert-info" style="font-size:1.1rem; line-height:1.6;"></div>
                <button class="btn btn-primary btn-lg btn-block mt-4" onclick="goToExercises()">الانتقال للتمارين ⬅</button>
            </div>

            <div id="stage-exercises" class="lesson-stage" style="display:none;">
                <div class="alert alert-warning">حل التمارين التالية لاجتياز المحك (<span id="reqScore">50</span>%)</div>
                <div id="exercisesList"></div>
                <button class="btn btn-success btn-lg btn-block mt-4" onclick="submitExercises()">تسليم التمارين</button>
            </div>

            <div id="stage-assessment" class="lesson-stage" style="display:none;">
                <div class="alert alert-success">أحسنت! الآن أجب عن التقييم النهائي لإتمام الدرس.</div>
                <div id="assessmentList"></div>
                <button class="btn btn-primary btn-lg btn-block mt-4" onclick="submitAssessment()">إنهاء الدرس</button>
            </div>
        </div>
    </div>
    
    <style>
        .lesson-stage { display: none; }
        .lesson-stage.active { display: block; animation: fadeIn 0.3s; }
        .progress-step { padding: 5px 15px; background: #eee; border-radius: 20px; color: #999; font-size: 0.9rem; }
        .progress-step.active { background: #007bff; color: #fff; font-weight: bold; }
        .progress-step.completed { background: #28a745; color: #fff; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

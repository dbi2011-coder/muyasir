// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: إدارة الدروس المتسلسلة + عرض المحتوى في نافذة منبثقة
// ============================================

let currentAssignmentId = null; // رقم المهمة الحالية (للتحديث)
let currentLessonContent = null; // محتوى الدرس الحالي (للعرض)

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من أننا في صفحة الدروس
    if (window.location.pathname.includes('my-lessons.html')) {
        // حقن هيكل النافذة أولاً ليكون جاهزاً
        injectLessonModalHTML();
        // ثم تحميل الدروس
        loadStudentLessons();
    }
});

// ---------------------------------------------------------
// 1. منطق تحميل البطاقات والقفل (Grid & Locking Logic)
// ---------------------------------------------------------
function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    
    // التحقق من المستخدم
    if (typeof getCurrentUser !== 'function') { return; }
    const currentStudent = getCurrentUser();
    if (!currentStudent || !currentStudent.id) { 
        // في حالة عدم التسجيل نعرض رسالة خطأ بدلاً من التوجيه الخاطئ
        container.innerHTML = '<div class="alert alert-danger">يرجى تسجيل الدخول</div>';
        return; 
    }

    // جلب البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    // فلترة دروس هذا الطالب
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);
    // جلب مكتبة المحتوى الأصلية (للعناوين والصور)
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');

    if (myLessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <div style="font-size: 3rem;">📭</div>
                <h3>لا توجد دروس حالياً</h3>
                <p>لم يتم تعيين دروس لك بعد.</p>
            </div>`;
        return;
    }

    // ترتيب الدروس (الأقدم أولاً) لضمان التسلسل
    myLessons.sort((a, b) => new Date(a.assignedDate || 0) - new Date(b.assignedDate || 0) || a.id - b.id);
    
    container.innerHTML = '';

    // رسم البطاقات
    myLessons.forEach((lessonAssignment, index) => {
        // البحث عن محتوى الدرس الأصلي
        const originalLesson = lessonsLib.find(l => l.id == lessonAssignment.originalLessonId) || {};
        
        // --- حساب القفل ---
        let isLocked = false;
        // القاعدة: إذا لم يكن الدرس الأول، والدرس السابق لم يكتمل، والدرس الحالي لم يكتمل --> اقفل
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed' && lessonAssignment.status !== 'completed') {
                isLocked = true;
            }
        }

        // --- تحديد المظهر ---
        let cardClass = '';
        let btnHtml = '';
        let statusBadge = '';
        let lockIcon = '';

        if (lessonAssignment.status === 'completed') {
            // حالة: مكتمل
            cardClass = 'completed';
            statusBadge = '<span class="badge badge-success" style="color:#28a745; font-weight:bold;">✅ مكتمل</span>';
            // زر المراجعة
            btnHtml = `<button class="btn btn-outline-primary" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">مراجعة الدرس</button>`;
        } else if (isLocked) {
            // حالة: مقفل
            cardClass = 'locked';
            statusBadge = '<span class="badge badge-secondary">🔒 مقفل</span>';
            lockIcon = '<div class="lock-overlay"><span style="font-size:2rem; color:#666;">🔒</span></div>';
            btnHtml = `<button class="btn btn-secondary" style="width:100%" disabled>أكمل الدرس السابق</button>`;
        } else {
            // حالة: متاح (الدرس الحالي)
            cardClass = 'active';
            statusBadge = '<span class="badge badge-primary" style="color:#007bff; font-weight:bold;">🔓 متاح للدراسة</span>';
            // زر البدء
            btnHtml = `<button class="btn btn-success" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">ابدأ الدرس الآن</button>`;
        }

        const html = `
            <div class="test-card ${cardClass}">
                ${lockIcon}
                <div class="card-header">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
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
// 2. منطق النافذة المنبثقة (Overlay Logic)
// ---------------------------------------------------------
function openLessonOverlay(assignmentId, originalLessonId) {
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    currentLessonContent = lessonsLib.find(l => l.id == originalLessonId);
    currentAssignmentId = assignmentId;

    if (!currentLessonContent) {
        alert('حدث خطأ: محتوى الدرس غير موجود.');
        return;
    }

    // تعبئة العناوين
    document.getElementById('lessonFocusTitle').textContent = currentLessonContent.title;
    const passScore = currentLessonContent.exercises?.passScore || 50;
    document.getElementById('reqScore').textContent = passScore;

    // تجهيز المحتوى (التمهيد والأسئلة)
    renderIntro();
    renderQuestions(currentLessonContent.exercises?.questions || [], 'exercisesList');
    renderQuestions(currentLessonContent.assessment?.questions || [], 'assessmentList');

    // إظهار النافذة والبدء بالمرحلة الأولى
    document.getElementById('lessonFocusMode').style.display = 'block';
    showStage('intro');
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
    currentAssignmentId = null;
    currentLessonContent = null;
}

// التنقل بين المراحل
function showStage(stageName) {
    // إخفاء الكل
    document.querySelectorAll('.lesson-stage').forEach(el => el.classList.remove('active'));
    // إظهار المطلوب
    const target = document.getElementById(`stage-${stageName}`);
    if (target) target.classList.add('active');

    // تحديث الشريط العلوي (Progress Bar)
    const steps = ['intro', 'exercises', 'assessment'];
    const currentIdx = steps.indexOf(stageName);
    
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.className = 'progress-step'; // reset
        if (idx < currentIdx) el.classList.add('completed');
        if (idx === currentIdx) el.classList.add('active');
    });
}

// عرض التمهيد
function renderIntro() {
    const container = document.getElementById('introContent');
    const intro = currentLessonContent.intro || {};
    container.innerHTML = '';

    // عرض النص
    if (intro.text) {
        container.innerHTML += `<div class="alert alert-info" style="font-size:1.1rem; line-height:1.6;">${intro.text}</div>`;
    }

    // عرض الميديا (فيديو/صورة)
    if (intro.type === 'video' && intro.url) {
        let videoId = intro.url.split('v=')[1];
        if (!videoId && intro.url.includes('youtu.be')) videoId = intro.url.split('/').pop();
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : intro.url;
        container.innerHTML += `<iframe width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen style="border-radius:10px; margin-top:15px;"></iframe>`;
    } else if (intro.type === 'image') {
        container.innerHTML += `<div style="text-align:center; margin-top:15px;"><img src="${intro.url}" style="max-width:100%; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></div>`;
    }
}

// عرض الأسئلة
function renderQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">لا توجد أسئلة لهذه المرحلة.</p>';
        return;
    }

    container.innerHTML = questions.map((q, i) => {
        let inputHtml = '';
        if (q.type === 'multiple-choice') {
            inputHtml = q.choices.map((c, idx) => `
                <div class="form-check" style="margin-bottom:8px;">
                    <input class="form-check-input" type="radio" name="${containerId}_q_${i}" id="${containerId}_q_${i}_${idx}" value="${idx}">
                    <label class="form-check-label" for="${containerId}_q_${i}_${idx}" style="cursor:pointer;">${c}</label>
                </div>
            `).join('');
        } else {
            inputHtml = `<input type="text" class="form-control" name="${containerId}_q_${i}" placeholder="اكتب إجابتك هنا...">`;
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

// تسليم التمارين
function submitExercises() {
    const questions = currentLessonContent.exercises?.questions || [];
    let correctCount = 0;

    // تصحيح بسيط (افتراض أن أي إجابة تعتبر محاولة صحيحة لغرض التجربة)
    questions.forEach((q, i) => {
        const input = document.querySelector(`[name="exercisesList_q_${i}"]`);
        const radio = document.querySelector(`[name="exercisesList_q_${i}"]:checked`);
        if ((input && input.value) || radio) correctCount++;
    });

    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 100;
    const passScore = currentLessonContent.exercises?.passScore || 50;

    if (score >= passScore) {
        alert(`أحسنت! درجتك ${Math.round(score)}%. يمكنك الانتقال للتقييم النهائي.`);
        showStage('assessment');
    } else {
        alert(`يجب عليك حل جميع التمارين. درجتك الحالية: ${Math.round(score)}%`);
    }
}

// تسليم التقييم وإنهاء الدرس (أهم دالة)
function submitAssessment() {
    // تحديث الحالة في قاعدة البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonIndex = allStudentLessons.findIndex(l => l.id == currentAssignmentId);

    if (lessonIndex !== -1) {
        allStudentLessons[lessonIndex].status = 'completed';
        allStudentLessons[lessonIndex].completedDate = new Date().toISOString();
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        
        alert('🎉 مبروك! تم إكمال الدرس بنجاح.');
        closeLessonMode();
        loadStudentLessons(); // إعادة تحميل القائمة لفتح القفل عن الدرس التالي
    } else {
        alert('حدث خطأ أثناء الحفظ');
    }
}

// ---------------------------------------------------------
// 3. دالة مساعدة لحقن HTML النافذة في الصفحة
// ---------------------------------------------------------
function injectLessonModalHTML() {
    if (document.getElementById('lessonFocusMode')) return;

    const modalHTML = `
    <div id="lessonFocusMode" class="lesson-focus-mode">
        <div class="focus-header">
            <div style="display:flex; align-items:center; gap:15px;">
                <button onclick="closeLessonMode()" class="btn btn-outline-danger btn-sm">✕ خروج</button>
                <h3 id="lessonFocusTitle" style="margin:0; font-size:1.2rem;">عنوان الدرس</h3>
            </div>
            <div class="lesson-progress-bar">
                <div class="progress-step">1. تمهيد</div>
                <div class="progress-step">2. تمارين</div>
                <div class="progress-step">3. تقييم</div>
            </div>
        </div>

        <div class="lesson-container">
            <div id="stage-intro" class="lesson-stage">
                <h4 style="border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:20px;">التمهيد والشرح</h4>
                <div id="introContent"></div>
                <button class="btn btn-primary btn-block btn-lg mt-4" onclick="showStage('exercises')">التالي: التمارين ⬅</button>
            </div>

            <div id="stage-exercises" class="lesson-stage">
                <div class="alert alert-warning">
                    يجب حل التمارين لاجتياز المحك المطلوب: <strong><span id="reqScore">50</span>%</strong>
                </div>
                <div id="exercisesList"></div>
                <button class="btn btn-success btn-block btn-lg mt-4" onclick="submitExercises()">تحقق من الإجابات</button>
            </div>

            <div id="stage-assessment" class="lesson-stage">
                <div class="alert alert-success">
                    أحسنت في التمارين! الآن أجب عن التقييم النهائي لإتمام الدرس.
                </div>
                <div id="assessmentList"></div>
                <button class="btn btn-primary btn-block btn-lg mt-4" onclick="submitAssessment()">إنهاء الدرس وحفظ النتيجة</button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

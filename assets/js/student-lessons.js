// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: إدارة الدروس في واجهة الطالب (إصلاح عدم الظهور + ترتيب + حفظ)
// ============================================

let currentAssignmentId = null;
let currentLessonContent = null;

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من أننا في صفحة الدروس
    if (document.getElementById('lessonsContainer')) {
        injectLessonModalHTML();
        loadStudentLessons();
    }
});

function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    
    // 1. التحقق من المستخدم المسجل
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') currentStudent = getCurrentUser();
        // محاولة بديلة إذا لم تكن الدالة موجودة
        if (!currentStudent && sessionStorage.getItem('currentUser')) {
            currentStudent = JSON.parse(sessionStorage.getItem('currentUser')).user;
        }
    } catch (e) { console.error('Error fetching user:', e); }

    if (!currentStudent || !currentStudent.id) {
        container.innerHTML = '<div class="alert alert-danger">يرجى تسجيل الدخول لعرض الدروس.</div>';
        return;
    }

    // 2. جلب البيانات
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    // 3. التصفية (استخدام == بدلاً من === لضمان تطابق الأرقام والنصوص)
    let myLessons = allStudentLessons.filter(l => l.studentId == currentStudent.id);

    if (myLessons.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📚</div>
                <h3>لا توجد دروس مسندة حالياً</h3>
                <p>سيقوم المعلم بإضافة الدروس إلى قائمتك قريباً.</p>
            </div>`;
        return;
    }

    // 4. الترتيب حسب ترتيب المعلم (orderIndex)
    myLessons.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
        const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
        return orderA - orderB || new Date(a.assignedDate) - new Date(b.assignedDate);
    });
    
    container.innerHTML = '';

    // 5. رسم البطاقات
    myLessons.forEach((lessonAssignment, index) => {
        // جلب تفاصيل الدرس الأصلي (الأسئلة والمحتوى)
        const originalLesson = lessonsLib.find(l => l.id == lessonAssignment.originalLessonId) || {};
        
        // --- منطق القفل ---
        let isLocked = false;
        
        // القفل التسلسلي (يجب إنهاء الدرس السابق)
        if (index > 0) {
            const prevLesson = myLessons[index - 1];
            if (prevLesson.status !== 'completed' && lessonAssignment.status !== 'completed') {
                isLocked = true;
            }
        }

        // القفل اليدوي من المعلم
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
            statusBadge = '<span class="badge badge-success" style="background:#28a745; color:white; padding:3px 8px; border-radius:10px;">✅ مكتمل</span>';
            btnHtml = `<button class="btn btn-outline-primary" style="width:100%" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">مراجعة الدرس</button>`;
        } else if (isLocked) {
            cardClass = 'locked';
            statusBadge = '<span class="badge badge-secondary" style="background:#6c757d; color:white; padding:3px 8px; border-radius:10px;">🔒 مقفل</span>';
            lockOverlay = '<div class="lock-overlay"><span style="font-size:2rem; color:#555;">🔒</span></div>';
            btnHtml = `<button class="btn btn-secondary" style="width:100%; background:#ccc; border:none;" disabled>${lessonAssignment.isManuallyLocked ? 'مقفل من المعلم' : 'أكمل الدرس السابق'}</button>`;
        } else {
            cardClass = 'active';
            statusBadge = '<span class="badge badge-primary" style="background:#007bff; color:white; padding:3px 8px; border-radius:10px;">🔓 متاح</span>';
            btnHtml = `<button class="btn btn-success" style="width:100%; background:#28a745; border:none;" onclick="openLessonOverlay(${lessonAssignment.id}, ${lessonAssignment.originalLessonId})">ابدأ الدرس الآن</button>`;
        }

        const html = `
            <div class="test-card ${cardClass}">
                ${lockOverlay}
                <div class="card-header">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
                        <span style="font-size:0.85rem; background:#eee; padding:2px 8px; border-radius:4px; color:#555;">درس ${index + 1}</span>
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

    if (!currentLessonContent) {
        alert('حدث خطأ: محتوى الدرس غير موجود في المكتبة.');
        return;
    }

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
    loadStudentLessons(); // تحديث القائمة عند الخروج
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
        container.innerHTML += `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:10px;"><iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
    } else if (intro.type === 'image' && intro.url) {
        container.innerHTML += `<img src="${intro.url}" style="max-width:100%; border-radius:10px; margin-top:10px;">`;
    } else if (intro.type === 'link' && intro.url) {
        container.innerHTML += `<a href="${intro.url}" target="_blank" class="btn btn-outline-primary mt-2">🔗 فتح الرابط الخارجي</a>`;
    }
}

function renderQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!questions || questions.length === 0) { container.innerHTML = '<p class="text-muted">لا توجد أسئلة في هذا القسم.</p>'; return; }
    
    container.innerHTML = questions.map((q, i) => {
        let inputHtml = '';
        if (q.type === 'multiple-choice') {
            inputHtml = (q.choices || []).map((c, idx) => `
                <div class="form-check" style="margin-bottom:5px;">
                    <input class="form-check-input" type="radio" name="${containerId}_q_${i}" id="${containerId}_q_${i}_${idx}" value="${c}">
                    <label class="form-check-label" for="${containerId}_q_${i}_${idx}">${c}</label>
                </div>
            `).join('');
        } else {
            inputHtml = `<input type="text" class="form-control" name="${containerId}_q_${i}" placeholder="اكتب إجابتك هنا...">`;
        }
        return `
            <div class="question-box" style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #eee;">
                <h5 style="margin-bottom:10px;"><strong>س${i+1}:</strong> ${q.text}</h5>
                ${inputHtml}
            </div>`;
    }).join('');
}

function submitExercises() {
    // يمكن إضافة منطق تصحيح فوري هنا إذا رغبت
    showStage('assessment');
}

// دالة التقييم والحفظ
function submitAssessment() {
    const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lessonIndex = allStudentLessons.findIndex(l => l.id == currentAssignmentId);

    if (lessonIndex !== -1) {
        // 1. تجميع الإجابات
        const collectedAnswers = [];
        const questions = currentLessonContent.assessment?.questions || [];
        
        questions.forEach((q, i) => {
            let val = '';
            // البحث عن إجابة نصية
            const textInput = document.querySelector(`input[name="assessmentList_q_${i}"][type="text"]`);
            // البحث عن إجابة اختيار
            const radioInput = document.querySelector(`input[name="assessmentList_q_${i}"]:checked`);
            
            if (textInput) val = textInput.value;
            if (radioInput) val = radioInput.value;
            
            collectedAnswers.push({
                questionText: q.text,
                value: val
            });
        });

        // 2. الحفظ
        allStudentLessons[lessonIndex].status = 'completed';
        allStudentLessons[lessonIndex].completedDate = new Date().toISOString(); 
        allStudentLessons[lessonIndex].answers = collectedAnswers; 
        
        localStorage.setItem('studentLessons', JSON.stringify(allStudentLessons));
        
        alert('🎉 أحسنت! تم إكمال الدرس وحفظ الإجابات.');
        closeLessonMode();
        // لا داعي لاستدعاء loadStudentLessons هنا لأن closeLessonMode تستدعيها
    } else {
        alert('خطأ: لم يتم العثور على سجل الدرس.');
    }
}

function injectLessonModalHTML() {
    if (document.getElementById('lessonFocusMode')) return;
    const modalHTML = `
    <div id="lessonFocusMode" class="lesson-focus-mode">
        <div class="focus-header">
            <h3><span id="lessonFocusTitle">عنوان الدرس</span></h3>
            <div class="lesson-progress-bar">
                <span class="progress-step">1. الشرح</span>
                <span class="progress-step">2. التمارين</span>
                <span class="progress-step">3. التقييم</span>
            </div>
            <button onclick="closeLessonMode()" class="btn btn-sm btn-danger">خروج ✕</button>
        </div>
        <div class="lesson-container">
            <div id="stage-intro" class="lesson-stage">
                <div id="introContent"></div>
                <hr>
                <button class="btn btn-primary btn-block mt-3" onclick="showStage('exercises')">التالي: التمارين</button>
            </div>
            <div id="stage-exercises" class="lesson-stage">
                <div class="alert alert-warning">حاول حل التمارين التالية (نسبة الاجتياز: <span id="reqScore"></span>%)</div>
                <div id="exercisesList"></div>
                <button class="btn btn-success btn-block mt-3" onclick="submitExercises()">التالي: التقييم النهائي</button>
            </div>
            <div id="stage-assessment" class="lesson-stage">
                <div class="alert alert-info">أجب على الأسئلة التالية لإنهاء الدرس:</div>
                <div id="assessmentList"></div>
                <button class="btn btn-primary btn-block mt-3" onclick="submitAssessment()">تسليم وإنهاء الدرس</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

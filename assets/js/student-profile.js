// ============================================
// 📁 المسار: assets/js/student-profile.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentData();
});

let currentStudent = null;
let currentIEP = [];
let studentSchedule = []; // أيام الحضور [0, 2, 4] (أحد، ثلاثاء، خميس)

// 1. تحميل البيانات الأساسية
function loadStudentData() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    
    // محاكاة جلب البيانات (استبدلها بالجلب من localStorage الحقيقي)
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    currentStudent = students.find(s => s.id == studentId);

    if (currentStudent) {
        document.getElementById('studentNameHeader').textContent = `ملف الطالب: ${currentStudent.name}`;
        document.getElementById('infoName').textContent = currentStudent.name;
        document.getElementById('infoGrade').textContent = currentStudent.grade || 'غير محدد';
        
        // تحميل الخطة والجدول
        loadStudentSchedule();
        loadIEP();
        renderLearningPath(); // تشغيل نظام الأقفال
        renderProgressTimeline(); // تشغيل سجل الحضور
    }
}

function switchProfileTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ======================================================
// 🧠 المحرك 1: الخطة التربوية الفردية (IEP Engine)
// ======================================================

function generateIEPFromDiagnostic() {
    if(!confirm('سيقوم النظام بتحليل آخر اختبار تشخيصي وبناء الخطة. هل أنت متأكد؟')) return;

    // 1. البحث عن نتائج الاختبار
    // محاكاة: لنفترض أن الطالب أخطأ في الأسئلة المرتبطة بالهدفين (ID: 101, 102)
    // في الواقع ستجلب النتائج من localStorage('exam_results')
    
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    // فلترة أهداف وهمية للمحاكاة (يجب استبدالها بالمنطق الحقيقي لربط الأسئلة الخاطئة بالأهداف)
    const suggestedGoals = allObjectives.slice(0, 3); // نأخذ أول 3 أهداف كمثال

    currentIEP = suggestedGoals.map((goal, index) => ({
        id: Date.now() + index,
        originalGoalId: goal.id,
        shortTermGoal: goal.shortTermGoal,
        instructionalGoals: goal.instructionalGoals || [],
        verificationDate: null // تاريخ التحقق فارغ
    }));

    saveIEP();
    renderIEP();
    alert('تم توليد الخطة بنجاح بناءً على نقاط الاحتياج!');
}

function renderIEP() {
    const container = document.getElementById('iepGoalsContainer');
    container.innerHTML = '';

    if (currentIEP.length === 0) {
        container.innerHTML = '<div class="text-center p-5 text-muted">لا توجد أهداف.</div>';
        return;
    }

    currentIEP.forEach((goal, idx) => {
        // التحقق من الإنجاز
        const isDone = !!goal.verificationDate;
        const dateDisplay = isDone ? `<span class="text-success fw-bold">تم التحقق: ${goal.verificationDate}</span>` : '<span class="text-muted">لم يتحقق بعد</span>';

        const html = `
        <div class="iep-goal-card" draggable="true" ondragstart="drag(event)" ondrop="drop(event)" ondragover="allowDrop(event)" data-index="${idx}">
            <div class="iep-goal-header">
                <div><i class="fas fa-grip-vertical iep-drag-handle"></i> <strong>الهدف ${idx + 1}:</strong> ${goal.shortTermGoal}</div>
                <div>
                    <button class="btn btn-sm btn-light text-danger" onclick="removeGoal(${idx})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="iep-dates-row">
                <i class="fas fa-calendar-check"></i> حالة الإنجاز: ${dateDisplay}
            </div>
            <div class="mt-2 pl-4">
                <small class="text-muted">الأهداف التدريسية:</small>
                <ul class="instructional-goals-list">
                    ${goal.instructionalGoals.map(g => `<li>${g}</li>`).join('')}
                </ul>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// دوال السحب والإفلات (Native Drag & Drop)
let draggedIndex = null;
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { draggedIndex = ev.target.getAttribute('data-index'); }
function drop(ev) {
    ev.preventDefault();
    const targetIndex = ev.target.closest('.iep-goal-card').getAttribute('data-index');
    if (draggedIndex === targetIndex) return;

    // تبديل الأماكن في المصفوفة
    const item = currentIEP.splice(draggedIndex, 1)[0];
    currentIEP.splice(targetIndex, 0, item);
    
    saveIEP();
    renderIEP();
}

function removeGoal(idx) {
    if(confirm('حذف هذا الهدف من الخطة؟')) {
        currentIEP.splice(idx, 1);
        saveIEP();
        renderIEP();
    }
}

function saveIEP() {
    // حفظ في localStorage مرتبط بالطالب
    localStorage.setItem(`iep_${currentStudent.id}`, JSON.stringify(currentIEP));
}

function loadIEP() {
    const data = localStorage.getItem(`iep_${currentStudent.id}`);
    if (data) {
        currentIEP = JSON.parse(data);
        renderIEP();
    }
}

// ======================================================
// 🔐 المحرك 2: مسار التعلم والقفل المتسلسل (Sequential Unlocking)
// ======================================================

function renderLearningPath() {
    const container = document.getElementById('learningPathContainer');
    container.innerHTML = '';

    // سنفترض أن الدروس مرتبطة بالأهداف في الخطة (درس لكل هدف تدريسي)
    // هنا سنقوم بمحاكاة قائمة دروس
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    // فلترة الدروس المرتبطة بالخطة (محاكاة)
    const studentLessons = allLessons.slice(0, 5); // أول 5 دروس

    // استرجاع سجل التقدم لمعرفة آخر درس منجز
    const progress = JSON.parse(localStorage.getItem(`progress_${currentStudent.id}`) || '[]');
    const completedLessonIds = progress.filter(p => p.status === 'completed').map(p => p.lessonId);

    studentLessons.forEach((lesson, idx) => {
        // المنطق: الدرس الأول مفتوح دائماً. الدرس التالي يفتح فقط إذا اكتمل السابق.
        const isCompleted = completedLessonIds.includes(lesson.id);
        const prevLessonCompleted = idx === 0 || completedLessonIds.includes(studentLessons[idx-1].id);
        
        let statusClass = 'locked';
        let icon = '<i class="fas fa-lock"></i>';
        let titleSuffix = ' (مغلق)';

        if (isCompleted) {
            statusClass = 'done'; // منجز
            icon = '<i class="fas fa-check"></i>';
            titleSuffix = ' (مكتمل)';
        } else if (prevLessonCompleted) {
            statusClass = 'open'; // متاح للحل
            icon = '<i class="fas fa-play"></i>';
            titleSuffix = ''; // متاح
        }

        const html = `
        <div class="learning-path-item lp-status-${statusClass} ${statusClass === 'locked' ? 'locked' : ''}">
            <div class="lp-icon lp-status-${statusClass}">${icon}</div>
            <div style="flex:1; margin-right:15px;">
                <h5 style="margin:0">${lesson.title} ${titleSuffix}</h5>
                <small class="text-muted">${statusClass === 'open' ? 'اضغط للبدء' : (statusClass === 'done' ? 'تم الإنجاز' : 'يجب إكمال الدرس السابق')}</small>
            </div>
            ${statusClass === 'open' ? `<button class="btn btn-sm btn-primary" onclick="startLesson(${lesson.id})">ابدأ</button>` : ''}
        </div>`;
        
        container.insertAdjacentHTML('beforeend', html);
    });
}

function startLesson(lessonId) {
    // توجيه الطالب لصفحة الدرس (أو فتح مودال)
    alert(`بدء الدرس ${lessonId}... (سيتم الانتقال لصفحة الحل)`);
    // عند الانتهاء والنجاح، سيتم استدعاء markLessonComplete(lessonId)
}

// دالة يتم استدعاؤها عند نجاح الطالب في الاختبار
function markLessonComplete(lessonId) {
    const progress = JSON.parse(localStorage.getItem(`progress_${currentStudent.id}`) || '[]');
    progress.push({
        lessonId: lessonId,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
    });
    localStorage.setItem(`progress_${currentStudent.id}`, JSON.stringify(progress));
    
    // 🔥 تحديث الخطة (العمود الفقري) - وضع تاريخ التحقق
    // (منطق مبسط: البحث عن الهدف المرتبط بالدرس وتحديثه)
    // currentIEP.find(...).verificationDate = new Date()...
    // saveIEP();

    renderLearningPath(); // إعادة الرسم لفتح القفل التالي
    renderProgressTimeline(); // تحديث السجل
}


// ======================================================
// 📅 المحرك 3: الحضور الذكي (Smart Attendance)
// ======================================================

function loadStudentSchedule() {
    const saved = localStorage.getItem(`schedule_${currentStudent.id}`);
    studentSchedule = saved ? JSON.parse(saved) : [0, 2, 4]; // افتراضي: أحد، ثلاثاء، خميس
    
    const container = document.getElementById('attendanceDaysContainer');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    container.innerHTML = days.map((d, i) => `
        <label><input type="checkbox" value="${i}" ${studentSchedule.includes(i) ? 'checked' : ''}> ${d}</label>
    `).join('');
}

function saveStudentSchedule() {
    const checked = Array.from(document.querySelectorAll('#attendanceDaysContainer input:checked')).map(cb => parseInt(cb.value));
    studentSchedule = checked;
    localStorage.setItem(`schedule_${currentStudent.id}`, JSON.stringify(studentSchedule));
    alert('تم حفظ جدول الطالب. سيتم احتساب الغياب بناءً عليه.');
    renderProgressTimeline(); // تحديث السجل بناءً على الجدول الجديد
}

function renderProgressTimeline() {
    const container = document.getElementById('progressTimeline');
    container.innerHTML = '';

    // 1. جلب السجلات الحقيقية (الإنجازات)
    const realLogs = JSON.parse(localStorage.getItem(`progress_${currentStudent.id}`) || '[]');

    // 2. توليد سجلات الغياب (الذكاء)
    // نفحص آخر 7 أيام مثلاً. إذا كان اليوم يوم حضور للطالب ولم نجد له سجلاً -> ننشئ سجل "غياب تلقائي"
    const today = new Date();
    const generatedLogs = [];

    for (let i = 0; i < 14; i++) { // فحص آخر أسبوعين
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayIndex = d.getDay(); // 0=Sunday
        const dateStr = d.toISOString().split('T')[0];

        // هل هذا يوم دراسة للطالب؟
        if (studentSchedule.includes(dayIndex)) {
            // هل يوجد إنجاز في هذا اليوم؟
            const hasLog = realLogs.some(log => log.date === dateStr);
            if (!hasLog && d < today) { // يوم ماضي ولم ينجز فيه
                generatedLogs.push({
                    date: dateStr,
                    type: 'absent',
                    text: 'غياب (لم يفتح النظام)'
                });
            }
        }
    }

    // دمج السجلات وعرضها
    const allLogs = [...realLogs.map(l => ({...l, type: 'present', text: 'إنجاز درس'})), ...generatedLogs];
    // ترتيب بالتاريخ (الأحدث أولاً)
    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    allLogs.forEach(log => {
        const html = `
        <div class="timeline-item ${log.type}">
            <div class="timeline-date">${log.date}</div>
            <div class="timeline-content">
                <strong>${log.type === 'absent' ? 'غياب' : 'حضور وإنجاز'}</strong>
                <p class="mb-0 small text-muted">${log.text} ${log.lessonId ? `(درس #${log.lessonId})` : ''}</p>
                ${log.type === 'absent' ? `<button class="btn btn-sm btn-link p-0" onclick="editAttendance('${log.date}')">تعديل العذر</button>` : ''}
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function editAttendance(date) {
    const reason = prompt('أدخل سبب الغياب أو التعديل (مثال: عذر طبي):');
    if(reason) {
        // هنا يمكنك حفظ التبرير في LocalStorage لمنع ظهوره كغياب مرة أخرى
        alert(`تم تسجيل العذر ليوم ${date}: ${reason}`);
    }
}

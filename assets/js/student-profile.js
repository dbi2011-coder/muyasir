// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب (توليد آلي، ترتيب صارم، تحكم في المسار التعليمي)
// ============================================

let currentStudentId = null;
let currentStudent = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    loadStudentData();
});

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id == currentStudentId);
    
    if (!currentStudent) { alert('الطالب غير موجود'); return; }
    
    // تحديث واجهة المعلم
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    // ... باقي عناصر الواجهة ...
    
    switchSection('diagnostic'); // البدء بالتشخيص
}

function switchSection(sectionId) {
    // تبديل الواجهات (نفس الكود السابق لإخفاء/إظهار الأقسام)
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    if(document.getElementById(`section-${sectionId}`)) document.getElementById(`section-${sectionId}`).classList.add('active');
    
    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab(); // تأكد أن دالة الخطة موجودة كما في الردود السابقة
    if (sectionId === 'lessons') loadLessonsTab();
}

// ---------------------------------------------------------
// 1. منطق التوليد الآلي للدروس (Automation Engine)
// ---------------------------------------------------------
function autoGenerateLessons() {
    if(!confirm('هل أنت متأكد؟ سيتم استبدال القائمة الحالية بمسار تعليمي جديد مبني آلياً على نتائج التشخيص.')) return;

    // جلب البيانات
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allLessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    
    // العثور على الاختبار المكتمل
    const completedDiagnostic = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    if (!completedDiagnostic) { alert('يجب إكمال الاختبار التشخيصي أولاً.'); return; }

    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == completedDiagnostic.testId);

    // تحديد الأهداف غير المتقنة
    let failedGoals = [];
    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const ans = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
            const score = ans ? (ans.score || 0) : 0;
            if (score < (q.passingScore || 1) && q.linkedGoalId) {
                const goalObj = allObjectives.find(o => o.id == q.linkedGoalId);
                if (goalObj && !failedGoals.includes(goalObj.shortTermGoal)) {
                    failedGoals.push(goalObj.shortTermGoal);
                }
            }
        });
    }

    if (failedGoals.length === 0) { alert('الطالب متقن لجميع المهارات! لا توجد دروس مقترحة.'); return; }

    // بناء القائمة الجديدة
    let newLessons = [];
    failedGoals.forEach(goalText => {
        // البحث عن الدروس المرتبطة بهذا الهدف
        const matches = allLessonsLib.filter(l => l.linkedInstructionalGoal === goalText);
        matches.forEach(m => {
            // إضافة الدرس إذا لم يكن مضافاً
            if(!newLessons.find(x => x.originalLessonId == m.id)) {
                newLessons.push({
                    id: Date.now() + Math.floor(Math.random()*10000),
                    studentId: currentStudentId,
                    title: m.title,
                    objective: m.linkedInstructionalGoal,
                    originalLessonId: m.id,
                    status: 'pending',
                    assignedDate: new Date().toISOString()
                });
            }
        });
    });

    // حفظ وإعادة فهرسة
    saveAndReindexLessons(newLessons, true); // True تعني استبدال القائمة القديمة
    alert(`تم توليد ${newLessons.length} درس آلياً.`);
}

// ---------------------------------------------------------
// 2. إدارة الدروس (عرض، تحريك، إعادة فتح)
// ---------------------------------------------------------
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    const container = document.getElementById('studentLessonsGrid');

    if (myList.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3><button class="btn btn-primary" onclick="autoGenerateLessons()">⚡ توليد تلقائي</button></div>`;
        return;
    }

    // فرز حسب OrderIndex
    myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    container.innerHTML = myList.map((l, index) => {
        // حساب الحالة للقفل
        // الدرس يعتبر مقفلاً (بصرياً للمعلم) إذا كان السابق غير مكتمل
        const prevCompleted = index === 0 || myList[index-1].status === 'completed';
        const isCurrentlyLockedForStudent = !prevCompleted;

        let statusBadge = '';
        if (l.status === 'completed') statusBadge = '<span class="badge badge-success">مكتمل</span>';
        else if (isCurrentlyLockedForStudent) statusBadge = '<span class="badge badge-secondary">🔒 بانتظار السابق</span>';
        else statusBadge = '<span class="badge badge-primary">🔓 مفتوح للطالب</span>';

        // أزرار التحكم
        let controls = '';
        if (l.status === 'completed') {
            controls = `<button class="btn btn-warning btn-sm" onclick="resetLesson(${l.id})">🔄 إعادة فتح</button>`;
        }

        // أزرار الترتيب (تقديم وتأخير)
        const isFirst = index === 0;
        const isLast = index === myList.length - 1;
        let orderBtns = '';
        if (!isFirst) orderBtns += `<button class="btn-order" onclick="moveLesson(${l.id}, 'up')">⬆ تقديم</button>`;
        if (!isLast) orderBtns += `<button class="btn-order" onclick="moveLesson(${l.id}, 'down')">⬇ تأخير</button>`;

        return `
        <div class="content-card" style="border-right: 5px solid ${l.status === 'completed' ? '#28a745' : (isCurrentlyLockedForStudent ? '#6c757d' : '#007bff')}">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <h4 style="margin:0;">${index+1}. ${l.title}</h4>
                    <small class="text-muted">${l.objective}</small>
                </div>
                <div>${statusBadge}</div>
            </div>
            <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                <div class="order-controls">${orderBtns}</div>
                <div>${controls} <button class="btn btn-danger btn-sm" onclick="deleteLesson(${l.id})">حذف</button></div>
            </div>
        </div>`;
    }).join('');
}

// دالة التحريك (الجوهرية): تقوم بالتبديل وإعادة الفهرسة
function moveLesson(lessonId, direction) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    // نفصل دروس الطالب الحالي عن البقية
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);

    // ضمان الترتيب الحالي
    myLessons.sort((a, b) => (a.orderIndex||0) - (b.orderIndex||0));

    const idx = myLessons.findIndex(l => l.id == lessonId);
    if (idx === -1) return;

    // التبديل في المصفوفة
    if (direction === 'up' && idx > 0) {
        [myLessons[idx], myLessons[idx-1]] = [myLessons[idx-1], myLessons[idx]];
    } else if (direction === 'down' && idx < myLessons.length - 1) {
        [myLessons[idx], myLessons[idx+1]] = [myLessons[idx+1], myLessons[idx]];
    }

    // حفظ وإعادة الفهرسة (هذا يضمن أن orderIndex دائماً متسلسل 0, 1, 2...)
    // وهذا ما يضمن عمل منطق القفل لدى الطالب بشكل صحيح
    saveAndReindexLessons(myLessons, false, otherLessons);
}

// دالة إعادة الفتح (تقفل التالي تلقائياً)
function resetLesson(id) {
    if(!confirm('تنبيه: سيتم مسح إجابات هذا الدرس. نظراً للتسلسل، سيتم قفل جميع الدروس التي تليه تلقائياً عند الطالب.')) return;
    
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const target = studentLessons.find(l => l.id == id);
    if(target) {
        target.status = 'pending';
        delete target.completedDate;
        delete target.answers;
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

// إضافة درس يدوي (يضاف في النهاية، ثم يمكن تحريكه)
function assignLibraryLesson() {
    const lessonId = parseInt(document.getElementById('libraryLessonSelect').value);
    if(!lessonId) return;
    
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = allLessons.find(l => l.id == lessonId);
    
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);

    // إضافة الجديد للمصفوفة
    myLessons.push({
        id: Date.now(),
        studentId: currentStudentId,
        title: lesson.title,
        objective: lesson.linkedInstructionalGoal || 'إضافي',
        originalLessonId: lessonId,
        status: 'pending',
        assignedDate: new Date().toISOString()
    });

    // حفظ وإعادة الفهرسة (الدرس الجديد سيأخذ آخر رقم تلقائياً)
    saveAndReindexLessons(myLessons, false, otherLessons);
    closeModal('assignLibraryLessonModal');
    alert('تمت الإضافة في نهاية القائمة. استخدم "تقديم" لرفعه في الترتيب.');
}

// ---------------------------------------------------------
// Helper: حفظ وإعادة الفهرسة (Core Logic)
// ---------------------------------------------------------
function saveAndReindexLessons(myLessonsList, replaceAll = false, otherStudentsLessons = []) {
    // 1. إعادة تعيين orderIndex بالتسلسل (0, 1, 2, 3...)
    myLessonsList.forEach((l, i) => l.orderIndex = i);

    // 2. الدمج مع دروس الطلاب الآخرين (إذا لم يكن استبدالاً كاملاً)
    let finalArray;
    if (replaceAll) {
        // في حالة التوليد الآلي، نجلب دروس الآخرين من التخزين لأننا لم نمررها
        const currentStorage = JSON.parse(localStorage.getItem('studentLessons') || '[]');
        const others = currentStorage.filter(l => l.studentId != currentStudentId);
        finalArray = [...others, ...myLessonsList];
    } else {
        finalArray = [...otherStudentsLessons, ...myLessonsList];
    }

    localStorage.setItem('studentLessons', JSON.stringify(finalArray));
    loadLessonsTab();
}

// دوال مساعدة للعرض (بقية الكود)
function showAssignLibraryLessonModal() {
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const select = document.getElementById('libraryLessonSelect');
    select.innerHTML = '<option value="">اختر...</option>';
    allLessons.forEach(l => select.innerHTML += `<option value="${l.id}">${l.title}</option>`);
    document.getElementById('assignLibraryLessonModal').classList.add('show');
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function deleteLesson(id) {
    if(!confirm('حذف؟')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId && l.id != id);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);
    saveAndReindexLessons(myLessons, false, otherLessons);
}
// (تأكد من وجود loadDiagnosticTab المحدثة بالأعلى)

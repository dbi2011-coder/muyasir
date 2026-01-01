// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب (المسارات الأربعة + السجل التاريخي + التسريع)
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
    
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
    if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade;
    if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);

    // تفعيل التبويب الافتراضي
    switchSection('diagnostic');
}

function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    if(document.getElementById(`section-${sectionId}`)) document.getElementById(`section-${sectionId}`).classList.add('active');
    if(document.getElementById(`link-${sectionId}`)) document.getElementById(`link-${sectionId}`).classList.add('active');
    
    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'progress') loadProgressTab(); // تحديث جدول التقدم الجديد
}

// ---------------------------------------------------------
// 1. إدارة الدروس (عرض، تحريك، تسريع، إعادة فتح)
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
        // حالة القفل للعرض فقط (المعلم يرى كل شيء لكن يعرف ماذا يرى الطالب)
        const prevCompleted = index === 0 || ['completed', 'accelerated'].includes(myList[index-1].status);
        const isLockedForStudent = !prevCompleted;

        let statusBadge = '';
        let cardStyle = '';
        
        if (l.status === 'completed') {
            statusBadge = '<span class="badge badge-success">✅ مكتمل</span>';
            cardStyle = 'border-right: 5px solid #28a745;';
        } else if (l.status === 'accelerated') {
            statusBadge = '<span class="badge badge-warning" style="background:#ffc107; color:#000;">⚡ مسرع (تفوق)</span>';
            cardStyle = 'border-right: 5px solid #ffc107; background:#fffbf0;';
        } else if (isLockedForStudent) {
            statusBadge = '<span class="badge badge-secondary">🔒 مغلق</span>';
            cardStyle = 'border-right: 5px solid #6c757d; opacity:0.8;';
        } else {
            statusBadge = '<span class="badge badge-primary">🔓 نشط حالياً</span>';
            cardStyle = 'border-right: 5px solid #007bff;';
        }

        // أزرار التحكم
        let controls = '';
        
        // زر إعادة الفتح (للمكتمل أو المسرع)
        if (l.status === 'completed' || l.status === 'accelerated') {
            controls += `<button class="btn btn-warning btn-sm" onclick="resetLesson(${l.id})">🔄 إعادة فتح (إلغاء)</button>`;
        } 
        // زر التسريع (للدروس النشطة أو المغلقة)
        else {
            controls += `<button class="btn btn-info btn-sm" style="background:#ffc107; border:none; color:#000;" onclick="accelerateLesson(${l.id})">⚡ تسريع (تفوق)</button>`;
        }

        // أزرار الترتيب
        const isFirst = index === 0;
        const isLast = index === myList.length - 1;
        let orderBtns = '';
        if (!isFirst) orderBtns += `<button class="btn-order" onclick="moveLesson(${l.id}, 'up')">⬆</button>`;
        if (!isLast) orderBtns += `<button class="btn-order" onclick="moveLesson(${l.id}, 'down')">⬇</button>`;

        return `
        <div class="content-card" style="${cardStyle} position:relative;">
            <div style="position:absolute; top:10px; left:10px; display:flex; gap:3px;">${orderBtns}</div>
            <div style="display:flex; justify-content:space-between;">
                <div style="margin-right:30px;">
                    <h4 style="margin:0;">${index+1}. ${l.title}</h4>
                    <small class="text-muted">${l.objective}</small>
                </div>
                <div>${statusBadge}</div>
            </div>
            <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                <div class="lesson-actions" style="width:100%; display:flex; gap:5px; margin-top:10px;">
                    ${controls}
                    <button class="btn btn-danger btn-sm" onclick="deleteLesson(${l.id})">حذف</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// دالة التحريك (يعيد الفهرسة ويقفل التالي آلياً)
function moveLesson(lessonId, direction) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);

    myLessons.sort((a, b) => (a.orderIndex||0) - (b.orderIndex||0));
    const idx = myLessons.findIndex(l => l.id == lessonId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
        [myLessons[idx], myLessons[idx-1]] = [myLessons[idx-1], myLessons[idx]];
    } else if (direction === 'down' && idx < myLessons.length - 1) {
        [myLessons[idx], myLessons[idx+1]] = [myLessons[idx+1], myLessons[idx]];
    }

    saveAndReindexLessons(myLessons, false, otherLessons);
}

// دالة التسريع (المسار الرابع)
function accelerateLesson(id) {
    if(!confirm('هل أنت متأكد من تسريع هذا الدرس؟ سيتم اعتباره منجزاً فوراً.')) return;
    
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const target = studentLessons.find(l => l.id == id);
    
    if(target) {
        target.status = 'accelerated';
        target.completedDate = new Date().toISOString(); // تاريخ اليوم
        // إضافة سجل تاريخي
        if(!target.historyLog) target.historyLog = [];
        target.historyLog.push({ date: new Date().toISOString(), status: 'accelerated' });
        
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

// دالة إعادة الفتح (المسار الذكي - مسح التاريخ)
function resetLesson(id) {
    if(!confirm('تنبيه: سيتم مسح جميع تواريخ وسجلات هذا الدرس. سيؤدي هذا لقفل جميع الدروس اللاحقة.')) return;
    
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const target = studentLessons.find(l => l.id == id);
    
    if(target) {
        target.status = 'pending';
        delete target.completedDate;
        delete target.answers;
        target.historyLog = []; // مسح السجل التاريخي بالكامل
        
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

// إضافة درس يدوي (المسار المرن)
function assignLibraryLesson() {
    const lessonId = parseInt(document.getElementById('libraryLessonSelect').value);
    if(!lessonId) return;
    
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = allLessons.find(l => l.id == lessonId);
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);

    myLessons.push({
        id: Date.now(),
        studentId: currentStudentId,
        title: lesson.title,
        objective: lesson.linkedInstructionalGoal || 'درس إضافي',
        originalLessonId: lessonId,
        status: 'pending',
        assignedDate: new Date().toISOString(),
        isIntervention: true // علامة لتمييزه كدرس دخيل
    });

    saveAndReindexLessons(myLessons, false, otherLessons);
    closeModal('assignLibraryLessonModal');
    loadLessonsTab();
    alert('تمت الإضافة في آخر القائمة. استخدم الأسهم لرفعه إلى المكان المطلوب.');
}

// ---------------------------------------------------------
// 2. سجل التقدم (مع التفاصيل التاريخية)
// ---------------------------------------------------------
function loadProgressTab() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = lessons.filter(l => l.studentId == currentStudentId);
    myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)); // ترتيب حسب المسار

    const tbody = document.getElementById('progressTableBody');
    if(myList.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات</td></tr>'; return; }

    tbody.innerHTML = myList.map(l => {
        let statusText = '';
        let rowClass = '';
        
        if (l.status === 'completed') { statusText = 'مكتمل'; rowClass = 'table-success'; }
        else if (l.status === 'accelerated') { statusText = 'مسرع (تفوق)'; rowClass = 'table-warning'; }
        else { statusText = 'قيد الانتظار'; }

        // بناء السجل التاريخي (التفاصيل)
        let historyDetails = '';
        if (l.historyLog && l.historyLog.length > 0) {
            historyDetails = l.historyLog.map(log => {
                const d = new Date(log.date).toLocaleDateString('ar-SA');
                let st = '';
                if(log.status === 'started') st = 'بدأ';
                else if(log.status === 'extension') st = 'تمديد';
                else if(log.status === 'absence') st = '<span class="text-danger">غياب (تعويض)</span>';
                else if(log.status === 'completed') st = 'إنجاز';
                else if(log.status === 'accelerated') st = 'تسريع';
                return `<div><small>${d}: ${st}</small></div>`;
            }).join('');
        } else {
            historyDetails = '<small class="text-muted">-</small>';
        }

        const finalDate = l.completedDate ? new Date(l.completedDate).toLocaleDateString('ar-SA') : '-';

        return `
            <tr class="${rowClass}">
                <td><strong>${l.title}</strong><br><small class="text-muted">${l.objective}</small></td>
                <td>${statusText}</td>
                <td>${finalDate}</td>
                <td>${historyDetails}</td>
            </tr>
        `;
    }).join('');
}

// ---------------------------------------------------------
// Helper: حفظ وإعادة الفهرسة
// ---------------------------------------------------------
function saveAndReindexLessons(myLessonsList, replaceAll = false, otherStudentsLessons = []) {
    myLessonsList.forEach((l, i) => l.orderIndex = i);
    let finalArray;
    if (replaceAll) {
        const currentStorage = JSON.parse(localStorage.getItem('studentLessons') || '[]');
        const others = currentStorage.filter(l => l.studentId != currentStudentId);
        finalArray = [...others, ...myLessonsList];
    } else {
        finalArray = [...otherStudentsLessons, ...myLessonsList];
    }
    localStorage.setItem('studentLessons', JSON.stringify(finalArray));
    loadLessonsTab();
}

// (بقية الدوال المساعدة والنوافذ تبقى كما هي من الكود السابق: autoGenerateLessons, deleteLesson, etc.)
// ... انسخ الدوال المساعدة من الردود السابقة هنا ...
function autoGenerateLessons() { /* ... الكود السابق ... */ } 
function deleteLesson(id) { /* ... الكود السابق ... */ }
function showAssignLibraryLessonModal() { /* ... الكود السابق ... */ }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

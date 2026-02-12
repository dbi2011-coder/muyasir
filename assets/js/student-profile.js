// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب مع خاصية الطباعة الاحترافية لسجل المتابعة
// ============================================

let currentStudentId = null;
let currentStudent = null;
let editingEventId = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }
    
    injectAdminEventModal();
    injectHomeworkModal(); 
    injectWordTableStyles();
    
    loadStudentData();
});

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id == currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
    if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;
    
    switchSection('diagnostic');
}

function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');
    
    const activeSection = document.getElementById(`section-${sectionId}`);
    if(activeSection) activeSection.classList.add('active');

    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// ============================================
// 🔥 1. سجل التقدم (Progress Tab) - مع خاصية الطباعة الاحترافية
// ============================================

function loadProgressTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');

    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    const container = document.getElementById('section-progress');
    
    if (myList.length === 0) {
        container.innerHTML = `<div class="content-header"><h1>سجل المتابعة</h1></div><div class="empty-state"><h3>لم تبدأ الخطة بعد</h3></div>`;
        return;
    }

    myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const sortedByDate = [...myList].sort((a, b) => new Date(a.assignedDate) - new Date(b.assignedDate));
    let planStartDate = sortedByDate.length > 0 ? new Date(sortedByDate[0].assignedDate) : new Date();

    let myEvents = syncMissingDaysToArchive(myList, adminEvents.filter(e => e.studentId == currentStudentId), teacherSchedule, planStartDate);

    let rawLogs = [];
    myList.forEach(l => {
        if (l.historyLog) {
            l.historyLog.forEach(log => {
                rawLogs.push({
                    dateObj: new Date(log.date),
                    dateStr: new Date(log.date).toDateString(),
                    type: 'lesson',
                    status: log.status,
                    title: l.title,
                    lessonId: l.id,
                    cachedType: log.cachedSessionType || null
                });
            });
        }
    });

    myEvents.forEach(e => {
        rawLogs.push({
            dateObj: new Date(e.date),
            dateStr: new Date(e.date).toDateString(),
            type: e.type === 'auto-absence' ? 'auto-absence' : 'event',
            status: e.type,
            title: e.title || (e.type === 'auto-absence' ? 'درس غير محدد' : 'حدث إداري'),
            id: e.id,
            note: e.note
        });
    });

    let finalTimeline = [];
    let balance = 0;
    rawLogs.sort((a, b) => a.dateObj - b.dateObj);

    rawLogs.forEach(log => {
        if (log.status === 'started' || log.status === 'extension') {
            const hasCompletion = rawLogs.some(l => l.dateStr === log.dateStr && l.lessonId === log.lessonId && (l.status === 'completed' || l.status === 'accelerated'));
            if (hasCompletion) return;
        }

        let displayStatus = '', displayType = '', rowClass = '', studentState = '';
        
        if (log.type === 'event' || log.type === 'auto-absence') {
            if (log.status === 'vacation') { studentState = 'إجازة'; displayStatus = 'توقف مؤقت'; rowClass = 'bg-info-light'; }
            else if (log.status === 'excused') { studentState = 'معفى'; displayStatus = 'مؤجل'; rowClass = 'bg-warning-light'; balance--; }
            else if (log.type === 'auto-absence' || log.status === 'absence') {
                studentState = '<span class="text-danger font-weight-bold">غائب</span>';
                displayStatus = 'لم ينفذ'; displayType = 'أساسية'; rowClass = 'bg-danger-light'; balance--;
            }
        } else {
            studentState = 'حاضر';
            if (log.status === 'started') displayStatus = 'بدأ';
            else if (log.status === 'extension') displayStatus = 'تمديد';
            else if (log.status === 'completed') { displayStatus = '<span class="text-success font-weight-bold">✔ متحقق</span>'; rowClass = 'bg-success-light'; }
            else if (log.status === 'accelerated') { displayStatus = '<span class="text-warning font-weight-bold">⚡ تسريع</span>'; rowClass = 'bg-warning-light'; }
            if (log.cachedType) {
                if (log.cachedType === 'basic') displayType = 'أساسية';
                else if (log.cachedType === 'compensation') { displayType = '<span class="text-primary font-weight-bold">تعويضية</span>'; balance++; }
                else if (log.cachedType === 'additional') { displayType = 'إضافية'; balance++; }
            } else { displayType = 'أساسية'; }
        }

        finalTimeline.push({
            title: log.title,
            lessonStatus: displayStatus,
            studentStatus: studentState,
            sessionType: displayType || '-',
            date: log.dateObj.toLocaleDateString('ar-SA'),
            rawDate: log.dateObj,
            balanceSnapshot: balance,
            actions: (log.type === 'event' || log.type === 'auto-absence') ? log.id : null,
            note: log.note,
            rowClass: rowClass
        });
    });

    let rowsHtml = finalTimeline.map(item => {
        let actionsHtml = '-';
        if (item.actions) {
            actionsHtml = `<button class="btn-icon text-danger no-print" onclick="deleteAdminEvent(${item.actions})">🗑️</button>`;
            if (item.rowClass !== 'bg-danger-light') {
                actionsHtml = `<button class="btn-icon text-primary no-print" onclick="editAdminEvent(${item.actions})">✏️</button>` + actionsHtml;
            }
        }
        let noteHtml = item.note ? `<br><small class="text-muted">[${item.note}]</small>` : '';
        return `<tr class="${item.rowClass || ''}"><td><strong>${item.title}</strong>${noteHtml}</td><td class="text-center">${item.lessonStatus}</td><td class="text-center">${item.studentStatus}</td><td class="text-center">${item.sessionType}</td><td class="text-center">${item.date}</td><td class="text-center no-print">${actionsHtml}</td></tr>`;
    }).join('');

    container.innerHTML = `
        <div class="content-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <h2>سجل المتابعة اليومي</h2>
                <span class="badge ${balance < 0 ? 'badge-danger' : 'badge-success'}">الرصيد الحالي: ${balance > 0 ? '+' + balance : balance} حصة</span>
            </div>
            <div class="no-print">
                <button class="btn btn-secondary" onclick="printProgressLog()" style="margin-left: 10px; background: #475569;">
                    <i class="fas fa-print"></i> طباعة السجل
                </button>
                <button class="btn btn-primary" onclick="openAdminEventModal()">
                    <i class="fas fa-plus-circle"></i> تسجيل حدث
                </button>
            </div>
        </div>
        <div class="table-responsive" id="printableProgressArea">
            <table class="word-table">
                <thead>
                    <tr>
                        <th style="width: 30%;">اسم الدرس</th>
                        <th style="width: 15%;">حالة الدرس</th>
                        <th style="width: 15%;">حالة الطالب</th>
                        <th style="width: 15%;">نوع الحصة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 10%;" class="no-print">إجراءات</th>
                    </tr>
                </thead>
                <tbody id="progressTableBody">${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

/**
 * دالة الطباعة الاحترافية للسجل
 */
function printProgressLog() {
    const studentName = currentStudent ? currentStudent.name : 'الطالب';
    const studentGrade = currentStudent ? currentStudent.grade : '-';
    const tableContent = document.getElementById('printableProgressArea').innerHTML;
    const today = new Date().toLocaleDateString('ar-SA');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>سجل متابعة - ${studentName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                body { font-family: 'Tajawal', serif; padding: 40px; color: #333; }
                .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .header-side { width: 30%; font-size: 13px; line-height: 1.6; }
                .header-mid { width: 40%; text-align: center; }
                .header-mid h2 { margin: 0; font-size: 22px; }
                .student-info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f9f9f9; padding: 15px; border: 1px solid #000; margin-bottom: 20px; border-radius: 5px; }
                .student-info-box div { font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 2px solid #000; }
                th, td { border: 1px solid #000; padding: 10px; text-align: center; font-size: 13px; }
                th { background-color: #eee !important; font-weight: bold; }
                .no-print { display: none !important; }
                .footer-signatures { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-weight: bold; }
                .footer-signatures div { width: 30%; border-top: 1px solid #000; padding-top: 10px; }
                @media print { .no-print { display: none !important; } }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="header-side">
                    المملكة العربية السعودية<br>
                    وزارة التعليم<br>
                    برنامج صعوبات التعلم
                </div>
                <div class="header-mid">
                    <h2>سجل المتابعة اليومي</h2>
                    <p>تقرير التقدم الدراسي للعام 1447هـ</p>
                </div>
                <div class="header-side" style="text-align: left;">
                    التاريخ: ${today}<br>
                    المعلم: أ/ صالح العجلان
                </div>
            </div>

            <div class="student-info-box">
                <div><strong>اسم الطالب:</strong> ${studentName}</div>
                <div><strong>الصف الدراسي:</strong> ${studentGrade}</div>
                <div><strong>المادة:</strong> ${currentStudent.subject || 'صعوبات تعلم'}</div>
                <div><strong>حالة الخطة:</strong> مستمرة</div>
            </div>

            ${tableContent}

            <div class="footer-signatures">
                <div>توقيع معلم البرنامج</div>
                <div>ختم المدرسة</div>
                <div>توقيع ولي الأمر</div>
            </div>
            <script>
                window.onload = function() { window.print(); window.close(); }
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// --- الدوال المساعدة الأخرى (تبقي كما هي في ملفك) ---

function syncMissingDaysToArchive(myList, myEvents, teacherSchedule, planStartDate) {
    if (!planStartDate) return myEvents;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const holidays = JSON.parse(localStorage.getItem('academicCalendar') || '[]');
    let newEvents = [];
    let hasChanges = false;
    let pendingLesson = myList.find(l => l.status === 'pending');
    let lessonTitleForAbsence = pendingLesson ? pendingLesson.title : 'درس غير محدد';

    for (let d = new Date(planStartDate); d < today; d.setDate(d.getDate() + 1)) {
        if (d.toDateString() === new Date().toDateString()) continue;
        const isHoliday = holidays.some(h => {
            const start = new Date(h.startDate);
            const end = new Date(h.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const checkDate = new Date(d);
            checkDate.setHours(12, 0, 0, 0);
            return checkDate >= start && checkDate <= end;
        });
        if (isHoliday) continue;
        const dateStr = d.toDateString();
        const hasLesson = myList.some(l => l.historyLog && l.historyLog.some(log => new Date(log.date).toDateString() === dateStr));
        const hasEvent = myEvents.some(e => new Date(e.date).toDateString() === dateStr);
        if (hasLesson || hasEvent) continue;
        const dayKey = dayMap[d.getDay()];
        const isScheduledDay = teacherSchedule.some(s => s.day === dayKey && (s.students && s.students.includes(currentStudentId)));
        if (isScheduledDay) {
            newEvents.push({ id: Date.now() + Math.random(), studentId: currentStudentId, date: new Date(d).toISOString(), type: 'auto-absence', title: lessonTitleForAbsence, note: `غياب عن درس: ${lessonTitleForAbsence}` });
            hasChanges = true;
        }
    }
    if (hasChanges) {
        let allEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
        allEvents = [...allEvents, ...newEvents];
        localStorage.setItem('studentEvents', JSON.stringify(allEvents));
        return allEvents.filter(e => e.studentId == currentStudentId);
    }
    return myEvents;
}

// ... (بقية دوال Assignments و IEP و Lessons تبقي كما هي بدون تغيير لضمان استقرار الوظائف الأخرى)

function injectWordTableStyles() {
    if (document.getElementById('wordTableStyles')) return;
    const style = document.createElement('style');
    style.id = 'wordTableStyles';
    style.innerHTML = `
        .word-table { width: 100%; border-collapse: collapse; font-family: 'Tajawal', serif; font-size: 1rem; background: white; border: 2px solid #000; }
        .word-table th, .word-table td { border: 1px solid #000; padding: 8px 12px; vertical-align: middle; }
        .word-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; border-bottom: 2px solid #000; }
        .word-table tr:nth-child(even) { background-color: #fafafa; }
        .bg-success-light { background-color: #e8f5e9 !important; }
        .bg-danger-light { background-color: #ffebee !important; }
        .bg-warning-light { background-color: #fff3e0 !important; }
        .bg-info-light { background-color: #e3f2fd !important; }
        @media print { .no-print { display: none !important; } }
    `;
    document.head.appendChild(style);
}

// ... بقية دوال injectAdminEventModal و saveAdminEvent وغيرها تتبع نفس النمط الأصلي

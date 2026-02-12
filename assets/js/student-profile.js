// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب (كاملة) + إصلاح أخطاء الطباعة والتعريفات المفقودة
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
    
    // حقن النوافذ والستايلات أولاً لضمان توفرها
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
    
    // تحديث واجهة المعلومات
    if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
    if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;
    
    // فتح التبويب الافتراضي
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
// 🔥 1. سجل التقدم والطباعة (Updated)
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

// دالة الطباعة الاحترافية (مع إصلاح خطأ الـ Null)
function printProgressLog() {
    if (!currentStudent) { alert('بيانات الطالب غير جاهزة'); return; }

    const studentName = currentStudent.name || 'الطالب';
    const studentGrade = currentStudent.grade || '-';
    // إصلاح الخطأ: التحقق من وجود subject، وإلا وضع قيمة افتراضية
    const studentSubject = currentStudent.subject || 'صعوبات تعلم'; 
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
                <div><strong>المادة:</strong> ${studentSubject}</div>
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

// ============================================
// 🔥 2. بقية الأقسام (الدروس، الواجبات، التشخيصي، IEP)
// ============================================

function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId == currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    
    if (list.length === 0) { 
        container.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; padding: 50px; text-align: center; border: 2px dashed #e0e0e0; background-color: #fafafa; margin-top: 20px;"><div style="font-size: 3rem; margin-bottom: 10px; color: #ccc;">📝</div><h3>لا توجد واجبات حالياً</h3><button class="btn btn-primary" onclick="showAssignHomeworkModal()"><i class="fas fa-plus-circle"></i> إسناد واجب جديد</button></div>`; 
        return; 
    }

    const cardsHtml = list.map(a => `
        <div class="content-card">
            <div style="display:flex; justify-content:space-between;">
                <h4 style="margin:0;">${a.title}</h4>
                <span class="badge ${a.status === 'completed' ? 'badge-success' : 'badge-primary'}">${a.status === 'completed' ? 'مكتمل' : 'جديد'}</span>
            </div>
            <div class="content-meta" style="margin-top:10px;">
                <span>📅 التسليم: ${a.dueDate || 'مفتوح'}</span>
                <span>تاريخ الإسناد: ${new Date(a.assignedDate).toLocaleDateString('ar-SA')}</span>
            </div>
            <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                ${a.status === 'completed' ? `<button class="btn btn-sm btn-outline-success" onclick="openReviewModal(${a.id})">🔍 مراجعة الحل</button>` : '<span class="text-muted text-sm">بانتظار الحل...</span>'}
                <button class="btn btn-sm btn-outline-danger" style="float:left;" onclick="deleteAssignment(${a.id})">حذف</button>
            </div>
        </div>`
    ).join('');

    container.innerHTML = `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">${cardsHtml}</div>`;
}

function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    const container = document.getElementById('studentLessonsGrid');

    if (myList.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3><button class="btn btn-primary" onclick="autoGenerateLessons()">⚡ توليد تلقائي</button></div>`;
        return;
    }

    myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    container.innerHTML = myList.map((l, index) => {
        const prevCompleted = index === 0 || ['completed', 'accelerated'].includes(myList[index-1].status);
        const isLockedForStudent = !prevCompleted;
        let statusBadge = '', cardStyle = '';
        
        if (l.status === 'completed') { statusBadge = '<span class="badge badge-success">✅ مكتمل</span>'; cardStyle = 'border-right: 5px solid #28a745;'; } 
        else if (l.status === 'accelerated') { statusBadge = '<span class="badge badge-warning" style="background:#ffc107; color:#000;">⚡ مسرع (تفوق)</span>'; cardStyle = 'border-right: 5px solid #ffc107; background:#fffbf0;'; } 
        else if (isLockedForStudent) { statusBadge = '<span class="badge badge-secondary">🔒 مغلق</span>'; cardStyle = 'border-right: 5px solid #6c757d; opacity:0.8;'; } 
        else { statusBadge = '<span class="badge badge-primary">🔓 نشط حالياً</span>'; cardStyle = 'border-right: 5px solid #007bff;'; }

        let controls = (l.status === 'completed' || l.status === 'accelerated') ? 
            `<button class="btn btn-warning btn-sm" onclick="resetLesson(${l.id})">🔄 إعادة فتح (إلغاء)</button>` : 
            `<button class="btn btn-info btn-sm" style="background:#ffc107; border:none; color:#000;" onclick="accelerateLesson(${l.id})">⚡ تسريع (تفوق)</button>`;

        const isFirst = index === 0;
        const isLast = index === myList.length - 1;
        let orderBtns = '';
        if (!isFirst) orderBtns += `<button class="btn-order" style="width:auto; height:auto; padding:2px 8px; border-radius:4px; margin-left:5px;" onclick="moveLesson(${l.id}, 'up')">تقديم</button>`;
        if (!isLast) orderBtns += `<button class="btn-order" style="width:auto; height:auto; padding:2px 8px; border-radius:4px;" onclick="moveLesson(${l.id}, 'down')">تأخير</button>`;

        return `
        <div class="content-card" style="${cardStyle} position:relative;">
            <div style="position:absolute; top:50px; left:10px; display:flex; z-index:5;">${orderBtns}</div>
            <div style="display:flex; justify-content:space-between;">
                <div style="margin-right:20px;"><h4 style="margin:0;">${index+1}. ${l.title}</h4><small class="text-muted">${l.objective}</small></div>
                <div>${statusBadge}</div>
            </div>
            <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                <div class="lesson-actions" style="width:100%; display:flex; gap:5px; margin-top:25px;">${controls}<button class="btn btn-danger btn-sm" onclick="deleteLesson(${l.id})">حذف</button></div>
            </div>
        </div>`;
    }).join('');
}

function loadDiagnosticTab() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic');
    
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const detailsDiv = document.getElementById('diagnosticTestDetails');
        detailsDiv.style.display = 'block';
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id == assignedTest.testId);
        
        let statusBadge = '';
        let actionContent = '';
        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            actionContent = `
                <div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:5px;">
                    <strong>الدرجة الحالية: ${assignedTest.score || 0}%</strong>
                    <div style="margin-top:10px;">
                        <button class="btn btn-warning btn-sm" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح</button>
                        <button class="btn btn-primary btn-sm" onclick="autoGenerateLessons()">⚡ توليد الخطة والدروس</button>
                    </div>
                </div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
            actionContent = `<div class="alert alert-warning mt-2">تم إعادة الاختبار للطالب.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">قيد الانتظار</span>';
        }
        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                    <div style="display:flex; gap:5px;">${statusBadge}<button class="btn btn-sm btn-outline-danger" onclick="deleteAssignedTest(${assignedTest.id})"><i class="fas fa-trash"></i></button></div>
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                ${actionContent}
            </div>`;
    } else {
        document.getElementById('noDiagnosticTest').style.display = 'block';
        document.getElementById('diagnosticTestDetails').style.display = 'none';
    }
}

function loadIEPTab() {
    const iepContainer = document.getElementById('iepContent');
    const wordModel = document.querySelector('.iep-word-model');
    if (!iepContainer) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    
    if (!completedDiagnostic) {
        if(wordModel) wordModel.style.display = 'none';
        iepContainer.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3><p>يجب إكمال وتصحيح اختبار تشخيصي أولاً.</p></div>`;
        return;
    }
    if(wordModel) wordModel.style.display = 'block';
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == completedDiagnostic.testId);
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');

    let strengthHTML = '', needsHTML = '';
    let needsObjects = [];

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const ans = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
            const score = ans ? (ans.score || 0) : 0;
            if (q.linkedGoalId) {
                const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                if (obj) {
                    if (score >= (q.passingScore || 1)) {
                        if (!strengthHTML.includes(obj.shortTermGoal)) strengthHTML += `<li>${obj.shortTermGoal}</li>`;
                    } else {
                        if (!needsObjects.find(o => o.id == obj.id)) {
                            needsObjects.push(obj);
                            needsHTML += `<li>${obj.shortTermGoal}</li>`;
                        }
                    }
                }
            }
        });
    }
    if(!strengthHTML) strengthHTML = '<li>لا توجد نقاط مسجلة.</li>';
    if(!needsHTML) needsHTML = '<li>لا توجد نقاط احتياج مسجلة.</li>';

    const completedLessonsMap = {}; const acceleratedLessonsMap = {};
    studentLessons.forEach(l => { if (l.studentId == currentStudentId) { if (l.status === 'completed') completedLessonsMap[l.objective] = l.completedDate; if (l.status === 'accelerated') acceleratedLessonsMap[l.objective] = l.completedDate; } });

    let objectivesRows = '';
    let stgCounter = 1;
    needsObjects.forEach(obj => {
        objectivesRows += `<tr style="background-color:#dbeeff !important;"><td class="text-center" style="font-weight:bold; color:#0056b3;">${stgCounter++}</td><td colspan="2" style="font-weight:bold; color:#0056b3;">الهدف: ${obj.shortTermGoal}</td></tr>`;
        if (obj.instructionalGoals) obj.instructionalGoals.forEach(iGoal => {
            const compDate = completedLessonsMap[iGoal], accelDate = acceleratedLessonsMap[iGoal];
            let dateDisplay = '', rowStyle = '';
            if (accelDate) { dateDisplay = `<span style="font-weight:bold; color:#856404;">⚡ ${new Date(accelDate).toLocaleDateString('ar-SA')} (تفوق)</span>`; rowStyle = 'background-color:#fff3cd !important;'; }
            else if (compDate) { dateDisplay = `<span class="text-success font-weight-bold">✔ ${new Date(compDate).toLocaleDateString('ar-SA')}</span>`; }
            else { dateDisplay = `<span style="color:#ccc;">--/--/----</span>`; }
            objectivesRows += `<tr style="${rowStyle}"><td class="text-center">-</td><td>${iGoal}</td><td>${dateDisplay}</td></tr>`;
        });
    });

    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const dayKeys = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    let scheduleCells = dayKeys.map(dk => {
        const session = teacherSchedule.find(s => s.day === dk && (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId))));
        let content = session ? `حصة ${session.period || 1}` : '-';
        return `<td style="height:50px; vertical-align:middle;">${content}</td>`;
    }).join('');

    const subjectName = originalTest ? originalTest.subject : 'عام';
    iepContainer.innerHTML = `
    <style>@media print { body * { visibility: hidden; } .iep-printable, .iep-printable * { visibility: visible; } .iep-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; border:none; } .no-print { display: none !important; } .print-footer-container {

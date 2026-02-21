// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب + نظام تصحيح ذكي ومستقر + عرض الإجابات والوسائط بالكامل بدون تشفير
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
    injectReviewStyles(); 
    
    loadStudentData();
});

// 🔥 تنسيقات نافذة التصحيح الذكية لتمدد الإجابات وعرض الصور 🔥
function injectReviewStyles() {
    if (document.getElementById('customReviewStyles')) return;
    const style = document.createElement('style');
    style.id = 'customReviewStyles';
    style.innerHTML = `
        .student-answer-box {
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 8px; 
            margin-bottom: 10px; 
            border-right: 4px solid #007bff;
            white-space: pre-wrap; 
            word-break: break-word; 
            font-size: 1.05rem;
            line-height: 1.6;
            overflow-x: hidden;
        }
        .review-question-item {
            border: 1px solid #e2e8f0;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .review-q-header {
            display: flex; justify-content: space-between; align-items: flex-start; 
            margin-bottom: 15px; background: #f1f5f9; padding: 12px 15px; border-radius: 8px;
        }
        .score-input-container {
            display: flex; align-items: center; gap: 5px; background: #fff; padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1;
        }
        .score-input { width: 70px; text-align: center; font-weight: bold; border: 1px solid #ccc; border-radius: 4px; padding: 4px; font-size:1.1rem; color:#007bff; }
        .teacher-feedback-box textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; min-height: 80px; margin-top: 10px; font-family: inherit; }
    `;
    document.head.appendChild(style);
}

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

function printProgressLog() {
    if (!currentStudent) { alert('بيانات الطالب غير جاهزة'); return; }

    const studentName = currentStudent.name || 'الطالب';
    const studentGrade = currentStudent.grade || '-';
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
                    برنامج صعوبات التعلم<br>
                    نظام ميسر التعلم
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
                <div>توقيع معلم صعوبات التعلم</div>
                <div>توقيع مدير المدرسة</div>
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
// 🔥 2. استخراج وعرض الإجابات الذكي (الفلتر السحري لمنع الرموز) 🔥
// ============================================

// دالة مخصصة فقط للتصحيح التلقائي والمطابقة النصية (تتجاهل الرموز الطويلة والصور)
function extractAnswerText(ans) {
    if (ans === null || ans === undefined) return '';
    if (typeof ans === 'string') {
        // إذا كان النص تشفيراً لبيانات (Base64) أو نص عشوائي ضخم، نتجاهله في المطابقة
        if (ans.startsWith('data:') || (ans.length > 200 && !ans.includes(' '))) return '';
        return ans;
    }
    if (Array.isArray(ans)) return ans.join(' ، ');
    if (typeof ans === 'object') {
        if (ans.text) return ans.text;
        if (ans.value) return ans.value;
        if (ans.answer) return ans.answer;
        if (ans.selected) return Array.isArray(ans.selected) ? ans.selected.join(' ، ') : String(ans.selected);
        return ''; 
    }
    return String(ans);
}

// الدالة الذكية التي تعالج النصوص والصور وتعرضها بشكل جمالي وتحمي الشاشة من التمدد
function formatAnswerDisplay(rawAnswer) {
    if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') {
        return '<span class="text-muted" style="font-style:italic;">(لم يُجب الطالب على هذا السؤال)</span>';
    }

    if (Array.isArray(rawAnswer)) {
        let html = rawAnswer.map(item => formatSingleItem(item)).join('<div style="margin-top:8px; border-bottom:1px dashed #eee; padding-bottom:5px;"></div>');
        return html || '<span class="text-muted">(إجابة فارغة)</span>';
    }

    if (typeof rawAnswer === 'object') {
        let val = rawAnswer.image || rawAnswer.audio || rawAnswer.file || rawAnswer.text || rawAnswer.value || rawAnswer.answer;
        if (!val && rawAnswer.selected) {
            val = Array.isArray(rawAnswer.selected) ? rawAnswer.selected.join(' ، ') : rawAnswer.selected;
        }
        if (!val) {
            for (let k in rawAnswer) {
                if (typeof rawAnswer[k] === 'string' && rawAnswer[k].startsWith('data:')) {
                    val = rawAnswer[k]; break;
                }
            }
        }
        if (!val) val = JSON.stringify(rawAnswer); 
        return formatSingleItem(val);
    }

    return formatSingleItem(rawAnswer);
}

// دالة فك التشفير ورسم المحتوى (صور، صوت، أو نص)
function formatSingleItem(text) {
    if (!text) return '';
    let str = String(text).trim();
    
    // 1. هل النص عبارة عن كائن JSON مخفي؟ (فك التشفير العكسي)
    if (str.startsWith('{') && str.endsWith('}')) {
        try {
            let parsed = JSON.parse(str);
            return formatAnswerDisplay(parsed); 
        } catch(e) {}
    }
    
    // 2. هل المرفق صورة؟ (تحويله لبطاقة صورة)
    if (str.startsWith('data:image')) {
        return `<img src="${str}" style="max-width:100%; max-height:400px; border:1px solid #ccc; border-radius:8px; margin-top:5px; display:block; object-fit:contain; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
    }
    
    // 3. هل المرفق صوت؟ (تحويله لمشغل صوت)
    if (str.startsWith('data:audio')) {
        return `<audio controls src="${str}" style="margin-top:5px; width:100%; max-width:300px; height:45px;"></audio>`;
    }
    
    // 4. هل هو ملف آخر PDF؟
    if (str.startsWith('data:')) {
        return `<a href="${str}" download="مرفق_إجابة" class="btn btn-sm btn-outline-primary mt-2" style="display:inline-block;"><i class="fas fa-file-download"></i> تحميل المرفق المحفوظ</a>`;
    }
    
    // 5. حماية الشاشة من الرموز الطويلة المزعجة (إذا كان التشفير لم يلتقط بشكل صحيح)
    if (str.length > 500 && !str.includes(' ')) {
        return `
            <div style="overflow-wrap: anywhere; font-size: 0.85rem; color: #dc3545; background:#fff5f5; padding:10px; border-radius:5px; max-height: 100px; overflow-y: auto; border:1px solid #ffcdd2;">
                <i class="fas fa-exclamation-triangle"></i> ملف أو بيانات غير مدعومة العرض المباشر.<br>
                <span style="opacity:0.6; font-size:0.7rem;">${str}</span>
            </div>`;
    }

    // 6. عرض النص العادي مع حماية المسافات والأسطر
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
    let studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    let assignedTestIndex = studentTests.findIndex(t => t.studentId == currentStudentId && t.type === 'diagnostic');
    
    if (assignedTestIndex !== -1) {
        let assignedTest = studentTests[assignedTestIndex];
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const detailsDiv = document.getElementById('diagnosticTestDetails');
        detailsDiv.style.display = 'block';
        
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id == assignedTest.testId);
        
        let finalPercentage = assignedTest.score || 0;
        
        if (assignedTest.status === 'completed' && originalTest && originalTest.questions) {
            let totalScore = 0;
            let maxTotalScore = 0;
            let needsSave = false;
            
            originalTest.questions.forEach(q => {
                let maxQScore = parseFloat(q.passingScore || q.points || q.score || 1);
                if (isNaN(maxQScore) || maxQScore <= 0) maxQScore = 1;
                maxTotalScore += maxQScore;
                
                if (assignedTest.answers) {
                    let ansObj = assignedTest.answers.find(a => a.questionId == q.id);
                    if (ansObj) {
                        if (ansObj.score === undefined || ansObj.score === null) {
                            let textAns = extractAnswerText(ansObj.answer || ansObj.value);
                            let studentAns = String(textAns).trim().toLowerCase();
                            let correctAns = String(q.correctAnswer || '').trim().toLowerCase();
                            
                            if (studentAns === correctAns && studentAns !== '') {
                                ansObj.score = maxQScore; 
                            } else {
                                ansObj.score = 0; 
                            }
                            needsSave = true;
                        }
                        totalScore += parseFloat(ansObj.score) || 0;
                    }
                }
            });
            
            if (maxTotalScore > 0) {
                let calcPercentage = Math.round((totalScore / maxTotalScore) * 100);
                if (assignedTest.score !== calcPercentage) {
                    assignedTest.score = calcPercentage;
                    needsSave = true;
                }
            }
            
            if (needsSave) {
                studentTests[assignedTestIndex] = assignedTest;
                localStorage.setItem('studentTests', JSON.stringify(studentTests));
            }
            finalPercentage = assignedTest.score || 0;
        }

        let statusBadge = '';
        let actionContent = '';
        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            actionContent = `
                <div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:1.1rem;">الدرجة الحالية: <span style="font-size:1.4rem; color:#28a745; font-weight:900;">${finalPercentage}%</span></strong>
                    </div>
                    <div style="margin-top:15px; display:flex; gap:10px;">
                        <button class="btn btn-warning" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتعديل التصحيح</button>
                        <button class="btn btn-primary" onclick="autoGenerateLessons()">⚡ توليد الخطة والدروس</button>
                    </div>
                </div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
            actionContent = `<div class="alert alert-warning mt-2">تم إعادة الاختبار للطالب ليقوم بتعديله.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">بانتظار حل الطالب</span>';
        }
        detailsDiv.innerHTML = `
            <div class="card" style="border:1px solid #eee; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                    <div style="display:flex; gap:5px; align-items:center;">
                        ${statusBadge}
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignedTest(${assignedTest.id})" title="حذف الاختبار"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="text-muted" style="margin-top:5px;"><i class="fas fa-calendar-alt"></i> تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
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
            const score = ans ? parseFloat(ans.score || 0) : 0;
            const passing = parseFloat(q.passingScore || q.points || q.score || 1);
            if (q.linkedGoalId) {
                const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                if (obj) {
                    if (score >= passing) {
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
    <style>@media print { body * { visibility: hidden; } .iep-printable, .iep-printable * { visibility: visible; } .iep-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; border:none; } .no-print { display: none !important; } .print-footer-container { margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; display: block !important; } }</style>
    <div class="iep-printable" style="background:#fff; padding:20px; border:1px solid #ccc;">
        <div style="text-align:center; margin-bottom:20px; border-bottom:2px solid #333;"><h3>الخطة التربوية الفردية</h3></div>
        <table class="table table-bordered mb-4"><tr><td style="background:#f5f5f5; width:15%;">اسم الطالب:</td><td style="width:35%;">${currentStudent.name}</td><td style="background:#f5f5f5; width:15%;">الصف:</td><td>${currentStudent.grade}</td></tr><tr><td style="background:#f5f5f5;">المادة:</td><td>${subjectName}</td><td style="background:#f5f5f5;">التاريخ:</td><td>${new Date().toLocaleDateString('ar-SA')}</td></tr></table>
        <h5>جدول الحصص:</h5><table class="table table-bordered text-center mb-4"><thead><tr style="background:#f5f5f5;"><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th></tr></thead><tbody><tr>${scheduleCells}</tr></tbody></table>
        <div style="display:flex; gap:20px; margin-bottom:20px;"><div style="flex:1; border:1px solid #ddd; padding:10px;"><h6 style="background:#28a745; color:white; padding:5px; text-align:center;">نقاط القوة</h6><ul>${strengthHTML}</ul></div><div style="flex:1; border:1px solid #ddd; padding:10px;"><h6 style="background:#dc3545; color:white; padding:5px; text-align:center;">نقاط الاحتياج</h6><ul>${needsHTML}</ul></div></div>
        <div class="alert alert-secondary text-center mb-4">الهدف بعيد المدى: أن يتقن التلميذ مهارات مادة <strong>${subjectName}</strong> بنسبة 80%</div>
        <h5>الأهداف التدريسية:</h5><table class="table table-bordered"><thead style="background:#333; color:white;"><tr><th>#</th><th>الهدف</th><th>التحقق</th></tr></thead><tbody>${objectivesRows}</tbody></table>
        <div class="print-footer-container"><p class="print-footer-text">تم طباعة الخطة من نظام ميسر التعلم - معلم: أ/ صالح عبد العزيز العجلان</p></div>
    </div>`;
    const topPrintBtn = document.querySelector('#section-iep .content-header button');
    if(topPrintBtn) topPrintBtn.setAttribute('onclick', 'window.print()');
}

function injectWordTableStyles() {
    if (document.getElementById('wordTableStyles')) return;
    const style = document.createElement('style');
    style.id = 'wordTableStyles';
    style.innerHTML = `
        .word-table { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', 'Tajawal', serif; font-size: 1rem; background: white; border: 2px solid #000; }
        .word-table th, .word-table td { border: 1px solid #000; padding: 8px 12px; vertical-align: middle; }
        .word-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; border-bottom: 2px solid #000; }
        .word-table tr:nth-child(even) { background-color: #fafafa; }
        .bg-success-light { background-color: #e8f5e9 !important; }
        .bg-danger-light { background-color: #ffebee !important; }
        .bg-warning-light { background-color: #fff3e0 !important; }
        .bg-info-light { background-color: #e3f2fd !important; }
        .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0 5px; transition: transform 0.2s; }
        .btn-icon:hover { transform: scale(1.2); }
        .badge { padding: 5px 10px; border-radius: 12px; color: white; font-size: 0.8rem; }
        .badge-success { background-color: #28a745; }
        .badge-danger { background-color: #dc3545; }
        @media print { .no-print { display: none !important; } }
    `;
    document.head.appendChild(style);
}

function injectAdminEventModal() {
    if (document.getElementById('adminEventModal')) return;
    const html = `
    <div id="adminEventModal" class="modal">
        <div class="modal-content" style="border: 2px solid #000;">
            <span class="close-btn" onclick="closeAdminEventModal()">&times;</span>
            <h3 id="modalTitle">تسجيل حدث إداري</h3>
            <div class="form-group">
                <label>نوع الحالة:</label>
                <select id="manualEventType" class="form-control">
                    <option value="excused">معفى (يخصم من الرصيد)</option>
                    <option value="vacation">إجازة (توقف مؤقت)</option>
                </select>
            </div>
            <div class="form-group">
                <label>التاريخ:</label>
                <input type="date" id="manualEventDate" class="form-control">
            </div>
            <div class="form-group">
                <label>ملاحظات:</label>
                <textarea id="manualEventNote" class="form-control"></textarea>
            </div>
            <button class="btn btn-primary w-100" onclick="saveAdminEvent()">حفظ السجل</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function injectHomeworkModal() {
    const oldModal = document.getElementById('assignHomeworkModal');
    if (oldModal) return; 

    const html = `
    <div id="assignHomeworkModal" class="modal">
        <div class="modal-content" style="border: 2px solid #000;">
            <span class="close-btn" onclick="closeModal('assignHomeworkModal')">&times;</span>
            <h3>إسناد واجب جديد</h3>
            <div class="form-group">
                <label>اختر الواجب من المكتبة:</label>
                <select id="homeworkSelect" class="form-control">
                    <option value="">جارِ التحميل...</option>
                </select>
            </div>
            <div class="form-group">
                <label>تاريخ التسليم:</label>
                <input type="date" id="homeworkDueDate" class="form-control">
            </div>
            <button class="btn btn-primary w-100" onclick="assignHomework()">حفظ الإسناد</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function openAdminEventModal() {
    editingEventId = null;
    document.getElementById('modalTitle').textContent = "تسجيل حدث إداري";
    document.getElementById('manualEventDate').valueAsDate = new Date();
    document.getElementById('manualEventType').value = 'excused';
    document.getElementById('manualEventNote').value = '';
    document.getElementById('adminEventModal').classList.add('show');
}

function closeAdminEventModal() {
    document.getElementById('adminEventModal').classList.remove('show');
}

function editAdminEvent(id) {
    const events = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const event = events.find(e => e.id == id);
    if (!event) return;
    editingEventId = id;
    document.getElementById('modalTitle').textContent = "تعديل الحدث";
    document.getElementById('manualEventType').value = event.type;
    document.getElementById('manualEventDate').value = event.date.split('T')[0];
    document.getElementById('manualEventNote').value = event.note || '';
    document.getElementById('adminEventModal').classList.add('show');
}

function saveAdminEvent() {
    const type = document.getElementById('manualEventType').value;
    const dateInput = document.getElementById('manualEventDate').value;
    const note = document.getElementById('manualEventNote').value;
    
    if (!dateInput) { alert('يرجى اختيار التاريخ'); return; }

    const targetDateStr = new Date(dateInput).toDateString();
    let events = JSON.parse(localStorage.getItem('studentEvents') || '[]');

    events = events.filter(e => {
        if (e.studentId != currentStudentId) return true;
        if (new Date(e.date).toDateString() !== targetDateStr) return true;
        return false;
    });
    
    events.push({
        id: Date.now(),
        studentId: currentStudentId,
        date: new Date(dateInput).toISOString(),
        type: type,
        note: note
    });

    localStorage.setItem('studentEvents', JSON.stringify(events));
    closeAdminEventModal();
    loadProgressTab();
}

function deleteAdminEvent(id) {
    if (!confirm('حذف هذا السجل؟')) return;
    let events = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    events = events.filter(e => e.id != id);
    localStorage.setItem('studentEvents', JSON.stringify(events));
    loadProgressTab();
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('show'); 
}

function moveLesson(lessonId, direction) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);
    myLessons.sort((a, b) => (a.orderIndex||0) - (b.orderIndex||0));
    const idx = myLessons.findIndex(l => l.id == lessonId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) [myLessons[idx], myLessons[idx-1]] = [myLessons[idx-1], myLessons[idx]];
    else if (direction === 'down' && idx < myLessons.length - 1) [myLessons[idx], myLessons[idx+1]] = [myLessons[idx+1], myLessons[idx]];
    saveAndReindexLessons(myLessons, false, otherLessons);
}

function accelerateLesson(id) {
    if(!confirm('تسريع هذا الدرس؟ سيتم اعتباره منجزاً.')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const target = studentLessons.find(l => l.id == id);
    if(target) {
        target.status = 'accelerated';
        target.completedDate = new Date().toISOString();
        if(!target.historyLog) target.historyLog = [];
        target.historyLog.push({ date: new Date().toISOString(), status: 'accelerated' });
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
    }
}

function resetLesson(id) {
    if(!confirm('سيتم مسح السجل التاريخي لهذا الدرس بالكامل.')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const target = studentLessons.find(l => l.id == id);
    if(target) {
        target.status = 'pending';
        delete target.completedDate;
        delete target.answers;
        target.historyLog = [];
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
    }
}

function deleteLesson(id) {
    if(!confirm('حذف الدرس؟')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId && l.id != id);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);
    saveAndReindexLessons(myLessons, false, otherLessons);
}

function autoGenerateLessons() {
    if(!confirm('سيتم حذف الدروس الحالية وتوليد قائمة جديدة بناءً على التشخيص. متابعة؟')) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const compDiag = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    
    if (!compDiag) { alert('يجب إكمال وتصحيح الاختبار التشخيصي أولاً'); return; }
    
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const allLibraryAssignments = JSON.parse(localStorage.getItem('assignments') || '[]'); 
    const originalTest = JSON.parse(localStorage.getItem('tests') || '[]').find(t => t.id == compDiag.testId);

    let newLessons = [];
    let newAssignments = []; 

    if(originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const ans = compDiag.answers ? compDiag.answers.find(a => a.questionId == q.id) : null;
            
            if((ans?.score || 0) < (q.passingScore || 1) && q.linkedGoalId) {
                const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                if(obj) {
                    const matches = allLessons.filter(l => l.linkedInstructionalGoal === obj.shortTermGoal || (obj.instructionalGoals||[]).includes(l.linkedInstructionalGoal));
                    
                    matches.forEach(m => {
                        if(!newLessons.find(x => x.originalLessonId == m.id)) {
                            newLessons.push({
                                id: Date.now() + Math.floor(Math.random()*10000),
                                studentId: currentStudentId, title: m.title, objective: m.linkedInstructionalGoal,
                                originalLessonId: m.id, status: 'pending', assignedDate: new Date().toISOString()
                            });
                            
                            const linkedHomework = allLibraryAssignments.find(h => h.linkedInstructionalGoal === m.linkedInstructionalGoal);

                            if (linkedHomework) {
                                newAssignments.push({
                                    id: Date.now() + Math.floor(Math.random()*10000) + 1,
                                    studentId: currentStudentId,
                                    title: linkedHomework.title,
                                    status: 'pending',
                                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                    assignedDate: new Date().toISOString()
                                });
                            } 
                        }
                    });
                }
            }
        });
    }

    if(newLessons.length === 0) { alert('لا توجد نقاط ضعف تتطلب خطة علاجية.'); return; }
    
    saveAndReindexLessons(newLessons, true);
    
    if (newAssignments.length > 0) {
        let currentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
        currentAssignments = [...currentAssignments.filter(a => a.studentId != currentStudentId), ...newAssignments];
        localStorage.setItem('studentAssignments', JSON.stringify(currentAssignments));
        alert(`تم توليد ${newLessons.length} درس و ${newAssignments.length} واجب مرتبط.`);
    } else {
        alert(`تم توليد ${newLessons.length} درس.`);
    }

    if (document.getElementById('section-assignments').classList.contains('active')) loadAssignmentsTab();
}

function saveAndReindexLessons(myList, replaceAll, others) {
    myList.forEach((l, i) => l.orderIndex = i);
    let final = replaceAll ? [...JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId != currentStudentId), ...myList] : [...others, ...myList];
    localStorage.setItem('studentLessons', JSON.stringify(final));
    loadLessonsTab();
}

function showAssignTestModal() {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const select = document.getElementById('testSelect');
    select.innerHTML = '<option value="">اختر اختباراً...</option>';
    allTests.forEach(t => select.innerHTML += `<option value="${t.id}">${t.title}</option>`);
    document.getElementById('assignTestModal').classList.add('show');
}
function assignTest() {
    const testId = parseInt(document.getElementById('testSelect').value);
    if(!testId) return;
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    if(studentTests.some(t => t.studentId == currentStudentId && t.type === 'diagnostic')) { alert('يوجد اختبار معين مسبقاً'); return; }
    studentTests.push({ id: Date.now(), studentId: currentStudentId, testId: testId, type: 'diagnostic', status: 'pending', assignedDate: new Date().toISOString() });
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('assignTestModal');
    loadDiagnosticTab();
    alert('تم تعيين الاختبار بنجاح.');
}
function deleteAssignedTest(id) {
    if(!confirm('حذف؟')) return;
    let st = JSON.parse(localStorage.getItem('studentTests') || '[]');
    st = st.filter(t => t.id != id);
    localStorage.setItem('studentTests', JSON.stringify(st));
    loadDiagnosticTab();
    if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
}

function showAssignHomeworkModal() { 
    const select = document.getElementById('homeworkSelect');
    if (!select) {
        injectHomeworkModal();
        setTimeout(showAssignHomeworkModal, 50);
        return;
    }

    const allAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    
    select.innerHTML = '<option value="">اختر من قائمة الواجبات...</option>';
    if (allAssignments.length > 0) {
        allAssignments.forEach(a => {
            select.innerHTML += `<option value="${a.title}">${a.title}</option>`;
        });
    } else {
        select.innerHTML += `<option value="" disabled>لا توجد واجبات في المكتبة</option>`;
    }

    document.getElementById('homeworkDueDate').valueAsDate = new Date();
    document.getElementById('assignHomeworkModal').classList.add('show'); 
}

function assignHomework() { 
    const select = document.getElementById('homeworkSelect'); 
    
    if(!select || !select.value) { alert('الرجاء اختيار واجب من القائمة'); return; }
    
    const title = select.value; 
    
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); 
    list.push({ 
        id: Date.now(), 
        studentId: currentStudentId, 
        title: title, 
        status: 'pending', 
        dueDate: document.getElementById('homeworkDueDate').value, 
        assignedDate: new Date().toISOString() 
    }); 
    
    localStorage.setItem('studentAssignments', JSON.stringify(list)); 
    closeModal('assignHomeworkModal'); 
    loadAssignmentsTab(); 
    alert('تم الإسناد بنجاح'); 
}

function deleteAssignment(id) { 
    if(confirm('حذف هذا الواجب؟')) { 
        let list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); 
        list = list.filter(a => a.id != id); 
        localStorage.setItem('studentAssignments', JSON.stringify(list)); 
        loadAssignmentsTab(); 
    } 
}


// 🔥 نافذة المراجعة مع دعم استخراج الوسائط وعرضها بدون تشفير
function openReviewModal(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id == assignmentId);
    
    if(!assignment) { 
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const test = studentTests.find(t => t.id == assignmentId);
        if (test) { openTestReviewModal(test); return; } 
        alert('لم يتم العثور على الواجب/الاختبار'); return; 
    }

    const allLibraryAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    let originalAssignment = allLibraryAssignments.find(a => a.title === assignment.title);
    
    if ((!assignment.questions || assignment.questions.length === 0) && originalAssignment) {
        assignment.questions = originalAssignment.questions;
    }

    document.getElementById('reviewAssignmentId').value = assignmentId;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';

    if (assignment.attachedSolution) {
        container.innerHTML += `
            <div class="alert alert-info" style="margin-bottom:20px;">
                <strong>📎 حل ورقي مرفق:</strong><br>
                <a href="${assignment.attachedSolution}" target="_blank" class="btn btn-primary btn-sm mt-2">عرض ملف الحل</a>
            </div>
        `;
    }

    if (assignment.questions) {
        assignment.questions.forEach((q, index) => {
            const studentAnsObj = assignment.answers ? assignment.answers.find(a => a.questionId == q.id) : null;
            let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
            const formattedAnswer = formatAnswerDisplay(rawAnswer);
            
            let maxScore = parseFloat(q.passingScore || q.points || q.score || 1);
            if(isNaN(maxScore) || maxScore <= 0) maxScore = 1;
            
            let currentScore = studentAnsObj ? studentAnsObj.score : undefined;
            if (currentScore === undefined || currentScore === null) {
                if (q.correctAnswer) {
                    let textAns = extractAnswerText(rawAnswer);
                    let sAns = String(textAns).trim().toLowerCase();
                    let cAns = String(q.correctAnswer || '').trim().toLowerCase();
                    if (sAns === cAns && sAns !== '') currentScore = maxScore;
                    else currentScore = 0;
                } else {
                    currentScore = 0;
                }
            }
            currentScore = parseFloat(currentScore) || 0;

            const teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
            
            const item = document.createElement('div');
            item.className = 'review-question-item';
            item.innerHTML = `
                <div class="review-q-header">
                    <div style="flex:1;"><strong>س${index+1}: ${q.text}</strong></div>
                    <div class="score-input-container">
                        <input type="number" step="0.5" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0">
                        <span class="text-muted" style="font-size:0.9rem;"> / ${maxScore} درجة</span>
                    </div>
                </div>
                <div class="student-answer-box">
                    <div style="font-weight:bold; color:#0056b3; margin-bottom:8px;"><i class="fas fa-comment-dots"></i> إجابة الطالب:</div>
                    <div>${formattedAnswer}</div>
                </div>
                <div class="teacher-feedback-box">
                    <textarea class="form-control" name="note_${q.id}" placeholder="اكتب ملاحظاتك للطالب هنا (اختياري)...">${teacherNote}</textarea>
                </div>`;
            container.appendChild(item);
        });
    } else {
        container.innerHTML += '<div class="text-center p-3">لا توجد أسئلة رقمية لعرضها (قد يكون الواجب ورقياً فقط).</div>';
    }
    
    document.getElementById('reviewTestModal').classList.add('show');
}

function openTestReviewModal(test) {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == test.testId);
    document.getElementById('reviewAssignmentId').value = test.id;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';
    
    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach((q, index) => {
            const studentAnsObj = test.answers ? test.answers.find(a => a.questionId == q.id) : null;
            let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
            const formattedAnswer = formatAnswerDisplay(rawAnswer);
            
            let maxScore = parseFloat(q.passingScore || q.points || q.score || 1);
            if(isNaN(maxScore) || maxScore <= 0) maxScore = 1;
            
            let currentScore = studentAnsObj ? studentAnsObj.score : undefined;
            if (currentScore === undefined || currentScore === null) {
                if (q.correctAnswer) {
                    let textAns = extractAnswerText(rawAnswer);
                    let sAns = String(textAns).trim().toLowerCase();
                    let cAns = String(q.correctAnswer || '').trim().toLowerCase();
                    if (sAns === cAns && sAns !== '') currentScore = maxScore;
                    else currentScore = 0;
                } else {
                    currentScore = 0;
                }
            }
            currentScore = parseFloat(currentScore) || 0;

            const teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
            
            const item = document.createElement('div');
            item.className = 'review-question-item';
            item.innerHTML = `
                <div class="review-q-header">
                    <div style="flex:1;"><strong>س${index+1}: ${q.text}</strong></div>
                    <div class="score-input-container">
                        <input type="number" step="0.5" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0">
                        <span class="text-muted" style="font-size:0.9rem;"> / ${maxScore} درجة</span>
                    </div>
                </div>
                <div class="student-answer-box">
                    <div style="font-weight:bold; color:#0056b3; margin-bottom:8px;"><i class="fas fa-comment-dots"></i> إجابة الطالب:</div>
                    <div>${formattedAnswer}</div>
                </div>
                <div class="teacher-feedback-box">
                    <textarea class="form-control" name="note_${q.id}" placeholder="اكتب ملاحظاتك للطالب هنا (اختياري)...">${teacherNote}</textarea>
                </div>`;
            container.appendChild(item);
        });
    }
    document.getElementById('reviewTestModal').classList.add('show');
}

// 🔥 حفظ التصحيح بدقة متناهية لمنع التصفير واعتماد درجات المعلم 🔥
function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    
    let studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    let idx = studentAssignments.findIndex(a => a.id == id);
    let isAssignment = true;

    if (idx === -1) {
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        idx = studentTests.findIndex(t => t.id == id);
        if (idx !== -1) {
            studentAssignments = studentTests; 
            isAssignment = false;
        } else {
            return;
        }
    }

    const container = document.getElementById('reviewQuestionsContainer');
    let totalScore = 0; 
    let maxTotalScore = 0;
    
    let questions = studentAssignments[idx].questions;
    if (!questions && !isAssignment) {
         const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
         const originalTest = allTests.find(t => t.id == studentAssignments[idx].testId);
         if(originalTest) questions = originalTest.questions;
    }

    if(questions && questions.length > 0) {
        questions.forEach(q => {
            const scoreInp = container.querySelector(`input[name="score_${q.id}"]`);
            const noteInp = container.querySelector(`textarea[name="note_${q.id}"]`);
            
            if (!studentAssignments[idx].answers) studentAssignments[idx].answers = [];
            
            let ansIdx = studentAssignments[idx].answers.findIndex(a => a.questionId == q.id);
            
            // 🔥 قراءة الدرجة التي كتبها المعلم بشكل دقيق كعدد عشري 🔥
            let newScore = 0;
            if (scoreInp && scoreInp.value !== '') {
                newScore = parseFloat(scoreInp.value);
                if(isNaN(newScore)) newScore = 0;
            }
            
            if(ansIdx !== -1) { 
                studentAssignments[idx].answers[ansIdx].score = newScore; 
                studentAssignments[idx].answers[ansIdx].teacherNote = noteInp ? noteInp.value : ''; 
            } else { 
                studentAssignments[idx].answers.push({ 
                    questionId: q.id, 
                    score: newScore, 
                    teacherNote: noteInp ? noteInp.value : '', 
                    answer: null 
                }); 
            }
            
            totalScore += newScore; 
            
            let maxQScore = parseFloat(q.passingScore || q.points || q.score || 1);
            if (isNaN(maxQScore) || maxQScore <= 0) maxQScore = 1;
            maxTotalScore += maxQScore;
        });
        
        // حساب النسبة المئوية بدقة بعد التعديل اليدوي
        studentAssignments[idx].score = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
    }
    
    studentAssignments[idx].status = 'completed';

    if (isAssignment) {
        localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
        closeModal('reviewTestModal');
        loadAssignmentsTab();
    } else {
        localStorage.setItem('studentTests', JSON.stringify(studentAssignments));
        closeModal('reviewTestModal');
        loadDiagnosticTab(); 
    }
    
    alert('تم حفظ التصحيح واعتماد الدرجة بنجاح ✅');
}

function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    if(!confirm('إعادة الاختبار/الواجب للطالب للتعديل؟')) return;
    
    let studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    let idx = studentAssignments.findIndex(a => a.id == id);
    let isAssignment = true;

    if (idx === -1) {
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        idx = studentTests.findIndex(t => t.id == id);
        if (idx !== -1) {
            studentAssignments = studentTests;
            isAssignment = false;
        } else return;
    }

    studentAssignments[idx].status = 'returned'; 
    
    if (isAssignment) {
        localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
        loadAssignmentsTab();
    } else {
        localStorage.setItem('studentTests', JSON.stringify(studentAssignments));
        loadDiagnosticTab();
    }
    
    closeModal('reviewTestModal');
    alert('تمت الإعادة');
}

function showAssignLibraryLessonModal() {
    const select = document.getElementById('libraryLessonSelect');
    if (!select) return;

    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    select.innerHTML = '<option value="">اختر درساً من القائمة...</option>';

    if (allLessons.length === 0) {
        select.innerHTML += '<option value="" disabled>مكتبة الدروس فارغة</option>';
    } else {
        allLessons.forEach(l => {
            select.innerHTML += `<option value="${l.id}">${l.title} ${l.subject ? `(${l.subject})` : ''}</option>`;
        });
    }

    document.getElementById('assignLibraryLessonModal').classList.add('show');
}

function assignLibraryLesson() {
    const select = document.getElementById('libraryLessonSelect');
    const lessonId = select.value;

    if (!lessonId) {
        alert('يرجى اختيار درس لإسناده');
        return;
    }

    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const targetLesson = allLessons.find(l => l.id == lessonId);

    if (!targetLesson) {
        alert('الدرس المختار لم يعد موجوداً');
        return;
    }

    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    const newStudentLesson = {
        id: Date.now(),
        studentId: currentStudentId,
        title: targetLesson.title,
        objective: targetLesson.linkedInstructionalGoal || 'درس إضافي',
        originalLessonId: targetLesson.id,
        status: 'pending',
        assignedDate: new Date().toISOString(),
        orderIndex: studentLessons.filter(l => l.studentId == currentStudentId).length 
    };

    studentLessons.push(newStudentLesson);
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    
    closeModal('assignLibraryLessonModal');
    loadLessonsTab(); 
    
    if (document.getElementById('section-iep').classList.contains('active')) {
        loadIEPTab();
    }
    
    alert('تم إسناد الدرس للطالب بنجاح ✅');
}

function regenerateLessons() {
    autoGenerateLessons(); 
}

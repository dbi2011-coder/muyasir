// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: نظام التقدم الأكاديمي (الإسناد من مكتبة الواجبات حصراً + كافة التنسيقات)
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
    
    // تحديث واجهة الملف الشخصي
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
// 🔥 1. محرك سجل التقدم (الأرشفة والاستبدال)
// ============================================

function syncMissingDaysToArchive(myList, myEvents, teacherSchedule, planStartDate) {
    if (!planStartDate) return myEvents;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    let newEvents = [];
    let hasChanges = false;

    let pendingLesson = myList.find(l => l.status === 'pending');
    let lessonTitleForAbsence = pendingLesson ? pendingLesson.title : 'درس غير محدد';

    for (let d = new Date(planStartDate); d < today; d.setDate(d.getDate() + 1)) {
        if (d.toDateString() === new Date().toDateString()) continue;

        const dateStr = d.toDateString();
        const hasLesson = myList.some(l => l.historyLog && l.historyLog.some(log => new Date(log.date).toDateString() === dateStr));
        const hasEvent = myEvents.some(e => new Date(e.date).toDateString() === dateStr);
        
        if (hasLesson || hasEvent) continue;

        const dayKey = dayMap[d.getDay()];
        const isScheduledDay = teacherSchedule.some(s => 
            s.day === dayKey && 
            (s.students && s.students.includes(currentStudentId))
        );

        if (isScheduledDay) {
            newEvents.push({
                id: Date.now() + Math.random(),
                studentId: currentStudentId,
                date: new Date(d).toISOString(),
                type: 'auto-absence',
                title: lessonTitleForAbsence,
                note: `غياب عن درس: ${lessonTitleForAbsence}`
            });
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
            const hasCompletion = rawLogs.some(l => 
                l.dateStr === log.dateStr && 
                l.lessonId === log.lessonId && 
                (l.status === 'completed' || l.status === 'accelerated')
            );
            if (hasCompletion) return;
        }

        let displayStatus = '', displayType = '', rowClass = '', studentState = '';
        
        if (log.type === 'event' || log.type === 'auto-absence') {
            if (log.status === 'vacation') { 
                studentState = 'إجازة'; displayStatus = 'توقف مؤقت'; rowClass = 'bg-info-light'; 
            } else if (log.status === 'excused') { 
                studentState = 'معفى'; displayStatus = 'مؤجل'; rowClass = 'bg-warning-light'; balance--; 
            } else if (log.type === 'auto-absence' || log.status === 'absence') {
                studentState = '<span class="text-danger font-weight-bold">غائب</span>';
                displayStatus = 'لم ينفذ'; 
                displayType = 'أساسية';
                rowClass = 'bg-danger-light';
                balance--;
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
            } else {
                displayType = 'أساسية'; 
            }
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

    let rowsHtml = '';
    if (finalTimeline.length === 0) {
        rowsHtml = '<tr><td colspan="6" class="text-center p-4">لا توجد سجلات.</td></tr>';
    } else {
        rowsHtml = finalTimeline.map(item => {
            let actionsHtml = '-';
            if (item.actions) {
                actionsHtml = `<button class="btn-icon text-danger" onclick="deleteAdminEvent(${item.actions})">🗑️</button>`;
                if (item.rowClass !== 'bg-danger-light') {
                    actionsHtml = `<button class="btn-icon text-primary" onclick="editAdminEvent(${item.actions})">✏️</button>` + actionsHtml;
                }
            }
            
            let statusDisplay = item.studentStatus; 
            let noteHtml = item.note ? `<br><small class="text-muted">[${item.note}]</small>` : '';
            return `<tr class="${item.rowClass || ''}"><td><strong>${item.title}</strong>${noteHtml}</td><td class="text-center">${item.lessonStatus}</td><td class="text-center">${statusDisplay}</td><td class="text-center">${item.sessionType}</td><td class="text-center">${item.date}</td><td class="text-center">${actionsHtml}</td></tr>`;
        }).join('');
    }

    const activeLesson = studentLessons.find(l => l.studentId == currentStudentId && l.status !== 'completed' && l.status !== 'accelerated');
    if (activeLesson) {
        rowsHtml += `
            <tr style="background-color:#f8f9fa; border-top:2px dashed #ccc; color:#666;">
                <td>${activeLesson.title} <small>(الدرس القادم)</small></td>
                <td class="text-center">قيد الانتظار</td>
                <td class="text-center">-</td>
                <td class="text-center">قادم</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
            </tr>
        `;
    }

    container.innerHTML = `
        <div class="content-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <h2>سجل المتابعة اليومي</h2>
                <span class="badge ${balance < 0 ? 'badge-danger' : 'badge-success'}">الرصيد الحالي: ${balance > 0 ? '+' + balance : balance} حصة</span>
            </div>
            <button class="btn btn-primary" onclick="openAdminEventModal()">
                <i class="fas fa-plus-circle"></i> تسجيل حدث
            </button>
        </div>
        <div class="table-responsive">
            <table class="word-table">
                <thead>
                    <tr>
                        <th style="width: 30%;">اسم الدرس</th>
                        <th style="width: 15%;">حالة الدرس</th>
                        <th style="width: 15%;">حالة الطالب</th>
                        <th style="width: 15%;">نوع الحصة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 10%;">إجراءات</th>
                    </tr>
                </thead>
                <tbody id="progressTableBody">${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

// ============================================
// 🎨 ستايل جدول Word وتنسيقات الألوان
// ============================================
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
    `;
    document.head.appendChild(style);
}

// ============================================
// 🛠️ إدارة النوافذ المنبثقة (الأحداث + الواجبات)
// ============================================

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

// 🔥 2. نافذة إسناد الواجبات (تحديث: قائمة منسدلة من بنك الواجبات) 🔥
function injectHomeworkModal() {
    // 🧹 حذف النافذة القديمة
    const oldModal = document.getElementById('assignHomeworkModal');
    if (oldModal) oldModal.remove();

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

// ============================================
// الدوال الأساسية (التشخيص، الخطة، الدروس)
// ============================================

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

// 🔥🔥 4. الواجبات (حالة فارغة + زر يمين) 🔥🔥
function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId == currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    
    // الحالة الفارغة
    if (list.length === 0) { 
        container.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                padding: 50px; 
                text-align: center; 
                border: 2px dashed #e0e0e0; 
                border-radius: 10px; 
                background-color: #fafafa;
                margin-top: 20px;">
                
                <div style="font-size: 3rem; margin-bottom: 10px; color: #ccc;">📝</div>
                <h3 style="color:#555; margin-bottom: 10px;">لا توجد واجبات حالياً</h3>
                <p style="color:#777; margin-bottom: 25px; font-size: 0.95rem;">
                    يمكنك إسناد واجب يدوياً أو سيتم توليدها تلقائياً مع الدروس.
                </p>
                <button class="btn btn-primary" onclick="showAssignHomeworkModal()">
                    <i class="fas fa-plus-circle"></i> إسناد واجب جديد
                </button>
            </div>
        `; 
        return; 
    }

    // الحالة الممتلئة (زر على اليمين)
    const headerHtml = `
        <div class="content-header" style="display:flex; justify-content:flex-start; align-items:center; margin-bottom:20px;">
            <button class="btn btn-primary" onclick="showAssignHomeworkModal()">
                <i class="fas fa-plus-circle"></i> إسناد واجب جديد
            </button>
        </div>
    `;

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
            <button class="btn btn-sm btn-danger mt-3" onclick="deleteAssignment(${a.id})">حذف الواجب</button>
        </div>`
    ).join('');

    container.innerHTML = headerHtml + `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">${cardsHtml}</div>`;
}

// ============================================
// الدوال المساعدة العامة
// ============================================

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

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
    if(!confirm('سيتم حذف الدروس الحالية وتوليد قائمة جديدة. متابعة؟')) return;
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const compDiag = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    if (!compDiag) { alert('يجب إكمال التشخيص أولاً'); return; }
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
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
                            // إنشاء الدرس
                            newLessons.push({
                                id: Date.now() + Math.floor(Math.random()*10000),
                                studentId: currentStudentId, title: m.title, objective: m.linkedInstructionalGoal,
                                originalLessonId: m.id, status: 'pending', assignedDate: new Date().toISOString()
                            });
                            
                            // 🔥 إنشاء واجب تلقائي مرتبط بالدرس 🔥
                            newAssignments.push({
                                id: Date.now() + Math.floor(Math.random()*10000) + 1,
                                studentId: currentStudentId,
                                title: `مراجعة وتطبيق: ${m.title}`,
                                status: 'pending',
                                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // بعد أسبوع
                                assignedDate: new Date().toISOString()
                            });
                        }
                    });
                }
            }
        });
    }

    if(newLessons.length === 0) { alert('لا توجد دروس مقترحة.'); return; }
    
    // حفظ الدروس
    saveAndReindexLessons(newLessons, true);
    
    // حفظ الواجبات التلقائية
    if (newAssignments.length > 0) {
        let currentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
        currentAssignments = [...currentAssignments.filter(a => a.studentId != currentStudentId), ...newAssignments];
        localStorage.setItem('studentAssignments', JSON.stringify(currentAssignments));
    }

    alert('تم توليد الدروس والواجبات المرتبطة بنجاح.');
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

// 🔥🔥 فتح نافذة إسناد الواجب (جلب الواجبات من libraryAssignments) 🔥🔥
function showAssignHomeworkModal() { 
    // 🔥 التعديل هنا: جلب البيانات من مكتبة الواجبات
    const allAssignments = JSON.parse(localStorage.getItem('libraryAssignments') || '[]');
    const select = document.getElementById('homeworkSelect');
    
    // إذا لم يجد العنصر (بسبب التحديث)، أعد بناء النافذة فوراً
    if (!select) {
        injectHomeworkModal();
        // إعادة استدعاء الدالة بعد البناء
        setTimeout(showAssignHomeworkModal, 50);
        return;
    }

    // تعبئة القائمة بالواجبات المتوفرة
    select.innerHTML = '<option value="">اختر من قائمة الواجبات...</option>';
    if (allAssignments.length > 0) {
        allAssignments.forEach(a => {
            select.innerHTML += `<option value="${a.title}">${a.title}</option>`;
        });
    } else {
        select.innerHTML += `<option value="" disabled>لا توجد واجبات في المكتبة</option>`;
    }

    // ضبط تاريخ اليوم كتاريخ افتراضي
    document.getElementById('homeworkDueDate').valueAsDate = new Date();
    
    document.getElementById('assignHomeworkModal').classList.add('show'); 
}

function assignHomework() { 
    const select = document.getElementById('homeworkSelect'); 
    
    // التحقق من الاختيار
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
function showAssignLibraryLessonModal() {
    const all = JSON.parse(localStorage.getItem('lessons') || '[]');
    const s = document.getElementById('libraryLessonSelect');
    s.innerHTML = '<option value="">اختر...</option>';
    all.forEach(l => s.innerHTML += `<option value="${l.id}">${l.title}</option>`);
    document.getElementById('assignLibraryLessonModal').classList.add('show');
}
function assignLibraryLesson() {
    const lessonId = parseInt(document.getElementById('libraryLessonSelect').value);
    if(!lessonId) return;
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = allLessons.find(l => l.id == lessonId);
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);
    myLessons.push({
        id: Date.now(), studentId: currentStudentId, title: lesson.title,
        objective: lesson.linkedInstructionalGoal || 'إضافي', originalLessonId: lessonId,
        status: 'pending', assignedDate: new Date().toISOString(), isIntervention: true
    });
    saveAndReindexLessons(myLessons, false, otherLessons);
    closeModal('assignLibraryLessonModal');
    loadLessonsTab();
}
function formatAnswerDisplay(answerData) {
    if (!answerData) return '<span class="text-muted">لم يجب</span>';
    if (typeof answerData === 'string' && answerData.startsWith('data:image')) return `<img src="${answerData}" style="max-width:100px; border:1px solid #ccc; border-radius:5px; margin-top:5px;">`;
    return answerData;
}
function openReviewModal(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id == assignmentId);
    if(!assignment) { alert('لم يتم العثور على الاختبار'); return; }
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == assignment.testId);
    document.getElementById('reviewAssignmentId').value = assignmentId;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';
    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach((q, index) => {
            const studentAnsObj = assignment.answers ? assignment.answers.find(a => a.questionId == q.id) : null;
            let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
            const formattedAnswer = formatAnswerDisplay(rawAnswer);
            const currentScore = studentAnsObj ? (studentAnsObj.score || 0) : 0;
            const teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
            const maxScore = q.passingScore || 1;
            const item = document.createElement('div');
            item.className = 'review-question-item';
            item.innerHTML = `
                <div class="review-q-header"><strong>س${index+1}: ${q.text}</strong><div><input type="number" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0"><span class="text-muted"> / ${maxScore}</span></div></div>
                <div class="student-answer-box"><strong>إجابة الطالب:</strong><div style="margin-top:5px;">${formattedAnswer}</div></div>
                <div class="teacher-feedback-box"><textarea class="form-control" name="note_${q.id}" placeholder="ملاحظات المعلم...">${teacherNote}</textarea></div>`;
            container.appendChild(item);
        });
    }
    document.getElementById('reviewTestModal').classList.add('show');
}
function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.id == id);
    if(idx === -1) return;
    const container = document.getElementById('reviewQuestionsContainer');
    let totalScore = 0; let maxTotalScore = 0;
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == studentTests[idx].testId);
    if(originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const scoreInp = container.querySelector(`input[name="score_${q.id}"]`);
            const noteInp = container.querySelector(`textarea[name="note_${q.id}"]`);
            if (!studentTests[idx].answers) studentTests[idx].answers = [];
            let ansIdx = studentTests[idx].answers.findIndex(a => a.questionId == q.id);
            const newScore = parseInt(scoreInp.value) || 0;
            if(ansIdx !== -1) { studentTests[idx].answers[ansIdx].score = newScore; studentTests[idx].answers[ansIdx].teacherNote = noteInp.value; }
            else { studentTests[idx].answers.push({ questionId: q.id, score: newScore, teacherNote: noteInp.value, answer: null }); }
            totalScore += newScore; maxTotalScore += (q.passingScore || 1);
        });
        studentTests[idx].score = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
        studentTests[idx].status = 'completed';
    }
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('reviewTestModal');
    loadDiagnosticTab();
    if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
    alert('تم حفظ التصحيح');
}
function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    if(!confirm('إعادة الاختبار للطالب للتعديل؟')) return;
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.id == id);
    if(idx !== -1) {
        studentTests[idx].status = 'returned';
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        closeModal('reviewTestModal');
        loadDiagnosticTab();
        alert('تمت الإعادة');
    }
}

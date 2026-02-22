// ============================================
// 📁 المسار: assets/js/student-profile.js
// ============================================

function calculateAutoGrade(q, studentAnsObj) {
    let maxScore = parseFloat(q.maxScore || q.passingScore || q.points || q.score || 1);
    if(isNaN(maxScore) || maxScore <= 0) maxScore = 1;
    
    let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
    if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') return 0;

    if (q.type.includes('mcq')) {
        let sAns = parseInt(rawAnswer);
        let cAns = parseInt(q.correctAnswer);
        if (!isNaN(sAns) && !isNaN(cAns) && sAns === cAns) return maxScore;
        return 0;
    } 
    
    if (q.type === 'drag-drop') {
        let totalGaps = 0;
        let correctGaps = 0;
        (q.paragraphs || []).forEach((p, pIdx) => {
            (p.gaps || []).forEach((g, gIdx) => {
                totalGaps++;
                let w = (rawAnswer && typeof rawAnswer === 'object' && rawAnswer[`p_${pIdx}_g_${gIdx}`]) ? rawAnswer[`p_${pIdx}_g_${gIdx}`] : '';
                if (String(w).trim() === String(g.dragItem).trim() && String(w).trim() !== '') {
                    correctGaps++;
                }
            });
        });
        if (totalGaps > 0) {
            let calc = (correctGaps / totalGaps) * maxScore;
            return Math.round(calc * 2) / 2;
        }
        return 0;
    }

    if (q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== '') {
        let textAns = extractAnswerText(rawAnswer);
        let sAns = String(textAns).trim().toLowerCase();
        let cAns = String(q.correctAnswer).trim().toLowerCase();
        if (sAns === cAns && sAns !== '') return maxScore;
    }
    return 0; 
}

if (!window.showConfirmModal) {
    window.showConfirmModal = function(message, onConfirm) {
        let modal = document.getElementById('globalConfirmModal');
        if (!modal) {
            const modalHtml = `
                <div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                    <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;">
                        <div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div>
                        <div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div>
                        <div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div>
                        <div style="display:flex; gap:15px; justify-content:center;">
                            <button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button>
                            <button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button>
                        </div>
                    </div>
                </div>
                <style>@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }</style>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalConfirmModal');
        }
        document.getElementById('globalConfirmMessage').innerHTML = message;
        modal.style.display = 'flex';
        document.getElementById('globalConfirmOk').onclick = function() {
            modal.style.display = 'none';
            if (typeof onConfirm === 'function') onConfirm();
        };
        document.getElementById('globalConfirmCancel').onclick = function() {
            modal.style.display = 'none';
        };
    };
}

if (!window.showSuccess) {
    window.showSuccess = function(message) {
        let toast = document.getElementById('globalSuccessToast');
        if (!toast) {
            const toastHtml = `
                <div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;">
                    <i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalSuccessToast');
        }
        document.getElementById('globalSuccessMessage').textContent = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    };
}

if (!window.showError) {
    window.showError = function(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            const toastHtml = `
                <div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;">
                    <i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalErrorToast');
        }
        document.getElementById('globalErrorMessage').innerHTML = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
    };
}

if (!window.showInfoModal) {
    window.showInfoModal = function(title, message, onClose) {
        let modal = document.getElementById('globalInfoModal');
        if (!modal) {
            const modalHtml = `
                <div id="globalInfoModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                    <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;">
                        <div style="font-size:3.5rem; color:#007bff; margin-bottom:15px;"><i class="fas fa-info-circle"></i></div>
                        <div id="globalInfoTitle" style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;"></div>
                        <div id="globalInfoMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div>
                        <div style="display:flex; justify-content:center;">
                            <button id="globalInfoOk" style="background:#007bff; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; font-family:'Tajawal'; width:100%;">حسناً، فهمت</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalInfoModal');
        }
        document.getElementById('globalInfoTitle').innerHTML = title;
        document.getElementById('globalInfoMessage').innerHTML = message;
        modal.style.display = 'flex';
        document.getElementById('globalInfoOk').onclick = function() {
            modal.style.display = 'none';
            if (typeof onClose === 'function') onClose();
        };
    };
}

let currentStudentId = null;
let currentStudent = null;
let editingEventId = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        showError('لم يتم تحديد طالب');
        setTimeout(() => { window.location.href = 'students.html'; }, 1500);
        return;
    }
    
    injectAdminEventModal();
    injectHomeworkModal(); 
    injectWordTableStyles();
    injectReviewStyles(); 
    
    loadStudentData();
});

function injectReviewStyles() {
    if (document.getElementById('customReviewStyles')) return;
    const style = document.createElement('style');
    style.id = 'customReviewStyles';
    style.innerHTML = `
        .student-answer-box { padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; border-right: 4px solid #007bff; white-space: pre-wrap; word-break: break-word; font-size: 1.05rem; line-height: 1.6; overflow-x: hidden; }
        .review-question-item { border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; border-radius: 12px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .review-q-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; background: #f1f5f9; padding: 12px 15px; border-radius: 8px; }
        .score-input-container { display: flex; align-items: center; gap: 5px; background: #fff; padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
        .score-input { width: 70px; text-align: center; font-weight: bold; border: 1px solid #ccc; border-radius: 4px; padding: 4px; font-size:1.1rem; color:#007bff; }
        .teacher-feedback-box textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; min-height: 80px; margin-top: 10px; font-family: inherit; }
        .reading-word-eval { display:inline-block; font-size:1.2rem; margin:5px; cursor:pointer; padding:8px 15px; border-radius:8px; transition:0.2s; border:2px solid transparent; user-select:none; }
        .reading-word-eval:hover { transform:scale(1.05); }
        .word-neutral { background:#f1f5f9; color:#475569; border-color:#cbd5e1; }
        .word-correct { background:#d4edda; color:#155724; border-color:#c3e6cb; }
        .word-wrong { background:#f8d7da; color:#721c24; border-color:#f5c6cb; }
    `;
    document.head.appendChild(style);
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

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id == currentStudentId);
    
    if (!currentStudent) {
        showError('الطالب غير موجود');
        setTimeout(() => { window.location.href = 'students.html'; }, 1500);
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
    if (!currentStudent) { showError('بيانات الطالب غير جاهزة'); return; }

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
    
    if (!dateInput) { showError('يرجى اختيار التاريخ'); return; }

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
    showConfirmModal('هل أنت متأكد من حذف هذا السجل؟', function() {
        let events = JSON.parse(localStorage.getItem('studentEvents') || '[]');
        events = events.filter(e => e.id != id);
        localStorage.setItem('studentEvents', JSON.stringify(events));
        loadProgressTab();
        showSuccess('تم حذف السجل بنجاح');
    });
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('show'); 
}

function extractAnswerText(ans) {
    if (ans === null || ans === undefined) return '';
    if (typeof ans === 'string') {
        if (ans.startsWith('data:') || (ans.length > 200 && !ans.includes(' '))) return '';
        return ans;
    }
    if (Array.isArray(ans)) return ans.join(' ، ');
    if (typeof ans === 'object') {
        if (ans.text) return ans.text;
        if (ans.value) return ans.value;
        if (ans.answer) return ans.answer;
        if (ans.selected) return Array.isArray(ans.selected) ? ans.selected.join(' ، ') : String(ans.selected);
        let keys = Object.keys(ans).sort(); 
        let textParts = [];
        for (let k of keys) {
            if (typeof ans[k] === 'string' && !ans[k].startsWith('data:')) {
                textParts.push(ans[k].trim());
            }
        }
        if (textParts.length > 0) return textParts.join(' ');
        return ''; 
    }
    return String(ans);
}

function formatAnswerDisplay(rawAnswer) {
    if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') {
        return '<span class="text-muted" style="font-style:italic;">(لم يُجب الطالب على هذا السؤال)</span>';
    }
    if (Array.isArray(rawAnswer)) {
        let html = rawAnswer.map(item => formatSingleItem(item)).join('<div style="margin-top:8px; border-bottom:1px dashed #eee; padding-bottom:5px;"></div>');
        return html || '<span class="text-muted">(إجابة فارغة)</span>';
    }
    if (typeof rawAnswer === 'object') {
        if (rawAnswer.selected) {
            let val = Array.isArray(rawAnswer.selected) ? rawAnswer.selected.join(' ، ') : rawAnswer.selected;
            return formatSingleItem(val);
        }
        let itemsHtml = [];
        let keys = Object.keys(rawAnswer).sort(); 
        for (let k of keys) {
            let itemVal = rawAnswer[k];
            if (itemVal !== null && itemVal !== undefined && itemVal !== '') {
                if (typeof itemVal !== 'object') {
                    let formatted = formatSingleItem(itemVal);
                    if (formatted) itemsHtml.push(formatted);
                }
            }
        }
        if (itemsHtml.length > 0) {
            let isMedia = itemsHtml.some(html => html.includes('<img') || html.includes('<audio') || html.includes('<a '));
            if (isMedia) return itemsHtml.join('<div style="margin:15px 0; border-bottom:2px dashed #cbd5e1;"></div>');
            else return itemsHtml.join(' <span style="color:#007bff; font-weight:bold; margin:0 5px;">&larr;</span> ');
        } else {
            return '<span class="text-muted">(إجابة فارغة)</span>';
        }
    }
    return formatSingleItem(rawAnswer);
}

function formatSingleItem(text) {
    if (!text) return '';
    let str = String(text).trim();
    if (str.startsWith('{') && str.endsWith('}')) {
        try { return formatAnswerDisplay(JSON.parse(str)); } catch(e) {}
    }
    if (str.startsWith('data:image')) {
        return `<img src="${str}" style="max-width:100%; max-height:200px; border:1px solid #ccc; border-radius:8px; display:block; object-fit:contain; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
    }
    if (str.startsWith('data:audio')) {
        return `<audio controls src="${str}" style="width:100%; max-width:300px; height:45px;"></audio>`;
    }
    if (str.startsWith('data:')) {
        return `<a href="${str}" download="مرفق_إجابة" class="btn btn-sm btn-outline-primary"><i class="fas fa-file-download"></i> تحميل المرفق</a>`;
    }
    if (str.length > 500 && !str.includes(' ')) {
        return `<span style="color:#dc3545; font-size:0.85rem;"><i class="fas fa-exclamation-triangle"></i> بيانات غير مدعومة</span>`;
    }
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderDragDropReview(q, rawAnswer) {
    if (!q.paragraphs || q.paragraphs.length === 0) return '<span class="text-muted">لا توجد جمل لعرضها</span>';
    let sentencesHtml = '<div style="display:flex; flex-direction:column; gap:15px; margin-top:10px;">';
    q.paragraphs.forEach((p, pIdx) => {
        let processedText = p.text;
        if (p.gaps) {
            p.gaps.forEach((g, gIdx) => {
                let studentWord = (rawAnswer && typeof rawAnswer === 'object' && rawAnswer[`p_${pIdx}_g_${gIdx}`]) 
                                  ? rawAnswer[`p_${pIdx}_g_${gIdx}`] : '';
                let isCorrect = studentWord.trim() === g.dragItem.trim();
                let color = isCorrect ? '#155724' : '#721c24';
                let bg = isCorrect ? '#d4edda' : '#f8d7da';
                let border = isCorrect ? '#c3e6cb' : '#f5c6cb';
                let displayWord = studentWord ? studentWord : '<span style="color:#999; font-size:0.95rem;">(لم يُجب)</span>';
                let icon = studentWord ? (isCorrect ? '<i class="fas fa-check" style="margin-right:8px; font-size:1rem;"></i>' : '<i class="fas fa-times" style="margin-right:8px; font-size:1rem;"></i>') : '';
                let wordBadge = `<span style="background:${bg}; color:${color}; padding:2px 15px; border-radius:8px; border-bottom:3px solid ${border}; font-weight:bold; margin:0 5px; display:inline-flex; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">${displayWord} ${icon}</span>`;
                processedText = processedText.replace(g.dragItem, wordBadge);
            });
        }
        sentencesHtml += `<div style="background:#fff; padding:15px 25px; border:1px solid #e2e8f0; border-radius:10px; font-size:1.35rem; line-height:2.6; box-shadow:inset 0 0 10px rgba(0,0,0,0.02); color:#334155;">${processedText}</div>`;
    });
    sentencesHtml += '</div>';
    return sentencesHtml;
}

function buildTeacherReviewItem(q, index, studentAnsObj) {
    let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
    let evaluations = (studentAnsObj && studentAnsObj.evaluations) ? studentAnsObj.evaluations : {};
    
    let maxScore = parseFloat(q.maxScore || q.passingScore || q.points || q.score || 1);
    if(isNaN(maxScore) || maxScore <= 0) maxScore = 1;
    
    let currentScore = studentAnsObj ? studentAnsObj.score : undefined;
    if (currentScore === undefined || currentScore === null) {
         currentScore = calculateAutoGrade(q, studentAnsObj);
    }
    
    let teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
    let html = '';

    if (q.type.includes('mcq')) {
        let sAns = (rawAnswer !== null && rawAnswer !== undefined && rawAnswer !== '') ? parseInt(rawAnswer) : -1;
        let cAns = (q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== '') ? parseInt(q.correctAnswer) : -1;
        
        html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
        (q.choices || []).forEach((choice, i) => {
            let isStudent = (sAns === i);
            let isCorrect = (cAns === i);
            let bg = isCorrect ? '#d4edda' : (isStudent ? '#f8d7da' : '#f8f9fa');
            let border = isCorrect ? '#c3e6cb' : (isStudent ? '#f5c6cb' : '#eee');
            let icon = isCorrect ? '✅' : (isStudent ? '❌' : '');
            html += `<div style="padding:10px; border:2px solid ${border}; border-radius:8px; background:${bg}; display:flex; justify-content:space-between; align-items:center; font-weight:bold;">
                <span>${icon} ${choice}</span>
                ${isStudent && !isCorrect ? '<span class="badge badge-danger">إجابة الطالب</span>' : ''}
                ${isStudent && isCorrect ? '<span class="badge badge-success">إجابة الطالب</span>' : ''}
            </div>`;
        });
        html += `</div>`;
        
    } else if (q.type === 'drag-drop') {
        html += renderDragDropReview(q, rawAnswer);
    } else if (q.paragraphs && q.paragraphs.length > 0) {
        
        if (q.type === 'manual-reading') {
            html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
            q.paragraphs.forEach((p, pIdx) => {
                let pKey = `p_${pIdx}`;
                let words = (p.text || '').trim().split(/\s+/);
                
                let wordsHtml = words.map((w, wIdx) => {
                    let wKey = `${pKey}_w_${wIdx}`;
                    let wEval = evaluations[wKey] || '';
                    let wClass = wEval === 'correct' ? 'word-correct' : (wEval === 'wrong' ? 'word-wrong' : 'word-neutral');
                    let icon = wEval === 'correct' ? ' ✔️' : (wEval === 'wrong' ? ' ❌' : '');
                    return `<span class="reading-word-eval ${wClass}" onclick="toggleReadingWord(this, '${q.id}', '${wKey}')" data-state="${wEval}">
                        ${w}${icon}
                        <input type="hidden" name="eval_${q.id}_${wKey}" value="${wEval}">
                    </span>`;
                }).join(' ');

                html += `
                <div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; background:#fff; position:relative;">
                    <div style="font-weight:bold; margin-bottom:10px; color:#007bff; font-size:0.9rem;"><i class="fas fa-hand-pointer"></i> اضغط على الكلمة لتصحيحها (أخضر=صح، أحمر=خطأ):</div>
                    <div style="background:#f8f9fa; padding:15px; border-radius:5px; line-height:2.8; text-align:justify;">
                        ${wordsHtml}
                    </div>
                </div>`;
            });
            html += `</div>`;
        } 
        else {
            html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
            q.paragraphs.forEach((p, pIdx) => {
                let pKey = `p_${pIdx}`;
                let pAns = (rawAnswer && typeof rawAnswer === 'object') ? rawAnswer[pKey] : null;
                let displayAns = formatSingleItem(pAns);
                let evalState = evaluations[pKey] || ''; 
                
                let btnCorrect = `<button type="button" class="btn btn-sm ${evalState === 'correct' ? 'btn-success' : 'btn-outline-success'}" onclick="setEvalState(this, '${q.id}', '${pKey}', 'correct')">✔️ صحيح</button>`;
                let btnWrong = `<button type="button" class="btn btn-sm ${evalState === 'wrong' ? 'btn-danger' : 'btn-outline-danger'}" onclick="setEvalState(this, '${q.id}', '${pKey}', 'wrong')">❌ خاطئ</button>`;

                html += `
                <div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; background:#fff; position:relative; overflow:hidden;">
                    ${evalState === 'correct' ? '<div style="position:absolute; top:0; right:0; bottom:0; width:5px; background:#28a745;"></div>' : ''}
                    ${evalState === 'wrong' ? '<div style="position:absolute; top:0; right:0; bottom:0; width:5px; background:#dc3545;"></div>' : ''}
                    
                    <div style="font-weight:bold; margin-bottom:10px; color:#475569;"><i class="fas fa-caret-left"></i> ${p.text || 'الفقرة ' + (pIdx+1)}</div>
                    <div style="background:#f8f9fa; padding:10px; border-radius:5px; margin-bottom:10px; text-align:center; min-height:60px; display:flex; align-items:center; justify-content:center;">
                        ${displayAns || '<span class="text-muted">لم يُجب الطالب</span>'}
                    </div>
                    <div class="eval-controls" style="display:flex; gap:10px; justify-content:center; background:#f1f5f9; padding:10px; border-radius:5px; border:1px dashed #cbd5e1;">
                        <span style="font-size:0.9rem; color:#64748b; margin-top:5px; font-weight:bold;">التقييم:</span>
                        ${btnCorrect}
                        ${btnWrong}
                        <input type="hidden" name="eval_${q.id}_${pKey}" value="${evalState}">
                    </div>
                </div>`;
            });
            html += `</div>`;
        }
        
    } else {
        html += `<div style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #eee;">${formatSingleItem(rawAnswer)}</div>`;
    }

    currentScore = parseFloat(currentScore) || 0;

    return `
        <div class="review-question-item" id="q-review-item-${q.id}">
            <div class="review-q-header" style="background:#e3f2fd; border-bottom:2px solid #90caf9;">
                <div style="flex:1; font-size:1.1rem; color:#1565c0;"><strong>س${index+1}: ${q.text}</strong></div>
                <div class="score-input-container" style="box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <input type="number" step="0.5" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0">
                    <span class="text-muted" style="font-size:0.9rem;"> / ${maxScore} درجة</span>
                </div>
            </div>
            <div class="student-answer-box" style="background:transparent; border:none; padding:0;">
                ${html}
            </div>
            <div class="teacher-feedback-box mt-3">
                <label style="font-weight:bold; color:#555; font-size:0.9rem;"><i class="fas fa-comment-medical"></i> ملاحظات المعلم (تظهر للطالب):</label>
                <textarea class="form-control" name="note_${q.id}" placeholder="اكتب توجيهاً للطالب هنا...">${teacherNote}</textarea>
            </div>
        </div>`;
}

window.toggleReadingWord = function(span, qId, wKey) {
    let currentState = span.getAttribute('data-state');
    let hiddenInput = span.querySelector('input');
    let newState = '';
    let newClass = 'word-neutral';
    let icon = '';
    let textOnly = span.innerText.replace(/✔️|❌/g, '').trim();

    if (currentState === '') { newState = 'correct'; newClass = 'word-correct'; icon = ' ✔️'; }
    else if (currentState === 'correct') { newState = 'wrong'; newClass = 'word-wrong'; icon = ' ❌'; }
    else { newState = ''; newClass = 'word-neutral'; icon = ''; } 

    span.setAttribute('data-state', newState);
    hiddenInput.value = newState;
    span.className = `reading-word-eval ${newClass}`;
    span.innerHTML = `${textOnly}${icon}<input type="hidden" name="eval_${qId}_${wKey}" value="${newState}">`;
    
    recalculateScore(qId);
}

window.setEvalState = function(btn, qId, pKey, state) {
    const container = btn.closest('.eval-controls');
    const hiddenInput = container.querySelector(`input[name="eval_${qId}_${pKey}"]`);
    const btns = container.querySelectorAll('button');
    
    btns[0].className = 'btn btn-sm btn-outline-success';
    btns[1].className = 'btn btn-sm btn-outline-danger';

    if (hiddenInput.value === state) {
        hiddenInput.value = ''; 
    } else {
        hiddenInput.value = state;
        if (state === 'correct') btns[0].className = 'btn btn-sm btn-success';
        else if (state === 'wrong') btns[1].className = 'btn btn-sm btn-danger';
    }
    
    const wrapper = container.closest('div[style*="position:relative"]');
    if (wrapper) {
        let coloredBar = wrapper.querySelector('div[style*="position:absolute"]');
        if (coloredBar) coloredBar.remove();
        if (hiddenInput.value === 'correct') wrapper.insertAdjacentHTML('afterbegin', '<div style="position:absolute; top:0; right:0; bottom:0; width:5px; background:#28a745;"></div>');
        else if (hiddenInput.value === 'wrong') wrapper.insertAdjacentHTML('afterbegin', '<div style="position:absolute; top:0; right:0; bottom:0; width:5px; background:#dc3545;"></div>');
    }

    recalculateScore(qId);
}

function recalculateScore(qId) {
    const qCard = document.getElementById(`q-review-item-${qId}`);
    if(!qCard) return;
    const scoreInp = qCard.querySelector('.score-input');
    const maxScore = parseFloat(scoreInp.max);
    const hiddenInputs = qCard.querySelectorAll('input[type="hidden"][name^="eval_"]');
    
    if(hiddenInputs.length > 0) {
        let correctCount = 0;
        let answeredCount = 0;
        hiddenInputs.forEach(inp => {
            if(inp.value === 'correct') correctCount++;
            if(inp.value !== '') answeredCount++;
        });
        
        if (answeredCount > 0) {
            let calcScore = (correctCount / hiddenInputs.length) * maxScore;
            scoreInp.value = Math.round(calcScore * 2) / 2;
            scoreInp.style.backgroundColor = '#fff3cd';
            setTimeout(() => scoreInp.style.backgroundColor = '#fff', 1000);
        }
    }
}

// 🔥 دالة التوليد التلقائي المطورة بمعالج النصوص الذكي 🔥
function autoGenerateLessons() {
    showConfirmModal('توليد الخطة العلاجية تلقائياً؟<br><small>سيتم حذف الدروس الحالية وتوليد قائمة جديدة بناءً على نتيجة التشخيص (محك الاجتياز).</small>', function() {
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const compDiag = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
        
        if (!compDiag) { showError('يجب إكمال وتصحيح الاختبار التشخيصي أولاً.'); return; }
        
        const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
        const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        const allLibraryAssignments = JSON.parse(localStorage.getItem('assignments') || '[]'); 
        const originalTest = JSON.parse(localStorage.getItem('tests') || '[]').find(t => t.id == compDiag.testId);

        let newLessons = [];
        let newAssignments = []; 

        if(originalTest && originalTest.questions) {
            originalTest.questions.forEach(q => {
                const ans = compDiag.answers ? compDiag.answers.find(a => a.questionId == q.id) : null;
                const score = ans ? parseFloat(ans.score || 0) : 0;
                const maxScore = parseFloat(q.maxScore || q.passingScore || q.points || q.score || 1);
                const criterion = parseFloat(q.passingCriterion || 80);
                
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                
                // إذا لم يتجاوز الطالب المحك، يحتاج إلى درس
                if(percentage < criterion && q.linkedGoalId) {
                    const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                    if(obj) {
                        // 1. تجميع كل الأهداف (الرئيسي والفرعية) وتنظيفها من المسافات الزائدة
                        const targetGoals = [obj.shortTermGoal, ...(obj.instructionalGoals || [])]
                                            .filter(g => g) // إزالة القيم الفارغة
                                            .map(g => String(g).trim());

                        // 2. البحث الذكي في الدروس بمطابقة النصوص المنظفة
                        const matches = allLessons.filter(l => {
                            if (!l.linkedInstructionalGoal) return false;
                            const lessonGoal = String(l.linkedInstructionalGoal).trim();
                            return targetGoals.includes(lessonGoal);
                        });
                        
                        matches.forEach(m => {
                            // منع التكرار
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
                                
                                // البحث عن الواجب المرتبط وتوليده أيضاً
                                const lessonGoalForHomework = String(m.linkedInstructionalGoal).trim();
                                const linkedHomework = allLibraryAssignments.find(h => {
                                    if(!h.linkedInstructionalGoal) return false;
                                    return String(h.linkedInstructionalGoal).trim() === lessonGoalForHomework;
                                });

                                if (linkedHomework && !newAssignments.find(a => a.title === linkedHomework.title)) {
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

        if(newLessons.length === 0) { showInfoModal('الخطة العلاجية', 'الطالب متفوق! لقد تجاوز محك الاجتياز في جميع المهارات، ولا توجد نقاط ضعف تتطلب خطة علاجية.'); return; }
        
        saveAndReindexLessons(newLessons, true);
        
        if (newAssignments.length > 0) {
            let currentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
            currentAssignments = [...currentAssignments.filter(a => a.studentId != currentStudentId), ...newAssignments];
            localStorage.setItem('studentAssignments', JSON.stringify(currentAssignments));
            showSuccess(`تم إسناد ${newLessons.length} درس و ${newAssignments.length} واجب مرتبط للطالب.`);
        } else {
            showSuccess(`تم إسناد ${newLessons.length} درس للطالب ضمن الخطة العلاجية.`);
        }

        if (document.getElementById('section-assignments').classList.contains('active')) loadAssignmentsTab();
    });
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
    if(studentTests.some(t => t.studentId == currentStudentId && t.type === 'diagnostic')) { showError('يوجد اختبار معين مسبقاً لهذا الطالب.'); return; }
    studentTests.push({ id: Date.now(), studentId: currentStudentId, testId: testId, type: 'diagnostic', status: 'pending', assignedDate: new Date().toISOString() });
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('assignTestModal');
    loadDiagnosticTab();
    showSuccess('تم تعيين الاختبار بنجاح.');
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
    
    if(!select || !select.value) { showError('الرجاء اختيار واجب من القائمة'); return; }
    
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
    showSuccess('تم إسناد الواجب بنجاح'); 
}

function deleteAssignment(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا الواجب؟', function() {
        let list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); 
        list = list.filter(a => a.id != id); 
        localStorage.setItem('studentAssignments', JSON.stringify(list)); 
        loadAssignmentsTab(); 
        showSuccess('تم الحذف بنجاح');
    });
}

function openReviewModal(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id == assignmentId);
    
    if(!assignment) { 
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const test = studentTests.find(t => t.id == assignmentId);
        if (test) { openTestReviewModal(test); return; } 
        showError('لم يتم العثور على الواجب أو الاختبار.'); return; 
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
            container.innerHTML += buildTeacherReviewItem(q, index, studentAnsObj);
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
            container.innerHTML += buildTeacherReviewItem(q, index, studentAnsObj);
        });
    }
    document.getElementById('reviewTestModal').classList.add('show');
}

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
            
            let newScore = 0;
            if (scoreInp && scoreInp.value !== '') {
                newScore = parseFloat(scoreInp.value);
                if(isNaN(newScore)) newScore = 0;
            }
            
            if(ansIdx === -1) {
                studentAssignments[idx].answers.push({ questionId: q.id, answer: null });
                ansIdx = studentAssignments[idx].answers.length - 1;
            }
            
            studentAssignments[idx].answers[ansIdx].score = newScore;
            studentAssignments[idx].answers[ansIdx].teacherNote = noteInp ? noteInp.value : '';
            
            if (!studentAssignments[idx].answers[ansIdx].evaluations) {
                studentAssignments[idx].answers[ansIdx].evaluations = {};
            }
            const evalInputs = container.querySelectorAll(`input[type="hidden"][name^="eval_${q.id}_"]`);
            evalInputs.forEach(inp => {
                let pKey = inp.name.replace(`eval_${q.id}_`, '');
                studentAssignments[idx].answers[ansIdx].evaluations[pKey] = inp.value;
            });

            totalScore += newScore; 
            let maxQScore = parseFloat(q.maxScore || q.passingScore || q.points || q.score || 1);
            if (isNaN(maxQScore) || maxQScore <= 0) maxQScore = 1;
            maxTotalScore += maxQScore;
        });
        
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
    
    showSuccess('تم حفظ التصحيح واعتماد الدرجة بنجاح');
}

function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    showConfirmModal('إعادة الاختبار للطالب؟<br><small>سيتم إرجاع الاختبار للطالب ليقوم بتعديل إجاباته وإعادة التسليم.</small>', function() {
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
        showSuccess('تمت إعادة الاختبار للطالب بنجاح');
    });
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
        showError('يرجى اختيار درس لإسناده');
        return;
    }

    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const targetLesson = allLessons.find(l => l.id == lessonId);

    if (!targetLesson) {
        showError('الدرس المختار لم يعد موجوداً');
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
    
    showSuccess('تم إسناد الدرس للطالب بنجاح');
}

function regenerateLessons() {
    autoGenerateLessons(); 
}

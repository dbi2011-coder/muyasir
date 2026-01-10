// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: نظام التقدم الأكاديمي الذكي (رصيد الحصص + تنظيف العرض + الأرشفة)
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
// 🔥 1. محرك سجل التقدم الذكي (المحدث والكامل)
// ============================================
function loadProgressTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');

    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    let myEvents = adminEvents.filter(e => e.studentId == currentStudentId);

    // 1. تحديد تاريخ بداية الخطة (نقطة الصفر)
    let planStartDate = null;
    if (myList.length > 0) {
        const sortedByCreation = [...myList].sort((a, b) => new Date(a.assignedDate) - new Date(b.assignedDate));
        planStartDate = new Date(sortedByCreation[0].assignedDate);
    }

    if (!planStartDate) {
        document.getElementById('section-progress').innerHTML = `
            <div class="content-header"><h1>سجل المتابعة اليومي</h1></div>
            <div class="empty-state"><h3>لم تبدأ الخطة بعد</h3><p>يجب إكمال التشخيص وتوليد الدروس لبدء الحساب.</p></div>`;
        return;
    }

    // 2. تجهيز البيانات الخام مع تحسينات
    let rawLogs = [];

    // أ) تفكيك سجلات الدروس مع تحسين المنطق
    myList.forEach(l => {
        if (l.historyLog && l.historyLog.length > 0) {
            // ✅ ترتيب السجلات تاريخياً داخل الدرس الواحد
            const sortedLogs = [...l.historyLog].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // ✅ تحسين المنطق: إيجاد تواريخ البداية والنهاية لكل درس
            const lessonLogs = [];
            let lessonStarted = false;
            
            for (const log of sortedLogs) {
                if (log.status === 'started') {
                    if (!lessonStarted) {
                        lessonLogs.push(log);
                        lessonStarted = true;
                    }
                } else if (log.status === 'completed' || log.status === 'accelerated') {
                    lessonLogs.push(log);
                    break; // ✅ توقف بعد الإنجاز
                } else if (log.status === 'extension') {
                    // ✅ احتفظ بـ "تمديد" فقط إذا لم يكن هناك إنجاز بعد
                    const hasCompletionAfterThis = sortedLogs.some(
                        laterLog => new Date(laterLog.date) > new Date(log.date) && 
                        (laterLog.status === 'completed' || laterLog.status === 'accelerated')
                    );
                    if (!hasCompletionAfterThis) {
                        lessonLogs.push(log);
                    }
                } else {
                    lessonLogs.push(log); // حالات أخرى مثل الغياب
                }
            }
            
            // ✅ إضافة السجلات المصفاة
            lessonLogs.forEach(log => {
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

    // ب) تفكيك الأحداث الإدارية
    myEvents.forEach(e => {
        rawLogs.push({
            dateObj: new Date(e.date),
            dateStr: new Date(e.date).toDateString(),
            type: 'event',
            status: e.type,
            title: 'حدث إداري',
            id: e.id,
            note: e.note
        });
    });

    // 3. المعالجة الزمنية اليومية
    let finalTimeline = [];
    let balance = 0;
    const today = new Date();
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // الحصول على الدرس الحالي النشط
    const activeLessons = myList.filter(l => l.status !== 'completed' && l.status !== 'accelerated');
    const currentActiveLesson = activeLessons.length > 0 ? activeLessons[0] : null;

    // حلقة التكرار الرئيسية (يوم بيوم)
    for (let d = new Date(planStartDate); d <= today; d.setDate(d.getDate() + 1)) {
        const currentDateStr = d.toDateString();
        const dayKey = dayMap[d.getDay()];

        // ✅ التحقق إذا كان اليوم مجدولاً
        const isScheduledDay = teacherSchedule.some(s => 
            s.day === dayKey && 
            (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId)))
        );

        // ✅ جلب أحداث اليوم
        let daysLogs = rawLogs.filter(log => log.dateStr === currentDateStr);

        // ✅ التحقق من أنواع الأحداث في اليوم
        const hasEventToday = daysLogs.some(l => l.type === 'event');

        // ✅ منطق الغياب التلقائي
        if (daysLogs.length === 0 && isScheduledDay && !hasEventToday) {
            // ✅ السيناريو: يوم مجدول بدون سجلات (غياب تلقائي)
            const previousBalance = balance;
            balance--; // خصم من الرصيد
            
            finalTimeline.push({
                title: currentActiveLesson ? currentActiveLesson.title : 'حصة مجدولة',
                lessonStatus: 'لم ينفذ',
                studentStatus: '<span class="text-danger font-weight-bold">غائب</span>',
                sessionType: 'أساسية',
                date: d.toLocaleDateString('ar-SA'),
                rawDate: new Date(d),
                balanceSnapshot: balance,
                actions: null,
                note: 'غياب تلقائي (لم يسجل حضور)',
                rowClass: 'bg-danger-light'
            });
            continue;
        }

        // ✅ معالجة السجلات الفعلية لهذا اليوم
        daysLogs.forEach(log => {
            let displayStatus = '';
            let displayType = '';
            let rowClass = '';
            let studentState = '';
            const previousBalance = balance;

            // --- حالة 1: حدث إداري ---
            if (log.type === 'event') {
                if (log.status === 'vacation') {
                    studentState = 'إجازة'; 
                    displayStatus = 'توقف مؤقت'; 
                    rowClass = 'bg-info-light';
                } else if (log.status === 'excused') {
                    studentState = 'معفى'; 
                    displayStatus = 'مؤجل'; 
                    rowClass = 'bg-warning-light';
                    balance--; // خصم من الرصيد
                }
            
            // --- حالة 2: غياب مسجل ---
            } else if (log.status === 'absence') {
                studentState = '<span class="text-danger font-weight-bold">غائب</span>';
                displayStatus = 'لم يؤخذ';
                rowClass = 'bg-danger-light';
                balance--;
                
            // --- حالة 3: حضور درس ---
            } else {
                studentState = 'حاضر';
                
                // ✅ تحسين عرض حالة الدرس
                if (log.status === 'started') {
                    displayStatus = 'بدأ';
                } else if (log.status === 'extension') {
                    displayStatus = 'تمديد';
                } else if (log.status === 'completed') { 
                    displayStatus = '<span class="text-success font-weight-bold">✔ متحقق</span>'; 
                    rowClass = 'bg-success-light'; 
                } else if (log.status === 'accelerated') { 
                    displayStatus = '<span class="text-warning font-weight-bold">⚡ تسريع</span>'; 
                    rowClass = 'bg-warning-light'; 
                }

                // ✅ تحديد نوع الحصة
                if (log.cachedType) {
                    if (log.cachedType === 'basic') displayType = 'أساسية';
                    else if (log.cachedType === 'compensation') { 
                        displayType = '<span class="text-primary font-weight-bold">تعويضية</span>'; 
                        balance++; 
                    }
                    else if (log.cachedType === 'additional') { 
                        displayType = 'إضافية'; 
                        balance++; 
                    }
                } else {
                    if (isScheduledDay) {
                        displayType = 'أساسية';
                        // ✅ في الحصة الأساسية لا نغير الرصيد
                    } else {
                        // ✅ يوم غير مجدول
                        if (previousBalance < 0) {
                            displayType = '<span class="text-primary font-weight-bold">تعويضية</span>';
                            balance++;
                        } else {
                            displayType = 'إضافية';
                            balance++;
                        }
                    }
                    
                    // ✅ حفظ نوع الحصة إذا لم يكن مخزناً
                    const lessonIndex = studentLessons.findIndex(l => l.id === log.lessonId);
                    if (lessonIndex !== -1) {
                        const historyLogIndex = studentLessons[lessonIndex].historyLog.findIndex(
                            h => new Date(h.date).toDateString() === log.dateStr && h.status === log.status
                        );
                        if (historyLogIndex !== -1) {
                            if (isScheduledDay) {
                                studentLessons[lessonIndex].historyLog[historyLogIndex].cachedSessionType = 'basic';
                            } else if (previousBalance < 0) {
                                studentLessons[lessonIndex].historyLog[historyLogIndex].cachedSessionType = 'compensation';
                            } else {
                                studentLessons[lessonIndex].historyLog[historyLogIndex].cachedSessionType = 'additional';
                            }
                            localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
                        }
                    }
                }
            }

            // ✅ إضافة السجل للقائمة النهائية
            finalTimeline.push({
                title: log.title,
                lessonStatus: displayStatus,
                studentStatus: studentState,
                sessionType: displayType,
                date: d.toLocaleDateString('ar-SA'),
                rawDate: new Date(d),
                balanceSnapshot: balance,
                actions: log.type === 'event' ? log.id : null,
                note: log.note || (log.type === 'lesson' ? '' : log.title),
                rowClass: rowClass
            });
        });
    }

    // 4. بناء الجدول
    finalTimeline.sort((a, b) => a.rawDate - b.rawDate);

    const container = document.getElementById('section-progress');
    container.innerHTML = `
        <div class="content-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <h2>سجل المتابعة اليومي</h2>
                <span class="badge ${balance < 0 ? 'badge-danger' : 'badge-success'}">
                    الرصيد الحالي: ${balance > 0 ? '+' + balance : balance} حصة
                </span>
                <small class="text-muted" style="display:block; margin-top:5px;">
                    ${balance < 0 ? 'عليه دين' : balance > 0 ? 'لديه رصيد إضافي' : 'متوازن'}
                </small>
            </div>
            <button class="btn btn-primary" onclick="openAdminEventModal()">
                <i class="fas fa-plus-circle"></i> تسجيل حدث (إعفاء/إجازة)
            </button>
        </div>
        
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">📊 ملخص الرصيد</h5>
                <p class="card-text">
                    <strong>قاعدة الحساب:</strong><br>
                    • الحصة الأساسية في يومها: لا تغير الرصيد<br>
                    • الغياب في يوم مجدول: -1 (دين)<br>
                    • الحضور في يوم غير مجدول مع وجود دين: +1 (تعويضية)<br>
                    • الحضور في يوم غير مجدول بدون دين: +1 (إضافية)
                </p>
            </div>
        </div>
        
        <div class="table-responsive">
            <table class="word-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">البيان</th>
                        <th style="width: 15%;">حالة الدرس</th>
                        <th style="width: 15%;">حالة الطالب</th>
                        <th style="width: 15%;">نوع الحصة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 15%;">الرصيد بعد</th>
                    </tr>
                </thead>
                <tbody id="progressTableBody"></tbody>
            </table>
        </div>
    `;

    const tbody = document.getElementById('progressTableBody');
    if (finalTimeline.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد سجلات.</td></tr>';
        return;
    }

    tbody.innerHTML = finalTimeline.map(item => {
        let actionsHtml = '-';
        if (item.actions) {
            actionsHtml = `
                <button class="btn-icon text-primary" onclick="editAdminEvent(${item.actions})">✏️</button>
                <button class="btn-icon text-danger" onclick="deleteAdminEvent(${item.actions})">🗑️</button>
            `;
        }

        let noteHtml = item.note ? `<br><small class="text-muted">[${item.note}]</small>` : '';
        let balanceColor = item.balanceSnapshot < 0 ? 'text-danger' : item.balanceSnapshot > 0 ? 'text-success' : 'text-muted';
        let balanceSign = item.balanceSnapshot > 0 ? '+' : '';

        return `
            <tr class="${item.rowClass || ''}">
                <td><strong>${item.title}</strong>${noteHtml}</td>
                <td class="text-center">${item.lessonStatus}</td>
                <td class="text-center">${item.studentStatus}</td>
                <td class="text-center">${item.sessionType || '-'}</td>
                <td class="text-center">${item.date}</td>
                <td class="text-center ${balanceColor} font-weight-bold">${balanceSign}${item.balanceSnapshot}</td>
            </tr>
        `;
    }).join('');

    // ✅ إضافة ملخص الدرس الحالي إذا كان موجوداً
    if (currentActiveLesson) {
        tbody.innerHTML += `
            <tr style="background-color:#f8f9fa; border-top:3px double #ccc; color:#666; font-weight:bold;">
                <td>${currentActiveLesson.title} <small>(الدرس الحالي)</small></td>
                <td class="text-center">قيد التنفيذ</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
            </tr>
        `;
    }
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
// 🛠️ إدارة الأحداث (إضافة / تعديل / حذف)
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
    const date = document.getElementById('manualEventDate').value;
    const note = document.getElementById('manualEventNote').value;
    if (!date) { alert('يرجى اختيار التاريخ'); return; }

    let events = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    
    if (editingEventId) {
        const idx = events.findIndex(e => e.id == editingEventId);
        if (idx !== -1) {
            events[idx].type = type;
            events[idx].date = new Date(date).toISOString();
            events[idx].note = note;
        }
    } else {
        events.push({
            id: Date.now(),
            studentId: currentStudentId,
            date: new Date(date).toISOString(),
            type: type,
            note: note
        });
    }

    localStorage.setItem('studentEvents', JSON.stringify(events));
    closeAdminEventModal();
    loadProgressTab();
}

function deleteAdminEvent(id) {
    if (!confirm('حذف هذا الحدث؟')) return;
    let events = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    events = events.filter(e => e.id != id);
    localStorage.setItem('studentEvents', JSON.stringify(events));
    loadProgressTab();
}

// ============================================
// الدوال الأساسية (التشخيص، الخطة، الدروس) - مستعادة بالكامل
// ============================================

// 1. التشخيص
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

// 2. الخطة التربوية
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
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    let scheduleCells = dayKeys.map(dk => {
        const session = teacherSchedule.find(s => s.day === dk && (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId))));
        return `<td style="height:50px;">${session ? 'حصة ' + (session.period||1) : ''}</td>`;
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

// 3. الدروس
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
        
        if (l

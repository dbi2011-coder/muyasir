// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: ملف الطالب (تصميم جدول Word + كشف غياب تلقائي + تعديل الأحداث)
// ============================================

let currentStudentId = null;
let currentStudent = null;
let editingEventId = null; // متغير لتخزين ID الحدث عند التعديل

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }
    
    injectAdminEventModal();
    injectWordTableStyles(); // حقن ستايل الجدول الشبيه بالوورد
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
    
    // تحديث الواجهة
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
// 1. جدول التقدم (Sijill) - التصميم الجديد
// ============================================
function loadProgressTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');

    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    let myEvents = adminEvents.filter(e => e.studentId == currentStudentId);

    // 1. بناء الخط الزمني الأساسي (الموجود فعلياً)
    let timeline = [];
    
    // أ) سجلات الدروس
    let registeredDates = new Set(); // لتتبع الأيام المسجلة ومنع التكرار
    
    myList.forEach(l => {
        if (l.historyLog && l.historyLog.length > 0) {
            l.historyLog.forEach(log => {
                const dStr = new Date(log.date).toDateString(); // للمقارنة بدون وقت
                registeredDates.add(dStr);
                
                timeline.push({
                    date: log.date,
                    type: 'lesson',
                    title: l.title,
                    status: log.status, // started, extension, completed, absence, accelerated
                    originalLesson: l
                });
            });
        }
    });

    // ب) الأحداث الإدارية
    myEvents.forEach(e => {
        const dStr = new Date(e.date).toDateString();
        registeredDates.add(dStr);
        
        timeline.push({
            date: e.date,
            type: 'event',
            id: e.id,
            title: 'حدث إداري',
            status: e.type, // excused, vacation
            note: e.note
        });
    });

    // 2. كشف الفجوات (الغياب التلقائي) حتى اليوم
    // نحدد تاريخ البداية (أول درس مسجل أو تاريخ التعيين)
    let startDate = null;
    if (myList.length > 0) {
        // نأخذ أقدم تاريخ تعيين
        const sortedLessons = [...myList].sort((a,b) => new Date(a.assignedDate) - new Date(b.assignedDate));
        startDate = new Date(sortedLessons[0].assignedDate);
    }
    
    if (startDate) {
        const today = new Date();
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // حلقة تكرار من البداية وحتى اليوم
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dStr = d.toDateString();
            
            // إذا كان هذا اليوم مسجلاً بالفعل (حضور أو حدث)، نتجاوزه
            if (registeredDates.has(dStr)) continue;

            const dayName = dayMap[d.getDay()];
            // هل هذا اليوم يوم حصة في الجدول؟
            const isClassDay = teacherSchedule.some(s => 
                s.day === dayName && 
                (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId)))
            );

            if (isClassDay) {
                // فجوة! الطالب لديه حصة ولم يسجل له أي شيء -> نسجل غياب تلقائي في العرض
                timeline.push({
                    date: d.toISOString(),
                    type: 'auto-absence',
                    title: 'غياب (تجاوز حصة)',
                    status: 'absence'
                });
            }
        }
    }

    // 3. الترتيب الزمني النهائي
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 4. بناء الجدول
    const container = document.getElementById('section-progress');
    container.innerHTML = `
        <div class="content-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2>سجل المتابعة اليومي</h2>
            <button class="btn btn-primary" onclick="openAdminEventModal()">
                <i class="fas fa-plus-circle"></i> تسجيل حدث (إعفاء/إجازة)
            </button>
        </div>
        
        <div class="table-responsive">
            <table class="word-table">
                <thead>
                    <tr>
                        <th style="width: 30%;">البيان (الدرس / الحدث)</th>
                        <th style="width: 15%;">حالة الدرس</th>
                        <th style="width: 15%;">حالة الطالب</th>
                        <th style="width: 15%;">نوع الحصة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 10%;">إجراءات</th>
                    </tr>
                </thead>
                <tbody id="progressTableBody"></tbody>
            </table>
        </div>
    `;

    const tbody = document.getElementById('progressTableBody');
    let debtBalance = 0;
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    if (timeline.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:20px;">لا توجد سجلات.</td></tr>';
        return;
    }

    tbody.innerHTML = timeline.map(item => {
        const d = new Date(item.date);
        const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()];
        const dateStr = d.toLocaleDateString('ar-SA');
        
        let colLesson = item.title;
        let colLessonStatus = '-';
        let colStudentStatus = '-';
        let colSessionType = '-';
        let actions = '-';

        // فحص الجدول
        const isScheduled = teacherSchedule.some(s => s.day === dayKey && (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId))));

        // A. حدث إداري (يدوي)
        if (item.type === 'event') {
            actions = `
                <button class="btn-icon text-primary" onclick="editAdminEvent(${item.id})" title="تعديل">✏️</button>
                <button class="btn-icon text-danger" onclick="deleteAdminEvent(${item.id})" title="حذف">🗑️</button>
            `;
            if (item.status === 'vacation') {
                colStudentStatus = 'إجازة';
                colLessonStatus = 'توقف مؤقت';
            } else if (item.status === 'excused') {
                colStudentStatus = 'معفى';
                colLessonStatus = 'مؤجل';
                debtBalance++;
                colStudentStatus += ` <span style="color:red; font-size:0.8em;">(دين: ${debtBalance})</span>`;
            }
            if(item.note) colLesson += `<br><span style="font-size:0.8em; color:#555;">[${item.note}]</span>`;

        // B. غياب تلقائي أو مسجل
        } else if (item.type === 'auto-absence' || item.status === 'absence') {
            colStudentStatus = '<span style="color:red; font-weight:bold;">غائب</span>';
            colLessonStatus = 'لم يؤخذ';
            debtBalance++;
            colStudentStatus += ` <span style="color:red; font-size:0.8em;">(دين: ${debtBalance})</span>`;
            if (item.type === 'auto-absence') colLesson = 'غياب (حصة مسجلة)';

        // C. درس (حضور)
        } else {
            colStudentStatus = 'حاضر';
            if (item.status === 'started') colLessonStatus = 'بدأ';
            else if (item.status === 'extension') colLessonStatus = 'تمديد';
            else if (item.status === 'completed') colLessonStatus = '<span style="color:green; font-weight:bold;">✔ متحقق</span>';
            else if (item.status === 'accelerated') colLessonStatus = '<span style="color:#d4a017; font-weight:bold;">⚡ تسريع</span>';

            if (isScheduled) {
                colSessionType = 'أساسية';
            } else {
                if (debtBalance > 0) {
                    colSessionType = '<span style="color:blue; font-weight:bold;">تعويضية</span>';
                    debtBalance--;
                } else {
                    colSessionType = 'إضافية';
                }
            }
        }

        return `
            <tr>
                <td><strong>${colLesson}</strong></td>
                <td style="text-align:center;">${colLessonStatus}</td>
                <td style="text-align:center;">${colStudentStatus}</td>
                <td style="text-align:center;">${colSessionType}</td>
                <td style="text-align:center;">${dateStr}</td>
                <td style="text-align:center;">${actions}</td>
            </tr>
        `;
    }).join('');

    // إضافة سطر للدرس الحالي (القادم)
    const currentLesson = myList.find(l => l.status !== 'completed' && l.status !== 'accelerated');
    if (currentLesson) {
        tbody.innerHTML += `
            <tr style="background-color:#fcfcfc; color:#777;">
                <td>${currentLesson.title} <small>(الحالي)</small></td>
                <td style="text-align:center;">قيد التنفيذ</td>
                <td style="text-align:center;">-</td>
                <td style="text-align:center;">قادم</td>
                <td style="text-align:center;">-</td>
                <td style="text-align:center;">-</td>
            </tr>
        `;
    }
}

// ------------------------------------------------
// ستايل جدول Word
// ------------------------------------------------
function injectWordTableStyles() {
    if (document.getElementById('wordTableStyles')) return;
    const style = document.createElement('style');
    style.id = 'wordTableStyles';
    style.innerHTML = `
        .word-table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Times New Roman', 'Tajawal', serif;
            font-size: 1rem;
            background: white;
            border: 2px solid #000;
        }
        .word-table th, .word-table td {
            border: 1px solid #000;
            padding: 8px 12px;
            vertical-align: middle;
        }
        .word-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
            border-bottom: 2px solid #000;
        }
        .word-table tr:nth-child(even) {
            background-color: #fafafa;
        }
        .btn-icon {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.1rem;
            padding: 0 5px;
            transition: transform 0.2s;
        }
        .btn-icon:hover { transform: scale(1.2); }
    `;
    document.head.appendChild(style);
}

// ============================================
// إدارة الأحداث (إضافة / تعديل / حذف)
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
                    <option value="excused">معفى (يحسب دين)</option>
                    <option value="vacation">إجازة (لا تحسب دين)</option>
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
    editingEventId = null; // وضع الإضافة
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

    editingEventId = id; // وضع التعديل
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
        // تعديل موجود
        const idx = events.findIndex(e => e.id == editingEventId);
        if (idx !== -1) {
            events[idx].type = type;
            events[idx].date = new Date(date).toISOString();
            events[idx].note = note;
        }
    } else {
        // إضافة جديد
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
    if (!confirm('هل أنت متأكد من حذف هذا الحدث؟')) return;
    let events = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    events = events.filter(e => e.id != id);
    localStorage.setItem('studentEvents', JSON.stringify(events));
    loadProgressTab();
}

// ============================================
// (بقية الدوال الأساسية: التشخيص، الدروس، الخطة..)
// تأكد من بقائها كما هي لضمان عمل النظام
// ============================================

function loadDiagnosticTab() { /* ... كما في النسخة السابقة ... */ 
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic');
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        document.getElementById('diagnosticTestDetails').style.display = 'block';
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id == assignedTest.testId);
        let statusBadge = '', actionContent = '';
        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            actionContent = `<div class="mt-2"><button class="btn btn-warning btn-sm" onclick="openReviewModal(${assignedTest.id})">مراجعة وتصحيح</button> <button class="btn btn-primary btn-sm" onclick="autoGenerateLessons()">توليد الخطة</button></div>`;
        } else { statusBadge = '<span class="badge badge-secondary">انتظار</span>'; }
        document.getElementById('diagnosticTestDetails').innerHTML = `<div class="card"><h3>${originalTest?originalTest.title:'-'}</h3><div>${statusBadge}</div>${actionContent}</div>`;
    } else { document.getElementById('noDiagnosticTest').style.display = 'block'; document.getElementById('diagnosticTestDetails').style.display = 'none'; }
}

function loadIEPTab() { /* ... نسخ من السابق ... */ 
    const iepContainer = document.getElementById('iepContent'); const wordModel = document.querySelector('.iep-word-model');
    if (!iepContainer) return;
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    if (!completedDiagnostic) { if(wordModel) wordModel.style.display = 'none'; iepContainer.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3></div>`; return; }
    if(wordModel) wordModel.style.display = 'block';
    // ... (اختصاراً هنا، يرجى إبقاء كود الخطة كما هو من الملف السابق)
    // سأضع رسالة تذكيرية فقط لعدم تضخيم الرد، لكن الكود يجب أن يكون موجوداً
    // الرجاء نسخ دالة loadIEPTab من الردود السابقة بالكامل هنا
}

// الدوال المساعدة (Modal, Lessons, etc.)
function openReviewModal(id) { /* ... */ }
function saveTestReview() { /* ... */ }
function loadLessonsTab() { /* ... */ 
    // انسخ دالة loadLessonsTab من الرد السابق (التي تحتوي على أزرار الترتيب النصية)
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    if (myList.length === 0) { container.innerHTML = 'Empty'; return; }
    myList.sort((a,b)=>(a.orderIndex||0)-(b.orderIndex||0));
    container.innerHTML = myList.map((l,i) => {
        let controls = (l.status==='completed'||l.status==='accelerated') ? 
            `<button class="btn btn-warning btn-sm" onclick="resetLesson(${l.id})">إعادة فتح</button>` : 
            `<button class="btn btn-info btn-sm" onclick="accelerateLesson(${l.id})">تسريع</button>`;
        let order = `<button onclick="moveLesson(${l.id},'up')">تقديم</button><button onclick="moveLesson(${l.id},'down')">تأخير</button>`;
        return `<div class="content-card"><h4>${i+1}. ${l.title}</h4><div>${l.status}</div><div>${controls} ${order}</div></div>`;
    }).join('');
}
// تأكد من وجود دوال: moveLesson, accelerateLesson, resetLesson, deleteLesson, autoGenerateLessons, assignLibraryLesson
// تأكد من وجود دوال: closeModal, showAssignTestModal, assignTest, deleteAssignedTest, showAssignHomeworkModal, assignHomework, deleteAssignment, loadAssignmentsTab

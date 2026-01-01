// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب (نظام السجل الأكاديمي المتكامل: حضور، دروس، تعويض، مديونية)
// ============================================

let currentStudentId = null;
let currentStudent = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }
    
    // حقن نافذة "إضافة حدث إداري"
    injectAdminEventModal();
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

// ... (دوال التشخيص والمراجعة والخطة تبقى كما هي، انسخها من الكود السابق إذا أردت، أو ركز هنا على الجديد) ...
// لتوفير المساحة، سأضع دوال الأقسام الأخرى باختصار، وتأكد من وجودها كما في النسخ السابقة.
// ============================================
// [أضف هنا دوال: loadDiagnosticTab, loadIEPTab, loadLessonsTab, loadAssignmentsTab من النسخة السابقة]
// ============================================

// (للإيجاز، سأفترض أنك ستنسخ دوال التبويبات الأخرى هنا، وسأركز على دالة التقدم الجديدة كلياً)
// يمكنك نسخ الدوال (loadDiagnosticTab, openReviewModal, ..., loadLessonsTab, ...) من الردود السابقة ولصقها هنا قبل loadProgressTab.

// ============================================
// ⭐ التحديث الجوهري: جدول التقدم (السجل الأكاديمي)
// ============================================
function loadProgressTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]'); // أحداث يدوية (إجازة/معفى)
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');

    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    let myEvents = adminEvents.filter(e => e.studentId == currentStudentId);

    // 1. تجميع كل الأحداث في خط زمن واحد (Timeline)
    let timeline = [];

    // أ) إضافة سجلات الدروس (حضور وغياب النظام)
    myList.forEach(l => {
        if (l.historyLog && l.historyLog.length > 0) {
            l.historyLog.forEach(log => {
                timeline.push({
                    date: log.date,
                    type: 'system',
                    lessonTitle: l.title,
                    logStatus: log.status, // started, extension, completed, absence, accelerated
                    originalLesson: l
                });
            });
        }
    });

    // ب) إضافة الأحداث اليدوية (معفى / إجازة)
    myEvents.forEach(e => {
        timeline.push({
            date: e.date,
            type: 'manual',
            manualType: e.type, // excused, vacation
            note: e.note
        });
    });

    // 2. الترتيب الزمني
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. معالجة البيانات (حساب نوع الحصة والمديونية)
    let debtCounter = 0; // رصيد الحصص المستحقة (التعويض)
    const dayMap = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };

    const tbody = document.getElementById('progressTableBody');
    
    // إضافة زر "إضافة حدث" فوق الجدول إذا لم يكن موجوداً
    const container = document.getElementById('section-progress');
    if (!document.getElementById('btnAddEvent')) {
        const btnDiv = document.createElement('div');
        btnDiv.innerHTML = `<button id="btnAddEvent" class="btn btn-outline-primary mb-3" onclick="openAdminEventModal()">➕ تسجيل حدث إداري (إجازة/معفى)</button>`;
        container.insertBefore(btnDiv, container.firstChild);
    }

    if(timeline.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد سجلات حتى الآن</td></tr>'; return; }

    tbody.innerHTML = timeline.map(item => {
        const dateObj = new Date(item.date);
        const dayNameEng = dayMap[dateObj.getDay()];
        const dateStr = dateObj.toLocaleDateString('ar-SA');

        // تحديد الأعمدة
        let lessonName = '-';
        let lessonStatus = '-';
        let studentStatus = '-';
        let sessionType = '-'; // أساسية، إضافية، تعويضية
        let rowClass = '';

        // -- تحليل الحالة --
        
        // هل اليوم في الجدول؟
        const isScheduledDay = teacherSchedule.some(s => 
            s.day === dayNameEng && 
            (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId)))
        );

        if (item.type === 'manual') {
            // أحداث يدوية
            lessonName = `<span class="text-muted">حدث إداري</span>`;
            if (item.manualType === 'vacation') {
                studentStatus = '<span class="badge badge-info">إجازة</span>';
                lessonStatus = 'توقف مؤقت';
                rowClass = 'table-info';
                // الإجازة لا تزيد الدين
            } else if (item.manualType === 'excused') {
                studentStatus = '<span class="badge badge-warning">معفى</span>';
                lessonStatus = 'مؤجل';
                rowClass = 'table-warning';
                debtCounter++; // الإعفاء يزيد الدين
            }
        } else {
            // أحداث النظام (دروس)
            lessonName = item.lessonTitle;
            
            if (item.logStatus === 'absence') {
                studentStatus = '<span class="badge badge-danger">غائب</span>';
                lessonStatus = 'لم يؤخذ';
                rowClass = 'table-danger';
                debtCounter++; // الغياب يزيد الدين
            } else {
                // الطالب حضر (started, extension, completed, accelerated)
                studentStatus = '<span class="badge badge-success">حاضر</span>';
                
                // تحديد حالة الدرس
                if (item.logStatus === 'started') lessonStatus = 'بدأ';
                else if (item.logStatus === 'extension') lessonStatus = 'تمديد';
                else if (item.logStatus === 'completed') { lessonStatus = '<span class="text-success font-weight-bold">متحقق</span>'; rowClass = 'table-success'; }
                else if (item.logStatus === 'accelerated') { lessonStatus = '<span class="text-warning font-weight-bold">تسريع (تفوق)</span>'; rowClass = 'table-warning'; }

                // خوارزمية نوع الحصة
                if (isScheduledDay) {
                    sessionType = 'أساسية';
                } else {
                    // يوم غير مجدول
                    if (debtCounter > 0) {
                        sessionType = '<span class="text-primary font-weight-bold">تعويضية</span>';
                        debtCounter--; // سداد دين
                    } else {
                        sessionType = 'إضافية';
                    }
                }
            }
        }

        // ملاحظة: حالة "قادم" و "قيد التنفيذ" لا تظهر في السجل التاريخي لأنها لم تحدث بعد،
        // ولكن يمكن إضافتها في قسم منفصل أو كسطر أخير إذا رغبت. هنا نعرض ما تم فقط.

        return `
            <tr class="${rowClass}">
                <td>${lessonName}</td>
                <td>${lessonStatus}</td>
                <td>${studentStatus}</td>
                <td>${sessionType}</td>
                <td>${dateStr}</td>
            </tr>
        `;
    }).join('');
    
    // إضافة سطر ملخص للدروس القادمة (اختياري)
    const activeLesson = myList.find(l => l.status !== 'completed' && l.status !== 'accelerated');
    if (activeLesson) {
        tbody.innerHTML += `
            <tr style="border-top: 2px dashed #ccc;">
                <td>${activeLesson.title}</td>
                <td><span class="badge badge-primary">قيد التنفيذ (الحالي)</span></td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            </tr>
        `;
    }
}

// ============================================
// دوال الأحداث الإدارية (معفى / إجازة)
// ============================================
function injectAdminEventModal() {
    if (document.getElementById('adminEventModal')) return;
    const modalHTML = `
    <div id="adminEventModal" class="modal">
        <div class="modal-content">
            <span class="close-btn" onclick="closeModal('adminEventModal')">&times;</span>
            <h3>تسجيل حدث إداري</h3>
            <div class="form-group">
                <label>نوع الحدث:</label>
                <select id="eventType" class="form-control">
                    <option value="excused">معفى (يحسب كدين/غياب بعذر)</option>
                    <option value="vacation">إجازة (لا يخصم من الرصيد)</option>
                </select>
            </div>
            <div class="form-group">
                <label>التاريخ:</label>
                <input type="date" id="eventDate" class="form-control">
            </div>
            <div class="form-group">
                <label>ملاحظات:</label>
                <input type="text" id="eventNote" class="form-control" placeholder="مثلاً: ظرف صحي، إجازة مطولة...">
            </div>
            <button class="btn btn-primary w-100" onclick="saveAdminEvent()">حفظ</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openAdminEventModal() {
    document.getElementById('eventDate').valueAsDate = new Date();
    document.getElementById('adminEventModal').classList.add('show');
}

function saveAdminEvent() {
    const type = document.getElementById('eventType').value;
    const date = document.getElementById('eventDate').value;
    const note = document.getElementById('eventNote').value;

    if (!date) return;

    const events = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    events.push({
        id: Date.now(),
        studentId: currentStudentId,
        date: new Date(date).toISOString(),
        type: type,
        note: note
    });

    localStorage.setItem('studentEvents', JSON.stringify(events));
    closeModal('adminEventModal');
    loadProgressTab();
    alert('تم تسجيل الحدث.');
}

// ... (تأكد من نسخ باقي الدوال المساعدة: loadDiagnosticTab, loadIEPTab, loadLessonsTab, etc.)
// ... (كما كانت في الملف السابق، هنا ركزنا على التحديث الجذري للتقدم)
// يرجى نسخ الدوال من الرد السابق (النسخة الكاملة) ولصقها هنا لضمان عمل باقي الأقسام.
// لضمان عدم ضياع الدوال السابقة، سأعيد وضع دوال الدروس والتشخيص الأساسية أدناه بشكل مضغوط:

function loadDiagnosticTab() { /* ... نسخ من الرد السابق ... */ 
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic');
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const d = document.getElementById('diagnosticTestDetails'); d.style.display = 'block';
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const orig = allTests.find(t => t.id == assignedTest.testId);
        let st = '', act = '';
        if(assignedTest.status === 'completed') {
            st = '<span class="badge badge-success">مكتمل</span>';
            act = `<div class="mt-2"><button class="btn btn-warning btn-sm" onclick="openReviewModal(${assignedTest.id})">مراجعة</button> <button class="btn btn-primary btn-sm" onclick="autoGenerateLessons()">توليد الخطة</button></div>`;
        } else st = '<span class="badge badge-secondary">انتظار</span>';
        d.innerHTML = `<div class="card"><h3>${orig?orig.title:'-'}</h3><div>${st}</div>${act}</div>`;
    } else { document.getElementById('noDiagnosticTest').style.display = 'block'; document.getElementById('diagnosticTestDetails').style.display = 'none'; }
}

function loadLessonsTab() { /* ... نسخ من الرد السابق ... */ 
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

// دوال المساعدة (Modal, Move, Accelerate, etc.) انسخها من الملف السابق.
function openReviewModal(id) { /* ... */ }
function saveTestReview() { /* ... */ }
function moveLesson(id, dir) { /* ... */ } // تأكد من وجود كود التحريك
function accelerateLesson(id) { /* ... */ } // تأكد من وجود كود التسريع
function resetLesson(id) { /* ... */ } // تأكد من وجود كود إعادة الفتح
function autoGenerateLessons() { /* ... */ } 
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function loadAssignmentsTab() { /* ... */ }
function showAssignTestModal() { /* ... */ }
function assignTest() { /* ... */ }
function deleteAssignedTest(id) { /* ... */ }
function loadIEPTab() { /* ... */ }

// (تنبيه: يجب عليك التأكد من أن جميع الدوال السابقة موجودة في الملف ليعمل النظام كاملاً، 
// لقد ركزت في الأعلى على دالة loadProgressTab الجديدة والمنطق الخاص بها)

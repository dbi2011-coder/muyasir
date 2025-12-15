// ============================================
// 📁 المسار: assets/js/student-profile.js
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

    loadStudentData();
});

// تحميل البيانات الأساسية وتحديث القائمة الجانبية
function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id === currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    // تحديث البيانات في القائمة الجانبية والرأس
    document.getElementById('sideName').textContent = currentStudent.name;
    document.getElementById('headerStudentName').textContent = currentStudent.name;
    document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + currentStudent.subject;
    document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;
    
    // تحميل القسم الافتراضي (الاختبار التشخيصي)
    switchSection('diagnostic');
}

// === دالة التنقل الرئيسية بين الأقسام ===
function switchSection(sectionId) {
    // 1. تحديث القائمة الجانبية
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');

    // 2. إخفاء كل الأقسام وإظهار القسم المطلوب
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section-${sectionId}`).classList.add('active');

    // 3. تحميل بيانات القسم المطلوب
    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// --- 1. قسم الاختبار التشخيصي ---
function loadDiagnosticTab() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic');
    
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const detailsDiv = document.getElementById('diagnosticTestDetails');
        detailsDiv.style.display = 'block';
        
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id === assignedTest.testId);
        
        let statusBadge = '';
        if(assignedTest.status === 'completed') statusBadge = '<span class="badge badge-success">مكتمل</span>';
        else if(assignedTest.status === 'in-progress') statusBadge = '<span class="badge badge-warning">قيد التنفيذ</span>';
        else statusBadge = '<span class="badge badge-secondary">لم يبدأ</span>';

        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                    ${statusBadge}
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                
                ${assignedTest.status === 'completed' ? `
                    <div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:5px;">
                        <strong>النتيجة: ${assignedTest.score || 0}%</strong>
                        <p>تم استخراج نقاط القوة والاحتياج تلقائياً.</p>
                    </div>
                ` : `
                    <div class="alert alert-info">بانتظار حل الطالب للاختبار ليتم إنشاء الخطة.</div>
                `}
            </div>
        `;
    }
}

function showAssignTestModal() {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const select = document.getElementById('testSelect');
    select.innerHTML = '<option value="">اختر اختباراً...</option>';
    allTests.forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.title} (${t.subject})</option>`;
    });
    document.getElementById('assignTestModal').classList.add('show');
}

function assignTest() {
    const testId = parseInt(document.getElementById('testSelect').value);
    if(!testId) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    // التحقق من عدم وجود اختبار سابق
    const exists = studentTests.some(t => t.studentId === currentStudentId && t.type === 'diagnostic');
    if(exists) { alert('يوجد اختبار تشخيصي معين مسبقاً'); return; }

    studentTests.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: testId,
        type: 'diagnostic',
        status: 'pending',
        assignedDate: new Date().toISOString()
    });
    
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('assignTestModal');
    loadDiagnosticTab();
    showAuthNotification('تم تعيين الاختبار بنجاح', 'success');
}

// --- 2. قسم الخطة التربوية الفردية ---
function loadIEPTab() {
    const iepContent = document.getElementById('iepContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed');

    if (!completedDiagnostic) {
        iepContent.innerHTML = '<div class="alert alert-warning" style="text-align:center; padding:30px;">⚠️ يجب أن يكمل الطالب الاختبار التشخيصي أولاً لتوليد الخطة تلقائياً.</div>';
        return;
    }

    // جلب جدول المعلم
    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const teacherName = getCurrentUser().name;
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    const studentSchedule = days.map(day => {
        const hasSession = schedule.some(s => s.students && s.students.includes(currentStudentId) && s.day === dayMap(day)); 
        return { day, hasSession };
    });

    // نقاط القوة والاحتياج (محاكاة)
    const strengths = ["قراءة الحروف بحركاتها", "نسخ الكلمات"]; 
    const needs = ["التمييز بين المدود", "الإملاء المنظور"]; 
    const longTermGoal = `أن يتقن التلميذ مهارات ${currentStudent.subject} لذوي صعوبات التعلم حتى صفه الحالي وبنسبة لا تقل عن 80%`;
    
    const objectives = [
        { short: "أن يميز التلميذ بين المدود", instructional: "قراءة كلمات بها مد بالألف", date: "" },
        { short: "أن يميز التلميذ بين المدود", instructional: "قراءة كلمات بها مد بالواو", date: "" },
        { short: "صيانة للأهداف السابقة", instructional: "مراجعة المدود", date: "" }
    ];

    const html = `
    <div class="iep-page">
        <div class="iep-header"><h2>الخطة التربوية الفردية - الصفحة 1</h2></div>
        <table class="iep-table">
            <tr>
                <th>الاسم</th><td>${currentStudent.name}</td>
                <th>الصف</th><td>${currentStudent.grade}</td>
                <th>المادة</th><td>${currentStudent.subject}</td>
            </tr>
        </table>
        
        <h4>جدول الحصص</h4>
        <table class="iep-table">
            <tr>
                ${studentSchedule.map(s => `<th class="${s.hasSession ? 'shaded-day' : ''}">${s.day}</th>`).join('')}
            </tr>
            <tr>
                ${studentSchedule.map(s => `<td class="${s.hasSession ? 'shaded-day' : ''}">${s.hasSession ? '✓' : ''}</td>`).join('')}
            </tr>
        </table>
        <div style="margin-top:20px;"><strong>معلم الصعوبات:</strong> ${teacherName}</div>
    </div>

    <div class="iep-page">
        <div class="iep-header"><h2>الخطة التربوية الفردية - الصفحة 2</h2></div>
        
        <table class="iep-table">
            <tr><th width="50%">نقاط القوة</th><th>نقاط الاحتياج</th></tr>
            <tr>
                <td style="vertical-align: top;"><ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul></td>
                <td style="vertical-align: top;"><ul>${needs.map(n => `<li>${n}</li>`).join('')}</ul></td>
            </tr>
        </table>

        <div style="margin-bottom:20px; padding:15px; background:#f9f9f9; border:1px solid #eee;">
            <strong>الهدف البعيد:</strong> ${longTermGoal}
        </div>

        <table class="iep-table">
            <tr>
                <th>الهدف قصير المدى</th>
                <th>الهدف التدريسي</th>
                <th>تاريخ التحقق</th>
            </tr>
            ${objectives.map(obj => `
                <tr>
                    <td>${obj.short}</td>
                    <td>${obj.instructional}</td>
                    <td>${obj.date || '-'}</td>
                </tr>
            `).join('')}
        </table>
    </div>`;

    iepContent.innerHTML = html;
    
    // توليد الدروس إذا لم توجد
    generateLessonsFromIEP(objectives);
}

// --- 3. قسم الدروس ---
function generateLessonsFromIEP(objectives) {
    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const hasLessons = studentLessons.some(l => l.studentId === currentStudentId);
    
    if(!hasLessons) {
        const libraryLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        objectives.forEach(obj => {
            // محاكاة البحث عن درس مناسب
            const matchingLesson = libraryLessons.find(l => l.title.includes(obj.instructional) || true) || libraryLessons[0];
            
            if (matchingLesson) {
                studentLessons.push({
                    id: Date.now() + Math.random(),
                    studentId: currentStudentId,
                    lessonId: matchingLesson.id,
                    title: matchingLesson.title,
                    objective: obj.instructional,
                    status: 'pending', 
                    isAccelerated: false
                });
            }
        });
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    }
}

function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myList = studentLessons.filter(l => l.studentId === currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    
    if (myList.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>لا توجد دروس حالياً. تأكد من وجود خطة تربوية.</h3></div>';
        return;
    }

    container.innerHTML = myList.map(l => `
        <div class="content-card">
            <div class="content-header">
                <h4>${l.title}</h4>
                <span class="status-badge ${l.status}">${getStatusText(l.status)}</span>
            </div>
            <div class="content-body">
                <p><strong>الهدف:</strong> ${l.objective}</p>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-outline-warning" onclick="accelerateLesson(${l.id})">تسريع</button>
                ${l.status !== 'completed' ? `<button class="btn btn-sm btn-success" onclick="completeLesson(${l.id})">إكمال</button>` : ''}
            </div>
        </div>
    `).join('');
}

function accelerateLesson(id) {
    if(!confirm('هل أنت متأكد من تسريع هذا الدرس (تجاوزه)؟')) return;
    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].status = 'accelerated';
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

function completeLesson(id) {
    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].status = 'completed';
        studentLessons[idx].completedDate = new Date().toISOString();
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

// --- 4. قسم الواجبات ---
function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId === currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    
    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>لا يوجد واجبات مسندة.</h3></div>';
        return;
    }

    container.innerHTML = list.map(a => `
        <div class="content-card">
            <h4>${a.title}</h4>
            <div class="content-meta">
                <span>تاريخ التسليم: ${a.dueDate || 'مفتوح'}</span>
                <span class="status-badge ${a.status}">${getStatusText(a.status)}</span>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${a.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

function showAssignHomeworkModal() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId === currentStudentId);
    const assignmentsLib = JSON.parse(localStorage.getItem('assignments') || '[]');
    
    const lessonSelect = document.getElementById('homeworkLessonSelect');
    lessonSelect.innerHTML = lessons.map(l => `<option value="${l.id}">${l.title}</option>`).join('');
    
    const assignSelect = document.getElementById('homeworkSelect');
    if(assignmentsLib.length === 0) {
        assignSelect.innerHTML = '<option value="">لا توجد واجبات في المكتبة</option>';
    } else {
        assignSelect.innerHTML = assignmentsLib.map(a => `<option value="${a.id}">${a.title}</option>`).join('');
    }
    
    document.getElementById('assignHomeworkModal').classList.add('show');
}

function assignHomework() {
    const assignLibId = document.getElementById('homeworkSelect').value;
    if(!assignLibId) return;
    
    const assignmentsLib = JSON.parse(localStorage.getItem('assignments') || '[]');
    const selectedAssign = assignmentsLib.find(a => a.id == assignLibId);
    
    const newAssign = {
        id: Date.now(),
        studentId: currentStudentId,
        assignmentId: assignLibId,
        title: selectedAssign.title,
        status: 'pending',
        dueDate: document.getElementById('homeworkDueDate').value,
        assignedDate: new Date().toISOString()
    };
    
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    list.push(newAssign);
    localStorage.setItem('studentAssignments', JSON.stringify(list));
    
    closeModal('assignHomeworkModal');
    loadAssignmentsTab();
    showAuthNotification('تم إسناد الواجب', 'success');
}

// --- 5. قسم التقدم ---
function loadProgressTab() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId === currentStudentId);
    const tbody = document.getElementById('progressTableBody');
    
    if(lessons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات تقدم</td></tr>';
        return;
    }

    tbody.innerHTML = lessons.map(l => `
        <tr>
            <td>${l.objective}</td>
            <td>التعلم المباشر</td>
            <td><span class="badge ${l.status}">${getStatusText(l.status)}</span></td>
            <td>
                ${l.status === 'completed' ? 'تم التحقق في ' + new Date(l.completedDate).toLocaleDateString('ar-SA') : '-'}
                ${l.status === 'accelerated' ? '<span style="color:red; display:block">تم التسريع (غياب/تجاوز)</span>' : ''}
            </td>
        </tr>
    `).join('');
}

// أدوات مساعدة
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function printIEP() { window.print(); }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function dayMap(dayAr) {
    const map = {'الأحد':'sunday', 'الاثنين':'monday', 'الثلاثاء':'tuesday', 'الأربعاء':'wednesday', 'الخميس':'thursday'};
    return map[dayAr];
}
function getStatusText(status) {
    const map = {
        'pending': 'قادم',
        'in-progress': 'قيد التنفيذ',
        'completed': 'مكتمل',
        'accelerated': 'مسرع'
    };
    return map[status] || status;
}
function generateStudentReport() {
    alert('سيتم توليد تقرير PDF شامل قريباً...');
}

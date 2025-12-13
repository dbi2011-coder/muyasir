// إدارة ملف الطالب - ميسر التعلم
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

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id === currentStudentId);
    
    if (!currentStudent) return;
    
    document.getElementById('pageStudentName').textContent = `ملف الطالب: ${currentStudent.name}`;
    document.title = `ملف الطالب - ${currentStudent.name}`;
    
    loadDiagnosticTab();
    // سيتم تحميل باقي التبويبات عند الضغط عليها
}

// --- 1. الاختبار التشخيصي ---
function loadDiagnosticTab() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic');
    
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const details = document.getElementById('diagnosticTestDetails');
        details.style.display = 'block';
        
        // جلب تفاصيل الاختبار الأصلي
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id === assignedTest.testId);
        
        details.innerHTML = `
            <div class="card">
                <h3>${originalTest ? originalTest.title : 'اختبار محذوف'}</h3>
                <p>الحالة: ${assignedTest.status === 'completed' ? '<span class="badge badge-success">مكتمل</span>' : '<span class="badge badge-warning">قيد الانتظار</span>'}</p>
                ${assignedTest.status === 'completed' ? `<button class="btn btn-success" onclick="generateIEP(${assignedTest.id})">تحديث الخطة التربوية</button>` : ''}
            </div>
        `;
        
        // إذا كان مكتمل ولم تنشأ خطة بعد، قم بإنشائها
        if(assignedTest.status === 'completed') {
            loadIEPTab(); 
        }
    }
}

function showAssignTestModal() {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const select = document.getElementById('testSelect');
    select.innerHTML = '<option value="">اختر اختباراً...</option>';
    allTests.forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.title} - ${t.subject}</option>`;
    });
    document.getElementById('assignTestModal').classList.add('show');
}

function assignTest() {
    const testId = parseInt(document.getElementById('testSelect').value);
    if(!testId) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
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
}

// --- 2. الخطة التربوية الفردية (IEP) ---
function loadIEPTab() {
    const iepContent = document.getElementById('iepContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed');

    if (!completedDiagnostic) {
        iepContent.innerHTML = '<div class="alert alert-warning">يجب على الطالب إكمال الاختبار التشخيصي أولاً لتوليد الخطة تلقائياً.</div>';
        return;
    }

    // توليد بيانات الخطة
    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]'); // جدول المعلم
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const studentSchedule = days.map(day => {
        // فحص إذا كان الطالب لديه حصة في هذا اليوم في جدول المعلم
        // ملاحظة: نحتاج لمنطق في جدول المعلم يربط الحصة بالطلاب، هنا سنفترض وجود حصة عشوائية للتوضيح
        const hasSession = schedule.some(s => s.students && s.students.includes(currentStudentId) && s.day === dayMap(day)); 
        return { day, hasSession };
    });

    // الصفحة الأولى: البيانات والجدول
    let html = `
    <div class="iep-page">
        <div class="iep-header"><h2>الخطة التربوية الفردية - الصفحة 1</h2></div>
        <table class="iep-table">
            <tr>
                <th>الاسم</th><td>${currentStudent.name}</td>
                <th>الصف</th><td>${currentStudent.grade}</td>
                <th>المادة</th><td>${currentStudent.subject}</td>
            </tr>
        </table>
        
        <h4>أيام الحصص المقررة</h4>
        <table class="iep-table">
            <tr>
                ${studentSchedule.map(s => `<th class="${s.hasSession ? 'shaded-day' : ''}">${s.day}</th>`).join('')}
            </tr>
            <tr>
                ${studentSchedule.map(s => `<td class="${s.hasSession ? 'shaded-day' : ''}">${s.hasSession ? '✓' : ''}</td>`).join('')}
            </tr>
        </table>
        
        <div style="margin-top: 20px;"><strong>اسم المعلم:</strong> ${getCurrentUser().name}</div>
    </div>`;

    // الصفحة الثانية: نقاط القوة والاحتياج والأهداف
    // محاكاة استخراج نقاط القوة/الاحتياج من نتائج الاختبار
    // (في الواقع يجب أن تكون مرتبطة بإجابات الأسئلة)
    const strengths = ["قراءة الحروف بحركاتها", "نسخ الكلمات"]; 
    const needs = ["التمييز بين المدود", "الإملاء المنظور"]; 
    
    // الأهداف (محاكاة)
    const longTermGoal = `أن يتقن التلميذ مهارات ${currentStudent.subject === 'لغتي' ? 'القراءة والكتابة' : 'الرياضيات'} لذوي صعوبات التعلم حتى صفه الحالي وبنسبة لا تقل عن 80%`;
    
    const objectives = [
        { short: "أن يميز التلميذ بين المدود", instructional: "قراءة كلمات بها مد بالألف", date: "" },
        { short: "أن يميز التلميذ بين المدود", instructional: "قراءة كلمات بها مد بالواو", date: "" },
        { short: "صيانة للأهداف السابقة", instructional: "مراجعة المدود", date: "" }
    ];

    html += `
    <div class="iep-page">
        <div class="iep-header"><h2>الخطة التربوية الفردية - الصفحة 2</h2></div>
        
        <table class="iep-table">
            <tr><th width="50%">نقاط القوة (الأهداف المتقنة)</th><th>نقاط الاحتياج (الأهداف غير المتقنة)</th></tr>
            <tr>
                <td style="vertical-align: top;"><ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul></td>
                <td style="vertical-align: top;"><ul>${needs.map(n => `<li>${n}</li>`).join('')}</ul></td>
            </tr>
        </table>

        <table class="iep-table">
            <tr><th>الهدف البعيد</th></tr>
            <tr><td>${longTermGoal}</td></tr>
        </table>

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
    
    // توليد الدروس تلقائياً إذا لم تكن موجودة
    generateLessonsFromIEP(objectives);
}

// --- 3. الدروس (توليد تلقائي) ---
function generateLessonsFromIEP(objectives) {
    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    // التحقق مما إذا كانت الدروس مولدة مسبقاً لهذا الطالب
    const existing = studentLessons.some(l => l.studentId === currentStudentId);
    if(existing) return;

    // جلب الدروس من المكتبة
    const libraryLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    objectives.forEach(obj => {
        // البحث عن درس يطابق الهدف التدريسي (بسيط جداً هنا للمثال)
        // في الواقع نحتاج ربط IDs
        const matchingLesson = libraryLessons.find(l => l.title.includes(obj.instructional) || l.priority === 1);
        
        if (matchingLesson) {
            studentLessons.push({
                id: Date.now() + Math.random(),
                studentId: currentStudentId,
                lessonId: matchingLesson.id,
                title: matchingLesson.title,
                objective: obj.instructional,
                status: 'pending', // pending, completed, accelerated
                isAccelerated: false
            });
        }
    });
    
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
}

function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myList = studentLessons.filter(l => l.studentId === currentStudentId);
    
    const container = document.getElementById('studentLessonsGrid');
    if (myList.length === 0) {
        container.innerHTML = '<p>لا توجد دروس مخصصة بعد.</p>';
        return;
    }

    container.innerHTML = myList.map(l => `
        <div class="content-card">
            <h4>${l.title}</h4>
            <p><small>الهدف: ${l.objective}</small></p>
            <div class="status-badge ${l.status}">${l.status === 'accelerated' ? 'مسرع' : (l.status === 'completed' ? 'مكتمل' : 'قادم')}</div>
            <div style="margin-top: 10px;">
                <button class="btn btn-sm btn-outline-warning" onclick="accelerateLesson(${l.id})">تسريع الدرس</button>
                ${l.status !== 'completed' ? `<button class="btn btn-sm btn-success" onclick="completeLesson(${l.id})">إكمال</button>` : ''}
            </div>
        </div>
    `).join('');
}

function accelerateLesson(id) {
    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].status = 'accelerated';
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

// --- 4. الواجبات ---
function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId === currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    
    container.innerHTML = list.map(a => `
        <div class="content-card">
            <h4>${a.title}</h4>
            <p>موعد التسليم: ${a.dueDate || 'مفتوح'}</p>
            <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${a.id})">حذف</button>
        </div>
    `).join('') || '<p>لا يوجد واجبات.</p>';
}

function showAssignHomeworkModal() {
    // تعبئة القوائم
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId === currentStudentId);
    const assignmentsLib = JSON.parse(localStorage.getItem('assignments') || '[]'); // واجبات المكتبة
    
    const lessonSelect = document.getElementById('homeworkLessonSelect');
    lessonSelect.innerHTML = lessons.map(l => `<option value="${l.id}">${l.title}</option>`).join('');
    
    const assignSelect = document.getElementById('homeworkSelect');
    assignSelect.innerHTML = assignmentsLib.map(a => `<option value="${a.id}">${a.title}</option>`).join('');
    
    document.getElementById('assignHomeworkModal').classList.add('show');
}

function assignHomework() {
    const assignId = document.getElementById('homeworkSelect').value;
    const dueDate = document.getElementById('homeworkDueDate').value;
    // ... منطق الحفظ في LocalStorage ...
    closeModal('assignHomeworkModal');
    loadAssignmentsTab();
}

// --- 5. التقدم ---
function loadProgressTab() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId === currentStudentId);
    const tbody = document.getElementById('progressTableBody');
    
    tbody.innerHTML = lessons.map(l => `
        <tr>
            <td>${l.objective}</td>
            <td>التعلم المباشر</td> <td>${l.status === 'pending' ? 'قادم' : (l.status === 'completed' ? 'متحقق' : 'قيد التنفيذ')}</td>
            <td>
                ${l.status === 'completed' ? 'تم التحقق في ' + new Date().toLocaleDateString('ar-SA') : 'لم يبدأ'}
                ${l.status === 'accelerated' ? '<br><span style="color:red">تسريع (تجاوز)</span>' : ''}
            </td>
        </tr>
    `).join('');
}

// أدوات مساعدة
function switchTab(tabName) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`button[data-tab="${tabName}"]`).classList.add('active');
    
    if(tabName === 'iep') loadIEPTab();
    if(tabName === 'lessons') loadLessonsTab();
    if(tabName === 'assignments') loadAssignmentsTab();
    if(tabName === 'progress') loadProgressTab();
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function dayMap(dayAr) {
    const map = {'الأحد':'sunday', 'الاثنين':'monday', 'الثلاثاء':'tuesday', 'الأربعاء':'wednesday', 'الخميس':'thursday'};
    return map[dayAr];
}

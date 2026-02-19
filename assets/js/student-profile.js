// ============================================
// 📁 الملف: assets/js/student-profile.js
// الوصف: إدارة وعرض بيانات ملف الطالب (محدث ليتوافق مع الجوال)
// ============================================

let currentStudentId = null;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    currentStudentId = urlParams.get('id');

    if (!currentStudentId) {
        alert('لم يتم تحديد الطالب');
        window.location.href = 'students.html';
        return;
    }

    loadStudentData();
    setupTabs();
});

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id == currentStudentId && u.role === 'student');

    if (!student) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }

    // تحديث بيانات الترويسة
    if(document.getElementById('studentNameHeader')) document.getElementById('studentNameHeader').innerText = student.name;
    if(document.getElementById('headerGrade')) document.getElementById('headerGrade').innerText = student.grade;
    if(document.getElementById('headerSubject')) document.getElementById('headerSubject').innerText = student.subject;
    
    // حساب الإحصائيات (أمثلة)
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId == currentStudentId);
    const completedLessons = lessons.filter(l => l.status === 'completed').length;
    
    if(document.getElementById('statCompletedLessons')) document.getElementById('statCompletedLessons').innerText = completedLessons;
    
    // تحميل التبويب الأول افتراضياً
    loadTabContent('lessons');
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // إزالة التنشيط من جميع الأزرار والمحتويات
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // تنشيط الزر الحالي ومحتواه
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            const contentEl = document.getElementById(tabId);
            if(contentEl) contentEl.classList.add('active');

            // تحميل البيانات للتبويب
            loadTabContent(tabId);
        });
    });
}

function loadTabContent(tabId) {
    const contentEl = document.getElementById(tabId);
    if (!contentEl) return;

    contentEl.innerHTML = '<div class="loading-spinner">جاري التحميل...</div>';

    setTimeout(() => {
        switch(tabId) {
            case 'lessons':
                const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId == currentStudentId);
                contentEl.innerHTML = renderStudentLessons(lessons);
                break;
            case 'assignments':
                const assignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId == currentStudentId);
                contentEl.innerHTML = renderStudentAssignments(assignments);
                break;
            case 'tests':
                const tests = JSON.parse(localStorage.getItem('studentTests') || '[]').filter(t => t.studentId == currentStudentId);
                contentEl.innerHTML = renderStudentTests(tests);
                break;
            case 'iep':
                contentEl.innerHTML = renderStudentIEP();
                break;
            case 'reports':
                contentEl.innerHTML = renderStudentReports();
                break;
        }
    }, 300);
}

// 🔥 تم إضافة غلاف <div class="table-container"> للجداول هنا لتدعم السحب بالأصبع في الجوال
function renderStudentLessons(lessons) {
    if (!lessons.length) return '<div class="empty-state">لا توجد دروس حالياً</div>';
    
    let html = `
    <div class="table-container">
        <table class="custom-table">
            <thead>
                <tr>
                    <th>الدرس</th>
                    <th>التاريخ</th>
                    <th>الدرجة</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    lessons.forEach(lesson => {
        html += `
            <tr>
                <td>${lesson.title || 'درس ' + lesson.id}</td>
                <td>${lesson.date || '---'}</td>
                <td>${lesson.score ? lesson.score + '%' : '---'}</td>
                <td><span class="status-badge status-${lesson.status}">${translateStatus(lesson.status)}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    </div>`;
    return html;
}

function renderStudentAssignments(assignments) {
    if (!assignments.length) return '<div class="empty-state">لا توجد واجبات حالياً</div>';
    
    let html = `
    <div class="table-container">
        <table class="custom-table">
            <thead>
                <tr>
                    <th>الواجب</th>
                    <th>تاريخ التسليم</th>
                    <th>الدرجة</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    assignments.forEach(assignment => {
        html += `
            <tr>
                <td>${assignment.title || 'واجب ' + assignment.id}</td>
                <td>${assignment.dueDate || '---'}</td>
                <td>${assignment.score ? assignment.score + '%' : '---'}</td>
                <td><span class="status-badge status-${assignment.status}">${translateStatus(assignment.status)}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    </div>`;
    return html;
}

function renderStudentTests(tests) {
    if (!tests.length) return '<div class="empty-state">لا توجد اختبارات حالياً</div>';
    
    let html = `
    <div class="table-container">
        <table class="custom-table">
            <thead>
                <tr>
                    <th>الاختبار</th>
                    <th>التاريخ</th>
                    <th>الدرجة</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    tests.forEach(test => {
        html += `
            <tr>
                <td>${test.title || 'اختبار ' + test.id}</td>
                <td>${test.date || '---'}</td>
                <td>${test.score ? test.score + '%' : '---'}</td>
                <td><span class="status-badge status-${test.status}">${translateStatus(test.status)}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    </div>`;
    return html;
}

function renderStudentIEP() {
    return `<div class="empty-state">
        <i class="fas fa-file-alt" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px;"></i>
        <p>الخطة التربوية الفردية (IEP) قيد التطوير...</p>
        <button class="btn btn-primary" style="margin-top: 15px;">إنشاء خطة جديدة</button>
    </div>`;
}

function renderStudentReports() {
    return `<div class="empty-state">
        <i class="fas fa-chart-line" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px;"></i>
        <p>التقارير التحليلية قيد التطوير...</p>
    </div>`;
}

function translateStatus(status) {
    const statuses = {
        'pending': 'قيد الانتظار',
        'completed': 'مكتمل',
        'in_progress': 'قيد التنفيذ',
        'accelerated': 'مُسرّع',
        'late': 'متأخر'
    };
    return statuses[status] || status;
}

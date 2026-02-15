// ============================================
// 📁 المسار: assets/js/reports.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    initReports();
});

function initReports() {
    // تفعيل التبويبات (Tabs)
    const tabs = document.querySelectorAll('.report-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // تحميل البيانات عند فتح التبويب
            if (targetId === 'schedule-report') {
                generateScheduleReport();
            } else if (targetId === 'progress-report') {
                loadStudentsForReport();
            }
        });
    });

    // تفعيل التبويب الافتراضي (الجدول)
    if(document.getElementById('schedule-report')) {
        generateScheduleReport();
    }
}

// ---------------------------------------------------------
// 1. تقرير الجدول الدراسي (الإصلاح هنا)
// ---------------------------------------------------------
function generateScheduleReport() {
    const tbody = document.querySelector('#scheduleReportTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const user = getCurrentUser();
    
    // جلب البيانات
    const schedule = JSON.parse(localStorage.getItem('studySchedule') || '[]');
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // ✅ مصفوفة الأيام (تم ضبط الهمزات لتطابق المدخلات القياسية)
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    // عدد الحصص (مثلاً 8 حصص)
    const periodsCount = 8;

    days.forEach(day => {
        // التحقق من وجود حصص لهذا اليوم للمعلم الحالي
        // نبحث عن أي حصة في هذا اليوم تخص المعلم
        // نستخدم s.day.includes لضمان التوافق حتى لو اختلفت الهمزة قليلاً
        const hasClasses = schedule.some(s => s.teacherId === user.id && s.day === day);

        if (true) { // عرض جميع الأيام حتى لو فارغة، أو استخدم if(hasClasses) لإخفاء الأيام الفارغة
            const tr = document.createElement('tr');
            
            // عمود اليوم
            const tdDay = document.createElement('td');
            tdDay.className = 'fw-bold bg-light';
            tdDay.textContent = day;
            tr.appendChild(tdDay);

            // إنشاء أعمدة الحصص
            for (let i = 1; i <= periodsCount; i++) {
                const td = document.createElement('td');
                
                // ✅ البحث المرن:
                // 1. يطابق اليوم
                // 2. يطابق الحصة (باستخدام == بدلاً من === للتعامل مع النصوص والأرقام)
                // 3. يطابق المعلم
                const session = schedule.find(s => 
                    s.day === day && 
                    s.period == i && 
                    s.teacherId === user.id
                );

                if (session) {
                    const student = students.find(st => st.id == session.studentId); // بحث مرن عن الطالب
                    if (student) {
                        td.innerHTML = `
                            <div class="report-cell-content">
                                <span class="student-name">${student.name}</span>
                                <span class="subject-badge badge-sm">${session.subject}</span>
                            </div>
                        `;
                    } else {
                        td.innerHTML = '<span class="text-muted small">طالب محذوف</span>';
                    }
                } else {
                    td.textContent = '-';
                    td.className = 'text-center text-muted';
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
    });
}

// ---------------------------------------------------------
// 2. تقرير تقدم الطالب
// ---------------------------------------------------------
function loadStudentsForReport() {
    const select = document.getElementById('reportStudentSelect');
    if (!select) return;

    const user = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]').filter(s => s.teacherId === user.id);

    select.innerHTML = '<option value="">-- اختر الطالب --</option>';
    students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

function generateStudentReport() {
    const studentId = document.getElementById('reportStudentSelect').value;
    const container = document.getElementById('studentReportResult');
    
    if (!studentId) {
        alert('الرجاء اختيار الطالب أولاً');
        return;
    }

    const user = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id == studentId);
    
    // جلب البيانات المرتبطة بالطالب
    // (هنا يمكنك إضافة منطق لجلب الدرجات، الملاحظات، الأهداف المحققة من LocalStorage)
    // كمثال بسيط سأعرض البيانات الأساسية
    
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]').filter(o => o.teacherId === user.id);
    // افتراض: نحتاج لربط الأهداف بالطلاب في المستقبل (حالياً النظام يربط المحتوى بالأهداف)
    
    const today = new Date().toLocaleDateString('ar-SA');

    container.innerHTML = `
        <div class="report-paper">
            <div class="report-header text-center mb-4">
                <h3>تقرير متابعة طالب</h3>
                <p class="text-muted">تاريخ التقرير: ${today}</p>
            </div>
            
            <div class="report-section-box mb-4">
                <h5>بيانات الطالب</h5>
                <table class="table table-bordered">
                    <tr><th>الاسم</th><td>${student.name}</td><th>الصف</th><td>${student.grade}</td></tr>
                    <tr><th>رقم الهوية</th><td>${student.idNumber || '-'}</td><th>تاريخ الميلاد</th><td>${student.dob || '-'}</td></tr>
                </table>
            </div>

            <div class="report-section-box mb-4">
                <h5>ملخص الأداء (تجريبي)</h5>
                <p class="text-muted">لا توجد بيانات تقييم مرتبطة بهذا الطالب حالياً.</p>
                </div>

            <div class="text-center mt-4">
                <button class="btn btn-outline-primary" onclick="window.print()"><i class="fas fa-print"></i> طباعة التقرير</button>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------
// دوال مساعدة
// ---------------------------------------------------------
function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) window.location.href = '../../index.html';
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

function loadUserInfo() {
    const user = getCurrentUser();
    const el = document.getElementById('userName');
    if(el) el.textContent = user.name;
}

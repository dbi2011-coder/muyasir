// ============================================
// 📁 المسار: assets/js/reports.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من تسجيل الدخول أولاً
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = '../../index.html';
        return;
    }

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
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            // تحميل البيانات عند فتح التبويب
            if (targetId === 'schedule-report') {
                generateScheduleReport();
            } else if (targetId === 'progress-report') {
                loadStudentsForReport();
            }
        });
    });

    // تشغيل التقرير الافتراضي إذا كانت الصفحة تحتوي عليه
    if(document.getElementById('scheduleReportTable')) {
        generateScheduleReport();
    }
}

// ---------------------------------------------------------
// دالة تنظيف النصوص (لحل مشكلة الهمزات: الأحد vs الاحد)
// ---------------------------------------------------------
function normalizeText(text) {
    if (!text) return "";
    return text.toString().trim()
        .replace(/[أإآ]/g, 'ا')  // استبدال كل أشكال الألف بـ ا
        .replace(/ة/g, 'ه');     // استبدال ة بـ ه
}

// ---------------------------------------------------------
// 1. تقرير الجدول الدراسي (المعدل)
// ---------------------------------------------------------
function generateScheduleReport() {
    const tbody = document.querySelector('#scheduleReportTable tbody');
    if (!tbody) {
        console.error("لم يتم العثور على جدول التقرير #scheduleReportTable");
        return;
    }

    tbody.innerHTML = ''; // مسح المحتوى القديم
    const user = getCurrentUser();
    
    // جلب البيانات مع التعامل مع القيم الفارغة
    const rawSchedule = localStorage.getItem('studySchedule');
    const rawStudents = localStorage.getItem('students');
    
    const schedule = rawSchedule ? JSON.parse(rawSchedule) : [];
    const students = rawStudents ? JSON.parse(rawStudents) : [];

    // مصفوفة الأيام القياسية للعرض
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const periodsCount = 8; // عدد الحصص

    // التأكد من وجود بيانات
    if (schedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted p-3">لا يوجد جدول دراسي محفوظ حالياً</td></tr>';
        return;
    }

    days.forEach(displayDay => {
        const tr = document.createElement('tr');
        
        // عمود اسم اليوم
        const tdDay = document.createElement('td');
        tdDay.className = 'fw-bold bg-light';
        tdDay.textContent = displayDay; // العرض دائماً بالهمزة الصحيحة
        tr.appendChild(tdDay);

        // البحث عن الحصص (من 1 إلى 8)
        for (let i = 1; i <= periodsCount; i++) {
            const td = document.createElement('td');
            
            // 🔥 البحث الذكي: نقارن النصوص بعد تنظيفها من الهمزات
            const session = schedule.find(s => 
                normalizeText(s.day) === normalizeText(displayDay) && 
                s.period == i &&  // == تسمح بمقارنة النص "1" مع الرقم 1
                s.teacherId === user.id
            );

            if (session) {
                // البحث عن الطالب المرتبط بالحصة
                const student = students.find(st => st.id == session.studentId);
                
                if (student) {
                    td.innerHTML = `
                        <div class="report-cell-content" style="font-size: 0.85rem;">
                            <div class="fw-bold text-primary">${student.name}</div>
                            <div class="badge bg-light text-dark border">${session.subject || 'مادة'}</div>
                        </div>
                    `;
                } else {
                    td.innerHTML = '<span class="text-danger small">بيانات الطالب مفقودة</span>';
                }
            } else {
                td.textContent = '-';
                td.className = 'text-center text-muted bg-white';
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
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

    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id == studentId);

    if (!student) return;
    
    const today = new Date().toLocaleDateString('ar-SA');

    container.innerHTML = `
        <div class="report-paper border p-4 bg-white rounded">
            <div class="report-header text-center mb-4 border-bottom pb-3">
                <h3 class="mb-2">تقرير متابعة طالب</h3>
                <p class="text-muted mb-0">تاريخ التقرير: ${today}</p>
            </div>
            
            <div class="mb-4">
                <h5 class="text-primary mb-3">📌 بيانات الطالب</h5>
                <table class="table table-bordered table-sm">
                    <tr>
                        <th class="bg-light" style="width:20%">الاسم</th><td>${student.name}</td>
                        <th class="bg-light" style="width:20%">الصف</th><td>${student.grade}</td>
                    </tr>
                    <tr>
                        <th class="bg-light">رقم الهوية</th><td>${student.idNumber || '-'}</td>
                        <th class="bg-light">تاريخ الميلاد</th><td>${student.dob || '-'}</td>
                    </tr>
                </table>
            </div>

            <div class="alert alert-info text-center">
                يمكنك هنا إضافة الرسوم البيانية لدرجات الطالب (ميزة قادمة)
            </div>

            <div class="text-center mt-4 no-print">
                <button class="btn btn-outline-dark" onclick="window.print()">
                    <i class="fas fa-print"></i> طباعة التقرير
                </button>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------
// دوال مساعدة عامة
// ---------------------------------------------------------
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr).user : null;
}

function loadUserInfo() {
    const user = getCurrentUser();
    const el = document.getElementById('userName');
    if(el && user) el.textContent = user.name;
}

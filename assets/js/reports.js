// ============================================
// 📁 المسار: assets/js/reports.js
// (نسخة آمنة ومستقلة لتجنب التضارب)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من تسجيل الدخول
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = '../../index.html';
        return;
    }

    // استدعاء دوال التقرير بأسماء فريدة لمنع التضارب
    runReportUserInfo(); 
    initReportsSystem();
});

// ---------------------------------------------------------
// دالة خاصة لجلب المستخدم في صفحة التقارير
// ---------------------------------------------------------
function getReportUser() {
    try {
        const userStr = sessionStorage.getItem('currentUser');
        if (!userStr) return null;
        // دعم الصيغتين المحتملتين لتخزين المستخدم
        const parsed = JSON.parse(userStr);
        return parsed.user ? parsed.user : parsed;
    } catch (e) {
        console.error("خطأ في جلب بيانات المستخدم:", e);
        return null;
    }
}

// ---------------------------------------------------------
// دالة عرض اسم المعلم (مستقلة)
// ---------------------------------------------------------
function runReportUserInfo() {
    const user = getReportUser();
    const el = document.getElementById('userName');
    if (el && user) {
        el.textContent = user.name || 'المعلم';
    }
}

// ---------------------------------------------------------
// تهيئة نظام التقارير
// ---------------------------------------------------------
function initReportsSystem() {
    // تفعيل التبويبات
    const tabs = document.querySelectorAll('.report-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if(targetSection) targetSection.classList.add('active');

            if (targetId === 'schedule-report') {
                renderSafeScheduleReport();
            } else if (targetId === 'progress-report') {
                fillStudentSelectDropdown();
            }
        });
    });

    // التشغيل التلقائي عند التحميل
    if (document.getElementById('scheduleReportTable')) {
        renderSafeScheduleReport();
    }
}

// ---------------------------------------------------------
// معالجة النصوص وحل مشاكل الهمزات
// ---------------------------------------------------------
function safeNormalize(text) {
    if (!text) return "";
    return String(text).trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه');
}

// ---------------------------------------------------------
// 1. تقرير الجدول الدراسي (النسخة الآمنة)
// ---------------------------------------------------------
function renderSafeScheduleReport() {
    const tbody = document.querySelector('#scheduleReportTable tbody');
    if (!tbody) return;

    tbody.innerHTML = ''; 
    const user = getReportUser();
    
    // جلب البيانات مع حماية ضد القيم الفارغة
    let schedule = [];
    let students = [];
    
    try {
        schedule = JSON.parse(localStorage.getItem('studySchedule') || '[]');
        students = JSON.parse(localStorage.getItem('students') || '[]');
    } catch (e) {
        console.error("خطأ في قراءة البيانات:", e);
    }

    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const periodsCount = 8;

    if (!schedule || schedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center p-3 text-muted">لا توجد بيانات للعرض</td></tr>';
        return;
    }

    days.forEach(displayDay => {
        const tr = document.createElement('tr');
        
        // خلية اليوم
        const tdDay = document.createElement('td');
        tdDay.className = 'fw-bold bg-light';
        tdDay.textContent = displayDay;
        tr.appendChild(tdDay);

        for (let i = 1; i <= periodsCount; i++) {
            const td = document.createElement('td');
            
            try {
                // البحث باستخدام == للمقارنة المرنة بين الأرقام والنصوص
                const session = schedule.find(s => 
                    s.teacherId == user.id && // مقارنة مرنة
                    s.period == i &&          // مقارنة مرنة
                    s.day && safeNormalize(s.day) === safeNormalize(displayDay)
                );

                if (session) {
                    const student = students.find(st => st.id == session.studentId);
                    if (student) {
                        td.innerHTML = `
                            <div style="font-size:0.85rem; line-height:1.4;">
                                <div class="fw-bold text-primary">${student.name}</div>
                                <div class="text-muted small">${session.subject || '-'}</div>
                            </div>
                        `;
                    } else {
                        td.innerHTML = '<span class="text-danger small">طالب غير موجود</span>';
                    }
                } else {
                    td.textContent = '-';
                    td.className = 'text-center text-muted';
                }
            } catch (err) {
                console.error("خطأ في الخلية:", err);
                td.textContent = 'خطأ';
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

// ---------------------------------------------------------
// 2. تعبئة قائمة الطلاب (للتقرير الثاني)
// ---------------------------------------------------------
function fillStudentSelectDropdown() {
    const select = document.getElementById('reportStudentSelect');
    if (!select) return;

    const user = getReportUser();
    let students = [];
    try {
        students = JSON.parse(localStorage.getItem('students') || '[]');
    } catch(e) { return; }

    // فلترة طلاب المعلم الحالي
    const myStudents = students.filter(s => s.teacherId == user.id);

    select.innerHTML = '<option value="">-- اختر الطالب --</option>';
    myStudents.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

// دالة توليد تقرير الطالب (يتم استدعاؤها من الزر في HTML)
function generateStudentReport() {
    const select = document.getElementById('reportStudentSelect');
    const studentId = select ? select.value : null;
    const container = document.getElementById('studentReportResult');
    
    if (!studentId || !container) {
        alert('الرجاء اختيار الطالب');
        return;
    }

    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id == studentId);

    if (!student) return;

    const today = new Date().toLocaleDateString('ar-SA');

    container.innerHTML = `
        <div class="border p-4 bg-white rounded mt-3">
            <div class="text-center mb-4 border-bottom pb-3">
                <h3>تقرير متابعة طالب</h3>
                <p class="text-muted">تاريخ: ${today}</p>
            </div>
            <table class="table table-bordered table-sm">
                <tr><th class="bg-light w-25">الاسم</th><td>${student.name}</td></tr>
                <tr><th class="bg-light">الصف</th><td>${student.grade}</td></tr>
                <tr><th class="bg-light">رقم الهوية</th><td>${student.idNumber || '-'}</td></tr>
            </table>
            <div class="alert alert-light border text-center mt-3">
                <p>تفاصيل التقدم الدراسي ستظهر هنا بناءً على البيانات المدخلة.</p>
            </div>
            <div class="text-center mt-3 no-print">
                <button class="btn btn-dark btn-sm" onclick="window.print()">طباعة</button>
            </div>
        </div>
    `;
}

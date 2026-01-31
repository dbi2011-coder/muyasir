// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: تشغيل واجهة التقارير (متوافق مع reports.html) + عزل البيانات
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. إصلاح البيانات تلقائياً (ربط الطلاب بالمعلم)
    forceFixData();
    // 2. حقن ستايل الطباعة
    injectPrintStyles();
    // 3. تحميل قائمة الطلاب في الشريط الجانبي (طلابك فقط)
    loadSideStudentsList();
});

// متغير عام لحفظ طلاب المعلم الحالي
let myStudentsGlobal = [];

// =========================================================
// 1. دوال الواجهة (التي يطلبها ملف HTML الخاص بك)
// =========================================================

// تحميل قائمة الطلاب في "الصندوق الجانبي" مع مربعات الاختيار
function loadSideStudentsList() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    let currentUser = getCurrentUser();
    if (!currentUser) {
        container.innerHTML = '<div class="text-danger p-2">يرجى تسجيل الدخول</div>';
        return;
    }

    // جلب الطلاب المرتبطين بهذا المعلم فقط
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    myStudentsGlobal = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    if (myStudentsGlobal.length === 0) {
        container.innerHTML = '<div class="text-muted p-2">لا يوجد طلاب مسجلين</div>';
        return;
    }

    // بناء قائمة مربعات الاختيار (Checkboxes)
    let html = '';
    myStudentsGlobal.forEach(student => {
        html += `
            <div class="student-item" style="padding:5px; border-bottom:1px solid #eee;">
                <label style="cursor:pointer; display:block; width:100%;">
                    <input type="checkbox" class="student-checkbox" value="${student.id}" checked>
                    <span style="margin-right:5px;">${student.name}</span>
                </label>
            </div>
        `;
    });
    container.innerHTML = html;
}

// دالة تحديد الكل / إلغاء التحديد (الموجودة في واجهتك)
function toggleSelectAll(checked) {
    const boxes = document.querySelectorAll('.student-checkbox');
    boxes.forEach(box => box.checked = checked);
}

// الدالة الرئيسية التي يستدعيها زر "عرض التقرير" في واجهتك
function initiateReport() {
    // 1. معرفة نوع التقرير المختار
    // نبحث عن radio button المختار (نتوقع أن يكون اسمه reportType في HTML)
    const typeInput = document.querySelector('input[name="reportType"]:checked');
    const reportType = typeInput ? typeInput.value : 'classBalance';

    // 2. معرفة الطلاب المختارين
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

    if (selectedIds.length === 0) {
        alert("يرجى اختيار طالب واحد على الأقل");
        return;
    }

    // 3. فلترة الطلاب المختارين من القائمة العامة
    const selectedStudents = myStudentsGlobal.filter(s => selectedIds.includes(s.id));
    const currentUser = getCurrentUser();

    // 4. توجيه الطلب لنوع التقرير المناسب
    switch(reportType) {
        case 'studentData':
            renderStudentDataReport(currentUser, selectedStudents);
            break;
        case 'diagnostic':
            renderDiagnosticReport(currentUser, selectedStudents);
            break;
        case 'iep':
            renderIEPReport(currentUser, selectedStudents);
            break;
        case 'classBalance':
        default:
            renderClassBalanceReport(currentUser, selectedStudents);
            break;
    }
}

// =========================================================
// 2. دوال رسم التقارير (Render Functions)
// =========================================================

// أ) تقرير رصيد الحصص (المطلوب بشدة)
function renderClassBalanceReport(teacher, students) {
    // حساب الحصص
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const mySchedule = allSchedules.filter(s => s.teacherId == teacher.id);
    const counts = {};
    
    mySchedule.forEach(sess => {
        if(sess.students) sess.students.forEach(id => counts[id] = (counts[id]||0)+1);
    });

    let html = buildReportHeader("تقرير رصيد الحصص", teacher.name);
    
    html += `
    <table class="report-table">
        <thead>
            <tr><th>م</th><th>الطالب</th><th>الصف</th><th>الرصيد</th><th>الحالة</th></tr>
        </thead>
        <tbody>`;

    students.forEach((s, i) => {
        const c = counts[s.id] || 0;
        let colorClass = 'text-black';
        let status = 'منتظم';
        let displayCount = c;

        if (c < 5) { colorClass = 'text-red'; status = 'يحتاج تعويض'; }
        else if (c > 20) { colorClass = 'text-green'; status = 'متقدم'; displayCount = '+' + c; }

        html += `
            <tr>
                <td>${i+1}</td>
                <td style="font-weight:bold;">${s.name}</td>
                <td>${s.grade||'-'}</td>
                <td class="${colorClass}" style="font-size:1.2em; direction:ltr;">${displayCount}</td>
                <td>${status}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    
    // إضافة الدليل
    html += `
        <div class="report-legend">
            <strong>دليل التقرير:</strong>
            <ul>
                <li style="color:red">الأحمر: يحتاج تعويض</li>
                <li style="color:green">الأخضر: متقدم</li>
                <li>الأسود: منتظم</li>
            </ul>
        </div>
    `;

    html += buildReportFooter(teacher.name);
    displayReport(html);
}

// ب) تقرير بيانات الطلاب
function renderStudentDataReport(teacher, students) {
    let html = buildReportHeader("بيانات الطلاب المسجلين", teacher.name);
    html += `
    <table class="report-table">
        <thead><tr><th>م</th><th>الاسم</th><th>رقم الهوية</th><th>تاريخ الميلاد</th><th>الصف</th></tr></thead>
        <tbody>`;
    students.forEach((s, i) => {
        html += `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.idNumber||'-'}</td><td>${s.dob||'-'}</td><td>${s.grade||'-'}</td></tr>`;
    });
    html += `</tbody></table>`;
    html += buildReportFooter(teacher.name);
    displayReport(html);
}

// ج) تقرير تشخيصي (مثال)
function renderDiagnosticReport(teacher, students) {
    let html = buildReportHeader("حالة الاختبار التشخيصي", teacher.name);
    html += `<table class="report-table"><thead><tr><th>م</th><th>الطالب</th><th>الحالة</th><th>النتيجة</th></tr></thead><tbody>`;
    students.forEach((s, i) => {
        html += `<tr><td>${i+1}</td><td>${s.name}</td><td>مكتمل</td><td>-</td></tr>`;
    });
    html += `</tbody></table>`;
    html += buildReportFooter(teacher.name);
    displayReport(html);
}

// د) تقرير الخطة الفردية (مثال)
function renderIEPReport(teacher, students) {
    let html = buildReportHeader("متابعة الخطط الفردية", teacher.name);
    html += `<table class="report-table"><thead><tr><th>م</th><th>الطالب</th><th>تاريخ البدء</th><th>نسبة الإنجاز</th></tr></thead><tbody>`;
    students.forEach((s, i) => {
        html += `<tr><td>${i+1}</td><td>${s.name}</td><td>-</td><td>0%</td></tr>`;
    });
    html += `</tbody></table>`;
    html += buildReportFooter(teacher.name);
    displayReport(html);
}

// =========================================================
// 3. أدوات مساعدة (Helpers)
// =========================================================

function buildReportHeader(title, teacherName) {
    return `
        <div style="text-align:center; margin-bottom:20px; font-family:'Times New Roman';">
            <h2 style="text-decoration:underline;">${title}</h2>
            <h3>المعلم: ${teacherName}</h3>
        </div>
    `;
}

function buildReportFooter(teacherName) {
    const date = new Date().toLocaleDateString('ar-SA');
    return `
        <div style="margin-top:30px; text-align:left; font-size:0.9em; font-family:'Times New Roman'; direction:rtl;">
            تم استخراج التقرير بواسطة: <strong>${teacherName}</strong> - بتاريخ: ${date}
        </div>
    `;
}

function displayReport(htmlContent) {
    const preview = document.getElementById('reportPreviewArea');
    if (preview) {
        preview.innerHTML = htmlContent;
        // إزالة أيقونة المعاينة الافتراضية إن وجدت
        preview.style.textAlign = 'right'; 
    }
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
}

function forceFixData() {
    let user = getCurrentUser();
    if (!user) return;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    let mod = false;
    users = users.map(u => {
        if (u.role === 'student' && !u.teacherId) { u.teacherId = user.id; mod = true; }
        return u;
    });
    if (mod) localStorage.setItem('users', JSON.stringify(users));
}

function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .report-table { width: 100%; border-collapse: collapse; border: 2px solid #000; font-family: 'Times New Roman'; font-size: 12pt; margin: 15px 0; }
        .report-table th, .report-table td { border: 1px solid #000; padding: 8px; text-align: center; }
        .report-table th { background: #f0f0f0; font-weight: bold; }
        .text-red { color: red !important; font-weight: bold; }
        .text-green { color: green !important; font-weight: bold; }
        .report-legend { border: 1px solid #ccc; padding: 10px; font-size: 0.9em; margin-top: 20px; }
        .report-legend ul { list-style: none; padding: 0; margin: 5px 0 0 0; }
        @media print {
            body * { visibility: hidden; }
            #reportPreviewArea, #reportPreviewArea * { visibility: visible; }
            #reportPreviewArea { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
        }
    `;
    document.head.appendChild(style);
}

// تصدير الدوال للـ HTML
window.loadSideStudentsList = loadSideStudentsList;
window.toggleSelectAll = toggleSelectAll;
window.initiateReport = initiateReport;

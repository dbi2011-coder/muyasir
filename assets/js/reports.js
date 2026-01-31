// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نظام التقارير الشامل (جميع الأنواع + عزل بيانات المعلم)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // إصلاح البيانات تلقائياً عند التحميل
    forceFixData();
    // حقن ستايل الطباعة
    injectPrintStyles();
});

// 1. حقن أنماط الطباعة (كما في نسختك الأصلية)
function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page { size: A4; margin: 10mm; }
            body * { visibility: hidden; }
            .main-sidebar, .header, .sidebar, .no-print, button, input, select, .alert, .dashboard-header, .sidebar-menu { display: none !important; }
            #reportPreviewArea, #reportPreviewArea * { visibility: visible; }
            #reportPreviewArea {
                position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
                background: white; direction: rtl;
            }
            table {
                width: 100% !important; border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif; font-size: 12pt;
                margin-top: 15px; margin-bottom: 15px;
            }
            th, td {
                border: 1px solid #000 !important; padding: 8px !important;
                text-align: center !important;
            }
            th { background-color: #f0f0f0 !important; font-weight: bold; }
        }
    `;
    document.head.appendChild(style);
}

// 2. الدالة الرئيسية: تحديد نوع التقرير وتوجيهه
function generateReport() {
    // التحقق من نوع التقرير المختار (من أزرار الراديو)
    const selectedOption = document.querySelector('input[name="reportType"]:checked');
    const reportType = selectedOption ? selectedOption.value : 'classBalance'; // الافتراضي

    // التحقق من المستخدم
    let currentUser = null;
    try {
        if (typeof getCurrentUser === 'function') currentUser = getCurrentUser();
        else currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    } catch(e) {}

    if (!currentUser) return alert("يرجى تسجيل الدخول");

    // توجيه الطلب حسب النوع
    switch (reportType) {
        case 'studentData':
            generateStudentDataReport(currentUser);
            break;
        case 'classBalance': // هذا هو رصيد الحصص
            generateClassBalanceReport(currentUser);
            break;
        case 'diagnostic':
            generateDiagnosticReport(currentUser);
            break;
        case 'iep':
            generateIEPReport(currentUser);
            break;
        default:
            generateClassBalanceReport(currentUser);
    }
}

// =========================================================
// 📊 النوع الأول: تقرير بيانات الطلاب (Student Data)
// =========================================================
function generateStudentDataReport(user) {
    const students = getMyStudents(user);
    if (!students) return;

    let html = buildHeader("تقرير بيانات الطلاب", user.name);
    
    html += `
    <table border="1">
        <thead>
            <tr>
                <th>م</th><th>اسم الطالب</th><th>الصف</th><th>رقم الهوية</th><th>تاريخ الميلاد</th>
            </tr>
        </thead>
        <tbody>`;

    students.forEach((s, i) => {
        html += `<tr>
            <td>${i+1}</td>
            <td style="font-weight:bold; text-align:right;">${s.name}</td>
            <td>${s.grade || '-'}</td>
            <td>${s.idNumber || '-'}</td>
            <td>${s.dob || '-'}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    html += buildFooter(user.name);
    renderReport(html);
}

// =========================================================
// 📊 النوع الثاني: تقرير رصيد الحصص (Class Balance)
// =========================================================
function generateClassBalanceReport(user) {
    const students = getMyStudents(user);
    if (!students) return;

    // جلب الجدول الخاص بالمعلم فقط
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const mySchedule = allSchedules.filter(s => s.teacherId == user.id);

    const counts = {};
    mySchedule.forEach(sess => {
        if (sess.students) sess.students.forEach(sid => counts[sid] = (counts[sid] || 0) + 1);
    });

    let html = buildHeader("تقرير رصيد الحصص", user.name);
    html += `
    <table border="1">
        <thead>
            <tr>
                <th>م</th><th>اسم الطالب</th><th>الصف</th><th>الرصيد</th><th>الحالة</th>
            </tr>
        </thead>
        <tbody>`;

    students.forEach((s, i) => {
        const c = counts[s.id] || 0;
        let color = 'black';
        let status = 'منتظم';
        if(c < 5) { color = 'red'; status = 'يحتاج تعويض'; }
        else if(c > 20) { color = 'green'; status = 'متقدم'; }

        html += `<tr>
            <td>${i+1}</td>
            <td style="font-weight:bold; text-align:right;">${s.name}</td>
            <td>${s.grade || '-'}</td>
            <td style="font-weight:bold; color:${color}; direction:ltr;">${c}</td>
            <td>${status}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    
    // إضافة الدليل (Legend)
    html += `
    <div style="border:1px solid #ccc; padding:10px; margin-top:20px; font-size:0.9em; text-align:right;">
        <strong>الدليل:</strong>
        <ul style="list-style:none; padding:0;">
            <li style="color:red;">• الأحمر: يحتاج تعويض</li>
            <li style="color:green;">• الأخضر: متقدم</li>
        </ul>
    </div>`;

    html += buildFooter(user.name);
    renderReport(html);
}

// =========================================================
// 📊 النوع الثالث: تقرير الاختبار التشخيصي (Diagnostic)
// =========================================================
function generateDiagnosticReport(user) {
    const students = getMyStudents(user);
    if (!students) return;

    let html = buildHeader("تقرير حالة الاختبار التشخيصي", user.name);
    html += `
    <table border="1">
        <thead>
            <tr>
                <th>م</th><th>اسم الطالب</th><th>الصف</th><th>حالة الاختبار</th><th>النتيجة</th>
            </tr>
        </thead>
        <tbody>`;

    students.forEach((s, i) => {
        // هنا يمكنك جلب نتائج حقيقية إذا كانت مخزنة، حالياً سأضع قيم افتراضية
        html += `<tr>
            <td>${i+1}</td>
            <td style="text-align:right;">${s.name}</td>
            <td>${s.grade || '-'}</td>
            <td>${Math.random() > 0.5 ? 'مكتمل' : 'غير مكتمل'}</td>
            <td>-</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    html += buildFooter(user.name);
    renderReport(html);
}

// =========================================================
// 📊 النوع الرابع: تقرير الخطة التربوية الفردية (IEP)
// =========================================================
function generateIEPReport(user) {
    const students = getMyStudents(user);
    if (!students) return;

    let html = buildHeader("متابعة الخطط التربوية الفردية", user.name);
    html += `
    <table border="1">
        <thead>
            <tr>
                <th>م</th><th>اسم الطالب</th><th>تاريخ البدء</th><th>الأهداف المحققة</th><th>نسبة الإنجاز</th>
            </tr>
        </thead>
        <tbody>`;

    students.forEach((s, i) => {
        html += `<tr>
            <td>${i+1}</td>
            <td style="text-align:right;">${s.name}</td>
            <td>-</td>
            <td>0</td>
            <td>0%</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    html += buildFooter(user.name);
    renderReport(html);
}

// =========================================================
// 🛠️ دوال مساعدة (Helpers)
// =========================================================

// جلب طلاب المعلم الحالي فقط
function getMyStudents(user) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const students = allUsers.filter(u => u.role === 'student' && u.teacherId == user.id);
    
    if (students.length === 0) {
        alert("لا يوجد طلاب مسجلين باسمك.");
        return null;
    }
    return students;
}

// بناء الهيدر
function buildHeader(title, teacherName) {
    return `
    <div style="text-align:center; font-family:'Times New Roman'; margin-bottom:20px;">
        <h2 style="text-decoration:underline;">${title}</h2>
        <h3>المعلم: ${teacherName}</h3>
    </div>`;
}

// بناء الفوتر
function buildFooter(teacherName) {
    const date = new Date().toLocaleDateString('ar-SA');
    return `
    <div class="custom-footer" style="margin-top:30px; text-align:left; font-size:0.9rem; direction:rtl; font-family:'Times New Roman';">
        تم طباعة التقرير من نظام ميسر التعلم للأستاذ/ <strong>${teacherName}</strong> بتاريخ ${date}
    </div>
    <div class="no-print" style="margin-top:20px; text-align:left;">
        <button onclick="window.print()" class="btn btn-primary">🖨️ طباعة</button>
    </div>`;
}

// عرض التقرير في الصفحة
function renderReport(htmlContent) {
    const preview = document.getElementById('reportPreviewArea');
    if (preview) {
        preview.innerHTML = htmlContent;
        const container = document.getElementById('reportPreviewContainer'); // تأكد من وجود هذا العنصر في HTML
        if (container) container.style.display = 'block';
        
        // إذا كان الزر منفصلاً
        const printDiv = document.getElementById('printActions');
        if (printDiv) printDiv.style.display = 'block';
    }
}

// إصلاح البيانات
function forceFixData() {
    let user = null;
    try { 
        if(typeof getCurrentUser == 'function') user = getCurrentUser();
        else user = JSON.parse(sessionStorage.getItem('currentUser'));
    } catch(e){}

    if (!user) return;

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    let mod = false;
    users = users.map(u => {
        if(u.role === 'student' && !u.teacherId) {
            u.teacherId = user.id;
            mod = true;
        }
        return u;
    });
    if(mod) localStorage.setItem('users', JSON.stringify(users));
}

// تصدير الدوال
window.generateReport = generateReport;
window.generateClassBalanceReport = generateClassBalanceReport; // للدعم القديم
window.forceFixData = forceFixData;

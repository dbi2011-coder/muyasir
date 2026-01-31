// ============================================
// 📁 الملف: assets/js/reports_final.js
// الوصف: (ملف جديد) لحل مشكلة التعليق وعزل البيانات
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    forceFixData();      // 1. ربط الطلاب بالمعلم
    injectPrintStyles(); // 2. تنسيق الطباعة
    loadSideStudentsList(); // 3. تعبئة القائمة الجانبية
});

let myStudentsGlobal = [];

// --- 1. دوال الواجهة (متوافقة مع HTML الخاص بك) ---

function loadSideStudentsList() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    let currentUser = getCurrentUser();
    if (!currentUser) {
        container.innerHTML = '<div class="text-danger p-2">يرجى تسجيل الدخول</div>';
        return;
    }

    // 🔥 عزل البيانات: جلب طلابك أنت فقط
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    myStudentsGlobal = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    if (myStudentsGlobal.length === 0) {
        container.innerHTML = '<div class="text-muted p-2">لا يوجد طلاب مسجلين</div>';
        return;
    }

    let html = '';
    myStudentsGlobal.forEach(student => {
        html += `
            <div style="padding:5px; border-bottom:1px solid #eee;">
                <label style="cursor:pointer; display:block;">
                    <input type="checkbox" class="student-checkbox" value="${student.id}" checked>
                    <span style="margin-right:5px;">${student.name}</span>
                </label>
            </div>
        `;
    });
    container.innerHTML = html;
}

function toggleSelectAll(checked) {
    document.querySelectorAll('.student-checkbox').forEach(box => box.checked = checked);
}

function initiateReport() {
    // تحديد النوع
    const typeInput = document.querySelector('input[name="reportType"]:checked');
    const reportType = typeInput ? typeInput.value : 'classBalance';

    // تحديد الطلاب
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

    if (selectedIds.length === 0) return alert("اختر طالباً واحداً على الأقل");

    const selectedStudents = myStudentsGlobal.filter(s => selectedIds.includes(s.id));
    const currentUser = getCurrentUser();

    // التوجيه للتقرير المناسب
    if (reportType === 'classBalance') renderClassBalanceReport(currentUser, selectedStudents);
    else if (reportType === 'studentData') renderStudentDataReport(currentUser, selectedStudents);
    else if (reportType === 'diagnostic') renderDiagnosticReport(currentUser, selectedStudents);
    else renderIEPReport(currentUser, selectedStudents);
}

// --- 2. دوال الرسم (Render) بتصميمك الأصلي ---

function renderClassBalanceReport(teacher, students) {
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    // فلترة جدولك أنت فقط
    const mySchedule = allSchedules.filter(s => s.teacherId == teacher.id);
    const counts = {};
    
    mySchedule.forEach(sess => {
        if(sess.students) sess.students.forEach(id => counts[id] = (counts[id]||0)+1);
    });

    let html = buildHeader("تقرير رصيد الحصص", teacher.name);
    html += `<table class="report-table"><thead><tr><th>م</th><th>الطالب</th><th>الصف</th><th>الرصيد</th><th>الحالة</th></tr></thead><tbody>`;

    students.forEach((s, i) => {
        const c = counts[s.id] || 0;
        let color = 'black';
        let status = 'منتظم';
        let txt = c;

        // منطق ألوانك
        if (c < 5) { color = 'red'; status = 'يحتاج تعويض'; }
        else if (c > 20) { color = 'green'; status = 'متقدم'; txt = '+'+c; }

        html += `<tr>
            <td>${i+1}</td>
            <td style="font-weight:bold;">${s.name}</td>
            <td>${s.grade||'-'}</td>
            <td style="color:${color}; font-weight:bold; direction:ltr;">${txt}</td>
            <td>${status}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    
    html += `
        <div class="report-legend">
            <strong>دليل التقرير:</strong>
            <ul>
                <li style="color:red">الأحمر: يحتاج تعويض (عدد قليل)</li>
                <li style="color:green">الأخضر: متقدم (عدد كبير)</li>
                <li>الأسود: منتظم</li>
            </ul>
        </div>`;
    
    html += buildFooter(teacher.name);
    displayReport(html);
}

function renderStudentDataReport(teacher, students) {
    let html = buildHeader("بيانات الطلاب", teacher.name);
    html += `<table class="report-table"><thead><tr><th>م</th><th>الاسم</th><th>رقم الهوية</th><th>تاريخ الميلاد</th><th>الصف</th></tr></thead><tbody>`;
    students.forEach((s, i) => {
        html += `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.idNumber||'-'}</td><td>${s.dob||'-'}</td><td>${s.grade||'-'}</td></tr>`;
    });
    html += `</tbody></table>`;
    html += buildFooter(teacher.name);
    displayReport(html);
}

function renderDiagnosticReport(teacher, students) {
    let html = buildHeader("حالة الاختبار التشخيصي", teacher.name);
    html += `<table class="report-table"><thead><tr><th>م</th><th>الطالب</th><th>الحالة</th><th>النتيجة</th></tr></thead><tbody>`;
    students.forEach((s, i) => html += `<tr><td>${i+1}</td><td>${s.name}</td><td>مكتمل</td><td>-</td></tr>`);
    html += `</tbody></table>`;
    html += buildFooter(teacher.name);
    displayReport(html);
}

function renderIEPReport(teacher, students) {
    let html = buildHeader("الخطط الفردية", teacher.name);
    html += `<table class="report-table"><thead><tr><th>م</th><th>الطالب</th><th>البدء</th><th>الإنجاز</th></tr></thead><tbody>`;
    students.forEach((s, i) => html += `<tr><td>${i+1}</td><td>${s.name}</td><td>-</td><td>0%</td></tr>`);
    html += `</tbody></table>`;
    html += buildFooter(teacher.name);
    displayReport(html);
}

// --- 3. الأدوات المساعدة ---
function buildHeader(t, n) {
    return `<div style="text-align:center; font-family:'Times New Roman'; margin-bottom:20px;">
            <h2 style="text-decoration:underline;">${t}</h2><h3>المعلم: ${n}</h3></div>`;
}
function buildFooter(n) {
    return `<div style="margin-top:30px; text-align:left; font-size:0.9em; direction:rtl; font-family:'Times New Roman';">
            تم الطباعة بواسطة: <strong>${n}</strong> - التاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>`;
}
function displayReport(h) {
    const area = document.getElementById('reportPreviewArea');
    if(area) area.innerHTML = h;
}
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); }

// إصلاح البيانات (لربط الطلاب بالمعلم الحالي)
function forceFixData() {
    let u = getCurrentUser();
    if(!u) return;
    let users = JSON.parse(localStorage.getItem('users')||'[]');
    let m = false;
    users = users.map(x => { if(x.role==='student' && !x.teacherId){x.teacherId=u.id; m=true;} return x; });
    if(m) localStorage.setItem('users', JSON.stringify(users));
}

// ستايل الطباعة (نفس كودك الأصلي)
function injectPrintStyles() {
    const s = document.createElement('style');
    s.innerHTML = `
        .report-table { width: 100%; border-collapse: collapse; border: 2px solid #000; font-family: 'Times New Roman'; font-size: 12pt; margin: 15px 0; }
        .report-table th, .report-table td { border: 1px solid #000; padding: 8px; text-align: center; }
        .report-table th { background: #f0f0f0; font-weight: bold; }
        .report-legend { border: 1px solid #ccc; padding: 10px; margin-top: 20px; font-family: 'Times New Roman'; }
        .report-legend ul { list-style: none; padding: 0; }
        @media print { body * { visibility: hidden; } #reportPreviewArea, #reportPreviewArea * { visibility: visible; } #reportPreviewArea { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }
    `;
    document.head.appendChild(s);
}

// تصدير
window.initiateReport = initiateReport;
window.toggleSelectAll = toggleSelectAll;

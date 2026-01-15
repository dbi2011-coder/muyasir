// ============================================
// 📁 المسار: assets/js/reports.js
// الوصف: محرك التقارير الذكي + نظام الصلاحيات
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    checkPermissions(); // 🔒 تطبيق الصلاحيات فوراً
    loadStudentList();  // تحميل قائمة الطلاب
});

// ==========================================
// 🔒 1. نظام الصلاحيات (Security Layer)
// ==========================================
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{"user":{"role":"guest"}}').user;
}

function checkPermissions() {
    const user = getCurrentUser();
    const balanceOption = document.getElementById('optSessionBalance');
    
    // إذا لم يكن المستخدم "معلم" (Teacher) -> احذف خيار رصيد الحصص
    // افترضنا أن admin هو المعلم، وأي شيء آخر هو عضو لجنة
    if (user.role !== 'teacher' && user.role !== 'admin') {
        if(balanceOption) balanceOption.remove(); // ❌ حذف العنصر تماماً من DOM
    }
}

// ==========================================
// 👥 2. إدارة قائمة الطلاب (Data Layer)
// ==========================================
function loadStudentList() {
    // جلب الطلاب من قاعدة البيانات المحلية (Mock Data)
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const container = document.getElementById('studentCheckboxes');
    
    if (students.length === 0) {
        container.innerHTML = '<div style="color:red; padding:5px;">لا يوجد طلاب مسجلين</div>';
        return;
    }

    container.innerHTML = '';
    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'student-checkbox';
        div.innerHTML = `
            <input type="checkbox" name="selectedStudent" value="${student.id}" id="st_${student.id}">
            <label for="st_${student.id}" style="cursor:pointer; margin:0;">${student.name}</label>
        `;
        container.appendChild(div);
    });
}

function selectAllStudents(source) {
    const checkboxes = document.getElementsByName('selectedStudent');
    for(let i=0; i<checkboxes.length; i++) {
        checkboxes[i].checked = source.checked;
    }
}

function toggleStudentSelector() {
    const type = document.getElementById('reportTypeSelector').value;
    const selector = document.getElementById('studentSelectorGroup');
    // بعض التقارير عامة (مثل الجدول الدراسي) قد لا تحتاج اختيار طالب، لكن سنجعله متاحاً للتصفية
    if (type === 'schedule' || type === 'committee') {
        // يمكن إخفاؤه هنا لو أردت، لكن سنبقيه للمرونة
    }
}

// ==========================================
// 📊 3. محرك توليد التقارير (Engine)
// ==========================================
function generateReport() {
    const type = document.getElementById('reportTypeSelector').value;
    const checkboxes = document.querySelectorAll('input[name="selectedStudent"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    if (!type) { alert("الرجاء اختيار نوع التقرير"); return; }
    if (selectedIds.length === 0 && type !== 'schedule' && type !== 'committee') {
        alert("الرجاء اختيار طالب واحد على الأقل"); return;
    }

    // تجهيز الورقة
    const paper = document.getElementById('reportPaper');
    document.getElementById('reportActions').style.display = 'block';
    
    // الترويسة العامة
    const headerHtml = `
        <div class="report-header">
            <h2>${getReportTitle(type)}</h2>
            <div class="report-meta">
                <span><strong>المعلم:</strong> ${getCurrentUser().name || 'معلم صعوبات التعلم'}</span>
                <span><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-SA')}</span>
            </div>
        </div>
    `;

    // جسم التقرير (يختلف حسب النوع)
    let bodyHtml = '';
    
    switch(type) {
        case 'attendance': bodyHtml = generateAttendanceReport(selectedIds); break;
        case 'progress': bodyHtml = generateProgressReport(selectedIds); break;
        case 'assignments': bodyHtml = generateAssignmentsReport(selectedIds); break;
        case 'iep': bodyHtml = generateIEPReport(selectedIds); break;
        case 'diagnostic': bodyHtml = generateDiagnosticReport(selectedIds); break;
        case 'schedule': bodyHtml = generateScheduleReport(); break;
        case 'balance': bodyHtml = generateSessionBalanceReport(selectedIds); break; // 🔒 خاص
        case 'committee': bodyHtml = generateCommitteeReport(selectedIds); break;
        case 'certificate': bodyHtml = generateCertificates(selectedIds); break;
    }

    paper.innerHTML = headerHtml + bodyHtml;
}

function getReportTitle(type) {
    const titles = {
        'attendance': 'تقرير متابعة الغياب',
        'progress': 'تقرير نسب الإنجاز للمهارات',
        'assignments': 'تقرير متابعة الواجبات',
        'iep': 'الخطة التربوية الفردية',
        'diagnostic': 'تقرير الاختبارات التشخيصية',
        'schedule': 'الجدول الدراسي لغرفة المصادر',
        'balance': 'سجل رصيد الحصص (داخلي)',
        'committee': 'محاضر لجنة صعوبات التعلم',
        'certificate': 'شهادات شكر وتقدير'
    };
    return titles[type] || 'تقرير عام';
}

// ----------------------------------------------------
// 🏗️ دوال بناء الجداول (Logic Functions)
// ----------------------------------------------------

// 1. تقرير الغياب
function generateAttendanceReport(ids) {
    // محاكاة بيانات
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>عدد أيام الغياب</th><th>تواريخ الغياب</th><th>ملاحظات</th></tr></thead><tbody>`;
    
    ids.forEach(id => {
        const student = getStudentById(id);
        // هنا يتم جلب البيانات الحقيقية من LocalStorage لاحقاً
        const absDays = Math.floor(Math.random() * 5); // رقم عشوائي للتجربة
        const dates = absDays > 0 ? '2023-10-01, 2023-10-15' : 'لا يوجد';
        
        html += `<tr>
            <td>${student.name}</td>
            <td class="${absDays > 3 ? 'status-bad' : ''}">${absDays} أيام</td>
            <td>${dates}</td>
            <td>${absDays > 3 ? 'تنبيه: الغياب أثر على المستوى' : '-'}</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 2. تقرير نسب الإنجاز
function generateProgressReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>الدرس الحالي</th><th>نسبة الإنجاز</th><th>الحالة</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const student = getStudentById(id);
        const progress = Math.floor(Math.random() * 100);
        html += `<tr>
            <td>${student.name}</td>
            <td>المدود (مثال)</td>
            <td>
                <div style="background:#eee; width:100px; height:10px; margin:auto; border-radius:5px;">
                    <div style="background:${progress > 50 ? 'green' : 'orange'}; width:${progress}%; height:100%; border-radius:5px;"></div>
                </div>
                ${progress}%
            </td>
            <td>${progress > 80 ? 'متقدم' : 'يحتاج دعم'}</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 3. تقرير الواجبات
function generateAssignmentsReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>إجمالي المسندة</th><th>تم حلها</th><th>لم تحل</th><th>نسبة الالتزام</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const student = getStudentById(id);
        const total = 10;
        const solved = Math.floor(Math.random() * 11);
        const missed = total - solved;
        html += `<tr>
            <td>${student.name}</td>
            <td>${total}</td>
            <td class="status-good">${solved}</td>
            <td class="status-bad">${missed}</td>
            <td>${(solved/total)*100}%</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 7. 🔒 تقرير رصيد الحصص (خاص بالمعلم)
function generateSessionBalanceReport(ids) {
    // تحقق أمني إضافي (Double Check)
    if(getCurrentUser().role !== 'teacher' && getCurrentUser().role !== 'admin') {
        return `<div style="text-align:center; color:red; padding:20px; border:2px dashed red;">
            🚫 عذراً، ليس لديك صلاحية للاطلاع على هذا السجل التنظيمي.
        </div>`;
    }

    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>الحصص المقررة</th><th>الحصص المنفذة</th><th>الرصيد</th><th>التوجيه</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const student = getStudentById(id);
        const required = 12; // مثال: المفروض أخذ 12 حصة
        const actual = Math.floor(Math.random() * 15); // كم أخذ فعلياً
        const balance = actual - required;
        
        let status = '';
        if (balance < 0) status = `<span class="status-bad">يحتاج تعويض (${Math.abs(balance)})</span>`;
        else if (balance > 0) status = `<span class="status-good">رصيد إضافي (+${balance})</span>`;
        else status = 'منتظم';

        html += `<tr>
            <td>${student.name}</td>
            <td>${required}</td>
            <td>${actual}</td>
            <td style="direction:ltr">${balance}</td>
            <td>${status}</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 8. تقرير اللجنة
function generateCommitteeReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>تاريخ الاجتماع</th><th>الأعضاء الحاضرون</th><th>أهم التوصيات</th><th>التوقيع</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const student = getStudentById(id);
        html += `<tr>
            <td>${student.name}</td>
            <td>2023-10-20</td>
            <td>مدير المدرسة، المرشد، معلم الصعوبات</td>
            <td>تحويل الطالب لمسار التعليم العام مع المتابعة</td>
            <td>(تم التوقيع إلكترونياً)</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 9. 🏆 شهادات الإنجاز (تصميم مختلف)
function generateCertificates(ids) {
    let html = '';
    ids.forEach(id => {
        const student = getStudentById(id);
        html += `
        <div style="border: 5px double #1565c0; padding: 30px; margin-bottom: 20px; text-align: center; background:#fff;">
            <h1 style="color:#d4af37; font-family:'Tajawal', serif;">شهادة شكر وتقدير</h1>
            <p>يسر إدارة برنامج صعوبات التعلم أن تتقدم بالشكر للطالب البطل:</p>
            <h2 style="color:#1565c0; margin: 20px 0;">${student.name}</h2>
            <p>وذلك لتميزه وإتقانه لمهارة: <strong>(التاء المفتوحة والتاء المربوطة)</strong></p>
            <div style="margin-top: 40px; display:flex; justify-content:space-around;">
                <div><strong>معلم الصعوبات</strong><br>....................</div>
                <div><strong>مدير المدرسة</strong><br>....................</div>
            </div>
        </div>
        <hr style="border-top: 1px dashed #ccc; margin: 20px 0;">
        `;
    });
    return html;
}

// دوال فارغة (Placeholder) لبقية التقارير للحفاظ على هيكل الكود
function generateIEPReport(ids) { return `<div style="text-align:center; padding:20px;">سيتم عرض تفاصيل الخطة هنا (نسخة للطباعة)</div>`; }
function generateDiagnosticReport(ids) { return `<div style="text-align:center; padding:20px;">نتائج الاختبارات القبلية والبعدية</div>`; }
function generateScheduleReport() { return `<div style="text-align:center; padding:20px;">جدول الحصص الأسبوعي (يظهر جميع الطلاب)</div>`; }

// مساعدات
function getStudentById(id) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.find(s => s.id == id) || {name: 'طالب غير معروف'};
}

function downloadPDF() {
    const element = document.getElementById('reportPaper');
    const opt = {
        margin: 0,
        filename: 'تقرير_ميسر_التعلم.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

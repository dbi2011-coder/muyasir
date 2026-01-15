document.addEventListener('DOMContentLoaded', function() {
    initData(); // تهيئة البيانات
    checkPermissions(); // التحقق من الصلاحيات
    renderStudentsList(); // جدول الطلاب
    loadStudentListForReports(); // قائمة التقارير
});

// ==========================================
// 1. إدارة البيانات (Mock Data)
// ==========================================
function initData() {
    if (!sessionStorage.getItem('currentUser')) {
        sessionStorage.setItem('currentUser', JSON.stringify({ user: { name: "أ. محمد", role: "teacher" } }));
    }
    if (!localStorage.getItem('students')) {
        const mockStudents = [
            { id: 1, name: "نايف محمد", grade: "الرابع", diagnosis: "عسر قراءة" },
            { id: 2, name: "سعود فيصل", grade: "الخامس", diagnosis: "تشتت انتباه" },
            { id: 3, name: "عبدالله أحمد", grade: "الثالث", diagnosis: "عسر حساب" }
        ];
        localStorage.setItem('students', JSON.stringify(mockStudents));
    }
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// ==========================================
// 2. التنقل (Single Page Navigation)
// ==========================================
window.showSection = function(sectionId) {
    // إخفاء جميع الأقسام
    ['home', 'students', 'reports'].forEach(id => {
        document.getElementById('section-' + id).style.display = 'none';
        const btn = document.getElementById('btn-' + id);
        if(btn) btn.classList.remove('active');
    });

    // إظهار القسم المطلوب
    document.getElementById('section-' + sectionId).style.display = 'block';
    const activeBtn = document.getElementById('btn-' + sectionId);
    if(activeBtn) activeBtn.classList.add('active');
};

window.logout = function() {
    if(confirm('تسجيل الخروج؟')) {
        sessionStorage.clear();
        window.location.href = 'index.html'; // أو صفحة الدخول
    }
};

// ==========================================
// 3. قسم الطلاب
// ==========================================
function renderStudentsList() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const tbody = document.getElementById('studentsTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.grade}</td>
            <td>${s.diagnosis}</td>
            <td>
                <button class="btn-outline" style="padding:2px 5px;">✏️</button>
                <button class="btn-outline" style="padding:2px 5px; color:red;">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 4. قسم التقارير
// ==========================================
function checkPermissions() {
    const user = getCurrentUser();
    document.getElementById('currentUserName').textContent = user.name;
    // إخفاء رصيد الحصص لغير المعلم
    if (user.role !== 'teacher' && user.role !== 'admin') {
        const opt = document.getElementById('optSessionBalance');
        if(opt) opt.remove();
    }
}

function loadStudentListForReports() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const container = document.getElementById('reportStudentList');
    if(!container) return;
    
    container.innerHTML = students.map(s => `
        <div class="student-checkbox">
            <input type="checkbox" name="rep_st" value="${s.id}" id="rp_${s.id}">
            <label for="rp_${s.id}">${s.name}</label>
        </div>
    `).join('');
}

window.selectAllStudents = function(source) {
    document.querySelectorAll('input[name="rep_st"]').forEach(cb => cb.checked = source.checked);
};

window.generateReport = function() {
    const type = document.getElementById('reportTypeSelector').value;
    const checkboxes = document.querySelectorAll('input[name="rep_st"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    if (!type) return alert("الرجاء اختيار نوع التقرير");
    if (selectedIds.length === 0 && type !== 'schedule') return alert("الرجاء اختيار طالب واحد على الأقل");

    document.getElementById('reportActions').style.display = 'block';
    const paper = document.getElementById('reportPaper');
    
    // الترويسة
    const header = `
        <div style="text-align:center; border-bottom:2px double #000; padding-bottom:15px; margin-bottom:20px;">
            <h3>المملكة العربية السعودية - وزارة التعليم</h3>
            <h2>${getReportTitle(type)}</h2>
            <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.9rem;">
                <span>المعلم: ${getCurrentUser().name}</span>
                <span>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</span>
            </div>
        </div>
    `;

    // الجسم
    let body = '';
    if(type === 'attendance') body = generateAttendanceTable(selectedIds);
    else if(type === 'balance') body = generateBalanceTable(selectedIds);
    else if(type === 'certificate') body = generateCertificates(selectedIds);
    else body = `<div style="text-align:center; padding:30px;">بيانات التقرير (${type}) ستظهر هنا...</div>`;

    paper.innerHTML = header + body;
};

function getReportTitle(type) {
    const map = {
        'attendance': 'تقرير متابعة الغياب',
        'balance': 'سجل رصيد الحصص (داخلي)',
        'certificate': 'شهادات شكر وتقدير'
    };
    return map[type] || 'تقرير عام';
}

// مولدات الجداول
function generateAttendanceTable(ids) {
    let rows = ids.map(id => {
        const s = getStudent(id);
        const days = Math.floor(Math.random() * 5);
        return `<tr><td>${s.name}</td><td>${days}</td><td>${days>3 ? '<span class="status-bad">مرتفع</span>' : 'طبيعي'}</td></tr>`;
    }).join('');
    return `<table class="report-table"><thead><tr><th>الطالب</th><th>أيام الغياب</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function generateBalanceTable(ids) {
    let rows = ids.map(id => {
        const s = getStudent(id);
        const bal = Math.floor(Math.random() * 6) - 3; // رقم عشوائي بين -3 و 3
        return `<tr><td>${s.name}</td><td dir="ltr">${bal > 0 ? '+'+bal : bal}</td><td>${bal < 0 ? '<span class="status-bad">تعويض</span>' : 'منتظم'}</td></tr>`;
    }).join('');
    return `<table class="report-table"><thead><tr><th>الطالب</th><th>رصيد الحصص</th><th>التوجيه</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function generateCertificates(ids) {
    return ids.map(id => {
        const s = getStudent(id);
        return `
        <div style="border:5px double #007bff; padding:30px; margin-bottom:20px; text-align:center; height:900px; display:flex; flex-direction:column; justify-content:center;">
            <h1>شهادة شكر وتقدير</h1>
            <p>تمنح للطالب البطل:</p>
            <h2 style="color:#007bff; margin:20px 0;">${s.name}</h2>
            <p>لتميزه في البرنامج.</p>
            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div>المعلم: ............</div>
                <div>المدير: ............</div>
            </div>
        </div><div style="page-break-after:always"></div>`;
    }).join('');
}

function getStudent(id) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.find(s => s.id == id) || {name: 'غير معروف'};
}

window.downloadPDF = function() {
    const element = document.getElementById('reportPaper');
    const opt = { margin: 0, filename: 'report.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
};

document.addEventListener('DOMContentLoaded', function() {
    initMockData(); // تهيئة البيانات للتجربة
    checkUserPermissions(); // التحقق من الصلاحيات
    renderStudentsList(); // جدول قسم الطلاب
    loadReportStudentList(); // قائمة قسم التقارير
});

// ==========================================
// 1. إدارة البيانات الوهمية (Mock Data)
// ==========================================
function initMockData() {
    if (!sessionStorage.getItem('currentUser')) {
        // إنشاء مستخدم افتراضي
        sessionStorage.setItem('currentUser', JSON.stringify({ user: { name: "أ. محمد", role: "teacher" } }));
    }
    if (!localStorage.getItem('students')) {
        const mockStudents = [
            { id: 101, name: "نايف محمد", grade: "الرابع", diagnosis: "عسر قراءة" },
            { id: 102, name: "سعود فيصل", grade: "الخامس", diagnosis: "تشتت انتباه" },
            { id: 103, name: "عبدالله أحمد", grade: "الثالث", diagnosis: "عسر حساب" }
        ];
        localStorage.setItem('students', JSON.stringify(mockStudents));
    }
    // تحديث الإحصائيات في الرئيسية
    const stCount = JSON.parse(localStorage.getItem('students')).length;
    if(document.getElementById('totalStudentsCount')) 
        document.getElementById('totalStudentsCount').textContent = stCount + ' طالب';
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{}').user || { role: 'guest' };
}

// ==========================================
// 2. التنقل (SPA Navigation)
// ==========================================
window.showSection = function(sectionId) {
    // إخفاء جميع الأقسام
    ['home', 'students', 'reports'].forEach(id => {
        const section = document.getElementById('section-' + id);
        if(section) section.style.display = 'none';
        
        const btn = document.getElementById('btn-' + id);
        if(btn) btn.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const target = document.getElementById('section-' + sectionId);
    if(target) target.style.display = 'block';

    const activeBtn = document.getElementById('btn-' + sectionId);
    if(activeBtn) activeBtn.classList.add('active');
};

window.logout = function() {
    if(confirm('هل تريد تسجيل الخروج؟')) {
        sessionStorage.clear();
        window.location.href = '../../index.html'; // تعديل المسار حسب مشروعك
    }
};

// ==========================================
// 3. قسم الطلاب (Students Section)
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
                <button class="btn-outline" style="color:#007bff;" onclick="alert('تعديل ${s.name}')"><i class="fas fa-edit"></i></button>
                <button class="btn-outline" style="color:#dc3545;" onclick="alert('حذف ${s.name}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 4. قسم التقارير (Reports Logic)
// ==========================================
function checkUserPermissions() {
    const user = getCurrentUser();
    if(document.getElementById('currentUserName')) 
        document.getElementById('currentUserName').textContent = user.name || 'المعلم';
        
    // إخفاء تقرير "رصيد الحصص" لغير المعلم
    if (user.role !== 'teacher' && user.role !== 'admin') {
        const opt = document.getElementById('optSessionBalance');
        if(opt) opt.remove();
    }
}

function loadReportStudentList() {
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
    
    // الترويسة الرسمية
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

    // بناء محتوى التقرير
    let body = '';
    if(type === 'attendance') body = generateAttendanceTable(selectedIds);
    else if(type === 'progress') body = generateProgressTable(selectedIds);
    else if(type === 'assignments') body = generateAssignmentsTable(selectedIds);
    else if(type === 'balance') body = generateBalanceTable(selectedIds);
    else if(type === 'certificate') body = generateCertificates(selectedIds);
    else if(type === 'schedule') body = generateScheduleTable();
    else body = `<div style="text-align:center; padding:30px;">سيتم عرض تفاصيل التقرير (${type}) قريباً...</div>`;

    paper.innerHTML = header + body;
};

function getReportTitle(type) {
    const map = {
        'attendance': 'تقرير متابعة الغياب',
        'progress': 'تقرير نسب الإنجاز',
        'assignments': 'تقرير متابعة الواجبات',
        'balance': 'سجل رصيد الحصص (داخلي)',
        'certificate': 'شهادات شكر وتقدير',
        'schedule': 'الجدول الدراسي'
    };
    return map[type] || 'تقرير عام';
}

// --- مولدات الجداول ---
function getStudent(id) {
    return JSON.parse(localStorage.getItem('students')).find(s => s.id == id) || {name: 'غير معروف'};
}

function generateAttendanceTable(ids) {
    let rows = ids.map(id => {
        const s = getStudent(id);
        const days = Math.floor(Math.random() * 6);
        return `<tr><td>${s.name}</td><td>${days} أيام</td><td>${days>3 ? '<span class="status-bad">مرتفع</span>' : 'طبيعي'}</td></tr>`;
    }).join('');
    return `<table class="report-table"><thead><tr><th>الطالب</th><th>أيام الغياب</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function generateProgressTable(ids) {
    let rows = ids.map(id => {
        const s = getStudent(id);
        const p = Math.floor(Math.random() * 100);
        return `<tr><td>${s.name}</td><td>التمييز السمعي</td><td>${p}%</td></tr>`;
    }).join('');
    return `<table class="report-table"><thead><tr><th>الطالب</th><th>المهارة الحالية</th><th>نسبة الإنجاز</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function generateAssignmentsTable(ids) {
    let rows = ids.map(id => {
        const s = getStudent(id);
        return `<tr><td>${s.name}</td><td>10</td><td class="status-good">8</td><td class="status-bad">2</td></tr>`;
    }).join('');
    return `<table class="report-table"><thead><tr><th>الطالب</th><th>المسندة</th><th>المحلولة</th><th>غير المحلولة</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function generateBalanceTable(ids) {
    // تحقق أمني
    if (getCurrentUser().role !== 'teacher' && getCurrentUser().role !== 'admin') return '<p style="color:red">ليس لديك صلاحية</p>';
    
    let rows = ids.map(id => {
        const s = getStudent(id);
        const bal = Math.floor(Math.random() * 6) - 3; 
        return `<tr><td>${s.name}</td><td dir="ltr">${bal > 0 ? '+'+bal : bal}</td><td>${bal < 0 ? '<span class="status-bad">تعويض</span>' : 'منتظم'}</td></tr>`;
    }).join('');
    return `<table class="report-table"><thead><tr><th>الطالب</th><th>رصيد الحصص</th><th>التوجيه</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function generateScheduleTable() {
    return `<table class="report-table"><thead><tr><th>الحصة</th><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th></tr></thead><tbody><tr><td>1</td><td>نايف</td><td>-</td><td>سعود</td></tr></tbody></table>`;
}

function generateCertificates(ids) {
    return ids.map(id => {
        const s = getStudent(id);
        return `
        <div style="border:5px double #007bff; padding:30px; margin-bottom:20px; text-align:center; height:800px; display:flex; flex-direction:column; justify-content:center;">
            <h1>شهادة شكر وتقدير</h1>
            <p>تمنح للطالب المتميز:</p>
            <h2 style="color:#007bff; margin:20px 0;">${s.name}</h2>
            <p>لجهوده الرائعة في البرنامج.</p>
            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div>المعلم: ............</div>
                <div>المدير: ............</div>
            </div>
        </div><div style="page-break-after:always"></div>`;
    }).join('');
}

window.downloadPDF = function() {
    const element = document.getElementById('reportPaper');
    const opt = { margin: 0, filename: 'report.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
};

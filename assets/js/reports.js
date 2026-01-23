// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة التقارير (متوافق مع student-profile.js)
// ============================================

// 1. التعريفات العامة (لتعمل مع أزرار HTML)
window.toggleSelectAll = function() {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
};

window.initiateReport = function() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) return alert("الرجاء اختيار نوع التقرير.");
    if (selectedStudentIds.length === 0) return alert("الرجاء اختيار طالب واحد على الأقل.");

    const previewArea = document.getElementById('reportPreviewArea');
    
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds, previewArea);
    } else {
        previewArea.innerHTML = `<div class="alert alert-warning text-center">عفواً، هذا التقرير قيد التطوير.</div>`;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    updateTeacherName();
    loadStudentsForSelection();
});

// 2. دوال التحميل
function updateTeacherName() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
        if (sessionData) {
            const name = (sessionData.user && sessionData.user.name) || sessionData.name;
            if (name) document.getElementById('teacherName').textContent = name;
        }
    } catch (e) { console.error(e); }
}

function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // تحديد هوية المعلم
    let teacherId = null; 
    let isAdmin = false;

    if (sessionData) {
        if (sessionData.user) {
            teacherId = String(sessionData.user.id);
            isAdmin = sessionData.user.role === 'admin';
        } else {
            teacherId = String(sessionData.id);
            isAdmin = sessionData.role === 'admin';
        }
    }

    // تصفية الطلاب
    let students = allUsers.filter(u => {
        if (u.role !== 'student') return false;
        if (isAdmin) return true;
        return String(u.teacherId) === teacherId;
    });

    // شبكة أمان: إذا لم يجد طلاباً، يعرض الكل (للتجربة)
    if (students.length === 0 && !isAdmin) {
        students = allUsers.filter(u => u.role === 'student');
    }

    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<div class="text-danger p-3">لا يوجد طلاب.</div>';
        return;
    }

    students.forEach(student => {
        const div = document.createElement('div');
        div.style.cssText = "padding: 8px; border-bottom: 1px solid #eee;";
        div.innerHTML = `
            <label style="cursor: pointer; display: flex; align-items: center;">
                <input type="checkbox" name="selectedStudents" value="${student.id}" style="margin-left:10px;">
                <span style="font-weight: bold;">${student.name}</span>
            </label>
        `;
        container.appendChild(div);
    });
}

// 3. منطق تقرير الغياب (المصحح بناءً على ملفك)
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // ✅ تصحيح: استخدام المفتاح الصحيح 'studentEvents' كما هو في ملفك
    const allEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    
    let tableHTML = `
        <div style="background:white; padding:20px; border-radius:8px;">
            <div class="text-center mb-4">
                <h3 style="color:#4361ee;">تقرير متابعة الغياب</h3>
                <small style="color:#666">تاريخ: ${new Date().toLocaleDateString('ar-SA')}</small>
            </div>
            <table class="table table-bordered" style="width:100%; text-align:right; direction:rtl;" border="1">
                <thead style="background:#f8f9fa;">
                    <tr>
                        <th style="padding:10px;">الطالب</th>
                        <th style="padding:10px; width:100px; text-align:center;">عدد الأيام</th>
                        <th style="padding:10px;">تواريخ الغياب</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // البحث عن سجلات الطالب
        const studentRecords = allEvents.filter(e => e.studentId == studentId);

        // ✅ تصحيح: البحث عن نوع 'auto-absence' أو كلمة غائب
        const absences = studentRecords.filter(e => {
            // 1. هل النوع هو غياب تلقائي؟ (حسب student-profile.js)
            if (e.type === 'auto-absence') return true;
            
            // 2. هل الحالة هي غياب؟
            if (e.status === 'absence' || e.status === 'غائب') return true;

            // 3. بحث نصي احتياطي
            const str = (e.title + ' ' + e.note).toLowerCase();
            return str.includes('غائب') || str.includes('absence');
        });

        const count = absences.length;
        
        // تنسيق التواريخ
        const details = absences.map(a => {
            // استخراج التاريخ بدقة
            let dateStr = a.date || '';
            if(dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            
            return `<span style="background:#ffebee; color:#c0392b; padding:2px 6px; border-radius:4px; font-size:0.9em; margin:2px; display:inline-block; border:1px solid #ffcdd2;">
                ${dateStr}
            </span>`;
        }).join(' ');

        tableHTML += `
            <tr>
                <td style="padding:10px; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; text-align:center; font-weight:bold; font-size:1.2em; color:${count>0?'red':'green'}">
                    ${count}
                </td>
                <td style="padding:10px;">
                    ${count > 0 ? details : '<span style="color:green">منتظم (لا يوجد غياب)</span>'}
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>
        <div class="mt-4">
            <button onclick="window.print()" class="btn btn-primary no-print">طباعة التقرير</button>
        </div>
    </div>`;

    container.innerHTML = tableHTML;
}

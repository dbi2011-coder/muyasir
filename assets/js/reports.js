// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: احتساب أيام الغياب الفعلية من سجل التقدم بملف الطالب
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsForSelection();
    
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    if (sessionData && sessionData.user) {
        const teacherNameEl = document.getElementById('teacherName');
        if (teacherNameEl) teacherNameEl.textContent = sessionData.user.name;
    }
});

/**
 * 1. جلب الطلاب المرتبطين بالمعلم
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    const currentTeacherId = sessionData?.user?.id;

    // تصفية الطلاب التابعين للمعلم الحالي
    const students = allUsers.filter(u => u.role === 'student' && u.teacherId == currentTeacherId);

    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مضافين.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = "display:flex; align-items:center; padding:8px; border-bottom:1px solid #eee;";
        itemDiv.innerHTML = `
            <input type="checkbox" id="student_${student.id}" value="${student.id}" name="selectedStudents">
            <label for="student_${student.id}" style="margin-right:10px; cursor:pointer; flex:1;">
                ${student.name}
            </label>
        `;
        container.appendChild(itemDiv);
    });
}

function toggleSelectAll(select) {
    document.querySelectorAll('input[name="selectedStudents"]').forEach(cb => cb.checked = select);
}

/**
 * 2. بدء معالجة التقرير
 */
function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedIds = Array.from(document.querySelectorAll('input[name="selectedStudents"]:checked')).map(cb => cb.value);

    if (!reportType || selectedIds.length === 0) {
        alert("الرجاء اختيار نوع التقرير وتحديد الطلاب.");
        return;
    }

    if (reportType === 'attendance') {
        generateAttendanceReport(selectedIds);
    }
}

/**
 * 3. احتساب الغياب الفعلي من سجل التقدم (studentProgress)
 */
function generateAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب سجل التقدم (المكان الذي يظهر فيه "تقدم الطالب" في ملفه)
    const progressLogs = JSON.parse(localStorage.getItem('studentProgress') || '[]');

    let reportHTML = `
        <div id="printableArea" style="direction:rtl; font-family:'Tajawal',sans-serif; padding:20px; background:white;">
            <div style="text-align:center; border-bottom:3px solid #4361ee; padding-bottom:15px; margin-bottom:20px;">
                <h2 style="color:#4361ee; margin:0;">تقرير غياب الطلاب</h2>
                <small>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</small>
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f4f7fe; color:#4361ee;">
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:center; width:120px;">عدد أيام الغياب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">أيام الغياب بالتاريخ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // فلترة السجلات التي تخص هذا الطالب وتحمل حالة "غياب" أو "غائب"
            const studentAbsences = progressLogs.filter(log => {
                const isStudent = String(log.studentId) === String(id);
                // البحث في حقل الحالة (status) عن كلمة غياب
                const statusText = (log.status || "").toLowerCase();
                const isAbsent = statusText.includes('غياب') || statusText.includes('غائب') || statusText === 'absent';
                return isStudent && isAbsent;
            });

            // استخراج التواريخ الفريدة
            const absenceDates = [...new Set(studentAbsences.map(a => a.date))].filter(Boolean);

            reportHTML += `
                <tr>
                    <td style="padding:12px; border:1px solid #ddd; font-weight:bold;">${student.name}</td>
                    <td style="padding:12px; border:1px solid #ddd; text-align:center; font-size:1.2rem; font-weight:bold; color:#d9534f;">
                        ${absenceDates.length}
                    </td>
                    <td style="padding:12px; border:1px solid #ddd;">
                        ${absenceDates.length > 0 
                            ? absenceDates.map(d => `<span style="background:#fff5f5; color:#e03131; border:1px solid #ffa8a8; padding:2px 6px; border-radius:4px; margin:2px; display:inline-block; font-size:12px;">${d}</span>`).join('') 
                            : '<span style="color:#2f9e44; font-size:13px;">لا يوجد غياب مسجل</span>'}
                    </td>
                </tr>
            `;
        }
    });

    reportHTML += `</tbody></table>
        <div style="margin-top:25px; text-align:center;" class="no-print">
            <button onclick="window.print()" style="padding:10px 30px; background:#4361ee; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">طباعة التقرير</button>
        </div>
    </div>`;

    previewArea.innerHTML = reportHTML;
}

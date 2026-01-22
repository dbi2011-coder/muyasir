// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نسخة استخراج الغياب الحقيقي من "سجل التقدم" و "الأحداث الإدارية"
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
 * 1. تحميل الطلاب التابعين للمعلم الحالي
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    const currentTeacherId = sessionData && sessionData.user ? sessionData.user.id : null;

    // تصفية الطلاب المرتبطين بهذا المعلم
    const students = allUsers.filter(u => u.role === 'student' && u.teacherId == currentTeacherId);

    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مضافين في حسابك.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item';
        itemDiv.style.cssText = "display:flex; align-items:center; padding:10px; border-bottom:1px solid #eee;";
        
        itemDiv.innerHTML = `
            <input type="checkbox" id="student_${student.id}" value="${student.id}" name="selectedStudents">
            <label for="student_${student.id}" style="margin-right:10px; cursor:pointer; flex:1;">
                ${student.name} - ${student.grade || 'غير محدد'}
            </label>
        `;
        container.appendChild(itemDiv);
    });
}

function toggleSelectAll(select) {
    document.querySelectorAll('input[name="selectedStudents"]').forEach(cb => cb.checked = select);
}

function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedIds = Array.from(document.querySelectorAll('input[name="selectedStudents"]:checked')).map(cb => cb.value);

    if (!reportType || selectedIds.length === 0) {
        alert("الرجاء اختيار نوع التقرير والطلاب.");
        return;
    }

    if (reportType === 'attendance') {
        generateAttendanceFromProfile(selectedIds);
    }
}

/**
 * 2. الدالة الأساسية: استخراج الغياب من سجل "تقدم الطالب"
 */
function generateAttendanceFromProfile(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب البيانات من المفاتيح الحقيقية في نظامك
    const progressLogs = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');

    let reportHTML = `
        <div id="printableArea" style="direction:rtl; font-family:'Tajawal',sans-serif; padding:20px; background:white;">
            <div style="text-align:center; border-bottom:3px solid #4361ee; padding-bottom:15px; margin-bottom:20px;">
                <h2 style="color:#4361ee; margin:0;">تقرير غياب الطلاب (من سجل التقدم)</h2>
                <p style="margin:5px 0; color:#666;">تاريخ استخراج التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f4f7fe; color:#4361ee;">
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:center; width:100px;">أيام الغياب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">التواريخ المسجلة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // أ- استخراج الغياب من سجل التقدم
            // الكود يبحث عن كلمة "غائب" أو "غياب" في حقل الحالة (status) أو الحضور (attendance)
            const absences = progressLogs.filter(p => {
                const isMatch = String(p.studentId) === String(id);
                const isAbsent = (p.status && (p.status.includes('غياب') || p.status.includes('غائب') || p.status === 'absent')) || 
                                 (p.attendance && (p.attendance.includes('غياب') || p.attendance.includes('غائب')));
                return isMatch && isAbsent;
            });

            // ب- استثناء التواريخ التي بها "حدث إداري" (studentEvents)
            const finalAbsences = absences.filter(abs => {
                const date = abs.date || (abs.timestamp ? abs.timestamp.split('T')[0] : null);
                const hasAdminEvent = adminEvents.some(e => String(e.studentId) === String(id) && e.date === date);
                return !hasAdminEvent; // نحتفظ فقط بالغياب الذي ليس له حدث إداري
            });

            // ج- معالجة التواريخ للعرض بشكل فريد
            const uniqueDates = [...new Set(finalAbsences.map(a => a.date || a.timestamp?.split('T')[0]))].filter(Boolean);

            const datesTags = uniqueDates.length > 0 
                ? uniqueDates.map(d => `<span style="background:#fff5f5; color:#e03131; border:1px solid #ffa8a8; padding:3px 8px; border-radius:4px; margin:2px; display:inline-block; font-size:12px; font-weight:bold;">${d}</span>`).join('')
                : '<span style="color:#2f9e44; font-size:0.9rem;">لا يوجد غياب غير مبرر مسجل</span>';

            reportHTML += `
                <tr>
                    <td style="padding:12px; border:1px solid #ddd; font-weight:bold; color:#333;">${student.name}</td>
                    <td style="padding:12px; border:1px solid #ddd; text-align:center; font-size:1.2rem; background:#fffcf0; color:#d9534f; font-weight:bold;">${uniqueDates.length}</td>
                    <td style="padding:12px; border:1px solid #ddd;">${datesTags}</td>
                </tr>
            `;
        }
    });

    reportHTML += `</tbody></table>
        <div style="margin-top:25px; text-align:center;" class="no-print">
            <button onclick="window.print()" style="padding:12px 35px; background:#4361ee; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px;">
                <i class="fas fa-print"></i> طباعة التقرير
            </button>
        </div>
    </div>`;

    previewArea.innerHTML = reportHTML;
}

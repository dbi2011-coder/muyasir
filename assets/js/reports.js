// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: استخراج الغياب من "تقدم الطالب" بملف الطالب
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsForSelection();
    
    // عرض اسم المعلم في الرأس
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    if (sessionData && sessionData.user) {
        const teacherNameEl = document.getElementById('teacherName');
        if (teacherNameEl) teacherNameEl.textContent = sessionData.user.name;
    }
});

/**
 * 1. تحميل الطلاب التابعين للمعلم
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    const currentTeacherId = sessionData && sessionData.user ? sessionData.user.id : null;

    const students = allUsers.filter(u => u.role === 'student' && u.teacherId == currentTeacherId);

    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مضافين.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item';
        itemDiv.style.cssText = "display:flex; align-items:center; padding:10px; border-bottom:1px solid #eee;";
        
        itemDiv.innerHTML = `
            <input type="checkbox" id="student_${student.id}" value="${student.id}" name="selectedStudents">
            <label for="student_${student.id}" style="margin-right:10px; cursor:pointer; flex:1;">
                ${student.name} - ${student.grade || 'بدون صف'}
            </label>
        `;
        container.appendChild(itemDiv);
    });
}

function toggleSelectAll(select) {
    document.querySelectorAll('input[name="selectedStudents"]').forEach(cb => cb.checked = select);
}

/**
 * 2. معالجة عرض التقرير
 */
function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedIds = Array.from(document.querySelectorAll('input[name="selectedStudents"]:checked')).map(cb => cb.value);

    if (!reportType || selectedIds.length === 0) {
        alert("الرجاء اختيار نوع التقرير والطلاب.");
        return;
    }

    if (reportType === 'attendance') {
        generateAttendanceFromProfile(selectedIds);
    } else {
        document.getElementById('reportPreviewArea').innerHTML = `<div class="p-5 text-center">تقرير ${reportType} قيد الربط...</div>`;
    }
}

/**
 * 3. استخراج الغياب من "تقدم الطالب" واستثناء "الأحداث الإدارية"
 */
function generateAttendanceFromProfile(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب البيانات من المصادر التي يستخدمها ملف student-profile.js
    const progressLogs = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');

    let reportHTML = `
        <div id="printableArea" style="direction:rtl; font-family:'Tajawal',sans-serif; padding:20px; background:white;">
            <div style="text-align:center; border-bottom:3px solid #4361ee; padding-bottom:15px; margin-bottom:20px;">
                <h2 style="color:#4361ee; margin:0;">تقرير الغياب من سجل "تقدم الطالب"</h2>
                <small>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</small>
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f4f7fe; color:#4361ee;">
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:center;">عدد أيام الغياب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">التواريخ المسجلة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // أ- البحث عن الغياب في "تقدم الطالب" (studentProgress)
            const absences = progressLogs.filter(p => 
                String(p.studentId) === String(id) && 
                (p.status === 'absent' || p.attendance === 'غياب')
            );

            // ب- استثناء التواريخ التي بها "حدث إداري"
            const finalAbsences = absences.filter(abs => {
                const date = abs.date || abs.timestamp?.split('T')[0];
                const hasAdminEvent = adminEvents.some(e => String(e.studentId) === String(id) && e.date === date);
                return !hasAdminEvent;
            });

            const uniqueDates = [...new Set(finalAbsences.map(a => a.date || a.timestamp?.split('T')[0]))].filter(Boolean);

            const datesTags = uniqueDates.length > 0 
                ? uniqueDates.map(d => `<span style="background:#fff5f5; color:#e03131; border:1px solid #ffa8a8; padding:2px 6px; border-radius:4px; margin:2px; display:inline-block; font-size:12px;">${d}</span>`).join('')
                : '<span style="color:#2f9e44;">لا يوجد غياب (أو غياب مبرر بحدث إداري)</span>';

            reportHTML += `
                <tr>
                    <td style="padding:12px; border:1px solid #ddd; font-weight:bold;">${student.name}</td>
                    <td style="padding:12px; border:1px solid #ddd; text-align:center; font-size:1.1rem; background:#fffcf0;">${uniqueDates.length}</td>
                    <td style="padding:12px; border:1px solid #ddd;">${datesTags}</td>
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

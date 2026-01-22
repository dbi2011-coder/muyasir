// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نسخة الفحص العميق لسجل "تقدم الطالب" (Final Fix)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsForSelection();
    
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    if (sessionData && sessionData.user) {
        const teacherNameEl = document.getElementById('teacherName');
        if (teacherNameEl) teacherNameEl.textContent = sessionData.user.name;
    }
});

function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    const currentTeacherId = sessionData?.user?.id;

    const students = allUsers.filter(u => u.role === 'student' && u.teacherId == currentTeacherId);
    container.innerHTML = '';
    
    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مرتبطين بحسابك.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item';
        itemDiv.style.cssText = "display:flex; align-items:center; padding:10px; border-bottom:1px solid #eee;";
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

function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedIds = Array.from(document.querySelectorAll('input[name="selectedStudents"]:checked')).map(cb => cb.value);

    if (!reportType || selectedIds.length === 0) {
        alert("الرجاء اختيار نوع التقرير والطلاب.");
        return;
    }

    if (reportType === 'attendance') {
        generateFinalAttendanceReport(selectedIds);
    }
}

/**
 * دالة الفحص العميق لبيانات تقدم الطالب
 */
function generateFinalAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب البيانات من المصادر المذكورة في student-profile.js
    const progressLogs = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');

    let reportHTML = `
        <div id="printableArea" style="direction:rtl; font-family:'Tajawal',sans-serif; padding:20px; background:white;">
            <h2 style="text-align:center; color:#4361ee; border-bottom:2px solid #4361ee; padding-bottom:10px;">تقرير الغياب المستخرج من ملف الطالب</h2>
            <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                <thead>
                    <tr style="background:#f4f7fe; color:#4361ee;">
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:center;">عدد الغيابات</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">التواريخ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // الفحص العميق:
            const absences = progressLogs.filter(log => {
                const isStudent = String(log.studentId) === String(id);
                
                // البحث عن كلمة غياب في كل الحقول الممكنة (الحالة، التفاصيل، أو العنوان)
                const textToSearch = `${log.status || ''} ${log.attendance || ''} ${log.details || ''} ${log.lesson || ''}`.toLowerCase();
                const isAbsentText = textToSearch.includes('غياب') || textToSearch.includes('غائب') || textToSearch.includes('absent');
                
                // إضافة منطق: إذا كانت الحصة مجدولة ولكن "الإنجاز" فارغ تماماً (غياب آلي)
                const isAutoAbsent = (!log.achievement || log.achievement.trim() === '') && log.status === 'pending';

                return isStudent && (isAbsentText || isAutoAbsent);
            });

            // استثناء الأيام التي بها أحداث إدارية
            const finalAbsences = absences.filter(abs => {
                const d = abs.date || abs.timestamp?.split('T')[0];
                return !adminEvents.some(e => String(e.studentId) === String(id) && e.date === d);
            });

            const uniqueDates = [...new Set(finalAbsences.map(a => a.date || a.timestamp?.split('T')[0]))].filter(Boolean);

            reportHTML += `
                <tr>
                    <td style="padding:12px; border:1px solid #ddd; font-weight:bold;">${student.name}</td>
                    <td style="padding:12px; border:1px solid #ddd; text-align:center; background:#fffcf0; font-size:1.2rem; color:#d9534f;">${uniqueDates.length}</td>
                    <td style="padding:12px; border:1px solid #ddd;">
                        ${uniqueDates.length > 0 
                            ? uniqueDates.map(d => `<span style="background:#fff5f5; color:#e03131; border:1px solid #ffa8a8; padding:2px 6px; border-radius:4px; margin:2px; display:inline-block; font-size:12px;">${d}</span>`).join('') 
                            : '<span style="color:green;">لا يوجد غياب</span>'}
                    </td>
                </tr>
            `;
        }
    });

    reportHTML += `</tbody></table>
        <div style="margin-top:20px; text-align:center;"><button onclick="window.print()">طباعة</button></div>
    </div>`;

    previewArea.innerHTML = reportHTML;
}

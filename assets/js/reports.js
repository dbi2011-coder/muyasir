// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: النسخة النهائية لاحتساب الغياب الفعلي من سجل التقدم
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
 * 1. عرض الطلاب المرتبطين بالمعلم الحالي فقط
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    const teacherId = sessionData?.user?.id;

    const students = allUsers.filter(u => u.role === 'student' && u.teacherId == teacherId);

    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مسجلين لك حالياً.</div>';
        return;
    }

    students.forEach(student => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; align-items:center; padding:10px; border-bottom:1px solid #f0f0f0;";
        item.innerHTML = `
            <input type="checkbox" id="st_${student.id}" value="${student.id}" name="selectedStudents">
            <label for="st_${student.id}" style="margin-right:12px; cursor:pointer; flex:1; font-weight:500;">
                ${student.name}
            </label>
        `;
        container.appendChild(item);
    });
}

function toggleSelectAll(select) {
    document.querySelectorAll('input[name="selectedStudents"]').forEach(cb => cb.checked = select);
}

/**
 * 2. تشغيل التقرير عند الضغط على الزر
 */
function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType || selectedIds.length === 0) {
        alert("يرجى اختيار نوع التقرير وتحديد الطلاب أولاً.");
        return;
    }

    if (reportType === 'attendance') {
        generateFinalAttendanceReport(selectedIds);
    }
}

/**
 * 3. الدالة الاحترافية لاحتساب الغياب الفعلي
 */
function generateFinalAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // المصدر الرئيسي للبيانات (تقدم الطالب)
    const progressLogs = JSON.parse(localStorage.getItem('studentProgress') || '[]');

    let reportHTML = `
        <div id="printableReport" style="direction:rtl; font-family:'Tajawal', sans-serif; padding:20px; background:white;">
            <div style="text-align:center; border-bottom:3px solid #4361ee; padding-bottom:15px; margin-bottom:20px;">
                <h2 style="color:#4361ee; margin:0;">سجل غياب الطلاب التفصيلي</h2>
                <p style="color:#666;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f4f7fe; color:#4361ee;">
                        <th style="padding:15px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:15px; border:1px solid #ddd; text-align:center; width:130px;">أيام الغياب</th>
                        <th style="padding:15px; border:1px solid #ddd; text-align:right;">التواريخ المسجلة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // فحص سجل التقدم بمرونة عالية جداً
            const studentAbsences = progressLogs.filter(log => {
                const isStudent = String(log.studentId) === String(id);
                
                // البحث عن كلمة غياب في كل الحقول الممكنة (status, attendance, details)
                const s = (log.status || "").toString();
                const a = (log.attendance || "").toString();
                const d = (log.details || "").toString();
                
                const hasAbsentText = s.includes('غياب') || s.includes('غائب') || 
                                     a.includes('غياب') || a.includes('غائب') ||
                                     d.includes('غياب') || d.includes('غائب');
                
                return isStudent && hasAbsentText;
            });

            // استخراج التواريخ بدون تكرار
            const dates = [...new Set(studentAbsences.map(x => x.date))].filter(Boolean);

            reportHTML += `
                <tr>
                    <td style="padding:15px; border:1px solid #ddd; font-weight:bold; color:#333;">${student.name}</td>
                    <td style="padding:15px; border:1px solid #ddd; text-align:center; font-size:1.3rem; color:#e03131; font-weight:bold; background:#fffcf0;">
                        ${dates.length}
                    </td>
                    <td style="padding:15px; border:1px solid #ddd;">
                        ${dates.length > 0 
                            ? dates.map(d => `<span style="background:#fff5f5; color:#c92a2a; border:1px solid #ffa8a8; padding:3px 8px; border-radius:4px; margin:3px; display:inline-block; font-size:12px; font-weight:bold;">${d}</span>`).join('')
                            : '<span style="color:#2f9e44;">منتظم - لا يوجد غياب</span>'}
                    </td>
                </tr>
            `;
        }
    });

    reportHTML += `
                </tbody>
            </table>
            <div style="margin-top:30px; text-align:center;" class="no-print">
                <button onclick="window.print()" style="background:#4361ee; color:white; border:none; padding:12px 40px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <i class="fas fa-print"></i> طباعة التقرير
                </button>
            </div>
        </div>
    `;

    previewArea.innerHTML = reportHTML;
}

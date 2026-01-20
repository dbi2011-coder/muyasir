// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نسخة الغياب الآلي مع استثناء الأيام التي بها أحداث إدارية
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
 * 1. تحميل قائمة الطلاب التابعين للمعلم
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
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مضافين في جدولك.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item';
        itemDiv.style.cssText = "display:flex; align-items:center; padding:10px; border-bottom:1px solid #f5f5f5;";
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `student_${student.id}`;
        checkbox.value = student.id;
        checkbox.name = 'selectedStudents';

        const label = document.createElement('label');
        label.htmlFor = `student_${student.id}`;
        label.style.marginRight = "12px";
        label.textContent = `${student.name} - ${student.grade || 'غير محدد'}`;

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

function toggleSelectAll(select) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    checkboxes.forEach(cb => cb.checked = select);
}

function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedIds = Array.from(document.querySelectorAll('input[name="selectedStudents"]:checked')).map(cb => cb.value);

    if (!reportType || selectedIds.length === 0) {
        alert("الرجاء اختيار نوع التقرير والطلاب.");
        return;
    }

    if (reportType === 'attendance') {
        generateSmartAttendanceReport(selectedIds);
    } else {
        document.getElementById('reportPreviewArea').innerHTML = `<div class="p-5 text-center">جاري سحب بيانات ${reportNames[reportType]}...</div>`;
    }
}

/**
 * 2. دالة الغياب الذكي (استثناء الأحداث الإدارية)
 */
function generateSmartAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب كافة مصادر البيانات
    const progressLogs = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const activities = JSON.parse(localStorage.getItem('studentActivities') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]'); // مصفوفة الأحداث الإدارية

    let reportHTML = `
        <div id="printableArea" style="direction:rtl; font-family:'Tajawal',sans-serif; padding:20px; background:white;">
            <div style="text-align:center; border-bottom:3px solid #4361ee; padding-bottom:15px; margin-bottom:20px;">
                <h2 style="color:#4361ee; margin:0;">تقرير الغياب التفصيلي (الآلي والإداري)</h2>
                <small>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</small>
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f4f7fe; color:#4361ee;">
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:center; width:100px;">أيام الغياب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">تفاصيل التواريخ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // 1. جلب التواريخ التي سجل فيها غياب (آلي أو يدوي)
            const rawAbsences = [
                ...progressLogs.filter(p => String(p.studentId) === String(id) && (p.status === 'absent' || p.attendance === 'غياب')),
                ...activities.filter(a => String(a.studentId) === String(id) && (a.type === 'absence' || (a.details && a.details.includes('غياب'))))
            ];

            // 2. تصفية التواريخ: حذف التاريخ إذا وجد له "حدث إداري" في نفس اليوم
            const filteredAbsences = rawAbsences.filter(abs => {
                const absDate = abs.date || (abs.timestamp ? abs.timestamp.split('T')[0] : null);
                
                // البحث عن حدث إداري لهذا الطالب في نفس التاريخ
                const hasAdminEvent = adminEvents.some(event => 
                    String(event.studentId) === String(id) && 
                    event.date === absDate
                );

                return !hasAdminEvent; // يبقى في القائمة فقط إذا لم يكن له حدث إداري
            });

            // إزالة تكرار التواريخ
            const finalDates = [...new Set(filteredAbsences.map(a => a.date || a.timestamp?.split('T')[0]))].filter(Boolean);

            const datesDisplay = finalDates.length > 0 
                ? finalDates.map(d => `<span style="background:#fff5f5; color:#e03131; border:1px solid #ffa8a8; padding:2px 6px; border-radius:4px; margin:2px; display:inline-block; font-size:12px;">${d}</span>`).join('')
                : '<span style="color:#2f9e44;">لا يوجد غياب غير مبرر</span>';

            reportHTML += `
                <tr>
                    <td style="padding:12px; border:1px solid #ddd; font-weight:bold;">${student.name}</td>
                    <td style="padding:12px; border:1px solid #ddd; text-align:center; font-size:1.1rem; background:#fffcf0;">${finalDates.length}</td>
                    <td style="padding:12px; border:1px solid #ddd;">${datesDisplay}</td>
                </tr>
            `;
        }
    });

    reportHTML += `</tbody></table>
        <div style="margin-top:25px; text-align:center;" class="no-print">
            <button onclick="window.print()" style="padding:10px 30px; background:#4361ee; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">
                <i class="fas fa-print"></i> طباعة التقرير
            </button>
        </div>
    </div>`;

    previewArea.innerHTML = reportHTML;
}

// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة صفحة التقارير (تم الإصلاح ليتوافق مع HTML)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsForSelection();
    
    // عرض اسم المعلم من الجلسة الحالية
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (user && user.user && user.user.name) {
        const teacherNameElem = document.getElementById('teacherName');
        if (teacherNameElem) teacherNameElem.textContent = user.user.name;
    }
});

/**
 * تحميل قائمة الطلاب الفعليين
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUserData = JSON.parse(sessionStorage.getItem('currentUser'));
    const currentTeacherId = currentUserData && currentUserData.user ? currentUserData.user.id : null;

    // تصفية الطلاب التابعين للمعلم
    const students = allUsers.filter(u => u.role === 'student' && u.teacherId === currentTeacherId);

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مسجلين تابعين لك حالياً.</div>';
        return;
    }

    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'student-checkbox-item';
        div.innerHTML = `
            <label style="display: block; padding: 5px; cursor: pointer;">
                <input type="checkbox" name="selectedStudents" value="${student.id}">
                <span style="margin-right: 10px; font-weight: bold;">${student.name}</span>
                <span style="color: #666; font-size: 0.9em;">(${student.grade || 'غير محدد'})</span>
            </label>
        `;
        container.appendChild(div);
    });
}

/**
 * دالة تحديد الكل / إلغاء تحديد الكل
 * تم ربطها بـ window لتعمل مع onclick في HTML
 */
window.toggleSelectAll = function() {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
};

/**
 * الدالة الرئيسية لتوليد التقرير
 * تم ربطها بـ window لتعمل مع onclick="initiateReport()"
 */
window.initiateReport = function() {
    const reportTypeElem = document.getElementById('reportType');
    if (!reportTypeElem) return;

    const reportType = reportTypeElem.value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) {
        alert("الرجاء اختيار نوع التقرير أولاً.");
        return;
    }

    if (selectedStudentIds.length === 0) {
        alert("الرجاء اختيار طالب واحد على الأقل.");
        return;
    }

    const previewArea = document.getElementById('reportPreviewArea');
    if (!previewArea) return;

    // توجيه الطلب حسب نوع التقرير
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds, previewArea);
    } else {
        previewArea.innerHTML = `
            <div class="alert alert-warning" style="text-align:center; margin-top:20px;">
                عفواً، تقرير "${reportType}" قيد التطوير حالياً.
            </div>`;
    }
};

/**
 * منطق حساب وتوليد تقرير الغياب
 */
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // جلب سجلات الأحداث (تأكد أن الاسم student_events مطابق لما يحفظ في بروفايل الطالب)
    const allEvents = JSON.parse(localStorage.getItem('student_events') || '[]');

    let tableHTML = `
        <div style="text-align: right; width: 100%; padding: 20px; background: #fff; border-radius: 8px;">
            <div class="report-header" style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #4361ee; margin-bottom: 10px;">تقرير متابعة الغياب</h2>
                <p style="color: #666;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            
            <table class="table table-bordered" style="width:100%; text-align:right; border-collapse:collapse; margin-top:10px;" border="1">
                <thead style="background-color: #f8f9fa;">
                    <tr>
                        <th style="padding:12px; border:1px solid #dee2e6;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #dee2e6;">عدد أيام الغياب</th>
                        <th style="padding:12px; border:1px solid #dee2e6;">التواريخ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // البحث عن حالات الغياب
        // نبحث عن كلمة "غائب" أو نوع "absence"
        const absences = allEvents.filter(event => 
            event.studentId == studentId && 
            (
                (event.status && event.status.includes('غائب')) || 
                (event.title && event.title.includes('غائب')) ||
                event.type === 'absence'
            )
        );

        const count = absences.length;
        // تنسيق التواريخ
        const dates = absences.map(e => `<span style="display:inline-block; background:#ffebee; padding:2px 6px; border-radius:4px; margin:2px; font-size:0.85em;">${e.date}</span>`).join(' ');

        tableHTML += `
            <tr>
                <td style="padding:10px; border:1px solid #dee2e6; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-size:1.1em; color:${count > 0 ? '#e74c3c' : '#2ecc71'}">
                    ${count}
                </td>
                <td style="padding:10px; border:1px solid #dee2e6;">
                    ${count > 0 ? dates : 'لا يوجد غياب'}
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: left;">
                <button onclick="window.print()" class="btn btn-primary no-print" style="padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة التقرير</button>
            </div>
        </div>
    `;

    container.innerHTML = tableHTML;
}

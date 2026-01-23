// ===========================================
// كود توليد تقرير الغياب (يضاف داخل reports.js)
// ===========================================

document.getElementById('generateReportBtn').addEventListener('click', function() {
    const reportType = document.getElementById('reportType').value;
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
    
    // --- هنا يبدأ التعديل الخاص بتقرير الغياب ---
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds, previewArea);
    } else {
        // يمكنك إضافة بقية التقارير لاحقاً هنا
        previewArea.innerHTML = `<div class="alert alert-warning">عفواً، تقرير "${reportType}" قيد التطوير حالياً.</div>`;
    }
});

/**
 * دالة خاصة لحساب الغياب وتوليد الجدول
 */
function generateAttendanceReport(studentIds, container) {
    // 1. جلب البيانات من LocalStorage
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // نفترض أن سجل المتابعة اليومي مخزن باسم 'student_events'
    const allEvents = JSON.parse(localStorage.getItem('student_events') || '[]');

    let tableHTML = `
        <div style="text-align: right; width: 100%; padding: 20px;">
            <h3 style="color: #4361ee; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom:20px;">
                تقرير الغياب
            </h3>
            <table class="table table-bordered" style="width:100%; text-align:right; border-collapse:collapse; margin-top:10px;">
                <thead style="background-color: #f8f9fa;">
                    <tr>
                        <th style="padding:12px; border:1px solid #dee2e6;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #dee2e6;">الصف</th>
                        <th style="padding:12px; border:1px solid #dee2e6; width: 100px;">عدد الأيام</th>
                        <th style="padding:12px; border:1px solid #dee2e6;">تواريخ الغياب</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let hasData = false;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // 2. فلترة السجلات: نبحث عن سجلات الطالب التي حالتها "غائب"
        // ملاحظة: نتأكد من مطابقة الكلمة المستخدمة في سجل التقدم (غائب / غياب / Absent)
        const absences = allEvents.filter(event => 
            event.studentId == studentId && 
            (event.status === 'غائب' || event.title?.includes('غائب') || event.type === 'absence')
        );

        const absenceCount = absences.length;
        
        // استخراج التواريخ وتنسيقها
        const absenceDates = absences.map(e => e.date).sort().join(' ، ');

        tableHTML += `
            <tr>
                <td style="padding:10px; border:1px solid #dee2e6; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; border:1px solid #dee2e6;">${student.grade || '-'}</td>
                <td style="padding:10px; border:1px solid #dee2e6; text-align:center; color:${absenceCount > 0 ? 'red' : 'green'}">${absenceCount}</td>
                <td style="padding:10px; border:1px solid #dee2e6; font-size:0.9em;">${absenceCount > 0 ? absenceDates : 'لا يوجد غياب'}</td>
            </tr>
        `;
        hasData = true;
    });

    tableHTML += `
                </tbody>
            </table>
            <div style="margin-top: 30px; text-align: left;">
                <button onclick="window.print()" class="btn btn-primary no-print">طباعة التقرير</button>
            </div>
        </div>
    `;

    container.innerHTML = tableHTML;
}

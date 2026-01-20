// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة التقارير واستخراج بيانات الغياب من سجل المتابعة
// ============================================

/**
 * دالة البدء في إنشاء التقرير
 */
function initiateReport() {
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

    // إذا كان نوع التقرير هو الغياب
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds);
    } else {
        // يمكن إضافة أنواع التقارير الأخرى هنا لاحقاً
        document.getElementById('reportPreviewArea').innerHTML = `
            <div class="alert alert-info">جاري العمل على برمجة هذا النوع من التقارير...</div>
        `;
    }
}

/**
 * توليد تقرير الغياب بناءً على سجل المتابعة اليومية
 */
function generateAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب سجلات المتابعة (نفترض أنها مخزنة تحت هذا الاسم في النظام)
    const dailyLogs = JSON.parse(localStorage.getItem('dailyTrackingLogs') || '[]');

    let reportHTML = `
        <div style="width: 100%; direction: rtl; padding: 20px;">
            <h2 style="text-align: center; color: #4361ee; margin-bottom: 20px;">تقرير غياب الطلاب</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 12px; border: 1px solid #ddd;">اسم الطالب</th>
                        <th style="padding: 12px; border: 1px solid #ddd;">عدد أيام الغياب</th>
                        <th style="padding: 12px; border: 1px solid #ddd;">تواريخ الغياب</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // تصفية سجل المتابعة لهذا الطالب للحصول على حالات الغياب فقط
            const absences = dailyLogs.filter(log => 
                String(log.studentId) === String(id) && 
                (log.status === 'absent' || log.attendance === 'غياب')
            );

            const attendanceCount = absences.length;
            const datesList = absences.map(a => `<span class="badge" style="background:#ff4d4d; color:white; padding:2px 8px; border-radius:4px; margin:2px; display:inline-block;">${a.date}</span>`).join(' ');

            reportHTML += `
                <tr>
                    <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${student.name}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${attendanceCount} أيام</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${datesList || '<span style="color:#28a745;">لا يوجد غياب</span>'}</td>
                </tr>
            `;
        }
    });

    reportHTML += `
                </tbody>
            </table>
            <div style="margin-top: 20px; text-align: left;">
                <button class="btn btn-primary" onclick="window.print()" style="padding: 8px 20px;">
                    <i class="fas fa-print"></i> طباعة التقرير
                </button>
            </div>
        </div>
    `;

    previewArea.innerHTML = reportHTML;
}

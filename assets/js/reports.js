// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نظام التقارير (يعرض طلاب المعلم الحالي فقط)
// ============================================

// دالة توليد تقرير رصيد الحصص
function generateClassBalanceReport() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // 1. جلب الطلاب
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 🔥 العزل: جلب طلاب المعلم الحالي فقط
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId === currentUser.id);

    if (myStudents.length === 0) {
        alert("لا يوجد طلاب مسجلين لديك لعرض التقرير.");
        return;
    }

    // 2. حساب الرصيد (من جدول المعلم الحالي)
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    // فلترة الجدول الخاص بالمعلم
    const mySchedule = allSchedules.filter(s => s.teacherId === currentUser.id);

    // حساب عدد الحصص لكل طالب
    const studentSessionCounts = {};
    mySchedule.forEach(session => {
        if (session.students) {
            session.students.forEach(studentId => {
                studentSessionCounts[studentId] = (studentSessionCounts[studentId] || 0) + 1;
            });
        }
    });

    // 3. بناء التقرير
    let printDate = new Date().toLocaleDateString('ar-SA');
    let reportContent = `
        <div class="report-header text-center mb-4">
            <h2>تقرير رصيد الحصص - صعوبات التعلم</h2>
            <h4>المعلم: ${currentUser.name}</h4>
            <p>تاريخ التقرير: ${printDate}</p>
        </div>
        <table class="table table-bordered" style="width:100%; direction:rtl; text-align:right;">
            <thead>
                <tr style="background:#f8f9fa;">
                    <th>اسم الطالب</th>
                    <th>الصف</th>
                    <th>عدد الحصص المسجلة</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    myStudents.forEach(student => {
        const count = studentSessionCounts[student.id] || 0;
        let status = 'عادي';
        let color = '#000';
        
        // منطق بسيط للحالة (يمكن تطويره)
        if (count < 5) { status = 'يحتاج دعم'; color = '#d9534f'; }
        else if (count > 20) { status = 'متقدم'; color = '#5cb85c'; }

        reportContent += `
            <tr>
                <td>${student.name}</td>
                <td>${student.grade || '-'}</td>
                <td style="font-weight:bold;">${count}</td>
                <td style="color:${color};">${status}</td>
            </tr>
        `;
    });

    reportContent += `</tbody></table>`;

    // 4. عرض التقرير في المعاينة
    const previewArea = document.getElementById('reportPreviewArea');
    if (previewArea) {
        previewArea.innerHTML = reportContent;
        // إظهار زر الطباعة
        const btnContainer = document.getElementById('printActions');
        if(btnContainer) btnContainer.style.display = 'block';
    } else {
        // إذا لم تكن هناك منطقة معاينة، نطبع مباشرة (نافذة جديدة)
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl"><head><title>تقرير</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
            <style>body { font-family: 'Tajawal', sans-serif; padding: 20px; }</style>
            </head><body>${reportContent}</body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// تصدير الدوال
window.generateClassBalanceReport = generateClassBalanceReport;

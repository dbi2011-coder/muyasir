// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نظام التقارير (مع إصلاح تلقائي للطلاب القدامى)
// ============================================

// دالة توليد تقرير رصيد الحصص
function generateClassBalanceReport() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    let allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let dataModified = false;

    // 🛠️ خطوة الإصلاح الذكي (Auto-Fix):
    // البحث عن الطلاب "اليتامى" (بدون teacherId) ونسبهم للمعلم الحالي
    allUsers = allUsers.map(u => {
        if (u.role === 'student' && !u.teacherId) {
            u.teacherId = currentUser.id; // تبني الطالب
            dataModified = true;
        }
        return u;
    });

    // حفظ التعديلات إذا وجدنا طلاباً قدامى
    if (dataModified) {
        localStorage.setItem('users', JSON.stringify(allUsers));
        console.log("✅ تم تحديث الطلاب القدامى ليكونوا ضمن قائمتك.");
    }

    // 1. جلب طلاب المعلم الحالي
    // نستخدم == بدلاً من === لضمان توافق الأرقام والنصوص
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    if (myStudents.length === 0) {
        alert("لا يوجد طلاب مسجلين في قائمتك حالياً.");
        return;
    }

    // 2. حساب الرصيد من جدول المعلم
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const mySchedule = allSchedules.filter(s => s.teacherId == currentUser.id);

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
        <table class="table table-bordered" style="width:100%; direction:rtl; text-align:right; border-collapse:collapse; margin-top:20px;" border="1">
            <thead style="background-color:#f8f9fa;">
                <tr>
                    <th style="padding:10px;">اسم الطالب</th>
                    <th style="padding:10px;">الصف</th>
                    <th style="padding:10px;">عدد الحصص</th>
                    <th style="padding:10px;">الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    myStudents.forEach(student => {
        const count = studentSessionCounts[student.id] || 0;
        let status = 'عادي';
        let color = '#000';
        
        if (count < 5) { status = 'يحتاج دعم'; color = '#d9534f'; }
        else if (count > 20) { status = 'متقدم'; color = '#5cb85c'; }

        reportContent += `
            <tr>
                <td style="padding:10px;">${student.name}</td>
                <td style="padding:10px;">${student.grade || '-'}</td>
                <td style="padding:10px; font-weight:bold;">${count}</td>
                <td style="padding:10px; color:${color};">${status}</td>
            </tr>
        `;
    });

    reportContent += `</tbody></table>`;

    // 4. عرض التقرير
    const previewArea = document.getElementById('reportPreviewArea');
    if (previewArea) {
        previewArea.innerHTML = reportContent;
        const btnContainer = document.getElementById('printActions');
        if(btnContainer) btnContainer.style.display = 'block';
    } else {
        // طباعة مباشرة إذا لم توجد منطقة معاينة
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl"><head><title>تقرير الطلاب</title>
            <style>body { font-family: 'Tajawal', sans-serif; padding: 20px; }</style>
            </head><body>${reportContent}</body></html>
        `);
        printWindow.document.close();
        // printWindow.print(); // يمكنك تفعيل هذا السطر للطباعة التلقائية
    }
}

// دالة مساعدة للحصول على المستخدم الحالي (في حال لم تكن موجودة في الذاكرة)
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

// تصدير الدوال
window.generateClassBalanceReport = generateClassBalanceReport;

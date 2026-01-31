// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نظام التقارير (إصلاح التعرف على المعلم وعرض الطلاب)
// ============================================

// 🔥 1. عند تحميل الصفحة: تعرف على المعلم وأصلح الطلاب
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();

    if (currentUser) {
        // أ) عرض اسم المعلم في الهيدر (أعلى الصفحة)
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = currentUser.name;
        }
        if (document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
        }

        // ب) تشغيل الإصلاح التلقائي للطلاب فوراً
        autoFixStudents(currentUser);
    }
});

// دالة الإصلاح التلقائي (تعمل في الخلفية)
function autoFixStudents(currentUser) {
    let allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let dataModified = false;

    // ربط أي طالب "يتيم" (بدون معلم) بالمعلم الحالي
    allUsers = allUsers.map(u => {
        if (u.role === 'student' && !u.teacherId) {
            u.teacherId = currentUser.id;
            dataModified = true;
        }
        return u;
    });

    if (dataModified) {
        localStorage.setItem('users', JSON.stringify(allUsers));
        console.log("✅ تم ربط الطلاب بالمعلم: " + currentUser.name);
    }
}

// 🔥 2. دالة توليد التقرير
function generateClassBalanceReport() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("يرجى تسجيل الدخول أولاً");
        return;
    }

    // جلب بيانات النظام
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب طلاب المعلم الحالي (مقارنة مرنة ==)
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    if (myStudents.length === 0) {
        alert("عذراً.. لا يوجد طلاب مسجلين باسمك (ID: " + currentUser.id + ")");
        return;
    }

    // حساب الحصص من الجدول
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

    // بناء التقرير
    let printDate = new Date().toLocaleDateString('ar-SA');
    let reportContent = `
        <div style="text-align:center; margin-bottom:30px;">
            <h2 style="margin-bottom:10px;">تقرير رصيد الحصص</h2>
            <h4 style="color:#555;">المعلم: ${currentUser.name}</h4>
            <p>تاريخ التقرير: ${printDate}</p>
            <p>عدد الطلاب: ${myStudents.length}</p>
        </div>
        
        <table border="1" style="width:100%; border-collapse:collapse; text-align:right; direction:rtl;">
            <thead style="background-color:#f8f9fa;">
                <tr>
                    <th style="padding:12px;">م</th>
                    <th style="padding:12px;">اسم الطالب</th>
                    <th style="padding:12px;">الصف</th>
                    <th style="padding:12px;">عدد الحصص</th>
                    <th style="padding:12px;">الملاحظات</th>
                </tr>
            </thead>
            <tbody>
    `;

    myStudents.forEach((student, index) => {
        const count = studentSessionCounts[student.id] || 0;
        let note = '-';
        let rowColor = '#fff';

        if (count < 5) { note = 'يحتاج تكثيف'; rowColor = '#fff5f5'; }
        
        reportContent += `
            <tr style="background-color:${rowColor}">
                <td style="padding:10px;">${index + 1}</td>
                <td style="padding:10px; font-weight:bold;">${student.name}</td>
                <td style="padding:10px;">${student.grade || 'غير محدد'}</td>
                <td style="padding:10px; font-weight:bold; color:#007bff;">${count}</td>
                <td style="padding:10px;">${note}</td>
            </tr>
        `;
    });

    reportContent += `</tbody></table>`;

    // عرض التقرير
    const previewArea = document.getElementById('reportPreviewArea');
    if (previewArea) {
        previewArea.innerHTML = reportContent;
        if(document.getElementById('printActions')) document.getElementById('printActions').style.display = 'block';
    } else {
        // طباعة مباشرة
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl"><head><title>تقرير الطلاب</title>
            <style>body{font-family:'Tajawal',sans-serif; padding:20px;}</style>
            </head><body>${reportContent}</body></html>
        `);
        printWindow.document.close();
    }
}

// دالة مساعدة
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

// تصدير الدوال
window.generateClassBalanceReport = generateClassBalanceReport;

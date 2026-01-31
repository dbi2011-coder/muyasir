// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: تقرير رصيد الحصص (تصميمك + عزل البيانات + إصلاح فوري)
// ============================================

// 1. حقن أنماط الطباعة (نفس تصميمك بالضبط)
(function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page { size: A4; margin: 10mm; }
            body * { visibility: hidden; }
            .main-sidebar, .header, .sidebar, .no-print, button, input, select, .alert, .dashboard-header { display: none !important; }
            #reportPreviewArea, #reportPreviewArea * { visibility: visible; }
            #reportPreviewArea {
                position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
                background: white; direction: rtl;
            }
            /* تنسيق الجداول (Times New Roman + حدود سوداء) */
            table {
                width: 100% !important; border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif; font-size: 12pt;
                margin-top: 15px; margin-bottom: 15px;
            }
            th, td {
                border: 1px solid #000 !important; padding: 8px !important;
                text-align: center !important;
            }
            th { background-color: #f0f0f0 !important; font-weight: bold; }
            .text-red { color: red !important; font-weight: bold; }
            .text-green { color: green !important; font-weight: bold; }
            .text-black { color: black !important; }
        }
    `;
    document.head.appendChild(style);
})();

// 2. الدالة الرئيسية لتوليد التقرير
function generateClassBalanceReport() {
    // أ) التأكد من المعلم الحالي
    let currentUser = null;
    try {
        if (typeof getCurrentUser === 'function') currentUser = getCurrentUser();
        else currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    } catch(e) { console.error(e); }

    if (!currentUser) return alert("يرجى تسجيل الدخول أولاً");

    // 🔥 خطوة الإصلاح الفوري: ربط الطلاب "اليتامى" بالمعلم الحالي قبل جلبهم
    let allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let modified = false;
    allUsers = allUsers.map(u => {
        // إذا كان طالباً وليس لديه معلم، نربطه بك فوراً
        if (u.role === 'student' && !u.teacherId) {
            u.teacherId = currentUser.id;
            modified = true;
        }
        return u;
    });
    // حفظ التعديلات إذا وجدت
    if (modified) localStorage.setItem('users', JSON.stringify(allUsers));


    // ب) جلب بيانات طلابك فقط (بعد الإصلاح)
    // 🔥 الفلترة: نجلب فقط الطلاب الذين يحملون teacherId الخاص بك
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    if (myStudents.length === 0) {
        alert("لم يتم العثور على طلاب مسجلين بحسابك.\n(تأكد من إضافة طلاب أو أن البيانات تم تحديثها)");
        return;
    }

    // ج) حساب الحصص من جدولك الخاص
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const mySchedule = allSchedules.filter(s => s.teacherId == currentUser.id);

    const studentCounts = {};
    mySchedule.forEach(sess => {
        if (sess.students) sess.students.forEach(sid => studentCounts[sid] = (studentCounts[sid] || 0) + 1);
    });

    // د) بناء التقرير (HTML)
    const printDate = new Date().toLocaleDateString('ar-SA');

    let html = `
        <div style="text-align:center; margin-bottom:20px; font-family:'Times New Roman', serif;">
            <h2 style="text-decoration:underline;">تقرير رصيد الحصص للطلاب</h2>
            <h3 style="margin:10px 0;">المعلم: ${currentUser.name}</h3>
        </div>

        <table style="width:100%; direction:rtl; border-collapse:collapse; text-align:center; font-family:'Times New Roman', serif;" border="1">
            <thead style="background-color:#eee;">
                <tr>
                    <th style="padding:10px; width:50px;">م</th>
                    <th style="padding:10px;">اسم الطالب</th>
                    <th style="padding:10px;">الصف</th>
                    <th style="padding:10px;">الرصيد (عدد الحصص)</th>
                    <th style="padding:10px;">الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    myStudents.forEach((student, index) => {
        const count = studentCounts[student.id] || 0;
        
        // منطق الألوان (نفس ملفك المرفق)
        let balanceText = count;
        let balanceClass = 'text-black';
        let status = 'منتظم';

        if (count < 5) { // يمكنك تعديل الرقم 5
            balanceClass = 'text-red'; 
            status = 'يحتاج دعم';
        } else if (count > 20) { 
            balanceClass = 'text-green'; 
            balanceText = '+' + count; 
            status = 'متقدم';
        }

        html += `
            <tr>
                <td>${index + 1}</td>
                <td style="font-weight:bold; text-align:right; padding-right:10px;">${student.name}</td>
                <td>${student.grade || '-'}</td>
                <td class="${balanceClass}" style="font-size:1.2em; direction:ltr;">${balanceText}</td>
                <td>${status}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;

    // ذيل التقرير
    html += `
        <div style="margin-top:20px; font-size:0.9em; color:#555; border:1px solid #ccc; padding:10px; border-radius:5px; direction:rtl; text-align:right; font-family:'Times New Roman';">
            <strong>دليل التقرير:</strong>
            <ul style="margin-top:5px; margin-bottom:0; padding-right:20px;">
                <li><span style="color:red; font-weight:bold;">اللون الأحمر:</span> الطالب لم يحصل على حصص كافية.</li>
                <li><span style="color:green; font-weight:bold;">اللون الأخضر (+):</span> الطالب متقدم في الخطة.</li>
                <li><span style="color:black; font-weight:bold;">اللون الأسود:</span> الطالب يسير بشكل طبيعي.</li>
            </ul>
        </div>

        <div class="custom-footer" style="margin-top:30px; text-align:left; font-size:0.9rem; color:#333; direction:rtl; font-family:'Times New Roman';">
            تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ <strong>${currentUser.name}</strong> بتاريخ ${printDate}
        </div>
        
        <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
            <button onclick="window.print()" class="btn btn-primary">🖨️ طباعة</button>
        </div>
    `;

    // عرض النتيجة
    const previewArea = document.getElementById('reportPreviewArea');
    if (previewArea) {
        previewArea.innerHTML = html;
        // إظهار الحاوية في حال كانت مخفية
        const container = document.getElementById('reportPreviewContainer');
        if (container) container.style.display = 'block';
    }
}

// تصدير الدالة
window.generateClassBalanceReport = generateClassBalanceReport;

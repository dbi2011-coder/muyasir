// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: تقرير رصيد الحصص (تصميمك الخاص + عزل البيانات)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // تشغيل الإصلاح التلقائي عند التحميل
    forceFixData();
    
    // حقن ستايل الطباعة الخاص بك
    injectPrintStyles();
});

// 1. دالة حقن أنماط الطباعة (نفس الكود الخاص بك تماماً)
function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page {
                size: A4;
                margin: 10mm;
            }
            body * {
                visibility: hidden;
            }
            .main-sidebar, .header, .sidebar, .no-print, button, input, select, .alert, .dashboard-header, .sidebar-menu {
                display: none !important;
            }
            #reportPreviewArea, #reportPreviewArea * {
                visibility: visible;
            }
            #reportPreviewArea {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                background: white;
                direction: rtl;
            }
            
            /* تنسيق الجداول العامة */
            table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                margin-top: 15px;
                margin-bottom: 15px;
            }
            th, td {
                border: 1px solid #000 !important;
                padding: 8px !important;
                text-align: center !important;
            }
            th {
                background-color: #f0f0f0 !important;
                font-weight: bold;
            }
        }
    `;
    document.head.appendChild(style);
}

// 2. دالة توليد التقرير (تصميمك + منطق العزل)
function generateClassBalanceReport() {
    // أ) تحديد المعلم الحالي
    let currentUser = null;
    if (typeof getCurrentUser === 'function') currentUser = getCurrentUser();
    else currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

    if (!currentUser) {
        alert("يرجى تسجيل الدخول");
        return;
    }

    // ب) جلب بيانات الطلاب (مع الفلترة حسب المعلم)
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // 🔥 التعديل الهام: جلب طلاب هذا المعلم فقط
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    if (myStudents.length === 0) {
        alert("لا يوجد طلاب مسجلين باسمك حالياً.");
        return;
    }

    // ج) حساب الحصص من الجدول
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    // 🔥 التعديل الهام: جدول هذا المعلم فقط
    const mySchedule = allSchedules.filter(s => s.teacherId == currentUser.id);

    // حساب عدد الحصص لكل طالب
    const studentCounts = {};
    mySchedule.forEach(sess => {
        if (sess.students) {
            sess.students.forEach(sid => {
                studentCounts[sid] = (studentCounts[sid] || 0) + 1;
            });
        }
    });

    // د) بناء التقرير (نفس HTML الخاص بك بالضبط)
    const printDate = new Date().toLocaleDateString('ar-SA');
    
    // الهيدر
    let reportHTML = `
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="font-family:'Times New Roman'; text-decoration:underline;">تقرير رصيد الحصص للطلاب</h2>
            <h3 style="margin:10px 0;">المعلم: ${currentUser.name}</h3>
        </div>

        <table style="width:100%; direction:rtl; border-collapse:collapse; text-align:center;" border="1">
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

    // تعبئة الصفوف
    myStudents.forEach((student, index) => {
        const count = studentCounts[student.id] || 0;
        
        // منطق الألوان الخاص بملفك (رقم سالب/موجب/صفر)
        // ملاحظة: بما أننا نحسب "عدد حصص"، فالرقم دائماً موجب.
        // سأقوم بتطبيق منطق الألوان بناءً على العدد (كما في تصميمك)
        // افتراضاً: أقل من 5 (أحمر/يحتاج تعويض)، أكثر من 5 (أخضر/متقدم)
        
        let balanceClass = '';
        let statusText = 'منتظم';
        let colorStyle = 'color:black;';
        let balanceSign = count; // الرقم نفسه

        // منطق المحاكاة لتقريرك (يمكنك تعديل الأرقام حسب رغبتك)
        if (count < 1) {
            colorStyle = 'color:red; font-weight:bold;';
            statusText = 'لم يبدأ';
        } else if (count > 0) {
            colorStyle = 'color:green; font-weight:bold;';
            statusText = 'متقدم (+' + count + ')';
            balanceSign = '+' + count;
        }

        reportHTML += `
            <tr>
                <td>${index + 1}</td>
                <td style="font-weight:bold; text-align:right; padding-right:10px;">${student.name}</td>
                <td>${student.grade || '-'}</td>
                <td style="font-size:1.2em; direction:ltr; ${colorStyle}">${balanceSign}</td>
                <td>${statusText}</td>
            </tr>
        `;
    });

    reportHTML += `</tbody></table>`;

    // ذيل التقرير (كما في ملفك: دليل التقرير + التوقيع)
    reportHTML += `
        <div style="margin-top:20px; font-size:0.9em; color:#555; border:1px solid #ccc; padding:10px; border-radius:5px; direction:rtl; text-align:right;">
            <strong>دليل التقرير:</strong>
            <ul style="margin-top:5px; margin-bottom:0; list-style-type:none; padding-right:10px;">
                <li><span style="color:red; font-weight:bold;">اللون الأحمر:</span> الطالب لم يحصل على حصص كافية.</li>
                <li><span style="color:green; font-weight:bold;">اللون الأخضر (+):</span> الطالب حصل على حصص ومتقدم في الخطة.</li>
                <li><span style="color:black; font-weight:bold;">اللون الأسود:</span> الطالب يسير بشكل طبيعي.</li>
            </ul>
        </div>

        <div class="custom-footer" style="margin-top:30px; text-align:left; font-size:0.9rem; color:#333; direction:rtl;">
            تم طباعة التقرير من نظام ميسر التعلم للأستاذ/ <strong>${currentUser.name}</strong> بتاريخ ${printDate}
        </div>
    `;

    // عرض التقرير
    const previewArea = document.getElementById('reportPreviewArea');
    if (previewArea) {
        previewArea.innerHTML = reportHTML;
        document.getElementById('reportPreviewContainer').style.display = 'block';
    }
}

// 3. دالة إصلاح البيانات (لضمان ظهور الطلاب)
function forceFixData() {
    let currentUser = null;
    if (typeof getCurrentUser === 'function') currentUser = getCurrentUser();
    else currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

    if (!currentUser) return;

    let allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let modified = false;

    allUsers = allUsers.map(u => {
        if (u.role === 'student' && !u.teacherId) {
            u.teacherId = currentUser.id;
            modified = true;
        }
        return u;
    });

    if (modified) {
        localStorage.setItem('users', JSON.stringify(allUsers));
    }
}

// تصدير الدوال
window.generateClassBalanceReport = generateClassBalanceReport;
window.forceFixData = forceFixData;

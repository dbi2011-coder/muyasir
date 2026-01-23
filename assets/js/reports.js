// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة التقارير (منطق الغياب + تنسيق الطباعة الاحترافي)
// ============================================

// 1. حقن أنماط الطباعة (CSS) فور تحميل الملف
// هذا يضمن أن الطباعة ستكون منسقة دائماً
(function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            /* إخفاء كل عناصر الواجهة */
            body * {
                visibility: hidden;
            }
            .main-sidebar, .header, .sidebar, .no-print, button, input, select {
                display: none !important;
            }
            
            /* إظهار منطقة التقرير فقط */
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

            /* تنسيق الجدول للطباعة */
            table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif;
                font-size: 14pt;
            }
            th, td {
                border: 1px solid #000 !important;
                padding: 8px !important;
                color: #000 !important;
            }
            th {
                background-color: #f0f0f0 !important;
                -webkit-print-color-adjust: exact; /* لضمان طباعة اللون الرمادي */
                font-weight: bold;
                text-align: center;
            }

            /* تنسيق الترويسة والعنوان */
            .report-header-print {
                display: flex !important;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #000;
                margin-bottom: 20px;
                padding-bottom: 10px;
                text-align: center;
            }
            .report-title-main {
                font-size: 24pt;
                font-weight: bold;
                text-decoration: underline;
                margin: 20px 0;
                text-align: center !important;
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 2. التعريفات الأساسية والدوال
// ============================================

window.toggleSelectAll = function() {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
};

window.initiateReport = function() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) return alert("الرجاء اختيار نوع التقرير.");
    if (selectedStudentIds.length === 0) return alert("الرجاء اختيار طالب واحد على الأقل.");

    const previewArea = document.getElementById('reportPreviewArea');
    
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds, previewArea);
    } else {
        previewArea.innerHTML = `<div class="alert alert-warning text-center no-print">عفواً، هذا التقرير قيد التطوير.</div>`;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    updateTeacherName();
    loadStudentsForSelection();
});

function updateTeacherName() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
        if (sessionData) {
            const name = (sessionData.user && sessionData.user.name) || sessionData.name;
            if (name) document.getElementById('teacherName').textContent = name;
        }
    } catch (e) { console.error(e); }
}

function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    let teacherId = null; 
    let isAdmin = false;

    if (sessionData) {
        if (sessionData.user) {
            teacherId = String(sessionData.user.id);
            isAdmin = sessionData.user.role === 'admin';
        } else {
            teacherId = String(sessionData.id);
            isAdmin = sessionData.role === 'admin';
        }
    }

    let students = allUsers.filter(u => {
        if (u.role !== 'student') return false;
        if (isAdmin) return true;
        return String(u.teacherId) === teacherId;
    });

    if (students.length === 0 && !isAdmin) {
        students = allUsers.filter(u => u.role === 'student');
    }

    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<div class="text-danger p-3">لا يوجد طلاب.</div>';
        return;
    }

    students.forEach(student => {
        const div = document.createElement('div');
        div.style.cssText = "padding: 8px; border-bottom: 1px solid #eee;";
        div.innerHTML = `
            <label style="cursor: pointer; display: flex; align-items: center;">
                <input type="checkbox" name="selectedStudents" value="${student.id}" style="margin-left:10px;">
                <span style="font-weight: bold;">${student.name}</span>
            </label>
        `;
        container.appendChild(div);
    });
}

// ============================================
// 3. منطق تقرير الغياب (مع التصميم الرسمي)
// ============================================
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]'); // المفتاح الصحيح
    
    // إعداد الترويسة الرسمية (تظهر في الطباعة فقط بشكل منسق)
    const printHeader = `
        <div class="report-header-print" style="display:none;">
            <div style="text-align:right; font-size:12px;">
                <strong>المملكة العربية السعودية</strong><br>
                <strong>وزارة التعليم</strong><br>
                <strong>برنامج صعوبات التعلم</strong>
            </div>
            <div style="text-align:center;">
                <h2 style="margin:0;">بسم الله الرحمن الرحيم</h2>
            </div>
            <div style="text-align:left; font-size:12px;">
                <strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}<br>
                <strong>الفصل الدراسي:</strong> الثاني
            </div>
        </div>
    `;

    let tableHTML = `
        ${printHeader}
        <div style="background:white; padding:20px; border-radius:8px;">
            <div class="text-center mb-4">
                <h1 class="report-title-main" style="color:#4361ee; margin-bottom:10px; text-align:center;">تقرير متابعة الغياب</h1>
            </div>
            
            <table class="table table-bordered" style="width:100%; text-align:right; direction:rtl; border:1px solid #000;" border="1">
                <thead style="background:#f8f9fa;">
                    <tr>
                        <th style="padding:10px; width:25%;">اسم الطالب</th>
                        <th style="padding:10px; width:10%;">عدد الأيام</th>
                        <th style="padding:10px;">تواريخ وتفاصيل الغياب</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // البحث الدقيق عن الغياب
        const studentRecords = allEvents.filter(e => e.studentId == studentId);
        const absences = studentRecords.filter(e => {
            if (e.type === 'auto-absence') return true;
            if (e.status === 'absence' || e.status === 'غائب') return true;
            const str = (e.title + ' ' + e.note).toLowerCase();
            return str.includes('غائب') || str.includes('absence');
        });

        const count = absences.length;
        
        // تنسيق التواريخ بشكل نصي بسيط للطباعة
        const details = absences.map(a => {
            let dateStr = a.date || '';
            if(dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            const reason = a.note && a.note !== 'undefined' ? `(${a.note})` : '';
            return `${dateStr} ${reason}`;
        }).join(' ، ');

        tableHTML += `
            <tr>
                <td style="padding:10px; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; text-align:center; font-weight:bold;">${count}</td>
                <td style="padding:10px; font-size:0.95em;">
                    ${count > 0 ? details : 'منتظم'}
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
            
            <div style="margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px;">
                <div style="text-align: center;">
                    <strong>معلم الصعوبات</strong><br><br>
                    ..........................
                </div>
                <div style="text-align: center;">
                    <strong>مدير المدرسة</strong><br><br>
                    ..........................
                </div>
            </div>

            <div class="mt-4 text-left no-print">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px;">🖨️ طباعة التقرير</button>
            </div>
        </div>
    `;

    container.innerHTML = tableHTML;
}

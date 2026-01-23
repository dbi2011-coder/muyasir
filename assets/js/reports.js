// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة التقارير (الغياب + نسب الإنجاز) - طباعة احترافية
// ============================================

// 1. حقن أنماط الطباعة (CSS)
(function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page {
                size: A4;
                margin: 20mm;
            }
            body * {
                visibility: hidden;
            }
            .main-sidebar, .header, .sidebar, .no-print, button, input, select, .alert {
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
            table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #000 !important;
                padding: 10px !important;
                color: #000 !important;
                text-align: center;
                vertical-align: middle;
            }
            th {
                background-color: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
                font-weight: bold;
                font-size: 14pt;
            }
            .report-title-main {
                font-size: 24pt;
                font-weight: bold;
                text-align: center !important;
                margin-bottom: 30px;
                text-decoration: underline;
                display: block;
                width: 100%;
            }
            .custom-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                text-align: center;
                font-size: 10pt;
                color: #555;
                border-top: 1px solid #ccc;
                padding-top: 10px;
            }
            /* شريط التقدم للطباعة */
            .progress-container {
                border: 1px solid #000 !important;
                background: #eee !important;
                -webkit-print-color-adjust: exact;
            }
            .progress-bar-fill {
                background: #555 !important;
                -webkit-print-color-adjust: exact;
            }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 2. التعريفات الأساسية
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
    
    // توجيه الطلب حسب النوع
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds, previewArea);
    } else if (reportType === 'achievement') {
        generateAchievementReport(selectedStudentIds, previewArea);
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
// 3. تقرير متابعة الغياب (كما اعتمدناه سابقاً)
// ============================================
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div style="background:white; padding:20px;">
            <div class="text-center mb-4">
                <h1 class="report-title-main" style="text-align:center; color:#000;">تقرير متابعة الغياب</h1>
            </div>
            <table class="table table-bordered" style="width:100%; direction:rtl;" border="1">
                <thead>
                    <tr style="background-color:#f2f2f2;">
                        <th style="width:30%;">اسم الطالب</th>
                        <th style="width:15%;">عدد الأيام</th>
                        <th style="width:55%;">تواريخ الغياب</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        const studentRecords = allEvents.filter(e => e.studentId == studentId);
        const absences = studentRecords.filter(e => {
            if (e.type === 'auto-absence') return true;
            if (e.status === 'absence' || e.status === 'غائب') return true;
            const str = (e.title + ' ' + e.note).toLowerCase();
            return str.includes('غائب') || str.includes('absence');
        });

        const count = absences.length;
        const datesOnly = absences.map(a => {
            let d = a.date || '';
            if(d.includes('T')) d = d.split('T')[0]; 
            return `<span style="display:inline-block; margin:0 5px;">${d}</span>`;
        }).join(' ، ');

        tableHTML += `
            <tr>
                <td style="font-weight:bold;">${student.name}</td>
                <td style="font-weight:bold; font-size:1.2em;">${count}</td>
                <td style="font-size:0.9em; text-align:right; padding-right:15px !important;">
                    ${count > 0 ? datesOnly : 'منتظم'}
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>
            <div class="custom-footer">
                تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}
            </div>
            <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;">طباعة التقرير 🖨️</button>
            </div>
        </div>`;
    container.innerHTML = tableHTML;
}

// ============================================
// 4. تقرير نسب الإنجاز (الجديد)
// ============================================
function generateAchievementReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div style="background:white; padding:20px;">
            <div class="text-center mb-4">
                <h1 class="report-title-main" style="text-align:center; color:#000;">تقرير نسب الإنجاز</h1>
            </div>
            <table class="table table-bordered" style="width:100%; direction:rtl;" border="1">
                <thead>
                    <tr style="background-color:#f2f2f2;">
                        <th style="width:25%;">اسم الطالب</th>
                        <th style="width:15%;">عدد الأهداف</th>
                        <th style="width:15%;">المنجز</th>
                        <th style="width:45%;">نسبة الإنجاز</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // حساب الإنجاز
        const myLessons = allLessons.filter(l => l.studentId == studentId);
        const total = myLessons.length;
        const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated').length;
        
        // المعادلة: (المنجز / الكلي) * 100
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        // تحديد لون الشريط (أخضر للمكتمل، أزرق للمتقدم، برتقالي للبداية)
        let barColor = '#ffc107'; // برتقالي
        if (percentage >= 50) barColor = '#17a2b8'; // أزرق سماوي
        if (percentage >= 80) barColor = '#28a745'; // أخضر

        tableHTML += `
            <tr>
                <td style="font-weight:bold;">${student.name}</td>
                <td style="text-align:center;">${total}</td>
                <td style="text-align:center;">${completed}</td>
                <td style="padding:5px 15px;">
                    <div style="display:flex; align-items:center;">
                        <span style="font-weight:bold; width:45px; margin-left:10px;">${percentage}%</span>
                        <div class="progress-container" style="flex-grow:1; background:#eee; height:15px; border-radius:10px; border:1px solid #ccc; overflow:hidden;">
                            <div class="progress-bar-fill" style="width:${percentage}%; background:${barColor}; height:100%;"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>
            <div class="custom-footer">
                تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}
            </div>
            <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;">طباعة التقرير 🖨️</button>
            </div>
        </div>`;
    container.innerHTML = tableHTML;
}

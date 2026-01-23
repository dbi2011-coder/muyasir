// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: الكود الكامل لإدارة التقارير (شامل الإصلاحات)
// ============================================

// 1. تعريف الدوال العامة فوراً (لحل مشكلة ReferenceError)
window.toggleSelectAll = function() {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
};

window.initiateReport = function() {
    console.log("تم ضغط زر توليد التقرير...");
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

// 2. عند تحميل الصفحة، نجهز البيانات
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 صفحة التقارير جاهزة");
    updateTeacherName();
    loadStudentsForSelection();
});

// ==========================================
// 3. دوال التحميل والمساعدة
// ==========================================

function updateTeacherName() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!sessionData) return;
        
        // محاولة العثور على الاسم
        const teacherName = (sessionData.user && sessionData.user.name) || sessionData.name;
        if (teacherName) {
            const el = document.getElementById('teacherName');
            if (el) el.textContent = teacherName;
        }
    } catch (e) {
        console.error(e);
    }
}

function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    let teacherId = null;
    let isAdmin = false;

    // استخراج الهوية بأمان
    if (sessionData) {
        if (sessionData.user) {
            teacherId = String(sessionData.user.id);
            isAdmin = sessionData.user.role === 'admin';
        } else {
            teacherId = String(sessionData.id);
            isAdmin = sessionData.role === 'admin';
        }
    }

    // تصفية الطلاب
    let students = allUsers.filter(u => {
        if (u.role !== 'student') return false;
        if (isAdmin) return true; // المدير يرى الجميع
        return String(u.teacherId) === teacherId; // المعلم يرى طلابه
    });

    // شبكة أمان: إذا لم يجد طلاباً مرتبطين، يعرض كل الطلاب (مؤقتاً)
    if (students.length === 0 && !isAdmin) {
        students = allUsers.filter(u => u.role === 'student');
    }

    container.innerHTML = '';
    
    if (students.length === 0) {
        container.innerHTML = '<div class="text-danger p-3">لا يوجد طلاب في النظام.</div>';
        return;
    }

    students.forEach(student => {
        const div = document.createElement('div');
        div.style.cssText = "padding: 8px; border-bottom: 1px solid #eee;";
        div.innerHTML = `
            <label style="cursor: pointer; display: block;">
                <input type="checkbox" name="selectedStudents" value="${student.id}">
                <span style="font-weight: bold; margin-right: 8px;">${student.name}</span>
                <span style="color: #666; font-size: 0.9em;">(${student.grade || '-'})</span>
            </label>
        `;
        container.appendChild(div);
    });
}

// ==========================================
// 4. منطق تقرير الغياب (البحث الشامل Deep Search)
// ==========================================
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب البيانات من كافة المصادر المحتملة
    const allEvents = JSON.parse(localStorage.getItem('student_events') || '[]');
    const allNotes = JSON.parse(localStorage.getItem('student_notes') || '[]');
    
    let tableHTML = `
        <div style="background:white; padding:20px; border-radius:8px;">
            <div class="text-center mb-4">
                <h3 style="color:#4361ee; margin-bottom:5px;">تقرير متابعة الغياب</h3>
                <small style="color:#666">تاريخ: ${new Date().toLocaleDateString('ar-SA')}</small>
            </div>
            <table class="table table-bordered" style="width:100%; text-align:right; direction:rtl;" border="1">
                <thead style="background:#f8f9fa;">
                    <tr>
                        <th style="padding:10px;">الطالب</th>
                        <th style="padding:10px; text-align:center;">عدد الأيام</th>
                        <th style="padding:10px;">التواريخ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // دمج كل سجلات الطالب
        const records = [
            ...allEvents.filter(e => e.studentId == studentId),
            ...allNotes.filter(n => n.studentId == studentId)
        ];

        // البحث العميق عن كلمة "غائب"
        const absences = records.filter(r => {
            // تحويل السجل لنص كامل للبحث بداخله
            const str = JSON.stringify(r).toLowerCase();
            return str.includes('غائب') || str.includes('غياب') || str.includes('absent');
        });

        const count = absences.length;
        const details = absences.map(a => 
            `<span style="background:#ffebee; color:#c0392b; padding:2px 5px; margin:2px; border-radius:4px; font-size:0.9em; display:inline-block; border:1px solid #ffcdd2;">
                ${a.date || a.created_at || 'بدون تاريخ'}
            </span>`
        ).join(' ');

        tableHTML += `
            <tr>
                <td style="padding:10px; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; text-align:center; font-weight:bold; color:${count>0?'red':'green'}">${count}</td>
                <td style="padding:10px;">${count > 0 ? details : 'منتظم'}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>
        <div class="mt-3">
            <button onclick="window.print()" class="btn btn-primary no-print">طباعة</button>
        </div>
    </div>`;

    container.innerHTML = tableHTML;
}

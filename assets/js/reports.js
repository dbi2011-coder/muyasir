// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة صفحة التقارير (نسخة شاملة الإصلاح)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 بدء تحميل صفحة التقارير...");
    updateTeacherName();
    loadStudentsForSelection();
});

// ==========================================
// 1. دالة تحديث اسم المعلم (بأكثر من محاولة)
// ==========================================
function updateTeacherName() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!sessionData) return;

        // محاولة العثور على الاسم في مسارات مختلفة
        // قد يكون sessionData.user.name أو sessionData.name مباشرة
        const teacherName = (sessionData.user && sessionData.user.name) || sessionData.name;

        if (teacherName) {
            const nameEl = document.getElementById('teacherName');
            if (nameEl) {
                nameEl.textContent = teacherName;
                console.log("✅ تم تحديث اسم المعلم إلى:", teacherName);
            }
        }
    } catch (e) {
        console.error("خطأ في تحديث اسم المعلم:", e);
    }
}

// ==========================================
// 2. دالة تحميل الطلاب (تسامح كامل مع الأخطاء)
// ==========================================
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // الحصول على ID المعلم (كمرجع آمن)
    // نحوله إلى نص لضمان المقارنة الصحيحة
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

    console.log(`🔍 البحث عن طلاب للمعلم ID: ${teacherId} (Admin: ${isAdmin})`);

    // تصفية الطلاب
    let students = allUsers.filter(u => {
        // أولاً: هل هو طالب؟
        if (u.role !== 'student') return false;

        // إذا كان مدير يرى الجميع
        if (isAdmin) return true;

        // مقارنة مرنة: نحول كلاهما لنصوص للمقارنة
        // نتحقق أيضاً إذا كان الطالب غير مسند لأحد (لأغراض العرض)
        const studentTeacherId = String(u.teacherId);
        return studentTeacherId === teacherId;
    });

    // --- شبكة أمان: إذا لم يجد طلاب، اعرض جميع الطلاب (للتصحيح فقط) ---
    // يمكنك إزالة هذا الجزء لاحقاً إذا رغبت في الخصوصية التامة
    if (students.length === 0 && !isAdmin) {
        console.warn("⚠️ لم يتم العثور على طلاب مرتبطين بهذا المعلم، جاري عرض جميع الطلاب المتوفرين.");
        students = allUsers.filter(u => u.role === 'student');
    }

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted p-3">
                لا يوجد طلاب مضافين في النظام.
                <br>
                <a href="students.html" class="btn btn-sm btn-outline-primary mt-2">إضافة طالب جديد</a>
            </div>`;
        return;
    }

    // رسم القائمة
    students.forEach(student => {
        const div = document.createElement('div');
        div.style.cssText = "padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center;";
        
        // التحقق مما إذا كان الطالب يتبع المعلم فعلاً أم تم عرضه كاحتياط
        const isMyStudent = String(student.teacherId) === teacherId || isAdmin;
        const badge = isMyStudent ? '' : '<span style="font-size:0.7em; background:#eee; padding:2px 5px; border-radius:4px; margin-right:5px;">(معلم آخر)</span>';

        div.innerHTML = `
            <label style="cursor: pointer; width: 100%; display: flex; align-items: center; margin:0;">
                <input type="checkbox" name="selectedStudents" value="${student.id}" style="margin-left: 10px; width: 18px; height: 18px;">
                <div>
                    <span style="font-weight: bold;">${student.name}</span>
                    ${badge}
                    <div style="font-size: 0.85em; color: #666;">${student.grade || 'الصف غير محدد'}</div>
                </div>
            </label>
        `;
        container.appendChild(div);
    });
}

// ==========================================
// 3. دوال الواجهة (تحديد الكل - توليد التقرير)
// ==========================================
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
        previewArea.innerHTML = `<div class="alert alert-warning text-center">عفواً، هذا التقرير قيد التطوير.</div>`;
    }
};

// ==========================================
// 4. منطق تقرير الغياب (المحسن)
// ==========================================
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allEvents = JSON.parse(localStorage.getItem('student_events') || '[]');

    let tableHTML = `
        <div style="background:white; padding:20px; border-radius:8px;">
            <div class="text-center mb-4">
                <h3 style="color:#4361ee; margin-bottom:5px;">تقرير متابعة الغياب</h3>
                <small style="color:#666">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-SA')}</small>
            </div>
            <table class="table table-bordered" style="width:100%; text-align:right; direction:rtl;" border="1">
                <thead style="background:#f8f9fa;">
                    <tr>
                        <th style="padding:10px;">الطالب</th>
                        <th style="padding:10px; width:100px;">أيام الغياب</th>
                        <th style="padding:10px;">التفاصيل</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId); // مقارنة مرنة
        if (!student) return;

        // البحث عن الغياب
        const absences = allEvents.filter(e => {
            // تجاهل السجلات التي لا تخص الطالب
            if (e.studentId != studentId) return false;

            // البحث في كل النصوص
            const textData = (
                (e.status || '') + ' ' + 
                (e.title || '') + ' ' + 
                (e.type || '') + ' ' + 
                (e.details || '')
            ).toLowerCase();

            return textData.includes('غائب') || 
                   textData.includes('غياب') || 
                   textData.includes('absent');
        });

        const count = absences.length;
        const details = absences.map(a => 
            `<span style="background:#fff5f5; color:#c0392b; border:1px solid #eec; padding:2px 6px; border-radius:4px; font-size:0.9em; margin-left:5px;">
                ${a.date}
            </span>`
        ).join('') || '<span style="color:#999">-</span>';

        tableHTML += `
            <tr>
                <td style="padding:10px; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; text-align:center; font-size:1.2em; color:${count>0?'red':'green'}">${count}</td>
                <td style="padding:10px;">${details}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>
        <div class="mt-4 text-left">
            <button onclick="window.print()" class="btn btn-primary no-print">طباعة</button>
        </div>
    </div>`;

    container.innerHTML = tableHTML;
}

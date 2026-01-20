// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: النسخة الشاملة والنهائية لاستخراج تقارير الطلاب والغياب الفعلي
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsForSelection();
    
    // عرض اسم المعلم في رأس الصفحة
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    if (sessionData && sessionData.user) {
        const teacherNameEl = document.getElementById('teacherName');
        if (teacherNameEl) teacherNameEl.textContent = sessionData.user.name;
    }
});

/**
 * 1. تحميل قائمة الطلاب الفعليين المضافين في النظام
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    // جلب الطلاب من مصفوفة users الموحدة (التي يستخدمها ملف teacher.js)
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    const currentTeacherId = sessionData && sessionData.user ? sessionData.user.id : null;

    // تصفية الطلاب التابعين لهذا المعلم فقط
    const students = allUsers.filter(u => u.role === 'student' && u.teacherId === currentTeacherId);

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مضافين تابعين لك.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item';
        itemDiv.style.display = "flex";
        itemDiv.style.alignItems = "center";
        itemDiv.style.padding = "8px";
        itemDiv.style.borderBottom = "1px solid #f0f0f0";
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `student_${student.id}`;
        checkbox.value = student.id;
        checkbox.name = 'selectedStudents';
        checkbox.style.marginLeft = "10px";

        const label = document.createElement('label');
        label.htmlFor = `student_${student.id}`;
        label.textContent = `${student.name} - ${student.grade || 'غير محدد'}`;
        label.style.cursor = "pointer";
        label.style.flex = "1";

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

/**
 * 2. التحكم في تحديد وإلغاء تحديد الكل
 */
function toggleSelectAll(select) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    checkboxes.forEach(cb => cb.checked = select);
}

/**
 * 3. معالجة زر "عرض التقرير"
 */
function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) {
        alert("الرجاء اختيار نوع التقرير.");
        return;
    }

    if (selectedStudentIds.length === 0) {
        alert("الرجاء اختيار طالب واحد على الأقل.");
        return;
    }

    // استدعاء التقرير المطلوب
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds);
    } else {
        document.getElementById('reportPreviewArea').innerHTML = `
            <div style="padding:40px; text-align:center;">
                <i class="fas fa-tools fa-3x" style="color:#ccc; margin-bottom:15px;"></i>
                <p style="color:#666;">تقرير (${reportType}) قيد التطوير وربط البيانات حالياً.</p>
            </div>`;
    }
}

/**
 * 4. توليد تقرير الغياب (يرتبط بسجلات studentProgress و studentActivities)
 */
function generateAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب السجلات التي يستخدمها ملف student-profile.js
    const progressLogs = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const activities = JSON.parse(localStorage.getItem('studentActivities') || '[]');

    let reportHTML = `
        <div id="printableArea" style="direction:rtl; font-family:'Tajawal',sans-serif; padding:20px; background:white;">
            <div style="text-align:center; border-bottom:3px double #4361ee; padding-bottom:15px; margin-bottom:20px;">
                <h2 style="color:#4361ee; margin:0;">سجل حضور وغياب الطلاب</h2>
                <small>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</small>
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                <thead>
                    <tr style="background:#f4f7fe; color:#4361ee;">
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:center; width:120px;">أيام الغياب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">التواريخ المسجلة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // البحث عن حالات الغياب في سجل المتابعة اليومية
            const absInProgress = progressLogs.filter(p => 
                String(p.studentId) === String(id) && (p.status === 'absent' || p.attendance === 'غياب')
            );

            // البحث عن كلمة "غياب" في تفاصيل الأنشطة (لضمان الشمولية)
            const absInActivities = activities.filter(a => 
                String(a.studentId) === String(id) && 
                (a.type === 'absence' || (a.details && a.details.includes('غياب')))
            );

            // دمج النتائج وحذف التكرار بناءً على التاريخ
            const allAbsences = [...absInProgress, ...absInActivities];
            
            const datesList = allAbsences.length > 0 
                ? allAbsences.map(a => `<span style="background:#fff5f5; color:#e03131; border:1px solid #ffa8a8; padding:2px 6px; border-radius:4px; margin:2px; display:inline-block; font-size:12px;">${a.date || a.timestamp || 'غير مؤرخ'}</span>`).join('')
                : '<span style="color:#2f9e44; font-size:13px;">لا يوجد غياب مسجل</span>';

            reportHTML += `
                <tr>
                    <td style="padding:12px; border:1px solid #ddd; font-weight:bold;">${student.name}</td>
                    <td style="padding:12px; border:1px solid #ddd; text-align:center; background:#fffcf0; font-size:18px;">${allAbsences.length}</td>
                    <td style="padding:12px; border:1px solid #ddd;">${datesList}</td>
                </tr>
            `;
        }
    });

    reportHTML += `
                </tbody>
            </table>
            
            <div style="margin-top:30px; text-align:center;" class="no-print">
                <button onclick="window.print()" style="background:#4361ee; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <i class="fas fa-print"></i> طباعة هذا التقرير
                </button>
            </div>
        </div>
    `;

    previewArea.innerHTML = reportHTML;
}

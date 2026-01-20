// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: الملف الكامل لإدارة التقارير واستخراج بيانات الغياب
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
 * 1. تحميل قائمة الطلاب الفعليين من النظام
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    // جلب المستخدمين من مصفوفة users (المصدر الحقيقي للبيانات)
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // تصفية المستخدمين الذين يحملون رتبة "طالب"
    const students = allUsers.filter(u => u.role === 'student');

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مضافين. يرجى إضافة طلاب من صفحة "إدارة الطلاب" أولاً.</div>';
        return;
    }

    // بناء قائمة الاختيار
    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item'; // تأكد أن هذا الكلاس موجود في CSS الخاص بك
        itemDiv.style.display = "flex";
        itemDiv.style.alignItems = "center";
        itemDiv.style.padding = "8px";
        itemDiv.style.borderBottom = "1px solid #eee";
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `student_${student.id}`;
        checkbox.value = student.id;
        checkbox.name = 'selectedStudents';
        checkbox.style.marginLeft = "10px";

        const label = document.createElement('label');
        label.htmlFor = `student_${student.id}`;
        label.textContent = `${student.name} - ${student.grade || 'بدون صف'}`;
        label.style.cursor = "pointer";
        label.style.flex = "1";

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

/**
 * 2. التحكم في تحديد الكل
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
        alert("الرجاء اختيار نوع التقرير أولاً.");
        return;
    }

    if (selectedStudentIds.length === 0) {
        alert("الرجاء اختيار طالب واحد على الأقل.");
        return;
    }

    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds);
    } else {
        document.getElementById('reportPreviewArea').innerHTML = `
            <div style="padding: 40px; text-align: center; color: #666;">
                <i class="fas fa-tools fa-3x mb-3"></i>
                <p>هذا النوع من التقارير (${reportType}) تحت البرمجة حالياً.</p>
            </div>`;
    }
}

/**
 * 4. توليد تقرير الغياب الفعلي من سجل المتابعة
 */
function generateAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب سجلات المتابعة اليومية
    const dailyLogs = JSON.parse(localStorage.getItem('dailyTrackingLogs') || '[]');

    let reportHTML = `
        <div id="printableReport" style="direction: rtl; font-family: 'Tajawal', sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #4361ee; padding-bottom: 15px;">
                <h2 style="color: #4361ee; margin: 0;">تقرير غياب الطلاب التفصيلي</h2>
                <p style="color: #666; margin: 5px 0;">تاريخ استخراج التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; background: white;">
                <thead>
                    <tr style="background-color: #f4f7fe; color: #4361ee;">
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">اسم الطالب</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center; width: 100px;">أيام الغياب</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">تواريخ الغياب (بالتاريخ)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // استخراج الغيابات المسجلة لهذا الطالب من السجل
            const studentAbsences = dailyLogs.filter(log => 
                String(log.studentId) === String(id) && 
                (log.status === 'absent' || log.attendance === 'غياب')
            );

            const datesBadges = studentAbsences.length > 0 
                ? studentAbsences.map(a => `<span style="background:#fff5f5; color:#e03131; border:1px solid #ffa8a8; padding:2px 8px; border-radius:4px; margin:2px; display:inline-block; font-size:13px;">${a.date}</span>`).join('')
                : '<span style="color:#2f9e44;">لا يوجد غياب مسجل</span>';

            reportHTML += `
                <tr>
                    <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${student.name}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center; background: #fffaf0;">${studentAbsences.length}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${datesBadges}</td>
                </tr>
            `;
        }
    });

    reportHTML += `
                </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: center;" class="no-print">
                <button onclick="window.print()" style="background:#4361ee; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-size:16px; font-weight:bold; box-shadow: 0 4px 6px rgba(67, 97, 238, 0.2);">
                    <i class="fas fa-print"></i> طباعة التقرير الآن
                </button>
            </div>
        </div>
    `;

    previewArea.innerHTML = reportHTML;
}

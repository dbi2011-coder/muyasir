// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: النسخة الكاملة والنهائية لإدارة التقارير واستخراج الغياب
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
 * 1. تحميل قائمة الطلاب الفعليين
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    // جلب الطلاب من القائمة الموحدة users
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const students = allUsers.filter(u => u.role === 'student');

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مضافين في النظام حالياً.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item';
        itemDiv.style.display = "flex";
        itemDiv.style.alignItems = "center";
        itemDiv.style.padding = "10px";
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
 * 2. التحكم في الاختيارات
 */
function toggleSelectAll(select) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    checkboxes.forEach(cb => cb.checked = select);
}

/**
 * 3. معالجة زر عرض التقرير
 */
function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) { alert("الرجاء اختيار نوع التقرير."); return; }
    if (selectedStudentIds.length === 0) { alert("الرجاء اختيار طالب واحد على الأقل."); return; }

    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds);
    } else {
        document.getElementById('reportPreviewArea').innerHTML = `
            <div style="padding:40px; text-align:center;">
                <i class="fas fa-tools fa-3x" style="color:#ccc;"></i>
                <p style="margin-top:15px; color:#666;">تقرير (${reportType}) جاري العمل على ربط بياناته...</p>
            </div>`;
    }
}

/**
 * 4. توليد تقرير الغياب (البحث الذكي في السجلات)
 */
function generateAttendanceReport(studentIds) {
    const previewArea = document.getElementById('reportPreviewArea');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // البحث عن بيانات الغياب في كل المصادر الممكنة
    const logs = JSON.parse(localStorage.getItem('dailyTrackingLogs') || 
                            localStorage.getItem('attendance') || 
                            localStorage.getItem('studentActivities') || '[]');

    let reportHTML = `
        <div id="printableArea" style="direction:rtl; font-family:'Tajawal',sans-serif; padding:20px;">
            <div style="text-align:center; border-bottom:2px solid #4361ee; padding-bottom:15px; margin-bottom:20px;">
                <h2 style="color:#4361ee;">سجل غياب الطلاب</h2>
                <span>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</span>
            </div>
            <table style="width:100%; border-collapse:collapse; background:white;">
                <thead>
                    <tr style="background:#f8f9fa;">
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:center;">أيام الغياب</th>
                        <th style="padding:12px; border:1px solid #ddd; text-align:right;">التواريخ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => String(u.id) === String(id));
        if (student) {
            // البحث عن حالات الغياب المرتبطة بهذا الطالب
            const studentAbsences = logs.filter(entry => {
                const matchId = String(entry.studentId) === String(id);
                const isAbsent = entry.status === 'absent' || 
                                 entry.status === 'غياب' || 
                                 entry.attendance === 'غياب' ||
                                 entry.type === 'absence';
                return matchId && isAbsent;
            });

            const dates = studentAbsences.length > 0 
                ? studentAbsences.map(a => `<span style="background:#fff5f5; color:#c92a2a; padding:2px 6px; border-radius:4px; border:1px solid #ffc9c9; margin:2px; display:inline-block; font-size:12px;">${a.date || a.timestamp || 'غير مؤرخ'}</span>`).join('')
                : '<span style="color:#2b8a3e;">لا يوجد غياب مسجل</span>';

            reportHTML += `
                <tr>
                    <td style="padding:12px; border:1px solid #ddd; font-weight:bold;">${student.name}</td>
                    <td style="padding:12px; border:1px solid #ddd; text-align:center; background:#fffcf0;">${studentAbsences.length}</td>
                    <td style="padding:12px; border:1px solid #ddd;">${dates}</td>
                </tr>
            `;
        }
    });

    reportHTML += `
                </tbody>
            </table>
            <button onclick="window.print()" style="margin-top:20px; background:#4361ee; color:white; border:none; padding:10px 25px; border-radius:6px; cursor:pointer;">
                <i class="fas fa-print"></i> طباعة التقرير
            </button>
        </div>
    `;

    previewArea.innerHTML = reportHTML;
}

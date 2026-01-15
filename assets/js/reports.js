// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة صفحة التقارير واختيار الطلاب
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsForSelection();
    
    // عرض اسم المعلم
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (user && user.user.name) {
        document.getElementById('teacherName').textContent = user.user.name;
    }
});

/**
 * تحميل قائمة الطلاب من LocalStorage وإنشاء مربعات اختيار (Checkboxes)
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مسجلين حالياً.</div>';
        return;
    }

    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `student_${student.id}`;
        checkbox.value = student.id;
        checkbox.name = 'selectedStudents';

        const label = document.createElement('label');
        label.htmlFor = `student_${student.id}`;
        label.textContent = `${student.name} (${student.grade || 'غير محدد'})`;

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

/**
 * تحديد الكل أو إلغاء تحديد الكل
 * @param {boolean} select - true للتحديد، false للإلغاء
 */
function toggleSelectAll(select) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    checkboxes.forEach(cb => cb.checked = select);
}

/**
 * دالة البدء في إنشاء التقرير (الهيكل الأساسي)
 */
function initiateReport() {
    const reportType = document.getElementById('reportType').value;
    
    // الحصول على معرفات الطلاب المحددين
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    // التحقق من المدخلات
    if (!reportType) {
        alert("الرجاء اختيار نوع التقرير أولاً.");
        return;
    }

    if (selectedStudentIds.length === 0) {
        alert("الرجاء اختيار طالب واحد على الأقل.");
        return;
    }

    // عرض رسالة مؤقتة (هنا ستقوم لاحقاً ببرمجة منطق كل تقرير)
    const previewArea = document.getElementById('reportPreviewArea');
    const reportNames = {
        'attendance': 'تقرير الغياب',
        'achievement': 'تقرير نسب الإنجاز',
        'assignments': 'تقرير الواجبات',
        'iep': 'تقرير الخطط التربوية الفردية',
        'diagnostic': 'تقرير الاختبارات التشخيصية',
        'schedule': 'تقرير الجدول الدراسي',
        'balance': 'تقرير رصيد الحصص',
        'committee': 'تقرير لجنة صعوبات التعلم'
    };

    previewArea.innerHTML = `
        <div style="text-align: right; width: 100%;">
            <h3 style="color: var(--primary-color); border-bottom: 2px solid #eee; padding-bottom: 10px;">
                ${reportNames[reportType]}
            </h3>
            <div class="alert alert-info mt-3">
                <strong>تم اختيار ${selectedStudentIds.length} طالب/طلاب لهذا التقرير.</strong>
                <br>
                (سيتم عرض التفاصيل والبيانات هنا لاحقاً عند برمجة تفاصيل التقرير)
            </div>
            <div style="margin-top: 20px;">
                <h5>المعرفات المختارة (للمطور):</h5>
                <code>${JSON.stringify(selectedStudentIds)}</code>
            </div>
        </div>
    `;
}

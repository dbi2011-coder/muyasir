// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة صفحة التقارير واختيار الطلاب الفعليين
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsForSelection();
    
    // عرض اسم المعلم من الجلسة الحالية
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (user && user.user && user.user.name) {
        document.getElementById('teacherName').textContent = user.user.name;
    }
});

/**
 * تحميل قائمة الطلاب الفعليين من LocalStorage
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    
    // جلب كافة المستخدمين من القائمة الموحدة
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // جلب بيانات المعلم الحالي
    const currentUserData = JSON.parse(sessionStorage.getItem('currentUser'));
    const currentTeacherId = currentUserData && currentUserData.user ? currentUserData.user.id : null;

    // تصفية المستخدمين: جلب الطلاب المرتبطين بهذا المعلم فقط
    const students = allUsers.filter(u => u.role === 'student' && u.teacherId === currentTeacherId);

    container.innerHTML = '';

    // إذا لم يتم العثور على طلاب حقيقيين
    if (students.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-danger">لا يوجد طلاب مسجلين تابعين لك حالياً.</div>';
        return;
    }

    // عرض الطلاب الحقيقيين في القائمة
    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-item'; // تم تعديل الكلاس ليتوافق مع CSS في ملف HTML
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `student_${student.id}`;
        checkbox.value = student.id;
        checkbox.name = 'selectedStudents';

        const label = document.createElement('label');
        label.htmlFor = `student_${student.id}`;
        label.textContent = `${student.name} - ${student.grade || 'بدون صف'}`;

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

/**
 * تحديد الكل أو إلغاء تحديد الكل
 */
function toggleSelectAll(select) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    checkboxes.forEach(cb => cb.checked = select);
}

/**
 * دالة البدء في إنشاء التقرير
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

    // عرض المعاينة الأولية للطلاب المختارين
    previewArea.innerHTML = `
        <div style="text-align: right; width: 100%; padding: 20px;">
            <h3 style="color: #4361ee; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                ${reportNames[reportType]}
            </h3>
            <div class="alert alert-info mt-3" style="background: #e7f0ff; padding: 15px; border-radius: 8px;">
                <strong>تم اختيار ${selectedStudentIds.length} طالب/طلاب.</strong>
                <p>جاري استخراج البيانات من سجلات النظام...</p>
            </div>
        </div>
    `;
}

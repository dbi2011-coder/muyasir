document.addEventListener('DOMContentLoaded', function() {
    loadStudentsList();
});

// 1. دالة جلب وعرض الطلاب
function loadStudentsList() {
    const container = document.getElementById('studentsListContainer');
    // جلب البيانات من LocalStorage
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // تنظيف القائمة (حالة التحميل)
    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:15px; color:#888;">
                <i class="fas fa-user-slash" style="display:block; margin-bottom:5px;"></i>
                لا يوجد طلاب مسجلين
            </div>`;
        return;
    }

    // إنشاء عناصر القائمة
    students.forEach(student => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'selectedStudents';
        checkbox.value = student.id;
        checkbox.id = `st_${student.id}`;

        const label = document.createElement('label');
        label.htmlFor = `st_${student.id}`;
        // عرض الاسم والصف إذا وجد
        label.textContent = student.name + (student.grade ? ` (${student.grade})` : '');

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

// 2. دالة تحديد الكل / إلغاء التحديد
window.toggleSelectAll = function(selectAll) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    checkboxes.forEach(cb => cb.checked = selectAll);
};

// 3. دالة التحقق والعرض المبدئي (سيتم تطويرها لكل تقرير لاحقاً)
window.initiateReport = function() {
    const reportType = document.getElementById('reportType').value;
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    // التحقق من المدخلات
    if (!reportType) {
        alert("⚠️ الرجاء اختيار نوع التقرير أولاً.");
        return;
    }

    if (selectedIds.length === 0) {
        alert("⚠️ الرجاء اختيار طالب واحد على الأقل.");
        return;
    }

    // تجهيز منطقة المعاينة (Placeholder)
    const previewArea = document.getElementById('reportPreviewArea');
    const reportNames = {
        'attendance': 'تقرير الغياب',
        'achievement': 'تقرير نسب الإنجاز',
        'assignments': 'تقرير الواجبات',
        'iep': 'تقرير الخطط التربوية الفردية',
        'diagnostic': 'تقرير التشخيص',
        'schedule': 'تقرير الجدول الدراسي',
        'balance': 'تقرير رصيد الحصص',
        'committee': 'تقرير لجنة صعوبات التعلم'
    };

    // عرض رسالة نجاح مؤقتة
    previewArea.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="color: green; font-size: 3rem; margin-bottom: 20px;"><i class="fas fa-check-circle"></i></div>
            <h3>جاري إعداد ${reportNames[reportType]}...</h3>
            <p>تم اختيار <strong>${selectedIds.length}</strong> طالب/طلاب.</p>
            <div style="margin-top: 20px; color: #555; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                (هنا سيتم بناء الجدول وتفاصيل التقرير في الخطوات القادمة)
            </div>
        </div>
    `;
};

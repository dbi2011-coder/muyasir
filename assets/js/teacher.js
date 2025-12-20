/* ==========================================================================
   ملف: assets/js/teacher.js
   الوصف: ملف شامل يدمج إدارة قائمة الطلاب (الجدول) مع إدارة ملف الطالب (الخطة)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Teacher Script Loaded");

    // التحقق من الصفحة الحالية لتشغيل الدالة المناسبة
    const path = window.location.pathname;

    if (path.includes('students.html')) {
        // نحن في صفحة قائمة الطلاب
        loadStudentsData();
    } else if (path.includes('student-profile.html')) {
        // نحن في صفحة ملف الطالب
        // (يمكن إضافة دالة تحميل بيانات الطالب هنا إذا لزم الأمر)
        setTimeout(autoFillIEPSchedule, 500);
    }
});

/* ==========================================================================
   القسم الأول: إدارة قائمة الطلاب (students.html) - نظام الجدول
   ========================================================================== */

// 1. دالة تحميل وعرض بيانات الطلاب في الجدول
function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');

    // إذا لم نجد الجدول، نخرج (لسنا في صفحة الطلاب)
    if (!tableBody) return;

    // إظهار التحميل
    if(loadingState) loadingState.style.display = 'block';
    if(emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    // محاكاة تأخير الشبكة لجلب البيانات
    setTimeout(() => {
        // جلب البيانات من LocalStorage أو استخدام بيانات افتراضية
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        // (للتجربة: إذا كانت فارغة نضيف طلاب افتراضيين)
        if (users.length === 0) {
             users = [
                { id: 1, name: "نايف", grade: "الأول", subject: "لغتي", role: "student", progress: 65, teacherId: 1 },
                { id: 2, name: "محمد", grade: "الثاني", subject: "رياضيات", role: "student", progress: 40, teacherId: 1 }
            ];
            localStorage.setItem('users', JSON.stringify(users));
        }

        // تصفية الطلاب فقط (role === 'student')
        // (هنا نفترض أن المعلم الحالي ID = 1، يمكن تعديله لاحقاً ليكون ديناميكياً)
        const students = users.filter(u => u.role === 'student');

        if(loadingState) loadingState.style.display = 'none';

        if (students.length === 0) {
            if(emptyState) emptyState.style.display = 'block';
            return;
        }

        // رسم الجدول
        tableBody.innerHTML = students.map((student, index) => {
            const progress = student.progress || 0;
            const progressColor = progress >= 80 ? 'success' : progress >= 50 ? 'warning' : 'danger';
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>${student.grade}</td>
                    <td>${student.subject}</td>
                    <td class="progress-cell">
                        <div class="progress-text text-${progressColor}">${progress}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill bg-${progressColor}" style="width: ${progress}%"></div>
                        </div>
                    </td>
                    <td>
                        <div class="student-actions" style="display: flex; gap: 5px;">
                            <a href="student-profile.html?id=${student.id}" class="btn btn-sm btn-primary" title="ملف الطالب">
                                <i class="fas fa-file-alt"></i> ملف الطالب
                            </a>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }, 500);
}

// 2. دالة إضافة طالب جديد
function addNewStudent() {
    const nameInput = document.getElementById('studentName');
    const gradeInput = document.getElementById('studentGrade');
    const subjectInput = document.getElementById('studentSubject');

    if (!nameInput || !gradeInput || !subjectInput) {
        console.error("عناصر النموذج غير موجودة");
        return;
    }

    const name = nameInput.value.trim();
    const grade = gradeInput.value;
    const subject = subjectInput.value;

    if (!name || !grade || !subject) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const newStudent = {
        id: Date.now(), // رقم فريد
        teacherId: 1, // افتراضي
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        progress: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));

    alert('تم إضافة الطالب بنجاح');
    closeAddStudentModal();
    loadStudentsData(); // تحديث الجدول
}

// 3. دوال النوافذ المنبثقة (Modals)
function showAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function closeAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function deleteStudent(id) {
    if(confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(users));
        loadStudentsData();
    }
}

// 4. دوال البحث والفلترة
function searchStudents() {
    const term = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function filterStudents() {
    const grade = document.getElementById('gradeFilter').value;
    const rows = document.querySelectorAll('#studentsTableBody tr');
    rows.forEach(row => {
        // العمود الثالث (index 2) هو الصف
        const rowGrade = row.children[2] ? row.children[2].innerText : '';
        if (grade === 'all' || rowGrade.includes(grade)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/* ==========================================================================
   القسم الثاني: إدارة ملف الطالب (student-profile.html) - الخطة والجدول
   ========================================================================== */

// 1. التنقل بين الأقسام (Tabs) في صفحة البروفايل
function switchSection(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    
    // إظهار القسم المطلوب
    const target = document.getElementById('section-' + sectionId);
    if(target) target.classList.add('active');
    
    // تحديث القائمة الجانبية
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const link = document.getElementById('link-' + sectionId);
    if(link) link.classList.add('active');

    // **ميزة ذكية**: تحديث الجدول عند فتح قسم الخطة
    if(sectionId === 'iep') {
        autoFillIEPSchedule();
    }
}

// 2. الميزة الذكية: تعبئة جدول الحصص في الخطة آلياً
function autoFillIEPSchedule() {
    const studentNameInput = document.getElementById('iep-student-name');
    if (!studentNameInput) return; // لسنا في صفحة الخطة
    
    const studentName = studentNameInput.value.trim();
    if (!studentName) return;

    // جلب الجدول الدراسي من التخزين
    const scheduleDataString = localStorage.getItem('studySchedule') || localStorage.getItem('schoolSchedule') || localStorage.getItem('teacherSchedule');
    
    if (!scheduleDataString) {
        console.log("لا يوجد جدول دراسي محفوظ.");
        return; 
    }

    const scheduleData = JSON.parse(scheduleDataString);

    // خريطة لربط أسماء الأيام بـ IDs خانات الاختيار
    const daysMap = {
        'الأحد': 'iep-chk-sunday',
        'الاثنين': 'iep-chk-monday',
        'الثلاثاء': 'iep-chk-tuesday',
        'الأربعاء': 'iep-chk-wednesday',
        'الخميس': 'iep-chk-thursday'
    };

    // تصفير جميع الخانات أولاً
    Object.values(daysMap).forEach(id => {
        const checkbox = document.getElementById(id);
        if(checkbox) checkbox.checked = false;
    });

    // البحث في البيانات (ندعم هيكلين مختلفين للبيانات لضمان العمل)
    // الاحتمال 1: البيانات مصفوفة كائنات {day: 'الأحد', period: 1, students: [1, 2]}
    if (Array.isArray(scheduleData)) {
        // نحتاج معرفة ID الطالب إذا كانت البيانات تخزن IDs
        // سنجرب البحث بالاسم مباشرة في الجدول الدراسي إذا كان يخزن أسماء
        // أو سنحتاج منطق أعقد إذا كان يخزن IDs
        
        // للتبسيط في هذا الإصدار: سنفترض أن الجدول يخزن IDs ونحن نبحث عن اسم الطالب
        // الحل: البحث عن الطالب في جدول المستخدمين للحصول على ID
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        let studentObj = users.find(u => u.name === studentName);
        let studentId = studentObj ? studentObj.id : null;

        scheduleData.forEach(session => {
            if (session.students && (session.students.includes(studentId) || session.students.includes(studentName))) {
                if (daysMap[session.day]) {
                    const checkbox = document.getElementById(daysMap[session.day]);
                    if(checkbox) checkbox.checked = true;
                }
            }
        });
    } 
    // الاحتمال 2: البيانات كائن { "الأحد": { "1": [...] } }
    else {
        for (const [dayName, periods] of Object.entries(scheduleData)) {
            if (daysMap[dayName]) {
                let isPresent = false;
                if (periods && typeof periods === 'object') {
                    for (const periodStudents of Object.values(periods)) {
                        if (Array.isArray(periodStudents) && periodStudents.includes(studentName)) {
                            isPresent = true;
                            break; 
                        }
                    }
                }
                if (isPresent) {
                    const checkbox = document.getElementById(daysMap[dayName]);
                    if (checkbox) checkbox.checked = true;
                }
            }
        }
    }
}

// 3. دوال النوافذ الأخرى في البروفايل
function showAssignHomeworkModal() {
    const modal = document.getElementById('assignHomeworkModal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function regenerateLessons() {
    const grid = document.getElementById('studentLessonsGrid');
    if(grid) {
        grid.innerHTML = '<div style="text-align:center; padding:20px;">جاري التحديث... <i class="fas fa-spinner fa-spin"></i></div>';
        setTimeout(() => {
            grid.innerHTML = '<p style="text-align:center;">تم تحديث الدروس المقترحة.</p>';
        }, 1000);
    }
}

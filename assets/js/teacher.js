/* ==========================================================================
   ملف: assets/js/teacher.js
   الوصف: الكود البرمجي الخاص بلوحة تحكم المعلم (الطلاب، الخطة، الدروس)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Teacher Script Loaded");
    
    // 1. تحميل قائمة الطلاب (إذا كنا في صفحة الطلاب)
    loadStudents();

    // 2. محاولة تشغيل تعبئة الجدول (إذا كنا في صفحة الخطة)
    setTimeout(autoFillIEPSchedule, 500);
});

/* --------------------------------------------------------------------------
   1. وظائف إدارة وعرض الطلاب (الجزء الذي كان مفقوداً)
   -------------------------------------------------------------------------- */

// دالة جلب وعرض الطلاب
function loadStudents() {
    const grid = document.getElementById('studentsGrid');
    // إذا لم نجد الشبكة (Grid) فهذا يعني أننا لسنا في صفحة "طلابي"، لذا نخرج
    if (!grid) return;

    // بيانات وهمية (Mock Data) في حال لم يكن هناك قاعدة بيانات حقيقية بعد
    // يمكنك استبدال هذا الجزء بجلب البيانات من LocalStorage
    let students = JSON.parse(localStorage.getItem('myStudents'));

    if (!students || students.length === 0) {
        // بيانات افتراضية للتجربة
        students = [
            { id: 1, name: "نايف", grade: "الأول", diagnosis: "صعوبات قراءة", avatar: "ن" },
            { id: 2, name: "محمد", grade: "الثاني", diagnosis: "تشتت انتباه", avatar: "م" },
            { id: 3, name: "سعد", grade: "الثالث", diagnosis: "صعوبات رياضيات", avatar: "س" }
        ];
        // حفظها للاستخدام المستقبلي
        localStorage.setItem('myStudents', JSON.stringify(students));
    }

    // تفريغ الشبكة من رسالة "جاري التحميل..."
    grid.innerHTML = '';

    // بناء البطاقات
    students.forEach(student => {
        const card = document.createElement('div');
        card.className = 'student-card'; // تأكد أن هذا الكلاس موجود في CSS
        // لاحظ: تم ربط الرابط بصفحة student-profile.html
        card.innerHTML = `
            <div class="card-header">
                <div class="student-avatar" style="background-color: var(--accent-color); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${student.avatar}</div>
                <div class="student-meta">
                    <h3>${student.name}</h3>
                    <small>الصف: ${student.grade}</small>
                </div>
            </div>
            <div class="card-body" style="padding: 10px;">
                <span class="tag" style="background: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${student.diagnosis}</span>
            </div>
            <div class="card-footer" style="padding: 10px; border-top: 1px solid #eee; text-align: center;">
                <a href="student-profile.html?id=${student.id}" class="btn btn-primary" style="text-decoration: none; font-size: 0.9rem;">عرض الملف</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// دالة إضافة طالب جديد (مصححة)
function addNewStudent() {
    // 1. جلب البيانات من الحقول (تأكد من وجود IDs هذه في HTML النافذة)
    // في هذا المثال سنقوم بمحاكاة الإضافة
    const newStudent = {
        id: Date.now(), // رقم فريد
        name: "طالب جديد",
        grade: "الأول",
        diagnosis: "قيد التشخيص",
        avatar: "ط"
    };

    // 2. جلب القائمة القديمة وإضافة الجديد
    let students = JSON.parse(localStorage.getItem('myStudents')) || [];
    students.push(newStudent);
    localStorage.setItem('myStudents', JSON.stringify(students));

    alert("تم إضافة الطالب بنجاح!");
    
    // 3. إغلاق النافذة وتحديث القائمة
    closeModal('addStudentModal');
    loadStudents(); // إعادة تحميل القائمة لتظهر الإضافة
}


/* --------------------------------------------------------------------------
   2. التنقل بين الأقسام (Tabs) - لصفحة البروفايل
   -------------------------------------------------------------------------- */
function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById('section-' + sectionId);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const link = document.getElementById('link-' + sectionId);
    if(link) link.classList.add('active');

    // **ميزة ذكية**: تحديث الجدول عند فتح الخطة
    if(sectionId === 'iep') {
        autoFillIEPSchedule();
    }
}

/* --------------------------------------------------------------------------
   3. إدارة النوافذ المنبثقة (Modals)
   -------------------------------------------------------------------------- */
function showAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    } else {
        console.error("خطأ: نافذة إضافة الطالب غير موجودة.");
    }
}

function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function showAssignHomeworkModal() {
    const modal = document.getElementById('assignHomeworkModal');
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

/* --------------------------------------------------------------------------
   4. الأتمتة الذكية: ربط الخطة بالجدول الدراسي
   -------------------------------------------------------------------------- */
function autoFillIEPSchedule() {
    const studentNameInput = document.getElementById('iep-student-name');
    if (!studentNameInput) return;
    
    const studentName = studentNameInput.value.trim();
    if (!studentName) return;

    // جلب الجدول الدراسي
    const scheduleDataString = localStorage.getItem('studySchedule') || localStorage.getItem('schoolSchedule');
    
    if (!scheduleDataString) return;

    const scheduleData = JSON.parse(scheduleDataString);

    const daysMap = {
        'الأحد': 'iep-chk-sunday',
        'الاثنين': 'iep-chk-monday',
        'الثلاثاء': 'iep-chk-tuesday',
        'الأربعاء': 'iep-chk-wednesday',
        'الخميس': 'iep-chk-thursday'
    };

    // تصفير الخانات
    Object.values(daysMap).forEach(id => {
        const checkbox = document.getElementById(id);
        if(checkbox) checkbox.checked = false;
    });

    // البحث والتعبئة
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

/* --------------------------------------------------------------------------
   5. وظائف واجهة المستخدم الإضافية
   -------------------------------------------------------------------------- */
function toggleObjective(headerElement) {
    const row = headerElement.parentElement;
    const body = row.querySelector('.obj-body');
    
    if (body.style.display === 'block') {
        body.style.display = 'none';
        row.classList.remove('expanded');
    } else {
        body.style.display = 'block';
        row.classList.add('expanded');
    }
}

function regenerateLessons() {
    const grid = document.getElementById('studentLessonsGrid');
    if(grid) {
        grid.innerHTML = '<div style="text-align:center; padding:20px;">جاري التحديث... <i class="fas fa-spinner fa-spin"></i></div>';
        setTimeout(() => {
            grid.innerHTML = '<p style="text-align:center;">تم تحديث الدروس.</p>';
        }, 1000);
    }
}

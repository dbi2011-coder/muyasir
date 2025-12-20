/* ==========================================================================
   ملف: assets/js/teacher.js
   الوصف: الكود البرمجي الخاص بلوحة تحكم المعلم (الطلاب، الخطة، الدروس)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Teacher Script Loaded");
    
    // محاولة تشغيل تعبئة الجدول إذا كنا في صفحة الخطة
    setTimeout(autoFillIEPSchedule, 500);
});

/* --------------------------------------------------------------------------
   1. التنقل بين الأقسام (Tabs)
   -------------------------------------------------------------------------- */
function switchSection(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    
    // إظهار القسم المطلوب
    const target = document.getElementById('section-' + sectionId);
    if(target) target.classList.add('active');
    
    // تحديث القائمة الجانبية (active class)
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const link = document.getElementById('link-' + sectionId);
    if(link) link.classList.add('active');

    // **ميزة ذكية**: إذا فتحنا قسم الخطة (iep)، نقوم بتحديث جدول الحصص آلياً
    if(sectionId === 'iep') {
        autoFillIEPSchedule();
    }
}

/* --------------------------------------------------------------------------
   2. إدارة النوافذ المنبثقة (Modals) - [تم الإصلاح هنا]
   -------------------------------------------------------------------------- */

// دالة إظهار نافذة "إضافة طالب"
function showAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.style.display = 'flex';
        // مهلة بسيطة لتفعيل الأنيميشن (CSS Transition)
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } else {
        console.error("خطأ: نافذة إضافة الطالب (addStudentModal) غير موجودة في كود HTML.");
        alert("عذراً، نافذة إضافة الطالب غير موجودة في الصفحة الحالية.");
    }
}

// دالة إظهار نافذة "تعيين اختبار"
function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

// دالة إظهار نافذة "إسناد واجب"
function showAssignHomeworkModal() {
    const modal = document.getElementById('assignHomeworkModal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

// دالة إغلاق أي نافذة منبثقة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show'); // إلغاء الأنيميشن
        setTimeout(() => {
            modal.style.display = 'none'; // الإخفاء الفعلي
        }, 300); // نفس مدة الـ transition في CSS
    }
}

// دالة حفظ الطالب (محاكاة)
function saveStudent() {
    // هنا يتم وضع كود الحفظ الفعلي أو إرسال البيانات
    alert("تم حفظ بيانات الطالب بنجاح! (محاكاة)");
    closeModal('addStudentModal');
    // يمكن هنا استدعاء دالة لتحديث قائمة الطلاب
}

/* --------------------------------------------------------------------------
   3. الأتمتة الذكية: ربط الخطة بالجدول الدراسي
   -------------------------------------------------------------------------- */
function autoFillIEPSchedule() {
    // التحقق من وجود عناصر الخطة في الصفحة الحالية
    const studentNameInput = document.getElementById('iep-student-name');
    if (!studentNameInput) return; // لسنا في صفحة الخطة
    
    const studentName = studentNameInput.value.trim();
    if (!studentName) return;

    console.log(`جاري البحث عن حصص الطالب: ${studentName}...`);

    // جلب الجدول الدراسي العام من التخزين المحلي
    const scheduleDataString = localStorage.getItem('studySchedule') || localStorage.getItem('schoolSchedule');
    
    if (!scheduleDataString) {
        console.log("لا يوجد جدول دراسي محفوظ مسبقاً في النظام.");
        return; 
    }

    const scheduleData = JSON.parse(scheduleDataString);

    // خريطة لربط أسماء الأيام بـ IDs خانات الاختيار في نموذج الخطة
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

    // البحث في البيانات وتحديد الأيام
    for (const [dayName, periods] of Object.entries(scheduleData)) {
        if (daysMap[dayName]) {
            let isPresent = false;
            
            // البحث داخل حصص اليوم
            if (periods && typeof periods === 'object') {
                for (const periodStudents of Object.values(periods)) {
                    // التحقق مما إذا كان اسم الطالب موجوداً في مصفوفة الطلاب لهذه الحصة
                    if (Array.isArray(periodStudents) && periodStudents.includes(studentName)) {
                        isPresent = true;
                        break; 
                    }
                }
            }

            // إذا وجدنا الطالب، نضع علامة صح
            if (isPresent) {
                const checkbox = document.getElementById(daysMap[dayName]);
                if (checkbox) checkbox.checked = true;
            }
        }
    }
}

/* --------------------------------------------------------------------------
   4. وظائف واجهة المستخدم الإضافية (UI Helpers)
   -------------------------------------------------------------------------- */

// توسيع/طي الأهداف (Accordion)
function toggleObjective(headerElement) {
    const row = headerElement.parentElement;
    const body = row.querySelector('.obj-body');
    
    // التبديل
    if (body.style.display === 'block') {
        body.style.display = 'none';
        row.classList.remove('expanded');
    } else {
        body.style.display = 'block';
        row.classList.add('expanded');
    }
}

// زر تحديث الدروس (محاكاة)
function regenerateLessons() {
    const grid = document.getElementById('studentLessonsGrid');
    if(grid) {
        grid.innerHTML = '<div style="text-align:center; width:100%; padding:20px;">جاري توليد دروس جديدة بناءً على الأهداف... <i class="fas fa-spinner fa-spin"></i></div>';
        setTimeout(() => {
            grid.innerHTML = '<p style="text-align:center; width:100%;">تم تحديث الدروس المقترحة.</p>';
        }, 1500);
    }
}

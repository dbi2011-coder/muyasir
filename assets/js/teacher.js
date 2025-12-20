// ===========================================
// ملف: assets/js/teacher.js
// ===========================================

// ... (الأكواد السابقة الخاصة بالتبديل بين الأقسام والنوافذ المنبثقة تبقى كما هي) ...

// دالة التبديل بين الأقسام (موجودة مسبقاً)
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

    // **إضافة جديدة**: إذا فتحنا قسم الخطة (iep)، قم بتحديث جدول الحصص آلياً
    if(sectionId === 'iep') {
        autoFillIEPSchedule();
    }
}

// ==========================================================
// 🚀 الميزة الجديدة: التعبئة الآلية لجدول الحصص في الخطة
// ==========================================================
function autoFillIEPSchedule() {
    console.log("جاري تحديث جدول الخطة...");

    // 1. معرفة اسم الطالب الحالي
    // (نبحث عن الحقل الذي يحمل ID المحدد أو نأخذ القيمة)
    const studentNameInput = document.getElementById('iep-student-name');
    if (!studentNameInput) return;
    
    const studentName = studentNameInput.value.trim();
    if (!studentName) return;

    // 2. جلب الجدول الدراسي العام من النظام (Local Storage)
    // نفترض أن البيانات مخزنة باسم 'schoolSchedule' أو 'studySchedule'
    const scheduleDataString = localStorage.getItem('studySchedule') || localStorage.getItem('schoolSchedule');
    
    if (!scheduleDataString) {
        console.log("لا يوجد جدول دراسي محفوظ مسبقاً.");
        return; 
    }

    const scheduleData = JSON.parse(scheduleDataString);

    // 3. مصفوفة لربط أسماء الأيام في النظام بـ IDs الخانات في الخطة
    const daysMap = {
        'الأحد': 'iep-chk-sunday',
        'الاثنين': 'iep-chk-monday',
        'الثلاثاء': 'iep-chk-tuesday',
        'الأربعاء': 'iep-chk-wednesday',
        'الخميس': 'iep-chk-thursday'
    };

    // 4. تصفير جميع الخانات أولاً (إزالة الصح)
    Object.values(daysMap).forEach(id => {
        const checkbox = document.getElementById(id);
        if(checkbox) checkbox.checked = false;
    });

    // 5. البحث عن الطالب في الجدول وتحديد أيامه
    // هيكل البيانات المتوقع: { "الأحد": { "1": ["أحمد", "نايف"], "2": [] }, ... }
    for (const [dayName, periods] of Object.entries(scheduleData)) {
        // إذا كان اليوم موجوداً في خريطتنا
        if (daysMap[dayName]) {
            let isPresent = false;
            
            // نبحث في حصص هذا اليوم
            if (periods && typeof periods === 'object') {
                for (const periodStudents of Object.values(periods)) {
                    if (Array.isArray(periodStudents) && periodStudents.includes(studentName)) {
                        isPresent = true;
                        break; // وجدناه في إحدى حصص هذا اليوم
                    }
                }
            }

            // إذا وجدنا الطالب في هذا اليوم، نضع علامة صح
            if (isPresent) {
                const checkbox = document.getElementById(daysMap[dayName]);
                if (checkbox) checkbox.checked = true;
            }
        }
    }
}

// تشغيل الدالة عند تحميل الصفحة للتأكد
document.addEventListener('DOMContentLoaded', () => {
    // محاولة تعبئة الجدول إذا كنا في صفحة الطالب
    setTimeout(autoFillIEPSchedule, 500);
});

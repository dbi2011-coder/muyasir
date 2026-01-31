// ============================================
// 📁 المسار: assets/js/study-schedule.js
// الوصف: إدارة الجدول الدراسي (بيانات خاصة لكل معلم)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من أن المستخدم الحالي هو معلم
    const user = getCurrentUser();
    if (user && user.role === 'teacher') {
        renderScheduleTable();
    }
});

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// دالة عرض الجدول
function renderScheduleTable() {
    const tbody = document.getElementById('scheduleBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // جلب كل الجداول
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    
    // 🔥 العزل: فلترة الجدول الخاص بالمعلم الحالي فقط
    const mySchedule = allSchedules.filter(s => s.teacherId === currentUser.id);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    DAYS.forEach(day => {
        const row = document.createElement('tr');
        let html = `<td><strong>${day}</strong></td>`;
        
        PERIODS.forEach(period => {
            // البحث في جدول المعلم الحالي فقط
            const sessionData = mySchedule.find(s => s.day === day && s.period === period);
            
            let cellContent = '<span style="color:#eee; font-size:1.5rem; cursor:pointer;">+</span>';
            let cellClass = '';

            if (sessionData && sessionData.students && sessionData.students.length > 0) {
                // جلب أسماء الطلاب (الذين يتبعون لهذا المعلم أيضاً)
                const studentNames = sessionData.students.map(sid => {
                    const s = users.find(u => u.id === sid);
                    return s ? s.name : '';
                }).filter(n => n).join('<br>');
                
                cellContent = `<span style="font-size:0.85rem; color:#333;">${studentNames}</span>`;
                cellClass = 'filled-session';
            }

            html += `<td class="${cellClass}" onclick="openSelectStudentsModal('${day}', ${period})" style="vertical-align:top; height:80px;">${cellContent}</td>`;
        });

        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

// دالة فتح نافذة اختيار الطلاب
function openSelectStudentsModal(day, period) {
    const currentUser = getCurrentUser();
    document.getElementById('selectedDay').value = day;
    document.getElementById('selectedPeriod').value = period;
    document.getElementById('modalSessionInfo').innerText = `حصة ${period} - يوم ${day}`;

    const container = document.getElementById('studentsCheckList');
    container.innerHTML = '';

    // جلب جميع المستخدمين
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 🔥 العزل: عرض الطلاب التابعين لهذا المعلم فقط
    const myStudents = users.filter(u => u.role === 'student' && u.teacherId === currentUser.id);

    if (myStudents.length === 0) {
        container.innerHTML = '<p class="text-danger">لا يوجد طلاب مسجلين باسمك. قم بإضافة طلاب أولاً.</p>';
    }

    // تحديد الطلاب المختارين سابقاً في هذه الحصة
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    // البحث في جدول المعلم الحالي
    const sessionData = allSchedules.find(s => s.teacherId === currentUser.id && s.day === day && s.period === period);
    const selectedIds = sessionData ? sessionData.students : [];

    myStudents.forEach(student => {
        const isChecked = selectedIds.includes(student.id) ? 'checked' : '';
        const label = document.createElement('label');
        label.className = 'student-checkbox-item';
        label.style.cssText = 'display:block; padding:5px; border-bottom:1px solid #eee; cursor:pointer;';
        label.innerHTML = `
            <input type="checkbox" value="${student.id}" ${isChecked} style="margin-left:10px;">
            <span>${student.name}</span>
            <span style="font-size:0.8rem; color:#777; margin-right:auto;">(${student.grade || 'غير محدد'})</span>
        `;
        container.appendChild(label);
    });

    // استخدام دالة فتح النافذة المتاحة
    if (typeof showModal === 'function') showModal('selectStudentsModal');
    else document.getElementById('selectStudentsModal').classList.add('show');
}

// دالة حفظ الطلاب في الحصة
function saveSessionStudents() {
    const currentUser = getCurrentUser();
    const day = document.getElementById('selectedDay').value;
    const period = parseInt(document.getElementById('selectedPeriod').value);
    
    const checkboxes = document.querySelectorAll('#studentsCheckList input[type="checkbox"]:checked');
    const selectedStudentIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    let scheduleData = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    
    // 1. حذف المدخل القديم لهذه الحصة (الخاص بالمعلم الحالي فقط)
    scheduleData = scheduleData.filter(s => !(s.teacherId === currentUser.id && s.day === day && s.period === period));

    // 2. إضافة المدخل الجديد (مع بصمة المعلم ID)
    if (selectedStudentIds.length > 0) {
        scheduleData.push({
            teacherId: currentUser.id, // 🔥 ربط الحصة بالمعلم
            day: day,
            period: period,
            students: selectedStudentIds
        });
    }

    localStorage.setItem('teacherSchedule', JSON.stringify(scheduleData));
    
    if (typeof closeModal === 'function') closeModal('selectStudentsModal');
    else document.getElementById('selectStudentsModal').classList.remove('show');
    
    renderScheduleTable();
}

window.renderScheduleTable = renderScheduleTable;
window.openSelectStudentsModal = openSelectStudentsModal;
window.saveSessionStudents = saveSessionStudents;

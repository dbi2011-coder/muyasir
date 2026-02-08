// ============================================
// 📁 المسار: assets/js/study-schedule.js
// الوصف: إدارة الجدول الدراسي (معزول لكل معلم)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    renderScheduleTable();
});

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// دالة مساعدة لجلب المستخدم الحالي بأمان
function getCurrentUser() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) return null;
    const data = JSON.parse(session);
    // دعم الصيغتين: سواء كان الكائن مباشرة أو داخل خاصية user
    return data.user || data;
}

function renderScheduleTable() {
    const tbody = document.getElementById('scheduleBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const currentUser = getCurrentUser();
    if (!currentUser) return; // يجب أن يكون مسجلاً للدخول

    // جلب كل الجداول من النظام
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    
    // 🔥 العزل: فلترة الجدول لاستخراج حصص هذا المعلم فقط
    const mySchedule = allSchedules.filter(s => s.teacherId == currentUser.id);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // الحلقة الخارجية للأيام
    DAYS.forEach(day => {
        const row = document.createElement('tr');
        
        // 1. الخلية الأولى: اسم اليوم
        let html = `<td><strong>${day}</strong></td>`;
        
        // 2. الخلايا التالية: الحصص
        PERIODS.forEach(period => {
            // البحث داخل جدول المعلم الحالي فقط
            const sessionData = mySchedule.find(s => s.day === day && s.period === period);
            
            let cellContent = '<span style="color:#eee; font-size:1.5rem; cursor:pointer;">+</span>';
            let cellClass = '';

            if (sessionData && sessionData.students && sessionData.students.length > 0) {
                const studentNames = sessionData.students.map(sid => {
                    const st = users.find(u => u.id === sid);
                    return st ? st.name.split(' ')[0] : '؟';
                });
                
                // تنسيق عرض الأسماء
                if(studentNames.length > 2) {
                    cellContent = `<span class="student-chip">${studentNames[0]}</span><span class="student-chip">${studentNames[1]}</span><span class="student-chip" title="${studentNames.slice(2).join(', ')}">+${studentNames.length-2}</span>`;
                } else {
                    cellContent = studentNames.map(name => `<span class="student-chip">${name}</span>`).join('');
                }
                cellClass = 'filled';
            }

            html += `
                <td class="schedule-cell ${cellClass}" onclick="openSessionModal('${day}', ${period})">
                    ${cellContent}
                </td>
            `;
        });

        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

function openSessionModal(day, period) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    document.getElementById('selectedDay').value = day;
    document.getElementById('selectedPeriod').value = period;
    document.getElementById('modalSessionInfo').textContent = `تسكين الطلاب في يوم ${day} - الحصة ${period}`;

    const container = document.getElementById('studentsCheckList');
    container.innerHTML = '';

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 🔥 العزل: عرض الطلاب التابعين لهذا المعلم فقط
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    // تحديد الطلاب المختارين سابقاً في هذه الحصة (من جدول المعلم الحالي)
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const currentSession = allSchedules.find(s => s.teacherId == currentUser.id && s.day === day && s.period === period);
    const selectedIds = currentSession ? currentSession.students : [];

    if (myStudents.length === 0) {
        container.innerHTML = '<p class="text-danger" style="text-align:center; padding:10px;">لا يوجد طلاب مسجلين باسمك. يرجى إضافة طلاب أولاً.</p>';
    } else {
        myStudents.forEach(student => {
            const isChecked = selectedIds.includes(student.id) ? 'checked' : '';
            const label = document.createElement('label');
            label.className = 'student-checkbox-item';
            label.style.cssText = 'display:flex; align-items:center; padding:8px; border-bottom:1px solid #eee; cursor:pointer;';
            label.innerHTML = `
                <input type="checkbox" value="${student.id}" ${isChecked} style="margin-left:10px;">
                <span style="font-weight:bold;">${student.name}</span>
                <span style="font-size:0.8rem; color:#777; margin-right:auto;">(${student.grade || '-'})</span>
            `;
            container.appendChild(label);
        });
    }

    // فتح النافذة
    const modal = document.getElementById('selectStudentsModal');
    if(modal) modal.classList.add('show');
}

function saveSessionStudents() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const day = document.getElementById('selectedDay').value;
    const period = parseInt(document.getElementById('selectedPeriod').value);
    
    const checkboxes = document.querySelectorAll('#studentsCheckList input[type="checkbox"]:checked');
    const selectedStudentIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    let scheduleData = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    
    // 1. حذف المدخل القديم لهذه الحصة (الخاص بهذا المعلم فقط)
    // نحتفظ ببيانات المعلمين الآخرين كما هي
    scheduleData = scheduleData.filter(s => !(s.teacherId == currentUser.id && s.day === day && s.period === period));

    // 2. إضافة البيانات الجديدة (مع بصمة المعلم ID)
    if (selectedStudentIds.length > 0) {
        scheduleData.push({
            teacherId: currentUser.id, // 🔥 ربط الحصة بالمعلم
            day: day,
            period: period,
            students: selectedStudentIds
        });
    }

    localStorage.setItem('teacherSchedule', JSON.stringify(scheduleData));
    closeModal('selectStudentsModal');
    renderScheduleTable();
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('show');
}

// تصدير الدوال لتكون متاحة للـ HTML
window.renderScheduleTable = renderScheduleTable;
window.openSessionModal = openSessionModal;
window.saveSessionStudents = saveSessionStudents;
window.closeModal = closeModal;

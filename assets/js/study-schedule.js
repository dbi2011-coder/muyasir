// ============================================
// 📁 المسار: assets/js/study-schedule.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    renderScheduleTable();
});

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function renderScheduleTable() {
    const tbody = document.getElementById('scheduleBody');
    tbody.innerHTML = '';

    const scheduleData = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // الحلقة الخارجية: الأيام (الصفوف)
    DAYS.forEach(day => {
        const row = document.createElement('tr');
        
        // الخلية الأولى: اسم اليوم
        let html = `<td>${day}</td>`;
        
        // الحلقة الداخلية: الحصص (الأعمدة)
        PERIODS.forEach(period => {
            const sessionData = scheduleData.find(s => s.day === day && s.period === period);
            let cellContent = '<span style="color:#eee; font-size:1.5rem;">+</span>';
            let cellClass = '';

            if (sessionData && sessionData.students && sessionData.students.length > 0) {
                const studentNames = sessionData.students.map(sid => {
                    const st = users.find(u => u.id === sid);
                    return st ? st.name.split(' ')[0] : '?';
                });
                
                // عرض الأسماء
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
    document.getElementById('selectedDay').value = day;
    document.getElementById('selectedPeriod').value = period;
    document.getElementById('modalTitle').textContent = `تسكين الطلاب: ${day} - الحصة ${period}`;

    const container = document.getElementById('studentsCheckList');
    container.innerHTML = '';

    const currentTeacher = JSON.parse(sessionStorage.getItem('currentUser')).user;
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);

    const scheduleData = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const currentSession = scheduleData.find(s => s.day === day && s.period === period);
    const selectedIds = currentSession ? currentSession.students : [];

    if (myStudents.length === 0) {
        container.innerHTML = '<p class="text-danger">لا يوجد طلاب مضافين لديك.</p>';
        return;
    }

    myStudents.forEach(student => {
        const isChecked = selectedIds.includes(student.id) ? 'checked' : '';
        const item = document.createElement('label');
        item.className = 'student-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" value="${student.id}" ${isChecked}>
            <span>${student.name}</span>
            <span style="font-size:0.8rem; color:#777; margin-right:auto;">(${student.grade})</span>
        `;
        container.appendChild(item);
    });

    document.getElementById('selectStudentsModal').classList.add('show');
}

function saveSessionStudents() {
    const day = document.getElementById('selectedDay').value;
    const period = parseInt(document.getElementById('selectedPeriod').value);
    
    const checkboxes = document.querySelectorAll('#studentsCheckList input[type="checkbox"]:checked');
    const selectedStudentIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    let scheduleData = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    
    // إزالة السجل القديم لهذه الخلية
    scheduleData = scheduleData.filter(s => !(s.day === day && s.period === period));

    // إضافة الجديد
    if (selectedStudentIds.length > 0) {
        scheduleData.push({
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
    document.getElementById(id).classList.remove('show');
}

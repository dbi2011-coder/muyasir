// ============================================
// 📁 المسار: assets/js/study-schedule.js (نسخة Supabase)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    renderScheduleTable();
});

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')); }

async function renderScheduleTable() {
    const tbody = document.getElementById('scheduleBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center p-3">جاري تحميل الجدول...</td></tr>';

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
        // جلب جدول المعلم الحالي
        const { data: mySchedule, error: schError } = await window.supabase.from('teacher_schedule').select('*').eq('teacherId', currentUser.id);
        if (schError) throw schError;

        // جلب أسماء الطلاب لترجمة الهويات إلى أسماء
        const { data: users } = await window.supabase.from('users').select('id, name').eq('role', 'student').eq('teacherId', currentUser.id);

        tbody.innerHTML = '';

        DAYS.forEach(day => {
            const row = document.createElement('tr');
            let html = `<td><strong>${day}</strong></td>`;
            
            PERIODS.forEach(period => {
                const sessionData = (mySchedule || []).find(s => s.day === day && s.period === period);
                let cellContent = '<span style="color:#eee; font-size:1.5rem; cursor:pointer;">+</span>';
                let cellClass = '';

                if (sessionData && sessionData.students && sessionData.students.length > 0) {
                    const studentNames = sessionData.students.map(sid => {
                        const st = (users || []).find(u => u.id == sid);
                        return st ? st.name.split(' ')[0] : '؟';
                    });
                    
                    if(studentNames.length > 2) {
                        cellContent = `<span class="student-chip">${studentNames[0]}</span><span class="student-chip">${studentNames[1]}</span><span class="student-chip" title="${studentNames.slice(2).join(', ')}">+${studentNames.length-2}</span>`;
                    } else {
                        cellContent = studentNames.map(name => `<span class="student-chip">${name}</span>`).join('');
                    }
                    cellClass = 'filled';
                }

                html += `<td class="schedule-cell ${cellClass}" onclick="openSessionModal('${day}', ${period})">${cellContent}</td>`;
            });
            row.innerHTML = html;
            tbody.appendChild(row);
        });
    } catch(e) { console.error(e); }
}

async function openSessionModal(day, period) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    document.getElementById('selectedDay').value = day;
    document.getElementById('selectedPeriod').value = period;
    document.getElementById('modalSessionInfo').textContent = `تسكين الطلاب في يوم ${day} - الحصة ${period}`;

    const container = document.getElementById('studentsCheckList');
    container.innerHTML = 'جاري التحميل...';

    try {
        const { data: myStudents } = await window.supabase.from('users').select('*').eq('role', 'student').eq('teacherId', currentUser.id);
        const { data: schedule } = await window.supabase.from('teacher_schedule').select('students').eq('teacherId', currentUser.id).eq('day', day).eq('period', period).single();
        
        const selectedIds = schedule ? schedule.students : [];
        container.innerHTML = '';

        if (!myStudents || myStudents.length === 0) {
            container.innerHTML = '<p class="text-danger" style="text-align:center;">لا يوجد طلاب مسجلين باسمك.</p>';
        } else {
            myStudents.forEach(student => {
                const isChecked = selectedIds.includes(student.id) ? 'checked' : '';
                const label = document.createElement('label');
                label.className = 'student-checkbox-item';
                label.innerHTML = `<input type="checkbox" value="${student.id}" ${isChecked} style="margin-left:10px;"><span style="font-weight:bold;">${student.name}</span>`;
                container.appendChild(label);
            });
        }
        document.getElementById('selectStudentsModal').classList.add('show');
    } catch(e) { console.error(e); }
}

async function saveSessionStudents() {
    const currentUser = getCurrentUser();
    const day = document.getElementById('selectedDay').value;
    const period = parseInt(document.getElementById('selectedPeriod').value);
    
    const checkboxes = document.querySelectorAll('#studentsCheckList input[type="checkbox"]:checked');
    const selectedStudentIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    try {
        // حذف الحصة إن كانت فارغة أو تحديثها إن كان فيها طلاب
        if (selectedStudentIds.length === 0) {
            await window.supabase.from('teacher_schedule').delete().eq('teacherId', currentUser.id).eq('day', day).eq('period', period);
        } else {
            // التحقق من وجود سجل مسبق
            const { data: existing } = await window.supabase.from('teacher_schedule').select('id').eq('teacherId', currentUser.id).eq('day', day).eq('period', period).single();
            if (existing) {
                await window.supabase.from('teacher_schedule').update({ students: selectedStudentIds }).eq('id', existing.id);
            } else {
                await window.supabase.from('teacher_schedule').insert([{ teacherId: currentUser.id, day: day, period: period, students: selectedStudentIds }]);
            }
        }
        closeModal('selectStudentsModal');
        renderScheduleTable();
    } catch(e) { console.error(e); alert('خطأ في الحفظ'); }
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

window.renderScheduleTable = renderScheduleTable;
window.openSessionModal = openSessionModal;
window.saveSessionStudents = saveSessionStudents;
window.closeModal = closeModal;

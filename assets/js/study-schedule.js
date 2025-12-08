// إدارة الجدول الدراسي
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('study-schedule.html')) {
        loadStudySchedule();
        loadStudentsForSchedule();
    }
});

function loadStudySchedule() {
    const scheduleBody = document.getElementById('scheduleBody');
    if (!scheduleBody) return;

    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherSchedule = schedule.filter(s => s.teacherId === currentTeacher.id);

    // إنشاء جدول الحصص
    let scheduleHTML = '';
    const periods = [
        'الحصة الأولى', 'الحصة الثانية', 'الحصة الثالثة', 
        'الحصة الرابعة', 'الحصة الخامسة', 'الحصة السادسة', 'الحصة السابعة'
    ];

    periods.forEach((period, periodIndex) => {
        scheduleHTML += `<tr>`;
        scheduleHTML += `<td class="period-name">${period}</td>`;
        
        ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].forEach(day => {
            const session = teacherSchedule.find(s => 
                s.day === day && s.period === (periodIndex + 1)
            );
            
            scheduleHTML += `<td class="schedule-cell ${session ? 'booked' : 'available'}" 
                data-day="${day}" data-period="${periodIndex + 1}"
                onclick="handleCellClick('${day}', ${periodIndex + 1})">`;
            
            if (session) {
                scheduleHTML += `
                    <div class="session-info">
                        <div class="session-subject">${session.subject}</div>
                        <div class="session-students">${session.students.length} طالب</div>
                        <div class="session-actions">
                            <button class="btn btn-sm btn-danger" onclick="removeSession(event, ${session.id})">🗑️</button>
                        </div>
                    </div>
                `;
            } else {
                scheduleHTML += `<span class="cell-placeholder">+ إضافة</span>`;
            }
            
            scheduleHTML += `</td>`;
        });
        
        scheduleHTML += `</tr>`;
    });

    scheduleBody.innerHTML = scheduleHTML;
}

function loadStudentsForSchedule() {
    const studentsList = document.getElementById('studentsList');
    if (!studentsList) return;

    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherStudents = students.filter(s => s.teacherId === currentTeacher.id);

    if (teacherStudents.length === 0) {
        studentsList.innerHTML = '<p class="no-students">لا توجد طلاب مسجلين</p>';
        return;
    }

    studentsList.innerHTML = teacherStudents.map(student => `
        <div class="student-checkbox">
            <input type="checkbox" id="student_${student.id}" value="${student.id}">
            <label for="student_${student.id}">${student.name} - ${student.grade}</label>
        </div>
    `).join('');
}

function handleCellClick(day, period) {
    document.getElementById('sessionDay').value = day;
    document.getElementById('sessionPeriod').value = period;
    showAddSessionModal();
}

function showAddSessionModal() {
    document.getElementById('addSessionModal').classList.add('show');
}

function closeAddSessionModal() {
    document.getElementById('addSessionModal').classList.remove('show');
    document.getElementById('addSessionForm').reset();
}

function addSessionToSchedule() {
    const day = document.getElementById('sessionDay').value;
    const period = parseInt(document.getElementById('sessionPeriod').value);
    const subject = document.getElementById('sessionSubject').value;

    if (!day || !period || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }

    // الحصول على الطلاب المحددين
    const selectedStudents = [];
    document.querySelectorAll('#studentsList input:checked').forEach(checkbox => {
        selectedStudents.push(parseInt(checkbox.value));
    });

    if (selectedStudents.length === 0) {
        showAuthNotification('يرجى اختيار طالب واحد على الأقل', 'error');
        return;
    }

    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const currentTeacher = getCurrentUser();

    // التحقق من عدم وجود حصة مكررة
    const existingSession = schedule.find(s => 
        s.teacherId === currentTeacher.id && s.day === day && s.period === period
    );

    if (existingSession) {
        showAuthNotification('هناك حصة مضافة مسبقاً في هذا الوقت', 'warning');
        return;
    }

    const newSession = {
        id: generateId(),
        teacherId: currentTeacher.id,
        day: day,
        period: period,
        subject: subject,
        students: selectedStudents,
        createdAt: new Date().toISOString()
    };

    schedule.push(newSession);
    localStorage.setItem('teacherSchedule', JSON.stringify(schedule));

    showAuthNotification('تم إضافة الحصة بنجاح', 'success');
    closeAddSessionModal();
    loadStudySchedule();
}

function removeSession(event, sessionId) {
    event.stopPropagation();
    
    if (!confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
        return;
    }

    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const updatedSchedule = schedule.filter(s => s.id !== sessionId);
    localStorage.setItem('teacherSchedule', JSON.stringify(updatedSchedule));

    showAuthNotification('تم حذف الحصة بنجاح', 'success');
    loadStudySchedule();
}

function clearSchedule() {
    if (!confirm('هل أنت متأكد من تفريغ الجدول بالكامل؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }

    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const currentTeacher = getCurrentUser();
    const updatedSchedule = schedule.filter(s => s.teacherId !== currentTeacher.id);
    localStorage.setItem('teacherSchedule', JSON.stringify(updatedSchedule));

    showAuthNotification('تم تفريغ الجدول بنجاح', 'success');
    loadStudySchedule();
}

function saveSchedule() {
    showAuthNotification('تم حفظ الجدول بنجاح', 'success');
}

function printSchedule() {
    showAuthNotification('جاري تحضير الجدول للطباعة...', 'info');
    setTimeout(() => {
        window.print();
    }, 1000);
}

// تصدير الدوال للاستخدام العالمي
window.handleCellClick = handleCellClick;
window.showAddSessionModal = showAddSessionModal;
window.closeAddSessionModal = closeAddSessionModal;
window.addSessionToSchedule = addSessionToSchedule;
window.removeSession = removeSession;
window.clearSchedule = clearSchedule;
window.saveSchedule = saveSchedule;
window.printSchedule = printSchedule;
// ============================================
// 📁 الملف: assets/js/teacher.js
// الوصف: إدارة شاشة الطلاب + حساب نسبة التقدم الحقيقية الموحدة في الجدول
// ============================================

// =========================================================
// 🔥 دوال النوافذ المنبثقة الاحترافية (تمت إضافتها لمنع الخطأ) 🔥
// =========================================================
if (!window.showConfirmModal) {
    window.showConfirmModal = function(message, onConfirm) {
        let modal = document.getElementById('globalConfirmModal');
        if (!modal) {
            const modalHtml = `
                <div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                    <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;">
                        <div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-trash-alt"></i></div>
                        <div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div>
                        <div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.5;"></div>
                        <div style="display:flex; gap:15px; justify-content:center;">
                            <button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button>
                            <button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalConfirmModal');
        }

        document.getElementById('globalConfirmMessage').innerHTML = message;
        modal.style.display = 'flex';

        document.getElementById('globalConfirmOk').onclick = function() {
            modal.style.display = 'none';
            if (typeof onConfirm === 'function') onConfirm();
        };

        document.getElementById('globalConfirmCancel').onclick = function() {
            modal.style.display = 'none';
        };
    };
}

if (!window.showSuccess) {
    window.showSuccess = function(message) {
        let toast = document.getElementById('globalSuccessToast');
        if (!toast) {
            const toastHtml = `
                <div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;">
                    <i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalSuccessToast');
        }
        document.getElementById('globalSuccessMessage').textContent = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    };
}
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) initializeTeacherDashboard();
    else if (path.includes('students.html')) initializeStudentsPage();
});

function initializeStudentsPage() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    updateUserInterface(user);
    loadStudentsData();
}

function initializeTeacherDashboard() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    updateUserInterface(user);
    loadTeacherStats();
}

function loadTeacherStats() {
    const currentTeacher = getCurrentUser();
    if (!currentTeacher) return;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentsCount = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id).length;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lessonsCount = lessons.filter(l => l.teacherId === currentTeacher.id).length;
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const assignmentsCount = assignments.filter(a => a.teacherId === currentTeacher.id).length;
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const messagesCount = messages.filter(m => m.teacherId === currentTeacher.id && m.isFromStudent && !m.isRead).length;

    if (document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = studentsCount;
    if (document.getElementById('lessonsCount')) document.getElementById('lessonsCount').innerText = lessonsCount;
    if (document.getElementById('assignmentsCount')) document.getElementById('assignmentsCount').innerText = assignmentsCount;
    if (document.getElementById('unreadMessages')) document.getElementById('unreadMessages').innerText = messagesCount;
}

// 🔥 تم تحديث هذه الدالة بالكامل لحساب نسبة التقدم الحقيقية للطلاب 🔥
function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    if(loadingState) loadingState.style.display = 'block';
    if(emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentTeacher = getCurrentUser();
        const students = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);
        
        // جلب سجلات الدروس مرة واحدة لتسريع الأداء
        const allStudentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
        
        if(loadingState) loadingState.style.display = 'none';
        
        if (students.length === 0) {
            if(emptyState) emptyState.style.display = 'block';
            return;
        }

        tableBody.innerHTML = students.map((student, index) => {
            // حساب نسبة التقدم الموحدة
            const myLessons = allStudentLessons.filter(l => String(l.studentId) === String(student.id));
            let progressPct = 0;
            if (myLessons.length > 0) {
                const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
                progressPct = Math.round((completed / myLessons.length) * 100);
            }

            // تحديد لون شريط التقدم بذكاء
            const progressColor = progressPct >= 80 ? 'success' : progressPct >= 50 ? 'warning' : 'danger';
            const hexColor = progressPct >= 80 ? '#28a745' : progressPct >= 50 ? '#ffc107' : '#dc3545';

            return `
            <tr>
                <td>${index + 1}</td>
                <td style="font-weight: bold; color: #2c3e50;">${student.name}</td>
                <td>${student.grade}</td>
                <td>${student.subject || 'عام'}</td>
                <td style="width: 200px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="text-${progressColor}" style="font-weight:bold; min-width:35px; text-align:right;">${progressPct}%</span>
                        <div style="flex-grow:1; background:#e9ecef; height:8px; border-radius:5px; overflow:hidden;">
                            <div style="width: ${progressPct}%; background-color: ${hexColor}; height:100%; transition: width 0.4s ease;"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="student-actions" style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-primary" onclick="openStudentFile(${student.id})"><i class="fas fa-folder-open"></i> ملف</button>
                        <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id})"><i class="fas fa-key"></i> بيانات</button>
                        <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="btn btn-sm btn-info" onclick="exportStudentData(${student.id})"><i class="fas fa-file-export"></i> تصدير</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }, 200);
}

function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) return alert('يرجى ملء جميع الحقول');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const allAccounts = [...users, ...committeeMembers];
    const currentTeacher = getCurrentUser();

    let username = '';
    let password = '123';
    let isUnique = false;

    while (!isUnique) {
        username = 's_' + Math.floor(Math.random() * 10000);
        const exists = allAccounts.some(u => String(u.username) === String(username) && String(u.password) === String(password));
        if (!exists) isUnique = true;
    }

    const newStudent = {
        id: Date.now(), teacherId: currentTeacher.id, role: 'student', name: name, grade: grade, subject: subject, username: username, password: password, progress: 0, createdAt: new Date().toISOString()
    };
    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));
    alert('تم إضافة الطالب بنجاح ✅');
    closeAddStudentModal(); loadStudentsData();
}

function editStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id == studentId);
    if (!student) return;
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentGrade').value = student.grade;
    document.getElementById('editStudentSubject').value = student.subject;
    if(document.getElementById('editStudentUsername')) document.getElementById('editStudentUsername').value = student.username || '';
    if(document.getElementById('editStudentPassword')) document.getElementById('editStudentPassword').value = '';
    document.getElementById('editStudentModal').classList.add('show');
}

function updateStudentData() {
    const idInput = document.getElementById('editStudentId').value;
    const currentId = String(idInput);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => String(u.id) === currentId);

    if (index !== -1) {
        const currentUser = users[index];
        const newName = document.getElementById('editStudentName').value.trim();
        const newGrade = document.getElementById('editStudentGrade').value;
        const newSubject = document.getElementById('editStudentSubject').value;
        
        let finalUsername = document.getElementById('editStudentUsername').value.trim() || currentUser.username;
        let finalPassword = document.getElementById('editStudentPassword').value.trim() || currentUser.password;

        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const allAccounts = [...users, ...committeeMembers];

        const duplicateUser = allAccounts.find(u => {
            if (String(u.id) === currentId) return false;
            const uName = String(u.username || '').trim();
            const uPass = String(u.password || '').trim();
            return uName === String(finalUsername) && uPass === String(finalPassword);
        });
        
        if (duplicateUser) {
            alert('اسم المستخدم غير متاح . يرجى اختيار اسم آخر');
            return;
        }

        users[index].name = newName; users[index].grade = newGrade; users[index].subject = newSubject;
        users[index].username = finalUsername; users[index].password = finalPassword;
        localStorage.setItem('users', JSON.stringify(users));
        alert('تم التحديث بنجاح ✅');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    } else { alert('خطأ: الطالب غير موجود.'); }
}

function deleteStudent(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف هذا الطالب؟ <br><small>سيتم حذف جميع سجلاته ودرجاته نهائياً.</small>', function() {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.id != studentId);
        localStorage.setItem('users', JSON.stringify(users));
        
        // تنظيف بيانات الطالب المحذوف من الجداول الأخرى للحفاظ على مساحة التخزين
        cleanStudentOldData(studentId);
        
        showSuccess('تم الحذف بنجاح');
        loadStudentsData();
    });
}

function exportStudentData(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id == studentId);
    if (!student) return alert('بيانات الطالب غير موجودة');
    const exportData = {
        info: student,
        data: {
            tests: getStudentData('studentTests', studentId),
            lessons: getStudentData('studentLessons', studentId),
            assignments: getStudentData('studentAssignments', studentId),
            progress: getStudentData('studentProgress', studentId),
            events: getStudentData('studentEvents', studentId),
            activities: getStudentData('studentActivities', studentId)
        }, meta: { exportedBy: getCurrentUser().name, date: new Date().toISOString() }
    };
    const fileName = `student_${student.name}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function showImportStudentModal() {
    const fileInput = document.getElementById('studentJsonFile'); if(fileInput) fileInput.value = '';
    const modal = document.getElementById('importStudentModal'); if(modal) modal.classList.add('show');
}

function processStudentImport() {
    const fileInput = document.getElementById('studentJsonFile');
    if (!fileInput || !fileInput.files[0]) return alert('يرجى اختيار ملف الطالب أولاً');
    const currentUser = getCurrentUser();
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.info || !imported.data) throw new Error('الملف غير صالح');
            const studentInfo = imported.info;
            studentInfo.teacherId = currentUser.id; 

            let users = JSON.parse(localStorage.getItem('users') || '[]');
            const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
            const allAccounts = [...users, ...committeeMembers];

            const collision = allAccounts.find(u => u.username === studentInfo.username && u.password === studentInfo.password && u.id != studentInfo.id);

            if(collision && collision.id != studentInfo.id) {
                studentInfo.username = studentInfo.username + '_imp';
                alert('تنبيه: تم تعديل اسم المستخدم تلقائياً لوجود تطابق في البيانات.');
            }

            const existingIndex = users.findIndex(u => u.username === studentInfo.username);
            
            const doImport = () => {
                users.push(studentInfo);
                localStorage.setItem('users', JSON.stringify(users));
                mergeData('studentTests', imported.data.tests); mergeData('studentLessons', imported.data.lessons); mergeData('studentAssignments', imported.data.assignments); mergeData('studentProgress', imported.data.progress); mergeData('studentEvents', imported.data.events); mergeData('studentActivities', imported.data.activities);
                alert('تم الاستيراد بنجاح'); closeModal('importStudentModal'); loadStudentsData();
            };

            if (existingIndex !== -1) {
                showConfirmModal(`الطالب "${studentInfo.name}" موجود. هل تريد تحديث بياناته؟`, function() {
                    cleanStudentOldData(users[existingIndex].id);
                    users.splice(existingIndex, 1);
                    doImport();
                });
            } else {
                doImport();
            }

        } catch (err) { alert('خطأ: ' + err.message); }
    }; reader.readAsText(fileInput.files[0]);
}

function getStudentData(key, id) { return JSON.parse(localStorage.getItem(key) || '[]').filter(x => x.studentId == id); }
function mergeData(key, newData) { if (!newData || !newData.length) return; let current = JSON.parse(localStorage.getItem(key) || '[]'); current = current.filter(x => x.studentId != newData[0].studentId); localStorage.setItem(key, JSON.stringify([...current, ...newData])); }
function cleanStudentOldData(id) { ['studentTests', 'studentLessons', 'studentAssignments', 'studentEvents'].forEach(key => { let data = JSON.parse(localStorage.getItem(key) || '[]'); localStorage.setItem(key, JSON.stringify(data.filter(x => String(x.studentId) !== String(id)))); }); }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function showStudentLoginData(id) { const users = JSON.parse(localStorage.getItem('users') || '[]'); const s = users.find(u => u.id == id); if(s) { document.getElementById('loginDataUsername').value = s.username; document.getElementById('loginDataPassword').value = s.password; document.getElementById('studentLoginDataModal').classList.add('show'); } }
function copyToClipboard(id) { const el = document.getElementById(id); el.select(); document.execCommand('copy'); alert('تم النسخ'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); }
function searchStudents() { const term = document.getElementById('studentSearch').value.toLowerCase(); document.querySelectorAll('#studentsTableBody tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none'; }); }
function filterStudents() { const grade = document.getElementById('gradeFilter').value; document.querySelectorAll('#studentsTableBody tr').forEach(row => { row.style.display = (grade === 'all' || row.children[2].innerText.includes(grade)) ? '' : 'none'; }); }

window.addNewStudent = addNewStudent; window.editStudent = editStudent; window.updateStudentData = updateStudentData;
window.deleteStudent = deleteStudent; window.openStudentFile = openStudentFile; window.showStudentLoginData = showStudentLoginData;
window.copyToClipboard = copyToClipboard; window.loadStudentsData = loadStudentsData; window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal; window.showImportStudentModal = showImportStudentModal; window.exportStudentData = exportStudentData;
window.processStudentImport = processStudentImport; window.searchStudents = searchStudents; window.filterStudents = filterStudents; window.closeModal = closeModal;

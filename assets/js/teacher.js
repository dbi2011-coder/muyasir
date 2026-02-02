// ============================================
// 📁 المسار: assets/js/teacher.js
// الوصف: إدارة المعلم + نظام منع التكرار الصارم (النسخة المحسنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) {
        initializeTeacherDashboard();
    } else if (path.includes('students.html')) {
        initializeStudentsPage();
    }
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

// ============================================
// 1. تحديث إحصائيات لوحة التحكم
// ============================================
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

// ============================================
// 2. إدارة الطلاب (إضافة / تعديل / حذف)
// ============================================
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
        
        if(loadingState) loadingState.style.display = 'none';
        
        if (students.length === 0) {
            if(emptyState) emptyState.style.display = 'block';
            return;
        }

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
                        <div class="student-actions" style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-primary" onclick="openStudentFile(${student.id})" title="ملف الطالب">
                                <i class="fas fa-file-alt"></i> ملف
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id})" title="بيانات الدخول">
                                <i class="fas fa-key"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="exportStudentData(${student.id})" title="تصدير ملف الطالب">
                                <i class="fas fa-file-export"></i> تصدير
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }, 200);
}

function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) {
        if(typeof showAuthNotification === 'function') showAuthNotification('يرجى ملء جميع الحقول', 'error');
        else alert('يرجى ملء جميع الحقول');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentTeacher = getCurrentUser();

    // 🔥 توليد اسم مستخدم فريد (يضمن عدم التكرار عند الإنشاء)
    let username = '';
    let password = '123';
    let isUnique = false;

    // محاولة التوليد حتى نجد زوجاً غير مكرر
    while (!isUnique) {
        username = 's_' + Math.floor(Math.random() * 10000);
        
        // التحقق من وجود مستخدم بنفس الاسم وكلمة المرور
        const exists = users.some(u => 
            (u.username || '').trim() === username && 
            (u.password || '').trim() === password
        );
        
        if (!exists) {
            isUnique = true;
        }
    }

    const newStudent = {
        id: Date.now(),
        teacherId: currentTeacher.id,
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        username: username,
        password: password,
        progress: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));

    if(typeof showAuthNotification === 'function') showAuthNotification('تم إضافة الطالب بنجاح ✅', 'success');
    else alert('تم إضافة الطالب بنجاح ✅');
    
    closeAddStudentModal();
    loadStudentsData();
}

function editStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId);
    if (!student) return;

    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentGrade').value = student.grade;
    document.getElementById('editStudentSubject').value = student.subject;
    
    // تعبئة الحقول
    if(document.getElementById('editStudentUsername')) document.getElementById('editStudentUsername').value = student.username || '';
    if(document.getElementById('editStudentPassword')) document.getElementById('editStudentPassword').value = ''; // نتركها فارغة للأمان

    document.getElementById('editStudentModal').classList.add('show');
}

function updateStudentData() {
    // التأكد من تحويل المعرف إلى نفس النوع المستخدم في التخزين
    const idStr = document.getElementById('editStudentId').value; 
    const id = Number(idStr); // أو parseInt

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id == id); // == للتعامل مع اختلاف الأنواع string/number

    if (index !== -1) {
        const currentUser = users[index];

        const newName = document.getElementById('editStudentName').value.trim();
        const newGrade = document.getElementById('editStudentGrade').value;
        const newSubject = document.getElementById('editStudentSubject').value;
        
        // التحقق من اسم المستخدم الجديد (تنظيف المسافات)
        let newUsername = document.getElementById('editStudentUsername').value.trim();
        if (!newUsername) newUsername = (currentUser.username || '').trim();
        
        // التحقق من كلمة المرور الجديدة (تنظيف المسافات)
        let newPassword = document.getElementById('editStudentPassword').value.trim();
        if (!newPassword) newPassword = (currentUser.password || '').trim();

        // 🔥🔥🔥 التحقق الصارم والمحسن 🔥🔥🔥
        // 1. تحويل المعرفات لنصوص لضمان المقارنة الصحيحة
        // 2. تنظيف المسافات من بيانات المستخدمين الآخرين
        const duplicateUser = users.find(u => {
            // تجاهل الطالب نفسه
            if (String(u.id) === String(id)) return false;

            const uName = (u.username || '').trim();
            const uPass = (u.password || '').trim();

            // هل يتطابق الاسم وكلمة المرور؟
            return uName === newUsername && uPass === newPassword;
        });
        
        if (duplicateUser) {
            // رسالة خطأ تفصيلية تخبر المعلم بمن هو الطالب المكرر
            const errorMsg = `⛔ عذراً، تكرار بيانات!\n\nبيانات الدخول هذه مطابقة تماماً للطالب: "${duplicateUser.name}".\n\nيجب عليك تغيير "كلمة المرور" لتصبح مختلفة عنه.`;
            
            if(typeof showAuthNotification === 'function') {
                showAuthNotification('بيانات مكررة مع طالب آخر! يرجى تغيير كلمة المرور.', 'error');
                // تنبيه إضافي للتوضيح
                setTimeout(() => alert(errorMsg), 500); 
            } else {
                alert(errorMsg);
            }
            return; // 🛑 إيقاف الحفظ فوراً
        }

        // الحفظ بعد اجتياز الفحص
        users[index].name = newName;
        users[index].grade = newGrade;
        users[index].subject = newSubject;
        users[index].username = newUsername;
        users[index].password = newPassword;

        localStorage.setItem('users', JSON.stringify(users));
        
        if(typeof showAuthNotification === 'function') showAuthNotification('تم تحديث البيانات بنجاح ✅', 'success');
        else alert('تم التحديث بنجاح ✅');

        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    }
}

function deleteStudent(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    // استخدام == لضمان الحذف حتى لو اختلف النوع
    users = users.filter(u => u.id != studentId);
    localStorage.setItem('users', JSON.stringify(users));
    loadStudentsData();
}

// ============================================
// 🚀 3. نظام نقل الطلاب (Import / Export)
// ============================================

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
        },
        meta: {
            exportedBy: getCurrentUser().name,
            date: new Date().toISOString()
        }
    };

    const fileName = `student_${student.name.replace(/\s+/g, '_')}.json`;
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function showImportStudentModal() {
    const fileInput = document.getElementById('studentJsonFile');
    if(fileInput) fileInput.value = '';
    
    const modal = document.getElementById('importStudentModal');
    if(modal) modal.classList.add('show');
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
            const existingIndex = users.findIndex(u => u.username === studentInfo.username);
            
            if (existingIndex !== -1) {
                if (!confirm(`الطالب "${studentInfo.name}" موجود لدى معلم آخر . هل تريد نقله إليك ؟`)) return;
                cleanStudentOldData(users[existingIndex].id);
                users.splice(existingIndex, 1);
            }

            users.push(studentInfo);
            localStorage.setItem('users', JSON.stringify(users));

            mergeData('studentTests', imported.data.tests);
            mergeData('studentLessons', imported.data.lessons);
            mergeData('studentAssignments', imported.data.assignments);
            mergeData('studentProgress', imported.data.progress);
            mergeData('studentEvents', imported.data.events);
            mergeData('studentActivities', imported.data.activities);

            if(typeof showAuthNotification === 'function') showAuthNotification(`تم استيراد الطالب "${studentInfo.name}" بنجاح! 🎉`, 'success');
            else alert(`تم استيراد الطالب "${studentInfo.name}" بنجاح! 🎉`);

            closeModal('importStudentModal');
            loadStudentsData();

        } catch (err) {
            alert('حدث خطأ: ملف غير صالح.');
            console.error(err);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

// دوال مساعدة للاستيراد والتصدير
function getStudentData(key, id) {
    return JSON.parse(localStorage.getItem(key) || '[]').filter(x => x.studentId == id);
}

function mergeData(key, newData) {
    if (!newData || !newData.length) return;
    let current = JSON.parse(localStorage.getItem(key) || '[]');
    current = current.filter(x => x.studentId != newData[0].studentId);
    localStorage.setItem(key, JSON.stringify([...current, ...newData]));
}

function cleanStudentOldData(id) {
    ['studentTests', 'studentLessons', 'studentAssignments', 'studentEvents'].forEach(key => {
        let data = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(data.filter(x => x.studentId != id)));
    });
}

// أدوات عامة
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function showStudentLoginData(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const s = users.find(u => u.id == id);
    if(s) {
        document.getElementById('loginDataUsername').value = s.username;
        document.getElementById('loginDataPassword').value = s.password;
        document.getElementById('studentLoginDataModal').classList.add('show');
    }
}
function copyToClipboard(id) {
    const el = document.getElementById(id);
    el.select();
    document.execCommand('copy');
    if(typeof showAuthNotification === 'function') showAuthNotification('تم النسخ للحافظة', 'success');
    else alert('تم النسخ');
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); }
function searchStudents() {
    const term = document.getElementById('studentSearch').value.toLowerCase();
    document.querySelectorAll('#studentsTableBody tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
}
function filterStudents() {
    const grade = document.getElementById('gradeFilter').value;
    document.querySelectorAll('#studentsTableBody tr').forEach(row => {
        row.style.display = (grade === 'all' || row.children[2].innerText.includes(grade)) ? '' : 'none';
    });
}

// تصدير الدوال
window.addNewStudent = addNewStudent;
window.editStudent = editStudent;
window.updateStudentData = updateStudentData;
window.deleteStudent = deleteStudent;
window.openStudentFile = openStudentFile;
window.showStudentLoginData = showStudentLoginData;
window.copyToClipboard = copyToClipboard;
window.loadStudentsData = loadStudentsData;
window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.showImportStudentModal = showImportStudentModal;
window.exportStudentData = exportStudentData;
window.processStudentImport = processStudentImport;
window.searchStudents = searchStudents;
window.filterStudents = filterStudents;
window.closeModal = closeModal;

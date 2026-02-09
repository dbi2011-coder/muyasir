// ============================================
// 📁 الملف: assets/js/admin.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const user = getAdminSession();
    if(document.getElementById('userName')) {
        document.getElementById('userName').textContent = user ? user.name : 'المدير';
    }
    if (document.getElementById('teachersTableBody')) loadTeachersData();
    if (document.getElementById('teachersCount')) loadAdminStats();
});

function getAdminSession() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) { return null; }
}

function loadTeachersData() {
    const tableBody = document.getElementById('teachersTableBody');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    if (!tableBody) return;
    if (loading) loading.style.display = 'none';

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachers = users.filter(u => u.role === 'teacher');

    if (teachers.length === 0) {
        if (empty) empty.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }
    if (empty) empty.style.display = 'none';

    tableBody.innerHTML = teachers.map((teacher, index) => {
        const sCount = users.filter(u => u.role === 'student' && u.teacherId == teacher.id).length;
        const isActive = teacher.status !== 'suspended';
        const statusBadge = isActive ? '<span class="badge bg-success" style="color:white; padding:5px;">نشط</span>' : '<span class="badge bg-danger" style="color:white; padding:5px;">موقوف</span>';
        const toggleClass = isActive ? 'btn-warning' : 'btn-success';
        const toggleText = isActive ? 'إيقاف' : 'تفعيل';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.username}</td>
                <td>${teacher.phone || '-'}</td>
                <td>${sCount}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn btn-sm btn-dark" onclick="exportTeacherData(${teacher.id})">تصدير</button>
                        <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})">تعديل</button>
                        <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})">بيانات</button>
                        <button class="btn btn-sm ${toggleClass}" onclick="toggleTeacherStatus(${teacher.id})">${toggleText}</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">حذف</button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(document.getElementById('teachersCount')) document.getElementById('teachersCount').textContent = users.filter(u => u.role === 'teacher').length;
    if(document.getElementById('activeTeachers')) document.getElementById('activeTeachers').textContent = users.filter(u => u.role === 'teacher' && u.status === 'active').length;
    if(document.getElementById('inactiveTeachers')) document.getElementById('inactiveTeachers').textContent = users.filter(u => u.role === 'teacher' && u.status === 'inactive').length;
    if(document.getElementById('suspendedTeachers')) document.getElementById('suspendedTeachers').textContent = users.filter(u => u.role === 'teacher' && u.status === 'suspended').length;
}

function showAddTeacherModal() {
    clearValue('teacherName'); clearValue('teacherUsername'); clearValue('teacherPassword'); clearValue('teacherPhone');
    clearValue('newTeacherName'); clearValue('newTeacherUsername'); clearValue('newTeacherPassword');
    const modal = document.getElementById('addTeacherModal'); if(modal) modal.classList.add('show');
}
function closeAddTeacherModal() { const modal = document.getElementById('addTeacherModal'); if(modal) modal.classList.remove('show'); }

// 🔥 دالة إضافة معلم (مع التمويه)
function addNewTeacher() {
    const nameVal = getValue('teacherName') || getValue('newTeacherName');
    const userVal = getValue('teacherUsername') || getValue('newTeacherUsername');
    const passVal = getValue('teacherPassword') || getValue('newTeacherPassword');
    const phoneVal = getValue('teacherPhone') || '';

    if (!nameVal || !userVal || !passVal) return alert('البيانات ناقصة');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const allAccounts = [...users, ...committeeMembers];

    // التحقق من وجود الحساب (اسم + مرور)
    const isDuplicate = allAccounts.some(u => u.username === userVal && u.password === passVal);
    
    if (isDuplicate) {
        // ✅ تم تغيير الرسالة
        alert('اسم المستخدم غير متاح . يرجى اختيار اسم آخر');
        return;
    }

    users.push({
        id: Date.now(), role: 'teacher', name: nameVal, username: userVal, password: passVal, phone: phoneVal, status: 'active', createdAt: new Date().toISOString()
    });

    localStorage.setItem('users', JSON.stringify(users));
    alert('تمت الإضافة بنجاح ✅');
    closeAddTeacherModal(); loadTeachersData(); loadAdminStats();
}

function saveNewTeacher() { addNewTeacher(); }

function deleteTeacher(id) {
    if(!confirm('هل أنت متأكد من حذف المعلم وجميع طلابه؟')) return;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id !== id);
    users = users.filter(u => !(u.role === 'student' && u.teacherId == id));
    localStorage.setItem('users', JSON.stringify(users));
    let sch = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    localStorage.setItem('teacherSchedule', JSON.stringify(sch.filter(s => s.teacherId != id)));
    alert('تم الحذف'); loadTeachersData(); loadAdminStats();
}

function toggleTeacherStatus(id) {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id === id);
    if(idx !== -1) { users[idx].status = (users[idx].status === 'active' ? 'suspended' : 'active'); localStorage.setItem('users', JSON.stringify(users)); loadTeachersData(); }
}

function editTeacher(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const t = users.find(u => u.id === id);
    if(t) {
        const newName = prompt('تعديل الاسم:', t.name);
        if(newName) { t.name = newName; localStorage.setItem('users', JSON.stringify(users)); loadTeachersData(); }
    }
}

function viewTeacherCredentials(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const t = users.find(u => u.id === id);
    if(!t) return;
    setValue('viewTeacherId', t.id); setText('viewTeacherName', t.name); setText('viewTeacherUsername', t.username); setValue('viewTeacherPassword', t.password);
    const modal = document.getElementById('viewCredentialsModal'); if(modal) modal.classList.add('show');
}

function editTeacherCredentials() {
    const id = document.getElementById('viewTeacherId').value;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const t = users.find(u => u.id == id);
    if(!t) return;
    closeModalElement('viewCredentialsModal');
    setValue('editCredTeacherId', t.id); setValue('editCredTeacherName', t.name); setValue('editCredTeacherUsername', t.username); setValue('editCredTeacherPassword', '');
    setTimeout(() => { const editModal = document.getElementById('editCredentialsModal'); if(editModal) editModal.classList.add('show'); }, 200);
}

// 🔥 دالة حفظ بيانات الدخول (مع التمويه)
function saveTeacherCredentials() {
    const id = document.getElementById('editCredTeacherId').value;
    const newUser = document.getElementById('editCredTeacherUsername').value.trim();
    const newPass = document.getElementById('editCredTeacherPassword').value.trim();

    if(!newUser) return alert('اسم المستخدم مطلوب');

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id == id);
    if(idx === -1) return;

    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const allAccounts = [...users, ...committeeMembers];
    const checkPass = (newPass && newPass.length >= 1) ? newPass : users[idx].password;

    const isDuplicate = allAccounts.some(u => {
        if(u.id == id) return false;
        return u.username === newUser && u.password === checkPass;
    });

    if(isDuplicate) {
        // ✅ تم تغيير الرسالة
        alert('اسم المستخدم غير متاح . يرجى اختيار اسم آخر');
        return;
    }

    users[idx].username = newUser;
    if(newPass && newPass.length >= 1) users[idx].password = newPass;
    localStorage.setItem('users', JSON.stringify(users));
    alert('تم التحديث بنجاح');
    closeModalElement('editCredentialsModal');
    setTimeout(() => viewTeacherCredentials(parseInt(id)), 300); loadTeachersData();
}

function exportTeacherData(teacherId) {
    if (!confirm('تصدير بيانات المعلم؟')) return;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacherProfile = users.find(u => u.id == teacherId);
    if (!teacherProfile) return alert('المعلم غير موجود');

    const teacherStudents = users.filter(u => u.role === 'student' && u.teacherId == teacherId);
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const teacherSchedule = allSchedules.filter(s => s.teacherId == teacherId);
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const teacherTests = allTests.filter(t => t.authorId == teacherId || t.teacherId == teacherId);
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const teacherLessons = allLessons.filter(l => l.authorId == teacherId || l.teacherId == teacherId);
    const allAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const teacherAssignments = allAssignments.filter(a => a.authorId == teacherId || a.teacherId == teacherId);

    const exportData = {
        meta: { type: 'teacher_backup', version: '1.2', exportedAt: new Date().toISOString() },
        profile: teacherProfile,
        data: { students: teacherStudents, schedule: teacherSchedule, tests: teacherTests, lessons: teacherLessons, assignments: teacherAssignments }
    };
    const fileName = `Teacher_${teacherProfile.name}_${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function importTeacherData() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const d = JSON.parse(event.target.result);
                if (!d.meta || d.meta.type !== 'teacher_backup') return alert('ملف غير صالح');
                if (!confirm(`استيراد المعلم: ${d.profile.name}؟`)) return;
                
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const idx = users.findIndex(u => u.id == d.profile.id);
                if(idx !== -1) users[idx] = d.profile; else users.push(d.profile);
                
                if(d.data.students) d.data.students.forEach(s => {
                    const si = users.findIndex(u => u.id == s.id);
                    if(si !==-1) users[si] = s; else users.push(s);
                });
                localStorage.setItem('users', JSON.stringify(users));
                
                const merge = (k, nd) => {
                    if(!nd) return;
                    let cur = JSON.parse(localStorage.getItem(k)||'[]');
                    let fil = cur.filter(x => !nd.some(n => n.id == x.id));
                    localStorage.setItem(k, JSON.stringify([...fil, ...nd]));
                };
                merge('teacherSchedule', d.data.schedule); merge('tests', d.data.tests);
                merge('lessons', d.data.lessons); merge('assignments', d.data.assignments);
                alert('تم الاستيراد'); loadTeachersData(); loadAdminStats();
            } catch(er) { alert('خطأ: '+er.message); }
        }; reader.readAsText(file);
    }; input.click();
}

function getValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setValue(id, val) { const el = document.getElementById(id); if(el) el.value = val; }
function setText(id, txt) { const el = document.getElementById(id); if(el) el.textContent = txt; }
function clearValue(id) { const el = document.getElementById(id); if(el) el.value = ''; }
function closeModalElement(id) { const m = document.getElementById(id); if(m) m.classList.remove('show'); }
function togglePasswordVisibility() { const el = document.getElementById('viewTeacherPassword'); if(el) el.type = (el.type === 'password' ? 'text' : 'password'); }
function copyToClipboard(type) {
    let txt = '';
    if(type === 'username') txt = document.getElementById('viewTeacherUsername').innerText;
    if(type === 'password') txt = document.getElementById('viewTeacherPassword').value;
    navigator.clipboard.writeText(txt).then(() => alert('تم النسخ'));
}

window.showAddTeacherModal = showAddTeacherModal; window.closeAddTeacherModal = closeAddTeacherModal;
window.addNewTeacher = addNewTeacher; window.saveNewTeacher = saveNewTeacher;
window.deleteTeacher = deleteTeacher; window.toggleTeacherStatus = toggleTeacherStatus;
window.editTeacher = editTeacher; window.viewTeacherCredentials = viewTeacherCredentials;
window.editTeacherCredentials = editTeacherCredentials; window.saveTeacherCredentials = saveTeacherCredentials;
window.closeViewCredentialsModal = () => closeModalElement('viewCredentialsModal');
window.closeEditCredentialsModal = () => closeModalElement('editCredentialsModal');
window.togglePasswordVisibility = togglePasswordVisibility; window.copyToClipboard = copyToClipboard;
window.exportTeacherData = exportTeacherData; window.importTeacherData = importTeacherData;

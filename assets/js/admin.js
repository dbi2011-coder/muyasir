// ============================================
// 📁 الملف: assets/js/admin.js
// الوصف: إدارة المعلمين في لوحة المدير (Supabase Version)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if(user && user.role === 'admin') {
        if(document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name || 'المدير';
        }
        if (document.getElementById('teachersTableBody')) loadTeachersData();
        if (document.getElementById('teachersCount')) loadAdminStats();
    }
});

// 🌟 جلب المعلمين من Supabase
async function loadTeachersData() {
    const tableBody = document.getElementById('teachersTableBody');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    if (!tableBody) return;
    if (loading) loading.style.display = 'block';
    if (empty) empty.style.display = 'none';

    try {
        const { data: teachers, error } = await supa
            .from('users')
            .select('*')
            .eq('role', 'teacher')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        if (loading) loading.style.display = 'none';

        if (!teachers || teachers.length === 0) {
            if (empty) empty.style.display = 'block';
            tableBody.innerHTML = '';
            return;
        }

        // جلب عدد الطلاب لكل معلم
        const { data: students } = await supa.from('users').select('teacherId').eq('role', 'student');
        
        tableBody.innerHTML = teachers.map((teacher, index) => {
            const sCount = students ? students.filter(s => s.teacherId == teacher.id).length : 0;
            const isActive = teacher.status !== 'suspended';
            const statusBadge = isActive ? '<span class="badge bg-success" style="color:white; padding:5px;">نشط</span>' : '<span class="badge bg-danger" style="color:white; padding:5px;">موقوف</span>';
            const toggleClass = isActive ? 'btn-warning' : 'btn-success';
            const toggleText = isActive ? 'إيقاف' : 'تفعيل';

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td style="font-weight:bold;">${teacher.name}</td>
                    <td>${teacher.username}</td>
                    <td dir="ltr">${teacher.phone || '-'}</td>
                    <td>${sCount}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display:flex; gap:5px; justify-content:center;">
                            <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})">تعديل</button>
                            <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})">بيانات</button>
                            <button class="btn btn-sm ${toggleClass}" onclick="toggleTeacherStatus(${teacher.id}, '${teacher.status}')">${toggleText}</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">حذف</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

    } catch (err) {
        console.error(err);
        if (loading) loading.style.display = 'none';
        alert('حدث خطأ أثناء جلب بيانات المعلمين من السيرفر.');
    }
}

// 🌟 جلب إحصائيات المدير
async function loadAdminStats() {
    try {
        const { data: teachers } = await supa.from('users').select('status').eq('role', 'teacher');
        const { count: studentsCount } = await supa.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');

        if(teachers) {
            if(document.getElementById('teachersCount')) document.getElementById('teachersCount').textContent = teachers.length;
            if(document.getElementById('activeTeachers')) document.getElementById('activeTeachers').textContent = teachers.filter(t => t.status === 'active').length;
            if(document.getElementById('inactiveTeachers')) document.getElementById('inactiveTeachers').textContent = teachers.filter(t => t.status === 'inactive').length;
            if(document.getElementById('suspendedTeachers')) document.getElementById('suspendedTeachers').textContent = teachers.filter(t => t.status === 'suspended').length;
        }
        if(document.getElementById('studentsCount')) document.getElementById('studentsCount').textContent = studentsCount || 0;
        
        // إحصائيات افتراضية للوحة التحكم
        if(document.getElementById('activeSessions')) document.getElementById('activeSessions').textContent = Math.floor(Math.random() * 5) + 1; 
        if(document.getElementById('pendingActions')) document.getElementById('pendingActions').textContent = teachers ? teachers.filter(t => t.status === 'suspended').length : 0;
    } catch(e) { console.error(e); }
}

// 🌟 إضافة معلم جديد لـ Supabase
async function addNewTeacher() {
    const nameVal = document.getElementById('teacherName').value.trim();
    const userVal = document.getElementById('teacherUsername').value.trim();
    const passVal = document.getElementById('teacherPassword').value.trim();
    const phoneVal = document.getElementById('teacherPhone').value.trim();

    if (!nameVal || !userVal || !passVal) return alert('الرجاء ملء الحقول الإجبارية');

    try {
        // التحقق من أن اسم المستخدم غير مكرر
        const { data: existingUser } = await supa.from('users').select('id').eq('username', userVal).maybeSingle();
        if (existingUser) return alert('اسم المستخدم هذا مستخدم مسبقاً، يرجى اختيار اسم آخر.');

        const newTeacher = {
            id: Date.now(),
            role: 'teacher',
            name: nameVal,
            username: userVal,
            password: passVal,
            phone: phoneVal,
            status: 'active'
        };

        const { error } = await supa.from('users').insert([newTeacher]);
        if (error) throw error;

        alert('تمت إضافة المعلم بنجاح ✅');
        document.getElementById('addTeacherForm').reset();
        closeAddTeacherModal();
        loadTeachersData();
        loadAdminStats();
    } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء الإضافة. تأكد من اتصالك بالسيرفر.');
    }
}

// 🌟 حذف معلم
async function deleteTeacher(id) {
    if(confirm('⚠️ هل أنت متأكد تماماً؟ سيتم حذف المعلم نهائياً من قاعدة البيانات.')) {
        try {
            await supa.from('users').delete().eq('id', id);
            alert('تم الحذف بنجاح');
            loadTeachersData();
            loadAdminStats();
        } catch(e) {
            console.error(e);
            alert('خطأ في الحذف');
        }
    }
}

// 🌟 إيقاف/تفعيل المعلم
async function toggleTeacherStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
        await supa.from('users').update({ status: newStatus }).eq('id', id);
        loadTeachersData();
        loadAdminStats();
    } catch(e) { console.error(e); }
}

// 🌟 تعديل الاسم السريع
async function editTeacher(id) {
    try {
        const { data: t } = await supa.from('users').select('name').eq('id', id).single();
        if(t) {
            const newName = prompt('تعديل اسم المعلم:', t.name);
            if(newName && newName.trim() !== '') { 
                await supa.from('users').update({ name: newName.trim() }).eq('id', id);
                loadTeachersData(); 
            }
        }
    } catch(e) { console.error(e); }
}

// 🌟 عرض بيانات الدخول
async function viewTeacherCredentials(id) {
    try {
        const { data: t } = await supa.from('users').select('*').eq('id', id).single();
        if(!t) return;
        document.getElementById('viewTeacherId').value = t.id; 
        document.getElementById('viewTeacherName').textContent = t.name; 
        document.getElementById('viewTeacherUsername').textContent = t.username; 
        document.getElementById('viewTeacherPassword').value = t.password;
        
        const modal = document.getElementById('viewCredentialsModal'); 
        if(modal) modal.classList.add('show');
    } catch(e) { console.error(e); }
}

// 🌟 تجهيز نافذة تعديل بيانات الدخول
async function editTeacherCredentials() {
    const id = document.getElementById('viewTeacherId').value;
    try {
        const { data: t } = await supa.from('users').select('*').eq('id', id).single();
        if(!t) return;
        closeModalElement('viewCredentialsModal');
        document.getElementById('editCredTeacherId').value = t.id; 
        document.getElementById('editCredTeacherName').value = t.name; 
        document.getElementById('editCredTeacherUsername').value = t.username; 
        document.getElementById('editCredTeacherPassword').value = '';
        
        setTimeout(() => { 
            const editModal = document.getElementById('editCredentialsModal'); 
            if(editModal) editModal.classList.add('show'); 
        }, 200);
    } catch(e) { console.error(e); }
}

// 🌟 حفظ بيانات الدخول الجديدة
async function saveTeacherCredentials() {
    const id = document.getElementById('editCredTeacherId').value;
    const newUser = document.getElementById('editCredTeacherUsername').value.trim();
    const newPass = document.getElementById('editCredTeacherPassword').value.trim();

    if(!newUser) return alert('اسم المستخدم مطلوب');

    try {
        const { data: existing } = await supa.from('users').select('id').eq('username', newUser).neq('id', id).maybeSingle();
        if (existing) return alert('اسم المستخدم هذا مستخدم مسبقاً!');

        const updates = { username: newUser };
        if (newPass) updates.password = newPass;

        await supa.from('users').update(updates).eq('id', id);

        alert('تم التحديث بنجاح');
        closeModalElement('editCredentialsModal');
        setTimeout(() => viewTeacherCredentials(id), 300); 
        loadTeachersData();
    } catch(e) { console.error(e); alert('خطأ في التحديث'); }
}

// دوال التحكم بالواجهة والنوافذ المنبثقة
function showAddTeacherModal() {
    ['teacherName', 'teacherUsername', 'teacherPassword', 'teacherPhone'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value = '';
    });
    const modal = document.getElementById('addTeacherModal'); if(modal) modal.classList.add('show');
}

function closeAddTeacherModal() { const modal = document.getElementById('addTeacherModal'); if(modal) modal.classList.remove('show'); }
function closeModalElement(id) { const m = document.getElementById(id); if(m) m.classList.remove('show'); }
function togglePasswordVisibility() { const el = document.getElementById('viewTeacherPassword'); if(el) el.type = (el.type === 'password' ? 'text' : 'password'); }
function copyToClipboard(txt, type) { navigator.clipboard.writeText(txt).then(() => alert('تم النسخ')); }

function searchTeachers() {
    const term = document.getElementById('teacherSearch').value.toLowerCase();
    document.querySelectorAll('#teachersTableBody tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
}

function filterTeachers() {
    const status = document.getElementById('statusFilter').value;
    document.querySelectorAll('#teachersTableBody tr').forEach(row => {
        if (status === 'all') row.style.display = '';
        else if (status === 'active') row.style.display = row.innerText.includes('نشط') ? '' : 'none';
        else if (status === 'suspended') row.style.display = row.innerText.includes('موقوف') ? '' : 'none';
    });
}

// تصدير الدوال للملفات الأخرى
window.showAddTeacherModal = showAddTeacherModal; 
window.closeAddTeacherModal = closeAddTeacherModal;
window.addNewTeacher = addNewTeacher;
window.deleteTeacher = deleteTeacher; 
window.toggleTeacherStatus = toggleTeacherStatus;
window.editTeacher = editTeacher; 
window.viewTeacherCredentials = viewTeacherCredentials;
window.editTeacherCredentials = editTeacherCredentials; 
window.saveTeacherCredentials = saveTeacherCredentials;
window.closeViewCredentialsModal = () => closeModalElement('viewCredentialsModal');
window.closeEditCredentialsModal = () => closeModalElement('editCredentialsModal');
window.togglePasswordVisibility = togglePasswordVisibility; 
window.copyToClipboard = copyToClipboard;
window.searchTeachers = searchTeachers;
window.filterTeachers = filterTeachers;
window.exportTeacherData = function() { alert('ميزة التصدير والاستيراد للمدير سيتم ربطها لاحقاً بالسيرفر.'); };
window.importTeacherData = function() { alert('ميزة التصدير والاستيراد للمدير سيتم ربطها لاحقاً بالسيرفر.'); };

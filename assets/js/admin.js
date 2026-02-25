// ============================================
// 📁 الملف: assets/js/admin.js (النسخة السحابية الكاملة + الاستيراد والتصدير)
// ============================================

// =========================================================
// 🔥 دوال النوافذ المنبثقة والإشعارات 🔥
// =========================================================
if (!window.showConfirmModal) {
    window.showConfirmModal = function(message, onConfirm) {
        let modal = document.getElementById('globalConfirmModal');
        if (!modal) {
            const modalHtml = `<div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-trash-alt"></i></div><div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div><div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.5;"></div><div style="display:flex; gap:15px; justify-content:center;"><button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button><button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button></div></div></div><style>@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }</style>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalConfirmModal');
        }
        document.getElementById('globalConfirmMessage').innerHTML = message;
        modal.style.display = 'flex';
        document.getElementById('globalConfirmOk').onclick = function() { modal.style.display = 'none'; if (typeof onConfirm === 'function') onConfirm(); };
        document.getElementById('globalConfirmCancel').onclick = function() { modal.style.display = 'none'; };
    };
}

if (!window.showSuccess) {
    window.showSuccess = function(message) {
        let toast = document.getElementById('globalSuccessToast');
        if (!toast) {
            const toastHtml = `<div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span></div>`;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalSuccessToast');
        }
        document.getElementById('globalSuccessMessage').textContent = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    };
}

if (!window.showError) {
    window.showError = function(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            const toastHtml = `<div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span></div>`;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalErrorToast');
        }
        document.getElementById('globalErrorMessage').innerHTML = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
    };
}

if (!window.showAuthNotification) {
    window.showAuthNotification = function(message, type = 'info') {
        if(type === 'success') showSuccess(message);
        else if(type === 'error') showError(message);
        else alert(message);
    };
}

// =========================================================
// العمليات الأساسية للمدير
// =========================================================

document.addEventListener('DOMContentLoaded', async function() {
    const user = getAdminSession();
    if(document.getElementById('userName')) {
        document.getElementById('userName').textContent = user ? user.name : 'المدير';
    }
    if (document.getElementById('teachersTableBody')) await loadTeachersData();
    if (document.getElementById('teachersCount')) await loadAdminStats();
});

function getAdminSession() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) { return null; }
}

async function loadTeachersData() {
    const tableBody = document.getElementById('teachersTableBody');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    if (!tableBody) return;
    if (loading) loading.style.display = 'block';
    if (empty) empty.style.display = 'none';
    tableBody.innerHTML = '';

    try {
        const { data: teachers, error: teachersError } = await window.supabase
            .from('users')
            .select('*')
            .eq('role', 'teacher')
            .order('id', { ascending: false });

        if (teachersError) throw teachersError;

        if (!teachers || teachers.length === 0) {
            if (empty) empty.style.display = 'block';
            if (loading) loading.style.display = 'none';
            return;
        }

        const { data: students, error: studentsError } = await window.supabase
            .from('users')
            .select('teacherId')
            .eq('role', 'student');

        if (loading) loading.style.display = 'none';

        tableBody.innerHTML = teachers.map((teacher, index) => {
            const sCount = students ? students.filter(s => s.teacherId == teacher.id).length : 0;
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
                            <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})">بيانات</button>
                            <button class="btn btn-sm ${toggleClass}" onclick="toggleTeacherStatus(${teacher.id}, '${teacher.status}')">${toggleText}</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">حذف</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    } catch (error) {
        console.error("Error loading teachers:", error);
        showError("حدث خطأ أثناء جلب بيانات المعلمين");
        if (loading) loading.style.display = 'none';
    }
}

async function loadAdminStats() {
    try {
        const { data: users, error } = await window.supabase.from('users').select('role, status');
        if (error) throw error;

        const teachers = users.filter(u => u.role === 'teacher');
        if(document.getElementById('teachersCount')) document.getElementById('teachersCount').textContent = teachers.length;
        if(document.getElementById('activeTeachers')) document.getElementById('activeTeachers').textContent = teachers.filter(t => t.status === 'active').length;
        if(document.getElementById('inactiveTeachers')) document.getElementById('inactiveTeachers').textContent = teachers.filter(t => t.status === 'inactive').length;
        if(document.getElementById('suspendedTeachers')) document.getElementById('suspendedTeachers').textContent = teachers.filter(t => t.status === 'suspended').length;
    } catch (e) {
        console.error("Stats Error:", e);
    }
}

function showAddTeacherModal() {
    clearValue('teacherName'); clearValue('teacherUsername'); clearValue('teacherPassword'); clearValue('teacherPhone');
    const modal = document.getElementById('addTeacherModal'); if(modal) modal.classList.add('show');
}
function closeAddTeacherModal() { const modal = document.getElementById('addTeacherModal'); if(modal) modal.classList.remove('show'); }

async function addNewTeacher() {
    const nameVal = getValue('teacherName');
    const userVal = getValue('teacherUsername');
    const passVal = getValue('teacherPassword');
    const phoneVal = getValue('teacherPhone');

    if (!nameVal || !userVal || !passVal) return alert('البيانات الإجبارية ناقصة');

    try {
        const { data: existingUser } = await window.supabase.from('users').select('id').eq('username', userVal);
        if (existingUser && existingUser.length > 0) {
            return showError('اسم المستخدم مسجل مسبقاً. يرجى اختيار اسم آخر.');
        }

        const { error } = await window.supabase.from('users').insert([{
            id: Date.now(),
            name: nameVal,
            username: userVal,
            password: passVal,
            phone: phoneVal,
            role: 'teacher',
            status: 'active'
        }]);

        if (error) throw error;

        showSuccess('تمت الإضافة بنجاح ✅');
        closeAddTeacherModal(); 
        loadTeachersData(); 
        loadAdminStats();
    } catch (error) {
        console.error("Add Teacher Error:", error);
        alert("تفاصيل الخطأ: " + (error.message || JSON.stringify(error)));
    }
}

function deleteTeacher(id) {
    showConfirmModal('⚠️ هل أنت متأكد تماماً؟ سيتم حذف المعلم نهائياً.', async function() {
        try {
            const { error } = await window.supabase.from('users').delete().eq('id', id);
            if (error) throw error;
            
            showSuccess('تم الحذف بنجاح');
            loadTeachersData();
            loadAdminStats();
        } catch (error) {
            console.error("Delete Error:", error);
            showError("حدث خطأ أثناء الحذف");
        }
    });
}

async function toggleTeacherStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
        const { error } = await window.supabase.from('users').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        loadTeachersData();
        loadAdminStats();
    } catch (e) {
        console.error("Update Status Error:", e);
    }
}

async function viewTeacherCredentials(id) {
    try {
        const { data: teacher, error } = await window.supabase.from('users').select('*').eq('id', id).single();
        if (error || !teacher) return;

        setValue('viewTeacherId', teacher.id); 
        setText('viewTeacherName', teacher.name); 
        setText('viewTeacherUsername', teacher.username); 
        setValue('viewTeacherPassword', teacher.password);
        
        const modal = document.getElementById('viewCredentialsModal'); 
        if(modal) modal.classList.add('show');
    } catch (e) { console.error(e); }
}

async function editTeacherCredentials() {
    const id = document.getElementById('viewTeacherId').value;
    try {
        const { data: teacher, error } = await window.supabase.from('users').select('*').eq('id', id).single();
        if (error || !teacher) return;

        closeModalElement('viewCredentialsModal');
        setValue('editCredTeacherId', teacher.id); 
        setValue('editCredTeacherName', teacher.name); 
        setValue('editCredTeacherUsername', teacher.username); 
        setValue('editCredTeacherPassword', ''); 
        
        setTimeout(() => { const editModal = document.getElementById('editCredentialsModal'); if(editModal) editModal.classList.add('show'); }, 200);
    } catch (e) { console.error(e); }
}

async function saveTeacherCredentials() {
    const id = document.getElementById('editCredTeacherId').value;
    const newUser = document.getElementById('editCredTeacherUsername').value.trim();
    const newPass = document.getElementById('editCredTeacherPassword').value.trim();

    if(!newUser) return showError('اسم المستخدم مطلوب');

    try {
        const { data: existingUser } = await window.supabase.from('users').select('id').eq('username', newUser).neq('id', id);
        if (existingUser && existingUser.length > 0) return showError('اسم المستخدم غير متاح.');

        let updateData = { username: newUser };
        if (newPass && newPass.length >= 1) updateData.password = newPass;

        const { error } = await window.supabase.from('users').update(updateData).eq('id', id);
        if (error) throw error;

        showSuccess('تم التحديث بنجاح');
        closeModalElement('editCredentialsModal');
        loadTeachersData();
    } catch (e) {
        console.error(e);
        showError('حدث خطأ أثناء التحديث');
    }
}

// ==========================================
// التصدير والاستيراد من وإلى السحابة (Supabase)
// ==========================================

async function exportTeacherData(teacherId) {
    showConfirmModal('هل تريد تصدير بيانات هذا المعلم وطلابه بالكامل؟', async function() {
        try {
            if(window.showAuthNotification) window.showAuthNotification('جاري تجهيز البيانات للتصدير...', 'info');

            const { data: teacherProfile } = await window.supabase.from('users').select('*').eq('id', teacherId).single();
            if (!teacherProfile) return showError('المعلم غير موجود');

            const { data: students } = await window.supabase.from('users').select('*').eq('role', 'student').eq('teacherId', teacherId);
            const { data: schedule } = await window.supabase.from('teacher_schedule').select('*').eq('teacherId', teacherId);
            const { data: tests } = await window.supabase.from('tests').select('*').eq('teacherId', teacherId);
            const { data: lessons } = await window.supabase.from('lessons').select('*').eq('teacherId', teacherId);
            const { data: assignments } = await window.supabase.from('assignments').select('*').eq('teacherId', teacherId);

            const exportData = {
                meta: { type: 'teacher_backup_supabase', version: '2.0', exportedAt: new Date().toISOString() },
                profile: teacherProfile,
                data: { 
                    students: students || [], 
                    schedule: schedule || [], 
                    tests: tests || [], 
                    lessons: lessons || [], 
                    assignments: assignments || [] 
                }
            };

            const fileName = `Teacher_${teacherProfile.name}_${new Date().toISOString().split('T')[0]}.json`;
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = fileName; 
            document.body.appendChild(a); 
            a.click(); 
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSuccess('تم تصدير ملف المعلم بنجاح! 📥');
        } catch (error) {
            console.error("Export Error:", error);
            showError("حدث خطأ أثناء التصدير من السحابة");
        }
    });
}

function importTeacherData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const d = JSON.parse(event.target.result);
                if (!d.meta || !d.meta.type.includes('teacher_backup')) {
                    return showError('ملف غير صالح أو لا يخص نسخة المعلم');
                }
                
                showConfirmModal(`استيراد بيانات المعلم: ${d.profile.name}؟\nسيتم رفع حساب المعلم وطلابه والمحتوى الخاص به إلى السحابة.`, async function() {
                    if(window.showAuthNotification) window.showAuthNotification('جاري الاستيراد للسحابة، يرجى الانتظار...', 'info');

                    // رفع بيانات المعلم (Upsert لتحديثه إذا كان موجوداً أو إضافته إن لم يكن)
                    const { error: profileErr } = await window.supabase.from('users').upsert([d.profile]);
                    if(profileErr) throw profileErr;

                    // رفع الطلاب
                    if(d.data.students && d.data.students.length > 0) {
                        await window.supabase.from('users').upsert(d.data.students);
                    }

                    // رفع المحتوى
                    if(d.data.schedule && d.data.schedule.length > 0) await window.supabase.from('teacher_schedule').upsert(d.data.schedule);
                    if(d.data.tests && d.data.tests.length > 0) await window.supabase.from('tests').upsert(d.data.tests);
                    if(d.data.lessons && d.data.lessons.length > 0) await window.supabase.from('lessons').upsert(d.data.lessons);
                    if(d.data.assignments && d.data.assignments.length > 0) await window.supabase.from('assignments').upsert(d.data.assignments);

                    showSuccess('تم الاستيراد بنجاح ✅');
                    loadTeachersData();
                    loadAdminStats();
                });
            } catch(er) { 
                console.error("Import Error:", er);
                showError('خطأ أثناء قراءة الملف: ' + er.message); 
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// أدوات مساعدة
function getValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setValue(id, val) { const el = document.getElementById(id); if(el) el.value = val; }
function setText(id, txt) { const el = document.getElementById(id); if(el) el.textContent = txt; }
function clearValue(id) { const el = document.getElementById(id); if(el) el.value = ''; }
function closeModalElement(id) { const m = document.getElementById(id); if(m) m.classList.remove('show'); }
function togglePasswordVisibility() { const el = document.getElementById('viewTeacherPassword'); if(el) el.type = (el.type === 'password' ? 'text' : 'password'); }
function copyToClipboard(txt, type) { navigator.clipboard.writeText(txt).then(() => showSuccess('تم النسخ للمحفظة')); }

window.showAddTeacherModal = showAddTeacherModal; window.closeAddTeacherModal = closeAddTeacherModal;
window.addNewTeacher = addNewTeacher;
window.deleteTeacher = deleteTeacher; window.toggleTeacherStatus = toggleTeacherStatus;
window.viewTeacherCredentials = viewTeacherCredentials;
window.editTeacherCredentials = editTeacherCredentials; window.saveTeacherCredentials = saveTeacherCredentials;
window.closeViewCredentialsModal = () => closeModalElement('viewCredentialsModal');
window.closeEditCredentialsModal = () => closeModalElement('editCredentialsModal');
window.togglePasswordVisibility = togglePasswordVisibility; window.copyToClipboard = copyToClipboard;
window.exportTeacherData = exportTeacherData;
window.importTeacherData = importTeacherData;

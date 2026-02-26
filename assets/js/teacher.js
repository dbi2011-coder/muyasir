// ============================================
// 📁 الملف: assets/js/teacher.js (النسخة السحابية الكاملة + التصدير والاستيراد)
// ============================================

if (!window.showConfirmModal) {
    window.showConfirmModal = function(message, onConfirm) {
        let modal = document.getElementById('globalConfirmModal');
        if (!modal) {
            const modalHtml = `<div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-trash-alt"></i></div><div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div><div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.5;"></div><div style="display:flex; gap:15px; justify-content:center;"><button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button><button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button></div></div></div>`;
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

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    
    if (path.includes('dashboard.html')) {
        updateUserInterface(user);
        loadTeacherStats();
    } else if (path.includes('students.html')) {
        updateUserInterface(user);
        loadStudentsData();
    }
});

function updateUserInterface(user) {
    if(document.getElementById('userName')) document.getElementById('userName').textContent = "أ/ " + user.name;
    if(document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = user.name.charAt(0);
}

async function loadTeacherStats() {
    const currentTeacher = getCurrentUser();
    if (!currentTeacher) return;
    try {
        const { count, error } = await window.supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('teacherId', currentTeacher.id);
        if(document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = count || 0;
        
        const { count: lessonsCount } = await window.supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('teacherId', currentTeacher.id);
        if(document.getElementById('lessonsCount')) document.getElementById('lessonsCount').innerText = lessonsCount || 0;

        const { count: assignsCount } = await window.supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('teacherId', currentTeacher.id);
        if(document.getElementById('assignmentsCount')) document.getElementById('assignmentsCount').innerText = assignsCount || 0;

        const { count: msgCount } = await window.supabase.from('messages').select('*', { count: 'exact', head: true }).eq('teacherId', currentTeacher.id).eq('isFromTeacher', false).eq('isRead', false);
        if (document.getElementById('unreadMessages')) document.getElementById('unreadMessages').innerText = msgCount || 0;

    } catch(e) { console.error(e); }
}

async function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    if(loadingState) loadingState.style.display = 'block';
    if(emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    const currentTeacher = getCurrentUser();

    try {
        const { data: students, error } = await window.supabase
            .from('users')
            .select('*')
            .eq('role', 'student')
            .eq('teacherId', currentTeacher.id)
            .order('id', { ascending: false });

        if (error) throw error;
        if(loadingState) loadingState.style.display = 'none';

        if (!students || students.length === 0) {
            if(emptyState) emptyState.style.display = 'block';
            return;
        }

        tableBody.innerHTML = students.map((student, index) => {
            const progressPct = student.progress || 0;
            let hexColor = '#3b82f6'; 
            if (progressPct >= 80) hexColor = '#10b981'; 
            else if (progressPct >= 50) hexColor = '#8b5cf6'; 
            else if (progressPct > 0) hexColor = '#0ea5e9'; 

            return `<tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>${student.grade || '-'}</td>
                <td>${student.subject || '-'}</td>
                <td class="progress-cell">
                    <div class="progress-text" style="color: ${hexColor}; font-weight: bold;">${progressPct}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPct}%; background-color: ${hexColor} !important;"></div>
                    </div>
                </td>
                <td>
                    <div class="student-actions" style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-primary" onclick="openStudentFile(${student.id})">ملف</button>
                        <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id}, '${student.username}', '${student.password}')">بيانات</button>
                        <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})">تعديل</button>
                        <button class="btn btn-sm btn-info" onclick="exportStudentData(${student.id})">تصدير</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})">حذف</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.error("Error loading students:", e);
        if(loadingState) loadingState.style.display = 'none';
        showError('حدث خطأ في جلب بيانات الطلاب');
    }
}

async function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) return alert('يرجى ملء جميع الحقول');

    const currentTeacher = getCurrentUser();
    
    let username = 's_' + Math.floor(Math.random() * 90000 + 10000);
    let password = Math.floor(Math.random() * 9000 + 1000).toString(); 

    try {
        const { error } = await window.supabase.from('users').insert([{
            id: Date.now(),
            name: name,
            grade: grade,
            subject: subject,
            username: username,
            password: password,
            role: 'student',
            teacherId: currentTeacher.id,
            progress: 0
        }]);

        if (error) throw error;

        showSuccess('تم إضافة الطالب بنجاح ✅');
        closeAddStudentModal(); 
        loadStudentsData();
    } catch (e) {
        console.error("Add Student Error:", e);
        alert('تفاصيل الخطأ: ' + (e.message || JSON.stringify(e)));
    }
}

async function editStudent(studentId) {
    try {
        const { data: student, error } = await window.supabase.from('users').select('*').eq('id', studentId).single();
        if (error || !student) return alert('الطالب غير موجود');
        
        document.getElementById('editStudentId').value = student.id;
        document.getElementById('editStudentName').value = student.name;
        document.getElementById('editStudentGrade').value = student.grade;
        document.getElementById('editStudentSubject').value = student.subject;
        if(document.getElementById('editStudentUsername')) document.getElementById('editStudentUsername').value = student.username || '';
        if(document.getElementById('editStudentPassword')) document.getElementById('editStudentPassword').value = '';
        
        document.getElementById('editStudentModal').classList.add('show');
    } catch (e) { console.error(e); }
}

async function updateStudentData() {
    const id = document.getElementById('editStudentId').value;
    const newName = document.getElementById('editStudentName').value.trim();
    const newGrade = document.getElementById('editStudentGrade').value;
    const newSubject = document.getElementById('editStudentSubject').value;
    const newUsername = document.getElementById('editStudentUsername').value.trim();
    const newPassword = document.getElementById('editStudentPassword').value.trim();

    try {
        if (newUsername) {
            const { data: existing } = await window.supabase.from('users').select('id').eq('username', newUsername).neq('id', id);
            if (existing && existing.length > 0) return showError('اسم المستخدم غير متاح.');
        }

        let updateData = { name: newName, grade: newGrade, subject: newSubject };
        if (newUsername) updateData.username = newUsername;
        if (newPassword) updateData.password = newPassword;

        const { error } = await window.supabase.from('users').update(updateData).eq('id', id);
        if (error) throw error;

        showSuccess('تم التحديث بنجاح ✅');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    } catch (e) {
        console.error(e);
        showError('حدث خطأ أثناء التحديث');
    }
}

function deleteStudent(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف هذا الطالب؟ <br><small>سيتم حذف بيانات الطالب نهائياً.</small>', async function() {
        try {
            const { error } = await window.supabase.from('users').delete().eq('id', studentId);
            if (error) throw error;
            showSuccess('تم الحذف بنجاح');
            loadStudentsData();
        } catch (e) {
            console.error(e);
            showError('حدث خطأ أثناء الحذف');
        }
    });
}

// ==========================================
// 📥 تصدير واستيراد بيانات الطالب
// ==========================================
async function exportStudentData(studentId) {
    try {
        if(window.showAuthNotification) window.showAuthNotification('جاري تجهيز بيانات الطالب للتصدير...', 'info');

        const { data: studentInfo } = await window.supabase.from('users').select('*').eq('id', studentId).single();
        if (!studentInfo) return showError('بيانات الطالب غير موجودة');

        const [tests, lessons, assignments, events] = await Promise.all([
            window.supabase.from('student_tests').select('*').eq('studentId', studentId),
            window.supabase.from('student_lessons').select('*').eq('studentId', studentId),
            window.supabase.from('student_assignments').select('*').eq('studentId', studentId),
            window.supabase.from('student_events').select('*').eq('studentId', studentId)
        ]);

        const exportData = {
            meta: { type: 'student_backup_supabase', version: '2.0', exportedBy: getCurrentUser().name, date: new Date().toISOString() },
            info: studentInfo,
            data: {
                tests: tests.data || [],
                lessons: lessons.data || [],
                assignments: assignments.data || [],
                events: events.data || [],
                progress: studentInfo.progress || 0 
            }
        };

        const fileName = `student_${studentInfo.name}.json`;
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = fileName; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess('تم تصدير ملف الطالب بنجاح! 📥');
    } catch (error) {
        console.error("Export Student Error:", error);
        showError("حدث خطأ أثناء التصدير من السحابة");
    }
}

function showImportStudentModal() {
    const fileInput = document.getElementById('studentJsonFile'); 
    if(fileInput) fileInput.value = '';
    const modal = document.getElementById('importStudentModal'); 
    if(modal) modal.classList.add('show');
}

async function processStudentImport() {
    const fileInput = document.getElementById('studentJsonFile');
    if (!fileInput || !fileInput.files[0]) return alert('يرجى اختيار ملف الطالب أولاً');
    
    const currentUser = getCurrentUser();
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            if(window.showAuthNotification) window.showAuthNotification('جاري الاستيراد للسحابة، يرجى الانتظار...', 'info');
            
            const imported = JSON.parse(e.target.result);
            if (!imported.info || !imported.data) throw new Error('الملف غير صالح');
            
            const studentInfo = imported.info;
            studentInfo.teacherId = currentUser.id; 
            
            // التحقق من تكرار اسم المستخدم وتغييره إن وجد
            const { data: collision } = await window.supabase.from('users').select('id').eq('username', studentInfo.username).neq('id', studentInfo.id);
            if(collision && collision.length > 0) {
                studentInfo.username = studentInfo.username + '_imp' + Math.floor(Math.random() * 100);
                alert('تنبيه: تم تعديل اسم المستخدم تلقائياً لوجود تطابق في قاعدة البيانات.');
            }
            
            // رفع أو تحديث بيانات الطالب
            const { error: profileErr } = await window.supabase.from('users').upsert([studentInfo]);
            if(profileErr) throw profileErr;
            
            // رفع محتوى الطالب
            if(imported.data.tests && imported.data.tests.length > 0) await window.supabase.from('student_tests').upsert(imported.data.tests);
            if(imported.data.lessons && imported.data.lessons.length > 0) await window.supabase.from('student_lessons').upsert(imported.data.lessons);
            if(imported.data.assignments && imported.data.assignments.length > 0) await window.supabase.from('student_assignments').upsert(imported.data.assignments);
            if(imported.data.events && imported.data.events.length > 0) await window.supabase.from('student_events').upsert(imported.data.events);
            
            showSuccess('تم الاستيراد بنجاح ✅');
            document.getElementById('importStudentModal').classList.remove('show');
            loadStudentsData();
        } catch (err) {
            console.error(err);
            showError('خطأ: ' + err.message); 
        }
    }; 
    reader.readAsText(fileInput.files[0]);
}

// ---------------------------------------------------------
// دوال واجهة المستخدم والأدوات المساعدة
// ---------------------------------------------------------
function showStudentLoginData(id, username, password) { 
    document.getElementById('loginDataUsername').value = username; 
    document.getElementById('loginDataPassword').value = password; 
    document.getElementById('studentLoginDataModal').classList.add('show'); 
}

function copyToClipboard(id) { 
    const el = document.getElementById(id); 
    el.select(); 
    document.execCommand('copy'); 
    showSuccess('تم النسخ'); 
}

function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); document.getElementById('addStudentForm').reset(); }
function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function closeModal(id) { const modal = document.getElementById(id); if(modal) modal.classList.remove('show'); }

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
window.exportStudentData = exportStudentData;
window.showImportStudentModal = showImportStudentModal;
window.processStudentImport = processStudentImport;
window.closeModal = closeModal;

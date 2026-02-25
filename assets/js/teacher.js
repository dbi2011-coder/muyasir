// ============================================
// 📁 الملف: assets/js/teacher.js
// الوصف: إدارة الطلاب وإحصائيات المعلم (نسخة Supabase الكاملة)
// ============================================

// =========================================================
// 🔥 دوال النوافذ المنبثقة والإشعارات 🔥
// =========================================================
if (!window.showConfirmModal) {
    window.showConfirmModal = function(message, onConfirm) {
        let modal = document.getElementById('globalConfirmModal');
        if (!modal) {
            const modalHtml = `
                <div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                    <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;">
                        <div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div>
                        <div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div>
                        <div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.5;"></div>
                        <div style="display:flex; gap:15px; justify-content:center;">
                            <button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button>
                            <button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button>
                        </div>
                    </div>
                </div>`;
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

// =========================================================
// 🚀 التهيئة العامة (Initialization)
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) initializeTeacherDashboard();
    else if (path.includes('students.html')) initializeStudentsPage();
});

function initializeStudentsPage() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    if(document.getElementById('userName')) document.getElementById('userName').textContent = 'أ/ ' + user.name;
    loadStudentsData();
}

function initializeTeacherDashboard() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    if(document.getElementById('userName')) document.getElementById('userName').textContent = 'أ/ ' + user.name;
    loadTeacherStats();
}

// =========================================================
// 📊 جلب إحصائيات المعلم من Supabase
// =========================================================
async function loadTeacherStats() {
    const currentTeacher = getCurrentUser();
    if (!currentTeacher) return;

    try {
        // حساب عدد الطلاب
        const { count: studentsCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('teacherId', currentTeacher.id);

        // حساب عدد الدروس
        const { count: lessonsCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('teacherId', currentTeacher.id);

        // حساب عدد الواجبات
        const { count: assignmentsCount } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('teacherId', currentTeacher.id);

        // حساب الرسائل غير المقروءة
        const { count: messagesCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('teacherId', currentTeacher.id)
            .eq('isFromStudent', true)
            .eq('isRead', false);

        if (document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = studentsCount || 0;
        if (document.getElementById('lessonsCount')) document.getElementById('lessonsCount').innerText = lessonsCount || 0;
        if (document.getElementById('assignmentsCount')) document.getElementById('assignmentsCount').innerText = assignmentsCount || 0;
        if (document.getElementById('unreadMessages')) document.getElementById('unreadMessages').innerText = messagesCount || 0;

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// =========================================================
// 👨‍🎓 عمليات إدارة الطلاب (CRUD) عبر Supabase
// =========================================================

// 1. جلب وعرض الطلاب
async function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    if(loadingState) loadingState.style.display = 'block';
    if(emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    try {
        const currentTeacher = getCurrentUser();
        
        const { data: students, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'student')
            .eq('teacherId', currentTeacher.id)
            .order('createdAt', { ascending: false });

        if (error) throw error;
        if(loadingState) loadingState.style.display = 'none';

        if (!students || students.length === 0) {
            if(emptyState) emptyState.style.display = 'block';
            return;
        }

        tableBody.innerHTML = students.map((student, index) => {
            let progressPct = student.progress || 0;
            let hexColor = progressPct >= 80 ? '#10b981' : (progressPct >= 50 ? '#8b5cf6' : '#0ea5e9');

            return `<tr>
                <td>${index + 1}</td>
                <td style="font-weight:bold; color:#333;">${student.name}</td>
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
                        <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id})">بيانات</button>
                        <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})">تعديل</button>
                        <button class="btn btn-sm btn-info" onclick="exportStudentData(${student.id})">تصدير</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})">حذف</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error("Error loading students:", error);
        if(loadingState) loadingState.style.display = 'none';
        showError('حدث خطأ في الاتصال بقاعدة البيانات.');
    }
}

// 2. إضافة طالب جديد
async function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) return showError('يرجى ملء جميع الحقول');

    const currentTeacher = getCurrentUser();
    let username = 's_' + Math.floor(Math.random() * 10000);
    let password = '123';

    const newStudentData = {
        id: Date.now(),
        teacherId: currentTeacher.id,
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        username: username,
        password: password,
        progress: 0
    };

    try {
        const { error } = await supabase.from('users').insert([newStudentData]);
        if (error) throw error;

        showSuccess('تم إضافة الطالب بنجاح ✅');
        document.getElementById('addStudentForm').reset();
        closeAddStudentModal();
        loadStudentsData();
    } catch (error) {
        console.error("Error adding student:", error);
        showError('حدث خطأ أثناء الإضافة. تأكد من اتصالك بالإنترنت.');
    }
}

// 3. جلب بيانات الطالب للتعديل
async function editStudent(studentId) {
    try {
        const { data: student, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error || !student) throw error;

        document.getElementById('editStudentId').value = student.id;
        document.getElementById('editStudentName').value = student.name;
        document.getElementById('editStudentGrade').value = student.grade;
        document.getElementById('editStudentSubject').value = student.subject;
        if(document.getElementById('editStudentUsername')) document.getElementById('editStudentUsername').value = student.username || '';
        if(document.getElementById('editStudentPassword')) document.getElementById('editStudentPassword').value = student.password || '';
        
        document.getElementById('editStudentModal').classList.add('show');
    } catch (error) {
        showError('تعذر جلب بيانات الطالب للتعديل');
    }
}

// 4. حفظ التعديلات
async function updateStudentData() {
    const studentId = document.getElementById('editStudentId').value;
    
    const updateData = {
        name: document.getElementById('editStudentName').value.trim(),
        grade: document.getElementById('editStudentGrade').value,
        subject: document.getElementById('editStudentSubject').value,
        username: document.getElementById('editStudentUsername').value.trim()
    };

    const newPassword = document.getElementById('editStudentPassword').value.trim();
    if(newPassword) {
        updateData.password = newPassword;
    }

    try {
        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', studentId);

        if (error) throw error;

        showSuccess('تم التحديث بنجاح ✅');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    } catch (error) {
        showError('اسم المستخدم غير متاح أو حدث خطأ في الاتصال.');
    }
}

// 5. حذف طالب
async function deleteStudent(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف هذا الطالب نهائياً؟<br><small>سيتم حذف جميع سجلاته ودرجاته.</small>', async function() {
        try {
            // حذف الطالب من السيرفر
            const { error } = await supabase.from('users').delete().eq('id', studentId);
            if (error) throw error;

            // حذف سجلاته المرتبطة (اختياري، يفضل تفعيل Cascade في Supabase)
            await supabase.from('studentTests').delete().eq('studentId', studentId);
            await supabase.from('studentLessons').delete().eq('studentId', studentId);
            await supabase.from('studentAssignments').delete().eq('studentId', studentId);
            
            showSuccess('تم الحذف بنجاح');
            loadStudentsData();
        } catch (error) {
            console.error("Error deleting:", error);
            showError('حدث خطأ أثناء الحذف.');
        }
    });
}

// =========================================================
// 📂 التصدير، الاستيراد، وبيانات الدخول
// =========================================================

async function showStudentLoginData(studentId) {
    try {
        const { data: student, error } = await supabase.from('users').select('username, password').eq('id', studentId).single();
        if(error) throw error;

        document.getElementById('loginDataUsername').value = student.username;
        document.getElementById('loginDataPassword').value = student.password;
        document.getElementById('studentLoginDataModal').classList.add('show');
    } catch(e) {
        showError('تعذر جلب بيانات الدخول');
    }
}

async function exportStudentData(studentId) {
    try {
        showSuccess('جاري تجهيز بيانات الطالب للتصدير...');
        const { data: info } = await supabase.from('users').select('*').eq('id', studentId).single();
        const { data: tests } = await supabase.from('studentTests').select('*').eq('studentId', studentId);
        const { data: lessons } = await supabase.from('studentLessons').select('*').eq('studentId', studentId);
        const { data: assignments } = await supabase.from('studentAssignments').select('*').eq('studentId', studentId);

        const exportData = {
            info: info,
            data: { tests, lessons, assignments },
            meta: { exportedBy: getCurrentUser().name, date: new Date().toISOString() }
        };

        const fileName = `student_${info.name}.json`;
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch(e) {
        showError('فشل تصدير بيانات الطالب');
    }
}

function showImportStudentModal() {
    const fileInput = document.getElementById('studentJsonFile'); if(fileInput) fileInput.value = '';
    const modal = document.getElementById('importStudentModal'); if(modal) modal.classList.add('show');
}

async function processStudentImport() {
    const fileInput = document.getElementById('studentJsonFile');
    if (!fileInput || !fileInput.files[0]) return showError('يرجى اختيار ملف الطالب أولاً');
    const currentTeacher = getCurrentUser();
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.info || !imported.data) throw new Error('الملف غير صالح');
            
            let studentInfo = imported.info;
            studentInfo.id = Date.now(); // إعطاء ID جديد لتجنب التعارض
            studentInfo.teacherId = currentTeacher.id; 
            studentInfo.username = studentInfo.username + '_imp' + Math.floor(Math.random()*100); // تغيير اليوزر لتجنب التعارض
            
            // إدخال الطالب الجديد
            const { data: insertedStudent, error: err1 } = await supabase.from('users').insert([studentInfo]).select().single();
            if(err1) throw err1;

            showSuccess('تم الاستيراد بنجاح');
            closeModal('importStudentModal');
            loadStudentsData();

        } catch (err) { 
            showError('خطأ: ' + err.message); 
        }
    }; 
    reader.readAsText(fileInput.files[0]);
}

// =========================================================
// 🔍 الفلترة والبحث والواجهة
// =========================================================
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

function copyToClipboard(id) { 
    const el = document.getElementById(id); el.select(); document.execCommand('copy'); 
    showSuccess('تم النسخ'); 
}

function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); }
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// تصدير الدوال
window.addNewStudent = addNewStudent; window.editStudent = editStudent; window.updateStudentData = updateStudentData;
window.deleteStudent = deleteStudent; window.openStudentFile = openStudentFile; window.showStudentLoginData = showStudentLoginData;
window.copyToClipboard = copyToClipboard; window.loadStudentsData = loadStudentsData; window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal; window.showImportStudentModal = showImportStudentModal; window.exportStudentData = exportStudentData;
window.processStudentImport = processStudentImport; window.searchStudents = searchStudents; window.filterStudents = filterStudents; window.closeModal = closeModal;

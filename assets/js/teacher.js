// ============================================
// 📁 الملف: assets/js/teacher.js
// ============================================

// 🌟 تهيئة الاتصال بقاعدة بيانات PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// ==========================================
// 1. نظام النوافذ المنبثقة (الإشعارات والتأكيد)
// ==========================================
if (!window.showConfirmModal) {
    window.showConfirmModal = function(message, onConfirm) {
        let modal = document.getElementById('globalConfirmModal');
        if (!modal) {
            const modalHtml = `
                <div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                    <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
                        <div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div>
                        <div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div>
                        <div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem;"></div>
                        <div style="display:flex; gap:15px; justify-content:center;">
                            <button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1;">إلغاء</button>
                            <button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1;">نعم، متأكد</button>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalConfirmModal');
        }
        document.getElementById('globalConfirmMessage').innerHTML = message;
        modal.style.display = 'flex';
        document.getElementById('globalConfirmOk').onclick = function() { modal.style.display = 'none'; if(onConfirm) onConfirm(); };
        document.getElementById('globalConfirmCancel').onclick = function() { modal.style.display = 'none'; };
    };
}

if (!window.showSuccess) {
    window.showSuccess = function(message) {
        let toast = document.getElementById('globalSuccessToast');
        if (!toast) {
            const html = `<div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; z-index:999999; font-weight:bold;">✅ <span id="globalSuccessMessage"></span></div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            toast = document.getElementById('globalSuccessToast');
        }
        document.getElementById('globalSuccessMessage').textContent = message;
        toast.style.display = 'flex';
        setTimeout(() => toast.style.display = 'none', 3000);
    };
}

if (!window.showError) {
    window.showError = function(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            const html = `<div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; z-index:999999; font-weight:bold;">⚠️ <span id="globalErrorMessage"></span></div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            toast = document.getElementById('globalErrorToast');
        }
        document.getElementById('globalErrorMessage').innerHTML = message;
        toast.style.display = 'flex';
        setTimeout(() => toast.style.display = 'none', 4000);
    };
}

// ==========================================
// 2. التهيئة وجلب بيانات المستخدم
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) initializeTeacherDashboard();
    else if (path.includes('students.html')) initializeStudentsPage();
});

function initializeStudentsPage() {
    const user = getCurrentUser();
    if (!user) return;
    if(document.getElementById('userName')) document.getElementById('userName').textContent = 'أ/ ' + user.name;
    loadStudentsData();
}

function initializeTeacherDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    if(document.getElementById('userName')) document.getElementById('userName').textContent = 'أ/ ' + user.name;
    // الإحصائيات (مؤقتاً سيتم ربطها لاحقاً)
    if (document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = '-';
}

function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : { id: 'test_teacher', name: 'المعلم' }; 
    } catch(e) { return null; }
}

// ==========================================
// 3. عمليات قاعدة البيانات للطلاب (PocketBase)
// ==========================================

// أ) جلب وعرض الطلاب (تمت إعادة جميع الأزرار)
async function loadStudentsData() {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    tableBody.innerHTML = '';

    try {
        const currentTeacher = getCurrentUser();
        // جلب طلاب هذا المعلم فقط
        const records = await pb.collection('students').getFullList({
            filter: `teacherId = "${currentTeacher.id}"`,
            sort: '-created',
        });

        document.getElementById('loadingState').style.display = 'none';

        if (records.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        tableBody.innerHTML = records.map((student, index) => {
            let progressPct = 0; 
            let hexColor = '#0ea5e9'; 

            return `<tr>
                <td>${index + 1}</td>
                <td style="font-weight:bold;">${student.name || 'بدون اسم'}</td>
                <td>الصف ${student.level}</td>
                <td>${student.difficulty_type}</td>
                <td class="progress-cell">
                    <div class="progress-text" style="color: ${hexColor}; font-weight: bold;">${progressPct}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPct}%; background-color: ${hexColor} !important;"></div>
                    </div>
                </td>
                <td>
                    <div class="student-actions" style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-primary" onclick="openStudentFile('${student.id}')">ملف</button>
                        <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData('${student.id}')">بيانات</button>
                        <button class="btn btn-sm btn-warning" onclick="editStudent('${student.id}')">تعديل</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')">حذف</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('loadingState').style.display = 'none';
        showError('فشل الاتصال بقاعدة البيانات. تأكد من تشغيل PocketBase.');
    }
}

// ب) إضافة طالب جديد (تتضمن توليد اسم مستخدم وكلمة مرور)
async function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) return showError('يرجى ملء جميع الحقول');

    const currentTeacher = getCurrentUser();
    
    // توليد بيانات الدخول تلقائياً
    let username = 's_' + Math.floor(Math.random() * 10000);
    let password = '123';

    const data = {
        "name": name,
        "difficulty_type": subject,
        "level": Number(grade),
        "username": username,
        "password": password,
        "teacherId": String(currentTeacher.id)
    };

    try {
        await pb.collection('students').create(data);
        showSuccess('تم إضافة الطالب بنجاح ✅');
        document.getElementById('addStudentForm').reset();
        closeAddStudentModal();
        loadStudentsData();
    } catch (error) {
        console.error("Error:", error);
        showError('حدث خطأ أثناء الإضافة. تأكد من تطابق الحقول في PocketBase.');
    }
}

// ج) حذف طالب
async function deleteStudent(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف هذا الطالب نهائياً؟', async function() {
        try {
            await pb.collection('students').delete(studentId);
            showSuccess('تم الحذف بنجاح');
            loadStudentsData();
        } catch (error) {
            showError('حدث خطأ أثناء الحذف.');
        }
    });
}

// د) عرض بيانات الدخول للطالب
async function showStudentLoginData(studentId) {
    try {
        const student = await pb.collection('students').getOne(studentId);
        document.getElementById('loginDataUsername').value = student.username || 'غير محدد';
        document.getElementById('loginDataPassword').value = student.password || 'غير محدد';
        document.getElementById('studentLoginDataModal').classList.add('show');
    } catch (error) {
        showError('تعذر جلب بيانات الدخول');
    }
}

// هـ) جلب بيانات الطالب لنموذج التعديل
async function editStudent(studentId) {
    try {
        const student = await pb.collection('students').getOne(studentId);
        document.getElementById('editStudentId').value = student.id;
        document.getElementById('editStudentName').value = student.name;
        document.getElementById('editStudentGrade').value = student.level;
        document.getElementById('editStudentSubject').value = student.difficulty_type;
        document.getElementById('editStudentUsername').value = student.username || '';
        document.getElementById('editStudentPassword').value = student.password || '';
        
        document.getElementById('editStudentModal').classList.add('show');
    } catch (error) {
        showError('تعذر جلب بيانات الطالب للتعديل');
    }
}

// و) حفظ التعديلات على بيانات الطالب
async function updateStudentData() {
    const id = document.getElementById('editStudentId').value;
    const data = {
        "name": document.getElementById('editStudentName').value.trim(),
        "level": Number(document.getElementById('editStudentGrade').value),
        "difficulty_type": document.getElementById('editStudentSubject').value,
        "username": document.getElementById('editStudentUsername').value.trim(),
        "password": document.getElementById('editStudentPassword').value.trim()
    };

    try {
        await pb.collection('students').update(id, data);
        showSuccess('تم التحديث بنجاح ✅');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    } catch (error) {
        showError('حدث خطأ أثناء التحديث.');
    }
}

// ==========================================
// 4. دوال التحكم بالواجهة الأساسية
// ==========================================
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); }
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function copyToClipboard(id) { 
    const el = document.getElementById(id); 
    el.select(); 
    document.execCommand('copy'); 
    showSuccess('تم النسخ'); 
}

// تصدير الدوال للاستخدام في الـ HTML
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

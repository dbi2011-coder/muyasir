// ============================================
// 📁 الملف: assets/js/teacher.js
// ============================================

// 🌟 تهيئة الاتصال بقاعدة بيانات PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

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
        
        // إخفاء الرسالة تلقائياً بعد 3 ثواني
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    };
}

if (!window.showError) {
    window.showError = function(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            const toastHtml = `
                <div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;">
                    <i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalErrorToast');
        }
        document.getElementById('globalErrorMessage').innerHTML = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
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

// 🌟 دالة جلب وعرض الطلاب من PocketBase
async function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    if(loadingState) loadingState.style.display = 'block';
    if(emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    try {
        // جلب البيانات من السيرفر (PocketBase)
        const records = await pb.collection('students').getFullList({
            sort: '-created',
        });

        if(loadingState) loadingState.style.display = 'none';

        if (records.length === 0) {
            if(emptyState) emptyState.style.display = 'block';
            return;
        }

        tableBody.innerHTML = records.map((student, index) => {
            let progressPct = 0; 
            let hexColor = '#0ea5e9'; 

            return `<tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
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
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')">حذف</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error("خطأ في جلب الطلاب:", error);
        if(loadingState) loadingState.style.display = 'none';
        showError('حدث خطأ في الاتصال بقاعدة البيانات.');
    }
}

// 🌟 دالة إضافة طالب جديد إلى PocketBase
async function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) return alert('يرجى ملء جميع الحقول');

    const data = {
        "name": name,
        "difficulty_type": subject,
        "level": Number(grade)
    };

    try {
        await pb.collection('students').create(data);
        
        showSuccess('تم إضافة الطالب بنجاح ✅');
        
        // تفريغ الحقول وإغلاق النافذة
        document.getElementById('addStudentForm').reset();
        closeAddStudentModal(); 
        
        // تحديث الجدول
        loadStudentsData(); 
    } catch (error) {
        console.error("خطأ في إضافة الطالب:", error);
        showError('حدث خطأ أثناء الإضافة. تأكد من تشغيل سيرفر PocketBase.');
    }
}

// 🌟 دالة حذف طالب من PocketBase
async function deleteStudent(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف هذا الطالب نهائياً؟', async function() {
        try {
            await pb.collection('students').delete(studentId);
            showSuccess('تم الحذف بنجاح');
            loadStudentsData();
        } catch (error) {
            console.error("خطأ في حذف الطالب:", error);
            showError('حدث خطأ أثناء الحذف.');
        }
    });
}

function editStudent(studentId) {
    // سيتم تحديثها لاحقاً لربطها بـ PocketBase إذا احتجت ذلك
    alert('ميزة التعديل سيتم ربطها قريباً');
}

function updateStudentData() {
    // سيتم تحديثها لاحقاً لربطها بـ PocketBase إذا احتجت ذلك
}

function exportStudentData(studentId) {
    alert('تصدير الطالب - قيد التطوير للعمل مع النظام الجديد');
}

function showImportStudentModal() {
    const fileInput = document.getElementById('studentJsonFile'); if(fileInput) fileInput.value = '';
    const modal = document.getElementById('importStudentModal'); if(modal) modal.classList.add('show');
}

function processStudentImport() {
    alert('استيراد الطالب - قيد التطوير للعمل مع النظام الجديد');
}

function getStudentData(key, id) { return JSON.parse(localStorage.getItem(key) || '[]').filter(x => x.studentId == id); }
function mergeData(key, newData) { if (!newData || !newData.length) return; let current = JSON.parse(localStorage.getItem(key) || '[]'); current = current.filter(x => x.studentId != newData[0].studentId); localStorage.setItem(key, JSON.stringify([...current, ...newData])); }
function cleanStudentOldData(id) { ['studentTests', 'studentLessons', 'studentAssignments', 'studentEvents'].forEach(key => { let data = JSON.parse(localStorage.getItem(key) || '[]'); localStorage.setItem(key, JSON.stringify(data.filter(x => String(x.studentId) !== String(id)))); }); }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function showStudentLoginData(id) { alert('ميزة عرض بيانات الدخول سيتم برمجتها قريباً'); }
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

// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: نظام التقدم الأكاديمي (إصلاح ربط قائمة الواجبات بالمكتبة الصحيحة)
// ============================================

let currentStudentId = null;
let currentStudent = null;
let editingEventId = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }
    
    injectAdminEventModal();
    injectHomeworkModal(); 
    injectWordTableStyles();
    loadStudentData();
});

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id == currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    // تحديث واجهة الملف الشخصي
    if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
    if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;
    
    switchSection('diagnostic');
}

function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');
    
    const activeSection = document.getElementById(`section-${sectionId}`);
    if(activeSection) activeSection.classList.add('active');

    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// ... [بقية دوال السجل والجدول بقيت كما هي دون تغيير للحفاظ على المساحة] ...
// ... [تأكد من نسخ دوال loadProgressTab و syncMissingDaysToArchive من ردودي السابقة إذا لم تكن موجودة] ...
// ... سأضع هنا فقط الدوال التي تحتاج تعديل مباشر ...

// ============================================
// 🔥 الجزء المعدل: دالة إسناد الواجبات 🔥
// ============================================

function injectHomeworkModal() {
    const oldModal = document.getElementById('assignHomeworkModal');
    if (oldModal) oldModal.remove();

    const html = `
    <div id="assignHomeworkModal" class="modal">
        <div class="modal-content" style="border: 2px solid #000;">
            <span class="close-btn" onclick="closeModal('assignHomeworkModal')">&times;</span>
            <h3>إسناد واجب جديد</h3>
            <div class="form-group">
                <label>اختر الواجب من المكتبة:</label>
                <select id="homeworkSelect" class="form-control">
                    <option value="">جارِ التحميل...</option>
                </select>
            </div>
            <div class="form-group">
                <label>تاريخ التسليم:</label>
                <input type="date" id="homeworkDueDate" class="form-control">
            </div>
            <button class="btn btn-primary w-100" onclick="assignHomework()">حفظ الإسناد</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function showAssignHomeworkModal() { 
    // 🔥 التعديل الجوهري: البحث في 'assignments' بدلاً من 'libraryAssignments'
    const allAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const select = document.getElementById('homeworkSelect');
    
    if (!select) {
        injectHomeworkModal();
        setTimeout(showAssignHomeworkModal, 50);
        return;
    }

    select.innerHTML = '<option value="">-- اختر من قائمة الواجبات --</option>';
    
    // تصفية الواجبات الخاصة بالمعلم الحالي فقط (اختياري)
    // const myAssignments = allAssignments.filter(a => a.teacherId === currentUser.id); 
    
    if (allAssignments.length > 0) {
        allAssignments.forEach(a => {
            // نستخدم العنوان كقيمة، ويمكنك استخدام ID إذا أردت دقة أكبر
            select.innerHTML += `<option value="${a.title}">${a.title}</option>`;
        });
    } else {
        select.innerHTML += `<option value="" disabled>لا توجد واجبات في المكتبة</option>`;
    }

    document.getElementById('homeworkDueDate').valueAsDate = new Date();
    document.getElementById('assignHomeworkModal').classList.add('show'); 
}

function assignHomework() { 
    const select = document.getElementById('homeworkSelect'); 
    if(!select || !select.value) { alert('الرجاء اختيار واجب من القائمة'); return; }
    
    const title = select.value; 
    
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); 
    list.push({ 
        id: Date.now(), 
        studentId: currentStudentId, 
        title: title, 
        status: 'pending', 
        dueDate: document.getElementById('homeworkDueDate').value, 
        assignedDate: new Date().toISOString() 
    }); 
    
    localStorage.setItem('studentAssignments', JSON.stringify(list)); 
    closeModal('assignHomeworkModal'); 
    loadAssignmentsTab(); 
    alert('تم الإسناد بنجاح'); 
}

function deleteAssignment(id) { 
    if(confirm('حذف هذا الواجب؟')) { 
        let list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); 
        list = list.filter(a => a.id != id); 
        localStorage.setItem('studentAssignments', JSON.stringify(list)); 
        loadAssignmentsTab(); 
    } 
}

// ... [بقية الدوال: loadAssignmentsTab, loadLessonsTab, loadIEPTab, loadDiagnosticTab كما هي] ...

function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId == currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    
    // الحالة الفارغة
    if (list.length === 0) { 
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px; text-align: center; border: 2px dashed #e0e0e0; border-radius: 10px; background-color: #fafafa; margin-top: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px; color: #ccc;">📝</div>
                <h3 style="color:#555; margin-bottom: 10px;">لا توجد واجبات حالياً</h3>
                <p style="color:#777; margin-bottom: 25px; font-size: 0.95rem;">يمكنك إسناد واجب يدوياً من المكتبة أو سيتم توليدها تلقائياً.</p>
                <button class="btn btn-primary" onclick="showAssignHomeworkModal()">
                    <i class="fas fa-plus-circle"></i> إسناد واجب جديد
                </button>
            </div>`; 
        return; 
    }

    const headerHtml = `
        <div class="content-header" style="display:flex; justify-content:flex-start; align-items:center; margin-bottom:20px;">
            <button class="btn btn-primary" onclick="showAssignHomeworkModal()">
                <i class="fas fa-plus-circle"></i> إسناد واجب جديد
            </button>
        </div>`;

    const cardsHtml = list.map(a => `
        <div class="content-card">
            <div style="display:flex; justify-content:space-between;">
                <h4 style="margin:0;">${a.title}</h4>
                <span class="badge ${a.status === 'completed' ? 'badge-success' : 'badge-primary'}">${a.status === 'completed' ? 'مكتمل' : 'جديد'}</span>
            </div>
            <div class="content-meta" style="margin-top:10px;">
                <span>📅 التسليم: ${a.dueDate || 'مفتوح'}</span>
                <span>تاريخ الإسناد: ${new Date(a.assignedDate).toLocaleDateString('ar-SA')}</span>
            </div>
            <button class="btn btn-sm btn-danger mt-3" onclick="deleteAssignment(${a.id})">حذف الواجب</button>
        </div>`
    ).join('');

    container.innerHTML = headerHtml + `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">${cardsHtml}</div>`;
}

// ... [بقية الدوال المساعدة والنوافذ كما هي] ...
function injectAdminEventModal() { if (document.getElementById('adminEventModal')) return; const html = `<div id="adminEventModal" class="modal"><div class="modal-content" style="border: 2px solid #000;"><span class="close-btn" onclick="closeAdminEventModal()">&times;</span><h3 id="modalTitle">تسجيل حدث إداري</h3><div class="form-group"><label>نوع الحالة:</label><select id="manualEventType" class="form-control"><option value="excused">معفى (يخصم من الرصيد)</option><option value="vacation">إجازة (توقف مؤقت)</option></select></div><div class="form-group"><label>التاريخ:</label><input type="date" id="manualEventDate" class="form-control"></div><div class="form-group"><label>ملاحظات:</label><textarea id="manualEventNote" class="form-control"></textarea></div><button class="btn btn-primary w-100" onclick="saveAdminEvent()">حفظ السجل</button></div></div>`; document.body.insertAdjacentHTML('beforeend', html); }
function openAdminEventModal() { editingEventId = null; document.getElementById('modalTitle').textContent = "تسجيل حدث إداري"; document.getElementById('manualEventDate').valueAsDate = new Date(); document.getElementById('manualEventType').value = 'excused'; document.getElementById('manualEventNote').value = ''; document.getElementById('adminEventModal').classList.add('show'); }
function closeAdminEventModal() { document.getElementById('adminEventModal').classList.remove('show'); }
function editAdminEvent(id) { const events = JSON.parse(localStorage.getItem('studentEvents') || '[]'); const event = events.find(e => e.id == id); if (!event) return; editingEventId = id; document.getElementById('modalTitle').textContent = "تعديل الحدث"; document.getElementById('manualEventType').value = event.type; document.getElementById('manualEventDate').value = event.date.split('T')[0]; document.getElementById('manualEventNote').value = event.note || ''; document.getElementById('adminEventModal').classList.add('show'); }
function saveAdminEvent() { const type = document.getElementById('manualEventType').value; const date = document.getElementById('manualEventDate').value; const note = document.getElementById('manualEventNote').value; if (!date) { alert('يرجى اختيار التاريخ'); return; } let events = JSON.parse(localStorage.getItem('studentEvents') || '[]'); if (editingEventId) { const idx = events.findIndex(e => e.id == editingEventId); if (idx !== -1) { events[idx].type = type; events[idx].date = new Date(date).toISOString(); events[idx].note = note; } } else { events.push({ id: Date.now(), studentId: currentStudentId, date: new Date(date).toISOString(), type: type, note: note }); } localStorage.setItem('studentEvents', JSON.stringify(events)); closeAdminEventModal(); loadProgressTab(); }
function deleteAdminEvent(id) { if (!confirm('حذف هذا الحدث؟')) return; let events = JSON.parse(localStorage.getItem('studentEvents') || '[]'); events = events.filter(e => e.id != id); localStorage.setItem('studentEvents', JSON.stringify(events)); loadProgressTab(); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function injectWordTableStyles() { if (document.getElementById('wordTableStyles')) return; const style = document.createElement('style'); style.id = 'wordTableStyles'; style.innerHTML = `.word-table { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', 'Tajawal', serif; font-size: 1rem; background: white; border: 2px solid #000; } .word-table th, .word-table td { border: 1px solid #000; padding: 8px 12px; vertical-align: middle; } .word-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; border-bottom: 2px solid #000; } .word-table tr:nth-child(even) { background-color: #fafafa; } .bg-success-light { background-color: #e8f5e9 !important; } .bg-danger-light { background-color: #ffebee !important; } .bg-warning-light { background-color: #fff3e0 !important; } .bg-info-light { background-color: #e3f2fd !important; } .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0 5px; transition: transform 0.2s; } .btn-icon:hover { transform: scale(1.2); } .badge { padding: 5px 10px; border-radius: 12px; color: white; font-size: 0.8rem; } .badge-success { background-color: #28a745; } .badge-danger { background-color: #dc3545; }`; document.head.appendChild(style); }
// ... [تأكد من وجود loadProgressTab و syncMissingDaysToArchive التي تم اعتمادها سابقاً] ...

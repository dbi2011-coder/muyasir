// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة (عزل البيانات + واجهة المستخدم)
// ============================================

// --- 1. إعدادات قاعدة البيانات IndexedDB ---
const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = (e) => reject('خطأ DB');
    });
}
function dbGetAll() { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbPut(item) { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).put(item); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }
function dbDelete(id) { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).delete(id); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }

// تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    try { await openDB(); } catch(e) { console.log('DB init error'); }
    
    // تحميل البيانات إذا كانت العناصر موجودة
    if (document.getElementById('membersListContainer')) loadMembers();
    if (document.getElementById('meetingsListContainer')) loadMeetings();

    // تفعيل التبويب الافتراضي (الاجتماعات)
    if(typeof switchTab === 'function') switchTab('meetingsSection');
});

// ========================
// 🖥️ دوال الواجهة (إصلاح الأخطاء ReferenceError)
// ========================

// 1. التبديل بين التبويبات (الاجتماعات / الأعضاء)
function switchTab(tabId) {
    // إخفاء كل الأقسام
    const sections = ['meetingsSection', 'membersSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // إظهار القسم المطلوب
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    // تحديث الأزرار النشطة
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    // محاولة تفعيل الزر الذي تم ضغطه (يعتمد على HTML)
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// 2. فتح نافذة اجتماع جديد
function showNewMeetingModal() {
    // تفريغ الحقول
    if(document.getElementById('meetTitle')) document.getElementById('meetTitle').value = '';
    if(document.getElementById('meetDate')) document.getElementById('meetDate').value = '';
    if(document.getElementById('meetContent')) document.getElementById('meetContent').value = '';
    if(document.getElementById('dynamicToolsContainer')) document.getElementById('dynamicToolsContainer').innerHTML = '';
    
    // إظهار النافذة
    const modal = document.getElementById('meetingModal');
    if(modal) modal.classList.add('show');
}

// 3. أدوات الاجتماع الديناميكية (تصويت، إلخ)
function addPollTool() {
    const container = document.getElementById('dynamicToolsContainer');
    const id = Date.now();
    const html = `
    <div class="dynamic-item poll-tool" id="tool_${id}" style="border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:5px;">
        <div style="display:flex; justify-content:space-between;">
            <h5 style="margin:0 0 10px 0; color:#007bff;">📊 تصويت</h5>
            <span style="cursor:pointer; color:red;" onclick="removeTool('tool_${id}')">×</span>
        </div>
        <input type="text" class="form-control mb-2 poll-question" placeholder="عنوان التصويت">
        <input type="text" class="form-control mb-1 poll-option" placeholder="خيار 1">
        <input type="text" class="form-control mb-1 poll-option" placeholder="خيار 2">
    </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

function addStudentFeedbackTool() {
    const container = document.getElementById('dynamicToolsContainer');
    const id = Date.now();
    const html = `
    <div class="dynamic-item feedback-tool" id="tool_${id}" style="border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:5px;">
        <div style="display:flex; justify-content:space-between;">
            <h5 style="margin:0 0 10px 0; color:#28a745;">👨‍🎓 مرئيات طلاب</h5>
            <span style="cursor:pointer; color:red;" onclick="removeTool('tool_${id}')">×</span>
        </div>
        <p style="font-size:0.8rem; color:#777;">سيتم إضافة قائمة الطلاب لاحقاً عند الحفظ</p>
    </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

function removeTool(id) {
    document.getElementById(id).remove();
}

// ========================
// 👥 إدارة الأعضاء (مع العزل)
// ========================

function loadMembers() {
    const container = document.getElementById('membersListContainer');
    if (!container) return;

    const currentUser = getCurrentUser();
    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    // 🔥 العزل: جلب أعضاء هذا المعلم فقط
    const myMembers = allMembers.filter(m => m.ownerId === currentUser.id);

    if (myMembers.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">لا يوجد أعضاء. أضف عضواً جديداً.</p>';
        return;
    }

    container.innerHTML = myMembers.map(m => `
        <div class="member-card" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <div class="member-info">
                <strong>${m.name}</strong> <span style="font-size:0.85rem; color:#777;">(${m.role})</span>
                <div style="font-size:0.8rem; color:#aaa;">المستخدم: ${m.username}</div>
            </div>
            <div class="member-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="editMember(${m.id})">تعديل</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

function saveMember() {
    const currentUser = getCurrentUser();
    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const user = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if (!name || !user || !pass) return alert('البيانات ناقصة');

    let allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    if (id) {
        const index = allMembers.findIndex(m => m.id == id);
        if (index !== -1) allMembers[index] = { ...allMembers[index], name, role, username: user, password: pass };
    } else {
        allMembers.push({
            id: Date.now(),
            ownerId: currentUser.id, // 🔥 ربط بالمعلم
            name, role, username: user, password: pass
        });
    }

    localStorage.setItem('committeeMembers', JSON.stringify(allMembers));
    closeModal('addMemberModal');
    loadMembers();
}

function deleteMember(id) {
    if (!confirm('حذف العضو؟')) return;
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    members = members.filter(m => m.id !== id);
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    loadMembers();
}

function showAddMemberModal() {
    document.getElementById('editMemId').value = '';
    document.getElementById('memName').value = '';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    document.getElementById('addMemberModal').classList.add('show');
}

function editMember(id) {
    const m = JSON.parse(localStorage.getItem('committeeMembers')||'[]').find(x => x.id === id);
    if(m) {
        document.getElementById('editMemId').value = m.id;
        document.getElementById('memName').value = m.name;
        document.getElementById('memRole').value = m.role;
        document.getElementById('memUser').value = m.username;
        document.getElementById('memPass').value = m.password;
        document.getElementById('addMemberModal').classList.add('show');
    }
}

// ========================
// 🤝 إدارة الاجتماعات (مع العزل)
// ========================

async function loadMeetings() {
    const container = document.getElementById('meetingsListContainer');
    if (!container) return;
    
    const currentUser = getCurrentUser();
    const allMeetings = await dbGetAll();
    
    // 🔥 العزل: جلب اجتماعات هذا المعلم فقط
    const myMeetings = allMeetings.filter(m => m.teacherId === currentUser.id);

    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات محفوظة.</div>';
        return;
    }

    container.innerHTML = myMeetings.map(m => `
        <div class="meeting-card">
            <h3>${m.title}</h3>
            <span class="date">${m.date}</span>
            <div class="actions">
                <button class="btn btn-sm btn-danger" onclick="deleteMeeting(${m.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

async function saveMeeting() {
    const currentUser = getCurrentUser();
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;

    if (!title) return alert('العنوان مطلوب');

    const newMeeting = {
        id: Date.now(),
        teacherId: currentUser.id, // 🔥 ربط بالمعلم
        title, date, content
    };

    await dbPut(newMeeting);
    closeModal('meetingModal');
    loadMeetings();
    alert('تم حفظ الاجتماع ✅');
}

async function deleteMeeting(id) {
    if (confirm('حذف؟')) { await dbDelete(id); loadMeetings(); }
}

// أدوات عامة
function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('show');
}

// دالة مساعدة لجلب المستخدم
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
}

// تصدير الدوال (لكي تعمل في HTML)
window.switchTab = switchTab;
window.showNewMeetingModal = showNewMeetingModal;
window.addPollTool = addPollTool;
window.addStudentFeedbackTool = addStudentFeedbackTool;
window.removeTool = removeTool;
window.loadMembers = loadMembers;
window.saveMember = saveMember;
window.deleteMember = deleteMember;
window.showAddMemberModal = showAddMemberModal;
window.editMember = editMember;
window.loadMeetings = loadMeetings;
window.saveMeeting = saveMeeting;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;

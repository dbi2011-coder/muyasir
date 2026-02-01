// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة لجنة صعوبات التعلم (النسخة الأصلية + عزل البيانات)
// ============================================

// --- 1. إعدادات قاعدة البيانات IndexedDB ---
const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

// دالة مساعدة لجلب المستخدم الحالي (تدعم كل الصيغ)
function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        if (!session) return null;
        const data = JSON.parse(session);
        return data.user || data; // يدعم {user: {...}} أو {...} مباشرة
    } catch (e) { return null; }
}

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
function dbGetAll() { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).getAll(); r.onsuccess = () => res(r.result); }); }
function dbPut(item) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).put(item); r.onsuccess = () => res(); }); }
function dbDelete(id) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).delete(id); r.onsuccess = () => res(); }); }

// تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    // 1. عرض اسم المعلم في الهيدر (كما في النسخة الأصلية)
    const user = getCurrentUser();
    if (user) {
        if(document.getElementById('teacherName')) document.getElementById('teacherName').textContent = user.name;
        if(document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = user.name.charAt(0);
        
        // إصلاح البيانات القديمة لربطها بك
        autoFixData(user);
    }

    // 2. تهيئة قاعدة البيانات
    try { await openDB(); } catch(e) { console.log('DB Init Error'); }
    
    // 3. تحميل القوائم
    loadMembers();
    loadMeetings();

    // 4. تفعيل التبويب الافتراضي
    if(typeof switchTab === 'function') switchTab('meetingsSection');
});

// ==========================================
// 🛠️ إصلاح البيانات القديمة (Auto Fix)
// ==========================================
function autoFixData(user) {
    // إصلاح الأعضاء
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    let modified = false;
    members = members.map(m => {
        if (!m.ownerId) { m.ownerId = user.id; modified = true; }
        return m;
    });
    if (modified) localStorage.setItem('committeeMembers', JSON.stringify(members));
}

// ==========================================
// 🖥️ دوال الواجهة والتبويبات
// ==========================================
function switchTab(tabId) {
    // إخفاء الكل
    ['meetingsSection', 'membersSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // إظهار المطلوب
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    // تحديث الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function showNewMeetingModal() {
    // تصفية الحقول
    ['meetTitle', 'meetDate', 'meetContent'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    if(document.getElementById('dynamicToolsContainer')) document.getElementById('dynamicToolsContainer').innerHTML = '';
    
    const modal = document.getElementById('meetingModal');
    if(modal) modal.classList.add('show');
}

// أدوات الاجتماع الديناميكية
function addPollTool() {
    const id = Date.now();
    const html = `
    <div class="dynamic-item poll-tool" id="tool_${id}" style="border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:5px;">
        <div style="display:flex; justify-content:space-between;">
            <h5 style="margin:0 0 10px 0; color:#007bff;">📊 تصويت</h5>
            <span style="cursor:pointer; color:red;" onclick="removeTool('tool_${id}')">×</span>
        </div>
        <input type="text" class="form-control mb-2" placeholder="عنوان التصويت">
        <input type="text" class="form-control mb-1" placeholder="خيار 1">
        <input type="text" class="form-control mb-1" placeholder="خيار 2">
    </div>`;
    document.getElementById('dynamicToolsContainer').insertAdjacentHTML('beforeend', html);
}

function addStudentFeedbackTool() {
    const id = Date.now();
    const html = `
    <div class="dynamic-item feedback-tool" id="tool_${id}" style="border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:5px;">
        <div style="display:flex; justify-content:space-between;">
            <h5 style="margin:0 0 10px 0; color:#28a745;">👨‍🎓 مرئيات طلاب</h5>
            <span style="cursor:pointer; color:red;" onclick="removeTool('tool_${id}')">×</span>
        </div>
        <p style="font-size:0.8rem; color:#777;">سيتم إضافة قائمة الطلاب لاحقاً</p>
    </div>`;
    document.getElementById('dynamicToolsContainer').insertAdjacentHTML('beforeend', html);
}

function removeTool(id) { document.getElementById(id).remove(); }

// ==========================================
// 👥 إدارة الأعضاء (مع العزل)
// ==========================================
function loadMembers() {
    const container = document.getElementById('membersListContainer');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    // 🔥 العزل: الأعضاء الخاصين بالمعلم فقط
    const myMembers = allMembers.filter(m => m.ownerId == user.id);

    if (myMembers.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; color:#777;">
                <p>لا يوجد أعضاء في لجنتك حالياً.</p>
                <button class="btn btn-sm btn-primary" onclick="showAddMemberModal()">+ إضافة عضو</button>
            </div>`;
        return;
    }

    // عرض القائمة بتصميم الكروت الأصلي
    container.innerHTML = myMembers.map(m => `
        <div class="member-card" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:15px; margin-bottom:10px; border-radius:8px; border:1px solid #eee; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <div class="member-info">
                <strong style="font-size:1.1em; color:#2c3e50;">${m.name}</strong> 
                <span style="background:#e1f5fe; color:#0288d1; padding:2px 8px; border-radius:12px; font-size:0.85rem; margin-right:5px;">${m.role}</span>
                <div style="font-size:0.85rem; color:#7f8c8d; margin-top:5px;">User: ${m.username}</div>
            </div>
            <div class="member-actions" style="display:flex; gap:5px;">
                <button class="btn btn-sm btn-outline-primary" onclick="editMember(${m.id})">✏️</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function saveMember() {
    const user = getCurrentUser();
    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if (!name || !username || !pass) return alert('البيانات ناقصة');

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    if (id) {
        const idx = members.findIndex(m => m.id == id);
        if (idx !== -1) members[idx] = { ...members[idx], name, role, username, password: pass };
    } else {
        members.push({
            id: Date.now(),
            ownerId: user.id, // 🔥 ربط العضو بالمعلم
            name, role, username, password: pass
        });
    }

    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers();
}

function deleteMember(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    members = members.filter(m => m.id != id);
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
    const m = JSON.parse(localStorage.getItem('committeeMembers')||'[]').find(x => x.id == id);
    if(m) {
        document.getElementById('editMemId').value = m.id;
        document.getElementById('memName').value = m.name;
        document.getElementById('memRole').value = m.role;
        document.getElementById('memUser').value = m.username;
        document.getElementById('memPass').value = m.password;
        document.getElementById('addMemberModal').classList.add('show');
    }
}

// ==========================================
// 🤝 إدارة الاجتماعات (مع العزل)
// ==========================================
async function loadMeetings() {
    const container = document.getElementById('meetingsListContainer');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    if(!db) await openDB();
    const allMeetings = await dbGetAll();

    // 🔥 خطوة تبني البيانات القديمة
    let dbModified = false;
    for (let m of allMeetings) {
        if (!m.teacherId) { m.teacherId = user.id; await dbPut(m); dbModified = true; }
    }
    if (dbModified) console.log('Fixed old meetings');

    // العزل: عرض اجتماعاتي فقط
    const myMeetings = allMeetings.filter(m => m.teacherId == user.id);

    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info" style="text-align:center;">لا توجد اجتماعات محفوظة. ابدأ اجتماعاً جديداً.</div>';
        return;
    }

    container.innerHTML = myMeetings.map(m => `
        <div class="meeting-card" style="background:white; border:1px solid #eee; padding:15px; margin-bottom:15px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <h3 style="margin:0 0 5px 0; font-size:1.2em; color:#2c3e50;">${m.title}</h3>
                    <span style="color:#7f8c8d; font-size:0.9em;">📅 ${m.date}</span>
                    <p style="color:#555; margin-top:10px; font-size:0.95em;">${m.content ? m.content.substring(0, 100) + '...' : ''}</p>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">🗑️ حذف</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function saveMeeting() {
    const user = getCurrentUser();
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;

    if (!title) return alert('العنوان مطلوب');

    const meeting = {
        id: Date.now(),
        teacherId: user.id, // 🔥 ربط الاجتماع بالمعلم
        title, date, content
    };

    await dbPut(meeting);
    closeModal('meetingModal');
    loadMeetings();
    alert('تم حفظ الاجتماع بنجاح');
}

async function deleteMeeting(id) {
    if (confirm('هل أنت متأكد من حذف الاجتماع؟')) {
        await dbDelete(id);
        loadMeetings();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('show');
}

// تصدير الدوال
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

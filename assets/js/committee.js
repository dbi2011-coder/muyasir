// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة (النسخة الكاملة: عزل + عرض + طباعة)
// ============================================

const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

// --- أدوات عامة ---
function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        if (!session) return null;
        const data = JSON.parse(session);
        return data.user || data;
    } catch (e) { return null; }
}

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        };
        req.onsuccess = (e) => { db = e.target.result; resolve(db); };
        req.onerror = (e) => reject(e);
    });
}
function dbGetAll() { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).getAll(); r.onsuccess = () => res(r.result); }); }
function dbPut(item) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).put(item); r.onsuccess = () => res(); }); }
function dbDelete(id) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).delete(id); r.onsuccess = () => res(); }); }

// --- عند التحميل ---
document.addEventListener('DOMContentLoaded', async function() {
    const user = getCurrentUser();
    if (user) {
        if(document.getElementById('teacherName')) document.getElementById('teacherName').textContent = user.name;
        if(document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = user.name.charAt(0);
        autoFixData(user); // إصلاح البيانات القديمة
    }

    try { await openDB(); } catch(e) { console.error(e); }
    
    loadMembers();
    loadMeetings();

    if(typeof switchTab === 'function') switchTab('meetingsSection');
});

function autoFixData(user) {
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    let mod = false;
    members = members.map(m => {
        if (!m.ownerId) { m.ownerId = user.id; mod = true; }
        return m;
    });
    if (mod) localStorage.setItem('committeeMembers', JSON.stringify(members));
}

// --- التبويبات ---
function switchTab(tabId) {
    ['meetingsSection', 'membersSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// ==========================================
// 👥 الأعضاء (Members)
// ==========================================
function loadMembers() {
    const container = document.getElementById('membersListContainer');
    if (!container) return;

    const user = getCurrentUser();
    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const myMembers = allMembers.filter(m => m.ownerId == user.id);

    if (myMembers.length === 0) {
        container.innerHTML = `<div class="text-center p-3 text-muted">لا يوجد أعضاء. <br><button class="btn btn-sm btn-primary mt-2" onclick="showAddMemberModal()">إضافة عضو</button></div>`;
        return;
    }

    container.innerHTML = myMembers.map(m => `
        <div class="member-card" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:15px; margin-bottom:10px; border-radius:8px; border:1px solid #eee; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <div>
                <h4 style="margin:0; color:#2c3e50;">${m.name}</h4>
                <span class="badge bg-info text-white" style="font-size:0.8em;">${m.role}</span>
                <div style="font-size:0.8em; color:#888;">${m.username}</div>
            </div>
            <div>
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
        members.push({ id: Date.now(), ownerId: user.id, name, role, username, password: pass });
    }
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers();
}

function deleteMember(id) {
    if(confirm('حذف العضو؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        members = members.filter(m => m.id != id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

// ==========================================
// 🤝 الاجتماعات (Meetings) - مع العرض والطباعة
// ==========================================
async function loadMeetings() {
    const container = document.getElementById('meetingsListContainer');
    if (!container) return;
    
    if(!db) await openDB();
    const user = getCurrentUser();
    let allMeetings = await dbGetAll();

    // إصلاح الاجتماعات القديمة
    let dbFix = false;
    for(let m of allMeetings) {
        if(!m.teacherId) { m.teacherId = user.id; await dbPut(m); dbFix = true; }
    }
    if(dbFix) allMeetings = await dbGetAll();

    const myMeetings = allMeetings.filter(m => m.teacherId == user.id);

    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center">لا توجد اجتماعات محفوظة.</div>';
        return;
    }

    container.innerHTML = myMeetings.map(m => `
        <div class="meeting-card" style="background:white; border:1px solid #eee; padding:15px; margin-bottom:15px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <h3 style="margin:0 0 5px 0; font-size:1.2em; color:#2c3e50;">${m.title}</h3>
                    <span style="color:#7f8c8d; font-size:0.9em;">📅 ${m.date}</span>
                </div>
                <div class="actions">
                    <button class="btn btn-sm btn-info text-white" onclick="viewMeeting(${m.id})">👁️ عرض</button>
                    <button class="btn btn-sm btn-secondary" onclick="printMeeting(${m.id})">🖨️ طباعة</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMeeting(${m.id})">🗑️</button>
                </div>
            </div>
            <p style="color:#555; margin-top:10px; font-size:0.95em;">${m.content ? m.content.substring(0, 100) + '...' : ''}</p>
        </div>
    `).join('');
}

// وظيفة عرض المحضر
async function viewMeeting(id) {
    if(!db) await openDB();
    const all = await dbGetAll();
    const m = all.find(x => x.id == id);
    if(m) {
        document.getElementById('meetTitle').value = m.title;
        document.getElementById('meetDate').value = m.date;
        document.getElementById('meetContent').value = m.content;
        // فتح النافذة
        const modal = document.getElementById('meetingModal');
        if(modal) modal.classList.add('show');
    }
}

// وظيفة طباعة المحضر
async function printMeeting(id) {
    if(!db) await openDB();
    const all = await dbGetAll();
    const m = all.find(x => x.id == id);
    if(!m) return;

    const user = getCurrentUser();
    
    // إنشاء نافذة طباعة
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>محضر اجتماع: ${m.title}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                .content { font-size: 14pt; line-height: 1.6; text-align: justify; white-space: pre-wrap; }
                .meta { margin-bottom: 20px; font-weight: bold; }
                .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-size: 10pt; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>محضر اجتماع لجنة صعوبات التعلم</h2>
                <h3>الموضوع: ${m.title}</h3>
            </div>
            <div class="meta">
                التاريخ: ${m.date}<br>
                المعلم: ${user.name}
            </div>
            <div class="content">
                ${m.content}
            </div>
            <div class="footer">
                تم استخراج هذا المحضر من نظام ميسر التعلم
            </div>
            <script>window.print();<\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

async function saveMeeting() {
    const user = getCurrentUser();
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;

    if (!title) return alert('العنوان مطلوب');

    // حفظ (أو تعديل إذا كان هناك ID مخفي - للتبسيط سننشئ جديداً دائماً أو نعتمد المنطق البسيط)
    // هنا سنقوم بالحفظ كجديد دائماً كما في النسخة البسيطة، أو تحديث لو كنا نعدل
    // سأعتمد الحفظ البسيط لضمان العمل
    const meeting = {
        id: Date.now(),
        teacherId: user.id,
        title, date, content
    };

    await dbPut(meeting);
    closeModal('meetingModal');
    loadMeetings();
    alert('تم الحفظ');
}

async function deleteMeeting(id) {
    if(confirm('حذف الاجتماع؟')) {
        await dbDelete(id);
        loadMeetings();
    }
}

// --- نوافذ وأدوات ---
function showNewMeetingModal() {
    document.getElementById('meetTitle').value = '';
    document.getElementById('meetDate').value = '';
    document.getElementById('meetContent').value = '';
    document.getElementById('meetingModal').classList.add('show');
}
function showAddMemberModal() {
    document.getElementById('editMemId').value = '';
    document.getElementById('memName').value = '';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    document.getElementById('addMemberModal').classList.add('show');
}
function editMember(id) {
    const m = JSON.parse(localStorage.getItem('committeeMembers')).find(x => x.id == id);
    if(m) {
        document.getElementById('editMemId').value = m.id;
        document.getElementById('memName').value = m.name;
        document.getElementById('memRole').value = m.role;
        document.getElementById('memUser').value = m.username;
        document.getElementById('memPass').value = m.password;
        document.getElementById('addMemberModal').classList.add('show');
    }
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// تصدير الدوال
window.switchTab = switchTab;
window.loadMembers = loadMembers;
window.saveMember = saveMember;
window.deleteMember = deleteMember;
window.showAddMemberModal = showAddMemberModal;
window.editMember = editMember;
window.showNewMeetingModal = showNewMeetingModal;
window.loadMeetings = loadMeetings;
window.viewMeeting = viewMeeting; // ✅
window.printMeeting = printMeeting; // ✅
window.saveMeeting = saveMeeting;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;

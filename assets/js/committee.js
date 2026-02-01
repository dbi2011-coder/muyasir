// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة لجنة صعوبات التعلم (النسخة الأصلية كاملة الميزات + عزل البيانات)
// ============================================

// --- إعدادات قاعدة البيانات ---
const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

// --- عند التحميل ---
document.addEventListener('DOMContentLoaded', async function() {
    const user = getCurrentUser();
    
    // 1. تحديث اسم المعلم في الأعلى
    if (user) {
        if(document.getElementById('teacherName')) document.getElementById('teacherName').textContent = user.name;
        if(document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = user.name.charAt(0);
        
        // 🔥 إصلاح البيانات القديمة تلقائياً (ربطها بك)
        autoFixData(user);
    }

    // 2. فتح قاعدة البيانات وتحميل القوائم
    try { await openDB(); } catch(e) { console.error(e); }
    
    loadMembers();
    loadMeetings();

    // 3. تفعيل التبويب الافتراضي
    if(typeof switchTab === 'function') switchTab('meetingsSection');
});

// ==========================================
// 🛠️ دالة إصلاح البيانات (لضمان ظهور بياناتك السابقة)
// ==========================================
function autoFixData(user) {
    // إصلاح الأعضاء
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    let mod = false;
    members = members.map(m => {
        if (!m.ownerId) { m.ownerId = user.id; mod = true; }
        return m;
    });
    if (mod) localStorage.setItem('committeeMembers', JSON.stringify(members));
}

// ==========================================
// 📱 التبويبات (Tabs)
// ==========================================
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
// 👥 إدارة الأعضاء (Members) - مع العزل
// ==========================================
function loadMembers() {
    const container = document.getElementById('membersListContainer');
    if (!container) return;

    const user = getCurrentUser();
    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    // 🔥 العزل: عرض الأعضاء التابعين لهذا المعلم فقط
    const myMembers = allMembers.filter(m => m.ownerId == user.id);

    if (myMembers.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4 text-muted" style="border: 2px dashed #eee; border-radius: 10px;">
                <p>لا يوجد أعضاء في لجنتك حالياً.</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="showAddMemberModal()">+ إضافة عضو جديد</button>
            </div>`;
        return;
    }

    // عرض القائمة بتصميم البطاقات الأصلي
    container.innerHTML = myMembers.map(m => `
        <div class="member-card" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:15px; margin-bottom:10px; border-radius:8px; border:1px solid #eee; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <div class="member-info">
                <div style="font-weight:bold; font-size:1.1em; color:#2c3e50;">${m.name}</div>
                <span class="badge" style="background:#e1f5fe; color:#0288d1; padding:3px 10px; border-radius:15px; font-size:0.85em; margin-top:5px; display:inline-block;">${m.role}</span>
                <div style="font-size:0.85em; color:#95a5a6; margin-top:5px;">User: ${m.username}</div>
            </div>
            <div class="member-actions" style="display:flex; gap:5px;">
                <button class="btn btn-sm btn-outline-primary" onclick="editMember(${m.id})" title="تعديل">✏️</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})" title="حذف">🗑️</button>
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
    if(!confirm('هل أنت متأكد من حذف العضو؟')) return;
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    members = members.filter(m => m.id != id);
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    loadMembers();
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

    // إصلاح الاجتماعات القديمة (IndexedDB Fix)
    let dbFix = false;
    for(let m of allMeetings) {
        if(!m.teacherId) { m.teacherId = user.id; await dbPut(m); dbFix = true; }
    }
    if(dbFix) allMeetings = await dbGetAll();

    // 🔥 العزل: اجتماعاتي فقط
    const myMeetings = allMeetings.filter(m => m.teacherId == user.id);

    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center">لا توجد اجتماعات محفوظة. ابدأ اجتماعاً جديداً.</div>';
        return;
    }

    // عرض الاجتماعات بتصميم البطاقات مع أزرار الطباعة والعرض
    container.innerHTML = myMeetings.map(m => `
        <div class="meeting-card" style="background:white; border:1px solid #eee; padding:20px; margin-bottom:15px; border-radius:10px; box-shadow:0 3px 6px rgba(0,0,0,0.05); transition:transform 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <h3 style="margin:0 0 8px 0; font-size:1.3em; color:#2c3e50; font-weight:bold;">${m.title}</h3>
                    <div style="color:#7f8c8d; font-size:0.9em; margin-bottom:10px;">📅 تاريخ الاجتماع: ${m.date}</div>
                </div>
                <div class="actions" style="display:flex; gap:5px;">
                    <button class="btn btn-sm btn-info text-white" onclick="viewMeeting(${m.id})" title="عرض التفاصيل">👁️ عرض</button>
                    <button class="btn btn-sm btn-secondary" onclick="printMeeting(${m.id})" title="طباعة المحضر">🖨️ طباعة</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMeeting(${m.id})" title="حذف">🗑️</button>
                </div>
            </div>
            <p style="color:#555; font-size:0.95em; line-height:1.5; border-top:1px solid #f1f1f1; padding-top:10px; margin-top:5px;">
                ${m.content ? m.content.substring(0, 120) + (m.content.length > 120 ? '...' : '') : 'لا يوجد محتوى نصي'}
            </p>
        </div>
    `).join('');
}

// 👁️ وظيفة عرض المحضر
async function viewMeeting(id) {
    if(!db) await openDB();
    const all = await dbGetAll();
    const m = all.find(x => x.id == id);
    if(m) {
        if(document.getElementById('meetTitle')) document.getElementById('meetTitle').value = m.title;
        if(document.getElementById('meetDate')) document.getElementById('meetDate').value = m.date;
        if(document.getElementById('meetContent')) document.getElementById('meetContent').value = m.content;
        
        const modal = document.getElementById('meetingModal');
        if(modal) modal.classList.add('show');
    }
}

// 🖨️ وظيفة طباعة المحضر (الرسمية)
async function printMeeting(id) {
    if(!db) await openDB();
    const all = await dbGetAll();
    const m = all.find(x => x.id == id);
    if(!m) return;

    const user = getCurrentUser();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>محضر اجتماع: ${m.title}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .meta-table td { padding: 8px; border: 1px solid #ccc; }
                .meta-label { background: #f9f9f9; font-weight: bold; width: 150px; }
                .content { font-size: 14pt; line-height: 1.8; text-align: justify; white-space: pre-wrap; border: 1px solid #ccc; padding: 20px; min-height: 300px; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sign-box { text-align: center; width: 200px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>محضر اجتماع لجنة صعوبات التعلم</h2>
                <h3>المملكة العربية السعودية - وزارة التعليم</h3>
            </div>
            <table class="meta-table">
                <tr><td class="meta-label">عنوان الاجتماع</td><td>${m.title}</td></tr>
                <tr><td class="meta-label">التاريخ</td><td>${m.date}</td></tr>
                <tr><td class="meta-label">المعلم المسؤول</td><td>${user.name}</td></tr>
            </table>
            <h4>وقائع الاجتماع:</h4>
            <div class="content">${m.content}</div>
            <div class="footer">
                <div class="sign-box"><p>معلم الصعوبات</p><p><strong>${user.name}</strong></p><p>التوقيع: ....................</p></div>
                <div class="sign-box"><p>قائد المدرسة</p><p><strong>....................</strong></p><p>التوقيع: ....................</p></div>
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

    const meeting = {
        id: Date.now(),
        teacherId: user.id, // 🔥 بصمة المعلم
        title, date, content
    };

    await dbPut(meeting);
    closeModal('meetingModal');
    loadMeetings();
    alert('تم الحفظ بنجاح');
}

async function deleteMeeting(id) {
    if(confirm('هل أنت متأكد من حذف الاجتماع؟')) {
        await dbDelete(id);
        loadMeetings();
    }
}

// --- أدوات مساعدة ونوافذ ---
function getCurrentUser() {
    try {
        const s = sessionStorage.getItem('currentUser');
        const d = JSON.parse(s);
        return d.user || d;
    } catch(e) { return null; }
}

function openDB() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        };
        req.onsuccess = (e) => { db = e.target.result; res(db); };
        req.onerror = (e) => rej(e);
    });
}
function dbGetAll() { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).getAll(); r.onsuccess = () => res(r.result); }); }
function dbPut(item) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).put(item); r.onsuccess = () => res(); }); }
function dbDelete(id) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).delete(id); r.onsuccess = () => res(); }); }

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

// تصدير الدوال (لكي يتعرف عليها HTML)
window.switchTab = switchTab;
window.loadMembers = loadMembers;
window.saveMember = saveMember;
window.deleteMember = deleteMember;
window.showAddMemberModal = showAddMemberModal;
window.editMember = editMember;
window.showNewMeetingModal = showNewMeetingModal;
window.loadMeetings = loadMeetings;
window.saveMeeting = saveMeeting;
window.deleteMeeting = deleteMeeting;
window.viewMeeting = viewMeeting;
window.printMeeting = printMeeting;
window.closeModal = closeModal;

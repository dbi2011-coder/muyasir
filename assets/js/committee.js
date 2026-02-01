// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة (إصلاح التبويبات + استعادة البيانات القديمة)
// ============================================

// --- إعدادات قاعدة البيانات ---
const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

// 1. تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    // أ) عرض اسم المعلم
    const user = getCurrentUser();
    if (user) {
        if(document.getElementById('teacherName')) document.getElementById('teacherName').textContent = user.name;
        if(document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = user.name.charAt(0);
        
        // ب) خطوة هامة: إصلاح البيانات القديمة وربطها بك
        autoFixCommitteeData(user);
    }

    // ج) فتح قاعدة البيانات
    try { await openDB(); } catch(e) { console.error('DB Error', e); }

    // د) تحميل البيانات
    loadMembers();
    loadMeetings();

    // هـ) تفعيل التبويب الأول افتراضياً
    switchTab('meetingsSection');
});

// ==========================================
// 🛠️ دالة إصلاح البيانات (لحل مشكلة اختفاء البيانات السابقة)
// ==========================================
async function autoFixCommitteeData(user) {
    // 1. إصلاح الأعضاء (LocalStorage)
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    let memModified = false;
    members = members.map(m => {
        // إذا كان العضو "يتيماً" (ليس له ownerId)، نربطه بك
        if (!m.ownerId) {
            m.ownerId = user.id;
            memModified = true;
        }
        return m;
    });
    if (memModified) {
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        console.log("✅ تم استعادة الأعضاء القدامى.");
    }

    // 2. إصلاح الاجتماعات (IndexedDB) - سيتم معالجتها عند التحميل
    // ملاحظة: إصلاح IndexedDB يتطلب فتح الاتصال أولاً، لذا سيتم في loadMeetings
}

// ==========================================
// 📱 دوال التبويبات (Tabs) - إصلاح المشكلة الأولى
// ==========================================
function switchTab(tabId) {
    // 1. إخفاء جميع الأقسام
    const sections = ['meetingsSection', 'membersSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 2. إظهار القسم المطلوب
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
    } else {
        console.error(`القسم ${tabId} غير موجود في HTML`);
        return;
    }

    // 3. تحديث حالة الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // محاولة العثور على الزر الذي تم ضغطه
    // نبحث عن الزر الذي يحتوي في الـ onclick على اسم التبويب
    const activeBtn = document.querySelector(`button[onclick*="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// ==========================================
// 👥 إدارة الأعضاء (Members)
// ==========================================
function loadMembers() {
    const container = document.getElementById('membersListContainer');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    // جلب أعضائك فقط
    const myMembers = allMembers.filter(m => m.ownerId == user.id);

    if (myMembers.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px; color:#777;">
                <p>لا يوجد أعضاء في لجنتك حالياً.</p>
                <button class="btn btn-sm btn-primary" onclick="showAddMemberModal()">+ إضافة عضو جديد</button>
            </div>`;
        return;
    }

    container.innerHTML = myMembers.map(m => `
        <div class="member-card" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:15px; margin-bottom:10px; border-radius:8px; border:1px solid #eee; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <div>
                <h4 style="margin:0 0 5px 0; color:#2c3e50;">${m.name}</h4>
                <span class="badge" style="background:#e3f2fd; color:#0d47a1; padding:2px 8px; border-radius:4px; font-size:0.8em;">${m.role}</span>
                <div style="font-size:0.8em; color:#888; margin-top:5px;">User: ${m.username}</div>
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
    if (!user) return alert("يرجى تسجيل الدخول");

    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if (!name || !username || !pass) return alert("البيانات ناقصة");

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    if (id) {
        // تعديل
        const idx = members.findIndex(m => m.id == id);
        if (idx !== -1) {
            members[idx] = { ...members[idx], name, role, username, password: pass }; // الحفاظ على ownerId القديم
        }
    } else {
        // إضافة جديد (مع ربطه بك)
        members.push({
            id: Date.now(),
            ownerId: user.id, // 🔥 ربط العضو بالمعلم الحالي
            name, role, username, password: pass
        });
    }

    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers(); // تحديث القائمة فوراً
}

function deleteMember(id) {
    if(!confirm("حذف العضو؟")) return;
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    members = members.filter(m => m.id != id);
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    loadMembers();
}

// ==========================================
// 🤝 إدارة الاجتماعات (Meetings)
// ==========================================
async function loadMeetings() {
    const container = document.getElementById('meetingsListContainer');
    if (!container) return;
    if (!db) await openDB(); // التأكد من فتح القاعدة

    const user = getCurrentUser();
    let allMeetings = await dbGetAll();

    // 🔥 خطوة إصلاح الاجتماعات القديمة (IndexedDB Auto-Fix)
    let dbModified = false;
    for (let m of allMeetings) {
        if (!m.teacherId) {
            m.teacherId = user.id; // تبني الاجتماع القديم
            await dbPut(m); // تحديث في القاعدة
            dbModified = true;
        }
    }
    if (dbModified) {
        allMeetings = await dbGetAll(); // إعادة جلب بعد التحديث
        console.log("✅ تم استعادة الاجتماعات القديمة.");
    }

    // عرض اجتماعاتك فقط
    const myMeetings = allMeetings.filter(m => m.teacherId == user.id);

    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات محفوظة.</div>';
        return;
    }

    container.innerHTML = myMeetings.map(m => `
        <div class="meeting-card" style="background:white; border:1px solid #eee; padding:15px; margin-bottom:15px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between;">
                <h3 style="margin:0; font-size:1.1em;">${m.title}</h3>
                <button class="btn btn-sm btn-danger" onclick="deleteMeeting(${m.id})">×</button>
            </div>
            <div style="color:#777; font-size:0.9em; margin:5px 0;">📅 ${m.date}</div>
            <p style="color:#555; font-size:0.95em;">${m.content ? m.content.substring(0, 80) + '...' : ''}</p>
        </div>
    `).join('');
}

async function saveMeeting() {
    const user = getCurrentUser();
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;

    if (!title) return alert("عنوان الاجتماع مطلوب");

    const meeting = {
        id: Date.now(),
        teacherId: user.id, // 🔥 ربط الاجتماع بك
        title, date, content
    };

    await dbPut(meeting);
    closeModal('meetingModal');
    loadMeetings(); // تحديث القائمة
    alert("تم حفظ الاجتماع");
}

async function deleteMeeting(id) {
    if(confirm("حذف الاجتماع؟")) {
        await dbDelete(id);
        loadMeetings();
    }
}


// ==========================================
// ⚙️ أدوات مساعدة (Helpers)
// ==========================================

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
function dbGetAll() { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readonly'); const req = tx.objectStore(STORE_NAME).getAll(); req.onsuccess = () => res(req.result); }); }
function dbPut(item) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const req = tx.objectStore(STORE_NAME).put(item); req.onsuccess = () => res(); }); }
function dbDelete(id) { return new Promise((res) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const req = tx.objectStore(STORE_NAME).delete(id); req.onsuccess = () => res(); }); }

function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem('currentUser')).user || JSON.parse(sessionStorage.getItem('currentUser')); } catch(e) { return null; }
}

// نوافذ (Modals)
function showAddMemberModal() {
    document.getElementById('editMemId').value = '';
    document.getElementById('memName').value = '';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    document.getElementById('addMemberModal').classList.add('show');
}
function showNewMeetingModal() {
    document.getElementById('meetingModal').classList.add('show');
}
function editMember(id) {
    const m = JSON.parse(localStorage.getItem('committeeMembers')).find(x => x.id == id);
    if (m) {
        document.getElementById('editMemId').value = m.id;
        document.getElementById('memName').value = m.name;
        document.getElementById('memRole').value = m.role;
        document.getElementById('memUser').value = m.username;
        document.getElementById('memPass').value = m.password;
        document.getElementById('addMemberModal').classList.add('show');
    }
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// تصدير الدوال (هام جداً لتعمل الأزرار في HTML)
window.switchTab = switchTab;
window.saveMember = saveMember;
window.deleteMember = deleteMember;
window.showAddMemberModal = showAddMemberModal;
window.editMember = editMember;
window.showNewMeetingModal = showNewMeetingModal;
window.saveMeeting = saveMeeting;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;
window.loadMembers = loadMembers; // في حال احتجت استدعاءها يدوياً

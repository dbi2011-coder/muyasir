// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة (بيانات خاصة لكل معلم)
// ============================================

// --- إعدادات قاعدة البيانات ---
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

document.addEventListener('DOMContentLoaded', async function() {
    try { await openDB(); } catch(e) { console.log('DB init error'); }
    
    // تحميل البيانات فقط إذا كنا في صفحة اللجنة
    if (document.getElementById('membersListContainer')) loadMembers();
    if (document.getElementById('meetingsListContainer')) loadMeetings();
});

// ========================
// 👥 إدارة الأعضاء (خاصة)
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
        <div class="member-card">
            <div class="member-info">
                <h4>${m.name}</h4>
                <span>${m.role}</span>
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
        // تعديل عضو موجود
        const index = allMembers.findIndex(m => m.id == id);
        if (index !== -1) {
            allMembers[index] = { ...allMembers[index], name, role, username: user, password: pass };
        }
    } else {
        // إضافة عضو جديد (مع ربطه بالمعلم الحالي)
        allMembers.push({
            id: Date.now(),
            ownerId: currentUser.id, // 🔥 ربط العضو بالمعلم
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

// ========================
// 🤝 إدارة الاجتماعات (خاصة)
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
        teacherId: currentUser.id, // 🔥 ربط الاجتماع بالمعلم
        title, date, content,
        attendees: [], 
        signatures: {}
    };

    await dbPut(newMeeting);
    closeModal('meetingModal');
    loadMeetings();
    alert('تم حفظ الاجتماع ✅');
}

async function deleteMeeting(id) {
    if (confirm('حذف؟')) { await dbDelete(id); loadMeetings(); }
}

// أدوات المساعدة والنوافذ
function showAddMemberModal() {
    document.getElementById('editMemId').value = '';
    document.getElementById('memName').value = '';
    document.getElementById('memRole').value = 'عضو';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    document.getElementById('addMemberModal').classList.add('show');
}
function editMember(id) {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const m = members.find(x => x.id === id);
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

// تصدير الدوال
window.loadMembers = loadMembers;
window.saveMember = saveMember;
window.deleteMember = deleteMember;
window.showAddMemberModal = showAddMemberModal;
window.editMember = editMember;
window.loadMeetings = loadMeetings;
window.saveMeeting = saveMeeting;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;

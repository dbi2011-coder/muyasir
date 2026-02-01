// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة (عزل البيانات + واجهة المستخدم)
// ============================================

// --- 1. إعدادات قاعدة البيانات IndexedDB ---
const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

// دالة مساعدة لجلب المستخدم الحالي بأمان
function getCurrentUser() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) return null;
    const data = JSON.parse(session);
    // دعم الصيغتين: سواء كان الكائن مباشرة أو داخل خاصية user
    return data.user || data;
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
// 👥 إدارة الأعضاء (مع العزل التام)
// ========================

function loadMembers() {
    const container = document.getElementById('membersListContainer');
    if (!container) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return; // يجب أن يكون مسجلاً

    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    // 🔥 العزل: جلب أعضاء هذا المعلم فقط (المقارنة بـ ownerId)
    const myMembers = allMembers.filter(m => m.ownerId == currentUser.id);

    if (myMembers.length === 0) {
        container.innerHTML = '<p class="text-center text-muted" style="padding:20px;">لا يوجد أعضاء في لجنتك. أضف عضواً جديداً.</p>';
        return;
    }

    container.innerHTML = myMembers.map(m => `
        <div class="member-card" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee; background:#fff; margin-bottom:10px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div class="member-info">
                <strong style="font-size:1.1em; color:#2c3e50;">${m.name}</strong> 
                <span style="font-size:0.85rem; background:#e1f5fe; color:#0288d1; padding:2px 8px; border-radius:12px; margin-right:5px;">${m.role}</span>
                <div style="font-size:0.85rem; color:#7f8c8d; margin-top:5px;">اسم المستخدم: ${m.username}</div>
            </div>
            <div class="member-actions" style="display:flex; gap:5px;">
                <button class="btn btn-sm btn-outline-primary" onclick="editMember(${m.id})">✏️ تعديل</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function saveMember() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const user = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if (!name || !user || !pass) return alert('البيانات ناقصة');

    let allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    if (id) {
        // تعديل عضو موجود (يجب التأكد أنه يتبع للمعلم الحالي)
        const index = allMembers.findIndex(m => m.id == id && m.ownerId == currentUser.id);
        if (index !== -1) {
            allMembers[index] = { ...allMembers[index], name, role, username: user, password: pass };
        }
    } else {
        // إضافة عضو جديد (مع ربطه بالمعلم الحالي)
        allMembers.push({
            id: Date.now(),
            ownerId: currentUser.id, // 🔥 مفتاح العزل
            name, role, username: user, password: pass
        });
    }

    localStorage.setItem('committeeMembers', JSON.stringify(allMembers));
    closeModal('addMemberModal');
    loadMembers();
}

function deleteMember(id) {
    const currentUser = getCurrentUser();
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
    
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    // حذف العضو فقط إذا كان يتبع للمعلم الحالي
    members = members.filter(m => !(m.id == id && m.ownerId == currentUser.id));
    
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    loadMembers();
}

function showAddMemberModal() {
    document.getElementById('editMemId').value = '';
    document.getElementById('memName').value = '';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    
    // إعادة تعيين الدور للافتراضي
    const roleSelect = document.getElementById('memRole');
    if(roleSelect) roleSelect.value = 'عضو';

    const modal = document.getElementById('addMemberModal');
    if(modal) modal.classList.add('show');
}

function editMember(id) {
    const currentUser = getCurrentUser();
    // البحث فقط ضمن أعضاء المعلم الحالي
    const m = JSON.parse(localStorage.getItem('committeeMembers')||'[]').find(x => x.id == id && x.ownerId == currentUser.id);
    
    if(m) {
        document.getElementById('editMemId').value = m.id;
        document.getElementById('memName').value = m.name;
        document.getElementById('memRole').value = m.role;
        document.getElementById('memUser').value = m.username;
        document.getElementById('memPass').value = m.password;
        
        const modal = document.getElementById('addMemberModal');
        if(modal) modal.classList.add('show');
    }
}

// ========================
// 🤝 إدارة الاجتماعات (مع العزل التام)
// ========================

async function loadMeetings() {
    const container = document.getElementById('meetingsListContainer');
    if (!container) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const allMeetings = await dbGetAll();
    
    // 🔥 العزل: جلب اجتماعات هذا المعلم فقط (المقارنة بـ teacherId)
    const myMeetings = allMeetings.filter(m => m.teacherId == currentUser.id);

    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info" style="text-align:center;">لا توجد اجتماعات محفوظة. ابدأ اجتماعاً جديداً.</div>';
        return;
    }

    container.innerHTML = myMeetings.map(m => `
        <div class="meeting-card" style="background:white; border:1px solid #eee; border-radius:8px; padding:15px; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <h3 style="margin:0 0 5px 0; color:#2c3e50; font-size:1.2em;">${m.title}</h3>
                    <span class="date" style="color:#7f8c8d; font-size:0.9em;">📅 ${m.date}</span>
                    <p style="color:#555; margin-top:10px; font-size:0.95em;">${m.content ? m.content.substring(0, 100) + '...' : ''}</p>
                </div>
                <div class="actions">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">🗑️ حذف</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function saveMeeting() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;

    if (!title) return alert('العنوان مطلوب');

    const newMeeting = {
        id: Date.now(),
        teacherId: currentUser.id, // 🔥 مفتاح العزل
        title, date, content,
        // يمكن إضافة المزيد من الحقول هنا (مثل الحضور، الأدوات، إلخ)
    };

    await dbPut(newMeeting);
    closeModal('meetingModal');
    loadMeetings();
    alert('تم حفظ الاجتماع بنجاح ✅');
}

async function deleteMeeting(id) {
    const currentUser = getCurrentUser();
    // تأكد أولاً أن الاجتماع يخص المعلم الحالي (أمان إضافي)
    const allMeetings = await dbGetAll();
    const meeting = allMeetings.find(m => m.id == id && m.teacherId == currentUser.id);
    
    if (meeting) {
        if (confirm('هل أنت متأكد من حذف هذا الاجتماع؟')) { 
            await dbDelete(id); 
            loadMeetings(); 
        }
    }
}

// أدوات عامة
function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('show');
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

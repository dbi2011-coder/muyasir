// ============================================
// 📁 الملف: assets/js/committee.js
// ============================================

// --- إعدادات قاعدة البيانات (IndexedDB) للاجتماعات ---
const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

// دالة مساعدة لجلب المستخدم الحالي
function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        if (!session) return null;
        const data = JSON.parse(session);
        return data.user || data;
    } catch (e) { return null; }
}

// فتح قاعدة البيانات
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

// دوال التعامل مع قاعدة البيانات
function dbGetAll() { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbPut(item) { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).put(item); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }
function dbGet(id) { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbDelete(id) { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).delete(id); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }

// --- عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async function() {
    const user = getCurrentUser();
    if (user) {
        if(document.getElementById('userName')) document.getElementById('userName').textContent = user.name;
        autoFixMembers(user);
    }

    await openDB();
    loadMembers(); // تحميل الأعضاء
    loadMeetings(); // تحميل الاجتماعات
});

// إصلاح الأعضاء القدامى
function autoFixMembers(user) {
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    let modified = false;
    members = members.map(m => {
        if (!m.ownerId) { m.ownerId = user.id; modified = true; }
        return m;
    });
    if (modified) localStorage.setItem('committeeMembers', JSON.stringify(members));
}

// 🔥 دالة التبويبات (التي كانت مفقودة) 🔥
function switchTab(tab) {
    // إخفاء كل المحتويات
    document.getElementById('members-view').classList.remove('active');
    document.getElementById('meetings-view').classList.remove('active');
    
    // إزالة التنشيط من الأزرار
    document.getElementById('tab-members').classList.remove('active');
    document.getElementById('tab-meetings').classList.remove('active');
    
    // تفعيل التبويب المختار
    document.getElementById(`${tab}-view`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ==========================================
// 👥 إدارة الأعضاء
// ==========================================

function loadMembers() {
    const user = getCurrentUser();
    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const myMembers = allMembers.filter(m => m.ownerId == user.id);
    
    const container = document.getElementById('membersListContainer');
    if (myMembers.length === 0) { container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء.</div>'; return; }
    
    let html = '<table class="table table-bordered bg-white"><thead><tr><th>الاسم</th><th>الصفة</th><th>المستخدم</th><th>المرور</th><th>إجراءات</th></tr></thead><tbody>';
    myMembers.forEach(m => { html += `<tr><td>${m.name}</td><td>${m.role}</td><td>${m.username}</td><td>${m.password}</td><td><button class="btn btn-sm btn-primary" onclick="editMember(${m.id})">تعديل</button> <button class="btn btn-sm btn-danger" onclick="deleteMember(${m.id})">حذف</button></td></tr>`; });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function showAddMemberModal() {
    document.getElementById('addMemberModal').classList.add('show');
    document.getElementById('editMemId').value='';
    document.getElementById('memName').value='';
    document.getElementById('memUser').value='';
    document.getElementById('memPass').value='';
}

// 🔥 دالة الحفظ (مع التمويه الأمني - Deception) 🔥
function saveMember() {
    const user = getCurrentUser();
    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value.trim();
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value.trim();
    const pass = document.getElementById('memPass').value.trim();
    
    if(!name || !username || !pass) return alert('البيانات ناقصة');
    
    // 1. الفحص الشامل
    const mainUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const allAccounts = [...mainUsers, ...committeeMembers];

    // 2. هل يوجد تطابق تام (اسم مستخدم + كلمة مرور)؟
    const isDuplicate = allAccounts.some(account => {
        // نتجاهل العضو نفسه في حالة التعديل
        if (id && account.id == id) return false;
        
        // شرط التطابق التام
        return account.username === username && account.password === pass;
    });

    if (isDuplicate) {
        // ✅ تم تغيير الرسالة
        alert('اسم المستخدم غير متاح . يرجى اختيار اسم آخر');
        return; // إيقاف الحفظ
    }
    
    // 3. الحفظ
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    if(id) {
        const idx = members.findIndex(x => x.id == id);
        if(idx !== -1) members[idx] = { id: parseInt(id), ownerId: members[idx].ownerId, name, role, username, password: pass };
    } else {
        members.push({ id: Date.now(), ownerId: user.id, name, role, username, password: pass });
    }
    
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers();
    alert('تم حفظ العضو بنجاح ✅');
}

function editMember(id) {
    const members = JSON.parse(localStorage.getItem('committeeMembers')||'[]');
    const m = members.find(x => x.id === id);
    if(m) {
        document.getElementById('editMemId').value = m.id;
        document.getElementById('memName').value = m.name;
        document.getElementById('memRole').value = m.role;
        document.getElementById('memUser').value = m.username;
        document.getElementById('memPass').value = m.password;
        document.getElementById('addMemberModal').classList.add('show');
    }
}

function deleteMember(id) {
    if(confirm('هل أنت متأكد من الحذف؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers')||'[]');
        members = members.filter(x => x.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

// ==========================================
// 🛠️ أدوات ومرفقات الاجتماع
// ==========================================

function addPollTool() {
    const container = document.getElementById('dynamicToolsContainer');
    const id = Date.now();
    const html = `
    <div class="dynamic-item poll-tool" id="tool_${id}">
        <span class="remove-item-btn" onclick="removeTool('tool_${id}')">×</span>
        <h5 style="margin:0 0 10px 0; color:#007bff;">📊 تصويت جديد</h5>
        <input type="text" class="form-control mb-2 poll-question" placeholder="اكتب سؤال التصويت هنا">
        <div class="poll-options">
            <input type="text" class="form-control mb-1 poll-option" placeholder="خيار 1">
            <input type="text" class="form-control mb-1 poll-option" placeholder="خيار 2">
        </div>
        <button class="btn btn-sm btn-light" onclick="addPollOption(this)">+ خيار إضافي</button>
    </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

function addPollOption(btn) {
    const container = btn.previousElementSibling;
    container.insertAdjacentHTML('beforeend', `<input type="text" class="form-control mb-1 poll-option" placeholder="خيار جديد">`);
}

function addStudentFeedbackTool() {
    const container = document.getElementById('dynamicToolsContainer');
    const id = Date.now();
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacherUser = getCurrentUser();
    const students = users.filter(u => u.role === 'student' && u.teacherId == teacherUser.id);
    
    let options = '';
    students.forEach(s => options += `<option value="${s.id}">${s.name}</option>`);

    const html = `
    <div class="dynamic-item feedback-tool" id="tool_${id}">
        <span class="remove-item-btn" onclick="removeTool('tool_${id}')">×</span>
        <h5 style="margin:0 0 10px 0; color:#28a745;">👨‍🎓 طلب مرئيات عن طلاب</h5>
        <p style="font-size:0.85em; color:#666;">اختر الطلاب:</p>
        <select multiple class="form-control student-select" style="height:100px;">
            ${options}
        </select>
        <small style="color:#888;">Ctrl لتحديد أكثر من طالب</small>
    </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

function removeTool(id) { document.getElementById(id).remove(); }

// ----------------------------------------------------------------

function showNewMeetingModal() {
    ['meetTitle', 'meetDate', 'meetContent', 'meetPdf', 'meetImg'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    document.getElementById('dynamicToolsContainer').innerHTML = '';

    const user = getCurrentUser();
    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const myMembers = allMembers.filter(m => m.ownerId == user.id);

    const list = document.getElementById('attendeesList');
    list.innerHTML = '';
    
    if (myMembers.length === 0) {
        list.innerHTML = '<small class="text-danger">لا يوجد أعضاء. أضف أعضاء أولاً.</small>';
    } else {
        myMembers.forEach(m => {
            list.innerHTML += `<div><label style="cursor:pointer"><input type="checkbox" value="${m.id}" checked> ${m.name}</label></div>`;
        });
    }

    document.getElementById('meetingModal').classList.add('show');
}

async function saveMeeting() {
    const user = getCurrentUser();
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;

    if(!title || !date || !content) return alert('البيانات الإلزامية: العنوان، التاريخ، المحضر.');

    const polls = [];
    document.querySelectorAll('.poll-tool').forEach(div => {
        const question = div.querySelector('.poll-question').value;
        const options = [];
        div.querySelectorAll('.poll-option').forEach(opt => { if(opt.value) options.push(opt.value); });
        if(question && options.length > 0) polls.push({ id: Date.now() + Math.random(), question, options });
    });

    const requestedFeedback = [];
    document.querySelectorAll('.feedback-tool').forEach(div => {
        const select = div.querySelector('.student-select');
        Array.from(select.selectedOptions).forEach(opt => {
            requestedFeedback.push({ id: opt.value, name: opt.text });
        });
    });

    const attendees = [];
    document.querySelectorAll('#attendeesList input:checked').forEach(cb => attendees.push(parseInt(cb.value)));

    const readFile = (file) => new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsDataURL(file); });
    let pdfData = null, imgData = null;
    const pdfInput = document.getElementById('meetPdf');
    const imgInput = document.getElementById('meetImg');
    
    if (pdfInput.files[0]) pdfData = await readFile(pdfInput.files[0]);
    if (imgInput.files[0]) imgData = await readFile(imgInput.files[0]);

    const newMeeting = {
        id: Date.now(),
        teacherId: user.id,
        title, date, content,
        polls, requestedFeedback,
        pdfFile: pdfData, imgFile: imgData,
        attendees, signatures: {} 
    };

    try {
        await dbPut(newMeeting);
        closeModal('meetingModal');
        loadMeetings();
        alert('تم حفظ الاجتماع بنجاح ✅');
    } catch(e) { console.error(e); alert('خطأ في الحفظ'); }
}

async function loadMeetings() {
    const container = document.getElementById('meetingsListContainer');
    const user = getCurrentUser();
    
    try {
        let meetings = await dbGetAll();
        let dbFix = false;
        for(let m of meetings) {
            if(!m.teacherId) { m.teacherId = user.id; await dbPut(m); dbFix = true; }
        }
        if(dbFix) meetings = await dbGetAll();

        const myMeetings = meetings.filter(m => m.teacherId == user.id);

        if(myMeetings.length === 0) { container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات.</div>'; return; }
        
        myMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '';
        myMeetings.forEach(m => {
            const total = m.attendees ? m.attendees.length : 0;
            const signed = m.signatures ? Object.keys(m.signatures).length : 0;
            const progressColor = (signed === total && total > 0) ? 'green' : '#ffc107';
            
            html += `<div class="meeting-card">
                <div class="card-header-custom"><h3>${m.title}</h3><span class="card-date">${m.date}</span></div>
                <div class="card-body-custom"><p>${(m.content||'').substring(0,80)}...</p></div>
                <div class="card-footer-custom"><span style="font-size:0.85em; color:#666;">التوقيعات: <strong style="color:${progressColor}">${signed}</strong> / ${total}</span>
                <div><button class="btn btn-sm btn-outline-primary" onclick="viewMeetingDetails(${m.id})">📄 عرض المحضر</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">🗑️</button></div></div></div>`;
        });
        container.innerHTML = html;
    } catch(e) { console.error(e); }
}

async function viewMeetingDetails(id) {
    const meeting = await dbGet(id);
    if(!meeting) return;

    document.getElementById('viewMeetTitle').textContent = meeting.title;
    document.getElementById('viewMeetDate').textContent = meeting.date;
    document.getElementById('viewMeetContent').textContent = meeting.content;

    // النتائج
    const pollsContainer = document.getElementById('viewPollsResults');
    pollsContainer.innerHTML = '';
    if(meeting.polls && meeting.polls.length > 0) {
        pollsContainer.innerHTML = '<h5>📊 نتائج التصويت:</h5>';
        meeting.polls.forEach(poll => {
            const counts = {};
            poll.options.forEach(o => counts[o] = 0);
            Object.values(meeting.signatures || {}).forEach(sig => {
                if(sig.pollResponses && sig.pollResponses[poll.id]) {
                    const answer = sig.pollResponses[poll.id];
                    if(counts[answer] !== undefined) counts[answer]++;
                }
            });
            let resultsHtml = `<div class="poll-result-box"><strong>❓ ${poll.question}</strong><ul style="margin-top:5px;">`;
            for(const [opt, count] of Object.entries(counts)) {
                resultsHtml += `<li>${opt}: <strong>${count}</strong> صوت</li>`;
            }
            resultsHtml += `</ul></div>`;
            pollsContainer.innerHTML += resultsHtml;
        });
    }

    // المرئيات
    const feedbackContainer = document.getElementById('viewStudentsFeedback');
    feedbackContainer.innerHTML = '';
    if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
        feedbackContainer.innerHTML = '<h5>👨‍🎓 مرئيات الأعضاء:</h5>';
        meeting.requestedFeedback.forEach(req => {
            let feedbackHtml = `<div class="student-feedback-box"><h6 style="color:#28a745; margin:0 0 5px 0;">${req.name}</h6>`;
            let hasComments = false;
            Object.values(meeting.signatures || {}).forEach(sig => {
                if(sig.feedbackResponses && sig.feedbackResponses[req.id]) {
                    hasComments = true;
                    feedbackHtml += `<div class="feedback-item"><strong>${sig.name}:</strong> ${sig.feedbackResponses[req.id]}</div>`;
                }
            });
            if(!hasComments) feedbackHtml += `<small style="color:#999;">لا توجد ملاحظات.</small>`;
            feedbackHtml += `</div>`;
            feedbackContainer.innerHTML += feedbackHtml;
        });
    }

    // المرفقات
    const attachSection = document.getElementById('viewAttachments');
    const pdfContainer = document.getElementById('pdfContainer');
    const imgContainer = document.getElementById('imgContainer');
    const imgDisplay = document.getElementById('viewMeetImgDisplay');

    if(meeting.pdfFile || meeting.imgFile) {
        attachSection.style.display = 'block';
        if(meeting.pdfFile) pdfContainer.innerHTML = `<a href="${meeting.pdfFile}" download="attach.pdf" class="btn btn-sm btn-info">⬇️ تحميل PDF</a>`; else pdfContainer.innerHTML='';
        if(meeting.imgFile) { imgDisplay.src = meeting.imgFile; imgContainer.style.display='block'; } else imgContainer.style.display='none';
    } else { attachSection.style.display = 'none'; }

    // التوقيعات
    const tableBody = document.getElementById('signaturesTableBody');
    tableBody.innerHTML = '';
    
    const user = getCurrentUser();
    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const myMembers = allMembers.filter(m => m.ownerId == user.id);
    const attendeesList = myMembers.filter(m => (meeting.attendees||[]).includes(m.id));

    if(attendeesList.length === 0) tableBody.innerHTML = '<tr><td colspan="3">لا يوجد مدعوون.</td></tr>';
    else {
        attendeesList.forEach(member => {
            const sig = (meeting.signatures && meeting.signatures[member.id]) ? meeting.signatures[member.id] : null;
            let sigHtml = sig 
                ? (sig.image ? `<img src="${sig.image}" class="sig-img-display"><br><small>${new Date(sig.date).toLocaleDateString('ar-SA')}</small>` 
                             : `<b>${sig.name}</b><br><small>(اعتماد)</small>`)
                : `<span style="color:red">بانتظار التوقيع</span>`;
            
            tableBody.innerHTML += `<tr><td style="text-align:right;">أ/ ${member.name}</td><td>${member.role}</td><td>${sigHtml}</td></tr>`;
        });
    }

    document.getElementById('viewMeetingModal').classList.add('show');
}

async function deleteMeeting(id) { if(confirm('هل أنت متأكد من الحذف؟')) { await dbDelete(id); loadMeetings(); } }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// تصدير الدوال
window.addPollTool = addPollTool;
window.addPollOption = addPollOption;
window.addStudentFeedbackTool = addStudentFeedbackTool;
window.removeTool = removeTool;
window.showNewMeetingModal = showNewMeetingModal;
window.saveMeeting = saveMeeting;
window.loadMeetings = loadMeetings;
window.viewMeetingDetails = viewMeetingDetails;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.showAddMemberModal = showAddMemberModal;
window.saveMember = saveMember;
window.editMember = editMember;
window.deleteMember = deleteMember;

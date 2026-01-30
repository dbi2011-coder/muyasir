// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة (دعم البنود + رفع PDF وصور + عرضها في المحضر)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    loadMeetings();
    if(window.getCurrentUser) {
        const user = window.getCurrentUser();
        if(user && document.getElementById('userName')) document.getElementById('userName').textContent = user.name;
    }
});

function switchTab(tab) {
    document.getElementById('members-view').classList.remove('active');
    document.getElementById('meetings-view').classList.remove('active');
    document.getElementById('tab-members').classList.remove('active');
    document.getElementById('tab-meetings').classList.remove('active');
    document.getElementById(`${tab}-view`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// 1. إدارة الأعضاء
function loadMembers() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const container = document.getElementById('membersListContainer');
    if (members.length === 0) { container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء.</div>'; return; }
    let html = '<table class="table table-bordered bg-white"><thead><tr><th>الاسم</th><th>الصفة</th><th>المستخدم</th><th>المرور</th><th>إجراءات</th></tr></thead><tbody>';
    members.forEach(m => {
        html += `<tr><td>${m.name}</td><td>${m.role}</td><td>${m.username}</td><td>${m.password}</td><td><button class="btn btn-sm btn-primary" onclick="editMember(${m.id})">تعديل</button> <button class="btn btn-sm btn-danger" onclick="deleteMember(${m.id})">حذف</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// 2. إدارة الاجتماعات
function loadMeetings() {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const container = document.getElementById('meetingsListContainer');
    if(meetings.length === 0) { container.innerHTML = '<div class="alert alert-info" style="grid-column:1/-1;">لا توجد اجتماعات.</div>'; return; }
    
    meetings.sort((a, b) => new Date(b.date) - new Date(a.date));
    let html = '';
    meetings.forEach(m => {
        const total = m.attendees ? m.attendees.length : 0;
        const signed = m.signatures ? Object.keys(m.signatures).length : 0;
        const progressColor = (signed === total && total > 0) ? 'green' : '#ffc107';

        html += `
        <div class="meeting-card">
            <div class="card-header-custom"><h3>${m.title}</h3><span class="card-date">${m.date}</span></div>
            <div class="card-body-custom"><p>${(m.content||'').substring(0,80)}...</p></div>
            <div class="card-footer-custom">
                <span style="font-size:0.85em; color:#666;">التوقيعات: <strong style="color:${progressColor}">${signed}</strong> / ${total}</span>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewMeetingDetails(${m.id})">📄 عرض المحضر</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">🗑️</button>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// ✅ دالة عرض المحضر (المطورة: بنود + مرفقات + صور)
function viewMeetingDetails(id) {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    if(!meeting) return;

    document.getElementById('viewMeetTitle').textContent = meeting.title;
    document.getElementById('viewMeetDate').textContent = meeting.date;
    document.getElementById('viewMeetContent').textContent = meeting.content || 'لا توجد تفاصيل نصية إضافية.';

    // 1. عرض البنود (Topics)
    const topicsContainer = document.getElementById('viewMeetTopics');
    if (meeting.topics && meeting.topics.length > 0) {
        let topicsHtml = '<ul class="agenda-list">';
        meeting.topics.forEach(t => { topicsHtml += `<li>${t}</li>`; });
        topicsHtml += '</ul>';
        topicsContainer.innerHTML = topicsHtml;
    } else {
        topicsContainer.innerHTML = '';
    }

    // 2. عرض المرفقات (Attachments)
    const attachSection = document.getElementById('viewAttachments');
    const pdfContainer = document.getElementById('pdfContainer');
    const imgContainer = document.getElementById('imgContainer');
    const imgDisplay = document.getElementById('viewMeetImgDisplay');

    let hasAttachments = false;

    // PDF
    if (meeting.pdfFile) {
        hasAttachments = true;
        pdfContainer.style.display = 'block';
        pdfContainer.innerHTML = `
            <span style="font-size:1.5rem;">📄</span>
            <span style="font-weight:bold;">ملف مرفق (PDF)</span>
            <a href="${meeting.pdfFile}" download="attachment.pdf" class="btn btn-sm btn-info attachment-download-btn">⬇️ تحميل الملف</a>
        `;
    } else {
        pdfContainer.style.display = 'none';
    }

    // Image
    if (meeting.imgFile) {
        hasAttachments = true;
        imgContainer.style.display = 'block';
        imgDisplay.src = meeting.imgFile;
    } else {
        imgContainer.style.display = 'none';
    }

    attachSection.style.display = hasAttachments ? 'block' : 'none';


    // 3. جدول التوقيعات
    const tableBody = document.getElementById('signaturesTableBody');
    tableBody.innerHTML = '';

    const allMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const attendeesIds = meeting.attendees || [];
    const attendeesList = allMembers.filter(m => attendeesIds.includes(m.id));

    if (attendeesList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3">لا يوجد مدعوون لهذا الاجتماع.</td></tr>';
    } else {
        attendeesList.forEach(member => {
            const signatureData = (meeting.signatures && meeting.signatures[member.id]) ? meeting.signatures[member.id] : null;
            let signatureContent = '';
            
            if (signatureData) {
                const dateStr = new Date(signatureData.date).toLocaleDateString('ar-SA');
                if (signatureData.image) {
                    signatureContent = `<img src="${signatureData.image}" class="sig-img-display" alt="توقيع"><br><small style="font-size:0.7em; color:#777;">${dateStr}</small>`;
                } else {
                    signatureContent = `<span style="font-family:'Tajawal'; font-weight:bold; color:#333;">${signatureData.name}</span><br><small style="font-size:0.75em; color:#666;">(اعتماد نصي)</small><br><small style="font-size:0.7em; color:#777;">${dateStr}</small>`;
                }
            } else {
                signatureContent = `<span style="color:#d9534f; font-weight:bold; font-size:0.9em;">بانتظار التوقيع ⏳</span>`;
            }

            const formalName = `أ/ ${member.name}`;
            tableBody.innerHTML += `<tr><td style="text-align:right; font-weight:bold; padding-right:15px;">${formalName}</td><td style="text-align:center;">${member.role}</td><td style="text-align:center; vertical-align:middle;">${signatureContent}</td></tr>`;
        });
    }

    document.getElementById('viewMeetingModal').classList.add('show');
}

// ... الدوال المساعدة ...
function showNewMeetingModal() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const list = document.getElementById('attendeesList');
    list.innerHTML = '';
    members.forEach(m => {
        list.innerHTML += `<div><label style="cursor:pointer"><input type="checkbox" value="${m.id}" checked> ${m.name}</label></div>`;
    });
    
    // تصفير الحقول
    document.getElementById('meetTitle').value = '';
    document.getElementById('meetDate').value = '';
    document.getElementById('meetContent').value = '';
    document.getElementById('meetPdf').value = '';
    document.getElementById('meetImg').value = '';
    document.querySelectorAll('input[name="meetTopic"]').forEach(cb => cb.checked = false);

    document.getElementById('meetingModal').classList.add('show');
}

// ✅ دالة حفظ الاجتماع (Async لدعم الملفات)
async function saveMeeting() {
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;
    
    if(!title || !date) return alert('يرجى تعبئة العنوان والتاريخ على الأقل.');

    // 1. جمع البنود
    const topics = [];
    document.querySelectorAll('input[name="meetTopic"]:checked').forEach(cb => topics.push(cb.value));

    // 2. جمع المدعوين
    const attendees = [];
    document.querySelectorAll('#attendeesList input:checked').forEach(cb => attendees.push(parseInt(cb.value)));

    // 3. معالجة الملفات (تحويل لـ Base64)
    const pdfInput = document.getElementById('meetPdf');
    const imgInput = document.getElementById('meetImg');
    
    let pdfData = null;
    let imgData = null;

    // دالة مساعدة لقراءة الملف
    const readFile = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });

    if (pdfInput.files && pdfInput.files[0]) {
        // فحص الحجم (للحفاظ على localStorage)
        if(pdfInput.files[0].size > 2 * 1024 * 1024) return alert('حجم ملف PDF كبير جداً. الحد الأقصى 2 ميجا.');
        pdfData = await readFile(pdfInput.files[0]);
    }

    if (imgInput.files && imgInput.files[0]) {
        if(imgInput.files[0].size > 2 * 1024 * 1024) return alert('حجم الصورة كبير جداً. الحد الأقصى 2 ميجا.');
        imgData = await readFile(imgInput.files[0]);
    }

    // 4. الحفظ
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    
    meetings.push({ 
        id: Date.now(), 
        title, 
        date, 
        content, 
        topics: topics, 
        pdfFile: pdfData, 
        imgFile: imgData,
        attendees, 
        signatures: {} 
    });
    
    localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
    closeModal('meetingModal');
    loadMeetings();
}

// ... باقي الدوال كما هي ...
function showAddMemberModal() {
    document.getElementById('editMemId').value = '';
    document.getElementById('memName').value = '';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    document.getElementById('addMemberModal').classList.add('show');
}
function saveMember() {
    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const user = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;
    if(!name || !user || !pass) return alert('البيانات ناقصة');
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    if(id) {
        const idx = members.findIndex(x => x.id == id);
        if(idx !== -1) members[idx] = { id: parseInt(id), name, role, username: user, password: pass };
    } else {
        members.push({ id: Date.now(), name, role, username: user, password: pass });
    }
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers();
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
function deleteMember(id) {
    if(confirm('حذف؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers')||'[]');
        members = members.filter(x => x.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}
function deleteMeeting(id) {
    if(confirm('حذف الاجتماع؟')) {
        let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
        meetings = meetings.filter(x => x.id !== id);
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        loadMeetings();
    }
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

window.showAddMemberModal = showAddMemberModal;
window.saveMember = saveMember;
window.editMember = editMember;
window.deleteMember = deleteMember;
window.showNewMeetingModal = showNewMeetingModal;
window.saveMeeting = saveMeeting;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;
window.viewMeetingDetails = viewMeetingDetails;
window.switchTab = switchTab;

// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة للمعلم (نسخة البطاقات الحديثة + عرض التوقيعات)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    loadMeetings();
    
    // التحقق من المستخدم لتحديث الاسم
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

// === 1. إدارة الأعضاء (جدول كلاسيكي لأنه أنسب للبيانات) ===
function loadMembers() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const container = document.getElementById('membersListContainer');
    
    if (members.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء.</div>';
        return;
    }

    let html = '<table class="table table-bordered bg-white"><thead><tr><th>الاسم</th><th>الصفة</th><th>المستخدم</th><th>المرور</th><th>إجراءات</th></tr></thead><tbody>';
    members.forEach(m => {
        html += `<tr>
            <td>${m.name}</td>
            <td><span class="badge badge-secondary">${m.role}</span></td>
            <td>${m.username}</td>
            <td>${m.password}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editMember(${m.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMember(${m.id})">حذف</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ... دوال الأعضاء (إضافة/تعديل/حذف) تبقى كما هي ...
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
    if(confirm('حذف العضو؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers')||'[]');
        members = members.filter(x => x.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

// === 2. إدارة الاجتماعات (بطاقات + عرض التوقيعات) ===

function loadMeetings() {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const container = document.getElementById('meetingsListContainer');
    
    if(meetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info" style="grid-column: 1/-1;">لا توجد اجتماعات. ابدأ بإنشاء واحد جديد.</div>';
        return;
    }

    // ترتيب الاجتماعات: الأحدث أولاً
    meetings.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    meetings.forEach(m => {
        // حساب نسبة التوقيعات
        const totalAttendees = m.attendees ? m.attendees.length : 0;
        const signedCount = m.signatures ? Object.keys(m.signatures).length : 0;
        const progressColor = (signedCount === totalAttendees && totalAttendees > 0) ? 'green' : '#ffc107';

        // قص النص الطويل للعرض
        let shortContent = m.content || '';
        if(shortContent.length > 100) shortContent = shortContent.substring(0, 100) + '...';

        html += `
        <div class="meeting-card">
            <div class="card-header-custom">
                <h3>${m.title}</h3>
                <span class="card-date">${m.date}</span>
            </div>
            <div class="card-body-custom">
                <p>${shortContent || 'لا يوجد وصف.'}</p>
            </div>
            <div class="card-footer-custom">
                <div class="attendees-count">
                    <span style="color:${progressColor}; font-weight:bold;">${signedCount}</span> / ${totalAttendees} توقيعات
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewMeetingDetails(${m.id})">👁️ التفاصيل</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">🗑️</button>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// ✅ دالة عرض التفاصيل والتوقيعات (جديدة)
function viewMeetingDetails(id) {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    if(!meeting) return;

    // تعبئة البيانات الأساسية
    document.getElementById('viewMeetTitle').textContent = meeting.title;
    document.getElementById('viewMeetDate').textContent = meeting.date;
    document.getElementById('viewMeetContent').textContent = meeting.content || 'لا يوجد محتوى.';

    // تعبئة التوقيعات
    const sigContainer = document.getElementById('signaturesContainer');
    sigContainer.innerHTML = '';

    if (!meeting.signatures || Object.keys(meeting.signatures).length === 0) {
        sigContainer.innerHTML = '<div class="alert alert-warning">لم يقم أحد بالتوقيع حتى الآن.</div>';
    } else {
        // تحويل كائن التوقيعات إلى مصفوفة للتعامل معه
        Object.values(meeting.signatures).forEach(sig => {
            const dateStr = new Date(sig.date).toLocaleDateString('ar-SA');
            const timeStr = new Date(sig.date).toLocaleTimeString('ar-SA');
            
            let imageHTML = '';
            if (sig.image) {
                imageHTML = `<div class="sig-image-box"><img src="${sig.image}" alt="توقيع"></div>`;
            } else {
                imageHTML = '<span style="color:#ccc; font-size:0.9em;">(توقيع نصي قديم)</span>';
            }

            sigContainer.innerHTML += `
            <div class="signature-item">
                <div class="sig-avatar">${sig.name.charAt(0)}</div>
                <div class="sig-details" style="margin-right:15px;">
                    <div style="font-weight:bold; font-size:1.1em;">${sig.name}</div>
                    <div style="color:#777; font-size:0.85em; margin-bottom:5px;">${dateStr} - ${timeStr}</div>
                    ${sig.note ? `<div style="background:#fff; padding:5px; border:1px solid #eee; display:inline-block; margin-bottom:5px;">📝 ملاحظة: ${sig.note}</div><br>` : ''}
                    ${imageHTML}
                </div>
            </div>`;
        });
    }

    document.getElementById('viewMeetingModal').classList.add('show');
}

// ... دوال إنشاء وحذف الاجتماعات (كما هي) ...
function showNewMeetingModal() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const list = document.getElementById('attendeesList');
    list.innerHTML = '';
    members.forEach(m => {
        list.innerHTML += `<div><label style="cursor:pointer"><input type="checkbox" value="${m.id}" checked> ${m.name} (${m.role})</label></div>`;
    });
    document.getElementById('meetTitle').value = '';
    document.getElementById('meetContent').value = '';
    document.getElementById('meetingModal').classList.add('show');
}
function saveMeeting() {
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;
    if(!title || !date) return alert('البيانات ناقصة');
    
    const attendees = [];
    document.querySelectorAll('#attendeesList input:checked').forEach(cb => attendees.push(parseInt(cb.value)));

    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    meetings.push({ id: Date.now(), title, date, content, attendees, signatures: {} });
    
    localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
    closeModal('meetingModal');
    loadMeetings();
}
function deleteMeeting(id) {
    if(confirm('هل أنت متأكد من حذف هذا الاجتماع والسجلات المرتبطة به؟')) {
        let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
        meetings = meetings.filter(x => x.id !== id);
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        loadMeetings();
    }
}
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// تصدير الدوال
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

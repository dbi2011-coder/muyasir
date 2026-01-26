// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة اللجنة (نسخة الإصلاح الشامل)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    loadMeetings();
});

// === التبديل بين التبويبات ===
function switchTab(tab) {
    document.getElementById('members-view').style.display = tab === 'members' ? 'block' : 'none';
    document.getElementById('meetings-view').style.display = tab === 'meetings' ? 'block' : 'none';
    
    document.getElementById('tab-members').classList.toggle('active', tab === 'members');
    document.getElementById('tab-meetings').classList.toggle('active', tab === 'meetings');
}

// === إدارة الأعضاء ===
function loadMembers() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const container = document.getElementById('membersListContainer');
    
    if (members.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء. أضف عضواً جديداً.</div>';
        return;
    }

    let html = '<table class="table table-bordered bg-white"><thead><tr><th>الاسم</th><th>الصفة</th><th>المستخدم</th><th>المرور</th><th>إجراءات</th></tr></thead><tbody>';
    members.forEach(m => {
        html += `<tr>
            <td>${m.name}</td>
            <td>${m.role}</td>
            <td>${m.username}</td>
            <td>${m.password}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="editMember(${m.id})">تعديل</button>
                <button class="btn btn-sm btn-danger btn-action" onclick="deleteMember(${m.id})">حذف</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function showAddMemberModal() {
    document.getElementById('editMemId').value = ''; // تفريغ المعرف للإضافة الجديدة
    document.getElementById('memName').value = '';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    document.getElementById('addMemberModal').classList.add('show');
}

function editMember(id) {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
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

function saveMember() {
    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const user = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if(!name || !user || !pass) return alert('جميع البيانات مطلوبة');

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    if(id) {
        // تعديل
        const idx = members.findIndex(x => x.id == id);
        if(idx !== -1) members[idx] = { id: parseInt(id), name, role, username: user, password: pass };
    } else {
        // إضافة جديد
        members.push({ id: Date.now(), name, role, username: user, password: pass });
    }

    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers();
}

function deleteMember(id) {
    if(confirm('حذف العضو؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        members = members.filter(x => x.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

// === إدارة الاجتماعات ===
function loadMeetings() {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const container = document.getElementById('meetingsListContainer');
    
    if(meetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات.</div>';
        return;
    }

    let html = '';
    meetings.forEach(m => {
        html += `<div class="card p-3 mb-2 bg-white border">
            <div class="d-flex justify-content-between">
                <h5>${m.title} <small class="text-muted">(${m.date})</small></h5>
                <button class="btn btn-sm btn-danger" onclick="deleteMeeting(${m.id})">حذف</button>
            </div>
            <p>${m.content}</p>
            <small>الحضور: ${m.attendees ? m.attendees.length : 0}</small>
        </div>`;
    });
    container.innerHTML = html;
}

function showNewMeetingModal() {
    // تعبئة قائمة الأعضاء
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const list = document.getElementById('attendeesList');
    list.innerHTML = '';
    members.forEach(m => {
        list.innerHTML += `<div><input type="checkbox" value="${m.id}" checked> ${m.name}</div>`;
    });

    document.getElementById('meetTitle').value = '';
    document.getElementById('meetContent').value = '';
    document.getElementById('meetingModal').classList.add('show');
}

function saveMeeting() {
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;
    
    if(!title || !date) return alert('العنوان والتاريخ مطلوبان');

    // جمع الحضور
    const attendees = [];
    document.querySelectorAll('#attendeesList input:checked').forEach(cb => attendees.push(parseInt(cb.value)));

    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    meetings.push({
        id: Date.now(),
        title, date, content, attendees,
        signatures: {} // لتوقيع الأعضاء لاحقاً
    });

    localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
    closeModal('meetingModal');
    loadMeetings();
}

function deleteMeeting(id) {
    if(confirm('حذف الاجتماع؟')) {
        let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
        meetings = meetings.filter(x => x.id !== id);
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        loadMeetings();
    }
}

// === وظائف عامة ===
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// تصدير الدوال للاستخدام في HTML
window.showAddMemberModal = showAddMemberModal;
window.saveMember = saveMember;
window.editMember = editMember;
window.deleteMember = deleteMember;
window.showNewMeetingModal = showNewMeetingModal;
window.saveMeeting = saveMeeting;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;
window.switchTab = switchTab;

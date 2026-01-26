// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة الأعضاء (مع فرض اسم المستخدم وكلمة المرور)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    loadMeetings();
    updateUserName();
});

function updateUserName() {
    try {
        const user = JSON.parse(sessionStorage.getItem('currentUser')).user || JSON.parse(sessionStorage.getItem('currentUser'));
        if(user) document.getElementById('userName').textContent = user.name;
    } catch(e){}
}

function switchTab(tabName) {
    document.getElementById('members-view').style.display = 'none';
    document.getElementById('meetings-view').style.display = 'none';
    document.getElementById('tab-members').classList.remove('active');
    document.getElementById('tab-meetings').classList.remove('active');
    document.getElementById(`${tabName}-view`).style.display = 'block';
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ----------------------------------------------------
// إدارة الأعضاء (التعديل الأساسي هنا)
// ----------------------------------------------------

function loadMembers() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const container = document.getElementById('membersListContainer');
    
    if (members.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء.</div>';
        return;
    }

    let html = `
    <table class="table table-bordered bg-white">
        <thead>
            <tr style="background:#f8f9fa;">
                <th>الاسم</th>
                <th>الصفة</th>
                <th>اسم المستخدم</th>
                <th>كلمة المرور</th> <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    members.forEach(m => {
        html += `
            <tr>
                <td style="font-weight:bold;">${m.name}</td>
                <td><span class="badge badge-secondary">${m.role}</span></td>
                <td style="direction:ltr; font-family:monospace;">${m.username || '-'}</td>
                <td style="direction:ltr; font-family:monospace;">${m.password || '****'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editMember(${m.id})">تعديل</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})">حذف</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

let editingMemberId = null;

function showAddMemberModal() {
    editingMemberId = null;
    document.getElementById('memName').value = '';
    document.getElementById('memRole').value = 'معلم';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    
    // تغيير عنوان النافذة
    document.querySelector('#addMemberModal h3').textContent = 'إضافة عضو جديد';
    document.getElementById('addMemberModal').classList.add('show');
}

// ✅ دالة الحفظ المعدلة (تفرض وجود كلمة مرور)
function saveMember() {
    const name = document.getElementById('memName').value.trim();
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value.trim();
    const pass = document.getElementById('memPass').value.trim();

    // التحقق من البيانات
    if (!name) return alert('الاسم مطلوب');
    
    // إذا كان عضو جديد، يجب إدخال اسم مستخدم وكلمة مرور
    if (!editingMemberId && (!username || !pass)) {
        return alert('يجب تحديد اسم مستخدم وكلمة مرور ليتمكن العضو من الدخول للنظام.');
    }

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    // التحقق من تكرار اسم المستخدم
    if (username) {
        const exists = members.some(m => m.username === username && m.id !== editingMemberId);
        if (exists) return alert('اسم المستخدم هذا مستخدم بالفعل، اختر اسماً آخر.');
    }

    if(editingMemberId) {
        // تعديل عضو موجود
        const idx = members.findIndex(m => m.id === editingMemberId);
        if(idx !== -1) {
            members[idx].name = name;
            members[idx].role = role;
            if(username) members[idx].username = username;
            if(pass) members[idx].password = pass; // تحديث كلمة المرور فقط إذا تم إدخال جديدة
        }
    } else {
        // إضافة عضو جديد
        members.push({
            id: Date.now(),
            name: name, 
            role: role, 
            username: username, 
            password: pass // حفظ كلمة المرور
        });
    }

    localStorage.setItem('committeeMembers', JSON.stringify(members));
    document.getElementById('addMemberModal').classList.remove('show');
    loadMembers(); // إعادة تحميل القائمة
    alert('تم حفظ بيانات العضو بنجاح ✅');
}

function editMember(id) {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = members.find(m => m.id === id);
    if(member) {
        editingMemberId = id;
        document.getElementById('memName').value = member.name;
        document.getElementById('memRole').value = member.role;
        document.getElementById('memUser').value = member.username || '';
        document.getElementById('memPass').value = ''; // تترك فارغة للأمان
        document.getElementById('memPass').placeholder = 'اتركه فارغاً للاحتفاظ بالقديمة';
        
        document.querySelector('#addMemberModal h3').textContent = 'تعديل بيانات العضو';
        document.getElementById('addMemberModal').classList.add('show');
    }
}

function deleteMember(id) {
    if(confirm('هل أنت متأكد من حذف هذا العضو؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        members = members.filter(m => m.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// ... (بقية كود الاجتماعات يبقى كما هو في ملفك الأصلي) ...
function loadMeetings() {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const container = document.getElementById('meetingsListContainer');
    if (!container) return;
    
    if (meetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات.</div>';
        return;
    }
    meetings.sort((a, b) => new Date(b.date) - new Date(a.date));
    let html = '';
    meetings.forEach(m => {
        html += `<div class="meeting-card">
            <h4>${m.title} <small>(${m.date})</small></h4>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">حذف</button>
        </div>`;
    });
    container.innerHTML = html;
}
function showNewMeetingModal() { document.getElementById('meetingModal').classList.add('show'); } // مختصر للتبسيط
function saveMeeting() { /* ... الكود الموجود لديك ... */ }
function deleteMeeting(id) {
     let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
     meetings = meetings.filter(m => m.id !== id);
     localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
     loadMeetings();
}

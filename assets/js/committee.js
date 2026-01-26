// ============================================
// 📁 الملف: assets/js/committee.js (للمعلم)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // تشغيل الكود فقط في صفحة المعلم
    if(document.getElementById('membersListContainer')) {
        loadMembers();
        loadMeetings();
    }
});

function loadMembers() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const container = document.getElementById('membersListContainer');
    
    if (members.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء.</div>';
        return;
    }

    let html = '<table class="table table-bordered bg-white"><thead><tr><th>الاسم</th><th>الصفة</th><th>المستخدم</th><th>المرور</th><th>حذف</th></tr></thead><tbody>';
    
    members.forEach(m => {
        html += `<tr>
            <td>${m.name}</td>
            <td>${m.role}</td>
            <td style="direction:ltr">${m.username}</td>
            <td style="direction:ltr">${m.password}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteMember(${m.id})">حذف</button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function saveMember() {
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const user = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if(!name || !user || !pass) return alert('جميع البيانات مطلوبة للدخول');

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    members.push({ id: Date.now(), name, role, username: user, password: pass });
    
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    document.getElementById('addMemberModal').classList.remove('show');
    loadMembers();
    alert('تم الحفظ ✅');
}

function deleteMember(id) {
    if(confirm('حذف؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        members = members.filter(m => m.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

// (تأكد من بقاء بقية كود الاجتماعات كما هو لديك)

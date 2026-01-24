// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: حفظ الأعضاء مع كلمات المرور
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    loadMeetings();
    try {
        const user = JSON.parse(sessionStorage.getItem('currentUser')).user || JSON.parse(sessionStorage.getItem('currentUser'));
        if(user) document.getElementById('userName').textContent = user.name;
    } catch(e){}
});

// === تبديل التبويبات ===
function switchTab(tabName) {
    document.getElementById('members-view').style.display = 'none';
    document.getElementById('meetings-view').style.display = 'none';
    document.getElementById('tab-members').classList.remove('active');
    document.getElementById('tab-meetings').classList.remove('active');

    document.getElementById(`${tabName}-view`).style.display = 'block';
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ============================================
// 👥 إدارة الأعضاء (الحفظ والتعديل)
// ============================================

function loadMembers() {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const container = document.getElementById('membersListContainer');
    
    if (members.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء مضافين حالياً.</div>';
        return;
    }

    let html = `
    <table class="table table-bordered bg-white">
        <thead>
            <tr style="background:#f8f9fa;">
                <th>الاسم</th>
                <th>الصفة</th>
                <th>اسم المستخدم للدخول</th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    members.forEach(m => {
        html += `
            <tr>
                <td style="font-weight:bold;">${m.name}</td>
                <td><span class="badge badge-secondary">${m.role}</span></td>
                <td style="direction:ltr; text-align:center;">${m.username || '<span style="color:red;">لا يوجد</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})">حذف</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function showAddMemberModal() {
    document.getElementById('memName').value = '';
    document.getElementById('memRole').value = 'معلم';
    document.getElementById('memUser').value = '';
    document.getElementById('memPass').value = '';
    document.getElementById('addMemberModal').classList.add('show');
}

// ✅ دالة الحفظ (المهمة جداً)
function saveMember() {
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    // هنا نأخذ بيانات الدخول
    const username = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if(!name) return alert('الاسم مطلوب');
    if(!username || !pass) return alert('يجب تحديد اسم مستخدم وكلمة مرور للعضو ليتمكن من الدخول');

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    // التحقق من عدم تكرار اسم المستخدم
    if(members.some(m => m.username === username)) {
        alert('اسم المستخدم هذا موجود مسبقاً، اختر اسماً آخر.');
        return;
    }

    members.push({
        id: Date.now(),
        name: name,
        role: role,
        username: username, // حفظ اسم المستخدم
        password: pass      // حفظ كلمة المرور
    });

    localStorage.setItem('committeeMembers', JSON.stringify(members));
    
    // إغلاق وتحديث
    document.getElementById('addMemberModal').classList.remove('show');
    loadMembers();
    alert('تم إضافة العضو وبيانات دخوله بنجاح ✅');
}

function deleteMember(id) {
    if(confirm('حذف هذا العضو؟')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        members = members.filter(m => m.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

// دالة إغلاق النوافذ
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// (ملاحظة: يمكنك إبقاء بقية كود الاجتماعات كما هو في الأسفل إذا كان موجوداً لديك)

// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة لجنة صعوبات التعلم (الأعضاء + الاجتماعات)
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

// === إدارة التبويبات ===
function switchTab(tabName) {
    // إخفاء الكل
    document.getElementById('members-view').style.display = 'none';
    document.getElementById('meetings-view').style.display = 'none';
    document.getElementById('tab-members').classList.remove('active');
    document.getElementById('tab-meetings').classList.remove('active');

    // إظهار المطلوب
    document.getElementById(`${tabName}-view`).style.display = 'block';
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ============================================
// 👥 القسم الأول: إدارة الأعضاء
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
                <th>اسم المستخدم</th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    members.forEach(m => {
        html += `
            <tr>
                <td style="font-weight:bold;">${m.name}</td>
                <td><span class="badge badge-secondary">${m.role}</span></td>
                <td>${m.username || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editMember(${m.id})">✏️</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})">🗑️</button>
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
    document.getElementById('addMemberModal').classList.add('show');
}

function saveMember() {
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if(!name) return alert('الاسم مطلوب');

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    if(editingMemberId) {
        // تعديل
        const idx = members.findIndex(m => m.id === editingMemberId);
        if(idx !== -1) {
            members[idx].name = name;
            members[idx].role = role;
            if(username) members[idx].username = username;
            if(pass) members[idx].password = pass; // تحديث فقط إذا أدخل جديد
        }
    } else {
        // إضافة جديد
        members.push({
            id: Date.now(),
            name, role, username, password: pass
        });
    }

    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers();
}

function editMember(id) {
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = members.find(m => m.id === id);
    if(member) {
        editingMemberId = id;
        document.getElementById('memName').value = member.name;
        document.getElementById('memRole').value = member.role;
        document.getElementById('memUser').value = member.username || '';
        document.getElementById('memPass').value = ''; // لا نظهر كلمة المرور القديمة
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

// ============================================
// 📅 القسم الثاني: اجتماعات اللجنة
// ============================================

function loadMeetings() {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const container = document.getElementById('meetingsListContainer');
    
    if (meetings.length === 0) {
        container.innerHTML = '<div class="empty-state">لم يتم عقد أي اجتماعات بعد.</div>';
        return;
    }

    // ترتيب الأحدث أولاً
    meetings.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    meetings.forEach(m => {
        const typeLabel = m.type === 'poll' ? '📊 استبيان' : '📝 محضر نصي';
        html += `
            <div class="meeting-card">
                <div style="display:flex; justify-content:space-between;">
                    <h4 style="margin:0;">${m.title}</h4>
                    <span style="font-size:0.9em; color:#777;">${m.date}</span>
                </div>
                <div style="margin-top:5px;">
                    <span class="badge badge-info">${typeLabel}</span>
                    <span style="font-size:0.85em; margin-right:10px;">👥 الحضور: ${m.attendees ? m.attendees.length : 0}</span>
                </div>
                <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewMeeting(${m.id})">👁️ عرض التفاصيل</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">حذف</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showNewMeetingModal() {
    // تصفية النموذج
    document.getElementById('meetTitle').value = '';
    document.getElementById('meetDate').valueAsDate = new Date();
    document.getElementById('meetTextBody').value = '';
    document.getElementById('pollQuestionsContainer').innerHTML = '';
    
    // تعبئة قائمة الحضور
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const attendeesDiv = document.getElementById('attendeesCheckboxList');
    attendeesDiv.innerHTML = '';
    
    if(members.length === 0) {
        attendeesDiv.innerHTML = '<span class="text-danger">يجب إضافة أعضاء أولاً</span>';
    } else {
        members.forEach(m => {
            const label = document.createElement('label');
            label.style.cssText = "display:block; margin-bottom:5px; cursor:pointer;";
            label.innerHTML = `
                <input type="checkbox" name="attendees" value="${m.id}" checked> 
                ${m.name} <span style="color:#777; font-size:0.8em;">(${m.role})</span>
            `;
            attendeesDiv.appendChild(label);
        });
    }

    toggleMeetingType(); // ضبط العرض الافتراضي
    document.getElementById('meetingModal').classList.add('show');
}

function toggleMeetingType() {
    const type = document.querySelector('input[name="meetType"]:checked').value;
    if(type === 'text') {
        document.getElementById('textContentArea').style.display = 'block';
        document.getElementById('pollContentArea').style.display = 'none';
    } else {
        document.getElementById('textContentArea').style.display = 'none';
        document.getElementById('pollContentArea').style.display = 'block';
        // إضافة سؤال واحد افتراضي إذا كانت القائمة فارغة
        if(document.getElementById('pollQuestionsContainer').innerHTML === '') {
            addPollQuestion();
        }
    }
}

function addPollQuestion() {
    const container = document.getElementById('pollQuestionsContainer');
    const id = Date.now();
    
    const div = document.createElement('div');
    div.className = 'poll-builder-item';
    div.innerHTML = `
        <span class="remove-poll-btn" onclick="this.parentElement.remove()">×</span>
        <div class="form-group" style="margin-bottom:5px;">
            <label>نص السؤال / الفقرة:</label>
            <input type="text" class="form-control poll-q-input" placeholder="اكتب السؤال هنا...">
        </div>
        <div class="form-group">
            <label>الخيارات (افصل بينها بفاصلة ،):</label>
            <input type="text" class="form-control poll-ops-input" placeholder="مثال: موافق، غير موافق، تحفظ">
        </div>
    `;
    container.appendChild(div);
}

function saveMeeting() {
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    if(!title || !date) return alert('الرجاء إدخال العنوان والتاريخ');

    // 1. جمع الحضور
    const checkboxes = document.querySelectorAll('input[name="attendees"]:checked');
    const attendeesIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    // 2. جمع المحتوى
    const type = document.querySelector('input[name="meetType"]:checked').value;
    let contentData = null;

    if(type === 'text') {
        contentData = document.getElementById('meetTextBody').value;
    } else {
        // تجميع الاستبيان
        const qElements = document.querySelectorAll('.poll-builder-item');
        const questions = [];
        qElements.forEach(el => {
            const qText = el.querySelector('.poll-q-input').value;
            const opsText = el.querySelector('.poll-ops-input').value;
            if(qText) {
                questions.push({
                    question: qText,
                    options: opsText ? opsText.split('،').map(s=>s.trim()).filter(s=>s) : ['نعم', 'لا'] // افتراضي
                });
            }
        });
        contentData = questions;
    }

    const meeting = {
        id: Date.now(),
        title,
        date,
        attendees: attendeesIds,
        type,
        content: contentData
    };

    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    meetings.push(meeting);
    localStorage.setItem('committeeMeetings', JSON.stringify(meetings));

    closeModal('meetingModal');
    loadMeetings();
}

function viewMeeting(id) {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const m = meetings.find(x => x.id === id);
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    if(!m) return;

    document.getElementById('viewMeetTitle').textContent = m.title;
    
    // أسماء الحضور
    const attendeeNames = m.attendees.map(aid => {
        const mem = members.find(x => x.id == aid);
        return mem ? `<span class="badge badge-secondary">${mem.name}</span>` : '';
    }).join(' ');

    let contentHtml = '';
    if(m.type === 'text') {
        contentHtml = `<div style="background:#f9f9f9; padding:15px; border-radius:5px; white-space:pre-wrap;">${m.content}</div>`;
    } else {
        // عرض الاستبيان
        contentHtml = `<div style="background:#fff; border:1px solid #ddd; padding:10px;"><h5>📊 بنود الاستبيان:</h5>`;
        if(Array.isArray(m.content)) {
            m.content.forEach((q, idx) => {
                const ops = q.options.map(op => `<span class="badge badge-light" style="border:1px solid #ccc; margin-left:5px;">${op}</span>`).join('');
                contentHtml += `<div style="margin-bottom:10px; border-bottom:1px dashed #eee; padding-bottom:5px;"><strong>${idx+1}. ${q.question}</strong><br><small>الخيارات: ${ops}</small></div>`;
            });
        }
        contentHtml += `</div>`;
    }

    document.getElementById('viewMeetBody').innerHTML = `
        <div style="margin-bottom:15px;"><strong>📅 التاريخ:</strong> ${m.date}</div>
        <div style="margin-bottom:15px;"><strong>👥 الحضور:</strong> ${attendeeNames || 'لا يوجد'}</div>
        <hr>
        ${contentHtml}
    `;

    document.getElementById('viewMeetingModal').classList.add('show');
}

function deleteMeeting(id) {
    if(confirm('حذف هذا الاجتماع؟')) {
        let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
        meetings = meetings.filter(m => m.id !== id);
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        loadMeetings();
    }
}

// دالة مساعدة لغلق النوافذ
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

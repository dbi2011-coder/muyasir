// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة الأعضاء والاجتماعات (واجهة المعلم)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات فقط إذا كنا في صفحة اللجنة الخاصة بالمعلم
    if(document.getElementById('membersListContainer')) {
        loadMembers();
        loadMeetings();
    }
    
    try {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if(user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name;
        }
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
// 👥 1. إدارة الأعضاء
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
                <th>كلمة المرور</th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    members.forEach(m => {
        html += `
            <tr>
                <td style="font-weight:bold;">${m.name}</td>
                <td><span class="badge badge-secondary">${m.role}</span></td>
                <td style="direction:ltr;">${m.username || '-'}</td>
                <td style="direction:ltr;">${m.password || '-'}</td>
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

function saveMember() {
    const name = document.getElementById('memName').value;
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value;
    const pass = document.getElementById('memPass').value;

    if (!name || !username || !pass) {
        return alert('جميع البيانات مطلوبة (الاسم، المستخدم، كلمة المرور) ليتمكن العضو من الدخول.');
    }

    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');

    // التحقق من التكرار
    if(members.some(m => m.username === username)) {
        return alert('اسم المستخدم مسجل مسبقاً لعضو آخر.');
    }

    members.push({
        id: Date.now(),
        name: name,
        role: role,
        username: username,
        password: pass
    });

    localStorage.setItem('committeeMembers', JSON.stringify(members));
    document.getElementById('addMemberModal').classList.remove('show');
    loadMembers();
    alert('تم إضافة العضو بنجاح ✅');
}

function deleteMember(id) {
    if(confirm('هل أنت متأكد من حذف هذا العضو؟ لن يتمكن من الدخول بعد الآن.')) {
        let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        members = members.filter(m => m.id !== id);
        localStorage.setItem('committeeMembers', JSON.stringify(members));
        loadMembers();
    }
}

// ============================================
// 📅 2. إدارة الاجتماعات
// ============================================

function loadMeetings() {
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const container = document.getElementById('meetingsListContainer');
    
    if (meetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لم يتم عقد اجتماعات بعد.</div>';
        return;
    }

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
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">حذف</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showNewMeetingModal() {
    document.getElementById('meetTitle').value = '';
    document.getElementById('meetDate').valueAsDate = new Date();
    document.getElementById('meetTextBody').value = '';
    document.getElementById('pollQuestionsContainer').innerHTML = '';
    
    // تحميل الأعضاء
    const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const attendeesDiv = document.getElementById('attendeesCheckboxList');
    attendeesDiv.innerHTML = '';
    
    if(members.length === 0) {
        attendeesDiv.innerHTML = '<span class="text-danger">أضف أعضاء أولاً</span>';
    } else {
        members.forEach(m => {
            attendeesDiv.innerHTML += `
                <label style="display:block; margin-bottom:5px; cursor:pointer;">
                    <input type="checkbox" name="attendees" value="${m.id}" checked> 
                    ${m.name} <span style="color:#777; font-size:0.8em;">(${m.role})</span>
                </label>`;
        });
    }

    toggleMeetingType(); 
    document.getElementById('meetingModal').classList.add('show');
}

function toggleMeetingType() {
    const type = document.querySelector('input[name="meetType"]:checked').value;
    document.getElementById('textContentArea').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('pollContentArea').style.display = type === 'poll' ? 'block' : 'none';
    if(type === 'poll' && document.getElementById('pollQuestionsContainer').innerHTML === '') addPollQuestion();
}

function addPollQuestion() {
    const container = document.getElementById('pollQuestionsContainer');
    const div = document.createElement('div');
    div.className = 'poll-builder-item';
    div.innerHTML = `
        <span class="remove-poll-btn" onclick="this.parentElement.remove()">×</span>
        <div class="form-group mb-2"><input type="text" class="form-control poll-q-input" placeholder="السؤال"></div>
        <div class="form-group"><input type="text" class="form-control poll-ops-input" value="موافق، غير موافق، تحفظ"></div>
    `;
    container.appendChild(div);
}

function saveMeeting() {
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    if(!title) return alert('العنوان مطلوب');

    const attendees = Array.from(document.querySelectorAll('input[name="attendees"]:checked')).map(cb => parseInt(cb.value));
    const type = document.querySelector('input[name="meetType"]:checked').value;
    
    let content = null;
    if(type === 'text') {
        content = document.getElementById('meetTextBody').value;
    } else {
        content = Array.from(document.querySelectorAll('.poll-builder-item')).map(el => ({
            question: el.querySelector('.poll-q-input').value,
            options: el.querySelector('.poll-ops-input').value.split('،').map(s=>s.trim())
        })).filter(q => q.question);
    }

    const meeting = {
        id: Date.now(),
        title, date, attendees, type, content,
        signatures: {} // مكان حفظ تواقيع الأعضاء
    };

    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    meetings.push(meeting);
    localStorage.setItem('committeeMeetings', JSON.stringify(meetings));

    document.getElementById('meetingModal').classList.remove('show');
    loadMeetings();
}

function deleteMeeting(id) {
    if(confirm('حذف هذا الاجتماع؟')) {
        let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
        meetings = meetings.filter(m => m.id !== id);
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        loadMeetings();
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

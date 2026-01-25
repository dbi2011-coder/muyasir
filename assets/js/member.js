// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: منطق بوابة العضو (توقيع + تقارير)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if(user) {
        document.getElementById('memberNameDisplay').textContent = user.name;
        document.getElementById('memberRoleDisplay').textContent = user.title;
    }
    loadMyMeetings();
    loadStudentsForMember();
});

function switchMemberTab(tab) {
    document.getElementById('section-meetings').style.display = 'none';
    document.getElementById('section-reports').style.display = 'none';
    document.getElementById(`section-${tab}`).style.display = 'block';
}

// 1. الاجتماعات
function loadMyMeetings() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    const allMeetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    // جلب الاجتماعات التي يكون هذا العضو مدعواً لها
    const myMeetings = allMeetings.filter(m => m.attendees && m.attendees.includes(user.id));
    
    const container = document.getElementById('myMeetingsContainer');
    if(myMeetings.length === 0) return container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات.</div>';

    let html = '<table class="table table-bordered bg-white"><thead><tr><th>الموضوع</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
    
    myMeetings.forEach(m => {
        const signed = m.signatures && m.signatures[user.id];
        const status = signed ? '<span class="status-signed">تم التوقيع</span>' : '<span class="status-pending">بانتظار التوقيع</span>';
        html += `<tr><td>${m.title}</td><td>${m.date}</td><td>${status}</td>
        <td><button class="btn btn-sm btn-outline-primary" onclick="openSignModal(${m.id})">عرض</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

let currentMeetId = null;
function openSignModal(id) {
    currentMeetId = id;
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    const meeting = JSON.parse(localStorage.getItem('committeeMeetings')).find(m => m.id === id);
    
    document.getElementById('signModalTitle').textContent = meeting.title;
    
    let content = meeting.type === 'text' ? meeting.content : '<ul>' + meeting.content.map(q => `<li>${q.question}</li>`).join('') + '</ul>';
    document.getElementById('signModalContent').innerHTML = content;

    const sig = meeting.signatures ? meeting.signatures[user.id] : null;
    const btnArea = document.getElementById('signatureStatusArea');
    const noteArea = document.getElementById('memberNoteInput');

    if(sig) {
        noteArea.value = sig.note || '';
        noteArea.disabled = true;
        btnArea.innerHTML = '<div class="alert alert-success">تم التوقيع ✅</div>';
    } else {
        noteArea.value = '';
        noteArea.disabled = false;
        btnArea.innerHTML = '<button class="btn btn-success" onclick="submitSig()">توقيع واعتماد</button>';
    }
    document.getElementById('signMeetingModal').classList.add('show');
}

function submitSig() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    const note = document.getElementById('memberNoteInput').value;
    
    let meetings = JSON.parse(localStorage.getItem('committeeMeetings'));
    const idx = meetings.findIndex(m => m.id === currentMeetId);
    
    if(!meetings[idx].signatures) meetings[idx].signatures = {};
    meetings[idx].signatures[user.id] = { date: new Date(), note: note, name: user.name };
    
    localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
    document.getElementById('signMeetingModal').classList.remove('show');
    loadMyMeetings();
}

// 2. التقارير
function loadStudentsForMember() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const select = document.getElementById('memberStudentSelect');
    users.filter(u => u.role === 'student').forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

function memberGenerateReport() {
    const id = document.getElementById('memberStudentSelect').value;
    const type = document.getElementById('memberReportType').value;
    const area = document.getElementById('reportPreviewArea');
    
    if(!id) return alert('اختر طالباً');
    
    // استدعاء الدوال الموجودة في reports.js
    // نمرر الـ ID كمصفوفة [id] لأن الدوال مصممة لطباعة تقارير جماعية
    if(type === 'attendance') generateAttendanceReport([id], area);
    else if(type === 'achievement') generateAchievementReport([id], area);
    else if(type === 'assignments') generateAssignmentsReport([id], area);
    else if(type === 'iep') generateIEPReport([id], area);
    else if(type === 'diagnostic') generateDiagnosticReport([id], area);
    else if(type === 'schedule') generateScheduleReport([id], area);
    else if(type === 'credit') generateCreditReport([id], area);
}

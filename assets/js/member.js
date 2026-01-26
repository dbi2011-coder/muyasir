document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if(user) document.getElementById('memberName').textContent = user.name;
    loadMeetings();
    loadStudents();
});

function switchSection(sec) {
    document.getElementById('section-meetings').style.display = sec === 'meetings' ? 'block' : 'none';
    document.getElementById('section-reports').style.display = sec === 'reports' ? 'block' : 'none';
}

function loadMeetings() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const myMeetings = meetings.filter(m => m.attendees && m.attendees.includes(user.id));
    
    let html = '<table class="table table-bordered"><thead><tr><th>العنوان</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
    myMeetings.forEach(m => {
        const signed = m.signatures && m.signatures[user.id];
        html += `<tr>
            <td>${m.title}</td><td>${m.date}</td>
            <td>${signed ? '<span class="status-signed">موقع</span>' : '<span class="status-pending">انتظار</span>'}</td>
            <td><button class="btn btn-sm btn-primary" onclick="openSign(${m.id})">عرض</button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('myMeetingsContainer').innerHTML = html;
}

let curMeet = null;
function openSign(id) {
    curMeet = id;
    const m = JSON.parse(localStorage.getItem('committeeMeetings')).find(x => x.id === id);
    document.getElementById('signTitle').textContent = m.title;
    document.getElementById('signBody').innerHTML = m.type === 'text' ? m.content : 'استبيان...';
    document.getElementById('signModal').classList.add('show');
}

function submitSign() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    let meetings = JSON.parse(localStorage.getItem('committeeMeetings'));
    const idx = meetings.findIndex(m => m.id === curMeet);
    
    if(!meetings[idx].signatures) meetings[idx].signatures = {};
    meetings[idx].signatures[user.id] = { date: new Date(), note: document.getElementById('signNote').value };
    
    localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
    document.getElementById('signModal').classList.remove('show');
    loadMeetings();
    alert('تم التوقيع');
}

function loadStudents() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const sel = document.getElementById('memberStudentSelect');
    users.filter(u => u.role === 'student').forEach(s => {
        sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

function memberViewReport() {
    // تكامل بسيط مع reports.js
    const id = document.getElementById('memberStudentSelect').value;
    if(id && window.generateAchievementReport) {
        generateAchievementReport([id], document.getElementById('reportArea'));
    } else {
        document.getElementById('reportArea').innerHTML = 'الرجاء اختيار طالب أو التأكد من ملف reports.js';
    }
}

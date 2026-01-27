// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: تشغيل بوابة عضو اللجنة (الوسيط بين البيانات والواجهة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من المستخدم
    const user = getCurrentUser(); // هذه الدالة تأتي من auth.js
    
    if (!user) {
        // إذا لم يكن مسجلاً، نخرجه
        window.location.href = '../../index.html';
        return;
    }

    // 2. عرض الاسم والصفة
    if(document.getElementById('memberNameDisplay')) {
        document.getElementById('memberNameDisplay').textContent = user.name;
    }
    if(document.getElementById('memberRoleDisplay')) {
        document.getElementById('memberRoleDisplay').textContent = user.title || user.role;
    }

    // 3. تحميل البيانات
    loadMyMeetings();
    loadMemberStudents();
});

// دالة مساعدة احتياطية لجلب المستخدم (في حال تأخر auth.js)
function getCurrentUser() {
    if (window.getCurrentUser) return window.getCurrentUser();
    const session = sessionStorage.getItem('currentUser');
    return session ? (JSON.parse(session).user || JSON.parse(session)) : null;
}

// === التبديل بين التبويبات ===
function switchMemberTab(tabName) {
    document.getElementById('section-meetings').classList.remove('active');
    document.getElementById('section-reports').classList.remove('active');
    document.getElementById('link-meetings').classList.remove('active');
    document.getElementById('link-reports').classList.remove('active');

    document.getElementById(`section-${tabName}`).classList.add('active');
    document.getElementById(`link-${tabName}`).classList.add('active');
}

// === إدارة الاجتماعات ===
function loadMyMeetings() {
    const user = getCurrentUser();
    const container = document.getElementById('myMeetingsContainer');
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    
    // جلب الاجتماعات التي يكون العضو مدعواً لها
    const myMeetings = meetings.filter(m => m.attendees && m.attendees.includes(user.id));

    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات مجدولة لك حالياً.</div>';
        return;
    }

    let html = '<table class="table table-bordered bg-white"><thead><tr><th>عنوان الاجتماع</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
    
    myMeetings.forEach(m => {
        const isSigned = m.signatures && m.signatures[user.id];
        const statusHTML = isSigned 
            ? '<span class="status-signed">✔ تم التوقيع</span>' 
            : '<span class="status-pending">⌛ بانتظار التوقيع</span>';

        html += `
            <tr>
                <td>${m.title}</td>
                <td>${m.date}</td>
                <td>${statusHTML}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openSigningModal(${m.id})">
                        ${isSigned ? 'عرض التفاصيل' : 'مراجعة وتوقيع'}
                    </button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// === التوقيع ===
let currentMeetingId = null;

function openSigningModal(id) {
    currentMeetingId = id;
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    const user = getCurrentUser();

    if (!meeting) return;

    if(document.getElementById('signModalTitle')) document.getElementById('signModalTitle').textContent = meeting.title;
    document.getElementById('signModalContent').innerHTML = `
        <div style="margin-bottom:10px; border-bottom:1px solid #eee;"><strong>التاريخ:</strong> ${meeting.date}</div>
        <p style="white-space: pre-line;">${meeting.content}</p>
    `;

    const isSigned = meeting.signatures && meeting.signatures[user.id];
    const statusArea = document.getElementById('signatureStatusArea');
    const noteInput = document.getElementById('memberNoteInput');

    if (isSigned) {
        noteInput.value = meeting.signatures[user.id].note || '';
        noteInput.disabled = true;
        statusArea.innerHTML = `<button class="btn btn-secondary" disabled>تم التوقيع مسبقاً</button>`;
    } else {
        noteInput.value = '';
        noteInput.disabled = false;
        statusArea.innerHTML = `<button class="btn btn-success" onclick="submitSignature()">✅ اعتماد وتوقيع المحضر</button>`;
    }

    document.getElementById('signMeetingModal').classList.add('show');
}

function submitSignature() {
    const user = getCurrentUser();
    const note = document.getElementById('memberNoteInput').value;
    let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const idx = meetings.findIndex(m => m.id === currentMeetingId);

    if (idx !== -1) {
        if (!meetings[idx].signatures) meetings[idx].signatures = {};
        meetings[idx].signatures[user.id] = { name: user.name, date: new Date().toISOString(), note: note };
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        document.getElementById('signMeetingModal').classList.remove('show');
        loadMyMeetings();
        alert('تم التوقيع بنجاح');
    }
}

// === التقارير (ربط مع reports.js) ===
function loadMemberStudents() {
    const select = document.getElementById('memberStudentSelect');
    if(!select) return;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');
    select.innerHTML = '<option value="">-- اختر الطالب --</option>';
    students.forEach(s => { select.innerHTML += `<option value="${s.id}">${s.name}</option>`; });
}

function memberGenerateReport() {
    const studentId = document.getElementById('memberStudentSelect').value;
    const type = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');

    if (!studentId) {
        container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب أولاً.</div>';
        return;
    }

    // استدعاء الدوال من reports.js الأصلي
    try {
        if (type === 'attendance') generateAttendanceReport([studentId], container);
        else if (type === 'achievement') generateAchievementReport([studentId], container);
        else if (type === 'assignments') generateAssignmentsReport([studentId], container);
        else if (type === 'iep') generateIEPReport([studentId], container);
        else if (type === 'diagnostic') generateDiagnosticReport([studentId], container);
        else if (type === 'schedule') generateScheduleReport([studentId], container);
        else if (type === 'credit') generateCreditReport([studentId], container);
        else container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير موجود.</div>';
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="alert alert-danger">حدث خطأ. تأكد من وجود ملف reports.js</div>';
    }
}

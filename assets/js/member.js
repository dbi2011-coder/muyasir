// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: تشغيل بوابة العضو (مع خيار الكل وإصلاح نص الاجتماع)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من الدخول
    if (typeof getCurrentUser !== 'function') {
        console.error("لم يتم العثور على دالة getCurrentUser");
        return;
    }
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. عرض البيانات الشخصية
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
    if (!container) return;

    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
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

// === التوقيع (تم إصلاح ظهور النص هنا) ===
let currentMeetingId = null;

function openSigningModal(id) {
    currentMeetingId = id;
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    const user = getCurrentUser();

    if (!meeting) return;

    // تعبئة العنوان
    if(document.getElementById('signModalTitle')) {
        document.getElementById('signModalTitle').textContent = meeting.title;
    }
    
    // ✅ تعبئة المحتوى بشكل صحيح ليظهر
    const contentBox = document.getElementById('signModalContent');
    if(contentBox) {
        contentBox.innerHTML = `
            <div style="margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:10px;">
                <strong>📅 التاريخ:</strong> ${meeting.date}
            </div>
            <div style="background:#fff; padding:15px; border:1px solid #eee; border-radius:5px;">
                <h5 style="margin-top:0; color:#555;">تفاصيل الاجتماع:</h5>
                <p style="white-space: pre-line; line-height:1.6; font-size:1.1em; color:#000;">${meeting.content || 'لا يوجد محتوى نصي.'}</p>
            </div>
        `;
    }

    // حالة الأزرار
    const isSigned = meeting.signatures && meeting.signatures[user.id];
    const statusArea = document.getElementById('signatureStatusArea');
    const noteInput = document.getElementById('memberNoteInput');

    if (isSigned) {
        if(noteInput) {
            noteInput.value = meeting.signatures[user.id].note || '';
            noteInput.disabled = true;
        }
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-secondary" disabled>تم التوقيع في ${new Date(meeting.signatures[user.id].date).toLocaleDateString('ar-SA')}</button>`;
    } else {
        if(noteInput) {
            noteInput.value = '';
            noteInput.disabled = false;
        }
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-success" onclick="submitSignature()">✅ موافق وتوقيع</button>`;
    }

    // إظهار النافذة (يتطلب CSS المضاف في HTML)
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
        alert('تم التوقيع بنجاح ✅');
    }
}

// === التقارير (إضافة خيار "الكل") ===
function loadMemberStudents() {
    const select = document.getElementById('memberStudentSelect');
    if(!select) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');

    // ✅ إضافة خيار "جميع الطلاب"
    let options = '<option value="">-- اختر الطالب --</option>';
    options += '<option value="all" style="font-weight:bold; color:blue;">👥 جميع الطلاب</option>';
    
    students.forEach(s => { 
        options += `<option value="${s.id}">${s.name}</option>`; 
    });
    
    select.innerHTML = options;
}

function memberGenerateReport() {
    const studentId = document.getElementById('memberStudentSelect').value;
    const type = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');

    if (!studentId) {
        container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب أولاً.</div>';
        return;
    }

    // ✅ التعامل مع "الكل"
    let targetIds = [];
    if (studentId === 'all') {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        targetIds = users.filter(u => u.role === 'student').map(s => s.id);
    } else {
        targetIds = [studentId];
    }

    if (targetIds.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد بيانات لعرضها.</div>';
        return;
    }

    try {
        if (type === 'attendance') generateAttendanceReport(targetIds, container);
        else if (type === 'achievement') generateAchievementReport(targetIds, container);
        else if (type === 'assignments') generateAssignmentsReport(targetIds, container);
        else if (type === 'iep') generateIEPReport(targetIds, container);
        else if (type === 'diagnostic') generateDiagnosticReport(targetIds, container);
        else if (type === 'schedule') generateScheduleReport(targetIds, container);
        else if (type === 'credit') generateCreditReport(targetIds, container);
        else container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير مدعوم.</div>';
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="alert alert-danger">حدث خطأ. تأكد من وجود ملف reports.js</div>';
    }
}

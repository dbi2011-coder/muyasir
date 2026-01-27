// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: تشغيل بوابة عضو اللجنة (نسخة مصححة لمنع التكرار اللانهائي)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من المستخدم (نعتمد على الدالة من auth.js الموجودة مسبقاً)
    // لا نعرّف الدالة هنا مرة أخرى لمنع التصادم
    if (typeof getCurrentUser !== 'function') {
        console.error("لم يتم العثور على دالة getCurrentUser. تأكد من تحميل auth.js أولاً.");
        return;
    }

    const user = getCurrentUser();
    
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. عرض الاسم والصفة (تحديث العناصر الموجودة في HTML)
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
    // إخفاء الأقسام
    const sections = ['meetings', 'reports'];
    sections.forEach(sec => {
        const el = document.getElementById(`section-${sec}`);
        if(el) el.classList.remove('active');
        const link = document.getElementById(`link-${sec}`);
        if(link) link.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetEl = document.getElementById(`section-${tabName}`);
    if(targetEl) targetEl.classList.add('active');
    const targetLink = document.getElementById(`link-${tabName}`);
    if(targetLink) targetLink.classList.add('active');
}

// === إدارة الاجتماعات ===
function loadMyMeetings() {
    const user = getCurrentUser();
    const container = document.getElementById('myMeetingsContainer');
    if (!container) return;

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
    
    const contentBox = document.getElementById('signModalContent');
    if(contentBox) {
        contentBox.innerHTML = `
            <div style="margin-bottom:10px; border-bottom:1px solid #eee;"><strong>التاريخ:</strong> ${meeting.date}</div>
            <p style="white-space: pre-line;">${meeting.content}</p>
        `;
    }

    const isSigned = meeting.signatures && meeting.signatures[user.id];
    const statusArea = document.getElementById('signatureStatusArea');
    const noteInput = document.getElementById('memberNoteInput');

    if (isSigned) {
        if(noteInput) {
            noteInput.value = meeting.signatures[user.id].note || '';
            noteInput.disabled = true;
        }
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-secondary" disabled>تم التوقيع مسبقاً</button>`;
    } else {
        if(noteInput) {
            noteInput.value = '';
            noteInput.disabled = false;
        }
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-success" onclick="submitSignature()">✅ اعتماد وتوقيع المحضر</button>`;
    }

    const modal = document.getElementById('signMeetingModal');
    if(modal) modal.classList.add('show');
}

function submitSignature() {
    const user = getCurrentUser();
    const noteInput = document.getElementById('memberNoteInput');
    const note = noteInput ? noteInput.value : '';
    
    let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const idx = meetings.findIndex(m => m.id === currentMeetingId);

    if (idx !== -1) {
        if (!meetings[idx].signatures) meetings[idx].signatures = {};
        meetings[idx].signatures[user.id] = { name: user.name, date: new Date().toISOString(), note: note };
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        
        const modal = document.getElementById('signMeetingModal');
        if(modal) modal.classList.remove('show');
        
        loadMyMeetings();
        alert('تم التوقيع بنجاح');
    }
}

// === التقارير (ربط القائمة المنسدلة) ===
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
        if(container) container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب أولاً.</div>';
        return;
    }

    // استدعاء الدوال من reports.js الأصلي
    // نتأكد أن الدالة موجودة قبل استدعائها
    try {
        if (type === 'attendance' && typeof generateAttendanceReport === 'function') generateAttendanceReport([studentId], container);
        else if (type === 'achievement' && typeof generateAchievementReport === 'function') generateAchievementReport([studentId], container);
        else if (type === 'assignments' && typeof generateAssignmentsReport === 'function') generateAssignmentsReport([studentId], container);
        else if (type === 'iep' && typeof generateIEPReport === 'function') generateIEPReport([studentId], container);
        else if (type === 'diagnostic' && typeof generateDiagnosticReport === 'function') generateDiagnosticReport([studentId], container);
        else if (type === 'schedule' && typeof generateScheduleReport === 'function') generateScheduleReport([studentId], container);
        else if (type === 'credit' && typeof generateCreditReport === 'function') generateCreditReport([studentId], container);
        else {
             if(container) container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير مدعوم أو الملف reports.js غير محمل بشكل صحيح.</div>';
        }
    } catch (e) {
        console.error(e);
        if(container) container.innerHTML = '<div class="alert alert-danger">حدث خطأ أثناء عرض التقرير.</div>';
    }
}

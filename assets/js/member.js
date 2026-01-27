// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: تشغيل بوابة عضو اللجنة (مع خيار "الكل" وإصلاح عرض محتوى الاجتماع)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من المستخدم
    if (typeof getCurrentUser !== 'function') {
        console.error("لم يتم العثور على دالة getCurrentUser. تأكد من تحميل auth.js أولاً.");
        return;
    }

    const user = getCurrentUser();
    if (!user) {
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

// === التوقيع وعرض التفاصيل (تم الإصلاح هنا) ===
let currentMeetingId = null;

function openSigningModal(id) {
    currentMeetingId = id;
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    const user = getCurrentUser();

    if (!meeting) return;

    // 1. تعبئة العنوان
    if(document.getElementById('signModalTitle')) {
        document.getElementById('signModalTitle').textContent = meeting.title;
    }
    
    // 2. تعبئة المحتوى (النص) ✅ إصلاح المشكلة هنا
    const contentBox = document.getElementById('signModalContent');
    if(contentBox) {
        contentBox.innerHTML = `
            <div style="margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:10px;">
                <strong>📅 تاريخ الاجتماع:</strong> ${meeting.date}
            </div>
            <div style="background:#fff; padding:15px; border:1px solid #eee; border-radius:5px; min-height:100px;">
                <h5 style="margin-top:0; color:#555;">محضر الاجتماع:</h5>
                <p style="white-space: pre-line; line-height:1.6; font-size:1.1em;">${meeting.content || 'لا يوجد محتوى نصي لهذا الاجتماع.'}</p>
            </div>
        `;
    }

    // 3. حالة التوقيع
    const isSigned = meeting.signatures && meeting.signatures[user.id];
    const statusArea = document.getElementById('signatureStatusArea');
    const noteInput = document.getElementById('memberNoteInput');

    if (isSigned) {
        if(noteInput) {
            noteInput.value = meeting.signatures[user.id].note || '';
            noteInput.disabled = true; // منع التعديل
        }
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-secondary" disabled>تم التوقيع مسبقاً في ${new Date(meeting.signatures[user.id].date).toLocaleDateString('ar-SA')}</button>`;
    } else {
        if(noteInput) {
            noteInput.value = '';
            noteInput.disabled = false;
        }
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-success" onclick="submitSignature()">✅ قرأت المحضر وأوافق عليه (توقيع)</button>`;
    }

    // 4. إظهار النافذة
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
        alert('تم التوقيع بنجاح ✅');
    }
}

// === التقارير (إضافة خيار "الكل") ===

function loadMemberStudents() {
    const select = document.getElementById('memberStudentSelect');
    if(!select) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');

    // ✅ إضافة خيار "جميع الطلاب" في البداية
    let options = '<option value="">-- اختر الطالب --</option>';
    options += '<option value="all" style="font-weight:bold; color:blue;">👥 جميع الطلاب</option>';
    
    students.forEach(s => { 
        options += `<option value="${s.id}">${s.name}</option>`; 
    });
    
    select.innerHTML = options;
}

function memberGenerateReport() {
    const studentSelect = document.getElementById('memberStudentSelect');
    const studentId = studentSelect.value;
    const type = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');

    if (!studentId) {
        if(container) container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب أو "جميع الطلاب" أولاً.</div>';
        return;
    }

    // ✅ منطق التعامل مع خيار "الكل"
    let targetIds = [];
    if (studentId === 'all') {
        // إذا اختار الكل، نجمع كل معرفات الطلاب
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        targetIds = users.filter(u => u.role === 'student').map(s => s.id);
        
        if (targetIds.length === 0) {
            container.innerHTML = '<div class="alert alert-info">لا يوجد طلاب مسجلين في النظام.</div>';
            return;
        }
    } else {
        // إذا اختار طالب واحد
        targetIds = [studentId];
    }

    // استدعاء الدوال من reports.js
    try {
        if (type === 'attendance' && typeof generateAttendanceReport === 'function') generateAttendanceReport(targetIds, container);
        else if (type === 'achievement' && typeof generateAchievementReport === 'function') generateAchievementReport(targetIds, container);
        else if (type === 'assignments' && typeof generateAssignmentsReport === 'function') generateAssignmentsReport(targetIds, container);
        else if (type === 'iep' && typeof generateIEPReport === 'function') generateIEPReport(targetIds, container);
        else if (type === 'diagnostic' && typeof generateDiagnosticReport === 'function') generateDiagnosticReport(targetIds, container);
        else if (type === 'schedule' && typeof generateScheduleReport === 'function') generateScheduleReport(targetIds, container);
        else if (type === 'credit' && typeof generateCreditReport === 'function') generateCreditReport(targetIds, container);
        else {
             if(container) container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير مدعوم حالياً.</div>';
        }
    } catch (e) {
        console.error(e);
        if(container) container.innerHTML = '<div class="alert alert-danger">حدث خطأ أثناء عرض التقرير.</div>';
    }
}

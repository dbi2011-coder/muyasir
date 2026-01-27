// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: إدارة بوابة عضو اللجنة وربطها بالتقارير الأصلية
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من المستخدم
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. عرض بيانات العضو في الهيدر
    if(document.getElementById('memberNameDisplay')) {
        document.getElementById('memberNameDisplay').textContent = user.name;
    }
    if(document.getElementById('memberRoleDisplay')) {
        document.getElementById('memberRoleDisplay').textContent = user.title || user.role;
    }

    // 3. تحميل البيانات الأولية
    loadMyMeetings();
    loadMemberStudents();
});

// دالة مساعدة لجلب المستخدم الحالي (تعتمد على auth.js)
function getCurrentUser() {
    // محاولة استخدام الدالة العالمية إذا وجدت
    if (window.getCurrentUser) return window.getCurrentUser();
    
    // محاولة القراءة اليدوية في حال تأخر تحميل auth.js
    const session = sessionStorage.getItem('currentUser');
    if (!session) return null;
    const parsed = JSON.parse(session);
    return parsed.user || parsed;
}

// === التبديل بين التبويبات ===
function switchMemberTab(tabName) {
    // إخفاء الأقسام
    document.getElementById('section-meetings').style.display = 'none';
    document.getElementById('section-reports').style.display = 'none';
    
    // إزالة التنشيط من الروابط
    if(document.getElementById('link-meetings')) document.getElementById('link-meetings').classList.remove('active');
    if(document.getElementById('link-reports')) document.getElementById('link-reports').classList.remove('active');

    // تفعيل القسم المطلوب
    document.getElementById(`section-${tabName}`).style.display = 'block';
    if(document.getElementById(`link-${tabName}`)) document.getElementById(`link-${tabName}`).classList.add('active');
}

// === أولاً: قسم الاجتماعات ===
function loadMyMeetings() {
    const user = getCurrentUser();
    const container = document.getElementById('myMeetingsContainer');
    if(!container) return; // حماية في حال كنا في صفحة أخرى

    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    
    // جلب الاجتماعات التي دُعي إليها العضو
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

// نافذة التوقيع
let currentMeetingId = null;

function openSigningModal(id) {
    currentMeetingId = id;
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    const user = getCurrentUser();

    if (!meeting) return;

    // تعبئة البيانات في المودال
    if(document.getElementById('signModalTitle')) document.getElementById('signModalTitle').textContent = meeting.title;
    if(document.getElementById('signModalContent')) {
        document.getElementById('signModalContent').innerHTML = `
            <div style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <strong>📅 التاريخ:</strong> ${meeting.date}
            </div>
            <div style="white-space: pre-line; line-height:1.6;">${meeting.content}</div>
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
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-secondary" disabled>تم التوقيع مسبقاً في ${new Date(meeting.signatures[user.id].date).toLocaleDateString('ar-SA')}</button>`;
    } else {
        if(noteInput) {
            noteInput.value = '';
            noteInput.disabled = false;
        }
        if(statusArea) statusArea.innerHTML = `<button class="btn btn-success" onclick="submitSignature()">✅ اعتماد وتوقيع المحضر</button>`;
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
        
        meetings[idx].signatures[user.id] = {
            name: user.name,
            date: new Date().toISOString(),
            note: note
        };

        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        document.getElementById('signMeetingModal').classList.remove('show');
        loadMyMeetings();
        alert('تم توقيع المحضر بنجاح ✅');
    }
}

// === ثانياً: قسم التقارير (الربط مع reports.js الأصلي) ===

function loadMemberStudents() {
    const select = document.getElementById('memberStudentSelect');
    if(!select) return;

    // جلب جميع الطلاب لعرضهم في القائمة
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');

    select.innerHTML = '<option value="">-- اختر الطالب --</option>';
    students.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// 🔥 هذه الدالة هي "الجسر" الذي يحقق طلبك
function memberGenerateReport() {
    const studentId = document.getElementById('memberStudentSelect').value;
    const type = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');

    if (!studentId) {
        container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب من القائمة أولاً.</div>';
        return;
    }

    // هنا نقوم بوضع الطالب المنفرد داخل مصفوفة [studentId]
    // ونرسله لملف التقارير الأصلي الخاص بك كما هو
    
    try {
        if (type === 'attendance') generateAttendanceReport([studentId], container);
        else if (type === 'achievement') generateAchievementReport([studentId], container);
        else if (type === 'assignments') generateAssignmentsReport([studentId], container);
        else if (type === 'iep') generateIEPReport([studentId], container);
        else if (type === 'diagnostic') generateDiagnosticReport([studentId], container);
        else if (type === 'schedule') generateScheduleReport([studentId], container);
        else if (type === 'credit') generateCreditReport([studentId], container);
        else {
            container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير مدعوم أو دالة التقرير غير موجودة.</div>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="alert alert-danger">حدث خطأ أثناء توليد التقرير. تأكد من تحميل ملف reports.js بشكل صحيح.</div>';
    }
}

// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: المنطق الخاص ببوابة عضو اللجنة (توقيع + تقارير)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadMemberInfo();
    loadMyMeetings();
    loadStudentsForMember();
});

let currentMemberId = null;

function loadMemberInfo() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('memberNameDisplay').textContent = user.name;
        document.getElementById('memberRoleDisplay').textContent = user.title || 'عضو لجنة';
        currentMemberId = user.id;
    }
}

function switchMemberTab(tab) {
    document.getElementById('section-meetings').style.display = 'none';
    document.getElementById('section-reports').style.display = 'none';
    document.getElementById('link-meetings').classList.remove('active');
    document.getElementById('link-reports').classList.remove('active');

    document.getElementById(`section-${tab}`).style.display = 'block';
    document.getElementById(`link-${tab}`).classList.add('active');
}

// ============================================
// 📅 جزء الاجتماعات والتوقيع
// ============================================

function loadMyMeetings() {
    const allMeetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    // جلب الاجتماعات التي يكون العضو الحالي ضمن الحضور فيها
    const myMeetings = allMeetings.filter(m => m.attendees && m.attendees.includes(currentMemberId));
    
    const container = document.getElementById('myMeetingsContainer');
    
    if (myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center">لا توجد اجتماعات مسجلة لك حالياً.</div>';
        return;
    }

    // ترتيب: غير الموقع أولاً، ثم الأحدث
    myMeetings.sort((a, b) => {
        const aSigned = isSigned(a);
        const bSigned = isSigned(b);
        if (aSigned === bSigned) return new Date(b.date) - new Date(a.date);
        return aSigned ? 1 : -1; 
    });

    let html = `
    <table class="table table-bordered bg-white">
        <thead>
            <tr style="background:#333; color:white;">
                <th>موضوع الاجتماع</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>إجراء</th>
            </tr>
        </thead>
        <tbody>`;

    myMeetings.forEach(m => {
        const signed = isSigned(m);
        const statusHtml = signed 
            ? '<span class="status-signed">✅ تم التوقيع</span>' 
            : '<span class="status-pending">⏳ بانتظار التوقيع</span>';
        
        const typeLabel = m.type === 'poll' ? 'استبيان' : 'محضر نصي';

        html += `
            <tr>
                <td style="font-weight:bold;">${m.title}</td>
                <td>${m.date}</td>
                <td>${typeLabel}</td>
                <td>${statusHtml}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openSignModal(${m.id})">
                        ${signed ? 'مراجعة' : 'عرض وتوقيع'}
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function isSigned(meeting) {
    if (!meeting.signatures) return false;
    return !!meeting.signatures[currentMemberId]; // هل يوجد توقيع لهذا العضو؟
}

let currentMeetingId = null;

function openSignModal(id) {
    currentMeetingId = id;
    const allMeetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = allMeetings.find(m => m.id === id);
    
    if (!meeting) return;

    document.getElementById('signModalTitle').textContent = meeting.title;
    
    // عرض المحتوى
    let contentHtml = '';
    if (meeting.type === 'text') {
        contentHtml = `<div style="white-space: pre-wrap; line-height:1.6;">${meeting.content}</div>`;
    } else {
        contentHtml = '<h5>نتائج/بنود الاستبيان:</h5><ul class="list-group">';
        if(Array.isArray(meeting.content)){
            meeting.content.forEach(q => {
                const ops = q.options.join(' / ');
                contentHtml += `<li class="list-group-item"><strong>${q.question}</strong><br><small class="text-muted">${ops}</small></li>`;
            });
        }
        contentHtml += '</ul>';
    }
    document.getElementById('signModalContent').innerHTML = contentHtml;

    // حالة التوقيع
    const sigData = meeting.signatures ? meeting.signatures[currentMemberId] : null;
    const statusArea = document.getElementById('signatureStatusArea');
    const noteInput = document.getElementById('memberNoteInput');

    if (sigData) {
        // تم التوقيع مسبقاً
        noteInput.value = sigData.note || '';
        noteInput.disabled = true; // منع التعديل بعد التوقيع
        statusArea.innerHTML = `
            <div class="alert alert-success">
                <h4>✅ تم اعتماد وتوقيع هذا المحضر</h4>
                <p>بتاريخ: ${new Date(sigData.date).toLocaleString('ar-SA')}</p>
            </div>
        `;
    } else {
        // لم يوقع بعد
        noteInput.value = '';
        noteInput.disabled = false;
        statusArea.innerHTML = `
            <button class="btn btn-success btn-lg w-50" onclick="submitSignature()">✅ اعتماد وتوقيع المحضر</button>
        `;
    }

    document.getElementById('signMeetingModal').classList.add('show');
}

function submitSignature() {
    const note = document.getElementById('memberNoteInput').value;
    if(!confirm('هل أنت متأكد من اعتماد وتوقيع هذا المحضر؟ لا يمكن التراجع بعد التوقيع.')) return;

    let allMeetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const idx = allMeetings.findIndex(m => m.id === currentMeetingId);
    
    if (idx !== -1) {
        if (!allMeetings[idx].signatures) allMeetings[idx].signatures = {};
        
        // تسجيل التوقيع
        allMeetings[idx].signatures[currentMemberId] = {
            date: new Date().toISOString(),
            note: note,
            signerName: JSON.parse(sessionStorage.getItem('currentUser')).name
        };

        localStorage.setItem('committeeMeetings', JSON.stringify(allMeetings));
        closeModal('signMeetingModal');
        loadMyMeetings(); // تحديث القائمة
        alert('تم التوقيع بنجاح ✅');
    }
}

// ============================================
// 📊 جزء التقارير (Integration with reports.js)
// ============================================

function loadStudentsForMember() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    // عرض الطلاب فقط (يمكن إضافة فلتر حسب الحاجة، هنا نعرض كل الطلاب للعضو ليطلع)
    const students = users.filter(u => u.role === 'student');
    const select = document.getElementById('memberStudentSelect');
    
    select.innerHTML = '<option value="">-- اختر الطالب --</option>';
    students.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

function memberGenerateReport() {
    const studentId = document.getElementById('memberStudentSelect').value;
    const reportType = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');

    if (!studentId) { alert('الرجاء اختيار الطالب'); return; }
    
    container.innerHTML = '<div class="text-center p-5">جاري جلب البيانات...</div>';

    // استخدام الدوال الموجودة في reports.js مباشرة
    // بما أن دوال reports.js تتوقع مصفوفة من IDs، نمرر الطالب كمصفوفة
    const ids = [studentId]; 

    setTimeout(() => {
        if (reportType === 'attendance') generateAttendanceReport(ids, container);
        else if (reportType === 'achievement') generateAchievementReport(ids, container);
        else if (reportType === 'assignments') generateAssignmentsReport(ids, container);
        else if (reportType === 'iep') generateIEPReport(ids, container);
        else if (reportType === 'diagnostic') generateDiagnosticReport(ids, container);
        else if (reportType === 'schedule') generateScheduleReport(ids, container);
        else if (reportType === 'credit') generateCreditReport(ids, container);
    }, 100); // تأخير بسيط لضمان تجاوب الواجهة
}

// دالة إغلاق النوافذ
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

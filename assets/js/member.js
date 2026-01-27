// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: بوابة العضو + نظام التوقيع الإلكتروني اليدوي
// ============================================

// --- متغيرات لوحة التوقيع ---
let canvas, ctx;
let isDrawing = false;
let hasSigned = false; // للتأكد من أن المستخدم قام بالرسم
let lastX = 0;
let lastY = 0;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof getCurrentUser !== 'function') return console.error("auth.js missing");
    const user = getCurrentUser();
    if (!user) { window.location.href = '../../index.html'; return; }

    if(document.getElementById('memberNameDisplay')) document.getElementById('memberNameDisplay').textContent = user.name;
    if(document.getElementById('memberRoleDisplay')) document.getElementById('memberRoleDisplay').textContent = user.title || user.role;

    loadMyMeetings();
    loadMemberStudents();
    
    // تهيئة لوحة التوقيع مرة واحدة
    setupSignaturePadEvents();
});

// === التبديل بين التبويبات ===
function switchMemberTab(tabName) {
    ['meetings', 'reports'].forEach(sec => {
        document.getElementById(`section-${sec}`).classList.remove('active');
        document.getElementById(`link-${sec}`).classList.remove('active');
    });
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
        const statusHTML = isSigned ? '<span class="status-signed">✔ تم التوقيع</span>' : '<span class="status-pending">⌛ بانتظار التوقيع</span>';
        html += `<tr><td>${m.title}</td><td>${m.date}</td><td>${statusHTML}</td>
            <td><button class="btn btn-sm btn-primary" onclick="openSigningModal(${m.id})">${isSigned ? 'عرض التفاصيل' : 'مراجعة وتوقيع'}</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// =============================================================
// 🎨 نظام التوقيع الإلكتروني اليدوي (Canvas Logic)
// =============================================================

let currentMeetingId = null;

function openSigningModal(id) {
    currentMeetingId = id;
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    const user = getCurrentUser();
    if (!meeting) return;

    // 1. تعبئة البيانات
    document.getElementById('signModalTitle').textContent = meeting.title;
    document.getElementById('signModalDetails').innerHTML = `
        <h5>📄 تفاصيل المحضر</h5>
        <div class="meeting-meta-info">
            <span><strong>📅 التاريخ:</strong> ${meeting.date}</span>
        </div>
        <div class="meeting-content-text">${meeting.content || 'لا يوجد محتوى نصي.'}</div>
    `;

    // 2. التحقق من حالة التوقيع
    const signatureData = meeting.signatures && meeting.signatures[user.id];
    const noteInput = document.getElementById('memberNoteInput');
    const sigContainer = document.getElementById('signatureContainer');
    const savedSigDisplay = document.getElementById('savedSignatureDisplay');
    const actionArea = document.getElementById('signatureActionArea');

    if (signatureData) {
        // --- حالة: تم التوقيع مسبقاً ---
        noteInput.value = signatureData.note || '';
        noteInput.disabled = true;
        
        // إخفاء لوحة الرسم وإظهار التوقيع المحفوظ
        sigContainer.style.display = 'none';
        savedSigDisplay.style.display = 'block';
        savedSigDisplay.innerHTML = `
            <p style="color:green; font-weight:bold;">تم الاعتماد بتاريخ ${new Date(signatureData.date).toLocaleDateString('ar-SA')}</p>
            <img src="${signatureData.image}" class="saved-signature-img" alt="توقيع العضو">
        `;
        actionArea.style.display = 'none'; // إخفاء زر الحفظ

    } else {
        // --- حالة: جديد (لم يوقع بعد) ---
        noteInput.value = '';
        noteInput.disabled = false;

        // إظهار لوحة الرسم وإخفاء المحفوظ
        sigContainer.style.display = 'block';
        savedSigDisplay.style.display = 'none';
        actionArea.style.display = 'block';
        
        // تهيئة اللوحة للرسم الجديد
        setTimeout(initializeCanvas, 300); // تأخير بسيط لضمان ظهور المودال
    }

    document.getElementById('signMeetingModal').classList.add('show');
}

function closeSigningModal() {
    document.getElementById('signMeetingModal').classList.remove('show');
}

// ----- دوال الرسم على الـ Canvas -----
function setupSignaturePadEvents() {
    canvas = document.getElementById('signature-pad');
    ctx = canvas.getContext('2d');
    
    // إعدادات الفرشاة
    ctx.strokeStyle = '#000000'; // لون أسود
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;

    // أحداث الماوس
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // أحداث اللمس (للموبايل والتابلت)
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

function initializeCanvas() {
    // ضبط حجم اللوحة لتناسب الحاوية
    const container = document.getElementById('signatureContainer');
    canvas.width = container.offsetWidth - 4; // -4 للحدود
    canvas.height = 200;
    clearSignaturePad(); // مسح أي رسم قديم
}

function startDrawing(e) {
    isDrawing = true;
    hasSigned = true; // المستخدم بدأ الرسم
    const pos = getEventPosition(e);
    [lastX, lastY] = [pos.x, pos.y];
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); // منع تمرير الصفحة أثناء الرسم باللمس
    const pos = getEventPosition(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    [lastX, lastY] = [pos.x, pos.y];
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignaturePad() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSigned = false; // إعادة تعيين حالة التوقيع
}

// دالة مساعدة للحصول على إحداثيات الماوس أو اللمس بدقة
function getEventPosition(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches && e.touches[0]) {
        // حدث لمس
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        // حدث ماوس
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    return { x, y };
}

// ----- حفظ التوقيع -----
function submitSignature() {
    // التحقق من أن المستخدم رسم شيئاً
    if (!hasSigned) {
        alert("الرجاء رسم توقيعك في المربع المخصص قبل الحفظ.");
        return;
    }

    const user = getCurrentUser();
    const note = document.getElementById('memberNoteInput').value;
    
    // تحويل الرسمة إلى صورة (نص طويل Base64)
    const signatureImage = canvas.toDataURL('image/png');

    let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const idx = meetings.findIndex(m => m.id === currentMeetingId);

    if (idx !== -1) {
        if (!meetings[idx].signatures) meetings[idx].signatures = {};
        
        // حفظ بيانات التوقيع + الصورة
        meetings[idx].signatures[user.id] = {
            name: user.name,
            date: new Date().toISOString(),
            note: note,
            image: signatureImage // حفظ الصورة
        };

        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        closeSigningModal();
        loadMyMeetings();
        alert('تم حفظ واعتماد توقيعك بنجاح ✅');
    }
}

// === التقارير (خيار الكل) ===
function loadMemberStudents() {
    const select = document.getElementById('memberStudentSelect');
    if(!select) return;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');
    let options = '<option value="">-- اختر الطالب --</option><option value="all" style="font-weight:bold; color:blue;">👥 جميع الطلاب</option>';
    students.forEach(s => { options += `<option value="${s.id}">${s.name}</option>`; });
    select.innerHTML = options;
}

function memberGenerateReport() {
    const studentId = document.getElementById('memberStudentSelect').value;
    const type = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');
    if (!studentId) { container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب أولاً.</div>'; return; }
    let targetIds = (studentId === 'all') ? JSON.parse(localStorage.getItem('users')||'[]').filter(u=>u.role==='student').map(s=>s.id) : [studentId];
    if (targetIds.length === 0) { container.innerHTML = '<div class="alert alert-info">لا يوجد بيانات.</div>'; return; }
    try {
        const reportFuncs = {
            'attendance': generateAttendanceReport, 'achievement': generateAchievementReport, 'assignments': generateAssignmentsReport,
            'iep': generateIEPReport, 'diagnostic': generateDiagnosticReport, 'schedule': generateScheduleReport, 'credit': generateCreditReport
        };
        if (reportFuncs[type] && typeof reportFuncs[type] === 'function') reportFuncs[type](targetIds, container);
        else container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير مدعوم.</div>';
    } catch (e) { console.error(e); container.innerHTML = '<div class="alert alert-danger">حدث خطأ في التقارير.</div>'; }
}

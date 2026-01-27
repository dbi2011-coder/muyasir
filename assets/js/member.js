// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: بوابة العضو + نظام التوقيع الإلكتروني + اختيار الطلاب المتعدد
// ============================================

// --- متغيرات لوحة التوقيع ---
let canvas, ctx;
let isDrawing = false;
let hasSigned = false;
let lastX = 0;
let lastY = 0;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof getCurrentUser !== 'function') return console.error("auth.js missing");
    const user = getCurrentUser();
    if (!user) { window.location.href = '../../index.html'; return; }

    if(document.getElementById('memberNameDisplay')) document.getElementById('memberNameDisplay').textContent = user.name;
    if(document.getElementById('memberRoleDisplay')) document.getElementById('memberRoleDisplay').textContent = user.title || user.role;

    loadMyMeetings();
    loadMemberStudentsMultiSelect(); // تحميل القائمة الجديدة
    
    setupSignaturePadEvents();

    // إغلاق القائمة المنسدلة عند النقر خارجها
    document.addEventListener('click', function(e) {
        const container = document.getElementById('studentMultiSelect');
        const list = document.getElementById('studentOptionsList');
        if (container && !container.contains(e.target)) {
            list.classList.remove('show');
        }
    });
});

function switchMemberTab(tabName) {
    ['meetings', 'reports'].forEach(sec => {
        document.getElementById(`section-${sec}`).classList.remove('active');
        document.getElementById(`link-${sec}`).classList.remove('active');
    });
    document.getElementById(`section-${tabName}`).classList.add('active');
    document.getElementById(`link-${tabName}`).classList.add('active');
}

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

// ============================================
// 👥 نظام القائمة متعددة الاختيار (الجديد)
// ============================================

function loadMemberStudentsMultiSelect() {
    const listContainer = document.getElementById('studentOptionsList');
    if(!listContainer) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');

    if(students.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px;">لا يوجد طلاب.</div>';
        return;
    }

    // 1. خيار "تحديد الكل"
    let html = `
        <div class="multi-select-option select-all-option" onclick="toggleSelectAllStudents(this)">
            <input type="checkbox" id="selectAllCheckbox">
            <label for="selectAllCheckbox">👥 تحديد الكل</label>
        </div>
    `;

    // 2. قائمة الطلاب
    students.forEach(s => {
        html += `
            <div class="multi-select-option" onclick="toggleStudentCheckbox(this)">
                <input type="checkbox" value="${s.id}" class="student-checkbox">
                <label>${s.name}</label>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// فتح/إغلاق القائمة
function toggleMultiSelect() {
    const list = document.getElementById('studentOptionsList');
    list.classList.toggle('show');
}

// عند الضغط على "تحديد الكل"
function toggleSelectAllStudents(optionDiv) {
    const mainCheckbox = optionDiv.querySelector('input');
    // عكس الحالة لأن الضغط تم على الـ div
    // (إذا ضغطنا على الـ input مباشرة، سيقوم المتصفح بتغييره، لذلك نمنع التكرار)
    // هنا نفترض الضغط على الـ div
    
    // الحل الأبسط: نجعل الـ checkbox يتبع الحالة الجديدة
    // نلاحظ أن النقر على الـ label أو checkbox يغير الحالة تلقائياً،
    // لكن النقر على الـ div يحتاج معالجة يدوية إذا لم يكن الهدف هو الـ input
    
    // سنعتمد على التغيير في الـ mainCheckbox بعد الحدث
    setTimeout(() => {
        const isChecked = mainCheckbox.checked;
        const allCheckboxes = document.querySelectorAll('.student-checkbox');
        allCheckboxes.forEach(cb => cb.checked = isChecked);
        updateMultiSelectLabel();
    }, 0);
}

// عند الضغط على طالب مفرد
function toggleStudentCheckbox(optionDiv) {
    // تحديث النص بعد لحظة بسيطة لضمان تغير حالة الـ checkbox
    setTimeout(() => {
        updateMultiSelectLabel();
        
        // تحديث حالة "تحديد الكل"
        const allCheckboxes = document.querySelectorAll('.student-checkbox');
        const checkedCount = document.querySelectorAll('.student-checkbox:checked').length;
        const selectAllCb = document.getElementById('selectAllCheckbox');
        if(selectAllCb) {
            selectAllCb.checked = (allCheckboxes.length > 0 && checkedCount === allCheckboxes.length);
        }
    }, 0);
}

// تحديث النص الظاهر في الصندوق
function updateMultiSelectLabel() {
    const labelSpan = document.getElementById('multiSelectLabel');
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const totalCount = document.querySelectorAll('.student-checkbox').length;
    
    if (checkedBoxes.length === 0) {
        labelSpan.textContent = '-- اختر الطلاب --';
        labelSpan.style.color = '#666';
    } else if (checkedBoxes.length === totalCount) {
        labelSpan.textContent = `👥 الجميع (${totalCount})`;
        labelSpan.style.color = '#007bff';
        labelSpan.style.fontWeight = 'bold';
    } else if (checkedBoxes.length === 1) {
        // عرض اسم الطالب إذا كان واحداً فقط
        const name = checkedBoxes[0].parentElement.querySelector('label').textContent;
        labelSpan.textContent = `👤 ${name}`;
        labelSpan.style.color = '#333';
        labelSpan.style.fontWeight = 'normal';
    } else {
        labelSpan.textContent = `✅ تم اختيار ${checkedBoxes.length} طلاب`;
        labelSpan.style.color = '#007bff';
        labelSpan.style.fontWeight = 'bold';
    }
}

// توليد التقرير (تم التحديث لدعم المتعدد)
function memberGenerateReport() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const type = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');

    if (checkedBoxes.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب واحد على الأقل.</div>';
        return;
    }

    // جمع الـ IDs في مصفوفة
    const targetIds = Array.from(checkedBoxes).map(cb => cb.value);

    try {
        const reportFuncs = {
            'attendance': generateAttendanceReport, 
            'achievement': generateAchievementReport, 
            'assignments': generateAssignmentsReport,
            'iep': generateIEPReport, 
            'diagnostic': generateDiagnosticReport, 
            'schedule': generateScheduleReport, 
            'credit': generateCreditReport
        };
        
        if (reportFuncs[type] && typeof reportFuncs[type] === 'function') {
            reportFuncs[type](targetIds, container);
        } else {
            container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير مدعوم.</div>';
        }
    } catch (e) { 
        console.error(e); 
        container.innerHTML = '<div class="alert alert-danger">حدث خطأ في التقارير.</div>'; 
    }
}

// =============================================================
// 🎨 نظام التوقيع الإلكتروني اليدوي
// =============================================================

let currentMeetingId = null;

function openSigningModal(id) {
    currentMeetingId = id;
    const meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const meeting = meetings.find(m => m.id === id);
    const user = getCurrentUser();
    if (!meeting) return;

    document.getElementById('signModalTitle').textContent = meeting.title;
    document.getElementById('signModalDetails').innerHTML = `
        <h5>📄 تفاصيل المحضر</h5>
        <div class="meeting-meta-info"><span><strong>📅 التاريخ:</strong> ${meeting.date}</span></div>
        <div class="meeting-content-text">${meeting.content || 'لا يوجد محتوى نصي.'}</div>
    `;

    const signatureData = meeting.signatures && meeting.signatures[user.id];
    const noteInput = document.getElementById('memberNoteInput');
    const sigContainer = document.getElementById('signatureContainer');
    const savedSigDisplay = document.getElementById('savedSignatureDisplay');
    const actionArea = document.getElementById('signatureActionArea');

    if (signatureData) {
        noteInput.value = signatureData.note || '';
        noteInput.disabled = true;
        sigContainer.style.display = 'none';
        savedSigDisplay.style.display = 'block';
        savedSigDisplay.innerHTML = `<p style="color:green; font-weight:bold;">تم الاعتماد بتاريخ ${new Date(signatureData.date).toLocaleDateString('ar-SA')}</p><img src="${signatureData.image}" class="saved-signature-img">`;
        actionArea.style.display = 'none';
    } else {
        noteInput.value = '';
        noteInput.disabled = false;
        sigContainer.style.display = 'block';
        savedSigDisplay.style.display = 'none';
        actionArea.style.display = 'block';
        setTimeout(initializeCanvas, 300);
    }
    document.getElementById('signMeetingModal').classList.add('show');
}

function closeSigningModal() { document.getElementById('signMeetingModal').classList.remove('show'); }

function setupSignaturePadEvents() {
    canvas = document.getElementById('signature-pad');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 2;
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

function initializeCanvas() {
    const container = document.getElementById('signatureContainer');
    canvas.width = container.offsetWidth - 4;
    canvas.height = 200;
    clearSignaturePad();
}

function startDrawing(e) { isDrawing = true; hasSigned = true; const pos = getEventPosition(e); [lastX, lastY] = [pos.x, pos.y]; }
function draw(e) { if (!isDrawing) return; e.preventDefault(); const pos = getEventPosition(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y); ctx.stroke(); [lastX, lastY] = [pos.x, pos.y]; }
function stopDrawing() { isDrawing = false; }
function clearSignaturePad() { ctx.clearRect(0, 0, canvas.width, canvas.height); hasSigned = false; }
function getEventPosition(e) { const rect = canvas.getBoundingClientRect(); let x, y; if (e.touches && e.touches[0]) { x = e.touches[0].clientX - rect.left; y = e.touches[0].clientY - rect.top; } else { x = e.clientX - rect.left; y = e.clientY - rect.top; } return { x, y }; }

function submitSignature() {
    if (!hasSigned) { alert("الرجاء التوقيع أولاً."); return; }
    const user = getCurrentUser();
    const note = document.getElementById('memberNoteInput').value;
    const signatureImage = canvas.toDataURL('image/png');
    let meetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    const idx = meetings.findIndex(m => m.id === currentMeetingId);
    if (idx !== -1) {
        if (!meetings[idx].signatures) meetings[idx].signatures = {};
        meetings[idx].signatures[user.id] = { name: user.name, date: new Date().toISOString(), note: note, image: signatureImage };
        localStorage.setItem('committeeMeetings', JSON.stringify(meetings));
        closeSigningModal();
        loadMyMeetings();
        alert('تم الاعتماد بنجاح ✅');
    }
}

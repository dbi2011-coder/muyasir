// ============================================
// 📁 المسار: assets/js/member.js
// الوصف: لوحة عضو اللجنة الحديثة (سحابية 100% + توافق مع الجوال)
// ============================================

let canvas, ctx, isDrawing = false, hasSigned = false, lastX = 0, lastY = 0;
let currentMeetingId = null;

// --- دوال الاتصال المباشر بالسحابة (Supabase) ---
async function dbGetAll() {
    const { data, error } = await window.supabase.from('meetings').select('*');
    if (error) { console.error(error); return []; }
    return data || [];
}

async function dbGet(id) {
    const { data, error } = await window.supabase.from('meetings').select('*').eq('id', id).single();
    if (error) { console.error(error); return null; }
    return data;
}

async function dbPut(item) {
    const { error } = await window.supabase.from('meetings').upsert([item]);
    if (error) throw error;
}

document.addEventListener('DOMContentLoaded', async function() {
    const user = getCurrentUser();
    if (!user) { window.location.href = '../../index.html'; return; }
    
    if(document.getElementById('memberNameDisplay')) document.getElementById('memberNameDisplay').textContent = 'أ/ ' + user.name;
    if(document.getElementById('memberRoleDisplay')) document.getElementById('memberRoleDisplay').textContent = user.title || user.role;

    await loadMyMeetings();
    await loadMemberStudentsMultiSelect();
    setupSignaturePadEvents();
    
    // إغلاق قائمة الطلاب المنسدلة عند النقر خارجها
    document.addEventListener('click', function(e) {
        const container = document.getElementById('studentMultiSelect');
        const list = document.getElementById('studentOptionsList');
        if (container && !container.contains(e.target) && list) list.classList.remove('show');
    });

    // إعادة ضبط حجم مربع التوقيع عند دوران الشاشة
    window.addEventListener('resize', () => {
        if(document.getElementById('signMeetingModal').classList.contains('show')) {
            initializeCanvas();
        }
    });
});

function getCurrentUser() { try { return JSON.parse(sessionStorage.getItem('currentUser')); } catch (e) { return null; } }

function switchMemberTab(tabName) {
    ['meetings', 'reports'].forEach(sec => {
        const section = document.getElementById(`section-${sec}`);
        const link = document.getElementById(`link-${sec}`);
        if(section) section.classList.remove('active');
        if(link) link.classList.remove('active');
    });
    const targetSec = document.getElementById(`section-${tabName}`);
    const targetLink = document.getElementById(`link-${tabName}`);
    if(targetSec) targetSec.classList.add('active');
    if(targetLink) targetLink.classList.add('active');

    // إغلاق القائمة الجانبية في الجوال عند التبديل
    if (typeof closeSidebar === 'function') closeSidebar();
}

// ============================================
// 📅 عرض الاجتماعات والمحاضر
// ============================================
async function loadMyMeetings() {
    const user = getCurrentUser();
    const container = document.getElementById('myMeetingsContainer');
    if (!container) return;

    try {
        container.innerHTML = '<div class="text-center p-4">جاري جلب الاجتماعات...</div>';
        const meetings = await dbGetAll();
        const myMeetings = meetings.filter(m => m.attendees && m.attendees.includes(user.id));
        
        if (myMeetings.length === 0) { 
            container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:40px; color:#777;">
                <i class="fas fa-calendar-times fa-4x mb-3" style="opacity:0.5;"></i>
                <h3>لا توجد اجتماعات</h3>
                <p>لم تتم دعوتك لأي اجتماع حالياً.</p>
            </div>`; 
            return; 
        }
        
        myMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '<table class="table table-bordered bg-white"><thead><tr><th>عنوان الاجتماع</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
        myMeetings.forEach(m => {
            const isSigned = m.signatures && m.signatures[user.id];
            const statusHTML = isSigned ? '<span class="status-signed"><i class="fas fa-check"></i> تم التوقيع</span>' : '<span class="status-pending"><i class="fas fa-clock"></i> بانتظار التوقيع</span>';
            const btnClass = isSigned ? 'btn-secondary' : 'btn-primary';
            const btnText = isSigned ? '<i class="fas fa-eye"></i> عرض المحضر' : '<i class="fas fa-pen-nib"></i> مشاركة وتوقيع';
            
            html += `<tr>
                <td style="font-weight:bold; color:#2c3e50;">${m.title}</td>
                <td>${new Date(m.date).toLocaleDateString('ar-SA')}</td>
                <td>${statusHTML}</td>
                <td><button class="btn btn-sm ${btnClass}" onclick="openSigningModal(${m.id})">${btnText}</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch(e) { 
        console.error(e); 
        container.innerHTML = '<div class="alert alert-danger">حدث خطأ في تحميل الاجتماعات.</div>'; 
    }
}

async function openSigningModal(id) {
    currentMeetingId = id;
    const user = getCurrentUser();
    try {
        const meeting = await dbGet(id);
        if (!meeting) return;

        document.getElementById('signModalTitle').textContent = meeting.title;
        
        let html = `<div class="meeting-meta-info" style="margin-bottom:15px; color:#555;">
            <span><i class="fas fa-calendar-day"></i> <strong>التاريخ:</strong> ${new Date(meeting.date).toLocaleDateString('ar-SA')}</span>
        </div>`;
        html += `<div class="meeting-content-text" style="font-size:1.1rem; line-height:1.8; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">${meeting.content || 'لا يوجد نص إضافي.'}</div>`;
        
        if(meeting.pdfFile || meeting.imgFile) {
            html += `<div style="margin-top:15px; padding:15px; background:#f0f7ff; border:1px solid #cce5ff; border-radius:8px;">
                <strong style="color:#004085;"><i class="fas fa-paperclip"></i> المرفقات:</strong><br>`;
            if(meeting.pdfFile) html += `<a href="${meeting.pdfFile}" download="attachment.pdf" class="btn btn-sm btn-info mt-2"><i class="fas fa-file-pdf"></i> تحميل PDF</a><br>`;
            if(meeting.imgFile) html += `<div style="margin-top:10px; text-align:center;"><img src="${meeting.imgFile}" style="max-width:100%; border:1px solid #ccc; border-radius:8px;"></div>`;
            html += `</div>`;
        }

        const isSigned = meeting.signatures && meeting.signatures[user.id];

        if (!isSigned) {
            if(meeting.polls && meeting.polls.length > 0) {
                html += `<hr style="margin:20px 0;"><h5 style="color:#007bff;"><i class="fas fa-poll"></i> يرجى التصويت:</h5>`;
                meeting.polls.forEach(poll => {
                    html += `<div class="mb-3 p-3 bg-light border rounded"><strong>❓ ${poll.question}</strong><div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">`;
                    poll.options.forEach(opt => { 
                        html += `<label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#fff; padding:8px 12px; border:1px solid #ddd; border-radius:6px; transition:0.2s;">
                            <input type="radio" name="poll_${poll.id}" value="${opt}" style="transform:scale(1.2);"> <span>${opt}</span>
                        </label>`; 
                    });
                    html += `</div></div>`;
                });
            }

            if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
                html += `<hr style="margin:20px 0;"><h5 style="color:#28a745;"><i class="fas fa-user-graduate"></i> مرئياتك وتوصياتك عن الطلاب:</h5>`;
                meeting.requestedFeedback.forEach(req => {
                    html += `
                    <div class="student-feedback-card">
                        <div class="student-info-header">
                            <div class="student-icon-circle"><i class="fas fa-user"></i></div>
                            <div class="student-name-title">${req.name}</div>
                        </div>
                        <label class="input-label-hint">✍️ ملاحظاتك وتوصياتك التربوية:</label>
                        <textarea class="modern-feedback-input feedback-input" data-student-id="${req.id}" placeholder="اكتب هنا ما تراه مناسباً حول مستوى الطالب..."></textarea>
                    </div>`;
                });
            }
        } else {
            const mySig = meeting.signatures[user.id];
            html += `<hr style="margin:20px 0;"><div class="alert alert-success" style="font-size:1.1rem; text-align:center;">
                <i class="fas fa-check-circle fa-2x mb-2"></i><br>
                <strong>تم الاعتماد والتوقيع</strong><br>
                <small>تاريخ: ${new Date(mySig.date).toLocaleDateString('ar-SA')} - ${new Date(mySig.date).toLocaleTimeString('ar-SA')}</small>
            </div>`;
        }

        document.getElementById('signModalDetails').innerHTML = html;

        const sigContainer = document.getElementById('signatureContainer');
        const savedSigDisplay = document.getElementById('savedSignatureDisplay');
        const actionArea = document.getElementById('signatureActionArea');
        const notesContainer = document.getElementById('generalNotesContainer');

        if (isSigned) {
            sigContainer.style.display = 'none'; 
            savedSigDisplay.style.display = 'block'; 
            actionArea.style.display = 'none'; 
            notesContainer.style.display = 'none';
            savedSigDisplay.innerHTML = `<img src="${meeting.signatures[user.id].image}" class="saved-signature-img">`;
        } else {
            sigContainer.style.display = 'block'; 
            savedSigDisplay.style.display = 'none'; 
            actionArea.style.display = 'block'; 
            notesContainer.style.display = 'block';
            document.getElementById('memberNoteInput').value = '';
            setTimeout(initializeCanvas, 300); // إعطاء وقت للـ Modal ليفتح قبل حساب الحجم
        }
        document.getElementById('signMeetingModal').classList.add('show');
    } catch (e) { console.error(e); }
}

async function submitSignature() {
    if (!hasSigned) return alert("الرجاء رسم توقيعك في المربع المخصص قبل الحفظ."); 
    const user = getCurrentUser();
    
    try {
        const meeting = await dbGet(currentMeetingId);
        if(!meeting) return;

        const pollResponses = {};
        if(meeting.polls && meeting.polls.length > 0) {
            let allAnswered = true;
            meeting.polls.forEach(poll => {
                const selected = document.querySelector(`input[name="poll_${poll.id}"]:checked`);
                if(selected) pollResponses[poll.id] = selected.value; else allAnswered = false;
            });
            if(!allAnswered) return alert('يرجى الإجابة على جميع التصويتات المعروضة.');
        }

        const feedbackResponses = {};
        if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
            let allFilled = true;
            document.querySelectorAll('.feedback-input').forEach(input => {
                const val = input.value.trim();
                if(val) feedbackResponses[input.dataset.studentId] = val; else allFilled = false;
            });
            if(!allFilled) return alert('يرجى كتابة مرئياتك وتوصياتك عن جميع الطلاب المطلوبين.');
        }

        const note = document.getElementById('memberNoteInput').value;
        const signatureImage = canvas.toDataURL('image/png'); 

        let sigs = meeting.signatures || {};
        sigs[user.id] = { 
            name: user.name, 
            date: new Date().toISOString(), 
            image: signatureImage, 
            note: note, 
            pollResponses: pollResponses, 
            feedbackResponses: feedbackResponses 
        };

        meeting.signatures = sigs;
        await dbPut(meeting);
        
        document.getElementById('signMeetingModal').classList.remove('show'); 
        loadMyMeetings(); 
        alert('تم الاعتماد وإرسال التوقيع بنجاح ✅'); 
    } catch(e) { console.error(e); alert('حدث خطأ أثناء الحفظ'); }
}

function closeSigningModal() { document.getElementById('signMeetingModal').classList.remove('show'); }

// --- دوال لوحة التوقيع (Canvas) المحسنة للموبايل ---
function setupSignaturePadEvents() { 
    canvas = document.getElementById('signature-pad'); 
    ctx = canvas.getContext('2d'); 
    ctx.strokeStyle = '#000'; 
    ctx.lineWidth = 2.5; 
    ctx.lineCap = 'round';
    
    canvas.addEventListener('mousedown', startDrawing); 
    canvas.addEventListener('mousemove', draw); 
    canvas.addEventListener('mouseup', stopDrawing); 
    canvas.addEventListener('mouseout', stopDrawing);
    
    // دعم اللمس للجوال
    canvas.addEventListener('touchstart', startDrawing, {passive: false}); 
    canvas.addEventListener('touchmove', draw, {passive: false}); 
    canvas.addEventListener('touchend', stopDrawing); 
}

function initializeCanvas() { 
    const c = document.getElementById('signatureContainer'); 
    if(c && canvas){
        // استخدام getBoundingClientRect لحساب العرض الحقيقي بدقة في الجوال
        const rect = c.getBoundingClientRect();
        canvas.width = rect.width - 4; // خصم سماكة الإطار
        canvas.height = 200; 
        clearSignaturePad();
    } 
}

function startDrawing(e) { 
    if(e.type === 'touchstart') e.preventDefault();
    isDrawing=true; 
    hasSigned=true; 
    const p=getPos(e); 
    [lastX, lastY]=[p.x, p.y]; 
}

function draw(e) { 
    if(!isDrawing) return; 
    e.preventDefault(); 
    const p=getPos(e); 
    ctx.beginPath(); 
    ctx.moveTo(lastX, lastY); 
    ctx.lineTo(p.x, p.y); 
    ctx.stroke(); 
    [lastX, lastY]=[p.x, p.y]; 
}

function stopDrawing() { isDrawing=false; }
function clearSignaturePad() { ctx.clearRect(0,0,canvas.width,canvas.height); hasSigned=false; }
function getPos(e) { 
    const r = canvas.getBoundingClientRect(); 
    return {
        x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left, 
        y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top
    }; 
}

// ============================================
// 📊 قسم التقارير داخل حساب اللجنة
// ============================================
async function loadMemberStudentsMultiSelect() { 
    const list = document.getElementById('studentOptionsList'); 
    if(!list) return; 
    
    const user = getCurrentUser(); 
    if (!user || !user.ownerId) return;

    try {
        list.innerHTML = '<div style="padding:10px; color:#666; text-align:center;">جاري جلب الطلاب من السحابة... <i class="fas fa-spinner fa-spin"></i></div>';

        const { data: st, error } = await window.supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('teacherId', user.ownerId);

        if (error) throw error;
        
        if(!st || st.length === 0){
            list.innerHTML='<div style="padding:10px; color:#dc3545; text-align:center;">لا يوجد طلاب مرتبطين بالمعلم المتابع لك حالياً.</div>';
            return;
        } 
        
        let h = `<div class="multi-select-option select-all-option" onclick="toggleSelectAllStudents(this)">
                    <input type="checkbox" id="selectAllCheckbox">
                    <label for="selectAllCheckbox">الكل</label>
                 </div>`; 
                 
        st.forEach(s => { 
            h += `<div class="multi-select-option" onclick="toggleStudentCheckbox(this)">
                    <input type="checkbox" value="${s.id}" class="student-checkbox">
                    <label>${s.name}</label>
                  </div>`; 
        }); 
        
        list.innerHTML = h; 
        
    } catch (e) { 
        console.error("Error fetching students:", e); 
        list.innerHTML = '<div style="padding:10px; color:#dc3545; text-align:center;">حدث خطأ أثناء جلب البيانات.</div>';
    }
}

function toggleMultiSelect() { document.getElementById('studentOptionsList').classList.toggle('show'); }
function toggleSelectAllStudents(d) { const v=d.querySelector('input').checked; setTimeout(()=>{document.querySelectorAll('.student-checkbox').forEach(x=>x.checked=v);updateMultiSelectLabel();},0); }
function toggleStudentCheckbox(d) { setTimeout(()=>{updateMultiSelectLabel();},0); }
function updateMultiSelectLabel() { 
    const c=document.querySelectorAll('.student-checkbox:checked').length; 
    document.getElementById('multiSelectLabel').innerHTML = c > 0 ? `<span style="color:#28a745; font-weight:bold;">✅ تم تحديد ${c} طلاب</span>` : '-- اختر الطلاب --'; 
}

window.memberGenerateReport = async function() {
    const reportType = document.getElementById('memberReportType').value;
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedStudentIds = Array.from(checkboxes).map(cb => cb.value);

    if (selectedStudentIds.length === 0) return alert('الرجاء اختيار طالب واحد على الأقل من القائمة.');
    if (!reportType) return alert('الرجاء اختيار نوع التقرير.');
    
    const previewArea = document.getElementById('reportPreviewArea');
    previewArea.innerHTML = '<div class="text-center p-5"><h3><i class="fas fa-spinner fa-spin"></i> جاري استخراج التقرير من السحابة...</h3><p class="text-muted mt-2">يرجى الانتظار، قد يستغرق ذلك بضع ثوانٍ</p></div>'; 
    
    try {
        if (reportType === 'attendance') await generateAttendanceReport(selectedStudentIds, previewArea);
        else if (reportType === 'achievement') await generateAchievementReport(selectedStudentIds, previewArea);
        else if (reportType === 'assignments') await generateAssignmentsReport(selectedStudentIds, previewArea);
        else if (reportType === 'iep') await generateIEPReport(selectedStudentIds, previewArea);
        else if (reportType === 'diagnostic') await generateDiagnosticReport(selectedStudentIds, previewArea);
        else if (reportType === 'schedule') await generateScheduleReport(selectedStudentIds, previewArea);
        else previewArea.innerHTML = `<div class="alert alert-warning text-center">هذا التقرير قيد التطوير.</div>`;
    } catch (e) {
        console.error("Report Error:", e);
        previewArea.innerHTML = `<div class="alert alert-danger text-center"><i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>حدث خطأ أثناء بناء التقرير. تأكد من توفر البيانات.</div>`;
    }
};

window.switchMemberTab = switchMemberTab;
window.openSigningModal = openSigningModal;
window.submitSignature = submitSignature;
window.closeSigningModal = closeSigningModal;
window.clearSignaturePad = clearSignaturePad;
window.toggleMultiSelect = toggleMultiSelect;
window.toggleSelectAllStudents = toggleSelectAllStudents;
window.toggleStudentCheckbox = toggleStudentCheckbox;

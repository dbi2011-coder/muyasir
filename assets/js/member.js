// ============================================
// 📁 المسار: assets/js/member.js
// الوصف: لوحة عضو اللجنة الحديثة (مع المرئيات والتوقيع - سحابية 100%)
// ============================================

let canvas, ctx, isDrawing = false, hasSigned = false, lastX = 0, lastY = 0;
let currentMeetingId = null;

// --- دوال الاتصال المباشر بالسحابة (Supabase) للاجتماعات ---
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
    
    document.addEventListener('click', function(e) {
        const container = document.getElementById('studentMultiSelect');
        const list = document.getElementById('studentOptionsList');
        if (container && !container.contains(e.target) && list) list.classList.remove('show');
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
}

// ============================================
// 📅 عرض الاجتماعات والمحاضر
// ============================================
async function loadMyMeetings() {
    const user = getCurrentUser();
    const container = document.getElementById('myMeetingsContainer');
    if (!container) return;

    try {
        const meetings = await dbGetAll();
        const myMeetings = meetings.filter(m => m.attendees && m.attendees.includes(user.id));
        
        if (myMeetings.length === 0) { container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات مجدولة لك حالياً.</div>'; return; }
        
        myMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '<table class="table table-bordered bg-white"><thead><tr><th>عنوان الاجتماع</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
        myMeetings.forEach(m => {
            const isSigned = m.signatures && m.signatures[user.id];
            const statusHTML = isSigned ? '<span class="status-signed">✔ تم التوقيع</span>' : '<span class="status-pending">⌛ بانتظار التوقيع</span>';
            html += `<tr><td>${m.title}</td><td>${m.date}</td><td>${statusHTML}</td><td><button class="btn btn-sm btn-primary" onclick="openSigningModal(${m.id})">${isSigned ? 'عرض التفاصيل' : 'مشاركة وتوقيع'}</button></td></tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch(e) { console.error(e); container.innerHTML = '<div class="alert alert-danger">خطأ في التحميل</div>'; }
}

async function openSigningModal(id) {
    currentMeetingId = id;
    const user = getCurrentUser();
    try {
        const meeting = await dbGet(id);
        if (!meeting) return;

        document.getElementById('signModalTitle').textContent = meeting.title;
        
        let html = `<div class="meeting-meta-info"><span><strong>📅 التاريخ:</strong> ${meeting.date}</span></div>`;
        html += `<div class="meeting-content-text">${meeting.content || 'لا يوجد نص إضافي.'}</div>`;
        
        if(meeting.pdfFile || meeting.imgFile) {
            html += `<div style="margin-top:15px; padding:10px; background:#f9f9f9; border:1px solid #eee; border-radius:5px;"><strong style="color:#007bff;">📎 المرفقات:</strong><br>`;
            if(meeting.pdfFile) html += `<a href="${meeting.pdfFile}" download="attachment.pdf" class="btn btn-sm btn-info mt-2">⬇️ تحميل PDF</a><br>`;
            if(meeting.imgFile) html += `<div style="margin-top:10px;"><img src="${meeting.imgFile}" style="max-width:100%; border:1px solid #ccc; border-radius:5px;"></div>`;
            html += `</div>`;
        }

        const isSigned = meeting.signatures && meeting.signatures[user.id];

        if (!isSigned) {
            if(meeting.polls && meeting.polls.length > 0) {
                html += `<hr><h5 style="color:#007bff;">📊 يرجى التصويت:</h5>`;
                meeting.polls.forEach(poll => {
                    html += `<div class="mb-3 p-3 bg-light border rounded"><strong>❓ ${poll.question}</strong><br><div style="margin-top:5px;">`;
                    poll.options.forEach(opt => { html += `<label class="ml-3 mt-1" style="display:block; cursor:pointer"><input type="radio" name="poll_${poll.id}" value="${opt}"> ${opt}</label>`; });
                    html += `</div></div>`;
                });
            }

            if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
                html += `<hr><h5 style="color:#28a745;">👨‍🎓 مرئياتك وتوصياتك عن الطلاب:</h5>`;
                meeting.requestedFeedback.forEach(req => {
                    html += `
                    <div class="student-feedback-card">
                        <div class="student-info-header">
                            <div class="student-icon-circle">👤</div>
                            <div class="student-name-title">${req.name}</div>
                        </div>
                        <label class="input-label-hint">✍️ ملاحظاتك وتوصياتك التربوية:</label>
                        <textarea class="modern-feedback-input feedback-input" data-student-id="${req.id}" placeholder="اكتب هنا ما تراه مناسباً حول مستوى الطالب..."></textarea>
                    </div>`;
                });
            }
        } else {
            const mySig = meeting.signatures[user.id];
            html += `<hr><div class="alert alert-success"><strong>✅ تم الاعتماد.</strong><br>تاريخ: ${new Date(mySig.date).toLocaleDateString('ar-SA')}</div>`;
        }

        document.getElementById('signModalDetails').innerHTML = html;

        const sigContainer = document.getElementById('signatureContainer');
        const savedSigDisplay = document.getElementById('savedSignatureDisplay');
        const actionArea = document.getElementById('signatureActionArea');
        const notesContainer = document.getElementById('generalNotesContainer');

        if (isSigned) {
            sigContainer.style.display = 'none'; savedSigDisplay.style.display = 'block'; actionArea.style.display = 'none'; notesContainer.style.display = 'none';
            savedSigDisplay.innerHTML = `<img src="${meeting.signatures[user.id].image}" class="saved-signature-img">`;
        } else {
            sigContainer.style.display = 'block'; savedSigDisplay.style.display = 'none'; actionArea.style.display = 'block'; notesContainer.style.display = 'block';
            document.getElementById('memberNoteInput').value = '';
            setTimeout(initializeCanvas, 300);
        }
        document.getElementById('signMeetingModal').classList.add('show');
    } catch (e) { console.error(e); }
}

async function submitSignature() {
    if (!hasSigned) return alert("الرجاء رسم توقيعك في المربع المخصص."); 
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
            if(!allAnswered) return alert('أجب على جميع التصويتات المعروضة.');
        }

        const feedbackResponses = {};
        if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
            let allFilled = true;
            document.querySelectorAll('.feedback-input').forEach(input => {
                const val = input.value.trim();
                if(val) feedbackResponses[input.dataset.studentId] = val; else allFilled = false;
            });
            if(!allFilled) return alert('يرجى كتابة مرئياتك عن جميع الطلاب المطلوبين.');
        }

        const note = document.getElementById('memberNoteInput').value;
        const signatureImage = canvas.toDataURL('image/png'); 

        let sigs = meeting.signatures || {};
        sigs[user.id] = { name: user.name, date: new Date().toISOString(), image: signatureImage, note: note, pollResponses: pollResponses, feedbackResponses: feedbackResponses };

        meeting.signatures = sigs;
        await dbPut(meeting);
        
        document.getElementById('signMeetingModal').classList.remove('show'); 
        loadMyMeetings(); 
        alert('تم الاعتماد وإرسال التوقيع بنجاح ✅'); 
    } catch(e) { console.error(e); alert('خطأ أثناء الحفظ'); }
}

function closeSigningModal() { document.getElementById('signMeetingModal').classList.remove('show'); }

function setupSignaturePadEvents() { canvas = document.getElementById('signature-pad'); ctx = canvas.getContext('2d'); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', stopDrawing); canvas.addEventListener('touchstart', startDrawing); canvas.addEventListener('touchmove', draw); canvas.addEventListener('touchend', stopDrawing); }
function initializeCanvas() { const c = document.getElementById('signatureContainer'); if(c&&canvas){canvas.width = c.offsetWidth-4; canvas.height=200; clearSignaturePad();} }
function startDrawing(e) { isDrawing=true; hasSigned=true; const p=getPos(e); [lastX, lastY]=[p.x, p.y]; }
function draw(e) { if(!isDrawing)return; e.preventDefault(); const p=getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); [lastX, lastY]=[p.x, p.y]; }
function stopDrawing() { isDrawing=false; }
function clearSignaturePad() { ctx.clearRect(0,0,canvas.width,canvas.height); hasSigned=false; }
function getPos(e) { const r=canvas.getBoundingClientRect(); return {x:(e.touches?e.touches[0].clientX:e.clientX)-r.left, y:(e.touches?e.touches[0].clientY:e.clientY)-r.top}; }

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
            list.innerHTML='<div style="padding:10px; color:#666;">لا يوجد طلاب مرتبطين بمعلمك حالياً.</div>';
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
        console.error("Error fetching students from Supabase:", e); 
        list.innerHTML = '<div style="padding:10px; color:#dc3545; text-align:center;">حدث خطأ أثناء جلب الطلاب من قاعدة البيانات.</div>';
    }
}

function toggleMultiSelect() { document.getElementById('studentOptionsList').classList.toggle('show'); }
function toggleSelectAllStudents(d) { const v=d.querySelector('input').checked; setTimeout(()=>{document.querySelectorAll('.student-checkbox').forEach(x=>x.checked=v);updateMultiSelectLabel();},0); }
function toggleStudentCheckbox(d) { setTimeout(()=>{updateMultiSelectLabel();},0); }
function updateMultiSelectLabel() { const c=document.querySelectorAll('.student-checkbox:checked').length; document.getElementById('multiSelectLabel').textContent = c>0 ? `✅ تم تحديد ${c}` : '-- اختر --'; }

window.memberGenerateReport = async function() {
    const reportType = document.getElementById('memberReportType').value;
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedStudentIds = Array.from(checkboxes).map(cb => cb.value);

    if (selectedStudentIds.length === 0) return alert('الرجاء اختيار طالب واحد على الأقل من القائمة.');
    
    const previewArea = document.getElementById('reportPreviewArea');
    previewArea.innerHTML = '<div class="text-center p-5"><h3><i class="fas fa-spinner fa-spin"></i> جاري استخراج البيانات...</h3></div>'; 
    
    try {
        if (reportType === 'attendance') await generateAttendanceReport(selectedStudentIds, previewArea);
        else if (reportType === 'achievement') await generateAchievementReport(selectedStudentIds, previewArea);
        else if (reportType === 'assignments') await generateAssignmentsReport(selectedStudentIds, previewArea);
        else if (reportType === 'iep') await generateIEPReport(selectedStudentIds, previewArea);
        else if (reportType === 'diagnostic') await generateDiagnosticReport(selectedStudentIds, previewArea);
        else if (reportType === 'schedule') await generateScheduleReport(selectedStudentIds, previewArea);
        else previewArea.innerHTML = `<div class="alert alert-warning">قيد التطوير</div>`;
    } catch (e) {
        console.error(e);
        previewArea.innerHTML = `<div class="alert alert-danger">حدث خطأ أثناء بناء التقرير. تأكد من تحميل ملف reports.js</div>`;
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

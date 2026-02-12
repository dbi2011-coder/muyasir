// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: لوحة عضو اللجنة (تعرض طلاب المعلم المرتبط به فقط)
// ============================================

const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => { const db = e.target.result; if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' }); };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = (e) => reject('خطأ DB');
    });
}
function dbGet(id) { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbGetAll() { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readonly'); const r = tx.objectStore(STORE_NAME).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbPut(item) { return new Promise((res, rej) => { const tx = db.transaction(STORE_NAME, 'readwrite'); const r = tx.objectStore(STORE_NAME).put(item); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }

let canvas, ctx, isDrawing=false, hasSigned=false, lastX=0, lastY=0;
let currentMeetingId = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof getCurrentUser !== 'function') return console.error("auth.js missing");
    const user = getCurrentUser();
    if (!user) { window.location.href = '../../index.html'; return; }
    
    if(document.getElementById('memberNameDisplay')) document.getElementById('memberNameDisplay').textContent = 'أ/ ' + user.name;
    if(document.getElementById('memberRoleDisplay')) document.getElementById('memberRoleDisplay').textContent = user.title || user.role;

    await openDB();
    loadMyMeetings();
    loadMemberStudentsMultiSelect(); // تحميل القائمة المفلترة
    setupSignaturePadEvents();
    
    document.addEventListener('click', function(e) {
        const container = document.getElementById('studentMultiSelect');
        const list = document.getElementById('studentOptionsList');
        if (container && !container.contains(e.target)) list.classList.remove('show');
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

async function loadMyMeetings() {
    const user = getCurrentUser();
    const container = document.getElementById('myMeetingsContainer');
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
    const meeting = await dbGet(id);
    const user = getCurrentUser();
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
            html += `<hr><h5 style="color:#28a745;">👨‍🎓 مرئياتك عن الطلاب:</h5>`;
            meeting.requestedFeedback.forEach(req => {
                html += `
                <div class="student-feedback-card">
                    <div class="student-info-header">
                        <div class="student-icon-circle">👤</div>
                        <div class="student-name-title">${req.name}</div>
                    </div>
                    <label class="input-label-hint">✍️ ملاحظاتك وتوصياتك التربوية:</label>
                    <textarea class="modern-feedback-input feedback-input" 
                              data-student-id="${req.id}" 
                              placeholder="اكتب هنا ما تراه مناسباً حول مستوى الطالب..."></textarea>
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
    const noteInput = document.getElementById('memberNoteInput');

    if (isSigned) {
        sigContainer.style.display = 'none';
        savedSigDisplay.style.display = 'block';
        savedSigDisplay.innerHTML = `<img src="${meeting.signatures[user.id].image}" class="saved-signature-img">`;
        actionArea.style.display = 'none';
        notesContainer.style.display = 'none';
    } else {
        sigContainer.style.display = 'block';
        savedSigDisplay.style.display = 'none';
        actionArea.style.display = 'block';
        notesContainer.style.display = 'block';
        noteInput.value = '';
        setTimeout(initializeCanvas, 300);
    }
    document.getElementById('signMeetingModal').classList.add('show');
}

async function submitSignature() {
    if (!hasSigned) { alert("الرجاء التوقيع أولاً."); return; }
    const user = getCurrentUser();
    const meeting = await dbGet(currentMeetingId);
    if(!meeting) return;

    const pollResponses = {};
    if(meeting.polls && meeting.polls.length > 0) {
        let allAnswered = true;
        meeting.polls.forEach(poll => {
            const selected = document.querySelector(`input[name="poll_${poll.id}"]:checked`);
            if(selected) pollResponses[poll.id] = selected.value; else allAnswered = false;
        });
        if(!allAnswered) return alert('أجب على جميع التصويتات.');
    }

    const feedbackResponses = {};
    if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
        let allFilled = true;
        document.querySelectorAll('.feedback-input').forEach(input => {
            const val = input.value.trim();
            if(val) feedbackResponses[input.dataset.studentId] = val; else allFilled = false;
        });
        if(!allFilled) return alert('اكتب المرئيات للجميع.');
    }

    const note = document.getElementById('memberNoteInput').value;
    const signatureImage = canvas.toDataURL('image/png');

    if (!meeting.signatures) meeting.signatures = {};
    meeting.signatures[user.id] = { name: user.name, date: new Date().toISOString(), image: signatureImage, note: note, pollResponses: pollResponses, feedbackResponses: feedbackResponses };

    try { await dbPut(meeting); document.getElementById('signMeetingModal').classList.remove('show'); loadMyMeetings(); alert('تم الاعتماد ✅'); }
    catch(e) { console.error(e); alert('خطأ حفظ'); }
}

function closeSigningModal() { document.getElementById('signMeetingModal').classList.remove('show'); }
function setupSignaturePadEvents() { canvas = document.getElementById('signature-pad'); ctx = canvas.getContext('2d'); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', stopDrawing); canvas.addEventListener('touchstart', startDrawing); canvas.addEventListener('touchmove', draw); canvas.addEventListener('touchend', stopDrawing); }
function initializeCanvas() { const c = document.getElementById('signatureContainer'); if(c&&canvas){canvas.width = c.offsetWidth-4; canvas.height=200; clearSignaturePad();} }
function startDrawing(e) { isDrawing=true; hasSigned=true; const p=getPos(e); [lastX, lastY]=[p.x, p.y]; }
function draw(e) { if(!isDrawing)return; e.preventDefault(); const p=getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); [lastX, lastY]=[p.x, p.y]; }
function stopDrawing() { isDrawing=false; }
function clearSignaturePad() { ctx.clearRect(0,0,canvas.width,canvas.height); hasSigned=false; }
function getPos(e) { const r=canvas.getBoundingClientRect(); return {x:(e.touches?e.touches[0].clientX:e.clientX)-r.left, y:(e.touches?e.touches[0].clientY:e.clientY)-r.top}; }

// 🔥 دالة تحميل الطلاب في القائمة المنسدلة (محدثة مع الفلترة) 🔥
function loadMemberStudentsMultiSelect() { 
    const list=document.getElementById('studentOptionsList'); 
    if(!list)return; 
    
    const user = getCurrentUser(); // عضو اللجنة
    const users = JSON.parse(localStorage.getItem('users')||'[]'); 
    
    // الفلترة: الطلاب فقط && التابعين لنفس معلم هذا العضو
    const st = users.filter(u => u.role === 'student' && u.teacherId == user.ownerId); 
    
    if(st.length===0){
        list.innerHTML='<div style="padding:10px; color:#666;">لا يوجد طلاب مرتبطين بمعلمك حالياً.</div>';
        return;
    } 
    
    let h=`<div class="multi-select-option select-all-option" onclick="toggleSelectAllStudents(this)"><input type="checkbox" id="selectAllCheckbox"><label for="selectAllCheckbox">الكل</label></div>`; 
    st.forEach(s=>{
        h+=`<div class="multi-select-option" onclick="toggleStudentCheckbox(this)"><input type="checkbox" value="${s.id}" class="student-checkbox"><label>${s.name}</label></div>`;
    }); 
    list.innerHTML=h; 
}

function toggleMultiSelect() { document.getElementById('studentOptionsList').classList.toggle('show'); }
function toggleSelectAllStudents(d) { const v=d.querySelector('input').checked; setTimeout(()=>{document.querySelectorAll('.student-checkbox').forEach(x=>x.checked=v);updateMultiSelectLabel();},0); }
function toggleStudentCheckbox(d) { setTimeout(()=>{updateMultiSelectLabel();},0); }
function updateMultiSelectLabel() { const c=document.querySelectorAll('.student-checkbox:checked').length; document.getElementById('multiSelectLabel').textContent = c>0 ? `✅ ${c}` : '-- اختر --'; }

function memberGenerateReport() { 
    const cb=document.querySelectorAll('.student-checkbox:checked'); 
    const t=document.getElementById('memberReportType').value; 
    const c=document.getElementById('reportPreviewArea'); 
    
    if(cb.length===0){
        c.innerHTML='<div class="alert alert-warning">يرجى اختيار طالب واحد على الأقل.</div>';
        return;
    } 
    
    const ids=Array.from(cb).map(x=>x.value); 
    try{
        // دوال التقرير يفترض وجودها في ملف reports.js المشترك أو يمكن إضافتها هنا
        // بما أنك طلبت فقط الفلترة، سنفترض وجود دوال التقرير أو سنتركها كما كانت
        if(typeof generateAttendanceReport !== 'undefined') {
            const f={'attendance':generateAttendanceReport,'achievement':generateAchievementReport,'assignments':generateAssignmentsReport,'iep':generateIEPReport,'diagnostic':generateDiagnosticReport,'schedule':generateScheduleReport,'credit':generateCreditReport};
            if(f[t]) f[t](ids,c);
        } else {
            c.innerHTML = '<div class="alert alert-info">جاري تجهيز بيانات التقرير... (تأكد من وجود ملف reports.js)</div>';
        }
    }catch(e){console.error(e);} 
}

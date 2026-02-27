// ============================================
// 📁 الملف: assets/js/committee.js
// الوصف: إدارة الأعضاء السحابية والاجتماعات (Supabase) بالكامل
// ============================================

// 🔥 النوافذ المنبثقة 🔥
if (!window.showConfirmModal) { window.showConfirmModal = function(message, onConfirm) { let modal = document.getElementById('globalConfirmModal'); if (!modal) { const modalHtml = `<div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2);"><div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div><div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div><div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem;"></div><div style="display:flex; gap:15px; justify-content:center;"><button id="globalConfirmCancel" style="background:#e2e8f0; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1;">إلغاء</button><button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1;">نعم، متأكد</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', modalHtml); modal = document.getElementById('globalConfirmModal'); } document.getElementById('globalConfirmMessage').innerHTML = message; modal.style.display = 'flex'; document.getElementById('globalConfirmOk').onclick = function() { modal.style.display = 'none'; if (typeof onConfirm === 'function') onConfirm(); }; document.getElementById('globalConfirmCancel').onclick = function() { modal.style.display = 'none'; }; }; }
if (!window.showSuccess) { window.showSuccess = function(message) { let toast = document.getElementById('globalSuccessToast'); if (!toast) { const toastHtml = `<div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; z-index:999999; font-weight:bold; align-items:center; gap:10px;"><i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalSuccessToast'); } document.getElementById('globalSuccessMessage').textContent = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 3000); }; }
if (!window.showError) { window.showError = function(message) { let toast = document.getElementById('globalErrorToast'); if (!toast) { const toastHtml = `<div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; z-index:999999; font-weight:bold; align-items:center; gap:10px;"><i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalErrorToast'); } document.getElementById('globalErrorMessage').innerHTML = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 4000); }; }

function getCurrentUser() {
    try { const session = sessionStorage.getItem('currentUser'); return session ? JSON.parse(session) : null; } catch (e) { return null; }
}

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

async function dbDelete(id) {
    const { error } = await window.supabase.from('meetings').delete().eq('id', id);
    if (error) throw error;
}

document.addEventListener('DOMContentLoaded', async function() {
    const user = getCurrentUser();
    if (user && document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }
    loadMembers();
    loadMeetings();
});

function switchTab(tab) {
    document.getElementById('members-view').classList.remove('active');
    document.getElementById('meetings-view').classList.remove('active');
    document.getElementById('tab-members').classList.remove('active');
    document.getElementById('tab-meetings').classList.remove('active');
    
    document.getElementById(`${tab}-view`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// =======================================================
// 👥 إدارة الأعضاء السحابية (Supabase)
// =======================================================
async function loadMembers() {
    const user = getCurrentUser();
    const container = document.getElementById('membersListContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="alert alert-info">جاري جلب الأعضاء من السحابة...</div>';
    
    try {
        const { data: myMembers, error } = await window.supabase
            .from('committee_members')
            .select('*')
            .eq('ownerId', user.id);

        if (error) throw error;

        if (!myMembers || myMembers.length === 0) { 
            container.innerHTML = '<div class="alert alert-info">لا يوجد أعضاء.</div>'; 
            return; 
        }
        
        let html = '<table class="table table-bordered bg-white"><thead><tr><th>الاسم</th><th>الصفة</th><th>المستخدم</th><th>المرور</th><th>إجراءات</th></tr></thead><tbody>';
        myMembers.forEach(m => { 
            html += `<tr>
                <td>${m.name}</td>
                <td>${m.role || 'عضو'}</td>
                <td>${m.username}</td>
                <td>${m.password}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editMember(${m.id})">تعديل</button> 
                    <button class="btn btn-sm btn-danger" onclick="deleteMember(${m.id})">حذف</button>
                </td>
            </tr>`; 
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="alert alert-danger">خطأ في جلب البيانات</div>';
    }
}

function showAddMemberModal() {
    document.getElementById('addMemberModal').classList.add('show');
    document.getElementById('editMemId').value='';
    document.getElementById('memName').value='';
    document.getElementById('memUser').value='';
    document.getElementById('memPass').value='';
}

async function saveMember() {
    const user = getCurrentUser();
    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value.trim();
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value.trim();
    const pass = document.getElementById('memPass').value.trim();
    
    if(!name || !username || !pass) return showError('البيانات ناقصة');
    
    try {
        let query = window.supabase.from('committee_members').select('id').eq('username', username);
        if (id) query = query.neq('id', id);
        
        const { data: existing } = await query;
        if (existing && existing.length > 0) return showError('اسم المستخدم مسجل مسبقاً. يرجى اختيار اسم آخر.');

        const memberData = { name: name, role: role, username: username, password: pass, ownerId: user.id };

        if(id) {
            await window.supabase.from('committee_members').update(memberData).eq('id', id);
        } else {
            memberData.id = Date.now();
            await window.supabase.from('committee_members').insert([memberData]);
        }
        
        closeModal('addMemberModal');
        loadMembers();
        showSuccess('تم حفظ العضو في السحابة بنجاح ✅');
    } catch (e) {
        console.error(e);
        showError('حدث خطأ أثناء الحفظ في السحابة');
    }
}

async function editMember(id) {
    try {
        const { data: m, error } = await window.supabase.from('committee_members').select('*').eq('id', id).single();
        if(m) {
            document.getElementById('editMemId').value = m.id;
            document.getElementById('memName').value = m.name;
            document.getElementById('memRole').value = m.role || 'عضو';
            document.getElementById('memUser').value = m.username;
            document.getElementById('memPass').value = m.password;
            document.getElementById('addMemberModal').classList.add('show');
        }
    } catch (e) { console.error(e); }
}

function deleteMember(id) {
    showConfirmModal('هل أنت متأكد من حذف هذا العضو نهائياً؟', async function() {
        try {
            await window.supabase.from('committee_members').delete().eq('id', id);
            loadMembers();
            showSuccess('تم الحذف من السحابة بنجاح');
        } catch (e) {
            console.error(e);
            showError('خطأ أثناء الحذف');
        }
    });
}

// =======================================================
// 📝 إدارة الاجتماعات
// =======================================================

function addPollTool() {
    const container = document.getElementById('dynamicToolsContainer');
    const id = Date.now();
    const html = `
    <div class="dynamic-item poll-tool" id="tool_${id}">
        <span class="remove-item-btn" onclick="removeTool('tool_${id}')">×</span>
        <h5 style="margin:0 0 10px 0; color:#007bff;">📊 تصويت جديد</h5>
        <input type="text" class="form-control mb-2 poll-question" placeholder="اكتب سؤال التصويت هنا">
        <div class="poll-options">
            <input type="text" class="form-control mb-1 poll-option" placeholder="خيار 1">
            <input type="text" class="form-control mb-1 poll-option" placeholder="خيار 2">
        </div>
        <button class="btn btn-sm btn-light" onclick="addPollOption(this)">+ خيار إضافي</button>
    </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

function addPollOption(btn) {
    const container = btn.previousElementSibling;
    container.insertAdjacentHTML('beforeend', `<input type="text" class="form-control mb-1 poll-option" placeholder="خيار جديد">`);
}

async function addStudentFeedbackTool() {
    const container = document.getElementById('dynamicToolsContainer');
    const id = Date.now();
    const teacherUser = getCurrentUser();
    
    try {
        const { data: students } = await window.supabase.from('users').select('*').eq('role', 'student').eq('teacherId', teacherUser.id);
        
        let options = '';
        if (students) students.forEach(s => options += `<option value="${s.id}">${s.name}</option>`);

        const html = `
        <div class="dynamic-item feedback-tool" id="tool_${id}">
            <span class="remove-item-btn" onclick="removeTool('tool_${id}')">×</span>
            <h5 style="margin:0 0 10px 0; color:#28a745;">👨‍🎓 طلب مرئيات عن طلاب</h5>
            <p style="font-size:0.85em; color:#666;">اختر الطلاب:</p>
            <select multiple class="form-control student-select" style="height:100px;">
                ${options}
            </select>
            <small style="color:#888;">Ctrl لتحديد أكثر من طالب</small>
        </div>`;
        container.insertAdjacentHTML('beforeend', html);
    } catch (e) { console.error(e); }
}

function removeTool(id) { document.getElementById(id).remove(); }

async function showNewMeetingModal() {
    ['meetTitle', 'meetDate', 'meetContent', 'meetPdf', 'meetImg'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    document.getElementById('dynamicToolsContainer').innerHTML = '';

    const user = getCurrentUser();
    const list = document.getElementById('attendeesList');
    list.innerHTML = 'جاري التحميل...';
    
    try {
        const { data: myMembers } = await window.supabase.from('committee_members').select('*').eq('ownerId', user.id);
        
        list.innerHTML = '';
        if (!myMembers || myMembers.length === 0) {
            list.innerHTML = '<small class="text-danger">لا يوجد أعضاء. أضف أعضاء أولاً.</small>';
        } else {
            myMembers.forEach(m => {
                list.innerHTML += `<div><label style="cursor:pointer"><input type="checkbox" value="${m.id}" checked> ${m.name}</label></div>`;
            });
        }
    } catch (e) { console.error(e); }

    document.getElementById('meetingModal').classList.add('show');
}

async function saveMeeting() {
    const user = getCurrentUser();
    const title = document.getElementById('meetTitle').value;
    const date = document.getElementById('meetDate').value;
    const content = document.getElementById('meetContent').value;

    if(!title || !date || !content) return alert('البيانات الإلزامية: العنوان، التاريخ، المحضر.');

    const polls = [];
    document.querySelectorAll('.poll-tool').forEach(div => {
        const question = div.querySelector('.poll-question').value;
        const options = [];
        div.querySelectorAll('.poll-option').forEach(opt => { if(opt.value) options.push(opt.value); });
        if(question && options.length > 0) polls.push({ id: Date.now() + Math.random(), question, options });
    });

    const requestedFeedback = [];
    document.querySelectorAll('.feedback-tool').forEach(div => {
        const select = div.querySelector('.student-select');
        Array.from(select.selectedOptions).forEach(opt => {
            requestedFeedback.push({ id: opt.value, name: opt.text });
        });
    });

    const attendees = [];
    document.querySelectorAll('#attendeesList input:checked').forEach(cb => attendees.push(parseInt(cb.value)));

    const readFile = (file) => new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsDataURL(file); });
    let pdfData = null, imgData = null;
    const pdfInput = document.getElementById('meetPdf');
    const imgInput = document.getElementById('meetImg');
    
    if (pdfInput.files[0]) pdfData = await readFile(pdfInput.files[0]);
    if (imgInput.files[0]) imgData = await readFile(imgInput.files[0]);

    const newMeeting = {
        id: Date.now(),
        teacherId: user.id,
        title, date, content,
        polls, requestedFeedback,
        pdfFile: pdfData, imgFile: imgData,
        attendees, signatures: {} 
    };

    try {
        await dbPut(newMeeting);
        closeModal('meetingModal');
        loadMeetings();
        showSuccess('تم حفظ الاجتماع بنجاح ✅');
    } catch(e) { console.error(e); alert('خطأ في الحفظ'); }
}

async function loadMeetings() {
    const container = document.getElementById('meetingsListContainer');
    const user = getCurrentUser();
    
    try {
        let meetings = await dbGetAll();
        let dbFix = false;
        for(let m of meetings) {
            if(!m.teacherId) { m.teacherId = user.id; await dbPut(m); dbFix = true; }
        }
        if(dbFix) meetings = await dbGetAll();

        const myMeetings = meetings.filter(m => m.teacherId == user.id);

        if(myMeetings.length === 0) { container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات.</div>'; return; }
        
        myMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '';
        myMeetings.forEach(m => {
            const total = m.attendees ? m.attendees.length : 0;
            const signed = m.signatures ? Object.keys(m.signatures).length : 0;
            const progressColor = (signed === total && total > 0) ? 'green' : '#ffc107';
            
            html += `<div class="meeting-card">
                <div class="card-header-custom"><h3>${m.title}</h3><span class="card-date">${m.date}</span></div>
                <div class="card-body-custom"><p>${(m.content||'').substring(0,80)}...</p></div>
                <div class="card-footer-custom"><span style="font-size:0.85em; color:#666;">التوقيعات: <strong style="color:${progressColor}">${signed}</strong> / ${total}</span>
                <div><button class="btn btn-sm btn-outline-primary" onclick="viewMeetingDetails(${m.id})">📄 عرض المحضر</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting(${m.id})">🗑️</button></div></div></div>`;
        });
        container.innerHTML = html;
    } catch(e) { console.error(e); }
}

async function viewMeetingDetails(id) {
    const meeting = await dbGet(id);
    if(!meeting) return;

    document.getElementById('viewMeetTitle').textContent = meeting.title;
    document.getElementById('viewMeetDate').textContent = meeting.date;
    document.getElementById('viewMeetContent').textContent = meeting.content;

    const pollsContainer = document.getElementById('viewPollsResults');
    pollsContainer.innerHTML = '';
    if(meeting.polls && meeting.polls.length > 0) {
        pollsContainer.innerHTML = '<h5>📊 نتائج التصويت:</h5>';
        meeting.polls.forEach(poll => {
            const counts = {};
            poll.options.forEach(o => counts[o] = 0);
            Object.values(meeting.signatures || {}).forEach(sig => {
                if(sig.pollResponses && sig.pollResponses[poll.id]) {
                    const answer = sig.pollResponses[poll.id];
                    if(counts[answer] !== undefined) counts[answer]++;
                }
            });
            let resultsHtml = `<div class="poll-result-box"><strong>❓ ${poll.question}</strong><ul style="margin-top:5px;">`;
            for(const [opt, count] of Object.entries(counts)) {
                resultsHtml += `<li>${opt}: <strong>${count}</strong> صوت</li>`;
            }
            resultsHtml += `</ul></div>`;
            pollsContainer.innerHTML += resultsHtml;
        });
    }

    const feedbackContainer = document.getElementById('viewStudentsFeedback');
    feedbackContainer.innerHTML = '';
    if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
        feedbackContainer.innerHTML = '<h5>👨‍🎓 مرئيات الأعضاء:</h5>';
        meeting.requestedFeedback.forEach(req => {
            let feedbackHtml = `<div class="student-feedback-box"><h6 style="color:#28a745; margin:0 0 5px 0;">${req.name}</h6>`;
            let hasComments = false;
            Object.values(meeting.signatures || {}).forEach(sig => {
                if(sig.feedbackResponses && sig.feedbackResponses[req.id]) {
                    hasComments = true;
                    feedbackHtml += `<div class="feedback-item"><strong>${sig.name}:</strong> ${sig.feedbackResponses[req.id]}</div>`;
                }
            });
            if(!hasComments) feedbackHtml += `<small style="color:#999;">لا توجد ملاحظات.</small>`;
            feedbackHtml += `</div>`;
            feedbackContainer.innerHTML += feedbackHtml;
        });
    }

    const attachSection = document.getElementById('viewAttachments');
    const pdfContainer = document.getElementById('pdfContainer');
    const imgContainer = document.getElementById('imgContainer');
    const imgDisplay = document.getElementById('viewMeetImgDisplay');

    if(meeting.pdfFile || meeting.imgFile) {
        attachSection.style.display = 'block';
        if(meeting.pdfFile) pdfContainer.innerHTML = `<a href="${meeting.pdfFile}" download="attach.pdf" class="btn btn-sm btn-info">⬇️ تحميل PDF</a>`; else pdfContainer.innerHTML='';
        if(meeting.imgFile) { imgDisplay.src = meeting.imgFile; imgContainer.style.display='block'; } else imgContainer.style.display='none';
    } else { attachSection.style.display = 'none'; }

    const tableBody = document.getElementById('signaturesTableBody');
    tableBody.innerHTML = '<tr><td colspan="3">جاري جلب التوقيعات...</td></tr>';
    
    const user = getCurrentUser();
    
    try {
        const { data: myMembers } = await window.supabase.from('committee_members').select('*').eq('ownerId', user.id);
        const attendeesList = (myMembers || []).filter(m => (meeting.attendees||[]).includes(m.id));

        tableBody.innerHTML = '';
        if(attendeesList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">لا يوجد مدعوون.</td></tr>';
        } else {
            attendeesList.forEach(member => {
                const sig = (meeting.signatures && meeting.signatures[member.id]) ? meeting.signatures[member.id] : null;
                let sigHtml = sig 
                    ? (sig.image ? `<img src="${sig.image}" class="sig-img-display"><br><small>${new Date(sig.date).toLocaleDateString('ar-SA')}</small>` 
                                 : `<b>${sig.name}</b><br><small>(اعتماد)</small>`)
                    : `<span style="color:red">بانتظار التوقيع</span>`;
                
                tableBody.innerHTML += `<tr><td style="text-align:right;">أ/ ${member.name}</td><td>${member.role || 'عضو'}</td><td>${sigHtml}</td></tr>`;
            });
        }
    } catch (e) { console.error(e); }

    document.getElementById('viewMeetingModal').classList.add('show');
}

async function deleteMeeting(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا الاجتماع نهائياً؟', async function() {
        await dbDelete(id); 
        loadMeetings(); 
        showSuccess('تم الحذف');
    });
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

window.addPollTool = addPollTool;
window.addPollOption = addPollOption;
window.addStudentFeedbackTool = addStudentFeedbackTool;
window.removeTool = removeTool;
window.showNewMeetingModal = showNewMeetingModal;
window.saveMeeting = saveMeeting;
window.loadMeetings = loadMeetings;
window.viewMeetingDetails = viewMeetingDetails;
window.deleteMeeting = deleteMeeting;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.showAddMemberModal = showAddMemberModal;
window.saveMember = saveMember;
window.editMember = editMember;
window.deleteMember = deleteMember;

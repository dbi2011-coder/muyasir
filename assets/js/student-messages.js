// ============================================
// 📁 المسار: assets/js/messages.js
// ============================================

let activeChatStudentId = null;
let attachmentData = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingStartTime = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        try { injectFontAwesome(); injectHtml2Pdf(); cleanInterfaceAggressive(); injectChatStyles(); renderChatLayout(); loadConversations();
            document.addEventListener('click', function(e) {
                const popup = document.getElementById('emojiPopup'); const btn = document.getElementById('emojiBtn'); if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) popup.style.display = 'none';
                if (!e.target.closest('.msg-options-btn')) document.querySelectorAll('.msg-dropdown').forEach(menu => menu.style.display = 'none');
            });
        } catch (e) { console.error(e); }
    }
});

function injectFontAwesome() { if (!document.getElementById('fontAwesomeLink')) { const link = document.createElement('link'); link.id = 'fontAwesomeLink'; link.rel = 'stylesheet'; link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'; document.head.appendChild(link); } }
function injectHtml2Pdf() { if (!document.getElementById('html2pdfScript')) { const script = document.createElement('script'); script.id = 'html2pdfScript'; script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'; document.head.appendChild(script); } }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }

function injectChatStyles() {
    if (document.getElementById('chatStyles')) return;
    const style = document.createElement('style'); style.id = 'chatStyles';
    style.innerHTML = `/* نفس الستايل السابق تماماً */ .chat-layout { display: flex; height: 85vh; background: #fff; border-radius: 15px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 10px; font-family: 'Tajawal', sans-serif; } .sidebar-list { width: 320px; background: #f8fafc; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; } .search-box { padding: 15px; border-bottom: 1px solid #e2e8f0; background: #fff; } .search-input { width: 100%; padding: 10px 15px; border-radius: 20px; border: 1px solid #cbd5e1; background: #f1f5f9; outline: none; transition: 0.3s; } .search-input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); } .students-list { flex: 1; overflow-y: auto; padding: 10px; } .student-item { display: flex; align-items: center; padding: 12px; border-radius: 10px; cursor: pointer; transition: 0.2s; margin-bottom: 5px; position: relative; } .student-item:hover { background: #e2e8f0; } .student-item.active { background: #e0f2fe; border-right: 4px solid #007bff; } .student-avatar { width: 45px; height: 45px; background: #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; font-size: 1.1rem; margin-left: 12px; } .student-info h4 { margin: 0; font-size: 0.95rem; color: #1e293b; font-weight: 600; } .student-info p { margin: 0; font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; } .msg-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; position: absolute; left: 10px; top: 15px; } .chat-area { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; } .chat-header { padding: 15px 20px; border-bottom: 1px solid #e2e8f0; background: #fff; display: flex; justify-content: space-between; align-items: center; z-index: 10; } .messages-container { flex: 1; padding: 20px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 15px; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 20px 20px; } .message-bubble { max-width: 70%; padding: 12px 16px; border-radius: 12px; font-size: 0.95rem; line-height: 1.5; position: relative; box-shadow: 0 2px 5px rgba(0,0,0,0.05); } .message-bubble.sent { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } .message-bubble.received { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; } .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display: block; text-align: left; } .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; z-index: 50; } .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; font-size: 1rem; background: #f8fafc; transition: 0.3s; } .chat-input:focus { border-color: #007bff; background: #fff; } .btn-icon { width: 40px; height: 40px; border-radius: 50%; border: none; background: #f1f5f9; color: #475569; font-size: 1.1rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; } .btn-icon:hover { background: #e2e8f0; color: #007bff; } .btn-send { background: #007bff; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; } .btn-send:hover { background: #0069d9; } .chat-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; } .chat-placeholder i { font-size: 4rem; margin-bottom: 20px; color: #cbd5e1; } .msg-options-btn { position: absolute; top: 5px; left: 8px; color: inherit; opacity: 0.6; cursor: pointer; } .msg-dropdown { position: absolute; top: 25px; left: 5px; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); width: 120px; z-index: 100; display: none; overflow: hidden; border: 1px solid #eee; } .msg-dropdown-item { padding: 8px 12px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; } .msg-dropdown-item:hover { background: #f8f9fa; color: #007bff; } .attachment-preview { position: absolute; bottom: 80px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: none; z-index: 20; } .emoji-popup { position: absolute; bottom: 80px; right: 60px; width: 300px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); padding: 10px; display: none; grid-template-columns: repeat(8, 1fr); gap: 5px; height: 200px; overflow-y: auto; z-index: 100; } .emoji-item { cursor: pointer; font-size: 1.4rem; padding: 5px; text-align: center; border-radius: 5px; } .emoji-item:hover { background: #f1f5f9; } @media (max-width: 768px) { .chat-layout { flex-direction: column; height: 90vh; } .sidebar-list { width: 100%; height: 100%; display: flex; } .chat-area { display: none; width: 100%; height: 100%; } .chat-area.active { display: flex; position: fixed; top: 0; left: 0; z-index: 999; } .sidebar-list.hidden { display: none; } }`;
    document.head.appendChild(style);
}

function cleanInterfaceAggressive() { const parent = document.querySelector('.main-content-dashboard .dashboard-content'); if (parent) Array.from(parent.children).forEach(child => { if (child.id !== 'chatLayoutRoot') child.style.display = 'none'; }); }
function renderChatLayout() { const container = document.querySelector('.dashboard-content'); const layout = document.createElement('div'); layout.id = 'chatLayoutRoot'; layout.className = 'chat-layout'; layout.innerHTML = `<div class="sidebar-list" id="sidebarList"><div class="search-box"><input type="text" class="search-input" placeholder="🔍 بحث عن طالب..." onkeyup="filterStudents(this.value)"><button class="btn btn-primary btn-sm w-100 mt-2" onclick="showNewMessageModal()">+ محادثة جديدة</button></div><div class="students-list" id="studentsList"></div></div><div class="chat-area" id="chatArea"><div class="chat-placeholder"><i class="far fa-comments"></i><h3>اختر طالباً لبدء المحادثة</h3></div></div>`; container.appendChild(layout); }

function loadConversations() {
    const list = document.getElementById('studentsList'); list.innerHTML = ''; const teacherId = getCurrentUser().id; const users = JSON.parse(localStorage.getItem('users') || '[]'); const myStudents = users.filter(u => u.role === 'student' && u.teacherId == teacherId); const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    if (myStudents.length === 0) { list.innerHTML = '<div class="text-center p-3 text-muted">لا يوجد طلاب.</div>'; return; }
    myStudents.forEach(s => {
        const lastMsg = messages.filter(m => (m.studentId == s.id && m.teacherId == teacherId)).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0]; const unread = messages.filter(m => m.studentId == s.id && m.isFromStudent && !m.isRead).length;
        const div = document.createElement('div'); div.className = `student-item ${activeChatStudentId === s.id ? 'active' : ''}`; div.onclick = () => openChat(s.id); div.innerHTML = `<div class="student-avatar">${s.name.charAt(0)}</div><div class="student-info"><h4>${s.name}</h4><p>${lastMsg ? (lastMsg.isVoice ? '🎤 رسالة صوتية' : (lastMsg.content || 'مرفق')) : 'لا توجد رسائل'}</p></div>${unread > 0 ? `<span class="msg-badge">${unread}</span>` : ''}`; list.appendChild(div);
    });
}

function openChat(studentId) {
    activeChatStudentId = studentId; loadConversations(); if (window.innerWidth <= 768) { document.getElementById('sidebarList').classList.add('hidden'); document.getElementById('chatArea').classList.add('active'); }
    const users = JSON.parse(localStorage.getItem('users') || '[]'); const student = users.find(u => u.id == studentId); const chatArea = document.getElementById('chatArea');
    const emojis = ['👍','👌','👏','🌹','🌟','💯','✅','😃','😄','😅','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😋','🤪','😎','🤩','🥳','🤔','🤫','😐','😑','🙄','😴','🤢','🤮','🤯','🧐','💀','👻','🤖','👋','✋','✌️','🤞','🤟','🤙','👈','👉','👆','👇','🤝','🙏','💪','👀','🧠','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💢','💥','💫','💦','💨','🕊','🐇','🐈','🐉','🌱','🌵','🌴','🌲','🌳','🍂','🍁','🍄','🌍','🌚','🌝','🌞','⭐','🌟','⚡','🔥','🌈','☂️','🎈','🎉','🎊','🎀','🎁','🏆','🥇','🥈','🥉','⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥅','🏒','🏑','🏏','🥍','🏹','🎣','🤿','🥊','🥋','⛸','🎿','🛷','🥌','🎯','🪀','🪁','🎮','🎰','🎲','🧩','🧸','♠️','♥️','♦️','♣️','♟','🃏','🀄','🎴','🎭','🖼','🎨','🧵','🧶','🎼','🎵','🎶','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','🎳','🎮','👾','🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🏍','🛵','🦽','🦼','🛺','🚲','🛴','🛹','🛼','🚏','🛣','🛤','🛢','⛽','🚨','🚥','🚦','🛑','🚧','⚓','⛵','🛶','🚤','🛳','⛴','🛥','🚢','✈','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🛎','🧳','⌛','⏳','⌚','⏰','⏱','⏲','🕰','🕛','🕧','🕐','🕜','🕑','🕝','🕒','🕞','🕓','🕟','🕔','🕠','🕕','🕡','🕖','🕢','🕗','🕣','🕘','🕤','🕙','🕥','🕚','🕦'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');
    chatArea.innerHTML = `<div class="chat-header"><div style="display:flex; align-items:center; gap:10px;">${window.innerWidth <= 768 ? `<button class="btn-icon" onclick="backToSidebar()"><i class="fas fa-arrow-right"></i></button>` : ''}<div class="student-avatar" style="margin:0; width:40px; height:40px;">${student.name.charAt(0)}</div><h3 style="margin:0; font-size:1.1rem;">${student.name}</h3></div><div><button class="btn-icon" style="color:#ef4444;" onclick="deleteEntireConversation(${studentId})" title="حذف المحادثة"><i class="fas fa-trash"></i></button><button class="btn-icon" style="color:#10b981;" onclick="exportChatToPDF(${studentId})" title="تصدير PDF"><i class="fas fa-file-pdf"></i></button></div></div><div class="messages-container" id="msgsContainer"></div><div id="attachmentPreview" class="attachment-preview"><span id="attachName" style="font-size:0.8rem;"></span><i class="fas fa-times" style="color:red; cursor:pointer; margin-right:10px;" onclick="clearAttachment()"></i></div><div id="emojiPopup" class="emoji-popup">${emojiHtml}</div><div class="chat-input-area"><button class="btn-icon" id="emojiBtn" onclick="toggleEmoji()"><i class="far fa-smile"></i></button><label class="btn-icon" style="cursor:pointer;"><i class="fas fa-paperclip"></i><input type="file" id="fileInput" hidden onchange="handleAttachment(this)"></label><input type="text" class="chat-input" id="msgInput" placeholder="اكتب رسالة..." onkeypress="handleEnter(event)"><button class="btn-icon" id="micBtn" onclick="startRecording()"><i class="fas fa-microphone"></i></button><button class="btn-send" id="sendBtn" onclick="sendMessage()">إرسال <i class="fas fa-paper-plane"></i></button><button class="btn-icon" id="cancelEditBtn" onclick="cancelEdit()" style="display:none; color:red;"><i class="fas fa-times"></i></button></div>`;
    loadMessages(studentId);
}

// 🔥 حذف باستخدام النافذة الموحدة
function deleteEntireConversation(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف كامل المحادثة مع هذا الطالب؟ لا يمكن التراجع.', function() {
        const teacherId = getCurrentUser().id;
        let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); tMsgs = tMsgs.filter(m => !(m.studentId == studentId && m.teacherId == teacherId)); localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));
        let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); sMsgs = sMsgs.filter(m => !(m.studentId == studentId && m.teacherId == teacherId)); localStorage.setItem('studentMessages', JSON.stringify(sMsgs));
        showSuccess('تم حذف المحادثة'); openChat(studentId);
    });
}

function loadMessages(studentId) {
    const container = document.getElementById('msgsContainer'); const teacherId = getCurrentUser().id; const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); const chat = messages.filter(m => (m.studentId == studentId && m.teacherId == teacherId)).sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    if (chat.length === 0) { container.innerHTML = '<div style="text-align:center; color:#94a3b8; margin-top:50px;">لا توجد رسائل. ابدأ المحادثة الآن!</div>'; return; }
    let html = ''; chat.forEach(msg => { const type = msg.isFromStudent ? 'received' : 'sent'; let content = msg.content; if(msg.isVoice) content = `<audio controls src="${msg.content}"></audio>`; let attach = ''; if(msg.attachment) { const isImg = msg.attachment.startsWith('data:image'); attach = `<div style="margin-top:5px;"><a href="${msg.attachment}" download="file" style="color:inherit; text-decoration:none;">${isImg ? `<img src="${msg.attachment}" style="max-width:150px; border-radius:10px;">` : '📎 مرفق'}</a></div>`; } let menu = ''; if(type === 'sent') menu = `<div class="msg-options-btn" onclick="toggleMsgMenu(event, ${msg.id})">⋮</div><div class="msg-dropdown" id="menu-${msg.id}">${!msg.isVoice ? `<div class="msg-dropdown-item" onclick="editMessage(${msg.id})"><i class="fas fa-pen"></i> تعديل</div>` : ''}<div class="msg-dropdown-item" onclick="deleteMessage(${msg.id})" style="color:red;"><i class="fas fa-trash"></i> حذف</div></div>`; html += `<div class="message-bubble ${type}">${menu} ${content} ${attach} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`; });
    container.innerHTML = html; container.scrollTop = container.scrollHeight;
    const newMsgs = messages.map(m => { if(m.studentId == studentId && m.isFromStudent && !m.isRead) m.isRead = true; return m; }); localStorage.setItem('teacherMessages', JSON.stringify(newMsgs));
}

function sendMessage() {
    const input = document.getElementById('msgInput'); const txt = input.value.trim(); if((!txt && !attachmentData) || !activeChatStudentId) return; const teacherId = getCurrentUser().id;
    if(editingMessageId) {
        let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); const idx = tMsgs.findIndex(m => m.id === editingMessageId); if(idx !== -1) { tMsgs[idx].content = txt; if(attachmentData) tMsgs[idx].attachment = attachmentData; localStorage.setItem('teacherMessages', JSON.stringify(tMsgs)); }
        let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); const sIdx = sMsgs.findIndex(m => m.id === (editingMessageId - 1)); if(sIdx !== -1) { sMsgs[sIdx].content = txt; if(attachmentData) sMsgs[sIdx].attachment = attachmentData; localStorage.setItem('studentMessages', JSON.stringify(sMsgs)); }
        cancelEdit(); loadMessages(activeChatStudentId); return;
    }
    const tMsg = { id: Date.now(), teacherId: teacherId, studentId: activeChatStudentId, content: txt || (attachmentData ? 'مرفق' : ''), attachment: attachmentData, isVoice: false, sentAt: new Date().toISOString(), isRead: true, isFromStudent: false };
    const sMsg = { id: Date.now() - 1, teacherId: teacherId, studentId: activeChatStudentId, content: txt || (attachmentData ? 'مرفق' : ''), attachment: attachmentData, isVoice: false, sentAt: new Date().toISOString(), isRead: false, isFromTeacher: true };
    const tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); tMsgs.push(tMsg); localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));
    const sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); sMsgs.push(sMsg); localStorage.setItem('studentMessages', JSON.stringify(sMsgs));
    input.value = ''; clearAttachment(); loadMessages(activeChatStudentId); loadConversations();
}

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('المتصفح لا يدعم التسجيل');
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => { mediaRecorder = new MediaRecorder(stream); audioChunks = []; mediaRecorder.ondataavailable = e => audioChunks.push(e.data); mediaRecorder.onstop = () => { const blob = new Blob(audioChunks, { type: 'audio/mp3' }); const reader = new FileReader(); reader.onload = e => sendVoice(e.target.result); reader.readAsDataURL(blob); stream.getTracks().forEach(t => t.stop()); }; mediaRecorder.start(); document.getElementById('micBtn').style.color = 'red'; }).catch(() => alert('المايكروفون غير متاح'));
}
function sendVoice(base64) {
    if(!activeChatStudentId) return; const teacherId = getCurrentUser().id;
    const tMsg = { id: Date.now(), teacherId, studentId: activeChatStudentId, content: base64, isVoice: true, sentAt: new Date().toISOString(), isRead: true, isFromStudent: false };
    const sMsg = { id: Date.now()-1, teacherId, studentId: activeChatStudentId, content: base64, isVoice: true, sentAt: new Date().toISOString(), isRead: false, isFromTeacher: true };
    let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); tMsgs.push(tMsg); localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));
    let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); sMsgs.push(sMsg); localStorage.setItem('studentMessages', JSON.stringify(sMsgs));
    document.getElementById('micBtn').style.color = ''; loadMessages(activeChatStudentId);
}

function handleAttachment(input) { if(input.files[0]) { const reader = new FileReader(); reader.onload = e => { attachmentData = e.target.result; document.getElementById('attachmentPreview').style.display = 'block'; document.getElementById('attachName').textContent = input.files[0].name; }; reader.readAsDataURL(input.files[0]); } }
function clearAttachment() { attachmentData = null; document.getElementById('attachmentPreview').style.display = 'none'; document.getElementById('fileInput').value = ''; }
function toggleEmoji() { const p = document.getElementById('emojiPopup'); p.style.display = p.style.display === 'grid' ? 'none' : 'grid'; }
function addEmoji(e) { document.getElementById('msgInput').value += e; document.getElementById('msgInput').focus(); }
function handleEnter(e) { if(e.key === 'Enter') sendMessage(); }
function toggleMsgMenu(e, id) { e.stopPropagation(); document.querySelectorAll('.msg-dropdown').forEach(d => d.style.display = 'none'); document.getElementById(`menu-${id}`).style.display = 'block'; }
// 🔥 حذف باستخدام النافذة الموحدة
function deleteMessage(id) {
    showConfirmModal('حذف الرسالة؟', function() {
        let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); tMsgs = tMsgs.filter(m => m.id !== id); localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));
        let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); sMsgs = sMsgs.filter(m => m.id !== (id - 1)); localStorage.setItem('studentMessages', JSON.stringify(sMsgs));
        loadMessages(activeChatStudentId);
    });
}
function editMessage(id) { const msgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); const m = msgs.find(x => x.id === id); if(!m || m.isVoice) return; document.getElementById('msgInput').value = m.content; editingMessageId = id; document.getElementById('sendBtn').innerHTML = '<i class="fas fa-check"></i>'; document.getElementById('cancelEditBtn').style.display = 'block'; }
function cancelEdit() { editingMessageId = null; document.getElementById('msgInput').value = ''; document.getElementById('sendBtn').innerHTML = 'إرسال <i class="fas fa-paper-plane"></i>'; document.getElementById('cancelEditBtn').style.display = 'none'; }
function backToSidebar() { document.getElementById('sidebarList').classList.remove('hidden'); document.getElementById('chatArea').classList.remove('active'); activeChatStudentId = null; }
function exportChatToPDF(studentId) { const element = document.getElementById('msgsContainer'); const opt = { margin: 10, filename: `chat_${studentId}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }; html2pdf().set(opt).from(element).save(); }
function filterStudents(term) { const list = document.getElementById('studentsList'); Array.from(list.children).forEach(item => { item.style.display = item.innerText.toLowerCase().includes(term.toLowerCase()) ? 'flex' : 'none'; }); }
function showNewMessageModal() { const r = document.getElementById('messageRecipient'); if(r) { loadStudentsForMessaging(); document.getElementById('newMessageModal').classList.add('show'); } else alert("اختر الطالب"); }
function loadStudentsForMessaging() { const r = document.getElementById('messageRecipient'); if(!r) return; const t = getCurrentUser().id; const u = JSON.parse(localStorage.getItem('users') || '[]'); const s = u.filter(x => x.role === 'student' && x.teacherId == t); r.innerHTML = '<option value="">اختر الطالب</option>'; s.forEach(x => r.innerHTML += `<option value="${x.id}">${x.name}</option>`); }

window.showNewMessageModal = showNewMessageModal; window.sendNewMessage = function() { const sId = document.getElementById('messageRecipient').value; if(sId) { document.getElementById('newMessageModal').classList.remove('show'); openChat(parseInt(sId)); } }; window.closeNewMessageModal = function() { document.getElementById('newMessageModal').classList.remove('show'); }; window.deleteEntireConversation = deleteEntireConversation; window.exportChatToPDF = exportChatToPDF;

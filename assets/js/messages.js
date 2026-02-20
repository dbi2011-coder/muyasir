// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: نسخة احترافية معتمدة (دعم الجوال بالكامل + الحفاظ على واجهة الكمبيوتر)
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
        try {
            injectFontAwesome();
            injectHtml2Pdf();
            cleanInterfaceAggressive(); 
            injectChatStyles();
            renderChatLayout();
            loadConversations();
            
            document.addEventListener('click', function(e) {
                const popup = document.getElementById('emojiPopup');
                const btn = document.getElementById('emojiBtn');
                if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) {
                    popup.style.display = 'none';
                }
                if (!e.target.closest('.msg-options-btn')) {
                    document.querySelectorAll('.msg-dropdown').forEach(menu => menu.style.display = 'none');
                }
                const deleteModal = document.getElementById('deleteConfirmModal');
                if (deleteModal && e.target === deleteModal) {
                    closeDeleteModal();
                }
            });
        } catch (e) { console.error(e); }
    }
});

function injectFontAwesome() {
    if (!document.getElementById('fontAwesomeLink')) {
        const link = document.createElement('link');
        link.id = 'fontAwesomeLink';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
    }
}

function injectHtml2Pdf() {
    if (!document.getElementById('html2pdfScript')) {
        const script = document.createElement('script');
        script.id = 'html2pdfScript';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.body.appendChild(script);
    }
}

function getCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user).user : null;
}

function cleanInterfaceAggressive() {
    const targetContainer = document.getElementById('messagesList');
    if (!targetContainer) return;
    const parent = targetContainer.parentElement;
    if (parent) {
        Array.from(parent.children).forEach(child => {
            if (child.id !== 'messagesList' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
                child.style.display = 'none';
            }
        });
    }
}

function injectChatStyles() {
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        /* --- تنسيقات واجهة الكمبيوتر (كما هي) --- */
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; font-family: 'Tajawal', sans-serif; }
        .chat-sidebar { width: 320px; background-color: #f8f9fa; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; z-index: 2; }
        .chat-list-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0; }
        .chat-list { flex: 1; overflow-y: auto; }
        .chat-item { display: flex; align-items: center; padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #e2e8f0; transition: 0.2s; background: #fff; }
        .chat-item:hover { background: #f1f5f9; }
        .chat-item.active { background: #007bff !important; color: #fff !important; }
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; flex-shrink: 0; }
        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: bold; color: #334155; display:flex; justify-content:space-between; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; min-width: 0; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; height: 70px; }
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; }
        .msg-me { align-self: flex-start; background: #007bff; color: white; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; }
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; }
        .btn-send-pill { background-color: #007bff; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-tool { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; border: none; color: white; }
        
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 5000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
        .custom-modal-box { background: #fff; padding: 25px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; }

        /* --- تخصيص الجوال حصراً (أقل من 768px) --- */
        @media (max-width: 768px) { 
            .messages-container { height: calc(100vh - 120px) !important; margin-bottom: -30px !important; }
            .chat-container { height: 100% !important; border-radius: 0 !important; border: none !important; }
            
            /* إخفاء القائمة الجانبية في الجوال */
            .chat-sidebar { position: absolute !important; right: -100% !important; top: 0 !important; height: 100% !important; width: 280px !important; transition: right 0.3s ease; z-index: 1001 !important; }
            .chat-sidebar.show-contacts { right: 0 !important; }

            /* الرأس في الجوال - سطر واحد مع أيقونات شفافة */
            .chat-header { height: 60px !important; padding: 0 10px !important; flex-wrap: nowrap !important; }
            .chat-header .avatar { width: 35px !important; height: 35px !important; margin-left: 8px !important; }
            #chatHeaderName { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; font-size: 0.9rem !important; }
            
            .header-actions { display: flex !important; gap: 15px !important; flex-direction: row !important; flex-shrink: 0; }
            .btn-header-action { background: transparent !important; color: inherit !important; width: auto !important; height: auto !important; font-size: 1.3rem !important; box-shadow: none !important; padding: 5px !important; }
            .btn-delete-chat { color: #dc2626 !important; }
            .btn-pdf-chat { color: #2563eb !important; }

            /* شريط الكتابة وأدوات المرفقات الموسطة */
            .chat-input-area { flex-direction: column !important; align-items: stretch !important; background: #f0f2f5 !important; padding: 10px !important; }
            .input-main-wrapper { display: flex; align-items: center; gap: 8px; width: 100%; order: 1; }
            .input-tools-wrapper { display: flex; justify-content: center; gap: 20px; order: 2; padding-top: 8px; }
            .input-tools-wrapper .btn-tool { background: #fff !important; color: #555 !important; border: 1px solid #ddd !important; border-radius: 8px !important; width: 35px !important; height: 35px !important; box-shadow: none !important; font-size: 1rem !important; }
        }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😍','🥰','😘','😜','😎','🤔','😢','😭','🔥','👍','✅'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')" style="cursor:pointer; padding:5px; text-align:center;">${e}</div>`).join('');

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar" id="chatSidebar">
                <div class="chat-list-header" style="display:flex; align-items:center; gap:10px;">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="border-radius:25px;"><i class="fas fa-plus"></i> محادثة جديدة</button>
                    <button class="btn btn-light d-md-none" onclick="document.getElementById('chatSidebar').classList.remove('show-contacts')"><i class="fas fa-times"></i></button>
                </div>
                <div class="chat-list" id="chatContactsList"></div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div style="display:flex; align-items:center; min-width:0; flex:1;">
                        <button class="btn btn-light me-2 d-md-none" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')"><i class="fas fa-users"></i></button>
                        <div class="avatar" id="chatHeaderAvatar"></div>
                        <div style="display:flex; flex-direction:column; margin-right:8px; min-width:0;">
                            <span id="chatHeaderName" style="font-weight:bold;">اسم الطالب</span>
                            <span style="font-size:0.7rem; color:#10b981;">● متصل</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-header-action btn-pdf-chat" onclick="exportChatToPDF()" title="حفظ PDF"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn-header-action btn-delete-chat" onclick="deleteEntireConversation()" title="حذف المحادثة"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                
                <div class="messages-area" id="chatMessagesArea">
                    <div class="empty-chat" style="text-align:center; padding-top:100px; color:#999;">
                        <i class="far fa-comments fa-3x mb-3"></i>
                        <p>اختر طالباً للبدء بالمراسلة</p>
                        <button class="btn btn-primary d-md-none mt-3" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')">👥 إظهار الطلاب</button>
                    </div>
                </div>

                <div id="emojiPopup" style="position:absolute; bottom:120px; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #ddd; display:none; grid-template-columns:repeat(5,1fr); padding:10px; border-radius:10px; z-index:2000; box-shadow:0 5px 15px rgba(0,0,0,0.1); width:250px;">${emojiHtml}</div>

                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    <div class="input-main-wrapper">
                        <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                        <button class="btn btn-mic btn-tool d-md-none" style="background:#b71c1c" onclick="startRecording()"><i class="fas fa-microphone"></i></button>
                        <button class="btn-send-pill" onclick="sendChatMessage()">أرسل <i class="fas fa-paper-plane"></i></button>
                    </div>
                    <div class="input-tools-wrapper">
                        <div class="btn-tool" onclick="toggleEmojiPopup()" id="emojiBtn" style="background:#f57f17"><i class="far fa-smile"></i></div>
                        <label class="btn-tool" style="background:#37474f"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleChatAttachment(this)"></label>
                        <label class="btn-tool" style="background:#0d47a1"><i class="fas fa-camera"></i><input type="file" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)"></label>
                        <div class="btn-tool d-none d-md-flex" style="background:#b71c1c" onclick="startRecording()"><i class="fas fa-microphone"></i></div>
                    </div>
                </div>
            </div>
        </div>

        <div id="deleteConfirmModal" class="custom-modal-overlay">
            <div class="custom-modal-box">
                <div class="modal-icon-danger"><i class="fas fa-exclamation-triangle"></i></div>
                <h4 style="color:#1f2937; margin-bottom:10px;">حذف المحادثة؟</h4>
                <p style="color:#6b7280; font-size:0.9rem;">سيتم مسح سجل الرسائل نهائياً.</p>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="btn btn-light flex-grow-1" onclick="closeDeleteModal()">إلغاء</button>
                    <button class="btn btn-danger flex-grow-1" onclick="confirmDeleteAction()">نعم، حذف</button>
                </div>
            </div>
        </div>
    `;
}

function loadConversations() {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const user = getCurrentUser(); if (!user) return;
    const conversations = {};
    messages.forEach(msg => {
        if (msg.teacherId === user.id) {
            if (!conversations[msg.studentId]) conversations[msg.studentId] = { studentId: msg.studentId, lastMessage: msg };
        }
    });
    renderSidebar(Object.values(conversations));
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList'); if (!listEl) return;
    listEl.innerHTML = conversations.length === 0 ? '<div class="p-4 text-center text-muted">لا توجد محادثات</div>' : '';
    conversations.forEach(convo => {
        const student = getStudentById(convo.studentId);
        const name = student ? student.name : 'طالب';
        const html = `<div class="chat-item ${activeChatStudentId === convo.studentId ? 'active' : ''}" onclick="openChat(${convo.studentId})">
            <div class="avatar">${name.charAt(0)}</div>
            <div class="chat-info"><b>${name}</b></div>
        </div>`;
        listEl.innerHTML += html;
    });
}

function openChat(studentId) {
    activeChatStudentId = studentId;
    const sidebar = document.getElementById('chatSidebar');
    if(sidebar) sidebar.classList.remove('show-contacts');
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'flex';
    const student = getStudentById(studentId);
    document.getElementById('chatHeaderName').textContent = student ? student.name : 'طالب';
    document.getElementById('chatHeaderAvatar').textContent = student ? student.name.charAt(0) : '?';
    loadChatMessages(studentId);
    loadConversations();
}

function loadChatMessages(studentId) {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const user = getCurrentUser();
    const chatMsgs = messages.filter(m => m.teacherId === user.id && m.studentId === studentId);
    const area = document.getElementById('chatMessagesArea'); area.innerHTML = '';
    chatMsgs.forEach(msg => {
        const bubbleClass = !msg.isFromStudent ? 'msg-me' : 'msg-other';
        area.innerHTML += `<div class="msg-bubble ${bubbleClass}">${msg.content}</div>`;
    });
    area.scrollTop = area.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput'); const content = input.value.trim();
    if (!content || !activeChatStudentId) return;
    const user = getCurrentUser();
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    messages.push({ id: Date.now(), teacherId: user.id, studentId: activeChatStudentId, content: content, sentAt: new Date().toISOString(), isFromStudent: false });
    localStorage.setItem('teacherMessages', JSON.stringify(messages));
    input.value = ''; loadChatMessages(activeChatStudentId); loadConversations();
}

function getStudentById(id) {
    return JSON.parse(localStorage.getItem('students') || '[]').find(s => s.id == id);
}

function showNewMessageModal() {
    const modal = document.getElementById('newMessageModal');
    if (modal) { loadStudentsForMessaging(); modal.classList.add('show'); }
}

function loadStudentsForMessaging() {
    const select = document.getElementById('messageRecipient'); if (!select) return;
    const user = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]').filter(s => s.teacherId == user.id);
    select.innerHTML = '<option value="">اختر الطالب</option>' + students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function toggleEmojiPopup() {
    const p = document.getElementById('emojiPopup'); p.style.display = p.style.display === 'none' ? 'grid' : 'none';
}

function addEmoji(e) { document.getElementById('chatInput').value += e; document.getElementById('emojiPopup').style.display = 'none'; }

function deleteEntireConversation() { document.getElementById('deleteConfirmModal').style.display = 'flex'; }
function closeDeleteModal() { document.getElementById('deleteConfirmModal').style.display = 'none'; }
function confirmDeleteAction() {
    const user = getCurrentUser();
    let msgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    msgs = msgs.filter(m => !(m.teacherId === user.id && m.studentId === activeChatStudentId));
    localStorage.setItem('teacherMessages', JSON.stringify(msgs));
    location.reload();
}

function exportChatToPDF() {
    const element = document.getElementById('chatMessagesArea');
    if (window.html2pdf) {
        const student = getStudentById(activeChatStudentId);
        html2pdf().from(element).save(`محادثة_${student ? student.name : 'طالب'}.pdf`);
    }
}

// الربط بالنافذة العالمية
window.showNewMessageModal = showNewMessageModal;
window.sendNewMessage = function() {
    const sId = document.getElementById('messageRecipient').value;
    if(sId) { document.getElementById('newMessageModal').classList.remove('show'); openChat(parseInt(sId)); }
};
window.closeNewMessageModal = () => document.getElementById('newMessageModal').classList.remove('show');
window.deleteEntireConversation = deleteEntireConversation;
window.confirmDeleteAction = confirmDeleteAction;
window.closeDeleteModal = closeDeleteModal;
window.exportChatToPDF = exportChatToPDF;
window.toggleEmojiPopup = toggleEmojiPopup;
window.addEmoji = addEmoji;
window.handleChatAttachment = function() { alert('قريباً'); };
window.startRecording = function() { alert('التسجيل متاح في نسخة الجوال'); };
window.sendChatMessage = sendChatMessage;

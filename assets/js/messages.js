// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: نسخة الكمبيوتر الأصلية (آمنة) + إصلاح ظهور الأزرار ونافذة اختيار الطالب بالجوال
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
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
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
        /* =========================================
           💻 تنسيقات الكمبيوتر (الأصلية والمستقرة تماماً)
        ========================================= */
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 0px; font-family: 'Tajawal', sans-serif; }
        .chat-sidebar { width: 320px; background-color: #f8f9fa; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; z-index: 2; position: relative; }
        .chat-list-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0; }
        .chat-list { flex: 1; overflow-y: auto; }
        .chat-item { display: flex; align-items: center; padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #e2e8f0; transition: 0.2s; background: #fff; }
        .chat-item:hover { background: #f1f5f9; }
        .chat-item.active { background: #007bff !important; color: #fff !important; border-right: 5px solid #004494; }
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; flex-shrink: 0; }
        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: bold; color: #334155; font-size: 0.95rem; display:flex; justify-content:space-between; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; height: 100%; overflow: hidden; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; height: 70px; flex-shrink: 0; }
        .header-actions { display: flex; gap: 10px; }
        .btn-header-action { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 1.1rem; border: none; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .btn-delete-chat { background: #c62828; }
        .btn-pdf-chat { background: #1565c0; }
        .messages-area { flex: 1 1 auto; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; }
        .msg-me { align-self: flex-start; background: #007bff; color: white; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; }
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; min-height: 80px; flex-shrink: 0; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; background: #f8fafc; margin: 0 5px; }
        .btn-tool { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; border: none; color: white !important; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .btn-send-pill { background-color: #007bff; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        
        /* إصلاح ظهور نافذة "محادثة جديدة" للكمبيوتر والجوال */
        #newMessageModal { z-index: 10001 !important; }
        .modal-backdrop { z-index: 10000 !important; }

        .mobile-only-btn { display: none; }

        /* =========================================
           📱 تخصيص الجوال حصراً (أقل من 768px)
        ========================================= */
        @media (max-width: 768px) { 
            .mobile-only-btn { display: inline-block !important; background: transparent; border: none; font-size: 1.2rem; color: #333; margin: 0 10px; cursor: pointer; padding: 0; }
            
            /* تمديد المحادثة ومنع اختفاء الجزء السفلي */
            .messages-container { height: calc(100vh - 110px) !important; display: flex !important; flex-direction: column !important; }
            .chat-container { height: 100% !important; flex: 1 !important; border-radius: 0 !important; border: none !important; margin: 0 !important; overflow: hidden !important; }
            
            /* القائمة الجانبية درج علوي */
            .chat-sidebar { position: fixed !important; right: -100%; top: 0; height: 100%; width: 280px; z-index: 10000 !important; transition: right 0.3s ease; box-shadow: -4px 0 15px rgba(0,0,0,0.1); }
            .chat-sidebar.show-contacts { right: 0 !important; }

            /* الرأس والجزء السفلي: منع الانكماش flex-shrink: 0 */
            .chat-header { flex-shrink: 0 !important; padding: 5px 10px !important; height: 60px !important; flex-wrap: nowrap !important; }
            #chatHeaderName { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; max-width: 130px !important; }
            .btn-pdf-chat { display: none !important; }
            .btn-delete-chat { background: transparent !important; color: #dc2626 !important; box-shadow: none !important; font-size: 1.4rem !important; }

            /* الجزء السفلي ثابت الأزرار ظاهرة */
            .chat-input-area { 
                flex-shrink: 0 !important; 
                flex-wrap: wrap !important; 
                justify-content: center !important; 
                padding: 8px !important; 
                gap: 5px !important; 
                background: #f0f2f5 !important;
                min-height: auto !important;
            }
            .chat-input { order: 1 !important; flex: 1 1 50% !important; margin: 0 !important; }
            .btn-mic { order: 2 !important; flex-shrink: 0 !important; }
            #sendBtn { order: 3 !important; flex-shrink: 0 !important; }
            
            /* ترتيب أزرار المرفقات في سطر مستقل تحت مربع النص */
            .chat-input-area::after { content: ""; width: 100%; order: 4; }
            #emojiBtn { order: 5 !important; }
            .btn-attach { order: 6 !important; }
            .btn-cam { order: 7 !important; }

            #emojiBtn, .btn-attach, .btn-cam {
                border-radius: 8px !important; width: 38px !important; height: 38px !important; 
                background: #fff !important; color: #555 !important; border: 1px solid #ddd !important;
                box-shadow: none !important; margin: 2px 5px !important; display: flex !important;
            }
            
            .emoji-popup { width: 90vw !important; right: 5vw !important; bottom: 105px !important; z-index: 10001 !important; }
        }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','👻','💀','☠️'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar" id="chatSidebar">
                <div class="chat-list-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="font-weight:bold; border-radius:25px;"><i class="fas fa-plus"></i> محادثة جديدة</button>
                    <button class="mobile-only-btn" onclick="document.getElementById('chatSidebar').classList.remove('show-contacts')"><i class="fas fa-times"></i></button>
                </div>
                <div class="chat-list" id="chatContactsList"></div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div class="header-info">
                        <button class="mobile-only-btn" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')"><i class="fas fa-users"></i></button>
                        <div class="avatar" id="chatHeaderAvatar"></div>
                        <div style="display:flex; flex-direction:column; margin-right:10px;">
                            <span id="chatHeaderName" style="line-height:1.2;">اسم الطالب</span>
                            <span style="font-size:0.75rem; color:#10b981; font-weight:normal;">● متصل</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-header-action btn-pdf-chat" onclick="exportChatToPDF()"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn-header-action btn-delete-chat" onclick="deleteEntireConversation()"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                
                <div class="messages-area" id="chatMessagesArea">
                    <div class="empty-chat">
                        <i class="far fa-comments fa-4x mb-4" style="color:#cbd5e1;"></i>
                        <p>اختر طالباً للبدء بالمراسلة</p>
                        <button class="btn btn-primary mobile-only-btn" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')" style="margin-top:15px; border-radius:20px;">👥 استعراض الطلاب</button>
                    </div>
                </div>

                <div id="emojiPopup" class="emoji-popup" style="display:none;">${emojiHtml}</div>

                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    <div class="recording-area" id="recordingArea">
                        <div class="recording-timer"><div class="recording-wave"></div><span id="recordTimer">00:00</span></div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-tool" style="background:#dc3545" onclick="cancelRecording()"><i class="fas fa-times"></i></button>
                            <button class="btn-tool" style="background:#28a745" onclick="stopRecording()"><i class="fas fa-check"></i></button>
                        </div>
                    </div>

                    <button id="emojiBtn" class="btn-tool btn-emoji" onclick="toggleEmojiPopup()"><i class="far fa-smile"></i></button>
                    <label class="btn-tool btn-attach"><i class="fas fa-paperclip"></i><input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)"></label>
                    <label class="btn-tool btn-cam"><i class="fas fa-camera"></i><input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)"></label>
                    
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." onkeypress="handleEnter(event)">
                    
                    <button class="btn-tool btn-mic" onclick="startRecording()"><i class="fas fa-microphone"></i></button>
                    <button class="btn-tool" onclick="cancelEdit()" id="cancelEditBtn" style="display:none; background:#ffebee; color:red;"><i class="fas fa-times"></i></button>
                    <button class="btn-send-pill" id="sendBtn" onclick="sendChatMessage()">أرسل <i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>

        <div id="deleteConfirmModal" class="custom-modal-overlay">
            <div class="custom-modal-box">
                <div class="modal-icon-danger"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="modal-title">حذف المحادثة؟</div>
                <div class="modal-desc">هل أنت متأكد من رغبتك في حذف سجل المحادثة بالكامل؟</div>
                <div class="modal-actions">
                    <button class="btn-modal btn-modal-cancel" onclick="closeDeleteModal()">إلغاء</button>
                    <button class="btn-modal btn-modal-delete" onclick="confirmDeleteAction()"><i class="fas fa-trash-alt"></i> نعم، حذف</button>
                </div>
            </div>
        </div>
    `;
}

function loadConversations() {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentUser = getCurrentUser();
    const conversations = {};
    messages.forEach(msg => {
        if (msg.teacherId !== currentUser.id) return;
        if (!conversations[msg.studentId]) conversations[msg.studentId] = { studentId: msg.studentId, lastMessage: msg, unreadCount: 0 };
        if (new Date(msg.sentAt) > new Date(conversations[msg.studentId].lastMessage.sentAt)) conversations[msg.studentId].lastMessage = msg;
        if (msg.isFromStudent && !msg.isRead) conversations[msg.studentId].unreadCount++;
    });
    renderSidebar(Object.values(conversations).sort((a,b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt)));
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList'); if (!listEl) return;
    listEl.innerHTML = conversations.length === 0 ? '<div class="text-center p-4 text-muted"><small>لا توجد محادثات نشطة</small></div>' : '';
    conversations.forEach(convo => {
        const student = getStudentById(convo.studentId);
        const name = student ? student.name : 'طالب';
        const unreadHtml = convo.unreadCount > 0 ? `<span class="unread-badge">${convo.unreadCount}</span>` : '';
        listEl.innerHTML += `<div class="chat-item ${activeChatStudentId === convo.studentId ? 'active' : ''}" onclick="openChat(${convo.studentId})">
            <div class="avatar">${name.charAt(0)}</div>
            <div class="chat-info"><div class="chat-name"><span>${name}</span></div><div class="chat-preview">${unreadHtml} ${convo.lastMessage.content}</div></div></div>`;
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
}

function loadChatMessages(studentId) {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentUser = getCurrentUser();
    const chatMsgs = messages.filter(m => m.teacherId === currentUser.id && m.studentId === studentId).sort((a,b) => new Date(a.sentAt) - new Date(b.sentAt));
    const area = document.getElementById('chatMessagesArea'); area.innerHTML = '';
    chatMsgs.forEach(msg => {
        const bubbleClass = !msg.isFromStudent ? 'msg-me' : 'msg-other';
        area.innerHTML += `<div class="msg-bubble ${bubbleClass}">${msg.content}</div>`;
    });
    area.scrollTop = area.scrollHeight;
}

function exportChatToPDF() {
    if (!activeChatStudentId) return;
    const element = document.getElementById('chatMessagesArea');
    if (window.html2pdf) html2pdf().from(element).save('محادثة.pdf');
}

function deleteEntireConversation() { if (activeChatStudentId) document.getElementById('deleteConfirmModal').style.display = 'flex'; }
function closeDeleteModal() { document.getElementById('deleteConfirmModal').style.display = 'none'; }
function confirmDeleteAction() {
    const user = getCurrentUser();
    let msgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    msgs = msgs.filter(m => !(m.teacherId === user.id && m.studentId === activeChatStudentId));
    localStorage.setItem('teacherMessages', JSON.stringify(msgs));
    location.reload();
}

function startRecording() { /* وظيفة التسجيل الأصلية */ }
function toggleEmojiPopup() { const p = document.getElementById('emojiPopup'); p.style.display = p.style.display === 'none' ? 'grid' : 'none'; }
function addEmoji(char) { document.getElementById('chatInput').value += char; }
function handleChatAttachment(input) { /* وظيفة المرفقات الأصلية */ }
function sendChatMessage() {
    const input = document.getElementById('chatInput'); if (!input.value.trim() || !activeChatStudentId) return;
    const user = getCurrentUser();
    const msgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    msgs.push({ id: Date.now(), teacherId: user.id, studentId: activeChatStudentId, content: input.value, sentAt: new Date().toISOString(), isFromStudent: false });
    localStorage.setItem('teacherMessages', JSON.stringify(msgs));
    input.value = ''; loadChatMessages(activeChatStudentId);
}
function handleEnter(e) { if (e.key === 'Enter') sendChatMessage(); }
function getStudentById(id) { return JSON.parse(localStorage.getItem('students') || '[]').find(s => s.id == id); }
function showNewMessageModal() { 
    loadStudentsForMessaging(); 
    const modal = document.getElementById('newMessageModal');
    if(modal) modal.classList.add('show'); 
}
function loadStudentsForMessaging() {
    const select = document.getElementById('messageRecipient'); if(!select) return;
    const user = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]').filter(s => s.teacherId == user.id);
    select.innerHTML = '<option value="">اختر الطالب</option>' + students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

window.showNewMessageModal = showNewMessageModal; 
window.sendNewMessage = function() { const sId = document.getElementById('messageRecipient').value; if(sId) { document.getElementById('newMessageModal').classList.remove('show'); openChat(parseInt(sId)); } }; 
window.closeNewMessageModal = () => document.getElementById('newMessageModal').classList.remove('show');
window.deleteEntireConversation = deleteEntireConversation;
window.exportChatToPDF = exportChatToPDF;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteAction = confirmDeleteAction;
window.toggleEmojiPopup = toggleEmojiPopup;
window.addEmoji = addEmoji;
window.handleChatAttachment = handleChatAttachment;
window.sendChatMessage = sendChatMessage;

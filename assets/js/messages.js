// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: شات المعلم (إضافة زر تنزيل الصوت)
// ============================================

let activeChatStudentId = null;
let attachmentData = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingStartTime = null;

// ... (نفس كود document.addEventListener و الدوال المساعدة الأولى) ...

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
            });
        } catch (e) { console.error(e); }
    }
});

// ... (نفس دوال injectFontAwesome, injectHtml2Pdf, getCurrentUser, cleanInterfaceAggressive, injectChatStyles, renderChatLayout, loadConversations, openChat) ...

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
    document.querySelectorAll('.stat-card, .filter-group').forEach(el => el.style.display = 'none');
}

function injectChatStyles() {
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 0px; font-family: 'Tajawal', sans-serif; }
        .chat-sidebar { width: 320px; background-color: #f8f9fa; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; z-index: 2; }
        .chat-list-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0; }
        .chat-list { flex: 1; overflow-y: auto; }
        .chat-item { display: flex; align-items: center; padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #e2e8f0; transition: 0.2s; background: #fff; }
        .chat-item:hover { background: #f1f5f9; }
        .chat-item.active { background: #007bff !important; color: #fff !important; border-right: 5px solid #004494; }
        .chat-item.active .chat-name { color: #fff !important; }
        .chat-item.active .chat-preview { color: #e0e0e0 !important; }
        .chat-item.active .avatar { background: #fff; color: #007bff; border: 2px solid #007bff; }
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; }
        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: bold; color: #334155; font-size: 0.95rem; display:flex; justify-content:space-between; margin-bottom: 4px; }
        .chat-preview { font-size: 0.85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .unread-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; background: #fff; font-weight: bold; font-size: 1.1rem; color:#334155; height: 70px; }
        .header-actions { display: flex; gap: 10px; }
        .btn-header-action { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 1.1rem; border: none; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .btn-delete-chat { background: #c62828; }
        .btn-delete-chat:hover { background: #b71c1c; transform: scale(1.1); }
        .btn-pdf-chat { background: #1565c0; }
        .btn-pdf-chat:hover { background: #0d47a1; transform: scale(1.1); }
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        audio { height: 35px; width: 220px; margin-top: 5px; border-radius: 20px; outline: none; }
        .msg-me audio { filter: invert(1) grayscale(1) brightness(2); }
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display:block; text-align:left; }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; text-decoration: none; color: inherit; }
        .msg-attachment img { max-width: 200px; border-radius: 5px; }
        .msg-options-btn { position: absolute; top: 5px; left: 8px; color: inherit; opacity: 0.6; cursor: pointer; padding: 2px 5px; font-size: 1.1rem; transition: 0.2s; }
        .msg-options-btn:hover { opacity: 1; background: rgba(0,0,0,0.1); border-radius: 50%; }
        .msg-dropdown { position: absolute; top: 25px; left: 5px; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); width: 120px; z-index: 100; display: none; overflow: hidden; border: 1px solid #eee; }
        .msg-dropdown-item { padding: 10px 15px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.1s; }
        .msg-dropdown-item:hover { background: #f8f9fa; color: #007bff; }
        .msg-dropdown-item.delete:hover { color: #dc3545; background: #fff5f5; }
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; min-height: 80px; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; background: #f8fafc; margin: 0 5px; }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        .chat-input.editing { border-color: #f59e0b; background: #fffbeb; }
        .btn-tool { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; transition: 0.2s; border: none; color: white !important; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .btn-tool:hover { transform: translateY(-2px); box-shadow: 0 5px 10px rgba(0,0,0,0.3); filter: brightness(1.1); }
        .btn-emoji { background: #f57f17; }
        .btn-attach { background: #37474f; }
        .btn-cam { background: #0d47a1; }
        .btn-mic { background: #b71c1c; }
        .btn-send-pill { background-color: #007bff; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-size: 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2); }
        .btn-send-pill:hover { background-color: #0069d9; transform: translateY(-1px); }
        .btn-send-pill.update-mode { background-color: #f59e0b; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2); }
        .recording-area { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; display: none; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 50; border-radius: 12px; }
        .recording-timer { font-weight: bold; color: #b71c1c; font-size: 1.1rem; display:flex; align-items:center; gap:10px; }
        .recording-wave { width: 12px; height: 12px; background: #b71c1c; border-radius: 50%; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        .attachment-preview { position: absolute; bottom: 85px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: none; z-index: 10; }
        .emoji-popup { position: absolute; bottom: 85px; right: 20px; width: 320px; height: 250px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: none; padding: 10px; grid-template-columns: repeat(7, 1fr); gap: 5px; overflow-y: auto; z-index: 100; }
        .emoji-item { font-size: 1.4rem; cursor: pointer; text-align: center; padding: 5px; border-radius: 5px; transition: 0.2s; }
        .emoji-item:hover { background: #f1f5f9; transform: scale(1.2); }
        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    container.className = '';
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','✅','❌','❓','❗️','✔️','🆗'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-list-header">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="font-weight:bold; border-radius:25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <i class="fas fa-plus"></i> محادثة جديدة
                    </button>
                </div>
                <div class="chat-list" id="chatContactsList"></div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div style="display:flex; align-items:center;">
                        <div class="avatar" id="chatHeaderAvatar"></div>
                        <div style="display:flex; flex-direction:column; margin-right:10px;">
                            <span id="chatHeaderName" style="line-height:1.2;">اسم الطالب</span>
                            <span style="font-size:0.75rem; color:#10b981; font-weight:normal;">● متصل</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-header-action btn-pdf-chat" onclick="exportChatToPDF()" title="حفظ المحادثة PDF"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn-header-action btn-delete-chat" onclick="deleteEntireConversation()" title="حذف المحادثة بالكامل"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                
                <div class="messages-area" id="chatMessagesArea">
                    <div class="empty-chat">
                        <i class="far fa-comments fa-4x mb-4" style="color:#cbd5e1;"></i>
                        <p style="font-size:1.1rem;">اختر طالباً للبدء بالمراسلة</p>
                    </div>
                </div>
                
                <div id="attachmentPreviewBox" class="attachment-preview">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="font-size:0.8rem;">مرفق جاهز للإرسال</strong>
                        <i class="fas fa-times" style="color:red; cursor:pointer;" onclick="clearAttachment()"></i>
                    </div>
                    <span id="attachName" style="font-size:0.85rem; color:#555;"></span>
                </div>

                <div id="emojiPopup" class="emoji-popup">
                    ${emojiHtml}
                </div>

                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    <div class="recording-area" id="recordingArea">
                        <div class="recording-timer">
                            <div class="recording-wave"></div>
                            <span id="recordTimer">00:00</span>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-tool" style="background:#dc3545; color:white;" onclick="cancelRecording()" title="إلغاء"><i class="fas fa-times"></i></button>
                            <button class="btn-tool" style="background:#28a745; color:white;" onclick="stopRecording()" title="إرسال"><i class="fas fa-check"></i></button>
                        </div>
                    </div>

                    <button id="emojiBtn" class="btn-tool btn-emoji" onclick="toggleEmojiPopup()" title="رموز"><i class="far fa-smile"></i></button>
                    <label class="btn-tool btn-attach" title="ملف"><i class="fas fa-paperclip"></i><input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)"></label>
                    <label class="btn-tool btn-cam" title="كاميرا"><i class="fas fa-camera"></i><input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)"></label>
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." onkeypress="handleEnter(event)">
                    <button class="btn-tool btn-mic" onclick="startRecording()" title="تسجيل صوتي"><i class="fas fa-microphone"></i></button>
                    <button class="btn-tool" onclick="cancelEdit()" id="cancelEditBtn" style="display:none; background:#ffebee; color:red;" title="إلغاء التعديل"><i class="fas fa-times"></i></button>
                    <button class="btn-send-pill" id="sendBtn" onclick="sendChatMessage()">أرسل <i class="fas fa-paper-plane"></i></button>
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
    const sortedConvos = Object.values(conversations).sort((a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt));
    renderSidebar(sortedConvos);
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList');
    listEl.innerHTML = '';
    if (conversations.length === 0) { listEl.innerHTML = '<div class="text-center p-4 text-muted"><small>لا توجد محادثات نشطة</small></div>'; return; }
    conversations.forEach(convo => {
        const student = getStudentById(convo.studentId);
        const name = student ? student.name : 'طالب';
        const activeClass = activeChatStudentId === convo.studentId ? 'active' : '';
        const unreadHtml = convo.unreadCount > 0 ? `<span class="unread-badge">${convo.unreadCount}</span>` : '';
        const timeStr = new Date(convo.lastMessage.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
        const html = `<div class="chat-item ${activeClass}" onclick="openChat(${convo.studentId})">
            <div class="avatar">${name.charAt(0)}</div>
            <div class="chat-info">
                <div class="chat-name"><span>${name}</span> <span style="font-size:0.7rem; font-weight:normal; color:inherit;">${timeStr}</span></div>
                <div class="chat-preview">${unreadHtml} ${convo.lastMessage.isVoice ? '🎤 تسجيل صوتي' : (convo.lastMessage.attachment ? '📎 مرفق' : convo.lastMessage.content)}</div>
            </div></div>`;
        listEl.innerHTML += html;
    });
}

function openChat(studentId) {
    activeChatStudentId = studentId;
    cancelEdit();
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
    const currentUser = getCurrentUser();
    const chatMsgs = messages.filter(m => m.teacherId === currentUser.id && m.studentId === studentId);
    chatMsgs.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    const area = document.getElementById('chatMessagesArea');
    area.innerHTML = '';
    let needsUpdate = false;
    chatMsgs.forEach(msg => {
        const isMe = !msg.isFromStudent; 
        const bubbleClass = isMe ? 'msg-me' : 'msg-other';
        let contentHtml = msg.content;
        
        // 🔥 إضافة زر التنزيل بجانب المشغل الصوتي 🔥
        if (msg.isVoice) {
            contentHtml = `
            <div style="display:flex; align-items:center; gap:5px;">
                <audio controls src="${msg.content}"></audio>
                <a href="${msg.content}" download="voice_message_${msg.id}.webm" class="btn-tool audio-download-btn" style="width:30px; height:30px; font-size:0.8rem; background:#607d8b; color:white; text-decoration:none;" title="تنزيل">
                    <i class="fas fa-download"></i>
                </a>
            </div>`;
        }

        let attachHtml = '';
        if (msg.attachment) { const isImg = msg.attachment.startsWith('data:image'); attachHtml = `<a href="${msg.attachment}" download="file" class="msg-attachment">${isImg ? `<img src="${msg.attachment}">` : ''} 📎 تحميل</a>`; }
        let menuHtml = '';
        if (isMe) {
            menuHtml = `<div class="msg-options-btn" onclick="toggleMessageMenu(event, ${msg.id})">⋮</div>
            <div class="msg-dropdown" id="msgMenu_${msg.id}">
                ${!msg.isVoice ? `<div class="msg-dropdown-item" onclick="startEditMessage(${msg.id})"><i class="fas fa-pen"></i> تعديل</div>` : ''}
                <div class="msg-dropdown-item delete" onclick="deleteChatMessage(${msg.id})"><i class="fas fa-trash"></i> حذف</div>
            </div>`;
        }
        const html = `<div class="msg-bubble ${bubbleClass}">${menuHtml} ${contentHtml} ${attachHtml} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
        area.innerHTML += html;
        if (msg.isFromStudent && !msg.isRead) { msg.isRead = true; needsUpdate = true; }
    });
    if (needsUpdate) localStorage.setItem('teacherMessages', JSON.stringify(messages));
    area.scrollTop = area.scrollHeight;
}

function exportChatToPDF() {
    if (!activeChatStudentId) return;
    const student = getStudentById(activeChatStudentId);
    const studentName = student ? student.name : 'طالب';
    const element = document.getElementById('chatMessagesArea');
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `محادثة_${studentName}_${new Date().toLocaleDateString()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
        const clone = element.cloneNode(true);
        clone.style.background = 'white';
        clone.style.height = 'auto';
        clone.style.overflow = 'visible';
        clone.style.padding = '20px';
        
        // إزالة أزرار التحكم وأزرار التنزيل من الـ PDF
        clone.querySelectorAll('.msg-options-btn, .msg-dropdown, .audio-download-btn').forEach(el => el.remove());

        // استبدال المشغل الصوتي بنص توثيقي
        clone.querySelectorAll('audio').forEach(audio => {
            const placeholder = document.createElement('div');
            placeholder.innerHTML = '<span style="color:#555; font-size:0.9rem; border:1px solid #ccc; padding:2px 8px; border-radius:10px; background:#f9f9f9;">🎤 رسالة صوتية (ملف مرفق)</span>';
            if(audio.parentNode) audio.parentNode.replaceChild(placeholder, audio);
        });

        html2pdf().set(opt).from(clone).save();
    } else {
        alert("جاري تحميل أداة التصدير...");
    }
}

// ... (بقية الدوال: deleteEntireConversation, startRecording, updateRecordTimer, stopRecording, cancelRecording, sendVoiceMessage, toggleMessageMenu, deleteChatMessage, startEditMessage, cancelEdit, handleChatAttachment, toggleEmojiPopup, addEmoji, clearAttachment, sendChatMessage, handleEnter, getStudentById, showNewMessageModal, loadStudentsForMessaging) ...
// (نفس الكود السابق تماماً)

function deleteEntireConversation() {
    if (!activeChatStudentId) return;
    if (!confirm('هل أنت متأكد من حذف كامل سجل المحادثة؟')) return;
    const currentUser = getCurrentUser();
    let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    teacherMsgs = teacherMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    studentMsgs = studentMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    document.getElementById('chatMessagesArea').innerHTML = '';
    loadConversations();
    loadChatMessages(activeChatStudentId);
}

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert('المتصفح لا يدعم التسجيل'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = function(e) { sendVoiceMessage(e.target.result); };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        document.getElementById('recordingArea').style.display = 'flex';
        recordingStartTime = Date.now();
        recordingInterval = setInterval(updateRecordTimer, 1000);
        updateRecordTimer();
    }).catch(() => alert('تعذر الوصول للمايكروفون'));
}
function updateRecordTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('recordTimer').textContent = `${mins}:${secs}`;
}
function stopRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); clearInterval(recordingInterval); document.getElementById('recordingArea').style.display = 'none'; } }
function cancelRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.onstop = null; mediaRecorder.stop(); clearInterval(recordingInterval); document.getElementById('recordingArea').style.display = 'none'; } }
function sendVoiceMessage(base64Audio) {
    if (!activeChatStudentId) return;
    const currentUser = getCurrentUser();
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    teacherMsgs.push({ id: Date.now(), teacherId: currentUser.id, studentId: activeChatStudentId, content: base64Audio, attachment: null, isVoice: true, sentAt: new Date().toISOString(), isRead: true, isFromStudent: false });
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    studentMsgs.push({ id: Date.now() + 1, studentId: activeChatStudentId, teacherId: currentUser.id, content: base64Audio, attachment: null, isVoice: true, sentAt: new Date().toISOString(), isRead: false, isFromTeacher: true });
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    loadChatMessages(activeChatStudentId);
    loadConversations();
}
function toggleMessageMenu(e, msgId) { e.stopPropagation(); document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); const menu = document.getElementById(`msgMenu_${msgId}`); if (menu) menu.style.display = 'block'; }
function deleteChatMessage(messageId) { if (!confirm('حذف هذه الرسالة؟')) return; let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); teacherMsgs = teacherMsgs.filter(m => m.id !== messageId); localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs)); let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); studentMsgs = studentMsgs.filter(m => m.id !== (messageId + 1)); localStorage.setItem('studentMessages', JSON.stringify(studentMsgs)); loadChatMessages(activeChatStudentId); loadConversations(); }
function startEditMessage(messageId) { const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); const msg = messages.find(m => m.id === messageId); if (!msg || msg.isVoice) return; const input = document.getElementById('chatInput'); input.value = msg.content; input.focus(); input.classList.add('editing'); editingMessageId = messageId; const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'تحديث <i class="fas fa-check"></i>'; sendBtn.classList.add('update-mode'); document.getElementById('cancelEditBtn').style.display = 'block'; }
function cancelEdit() { editingMessageId = null; const input = document.getElementById('chatInput'); input.value = ''; input.classList.remove('editing'); const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'أرسل <i class="fas fa-paper-plane"></i>'; sendBtn.classList.remove('update-mode'); document.getElementById('cancelEditBtn').style.display = 'none'; }
function handleChatAttachment(input) { if (input.files && input.files[0]) { const file = input.files[0]; const reader = new FileReader(); reader.onload = function(e) { attachmentData = e.target.result; document.getElementById('attachName').textContent = file.name; document.getElementById('attachmentPreviewBox').style.display = 'block'; }; reader.readAsDataURL(file); } }
function toggleEmojiPopup() { const popup = document.getElementById('emojiPopup'); if (popup.style.display === 'none') popup.style.display = 'grid'; else popup.style.display = 'none'; }
function addEmoji(char) { const input = document.getElementById('chatInput'); input.value += char; input.focus(); }
function clearAttachment() { attachmentData = null; document.getElementById('attachmentPreviewBox').style.display = 'none'; document.getElementById('chatFileInput').value = ''; document.getElementById('chatCamInput').value = ''; }
function sendChatMessage() {
    const input = document.getElementById('chatInput'); const content = input.value.trim();
    if ((!content && !attachmentData) || !activeChatStudentId) return;
    if (editingMessageId) {
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); const tIndex = teacherMsgs.findIndex(m => m.id === editingMessageId); if (tIndex !== -1) { teacherMsgs[tIndex].content = content; if (attachmentData) teacherMsgs[tIndex].attachment = attachmentData; localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs)); }
        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); const sIndex = studentMsgs.findIndex(m => m.id === (editingMessageId + 1)); if (sIndex !== -1) { studentMsgs[sIndex].content = content; if (attachmentData) studentMsgs[sIndex].attachment = attachmentData; localStorage.setItem('studentMessages', JSON.stringify(studentMsgs)); }
        cancelEdit(); loadChatMessages(activeChatStudentId); loadConversations(); return;
    }
    const currentUser = getCurrentUser();
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); teacherMsgs.push({ id: Date.now(), teacherId: currentUser.id, studentId: activeChatStudentId, content: content || (attachmentData ? '📎 مرفق' : ''), attachment: attachmentData, isVoice: false, sentAt: new Date().toISOString(), isRead: true, isFromStudent: false }); localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); studentMsgs.push({ id: Date.now() + 1, studentId: activeChatStudentId, teacherId: currentUser.id, content: content || (attachmentData ? '📎 مرفق' : ''), attachment: attachmentData, isVoice: false, sentAt: new Date().toISOString(), isRead: false, isFromTeacher: true }); localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    input.value = ''; clearAttachment(); document.getElementById('emojiPopup').style.display = 'none'; loadChatMessages(activeChatStudentId); loadConversations();
}
function handleEnter(e) { if (e.key === 'Enter') sendChatMessage(); }
function getStudentById(id) { let students = JSON.parse(localStorage.getItem('students') || '[]'); let s = students.find(s => s.id == id); if(!s) { const users = JSON.parse(localStorage.getItem('users') || '[]'); s = users.find(u => u.id == id && u.role === 'student'); } return s; }
function showNewMessageModal() { const currentUser = getCurrentUser(); const recipientSelect = document.getElementById('messageRecipient'); if(recipientSelect) { loadStudentsForMessaging(); document.getElementById('newMessageModal').classList.add('show'); } else { alert("يرجى اختيار الطالب من القائمة."); } }
function loadStudentsForMessaging() { const recipientSelect = document.getElementById('messageRecipient'); if(!recipientSelect) return; const currentTeacher = getCurrentUser(); let allStudents = JSON.parse(localStorage.getItem('students') || '[]'); const allUsers = JSON.parse(localStorage.getItem('users') || '[]'); const studentUsers = allUsers.filter(u => u.role === 'student'); const merged = [...allStudents]; studentUsers.forEach(u => { if(!merged.find(s => s.id == u.id)) merged.push(u); }); const myStudents = merged.filter(s => s.teacherId == currentTeacher.id); recipientSelect.innerHTML = '<option value="">اختر الطالب</option>'; myStudents.forEach(s => { recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`; }); }
window.showNewMessageModal = showNewMessageModal; window.sendNewMessage = function() { const sId = document.getElementById('messageRecipient').value; if(sId) { document.getElementById('newMessageModal').classList.remove('show'); openChat(parseInt(sId)); } }; window.closeNewMessageModal = function() { document.getElementById('newMessageModal').classList.remove('show'); };
window.deleteEntireConversation = deleteEntireConversation;
window.exportChatToPDF = exportChatToPDF;

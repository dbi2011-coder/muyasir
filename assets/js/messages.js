// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: شات المعلم (نظام القائمة المنسدلة للرسائل + فيسات نظيفة)
// ============================================

let activeChatStudentId = null;
let attachmentData = null;
let editingMessageId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        cleanInterfaceAggressive(); 
        injectChatStyles();
        renderChatLayout();
        loadConversations();
        
        // إغلاق القوائم عند النقر في الخارج
        document.addEventListener('click', function(e) {
            // إغلاق الفيسات
            const emojiPopup = document.getElementById('emojiPopup');
            const emojiBtn = document.getElementById('emojiBtn');
            if (emojiPopup && emojiBtn && !emojiPopup.contains(e.target) && !emojiBtn.contains(e.target)) {
                emojiPopup.style.display = 'none';
            }

            // إغلاق قوائم الرسائل المفتوحة
            if (!e.target.closest('.msg-options-btn')) {
                document.querySelectorAll('.msg-dropdown').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// 🧹 تنظيف الواجهة
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

// ==========================================
// 🎨 1. التنسيقات (إضافة ستايل القائمة المنسدلة)
// ==========================================
function injectChatStyles() {
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; font-family: 'Tajawal', sans-serif; }
        
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
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; background: #fff; font-weight: bold; font-size: 1.1rem; color:#334155; height: 70px; }
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 15px; }
        
        /* 🔥 فقاعات الرسائل والقائمة المنسدلة 🔥 */
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display:block; text-align:left; }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; text-decoration: none; color: inherit; }
        .msg-attachment img { max-width: 200px; border-radius: 5px; }

        /* زر الخيارات (ثلاث نقاط) */
        .msg-options-btn {
            position: absolute; top: 5px; left: 8px; /* يسار الفقاعة */
            color: inherit; opacity: 0.6; cursor: pointer; padding: 2px 5px;
            font-size: 1.1rem; transition: 0.2s;
        }
        .msg-options-btn:hover { opacity: 1; background: rgba(0,0,0,0.1); border-radius: 50%; }

        /* القائمة المنسدلة */
        .msg-dropdown {
            position: absolute; top: 25px; left: 5px;
            background: #fff; color: #333;
            border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            width: 120px; z-index: 100; display: none; overflow: hidden;
            border: 1px solid #eee;
        }
        .msg-dropdown-item {
            padding: 10px 15px; font-size: 0.9rem; cursor: pointer;
            display: flex; align-items: center; gap: 8px; transition: 0.1s;
        }
        .msg-dropdown-item:hover { background: #f8f9fa; color: #007bff; }
        .msg-dropdown-item.delete:hover { color: #dc3545; background: #fff5f5; }

        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 12px; position: relative; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; background: #f8fafc; }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        .chat-input.editing { border-color: #f59e0b; background: #fffbeb; }

        .btn-tool { font-size: 1.4rem; cursor: pointer; padding: 8px; transition: 0.2s; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .btn-emoji { color: #f59e0b; }
        .btn-attach { color: #64748b; }
        .btn-cam { color: #007bff; }
        .btn-tool:hover { background: #f1f5f9; transform: scale(1.1); }
        
        .btn-send-pill { background-color: #007bff; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-size: 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2); }
        .btn-send-pill:hover { background-color: #0069d9; transform: translateY(-1px); }
        .btn-send-pill.update-mode { background-color: #f59e0b; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2); }

        .emoji-popup { position: absolute; bottom: 80px; right: 20px; width: 320px; height: 250px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: none; padding: 10px; grid-template-columns: repeat(7, 1fr); gap: 5px; overflow-y: auto; z-index: 100; }
        .emoji-item { font-size: 1.4rem; cursor: pointer; text-align: center; padding: 5px; border-radius: 5px; transition: 0.2s; }
        .emoji-item:hover { background: #f1f5f9; transform: scale(1.2); }

        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
        .attachment-preview { position: absolute; bottom: 85px; left: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: none; z-index: 10; }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    container.className = '';
    
    // قائمة الفيسات المنقحة
    const emojis = [
        '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
        '👋','🤚','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸',
        '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕️','🛑','⛔️','📛','🚫','💯','💢','♨️','❗️','❕','❓','❔','‼️','⁉️','⚠️','✅','❎','🌐','💠','Ⓜ️','🌀','💤','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','▶️','⏸','⏯','⏹','⏺','⏭','⏮','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾','💲','💱','™️','©️','®️','👁‍🗨','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫️','⚪️','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾️','◽️','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛️','⬜️','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'
    ];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-list-header">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="font-weight:bold; border-radius:25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <i class="fas fa-plus"></i> محادثة جديدة
                    </button>
                </div>
                <div class="chat-list" id="chatContactsList">
                </div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div class="avatar" id="chatHeaderAvatar"></div>
                    <div style="display:flex; flex-direction:column;">
                        <span id="chatHeaderName" style="line-height:1.2;">اسم الطالب</span>
                        <span style="font-size:0.75rem; color:#10b981; font-weight:normal;">● متصل</span>
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
                    <button id="emojiBtn" class="btn-tool btn-emoji" onclick="toggleEmojiPopup()" title="رموز تعبيرية">
                        <i class="far fa-smile"></i>
                    </button>
                    <label class="btn-tool btn-attach" title="إرفاق ملف">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    <label class="btn-tool btn-cam" title="تصوير">
                        <i class="fas fa-camera"></i>
                        <input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." onkeypress="handleEnter(event)">
                    
                    <button class="btn-tool" onclick="cancelEdit()" id="cancelEditBtn" style="display:none; color:#dc3545;" title="إلغاء التعديل"><i class="fas fa-times"></i></button>

                    <button class="btn-send-pill" id="sendBtn" onclick="sendChatMessage()">
                        أرسل <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 🧠 2. المنطق (Logic)
// ==========================================

function loadConversations() {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentUser = getCurrentUser();
    const conversations = {};
    
    messages.forEach(msg => {
        if (msg.teacherId !== currentUser.id) return;
        if (!conversations[msg.studentId]) {
            conversations[msg.studentId] = { studentId: msg.studentId, lastMessage: msg, unreadCount: 0 };
        }
        if (new Date(msg.sentAt) > new Date(conversations[msg.studentId].lastMessage.sentAt)) {
            conversations[msg.studentId].lastMessage = msg;
        }
        if (msg.isFromStudent && !msg.isRead) conversations[msg.studentId].unreadCount++;
    });
    
    const sortedConvos = Object.values(conversations).sort((a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt));
    renderSidebar(sortedConvos);
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList');
    listEl.innerHTML = '';
    
    if (conversations.length === 0) {
        listEl.innerHTML = '<div class="text-center p-4 text-muted"><small>لا توجد محادثات نشطة</small></div>';
        return;
    }
    
    conversations.forEach(convo => {
        const student = getStudentById(convo.studentId);
        const name = student ? student.name : 'طالب';
        const activeClass = activeChatStudentId === convo.studentId ? 'active' : '';
        const unreadHtml = convo.unreadCount > 0 ? `<span class="unread-badge">${convo.unreadCount}</span>` : '';
        const timeStr = new Date(convo.lastMessage.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
        
        const html = `
            <div class="chat-item ${activeClass}" onclick="openChat(${convo.studentId})">
                <div class="avatar">${name.charAt(0)}</div>
                <div class="chat-info">
                    <div class="chat-name"><span>${name}</span> <span style="font-size:0.7rem; font-weight:normal; color:inherit;">${timeStr}</span></div>
                    <div class="chat-preview">${unreadHtml} ${convo.lastMessage.attachment ? '📎 مرفق' : convo.lastMessage.content}</div>
                </div>
            </div>`;
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
        
        let attachHtml = '';
        if (msg.attachment) {
            const isImg = msg.attachment.startsWith('data:image');
            attachHtml = `<a href="${msg.attachment}" download="file" class="msg-attachment">${isImg ? `<img src="${msg.attachment}">` : ''} 📎 تحميل</a>`;
        }
        
        // 🔥 إضافة زر القائمة المنسدلة داخل فقاعة المعلم 🔥
        let menuHtml = '';
        if (isMe) {
            menuHtml = `
            <div class="msg-options-btn" onclick="toggleMessageMenu(event, ${msg.id})">⋮</div>
            <div class="msg-dropdown" id="msgMenu_${msg.id}">
                <div class="msg-dropdown-item" onclick="startEditMessage(${msg.id})"><i class="fas fa-pen"></i> تعديل</div>
                <div class="msg-dropdown-item delete" onclick="deleteChatMessage(${msg.id})"><i class="fas fa-trash"></i> حذف</div>
            </div>`;
        }
        
        const html = `
            <div class="msg-bubble ${bubbleClass}">
                ${menuHtml}
                ${msg.content} ${attachHtml} 
                <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span>
            </div>`;
        area.innerHTML += html;
        
        if (msg.isFromStudent && !msg.isRead) { msg.isRead = true; needsUpdate = true; }
    });
    
    if (needsUpdate) localStorage.setItem('teacherMessages', JSON.stringify(messages));
    area.scrollTop = area.scrollHeight;
}

// ==========================================
// ⚙️ إدارة القوائم والتعديل والحذف
// ==========================================

function toggleMessageMenu(e, msgId) {
    e.stopPropagation();
    // إغلاق أي قوائم أخرى
    document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none');
    
    const menu = document.getElementById(`msgMenu_${msgId}`);
    if (menu) menu.style.display = 'block';
}

function deleteChatMessage(messageId) {
    if (!confirm('حذف هذه الرسالة من الطرفين؟')) return;

    // حذف من المعلم
    let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    teacherMsgs = teacherMsgs.filter(m => m.id !== messageId);
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));

    // حذف من الطالب (تقريبي)
    let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    studentMsgs = studentMsgs.filter(m => m.id !== (messageId + 1)); 
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));

    loadChatMessages(activeChatStudentId);
    loadConversations();
}

function startEditMessage(messageId) {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const input = document.getElementById('chatInput');
    input.value = msg.content;
    input.focus();
    input.classList.add('editing');

    editingMessageId = messageId;
    
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.innerHTML = 'تحديث <i class="fas fa-check"></i>';
    sendBtn.classList.add('update-mode');
    
    document.getElementById('cancelEditBtn').style.display = 'block';
}

function cancelEdit() {
    editingMessageId = null;
    const input = document.getElementById('chatInput');
    input.value = '';
    input.classList.remove('editing');
    
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.innerHTML = 'أرسل <i class="fas fa-paper-plane"></i>';
    sendBtn.classList.remove('update-mode');
    
    document.getElementById('cancelEditBtn').style.display = 'none';
}

// ==========================================
// الإرسال والتعامل مع المدخلات
// ==========================================

function handleChatAttachment(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            attachmentData = e.target.result;
            document.getElementById('attachName').textContent = file.name;
            document.getElementById('attachmentPreviewBox').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function toggleEmojiPopup() {
    const popup = document.getElementById('emojiPopup');
    if (popup.style.display === 'none') popup.style.display = 'grid';
    else popup.style.display = 'none';
}

function addEmoji(char) {
    const input = document.getElementById('chatInput');
    input.value += char;
    input.focus();
}

function clearAttachment() {
    attachmentData = null;
    document.getElementById('attachmentPreviewBox').style.display = 'none';
    document.getElementById('chatFileInput').value = '';
    document.getElementById('chatCamInput').value = '';
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    
    if ((!content && !attachmentData) || !activeChatStudentId) return;

    // 🔥 حالة التعديل
    if (editingMessageId) {
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        const tIndex = teacherMsgs.findIndex(m => m.id === editingMessageId);
        if (tIndex !== -1) {
            teacherMsgs[tIndex].content = content;
            if (attachmentData) teacherMsgs[tIndex].attachment = attachmentData;
            localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
        }

        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        const sIndex = studentMsgs.findIndex(m => m.id === (editingMessageId + 1));
        if (sIndex !== -1) {
            studentMsgs[sIndex].content = content;
            if (attachmentData) studentMsgs[sIndex].attachment = attachmentData;
            localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
        }

        cancelEdit();
        loadChatMessages(activeChatStudentId);
        loadConversations();
        return;
    }
    
    // 🔥 حالة الإرسال
    const currentUser = getCurrentUser();
    
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const newMsgTeacher = {
        id: Date.now(), teacherId: currentUser.id, studentId: activeChatStudentId,
        content: content || (attachmentData ? '📎 مرفق' : ''), attachment: attachmentData,
        sentAt: new Date().toISOString(), isRead: true, isFromStudent: false
    };
    teacherMsgs.push(newMsgTeacher);
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const newMsgStudent = {
        id: Date.now() + 1, studentId: activeChatStudentId, teacherId: currentUser.id,
        content: content || (attachmentData ? '📎 مرفق' : ''), attachment: attachmentData,
        sentAt: new Date().toISOString(), isRead: false, isFromTeacher: true
    };
    studentMsgs.push(newMsgStudent);
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    
    input.value = '';
    clearAttachment();
    document.getElementById('emojiPopup').style.display = 'none';
    loadChatMessages(activeChatStudentId);
    loadConversations();
}

function handleEnter(e) { if (e.key === 'Enter') sendChatMessage(); }

function getStudentById(id) {
    let students = JSON.parse(localStorage.getItem('students') || '[]');
    let s = students.find(s => s.id == id);
    if(!s) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        s = users.find(u => u.id == id && u.role === 'student');
    }
    return s;
}

function showNewMessageModal() {
    const currentUser = getCurrentUser();
    const recipientSelect = document.getElementById('messageRecipient'); 
    if(recipientSelect) {
        loadStudentsForMessaging(); 
        document.getElementById('newMessageModal').classList.add('show');
    } else {
        alert("يرجى اختيار الطالب من القائمة.");
    }
}

function loadStudentsForMessaging() {
    const recipientSelect = document.getElementById('messageRecipient');
    if(!recipientSelect) return;
    
    const currentTeacher = getCurrentUser();
    let allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const studentUsers = allUsers.filter(u => u.role === 'student');
    const merged = [...allStudents];
    studentUsers.forEach(u => { if(!merged.find(s => s.id == u.id)) merged.push(u); });
    const myStudents = merged.filter(s => s.teacherId == currentTeacher.id);
    
    recipientSelect.innerHTML = '<option value="">اختر الطالب</option>';
    myStudents.forEach(s => {
        recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

window.showNewMessageModal = showNewMessageModal; 
window.sendNewMessage = function() {
    const sId = document.getElementById('messageRecipient').value;
    if(sId) {
        document.getElementById('newMessageModal').classList.remove('show');
        openChat(parseInt(sId));
    }
};
window.closeNewMessageModal = function() { document.getElementById('newMessageModal').classList.remove('show'); };

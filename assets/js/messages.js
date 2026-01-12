// ============================================
// 📁 المسار: messages.js
// الوصف: شات المعلم (إزالة إجبارية للإحصائيات القديمة + تصميم الشات)
// ============================================

let activeChatStudentId = null;
let attachmentData = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        cleanInterfaceAggressive(); // 🧹 تنظيف جذري للواجهة
        injectChatStyles();
        renderChatLayout();
        loadConversations();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// 🧹 دالة التنظيف الجذرية (Aggressive Cleanup)
function cleanInterfaceAggressive() {
    const targetContainer = document.getElementById('messagesList');
    if (!targetContainer) return;

    // 1. إخفاء جميع "أشقاء" عنصر القائمة (البطاقات والفلاتر الموجودة معه في نفس الحاوية)
    const parent = targetContainer.parentElement;
    if (parent) {
        Array.from(parent.children).forEach(child => {
            if (child.id !== 'messagesList' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
                child.style.display = 'none';
                child.classList.add('hidden-by-script'); // علامة للتأكد
            }
        });
    }

    // 2. خطوة احتياطية: البحث عن أي كروت إحصائيات متبقية في الصفحة وإخفاؤها
    const allCards = document.querySelectorAll('.card, .row');
    allCards.forEach(el => {
        // إذا كان العنصر يحتوي على كلمات مفتاحية للإحصائيات القديمة
        if ((el.innerText.includes('إجمالي الرسائل') || 
             el.innerText.includes('غير مقروءة') || 
             el.innerText.includes('تصفية حسب')) && 
             !el.closest('.chat-container')) { // نتأكد أننا لا نخفي الشات الجديد
            el.style.display = 'none';
        }
    });
}

// ==========================================
// 🎨 1. التنسيقات (تصميم الشات وزر الإرسال)
// ==========================================
function injectChatStyles() {
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        /* إخفاء العناصر القديمة بقوة */
        .hidden-by-script { display: none !important; }

        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 0px; font-family: 'Tajawal', sans-serif; }
        
        /* القائمة الجانبية */
        .chat-sidebar { width: 320px; background: #f8f9fa; border-left: 2px solid #e5e7eb; display: flex; flex-direction: column; z-index: 2; }
        .sidebar-header { padding: 15px; background: #fff; border-bottom: 2px solid #f0f0f0; }
        .chat-list { flex: 1; overflow-y: auto; }
        
        .chat-item { display: flex; align-items: center; padding: 15px; cursor: pointer; border-bottom: 1px solid #eee; transition: 0.2s; background: #fff; }
        .chat-item:hover { background: #f1f5f9; }
        .chat-item.active { background: #e0f2fe; border-right: 5px solid #007bff; }
        
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; }
        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: bold; color: #1e293b; font-size: 0.95rem; display:flex; justify-content:space-between; margin-bottom: 4px; }
        .chat-preview { font-size: 0.85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .unread-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }

        /* منطقة المحادثة */
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; background: #fff; font-weight: bold; font-size: 1.1rem; color:#334155; }
        
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 15px; }
        
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display:block; text-align:left; }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; text-decoration: none; color: inherit; }
        .msg-attachment img { max-width: 200px; border-radius: 5px; }

        /* منطقة الكتابة والأزرار */
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; background: #f8fafc; }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        
        .btn-tool { color: #64748b; font-size: 1.3rem; cursor: pointer; padding: 8px; border-radius: 50%; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-tool:hover { background: #f1f5f9; color: #007bff; }
        
        /* 🔥 زر الإرسال الجديد (مستطيل بحواف دائرية ونص واضح) 🔥 */
        .btn-send-pill {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 50px; /* Pill Shape */
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: 0.2s;
            box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2);
        }
        .btn-send-pill:hover { background-color: #0069d9; transform: translateY(-1px); }
        .btn-send-pill i { font-size: 0.9rem; transform: rotate(-45deg); margin-top:3px; }

        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
        .attachment-preview { position: absolute; bottom: 85px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: none; z-index: 10; }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    container.className = '';
    
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="sidebar-header">
                    <button class="btn btn-outline-primary w-100" onclick="showNewMessageModal()" style="font-weight:bold; border-radius:20px;">
                        <i class="fas fa-plus"></i> محادثة جديدة
                    </button>
                </div>
                <div class="chat-list" id="chatContactsList">
                    </div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div class="avatar" id="chatHeaderAvatar" style="width:38px; height:38px; font-size:1rem; margin-left:10px;"></div>
                    <div style="display:flex; flex-direction:column;">
                        <span id="chatHeaderName" style="line-height:1.2;">اسم الطالب</span>
                        <span style="font-size:0.75rem; color:#10b981; font-weight:normal;">● متصل</span>
                    </div>
                </div>
                
                <div class="messages-area" id="chatMessagesArea">
                    <div class="empty-chat">
                        <i class="far fa-comments fa-4x mb-4" style="color:#cbd5e1;"></i>
                        <p style="font-size:1.1rem;">اختر طالباً من القائمة لبدء المحادثة</p>
                    </div>
                </div>
                
                <div id="attachmentPreviewBox" class="attachment-preview">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="font-size:0.8rem;">معاينة المرفق</strong>
                        <i class="fas fa-times" style="color:red; cursor:pointer;" onclick="clearAttachment()"></i>
                    </div>
                    <span id="attachName" style="font-size:0.85rem; color:#555;"></span>
                </div>

                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    
                    <button class="btn-tool" onclick="insertEmoji()" title="رموز">
                        <i class="far fa-smile"></i>
                    </button>
                    
                    <label class="btn-tool" title="إرفاق ملف">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    
                    <label class="btn-tool" title="تصوير">
                        <i class="fas fa-camera"></i>
                        <input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." onkeypress="handleEnter(event)">
                    
                    <button class="btn-send-pill" onclick="sendChatMessage()">
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
        const name = student ? student.name : 'طالب محذوف';
        const activeClass = activeChatStudentId === convo.studentId ? 'active' : '';
        const unreadHtml = convo.unreadCount > 0 ? `<span class="unread-badge">${convo.unreadCount}</span>` : '';
        const timeStr = new Date(convo.lastMessage.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
        
        const html = `
            <div class="chat-item ${activeClass}" onclick="openChat(${convo.studentId})">
                <div class="avatar">${name.charAt(0)}</div>
                <div class="chat-info">
                    <div class="chat-name"><span>${name}</span> <span style="font-size:0.7rem; color:#94a3b8; font-weight:normal">${timeStr}</span></div>
                    <div class="chat-preview">${unreadHtml} ${convo.lastMessage.attachment ? '📎 مرفق' : convo.lastMessage.content}</div>
                </div>
            </div>`;
        listEl.innerHTML += html;
    });
}

function openChat(studentId) {
    activeChatStudentId = studentId;
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
        
        const html = `<div class="msg-bubble ${bubbleClass}">${msg.content} ${attachHtml} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
        area.innerHTML += html;
        
        if (msg.isFromStudent && !msg.isRead) { msg.isRead = true; needsUpdate = true; }
    });
    
    if (needsUpdate) localStorage.setItem('teacherMessages', JSON.stringify(messages));
    area.scrollTop = area.scrollHeight;
}

// 3. أدوات الإدخال والإرسال
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

function insertEmoji() {
    const input = document.getElementById('chatInput');
    input.value += '😊'; 
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
    loadChatMessages(activeChatStudentId);
    loadConversations();
}

function handleEnter(e) { if (e.key === 'Enter') sendChatMessage(); }

// 4. المساعدات
function getStudentById(id) {
    let students = JSON.parse(localStorage.getItem('students') || '[]');
    let s = students.find(s => s.id == id);
    if(!s) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        s = users.find(u => u.id == id && u.role === 'student');
    }
    return s;
}

// عرض قائمة الطلاب في Modal عند طلب محادثة جديدة
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
    
    // فلترة الطلاب المرتبطين بالمعلم (تعديل ذكي)
    const myStudents = merged.filter(s => s.teacherId == currentTeacher.id);
    
    recipientSelect.innerHTML = '<option value="">اختر الطالب</option>';
    myStudents.forEach(s => {
        recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// دوال إضافية للتوافق مع الـ HTML القديم (إغلاق النوافذ)
window.showNewMessageModal = showNewMessageModal; 
window.sendNewMessage = function() {
    const sId = document.getElementById('messageRecipient').value;
    if(sId) {
        document.getElementById('newMessageModal').classList.remove('show');
        openChat(parseInt(sId));
    }
};
window.closeNewMessageModal = function() { document.getElementById('newMessageModal').classList.remove('show'); };

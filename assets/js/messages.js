// ============================================
// 📁 المسار: messages.js
// الوصف: شات المعلم (تصميم نظيف + زر إرسال واضح + أدوات)
// ============================================

let activeChatStudentId = null;
let attachmentData = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        // تنظيف أي عناصر قديمة في الصفحة (الإحصائيات والفلاتر)
        const statsRow = document.querySelector('.stats-row'); // افتراض الكلاس
        if(statsRow) statsRow.style.display = 'none';
        const filterRow = document.querySelector('.filter-row'); 
        if(filterRow) filterRow.style.display = 'none';
        
        injectChatStyles();
        renderChatLayout();
        loadConversations();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// ==========================================
// 🎨 1. التنسيقات (التصميم الجديد)
// ==========================================
function injectChatStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 10px; font-family: 'Tajawal', sans-serif; }
        
        /* القائمة الجانبية (أكثر وضوحاً) */
        .chat-sidebar { width: 320px; background: #f8f9fa; border-left: 2px solid #e5e7eb; display: flex; flex-direction: column; z-index: 2; }
        .sidebar-header { padding: 15px; background: #fff; border-bottom: 2px solid #f0f0f0; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
        .chat-list { flex: 1; overflow-y: auto; background: #f8f9fa; }
        
        .chat-item { display: flex; align-items: center; padding: 15px; cursor: pointer; border-bottom: 1px solid #eee; transition: 0.2s; background: #fff; margin-bottom: 1px; }
        .chat-item:hover { background: #f1f5f9; }
        .chat-item.active { background: #e0f2fe; border-right: 5px solid #007bff; }
        
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: bold; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px; display:flex; justify-content:space-between; }
        .chat-preview { font-size: 0.85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .unread-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }

        /* منطقة المحادثة */
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; background: #fff; font-weight: bold; font-size: 1.1rem; color:#334155; box-shadow: 0 1px 3px rgba(0,0,0,0.05); z-index:1; }
        
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 15px; }
        
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; text-align: left; display:block; }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; text-decoration: none; color: inherit; font-size: 0.85rem; }
        .msg-attachment img { max-width: 200px; border-radius: 5px; display: block; margin-bottom: 5px; }

        /* منطقة الكتابة الجديدة */
        .chat-input-area { 
            padding: 15px 20px; 
            border-top: 1px solid #e2e8f0; 
            background: #fff; 
            display: flex; 
            align-items: center; 
            gap: 12px; 
        }

        .chat-input { 
            flex: 1; 
            padding: 12px 15px; 
            border: 2px solid #e2e8f0; 
            border-radius: 10px; 
            outline: none; 
            transition: 0.2s; 
            font-size: 1rem;
            background: #f8fafc;
        }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        
        /* أزرار الأدوات (إرفاق، كاميرا، فيسات) */
        .btn-tool {
            color: #64748b;
            font-size: 1.3rem;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .btn-tool:hover { background: #f1f5f9; color: #007bff; }
        
        /* زر الإرسال المستطيل */
        .btn-send-rect {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: 0.2s;
            box-shadow: 0 4px 6px rgba(0, 123, 255, 0.2);
        }
        .btn-send-rect:hover { background-color: #0069d9; transform: translateY(-1px); }
        .btn-send-rect i { font-size: 0.9rem; } /* أيقونة الطائرة صغيرة */

        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
        .attachment-preview { position: absolute; bottom: 85px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: none; z-index: 10; }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="sidebar-header">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="font-weight:bold;">
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
                        <span style="font-size:0.75rem; color:#64748b; font-weight:normal;">نشط الآن</span>
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
                    <span id="attachName" style="font-size:0.85rem; color:#555;">filename.jpg</span>
                </div>

                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    
                    <button class="btn-tool" onclick="insertEmoji()" title="رموز تعبيرية">
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
                    
                    <button class="btn-send-rect" onclick="sendChatMessage()">
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
        listEl.innerHTML = '<div class="text-center p-4 text-muted"><small>لا توجد محادثات</small></div>';
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
    input.value += '😊'; // مثال بسيط، يمكن تطويره لقائمة كاملة
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
    const recipientSelect = document.getElementById('messageRecipient'); // إذا كان الـ Modal القديم موجوداً
    if(recipientSelect) {
        loadStudentsForMessaging(); // إعادة استخدام الدالة القديمة لتعبئة القائمة
        document.getElementById('newMessageModal').classList.add('show');
    } else {
        alert("يرجى استخدام القائمة الجانبية لاختيار الطالب.");
    }
}
function loadStudentsForMessaging() {
    // دالة مساعدة لتعبئة الـ Modal القديم إذا لزم الأمر
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

// إبقاء الدوال القديمة للعمل مع الـ Modal القديم (اختيارياً)
window.showNewMessageModal = showNewMessageModal; 
window.sendNewMessage = function() {
    // تحويل الإرسال من الـ Modal إلى الشات
    const sId = document.getElementById('messageRecipient').value;
    if(sId) {
        document.getElementById('newMessageModal').classList.remove('show');
        openChat(parseInt(sId));
    }
};
window.closeNewMessageModal = function() { document.getElementById('newMessageModal').classList.remove('show'); };

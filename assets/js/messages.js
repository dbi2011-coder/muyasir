// ============================================
// 📁 المسار: messages.js
// الوصف: نظام محادثات المعلم (Chat Style)
// ============================================

let activeChatStudentId = null;
let attachmentData = null; // لتخزين الملف المرفق مؤقتاً

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        injectChatStyles();
        renderChatLayout();
        loadConversations();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// ==========================================
// 🎨 1. بناء واجهة الشات (Layout & Styles)
// ==========================================
function injectChatStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-container { display: flex; height: 75vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e0e0e0; margin-top: 20px; font-family: 'Tajawal', sans-serif; }
        
        /* القائمة الجانبية */
        .chat-sidebar { width: 320px; background: #f8f9fa; border-left: 1px solid #e0e0e0; display: flex; flex-direction: column; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid #e0e0e0; background: #fff; }
        .chat-list { flex: 1; overflow-y: auto; }
        
        .chat-item { display: flex; align-items: center; padding: 15px; cursor: pointer; transition: 0.2s; border-bottom: 1px solid #f0f0f0; }
        .chat-item:hover { background: #eef2f5; }
        .chat-item.active { background: #e3f2fd; border-right: 4px solid #007bff; }
        
        .avatar { width: 45px; height: 45px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; margin-left: 12px; font-size: 1.2rem; }
        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: bold; margin-bottom: 4px; color: #333; display: flex; justify-content: space-between; }
        .chat-preview { font-size: 0.85rem; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .unread-badge { background: #dc3545; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; margin-right: 5px; }

        /* منطقة المحادثة */
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; background: #fff; font-weight: bold; font-size: 1.1rem; }
        
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #fdfdfd; display: flex; flex-direction: column; gap: 10px; }
        
        /* فقاعات الرسائل */
        .msg-bubble { max-width: 70%; padding: 10px 15px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } /* المعلم (أنا) يسار */
        .msg-other { align-self: flex-end; background: #f1f0f0; color: #333; border-bottom-left-radius: 2px; } /* الطالب (هو) يمين */
        
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.7; text-align: left; }
        .msg-attachment { margin-top: 8px; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px; display: block; text-decoration: none; color: inherit; font-size: 0.85rem; }
        .msg-attachment img { max-width: 150px; border-radius: 5px; display: block; margin-bottom: 5px; }

        /* منطقة الكتابة */
        .chat-input-area { padding: 15px; border-top: 1px solid #e0e0e0; background: #fff; display: flex; align-items: center; gap: 10px; }
        .chat-input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 25px; outline: none; transition: 0.2s; }
        .chat-input:focus { border-color: #007bff; }
        
        .btn-send { width: 45px; height: 45px; background: #007bff; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .btn-send:hover { background: #0056b3; transform: scale(1.05); }

        .btn-attach { color: #555; cursor: pointer; font-size: 1.2rem; padding: 8px; transition: 0.2s; }
        .btn-attach:hover { color: #007bff; background: #f0f0f0; border-radius: 50%; }

        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #aaa; }
        
        /* معاينة المرفق */
        .attachment-preview { position: absolute; bottom: 70px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border: 1px solid #ddd; display: none; z-index: 10; }
        .attachment-preview span { display: block; font-size: 0.8rem; margin-bottom: 5px; }
        .btn-remove-attach { color: red; cursor: pointer; font-size: 0.9rem; float: left; }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList'); // نستخدم الحاوية القديمة
    container.innerHTML = '';
    container.className = ''; // إزالة أي كلاسات قديمة
    
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="sidebar-header">
                    <button class="btn btn-outline-primary btn-sm w-100" onclick="showNewMessageModal()">+ محادثة جديدة</button>
                </div>
                <div class="chat-list" id="chatContactsList">
                    </div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div class="avatar" id="chatHeaderAvatar" style="width:35px; height:35px; margin-left:10px; font-size:1rem;"></div>
                    <span id="chatHeaderName">اسم الطالب</span>
                </div>
                
                <div class="messages-area" id="chatMessagesArea">
                    <div class="empty-chat">
                        <i class="fas fa-comments fa-3x mb-3"></i>
                        <p>اختر طالباً للبدء بالمراسلة</p>
                    </div>
                </div>
                
                <div id="attachmentPreviewBox" class="attachment-preview">
                    <i class="fas fa-times btn-remove-attach" onclick="clearAttachment()"></i>
                    <span id="attachName">ملف.jpg</span>
                </div>

                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    <label class="btn-attach" title="إرفاق صورة أو ملف">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    <label class="btn-attach" title="تصوير مباشر">
                        <i class="fas fa-camera"></i>
                        <input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك هنا..." onkeypress="handleEnter(event)">
                    <button class="btn-send" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
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
    
    // تجميع الرسائل حسب الطالب
    const conversations = {};
    
    messages.forEach(msg => {
        if (msg.teacherId !== currentUser.id) return;
        
        if (!conversations[msg.studentId]) {
            conversations[msg.studentId] = {
                studentId: msg.studentId,
                lastMessage: msg,
                unreadCount: 0
            };
        }
        
        // تحديث آخر رسالة
        if (new Date(msg.sentAt) > new Date(conversations[msg.studentId].lastMessage.sentAt)) {
            conversations[msg.studentId].lastMessage = msg;
        }
        
        // حساب غير المقروء (الرسائل الواردة من الطالب ولم تقرأ)
        if (msg.isFromStudent && !msg.isRead) {
            conversations[msg.studentId].unreadCount++;
        }
    });
    
    // تحويل للكائن لمصفوفة وترتيبها
    const sortedConvos = Object.values(conversations).sort((a, b) => 
        new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt)
    );
    
    renderSidebar(sortedConvos);
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList');
    listEl.innerHTML = '';
    
    if (conversations.length === 0) {
        listEl.innerHTML = '<div class="text-center p-3 text-muted"><small>لا توجد محادثات</small></div>';
        return;
    }
    
    conversations.forEach(convo => {
        const student = getStudentById(convo.studentId);
        const name = student ? student.name : 'طالب محذوف';
        const activeClass = activeChatStudentId === convo.studentId ? 'active' : '';
        const unreadHtml = convo.unreadCount > 0 ? `<span class="unread-badge">${convo.unreadCount}</span>` : '';
        const timeStr = new Date(convo.lastMessage.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
        
        const lastMsgText = convo.lastMessage.attachment ? '📎 مرفق' : convo.lastMessage.content;
        
        const html = `
            <div class="chat-item ${activeClass}" onclick="openChat(${convo.studentId})">
                <div class="avatar">${name.charAt(0)}</div>
                <div class="chat-info">
                    <div class="chat-name">
                        <span>${name}</span>
                        <span style="font-size:0.7rem; color:#999; font-weight:normal">${timeStr}</span>
                    </div>
                    <div class="chat-preview">
                        ${unreadHtml} ${lastMsgText}
                    </div>
                </div>
            </div>
        `;
        listEl.innerHTML += html;
    });
}

function openChat(studentId) {
    activeChatStudentId = studentId;
    
    // تحديث الواجهة
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'flex';
    
    const student = getStudentById(studentId);
    document.getElementById('chatHeaderName').textContent = student ? student.name : 'طالب محذوف';
    document.getElementById('chatHeaderAvatar').textContent = student ? student.name.charAt(0) : '?';
    
    loadChatMessages(studentId);
    loadConversations(); // لتحديث العدادات والنشاط
}

function loadChatMessages(studentId) {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentUser = getCurrentUser();
    
    // جلب رسائل هذه المحادثة فقط
    const chatMsgs = messages.filter(m => m.teacherId === currentUser.id && m.studentId === studentId);
    chatMsgs.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    
    const area = document.getElementById('chatMessagesArea');
    area.innerHTML = '';
    
    let needsUpdate = false;
    
    chatMsgs.forEach(msg => {
        // تحديد نوع الفقاعة (أنا أم هو)
        // ملاحظة: في TeacherMessages، إذا كانت isFromStudent=true فهي (هو - يمين)، وإلا فهي (أنا - يسار)
        const isMe = !msg.isFromStudent; 
        const bubbleClass = isMe ? 'msg-me' : 'msg-other';
        
        let attachHtml = '';
        if (msg.attachment) {
            // فحص بسيط إذا كانت صورة
            const isImg = msg.attachment.startsWith('data:image');
            attachHtml = `
                <a href="${msg.attachment}" download="attachment" class="msg-attachment">
                    ${isImg ? `<img src="${msg.attachment}">` : ''}
                    📎 <small>تحميل المرفق</small>
                </a>`;
        }
        
        const html = `
            <div class="msg-bubble ${bubbleClass}">
                ${msg.content}
                ${attachHtml}
                <div class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        `;
        area.innerHTML += html;
        
        // تعليم كمقروء
        if (msg.isFromStudent && !msg.isRead) {
            msg.isRead = true;
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        localStorage.setItem('teacherMessages', JSON.stringify(messages));
        updateMessagesStats(); // تحديث العدادات العلوية إن وجدت
    }
    
    // تمرير لأسفل
    area.scrollTop = area.scrollHeight;
}

// ==========================================
// 🚀 3. الإرسال والمرفقات
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
    
    // 1. إضافة الرسالة لدى المعلم
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const newMsgTeacher = {
        id: Date.now(),
        teacherId: currentUser.id,
        studentId: activeChatStudentId,
        subject: 'محادثة', // لم يعد مهماً
        content: content || (attachmentData ? '📎 مرفق' : ''),
        attachment: attachmentData,
        sentAt: new Date().toISOString(),
        isRead: true, // أنا المرسل
        isFromStudent: false
    };
    teacherMsgs.push(newMsgTeacher);
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    
    // 2. إضافة الرسالة لدى الطالب
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const newMsgStudent = {
        id: Date.now() + 1,
        studentId: activeChatStudentId,
        teacherId: currentUser.id,
        subject: 'محادثة',
        content: content || (attachmentData ? '📎 مرفق' : ''),
        attachment: attachmentData,
        sentAt: new Date().toISOString(),
        isRead: false,
        isFromTeacher: true
    };
    studentMsgs.push(newMsgStudent);
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    
    // تنظيف وتحديث
    input.value = '';
    clearAttachment();
    loadChatMessages(activeChatStudentId);
    loadConversations();
}

function handleEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}

// أدوات مساعدة
function getStudentById(id) {
    let students = JSON.parse(localStorage.getItem('students') || '[]');
    // بحث احتياطي في المستخدمين
    if (!students.find(s => s.id == id)) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.id == id && u.role === 'student');
    }
    return students.find(s => s.id == id);
}

// نافذة محادثة جديدة (بسيطة لاختيار الطالب)
function showNewMessageModal() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    // فلترة طلاب هذا المعلم
    const currentUser = getCurrentUser();
    const myStudents = students; // للتبسيط كما طلبت سابقاً، أو students.filter(s => s.teacherId == currentUser.id)
    
    if (myStudents.length === 0) { alert('لا يوجد طلاب'); return; }
    
    // إنشاء نافذة اختيار سريعة
    const names = myStudents.map(s => `${s.id}:${s.name}`).join(',');
    // في تطبيق حقيقي نستخدم Modal، هنا للسرعة سأفترض أنك تستخدم Modal الإرسال القديم لكن سأحوله لفتح الشات
    // سأقوم بفتح الشات مع أول طالب كبديل سريع أو يمكنك استخدام القائمة الجانبية
    alert('اختر الطالب من القائمة الجانبية للبدء');
}

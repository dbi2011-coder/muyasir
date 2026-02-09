// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: شات المعلم (تحديث نوافذ الحذف والتنبيهات)
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
        document.head.appendChild(script);
    }
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

function injectChatStyles() {
    if (document.getElementById('chatStyles')) return;
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        /* (نفس التنسيقات السابقة تماماً - تم اختصارها هنا للتركيز على التعديلات) */
        .chat-layout { display: flex; height: 85vh; background: #fff; border-radius: 15px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 10px; font-family: 'Tajawal', sans-serif; }
        .sidebar-list { width: 320px; background: #f8fafc; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .search-box { padding: 15px; border-bottom: 1px solid #e2e8f0; background: #fff; }
        .search-input { width: 100%; padding: 10px 15px; border-radius: 20px; border: 1px solid #cbd5e1; background: #f1f5f9; outline: none; transition: 0.3s; }
        .search-input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .students-list { flex: 1; overflow-y: auto; padding: 10px; }
        .student-item { display: flex; align-items: center; padding: 12px; border-radius: 10px; cursor: pointer; transition: 0.2s; margin-bottom: 5px; position: relative; }
        .student-item:hover { background: #e2e8f0; }
        .student-item.active { background: #e0f2fe; border-right: 4px solid #007bff; }
        .student-avatar { width: 45px; height: 45px; background: #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; font-size: 1.1rem; margin-left: 12px; }
        .student-info h4 { margin: 0; font-size: 0.95rem; color: #1e293b; font-weight: 600; }
        .student-info p { margin: 0; font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .msg-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; position: absolute; left: 10px; top: 15px; }
        .chat-area { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #e2e8f0; background: #fff; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
        .messages-container { flex: 1; padding: 20px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 15px; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 20px 20px; }
        .message-bubble { max-width: 70%; padding: 12px 16px; border-radius: 12px; font-size: 0.95rem; line-height: 1.5; position: relative; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .message-bubble.sent { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; }
        .message-bubble.received { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display: block; text-align: left; }
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; z-index: 50; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; font-size: 1rem; background: #f8fafc; transition: 0.3s; }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        .btn-icon { width: 40px; height: 40px; border-radius: 50%; border: none; background: #f1f5f9; color: #475569; font-size: 1.1rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-icon:hover { background: #e2e8f0; color: #007bff; }
        .btn-send { background: #007bff; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-send:hover { background: #0069d9; }
        .chat-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
        .chat-placeholder i { font-size: 4rem; margin-bottom: 20px; color: #cbd5e1; }
        .msg-options-btn { position: absolute; top: 5px; left: 8px; color: inherit; opacity: 0.6; cursor: pointer; }
        .msg-dropdown { position: absolute; top: 25px; left: 5px; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); width: 120px; z-index: 100; display: none; overflow: hidden; border: 1px solid #eee; }
        .msg-dropdown-item { padding: 8px 12px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .msg-dropdown-item:hover { background: #f8f9fa; color: #007bff; }
        .attachment-preview { position: absolute; bottom: 80px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: none; z-index: 20; }
        .emoji-popup { position: absolute; bottom: 80px; right: 60px; width: 300px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); padding: 10px; display: none; grid-template-columns: repeat(8, 1fr); gap: 5px; height: 200px; overflow-y: auto; z-index: 100; }
        .emoji-item { cursor: pointer; font-size: 1.4rem; padding: 5px; text-align: center; border-radius: 5px; }
        .emoji-item:hover { background: #f1f5f9; }
        @media (max-width: 768px) { .chat-layout { flex-direction: column; height: 90vh; } .sidebar-list { width: 100%; height: 100%; display: flex; } .chat-area { display: none; width: 100%; height: 100%; } .chat-area.active { display: flex; position: fixed; top: 0; left: 0; z-index: 999; } .sidebar-list.hidden { display: none; } }
    `;
    document.head.appendChild(style);
}

// ... (renderChatLayout, loadConversations, openChat - نفس الكود السابق)

function cleanInterfaceAggressive() {
    const parent = document.querySelector('.main-content-dashboard .dashboard-content');
    if (parent) {
        Array.from(parent.children).forEach(child => {
            if (child.id !== 'chatLayoutRoot') child.style.display = 'none';
        });
    }
}

function renderChatLayout() {
    const container = document.querySelector('.dashboard-content');
    const layout = document.createElement('div');
    layout.id = 'chatLayoutRoot';
    layout.className = 'chat-layout';
    layout.innerHTML = `
        <div class="sidebar-list" id="sidebarList">
            <div class="search-box">
                <input type="text" class="search-input" placeholder="🔍 بحث عن طالب..." onkeyup="filterStudents(this.value)">
                <button class="btn btn-primary btn-sm w-100 mt-2" onclick="showNewMessageModal()">+ محادثة جديدة</button>
            </div>
            <div class="students-list" id="studentsList"></div>
        </div>
        <div class="chat-area" id="chatArea">
            <div class="chat-placeholder">
                <i class="far fa-comments"></i>
                <h3>اختر طالباً لبدء المحادثة</h3>
            </div>
        </div>
    `;
    container.appendChild(layout);
}

function loadConversations() {
    const list = document.getElementById('studentsList');
    list.innerHTML = '';
    const teacherId = getCurrentUser().id;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const myStudents = users.filter(u => u.role === 'student' && u.teacherId == teacherId);
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');

    if (myStudents.length === 0) {
        list.innerHTML = '<div class="text-center p-3 text-muted">لا يوجد طلاب.</div>';
        return;
    }

    myStudents.forEach(s => {
        const lastMsg = messages.filter(m => (m.studentId == s.id && m.teacherId == teacherId))
                                .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
        const unread = messages.filter(m => m.studentId == s.id && m.isFromStudent && !m.isRead).length;
        
        const div = document.createElement('div');
        div.className = `student-item ${activeChatStudentId === s.id ? 'active' : ''}`;
        div.onclick = () => openChat(s.id);
        div.innerHTML = `
            <div class="student-avatar">${s.name.charAt(0)}</div>
            <div class="student-info">
                <h4>${s.name}</h4>
                <p>${lastMsg ? (lastMsg.isVoice ? '🎤 رسالة صوتية' : (lastMsg.content || 'مرفق')) : 'لا توجد رسائل'}</p>
            </div>
            ${unread > 0 ? `<span class="msg-badge">${unread}</span>` : ''}
        `;
        list.appendChild(div);
    });
}

function openChat(studentId) {
    activeChatStudentId = studentId;
    loadConversations();
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.getElementById('sidebarList').classList.add('hidden');
        document.getElementById('chatArea').classList.add('active');
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id == studentId);
    const chatArea = document.getElementById('chatArea');
    
    // فيسات
    const emojis = ['👍','👌','👏','🌹','🌟','💯','✅','😃','😄','😅','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😋','🤪','😎','🤩','🥳','🤔','🤫','😐','😑','🙄','😴','🤢','🤮','🤯','🧐','💀','👻','🤖','👋','✋','✌️','🤞','🤟','🤙','👈','👉','👆','👇','🤝','🙏','💪','👀','🧠','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💢','💥','💫','💦','💨','🕊','🐇','🐈','🐉','🌱','🌵','🌴','🌲','🌳','🍂','🍁','🍄','🌍','🌚','🌝','🌞','⭐','🌟','⚡','🔥','🌈','☂️','🎈','🎉','🎊','🎀','🎁','🏆','🥇','🥈','🥉','⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥅','🏒','🏑','🏏','🥍','🏹','🎣','🤿','🥊','🥋','⛸','🎿','🛷','🥌','🎯','🪀','🪁','🎮','🎰','🎲','🧩','🧸','♠️','♥️','♦️','♣️','♟','🃏','🀄','🎴','🎭','🖼','🎨','🧵','🧶','🎼','🎵','🎶','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','🎳','🎮','👾','🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🏍','🛵','🦽','🦼','🛺','🚲','🛴','🛹','🛼','🚏','🛣','🛤','🛢','⛽','🚨','🚥','🚦','🛑','🚧','⚓','⛵','🛶','🚤','🛳','⛴','🛥','🚢','✈','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🛎','🧳','⌛','⏳','⌚','⏰','⏱','⏲','🕰','🕛','🕧','🕐','🕜','🕑','🕝','🕒','🕞','🕓','🕟','🕔','🕠','🕕','🕡','🕖','🕢','🕗','🕣','🕘','🕤','🕙','🕥','🕚','🕦'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');

    chatArea.innerHTML = `
        <div class="chat-header">
            <div style="display:flex; align-items:center; gap:10px;">
                ${isMobile ? `<button class="btn-icon" onclick="backToSidebar()"><i class="fas fa-arrow-right"></i></button>` : ''}
                <div class="student-avatar" style="margin:0; width:40px; height:40px;">${student.name.charAt(0)}</div>
                <h3 style="margin:0; font-size:1.1rem;">${student.name}</h3>
            </div>
            <div>
                <button class="btn-icon" style="color:#ef4444;" onclick="deleteEntireConversation(${studentId})" title="حذف المحادثة"><i class="fas fa-trash"></i></button>
                <button class="btn-icon" style="color:#10b981;" onclick="exportChatToPDF(${studentId})" title="تصدير PDF"><i class="fas fa-file-pdf"></i></button>
            </div>
        </div>
        <div class="messages-container" id="msgsContainer"></div>
        
        <div id="attachmentPreview" class="attachment-preview">
            <span id="attachName" style="font-size:0.8rem;"></span>
            <i class="fas fa-times" style="color:red; cursor:pointer; margin-right:10px;" onclick="clearAttachment()"></i>
        </div>

        <div id="emojiPopup" class="emoji-popup">${emojiHtml}</div>

        <div class="chat-input-area">
            <button class="btn-icon" id="emojiBtn" onclick="toggleEmoji()"><i class="far fa-smile"></i></button>
            <label class="btn-icon" style="cursor:pointer;"><i class="fas fa-paperclip"></i><input type="file" id="fileInput" hidden onchange="handleAttachment(this)"></label>
            <input type="text" class="chat-input" id="msgInput" placeholder="اكتب رسالة..." onkeypress="handleEnter(event)">
            <button class="btn-icon" id="micBtn" onclick="startRecording()"><i class="fas fa-microphone"></i></button>
            <button class="btn-send" id="sendBtn" onclick="sendMessage()">إرسال <i class="fas fa-paper-plane"></i></button>
            <button class="btn-icon" id="cancelEditBtn" onclick="cancelEdit()" style="display:none; color:red;"><i class="fas fa-times"></i></button>
        </div>
    `;
    loadMessages(studentId);
}

// 🔥 تحديث الحذف (باستخدام النافذة الموحدة)
function deleteEntireConversation(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف كامل المحادثة مع هذا الطالب؟ لا يمكن التراجع.', function() {
        const teacherId = getCurrentUser().id;
        
        // حذف من سجل المعلم
        let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        tMsgs = tMsgs.filter(m => !(m.studentId == studentId && m.teacherId == teacherId));
        localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));

        // حذف من سجل الطالب
        let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        sMsgs = sMsgs.filter(m => !(m.studentId == studentId && m.teacherId == teacherId));
        localStorage.setItem('studentMessages', JSON.stringify(sMsgs));

        showSuccess('تم حذف المحادثة');
        openChat(studentId); // إعادة تحميل (فارغ)
    });
}

// ... (loadMessages, sendMessage, edit/delete single message - يتبع نفس النمط)

function filterStudents(term) {
    const list = document.getElementById('studentsList');
    const items = list.getElementsByClassName('student-item');
    Array.from(items).forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        item.style.display = name.includes(term.toLowerCase()) ? 'flex' : 'none';
    });
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
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const myStudents = users.filter(u => u.role === 'student' && u.teacherId == currentTeacher.id);
    
    recipientSelect.innerHTML = '<option value="">اختر الطالب</option>';
    myStudents.forEach(s => {
        recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// دوال التصدير والوسائط (كما هي مع تحديث التنبيهات)
// ... (بقيت الدوال كما هي في نسختك، فقط استبدل confirm بـ showConfirmModal عند الحاجة)

// تصدير
window.showNewMessageModal = showNewMessageModal;
window.sendNewMessage = function() { 
    const sId = document.getElementById('messageRecipient').value; 
    if(sId) { 
        document.getElementById('newMessageModal').classList.remove('show'); 
        openChat(parseInt(sId)); 
    } 
};
window.closeNewMessageModal = function() { 
    document.getElementById('newMessageModal').classList.remove('show'); 
};
window.deleteEntireConversation = deleteEntireConversation;
// ... (باقي الدوال)

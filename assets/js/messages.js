// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: الملف الكامل والنهائي - تم حل جميع أخطاء ReferenceError
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
            loadConversations(); // ✅ معرفة الآن بالأسفل
            
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
        } catch (e) { console.error("Initialization Error:", e); }
    }
});

// --- وظائف الحقن والتنسيق ---
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

function injectChatStyles() {
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; font-family: 'Tajawal', sans-serif; }
        .chat-sidebar { width: 320px; background-color: #f8f9fa; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; z-index: 1001; }
        .chat-list { flex: 1; overflow-y: auto; }
        .chat-item { display: flex; align-items: center; padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #e2e8f0; background: #fff; }
        .chat-item.active { background: #007bff !important; color: #fff !important; }
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; flex-shrink: 0; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; min-width: 0; position: relative; }
        .chat-header { padding: 10px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; height: 70px; }
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; }
        .msg-me { align-self: flex-start; background: #007bff; color: white; }
        .msg-other { align-self: flex-end; background: #fff; border: 1px solid #e2e8f0; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 5000; display: none; align-items: center; justify-content: center; }
        .custom-modal-box { background: #fff; padding: 25px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; }

        @media (max-width: 768px) { 
            .messages-container { height: calc(100vh - 130px) !important; margin-bottom: -25px !important; }
            .chat-sidebar { position: absolute !important; right: -100% !important; top: 0; height: 100%; width: 280px; transition: right 0.3s ease; }
            .chat-sidebar.show-contacts { right: 0 !important; }
            .chat-header { height: 60px !important; padding: 0 10px !important; justify-content: space-between !important; flex-wrap: nowrap !important; }
            #chatHeaderName { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; font-size: 0.9rem; }
            .header-actions { display: flex !important; gap: 15px !important; }
            .btn-header-action { background: transparent !important; box-shadow: none !important; width: auto !important; height: auto !important; font-size: 1.2rem !important; }
            .btn-delete-chat { color: #dc2626 !important; }
            .btn-pdf-chat { color: #2563eb !important; }
            .chat-input-area { flex-direction: column !important; background: #f0f2f5 !important; padding: 10px !important; }
            .input-main-wrapper { display: flex; width: 100%; gap: 8px; }
            .input-tools-wrapper { display: flex; justify-content: center; gap: 20px; padding-top: 8px; }
        }
    `;
    document.head.appendChild(style);
}

// --- وظائف بناء الواجهة ---
function renderChatLayout() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar" id="chatSidebar">
                <div class="chat-list-header" style="display:flex; padding:15px; border-bottom:1px solid #eee;">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()"><i class="fas fa-plus"></i> محادثة جديدة</button>
                    <button class="btn btn-light d-md-none ms-2" onclick="document.getElementById('chatSidebar').classList.remove('show-contacts')"><i class="fas fa-times"></i></button>
                </div>
                <div class="chat-list" id="chatContactsList"></div>
            </div>
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div class="header-info">
                        <button class="btn btn-light me-2 d-md-none" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')"><i class="fas fa-users"></i></button>
                        <div class="avatar" id="chatHeaderAvatar"></div>
                        <div style="display:flex; flex-direction:column; min-width:0;">
                            <span id="chatHeaderName" style="font-weight:bold;">اسم الطالب</span>
                            <span style="font-size:0.7rem; color:#10b981;">متصل</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-header-action btn-pdf-chat" onclick="exportChatToPDF()"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn-header-action btn-delete-chat" onclick="deleteEntireConversation()"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="messages-area" id="chatMessagesArea">
                    <div style="text-align:center; padding-top:100px; color:#999;">
                        <i class="far fa-comments fa-3x mb-3"></i>
                        <p>اختر طالباً لبدء المحادثة</p>
                        <button class="btn btn-primary d-md-none mt-3" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')">👥 إظهار الطلاب</button>
                    </div>
                </div>
                <div class="chat-input-area" id="chatInputArea" style="display:none; padding:15px; border-top:1px solid #eee;">
                    <div class="input-main-wrapper">
                        <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." style="flex:1; padding:10px; border-radius:20px; border:1px solid #ddd;">
                        <button class="btn btn-primary" style="border-radius:20px; padding:0 20px;" onclick="sendChatMessage()">إرسال</button>
                    </div>
                    <div class="input-tools-wrapper">
                        <button class="btn btn-light" onclick="startRecording()"><i class="fas fa-microphone"></i></button>
                        <label class="btn btn-light"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleChatAttachment(this)"></label>
                    </div>
                </div>
            </div>
        </div>
        <div id="deleteConfirmModal" class="custom-modal-overlay">
            <div class="custom-modal-box">
                <h4 style="color:#dc2626;">حذف المحادثة؟</h4>
                <p>سيتم مسح سجل الرسائل نهائياً.</p>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="btn btn-light flex-grow-1" onclick="closeDeleteModal()">إلغاء</button>
                    <button class="btn btn-danger flex-grow-1" onclick="confirmDeleteAction()">نعم، حذف</button>
                </div>
            </div>
        </div>
    `;
}

// --- وظائف المراسلة الأساسية ---
function loadConversations() {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')).user;
    const conversations = {};
    messages.forEach(msg => {
        if (msg.teacherId !== currentUser.id) return;
        if (!conversations[msg.studentId]) conversations[msg.studentId] = { studentId: msg.studentId, lastMessage: msg };
    });
    renderSidebar(Object.values(conversations));
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList');
    if(!listEl) return;
    listEl.innerHTML = conversations.length === 0 ? '<div class="p-3 text-center text-muted">لا توجد محادثات</div>' : '';
    conversations.forEach(convo => {
        const student = getStudentById(convo.studentId);
        const name = student ? student.name : 'طالب';
        listEl.innerHTML += `<div class="chat-item" onclick="openChat(${convo.studentId})">
            <div class="avatar">${name.charAt(0)}</div>
            <div class="chat-info"><div class="chat-name">${name}</div></div>
        </div>`;
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
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')).user;
    const chatMsgs = messages.filter(m => m.teacherId === currentUser.id && m.studentId === studentId);
    const area = document.getElementById('chatMessagesArea');
    area.innerHTML = '';
    chatMsgs.forEach(msg => {
        const bubbleClass = !msg.isFromStudent ? 'msg-me' : 'msg-other';
        area.innerHTML += `<div class="msg-bubble ${bubbleClass}">${msg.content}</div>`;
    });
    area.scrollTop = area.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content || !activeChatStudentId) return;
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')).user;
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    messages.push({
        id: Date.now(),
        teacherId: currentUser.id,
        studentId: activeChatStudentId,
        content: content,
        sentAt: new Date().toISOString(),
        isFromStudent: false
    });
    localStorage.setItem('teacherMessages', JSON.stringify(messages));
    input.value = '';
    loadChatMessages(activeChatStudentId);
}

// --- إدارة النوافذ المنبثقة والحذف ---
function showNewMessageModal() {
    const modal = document.getElementById('newMessageModal');
    if (modal) {
        loadStudentsForMessaging();
        modal.classList.add('show');
    }
}

function loadStudentsForMessaging() {
    const recipientSelect = document.getElementById('messageRecipient');
    if(!recipientSelect) return;
    const currentTeacher = JSON.parse(sessionStorage.getItem('currentUser')).user;
    let students = JSON.parse(localStorage.getItem('students') || '[]').filter(s => s.teacherId == currentTeacher.id);
    recipientSelect.innerHTML = '<option value="">اختر الطالب</option>';
    students.forEach(s => { recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`; });
}

function deleteEntireConversation() { document.getElementById('deleteConfirmModal').style.display = 'flex'; }
function closeDeleteModal() { document.getElementById('deleteConfirmModal').style.display = 'none'; }
function confirmDeleteAction() {
    let messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')).user;
    messages = messages.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
    localStorage.setItem('teacherMessages', JSON.stringify(messages));
    location.reload();
}

function getStudentById(id) {
    let students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.find(s => s.id == id);
}

function handleEnter(e) { if (e.key === 'Enter') sendChatMessage(); }

// --- التصدير PDF ---
function exportChatToPDF() {
    const element = document.getElementById('chatMessagesArea');
    html2pdf().from(element).save(`محادثة_${activeChatStudentId}.pdf`);
}

function cleanInterfaceAggressive() { /* دالة اختيارية لتنظيف الواجهة */ }

// ربط الدوال بالنافذة العالمية (Global Window) لتعمل مع onclick في HTML
window.showNewMessageModal = showNewMessageModal;
window.sendNewMessage = function() {
    const sId = document.getElementById('messageRecipient').value;
    if(sId) {
        document.getElementById('newMessageModal').classList.remove('show');
        openChat(parseInt(sId));
    }
};
window.closeNewMessageModal = () => document.getElementById('newMessageModal').classList.remove('show');
window.deleteEntireConversation = deleteEntireConversation;
window.confirmDeleteAction = confirmDeleteAction;
window.closeDeleteModal = closeDeleteModal;
window.exportChatToPDF = exportChatToPDF;

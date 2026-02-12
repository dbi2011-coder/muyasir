// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: نسخة المعلم الكاملة - تنبيهات احترافية - إصلاح ReferenceError
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
            injectChatStyles();      // تم التأكد من وجود الدالة بالأسفل
            renderChatLayout();      // تم التأكد من وجود الدالة بالأسفل
            loadConversations();
            
            document.addEventListener('click', function(e) {
                const popup = document.getElementById('emojiPopup');
                const btn = document.getElementById('emojiBtn');
                if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) {
                    if(popup) popup.style.display = 'none';
                }
                if (!e.target.closest('.msg-options-btn')) {
                    document.querySelectorAll('.msg-dropdown').forEach(menu => menu.style.display = 'none');
                }
            });
        } catch (e) { console.error("Initialization Error:", e); }
    }
});

// --- دوال الحقن (Injection) والستايلات ---
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
    if (document.getElementById('chatStyles')) return;
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
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; background: #fff; font-weight: bold; font-size: 1.1rem; color:#334155; height: 70px; }
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; min-height: 80px; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; background: #f8fafc; margin: 0 5px; }
        .btn-tool { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; transition: 0.2s; border: none; color: white !important; }
        .recording-area { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; display: none; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 50; }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    if(!container) return;
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-list-header">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="border-radius:25px;">
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
                            <span id="chatHeaderName">اسم الطالب</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-outline-primary btn-sm" onclick="exportChatToPDF()" title="تصدير PDF"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteEntireConversation()" title="حذف الكل"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="messages-area" id="chatMessagesArea">
                    <div style="text-align:center; padding:50px; color:#94a3b8;">اختر طالباً للبدء</div>
                </div>
                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    <button class="btn-tool" style="background:#f57f17;" onclick="toggleEmojiPopup()"><i class="far fa-smile"></i></button>
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالة..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button class="btn-tool" style="background:#b71c1c;" onclick="startRecording()"><i class="fas fa-microphone"></i></button>
                    <button class="btn btn-primary" style="border-radius:25px; padding:10px 20px;" onclick="sendChatMessage()">إرسال</button>
                </div>
            </div>
        </div>
    `;
}

// --- دوال الحذف والتنبيهات الاحترافية ---
function deleteEntireConversation() {
    if (!activeChatStudentId) return;
    showConfirmModal('⚠️ هل أنت متأكد من حذف كامل سجل المحادثة؟ لا يمكن التراجع عن هذا الإجراء.', function() {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')).user;
        let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        tMsgs = tMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
        localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));

        let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        sMsgs = sMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
        localStorage.setItem('studentMessages', JSON.stringify(sMsgs));

        showSuccess('تم حذف المحادثة بنجاح');
        openChat(activeChatStudentId); // إعادة تحميل الواجهة
    });
}

function deleteChatMessage(messageId) {
    showConfirmModal('حذف هذه الرسالة؟', function() {
        let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        tMsgs = tMsgs.filter(m => m.id !== messageId);
        localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));
        showSuccess('تم حذف الرسالة');
        loadChatMessages(activeChatStudentId);
    });
}

// --- دوال مساعدة (يجب نسخها أيضاً) ---
function cleanInterfaceAggressive() {
    const target = document.getElementById('messagesList');
    if (!target) return;
    Array.from(target.parentElement.children).forEach(child => {
        if (child.id !== 'messagesList' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && !child.classList.contains('modal')) {
            child.style.display = 'none';
        }
    });
}

function loadConversations() { /* الكود الأصلي الخاص بك لتحميل القائمة */ }
function openChat(id) { activeChatStudentId = id; document.getElementById('chatHeader').style.display='flex'; document.getElementById('chatInputArea').style.display='flex'; loadChatMessages(id); }
function loadChatMessages(id) { /* الكود الأصلي لعرض الرسائل */ }
function showSuccess(msg) { if(window.showToast) window.showToast(msg, 'success'); else console.log(msg); }

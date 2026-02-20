// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: شات المعلم (إصلاح نهائي لتداخل الأزرار وتجاوب الجوال)
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
    document.querySelectorAll('.stat-card, .filter-group').forEach(el => el.style.display = 'none');
}

function injectChatStyles() {
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 0px; font-family: 'Tajawal', sans-serif; }
        .chat-sidebar { width: 320px; background-color: #f8f9fa; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; z-index: 1001; }
        .chat-list-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0; }
        .chat-list { flex: 1; overflow-y: auto; }
        .chat-item { display: flex; align-items: center; padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #e2e8f0; transition: 0.2s; background: #fff; }
        .chat-item:hover { background: #f1f5f9; }
        .chat-item.active { background: #007bff !important; color: #fff !important; }
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; flex-shrink: 0; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; min-width: 0; }
        
        /* الرأس - ديسكتوب */
        .chat-header { padding: 10px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; background: #fff; height: 70px; }
        .header-info { display: flex; align-items: center; flex: 1; min-width: 0; }
        .header-actions { display: flex; gap: 10px; align-items: center; }
        .btn-header-action { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; color: white; transition: 0.2s; }
        
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; }
        .msg-me { align-self: flex-start; background: #007bff; color: white; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; }
        
        /* منطقة الكتابة */
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; }
        .btn-send-pill { background-color: #007bff; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-weight: bold; cursor: pointer; }

        /* نافذة الحذف */
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 5000; display: none; align-items: center; justify-content: center; }
        .custom-modal-box { background: #fff; padding: 25px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; }

        /* =========================================
           📱 تنسيقات الجوال حصراً
        ========================================= */
        @media (max-width: 768px) { 
            .messages-container { height: calc(100vh - 130px) !important; margin-bottom: -25px !important; }
            .chat-container { height: 100% !important; border-radius: 0 !important; }

            /* إخفاء القائمة الجانبية في الجوال */
            .chat-sidebar { position: absolute !important; right: -100% !important; top: 0 !important; height: 100% !important; width: 280px !important; transition: right 0.3s ease; }
            .chat-sidebar.show-contacts { right: 0 !important; }

            /* الرأس في الجوال */
            .chat-header { height: 60px !important; padding: 0 10px !important; }
            .chat-header .avatar { width: 35px !important; height: 35px !important; }
            #chatHeaderName { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; font-size: 0.9rem !important; }

            /* الأزرار في اليسار شفافة */
            .header-actions { gap: 15px !important; }
            .btn-header-action { background: transparent !important; color: inherit !important; width: auto !important; height: auto !important; font-size: 1.2rem !important; box-shadow: none !important; }
            .btn-delete-chat { color: #dc2626 !important; }
            .btn-pdf-chat { color: #2563eb !important; }

            /* شريط الكتابة في الأسفل */
            .chat-input-area { flex-direction: column; align-items: stretch; background: #f0f2f5; padding: 10px !important; }
            .input-main-wrapper { display: flex; align-items: center; gap: 8px; width: 100%; order: 1; }
            .input-tools-wrapper { display: flex; justify-content: center; gap: 20px; order: 2; padding-top: 5px; }
            .input-tools-wrapper .btn-tool { background: transparent !important; color: #555 !important; border: 1px solid #ccc !important; border-radius: 8px !important; width: 35px !important; height: 35px !important; box-shadow: none !important; }
        }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar" id="chatSidebar">
                <div class="chat-list-header" style="display:flex; align-items:center;">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="border-radius:25px;"><i class="fas fa-plus"></i> محادثة جديدة</button>
                    <button class="btn btn-light d-md-none ms-2" onclick="document.getElementById('chatSidebar').classList.remove('show-contacts')"><i class="fas fa-times"></i></button>
                </div>
                <div class="chat-list" id="chatContactsList"></div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div class="header-info">
                        <button class="btn btn-light me-2 d-md-none" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')">
                            <i class="fas fa-users"></i>
                        </button>
                        <div class="avatar" id="chatHeaderAvatar"></div>
                        <div style="display:flex; flex-direction:column; margin-right:8px; min-width:0;">
                            <span id="chatHeaderName">اسم الطالب</span>
                            <span style="font-size:0.7rem; color:#10b981;">متصل</span>
                        </div>
                    </div>
                    
                    <div class="header-actions">
                        <button class="btn-header-action btn-pdf-chat" onclick="exportChatToPDF()"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn-header-action btn-delete-chat" onclick="deleteEntireConversation()"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                
                <div class="messages-area" id="chatMessagesArea">
                    <div class="empty-chat" style="text-align:center; padding-top:100px; color:#999;">
                        <i class="far fa-comments fa-3x mb-3"></i>
                        <p>اختر طالباً لبدء المحادثة</p>
                        <button class="btn btn-primary d-md-none mt-3" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')">👥 إظهار الطلاب</button>
                    </div>
                </div>

                <div class="chat-input-area" id="chatInputArea" style="display:none;">
                    <div class="input-main-wrapper">
                        <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." onkeypress="handleEnter(event)">
                        <button class="btn-send-pill" onclick="sendChatMessage()">أرسل</button>
                    </div>
                    <div class="input-tools-wrapper">
                        <button class="btn-tool" onclick="toggleEmojiPopup()"><i class="far fa-smile"></i></button>
                        <label class="btn-tool"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleChatAttachment(this)"></label>
                        <label class="btn-tool"><i class="fas fa-camera"></i><input type="file" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)"></label>
                        <button class="btn-tool" onclick="startRecording()"><i class="fas fa-microphone"></i></button>
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

// بقية الدوال (OpenChat, LoadConversations... إلخ) تبقى كما هي مع التأكد من تحديث دالة openChat
function openChat(studentId) {
    activeChatStudentId = studentId;
    document.getElementById('chatSidebar').classList.remove('show-contacts'); // إغلاق القائمة في الموبايل
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'flex';
    const student = getStudentById(studentId);
    document.getElementById('chatHeaderName').textContent = student ? student.name : 'طالب';
    document.getElementById('chatHeaderAvatar').textContent = student ? student.name.charAt(0) : '?';
    loadChatMessages(studentId);
}

function deleteEntireConversation() { document.getElementById('deleteConfirmModal').style.display = 'flex'; }
function closeDeleteModal() { document.getElementById('deleteConfirmModal').style.display = 'none'; }

// تأكد من نسخ باقي دوال المراسلة الأساسية من الملف السابق لتعمل الأزرار

// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: الإصلاح الشامل - نسخة الكمبيوتر آمنة + تصحيح أخطاء الأزرار ونافذة الحذف للجوال
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
                // إغلاق نافذة الحذف عند النقر خارجها
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
        /* =========================================
           💻 تنسيقات الكمبيوتر (الأصلية والمستقرة)
        ========================================= */
        .chat-container { display: flex !important; height: 80vh !important; background: #fff !important; border-radius: 12px !important; box-shadow: 0 5px 25px rgba(0,0,0,0.1) !important; overflow: hidden !important; border: 1px solid #d1d5db !important; margin-top: 0px !important; font-family: 'Tajawal', sans-serif !important; }
        
        .chat-sidebar { width: 320px !important; min-width: 320px !important; background-color: #f8f9fa !important; border-left: 1px solid #e5e7eb !important; display: flex !important; flex-direction: column !important; z-index: 2 !important; position: relative !important; right: 0 !important; flex-shrink: 0 !important; }
        .chat-list-header { padding: 20px !important; background: #f8f9fa !important; border-bottom: 1px solid #e2e8f0 !important; }
        .chat-list { flex: 1 !important; overflow-y: auto !important; }
        .chat-item { display: flex !important; align-items: center !important; padding: 15px 20px !important; cursor: pointer !important; border-bottom: 1px solid #e2e8f0 !important; transition: 0.2s !important; background: #fff !important; }
        .chat-item:hover { background: #f1f5f9 !important; }
        .chat-item.active { background: #007bff !important; color: #fff !important; border-right: 5px solid #004494 !important; }
        .chat-item.active .chat-name { color: #fff !important; }
        .chat-item.active .chat-preview { color: #e0e0e0 !important; }
        .chat-item.active .avatar { background: #fff !important; color: #007bff !important; border: 2px solid #007bff !important; }
        .avatar { width: 45px !important; height: 45px !important; background: #e2e8f0 !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: bold !important; color: #475569 !important; margin-left: 12px !important; border: 2px solid #fff !important; flex-shrink: 0 !important; }
        .chat-info { flex: 1 !important; min-width: 0 !important; }
        .chat-name { font-weight: bold !important; color: #334155 !important; font-size: 0.95rem !important; display:flex !important; justify-content:space-between !important; margin-bottom: 4px !important; }
        .chat-preview { font-size: 0.85rem !important; color: #64748b !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
        .unread-badge { background: #ef4444 !important; color: white !important; font-size: 0.7rem !important; padding: 2px 8px !important; border-radius: 10px !important; }
        
        .chat-main { flex: 1 !important; display: flex !important; flex-direction: column !important; background: #fff !important; position: relative !important; min-width: 0 !important; }
        .chat-header { padding: 15px 20px !important; border-bottom: 1px solid #eee !important; display: flex !important; align-items: center !important; justify-content: space-between !important; background: #fff !important; font-weight: bold !important; font-size: 1.1rem !important; color:#334155 !important; height: 70px !important; }
        .header-actions { display: flex !important; gap: 10px !important; }
        .btn-header-action { width: 40px !important; height: 40px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; transition: 0.2s !important; font-size: 1.1rem !important; border: none !important; color: white !important; box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important; }
        .btn-delete-chat { background: #c62828 !important; }
        .btn-delete-chat:hover { background: #b71c1c !important; transform: scale(1.1) !important; }
        .btn-pdf-chat { background: #1565c0 !important; }
        .btn-pdf-chat:hover { background: #0d47a1 !important; transform: scale(1.1) !important; }
        
        .messages-area { flex: 1 !important; padding: 20px !important; overflow-y: auto !important; background: #fcfcfc !important; display: flex !important; flex-direction: column !important; gap: 15px !important; }
        .msg-bubble { max-width: 70% !important; padding: 12px 18px !important; border-radius: 15px !important; position: relative !important; font-size: 0.95rem !important; line-height: 1.6 !important; box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important; }
        .msg-me { align-self: flex-start !important; background: #007bff !important; color: white !important; border-bottom-right-radius: 2px !important; } 
        .msg-other { align-self: flex-end !important; background: #fff !important; color: #334155 !important; border: 1px solid #e2e8f0 !important; border-bottom-left-radius: 2px !important; }
        audio { height: 35px !important; width: 220px !important; margin-top: 5px !important; border-radius: 20px !important; outline: none !important; }
        .msg-me audio { filter: invert(1) grayscale(1) brightness(2) !important; }
        .msg-time { font-size: 0.7rem !important; margin-top: 5px !important; opacity: 0.8 !important; display:block !important; text-align:left !important; }
        
        .chat-input-area { padding: 15px 20px !important; border-top: 1px solid #e2e8f0 !important; background: #fff !important; display: flex !important; align-items: center !important; gap: 10px !important; position: relative !important; min-height: 80px !important; }
        .input-tools-wrapper { display: flex !important; align-items: center !important; gap: 8px !important; }
        .input-main-wrapper { display: flex !important; align-items: center !important; gap: 8px !important; flex: 1 !important; }
        
        .chat-input { flex: 1 !important; padding: 12px 15px !important; border: 2px solid #e2e8f0 !important; border-radius: 25px !important; outline: none !important; transition: 0.2s !important; font-size: 1rem !important; background: #f8fafc !important; margin: 0 5px !important; }
        .chat-input:focus { border-color: #007bff !important; background: #fff !important; }
        
        /* 🚨 تم إزالة !important من display هنا لتعمل أوامر الإخفاء 🚨 */
        .btn-tool { width: 45px !important; height: 45px !important; border-radius: 50% !important; display: flex; align-items: center !important; justify-content: center !important; font-size: 1.2rem !important; cursor: pointer !important; transition: 0.2s !important; border: none !important; color: white !important; box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important; flex-shrink: 0 !important; }
        .btn-tool:hover { transform: translateY(-2px) !important; box-shadow: 0 5px 10px rgba(0,0,0,0.3) !important; filter: brightness(1.1) !important; }
        .btn-emoji { background: #f57f17 !important; }
        .btn-attach { background: #37474f !important; }
        .btn-cam { background: #0d47a1 !important; }
        .btn-mic { background: #b71c1c !important; }
        
        .btn-send-pill { background-color: #007bff !important; color: white !important; border: none !important; padding: 10px 25px !important; border-radius: 50px !important; font-size: 1rem !important; font-weight: bold !important; cursor: pointer !important; display: flex !important; align-items: center !important; gap: 8px !important; transition: 0.2s !important; box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2) !important; flex-shrink: 0 !important; }
        .btn-send-pill:hover { background-color: #0069d9 !important; transform: translateY(-1px) !important; }
        
        .empty-chat { flex: 1 !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; color: #94a3b8 !important; }
        
        .mobile-only-element { display: none !important; }

        /* =========================================
           🛠️ الكلاسات الديناميكية (Dynamic Classes) للتحكم بالإخفاء والظهور
        ========================================= */
        .hide-element { display: none !important; }
        .show-flex { display: flex !important; }
        
        .recording-area { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: #f0f2f5 !important; align-items: center !important; justify-content: space-between !important; padding: 0 15px !important; z-index: 50 !important; border-radius: 12px !important; }
        
        .custom-modal-overlay { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.5) !important; z-index: 9999 !important; align-items: center !important; justify-content: center !important; backdrop-filter: blur(3px) !important; }
        .custom-modal-box { background: #fff !important; padding: 25px !important; border-radius: 16px !important; width: 90% !important; max-width: 400px !important; text-align: center !important; box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important; }


        /* =========================================
           📱 تخصيص الجوال حصراً (أقل من 768px)
        ========================================= */
        @media (max-width: 768px) { 
            .mobile-only-element { display: flex !important; }
            
            .messages-container { height: calc(100vh - 130px) !important; margin-bottom: -20px !important; }
            .chat-container { height: 100% !important; border-radius: 0 !important; border: none !important; box-shadow: none !important; margin: 0 !important; }
            
            .chat-sidebar { position: absolute !important; right: -100% !important; top: 0 !important; height: 100% !important; width: 280px !important; min-width: 280px !important; z-index: 1000 !important; transition: right 0.3s ease !important; box-shadow: -4px 0 15px rgba(0,0,0,0.1) !important; }
            .chat-sidebar.show-contacts { right: 0 !important; }

            /* رأس المحادثة: إجبار العناصر على عدم الخروج من الشاشة */
            .chat-header { display: flex !important; flex-wrap: nowrap !important; align-items: center !important; justify-content: space-between !important; padding: 5px 10px !important; height: 60px !important; background: #fff !important; border-bottom: 1px solid #e5e7eb !important; width: 100% !important; box-sizing: border-box !important; overflow: hidden !important; }
            
            .header-info { display: flex !important; align-items: center !important; flex: 1 1 auto !important; min-width: 0 !important; }
            .chat-header .avatar { width: 35px !important; height: 35px !important; font-size: 0.9rem !important; margin-left: 8px !important; flex-shrink: 0 !important; }
            #chatHeaderName { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; font-size: 0.95rem !important; color: #1f2937 !important; }

            /* الأزرار الشفافة على أقصى اليسار بجانب بعض وبدون تداخل */
            .header-actions { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-end !important; flex-wrap: nowrap !important; gap: 8px !important; padding: 0 !important; border: none !important; flex-shrink: 0 !important; }
            .btn-header-action { display: inline-flex !important; align-items: center !important; justify-content: center !important; background: transparent !important; width: auto !important; height: auto !important; font-size: 1.35rem !important; box-shadow: none !important; margin: 0 !important; padding: 5px 8px !important; flex-shrink: 0 !important; }
            
            .btn-delete-chat { color: #dc2626 !important; }
            .btn-pdf-chat { color: #2563eb !important; }

            /* منطقة الكتابة - الأدوات تتوسط الأسفل */
            .chat-input-area { flex-direction: column !important; align-items: stretch !important; padding: 8px 8px 10px 8px !important; gap: 5px !important; background: #f0f2f5 !important; }
            .input-main-wrapper { order: 1 !important; width: 100% !important; display: flex !important; align-items: center !important; gap: 8px !important; }
            .input-tools-wrapper { order: 2 !important; width: 100% !important; display: flex !important; justify-content: center !important; padding: 5px 0 0 0 !important; gap: 15px !important; }
            
            .chat-input { padding: 10px 15px !important; margin: 0 !important; border-radius: 20px !important; }
            .btn-send-pill { padding: 8px 15px !important; }
            .input-tools-wrapper .btn-tool { border-radius: 8px !important; width: 35px !important; height: 35px !important; font-size: 1.1rem !important; background: #fff !important; color: #555 !important; border: 1px solid #ddd !important; box-shadow: none !important; }
            
            /* أزرار منطقة التسجيل */
            .recording-area .btn-tool { width: 35px !important; height: 35px !important; border-radius: 50% !important; color: white !important; display: flex; border: none !important; }
        }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    container.className = '';
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','👻','💀','☠️'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar" id="chatSidebar">
                <div class="chat-list-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="font-weight:bold; border-radius:25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <i class="fas fa-plus"></i> محادثة جديدة
                    </button>
                    <button class="mobile-only-element" style="background:transparent; color:#333; border:none; font-size:1.2rem; margin-right:10px; padding:0; align-items:center;" onclick="document.getElementById('chatSidebar').classList.remove('show-contacts')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chat-list" id="chatContactsList"></div>
            </div>
            
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div class="header-info">
                        <button class="mobile-only-element" style="background:transparent; border:none; font-size:1.2rem; color:#333; margin-left:10px; padding:0; align-items:center;" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')">
                            <i class="fas fa-users"></i>
                        </button>
                        <div class="avatar" id="chatHeaderAvatar"></div>
                        <div style="display:flex; flex-direction:column; margin-right:10px; min-width: 0; flex: 1;">
                            <span id="chatHeaderName" style="line-height:1.2;">اسم الطالب</span>
                            <span style="font-size:0.75rem; color:#10b981; font-weight:normal;">● متصل</span>
                        </div>
                    </div>
                    
                    <div class="header-actions">
                        <button class="btn-header-action btn-pdf-chat" onclick="exportChatToPDF()" title="حفظ المحادثة PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn-header-action btn-delete-chat" onclick="deleteEntireConversation()" title="حذف المحادثة بالكامل">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="messages-area" id="chatMessagesArea">
                    <div class="empty-chat">
                        <i class="far fa-comments fa-4x mb-4" style="color:#cbd5e1;"></i>
                        <p style="font-size:1.1rem;">اختر طالباً للبدء بالمراسلة</p>
                        <button class="mobile-only-element" style="margin-top:20px; border-radius:25px; padding:10px 20px; font-weight:bold; background:var(--primary-color, #007bff); color:white; border:none; align-items:center; gap:8px;" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')">
                            <i class="fas fa-users"></i> إظهار قائمة الطلاب
                        </button>
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

                <div class="chat-input-area hide-element" id="chatInputArea">
                    <div class="recording-area hide-element" id="recordingArea">
                        <div class="recording-timer">
                            <div class="recording-wave"></div>
                            <span id="recordTimer">00:00</span>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-tool" style="background:#dc3545 !important; color:white !important;" onclick="cancelRecording()" title="إلغاء">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="btn-tool" style="background:#28a745 !important; color:white !important;" onclick="stopRecording()" title="إرسال">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="input-tools-wrapper">
                        <button id="emojiBtn" class="btn-tool btn-emoji" onclick="toggleEmojiPopup()" title="رموز"><i class="far fa-smile"></i></button>
                        <label class="btn-tool btn-attach" title="ملف"><i class="fas fa-paperclip"></i><input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)"></label>
                        <label class="btn-tool btn-cam" title="كاميرا"><i class="fas fa-camera"></i><input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)"></label>
                    </div>

                    <div class="input-main-wrapper">
                        <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك..." onkeypress="handleEnter(event)">
                        <button class="btn-tool btn-mic" onclick="startRecording()" title="تسجيل صوتي"><i class="fas fa-microphone"></i></button>
                        <button class="btn-tool hide-element" onclick="cancelEdit()" id="cancelEditBtn" style="background:#ffebee !important; color:red !important;" title="إلغاء التعديل"><i class="fas fa-times"></i></button>
                        <button class="btn-send-pill" id="sendBtn" onclick="sendChatMessage()">أرسل <i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <div id="deleteConfirmModal" class="custom-modal-overlay hide-element">
            <div class="custom-modal-box">
                <div class="modal-icon-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="modal-title">حذف المحادثة؟</div>
                <div class="modal-desc">
                    هل أنت متأكد من رغبتك في حذف سجل المحادثة بالكامل؟<br>
                    <span style="color:#dc2626; font-size:0.85rem;">⚠️ لا يمكن التراجع عن هذا الإجراء</span>
                </div>
                <div class="modal-actions">
                    <button class="btn-modal btn-modal-cancel" onclick="closeDeleteModal()">إلغاء</button>
                    <button class="btn-modal btn-modal-delete" onclick="confirmDeleteAction()">
                        <i class="fas fa-trash-alt"></i> نعم، حذف
                    </button>
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
    
    // إخفاء القائمة الجانبية في الجوال تلقائياً
    const sidebar = document.getElementById('chatSidebar');
    if(sidebar) sidebar.classList.remove('show-contacts');

    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputArea').classList.remove('hide-element');
    document.getElementById('chatInputArea').classList.add('show-flex');
    
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
        
        if (msg.isVoice) {
            contentHtml = `<div style="display:flex; align-items:center; gap:5px;"><audio controls src="${msg.content}"></audio></div>`;
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
    const element = document.getElementById('chatMessagesArea');
    const opt = { margin: 0.5, filename: `محادثة_${student ? student.name : 'طالب'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    if (window.html2pdf) {
        const clone = element.cloneNode(true);
        clone.style.background = 'white'; clone.style.height = 'auto'; clone.style.overflow = 'visible'; clone.style.padding = '20px';
        clone.querySelectorAll('.msg-options-btn, .msg-dropdown').forEach(el => el.remove());
        clone.querySelectorAll('audio').forEach(audio => { const ph = document.createElement('div'); ph.innerHTML = '<span style="color:#555; font-size:0.9rem; border:1px solid #ccc; padding:2px 8px; border-radius:10px; background:#f9f9f9;">🎤 رسالة صوتية</span>'; if(audio.parentNode) audio.parentNode.replaceChild(ph, audio); });
        html2pdf().set(opt).from(clone).save();
    } else alert("جاري تحميل أداة التصدير...");
}

// استخدام Classes لفتح وإغلاق النافذة المنبثقة بأمان
function deleteEntireConversation() { 
    if (!activeChatStudentId) return; 
    document.getElementById('deleteConfirmModal').classList.remove('hide-element');
    document.getElementById('deleteConfirmModal').classList.add('show-flex');
}
function closeDeleteModal() { 
    document.getElementById('deleteConfirmModal').classList.remove('show-flex');
    document.getElementById('deleteConfirmModal').classList.add('hide-element');
}

function confirmDeleteAction() {
    if (!activeChatStudentId) return;
    const currentUser = getCurrentUser();
    let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    teacherMsgs = teacherMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    studentMsgs = studentMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    document.getElementById('chatMessagesArea').innerHTML = '';
    loadConversations(); loadChatMessages(activeChatStudentId); closeDeleteModal();
    document.getElementById('chatHeader').style.display = 'none';
    document.getElementById('chatInputArea').classList.remove('show-flex');
    document.getElementById('chatInputArea').classList.add('hide-element');
    document.getElementById('chatMessagesArea').innerHTML = `<div class="empty-chat"><i class="far fa-comments fa-4x mb-4" style="color:#cbd5e1;"></i><p style="font-size:1.1rem;">اختر طالباً للبدء بالمراسلة</p><button class="mobile-only-element" style="margin-top:20px; border-radius:25px; padding:10px 20px; font-weight:bold; background:var(--primary-color, #007bff); color:white; border:none; align-items:center; gap:8px;" onclick="document.getElementById('chatSidebar').classList.add('show-contacts')"><i class="fas fa-users"></i> إظهار قائمة الطلاب</button></div>`;
}

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert('المتصفح لا يدعم التسجيل'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream); audioChunks = [];
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const reader = new FileReader();
            reader.onload = function(e) { sendVoiceMessage(e.target.result); };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start(); 
        document.getElementById('recordingArea').classList.remove('hide-element');
        document.getElementById('recordingArea').classList.add('show-flex');
        recordingStartTime = Date.now(); recordingInterval = setInterval(updateRecordTimer, 1000); updateRecordTimer();
    }).catch(() => alert('تعذر الوصول للمايكروفون'));
}
function updateRecordTimer() { const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000); const mins = Math.floor(elapsed / 60).toString().padStart(2, '0'); const secs = (elapsed % 60).toString().padStart(2, '0'); document.getElementById('recordTimer').textContent = `${mins}:${secs}`; }
function stopRecording() { 
    if (mediaRecorder && mediaRecorder.state === 'recording') { 
        mediaRecorder.stop(); clearInterval(recordingInterval); 
        document.getElementById('recordingArea').classList.remove('show-flex');
        document.getElementById('recordingArea').classList.add('hide-element');
    } 
}
function cancelRecording() { 
    if (mediaRecorder && mediaRecorder.state === 'recording') { 
        mediaRecorder.onstop = null; mediaRecorder.stop(); clearInterval(recordingInterval); 
        document.getElementById('recordingArea').classList.remove('show-flex');
        document.getElementById('recordingArea').classList.add('hide-element');
    } 
}
function sendVoiceMessage(base64Audio) {
    if (!activeChatStudentId) return; const currentUser = getCurrentUser();
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); teacherMsgs.push({ id: Date.now(), teacherId: currentUser.id, studentId: activeChatStudentId, content: base64Audio, attachment: null, isVoice: true, sentAt: new Date().toISOString(), isRead: true, isFromStudent: false }); localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); studentMsgs.push({ id: Date.now() + 1, studentId: activeChatStudentId, teacherId: currentUser.id, content: base64Audio, attachment: null, isVoice: true, sentAt: new Date().toISOString(), isRead: false, isFromTeacher: true }); localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    loadChatMessages(activeChatStudentId); loadConversations();
}
function toggleMessageMenu(e, msgId) { e.stopPropagation(); document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); const menu = document.getElementById(`msgMenu_${msgId}`); if (menu) menu.style.display = 'block'; }
function deleteChatMessage(messageId) { if (!confirm('حذف هذه الرسالة؟')) return; let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); teacherMsgs = teacherMsgs.filter(m => m.id !== messageId); localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs)); let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); studentMsgs = studentMsgs.filter(m => m.id !== (messageId + 1)); localStorage.setItem('studentMessages', JSON.stringify(studentMsgs)); loadChatMessages(activeChatStudentId); loadConversations(); }
function startEditMessage(messageId) { 
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); const msg = messages.find(m => m.id === messageId); if (!msg || msg.isVoice) return; 
    const input = document.getElementById('chatInput'); input.value = msg.content; input.focus(); input.classList.add('editing'); editingMessageId = messageId; 
    const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'تحديث <i class="fas fa-check"></i>'; sendBtn.classList.add('update-mode'); 
    document.getElementById('cancelEditBtn').classList.remove('hide-element');
    document.getElementById('cancelEditBtn').classList.add('show-flex');
}
function cancelEdit() { 
    editingMessageId = null; const input = document.getElementById('chatInput'); input.value = ''; input.classList.remove('editing'); 
    const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'أرسل <i class="fas fa-paper-plane"></i>'; sendBtn.classList.remove('update-mode'); 
    document.getElementById('cancelEditBtn').classList.remove('show-flex');
    document.getElementById('cancelEditBtn').classList.add('hide-element');
}
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

function getStudentById(id) { 
    let students = JSON.parse(localStorage.getItem('students') || '[]'); 
    let s = students.find(s => s.id == id); 
    if(!s) { 
        const users = JSON.parse(localStorage.getItem('users') || '[]'); 
        s = users.find(u => u.id == id && u.role === 'student'); 
    } 
    return s; 
}

function showNewMessageModal() { const currentUser = getCurrentUser(); const recipientSelect = document.getElementById('messageRecipient'); if(recipientSelect) { loadStudentsForMessaging(); document.getElementById('newMessageModal').classList.add('show'); } else { alert("يرجى اختيار الطالب من القائمة."); } }
function loadStudentsForMessaging() { const recipientSelect = document.getElementById('messageRecipient'); if(!recipientSelect) return; const currentTeacher = getCurrentUser(); let allStudents = JSON.parse(localStorage.getItem('students') || '[]'); const allUsers = JSON.parse(localStorage.getItem('users') || '[]'); const studentUsers = allUsers.filter(u => u.role === 'student'); const merged = [...allStudents]; studentUsers.forEach(u => { if(!merged.find(s => s.id == u.id)) merged.push(u); }); const myStudents = merged.filter(s => s.teacherId == currentTeacher.id); recipientSelect.innerHTML = '<option value="">اختر الطالب</option>'; myStudents.forEach(s => { recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`; }); }

window.showNewMessageModal = showNewMessageModal; 
window.sendNewMessage = function() { const sId = document.getElementById('messageRecipient').value; if(sId) { document.getElementById('newMessageModal').classList.remove('show'); openChat(parseInt(sId)); } }; 
window.closeNewMessageModal = function() { document.getElementById('newMessageModal').classList.remove('show'); };
window.deleteEntireConversation = deleteEntireConversation;
window.exportChatToPDF = exportChatToPDF;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteAction = confirmDeleteAction;

// ============================================
// 📁 المسار: assets/js/messages.js (المعلم - نسخة Supabase الكاملة)
// ============================================

let activeChatStudentId = null;
let attachmentData = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingStartTime = null;
let pendingDeleteMsgId = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('messages.html')) {
        try {
            injectFontAwesome();
            injectHtml2Pdf();
            cleanInterfaceAggressive(); 
            injectChatStyles(); 
            renderChatLayout(); 
            await loadConversations();
            
            document.addEventListener('click', function(e) {
                const popup = document.getElementById('emojiPopup');
                const btn = document.getElementById('emojiBtn');
                if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) {
                    popup.style.display = 'none';
                }
                if (!e.target.closest('.msg-options-btn')) {
                    document.querySelectorAll('.msg-dropdown').forEach(menu => menu.style.display = 'none');
                }
                const deleteConvoModal = document.getElementById('deleteConfirmModal');
                if (deleteConvoModal && e.target === deleteConvoModal) {
                    closeDeleteModal();
                }
            });
        } catch (e) { console.error(e); }
    }
});

// ==========================================
// دوال بناء الواجهة (UI Injection)
// ==========================================
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
        .chat-item.active .chat-name { color: #fff !important; }
        .chat-item.active .chat-preview { color: #e0e0e0 !important; }
        .chat-item.active .avatar { background: #fff; color: #007bff; border: 2px solid #007bff; }
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; flex-shrink: 0; }
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
        .msg-image-wrapper { margin-bottom: 5px; }
        .msg-image-wrapper img { width: 100%; max-width: 300px; border-radius: 8px; display: block; border: 1px solid rgba(0,0,0,0.1); }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; display: block; text-decoration: none; color: inherit; border: 1px solid rgba(0,0,0,0.05); transition: 0.2s; }
        .msg-attachment:hover { background: rgba(0,0,0,0.1); }
        .msg-options-btn { position: absolute; top: 5px; left: 8px; color: inherit; opacity: 0.6; cursor: pointer; padding: 2px 5px; font-size: 1.1rem; transition: 0.2s; }
        .msg-options-btn:hover { opacity: 1; background: rgba(0,0,0,0.1); border-radius: 50%; }
        .msg-dropdown { position: absolute; top: 30px; right: calc(100% - 35px) !important; left: auto !important; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); min-width: 140px; z-index: 100; display: none; overflow: hidden; border: 1px solid #eee; }
        .msg-dropdown-item { padding: 12px 25px 12px 15px !important; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: 0.2s; white-space: nowrap; }
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
        .attachment-preview { position: absolute; bottom: 85px; left: 20px; right: 20px; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 -5px 25px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; display: none; z-index: 100; text-align: center; }
        .emoji-popup { position: absolute; bottom: 85px; right: 20px; width: 320px; height: 250px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: none; padding: 10px; grid-template-columns: repeat(7, 1fr); gap: 5px; overflow-y: auto; z-index: 100; }
        .emoji-item { font-size: 1.4rem; cursor: pointer; text-align: center; padding: 5px; border-radius: 5px; transition: 0.2s; }
        .emoji-item:hover { background: #f1f5f9; transform: scale(1.2); }
        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 20000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
        .custom-modal-box { background: #fff; padding: 25px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .modal-icon-danger { width: 60px; height: 60px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 15px; }
        .modal-title { font-size: 1.2rem; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
        .modal-desc { color: #6b7280; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.5; }
        .modal-actions { display: flex; gap: 10px; justify-content: center; }
        .btn-modal { flex: 1; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; border: none; transition: 0.2s; font-size: 0.95rem; }
        .btn-modal-cancel { background: #f3f4f6; color: #374151; }
        .btn-modal-cancel:hover { background: #e5e7eb; }
        .btn-modal-delete { background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-modal-delete:hover { background: #b91c1c; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
        .mobile-only-btn { display: none; }
        @media (max-width: 768px) { 
            .mobile-only-btn { display: inline-block !important; background: transparent !important; border: none !important; font-size: 1.2rem !important; color: #333 !important; margin: 0 10px !important; cursor: pointer !important; padding: 0 !important; }
            .chat-container { height: calc(100dvh - 160px) !important; max-height: 85dvh !important; margin-bottom: 0 !important; border-radius: 0 !important; border: none !important; box-shadow: none !important; }
            .chat-main { display: flex !important; flex-direction: column !important; height: 100% !important; overflow: hidden !important; }
            .messages-area { flex: 1 1 0% !important; overflow-y: auto !important; padding: 15px !important; }
            .chat-sidebar { position: fixed !important; right: -100% !important; top: 0 !important; height: 100% !important; width: 280px !important; z-index: 9999 !important; transition: right 0.3s ease !important; box-shadow: -4px 0 15px rgba(0,0,0,0.1) !important; }
            .chat-sidebar.show-contacts { right: 0 !important; }
            .chat-header { flex-shrink: 0 !important; padding: 5px 10px !important; height: 60px !important; flex-wrap: nowrap !important; }
            .chat-header .avatar { width: 35px !important; height: 35px !important; font-size: 0.9rem !important; margin-left: 8px !important; flex-shrink: 0 !important; }
            .header-actions { flex-shrink: 0 !important; margin-right: 5px !important; }
            .btn-pdf-chat { display: none !important; }
            .btn-delete-chat { background: transparent !important; color: #dc2626 !important; box-shadow: none !important; width: auto !important; height: auto !important; font-size: 1.4rem !important; padding: 5px !important; }
            .chat-input-area { flex-shrink: 0 !important; display: flex !important; flex-wrap: wrap !important; justify-content: flex-start !important; padding: 10px !important; padding-bottom: 20px !important; gap: 8px !important; background: #f0f2f5 !important; box-sizing: border-box !important; }
            .chat-input { order: 1 !important; flex: 1 1 0% !important; margin: 0 !important; min-width: 100px !important; border-radius: 20px !important; }
            .btn-mic { order: 2 !important; margin: 0 !important; flex-shrink: 0 !important; }
            #sendBtn, #cancelEditBtn { order: 3 !important; margin: 0 !important; flex-shrink: 0 !important; }
            .chat-input-area::after { content: "" !important; width: 100% !important; order: 4 !important; display: block !important; height: 0 !important; }
            #emojiBtn { order: 5 !important; margin-right: auto !important; }
            .btn-attach { order: 6 !important; }
            .btn-cam { order: 7 !important; }
            #emojiBtn, .btn-attach, .btn-cam { display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 8px !important; width: 40px !important; height: 40px !important; font-size: 1.2rem !important; background: #fff !important; color: #555 !important; border: 1px solid #ddd !important; box-shadow: none !important; margin: 0 !important; cursor: pointer !important; }
            .attachment-preview { bottom: 130px; left: 10px; right: 10px; padding: 10px; }
            .emoji-popup { width: 90vw !important; right: 5vw !important; grid-template-columns: repeat(6, 1fr) !important; bottom: 130px !important; }
        }
    `;
    document.head.appendChild(style);
}

function renderChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    container.className = '';
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','👻','💀','☠️','👽','👾','🤖','🎃','😺','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','✅','❎','🌐','💠','Ⓜ️','🌀','💤','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-list-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <button class="btn btn-primary w-100" onclick="showNewMessageModal()" style="font-weight:bold; border-radius:25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <i class="fas fa-plus"></i> محادثة جديدة
                    </button>
                    <button class="mobile-only-btn" onclick="document.querySelector('.chat-sidebar').classList.remove('show-contacts')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chat-list" id="chatContactsList"></div>
            </div>
            <div class="chat-main">
                <div class="chat-header" id="chatHeader" style="display:none;">
                    <div style="display:flex; align-items:center;">
                        <button class="mobile-only-btn" onclick="document.querySelector('.chat-sidebar').classList.add('show-contacts')">
                            <i class="fas fa-users"></i>
                        </button>
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
                        <button class="mobile-only-btn" style="margin-top:20px; border-radius:25px; padding:10px 20px; font-weight:bold; background:var(--primary-color, #007bff); color:white;" onclick="document.querySelector('.chat-sidebar').classList.add('show-contacts')">
                            👥 إظهار قائمة الطلاب
                        </button>
                    </div>
                </div>
                
                <div id="attachmentPreviewBox" class="attachment-preview">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px;">
                        <strong style="font-size:0.9rem; color:#007bff;"><i class="fas fa-paperclip"></i> المرفق المحدد</strong>
                        <i class="fas fa-times-circle" style="color:#dc3545; cursor:pointer; font-size: 1.2rem;" onclick="clearAttachment()"></i>
                    </div>
                    <div id="attachPreviewContent">
                        <img id="attachPreviewImg" src="" style="display:none; max-width: 100%; max-height: 150px; border-radius: 8px; margin: 0 auto;">
                        <div id="attachName" style="font-size:0.85rem; color:#555; margin-top: 5px; word-break: break-all;"></div>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.8rem; color: #888;">اكتب تعليقاً في الأسفل ثم اضغط إرسال</div>
                </div>

                <div id="emojiPopup" class="emoji-popup">${emojiHtml}</div>
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
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالتك أو تعليقك..." onkeypress="handleEnter(event)">
                    <button class="btn-tool btn-mic" onclick="startRecording()" title="تسجيل صوتي"><i class="fas fa-microphone"></i></button>
                    <button class="btn-tool" onclick="cancelEdit()" id="cancelEditBtn" style="display:none; background:#ffebee; color:red;" title="إلغاء التعديل"><i class="fas fa-times"></i></button>
                    <button class="btn-send-pill" id="sendBtn" onclick="sendChatMessage()">أرسل <i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>

        <div id="deleteConfirmModal" class="custom-modal-overlay">
            <div class="custom-modal-box">
                <div class="modal-icon-danger"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="modal-title">حذف المحادثة؟</div>
                <div class="modal-desc">هل أنت متأكد من رغبتك في حذف سجل المحادثة بالكامل؟<br><span style="color:#dc2626; font-size:0.85rem;">⚠️ لا يمكن التراجع عن هذا الإجراء</span></div>
                <div class="modal-actions">
                    <button class="btn-modal btn-modal-cancel" onclick="closeDeleteModal()">إلغاء</button>
                    <button class="btn-modal btn-modal-delete" onclick="confirmDeleteAction()"><i class="fas fa-trash-alt"></i> نعم، حذف</button>
                </div>
            </div>
        </div>

        <div id="deleteSingleMsgModal" class="custom-modal-overlay" style="z-index: 100000;">
            <div class="custom-modal-box">
                <div class="modal-icon-danger" style="font-size:2.5rem; width:50px; height:50px;"><i class="fas fa-trash-alt"></i></div>
                <div class="modal-title">تأكيد الحذف</div>
                <div class="modal-desc">هل أنت متأكد من حذف هذه الرسالة نهائياً؟<br>لا يمكن التراجع عن هذا الإجراء.</div>
                <div class="modal-actions">
                    <button class="btn-modal btn-modal-cancel" onclick="closeSingleDeleteModal()">إلغاء</button>
                    <button class="btn-modal btn-modal-delete" onclick="executeSingleMessageDelete()">نعم، احذفها</button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// دوال الاتصال بقاعدة البيانات (Supabase)
// ==========================================
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')); }

async function loadConversations() {
    const currentUser = getCurrentUser();
    try {
        const { data: messages, error } = await window.supabase.from('messages').select('*').eq('teacherId', currentUser.id).order('sentAt', { ascending: true });
        if (error) throw error;

        const conversations = {};
        (messages || []).forEach(msg => {
            if (!conversations[msg.studentId]) conversations[msg.studentId] = { studentId: msg.studentId, lastMessage: msg, unreadCount: 0 };
            if (new Date(msg.sentAt) > new Date(conversations[msg.studentId].lastMessage.sentAt)) conversations[msg.studentId].lastMessage = msg;
            if (!msg.isFromTeacher && !msg.isRead) conversations[msg.studentId].unreadCount++;
        });

        const sortedConvos = Object.values(conversations).sort((a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt));
        renderSidebar(sortedConvos);
    } catch(e) { console.error("Error loading convos:", e); }
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList');
    listEl.innerHTML = '';
    if (conversations.length === 0) { listEl.innerHTML = '<div class="text-center p-4 text-muted"><small>لا توجد محادثات نشطة</small></div>'; return; }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    conversations.forEach(convo => {
        const student = users.find(u => u.id == convo.studentId);
        const name = student ? student.name : 'طالب';
        const activeClass = activeChatStudentId === convo.studentId ? 'active' : '';
        const unreadHtml = convo.unreadCount > 0 ? `<span class="unread-badge">${convo.unreadCount}</span>` : '';
        const timeStr = new Date(convo.lastMessage.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
        
        const html = `<div class="chat-item ${activeClass}" onclick="openChat(${convo.studentId}, '${name}')">
            <div class="avatar">${name.charAt(0)}</div>
            <div class="chat-info">
                <div class="chat-name"><span>${name}</span> <span style="font-size:0.7rem; font-weight:normal; color:inherit;">${timeStr}</span></div>
                <div class="chat-preview">${unreadHtml} ${convo.lastMessage.isVoice ? '🎤 تسجيل صوتي' : (convo.lastMessage.attachment ? '📎 مرفق أو صورة' : convo.lastMessage.content)}</div>
            </div></div>`;
        listEl.innerHTML += html;
    });
}

async function openChat(studentId, studentName) {
    activeChatStudentId = studentId;
    cancelEdit();
    const sidebar = document.querySelector('.chat-sidebar');
    if(sidebar) sidebar.classList.remove('show-contacts');

    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'flex';
    document.getElementById('chatHeaderName').textContent = studentName || 'طالب';
    document.getElementById('chatHeaderAvatar').textContent = (studentName || '?').charAt(0);
    
    await loadChatMessages(studentId);
    await loadConversations();
}

async function loadChatMessages(studentId) {
    const currentUser = getCurrentUser();
    try {
        const { data: chatMsgs, error } = await window.supabase.from('messages').select('*').eq('teacherId', currentUser.id).eq('studentId', studentId).order('sentAt', { ascending: true });
        if (error) throw error;

        const area = document.getElementById('chatMessagesArea');
        area.innerHTML = '';
        let unreadIds = [];

        (chatMsgs || []).forEach(msg => {
            const isMe = msg.isFromTeacher; 
            const bubbleClass = isMe ? 'msg-me' : 'msg-other';
            let contentHtml = msg.content;
            let attachHtml = '';

            if (msg.isVoice) {
                contentHtml = `<div style="display:flex; align-items:center; gap:5px;"><audio controls src="${msg.content}"></audio></div>`;
            } else if (msg.attachment) {
                const isImg = msg.attachment.startsWith('data:image');
                if (isImg) {
                    let caption = (contentHtml && contentHtml !== 'مرفق' && contentHtml !== '📎 مرفق') ? `<div style="margin-top:8px; font-size:0.95rem;">${contentHtml}</div>` : '';
                    contentHtml = `<div class="msg-image-wrapper"><img src="${msg.attachment}" onclick="window.open('${msg.attachment}', '_blank')" style="cursor:pointer;" alt="صورة مرسلة"></div>${caption}`;
                } else {
                    attachHtml = `<a href="${msg.attachment}" download="file" class="msg-attachment"><i class="fas fa-file-download"></i> تحميل المرفق</a>`;
                    if (contentHtml === 'مرفق' || contentHtml === '📎 مرفق') contentHtml = '';
                    else if (contentHtml) contentHtml = `<div style="margin-top:5px;">${contentHtml}</div>`;
                    contentHtml = attachHtml + contentHtml;
                }
            }

            let menuHtml = '';
            if (isMe) {
                menuHtml = `<div class="msg-options-btn" onclick="toggleMessageMenu(event, ${msg.id})">⋮</div>
                <div class="msg-dropdown" id="msgMenu_${msg.id}">
                    ${!msg.isVoice ? `<div class="msg-dropdown-item" onclick="startEditMessage(${msg.id}, '${msg.content}')"><i class="fas fa-pen"></i> تعديل</div>` : ''}
                    <div class="msg-dropdown-item delete" onclick="deleteChatMessage(${msg.id})"><i class="fas fa-trash"></i> حذف</div>
                </div>`;
            }

            const html = `<div class="msg-bubble ${bubbleClass}">${menuHtml} ${contentHtml} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
            area.innerHTML += html;
            
            if (!msg.isFromTeacher && !msg.isRead) unreadIds.push(msg.id);
        });

        if (unreadIds.length > 0) {
            await window.supabase.from('messages').update({ isRead: true }).in('id', unreadIds);
        }
        
        area.scrollTop = area.scrollHeight;
    } catch(e) { console.error(e); }
}

async function sendChatMessage(base64Audio = null) {
    if (!activeChatStudentId) return; 
    
    const input = document.getElementById('chatInput'); 
    const content = base64Audio ? base64Audio : input.value.trim();
    if (!content && !attachmentData) return;
    
    const currentUser = getCurrentUser();
    const isVoice = base64Audio !== null;

    if (editingMessageId && !isVoice) {
        try {
            let updateData = { content: content };
            if (attachmentData) updateData.attachment = attachmentData;
            await window.supabase.from('messages').update(updateData).eq('id', editingMessageId);
            cancelEdit(); 
            await loadChatMessages(activeChatStudentId); 
            await loadConversations();
            return;
        } catch(e) { console.error(e); return; }
    }

    const newMessage = {
        id: Date.now(),
        teacherId: currentUser.id,
        studentId: activeChatStudentId,
        content: content || (attachmentData ? '📎 مرفق' : ''),
        attachment: attachmentData,
        isVoice: isVoice,
        isFromTeacher: true,
        isRead: false
    };

    try {
        await window.supabase.from('messages').insert([newMessage]);
        if(!isVoice) { input.value = ''; clearAttachment(); document.getElementById('emojiPopup').style.display = 'none'; }
        await loadChatMessages(activeChatStudentId); 
        await loadConversations();
    } catch(e) { console.error(e); alert('فشل الإرسال'); }
}

function deleteEntireConversation() { if (!activeChatStudentId) return; document.getElementById('deleteConfirmModal').style.display = 'flex'; }
function closeDeleteModal() { document.getElementById('deleteConfirmModal').style.display = 'none'; }
async function confirmDeleteAction() {
    if (!activeChatStudentId) return;
    const currentUser = getCurrentUser();
    try {
        await window.supabase.from('messages').delete().eq('teacherId', currentUser.id).eq('studentId', activeChatStudentId);
        document.getElementById('chatMessagesArea').innerHTML = '';
        await loadConversations(); 
        await loadChatMessages(activeChatStudentId); 
        closeDeleteModal();
        document.getElementById('chatHeader').style.display = 'none';
        document.getElementById('chatInputArea').style.display = 'none';
        document.getElementById('chatMessagesArea').innerHTML = `<div class="empty-chat"><i class="far fa-comments fa-4x mb-4" style="color:#cbd5e1;"></i><p style="font-size:1.1rem;">اختر طالباً للبدء بالمراسلة</p></div>`;
    } catch(e) { console.error(e); }
}

function deleteChatMessage(messageId) { pendingDeleteMsgId = messageId; document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); document.getElementById('deleteSingleMsgModal').style.display = 'flex'; }
function closeSingleDeleteModal() { pendingDeleteMsgId = null; document.getElementById('deleteSingleMsgModal').style.display = 'none'; }
async function executeSingleMessageDelete() {
    if (!pendingDeleteMsgId || !activeChatStudentId) return;
    try {
        await window.supabase.from('messages').delete().eq('id', pendingDeleteMsgId);
        closeSingleDeleteModal();
        await loadChatMessages(activeChatStudentId); 
        await loadConversations();
    } catch(e) { console.error(e); }
}

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert('المتصفح لا يدعم التسجيل'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream); audioChunks = [];
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const reader = new FileReader();
            reader.onload = function(e) { sendChatMessage(e.target.result); };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start(); document.getElementById('recordingArea').style.display = 'flex';
        recordingStartTime = Date.now(); recordingInterval = setInterval(updateRecordTimer, 1000); updateRecordTimer();
    }).catch(() => alert('تعذر الوصول للمايكروفون'));
}
function updateRecordTimer() { const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000); const mins = Math.floor(elapsed / 60).toString().padStart(2, '0'); const secs = (elapsed % 60).toString().padStart(2, '0'); document.getElementById('recordTimer').textContent = `${mins}:${secs}`; }
function stopRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); clearInterval(recordingInterval); document.getElementById('recordingArea').style.display = 'none'; } }
function cancelRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.onstop = null; mediaRecorder.stop(); clearInterval(recordingInterval); document.getElementById('recordingArea').style.display = 'none'; } }

function handleEnter(e) { if (e.key === 'Enter') sendChatMessage(); }
function cancelEdit() { editingMessageId = null; const input = document.getElementById('chatInput'); input.value = ''; input.classList.remove('editing'); const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'أرسل <i class="fas fa-paper-plane"></i>'; sendBtn.classList.remove('update-mode'); document.getElementById('cancelEditBtn').style.display = 'none'; }
function toggleMessageMenu(e, msgId) { e.stopPropagation(); document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); const menu = document.getElementById(`msgMenu_${msgId}`); if (menu) menu.style.display = 'block'; }
function startEditMessage(id, content) { editingMessageId = id; const input = document.getElementById('chatInput'); input.value = content; input.focus(); input.classList.add('editing'); document.getElementById('sendBtn').innerHTML = 'تحديث <i class="fas fa-check"></i>'; document.getElementById('sendBtn').classList.add('update-mode'); document.getElementById('cancelEditBtn').style.display = 'block'; }
function clearAttachment() { attachmentData = null; document.getElementById('attachmentPreviewBox').style.display = 'none'; document.getElementById('chatFileInput').value = ''; document.getElementById('chatCamInput').value = ''; }
function readFileAsBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error); reader.readAsDataURL(file); }); }
async function handleChatAttachment(input) { if (input.files && input.files[0]) { attachmentData = await readFileAsBase64(input.files[0]); document.getElementById('attachmentPreviewBox').style.display = 'block'; document.getElementById('chatInput').focus(); } }

function exportChatToPDF() {
    if (!activeChatStudentId) return;
    const name = document.getElementById('chatHeaderName').textContent;
    const element = document.getElementById('chatMessagesArea');
    const opt = { margin: 0.5, filename: `محادثة_${name}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    if (window.html2pdf) {
        const clone = element.cloneNode(true);
        clone.style.background = 'white'; clone.style.height = 'auto'; clone.style.overflow = 'visible'; clone.style.padding = '20px';
        clone.querySelectorAll('.msg-options-btn, .msg-dropdown').forEach(el => el.remove());
        clone.querySelectorAll('audio').forEach(audio => { const ph = document.createElement('div'); ph.innerHTML = '<span style="color:#555; font-size:0.9rem; border:1px solid #ccc; padding:2px 8px; border-radius:10px; background:#f9f9f9;">🎤 رسالة صوتية</span>'; if(audio.parentNode) audio.parentNode.replaceChild(ph, audio); });
        html2pdf().set(opt).from(clone).save();
    } else alert("جاري تحميل أداة التصدير...");
}

function toggleEmojiPopup() { const popup = document.getElementById('emojiPopup'); if (popup.style.display === 'none') popup.style.display = 'grid'; else popup.style.display = 'none'; }
function addEmoji(char) { const input = document.getElementById('chatInput'); input.value += char; input.focus(); }

window.sendChatMessage = sendChatMessage;
window.executeSingleMessageDelete = executeSingleMessageDelete;
window.deleteChatMessage = deleteChatMessage;
window.closeSingleDeleteModal = closeSingleDeleteModal;
window.startEditMessage = startEditMessage;
window.cancelEdit = cancelEdit;
window.handleChatAttachment = handleChatAttachment;
window.clearAttachment = clearAttachment;
window.openChat = openChat;
window.deleteEntireConversation = deleteEntireConversation;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteAction = confirmDeleteAction;
window.exportChatToPDF = exportChatToPDF;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.cancelRecording = cancelRecording;
window.toggleEmojiPopup = toggleEmojiPopup;
window.addEmoji = addEmoji;
// ==========================================
// دوال نافذة "محادثة جديدة" للمعلم
// ==========================================

async function showNewMessageModal() { 
    const currentUser = getCurrentUser(); 
    const recipientSelect = document.getElementById('messageRecipient'); 
    
    if(recipientSelect) { 
        // عرض حالة التحميل
        recipientSelect.innerHTML = '<option value="">جاري تحميل القائمة...</option>';
        document.getElementById('newMessageModal').classList.add('show'); 
        
        // جلب قائمة الطلاب المرتبطين بالمعلم من السحابة
        await loadStudentsForMessaging(currentUser.id); 
    } else { 
        alert("خطأ: لم يتم العثور على قائمة الطلاب في الواجهة."); 
    } 
}

async function loadStudentsForMessaging(teacherId) { 
    const recipientSelect = document.getElementById('messageRecipient'); 
    if(!recipientSelect) return; 
    
    try {
        const { data: myStudents, error } = await window.supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('teacherId', teacherId);

        if (error) throw error;

        recipientSelect.innerHTML = '<option value="">اختر الطالب</option>'; 
        
        if (myStudents && myStudents.length > 0) {
            myStudents.forEach(s => { 
                recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`; 
            }); 
        } else {
            recipientSelect.innerHTML = '<option value="" disabled>لا يوجد طلاب مسجلين لديك</option>'; 
        }
    } catch (e) {
        console.error("Error loading students for messages:", e);
        recipientSelect.innerHTML = '<option value="">حدث خطأ أثناء جلب الطلاب</option>'; 
    }
}

function closeNewMessageModal() { 
    document.getElementById('newMessageModal').classList.remove('show'); 
}

async function sendNewMessage() { 
    const select = document.getElementById('messageRecipient');
    const sId = select.value; 
    
    if(sId) { 
        const studentName = select.options[select.selectedIndex].text;
        closeNewMessageModal(); 
        
        // فتح المحادثة وتمرير اسم الطالب
        await openChat(parseInt(sId), studentName); 
    } else {
        alert("يرجى اختيار طالب أولاً.");
    }
}

// تصدير الدوال لتتعرف عليها أزرار الـ HTML
window.showNewMessageModal = showNewMessageModal; 
window.sendNewMessage = sendNewMessage; 
window.closeNewMessageModal = closeNewMessageModal;

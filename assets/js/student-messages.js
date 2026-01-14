// ============================================
// 📁 المسار: assets/js/student-messages.js
// الوصف: شات الطالب (أيقونات ملونة + مايكروفون قبل الإرسال)
// ============================================

let attachmentData = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingStartTime = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        injectChatStyles();
        renderStudentChatLayout();
        loadChatWithTeacher();
        
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
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// نفس ستايل المعلم (Solid Colors)
function injectChatStyles() {
    if (document.getElementById('chatStyles')) return;
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 10px; font-family: 'Tajawal', sans-serif; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 15px; }
        
        .msg-bubble { max-width: 75%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        
        audio { height: 35px; width: 220px; margin-top: 5px; border-radius: 20px; outline: none; }
        .msg-me audio { filter: invert(1) grayscale(1) brightness(2); }

        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display:block; text-align:left; }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; text-decoration: none; color: inherit; }
        .msg-attachment img { max-width: 100%; border-radius: 5px; }

        .msg-options-btn { position: absolute; top: 5px; left: 8px; color: inherit; opacity: 0.6; cursor: pointer; padding: 2px 5px; font-size: 1.1rem; }
        .msg-options-btn:hover { opacity: 1; }
        .msg-dropdown { position: absolute; top: 25px; left: 5px; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); width: 120px; z-index: 100; display: none; overflow: hidden; border: 1px solid #eee; }
        .msg-dropdown-item { padding: 10px 15px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.1s; }
        .msg-dropdown-item:hover { background: #f8f9fa; color: #007bff; }
        .msg-dropdown-item.delete:hover { color: #dc3545; background: #fff5f5; }

        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; min-height: 80px; }
        
        /* 🔥 الأزرار الملونة والواضحة 🔥 */
        .btn-tool { 
            width: 42px; height: 42px; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 1.2rem; cursor: pointer; transition: 0.2s; border: none;
            color: white; /* أيقونة بيضاء */
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        .btn-tool:hover { transform: translateY(-2px); box-shadow: 0 5px 10px rgba(0,0,0,0.2); }
        
        .btn-emoji { background: #f59e0b; } /* برتقالي غامق */
        .btn-attach { background: #546e7a; } /* رمادي مزرق */
        .btn-cam { background: #007bff; }    /* أزرق */
        .btn-mic { background: #d32f2f; }    /* أحمر */

        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; background: #f8fafc; margin: 0 5px; }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        .chat-input.editing { border-color: #f59e0b; background: #fffbeb; }

        .btn-send-pill { background-color: #28a745; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-size: 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(40, 167, 69, 0.2); }
        .btn-send-pill:hover { background-color: #218838; transform: translateY(-1px); }
        .btn-send-pill.update-mode { background-color: #f59e0b; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2); }

        .recording-area {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #fff; display: none; align-items: center; justify-content: space-between;
            padding: 0 20px; z-index: 50; border-radius: 12px;
        }
        .recording-timer { font-weight: bold; color: #d32f2f; font-size: 1.1rem; display:flex; align-items:center; gap:10px; }
        .recording-wave { width: 12px; height: 12px; background: #d32f2f; border-radius: 50%; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

        .attachment-preview { position: absolute; bottom: 85px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: none; z-index: 10; }
        .emoji-popup { position: absolute; bottom: 80px; right: 20px; width: 320px; height: 250px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: none; padding: 10px; grid-template-columns: repeat(7, 1fr); gap: 5px; overflow-y: auto; z-index: 100; }
        .emoji-item { font-size: 1.4rem; cursor: pointer; text-align: center; padding: 5px; border-radius: 5px; transition: 0.2s; }
        .emoji-item:hover { background: #f1f5f9; transform: scale(1.2); }
        
        @media (max-width: 768px) { .chat-container { height: 85vh; margin-top: 0; } }
    `;
    document.head.appendChild(style);
}

function renderStudentChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    container.className = '';
    
    // فيسات منقحة
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','✅','❌','❓','❗️','✔️','🆗'];
    const emojiHtml = emojis.map(e => `<div class="emoji-item" onclick="addEmoji('${e}')">${e}</div>`).join('');

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-main">
                <div class="chat-header" style="padding:15px; border-bottom:1px solid #eee; background:#fff; display:flex; align-items:center;">
                    <div style="width:40px; height:40px; background:#eff6ff; color:#007bff; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-left:10px; font-size:1.2rem;">👨‍🏫</div>
                    <div>
                        <span style="font-weight:bold; display:block; color:#1e293b;">معلمي</span>
                        <span style="font-size:0.75rem; color:#64748b;">المشرف على الخطة</span>
                    </div>
                </div>
                
                <div class="messages-area" id="studentChatArea">
                    <div class="text-center text-muted mt-5">جاري التحميل...</div>
                </div>

                <div id="attachmentPreviewBox" class="attachment-preview">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="font-size:0.8rem;">معاينة</strong>
                        <i class="fas fa-times" style="color:red; cursor:pointer;" onclick="clearAttachment()"></i>
                    </div>
                    <span id="attachName" style="font-size:0.85rem; color:#555;"></span>
                </div>

                <div id="emojiPopup" class="emoji-popup">
                    ${emojiHtml}
                </div>

                <div class="chat-input-area">
                    <div class="recording-area" id="recordingArea">
                        <div class="recording-timer">
                            <div class="recording-wave"></div>
                            <span id="recordTimer">00:00</span>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-tool" style="background:#ffebee; color:red;" onclick="cancelRecording()"><i class="fas fa-times"></i></button>
                            <button class="btn-tool" style="background:#e8f5e9; color:green;" onclick="stopRecording()"><i class="fas fa-check"></i></button>
                        </div>
                    </div>

                    <button id="emojiBtn" class="btn-tool btn-emoji" onclick="toggleEmojiPopup()" title="رموز">
                        <i class="far fa-smile"></i>
                    </button>
                    
                    <label class="btn-tool btn-attach" title="ملف">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    
                    <label class="btn-tool btn-cam" title="كاميرا">
                        <i class="fas fa-camera"></i>
                        <input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)">
                    </label>

                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالة للمعلم..." onkeypress="handleEnter(event)">
                    
                    <button class="btn-tool btn-mic" onclick="startRecording()" title="تسجيل صوتي">
                        <i class="fas fa-microphone"></i>
                    </button>
                    
                    <button class="btn-tool" onclick="cancelEdit()" id="cancelEditBtn" style="display:none; background:#ffebee; color:red;" title="إلغاء"><i class="fas fa-times"></i></button>

                    <button class="btn-send-pill" id="sendBtn" onclick="sendToTeacher()">
                        أرسل <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ... (بقية منطق الطالب: نفس منطق المعلم مع تغييرات studentId/teacherId) ...

function getMyTeacherId() {
    const me = getCurrentUser();
    if (me.teacherId) return me.teacherId;
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    return teachers.length > 0 ? teachers[0].id : null;
}

function loadChatWithTeacher() {
    const teacherId = getMyTeacherId();
    if (!teacherId) {
        document.getElementById('studentChatArea').innerHTML = '<div class="text-center p-5">لا يوجد معلم مرتبط.</div>';
        return;
    }
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const currentUser = getCurrentUser();
    const myMsgs = messages.filter(m => m.studentId === currentUser.id);
    myMsgs.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    const area = document.getElementById('studentChatArea');
    area.innerHTML = '';
    if (myMsgs.length === 0) { area.innerHTML = '<div class="text-center text-muted mt-5"><i class="far fa-comments fa-3x mb-3" style="color:#cbd5e1;"></i><p>ابدأ المحادثة مع معلمك الآن</p></div>'; }
    myMsgs.forEach(msg => {
        const isMe = !msg.isFromTeacher;
        const bubbleClass = isMe ? 'msg-me' : 'msg-other';
        let contentHtml = msg.content;
        if (msg.isVoice) contentHtml = `<div style="display:flex; align-items:center; gap:5px;"><i class="fas fa-microphone"></i> <audio controls src="${msg.content}"></audio></div>`;
        let attachHtml = '';
        if (msg.attachment) { const isImg = msg.attachment.startsWith('data:image'); attachHtml = `<a href="${msg.attachment}" download="file" class="msg-attachment">${isImg ? `<img src="${msg.attachment}">` : ''} 📎 فتح</a>`; }
        let menuHtml = '';
        if (isMe) {
            menuHtml = `<div class="msg-options-btn" onclick="toggleMessageMenu(event, ${msg.id})">⋮</div>
            <div class="msg-dropdown" id="msgMenu_${msg.id}">
                ${!msg.isVoice ? `<div class="msg-dropdown-item" onclick="startEditMessage(${msg.id})"><i class="fas fa-pen"></i> تعديل</div>` : ''}
                <div class="msg-dropdown-item delete" onclick="deleteMessage(${msg.id})"><i class="fas fa-trash"></i> حذف</div>
            </div>`;
        }
        const html = `<div class="msg-bubble ${bubbleClass}">${menuHtml} ${contentHtml} ${attachHtml} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
        area.innerHTML += html;
        if (msg.isFromTeacher && !msg.isRead) msg.isRead = true;
    });
    localStorage.setItem('studentMessages', JSON.stringify(messages));
    area.scrollTop = area.scrollHeight;
}

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert('المتصفح لا يدعم التسجيل'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = function(e) { sendVoiceMessage(e.target.result); };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        document.getElementById('recordingArea').style.display = 'flex';
        recordingStartTime = Date.now();
        recordingInterval = setInterval(updateRecordTimer, 1000);
        updateRecordTimer();
    }).catch(() => alert('تعذر الوصول للمايكروفون'));
}
function updateRecordTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('recordTimer').textContent = `${mins}:${secs}`;
}
function stopRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); clearInterval(recordingInterval); document.getElementById('recordingArea').style.display = 'none'; } }
function cancelRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.onstop = null; mediaRecorder.stop(); clearInterval(recordingInterval); document.getElementById('recordingArea').style.display = 'none'; } }
function sendVoiceMessage(base64Audio) {
    const teacherId = getMyTeacherId(); if (!teacherId) return;
    const currentUser = getCurrentUser();
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    studentMsgs.push({ id: Date.now(), studentId: currentUser.id, teacherId: teacherId, content: base64Audio, attachment: null, isVoice: true, sentAt: new Date().toISOString(), isRead: true, isFromTeacher: false });
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    teacherMsgs.push({ id: Date.now() + 1, teacherId: teacherId, studentId: currentUser.id, content: base64Audio, attachment: null, isVoice: true, sentAt: new Date().toISOString(), isRead: false, isFromStudent: true });
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    loadChatWithTeacher();
}
function toggleMessageMenu(e, msgId) { e.stopPropagation(); document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); const menu = document.getElementById(`msgMenu_${msgId}`); if (menu) menu.style.display = 'block'; }
function deleteMessage(messageId) { if (!confirm('حذف هذه الرسالة؟')) return; let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); studentMsgs = studentMsgs.filter(m => m.id !== messageId); localStorage.setItem('studentMessages', JSON.stringify(studentMsgs)); let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); teacherMsgs = teacherMsgs.filter(m => m.id !== (messageId + 1)); localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs)); loadChatWithTeacher(); }
function startEditMessage(messageId) { const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]'); const msg = messages.find(m => m.id === messageId); if (!msg || msg.isVoice) return; const input = document.getElementById('chatInput'); input.value = msg.content; input.focus(); input.classList.add('editing'); editingMessageId = messageId; const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'تحديث <i class="fas fa-check"></i>'; sendBtn.classList.add('update-mode'); document.getElementById('cancelEditBtn').style.display = 'block'; }
function cancelEdit() { editingMessageId = null; const input = document.getElementById('chatInput'); input.value = ''; input.classList.remove('editing'); const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'أرسل <i class="fas fa-paper-plane"></i>'; sendBtn.classList.remove('update-mode'); document.getElementById('cancelEditBtn').style.display = 'none'; }
function handleChatAttachment(input) { if (input.files && input.files[0]) { const file = input.files[0]; const reader = new FileReader(); reader.onload = function(e) { attachmentData = e.target.result; document.getElementById('attachName').textContent = file.name; document.getElementById('attachmentPreviewBox').style.display = 'block'; }; reader.readAsDataURL(file); } }
function toggleEmojiPopup() { const popup = document.getElementById('emojiPopup'); if (popup.style.display === 'none') popup.style.display = 'grid'; else popup.style.display = 'none'; }
function addEmoji(char) { const input = document.getElementById('chatInput'); input.value += char; input.focus(); }
function clearAttachment() { attachmentData = null; document.getElementById('attachmentPreviewBox').style.display = 'none'; document.getElementById('chatFileInput').value = ''; document.getElementById('chatCamInput').value = ''; }
function sendToTeacher() {
    const teacherId = getMyTeacherId(); if (!teacherId) { alert('خطأ: لا يوجد معلم'); return; }
    const input = document.getElementById('chatInput'); const content = input.value.trim();
    if ((!content && !attachmentData)) return;
    if (editingMessageId) {
        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); const sIndex = studentMsgs.findIndex(m => m.id === editingMessageId); if (sIndex !== -1) { studentMsgs[sIndex].content = content; if (attachmentData) studentMsgs[sIndex].attachment = attachmentData; localStorage.setItem('studentMessages', JSON.stringify(studentMsgs)); }
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); const tIndex = teacherMsgs.findIndex(m => m.id === (editingMessageId + 1)); if (tIndex !== -1) { teacherMsgs[tIndex].content = content; if (attachmentData) teacherMsgs[tIndex].attachment = attachmentData; localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs)); }
        cancelEdit(); loadChatWithTeacher(); return;
    }
    const currentUser = getCurrentUser();
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); studentMsgs.push({ id: Date.now(), studentId: currentUser.id, teacherId: teacherId, content: content || (attachmentData ? 'مرفق' : ''), attachment: attachmentData, isVoice: false, sentAt: new Date().toISOString(), isRead: true, isFromTeacher: false }); localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); teacherMsgs.push({ id: Date.now() + 1, teacherId: teacherId, studentId: currentUser.id, content: content || (attachmentData ? 'مرفق' : ''), attachment: attachmentData, isVoice: false, sentAt: new Date().toISOString(), isRead: false, isFromStudent: true }); localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    input.value = ''; clearAttachment(); document.getElementById('emojiPopup').style.display = 'none'; loadChatWithTeacher();
}
function handleEnter(e) { if (e.key === 'Enter') sendToTeacher(); }

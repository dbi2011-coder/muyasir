// ============================================
// 📁 المسار: student-messages.js
// الوصف: شات الطالب (زر إرسال واضح + أدوات)
// ============================================

let attachmentData = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        injectChatStyles(); // نستخدم نفس الستايل المحدث
        renderStudentChatLayout();
        loadChatWithTeacher();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// نفس ستايل المعلم (يمكنك وضعه في ملف CSS مشترك لتجنب التكرار)
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
        
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display:block; }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; text-decoration: none; color: inherit; }
        .msg-attachment img { max-width: 100%; border-radius: 5px; display: block; }

        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 12px; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 10px; outline: none; font-size: 1rem; background: #f8fafc; }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        
        .btn-tool { color: #64748b; font-size: 1.3rem; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; }
        .btn-tool:hover { color: #007bff; }
        
        .btn-send-rect { background-color: #28a745; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(40, 167, 69, 0.2); }
        .btn-send-rect:hover { background-color: #218838; transform: translateY(-1px); }

        .attachment-preview { position: absolute; bottom: 85px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: none; z-index: 10; }
        
        @media (max-width: 768px) { .chat-container { height: 85vh; margin-top: 0; } }
    `;
    document.head.appendChild(style);
}

function renderStudentChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    
    // واجهة الطالب: شات مباشر مع المعلم (بدون قائمة جانبية)
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

                <div class="chat-input-area">
                    <button class="btn-tool" onclick="insertEmoji()" title="رموز">
                        <i class="far fa-smile"></i>
                    </button>
                    
                    <label class="btn-tool" title="ملف">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    
                    <label class="btn-tool" title="كاميرا">
                        <i class="fas fa-camera"></i>
                        <input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالة للمعلم..." onkeypress="handleEnter(event)">
                    
                    <button class="btn-send-rect" onclick="sendToTeacher()">
                        أرسل <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 2. المنطق
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
    
    if (myMsgs.length === 0) {
        area.innerHTML = '<div class="text-center text-muted mt-5"><i class="far fa-comments fa-3x mb-3" style="color:#cbd5e1;"></i><p>ابدأ المحادثة مع معلمك الآن</p></div>';
    }

    myMsgs.forEach(msg => {
        // أنا (يمين - أزرق) = !isFromTeacher
        const isMe = !msg.isFromTeacher;
        const bubbleClass = isMe ? 'msg-me' : 'msg-other';
        
        let attachHtml = '';
        if (msg.attachment) {
            const isImg = msg.attachment.startsWith('data:image');
            attachHtml = `<a href="${msg.attachment}" download="file" class="msg-attachment">${isImg ? `<img src="${msg.attachment}">` : ''} 📎 فتح</a>`;
        }

        const html = `<div class="msg-bubble ${bubbleClass}">${msg.content} ${attachHtml} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
        area.innerHTML += html;
        
        if (msg.isFromTeacher && !msg.isRead) msg.isRead = true;
    });
    
    localStorage.setItem('studentMessages', JSON.stringify(messages));
    area.scrollTop = area.scrollHeight;
}

// 3. الإرسال والأدوات
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

function sendToTeacher() {
    const teacherId = getMyTeacherId();
    if (!teacherId) { alert('خطأ: لا يوجد معلم'); return; }

    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content && !attachmentData) return;
    
    const currentUser = getCurrentUser();
    
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    studentMsgs.push({
        id: Date.now(), studentId: currentUser.id, teacherId: teacherId,
        content: content || (attachmentData ? 'مرفق' : ''), attachment: attachmentData,
        sentAt: new Date().toISOString(), isRead: true, isFromTeacher: false
    });
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    teacherMsgs.push({
        id: Date.now() + 1, teacherId: teacherId, studentId: currentUser.id,
        content: content || (attachmentData ? 'مرفق' : ''), attachment: attachmentData,
        sentAt: new Date().toISOString(), isRead: false, isFromStudent: true
    });
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    
    input.value = '';
    clearAttachment();
    loadChatWithTeacher();
}

function handleEnter(e) { if (e.key === 'Enter') sendToTeacher(); }

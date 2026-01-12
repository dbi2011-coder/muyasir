// ============================================
// 📁 المسار: student-messages.js
// الوصف: شات الطالب (مراسلة المعلم مباشرة)
// ============================================

let attachmentData = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        injectChatStyles(); // نستخدم نفس الستايل
        renderStudentChatLayout();
        loadChatWithTeacher();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// نفس دالة الستايل (لتجنب التكرار تأكد من نسخها أو وضعها في ملف مشترك)
// سأضع نسخة مختصرة هنا لضمان عمل الملف بشكل مستقل
function injectChatStyles() {
    if (document.getElementById('chatStyles')) return;
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        /* نفس الستايل السابق تماماً */
        .chat-container { display: flex; height: 75vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e0e0e0; margin-top: 20px; font-family: 'Tajawal', sans-serif; }
        .chat-sidebar { width: 300px; background: #f8f9fa; border-left: 1px solid #e0e0e0; display: flex; flex-direction: column; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f9f9f9; }
        
        .msg-bubble { max-width: 75%; padding: 12px 16px; border-radius: 18px; position: relative; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #333; border: 1px solid #eee; border-bottom-left-radius: 2px; }
        
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; text-align: left; }
        .msg-attachment { display:block; margin-top:5px; background:rgba(0,0,0,0.05); padding:5px; border-radius:5px; color:inherit; text-decoration:none; }
        .msg-attachment img { max-width:100%; border-radius:5px; }

        .chat-input-area { padding: 15px; border-top: 1px solid #e0e0e0; background: #fff; display: flex; align-items: center; gap: 10px; }
        .chat-input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 25px; outline: none; }
        .btn-send { width: 45px; height: 45px; background: #28a745; color: white; border: none; border-radius: 50%; cursor: pointer; }
        .btn-attach { font-size: 1.2rem; color: #555; cursor: pointer; padding: 5px; }
        
        .attachment-preview { position: absolute; bottom: 80px; right: 20px; background: white; padding: 10px; border: 1px solid #ccc; display: none; border-radius: 8px; }
        
        /* تكييف للهاتف */
        @media (max-width: 768px) {
            .chat-sidebar { display: none; } /* للطالب نخفي القائمة لأن لديه معلم واحد عادة */
        }
    `;
    document.head.appendChild(style);
}

function renderStudentChatLayout() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    container.className = '';
    
    // واجهة الطالب أبسط: محادثة واحدة مباشرة مع المعلم
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-main">
                <div class="chat-header" style="padding:15px; border-bottom:1px solid #eee; font-weight:bold; display:flex; align-items:center; background:#fff;">
                    <div style="width:40px; height:40px; background:#eee; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-left:10px;">👨‍🏫</div>
                    <span>معلمي</span>
                </div>
                
                <div class="messages-area" id="studentChatArea">
                    <div class="text-center text-muted mt-5">جاري تحميل المحادثة...</div>
                </div>

                <div id="attachmentPreviewBox" class="attachment-preview">
                    <i class="fas fa-times" style="color:red; cursor:pointer;" onclick="clearAttachment()"></i>
                    <span id="attachName"></span>
                </div>

                <div class="chat-input-area">
                    <label class="btn-attach">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="chatFileInput" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    <label class="btn-attach">
                        <i class="fas fa-camera"></i>
                        <input type="file" id="chatCamInput" accept="image/*" capture="environment" style="display:none" onchange="handleChatAttachment(this)">
                    </label>
                    
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب رسالة للمعلم..." onkeypress="handleEnter(event)">
                    <button class="btn-send" onclick="sendToTeacher()"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 🧠 2. المنطق (تحديد المعلم تلقائياً)
// ==========================================

function getMyTeacherId() {
    const me = getCurrentUser();
    // 1. إذا كان الطالب مرتبطاً بمعلم مباشرة
    if (me.teacherId) return me.teacherId;
    
    // 2. البحث عن أي معلم في النظام (حل مؤقت لضمان العمل)
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    if (teachers.length > 0) return teachers[0].id;
    
    // 3. البحث في المستخدمين
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.role === 'teacher');
    return teacher ? teacher.id : null;
}

function loadChatWithTeacher() {
    const teacherId = getMyTeacherId();
    if (!teacherId) {
        document.getElementById('studentChatArea').innerHTML = '<div class="text-center p-5">لم يتم العثور على معلم مرتبط بك.</div>';
        return;
    }

    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const currentUser = getCurrentUser();
    
    // جلب الرسائل بيني وبين هذا المعلم
    const myMsgs = messages.filter(m => m.studentId === currentUser.id); // يمكن إضافة && m.teacherId === teacherId للصرامة
    myMsgs.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    
    const area = document.getElementById('studentChatArea');
    area.innerHTML = '';
    
    if (myMsgs.length === 0) {
        area.innerHTML = '<div class="text-center text-muted mt-5"><i class="fas fa-comment-dots fa-3x mb-3"></i><br>ابدأ المحادثة مع معلمك</div>';
    }

    myMsgs.forEach(msg => {
        // في سجل الطالب: isFromTeacher=true تعني (هو/يسار)، وإلا (أنا/يمين)
        // نريد: أنا (يمين)، هو (يسار)
        // msg-me (يمين - أزرق) -> رسالتي (!isFromTeacher)
        // msg-other (يسار - أبيض) -> رسالة المعلم (isFromTeacher)
        
        const isMe = !msg.isFromTeacher;
        const bubbleClass = isMe ? 'msg-me' : 'msg-other';
        
        let attachHtml = '';
        if (msg.attachment) {
            const isImg = msg.attachment.startsWith('data:image');
            attachHtml = `
                <a href="${msg.attachment}" download="attachment" class="msg-attachment">
                    ${isImg ? `<img src="${msg.attachment}">` : ''}
                    📎 فتح المرفق
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
        if (msg.isFromTeacher && !msg.isRead) {
            msg.isRead = true;
            // تحديث السجل
        }
    });
    
    // حفظ حالة القراءة
    localStorage.setItem('studentMessages', JSON.stringify(messages));
    area.scrollTop = area.scrollHeight;
}

// ==========================================
// 🚀 3. الإرسال
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
}

function sendToTeacher() {
    const teacherId = getMyTeacherId();
    if (!teacherId) { alert('خطأ: لا يوجد معلم'); return; }

    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    
    if (!content && !attachmentData) return;
    
    const currentUser = getCurrentUser();
    
    // 1. الحفظ في صندوق الطالب
    const studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const newMsgStudent = {
        id: Date.now(),
        studentId: currentUser.id,
        teacherId: teacherId,
        subject: 'محادثة',
        content: content || (attachmentData ? 'مرفق' : ''),
        attachment: attachmentData,
        sentAt: new Date().toISOString(),
        isRead: true, 
        isFromTeacher: false
    };
    studentMsgs.push(newMsgStudent);
    localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
    
    // 2. الحفظ في صندوق المعلم
    const teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const newMsgTeacher = {
        id: Date.now() + 1,
        teacherId: teacherId,
        studentId: currentUser.id,
        subject: 'محادثة',
        content: content || (attachmentData ? 'مرفق' : ''),
        attachment: attachmentData,
        sentAt: new Date().toISOString(),
        isRead: false,
        isFromStudent: true
    };
    teacherMsgs.push(newMsgTeacher);
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
    
    input.value = '';
    clearAttachment();
    loadChatWithTeacher();
}

function handleEnter(e) {
    if (e.key === 'Enter') sendToTeacher();
}

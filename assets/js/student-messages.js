// ============================================
// 📁 المسار: assets/js/student-messages.js
// الوصف: إدارة نظام مراسلة الطالب (متوافق مع تصميم HTML)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentInbox();
    updateMessageStats();
});

// ============================================
// 📨 تحميل وعرض الرسائل
// ============================================
function loadStudentInbox() {
    const messagesList = document.getElementById('messagesList');
    const currentUser = getCurrentUser(); // من auth.js
    
    // جلب الرسائل من مخازن البيانات (نظام المزامنة المزدوج)
    const allMessages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    
    // تصفية الرسائل الخاصة بهذا الطالب فقط
    let myMessages = allMessages.filter(m => m.studentId == currentUser.id);

    // الترتيب: الأحدث أولاً
    myMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    if (myMessages.length === 0) {
        messagesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #777;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                <p>لا توجد رسائل حالياً. ابدأ بمراسلة معلمك!</p>
            </div>`;
        return;
    }

    messagesList.innerHTML = ''; // تنظيف القائمة

    myMessages.forEach(msg => {
        // تحديد حالة الرسالة وتنسيقها
        const isReply = msg.isFromTeacher; // هل هي واردة من المعلم؟
        const statusClass = msg.isRead ? 'read' : 'unread';
        const cardClass = isReply ? 'message-card received' : 'message-card sent';
        const icon = isReply ? '👨‍🏫' : '👤';
        const senderName = isReply ? 'المعلم' : 'أنت';
        
        // قالب بطاقة الرسالة
        const msgHtml = `
            <div class="message-card ${cardClass} ${statusClass}" onclick="openMessageDetails(${msg.id})">
                <div class="msg-icon">${icon}</div>
                <div class="msg-content-preview">
                    <div class="msg-header">
                        <h4>${msg.subject || (isReply ? 'رد من المعلم' : 'رسالة جديدة')}</h4>
                        <span class="msg-date">${new Date(msg.sentAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <p>${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}</p>
                    ${msg.attachment ? '<span class="attachment-badge">📎 يوجد مرفق</span>' : ''}
                </div>
            </div>
            <style>
                /* تنسيقات بسيطة للبطاقات تضاف ديناميكياً */
                .message-card { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: 0.2s; }
                .message-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
                .message-card.received { border-right: 4px solid #28a745; background: #f9fff9; }
                .message-card.sent { border-right: 4px solid #007bff; }
                .msg-icon { font-size: 1.5rem; background: #f8f9fa; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
                .msg-content-preview { flex: 1; }
                .msg-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .msg-header h4 { margin: 0; font-size: 1rem; color: #333; }
                .msg-date { font-size: 0.8rem; color: #888; }
                .attachment-badge { font-size: 0.75rem; background: #e9ecef; padding: 2px 8px; border-radius: 4px; color: #495057; }
            </style>
        `;
        messagesList.innerHTML += msgHtml;
    });
}

// ============================================
// 📤 إرسال رسالة جديدة
// ============================================
window.sendNewMessage = function() {
    const subject = document.getElementById('messageSubject').value;
    const content = document.getElementById('messageContent').value;
    const fileInput = document.getElementById('messageAttachment');
    
    if (!subject || !content) {
        alert('الرجاء تعبئة جميع الحقول المطلوبة');
        return;
    }

    const currentUser = getCurrentUser();
    
    // تجهيز المرفق إن وجد
    let attachment = null;
    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            attachment = e.target.result;
            saveMessageToStorage(currentUser, subject, content, attachment);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveMessageToStorage(currentUser, subject, content, null);
    }
};

function saveMessageToStorage(user, subject, content, attachment) {
    const msgId = Date.now();
    
    // 1. إنشاء نسخة الطالب (Sent Item)
    const studentMsg = {
        id: msgId,
        studentId: user.id,
        teacherId: user.teacherId,
        subject: subject,
        content: content,
        attachment: attachment,
        sentAt: new Date().toISOString(),
        isFromTeacher: false,
        isRead: true // الطالب قرأ رسالته بالتأكيد
    };

    // 2. إنشاء نسخة المعلم (Inbox Item) - ليراها المعلم في حسابه
    const teacherMsg = {
        id: msgId + 1, // ID مختلف قليلاً لتفادي التضارب
        studentId: user.id,
        teacherId: user.teacherId,
        content: content, // المعلم يرى المحتوى كـ "chat" غالباً
        attachment: attachment,
        sentAt: new Date().toISOString(),
        isFromStudent: true,
        isRead: false
    };

    // الحفظ في localStorage للطالب
    let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    sMsgs.push(studentMsg);
    localStorage.setItem('studentMessages', JSON.stringify(sMsgs));

    // الحفظ في localStorage للمعلم
    let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    tMsgs.push(teacherMsg);
    localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));

    // إغلاق النافذة وتحديث القائمة
    closeNewMessageModal();
    document.getElementById('newMessageForm').reset();
    showSuccess('تم إرسال الرسالة بنجاح'); // دالة من auth.js
    loadStudentInbox();
    updateMessageStats();
}

// ============================================
// 👁️ عرض تفاصيل الرسالة
// ============================================
window.openMessageDetails = function(msgId) {
    const msgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const msg = msgs.find(m => m.id === msgId);
    
    if (!msg) return;

    // تحديث المحتوى في النافذة المنبثقة
    document.getElementById('viewMessageSubject').innerText = msg.subject || (msg.isFromTeacher ? 'رسالة من المعلم' : 'رسالتك');
    document.getElementById('viewMessageFrom').innerText = `من: ${msg.isFromTeacher ? 'المعلم' : 'أنت'}`;
    document.getElementById('viewMessageDate').innerText = `التاريخ: ${new Date(msg.sentAt).toLocaleString('ar-SA')}`;
    document.getElementById('viewMessageContent').innerText = msg.content;
    
    const attachDiv = document.getElementById('viewMessageAttachment');
    if (msg.attachment) {
        attachDiv.innerHTML = `<a href="${msg.attachment}" download="attachment" class="btn btn-sm btn-primary">📎 تحميل المرفق</a>`;
    } else {
        attachDiv.innerHTML = '';
    }

    // إذا كانت الرسالة من المعلم وغير مقروءة، نضع علامة مقروء
    if (msg.isFromTeacher && !msg.isRead) {
        msg.isRead = true;
        localStorage.setItem('studentMessages', JSON.stringify(msgs));
        updateMessageStats();
    }

    document.getElementById('viewMessageModal').classList.add('show');
};

window.closeViewMessageModal = function() {
    document.getElementById('viewMessageModal').classList.remove('show');
};

// ============================================
// 📊 تحديث الإحصائيات والتصفية
// ============================================
function updateMessageStats() {
    const currentUser = getCurrentUser();
    const msgs = JSON.parse(localStorage.getItem('studentMessages') || '[]').filter(m => m.studentId == currentUser.id);
    
    document.getElementById('totalMessages').innerText = msgs.length;
    document.getElementById('unreadMessages').innerText = msgs.filter(m => m.isFromTeacher && !m.isRead).length;
    document.getElementById('teacherReplies').innerText = msgs.filter(m => m.isFromTeacher).length;
}

window.filterMessages = function() {
    const filter = document.getElementById('messageFilter').value;
    const cards = document.querySelectorAll('.message-card');
    
    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'flex';
        } else if (filter === 'unread' && card.classList.contains('unread') && card.classList.contains('received')) {
            card.style.display = 'flex';
        } else if (filter === 'read' && !card.classList.contains('unread')) {
            card.style.display = 'flex';
        } else if (filter === 'replied' && card.classList.contains('received')) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
};

// ============================================
// 🛠️ أدوات النافذة المنبثقة (Modal)
// ============================================
window.showNewMessageModal = function() {
    document.getElementById('newMessageModal').classList.add('show');
};

window.closeNewMessageModal = function() {
    document.getElementById('newMessageModal').classList.remove('show');
};

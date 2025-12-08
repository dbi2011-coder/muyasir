// نظام مراسلة الطالب للمعلم
let currentViewingMessageId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        initializeStudentMessages();
        loadStudentMessages();
    }
});

function initializeStudentMessages() {
    updateStudentMessagesStats();
}

function loadStudentMessages() {
    const messagesList = document.getElementById('messagesList');
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const currentStudent = getCurrentUser();
    
    // تصفية الرسائل الخاصة بالطالب الحالي فقط
    const studentMessages = messages.filter(msg => msg.studentId === currentStudent.id);
    
    if (studentMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>لا توجد رسائل</h3>
                <p>لم ترسل أو تستلم أي رسائل بعد</p>
                <button class="btn btn-success" onclick="showNewMessageModal()">إرسال رسالة جديدة</button>
            </div>
        `;
        return;
    }
    
    // ترتيب الرسائل من الأحدث إلى الأقدم
    studentMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    messagesList.innerHTML = studentMessages.map(message => {
        const teacher = getTeacherById(message.teacherId);
        return `
            <div class="message-item ${message.isRead ? 'read' : 'unread'} ${message.hasReply ? 'replied' : ''}">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar">${message.isFromTeacher ? 'م' : 'ط'}</div>
                        <div class="sender-info">
                            <strong>${message.isFromTeacher ? (teacher?.name || 'المعلم') : 'أنت'}</strong>
                            <span class="message-subject">${message.subject}</span>
                        </div>
                    </div>
                    <div class="message-meta">
                        <span class="message-date">${formatDate(message.sentAt)}</span>
                        <div class="message-status">
                            ${message.isRead ? '📖' : '📨'}
                            ${message.hasReply ? ' ✓' : ''}
                            ${message.isFromTeacher ? ' 👨‍🏫' : ''}
                        </div>
                    </div>
                </div>
                <div class="message-preview">
                    <p>${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}</p>
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewMessage(${message.id})">عرض</button>
                    ${!message.isRead ? `<button class="btn btn-sm btn-success" onclick="markMessageAsRead(${message.id})">تعليم كمقروء</button>` : ''}
                    ${!message.isFromTeacher && !message.hasReply ? `<button class="btn btn-sm btn-warning" onclick="editMessage(${message.id})">تعديل</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteMessage(${message.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateStudentMessagesStats() {
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const currentStudent = getCurrentUser();
    const studentMessages = messages.filter(msg => msg.studentId === currentStudent.id);
    
    const totalMessages = studentMessages.length;
    const unreadMessages = studentMessages.filter(msg => !msg.isRead).length;
    const teacherReplies = studentMessages.filter(msg => msg.isFromTeacher).length;
    
    document.getElementById('totalMessages').textContent = totalMessages;
    document.getElementById('unreadMessages').textContent = unreadMessages;
    document.getElementById('teacherReplies').textContent = teacherReplies;
}

function showNewMessageModal() {
    document.getElementById('newMessageModal').classList.add('show');
    document.getElementById('newMessageForm').reset();
}

function closeNewMessageModal() {
    document.getElementById('newMessageModal').classList.remove('show');
}

function sendNewMessage() {
    const subject = document.getElementById('messageSubject').value.trim();
    const content = document.getElementById('messageContent').value.trim();
    
    if (!subject || !content) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const currentStudent = getCurrentUser();
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    
    const newMessage = {
        id: generateId(),
        studentId: currentStudent.id,
        teacherId: currentStudent.teacherId, // افتراض أن الطالب مرتبط بمعلم
        subject: subject,
        content: content,
        sentAt: new Date().toISOString(),
        isRead: false,
        isFromTeacher: false,
        hasReply: false,
        attachment: null
    };
    
    messages.push(newMessage);
    localStorage.setItem('studentMessages', JSON.stringify(messages));
    
    // إضافة الرسالة إلى صندوق وارد المعلم أيضاً
    addMessageToTeacherInbox(newMessage);
    
    showAuthNotification('تم إرسال الرسالة بنجاح', 'success');
    closeNewMessageModal();
    loadStudentMessages();
    updateStudentMessagesStats();
    
    // إضافة نشاط
    addStudentActivity({
        type: 'message',
        title: 'أرسلت رسالة',
        description: `إلى المعلم: ${subject}`
    });
}

function addMessageToTeacherInbox(studentMessage) {
    const teacherMessages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    
    const teacherMessage = {
        id: generateId(),
        teacherId: studentMessage.teacherId,
        studentId: studentMessage.studentId,
        subject: studentMessage.subject,
        content: studentMessage.content,
        sentAt: studentMessage.sentAt,
        isRead: false,
        hasReply: false,
        isFromStudent: true
    };
    
    teacherMessages.push(teacherMessage);
    localStorage.setItem('teacherMessages', JSON.stringify(teacherMessages));
}

function viewMessage(messageId) {
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
        showAuthNotification('الرسالة غير موجودة', 'error');
        return;
    }
    
    currentViewingMessageId = messageId;
    const teacher = getTeacherById(message.teacherId);
    
    document.getElementById('viewMessageSubject').textContent = message.subject;
    document.getElementById('viewMessageFrom').textContent = `من: ${message.isFromTeacher ? (teacher?.name || 'المعلم') : 'أنت'}`;
    document.getElementById('viewMessageDate').textContent = `التاريخ: ${formatDate(message.sentAt)}`;
    document.getElementById('viewMessageContent').textContent = message.content;
    
    // عرض المرفقات إذا وجدت
    const attachmentDiv = document.getElementById('viewMessageAttachment');
    if (message.attachment) {
        attachmentDiv.innerHTML = `
            <strong>المرفق:</strong>
            <a href="${message.attachment}" target="_blank">عرض الملف</a>
        `;
    } else {
        attachmentDiv.innerHTML = '';
    }
    
    document.getElementById('viewMessageModal').classList.add('show');
    
    // تعليم الرسالة كمقروءة إذا لم تكن مقروءة
    if (!message.isRead) {
        markMessageAsRead(messageId);
    }
}

function closeViewMessageModal() {
    document.getElementById('viewMessageModal').classList.remove('show');
    currentViewingMessageId = null;
}

function markMessageAsRead(messageId) {
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
        messages[messageIndex].isRead = true;
        localStorage.setItem('studentMessages', JSON.stringify(messages));
        loadStudentMessages();
        updateStudentMessagesStats();
    }
}

function editMessage(messageId) {
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message || message.isFromTeacher || message.hasReply) {
        showAuthNotification('لا يمكن تعديل هذه الرسالة', 'error');
        return;
    }
    
    // تعبئة النموذج ببيانات الرسالة الحالية
    document.getElementById('messageSubject').value = message.subject;
    document.getElementById('messageContent').value = message.content;
    
    // حذف الرسالة القديمة
    deleteMessage(messageId, false);
    
    // فتح نموذج جديد مع البيانات
    showNewMessageModal();
}

function deleteMessage(messageId, showConfirmation = true) {
    if (showConfirmation && !confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
        return;
    }
    
    const messages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    localStorage.setItem('studentMessages', JSON.stringify(updatedMessages));
    
    if (showConfirmation) {
        showAuthNotification('تم حذف الرسالة بنجاح', 'success');
    }
    
    loadStudentMessages();
    updateStudentMessagesStats();
}

function filterMessages() {
    const filter = document.getElementById('messageFilter').value;
    const messageItems = document.querySelectorAll('.message-item');
    
    messageItems.forEach(item => {
        switch (filter) {
            case 'all':
                item.style.display = 'flex';
                break;
            case 'unread':
                item.style.display = item.classList.contains('unread') ? 'flex' : 'none';
                break;
            case 'read':
                item.style.display = item.classList.contains('read') ? 'flex' : 'none';
                break;
            case 'replied':
                item.style.display = item.classList.contains('replied') ? 'flex' : 'none';
                break;
        }
    });
}

function getTeacherById(teacherId) {
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    return teachers.find(t => t.id === teacherId);
}

// تصدير الدوال للاستخدام العالمي
window.showNewMessageModal = showNewMessageModal;
window.closeNewMessageModal = closeNewMessageModal;
window.sendNewMessage = sendNewMessage;
window.viewMessage = viewMessage;
window.closeViewMessageModal = closeViewMessageModal;
window.markMessageAsRead = markMessageAsRead;
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;
window.filterMessages = filterMessages;
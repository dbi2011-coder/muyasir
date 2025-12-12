// نظام مراسلة الطلاب
let currentViewingMessageId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        initializeMessagesPage();
        loadMessages();
        loadStudentsForMessaging();
    }
});

function initializeMessagesPage() {
    updateMessagesStats();
}

function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية الرسائل الخاصة بالمعلم الحالي فقط
    const teacherMessages = messages.filter(msg => msg.teacherId === currentTeacher.id);
    
    if (teacherMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>لا توجد رسائل</h3>
                <p>لم تستلم أي رسائل من الطلاب بعد</p>
                <button class="btn btn-success" onclick="showNewMessageModal()">إرسال رسالة جديدة</button>
            </div>
        `;
        return;
    }
    
    // ترتيب الرسائل من الأحدث إلى الأقدم
    teacherMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    messagesList.innerHTML = teacherMessages.map(message => {
        const student = getStudentById(message.studentId);
        return `
            <div class="message-item ${message.isRead ? 'read' : 'unread'} ${message.hasReply ? 'replied' : ''}">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar">${student?.name?.charAt(0) || 'ط'}</div>
                        <div class="sender-info">
                            <strong>${student?.name || 'طالب غير معروف'}</strong>
                            <span class="message-subject">${message.subject}</span>
                        </div>
                    </div>
                    <div class="message-meta">
                        <span class="message-date">${formatDate(message.sentAt)}</span>
                        <div class="message-status">
                            ${message.isRead ? '📖' : '📨'}
                            ${message.hasReply ? ' ✓' : ''}
                        </div>
                    </div>
                </div>
                <div class="message-preview">
                    <p>${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}</p>
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewMessage(${message.id})">عرض</button>
                    ${!message.isRead ? `<button class="btn btn-sm btn-success" onclick="markMessageAsRead(${message.id})">تعليم كمقروء</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteMessage(${message.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadStudentsForMessaging() {
    const recipientSelect = document.getElementById('messageRecipient');
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentTeacher = getCurrentUser();
    
    const teacherStudents = students.filter(student => student.teacherId === currentTeacher.id);
    
    recipientSelect.innerHTML = '<option value="">اختر الطالب</option>';
    teacherStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} - ${student.grade}`;
        recipientSelect.appendChild(option);
    });
}

function updateMessagesStats() {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherMessages = messages.filter(msg => msg.teacherId === currentTeacher.id);
    
    const totalMessages = teacherMessages.length;
    const unreadMessages = teacherMessages.filter(msg => !msg.isRead).length;
    const pendingReplies = teacherMessages.filter(msg => !msg.hasReply).length;
    
    document.getElementById('totalMessages').textContent = totalMessages;
    document.getElementById('unreadMessages').textContent = unreadMessages;
    document.getElementById('pendingReplies').textContent = pendingReplies;
}

function showNewMessageModal() {
    document.getElementById('newMessageModal').classList.add('show');
    document.getElementById('newMessageForm').reset();
}

function closeNewMessageModal() {
    document.getElementById('newMessageModal').classList.remove('show');
}

function sendNewMessage() {
    const studentId = parseInt(document.getElementById('messageRecipient').value);
    const subject = document.getElementById('messageSubject').value.trim();
    const content = document.getElementById('messageContent').value.trim();
    
    if (!studentId || !subject || !content) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const currentTeacher = getCurrentUser();
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    
    const newMessage = {
        id: generateId(),
        teacherId: currentTeacher.id,
        studentId: studentId,
        subject: subject,
        content: content,
        sentAt: new Date().toISOString(),
        isRead: false,
        hasReply: false,
        attachment: null // يمكن تطوير رفع المرفقات لاحقاً
    };
    
    messages.push(newMessage);
    localStorage.setItem('teacherMessages', JSON.stringify(messages));
    
    // إضافة الرسالة إلى صندوق وارد الطالب أيضاً
    addMessageToStudentInbox(newMessage);
    
    showAuthNotification('تم إرسال الرسالة بنجاح', 'success');
    closeNewMessageModal();
    loadMessages();
    updateMessagesStats();
}

function addMessageToStudentInbox(teacherMessage) {
    const studentMessages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    
    const studentMessage = {
        id: generateId(),
        studentId: teacherMessage.studentId,
        teacherId: teacherMessage.teacherId,
        subject: teacherMessage.subject,
        content: teacherMessage.content,
        sentAt: teacherMessage.sentAt,
        isRead: false,
        isFromTeacher: true,
        hasReply: false
    };
    
    studentMessages.push(studentMessage);
    localStorage.setItem('studentMessages', JSON.stringify(studentMessages));
}

function viewMessage(messageId) {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
        showAuthNotification('الرسالة غير موجودة', 'error');
        return;
    }
    
    currentViewingMessageId = messageId;
    const student = getStudentById(message.studentId);
    
    document.getElementById('viewMessageSubject').textContent = message.subject;
    document.getElementById('viewMessageFrom').textContent = `من: ${student?.name || 'طالب غير معروف'}`;
    document.getElementById('viewMessageDate').textContent = `التاريخ: ${formatDate(message.sentAt)}`;
    document.getElementById('viewMessageContent').textContent = message.content;
    
    // إظهار/إخفاء منطقة الرد
    const replySection = document.getElementById('replySection');
    if (message.hasReply) {
        replySection.style.display = 'none';
    } else {
        replySection.style.display = 'block';
        document.getElementById('replyContent').value = '';
    }
    
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

function sendReply() {
    const replyContent = document.getElementById('replyContent').value.trim();
    
    if (!replyContent) {
        showAuthNotification('يرجى كتابة محتوى الرد', 'error');
        return;
    }
    
    if (!currentViewingMessageId) {
        showAuthNotification('لم يتم تحديد رسالة للرد', 'error');
        return;
    }
    
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const messageIndex = messages.findIndex(msg => msg.id === currentViewingMessageId);
    
    if (messageIndex === -1) {
        showAuthNotification('الرسالة غير موجودة', 'error');
        return;
    }
    
    // تحديث الرسالة الأصلية
    messages[messageIndex].hasReply = true;
    messages[messageIndex].repliedAt = new Date().toISOString();
    
    // إرسال الرد إلى الطالب
    sendReplyToStudent(messages[messageIndex], replyContent);
    
    localStorage.setItem('teacherMessages', JSON.stringify(messages));
    
    showAuthNotification('تم إرسال الرد بنجاح', 'success');
    closeViewMessageModal();
    loadMessages();
    updateMessagesStats();
}

function sendReplyToStudent(originalMessage, replyContent) {
    const studentMessages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    
    const replyMessage = {
        id: generateId(),
        studentId: originalMessage.studentId,
        teacherId: originalMessage.teacherId,
        subject: `رد على: ${originalMessage.subject}`,
        content: replyContent,
        sentAt: new Date().toISOString(),
        isRead: false,
        isFromTeacher: true,
        hasReply: false,
        isReplyTo: originalMessage.id
    };
    
    studentMessages.push(replyMessage);
    localStorage.setItem('studentMessages', JSON.stringify(studentMessages));
}

function markMessageAsRead(messageId) {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
        messages[messageIndex].isRead = true;
        localStorage.setItem('teacherMessages', JSON.stringify(messages));
        loadMessages();
        updateMessagesStats();
    }
}

function deleteMessage(messageId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
        return;
    }
    
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    localStorage.setItem('teacherMessages', JSON.stringify(updatedMessages));
    
    showAuthNotification('تم حذف الرسالة بنجاح', 'success');
    loadMessages();
    updateMessagesStats();
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

function searchMessages() {
    const searchTerm = document.getElementById('messageSearch').value.toLowerCase();
    const messageItems = document.querySelectorAll('.message-item');
    
    messageItems.forEach(item => {
        const subject = item.querySelector('.message-subject').textContent.toLowerCase();
        const preview = item.querySelector('.message-preview p').textContent.toLowerCase();
        const sender = item.querySelector('.sender-info strong').textContent.toLowerCase();
        
        if (subject.includes(searchTerm) || preview.includes(searchTerm) || sender.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function getStudentById(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.find(s => s.id === studentId);
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// تصدير الدوال للاستخدام العالمي
window.showNewMessageModal = showNewMessageModal;
window.closeNewMessageModal = closeNewMessageModal;
window.sendNewMessage = sendNewMessage;
window.viewMessage = viewMessage;
window.closeViewMessageModal = closeViewMessageModal;
window.sendReply = sendReply;
window.markMessageAsRead = markMessageAsRead;
window.deleteMessage = deleteMessage;
window.filterMessages = filterMessages;
window.searchMessages = searchMessages;
// ============================================
// 📁 المسار: messages.js
// الوصف: نظام مراسلة المعلم (يظهر طلاب المعلم الحالي فقط)
// ============================================

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
    const teacherMessages = messages.filter(msg => msg.teacherId == currentTeacher.id);
    
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

// 🔥 الدالة المعدلة: تظهر فقط الطلاب المرتبطين بالمعلم الحالي 🔥
function loadStudentsForMessaging() {
    const recipientSelect = document.getElementById('messageRecipient');
    const currentTeacher = getCurrentUser();

    // 1. جلب قائمة الطلاب (من المصدرين المحتملين لضمان وجود البيانات)
    let allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    
    // دمج الطلاب من جدول المستخدمين أيضاً إذا كانوا غير موجودين في جدول الطلاب
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const studentUsers = allUsers.filter(u => u.role === 'student');
    
    // دمج القائمتين مع تجنب التكرار
    const mergedStudents = [...allStudents];
    studentUsers.forEach(u => {
        if (!mergedStudents.find(s => s.id == u.id)) {
            mergedStudents.push(u);
        }
    });
    
    // 2. التصفية: الطلاب المرتبطين بهذا المعلم فقط
    // نستخدم (==) بدلاً من (===) لتفادي مشاكل النصوص والأرقام
    const teacherStudents = mergedStudents.filter(student => student.teacherId == currentTeacher.id);
    
    recipientSelect.innerHTML = '<option value="">اختر الطالب</option>';
    
    if (teacherStudents.length === 0) {
        recipientSelect.innerHTML += '<option value="" disabled>لا يوجد طلاب مرتبطين بك حالياً</option>';
        // طباعة للتوضيح في حال لم يظهر أحد (للمطور فقط)
        console.log("Teacher ID:", currentTeacher.id);
        console.log("Total Students Found:", mergedStudents.length);
        return;
    }

    teacherStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        const name = student.name || 'طالب بدون اسم';
        const grade = student.grade || '';
        option.textContent = `${name} ${grade ? '- ' + grade : ''}`;
        recipientSelect.appendChild(option);
    });
}

function updateMessagesStats() {
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherMessages = messages.filter(msg => msg.teacherId == currentTeacher.id);
    
    const totalMessages = teacherMessages.length;
    const unreadMessages = teacherMessages.filter(msg => !msg.isRead).length;
    const pendingReplies = teacherMessages.filter(msg => !msg.hasReply).length;
    
    if(document.getElementById('totalMessages')) document.getElementById('totalMessages').textContent = totalMessages;
    if(document.getElementById('unreadMessages')) document.getElementById('unreadMessages').textContent = unreadMessages;
    if(document.getElementById('pendingReplies')) document.getElementById('pendingReplies').textContent = pendingReplies;
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
        alert('يرجى ملء جميع الحقول الإجبارية');
        return;
    }
    
    const currentTeacher = getCurrentUser();
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    
    const newMessage = {
        id: Date.now(),
        teacherId: currentTeacher.id,
        studentId: studentId,
        subject: subject,
        content: content,
        sentAt: new Date().toISOString(),
        isRead: false,
        hasReply: false,
        attachment: null
    };
    
    messages.push(newMessage);
    localStorage.setItem('teacherMessages', JSON.stringify(messages));
    
    // إضافة الرسالة إلى صندوق وارد الطالب أيضاً
    addMessageToStudentInbox(newMessage);
    
    alert('تم إرسال الرسالة بنجاح');
    closeNewMessageModal();
    loadMessages();
    updateMessagesStats();
}

function addMessageToStudentInbox(teacherMessage) {
    const studentMessages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    
    const studentMessage = {
        id: Date.now() + 1, // ID مختلف قليلاً لتجنب التكرار
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
    
    if (!message) { alert('الرسالة غير موجودة'); return; }
    
    currentViewingMessageId = messageId;
    const student = getStudentById(message.studentId);
    
    document.getElementById('viewMessageSubject').textContent = message.subject;
    document.getElementById('viewMessageFrom').textContent = `من: ${student?.name || 'طالب غير معروف'}`;
    document.getElementById('viewMessageDate').textContent = `التاريخ: ${formatDate(message.sentAt)}`;
    document.getElementById('viewMessageContent').textContent = message.content;
    
    const replySection = document.getElementById('replySection');
    if (message.hasReply) {
        replySection.style.display = 'none';
    } else {
        replySection.style.display = 'block';
        document.getElementById('replyContent').value = '';
    }
    
    const attachmentDiv = document.getElementById('viewMessageAttachment');
    if (message.attachment) {
        attachmentDiv.innerHTML = `<strong>المرفق:</strong> <a href="${message.attachment}" target="_blank">عرض الملف</a>`;
    } else {
        attachmentDiv.innerHTML = '';
    }
    
    document.getElementById('viewMessageModal').classList.add('show');
    
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
    
    if (!replyContent) { alert('يرجى كتابة محتوى الرد'); return; }
    if (!currentViewingMessageId) return;
    
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const messageIndex = messages.findIndex(msg => msg.id === currentViewingMessageId);
    
    if (messageIndex === -1) return;
    
    messages[messageIndex].hasReply = true;
    messages[messageIndex].repliedAt = new Date().toISOString();
    
    sendReplyToStudent(messages[messageIndex], replyContent);
    localStorage.setItem('teacherMessages', JSON.stringify(messages));
    
    alert('تم إرسال الرد بنجاح');
    closeViewMessageModal();
    loadMessages();
    updateMessagesStats();
}

function sendReplyToStudent(originalMessage, replyContent) {
    const studentMessages = JSON.parse(localStorage.getItem('studentMessages') || '[]');
    
    const replyMessage = {
        id: Date.now(),
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
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    localStorage.setItem('teacherMessages', JSON.stringify(updatedMessages));
    
    loadMessages();
    updateMessagesStats();
}

function filterMessages() {
    const filter = document.getElementById('messageFilter').value;
    const messageItems = document.querySelectorAll('.message-item');
    
    messageItems.forEach(item => {
        switch (filter) {
            case 'all': item.style.display = 'flex'; break;
            case 'unread': item.style.display = item.classList.contains('unread') ? 'flex' : 'none'; break;
            case 'read': item.style.display = item.classList.contains('read') ? 'flex' : 'none'; break;
            case 'replied': item.style.display = item.classList.contains('replied') ? 'flex' : 'none'; break;
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
    // البحث في الجدولين
    let students = JSON.parse(localStorage.getItem('students') || '[]');
    let student = students.find(s => s.id == studentId);
    
    if (!student) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        student = users.find(u => u.id == studentId && u.role === 'student');
    }
    return student;
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// تصدير الدوال
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

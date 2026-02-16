// نظام إرسال الملاحظات للمعلمين
let currentViewingNoteId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('notes.html')) {
        initializeNotesPage();
        loadCommitteeNotes();
        populateTeachersDropdown();
    }
});

function initializeNotesPage() {
    updateNotesStats();
}

function updateNotesStats() {
    const currentUser = getCurrentUser();
    const notes = getCommitteeNotes(currentUser.id);
    
    const totalNotes = notes.length;
    const unreadNotes = notes.filter(note => !note.isRead).length;
    const readNotes = notes.filter(note => note.isRead && !note.hasReply).length;
    const repliedNotes = notes.filter(note => note.hasReply).length;
    
    document.getElementById('totalNotes').textContent = totalNotes;
    document.getElementById('unreadNotes').textContent = unreadNotes;
    document.getElementById('readNotes').textContent = readNotes;
    document.getElementById('repliedNotes').textContent = repliedNotes;
}

function populateTeachersDropdown() {
    const teacherSelect = document.getElementById('noteTeacher');
    const currentUser = getCurrentUser();
    const assignedTeachers = getAssignedTeachers(currentUser.id);
    
    teacherSelect.innerHTML = '<option value="">اختر المعلم</option>';
    
    assignedTeachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherSelect.appendChild(option);
    });
}

function loadCommitteeNotes() {
    const notesList = document.getElementById('notesList');
    const currentUser = getCurrentUser();
    const notes = getCommitteeNotes(currentUser.id);
    
    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد ملاحظات</h3>
                <p>لم ترسل أي ملاحظات بعد</p>
                <button class="btn btn-success" onclick="showNewNoteModal()">إرسال ملاحظة جديدة</button>
            </div>
        `;
        return;
    }
    
    // ترتيب الملاحظات من الأحدث إلى الأقدم
    notes.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    notesList.innerHTML = notes.map(note => {
        const teacher = getTeacherById(note.teacherId);
        const statusClass = getNoteStatusClass(note);
        
        return `
            <div class="note-item ${statusClass}" onclick="viewNote(${note.id})">
                <div class="note-header">
                    <div class="note-title">${note.subject}</div>
                    <div class="note-meta">
                        <span>إلى: ${teacher ? teacher.name : 'معلم'}</span>
                        <span>${formatDateShort(note.sentAt)}</span>
                        <span class="status-badge ${getNoteStatusBadgeClass(note)}">
                            ${getNoteStatusText(note)}
                        </span>
                    </div>
                </div>
                <div class="note-content">
                    ${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}
                </div>
                <div class="note-status">
                    <span>${getNoteTypeText(note.type)}</span>
                    ${note.priority === 'urgent' ? '<span class="status-badge status-urgent">عاجل</span>' : ''}
                    ${note.priority === 'high' ? '<span class="status-badge status-high">عالية</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getCommitteeNotes(committeeId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    return committeeNotes.filter(cn => cn.committeeId === committeeId);
}

function getNoteStatusClass(note) {
    if (!note.isRead) return 'unread';
    if (note.hasReply) return 'replied';
    if (note.priority === 'urgent') return 'urgent';
    return 'read';
}

function getNoteStatusBadgeClass(note) {
    if (!note.isRead) return 'status-unread';
    if (note.hasReply) return 'status-replied';
    return 'status-read';
}

function getNoteStatusText(note) {
    if (!note.isRead) return 'غير مقروءة';
    if (note.hasReply) return 'تم الرد';
    return 'مقروءة';
}

function getNoteTypeText(type) {
    const types = {
        'recommendation': 'توصية',
        'observation': 'ملاحظة',
        'improvement': 'تحسين',
        'praise': 'ثناء',
        'urgent': 'عاجلة'
    };
    return types[type] || type;
}

function showNewNoteModal() {
    document.getElementById('newNoteModal').classList.add('show');
    document.getElementById('newNoteForm').reset();
}

function closeNewNoteModal() {
    document.getElementById('newNoteModal').classList.remove('show');
}

function sendNewNote() {
    const teacherId = parseInt(document.getElementById('noteTeacher').value);
    const type = document.getElementById('noteType').value;
    const subject = document.getElementById('noteSubject').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const priority = document.getElementById('notePriority').value;
    
    if (!teacherId || !type || !subject || !content) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    
    const newNote = {
        id: generateId(),
        committeeId: currentUser.id,
        teacherId: teacherId,
        type: type,
        subject: subject,
        content: content,
        priority: priority,
        sentAt: new Date().toISOString(),
        isRead: false,
        hasReply: false,
        replyContent: null,
        repliedAt: null
    };
    
    committeeNotes.push(newNote);
    localStorage.setItem('committeeNotes', JSON.stringify(newNote));
    
    // إضافة الملاحظة إلى صندوق وارد المعلم
    addNoteToTeacherInbox(newNote);
    
    showAuthNotification('تم إرسال الملاحظة بنجاح', 'success');
    closeNewNoteModal();
    loadCommitteeNotes();
    updateNotesStats();
    updateCommitteeStats();
    
    // إضافة نشاط
    addCommitteeActivity({
        type: 'note',
        title: 'أرسلت ملاحظة',
        description: `إلى المعلم: ${subject}`
    });
}

function addNoteToTeacherInbox(committeeNote) {
    const teacherNotes = JSON.parse(localStorage.getItem('teacherNotes') || '[]');
    
    const teacherNote = {
        id: generateId(),
        teacherId: committeeNote.teacherId,
        committeeId: committeeNote.committeeId,
        type: committeeNote.type,
        subject: committeeNote.subject,
        content: committeeNote.content,
        priority: committeeNote.priority,
        sentAt: committeeNote.sentAt,
        isRead: false,
        hasReplied: false
    };
    
    teacherNotes.push(teacherNote);
    localStorage.setItem('teacherNotes', JSON.stringify(teacherNotes));
}

function viewNote(noteId) {
    const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const note = notes.find(n => n.id === noteId);
    
    if (!note) {
        showAuthNotification('الملاحظة غير موجودة', 'error');
        return;
    }
    
    currentViewingNoteId = noteId;
    const teacher = getTeacherById(note.teacherId);
    
    document.getElementById('viewNoteSubject').textContent = note.subject;
    document.getElementById('viewNoteTo').textContent = `إلى: ${teacher ? teacher.name : 'معلم'}`;
    document.getElementById('viewNoteDate').textContent = `التاريخ: ${formatDate(note.sentAt)}`;
    document.getElementById('viewNoteType').textContent = `النوع: ${getNoteTypeText(note.type)}`;
    document.getElementById('viewNotePriority').textContent = `الأولوية: ${getPriorityText(note.priority)}`;
    document.getElementById('viewNoteContent').textContent = note.content;
    
    // عرض حالة الملاحظة
    const statusDiv = document.getElementById('viewNoteStatus');
    if (!note.isRead) {
        statusDiv.innerHTML = '<div class="alert alert-warning">⚠️ لم يقرأ المعلم هذه الملاحظة بعد</div>';
    } else if (note.hasReply) {
        statusDiv.innerHTML = '<div class="alert alert-success">✓ تم قراءة الملاحظة والرد عليها</div>';
    } else {
        statusDiv.innerHTML = '<div class="alert alert-info">👁️ تم قراءة الملاحظة</div>';
    }
    
    // عرض رد المعلم إذا وجد
    const replyDiv = document.getElementById('viewNoteReply');
    if (note.hasReply && note.replyContent) {
        replyDiv.innerHTML = `
            <h5>رد المعلم:</h5>
            <div class="reply-content">
                <p>${note.replyContent}</p>
                <p class="reply-date"><small>تاريخ الرد: ${formatDate(note.repliedAt)}</small></p>
            </div>
        `;
    } else {
        replyDiv.innerHTML = '';
    }
    
    document.getElementById('viewNoteModal').classList.add('show');
    
    // تعليم الملاحظة كمقروءة إذا كانت غير مقروءة
    if (!note.isRead) {
        markNoteAsRead(noteId);
    }
}

function closeViewNoteModal() {
    document.getElementById('viewNoteModal').classList.remove('show');
    currentViewingNoteId = null;
}

function markNoteAsRead(noteId) {
    const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
        notes[noteIndex].isRead = true;
        localStorage.setItem('committeeNotes', JSON.stringify(notes));
        loadCommitteeNotes();
        updateNotesStats();
    }
}

function replyToNote() {
    if (!currentViewingNoteId) {
        showAuthNotification('لم يتم تحديد ملاحظة', 'error');
        return;
    }
    
    const replyContent = prompt('أدخل ردك على الملاحظة:');
    if (!replyContent || replyContent.trim() === '') {
        return;
    }
    
    const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const noteIndex = notes.findIndex(n => n.id === currentViewingNoteId);
    
    if (noteIndex !== -1) {
        notes[noteIndex].hasReply = true;
        notes[noteIndex].replyContent = replyContent.trim();
        notes[noteIndex].repliedAt = new Date().toISOString();
        localStorage.setItem('committeeNotes', JSON.stringify(notes));
        
        // إرسال الرد إلى المعلم
        sendReplyToTeacher(currentViewingNoteId, replyContent);
        
        showAuthNotification('تم إرسال الرد بنجاح', 'success');
        closeViewNoteModal();
        loadCommitteeNotes();
        updateNotesStats();
    }
}

function sendReplyToTeacher(noteId, replyContent) {
    // في تطبيق حقيقي، سيتم إرسال الرد إلى صندوق وارد المعلم
    showAuthNotification('تم إرسال الرد إلى المعلم', 'info');
}

function filterNotes() {
    const filter = document.getElementById('noteFilter').value;
    const noteItems = document.querySelectorAll('.note-item');
    
    noteItems.forEach(item => {
        switch (filter) {
            case 'all':
                item.style.display = 'block';
                break;
            case 'unread':
                item.style.display = item.classList.contains('unread') ? 'block' : 'none';
                break;
            case 'read':
                item.style.display = item.classList.contains('read') ? 'block' : 'none';
                break;
            case 'replied':
                item.style.display = item.classList.contains('replied') ? 'block' : 'none';
                break;
            case 'urgent':
                item.style.display = item.classList.contains('urgent') ? 'block' : 'none';
                break;
        }
    });
}

function getPriorityText(priority) {
    const priorities = {
        'normal': 'عادية',
        'high': 'عالية',
        'urgent': 'عاجلة'
    };
    return priorities[priority] || priority;
}

// تصدير الدوال للاستخدام العالمي
window.showNewNoteModal = showNewNoteModal;
window.closeNewNoteModal = closeNewNoteModal;
window.sendNewNote = sendNewNote;
window.viewNote = viewNote;
window.closeViewNoteModal = closeViewNoteModal;
window.replyToNote = replyToNote;
window.filterNotes = filterNotes;
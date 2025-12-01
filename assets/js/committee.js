// إدارة لجنة صعوبات التعلم
let currentEditingMemberId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('committee.html')) {
        initializeCommitteePage();
        setupCommitteeTabs();
    }
});

function initializeCommitteePage() {
    loadCommitteeMembers();
    loadCommitteeNotes();
    updateCommitteeStats();
}

function setupCommitteeTabs() {
    const tabBtns = document.querySelectorAll('.committee-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.committee-tabs .tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة النشاط من جميع الأزرار
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // إضافة النشاط للزر والتبويب المحدد
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function loadCommitteeMembers() {
    const membersList = document.getElementById('membersList');
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية أعضاء اللجنة الخاصة بالمعلم الحالي فقط
    const teacherMembers = committeeMembers.filter(member => member.teacherId === currentTeacher.id);
    
    if (teacherMembers.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>لا توجد أعضاء في اللجنة</h3>
                <p>قم بإضافة أعضاء لجنة صعوبات التعلم لمشاركة متابعة الطلاب</p>
                <button class="btn btn-success" onclick="showAddMemberModal()">إضافة أول عضو</button>
            </div>
        `;
        return;
    }
    
    membersList.innerHTML = teacherMembers.map(member => `
        <div class="member-card">
            <div class="member-info">
                <div class="member-avatar">${member.name.charAt(0)}</div>
                <div class="member-details">
                    <h4>${member.name}</h4>
                    <div class="member-meta">
                        <span class="member-role">${member.role}</span>
                        <span class="member-username">اسم المستخدم: ${member.username}</span>
                    </div>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn btn-sm btn-primary" onclick="editCommitteeMember(${member.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCommitteeMember(${member.id})">حذف</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="viewMemberCredentials(${member.id})">عرض بيانات الدخول</button>
            </div>
        </div>
    `).join('');
}

function loadCommitteeNotes() {
    const notesList = document.getElementById('notesList');
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية الملاحظات الخاصة بالمعلم الحالي فقط
    const teacherNotes = committeeNotes.filter(note => note.teacherId === currentTeacher.id);
    
    if (teacherNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد ملاحظات</h3>
                <p>لم يتم إرسال أي ملاحظات من أعضاء اللجنة بعد</p>
            </div>
        `;
        return;
    }
    
    // ترتيب الملاحظات من الأحدث إلى الأقدم
    teacherNotes.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    notesList.innerHTML = teacherNotes.map(note => {
        const member = getCommitteeMemberById(note.memberId);
        return `
            <div class="note-card ${note.isRead ? 'read' : 'unread'}">
                <div class="note-header">
                    <div class="note-sender">
                        <strong>${member?.name || 'عضو غير معروف'}</strong>
                        <span class="sender-role">${member?.role || ''}</span>
                    </div>
                    <div class="note-date">${formatDate(note.sentAt)}</div>
                </div>
                <div class="note-content">
                    <p>${note.content}</p>
                </div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewNote(${note.id})">عرض</button>
                    ${!note.isRead ? `<button class="btn btn-sm btn-success" onclick="markNoteAsRead(${note.id})">تعليم كمقروء</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateCommitteeStats() {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherMembers = committeeMembers.filter(member => member.teacherId === currentTeacher.id);
    
    document.getElementById('totalMembers').textContent = teacherMembers.length;
    document.getElementById('activeMembers').textContent = teacherMembers.length; // يمكن إضافة حالة النشاط لاحقاً
}

function showAddMemberModal() {
    document.getElementById('addMemberModal').classList.add('show');
    document.getElementById('addMemberForm').reset();
}

function closeAddMemberModal() {
    document.getElementById('addMemberModal').classList.remove('show');
}

function saveCommitteeMember() {
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value;
    const username = document.getElementById('memberUsername').value.trim();
    const password = document.getElementById('memberPassword').value;
    
    if (!name || !role || !username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const existingMember = committeeMembers.find(member => member.username === username);
    
    if (existingMember) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    const currentTeacher = getCurrentUser();
    const newMember = {
        id: generateId(),
        teacherId: currentTeacher.id,
        name: name,
        role: role,
        username: username,
        password: password, // في تطبيق حقيقي يجب تشفير كلمة المرور
        createdAt: new Date().toISOString(),
        isActive: true
    };
    
    committeeMembers.push(newMember);
    localStorage.setItem('committeeMembers', JSON.stringify(committeeMembers));
    
    // إنشاء حساب مستخدم للعضو الجديد
    createCommitteeUserAccount(newMember);
    
    showAuthNotification('تم إضافة العضو بنجاح', 'success');
    closeAddMemberModal();
    loadCommitteeMembers();
    updateCommitteeStats();
}

function createCommitteeUserAccount(member) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const newUser = {
        id: generateId(),
        username: member.username,
        password: member.password,
        role: 'committee',
        name: member.name,
        teacherId: member.teacherId,
        committeeId: member.id,
        isActive: true,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
}

function editCommitteeMember(memberId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = committeeMembers.find(m => m.id === memberId);
    
    if (!member) {
        showAuthNotification('العضو غير موجود', 'error');
        return;
    }
    
    currentEditingMemberId = memberId;
    
    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberRole').value = member.role;
    document.getElementById('editMemberUsername').value = member.username;
    document.getElementById('editMemberPassword').value = '';
    
    document.getElementById('editMemberModal').classList.add('show');
}

function closeEditMemberModal() {
    document.getElementById('editMemberModal').classList.remove('show');
    currentEditingMemberId = null;
}

function updateCommitteeMember() {
    const name = document.getElementById('editMemberName').value.trim();
    const role = document.getElementById('editMemberRole').value;
    const username = document.getElementById('editMemberUsername').value.trim();
    const password = document.getElementById('editMemberPassword').value;
    
    if (!name || !role || !username) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const memberIndex = committeeMembers.findIndex(m => m.id === currentEditingMemberId);
    
    if (memberIndex === -1) {
        showAuthNotification('العضو غير موجود', 'error');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم (باستثناء العضو الحالي)
    const existingMember = committeeMembers.find(member => 
        member.username === username && member.id !== currentEditingMemberId
    );
    
    if (existingMember) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    // تحديث بيانات العضو
    committeeMembers[memberIndex].name = name;
    committeeMembers[memberIndex].role = role;
    committeeMembers[memberIndex].username = username;
    
    // تحديث كلمة المرور إذا تم إدخال واحدة جديدة
    if (password) {
        committeeMembers[memberIndex].password = password;
        updateCommitteeUserPassword(username, password);
    }
    
    localStorage.setItem('committeeMembers', JSON.stringify(committeeMembers));
    
    showAuthNotification('تم تحديث بيانات العضو بنجاح', 'success');
    closeEditMemberModal();
    loadCommitteeMembers();
}

function updateCommitteeUserPassword(username, newPassword) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === username && u.role === 'committee');
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function deleteCommitteeMember(memberId) {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟ سيتم إلغاء صلاحيته للدخول إلى النظام.')) {
        return;
    }
    
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = committeeMembers.find(m => m.id === memberId);
    
    if (!member) {
        showAuthNotification('العضو غير موجود', 'error');
        return;
    }
    
    // حذف العضو من اللجنة
    const updatedMembers = committeeMembers.filter(m => m.id !== memberId);
    localStorage.setItem('committeeMembers', JSON.stringify(updatedMembers));
    
    // تعطيل حساب المستخدم
    disableCommitteeUserAccount(member.username);
    
    showAuthNotification('تم حذف العضو بنجاح', 'success');
    loadCommitteeMembers();
    updateCommitteeStats();
}

function disableCommitteeUserAccount(username) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === username && u.role === 'committee');
    
    if (userIndex !== -1) {
        users[userIndex].isActive = false;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function viewMemberCredentials(memberId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = committeeMembers.find(m => m.id === memberId);
    
    if (!member) {
        showAuthNotification('العضو غير موجود', 'error');
        return;
    }
    
    const credentialsMessage = `
        بيانات الدخول للعضو:
        اسم المستخدم: ${member.username}
        كلمة المرور: ${member.password}
    `;
    
    alert(credentialsMessage);
}

function getCommitteeMemberById(memberId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    return committeeMembers.find(m => m.id === memberId);
}

function refreshNotes() {
    loadCommitteeNotes();
    showAuthNotification('تم تحديث الملاحظات', 'success');
}

function viewNote(noteId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const note = committeeNotes.find(n => n.id === noteId);
    
    if (!note) {
        showAuthNotification('الملاحظة غير موجودة', 'error');
        return;
    }
    
    const member = getCommitteeMemberById(note.memberId);
    
    alert(`
        المرسل: ${member?.name || 'غير معروف'}
        الصفة: ${member?.role || 'غير معروف'}
        التاريخ: ${formatDate(note.sentAt)}
        
        المحتوى:
        ${note.content}
    `);
    
    // تعليم الملاحظة كمقروءة إذا لم تكن مقروءة
    if (!note.isRead) {
        markNoteAsRead(noteId);
    }
}

function markNoteAsRead(noteId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const noteIndex = committeeNotes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
        committeeNotes[noteIndex].isRead = true;
        localStorage.setItem('committeeNotes', JSON.stringify(committeeNotes));
        loadCommitteeNotes();
    }
}

function deleteNote(noteId) {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
        return;
    }
    
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const updatedNotes = committeeNotes.filter(n => n.id !== noteId);
    localStorage.setItem('committeeNotes', JSON.stringify(updatedNotes));
    
    showAuthNotification('تم حذف الملاحظة بنجاح', 'success');
    loadCommitteeNotes();
}

// دالة مساعدة لتنسيق التاريخ
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
window.showAddMemberModal = showAddMemberModal;
window.closeAddMemberModal = closeAddMemberModal;
window.saveCommitteeMember = saveCommitteeMember;
window.editCommitteeMember = editCommitteeMember;
window.closeEditMemberModal = closeEditMemberModal;
window.updateCommitteeMember = updateCommitteeMember;
window.deleteCommitteeMember = deleteCommitteeMember;
window.viewMemberCredentials = viewMemberCredentials;
window.refreshNotes = refreshNotes;
window.viewNote = viewNote;
window.markNoteAsRead = markNoteAsRead;
window.deleteNote = deleteNote;
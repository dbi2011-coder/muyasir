// ============================================
// 📁 الملف: muyasir-main/assets/js/committee.js
// ============================================

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

// الدوال الرئيسية لواجهة عضو لجنة صعوبات التعلم
document.addEventListener('DOMContentLoaded', function() {
    initializeCommitteeDashboard();
});

function initializeCommitteeDashboard() {
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
        
        // تحديث الإحصائيات
        updateCommitteeStats();
        
        // تحميل المعلمون المتابعون
        loadAssignedTeachers();
        
        // تحميل النشاط الأخير
        loadCommitteeRecentActivity();
        
        // إنشاء بيانات تجريبية إذا لزم الأمر
        createSampleCommitteeData();
    }
}

function updateCommitteeStats() {
    const currentUser = getCurrentUser();
    
    // في تطبيق حقيقي، سيتم جلب هذه البيانات من قاعدة البيانات
    const assignedTeachers = getAssignedTeachersCount(currentUser.id);
    const totalStudents = getTotalStudentsCount(currentUser.id);
    const generatedReports = getGeneratedReportsCount(currentUser.id);
    const sentNotes = getSentNotesCount(currentUser.id);
    
    document.getElementById('assignedTeachers').textContent = assignedTeachers;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('generatedReports').textContent = generatedReports;
    document.getElementById('sentNotes').textContent = sentNotes;
}

function loadAssignedTeachers() {
    const teachersList = document.getElementById('teachersList');
    const currentUser = getCurrentUser();
    const assignedTeachers = getAssignedTeachers(currentUser.id);
    
    if (assignedTeachers.length === 0) {
        teachersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🏫</div>
                <h3>لا توجد معلمون متابعون</h3>
                <p>سيتم إضافة المعلمين المتابعين هنا</p>
            </div>
        `;
        return;
    }
    
    teachersList.innerHTML = assignedTeachers.map(teacher => `
        <div class="teacher-card" onclick="showTeacherDetails(${teacher.id})">
            <div class="teacher-header">
                <div class="teacher-avatar">${teacher.name.charAt(0)}</div>
                <div class="teacher-info">
                    <h4>${teacher.name}</h4>
                    <p>${teacher.phone || ''}</p>
                </div>
            </div>
            <div class="teacher-stats">
                <div class="stat-item">
                    <div class="stat-value-small">${teacher.studentCount || 0}</div>
                    <div class="stat-label-small">طالب</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value-small">${teacher.progressPercentage || 0}%</div>
                    <div class="stat-label-small">متوسط التقدم</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value-small">${teacher.lastReport || 'لا يوجد'}</div>
                    <div class="stat-label-small">آخر تقرير</div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadCommitteeRecentActivity() {
    const activityList = document.getElementById('activityList');
    const currentUser = getCurrentUser();
    const activities = getCommitteeRecentActivities(currentUser.id);
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>لا يوجد نشاط حديث</h3>
                <p>سيظهر نشاطك هنا عند بدء استخدام النظام</p>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${getCommitteeActivityIcon(activity.type)}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
        </div>
    `).join('');
}

function showTeacherDetails(teacherId) {
    const teacher = getTeacherById(teacherId);
    const teacherStudents = getTeacherStudents(teacherId);
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    document.getElementById('teacherModalTitle').textContent = teacher.name;
    document.getElementById('teacherDetailsContent').innerHTML = `
        <div class="teacher-details-info">
            <div class="detail-item">
                <strong>الاسم:</strong> ${teacher.name}
            </div>
            <div class="detail-item">
                <strong>اسم المستخدم:</strong> ${teacher.username || 'غير متوفر'}
            </div>
            <div class="detail-item">
                <strong>رقم الجوال:</strong> ${teacher.phone || 'غير متوفر'}
            </div>
            <div class="detail-item">
                <strong>عدد الطلاب:</strong> ${teacherStudents.length} طالب
            </div>
        </div>
        
        <h4>الطلاب التابعون:</h4>
        <div class="students-mini-list">
            ${teacherStudents.length > 0 ? teacherStudents.map(student => `
                <div class="student-item">
                    <span class="student-name">${student.name}</span>
                    <span class="student-grade">${student.grade || 'غير محدد'}</span>
                    <span class="student-progress">${student.progress || 0}%</span>
                </div>
            `).join('') : '<p class="no-data">لا توجد طلاب مسجلين</p>'}
        </div>
        
        <div class="teacher-stats-details">
            <h4>إحصائيات:</h4>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value-box">${getTeacherProgressAverage(teacherId)}%</div>
                    <div class="stat-label-box">متوسط التقدم</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value-box">${getTeacherTestsCount(teacherId)}</div>
                    <div class="stat-label-box">اختبارات منشأة</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value-box">${getTeacherLessonsCount(teacherId)}</div>
                    <div class="stat-label-box">دروس منشأة</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value-box">${getTeacherNotesCount(teacherId)}</div>
                    <div class="stat-label-box">ملاحظات مستلمة</div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('teacherDetailsModal').classList.add('show');
}

function closeTeacherModal() {
    document.getElementById('teacherDetailsModal').classList.remove('show');
}

function generateTeacherReport() {
    showAuthNotification('جاري إنشاء تقرير المعلم...', 'info');
    
    setTimeout(() => {
        showAuthNotification('تم إنشاء تقرير المعلم بنجاح', 'success');
        
        // إضافة نشاط
        addCommitteeActivity({
            type: 'report',
            title: 'أنشأت تقريراً',
            description: 'تقرير أداء المعلم'
        });
        
        updateCommitteeStats();
        closeTeacherModal();
    }, 2000);
}

function refreshTeachersList() {
    showAuthNotification('جاري تحديث قائمة المعلمين...', 'info');
    
    setTimeout(() => {
        loadAssignedTeachers();
        updateCommitteeStats();
        showAuthNotification('تم تحديث قائمة المعلمين', 'success');
    }, 1000);
}

function showAssignedTeachers() {
    window.location.href = 'dashboard.html#teachers';
}

function showRecentReports() {
    window.location.href = 'reports.html';
}

// دوال مساعدة
function getAssignedTeachersCount(committeeId) {
    const committeeTeachers = JSON.parse(localStorage.getItem('committeeTeachers') || '[]');
    return committeeTeachers.filter(ct => ct.committeeId === committeeId).length;
}

function getTotalStudentsCount(committeeId) {
    const committeeTeachers = JSON.parse(localStorage.getItem('committeeTeachers') || '[]');
    const assignedTeacherIds = committeeTeachers
        .filter(ct => ct.committeeId === committeeId)
        .map(ct => ct.teacherId);
    
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    let total = 0;
    assignedTeacherIds.forEach(teacherId => {
        total += students.filter(s => s.teacherId === teacherId).length;
    });
    
    return total;
}

function getGeneratedReportsCount(committeeId) {
    const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    return committeeReports.filter(cr => cr.committeeId === committeeId).length;
}

function getSentNotesCount(committeeId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    return committeeNotes.filter(cn => cn.committeeId === committeeId).length;
}

function getAssignedTeachers(committeeId) {
    const committeeTeachers = JSON.parse(localStorage.getItem('committeeTeachers') || '[]');
    const teacherIds = committeeTeachers
        .filter(ct => ct.committeeId === committeeId)
        .map(ct => ct.teacherId);
    
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    return teachers.filter(teacher => teacherIds.includes(teacher.id)).map(teacher => ({
        ...teacher,
        studentCount: students.filter(s => s.teacherId === teacher.id).length,
        progressPercentage: getTeacherProgressAverage(teacher.id),
        lastReport: getTeacherLastReportDate(teacher.id)
    }));
}

function getCommitteeRecentActivities(committeeId) {
    const activities = JSON.parse(localStorage.getItem('committeeActivities') || '[]');
    return activities
        .filter(activity => activity.committeeId === committeeId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
}

function getCommitteeActivityIcon(activityType) {
    const icons = {
        'report': '📊',
        'note': '📝',
        'view': '👁️',
        'login': '🔐',
        'logout': '🚪'
    };
    return icons[activityType] || '📄';
}

function getTeacherById(teacherId) {
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    return teachers.find(t => t.id === teacherId);
}

function getTeacherStudents(teacherId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.filter(s => s.teacherId === teacherId);
}

function getTeacherProgressAverage(teacherId) {
    const students = getTeacherStudents(teacherId);
    if (students.length === 0) return 0;
    
    const totalProgress = students.reduce((sum, student) => sum + (student.progress || 0), 0);
    return Math.round(totalProgress / students.length);
}

function getTeacherTestsCount(teacherId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    return tests.filter(t => t.teacherId === teacherId).length;
}

function getTeacherLessonsCount(teacherId) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    return lessons.filter(l => l.teacherId === teacherId).length;
}

function getTeacherNotesCount(teacherId) {
    const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    return notes.filter(n => n.teacherId === teacherId).length;
}

function getTeacherLastReportDate(teacherId) {
    const reports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    const teacherReports = reports.filter(r => r.teacherId === teacherId);
    
    if (teacherReports.length === 0) return 'لا يوجد';
    
    const lastReport = teacherReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return formatDateShort(lastReport.createdAt);
}

function formatDateShort(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function addCommitteeActivity(activity) {
    const currentUser = getCurrentUser();
    const activities = JSON.parse(localStorage.getItem('committeeActivities') || '[]');
    
    const newActivity = {
        id: generateId(),
        committeeId: currentUser.id,
        ...activity,
        timestamp: new Date().toISOString()
    };
    
    activities.push(newActivity);
    localStorage.setItem('committeeActivities', JSON.stringify(activities));
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

function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDateShort(dateString);
}

function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}

// إنشاء بيانات تجريبية للجنة (للتطوير)
function createSampleCommitteeData() {
    const currentUser = getCurrentUser();
    
    // بيانات المعلمون المتابعون
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    if (teachers.length === 0) return;
    
    const sampleCommitteeTeachers = [
        {
            id: generateId(),
            committeeId: currentUser.id,
            teacherId: teachers[0].id,
            assignedDate: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('committeeTeachers', JSON.stringify(sampleCommitteeTeachers));
    
    // بيانات النشاط
    const sampleCommitteeActivities = [
        {
            id: generateId(),
            committeeId: currentUser.id,
            type: 'login',
            title: 'تسجيل الدخول',
            description: 'تم تسجيل الدخول إلى النظام',
            timestamp: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('committeeActivities', JSON.stringify(sampleCommitteeActivities));
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
window.showTeacherDetails = showTeacherDetails;
window.closeTeacherModal = closeTeacherModal;
window.generateTeacherReport = generateTeacherReport;
window.refreshTeachersList = refreshTeachersList;
window.showAssignedTeachers = showAssignedTeachers;
window.showRecentReports = showRecentReports;

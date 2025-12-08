// ============================================
// 📁 الملف: muyasir-main/assets/js/teacher.js
// ============================================

// إدارة لوحة تحكم المعلم
let currentStudentId = null;
let currentMemberId = null;
let currentNoteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeTeacherDashboard();
    setupEventListeners();
});

function initializeTeacherDashboard() {
    // التحقق من المصادقة والدور
    const user = checkAuth();
    if (!user) {
        console.log('No authenticated user found');
        return;
    }
    
    if (user.role !== 'teacher') {
        showAuthNotification('غير مصرح لك بالوصول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }

    // تحديث واجهة المستخدم
    updateUserInterface(user);
    
    // تحميل البيانات حسب الصفحة الحالية
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('dashboard.html')) {
        loadTeacherDashboard();
    } else if (currentPage.includes('students.html')) {
        loadStudentsData();
    } else if (currentPage.includes('lessons.html')) {
        loadLessonsData();
    } else if (currentPage.includes('assignments.html')) {
        loadAssignmentsData();
    } else if (currentPage.includes('library.html')) {
        loadLibraryContent();
    } else if (currentPage.includes('committee.html')) {
        loadCommitteeData();
    } else if (currentPage.includes('messages.html')) {
        loadMessagesData();
    }
}

function updateUserInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
    } else {
        console.log('userName element not found');
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    } else {
        console.log('userAvatar element not found');
    }
}

function setupEventListeners() {
    // إعداد القائمة الجانبية
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                return;
            }
            
            // تحديث النشاط في القائمة
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // زر القائمة المتنقلة
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
}

// ============================================
// لوحة تحكم المعلم الرئيسية
// ============================================

function loadTeacherDashboard() {
    loadFeaturedStudents();
    loadImportantNotices();
    loadTeacherStats();
    loadRecentActivity();
}

function loadFeaturedStudents() {
    const studentsList = document.getElementById('featuredStudentsList');
    if (!studentsList) return;
    
    const currentUser = getCurrentUser();
    const students = getStudentsByTeacher(currentUser.id);
    
    if (students.length === 0) {
        studentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🎓</div>
                <h3>لا توجد طلاب</h3>
                <p>لم يتم إضافة أي طلاب بعد</p>
                <button class="btn btn-success" onclick="window.location.href='students.html'">
                    إضافة طلاب
                </button>
            </div>
        `;
        return;
    }
    
    // عرض 4 طلاب فقط
    const featuredStudents = students.slice(0, 4);
    
    studentsList.innerHTML = featuredStudents.map(student => {
        const progress = student.progress || 0;
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <div class="student-card">
                <div class="student-avatar">${student.name.charAt(0)}</div>
                <div class="student-name">${student.name}</div>
                <div class="student-progress">التقدم: ${progress}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                </div>
                <div class="student-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewStudent(${student.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadImportantNotices() {
    const noticesList = document.getElementById('noticesList');
    if (!noticesList) return;
    
    const notices = [
        {
            icon: '⚠️',
            title: 'اجتماع لجنة صعوبات التعلم',
            description: 'اجتماع أسبوعي يوم الأحد الساعة 10 صباحاً',
            time: 'غداً'
        },
        {
            icon: '📝',
            title: 'تقرير شهري',
            description: 'موعد تسليم التقارير الشهرية نهاية الأسبوع',
            time: '3 أيام'
        },
        {
            icon: '🎯',
            title: 'تحديث الأهداف',
            description: 'يرجى تحديث الأهداف التعليمية للطلاب',
            time: 'أسبوع'
        }
    ];
    
    noticesList.innerHTML = notices.map(notice => `
        <div class="notice-item">
            <div class="notice-icon">${notice.icon}</div>
            <div class="notice-content">
                <div class="notice-title">${notice.title}</div>
                <div class="notice-description">${notice.description}</div>
                <div class="notice-time">موعد: ${notice.time}</div>
            </div>
        </div>
    `).join('');
}

function loadTeacherStats() {
    const currentUser = getCurrentUser();
    const students = getStudentsByTeacher(currentUser.id);
    const assignments = getAssignmentsByTeacher(currentUser.id);
    const lessons = getLessonsByTeacher(currentUser.id);
    
    updateStatElement('totalStudents', students.length);
    updateStatElement('activeAssignments', assignments.filter(a => a.status === 'active').length);
    updateStatElement('completedLessons', lessons.filter(l => l.status === 'completed').length);
    updateStatElement('averageProgress', calculateAverageProgress(students));
}

function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;
    
    const activities = [
        {
            icon: '👨‍🎓',
            title: 'تم إضافة طالب جديد',
            time: 'منذ ساعتين',
            color: '#3498db'
        },
        {
            icon: '📝',
            title: 'تم تسليم واجب',
            time: 'منذ 4 ساعات',
            color: '#27ae60'
        },
        {
            icon: '📊',
            title: 'تم إنشاء اختبار تشخيصي',
            time: 'منذ يوم',
            color: '#f39c12'
        },
        {
            icon: '👥',
            title: 'رسالة جديدة من اللجنة',
            time: 'منذ يومين',
            color: '#9b59b6'
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color}">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// إدارة الطلاب
// ============================================

function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    
    if (!loadingState || !emptyState || !tableBody) {
        console.error('Missing elements in students page');
        return;
    }
    
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';
    
    setTimeout(() => {
        const currentUser = getCurrentUser();
        const students = getStudentsByTeacher(currentUser.id);
        
        loadingState.style.display = 'none';
        
        if (students.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        tableBody.innerHTML = students.map((student, index) => {
            const progress = student.progress || 0;
            const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
            const lastLogin = student.lastLogin ? formatDateShort(student.lastLogin) : 'لم يسجل دخول';
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>${student.grade || 'غير محدد'}</td>
                    <td>${student.subject || 'غير محدد'}</td>
                    <td>${lastLogin}</td>
                    <td>
                        <div class="progress-cell">
                            <div class="progress-text">${progress}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="student-actions">
                            <button class="btn btn-sm btn-primary" onclick="viewStudent(${student.id})" title="عرض">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="viewStudentDetails(${student.id})" title="تفاصيل">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="assignTest(${student.id})" title="تعيين اختبار">
                                <i class="fas fa-clipboard-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }, 1000);
}

function showAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('addStudentForm').reset();
    }
}

function closeAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function addNewStudent() {
    const form = document.getElementById('addStudentForm');
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // التحقق من صحة البيانات
    if (!name || !grade || !subject || !username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthNotification('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    
    // إنشاء الطالب الجديد
    const newStudent = {
        id: generateId(),
        username: username,
        password: password,
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginAttempts: 0
    };
    
    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));
    
    showAuthNotification('تم إضافة الطالب بنجاح', 'success');
    closeAddStudentModal();
    loadStudentsData();
    
    // إضافة سجل النظام
    addSystemLog(`تم إضافة طالب جديد: ${name}`, 'user');
}

function viewStudent(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

function editStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    currentStudentId = studentId;
    
    // تعبئة النموذج
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentGrade').value = student.grade || '';
    document.getElementById('editStudentSubject').value = student.subject || '';
    document.getElementById('editStudentStatus').value = student.status || 'active';
    
    const modal = document.getElementById('editStudentModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeEditStudentModal() {
    const modal = document.getElementById('editStudentModal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentStudentId = null;
}

function updateStudent() {
    const studentId = parseInt(document.getElementById('editStudentId').value);
    const name = document.getElementById('editStudentName').value.trim();
    const grade = document.getElementById('editStudentGrade').value;
    const subject = document.getElementById('editStudentSubject').value;
    const status = document.getElementById('editStudentStatus').value;
    
    if (!name || !grade || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentIndex = users.findIndex(u => u.id === studentId && u.role === 'student');
    
    if (studentIndex === -1) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    // تحديث البيانات
    users[studentIndex].name = name;
    users[studentIndex].grade = grade;
    users[studentIndex].subject = subject;
    users[studentIndex].status = status;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    showAuthNotification('تم تحديث بيانات الطالب بنجاح', 'success');
    closeEditStudentModal();
    loadStudentsData();
    
    // إضافة سجل النظام
    addSystemLog(`تم تحديث بيانات الطالب: ${name}`, 'user');
}

function deleteStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف الطالب ${student.name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        const updatedUsers = users.filter(u => u.id !== studentId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        showAuthNotification('تم حذف الطالب بنجاح', 'success');
        loadStudentsData();
        
        // إضافة سجل النظام
        addSystemLog(`تم حذف الطالب: ${student.name}`, 'user');
    }
}

function viewStudentDetails(studentId) {
    // عرض صفحة تفاصيل الطالب
    window.location.href = `student-details.html?id=${studentId}`;
}

function assignTest(studentId) {
    // توجيه إلى صفحة تعيين الاختبارات
    window.location.href = `assign-test.html?studentId=${studentId}`;
}

function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length < 7) return;
        
        const name = cells[1].textContent.toLowerCase();
        const grade = cells[2].textContent.toLowerCase();
        const subject = cells[3].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || grade.includes(searchTerm) || subject.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterStudents() {
    const filter = document.getElementById('studentFilter').value;
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        if (filter === 'all') {
            row.style.display = '';
        } else {
            const subject = row.cells[3].textContent;
            if (subject === filter) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// ============================================
// إدارة الدروس
// ============================================

function loadLessonsData() {
    const lessonsList = document.getElementById('lessonsList');
    if (!lessonsList) return;
    
    const currentUser = getCurrentUser();
    const lessons = getLessonsByTeacher(currentUser.id);
    
    if (lessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس</h3>
                <p>قم بإضافة أول درس</p>
                <button class="btn btn-success" onclick="showAddLessonModal()">
                    إضافة درس جديد
                </button>
            </div>
        `;
        return;
    }
    
    lessonsList.innerHTML = lessons.map(lesson => {
        const statusClass = lesson.status === 'completed' ? 'completed' : 
                          lesson.status === 'in-progress' ? 'in-progress' : 'pending';
        
        return `
            <div class="lesson-item ${statusClass}">
                <div class="lesson-header">
                    <h5>${lesson.title}</h5>
                    <span class="lesson-status">${getLessonStatusText(lesson.status)}</span>
                </div>
                <div class="lesson-details">
                    <p><strong>المادة:</strong> ${lesson.subject}</p>
                    <p><strong>الوصف:</strong> ${lesson.description || 'لا يوجد'}</p>
                    <p><strong>تاريخ الإنشاء:</strong> ${formatDateShort(lesson.createdAt)}</p>
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})">
                        عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})">
                        تعديل
                    </button>
                    <button class="btn btn-sm btn-success" onclick="assignLesson(${lesson.id})">
                        تعيين
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddLessonModal() {
    const modal = document.getElementById('addLessonModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAddLessonModal() {
    const modal = document.getElementById('addLessonModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ============================================
// إدارة الواجبات
// ============================================

function loadAssignmentsData() {
    const assignmentsList = document.getElementById('assignmentsList');
    if (!assignmentsList) return;
    
    const currentUser = getCurrentUser();
    const assignments = getAssignmentsByTeacher(currentUser.id);
    
    if (assignments.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد واجبات</h3>
                <p>قم بإضافة أول واجب</p>
                <button class="btn btn-success" onclick="showAddAssignmentModal()">
                    إضافة واجب جديد
                </button>
            </div>
        `;
        return;
    }
    
    assignmentsList.innerHTML = assignments.map(assignment => {
        const statusClass = assignment.status === 'completed' ? 'completed' : 
                          assignment.status === 'in-progress' ? 'in-progress' : 'pending';
        
        return `
            <div class="assignment-item ${statusClass}">
                <div class="assignment-header">
                    <h5>${assignment.title}</h5>
                    <span class="assignment-status">${getAssignmentStatusText(assignment.status)}</span>
                </div>
                <div class="assignment-details">
                    <p><strong>الطلاب:</strong> ${assignment.studentsCount || 0} طالب</p>
                    <p><strong>موعد التسليم:</strong> ${formatDateShort(assignment.dueDate)}</p>
                    <p><strong>الوصف:</strong> ${assignment.description || 'لا يوجد'}</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewAssignment(${assignment.id})">
                        عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editAssignment(${assignment.id})">
                        تعديل
                    </button>
                    <button class="btn btn-sm btn-info" onclick="gradeAssignment(${assignment.id})">
                        تقييم
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddAssignmentModal() {
    const modal = document.getElementById('addAssignmentModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAddAssignmentModal() {
    const modal = document.getElementById('addAssignmentModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ============================================
// مكتبة المحتوى
// ============================================

function loadLibraryContent() {
    // سيتم تنفيذها في ملف content-library.js المنفصل
    console.log('Loading library content...');
}

// ============================================
// لجنة صعوبات التعلم
// ============================================

function loadCommitteeData() {
    const membersList = document.getElementById('membersList');
    const notesList = document.getElementById('notesList');
    
    if (membersList) {
        loadCommitteeMembers();
    }
    
    if (notesList) {
        loadCommitteeNotes();
    }
}

function loadCommitteeMembers() {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;
    
    const currentUser = getCurrentUser();
    const committeeMembers = getCommitteeMembersByTeacher(currentUser.id);
    
    if (committeeMembers.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>لا توجد أعضاء في اللجنة</h3>
                <p>قم بإضافة أعضاء لجنة صعوبات التعلم</p>
                <button class="btn btn-success" onclick="showAddMemberModal()">
                    إضافة عضو جديد
                </button>
            </div>
        `;
        return;
    }
    
    membersList.innerHTML = committeeMembers.map(member => `
        <div class="member-card">
            <div class="member-info">
                <div class="member-avatar">${member.name.charAt(0)}</div>
                <div class="member-details">
                    <h4>${member.name}</h4>
                    <div class="member-meta">
                        <span class="member-role">${member.role}</span>
                        <span class="member-username">${member.username}</span>
                    </div>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn btn-sm btn-primary" onclick="editCommitteeMember(${member.id})">
                    تعديل
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCommitteeMember(${member.id})">
                    حذف
                </button>
                <button class="btn btn-sm btn-info" onclick="sendMessageToMember(${member.id})">
                    مراسلة
                </button>
            </div>
        </div>
    `).join('');
}

function showAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function addNewMember() {
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value;
    const username = document.getElementById('memberUsername').value.trim();
    const password = document.getElementById('memberPassword').value;
    
    if (!name || !role || !username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    // التحقق من عدم تكرار اسم المستخدم
    const existingMember = committeeMembers.find(m => 
        m.username === username && m.teacherId === currentUser.id
    );
    
    if (existingMember) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    const newMember = {
        id: generateId(),
        teacherId: currentUser.id,
        name: name,
        role: role,
        username: username,
        password: password,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    committeeMembers.push(newMember);
    localStorage.setItem('committeeMembers', JSON.stringify(committeeMembers));
    
    showAuthNotification('تم إضافة العضو بنجاح', 'success');
    closeAddMemberModal();
    loadCommitteeMembers();
    
    addSystemLog(`تم إضافة عضو لجنة: ${name}`, 'user');
}

function loadCommitteeNotes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    const currentUser = getCurrentUser();
    const committeeNotes = getCommitteeNotesByTeacher(currentUser.id);
    
    if (committeeNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد ملاحظات</h3>
                <p>لم يتم إرسال أي ملاحظات بعد</p>
            </div>
        `;
        return;
    }
    
    // ترتيب الملاحظات من الأحدث إلى الأقدم
    committeeNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    notesList.innerHTML = committeeNotes.map(note => {
        const isUnread = !note.isRead;
        
        return `
            <div class="note-card ${isUnread ? 'unread' : 'read'}">
                <div class="note-header">
                    <div class="note-sender">
                        <strong>${note.senderName || 'عضو لجنة'}</strong>
                        <span class="sender-role">${note.senderRole || ''}</span>
                    </div>
                    <div class="note-date">${formatDateShort(note.createdAt)}</div>
                </div>
                <div class="note-content">
                    <p>${note.content}</p>
                </div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewNote(${note.id})">
                        عرض
                    </button>
                    ${isUnread ? `
                        <button class="btn btn-sm btn-success" onclick="markNoteAsRead(${note.id})">
                            تعليم كمقروء
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showNewNoteModal() {
    const modal = document.getElementById('newNoteModal');
    if (modal) {
        modal.classList.add('show');
        populateMembersForNote();
    }
}

function closeNewNoteModal() {
    const modal = document.getElementById('newNoteModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function populateMembersForNote() {
    const memberSelect = document.getElementById('noteMember');
    if (!memberSelect) return;
    
    const currentUser = getCurrentUser();
    const committeeMembers = getCommitteeMembersByTeacher(currentUser.id);
    
    memberSelect.innerHTML = '<option value="">اختر العضو</option>';
    
    committeeMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.name} - ${member.role}`;
        memberSelect.appendChild(option);
    });
}

function sendNewNote() {
    const memberId = parseInt(document.getElementById('noteMember').value);
    const subject = document.getElementById('noteSubject').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const priority = document.getElementById('notePriority').value;
    
    if (!memberId || !subject || !content) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    
    const newNote = {
        id: generateId(),
        teacherId: currentUser.id,
        memberId: memberId,
        subject: subject,
        content: content,
        priority: priority,
        isRead: false,
        createdAt: new Date().toISOString(),
        senderName: currentUser.name,
        senderRole: 'معلم'
    };
    
    committeeNotes.push(newNote);
    localStorage.setItem('committeeNotes', JSON.stringify(committeeNotes));
    
    showAuthNotification('تم إرسال الملاحظة بنجاح', 'success');
    closeNewNoteModal();
    loadCommitteeNotes();
    
    addSystemLog(`تم إرسال ملاحظة لعضو اللجنة`, 'message');
}

function viewNote(noteId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const note = committeeNotes.find(n => n.id === noteId);
    
    if (!note) {
        showAuthNotification('الملاحظة غير موجودة', 'error');
        return;
    }
    
    currentNoteId = noteId;
    
    document.getElementById('viewNoteSubject').textContent = note.subject;
    document.getElementById('viewNoteContent').textContent = note.content;
    document.getElementById('viewNoteDate').textContent = formatDate(note.createdAt);
    document.getElementById('viewNotePriority').textContent = getPriorityText(note.priority);
    
    // تعليم الملاحظة كمقروءة
    if (!note.isRead) {
        markNoteAsRead(noteId);
    }
    
    const modal = document.getElementById('viewNoteModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeViewNoteModal() {
    const modal = document.getElementById('viewNoteModal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentNoteId = null;
}

function markNoteAsRead(noteId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const noteIndex = committeeNotes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
        committeeNotes[noteIndex].isRead = true;
        localStorage.setItem('committeeNotes', JSON.stringify(committeeNotes));
        
        // تحديث العرض إذا كانت الصفحة مفتوحة
        if (window.location.pathname.includes('committee.html')) {
            loadCommitteeNotes();
        }
    }
}

function replyToNote() {
    if (!currentNoteId) return;
    
    const replyContent = prompt('أدخل ردك على الملاحظة:');
    if (!replyContent || replyContent.trim() === '') return;
    
    showAuthNotification('تم إرسال الرد بنجاح', 'success');
    closeViewNoteModal();
}

// ============================================
// نظام المراسلات
// ============================================

function loadMessagesData() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    const currentUser = getCurrentUser();
    const messages = getMessagesByTeacher(currentUser.id);
    
    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✉️</div>
                <h3>لا توجد رسائل</h3>
                <p>لم يتم إرسال أو استقبال أي رسائل بعد</p>
            </div>
        `;
        return;
    }
    
    // ترتيب الرسائل من الأحدث إلى الأقدم
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    messagesList.innerHTML = messages.map(message => {
        const isUnread = !message.isRead;
        const isIncoming = message.type === 'incoming';
        
        return `
            <div class="message-item ${isUnread ? 'unread' : 'read'}">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar">${message.senderName?.charAt(0) || '?'}</div>
                        <div class="sender-info">
                            <strong>${message.senderName || 'مرسل غير معروف'}</strong>
                            <div class="message-subject">${message.subject || 'بدون عنوان'}</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <div class="message-date">${formatDateShort(message.createdAt)}</div>
                        <div class="message-type">${isIncoming ? 'وارد' : 'صادر'}</div>
                    </div>
                </div>
                <div class="message-preview">
                    ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewMessage(${message.id})">
                        قراءة
                    </button>
                    ${isUnread ? `
                        <button class="btn btn-sm btn-success" onclick="markMessageAsRead(${message.id})">
                            تعليم كمقروء
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteMessage(${message.id})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showNewMessageModal() {
    const modal = document.getElementById('newMessageModal');
    if (modal) {
        modal.classList.add('show');
        populateMessageRecipients();
    }
}

function closeNewMessageModal() {
    const modal = document.getElementById('newMessageModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function populateMessageRecipients() {
    const recipientSelect = document.getElementById('messageRecipient');
    if (!recipientSelect) return;
    
    const currentUser = getCurrentUser();
    
    // إضافة الطلاب
    const students = getStudentsByTeacher(currentUser.id);
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = `student_${student.id}`;
        option.textContent = `👨‍🎓 ${student.name} (طالب)`;
        recipientSelect.appendChild(option);
    });
    
    // إضافة أعضاء اللجنة
    const committeeMembers = getCommitteeMembersByTeacher(currentUser.id);
    committeeMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = `member_${member.id}`;
        option.textContent = `👥 ${member.name} (${member.role})`;
        recipientSelect.appendChild(option);
    });
}

// ============================================
// دوال مساعدة
// ============================================

function getStudentsByTeacher(teacherId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.filter(u => u.role === 'student' && u.teacherId === teacherId);
}

function getLessonsByTeacher(teacherId) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    return lessons.filter(l => l.teacherId === teacherId);
}

function getAssignmentsByTeacher(teacherId) {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    return assignments.filter(a => a.teacherId === teacherId);
}

function getCommitteeMembersByTeacher(teacherId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    return committeeMembers.filter(m => m.teacherId === teacherId);
}

function getCommitteeNotesByTeacher(teacherId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    return committeeNotes.filter(n => n.teacherId === teacherId);
}

function getMessagesByTeacher(teacherId) {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    return messages.filter(m => m.teacherId === teacherId);
}

function calculateAverageProgress(students) {
    if (students.length === 0) return 0;
    
    const totalProgress = students.reduce((sum, student) => sum + (student.progress || 0), 0);
    return Math.round(totalProgress / students.length);
}

function getLessonStatusText(status) {
    const statusMap = {
        'completed': 'مكتمل',
        'in-progress': 'قيد التنفيذ',
        'pending': 'معلق'
    };
    return statusMap[status] || status;
}

function getAssignmentStatusText(status) {
    const statusMap = {
        'completed': 'مكتمل',
        'in-progress': 'قيد التصحيح',
        'pending': 'معلق',
        'overdue': 'متأخر'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'low': 'منخفضة',
        'normal': 'عادية',
        'high': 'عالية',
        'urgent': 'عاجلة'
    };
    return priorityMap[priority] || priority;
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// دالة مساعدة لإضافة سجل النظام
function addSystemLog(message, type = 'info') {
    try {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        const currentUser = getCurrentUser();
        
        logs.push({
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            user: currentUser ? currentUser.name : 'معلم'
        });
        
        // الاحتفاظ فقط بآخر 1000 سجل
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('systemLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('خطأ في إضافة سجل النظام:', error);
    }
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.addNewStudent = addNewStudent;
window.editStudent = editStudent;
window.closeEditStudentModal = closeEditStudentModal;
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;
window.searchStudents = searchStudents;
window.filterStudents = filterStudents;

window.showAddLessonModal = showAddLessonModal;
window.closeAddLessonModal = closeAddLessonModal;

window.showAddAssignmentModal = showAddAssignmentModal;
window.closeAddAssignmentModal = closeAddAssignmentModal;

window.showAddMemberModal = showAddMemberModal;
window.closeAddMemberModal = closeAddMemberModal;
window.addNewMember = addNewMember;
window.showNewNoteModal = showNewNoteModal;
window.closeNewNoteModal = closeNewNoteModal;
window.sendNewNote = sendNewNote;
window.viewNote = viewNote;
window.closeViewNoteModal = closeViewNoteModal;
window.replyToNote = replyToNote;

window.showNewMessageModal = showNewMessageModal;
window.closeNewMessageModal = closeNewMessageModal;

window.logout = logout;

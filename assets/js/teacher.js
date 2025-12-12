// ============================================
// 📁 الملف: muyasir-main/assets/js/teacher.js
// ============================================

// إدارة لوحة تحكم المعلم
document.addEventListener('DOMContentLoaded', function() {
    initializeTeacherDashboard();
});

function initializeTeacherDashboard() {
    // التحقق من المصادقة والدور
    const user = checkAuth();
    if (!user) return;
    
    if (user.role !== 'teacher') {
        showAuthNotification('غير مصرح لك بالوصول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }

    // تحديث واجهة المستخدم
    updateUserInterface(user);
    
    // تحميل البيانات حسب الصفحة
    if (window.location.pathname.includes('dashboard.html')) {
        loadTeacherStats();
        loadFeaturedStudents();
        loadImportantNotices();
    }
    
    // تحميل مكتبة المحتوى التعليمي
    if (window.location.pathname.includes('content-library.html')) {
        loadContentLibrary();
    }
    
    // تحميل صفحة ملف الطالب
    if (window.location.pathname.includes('student-profile.html')) {
        const studentId = getStudentIdFromUrl();
        if (studentId) {
            loadStudentProfile(studentId);
        }
    }
    
    // تحميل لجنة صعوبات التعلم
    if (window.location.pathname.includes('learning-difficulties.html')) {
        loadLearningDifficultiesCommittee();
    }
}

// ============================================
// لوحة التحكم الرئيسية للمعلم
// ============================================

function loadTeacherStats() {
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = getCurrentUser();
        
        // طلاب المعلم
        const teacherStudents = users.filter(u => 
            u.role === 'student' && u.teacherId === currentUser.id
        );
        
        // الواجبات المعلقة
        const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        const pendingAssignments = assignments.filter(a => 
            a.teacherId === currentUser.id && a.status === 'pending'
        );
        
        // الاختبارات القادمة
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const upcomingTests = tests.filter(t => 
            t.teacherId === currentUser.id && t.status === 'scheduled'
        );
        
        // التقارير الجديدة
        const reports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
        const newReports = reports.filter(r => 
            !r.isRead && r.teacherId === currentUser.id
        );
        
        document.getElementById('totalStudents').textContent = teacherStudents.length;
        document.getElementById('pendingAssignments').textContent = pendingAssignments.length;
        document.getElementById('upcomingTests').textContent = upcomingTests.length;
        document.getElementById('newReports').textContent = newReports.length;
    }, 1000);
}

function loadFeaturedStudents() {
    const featuredList = document.getElementById('featuredStudentsList');
    if (!featuredList) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = getCurrentUser();
    
    const teacherStudents = users
        .filter(u => u.role === 'student' && u.teacherId === currentUser.id)
        .slice(0, 4); // عرض أول 4 طلاب فقط

    if (teacherStudents.length === 0) {
        featuredList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🎓</div>
                <h3>لا توجد طلاب</h3>
                <p>قم بإضافة طلاب للبدء</p>
            </div>
        `;
        return;
    }

    featuredList.innerHTML = teacherStudents.map(student => {
        const progress = student.progress || Math.floor(Math.random() * 100);
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <div class="student-card">
                <div class="student-avatar">
                    ${student.name.charAt(0)}
                </div>
                <div class="student-name">${student.name}</div>
                <div class="student-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color)"></div>
                    </div>
                    <span>${progress}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function loadImportantNotices() {
    const noticesList = document.getElementById('importantNoticesList');
    if (!noticesList) return;

    const notices = [
        {
            icon: '📋',
            title: 'تقرير متابعة الطلاب',
            description: 'يرجى إكمال تقرير متابعة الطلاب للفصل الأول'
        },
        {
            icon: '📅',
            title: 'اجتماع اللجنة',
            description: 'اجتماع لجنة صعوبات التعلم يوم الأربعاء القادم'
        },
        {
            icon: '📊',
            title: 'تحديث الاختبارات',
            description: 'تم تحديث بنك الأسئلة للفصل الدراسي الجديد'
        }
    ];

    noticesList.innerHTML = notices.map(notice => `
        <div class="notice-item">
            <div class="notice-icon">${notice.icon}</div>
            <div class="notice-content">
                <div class="notice-title">${notice.title}</div>
                <div class="notice-description">${notice.description}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// مكتبة المحتوى التعليمي
// ============================================

function loadContentLibrary() {
    loadLessonsContent();
    loadTestsContent();
    loadExercisesContent();
    loadTeachingObjectives();
}

function loadLessonsContent() {
    const lessonsList = document.getElementById('lessonsList');
    if (!lessonsList) return;

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentUser = getCurrentUser();
    
    const teacherLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);

    if (teacherLessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس</h3>
                <p>قم بإنشاء دروس جديدة لطلابك</p>
                <button class="btn btn-success" onclick="showAddLessonModal()">إنشاء درس جديد</button>
            </div>
        `;
        return;
    }

    lessonsList.innerHTML = teacherLessons.map(lesson => `
        <div class="content-card">
            <div class="content-header">
                <h4>${lesson.title}</h4>
                <span class="content-badge subject-${lesson.subject.replace(/\s/g, '')}">
                    ${lesson.subject}
                </span>
            </div>
            <div class="content-body">
                <p>${lesson.description || 'لا يوجد وصف'}</p>
            </div>
            <div class="content-meta">
                <span class="strategy">${lesson.strategy || 'غير محدد'}</span>
                <span class="priority ${lesson.priority}">${lesson.priority === 'high' ? 'عالية' : 'عادية'}</span>
                <span class="objectives-status ${lesson.hasObjectives ? 'linked' : 'not-linked'}">
                    ${lesson.hasObjectives ? 'مرتبط بأهداف' : 'غير مرتبط'}
                </span>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})">عرض</button>
                <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})">حذف</button>
                <button class="btn btn-sm btn-success" onclick="assignLesson(${lesson.id})">تعيين</button>
            </div>
        </div>
    `).join('');
}

function loadTestsContent() {
    const testsList = document.getElementById('testsList');
    if (!testsList) return;

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentUser = getCurrentUser();
    
    const teacherTests = tests.filter(test => test.teacherId === currentUser.id);

    if (teacherTests.length === 0) {
        testsList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات</h3>
                <p>قم بإنشاء اختبارات جديدة لطلابك</p>
                <button class="btn btn-success" onclick="showAddTestModal()">إنشاء اختبار جديد</button>
            </div>
        `;
        return;
    }

    testsList.innerHTML = teacherTests.map(test => `
        <div class="content-card">
            <div class="content-header">
                <h4>${test.title}</h4>
                <span class="content-badge subject-${test.subject.replace(/\s/g, '')}">
                    ${test.subject}
                </span>
            </div>
            <div class="content-body">
                <p>${test.description || 'لا يوجد وصف'}</p>
            </div>
            <div class="content-meta">
                <span class="questions-count">${test.questionsCount || 0} سؤال</span>
                <span class="total-grade">${test.totalGrade || 0} درجة</span>
                <span class="test-status ${test.status}">${getTestStatusText(test.status)}</span>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">عرض</button>
                <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">حذف</button>
                <button class="btn btn-sm btn-success" onclick="assignTest(${test.id})">تعيين</button>
            </div>
        </div>
    `).join('');
}

function loadExercisesContent() {
    const exercisesList = document.getElementById('exercisesList');
    if (!exercisesList) return;

    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    const currentUser = getCurrentUser();
    
    const teacherExercises = exercises.filter(exercise => exercise.teacherId === currentUser.id);

    if (teacherExercises.length === 0) {
        exercisesList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">💪</div>
                <h3>لا توجد تمارين</h3>
                <p>قم بإنشاء تمارين جديدة لطلابك</p>
                <button class="btn btn-success" onclick="showAddExerciseModal()">إنشاء تمرين جديد</button>
            </div>
        `;
        return;
    }

    exercisesList.innerHTML = teacherExercises.map(exercise => `
        <div class="content-card">
            <div class="content-header">
                <h4>${exercise.title}</h4>
                <span class="content-badge subject-${exercise.subject.replace(/\s/g, '')}">
                    ${exercise.subject}
                </span>
            </div>
            <div class="content-body">
                <p>${exercise.description || 'لا يوجد وصف'}</p>
            </div>
            <div class="content-meta">
                <span class="exercises-count">${exercise.itemsCount || 0} تمرين</span>
                <span class="strategy">${exercise.strategy || 'غير محدد'}</span>
                <span class="priority ${exercise.priority}">${exercise.priority === 'high' ? 'عالية' : 'عادية'}</span>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewExercise(${exercise.id})">عرض</button>
                <button class="btn btn-sm btn-warning" onclick="editExercise(${exercise.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteExercise(${exercise.id})">حذف</button>
                <button class="btn btn-sm btn-success" onclick="assignExercise(${exercise.id})">تعيين</button>
            </div>
        </div>
    `).join('');
}

function loadTeachingObjectives() {
    const objectivesList = document.getElementById('objectivesList');
    if (!objectivesList) return;

    const objectives = JSON.parse(localStorage.getItem('teachingObjectives') || '[]');
    const currentUser = getCurrentUser();
    
    const teacherObjectives = objectives.filter(obj => obj.teacherId === currentUser.id);

    if (teacherObjectives.length === 0) {
        objectivesList.innerHTML = `
            <div class="no-objectives">
                <p>لا توجد أهداف تعليمية مضافة</p>
                <button class="btn btn-sm btn-success" onclick="showAddObjectiveModal()">إضافة هدف تعليمي</button>
            </div>
        `;
        return;
    }

    objectivesList.innerHTML = teacherObjectives.map(objective => `
        <div class="objective-item">
            <div class="objective-header">
                <h4>${objective.title}</h4>
                <span class="content-badge">${objective.subject}</span>
            </div>
            <div class="teaching-objectives">
                ${objective.objectives.map((obj, index) => `
                    <div class="teaching-objective">
                        ${index + 1}. ${obj}
                    </div>
                `).join('')}
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="linkObjectiveToContent(${objective.id})">ربط بمحتوى</button>
                <button class="btn btn-sm btn-warning" onclick="editObjective(${objective.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteObjective(${objective.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// ملف الطالب
// ============================================

function getStudentIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

function loadStudentProfile(studentId) {
    const student = getStudentById(studentId);
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        setTimeout(() => {
            window.location.href = 'students.html';
        }, 2000);
        return;
    }

    // تحديث معلومات الطالب الأساسية
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentGrade').textContent = student.grade || 'غير محدد';
    document.getElementById('studentSubject').textContent = student.subject || 'غير محدد';
    document.getElementById('studentProgress').textContent = `${student.progress || 0}%`;
    
    // تحديث صورة الطالب أو الأحرف الأولى
    const avatar = document.getElementById('studentAvatar');
    if (student.avatar) {
        avatar.innerHTML = `<img src="${student.avatar}" alt="${student.name}">`;
    } else {
        avatar.textContent = student.name.charAt(0);
    }

    // تحميل بيانات التبويبات
    loadStudentTests(studentId);
    loadStudentLessons(studentId);
    loadStudentAssignments(studentId);
    loadStudentIEP(studentId);
    loadStudentProgress(studentId);
}

function loadStudentTests(studentId) {
    const testsContainer = document.getElementById('studentTestsList');
    if (!testsContainer) return;

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const studentTests = tests.filter(test => test.assignedStudents?.includes(studentId));

    if (studentTests.length === 0) {
        testsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات</h3>
                <p>لم يتم تعيين أي اختبارات لهذا الطالب بعد</p>
            </div>
        `;
        return;
    }

    testsContainer.innerHTML = studentTests.map(test => {
        const testStatus = getTestStatusForStudent(test, studentId);
        const statusClass = getTestStatusClass(testStatus);
        
        return `
            <div class="test-info-card">
                <div class="test-header">
                    <h4>${test.title}</h4>
                    <span class="test-status ${statusClass}">${getTestStatusText(testStatus)}</span>
                </div>
                <div class="test-details">
                    <p><strong>المادة:</strong> ${test.subject}</p>
                    <p><strong>عدد الأسئلة:</strong> ${test.questionsCount || 0}</p>
                    <p><strong>الدرجة الكلية:</strong> ${test.totalGrade || 0}</p>
                    ${test.deadline ? `<p><strong>الموعد النهائي:</strong> ${formatDate(test.deadline)}</p>` : ''}
                </div>
                <div class="test-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewStudentTest(${test.id}, ${studentId})">عرض</button>
                    ${testStatus === 'assigned' ? `<button class="btn btn-sm btn-success" onclick="startTest(${test.id}, ${studentId})">بدء الاختبار</button>` : ''}
                    ${testStatus === 'completed' ? `<button class="btn btn-sm btn-info" onclick="viewTestResults(${test.id}, ${studentId})">النتائج</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadStudentLessons(studentId) {
    const lessonsContainer = document.getElementById('studentLessonsList');
    if (!lessonsContainer) return;

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const studentLessons = lessons.filter(lesson => lesson.assignedStudents?.includes(studentId));

    if (studentLessons.length === 0) {
        lessonsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس</h3>
                <p>لم يتم تعيين أي دروس لهذا الطالب بعد</p>
            </div>
        `;
        return;
    }

    lessonsContainer.innerHTML = studentLessons.map(lesson => {
        const lessonStatus = getLessonStatusForStudent(lesson, studentId);
        const statusClass = getLessonStatusClass(lessonStatus);
        
        return `
            <div class="lesson-item ${statusClass}">
                <div class="lesson-header">
                    <h5>${lesson.title}</h5>
                    <span class="lesson-status ${statusClass}">${getLessonStatusText(lessonStatus)}</span>
                </div>
                <div class="lesson-details">
                    <p><strong>المادة:</strong> ${lesson.subject}</p>
                    <p><strong>الاستراتيجية:</strong> ${lesson.strategy || 'غير محدد'}</p>
                    ${lesson.duration ? `<p><strong>المدة:</strong> ${lesson.duration} دقيقة</p>` : ''}
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewStudentLesson(${lesson.id}, ${studentId})">عرض</button>
                    ${lessonStatus === 'assigned' ? `<button class="btn btn-sm btn-success" onclick="startLesson(${lesson.id}, ${studentId})">بدء الدرس</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadStudentAssignments(studentId) {
    const assignmentsContainer = document.getElementById('studentAssignmentsList');
    if (!assignmentsContainer) return;

    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const studentAssignments = assignments.filter(assignment => assignment.assignedStudents?.includes(studentId));

    if (studentAssignments.length === 0) {
        assignmentsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>لا توجد واجبات</h3>
                <p>لم يتم تعيين أي واجبات لهذا الطالب بعد</p>
            </div>
        `;
        return;
    }

    assignmentsContainer.innerHTML = studentAssignments.map(assignment => {
        const assignmentStatus = getAssignmentStatusForStudent(assignment, studentId);
        const statusClass = getAssignmentStatusClass(assignmentStatus);
        const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();
        
        return `
            <div class="assignment-item ${statusClass} ${isOverdue ? 'overdue' : ''}">
                <div class="assignment-header">
                    <h5>${assignment.title}</h5>
                    <span class="assignment-status ${statusClass}">${getAssignmentStatusText(assignmentStatus)}</span>
                </div>
                <div class="assignment-details">
                    <p><strong>المادة:</strong> ${assignment.subject}</p>
                    <p><strong>الوصف:</strong> ${assignment.description || 'لا يوجد وصف'}</p>
                    ${assignment.deadline ? `<p><strong>الموعد النهائي:</strong> ${formatDate(assignment.deadline)} ${isOverdue ? '⏰' : ''}</p>` : ''}
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewStudentAssignment(${assignment.id}, ${studentId})">عرض</button>
                    ${assignmentStatus === 'submitted' ? `<button class="btn btn-sm btn-info" onclick="gradeAssignment(${assignment.id}, ${studentId})">تصحيح</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadStudentIEP(studentId) {
    const iepContainer = document.getElementById('studentIEPContent');
    if (!iepContainer) return;

    const ieps = JSON.parse(localStorage.getItem('ieps') || '[]');
    const studentIEP = ieps.find(iep => iep.studentId === studentId);

    if (!studentIEP) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>لا توجد خطة تربوية فردية</h3>
                <p>لم يتم إنشاء خطة تربوية فردية لهذا الطالب بعد</p>
                <button class="btn btn-success" onclick="createIEP(${studentId})">إنشاء خطة تربوية فردية</button>
            </div>
        `;
        return;
    }

    iepContainer.innerHTML = `
        <div class="plan-summary">
            <div class="plan-stats">
                <div class="stat-card">
                    <div class="stat-value">${studentIEP.goals?.length || 0}</div>
                    <div class="stat-label">الأهداف</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${studentIEP.achievedGoals || 0}</div>
                    <div class="stat-label">أهداف محققة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${studentIEP.overallProgress || 0}%</div>
                    <div class="stat-label">إجمالي التقدم</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${studentIEP.sessionsCompleted || 0}</div>
                    <div class="stat-label">جلسات مكتملة</div>
                </div>
            </div>
            <div class="plan-preview">
                <h4>ملخص الخطة</h4>
                <p><strong>تاريخ البدء:</strong> ${formatDate(studentIEP.startDate)}</p>
                <p><strong>تاريخ الانتهاء:</strong> ${formatDate(studentIEP.endDate)}</p>
                <p><strong>الفترة:</strong> ${studentIEP.duration || 'غير محدد'}</p>
                <p><strong>الملاحظات:</strong> ${studentIEP.notes || 'لا توجد ملاحظات'}</p>
                
                <div class="plan-actions-full">
                    <button class="btn btn-primary" onclick="viewFullIEP(${studentIEP.id})">عرض الخطة كاملة</button>
                    <button class="btn btn-warning" onclick="editIEP(${studentIEP.id})">تعديل</button>
                    <button class="btn btn-success" onclick="updateIEPProgress(${studentIEP.id})">تحديث التقدم</button>
                </div>
            </div>
        </div>
    `;
}

function loadStudentProgress(studentId) {
    // في تطبيق حقيقي، سيتم تحميل بيانات التقدم من قاعدة البيانات
    // هذه مجرد بيانات تجريبية
    const progressData = {
        overallProgress: 65,
        subjectProgress: {
            'لغتي': 70,
            'رياضيات': 60
        },
        monthlyProgress: [30, 45, 50, 55, 60, 65],
        recentActivities: [
            { type: 'test', title: 'أكمل اختبار التشخيص', date: 'منذ يومين', score: '85%' },
            { type: 'lesson', title: 'درس القراءة', date: 'منذ 3 أيام', status: 'مكتمل' },
            { type: 'assignment', title: 'واجب الرياضيات', date: 'منذ 5 أيام', status: 'مسلم' }
        ]
    };

    updateProgressCharts(progressData);
}

// ============================================
// لجنة صعوبات التعلم
// ============================================

function loadLearningDifficultiesCommittee() {
    loadCommitteeMembers();
    loadCommitteeNotes();
    loadCommitteeMessages();
}

function loadCommitteeMembers() {
    const membersList = document.getElementById('committeeMembersList');
    if (!membersList) return;

    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const currentTeacher = getCurrentUser();
    
    // أعضاء اللجنة الذين يتابعون نفس المعلم
    const teacherCommitteeMembers = committeeMembers.filter(member => 
        member.assignedTeachers?.includes(currentTeacher.id)
    );

    if (teacherCommitteeMembers.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>لا توجد لجنة متابعة</h3>
                <p>لم يتم تعيين لجنة صعوبات تعلم لمتابعة طلابك بعد</p>
                <button class="btn btn-success" onclick="requestCommitteeAssignment()">طلب تعيين لجنة</button>
            </div>
        `;
        return;
    }

    membersList.innerHTML = teacherCommitteeMembers.map(member => `
        <div class="member-card">
            <div class="member-info">
                <div class="member-avatar">${member.name.charAt(0)}</div>
                <div class="member-details">
                    <h4>${member.name}</h4>
                    <div class="member-meta">
                        <span class="member-role">${member.role}</span>
                        <span class="member-username">${member.position || 'عضو لجنة'}</span>
                    </div>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn btn-sm btn-primary" onclick="sendMessageToCommittee(${member.id})">مراسلة</button>
                <button class="btn btn-sm btn-info" onclick="viewCommitteeMember(${member.id})">عرض الملف</button>
            </div>
        </div>
    `).join('');
}

function loadCommitteeNotes() {
    const notesList = document.getElementById('committeeNotesList');
    if (!notesList) return;

    const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const currentTeacher = getCurrentUser();
    
    const teacherNotes = notes.filter(note => 
        note.teacherId === currentTeacher.id
    ).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
     .slice(0, 10); // عرض آخر 10 ملاحظات فقط

    if (teacherNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد ملاحظات</h3>
                <p>لم تستلم أي ملاحظات من لجنة صعوبات التعلم بعد</p>
            </div>
        `;
        return;
    }

    notesList.innerHTML = teacherNotes.map(note => {
        const committeeMember = getCommitteeMemberById(note.committeeId);
        return `
            <div class="note-card ${note.isRead ? 'read' : 'unread'}">
                <div class="note-header">
                    <div class="note-sender">
                        <strong>${committeeMember?.name || 'عضو لجنة'}</strong>
                        <span class="sender-role">${committeeMember?.role || 'عضو'}</span>
                    </div>
                    <div class="note-date">${formatDate(note.sentAt)}</div>
                </div>
                <div class="note-content">
                    <p><strong>${note.subject || 'بدون عنوان'}</strong></p>
                    <p>${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p>
                </div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewCommitteeNote(${note.id})">عرض</button>
                    ${!note.isRead ? `<button class="btn btn-sm btn-success" onclick="markCommitteeNoteAsRead(${note.id})">تعليم كمقروء</button>` : ''}
                    ${note.hasReply ? `<button class="btn btn-sm btn-info" onclick="viewCommitteeNoteReply(${note.id})">عرض الرد</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadCommitteeMessages() {
    const messagesList = document.getElementById('committeeMessagesList');
    if (!messagesList) return;

    const messages = JSON.parse(localStorage.getItem('committeeMessages') || '[]');
    const currentTeacher = getCurrentUser();
    
    const teacherMessages = messages.filter(msg => 
        msg.teacherId === currentTeacher.id || msg.senderId === currentTeacher.id
    ).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    if (teacherMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>لا توجد مراسلات</h3>
                <p>لم تبدأ أي محادثات مع لجنة صعوبات التعلم بعد</p>
                <button class="btn btn-success" onclick="startNewConversation()">بدء محادثة جديدة</button>
            </div>
        `;
        return;
    }

    messagesList.innerHTML = teacherMessages.map(message => {
        const isIncoming = message.teacherId === currentTeacher.id;
        const sender = isIncoming ? 
            getCommitteeMemberById(message.senderId) : 
            currentTeacher;
        
        return `
            <div class="message-item ${isIncoming ? 'incoming' : 'outgoing'} ${message.isRead ? 'read' : 'unread'}">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar">${sender?.name?.charAt(0) || '?'}</div>
                        <div class="sender-info">
                            <strong>${sender?.name || 'مرسل'}</strong>
                            <span class="message-subject">${message.subject || 'بدون عنوان'}</span>
                        </div>
                    </div>
                    <div class="message-meta">
                        <span class="message-date">${formatDate(message.sentAt)}</span>
                        ${!message.isRead && isIncoming ? '<span class="message-status">✉️</span>' : ''}
                    </div>
                </div>
                <div class="message-preview">
                    <p>${message.content.substring(0, 150)}${message.content.length > 150 ? '...' : ''}</p>
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewCommitteeMessage(${message.id})">عرض</button>
                    ${isIncoming && !message.isRead ? `<button class="btn btn-sm btn-success" onclick="markMessageAsRead(${message.id})">تعليم كمقروء</button>` : ''}
                    <button class="btn btn-sm btn-info" onclick="replyToCommitteeMessage(${message.id})">رد</button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// الاختبارات التشخيصية
// ============================================

let questionCounter = 0;

function importDiagnosticTest() {
    showAuthNotification('جاري فتح نافذة استيراد الاختبار التشخيصي...', 'info');
    // في تطبيق حقيقي، سيتم فتح نافذة لاستيراد ملف
    setTimeout(() => {
        showAuthNotification('يمكنك الآن اختيار ملف الاختبار التشخيصي للاستيراد', 'info');
        // محاكاة فتح ملف
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.csv,.txt';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        fileInput.click();
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                processImportedDiagnosticTest(file);
            }
            document.body.removeChild(fileInput);
        });
    }, 1000);
}

function showAddDiagnosticTestModal() {
    document.getElementById('addDiagnosticTestModal').classList.add('show');
    questionCounter = 0;
    document.getElementById('questionsContainer').innerHTML = `
        <div class="no-questions">
            <div class="no-questions-icon">❓</div>
            <h5>لا توجد أسئلة مضافة</h5>
            <p>قم بإضافة أسئلة للاختبار التشخيصي</p>
        </div>
    `;
}

function closeAddDiagnosticTestModal() {
    document.getElementById('addDiagnosticTestModal').classList.remove('show');
    document.getElementById('addDiagnosticTestForm').reset();
}

function addQuestion() {
    questionCounter++;
    const questionsContainer = document.getElementById('questionsContainer');
    
    // إزالة رسالة "لا توجد أسئلة" إذا كانت موجودة
    if (questionsContainer.querySelector('.no-questions')) {
        questionsContainer.innerHTML = '';
    }
    
    const questionHTML = `
        <div class="question-item" id="question-${questionCounter}">
            <div class="question-header">
                <h5>سؤال ${questionCounter}</h5>
                <button type="button" class="remove-question-btn" onclick="removeQuestion(${questionCounter})">
                    ×
                </button>
            </div>
            
            <div class="question-content">
                <label for="questionText-${questionCounter}">نص السؤال *</label>
                <textarea 
                    id="questionText-${questionCounter}" 
                    class="form-control" 
                    placeholder="أدخل نص السؤال..." 
                    required
                ></textarea>
            </div>
            
            <div class="choices-container">
                <div class="choices-header">
                    <h6>خيارات الإجابة</h6>
                    <button type="button" class="add-choice-btn" onclick="addChoice(${questionCounter})">
                        ➕ إضافة خيار
                    </button>
                </div>
                <div id="choicesContainer-${questionCounter}" class="choices-list">
                    <!-- سيتم إضافة الخيارات هنا -->
                </div>
            </div>
            
            <div class="question-type">
                <label for="questionType-${questionCounter}">نوع السؤال</label>
                <select id="questionType-${questionCounter}" class="form-control" onchange="handleQuestionTypeChange(${questionCounter})">
                    <option value="multiple-choice">اختيار من متعدد</option>
                    <option value="true-false">صح/خطأ</option>
                    <option value="short-answer">إجابة قصيرة</option>
                </select>
            </div>
            
            <div class="question-marks">
                <label for="questionMarks-${questionCounter}">الدرجة (1-10)</label>
                <input 
                    type="number" 
                    id="questionMarks-${questionCounter}" 
                    min="1" 
                    max="10" 
                    value="1"
                    required
                >
            </div>
        </div>
    `;
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHTML);
    
    // إضافة خيارات افتراضية بناءً على نوع السؤال
    handleQuestionTypeChange(questionCounter);
}

function removeQuestion(questionId) {
    const questionElement = document.getElementById(`question-${questionId}`);
    if (questionElement) {
        questionElement.remove();
        questionCounter--;
        
        // تحديث أرقام الأسئلة المتبقية
        const remainingQuestions = document.querySelectorAll('.question-item');
        if (remainingQuestions.length === 0) {
            const questionsContainer = document.getElementById('questionsContainer');
            questionsContainer.innerHTML = `
                <div class="no-questions">
                    <div class="no-questions-icon">❓</div>
                    <h5>لا توجد أسئلة مضافة</h5>
                    <p>قم بإضافة أسئلة للاختبار التشخيصي</p>
                </div>
            `;
        } else {
            remainingQuestions.forEach((question, index) => {
                const header = question.querySelector('.question-header h5');
                if (header) {
                    header.textContent = `سؤال ${index + 1}`;
                }
                // تحديث معرفات العناصر إذا لزم الأمر
                question.id = `question-${index + 1}`;
            });
            questionCounter = remainingQuestions.length;
        }
    }
}

function addChoice(questionId) {
    const choicesContainer = document.getElementById(`choicesContainer-${questionId}`);
    const choiceCount = choicesContainer.children.length + 1;
    const choiceLetter = String.fromCharCode(64 + choiceCount); // A, B, C, D
    
    const choiceHTML = `
        <div class="choice-item" id="choice-${questionId}-${choiceCount}">
            <div class="choice-number">${choiceLetter}</div>
            <input 
                type="text" 
                class="choice-input" 
                placeholder="أدخل نص الخيار..." 
                required
            >
            <div class="mark-correct-choice">
                <input 
                    type="radio" 
                    name="correctChoice-${questionId}" 
                    id="correctChoice-${questionId}-${choiceCount}"
                    onchange="markAsCorrectChoice(${questionId}, ${choiceCount})"
                >
                <label for="correctChoice-${questionId}-${choiceCount}">الإجابة الصحيحة</label>
            </div>
        </div>
    `;
    
    choicesContainer.insertAdjacentHTML('beforeend', choiceHTML);
}

function handleQuestionTypeChange(questionId) {
    const questionType = document.getElementById(`questionType-${questionId}`).value;
    const choicesContainer = document.getElementById(`choicesContainer-${questionId}`);
    
    // مسح الخيارات الحالية
    choicesContainer.innerHTML = '';
    
    switch(questionType) {
        case 'multiple-choice':
            // إضافة 4 خيارات افتراضية
            for (let i = 1; i <= 4; i++) {
                addChoice(questionId);
            }
            break;
            
        case 'true-false':
            // إضافة خيارين فقط: صح وخطأ
            const trueFalseChoices = [
                { text: 'صح', value: 'true' },
                { text: 'خطأ', value: 'false' }
            ];
            
            trueFalseChoices.forEach((choice, index) => {
                const choiceNumber = index + 1;
                const choiceLetter = String.fromCharCode(64 + choiceNumber);
                
                const choiceHTML = `
                    <div class="choice-item" id="choice-${questionId}-${choiceNumber}">
                        <div class="choice-number">${choiceLetter}</div>
                        <input 
                            type="text" 
                            class="choice-input" 
                            value="${choice.text}"
                            readonly
                        >
                        <div class="mark-correct-choice">
                            <input 
                                type="radio" 
                                name="correctChoice-${questionId}" 
                                id="correctChoice-${questionId}-${choiceNumber}"
                                onchange="markAsCorrectChoice(${questionId}, ${choiceNumber})"
                            >
                            <label for="correctChoice-${questionId}-${choiceNumber}">الإجابة الصحيحة</label>
                        </div>
                    </div>
                `;
                choicesContainer.insertAdjacentHTML('beforeend', choiceHTML);
            });
            break;
            
        case 'short-answer':
            // لا توجد خيارات للإجابة القصيرة
            choicesContainer.innerHTML = `
                <div class="no-choices">
                    <p>📝 سؤال الإجابة القصيرة لا يحتوي على خيارات محددة</p>
                </div>
            `;
            break;
    }
}

function markAsCorrectChoice(questionId, choiceId) {
    // إزالة تمييز الإجابة الصحيحة من جميع خيارات هذا السؤال
    const allChoices = document.querySelectorAll(`#choicesContainer-${questionId} .choice-item`);
    allChoices.forEach(choice => {
        choice.classList.remove('correct-choice');
    });
    
    // إضافة التمييز للخيار المحدد
    const selectedChoice = document.getElementById(`choice-${questionId}-${choiceId}`);
    if (selectedChoice) {
        selectedChoice.classList.add('correct-choice');
    }
}

function saveDiagnosticTest(event) {
    event.preventDefault();
    
    const testTitle = document.getElementById('testTitle').value.trim();
    const testSubject = document.getElementById('testSubject').value;
    const testDescription = document.getElementById('testDescription').value.trim();
    
    // التحقق من الحقول الإجبارية
    if (!testTitle || !testSubject) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    // جمع الأسئلة
    const questions = [];
    const questionElements = document.querySelectorAll('.question-item');
    
    if (questionElements.length === 0) {
        showAuthNotification('يرجى إضافة سؤال واحد على الأقل للاختبار', 'error');
        return;
    }
    
    let hasError = false;
    
    questionElements.forEach((questionElement, index) => {
        const questionId = index + 1;
        const questionText = document.getElementById(`questionText-${questionId}`)?.value.trim();
        const questionType = document.getElementById(`questionType-${questionId}`)?.value;
        const questionMarks = parseInt(document.getElementById(`questionMarks-${questionId}`)?.value || '1');
        
        // التحقق من وجود نص السؤال
        if (!questionText) {
            showAuthNotification(`يرجى إدخال نص السؤال ${questionId}`, 'error');
            hasError = true;
            return;
        }
        
        // جمع الخيارات لهذا السؤال
        const choices = [];
        const choiceElements = document.querySelectorAll(`#choicesContainer-${questionId} .choice-item`);
        
        choiceElements.forEach((choiceElement, choiceIndex) => {
            const choiceInput = choiceElement.querySelector('.choice-input');
            const isCorrect = choiceElement.classList.contains('correct-choice');
            
            if (choiceInput) {
                choices.push({
                    id: choiceIndex + 1,
                    text: choiceInput.value.trim(),
                    letter: String.fromCharCode(65 + choiceIndex), // A, B, C, D
                    isCorrect: isCorrect
                });
            }
        });
        
        // التحقق من وجود خيارات للإجابة الصحيحة للاختيار من متعدد
        const hasCorrectChoice = choices.some(choice => choice.isCorrect);
        if (questionType === 'multiple-choice' && !hasCorrectChoice) {
            showAuthNotification(`يرجى تحديد الإجابة الصحيحة للسؤال ${questionId}`, 'error');
            hasError = true;
            return;
        }
        
        // التحقق من صح/خطأ
        if (questionType === 'true-false' && !hasCorrectChoice) {
            showAuthNotification(`يرجى تحديد الإجابة الصحيحة للسؤال ${questionId} (صح/خطأ)`, 'error');
            hasError = true;
            return;
        }
        
        questions.push({
            id: questionId,
            text: questionText,
            type: questionType,
            marks: questionMarks,
            choices: choices,
            correctAnswer: questionType === 'short-answer' ? null : choices.find(c => c.isCorrect)?.text || null
        });
    });
    
    if (hasError) return;
    
    // إنشاء كائن الاختبار التشخيصي
    const currentUser = getCurrentUser();
    const diagnosticTests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    
    const newTest = {
        id: generateId(),
        title: testTitle,
        subject: testSubject,
        description: testDescription,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        questions: questions,
        createdAt: new Date().toISOString(),
        totalQuestions: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
        questionTypes: {
            multipleChoice: questions.filter(q => q.type === 'multiple-choice').length,
            trueFalse: questions.filter(q => q.type === 'true-false').length,
            shortAnswer: questions.filter(q => q.type === 'short-answer').length
        },
        isPublished: false,
        assignedStudents: [],
        status: 'draft',
        lastModified: new Date().toISOString()
    };
    
    diagnosticTests.push(newTest);
    localStorage.setItem('diagnosticTests', JSON.stringify(diagnosticTests));
    
    // إضافة نشاط في النظام
    addSystemLog(`تم إنشاء اختبار تشخيصي جديد: ${testTitle}`, 'test', currentUser.name);
    
    showAuthNotification(`تم إنشاء الاختبار التشخيصي "${testTitle}" بنجاح`, 'success');
    
    // إغلاق النافذة وإعادة التحميل
    closeAddDiagnosticTestModal();
    
    // تحديث قائمة الاختبارات التشخيصية إذا كانت موجودة
    if (window.location.pathname.includes('content-library.html')) {
        loadTestsContent();
        showAuthNotification('تمت إضافة الاختبار التشخيصي إلى مكتبة المحتوى', 'info');
    }
}

function processImportedDiagnosticTest(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let testData;
            
            // محاولة تحليل JSON
            if (file.name.endsWith('.json')) {
                testData = JSON.parse(content);
            } 
            // محاولة تحليل CSV
            else if (file.name.endsWith('.csv')) {
                testData = parseCSVToTest(content);
            }
            // نص عادي
            else {
                testData = parseTextToTest(content);
            }
            
            // حفظ الاختبار المستورد
            saveImportedTest(testData);
            
        } catch (error) {
            console.error('خطأ في معالجة الملف:', error);
            showAuthNotification('تعذر معالجة الملف. يرجى التأكد من صحة التنسيق', 'error');
        }
    };
    
    reader.onerror = function() {
        showAuthNotification('تعذر قراءة الملف', 'error');
    };
    
    reader.readAsText(file);
}

function saveImportedTest(testData) {
    const currentUser = getCurrentUser();
    const diagnosticTests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    
    const importedTest = {
        id: generateId(),
        title: testData.title || 'اختبار مستورد',
        subject: testData.subject || 'لغتي',
        description: testData.description || 'تم استيراد هذا الاختبار',
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        questions: testData.questions || [],
        createdAt: new Date().toISOString(),
        totalQuestions: testData.questions?.length || 0,
        totalMarks: testData.questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 0,
        isPublished: false,
        assignedStudents: [],
        status: 'draft',
        isImported: true,
        originalFileName: testData.fileName,
        lastModified: new Date().toISOString()
    };
    
    diagnosticTests.push(importedTest);
    localStorage.setItem('diagnosticTests', JSON.stringify(diagnosticTests));
    
    showAuthNotification(`تم استيراد الاختبار "${importedTest.title}" بنجاح`, 'success');
    
    // تحديث قائمة الاختبارات
    if (window.location.pathname.includes('content-library.html')) {
        loadTestsContent();
    }
}

// ============================================
// دوال مساعدة
// ============================================

function getStudentById(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.role === 'student' && u.id === studentId);
}

function getCommitteeMemberById(memberId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    return committeeMembers.find(m => m.id === memberId);
}

function getTestStatusForStudent(test, studentId) {
    // في تطبيق حقيقي، ستأتي هذه البيانات من قاعدة البيانات
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const studentResult = testResults.find(tr => 
        tr.testId === test.id && tr.studentId === studentId
    );
    
    if (studentResult) {
        return studentResult.completed ? 'completed' : 'in-progress';
    }
    return 'assigned';
}

function getTestStatusClass(status) {
    switch(status) {
        case 'assigned': return 'assigned';
        case 'in-progress': return 'in-progress';
        case 'completed': return 'completed';
        default: return '';
    }
}

function getTestStatusText(status) {
    switch(status) {
        case 'assigned': return 'معين';
        case 'in-progress': return 'قيد التنفيذ';
        case 'completed': return 'مكتمل';
        default: return status;
    }
}

function getLessonStatusForStudent(lesson, studentId) {
    const lessonProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const studentProgress = lessonProgress.find(lp => 
        lp.lessonId === lesson.id && lp.studentId === studentId
    );
    
    if (studentProgress) {
        return studentProgress.completed ? 'completed' : 'in-progress';
    }
    return 'assigned';
}

function getLessonStatusClass(status) {
    switch(status) {
        case 'assigned': return 'pending';
        case 'in-progress': return 'in-progress';
        case 'completed': return 'completed';
        default: return '';
    }
}

function getLessonStatusText(status) {
    switch(status) {
        case 'assigned': return 'معين';
        case 'in-progress': return 'قيد الدراسة';
        case 'completed': return 'مكتمل';
        default: return status;
    }
}

function getAssignmentStatusForStudent(assignment, studentId) {
    const submissions = JSON.parse(localStorage.getItem('assignmentSubmissions') || '[]');
    const studentSubmission = submissions.find(sub => 
        sub.assignmentId === assignment.id && sub.studentId === studentId
    );
    
    if (studentSubmission) {
        return studentSubmission.graded ? 'graded' : 'submitted';
    }
    return 'assigned';
}

function getAssignmentStatusClass(status) {
    switch(status) {
        case 'assigned': return 'pending';
        case 'submitted': return 'submitted';
        case 'graded': return 'graded';
        default: return '';
    }
}

function getAssignmentStatusText(status) {
    switch(status) {
        case 'assigned': return 'معين';
        case 'submitted': return 'مسلم';
        case 'graded': return 'مصحح';
        default: return status;
    }
}

function updateUserInterface(user) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0);
}

function updateProgressCharts(progressData) {
    // في تطبيق حقيقي، سيتم استخدام مكتبة مثل Chart.js
    console.log('بيانات التقدم:', progressData);
}

function addSystemLog(message, type = 'info', user = null) {
    try {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        const currentUser = getCurrentUser();
        
        logs.push({
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            user: user || (currentUser ? currentUser.name : 'النظام')
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

function parseCSVToTest(csvContent) {
    // محاكاة تحليل CSV (في تطبيق حقيقي سيتم استخدام مكتبة)
    const lines = csvContent.split('\n');
    const testData = {
        title: 'اختبار مستورد من CSV',
        subject: 'لغتي',
        questions: []
    };
    
    lines.forEach((line, index) => {
        if (line.trim() && index > 0) { // تخطى العنوان
            const parts = line.split(',');
            if (parts.length >= 3) {
                testData.questions.push({
                    id: index,
                    text: parts[0] || 'سؤال بدون نص',
                    type: 'multiple-choice',
                    marks: parseInt(parts[1]) || 1,
                    choices: [
                        { id: 1, text: parts[2] || 'خيار 1', isCorrect: true },
                        { id: 2, text: parts[3] || 'خيار 2', isCorrect: false },
                        { id: 3, text: parts[4] || 'خيار 3', isCorrect: false },
                        { id: 4, text: parts[5] || 'خيار 4', isCorrect: false }
                    ]
                });
            }
        }
    });
    
    return testData;
}

function parseTextToTest(textContent) {
    // محاكاة تحليل النص
    const questions = textContent.split('\n\n');
    const testData = {
        title: 'اختبار مستورد من نص',
        subject: 'لغتي',
        questions: []
    };
    
    questions.forEach((questionBlock, index) => {
        if (questionBlock.trim()) {
            const lines = questionBlock.split('\n');
            if (lines.length > 0) {
                testData.questions.push({
                    id: index + 1,
                    text: lines[0] || 'سؤال بدون نص',
                    type: 'short-answer',
                    marks: 1
                });
            }
        }
    });
    
    return testData;
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

window.importDiagnosticTest = importDiagnosticTest;
window.showAddDiagnosticTestModal = showAddDiagnosticTestModal;
window.closeAddDiagnosticTestModal = closeAddDiagnosticTestModal;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.addChoice = addChoice;
window.handleQuestionTypeChange = handleQuestionTypeChange;
window.markAsCorrectChoice = markAsCorrectChoice;
window.saveDiagnosticTest = saveDiagnosticTest;

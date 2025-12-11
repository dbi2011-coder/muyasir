// إدارة ملف الطالب
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('student-profile.html')) {
        initializeStudentProfile();
        setupTabs();
    }
});

function initializeStudentProfile() {
    // الحصول على معرف الطالب من URL
    const urlParams = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(urlParams.get('id'));
    
    if (!currentStudentId) {
        showAuthNotification('لم يتم تحديد طالب', 'error');
        window.location.href = 'students.html';
        return;
    }
    
    loadStudentProfile();
}

function loadStudentProfile() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id === currentStudentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        window.location.href = 'students.html';
        return;
    }
    
    // تحديث معلومات الطالب
    document.getElementById('studentProfileTitle').textContent = `ملف الطالب: ${student.name}`;
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentGrade').textContent = `الصف: ${student.grade}`;
    document.getElementById('studentSubject').textContent = `المادة: ${student.subject}`;
    document.getElementById('studentAvatar').textContent = student.name.charAt(0);
    
    // تحميل محتوى التبويبات
    loadDiagnosticTest();
    loadEducationalPlan();
    loadStudentLessons();
    loadStudentAssignments();
    loadStudentProgress();
    
    // تحديث نسبة التقدم
    updateStudentProgress(student);
}

function updateStudentProgress(student) {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const studentLessons = lessons.filter(lesson => lesson.studentId === student.id);
    
    if (studentLessons.length === 0) {
        document.getElementById('studentProgress').textContent = 'نسبة التقدم: 0%';
        return;
    }
    
    const completedLessons = studentLessons.filter(lesson => lesson.status === 'completed').length;
    const progressPercentage = Math.round((completedLessons / studentLessons.length) * 100);
    
    document.getElementById('studentProgress').textContent = `نسبة التقدم: ${progressPercentage}%`;
    
    // تحديث بيانات الطالب
    student.progress = progressPercentage;
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const updatedStudents = students.map(s => s.id === student.id ? student : s);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
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

// دوال الاختبار التشخيصي
function loadDiagnosticTest() {
    const content = document.getElementById('diagnosticTestContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const currentTest = studentTests.find(test => test.studentId === currentStudentId);
    
    if (!currentTest) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا يوجد اختبار تشخيصي معين</h3>
                <p>قم بتعيين اختبار تشخيصي للطالب لتقييم مستواه</p>
                <button class="btn btn-success" onclick="assignDiagnosticTest()">تعيين اختبار</button>
            </div>
        `;
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === currentTest.testId);
    
    if (!test) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h3>الاختبار غير موجود</h3>
                <p>الاختبار المعين للطالب لم يعد متوفراً</p>
                <button class="btn btn-success" onclick="assignDiagnosticTest()">تعيين اختبار جديد</button>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="test-info-card">
            <div class="test-header">
                <h4>${test.title}</h4>
                <span class="test-status ${currentTest.status}">${getTestStatusText(currentTest.status)}</span>
            </div>
            <div class="test-details">
                <p><strong>المادة:</strong> ${test.subject}</p>
                <p><strong>عدد الأسئلة:</strong> ${test.questions?.length || 0}</p>
                <p><strong>تاريخ التعيين:</strong> ${formatDate(currentTest.assignedAt)}</p>
                ${currentTest.completedAt ? `<p><strong>تاريخ الإنجاز:</strong> ${formatDate(currentTest.completedAt)}</p>` : ''}
                ${currentTest.score ? `<p><strong>النتيجة:</strong> ${currentTest.score}%</p>` : ''}
            </div>
            <div class="test-actions">
                <button class="btn btn-primary" onclick="viewStudentTest(${currentTest.id})">عرض الاختبار</button>
                ${currentTest.status === 'assigned' ? `<button class="btn btn-warning" onclick="remindStudentTest(${currentTest.id})">تذكير</button>` : ''}
                <button class="btn btn-danger" onclick="removeStudentTest(${currentTest.id})">إلغاء التعيين</button>
            </div>
        </div>
    `;
}

function assignDiagnosticTest() {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);
    
    if (teacherTests.length === 0) {
        showAuthNotification('لا توجد اختبارات متاحة، يرجى إنشاء اختبار أولاً', 'warning');
        return;
    }
    
    const testSelect = document.getElementById('testSelection');
    testSelect.innerHTML = '<option value="">اختر اختبار تشخيصي</option>';
    
    teacherTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        option.textContent = `${test.title} (${test.subject})`;
        testSelect.appendChild(option);
    });
    
    document.getElementById('assignTestModal').classList.add('show');
}

function closeAssignTestModal() {
    document.getElementById('assignTestModal').classList.remove('show');
}

function saveAssignedTest() {
    const testId = parseInt(document.getElementById('testSelection').value);
    
    if (!testId) {
        showAuthNotification('يرجى اختيار اختبار', 'error');
        return;
    }
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    // التحقق من عدم وجود اختبار معين مسبقاً
    const existingTest = studentTests.find(test => test.studentId === currentStudentId && test.status !== 'completed');
    if (existingTest) {
        showAuthNotification('يوجد اختبار معين مسبقاً للطالب', 'warning');
        return;
    }
    
    const newStudentTest = {
        id: generateId(),
        studentId: currentStudentId,
        testId: testId,
        status: 'assigned',
        assignedAt: new Date().toISOString(),
        completedAt: null,
        score: null,
        answers: []
    };
    
    studentTests.push(newStudentTest);
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    
    showAuthNotification('تم تعيين الاختبار بنجاح', 'success');
    closeAssignTestModal();
    loadDiagnosticTest();
}

// دوال الخطة التربوية الفردية
function loadEducationalPlan() {
    const content = document.getElementById('educationalPlanContent');
    const plans = JSON.parse(localStorage.getItem('educationalPlans') || '[]');
    const studentPlan = plans.find(plan => plan.studentId === currentStudentId);
    
    if (!studentPlan) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>لا توجد خطة تربوية فردية</h3>
                <p>قم بتوليد خطة تربوية فردية بناءً على نتائج الاختبار التشخيصي</p>
                <button class="btn btn-success" onclick="generateEducationalPlan()">توليد الخطة</button>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="plan-summary">
            <div class="plan-stats">
                <div class="stat-card">
                    <div class="stat-value">${studentPlan.shortTermGoals?.length || 0}</div>
                    <div class="stat-label">أهداف قصيرة المدى</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${countTeachingObjectives(studentPlan)}</div>
                    <div class="stat-label">هدف تدريسي</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${studentPlan.completedObjectives || 0}</div>
                    <div class="stat-label">أهداف منجزة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${studentPlan.progress || 0}%</div>
                    <div class="stat-label">نسبة الإنجاز</div>
                </div>
            </div>
            
            <div class="plan-preview">
                <h4>نظرة عامة على الخطة</h4>
                <div class="plan-dates">
                    <p><strong>تاريخ الإنشاء:</strong> ${formatDate(studentPlan.createdAt)}</p>
                    <p><strong>آخر تحديث:</strong> ${formatDate(studentPlan.updatedAt)}</p>
                </div>
                <div class="plan-actions-full">
                    <button class="btn btn-primary" onclick="viewFullPlan(${studentPlan.id})">عرض الخطة كاملة</button>
                    <button class="btn btn-outline-primary" onclick="editEducationalPlan()">تعديل الخطة</button>
                    <button class="btn btn-info" onclick="exportEducationalPlan()">تصدير PDF</button>
                </div>
            </div>
        </div>
    `;
}

function countTeachingObjectives(plan) {
    if (!plan.shortTermGoals) return 0;
    return plan.shortTermGoals.reduce((total, goal) => total + (goal.teachingObjectives?.length || 0), 0);
}

function generateEducationalPlan() {
    // محاكاة توليد الخطة التربوية بناءً على نتائج الاختبار
    showAuthNotification('جاري توليد الخطة التربوية الفردية...', 'info');
    
    setTimeout(() => {
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const currentTest = studentTests.find(test => test.studentId === currentStudentId && test.status === 'completed');
        
        if (!currentTest) {
            showAuthNotification('يجب أن يكمل الطالب الاختبار التشخيصي أولاً', 'warning');
            return;
        }
        
        const plans = JSON.parse(localStorage.getItem('educationalPlans') || '[]');
        const existingPlan = plans.find(plan => plan.studentId === currentStudentId);
        
        if (existingPlan) {
            showAuthNotification('يوجد خطة موجودة مسبقاً للطالب', 'warning');
            return;
        }
        
        const newPlan = {
            id: generateId(),
            studentId: currentStudentId,
            shortTermGoals: generateShortTermGoals(currentTest),
            progress: 0,
            completedObjectives: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        plans.push(newPlan);
        localStorage.setItem('educationalPlans', JSON.stringify(plans));
        
        showAuthNotification('تم توليد الخطة التربوية بنجاح', 'success');
        loadEducationalPlan();
        
        // توليد الدروس تلقائياً بناءً على الخطة
        generateAutomaticLessons(newPlan);
        
    }, 2000);
}

function generateShortTermGoals(test) {
    // محاكاة توليد الأهداف قصيرة المدى بناءً على نتائج الاختبار
    return [
        {
            id: generateId(),
            goal: "تحسين مهارات القراءة الأساسية",
            teachingObjectives: [
                "تمييز الحروف الهجائية",
                "قراءة الكلمات البسيطة",
                "فهم النصوص القصيرة"
            ],
            status: "pending"
        },
        {
            id: generateId(),
            goal: "تنمية مهارات الكتابة",
            teachingObjectives: [
                "كتابة الحروف بشكل صحيح",
                "تركيب كلمات من حروف",
                "كتابة جمل بسيطة"
            ],
            status: "pending"
        }
    ];
}

function generateAutomaticLessons(plan) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherLessons = lessons.filter(lesson => lesson.teacherId === currentTeacher.id);
    
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    plan.shortTermGoals.forEach(goal => {
        goal.teachingObjectives.forEach(objective => {
            // البحث عن درس مناسب للهدف التدريسي
            const suitableLesson = teacherLessons.find(lesson => 
                lesson.objectivesLinked && 
                lesson.title.includes(objective.substring(0, 10)) // محاكاة المطابقة
            );
            
            if (suitableLesson) {
                const newStudentLesson = {
                    id: generateId(),
                    studentId: currentStudentId,
                    lessonId: suitableLesson.id,
                    objectiveId: goal.id,
                    teachingObjective: objective,
                    status: 'pending',
                    assignedAt: new Date().toISOString(),
                    startedAt: null,
                    completedAt: null,
                    priority: 1
                };
                
                studentLessons.push(newStudentLesson);
            }
        });
    });
    
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    showAuthNotification('تم تخصيص الدروس تلقائياً بناءً على الخطة', 'success');
}

// دوال الدروس
function loadStudentLessons() {
    const content = document.getElementById('studentLessonsContent');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const currentStudentLessons = studentLessons.filter(lesson => lesson.studentId === currentStudentId);
    
    if (currentStudentLessons.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس مخصصة</h3>
                <p>سيتم تخصيص الدروس تلقائياً بعد توليد الخطة التربوية</p>
                <button class="btn btn-primary" onclick="assignManualLesson()">إضافة درس يدوي</button>
            </div>
        `;
        return;
    }
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    content.innerHTML = `
        <div class="lessons-container">
            <div class="lessons-stats">
                <span class="stat">المكتمل: ${currentStudentLessons.filter(l => l.status === 'completed').length}</span>
                <span class="stat">قيد التنفيذ: ${currentStudentLessons.filter(l => l.status === 'in-progress').length}</span>
                <span class="stat">قادم: ${currentStudentLessons.filter(l => l.status === 'pending').length}</span>
            </div>
            
            <div class="lessons-list">
                ${currentStudentLessons.map(lesson => {
                    const lessonDetails = lessons.find(l => l.id === lesson.lessonId);
                    return `
                        <div class="lesson-item ${lesson.status}">
                            <div class="lesson-header">
                                <h5>${lessonDetails?.title || 'درس غير معروف'}</h5>
                                <span class="lesson-status">${getLessonStatusText(lesson.status)}</span>
                            </div>
                            <div class="lesson-details">
                                <p><strong>الهدف التدريسي:</strong> ${lesson.teachingObjective}</p>
                                <p><strong>الإستراتيجية:</strong> ${lessonDetails?.strategy || 'غير محدد'}</p>
                                <p><strong>تاريخ التعيين:</strong> ${formatDate(lesson.assignedAt)}</p>
                                ${lesson.completedAt ? `<p><strong>تاريخ الإنجاز:</strong> ${formatDate(lesson.completedAt)}</p>` : ''}
                            </div>
                            <div class="lesson-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewStudentLesson(${lesson.id})">عرض</button>
                                ${lesson.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="startStudentLesson(${lesson.id})">بدء</button>` : ''}
                                ${lesson.status === 'in-progress' ? `<button class="btn btn-sm btn-warning" onclick="completeStudentLesson(${lesson.id})">إكمال</button>` : ''}
                                <button class="btn btn-sm btn-danger" onclick="removeStudentLesson(${lesson.id})">حذف</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="accelerateLesson(${lesson.id})">تسريع</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// دوال الواجبات
function loadStudentAssignments() {
    const content = document.getElementById('studentAssignmentsContent');
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const currentStudentAssignments = studentAssignments.filter(assignment => assignment.studentId === currentStudentId);
    
    if (currentStudentAssignments.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد واجبات مخصصة</h3>
                <p>قم بإضافة واجبات للطالب لمتابعة تقدمه</p>
                <button class="btn btn-primary" onclick="assignManualAssignment()">إضافة واجب</button>
            </div>
        `;
        return;
    }
    
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    
    content.innerHTML = `
        <div class="assignments-container">
            <div class="assignments-stats">
                <span class="stat">تم الحل: ${currentStudentAssignments.filter(a => a.status === 'completed').length}</span>
                <span class="stat">لم يتم الحل: ${currentStudentAssignments.filter(a => a.status === 'pending').length}</span>
                <span class="stat">متأخر: ${currentStudentAssignments.filter(a => a.status === 'overdue').length}</span>
            </div>
            
            <div class="assignments-list">
                ${currentStudentAssignments.map(assignment => {
                    const assignmentDetails = assignments.find(a => a.id === assignment.assignmentId);
                    return `
                        <div class="assignment-item ${assignment.status}">
                            <div class="assignment-header">
                                <h5>${assignmentDetails?.title || 'واجب غير معروف'}</h5>
                                <span class="assignment-status">${getAssignmentStatusText(assignment.status)}</span>
                            </div>
                            <div class="assignment-details">
                                <p><strong>الوصف:</strong> ${assignmentDetails?.description || 'لا يوجد وصف'}</p>
                                <p><strong>تاريخ التعيين:</strong> ${formatDate(assignment.assignedAt)}</p>
                                ${assignment.dueDate ? `<p><strong>موعد التسليم:</strong> ${formatDate(assignment.dueDate)}</p>` : ''}
                                ${assignment.completedAt ? `<p><strong>تاريخ الحل:</strong> ${formatDate(assignment.completedAt)}</p>` : ''}
                                ${assignment.score ? `<p><strong>الدرجة:</strong> ${assignment.score}/${assignment.totalGrade}</p>` : ''}
                            </div>
                            <div class="assignment-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewStudentAssignment(${assignment.id})">عرض</button>
                                <button class="btn btn-sm btn-warning" onclick="editStudentAssignment(${assignment.id})">تعديل</button>
                                <button class="btn btn-sm btn-danger" onclick="removeStudentAssignment(${assignment.id})">حذف</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// دوال تقدم الطالب
function loadStudentProgress() {
    const content = document.getElementById('studentProgressContent');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const currentStudentLessons = studentLessons.filter(lesson => lesson.studentId === currentStudentId);
    
    const progressData = generateProgressData(currentStudentLessons);
    
    content.innerHTML = `
        <div class="progress-container">
            <div class="progress-chart">
                <h4>مخطط التقدم</h4>
                <div class="chart-placeholder">
                    <p>📊 سيتم عرض مخطط التقدم هنا</p>
                    <small>سيتم تطوير المخططات التفصيلية في المراحل القادمة</small>
                </div>
            </div>
            
            <div class="progress-timeline">
                <h4>الجدول الزمني للإنجاز</h4>
                <div class="timeline">
                    ${progressData.map(item => `
                        <div class="timeline-item ${item.status}">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h6>${item.objective}</h6>
                                <p>${item.lesson}</p>
                                <span class="timeline-date">${item.date}</span>
                                <span class="timeline-status">${item.statusText}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function generateProgressData(lessons) {
    return lessons.map(lesson => {
        let statusText, status;
        switch(lesson.status) {
            case 'completed':
                statusText = 'تم الإنجاز';
                status = 'completed';
                break;
            case 'in-progress':
                statusText = 'قيد التنفيذ';
                status = 'in-progress';
                break;
            default:
                statusText = 'قادم';
                status = 'pending';
        }
        
        return {
            objective: lesson.teachingObjective,
            lesson: `درس ${lesson.lessonId}`,
            date: lesson.completedAt ? formatDate(lesson.completedAt) : 
                  lesson.startedAt ? formatDate(lesson.startedAt) : 'لم يبدأ بعد',
            statusText: statusText,
            status: status
        };
    });
}

// دوال مساعدة
function getTestStatusText(status) {
    const statusMap = {
        'assigned': 'معين',
        'in-progress': 'قيد التنفيذ',
        'completed': 'مكتمل',
        'overdue': 'متأخر'
    };
    return statusMap[status] || status;
}

function getLessonStatusText(status) {
    const statusMap = {
        'pending': 'قادم',
        'in-progress': 'قيد التنفيذ',
        'completed': 'متحقق',
        'accelerated': 'تم التسريع'
    };
    return statusMap[status] || status;
}

function getAssignmentStatusText(status) {
    const statusMap = {
        'pending': 'لم يتم الحل',
        'in-progress': 'قيد الحل',
        'completed': 'تم الحل',
        'overdue': 'متأخر'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function goBack() {
    window.history.back();
}

function generateStudentReport() {
    showAuthNotification('جاري إنشاء التقرير الشامل...', 'info');
    setTimeout(() => {
        showAuthNotification('تم إنشاء التقرير بنجاح', 'success');
        // سيتم تطوير إنشاء التقارير PDF في المراحل القادمة
    }, 2000);
}

// تصدير الدوال للاستخدام العالمي
window.assignDiagnosticTest = assignDiagnosticTest;
window.closeAssignTestModal = closeAssignTestModal;
window.saveAssignedTest = saveAssignedTest;
window.generateEducationalPlan = generateEducationalPlan;
window.editEducationalPlan = editEducationalPlan;
window.exportEducationalPlan = exportEducationalPlan;
window.assignManualLesson = assignManualLesson;
window.assignManualAssignment = assignManualAssignment;
window.refreshProgress = refreshProgress;
window.goBack = goBack;
window.generateStudentReport = generateStudentReport;
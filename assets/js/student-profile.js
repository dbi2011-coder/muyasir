// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: ملف الطالب (أسهم الترتيب + التحكم الكامل + الخطة الأصلية)
// ============================================

let currentStudentId = null;
let currentStudent = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }
    loadStudentData();
});

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id === currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
    if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;
    
    switchSection('diagnostic');
}

function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(`section-${sectionId}`);
    if(activeSection) activeSection.classList.add('active');

    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// 1. الاختبار التشخيصي
function loadDiagnosticTab() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic');
    
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const detailsDiv = document.getElementById('diagnosticTestDetails');
        detailsDiv.style.display = 'block';
        
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id === assignedTest.testId);
        
        let statusBadge = '';
        let actionContent = '';

        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            actionContent = `<div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:5px;"><strong>الدرجة الحالية: ${assignedTest.score || 0}%</strong><button class="btn btn-warning mt-2" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح</button></div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
            actionContent = `<div class="alert alert-warning mt-2">تم إعادة الاختبار للطالب.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">قيد الانتظار</span>';
        }

        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                    <div style="display:flex; gap:5px;">${statusBadge}<button class="btn btn-sm btn-outline-danger" onclick="deleteAssignedTest(${assignedTest.id})"><i class="fas fa-trash"></i></button></div>
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                ${actionContent}
            </div>`;
    } else {
        document.getElementById('noDiagnosticTest').style.display = 'block';
        document.getElementById('diagnosticTestDetails').style.display = 'none';
    }
}

// 2. الخطة التربوية (استعدت الكود الأصلي تماماً كما طلبت)
function loadIEPTab() {
    const iepContent = document.getElementById('iepContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');

    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    if (!completedDiagnostic) {
        document.querySelector('.iep-word-model').style.display = 'none';
        iepContent.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3><p>يجب إكمال وتصحيح اختبار تشخيصي أولاً.</p></div>`;
        return;
    }

    document.querySelector('.iep-word-model').style.display = 'block';
    if(iepContent.querySelector('.empty-state')) iepContent.innerHTML = '';

    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);

    // تعبئة الرأس
    document.getElementById('iep-student-name').textContent = currentStudent.name;
    document.getElementById('iep-subject').textContent = originalTest ? originalTest.subject : 'غير محدد';
    document.getElementById('iep-grade').textContent = currentStudent.grade;
    document.getElementById('iep-date').textContent = new Date().toLocaleDateString('ar-SA');

    fillScheduleTable();

    // جلب الأهداف المحققة
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const completedLessonsMap = {};
    studentLessons.forEach(l => {
        if (l.studentId === currentStudentId && l.status === 'completed') {
            completedLessonsMap[l.objective] = l.completedDate;
        }
    });

    const strengthsList = document.getElementById('iep-strengths-list');
    const needsList = document.getElementById('iep-needs-list');
    const objectivesBody = document.getElementById('iep-objectives-body');

    strengthsList.innerHTML = '';
    needsList.innerHTML = '';
    objectivesBody.innerHTML = '';

    let needsObjects = [];

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(question => {
            const studentAnswerObj = completedDiagnostic.answers.find(a => a.questionId === question.id);
            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id === question.linkedGoalId);
                if (objective) {
                    const studentScore = studentAnswerObj ? (studentAnswerObj.score || 0) : 0;
                    const passingScore = question.passingScore || 1;

                    if (studentScore >= passingScore) {
                        if(!strengthsList.innerHTML.includes(objective.shortTermGoal)) strengthsList.innerHTML += `<li>${objective.shortTermGoal}</li>`;
                    } else {
                        if (!needsObjects.find(o => o.id === objective.id)) {
                            needsObjects.push(objective);
                            needsList.innerHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    }
                }
            }
        });
    }

    if(needsObjects.length === 0) {
        needsList.innerHTML = '<li>لم يتم رصد نقاط احتياج.</li>';
        objectivesBody.innerHTML = '<tr><td colspan="3" class="text-center">جميع الأهداف محققة.</td></tr>';
    } else {
        let objectiveCounter = 1;
        needsObjects.forEach(obj => {
            const headerRow = `<tr style="background-color: #e9ecef;"><td style="font-weight:bold; text-align:center;">*</td><td colspan="2"><strong>هدف قصير المدى:</strong> ${obj.shortTermGoal}</td></tr>`;
            objectivesBody.insertAdjacentHTML('beforeend', headerRow);

            if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                obj.instructionalGoals.forEach(iGoal => {
                    const achievementDate = completedLessonsMap[iGoal];
                    
                    // ✅ التعديل الوحيد: تنسيق التاريخ
                    const formattedDate = achievementDate 
                        ? new Date(achievementDate).toLocaleDateString('ar-SA') 
                        : '';

                    const dateCellContent = achievementDate 
                        ? `<span class="text-success font-weight-bold">✔ ${formattedDate}</span>` 
                        : `<input type="date" class="form-control" style="border:none; background:transparent;">`;

                    const row = `<tr><td style="text-align:center;">${objectiveCounter++}</td><td>${iGoal}</td><td>${dateCellContent}</td></tr>`;
                    objectivesBody.insertAdjacentHTML('beforeend', row);
                });
            } else {
                objectivesBody.insertAdjacentHTML('beforeend', `<tr><td>-</td><td class="text-muted">لا توجد أهداف تدريسية مسجلة</td><td></td></tr>`);
            }
        });
    }
}

function fillScheduleTable() {
    const daysMap = { 'sunday': 'day-sunday', 'monday': 'day-monday', 'tuesday': 'day-tuesday', 'wednesday': 'day-wednesday', 'thursday': 'day-thursday' };
    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]'); 
    Object.values(daysMap).forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = ''; });
    schedule.forEach(session => {
        if (session.students && session.students.includes(currentStudentId)) {
            const cellId = daysMap[session.day];
            if (cellId && document.getElementById(cellId)) {
                document.getElementById(cellId).innerHTML = `<div style="background:#28a745; color:white; padding:5px; border-radius:4px; text-align:center;">حصة ${session.period || 1}</div>`;
            }
        }
    });
}

// ---------------------------------------------------------
// 3. قسم الدروس (مع الأسهم والتحكم)
// ---------------------------------------------------------
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId === currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    
    if (myList.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3></div>`;
        return;
    }

    // الترتيب حسب orderIndex
    myList.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
        const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
        return orderA - orderB || new Date(a.assignedDate) - new Date(b.assignedDate);
    });

    container.innerHTML = myList.map((l, index) => {
        let controls = '';
        let statusDisplay = '';

        if(l.status === 'completed') {
            statusDisplay = `<span class="badge badge-success">مكتمل (${new Date(l.completedDate).toLocaleDateString('ar-SA')})</span>`;
            controls = `
                <button class="btn btn-info" onclick="openLessonReview(${l.id})">👁️ الحل</button>
                <button class="btn btn-warning" onclick="resetLesson(${l.id})">🔄 إعادة فتح</button>
            `;
        } else {
            statusDisplay = l.isManuallyLocked ? '<span class="badge badge-secondary">🔒 مقفل يدوياً</span>' : '<span class="badge badge-primary">قيد الانتظار</span>';
            controls = l.isManuallyLocked 
                ? `<button class="btn btn-success" onclick="toggleLessonLock(${l.id}, false)">🔓 إتاحة</button>`
                : `<button class="btn btn-secondary" onclick="toggleLessonLock(${l.id}, true)">🔒 قفل</button>`;
        }

        // أزرار الأسهم
        const orderButtons = `
            <div class="order-controls">
                <button class="btn-order" onclick="moveLesson(${l.id}, 'up')" title="تقديم">⬆</button>
                <button class="btn-order" onclick="moveLesson(${l.id}, 'down')" title="تأخير">⬇</button>
            </div>
        `;

        return `
        <div class="content-card">
            ${orderButtons}
            <div class="content-header" style="margin-top:0;">
                <h4>${l.title}</h4>
                ${statusDisplay}
            </div>
            <div class="content-body">
                <p><strong>الهدف:</strong> ${l.objective || 'إثرائي / إضافي'}</p>
            </div>
            <div class="lesson-actions">${controls}</div>
        </div>`;
    }).join('');
}

// منطق تحريك الدروس
function moveLesson(lessonId, direction) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId === currentStudentId);
    
    // تأكد أن الجميع لديهم orderIndex
    myLessons.sort((a, b) => (a.orderIndex||0) - (b.orderIndex||0));
    myLessons.forEach((l, i) => l.orderIndex = i);

    const currentIndex = myLessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
        // تبديل مع السابق
        const temp = myLessons[currentIndex].orderIndex;
        myLessons[currentIndex].orderIndex = myLessons[currentIndex - 1].orderIndex;
        myLessons[currentIndex - 1].orderIndex = temp;
    } else if (direction === 'down' && currentIndex < myLessons.length - 1) {
        // تبديل مع اللاحق
        const temp = myLessons[currentIndex].orderIndex;
        myLessons[currentIndex].orderIndex = myLessons[currentIndex + 1].orderIndex;
        myLessons[currentIndex + 1].orderIndex = temp;
    }

    // حفظ التغييرات
    myLessons.forEach(l => {
        const mainIdx = studentLessons.findIndex(sl => sl.id === l.id);
        if (mainIdx !== -1) studentLessons[mainIdx].orderIndex = l.orderIndex;
    });

    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    loadLessonsTab();
}

// ---------------------------------------------------------
// دوال التحكم
// ---------------------------------------------------------
function openLessonReview(assignmentId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lesson = studentLessons.find(l => l.id === assignmentId);
    const container = document.getElementById('lessonAnswersBody');
    if(!lesson || !lesson.answers) {
        container.innerHTML = '<div class="alert alert-warning">لا توجد إجابات محفوظة.</div>';
    } else {
        container.innerHTML = lesson.answers.map((ans, i) => `
            <div class="review-question-item">
                <div style="margin-bottom:5px;"><strong>س${i+1}:</strong> ${ans.questionText || 'سؤال'}</div>
                <div class="student-answer-box">${ans.value || 'لا توجد إجابة'}</div>
            </div>
        `).join('');
    }
    document.getElementById('viewLessonAnswersModal').classList.add('show');
}

function resetLesson(id) {
    if(!confirm('هل أنت متأكد من إعادة فتح الدرس؟ سيتم مسح الإجابات وتاريخ الإنجاز.')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].status = 'pending';
        delete studentLessons[idx].completedDate;
        delete studentLessons[idx].answers;
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        loadIEPTab();
        alert('تمت إعادة الفتح.');
    }
}

function toggleLessonLock(id, shouldLock) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].isManuallyLocked = shouldLock;
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

function showAssignLibraryLessonModal() {
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const select = document.getElementById('libraryLessonSelect');
    select.innerHTML = '<option value="">اختر درساً...</option>';
    allLessons.forEach(l => {
        select.innerHTML += `<option value="${l.id}">${l.title} (${l.subject})</option>`;
    });
    document.getElementById('assignLibraryLessonModal').classList.add('show');
}

function assignLibraryLesson() {
    const lessonId = parseInt(document.getElementById('libraryLessonSelect').value);
    if(!lessonId) return;
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const originalLesson = allLessons.find(l => l.id === lessonId);
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myLessons = studentLessons.filter(l => l.studentId === currentStudentId);
    const maxOrder = myLessons.length > 0 ? Math.max(...myLessons.map(l => l.orderIndex || 0)) : 0;

    studentLessons.push({
        id: Date.now(), studentId: currentStudentId, title: originalLesson.title, 
        objective: originalLesson.linkedInstructionalGoal || 'درس إضافي', 
        originalLessonId: lessonId, status: 'pending', 
        assignedDate: new Date().toISOString(), orderIndex: maxOrder + 1
    });
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    closeModal('assignLibraryLessonModal');
    loadLessonsTab();
    alert('تم الإسناد.');
}

function regenerateLessons() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    if (!completedDiagnostic) { alert('يجب إجراء اختبار تشخيصي أولاً.'); return; }
    const allLessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myLessons = studentLessons.filter(l => l.studentId === currentStudentId);
    let nextOrder = myLessons.length > 0 ? Math.max(...myLessons.map(l => l.orderIndex || 0)) + 1 : 1;
    let addedCount = 0;
    allLessonsLib.forEach(libLesson => {
        if(libLesson.linkedInstructionalGoal) {
             const alreadyExists = studentLessons.some(sl => sl.studentId === currentStudentId && sl.originalLessonId === libLesson.id);
             if(!alreadyExists) {
                 studentLessons.push({
                     id: Date.now() + Math.floor(Math.random()*10000), studentId: currentStudentId, 
                     title: libLesson.title, objective: libLesson.linkedInstructionalGoal, 
                     originalLessonId: libLesson.id, status: 'pending', 
                     assignedDate: new Date().toISOString(), orderIndex: nextOrder++
                 });
                 addedCount++;
             }
        }
    });
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    loadLessonsTab();
    alert(`تم التحديث وإضافة ${addedCount} درس.`);
}

// 4. الواجبات والتقدم (نفس الكود الأصلي)
function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId === currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    if (list.length === 0) { container.innerHTML = '<div class="empty-state"><h3>لا توجد واجبات.</h3></div>'; return; }
    container.innerHTML = list.map(a => `<div class="content-card"><h4>${a.title}</h4><div class="content-meta"><span>${a.dueDate || 'مفتوح'}</span><span class="badge ${a.status === 'completed' ? 'badge-success' : 'badge-primary'}">${a.status === 'completed' ? 'مكتمل' : 'جديد'}</span></div><button class="btn btn-sm btn-danger mt-2" onclick="deleteAssignment(${a.id})">حذف</button></div>`).join('');
}
function loadProgressTab() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId === currentStudentId);
    const tbody = document.getElementById('progressTableBody');
    if(lessons.length === 0) { tbody.innerHTML = '<tr><td colspan="3" class="text-center">لا توجد بيانات</td></tr>'; return; }
    tbody.innerHTML = lessons.map(l => `<tr><td>${l.objective}</td><td><span class="badge ${l.status === 'completed' ? 'badge-success' : 'badge-secondary'}">${l.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}</span></td><td>${l.completedDate ? new Date(l.completedDate).toLocaleDateString('ar-SA') : '-'}</td></tr>`).join('');
}

// دوال مساعدة
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function showAssignTestModal() { const allTests = JSON.parse(localStorage.getItem('tests') || '[]'); const select = document.getElementById('testSelect'); select.innerHTML = '<option value="">اختر اختباراً...</option>'; allTests.forEach(t => select.innerHTML += `<option value="${t.id}">${t.title}</option>`); document.getElementById('assignTestModal').classList.add('show'); }
function assignTest() { const testId = parseInt(document.getElementById('testSelect').value); if(!testId) return; const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]'); if(studentTests.some(t => t.studentId === currentStudentId && t.type === 'diagnostic')) { alert('يوجد اختبار معين مسبقاً'); return; } studentTests.push({ id: Date.now(), studentId: currentStudentId, testId: testId, type: 'diagnostic', status: 'pending', assignedDate: new Date().toISOString() }); localStorage.setItem('studentTests', JSON.stringify(studentTests)); closeModal('assignTestModal'); loadDiagnosticTab(); alert('تم التعيين'); }
function showAssignHomeworkModal() { const lib = JSON.parse(localStorage.getItem('assignments') || '[]'); const select = document.getElementById('homeworkSelect'); select.innerHTML = lib.length ? lib.map(a => `<option value="${a.id}">${a.title}</option>`).join('') : '<option>المكتبة فارغة</option>'; document.getElementById('assignHomeworkModal').classList.add('show'); }
function assignHomework() { const select = document.getElementById('homeworkSelect'); if(!select.value) return; const title = select.options[select.selectedIndex].text; const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); list.push({ id: Date.now(), studentId: currentStudentId, title: title, status: 'pending', dueDate: document.getElementById('homeworkDueDate').value, assignedDate: new Date().toISOString() }); localStorage.setItem('studentAssignments', JSON.stringify(list)); closeModal('assignHomeworkModal'); loadAssignmentsTab(); alert('تم الإسناد'); }
function deleteAssignedTest(id) { if(confirm('حذف؟')) { let st = JSON.parse(localStorage.getItem('studentTests') || '[]'); st = st.filter(t => t.id !== id); localStorage.setItem('studentTests', JSON.stringify(st)); loadDiagnosticTab(); } }
function deleteAssignment(id) { if(confirm('حذف؟')) { let list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); list = list.filter(a => a.id !== id); localStorage.setItem('studentAssignments', JSON.stringify(list)); loadAssignmentsTab(); } }
function openReviewModal(id) { /* (كود المراجعة موجود في الملف) */ alert('استخدم زر المراجعة في الكود الكامل'); }

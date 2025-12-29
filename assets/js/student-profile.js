// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: ملف الطالب - تحكم بالدروس + ترتيب رقمي
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
            actionContent = `<div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:5px;"><strong>الدرجة: ${assignedTest.score || 0}%</strong><button class="btn btn-warning mt-2" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح</button></div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
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

// 2. الخطة التربوية
function loadIEPTab() {
    const iepContent = document.getElementById('iepContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');

    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    if (!completedDiagnostic) {
        iepContent.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3><p>يجب إكمال وتصحيح اختبار تشخيصي أولاً.</p></div>`;
        return;
    }

    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);
    
    // جلب تواريخ الإنجاز
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const completedLessonsMap = {};
    studentLessons.forEach(l => {
        if (l.studentId === currentStudentId && l.status === 'completed') {
            completedLessonsMap[l.objective] = l.completedDate;
        }
    });

    let needsObjects = [];
    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(question => {
            const studentAnswerObj = completedDiagnostic.answers.find(a => a.questionId === question.id);
            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id === question.linkedGoalId);
                if (objective) {
                    const studentScore = studentAnswerObj ? (studentAnswerObj.score || 0) : 0;
                    if (studentScore < (question.passingScore || 1)) {
                        if (!needsObjects.find(o => o.id === objective.id)) needsObjects.push(objective);
                    }
                }
            }
        });
    }

    if(needsObjects.length === 0) {
        iepContent.innerHTML = '<div class="alert alert-success">جميع الأهداف محققة.</div>';
        return;
    }

    let objectivesHTML = '';
    let counter = 1;
    needsObjects.forEach(obj => {
        objectivesHTML += `<tr style="background:#f8f9fa;"><td colspan="3"><strong>هدف قصير المدى:</strong> ${obj.shortTermGoal}</td></tr>`;
        if (obj.instructionalGoals) {
            obj.instructionalGoals.forEach(iGoal => {
                const achievedDate = completedLessonsMap[iGoal];
                const dateDisplay = achievedDate 
                    ? `<span class="text-success font-weight-bold">✔ ${new Date(achievedDate).toLocaleDateString('ar-SA')}</span>` 
                    : '<span class="text-muted">⏳</span>';
                objectivesHTML += `<tr><td>${counter++}</td><td>${iGoal}</td><td>${dateDisplay}</td></tr>`;
            });
        }
    });

    iepContent.innerHTML = `
        <div class="card">
            <h4>تفاصيل الخطة</h4>
            <table class="table"><thead><tr><th>م</th><th>الهدف التدريسي</th><th>تاريخ التحقق</th></tr></thead><tbody>${objectivesHTML}</tbody></table>
        </div>`;
}

// ---------------------------------------------------------
// 3. الدروس (الترتيب الرقمي + التحكم الكامل)
// ---------------------------------------------------------
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId === currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    
    if (myList.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3></div>`;
        return;
    }

    // 1. الترتيب بناءً على orderIndex (الرقمي)
    // إذا لم يكن هناك ترتيب، نستخدم التاريخ
    myList.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
        const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
        return orderA - orderB || new Date(a.assignedDate) - new Date(b.assignedDate);
    });

    container.innerHTML = myList.map((l, index) => {
        let controls = '';
        let statusDisplay = '';

        // تحديد الحالة
        if(l.status === 'completed') {
            statusDisplay = `<span class="badge badge-success">مكتمل (${new Date(l.completedDate).toLocaleDateString('ar-SA')})</span>`;
            controls = `
                <button class="btn btn-info" onclick="openLessonReview(${l.id})">👁️ الحل</button>
                <button class="btn btn-warning" onclick="resetLesson(${l.id})">🔄 تصفير</button>
            `;
        } else {
            statusDisplay = l.isManuallyLocked ? '<span class="badge badge-secondary">🔒 مقفل يدوياً</span>' : '<span class="badge badge-primary">قيد الانتظار</span>';
            controls = l.isManuallyLocked 
                ? `<button class="btn btn-success" onclick="toggleLessonLock(${l.id}, false)">🔓 إتاحة</button>`
                : `<button class="btn btn-secondary" onclick="toggleLessonLock(${l.id}, true)">🔒 قفل</button>`;
        }

        // تحديد رقم الترتيب الافتراضي
        const displayOrder = l.orderIndex !== undefined ? l.orderIndex : index + 1;

        return `
        <div class="content-card">
            <div class="order-badge">
                <span>ترتيب:</span>
                <input type="number" class="order-input" value="${displayOrder}" onchange="updateLessonOrder(${l.id}, this.value)">
            </div>

            <div class="content-header" style="margin-top: 15px;">
                <h4>${l.title}</h4>
                ${statusDisplay}
            </div>
            
            <div class="content-body">
                <p><strong>الهدف:</strong> ${l.objective || 'إثرائي / إضافي'}</p>
            </div>
            
            <div class="lesson-controls">${controls}</div>
        </div>`;
    }).join('');
}

// دالة تحديث الترتيب الرقمي
function updateLessonOrder(lessonId, newOrder) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === lessonId);
    
    if (idx !== -1) {
        studentLessons[idx].orderIndex = parseInt(newOrder);
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        // إعادة التحميل لترتيب العناصر من جديد
        loadLessonsTab();
    }
}

// ---------------------------------------------------------
// دوال التحكم والإسناد
// ---------------------------------------------------------
function openLessonReview(assignmentId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lesson = studentLessons.find(l => l.id === assignmentId);
    
    const container = document.getElementById('lessonAnswersBody');
    if(!lesson || !lesson.answers || lesson.answers.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">لا توجد إجابات محفوظة لهذا الدرس.</div>';
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
    if(!confirm('تأكيد إعادة فتح الدرس؟ سيتم حذف الإجابات والتاريخ.')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].status = 'pending';
        studentLessons[idx].completedDate = null;
        studentLessons[idx].answers = null;
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        loadIEPTab();
        alert('تم إعادة فتح الدرس.');
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
    
    // حساب الترتيب التلقائي (آخر رقم + 1)
    const myLessons = studentLessons.filter(l => l.studentId === currentStudentId);
    const maxOrder = myLessons.length > 0 ? Math.max(...myLessons.map(l => l.orderIndex || 0)) : 0;

    studentLessons.push({
        id: Date.now(),
        studentId: currentStudentId,
        title: originalLesson.title,
        objective: originalLesson.linkedInstructionalGoal || 'درس إضافي',
        originalLessonId: lessonId,
        status: 'pending',
        assignedDate: new Date().toISOString(),
        orderIndex: maxOrder + 1
    });

    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    closeModal('assignLibraryLessonModal');
    loadLessonsTab();
    alert('تم إسناد الدرس.');
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
                     id: Date.now() + Math.floor(Math.random()*10000),
                     studentId: currentStudentId,
                     title: libLesson.title,
                     objective: libLesson.linkedInstructionalGoal,
                     originalLessonId: libLesson.id,
                     status: 'pending',
                     assignedDate: new Date().toISOString(),
                     orderIndex: nextOrder++
                 });
                 addedCount++;
             }
        }
    });

    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    loadLessonsTab();
    alert(`تم تحديث القائمة وإضافة ${addedCount} درس.`);
}

// Helpers
function showAssignTestModal() { document.getElementById('assignTestModal').classList.add('show'); }
function showAssignHomeworkModal() { document.getElementById('assignHomeworkModal').classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function deleteAssignedTest(id) { if(confirm('حذف؟')){ let st=JSON.parse(localStorage.getItem('studentTests')); st=st.filter(x=>x.id!==id); localStorage.setItem('studentTests',JSON.stringify(st)); loadDiagnosticTab(); } }

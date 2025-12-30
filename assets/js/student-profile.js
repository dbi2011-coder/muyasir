// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب (استعادة تصميم الخطة الأصلي + إصلاحات الاختبار)
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
    currentStudent = users.find(u => u.id == currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    // تحديث الواجهة
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

// ============================================
// 1. قسم الاختبار التشخيصي
// ============================================
function loadDiagnosticTab() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic');
    
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const detailsDiv = document.getElementById('diagnosticTestDetails');
        detailsDiv.style.display = 'block';
        
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id == assignedTest.testId);
        
        let statusBadge = '';
        let actionContent = '';

        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            actionContent = `
                <div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:5px;">
                    <strong>الدرجة الحالية: ${assignedTest.score || 0}%</strong>
                    <button class="btn btn-warning mt-2" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح</button>
                </div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
            actionContent = `<div class="alert alert-warning mt-2">تم إعادة الاختبار للطالب.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">قيد الانتظار</span>';
        }

        const testTitle = originalTest ? originalTest.title : 'اختبار (محذوف)';

        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${testTitle}</h3>
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

// ---------------------------------------------------------
// دالة تنسيق الإجابات (صور، صوت، نصوص، قوائم)
// ---------------------------------------------------------
function formatAnswerDisplay(answerData) {
    if (!answerData) return '<span class="text-muted">لم يجب</span>';

    const checkTypeAndReturnHTML = (data) => {
        if (typeof data !== 'string') return null;
        if (data.startsWith('data:audio')) {
            return `<audio controls src="${data}" style="width: 100%; margin-top:5px;"></audio>`;
        }
        if (data.startsWith('data:image')) {
            return `<img src="${data}" style="max-width:100%; border:1px solid #ccc; border-radius:5px; margin-top:5px;">`;
        }
        return null;
    };

    if (typeof answerData === 'string') {
        const html = checkTypeAndReturnHTML(answerData);
        return html ? html : answerData;
    }

    if (typeof answerData === 'object') {
        const values = Object.values(answerData);
        for (let val of values) {
            const html = checkTypeAndReturnHTML(val);
            if (html) return html;
        }
        let htmlList = '<ol style="padding-right: 20px; margin-bottom: 0;">';
        values.forEach(val => { if(val) htmlList += `<li>${val}</li>`; });
        htmlList += '</ol>';
        return htmlList;
    }

    return JSON.stringify(answerData);
}

function openReviewModal(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id == assignmentId);
    
    if(!assignment) { alert('لم يتم العثور على الاختبار'); return; }
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == assignment.testId);
    
    document.getElementById('reviewAssignmentId').value = assignmentId;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach((q, index) => {
            const studentAnsObj = assignment.answers ? assignment.answers.find(a => a.questionId == q.id) : null;
            let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
            const formattedAnswer = formatAnswerDisplay(rawAnswer);

            const currentScore = studentAnsObj ? (studentAnsObj.score || 0) : 0;
            const teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
            const maxScore = q.passingScore || 1;

            const item = document.createElement('div');
            item.className = 'review-question-item';
            item.innerHTML = `
                <div class="review-q-header">
                    <strong>س${index+1}: ${q.text}</strong>
                    <div>
                        <input type="number" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0">
                        <span class="text-muted"> / ${maxScore}</span>
                    </div>
                </div>
                <div class="student-answer-box">
                    <strong>إجابة الطالب:</strong>
                    <div style="margin-top:5px;">${formattedAnswer}</div>
                </div>
                <div class="teacher-feedback-box">
                    <textarea class="form-control" name="note_${q.id}" placeholder="ملاحظات المعلم...">${teacherNote}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    } else {
        container.innerHTML = '<p class="text-center text-muted">لا توجد أسئلة.</p>';
    }
    document.getElementById('reviewTestModal').classList.add('show');
}

function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.id == id);
    if(idx === -1) return;

    const container = document.getElementById('reviewQuestionsContainer');
    let totalScore = 0;
    let maxTotalScore = 0;
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == studentTests[idx].testId);

    if(originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const scoreInp = container.querySelector(`input[name="score_${q.id}"]`);
            const noteInp = container.querySelector(`textarea[name="note_${q.id}"]`);
            
            if (!studentTests[idx].answers) studentTests[idx].answers = [];
            let ansIdx = studentTests[idx].answers.findIndex(a => a.questionId == q.id);
            const newScore = parseInt(scoreInp.value) || 0;
            
            if(ansIdx !== -1) {
                studentTests[idx].answers[ansIdx].score = newScore;
                studentTests[idx].answers[ansIdx].teacherNote = noteInp.value;
            } else {
                studentTests[idx].answers.push({ questionId: q.id, score: newScore, teacherNote: noteInp.value, answer: null });
            }
            totalScore += newScore;
            maxTotalScore += (q.passingScore || 1);
        });
        studentTests[idx].score = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
        studentTests[idx].status = 'completed';
    }

    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('reviewTestModal');
    loadDiagnosticTab();
    if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
    alert('تم حفظ التصحيح');
}

// ============================================
// 2. الخطة التربوية (استعادة التصميم السابق)
// ============================================
function loadIEPTab() {
    const iepContainer = document.getElementById('iepContent');
    if (!iepContainer) return;

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');

    // 1. البحث عن الاختبار المكتمل
    const completedDiagnostic = studentTests
        .filter(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    if (!completedDiagnostic) {
        iepContainer.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3><p>يجب إكمال وتصحيح اختبار تشخيصي أولاً.</p></div>`;
        return;
    }

    const originalTest = allTests.find(t => t.id == completedDiagnostic.testId);
    if (!originalTest) {
        iepContainer.innerHTML = `<div class="alert alert-danger">خطأ: بيانات الاختبار الأصلي محذوفة.</div>`;
        return;
    }

    // 2. تحليل الأهداف (نقاط القوة والاحتياج)
    let needsObjects = [];
    let strengthItemsHTML = '';
    let needsItemsHTML = '';
    
    if (originalTest.questions) {
        originalTest.questions.forEach(question => {
            let studentScore = 0;
            if (completedDiagnostic.answers) {
                const ans = completedDiagnostic.answers.find(a => a.questionId == question.id);
                if (ans) studentScore = Number(ans.score) || 0;
            }

            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id == question.linkedGoalId);
                if (objective) {
                    const passingScore = Number(question.passingScore) || 1;
                    if (studentScore >= passingScore) {
                        if (!strengthItemsHTML.includes(objective.shortTermGoal)) {
                            strengthItemsHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    } else {
                        if (!needsObjects.find(o => o.id == objective.id)) {
                            needsObjects.push(objective);
                            needsItemsHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    }
                }
            }
        });
    }

    if (!strengthItemsHTML) strengthItemsHTML = '<li>لا توجد نقاط مسجلة.</li>';
    if (!needsItemsHTML) needsItemsHTML = '<li>لا توجد نقاط احتياج مسجلة.</li>';

    // 3. جلب تواريخ الدروس
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const completedLessonsMap = {};
    studentLessons.forEach(l => {
        if (l.studentId == currentStudentId && l.status === 'completed') {
            completedLessonsMap[l.objective] = l.completedDate;
        }
    });

    // 4. بناء جدول الاحتياجات
    let objectivesRows = '';
    if (needsObjects.length === 0) {
        objectivesRows = '<tr><td colspan="3" class="text-center">جميع الأهداف محققة (لا توجد نقاط احتياج).</td></tr>';
    } else {
        let counter = 1;
        needsObjects.forEach(obj => {
            objectivesRows += `<tr style="background-color: #e9ecef;"><td class="text-center"><strong>*</strong></td><td colspan="2"><strong>هدف قصير المدى:</strong> ${obj.shortTermGoal}</td></tr>`;
            
            if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                obj.instructionalGoals.forEach(iGoal => {
                    const achievementDate = completedLessonsMap[iGoal];
                    let dateDisplay = '';
                    
                    if (achievementDate) {
                        try {
                            const d = new Date(achievementDate);
                            dateDisplay = `<span class="text-success font-weight-bold">✔ ${d.toLocaleDateString('ar-SA')}</span>`;
                        } catch(e) {}
                    } else {
                        // حقل تاريخ فارغ (محاكاة للتصميم القديم)
                        dateDisplay = `<input type="date" class="form-control" style="border:none; background:transparent;" disabled>`;
                    }
                    objectivesRows += `<tr><td class="text-center">${counter++}</td><td>${iGoal}</td><td>${dateDisplay}</td></tr>`;
                });
            } else {
                objectivesRows += `<tr><td>-</td><td class="text-muted">لا توجد أهداف تدريسية</td><td></td></tr>`;
            }
        });
    }

    // 5. بناء قالب الخطة (استعادة التصميم الرسمي)
    const iepHTML = `
        <div class="iep-document" style="background:white; padding:30px; border:1px solid #ddd; border-radius:8px;">
            <div class="text-center mb-4">
                <h3>الخطة التربوية الفردية (IEP)</h3>
            </div>
            
            <table class="table table-bordered mb-4">
                <tr>
                    <td style="background:#f9f9f9; width:15%;"><strong>اسم الطالب:</strong></td>
                    <td style="width:35%;">${currentStudent.name}</td>
                    <td style="background:#f9f9f9; width:15%;"><strong>الصف:</strong></td>
                    <td style="width:35%;">${currentStudent.grade}</td>
                </tr>
                <tr>
                    <td style="background:#f9f9f9;"><strong>المادة:</strong></td>
                    <td>${originalTest.subject || 'عام'}</td>
                    <td style="background:#f9f9f9;"><strong>تاريخ الخطة:</strong></td>
                    <td>${new Date().toLocaleDateString('ar-SA')}</td>
                </tr>
            </table>

            <h5 class="mb-3" style="border-right:4px solid #28a745; padding-right:10px;">جدول الحصص:</h5>
            <div class="table-responsive mb-4">
                <table class="table table-bordered text-center">
                    <thead>
                        <tr style="background:#eee;">
                            <th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td id="day-sunday"></td>
                            <td id="day-monday"></td>
                            <td id="day-tuesday"></td>
                            <td id="day-wednesday"></td>
                            <td id="day-thursday"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">نـقـاط الـقـوة</div>
                        <div class="card-body">
                            <ul style="padding-right:20px; margin:0;">${strengthItemsHTML}</ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-danger text-white">نـقـاط الاحـتـيـاج</div>
                        <div class="card-body">
                            <ul style="padding-right:20px; margin:0;">${needsItemsHTML}</ul>
                        </div>
                    </div>
                </div>
            </div>

            <h5 class="mb-3" style="border-right:4px solid #007bff; padding-right:10px;">الأهداف التدريسية:</h5>
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th style="width:50px;">#</th>
                            <th>الهدف التدريسي</th>
                            <th style="width:150px;">تاريخ التحقق</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${objectivesRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    iepContainer.innerHTML = iepHTML;
    
    // استدعاء دالة تعبئة الجدول بعد رسم HTML
    fillScheduleTable();
}

function fillScheduleTable() {
    const daysMap = { 'sunday': 'day-sunday', 'monday': 'day-monday', 'tuesday': 'day-tuesday', 'wednesday': 'day-wednesday', 'thursday': 'day-thursday' };
    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]'); 
    // تنظيف الخلايا
    Object.values(daysMap).forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = ''; });
    
    schedule.forEach(session => {
        // إذا كان هذا الطالب مضافاً للحصة
        // ملاحظة: قد يكون الحقل students أو studentId حسب نسخة النظام، نتحقق من كليهما
        let hasStudent = false;
        if (session.students && session.students.includes(currentStudentId)) hasStudent = true;
        if (session.studentId == currentStudentId) hasStudent = true;

        if (hasStudent) {
            const cellId = daysMap[session.day];
            if (cellId && document.getElementById(cellId)) {
                document.getElementById(cellId).innerHTML += `<div style="background:#d4edda; color:#155724; padding:5px; border-radius:4px; margin-bottom:2px; font-size:0.9rem;">حصة ${session.period || 1}</div>`;
            }
        }
    });
}

// ============================================
// 3. قسم الدروس
// ============================================
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    
    if (myList.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3></div>`;
        return;
    }

    myList.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
        const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
        return orderA - orderB || new Date(a.assignedDate) - new Date(b.assignedDate);
    });

    container.innerHTML = myList.map((l, index) => {
        let controls = '';
        let statusDisplay = '';
        let cardClass = '';

        if(l.status === 'completed') {
            statusDisplay = `<span class="badge badge-success">مكتمل (${new Date(l.completedDate).toLocaleDateString('ar-SA')})</span>`;
            cardClass = 'completed';
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

        const orderButtons = `
            <div class="order-controls">
                <button class="btn-order" onclick="moveLesson(${l.id}, 'up')" title="تقديم">⬆</button>
                <button class="btn-order" onclick="moveLesson(${l.id}, 'down')" title="تأخير">⬇</button>
            </div>`;

        return `
        <div class="content-card ${cardClass}">
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

function moveLesson(lessonId, direction) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    
    myLessons.sort((a, b) => (a.orderIndex||0) - (b.orderIndex||0));
    myLessons.forEach((l, i) => l.orderIndex = i);

    const currentIndex = myLessons.findIndex(l => l.id == lessonId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
        const temp = myLessons[currentIndex].orderIndex;
        myLessons[currentIndex].orderIndex = myLessons[currentIndex - 1].orderIndex;
        myLessons[currentIndex - 1].orderIndex = temp;
    } else if (direction === 'down' && currentIndex < myLessons.length - 1) {
        const temp = myLessons[currentIndex].orderIndex;
        myLessons[currentIndex].orderIndex = myLessons[currentIndex + 1].orderIndex;
        myLessons[currentIndex + 1].orderIndex = temp;
    }

    myLessons.forEach(l => {
        const mainIdx = studentLessons.findIndex(sl => sl.id == l.id);
        if (mainIdx !== -1) studentLessons[mainIdx].orderIndex = l.orderIndex;
    });

    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    loadLessonsTab();
}

function openLessonReview(assignmentId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lesson = studentLessons.find(l => l.id == assignmentId);
    const container = document.getElementById('lessonAnswersBody');
    
    if(!lesson || !lesson.answers) {
        container.innerHTML = '<div class="alert alert-warning">لا توجد إجابات محفوظة.</div>';
    } else {
        container.innerHTML = lesson.answers.map((ans, i) => {
            const formatted = formatAnswerDisplay(ans.value);
            return `<div class="review-question-item"><div style="margin-bottom:5px;"><strong>س${i+1}:</strong> ${ans.questionText || 'سؤال'}</div><div class="student-answer-box">${formatted}</div></div>`;
        }).join('');
    }
    document.getElementById('viewLessonAnswersModal').classList.add('show');
}

function resetLesson(id) {
    if(!confirm('تنبيه: سيتم إعادة فتح الدرس ومسح الإجابات وتاريخ الإنجاز. هل أنت متأكد؟')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id == id);
    if(idx !== -1) {
        studentLessons[idx].status = 'pending';
        delete studentLessons[idx].completedDate; 
        delete studentLessons[idx].answers;
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        if (document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
        alert('تمت إعادة الفتح.');
    }
}

function toggleLessonLock(id, shouldLock) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id == id);
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
    const originalLesson = allLessons.find(l => l.id == lessonId);
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    const maxOrder = myLessons.length > 0 ? Math.max(...myLessons.map(l => l.orderIndex || 0)) : 0;

    studentLessons.push({
        id: Date.now(), studentId: currentStudentId, title: originalLesson.title, 
        objective: originalLesson.linkedInstructionalGoal || 'درس إضافي', originalLessonId: lessonId, 
        status: 'pending', assignedDate: new Date().toISOString(), orderIndex: maxOrder + 1
    });
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    closeModal('assignLibraryLessonModal');
    loadLessonsTab();
    alert('تم الإسناد.');
}

function regenerateLessons() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    if (!completedDiagnostic) { alert('يجب إجراء اختبار تشخيصي أولاً.'); return; }
    const allLessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let nextOrder = myLessons.length > 0 ? Math.max(...myLessons.map(l => l.orderIndex || 0)) + 1 : 1;
    let addedCount = 0;

    allLessonsLib.forEach(libLesson => {
        if(libLesson.linkedInstructionalGoal) {
             const alreadyExists = studentLessons.some(sl => sl.studentId == currentStudentId && sl.originalLessonId == libLesson.id);
             if(!alreadyExists) {
                 studentLessons.push({
                     id: Date.now() + Math.floor(Math.random()*10000), 
                     studentId: currentStudentId, title: libLesson.title, objective: libLesson.linkedInstructionalGoal, 
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

function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId == currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    if (list.length === 0) { container.innerHTML = '<div class="empty-state"><h3>لا توجد واجبات.</h3></div>'; return; }
    container.innerHTML = list.map(a => `<div class="content-card"><h4>${a.title}</h4><div class="content-meta"><span>${a.dueDate || 'مفتوح'}</span><span class="badge ${a.status === 'completed' ? 'badge-success' : 'badge-primary'}">${a.status === 'completed' ? 'مكتمل' : 'جديد'}</span></div><button class="btn btn-sm btn-danger mt-2" onclick="deleteAssignment(${a.id})">حذف</button></div>`).join('');
}
function loadProgressTab() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId == currentStudentId);
    const tbody = document.getElementById('progressTableBody');
    if(lessons.length === 0) { tbody.innerHTML = '<tr><td colspan="3" class="text-center">لا توجد بيانات</td></tr>'; return; }
    tbody.innerHTML = lessons.map(l => `<tr><td>${l.objective}</td><td><span class="badge ${l.status === 'completed' ? 'badge-success' : 'badge-secondary'}">${l.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}</span></td><td>${l.completedDate ? new Date(l.completedDate).toLocaleDateString('ar-SA') : '-'}</td></tr>`).join('');
}

// Helpers
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function showAssignTestModal() { const allTests = JSON.parse(localStorage.getItem('tests') || '[]'); const select = document.getElementById('testSelect'); select.innerHTML = '<option value="">اختر اختباراً...</option>'; allTests.forEach(t => select.innerHTML += `<option value="${t.id}">${t.title}</option>`); document.getElementById('assignTestModal').classList.add('show'); }
function assignTest() { const testId = parseInt(document.getElementById('testSelect').value); if(!testId) return; const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]'); if(studentTests.some(t => t.studentId == currentStudentId && t.type === 'diagnostic')) { alert('يوجد اختبار معين مسبقاً'); return; } studentTests.push({ id: Date.now(), studentId: currentStudentId, testId: testId, type: 'diagnostic', status: 'pending', assignedDate: new Date().toISOString() }); localStorage.setItem('studentTests', JSON.stringify(studentTests)); closeModal('assignTestModal'); loadDiagnosticTab(); alert('تم التعيين'); }
function showAssignHomeworkModal() { const lib = JSON.parse(localStorage.getItem('assignments') || '[]'); const select = document.getElementById('homeworkSelect'); select.innerHTML = lib.length ? lib.map(a => `<option value="${a.id}">${a.title}</option>`).join('') : '<option>المكتبة فارغة</option>'; document.getElementById('assignHomeworkModal').classList.add('show'); }
function assignHomework() { const select = document.getElementById('homeworkSelect'); if(!select.value) return; const title = select.options[select.selectedIndex].text; const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); list.push({ id: Date.now(), studentId: currentStudentId, title: title, status: 'pending', dueDate: document.getElementById('homeworkDueDate').value, assignedDate: new Date().toISOString() }); localStorage.setItem('studentAssignments', JSON.stringify(list)); closeModal('assignHomeworkModal'); loadAssignmentsTab(); alert('تم الإسناد'); }
function deleteAssignedTest(id) { if(confirm('حذف؟')) { let st = JSON.parse(localStorage.getItem('studentTests') || '[]'); st = st.filter(t => t.id != id); localStorage.setItem('studentTests', JSON.stringify(st)); loadDiagnosticTab(); } }
function deleteAssignment(id) { if(confirm('حذف؟')) { let list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); list = list.filter(a => a.id != id); localStorage.setItem('studentAssignments', JSON.stringify(list)); loadAssignmentsTab(); } }
function returnTestForResubmission() { const id = parseInt(document.getElementById('reviewAssignmentId').value); if(!confirm('إعادة الاختبار للطالب للتعديل؟')) return; const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]'); const idx = studentTests.findIndex(t => t.id == id); if(idx !== -1) { studentTests[idx].status = 'returned'; localStorage.setItem('studentTests', JSON.stringify(studentTests)); closeModal('reviewTestModal'); loadDiagnosticTab(); alert('تمت الإعادة'); } }

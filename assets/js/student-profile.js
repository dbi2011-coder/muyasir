// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب (إصلاح عرض الصور في المراجعة + استقرار الخطة)
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
    
    // تحديث واجهة الرأس والقائمة الجانبية
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

// --------------------------------------------
// ✅ إصلاح دالة المراجعة لعرض الصور
// --------------------------------------------
function openReviewModal(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    
    if(!assignment) { alert('الاختبار غير موجود'); return; }
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id === assignment.testId);
    
    document.getElementById('reviewAssignmentId').value = assignmentId;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach((q, index) => {
            const studentAnsObj = assignment.answers ? assignment.answers.find(a => a.questionId === q.id) : null;
            
            // --- منطق ذكي لعرض الإجابة (نص أو صورة) ---
            let displayAnswer = '<span class="text-muted">لم يجب الطالب</span>';
            
            if (studentAnsObj) {
                // 1. هل الإجابة كائن (JSON) يحتوي على صورة؟
                if (typeof studentAnsObj.answer === 'object' && studentAnsObj.answer !== null) {
                    const vals = Object.values(studentAnsObj.answer);
                    // التحقق مما إذا كانت القيمة تبدأ بـ data:image (صورة base64)
                    if (vals.length > 0 && typeof vals[0] === 'string' && vals[0].startsWith('data:image')) {
                        displayAnswer = `<img src="${vals[0]}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px; margin-top:5px;">`;
                    } else {
                        // محاولة استخراج نص إذا لم تكن صورة
                        displayAnswer = studentAnsObj.answer.value || studentAnsObj.answer.text || JSON.stringify(studentAnsObj.answer);
                    }
                } 
                // 2. هل الإجابة نصية مباشرة؟
                else if (studentAnsObj.answer) {
                    displayAnswer = studentAnsObj.answer;
                }
            }
            // -----------------------------------------------

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
                    <strong>إجابة الطالب:</strong><br>
                    ${displayAnswer}
                </div>
                <div class="teacher-feedback-box">
                    <textarea class="form-control" name="note_${q.id}" placeholder="ملاحظات المعلم...">${teacherNote}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }
    document.getElementById('reviewTestModal').classList.add('show');
}

function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.id === id);
    if(idx === -1) return;

    const container = document.getElementById('reviewQuestionsContainer');
    let totalScore = 0;
    let maxTotalScore = 0;
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id === studentTests[idx].testId);

    if(originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const scoreInp = container.querySelector(`input[name="score_${q.id}"]`);
            const noteInp = container.querySelector(`textarea[name="note_${q.id}"]`);
            
            const ansIdx = studentTests[idx].answers.findIndex(a => a.questionId === q.id);
            const newScore = parseInt(scoreInp.value) || 0;
            
            if(ansIdx !== -1) {
                studentTests[idx].answers[ansIdx].score = newScore;
                studentTests[idx].answers[ansIdx].teacherNote = noteInp.value;
            }
            totalScore += newScore;
            maxTotalScore += (q.passingScore || 1);
        });
        
        // تحديث النسبة
        studentTests[idx].score = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
    }

    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('reviewTestModal');
    loadDiagnosticTab();
    
    // تحديث الخطة فوراً إذا كانت معروضة
    if(document.getElementById('section-iep').classList.contains('active')) {
        loadIEPTab();
    }
    
    alert('تم حفظ التصحيح');
}

function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    if(!confirm('إعادة الاختبار للطالب للتعديل؟')) return;
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.id === id);
    if(idx !== -1) {
        studentTests[idx].status = 'returned';
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        closeModal('reviewTestModal');
        loadDiagnosticTab();
        alert('تمت إعادة الاختبار للطالب');
    }
}

// ============================================
// 2. الخطة التربوية (إصلاح عدم الظهور)
// ============================================
function loadIEPTab() {
    const iepContent = document.getElementById('iepContent');
    if (!iepContent) return;

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');

    // البحث عن أحدث اختبار تشخيصي مكتمل
    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    // إخفاء/إظهار النموذج بناءً على وجود الاختبار
    const wordModel = document.querySelector('.iep-word-model');
    
    if (!completedDiagnostic) {
        if(wordModel) wordModel.style.display = 'none';
        iepContent.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3><p>يجب إكمال وتصحيح اختبار تشخيصي أولاً.</p></div>`;
        return;
    }

    if(wordModel) wordModel.style.display = 'block';
    if(iepContent.querySelector('.empty-state')) iepContent.innerHTML = '';

    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);

    // تعبئة البيانات (مع حماية ضد القيم الفارغة)
    if(document.getElementById('iep-student-name')) document.getElementById('iep-student-name').textContent = currentStudent.name || '';
    if(document.getElementById('iep-grade')) document.getElementById('iep-grade').textContent = currentStudent.grade || '';
    if(document.getElementById('iep-subject')) document.getElementById('iep-subject').textContent = originalTest ? originalTest.subject : 'عام';
    if(document.getElementById('iep-date')) document.getElementById('iep-date').textContent = new Date().toLocaleDateString('ar-SA');

    fillScheduleTable();

    // جلب تواريخ إنجاز الدروس
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

    if(strengthsList) strengthsList.innerHTML = '';
    if(needsList) needsList.innerHTML = '';
    if(objectivesBody) objectivesBody.innerHTML = '';

    let needsObjects = [];

    // ✅ حماية إضافية: التأكد من وجود الأسئلة والإجابات لمنع توقف الكود
    if (originalTest && originalTest.questions && completedDiagnostic.answers) {
        originalTest.questions.forEach(question => {
            const studentAnswerObj = completedDiagnostic.answers.find(a => a.questionId === question.id);
            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id === question.linkedGoalId);
                if (objective) {
                    const studentScore = studentAnswerObj ? (studentAnswerObj.score || 0) : 0;
                    const passingScore = question.passingScore || 1;

                    if (studentScore >= passingScore) {
                        if(strengthsList && !strengthsList.innerHTML.includes(objective.shortTermGoal)) {
                            strengthsList.innerHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    } else {
                        if (!needsObjects.find(o => o.id === objective.id)) {
                            needsObjects.push(objective);
                            if(needsList) needsList.innerHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    }
                }
            }
        });
    }

    if (objectivesBody) {
        if(needsObjects.length === 0) {
            objectivesBody.innerHTML = '<tr><td colspan="3" class="text-center">جميع الأهداف محققة (لا توجد نقاط احتياج).</td></tr>';
        } else {
            let objectiveCounter = 1;
            needsObjects.forEach(obj => {
                objectivesBody.innerHTML += `<tr style="background-color: #e9ecef;"><td style="font-weight:bold; text-align:center;">*</td><td colspan="2"><strong>هدف قصير المدى:</strong> ${obj.shortTermGoal}</td></tr>`;

                if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                    obj.instructionalGoals.forEach(iGoal => {
                        const achievementDate = completedLessonsMap[iGoal];
                        
                        let dateDisplay = '<input type="date" class="form-control" style="border:none; background:transparent;" disabled>';
                        if (achievementDate) {
                            // محاولة تنسيق التاريخ بأمان
                            try {
                                const d = new Date(achievementDate);
                                if(!isNaN(d.getTime())) {
                                    dateDisplay = `<span class="text-success font-weight-bold">✔ ${d.toLocaleDateString('ar-SA')}</span>`;
                                }
                            } catch(e) { console.log('خطأ في التاريخ', e); }
                        }

                        objectivesBody.innerHTML += `<tr><td style="text-align:center;">${objectiveCounter++}</td><td>${iGoal}</td><td>${dateDisplay}</td></tr>`;
                    });
                } else {
                    objectivesBody.innerHTML += `<tr><td>-</td><td class="text-muted">لا توجد أهداف تدريسية</td><td></td></tr>`;
                }
            });
        }
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

// ============================================
// 3. قسم الدروس (الأسهم + التحكم + إلغاء البهتان)
// ============================================
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId === currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    
    if (myList.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3></div>`;
        return;
    }

    // ترتيب بالأسهم (orderIndex)
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
            cardClass = 'completed'; // كلاس لمنع الشفافية
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
            </div>
        `;

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

// تحريك الدروس
function moveLesson(lessonId, direction) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId === currentStudentId);
    
    myLessons.sort((a, b) => (a.orderIndex||0) - (b.orderIndex||0));
    myLessons.forEach((l, i) => l.orderIndex = i);

    const currentIndex = myLessons.findIndex(l => l.id === lessonId);
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
        const mainIdx = studentLessons.findIndex(sl => sl.id === l.id);
        if (mainIdx !== -1) studentLessons[mainIdx].orderIndex = l.orderIndex;
    });

    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    loadLessonsTab();
}

// دوال التحكم بالدروس
function openLessonReview(assignmentId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const lesson = studentLessons.find(l => l.id === assignmentId);
    const container = document.getElementById('lessonAnswersBody');
    
    if(!lesson || !lesson.answers || lesson.answers.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">لا توجد إجابات محفوظة لهذا الدرس.</div>';
    } else {
        container.innerHTML = lesson.answers.map((ans, i) => {
            // عرض الإجابة (صورة أو نص)
            let ansDisplay = ans.value || 'لا توجد إجابة';
            if (ans.value && typeof ans.value === 'string' && ans.value.startsWith('data:image')) {
                ansDisplay = `<img src="${ans.value}" style="max-width:100%; border:1px solid #ccc;">`;
            }

            return `
            <div class="review-question-item">
                <div style="margin-bottom:5px;"><strong>س${i+1}:</strong> ${ans.questionText || 'سؤال'}</div>
                <div class="student-answer-box">${ansDisplay}</div>
            </div>
            `;
        }).join('');
    }
    document.getElementById('viewLessonAnswersModal').classList.add('show');
}

function resetLesson(id) {
    if(!confirm('تنبيه: سيتم إعادة فتح الدرس ومسح إجابات الطالب وتاريخ الإنجاز. هل أنت متأكد؟')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].status = 'pending';
        delete studentLessons[idx].completedDate; // مسح التاريخ لتحديث الخطة
        delete studentLessons[idx].answers;
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        if (document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
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

// الإسناد
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
                     studentId: currentStudentId, title: libLesson.title, objective: libLesson.linkedInstructionalGoal, 
                     originalLessonId: libLesson.id, status: 'pending', assignedDate: new Date().toISOString(), orderIndex: nextOrder++
                 });
                 addedCount++;
             }
        }
    });
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    loadLessonsTab();
    alert(`تم التحديث وإضافة ${addedCount} درس.`);
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
        objective: originalLesson.linkedInstructionalGoal || 'درس إضافي', originalLessonId: lessonId, 
        status: 'pending', assignedDate: new Date().toISOString(), orderIndex: maxOrder + 1
    });
    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    closeModal('assignLibraryLessonModal');
    loadLessonsTab();
    alert('تم الإسناد.');
}

// 4. الواجبات والتقدم
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

// Helpers
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function showAssignTestModal() { const allTests = JSON.parse(localStorage.getItem('tests') || '[]'); const select = document.getElementById('testSelect'); select.innerHTML = '<option value="">اختر اختباراً...</option>'; allTests.forEach(t => select.innerHTML += `<option value="${t.id}">${t.title}</option>`); document.getElementById('assignTestModal').classList.add('show'); }
function assignTest() { const testId = parseInt(document.getElementById('testSelect').value); if(!testId) return; const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]'); if(studentTests.some(t => t.studentId === currentStudentId && t.type === 'diagnostic')) { alert('يوجد اختبار معين مسبقاً'); return; } studentTests.push({ id: Date.now(), studentId: currentStudentId, testId: testId, type: 'diagnostic', status: 'pending', assignedDate: new Date().toISOString() }); localStorage.setItem('studentTests', JSON.stringify(studentTests)); closeModal('assignTestModal'); loadDiagnosticTab(); alert('تم التعيين'); }
function showAssignHomeworkModal() { const lib = JSON.parse(localStorage.getItem('assignments') || '[]'); const select = document.getElementById('homeworkSelect'); select.innerHTML = lib.length ? lib.map(a => `<option value="${a.id}">${a.title}</option>`).join('') : '<option>المكتبة فارغة</option>'; document.getElementById('assignHomeworkModal').classList.add('show'); }
function assignHomework() { const select = document.getElementById('homeworkSelect'); if(!select.value) return; const title = select.options[select.selectedIndex].text; const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); list.push({ id: Date.now(), studentId: currentStudentId, title: title, status: 'pending', dueDate: document.getElementById('homeworkDueDate').value, assignedDate: new Date().toISOString() }); localStorage.setItem('studentAssignments', JSON.stringify(list)); closeModal('assignHomeworkModal'); loadAssignmentsTab(); alert('تم الإسناد'); }
function deleteAssignedTest(id) { if(confirm('حذف؟')) { let st = JSON.parse(localStorage.getItem('studentTests') || '[]'); st = st.filter(t => t.id !== id); localStorage.setItem('studentTests', JSON.stringify(st)); loadDiagnosticTab(); } }
function deleteAssignment(id) { if(confirm('حذف؟')) { let list = JSON.parse(localStorage.getItem('studentAssignments') || '[]'); list = list.filter(a => a.id !== id); localStorage.setItem('studentAssignments', JSON.stringify(list)); loadAssignmentsTab(); } }
function returnTestForResubmission() { /* الكود أعلاه */ }

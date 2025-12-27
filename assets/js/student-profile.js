// ============================================
// 📁 المسار: assets/js/student-profile.js
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

// تحميل بيانات الطالب الأساسية
function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id === currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    // تحديث الواجهة
    document.getElementById('sideName').textContent = currentStudent.name;
    document.getElementById('headerStudentName').textContent = currentStudent.name;
    document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
    document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;
    
    // البدء بالقسم الافتراضي
    switchSection('diagnostic');
}

// التنقل بين الأقسام
function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section-${sectionId}`).classList.add('active');

    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// ==========================================
// 1. قسم الاختبار التشخيصي
// ==========================================
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
                    <p>تم التصحيح الآلي.</p>
                    <button class="btn btn-warning mt-2" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح وتدوين ملاحظات</button>
                </div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning" style="background:#ffc107; color:#000;">معاد للتعديل</span>';
            actionContent = `<div class="alert alert-warning mt-3">تم إعادة الاختبار للطالب لتعديل الإجابات بناءً على الملاحظات. بانتظار التسليم الجديد.</div>`;
        } else if (assignedTest.status === 'in-progress') {
            statusBadge = '<span class="badge badge-info">قيد التنفيذ</span>';
            actionContent = `<div class="alert alert-info mt-3">الطالب بدأ بحل الاختبار ولم يسلمه بعد.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">لم يبدأ</span>';
            actionContent = `<div class="alert alert-secondary mt-3">بانتظار دخول الطالب للاختبار.</div>`;
        }

        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                    ${statusBadge}
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                ${actionContent}
            </div>
        `;
    } else {
        document.getElementById('noDiagnosticTest').style.display = 'block';
        document.getElementById('diagnosticTestDetails').style.display = 'none';
    }
}

function showAssignTestModal() {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const select = document.getElementById('testSelect');
    select.innerHTML = '<option value="">اختر اختباراً...</option>';
    allTests.forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.title} (${t.subject})</option>`;
    });
    document.getElementById('assignTestModal').classList.add('show');
}

function assignTest() {
    const testId = parseInt(document.getElementById('testSelect').value);
    if(!testId) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const exists = studentTests.some(t => t.studentId === currentStudentId && t.type === 'diagnostic');
    if(exists) { alert('يوجد اختبار تشخيصي معين مسبقاً'); return; }

    studentTests.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: testId,
        type: 'diagnostic',
        status: 'pending',
        assignedDate: new Date().toISOString()
    });
    
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('assignTestModal');
    loadDiagnosticTab();
    alert('تم تعيين الاختبار بنجاح');
}

// مراجعة وتصحيح الاختبار
function openReviewModal(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    if(!assignment) return;
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id === assignment.testId);
    
    document.getElementById('reviewAssignmentId').value = assignmentId;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';

    originalTest.questions.forEach((q, index) => {
        const studentAnsObj = assignment.answers?.find(a => a.questionId === q.id);
        const studentAns = studentAnsObj ? studentAnsObj.answer : 'لم يجب';
        
        const currentScore = studentAnsObj?.score !== undefined ? studentAnsObj.score : (q.passingScore || 5);
        const teacherNote = studentAnsObj?.teacherNote || '';

        let displayAnswer = studentAns;
        if(q.type.includes('multiple-choice') && q.choices) displayAnswer = q.choices[studentAns] || studentAns;
        if(studentAns && String(studentAns).startsWith('data:image')) displayAnswer = `<br><img src="${studentAns}" style="max-height:100px; border:1px solid #ccc;">`;

        const item = document.createElement('div');
        item.className = 'review-question-item';
        item.innerHTML = `
            <div class="review-q-header">
                <strong>س${index+1}: ${q.text}</strong>
                <div>
                    <label>الدرجة:</label>
                    <input type="number" class="score-input" name="score_${q.id}" value="${currentScore}" max="${q.passingScore || 10}">
                    <span class="text-muted"> / ${q.passingScore || 5}</span>
                </div>
            </div>
            <div class="student-answer-box">
                <strong>إجابة الطالب:</strong> ${displayAnswer}
            </div>
            <div class="teacher-feedback-box">
                <label>ملاحظات المعلم:</label>
                <textarea name="note_${q.id}" placeholder="اكتب تغذية راجعة للطالب هنا...">${teacherNote}</textarea>
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById('reviewTestModal').classList.add('show');
}

function saveTestReview() {
    const assignmentId = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === assignmentId);
    if(index === -1) return;

    let totalScore = 0;
    let maxScore = 0;
    
    const container = document.getElementById('reviewQuestionsContainer');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id === studentTests[index].testId);

    originalTest.questions.forEach(q => {
        const scoreInput = container.querySelector(`input[name="score_${q.id}"]`);
        const noteInput = container.querySelector(`textarea[name="note_${q.id}"]`);
        
        const newScore = parseInt(scoreInput.value) || 0;
        const newNote = noteInput.value;

        const ansIndex = studentTests[index].answers.findIndex(a => a.questionId === q.id);
        if(ansIndex !== -1) {
            studentTests[index].answers[ansIndex].score = newScore;
            studentTests[index].answers[ansIndex].teacherNote = newNote;
        } else {
            studentTests[index].answers.push({
                questionId: q.id,
                answer: null,
                score: newScore,
                teacherNote: newNote
            });
        }
        
        totalScore += newScore;
        maxScore += (q.passingScore || 5);
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    studentTests[index].score = percentage;
    
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    
    alert('تم حفظ الملاحظات والدرجات');
    closeModal('reviewTestModal');
    loadDiagnosticTab();
}

// ==========================================
// 2. قسم الخطة التربوية (IEP) - الذكية (محدثة)
// ==========================================
function loadIEPTab() {
    const iepContent = document.getElementById('iepContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');

    // البحث عن آخر اختبار تشخيصي مكتمل
    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    if (!completedDiagnostic) {
        document.querySelector('.iep-word-model').style.display = 'none';
        iepContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>الخطة غير جاهزة</h3>
                <p>يجب على الطالب إكمال اختبار تشخيصي وتصحيحه أولاً ليتمكن النظام من تحليل نقاط القوة والاحتياج.</p>
            </div>`;
        return;
    }

    document.querySelector('.iep-word-model').style.display = 'block';
    if(iepContent.querySelector('.empty-state')) iepContent.innerHTML = '';

    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);

    // تعبئة البيانات الأساسية
    document.getElementById('iep-student-name').textContent = currentStudent.name;
    document.getElementById('iep-subject').textContent = originalTest ? originalTest.subject : 'غير محدد';
    document.getElementById('iep-grade').textContent = currentStudent.grade;
    document.getElementById('iep-date').textContent = new Date().toLocaleDateString('ar-SA');

    fillScheduleTable();

    // 🌟 الجديد: جلب قائمة الأهداف المحققة (من الدروس المكتملة)
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const completedLessonsMap = {}; // مفتاح: نص الهدف، قيمة: تاريخ التحقق
    
    studentLessons.forEach(l => {
        if (l.studentId === currentStudentId && l.status === 'completed') {
            // الهدف التدريسي هنا هو (l.objective) الذي تم ربطه بالدرس
            completedLessonsMap[l.objective] = l.completedDate || new Date().toLocaleDateString('ar-SA');
        }
    });

    const strengthsList = document.getElementById('iep-strengths-list');
    const needsList = document.getElementById('iep-needs-list');
    const objectivesBody = document.getElementById('iep-objectives-body');

    strengthsList.innerHTML = '';
    needsList.innerHTML = '';
    objectivesBody.innerHTML = '';

    let identifiedStrengths = new Set();
    let identifiedNeeds = new Set();
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
                        identifiedStrengths.add(objective.shortTermGoal);
                    } else {
                        if (!identifiedNeeds.has(objective.id)) {
                            identifiedNeeds.add(objective.id);
                            needsObjects.push(objective);
                        }
                    }
                }
            }
        });
    }

    // عرض نقاط القوة
    if (identifiedStrengths.size > 0) {
        identifiedStrengths.forEach(goalText => {
            strengthsList.innerHTML += `<li>${goalText}</li>`;
        });
    } else {
        strengthsList.innerHTML = '<li>لا توجد نقاط قوة واضحة في المهارات المختبرة.</li>';
    }

    // عرض نقاط الاحتياج وجدول الأهداف (مع التحقق التلقائي)
    let objectiveCounter = 1;
    if (needsObjects.length > 0) {
        needsObjects.forEach(obj => {
            needsList.innerHTML += `<li>${obj.shortTermGoal}</li>`;

            const headerRow = `
                <tr style="background-color: #e9ecef;">
                    <td style="font-weight:bold; text-align:center;">*</td>
                    <td colspan="2"><strong>هدف قصير المدى:</strong> ${obj.shortTermGoal}</td>
                </tr>
            `;
            objectivesBody.insertAdjacentHTML('beforeend', headerRow);

            if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                obj.instructionalGoals.forEach(iGoal => {
                    // 🔍 التحقق: هل هذا الهدف تم إنجازه؟
                    const achievementDate = completedLessonsMap[iGoal]; 
                    const dateCellContent = achievementDate 
                        ? `<span class="text-success font-weight-bold">✔ ${achievementDate}</span>` 
                        : `<input type="date" class="form-control" style="border:none; background:transparent;">`;

                    const row = `
                        <tr>
                            <td style="text-align:center;">${objectiveCounter++}</td>
                            <td>${iGoal}</td>
                            <td>${dateCellContent}</td>
                        </tr>
                    `;
                    objectivesBody.insertAdjacentHTML('beforeend', row);
                });
            } else {
                objectivesBody.insertAdjacentHTML('beforeend', `<tr><td>-</td><td class="text-muted">لا توجد أهداف تدريسية مسجلة</td><td></td></tr>`);
            }
        });
    } else {
        needsList.innerHTML = '<li>لم يتم رصد نقاط احتياج.</li>';
        objectivesBody.innerHTML = '<tr><td colspan="3" class="text-center">لا توجد أهداف تدريسية مطلوبة.</td></tr>';
    }
}

function fillScheduleTable() {
    const daysMap = { 'sunday': 'day-sunday', 'monday': 'day-monday', 'tuesday': 'day-tuesday', 'wednesday': 'day-wednesday', 'thursday': 'day-thursday' };
    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]'); 
    
    Object.values(daysMap).forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = '';
    });

    schedule.forEach(session => {
        if (session.students && session.students.includes(currentStudentId)) {
            const cellId = daysMap[session.day];
            if (cellId && document.getElementById(cellId)) {
                document.getElementById(cellId).innerHTML = `
                    <div style="background:#28a745; color:white; padding:5px; border-radius:4px; text-align:center;">
                        حصة ${session.period || 1}
                    </div>
                `;
            }
        }
    });
}

// ==========================================
// 3. قسم الدروس (مع التحديث التلقائي)
// ==========================================
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myList = studentLessons.filter(l => l.studentId === currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    
    if (myList.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h3>لا توجد دروس حالياً</h3>
                <p>يمكنك توليد الدروس بناءً على الاحتياج من زر "تحديث".</p>
            </div>`;
        return;
    }

    container.innerHTML = myList.map(l => `
        <div class="content-card">
            <div class="content-header">
                <h4>${l.title}</h4>
                <span class="status-badge ${l.status}">${getStatusText(l.status)}</span>
            </div>
            <div class="content-body">
                <p><strong>الهدف:</strong> ${l.objective}</p>
                ${l.status === 'completed' && l.completedDate ? `<small class="text-success">تاريخ الإنجاز: ${l.completedDate}</small>` : ''}
            </div>
            <div class="content-actions">
                ${l.status !== 'completed' ? `<button class="btn btn-sm btn-success" onclick="completeLesson(${l.id})">إكمال الدرس</button>` : '<button class="btn btn-sm btn-secondary" disabled>تم الإنجاز</button>'}
            </div>
        </div>
    `).join('');
}

// دالة لتوليد الدروس بناءً على نقاط الاحتياج في الخطة
function regenerateLessons() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allLessonsLib = JSON.parse(localStorage.getItem('lessons') || '[]');

    // 1. العثور على الاحتياجات
    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    if (!completedDiagnostic) { alert('يجب إجراء اختبار تشخيصي أولاً.'); return; }

    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);
    let neededObjectives = [];

    originalTest.questions.forEach(question => {
        const studentAnswerObj = completedDiagnostic.answers.find(a => a.questionId === question.id);
        if (question.linkedGoalId) {
            const objective = allObjectives.find(o => o.id === question.linkedGoalId);
            const studentScore = studentAnswerObj ? (studentAnswerObj.score || 0) : 0;
            const passingScore = question.passingScore || 1;
            if (studentScore < passingScore && objective) {
                neededObjectives.push(objective); // هذا هدف قصير مدى (احتياج)
            }
        }
    });

    // 2. إسناد الدروس المرتبطة بهذه الاحتياجات
    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let addedCount = 0;

    neededObjectives.forEach(obj => { // لكل هدف قصير مدى (احتياج)
        if(obj.instructionalGoals && obj.instructionalGoals.length > 0) {
            obj.instructionalGoals.forEach(iGoal => { // لكل هدف تدريسي فرعي
                // ابحث في مكتبة الدروس عن درس مرتبط بهذا الهدف التدريسي
                const matchingLesson = allLessonsLib.find(libLesson => libLesson.linkedInstructionalGoal === iGoal);
                
                if (matchingLesson) {
                    // هل الدرس مضاف مسبقاً لهذا الطالب؟
                    const alreadyExists = studentLessons.some(sl => sl.studentId === currentStudentId && sl.objective === iGoal);
                    
                    if (!alreadyExists) {
                        studentLessons.push({
                            id: Date.now() + Math.floor(Math.random()*10000),
                            studentId: currentStudentId,
                            title: matchingLesson.title,
                            objective: iGoal, // نحفظ الهدف التدريسي هنا للربط لاحقاً
                            originalLessonId: matchingLesson.id,
                            status: 'pending',
                            assignedDate: new Date().toISOString()
                        });
                        addedCount++;
                    }
                }
            });
        }
    });

    localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
    loadLessonsTab(); // إعادة تحميل القائمة
    if(addedCount > 0) alert(`تم إضافة ${addedCount} درس جديد بناءً على الخطة.`);
    else alert('لم يتم العثور على دروس جديدة في المكتبة تطابق نقاط الاحتياج.');
}

// 🌟 تعديل دالة إكمال الدرس لإضافة التاريخ
function completeLesson(id) {
    if(!confirm('هل أنت متأكد من أن الطالب أتقن مهارات هذا الدرس؟ سيتم تحديث الخطة تلقائياً.')) return;

    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    
    if(idx !== -1) {
        studentLessons[idx].status = 'completed';
        // إضافة تاريخ الإنجاز بالتقويم الهجري/الميلادي (حسب تفضيل المتصفح)
        studentLessons[idx].completedDate = new Date().toLocaleDateString('ar-SA');
        
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        
        loadLessonsTab(); // تحديث واجهة الدروس
        alert('تم إكمال الدرس وتحديث تاريخ التحقق في الخطة التربوية.');
    }
}

// ==========================================
// 4. باقي الأقسام (الواجبات والتقدم)
// ==========================================
function loadAssignmentsTab() {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]').filter(a => a.studentId === currentStudentId);
    const container = document.getElementById('studentAssignmentsGrid');
    
    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>لا توجد واجبات مسندة.</h3></div>';
        return;
    }

    container.innerHTML = list.map(a => `
        <div class="content-card">
            <h4>${a.title}</h4>
            <div class="content-meta">
                <span>التسليم: ${a.dueDate || 'مفتوح'}</span>
                <span class="status-badge ${a.status}">${getStatusText(a.status)}</span>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${a.id})">حذف</button>
        </div>
    `).join('');
}

function showAssignHomeworkModal() {
    const assignmentsLib = JSON.parse(localStorage.getItem('assignments') || '[]');
    const select = document.getElementById('homeworkSelect');
    
    if(assignmentsLib.length === 0) {
         select.innerHTML = '<option value="">لا توجد واجبات في المكتبة</option>';
    } else {
        select.innerHTML = assignmentsLib.map(a => `<option value="${a.id}">${a.title}</option>`).join('');
    }
    
    document.getElementById('assignHomeworkModal').classList.add('show');
}

function assignHomework() {
    const select = document.getElementById('homeworkSelect');
    if (!select.value) return;
    
    const title = select.options[select.selectedIndex].text;
    const dueDate = document.getElementById('homeworkDueDate').value;
    
    const newAssign = {
        id: Date.now(),
        studentId: currentStudentId,
        title: title,
        status: 'pending',
        dueDate: dueDate,
        assignedDate: new Date().toISOString()
    };
    
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    list.push(newAssign);
    localStorage.setItem('studentAssignments', JSON.stringify(list));
    
    closeModal('assignHomeworkModal');
    loadAssignmentsTab();
    alert('تم إسناد الواجب');
}

function deleteAssignment(id) {
    if(!confirm('حذف الواجب؟')) return;
    let list = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    list = list.filter(a => a.id !== id);
    localStorage.setItem('studentAssignments', JSON.stringify(list));
    loadAssignmentsTab();
}

function loadProgressTab() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]').filter(l => l.studentId === currentStudentId);
    const tbody = document.getElementById('progressTableBody');
    
    if(lessons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = lessons.map(l => `
        <tr>
            <td>${l.objective}</td>
            <td><span class="badge ${l.status}">${getStatusText(l.status)}</span></td>
            <td>${l.completedDate || '-'}</td>
        </tr>
    `).join('');
}

// دوال مساعدة
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function returnTestForResubmission() { /* الكود موجود أعلاه في سياق المراجعة */ }
function getStatusText(status) {
    const map = {'pending': 'قادم', 'in-progress': 'جاري', 'completed': 'مكتمل', 'returned': 'معاد'};
    return map[status] || status;
}

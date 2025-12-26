// ============================================
// 📁 المسار: assets/js/student-profile.js (كاملة)
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
// 1. قسم الاختبار التشخيصي (مع المراجعة)
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
            actionContent = `<div class="alert alert-warning mt-3">تم إعادة الاختبار للطالب لتعديل الإجابات.</div>`;
        } else if (assignedTest.status === 'in-progress') {
            statusBadge = '<span class="badge badge-info">قيد التنفيذ</span>';
            actionContent = `<div class="alert alert-info mt-3">الطالب بدأ بحل الاختبار.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">لم يبدأ</span>';
            actionContent = `<div class="alert alert-secondary mt-3">بانتظار دخول الطالب.</div>`;
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
    if(studentTests.some(t => t.studentId === currentStudentId && t.type === 'diagnostic')) {
        alert('يوجد اختبار تشخيصي معين مسبقاً'); return;
    }

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

        const item = document.createElement('div');
        item.className = 'review-question-item';
        item.innerHTML = `
            <div class="review-q-header">
                <strong>س${index+1}: ${q.text}</strong>
                <div>
                    <label>الدرجة:</label>
                    <input type="number" class="score-input" name="score_${q.id}" value="${currentScore}" max="${q.passingScore || 10}">
                </div>
            </div>
            <div class="student-answer-box">
                <strong>إجابة الطالب:</strong> ${displayAnswer}
            </div>
            <div class="teacher-feedback-box">
                <textarea name="note_${q.id}" placeholder="ملاحظات المعلم...">${teacherNote}</textarea>
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

    let totalScore = 0, maxScore = 0;
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
            studentTests[index].answers.push({ questionId: q.id, answer: null, score: newScore, teacherNote: newNote });
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

function returnTestForResubmission() {
    if(!confirm('إعادة الاختبار للطالب؟')) return;
    const assignmentId = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === assignmentId);
    
    if(index !== -1) {
        studentTests[index].status = 'returned';
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        alert('تمت الإعادة بنجاح');
        closeModal('reviewTestModal');
        loadDiagnosticTab();
    }
}

// ==========================================
// 2. قسم الخطة التربوية (IEP) - النسخة الذكية والمرنة
// ==========================================
function loadIEPTab() {
    // 1. التحقق من وجود نسخة محفوظة يدوياً
    const savedIEPKey = `iep_data_${currentStudentId}`;
    const savedData = localStorage.getItem(savedIEPKey);

    if (savedData) {
        renderIEPFromData(JSON.parse(savedData));
    } else {
        generateIEPFromTest(false);
    }
}

// التوليد الآلي من الاختبار
function generateIEPFromTest(forceRegenerate = false) {
    if(forceRegenerate && !confirm('هل أنت متأكد؟ سيتم حذف أي تعديلات يدوية قمت بها واستعادة البيانات من نتائج الاختبار.')) return;

    if(forceRegenerate) {
        localStorage.removeItem(`iep_data_${currentStudentId}`);
    }

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');

    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    const iepContent = document.getElementById('iepContent');
    const modelContainer = document.querySelector('.iep-word-model');

    if (!completedDiagnostic) {
        modelContainer.style.display = 'none';
        iepContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>الخطة غير جاهزة</h3>
                <p>يجب على الطالب إكمال اختبار تشخيصي وتصحيحه أولاً.</p>
            </div>`;
        return;
    }

    // إظهار النموذج
    modelContainer.style.display = 'block';
    iepContent.innerHTML = '';
    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);

    // تحليل البيانات
    let strengths = [];
    let needs = []; 

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(question => {
            const studentAnswerObj = completedDiagnostic.answers.find(a => a.questionId === question.id);
            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id === question.linkedGoalId);
                if (objective) {
                    const studentScore = studentAnswerObj ? (studentAnswerObj.score || 0) : 0;
                    const passingScore = question.passingScore || 1;

                    if (studentScore >= passingScore) {
                        if(!strengths.includes(objective.shortTermGoal)) strengths.push(objective.shortTermGoal);
                    } else {
                        if (!needs.some(n => n.id === objective.id)) {
                            needs.push({
                                id: objective.id,
                                text: objective.shortTermGoal,
                                instructionalGoals: objective.instructionalGoals || []
                            });
                        }
                    }
                }
            }
        });
    }

    if (strengths.length === 0) strengths.push('لا توجد نقاط قوة واضحة');
    if (needs.length === 0) needs.push({ id:0, text: 'لا توجد نقاط احتياج', instructionalGoals: [] });

    // تجميع البيانات
    const iepData = {
        studentName: currentStudent.name,
        subject: originalTest ? originalTest.subject : 'غير محدد',
        grade: currentStudent.grade,
        date: new Date().toLocaleDateString('ar-SA'),
        strengths: strengths,
        needs: needs
    };

    renderIEPFromData(iepData);
}

// دالة الرسم (Rendering Function)
function renderIEPFromData(data) {
    document.querySelector('.iep-word-model').style.display = 'block';
    document.getElementById('iepContent').innerHTML = '';

    // 1. البيانات الأساسية
    document.getElementById('iep-student-name').textContent = data.studentName;
    document.getElementById('iep-subject').textContent = data.subject;
    document.getElementById('iep-grade').textContent = data.grade;
    document.getElementById('iep-date').textContent = data.date;

    // 2. الجدول الدراسي (دائماً من المصدر لضمان التحديث)
    fillScheduleTable();

    // 3. نقاط القوة
    const sList = document.getElementById('iep-strengths-list');
    sList.innerHTML = '';
    data.strengths.forEach(txt => addListItem('iep-strengths-list', txt));

    // 4. نقاط الاحتياج
    const nList = document.getElementById('iep-needs-list');
    nList.innerHTML = '';
    
    // التعامل مع البيانات القديمة أو الجديدة
    const needsArray = data.needs || [];
    needsArray.forEach(n => {
        const text = typeof n === 'object' ? n.text : n;
        addListItem('iep-needs-list', text);
    });

    // 5. جدول الأهداف
    const tBody = document.getElementById('iep-objectives-body');
    tBody.innerHTML = '';
    
    // إذا كانت البيانات محفوظة يدوياً (مصفوفة)
    if (data.objectivesList) {
        data.objectivesList.forEach(item => {
            if(item.type === 'header') addObjectiveHeaderRow(item.text);
            else addObjectiveRow(item.index, item.text, item.date);
        });
    }
    // إذا كانت من التوليد الآلي (Objects)
    else if (needsArray.length > 0 && typeof needsArray[0] === 'object') {
        let counter = 1;
        needsArray.forEach(needObj => {
            addObjectiveHeaderRow(needObj.text);
            if (needObj.instructionalGoals && needObj.instructionalGoals.length > 0) {
                needObj.instructionalGoals.forEach(g => addObjectiveRow(counter++, g));
            } else {
                addObjectiveRow(counter++, '');
            }
        });
    }
}

// أدوات الجدول والمرونة (Helpers)

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
                // وضع رقم الحصة داخل دائرة خضراء
                document.getElementById(cellId).innerHTML += `
                    <span class="period-badge" title="حصة ${session.period}">${session.period}</span>
                `;
            }
        }
    });
}

function addListItem(listId, text = '') {
    const list = document.getElementById(listId);
    const li = document.createElement('li');
    li.className = 'iep-list-item';
    li.innerHTML = `
        <span style="font-size:1.2rem; margin-left:5px;">•</span>
        <input type="text" class="iep-input" value="${text}" placeholder="اكتب هنا...">
        <button class="btn-action-small text-danger" onclick="this.parentElement.remove()">×</button>
    `;
    list.appendChild(li);
}

function addObjectiveHeaderRow(text = '') {
    const tbody = document.getElementById('iep-objectives-body');
    const tr = document.createElement('tr');
    tr.className = 'obj-header-row';
    tr.innerHTML = `
        <td style="font-weight:bold; text-align:center;">*</td>
        <td colspan="2">
            <strong>هدف قصير المدى:</strong>
            <input type="text" class="iep-input" value="${text}" style="width:70%; font-weight:bold;">
        </td>
        <td><button class="btn-action-small text-danger" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
}

function addObjectiveRow(index, text = '', date = '') {
    const tbody = document.getElementById('iep-objectives-body');
    const tr = document.createElement('tr');
    tr.className = 'obj-data-row';
    tr.innerHTML = `
        <td style="text-align:center;"><input type="text" class="iep-input" value="${index}" style="text-align:center; width:30px;"></td>
        <td><input type="text" class="iep-input" value="${text}" placeholder="هدف تدريسي..."></td>
        <td><input type="date" class="form-control" value="${date}" style="border:none; background:transparent; font-size:0.9rem;"></td>
        <td><button class="btn-action-small text-danger" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
}

function addNewObjectiveBlock() {
    addObjectiveHeaderRow('هدف جديد...');
    addObjectiveRow(1, '');
}

function saveIEPManualChanges() {
    // تجميع البيانات من المدخلات للحفظ
    const strengths = [];
    document.querySelectorAll('#iep-strengths-list input').forEach(i => strengths.push(i.value));

    const needsTexts = [];
    document.querySelectorAll('#iep-needs-list input').forEach(i => needsTexts.push(i.value));

    const objectivesList = [];
    const rows = document.getElementById('iep-objectives-body').children;
    for (let row of rows) {
        if (row.classList.contains('obj-header-row')) {
            objectivesList.push({
                type: 'header',
                text: row.querySelector('input').value
            });
        } else if (row.classList.contains('obj-data-row')) {
            const inputs = row.querySelectorAll('input');
            objectivesList.push({
                type: 'row',
                index: inputs[0].value,
                text: inputs[1].value,
                date: inputs[2].value
            });
        }
    }

    const dataToSave = {
        studentName: document.getElementById('iep-student-name').textContent,
        subject: document.getElementById('iep-subject').textContent,
        grade: document.getElementById('iep-grade').textContent,
        date: document.getElementById('iep-date').textContent,
        strengths: strengths,
        needs: needsTexts, 
        objectivesList: objectivesList
    };

    localStorage.setItem(`iep_data_${currentStudentId}`, JSON.stringify(dataToSave));
    alert('تم حفظ الخطة بنجاح! يمكنك الآن الطباعة أو العودة لاحقاً.');
}

// ==========================================
// 3. قسم الدروس
// ==========================================
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const myList = studentLessons.filter(l => l.studentId === currentStudentId);
    const container = document.getElementById('studentLessonsGrid');
    
    if (myList.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h3>لا توجد دروس حالياً</h3>
                <p>سيتم توليد الدروس بناءً على الخطة التربوية.</p>
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
            </div>
            <div class="content-actions">
                ${l.status !== 'completed' ? `<button class="btn btn-sm btn-success" onclick="completeLesson(${l.id})">إكمال</button>` : ''}
            </div>
        </div>
    `).join('');
}

function regenerateLessons() {
    alert('جاري تحديث قائمة الدروس بناءً على نقاط الاحتياج...');
    loadLessonsTab();
}

function completeLesson(id) {
    let studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const idx = studentLessons.findIndex(l => l.id === id);
    if(idx !== -1) {
        studentLessons[idx].status = 'completed';
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
    }
}

// ==========================================
// 4. قسم الواجبات
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
         select.innerHTML = '<option value="1">واجب تجريبي: كتابة الحروف</option>';
    } else {
        select.innerHTML = assignmentsLib.map(a => `<option value="${a.id}">${a.title}</option>`).join('');
    }
    document.getElementById('assignHomeworkModal').classList.add('show');
}

function assignHomework() {
    const title = document.getElementById('homeworkSelect').options[document.getElementById('homeworkSelect').selectedIndex].text;
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

// ==========================================
// 5. قسم التقدم
// ==========================================
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
            <td>${l.status === 'completed' ? 'تم' : '-'}</td>
        </tr>
    `).join('');
}

// دوال مساعدة عامة
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function dayMap(dayAr) {
    const map = {'الأحد':'sunday', 'الاثنين':'monday', 'الثلاثاء':'tuesday', 'الأربعاء':'wednesday', 'الخميس':'thursday'};
    return map[dayAr];
}
function getStatusText(status) {
    const map = {'pending': 'قادم', 'in-progress': 'جاري', 'completed': 'مكتمل', 'returned': 'معاد'};
    return map[status] || status;
}

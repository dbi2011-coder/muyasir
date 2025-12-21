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
    // تحديث القائمة الجانبية
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');

    // إظهار القسم المطلوب
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section-${sectionId}`).classList.add('active');

    // تشغيل دالة التحميل الخاصة بالقسم
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
    // نبحث عن أحدث اختبار تشخيصي
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

// ==========================================
// 2. منطق المراجعة والتصحيح (الجديد)
// ==========================================
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
        
        // الدرجة الحالية (إما المخزنة أو الافتراضية)
        const currentScore = studentAnsObj?.score !== undefined ? studentAnsObj.score : (q.passingScore || 5);
        const teacherNote = studentAnsObj?.teacherNote || '';

        let displayAnswer = studentAns;
        if(q.type.includes('multiple-choice') && q.choices) displayAnswer = q.choices[studentAns] || studentAns;
        if(studentAns && String(studentAns).startsWith('data:image')) displayAnswer = `<br><img src="${studentAns}" style="max-height:100px; border:1px solid #ccc;">`;
        if(q.type.includes('reading')) displayAnswer = `(نص مسجل): ${studentAns}`;

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

        // تحديث أو إضافة الإجابة
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

function returnTestForResubmission() {
    if(!confirm('إعادة الاختبار للطالب للتعديل؟')) return;
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
// 3. قسم الخطة التربوية (IEP)
// ==========================================
function loadIEPTab() {
    const iepContent = document.getElementById('iepContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic' && t.status === 'completed');

    // إذا لم يكمل الاختبار، نعرض رسالة
    if (!completedDiagnostic) {
        iepContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>الخطة غير جاهزة</h3>
                <p>يجب أن يكمل الطالب الاختبار التشخيصي ويتم تصحيحه أولاً لتوليد الخطة.</p>
            </div>`;
        return;
    }

    // توليد بيانات وهمية للخطة (يمكن استبدالها ببيانات حقيقية مستقبلاً)
    const teacherName = JSON.parse(sessionStorage.getItem('currentUser'))?.user?.name || 'المعلم';
    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    // حساب جدول الطالب بناءً على جدول المعلم
    const studentSchedule = days.map(day => {
        const hasSession = schedule.some(s => s.students && s.students.includes(currentStudentId) && s.day === dayMap(day)); 
        return { day, hasSession };
    });

    const strengths = ["قراءة الحروف", "نسخ الكلمات"]; 
    const needs = ["التمييز بين المدود", "الإملاء المنظور"]; 
    
    const html = `
    <div class="iep-page">
        <div class="iep-header"><h2>الخطة التربوية الفردية</h2></div>
        <table class="iep-table">
            <tr><th>الاسم</th><td>${currentStudent.name}</td><th>الصف</th><td>${currentStudent.grade}</td></tr>
        </table>
        
        <h4>جدول الحصص</h4>
        <table class="iep-table">
            <tr>${studentSchedule.map(s => `<th class="${s.hasSession ? 'shaded-day' : ''}">${s.day}</th>`).join('')}</tr>
            <tr>${studentSchedule.map(s => `<td class="${s.hasSession ? 'shaded-day' : ''}">${s.hasSession ? '✓' : ''}</td>`).join('')}</tr>
        </table>
        
        <table class="iep-table" style="margin-top:20px;">
            <tr><th width="50%">نقاط القوة</th><th>نقاط الاحتياج</th></tr>
            <tr>
                <td><ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul></td>
                <td><ul>${needs.map(n => `<li>${n}</li>`).join('')}</ul></td>
            </tr>
        </table>
    </div>`;

    iepContent.innerHTML = html;
}

// ==========================================
// 4. قسم الدروس
// ==========================================
function loadLessonsTab() {
    // نجلب الدروس المسندة للطالب (من جدول studentLessons)
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
    // هنا يمكن إضافة منطق لإضافة دروس جديدة
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
// 5. قسم الواجبات
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
    // تعبئة القوائم
    const assignmentsLib = JSON.parse(localStorage.getItem('assignments') || '[]'); // نفترض وجود مكتبة واجبات
    const select = document.getElementById('homeworkSelect');
    
    // إضافة خيار افتراضي للتجربة
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
// 6. قسم التقدم
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
// دالة التعبئة التلقائية الذكية (قابلة للتعديل)
function autoFillIEPForm(studentId) {
    console.log("جاري التعبئة التلقائية للطالب:", studentId);

    // 1. جلب البيانات
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    // جمع كل الاختبارات للبحث عن الأسئلة
    let allTests = [];
    Object.keys(localStorage).forEach(k => {
        try {
            let d = JSON.parse(localStorage.getItem(k));
            if(Array.isArray(d)) allTests = [...allTests, ...d];
        } catch(e){}
    });

    // 2. البحث عن آخر اختبار تشخيصي
    const result = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!result) {
        console.log("لا توجد نتائج تشخيصية لهذا الطالب.");
        return; 
    }

    let strengthText = [];
    let needsText = [];
    let goalsList = [];

    // 3. تحليل الإجابات
    const testRef = allTests.find(t => t.id == result.testId);
    if (testRef) {
        const questions = testRef.questions || testRef.items || [];
        result.answers.forEach(ans => {
            const q = questions.find(x => x.id == ans.questionId);
            if (q && q.linkedGoalId) {
                const obj = objectives.find(o => o.id == q.linkedGoalId);
                if (obj) {
                    if (ans.isCorrect) {
                        // نقطة قوة
                        if(!strengthText.includes(obj.shortTermGoal)) strengthText.push(obj.shortTermGoal);
                    } else {
                        // نقطة احتياج
                        if(!needsText.includes(obj.shortTermGoal)) {
                            needsText.push(obj.shortTermGoal);
                            // جلب الأهداف التدريسية
                            const subGoals = (obj.instructionalGoals && obj.instructionalGoals.length > 0) 
                                ? obj.instructionalGoals : [obj.shortTermGoal];
                            goalsList.push({ short: obj.shortTermGoal, sub: subGoals });
                        }
                    }
                }
            }
        });
    }

    // ============================================================
    // 4. تعبئة الحقول (هنا السحر: نستخدم .value لتبقى قابلة للتعديل)
    // ============================================================

    // أ) نقاط القوة
    const sEl = document.getElementById('iep-strengths');
    if (sEl) sEl.value = strengthText.join('\n'); // يضع النص ويسمح لك بتغييره

    // ب) نقاط الاحتياج
    const nEl = document.getElementById('iep-needs');
    if (nEl) nEl.value = needsText.join('\n'); // يضع النص ويسمح لك بتغييره

    // ج) جدول الأهداف (تعبئة Inputs)
    const tableBody = document.getElementById('iep-goals-body');
    if (tableBody) {
        tableBody.innerHTML = ''; // تنظيف الجدول
        
        goalsList.forEach(goal => {
            goal.sub.forEach(subGoal => {
                const row = `
                    <tr>
                        <td><input type="text" class="form-control" value="${goal.short}"></td>
                        
                        <td><input type="text" class="form-control" value="${subGoal}"></td>
                        
                        <td><input type="date" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        });
    }
}

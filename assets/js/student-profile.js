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

// ... (دوال التحميل والتنقل switchSection كما هي في النسخ السابقة) ...
function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id === currentStudentId);
    if (!currentStudent) return;
    document.getElementById('sideName').textContent = currentStudent.name;
    document.getElementById('headerStudentName').textContent = currentStudent.name;
    document.getElementById('sideGrade').textContent = currentStudent.grade;
    document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    switchSection('diagnostic');
}

function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`link-${sectionId}`)?.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');

    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// --- 1. قسم الاختبار التشخيصي (محدث لإضافة زر المراجعة) ---
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
        let actionBtn = '';

        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            // زر المراجعة الجديد
            actionBtn = `<button class="btn btn-warning mt-2" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح وتدوين ملاحظات</button>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
            actionBtn = `<p class="text-muted mt-2">بانتظار الطالب لتعديل إجاباته...</p>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">قيد الانتظار</span>';
        }

        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                    ${statusBadge}
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                ${assignedTest.score !== undefined ? `<p><strong>الدرجة الحالية: ${assignedTest.score}%</strong></p>` : ''}
                ${actionBtn}
            </div>
        `;
    }
}

// ==========================================
// [جديد] منطق المراجعة والتصحيح للمعلم
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
        // البحث عن إجابة الطالب
        const studentAnsObj = assignment.answers?.find(a => a.questionId === q.id);
        const studentAns = studentAnsObj ? studentAnsObj.answer : 'لم يجب';
        
        // البحث عن الدرجة الممنوحة والملاحظة (إن وجدت سابقاً)
        const currentScore = studentAnsObj?.score !== undefined ? studentAnsObj.score : (q.passingScore || 5); // افتراضيا الدرجة كاملة إذا لم تعدل
        const teacherNote = studentAnsObj?.teacherNote || '';

        // عرض الإجابة بشكل مناسب حسب النوع
        let displayAnswer = studentAns;
        if(q.type.includes('multiple-choice') && q.choices) displayAnswer = q.choices[studentAns] || studentAns;
        if(q.type.includes('spelling') || q.type === 'missing-letter') displayAnswer = `<br><img src="${studentAns}" style="max-height:100px; border:1px solid #ccc;">`;
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
    
    // تحديث الإجابات بالملاحظات والدرجات الجديدة
    const container = document.getElementById('reviewQuestionsContainer');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id === studentTests[index].testId);

    // إنشاء خريطة للإجابات لتحديثها
    originalTest.questions.forEach(q => {
        const scoreInput = container.querySelector(`input[name="score_${q.id}"]`);
        const noteInput = container.querySelector(`textarea[name="note_${q.id}"]`);
        
        const newScore = parseInt(scoreInput.value) || 0;
        const newNote = noteInput.value;

        // تحديث كائن الإجابة داخل مصفوفة إجابات الطالب
        const ansIndex = studentTests[index].answers.findIndex(a => a.questionId === q.id);
        if(ansIndex !== -1) {
            studentTests[index].answers[ansIndex].score = newScore;
            studentTests[index].answers[ansIndex].teacherNote = newNote;
        } else {
            // إذا لم تكن موجودة (مثلا سؤال لم يحله)، نضيفها
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

    // إعادة حساب النسبة المئوية
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    studentTests[index].score = percentage;
    
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    
    alert('تم حفظ الملاحظات والدرجات بنجاح');
    closeModal('reviewTestModal');
    loadDiagnosticTab(); // تحديث الواجهة
}

function returnTestForResubmission() {
    if(!confirm('هل أنت متأكد من إعادة الاختبار للطالب؟ سيتمكن من تعديل إجاباته.')) return;
    
    const assignmentId = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === assignmentId);
    
    if(index !== -1) {
        studentTests[index].status = 'returned'; // حالة جديدة تعني "معاد للتعديل"
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        alert('تم إعادة الاختبار للطالب. يمكنه الآن الدخول وتعديل الإجابات.');
        closeModal('reviewTestModal');
        loadDiagnosticTab();
    }
}

// ... (باقي دوال الخطة والدروس والواجبات كما هي) ...
function loadIEPTab() { /* ... */ }
function loadLessonsTab() { /* ... */ }
function regenerateLessons() { /* ... */ }
function loadAssignmentsTab() { /* ... */ }
function showAssignHomeworkModal() { /* ... */ }
function assignHomework() { /* ... */ }
function loadProgressTab() { /* ... */ }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function printIEP() { window.print(); }
function showAssignTestModal() { 
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const select = document.getElementById('testSelect');
    select.innerHTML = allTests.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    document.getElementById('assignTestModal').classList.add('show');
}
function assignTest() { /* كود التعيين السابق */ }

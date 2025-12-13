// إدارة ملف الطالب - المعلم
let currentStudentId = null;
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('student-profile.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        currentStudentId = parseInt(urlParams.get('id')) || parseInt(sessionStorage.getItem('currentStudentId'));
        if (!currentStudentId) { alert('لم يتم تحديد طالب'); window.location.href = 'students.html'; return; }
        loadStudentProfile(); setupTabs();
    }
});

function loadStudentProfile() {
    const student = JSON.parse(localStorage.getItem('students') || '[]').find(s => s.id === currentStudentId);
    if (!student) return;
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentGrade').textContent = `الصف: ${student.grade}`;
    loadDiagnosticTest(); loadEducationalPlan();
}

function loadDiagnosticTest() {
    const content = document.getElementById('diagnosticTestContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const currentTest = studentTests.find(t => t.studentId === currentStudentId);
    
    if (!currentTest) {
        content.innerHTML = `<div class="empty-state"><h3>لا يوجد اختبار</h3><button class="btn btn-success" onclick="assignDiagnosticTest()">تعيين اختبار</button></div>`;
        return;
    }
    const test = JSON.parse(localStorage.getItem('tests') || '[]').find(t => t.id === currentTest.testId);
    
    let html = `<div class="test-info-card"><h4>${test?.title}</h4><p>الحالة: ${currentTest.status}</p>`;
    if(currentTest.status === 'completed') {
        html += `<p>النتيجة: ${currentTest.score}%</p>`;
        if(!currentTest.graded) html += `<button class="btn btn-warning" onclick="gradeManual(${currentTest.id})">📝 تصحيح يدوي</button>`;
    }
    content.innerHTML = html + `</div>`;
}

function gradeManual(id) {
    const score = prompt('أدخل الدرجة النهائية (0-100):');
    if(score) {
        const tests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const idx = tests.findIndex(t => t.id === id);
        if(idx !== -1) {
            tests[idx].score = parseInt(score); tests[idx].graded = true;
            localStorage.setItem('studentTests', JSON.stringify(tests));
            loadDiagnosticTest();
        }
    }
}

function assignDiagnosticTest() { document.getElementById('assignTestModal').classList.add('show'); populateTestsDropdown(); }
function closeAssignTestModal() { document.getElementById('assignTestModal').classList.remove('show'); }
function populateTestsDropdown() {
    const select = document.getElementById('testSelection'); select.innerHTML = '<option value="">اختر اختبار</option>';
    JSON.parse(localStorage.getItem('tests')||'[]').filter(t => t.teacherId === getCurrentUser().id).forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.title}</option>`;
    });
}
function saveAssignedTest() {
    const tid = document.getElementById('testSelection').value;
    if(!tid) return;
    const st = JSON.parse(localStorage.getItem('studentTests')||'[]');
    st.push({id: generateId(), studentId: currentStudentId, testId: parseInt(tid), status: 'pending', assignedAt: new Date().toISOString()});
    localStorage.setItem('studentTests', JSON.stringify(st));
    closeAssignTestModal(); loadDiagnosticTest();
}
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
        });
    });
}
// دوال وهمية لباقي التبويبات لتجنب الأخطاء
function loadEducationalPlan() {} function loadStudentLessons() {} function loadStudentAssignments() {} function loadStudentProgress() {}

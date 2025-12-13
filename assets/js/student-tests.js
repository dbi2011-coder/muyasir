// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;       // معرف السجل في جدول اختبارات الطالب
let currentOriginalTest = null; // بيانات الاختبار الأصلي من المكتبة

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-tests.html')) {
        loadStudentTests();
        setupTestsTabs();
    }
});

function setupTestsTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function loadStudentTests() {
    loadPendingTests();
    loadCompletedTests();
}

// 1. تحميل الاختبارات المعلقة
function loadPendingTests() {
    const container = document.getElementById('pendingTestsList');
    const currentStudent = getCurrentUser();
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    const myTests = studentTests.filter(t => t.studentId === currentStudent.id && (t.status === 'pending' || t.status === 'in-progress'));

    if (myTests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3>رائع! لا توجد اختبارات جديدة</h3>
            </div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return '';

        const btnText = assignment.status === 'in-progress' ? '🔄 استكمال الاختبار' : '🚀 ابدأ الاختبار';
        const badgeClass = assignment.status === 'in-progress' ? 'status-accelerated' : 'status-pending';
        const badgeText = assignment.status === 'in-progress' ? 'قيد التنفيذ' : 'جديد';

        return `
            <div class="test-card pending">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-item"><span>📚 المادة:</span><strong>${testDetails.subject}</strong></div>
                    <div class="meta-item"><span>❓ الأسئلة:</span><strong>${testDetails.questions ? testDetails.questions.length : 0}</strong></div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-success btn-block" onclick="openTestFocusMode(${assignment.id})">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadCompletedTests() {
    const container = document.getElementById('completedTestsList');
    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    const myCompletedTests = studentTests.filter(t => t.studentId === currentStudent.id && t.status === 'completed');

    if (myCompletedTests.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لم تنجز أي اختبار بعد</h3></div>`;
        return;
    }

    container.innerHTML = myCompletedTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return '';

        let scoreColor = assignment.score >= 80 ? 'green' : (assignment.score >= 50 ? 'orange' : 'red');

        return `
            <div class="test-card completed">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status status-completed">تم الإنجاز</span>
                </div>
                <div class="card-meta">
                    <div class="meta-item">
                        <span>⭐ الدرجة:</span>
                        <strong style="color: ${scoreColor}; font-size: 1.1rem;">${assignment.score || 0}%</strong>
                    </div>
                    <div class="meta-item">
                        <span>📅 التاريخ:</span>
                        <strong>${formatDateShort(assignment.completedAt)}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 3. فتح واجهة التركيز الكامل (Full Focus Mode)
function openTestFocusMode(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    const assignment = studentTests.find(t => t.id === assignmentId);
    if (!assignment) return;

    const testDetails = allTests.find(t => t.id === assignment.testId);
    if (!testDetails) {
        alert('عذراً، هذا الاختبار غير متوفر.');
        return;
    }

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;

    // إعداد الواجهة
    document.getElementById('focusTestTitle').textContent = testDetails.title;
    
    // إظهار شاشة البدء وإخفاء الأسئلة
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
    
    // تفعيل وضع التركيز (إظهار الطبقة البيضاء الكاملة)
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // منع التمرير في الصفحة الخلفية
}

// 4. الانتقال من شاشة التعليمات إلى الأسئلة
function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';

    renderQuestions();
}

// عرض الأسئلة واستعادة الإجابات
function renderQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';

    if (!currentOriginalTest.questions || currentOriginalTest.questions.length === 0) {
        container.innerHTML = '<p class="text-center">لا توجد أسئلة.</p>';
        return;
    }

    // البحث عن إجابات محفوظة
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const currentAssignment = studentTests.find(t => t.id === currentTestId);
    const savedAnswers = currentAssignment.savedAnswers || [];

    currentOriginalTest.questions.forEach((q, index) => {
        const questionHTML = createQuestionHTML(q, index);
        container.insertAdjacentHTML('beforeend', questionHTML);

        // استعادة الإجابة
        const savedAnswer = savedAnswers.find(a => a.questionId === q.id);
        if (savedAnswer) {
            if (q.type === 'multiple-choice') {
                const radio = document.querySelector(`input[name="q_${index}"][value="${savedAnswer.answer}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.closest('.answer-option').classList.add('selected');
                }
            } else if (q.type === 'true-false') {
                const btn = document.querySelector(`#card_q_${index} .tf-btn.${savedAnswer.answer}`);
                if (btn) {
                    selectTF(btn, index, savedAnswer.answer);
                }
            }
        }
    });
}

function createQuestionHTML(question, index) {
    let inputsHTML = '';

    if (question.type === 'multiple-choice') {
        let choices = question.choices || ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث'];
        inputsHTML = `
            <div class="answers-grid">
                ${choices.map((choice, i) => `
                    <label class="answer-option" onclick="selectOption(this)">
                        <input type="radio" name="q_${index}" value="${i}">
                        <span>${choice}</span>
                    </label>
                `).join('')}
            </div>
        `;
    } else if (question.type === 'true-false') {
        inputsHTML = `
            <div class="tf-buttons">
                <div class="tf-btn true" onclick="selectTF(this, ${index}, 'true')">
                    <span class="tf-icon">✅</span> <span>صواب</span>
                </div>
                <div class="tf-btn false" onclick="selectTF(this, ${index}, 'false')">
                    <span class="tf-icon">❌</span> <span>خطأ</span>
                </div>
                <input type="hidden" name="q_${index}">
            </div>
        `;
    }

    return `
        <div class="question-card" id="card_q_${index}">
            <div class="question-number">السؤال ${index + 1}</div>
            <div class="question-text">${question.text}</div>
            ${inputsHTML}
        </div>
    `;
}

// تفاعل واجهة المستخدم
function selectOption(label) {
    const parent = label.parentElement;
    parent.querySelectorAll('.answer-option').forEach(l => l.classList.remove('selected'));
    label.classList.add('selected');
    label.querySelector('input').checked = true;
}

function selectTF(btn, index, value) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = parent.querySelector('input');
    if(input) input.value = value;
}

// === 5. حفظ واستكمال لاحقاً ===
function saveTestProgress() {
    const savedAnswers = collectAnswers();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    
    if (index !== -1) {
        studentTests[index].status = 'in-progress';
        studentTests[index].savedAnswers = savedAnswers;
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        closeTestFocusMode();
        loadStudentTests(); // تحديث الواجهة الرئيسية
        // لا نعرض رسالة تنبيه ليكون الخروج سلساً وسريعاً
    }
}

// === 6. تسليم الإجابات النهائية ===
function submitTestAnswers() {
    if (!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;

    const answers = collectAnswers();
    let correctCount = 0;
    const totalQuestions = currentOriginalTest.questions.length;

    // تصحيح (محاكاة)
    answers.forEach(ans => { if(ans.answer !== null) correctCount++; });
    const score = Math.round((correctCount / totalQuestions) * 100); 

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    
    if (index !== -1) {
        studentTests[index].status = 'completed';
        studentTests[index].completedAt = new Date().toISOString();
        studentTests[index].score = score;
        studentTests[index].answers = answers;
        delete studentTests[index].savedAnswers;
        
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        alert(`أحسنت! درجتك: ${score}%`);
        closeTestFocusMode();
        loadStudentTests();
    }
}

function collectAnswers() {
    const answers = [];
    currentOriginalTest.questions.forEach((q, index) => {
        let studentAnswer = null;
        if (q.type === 'multiple-choice') {
            const selected = document.querySelector(`input[name="q_${index}"]:checked`);
            studentAnswer = selected ? selected.value : null;
        } else if (q.type === 'true-false') {
            const input = document.querySelector(`input[name="q_${index}"]`);
            studentAnswer = input ? input.value : null;
        }
        if (studentAnswer) answers.push({ questionId: q.id, answer: studentAnswer });
    });
    return answers;
}

function closeTestFocusMode() {
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto'; // إعادة التمرير للصفحة
    currentTestId = null;
    currentOriginalTest = null;
}

// أدوات مساعدة
function formatDateShort(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA');
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

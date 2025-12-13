// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;       
let currentOriginalTest = null; 

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

// 2. تحميل الاختبارات المكتملة (تم التحديث لإضافة أزرار العرض والطباعة)
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
                <div class="card-actions" style="display:flex; gap:10px; margin-top:15px;">
                    <button class="btn btn-primary" style="flex:1" onclick="viewCompletedTest(${assignment.id})">👁️ عرض الإجابات</button>
                    <button class="btn btn-outline-secondary" onclick="printTestResult(${assignment.id})">🖨️ طباعة</button>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// دوال إدارة الاختبار (الوضع النشط)
// ==========================================

function openTestFocusMode(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    const assignment = studentTests.find(t => t.id === assignmentId);
    if (!assignment) return;

    const testDetails = allTests.find(t => t.id === assignment.testId);
    if (!testDetails) return;

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;

    // إعداد الواجهة للاختبار النشط
    document.getElementById('focusTestTitle').textContent = testDetails.title;
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    
    // إظهار أزرار التحكم بالاختبار (حفظ وتسليم)
    document.getElementById('testFooterControls').innerHTML = `
        <button class="btn-action btn-save" onclick="saveTestProgress()">
            <span>💾</span> حفظ واستكمال لاحقاً
        </button>
        <button class="btn-action btn-submit" onclick="submitTestAnswers()">
            <span>✅</span> تسليم الإجابات وإنهاء
        </button>
    `;
    document.getElementById('testFooterControls').style.display = 'none'; // مخفي حتى يبدأ
    
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    renderQuestions(false); // false تعني وضع التحرير (ليس للعرض فقط)
}

// ==========================================
// دوال عرض الاختبار المكتمل (للمراجعة فقط)
// ==========================================

function viewCompletedTest(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    const assignment = studentTests.find(t => t.id === assignmentId);
    const testDetails = allTests.find(t => t.id === assignment.testId);

    if (!assignment || !testDetails) return;

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;

    // إعداد الواجهة للعرض فقط
    document.getElementById('focusTestTitle').textContent = `${testDetails.title} (مراجعة)`;
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    
    // تغيير أزرار الفوتر لتكون زر "إغلاق" فقط
    document.getElementById('testFooterControls').innerHTML = `
        <button class="btn-action btn-exit" onclick="closeTestFocusMode()">
            <span>🚪</span> إغلاق ومغادرة
        </button>
        <button class="btn-action btn-save" onclick="printTestResult(${assignmentId})">
            <span>🖨️</span> طباعة النتيجة
        </button>
    `;
    document.getElementById('testFooterControls').style.display = 'flex';

    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // عرض الأسئلة في وضع القراءة فقط
    renderQuestions(true); 
}

// ==========================================
// دالة عرض الأسئلة (مشتركة)
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';

    if (!currentOriginalTest.questions || currentOriginalTest.questions.length === 0) {
        container.innerHTML = '<p class="text-center">لا توجد أسئلة.</p>';
        return;
    }

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const currentAssignment = studentTests.find(t => t.id === currentTestId);
    // نستخدم answers إذا كان مكتملاً، أو savedAnswers إذا كان قيد التنفيذ
    const userAnswers = currentAssignment.status === 'completed' ? currentAssignment.answers : (currentAssignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const questionHTML = createQuestionHTML(q, index, isReadOnly);
        container.insertAdjacentHTML('beforeend', questionHTML);

        // استعادة الإجابة
        const savedAnswer = userAnswers.find(a => a.questionId === q.id);
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
                    // محاكاة التحديد بصرياً فقط
                    btn.classList.add('active');
                    const input = btn.parentElement.querySelector('input');
                    if(input) input.value = savedAnswer.answer;
                }
            }
        }

        // إذا كان وضع القراءة فقط، نقوم بتعطيل كل المدخلات
        if (isReadOnly) {
            const inputs = document.querySelectorAll(`#card_q_${index} input`);
            inputs.forEach(inp => inp.disabled = true);
            const card = document.getElementById(`card_q_${index}`);
            card.style.pointerEvents = 'none'; // منع النقر
            card.style.opacity = '0.9';
        }
    });
}

function createQuestionHTML(question, index, isReadOnly) {
    let inputsHTML = '';

    if (question.type === 'multiple-choice') {
        let choices = question.choices || ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث'];
        inputsHTML = `
            <div class="answers-grid">
                ${choices.map((choice, i) => `
                    <label class="answer-option" ${!isReadOnly ? `onclick="selectOption(this)"` : ''}>
                        <input type="radio" name="q_${index}" value="${i}">
                        <span>${choice}</span>
                    </label>
                `).join('')}
            </div>
        `;
    } else if (question.type === 'true-false') {
        inputsHTML = `
            <div class="tf-buttons">
                <div class="tf-btn true" ${!isReadOnly ? `onclick="selectTF(this, ${index}, 'true')"` : ''}>
                    <span class="tf-icon">✅</span> <span>صواب</span>
                </div>
                <div class="tf-btn false" ${!isReadOnly ? `onclick="selectTF(this, ${index}, 'false')"` : ''}>
                    <span class="tf-icon">❌</span> <span>خطأ</span>
                </div>
                <input type="hidden" name="q_${index}">
            </div>
        `;
    }

    return `
        <div class="question-card" id="card_q_${index}">
            <div class="question-number">السؤال رقم ${index + 1}</div>
            <div class="question-text">${question.text}</div>
            ${inputsHTML}
        </div>
    `;
}

// دوال التفاعل البصري
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

// === وظائف الحفظ والتسليم ===

function saveTestProgress() {
    const savedAnswers = collectAnswers();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    
    if (index !== -1) {
        studentTests[index].status = 'in-progress';
        studentTests[index].savedAnswers = savedAnswers;
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        closeTestFocusMode();
        loadStudentTests(); 
    }
}

function submitTestAnswers() {
    if (!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;

    const answers = collectAnswers();
    let correctCount = 0;
    const totalQuestions = currentOriginalTest.questions.length;

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

// ==========================================
// وظيفة الطباعة
// ==========================================

function printTestResult(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    const assignment = studentTests.find(t => t.id === assignmentId);
    const testDetails = allTests.find(t => t.id === assignment.testId);
    
    if (!assignment || !testDetails) return;

    // فتح نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    
    let questionsHtml = testDetails.questions.map((q, index) => {
        // البحث عن إجابة الطالب
        const userAnswerObj = assignment.answers.find(a => a.questionId === q.id);
        const userAnswer = userAnswerObj ? userAnswerObj.answer : 'لم يجب';
        
        let answerText = userAnswer;
        // تحويل رموز الإجابة إلى نص مقروء
        if(q.type === 'true-false') {
            answerText = userAnswer === 'true' ? 'صواب' : (userAnswer === 'false' ? 'خطأ' : 'لم يجب');
        } else if (q.type === 'multiple-choice' && q.choices) {
            answerText = q.choices[userAnswer] || 'لم يجب';
        }

        return `
            <div class="print-question">
                <div class="q-title">س${index + 1}: ${q.text}</div>
                <div class="q-answer">إجابتك: ${answerText}</div>
            </div>
        `;
    }).join('');

    const content = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>طباعة نتيجة الاختبار</title>
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .meta { margin-bottom: 30px; font-size: 1.1rem; }
                .print-question { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                .q-title { font-weight: bold; margin-bottom: 5px; }
                .q-answer { color: #555; }
                .score-box { text-align: center; font-size: 1.5rem; font-weight: bold; margin-top: 30px; border: 2px solid #333; padding: 10px; display: inline-block; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>تقرير نتيجة اختبار</h1>
                <h2>${testDetails.title}</h2>
            </div>
            <div class="meta">
                <p><strong>الطالب:</strong> ${getCurrentUser().name}</p>
                <p><strong>المادة:</strong> ${testDetails.subject}</p>
                <p><strong>تاريخ الإنجاز:</strong> ${formatDateShort(assignment.completedAt)}</p>
            </div>
            <div class="questions-list">
                ${questionsHtml}
            </div>
            <div style="text-align:center;">
                <div class="score-box">الدرجة النهائية: ${assignment.score}%</div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
}

function closeTestFocusMode() {
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentTestId = null;
    currentOriginalTest = null;
}

function formatDateShort(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA');
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

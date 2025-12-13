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

// 1. تحميل الاختبارات المعلقة (والتي قيد التنفيذ)
function loadPendingTests() {
    const container = document.getElementById('pendingTestsList');
    const currentStudent = getCurrentUser();
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    // (pending أو in-progress)
    const myTests = studentTests.filter(t => t.studentId === currentStudent.id && (t.status === 'pending' || t.status === 'in-progress'));

    if (myTests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3>رائع! لا توجد اختبارات جديدة</h3>
                <p>لقد أنجزت كل المهام المطلوبة.</p>
            </div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return '';

        // نص الزر وحالة الاختبار
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
                    <div class="meta-item">
                        <span>📚 المادة:</span>
                        <strong>${testDetails.subject}</strong>
                    </div>
                    <div class="meta-item">
                        <span>❓ الأسئلة:</span>
                        <strong>${testDetails.questions ? testDetails.questions.length : 0} سؤال</strong>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-success btn-block" onclick="prepareTest(${assignment.id})">
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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لم تنجز أي اختبار بعد</h3>
                <p>الاختبارات التي تنتهي منها ستظهر هنا.</p>
            </div>`;
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
                        <span>📅 تاريخ الحل:</span>
                        <strong>${formatDateShort(assignment.completedAt)}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 3. تحضير الاختبار
function prepareTest(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    const assignment = studentTests.find(t => t.id === assignmentId);
    if (!assignment) return;

    const testDetails = allTests.find(t => t.id === assignment.testId);
    if (!testDetails) {
        alert('عذراً، يبدو أن المعلم قد حذف هذا الاختبار.');
        return;
    }

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;

    document.getElementById('testModalTitle').textContent = testDetails.title;
    document.getElementById('testInstructions').style.display = 'block';
    document.getElementById('testQuestionsArea').style.display = 'none';
    document.getElementById('testFooter').style.display = 'none';
    
    document.getElementById('startTestModal').classList.add('show');
}

// 4. بدء عرض الأسئلة (واسترجاع الإجابات المحفوظة)
function beginTestQuestions() {
    document.getElementById('testInstructions').style.display = 'none';
    document.getElementById('testQuestionsArea').style.display = 'block';
    document.getElementById('testFooter').style.display = 'flex';

    const container = document.getElementById('questionsWrapper');
    container.innerHTML = '';

    if (!currentOriginalTest.questions || currentOriginalTest.questions.length === 0) {
        container.innerHTML = '<p class="text-center">لا توجد أسئلة.</p>';
        return;
    }

    // البحث عن إجابات محفوظة مسبقاً
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const currentAssignment = studentTests.find(t => t.id === currentTestId);
    const savedAnswers = currentAssignment.savedAnswers || [];

    currentOriginalTest.questions.forEach((q, index) => {
        const questionHTML = createQuestionHTML(q, index);
        container.insertAdjacentHTML('beforeend', questionHTML);

        // استعادة الإجابة المحفوظة إن وجدت
        const savedAnswer = savedAnswers.find(a => a.questionId === q.id);
        if (savedAnswer) {
            if (q.type === 'multiple-choice') {
                const radio = document.querySelector(`input[name="q_${index}"][value="${savedAnswer.answer}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.closest('.answer-option').classList.add('selected');
                }
            } else if (q.type === 'true-false') {
                const btn = document.querySelector(`.tf-btn.${savedAnswer.answer}`); // true or false class
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
        let choices = question.choices;
        if (!choices || !Array.isArray(choices) || choices.length === 0) {
            choices = ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث']; 
        }

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
                <button type="button" class="tf-btn true" onclick="selectTF(this, ${index}, 'true')">
                    <span style="font-size: 2rem;">✅</span> <span>صواب</span>
                </button>
                <button type="button" class="tf-btn false" onclick="selectTF(this, ${index}, 'false')">
                    <span style="font-size: 2rem;">❌</span> <span>خطأ</span>
                </button>
                <input type="hidden" name="q_${index}">
            </div>
        `;
    } else {
        inputsHTML = `<p class="text-muted">نوع السؤال غير مدعوم في العرض السريع.</p>`;
    }

    return `
        <div class="question-card" id="card_q_${index}">
            <div class="question-number">السؤال رقم ${index + 1}</div>
            <div class="question-text">${question.text}</div>
            ${inputsHTML}
        </div>
    `;
}

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

// === 5. وظيفة حفظ التقدم ===
function saveTestProgress() {
    const savedAnswers = collectAnswers();
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    
    if (index !== -1) {
        studentTests[index].status = 'in-progress'; // تغيير الحالة لقيد التنفيذ
        studentTests[index].savedAnswers = savedAnswers; // حفظ الإجابات
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        alert('✅ تم حفظ تقدمك بنجاح. يمكنك العودة لإكماله في أي وقت.');
        closeStartTestModal();
        loadStudentTests();
    }
}

// === 6. تسليم الإجابات النهائية ===
function submitTestAnswers() {
    if (!confirm('هل أنت متأكد من تسليم الإجابات وإنهاء الاختبار؟ لا يمكن التراجع بعد ذلك.')) return;

    const answers = collectAnswers();
    let correctCount = 0;
    const totalQuestions = currentOriginalTest.questions.length;

    // تصحيح الإجابات (محاكاة)
    answers.forEach(ans => {
        if(ans.answer !== null) correctCount++; 
    });

    const score = Math.round((correctCount / totalQuestions) * 100); 

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    
    if (index !== -1) {
        studentTests[index].status = 'completed';
        studentTests[index].completedAt = new Date().toISOString();
        studentTests[index].score = score;
        studentTests[index].answers = answers;
        delete studentTests[index].savedAnswers; // حذف الإجابات المؤقتة
        
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        addStudentActivity({
            type: 'test',
            title: 'أنجزت اختباراً',
            description: `اختبار: ${currentOriginalTest.title} - الدرجة: ${score}%`
        });

        alert(`أحسنت يا بطل! 🎉\nلقد أكملت الاختبار.\nدرجتك هي: ${score}%`);
        closeStartTestModal();
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
        
        if (studentAnswer) {
            answers.push({ questionId: q.id, answer: studentAnswer });
        }
    });
    return answers;
}

function closeStartTestModal() {
    document.getElementById('startTestModal').classList.remove('show');
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

function addStudentActivity(activity) {
    const activities = JSON.parse(localStorage.getItem('studentActivities') || '[]');
    activities.push({
        id: Date.now(),
        studentId: getCurrentUser().id,
        ...activity,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('studentActivities', JSON.stringify(activities));
}

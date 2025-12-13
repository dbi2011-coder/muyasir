// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;       // معرف السجل في جدول اختبارات الطالب
let currentOriginalTest = null; // بيانات الاختبار الأصلي من المكتبة (الأسئلة، العنوان..)

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
            // إزالة النشاط
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // تفعيل التبويب المختار
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

// 1. تحميل الاختبارات المعلقة (مع إصلاح مشكلة البيانات المفقودة)
function loadPendingTests() {
    const container = document.getElementById('pendingTestsList');
    const currentStudent = getCurrentUser();
    
    // جلب البيانات من LocalStorage
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    // تصفية اختبارات الطالب الحالية وغير المكتملة
    const myTests = studentTests.filter(t => t.studentId === currentStudent.id && t.status === 'pending');

    if (myTests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3>رائع! لا توجد اختبارات جديدة</h3>
                <p>استمتع بوقتك، لقد أنجزت كل المهام.</p>
            </div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        // [هام] الربط بين جدول التعيين وجدول الاختبارات لجلب التفاصيل
        const testDetails = allTests.find(t => t.id === assignment.testId);
        
        // إذا كان الاختبار الأصلي محذوفاً، لا نعرضه
        if (!testDetails) return '';

        return `
            <div class="test-card pending">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status status-pending">جديد</span>
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
                    <div class="meta-item">
                        <span>📅 التاريخ:</span>
                        <strong>${formatDateShort(assignment.assignedDate)}</strong>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-success btn-block" onclick="prepareTest(${assignment.id})">
                        🚀 ابدأ الاختبار الآن
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 2. تحميل الاختبارات المكتملة
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
        if (!testDetails) return ''; // تخطي إذا حذف المعلم الاختبار

        // تحديد لون الدرجة
        let scoreColor = 'green';
        if(assignment.score < 50) scoreColor = 'red';
        else if(assignment.score < 80) scoreColor = 'orange';

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

// 3. تحضير واجهة الاختبار
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

    // تعبئة البيانات في المودال
    document.getElementById('testModalTitle').textContent = testDetails.title;
    
    // إعادة تعيين واجهة المودال للبداية
    document.getElementById('testInstructions').style.display = 'block';
    document.getElementById('testQuestionsArea').style.display = 'none';
    document.getElementById('testFooter').style.display = 'none';
    
    document.getElementById('startTestModal').classList.add('show');
}

// 4. بدء عرض الأسئلة
function beginTestQuestions() {
    document.getElementById('testInstructions').style.display = 'none';
    document.getElementById('testQuestionsArea').style.display = 'block';
    document.getElementById('testFooter').style.display = 'flex';

    const container = document.getElementById('questionsWrapper');
    container.innerHTML = '';

    if (!currentOriginalTest.questions || currentOriginalTest.questions.length === 0) {
        container.innerHTML = '<p class="text-center">لا توجد أسئلة في هذا الاختبار.</p>';
        return;
    }

    // توليد HTML لكل سؤال
    currentOriginalTest.questions.forEach((q, index) => {
        const questionHTML = createQuestionHTML(q, index);
        container.insertAdjacentHTML('beforeend', questionHTML);
    });
}

// دالة مساعدة لإنشاء شكل السؤال حسب نوعه
function createQuestionHTML(question, index) {
    let inputsHTML = '';

    // نوع 1: اختيار من متعدد
    if (question.type === 'multiple-choice') {
        // التحقق مما إذا كانت الخيارات موجودة في الكائن (fallback if missing)
        let choices = question.choices;
        if (!choices || !Array.isArray(choices) || choices.length === 0) {
            // خيارات افتراضية في حال لم يحفظ المعلم الخيارات بشكل صحيح
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
    } 
    // نوع 2: صواب أو خطأ
    else if (question.type === 'true-false') {
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
    }
    // أنواع أخرى يمكن إضافتها هنا...
    else {
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

// دوال التفاعل البصري عند الاختيار
function selectOption(label) {
    // إزالة التحديد من جميع الخيارات في نفس السؤال
    const parent = label.parentElement;
    parent.querySelectorAll('.answer-option').forEach(l => l.classList.remove('selected'));
    
    // تحديد الخيار الحالي
    label.classList.add('selected');
    label.querySelector('input').checked = true;
}

function selectTF(btn, index, value) {
    const parent = btn.parentElement;
    // إزالة النشاط من الزرين
    parent.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    
    // تفعيل الزر المختار
    btn.classList.add('active');
    
    // تحديث القيمة المخفية
    const input = parent.querySelector('input');
    input.value = value;
}

// 5. تسليم الإجابات
function submitTestAnswers() {
    if (!confirm('هل أنت متأكد من تسليم الإجابات وإنهاء الاختبار؟')) return;

    let correctCount = 0;
    const totalQuestions = currentOriginalTest.questions.length;
    const answers = [];

    currentOriginalTest.questions.forEach((q, index) => {
        let studentAnswer = null;
        
        if (q.type === 'multiple-choice') {
            const selected = document.querySelector(`input[name="q_${index}"]:checked`);
            studentAnswer = selected ? selected.value : null;
        } else if (q.type === 'true-false') {
            const selected = document.querySelector(`input[name="q_${index}"]`);
            studentAnswer = selected ? selected.value : null;
        }

        // ملاحظة: التصحيح هنا محاكاة لأنه يعتمد على وجود الإجابة الصحيحة في بيانات السؤال.
        // نفترض أن أي إجابة تعتبر مشاركة إيجابية في هذا النموذج التجريبي
        if (studentAnswer !== null) {
            correctCount++;
        }
        
        answers.push({ questionId: q.id, answer: studentAnswer });
    });

    // حساب النسبة (محاكاة: درجة تشجيعية + دقة الإجابة)
    // في النظام الفعلي: Score = (correctCount / totalQuestions) * 100
    const score = Math.round((correctCount / totalQuestions) * 100); 

    // حفظ النتيجة
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    
    if (index !== -1) {
        studentTests[index].status = 'completed';
        studentTests[index].completedAt = new Date().toISOString();
        studentTests[index].score = score;
        studentTests[index].answers = answers;
        
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        // إضافة نشاط للسجل
        addStudentActivity({
            type: 'test',
            title: 'أنجزت اختباراً',
            description: `اختبار: ${currentOriginalTest.title} - الدرجة: ${score}%`
        });

        // رسالة تهنئة
        let msg = score >= 90 ? 'أداء مذهل يا بطل! 🌟' : (score >= 70 ? 'أحسنت عملاً! 👍' : 'جيد، حظاً أوفر في المرة القادمة!');
        alert(`${msg}\nلقد حصلت على: ${score}%`);
        
        closeStartTestModal();
        loadStudentTests(); // تحديث القائمة
    }
}

function closeStartTestModal() {
    document.getElementById('startTestModal').classList.remove('show');
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

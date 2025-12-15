// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;
let canvases = {};
let currentQuestionIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('pendingTestsList')) {
        loadStudentTests();
        setupTestsTabs();
    }
});

function setupTestsTabs() { /* نفس السابق */
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

function loadPendingTests() {
    const container = document.getElementById('pendingTestsList');
    if(!container) return;
    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    // نعرض هنا (الجديدة) و (قيد التنفيذ) و (المعادة للتعديل Returned)
    const myTests = studentTests.filter(t => 
        t.studentId === currentStudent.id && 
        (t.status === 'pending' || t.status === 'in-progress' || t.status === 'returned')
    );

    if (myTests.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد اختبارات نشطة</h3></div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return '';

        let statusText = 'جديد';
        let badgeClass = 'status-pending';
        let btnText = '🚀 ابدأ';

        if(assignment.status === 'in-progress') {
            statusText = 'قيد التنفيذ';
            badgeClass = 'status-accelerated';
            btnText = '🔄 استكمال';
        } else if (assignment.status === 'returned') {
            statusText = '⚠️ معاد للتعديل';
            badgeClass = 'status-returned'; // تأكد من إضافة ستايل لها
            btnText = '✏️ تعديل الإجابات';
        }

        return `
            <div class="test-card pending">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status ${badgeClass}" style="${assignment.status === 'returned' ? 'background:#ffc107; color:#000;' : ''}">${statusText}</span>
                </div>
                <div class="card-meta">
                     ${assignment.status === 'returned' ? '<p class="text-danger small">قام المعلم بإعادة الاختبار لك. راجع الملاحظات وعدل الإجابات.</p>' : ''}
                    <div class="meta-item"><span>📚 المادة:</span><strong>${testDetails.subject}</strong></div>
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
    if(!container) return;
    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    const myCompletedTests = studentTests.filter(t => t.studentId === currentStudent.id && t.status === 'completed');

    if (myCompletedTests.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد اختبارات منجزة</h3></div>`;
        return;
    }

    container.innerHTML = myCompletedTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return '';
        let scoreColor = assignment.score >= 80 ? 'green' : 'orange';

        return `
            <div class="test-card completed">
                <div class="card-header"><h3 class="card-title">${testDetails.title}</h3><span class="card-status status-completed">منجز</span></div>
                <div class="card-meta">
                    <div class="meta-item"><span>⭐ الدرجة:</span><strong style="color:${scoreColor}">${assignment.score}%</strong></div>
                    <div class="meta-item"><span>📅 التاريخ:</span><strong>${new Date(assignment.completedAt).toLocaleDateString('ar-SA')}</strong></div>
                </div>
                <div class="card-actions" style="margin-top:10px; display:flex; gap:10px;">
                    <button class="btn btn-primary btn-sm flex-1" onclick="viewCompletedTest(${assignment.id})">👁️ عرض الملاحظات</button>
                    <button class="btn btn-secondary btn-sm" onclick="printTest(${assignment.id})">🖨️ طباعة</button>
                </div>
            </div>`;
    }).join('');
}

// ==========================================
// 3. إدارة العرض (نشط / اطلاع / تعديل)
// ==========================================

function openTestFocusMode(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    if (!assignment) return;
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testDetails = allTests.find(t => t.id === assignment.testId);

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;
    currentQuestionIndex = 0;

    // تحديد الوضع: هل هو للقراءة فقط أم للتعديل؟
    // إذا كان returned أو pending/in-progress -> تعديل
    // إذا كان completed -> قراءة (سيتم التعامل معه في دالة viewCompletedTest منفصلة لترتيب أفضل)
    
    document.getElementById('focusTestTitle').textContent = testDetails.title;
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
    
    // إظهار تنبيه إذا كان معاد
    if(assignment.status === 'returned') {
        document.querySelector('#testStartScreen h1').textContent = 'إعادة المحاولة';
        document.querySelector('#testStartScreen p').textContent = 'قام المعلم بإعادة الاختبار لك. اطلع على الملاحظات وعدل الإجابات الخاطئة.';
    } else {
        document.querySelector('#testStartScreen h1').textContent = 'جاهز؟';
    }

    document.getElementById('testFocusMode').style.display = 'flex';
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    
    // التحقق من الحالة لتحديد هل هو للقراءة فقط أم لا
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    const isReadOnly = (assignment.status === 'completed'); // فقط المكتمل للقراءة

    renderQuestions(isReadOnly);
    showQuestion(0);
}

// دالة عرض الاختبار المنجز (للاطلاع + الملاحظات)
function viewCompletedTest(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    if (!assignment) return;
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testDetails = allTests.find(t => t.id === assignment.testId);

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;
    currentQuestionIndex = 0;

    document.getElementById('focusTestTitle').textContent = `${testDetails.title} (للاطلاع)`;
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    
    // عرض الأسئلة في وضع القراءة
    renderQuestions(true);
    showQuestion(0);

    // إخفاء أزرار الحفظ والتسليم، وإظهار زر الخروج
    document.getElementById('testFooterControls').innerHTML = `
        <button id="btnPrev" class="btn-nav btn-prev" onclick="navigateQuestion(-1)">السابق</button>
        <button class="btn-nav btn-save" onclick="printTest(${assignmentId})">🖨️ طباعة</button>
        <button id="btnNext" class="btn-nav btn-next" onclick="navigateQuestion(1)">التالي</button>
        <button class="btn-nav btn-submit" onclick="closeTestFocusMode()">خروج</button>
    `;
    document.getElementById('testFooterControls').style.display = 'flex';
    document.getElementById('testFocusMode').style.display = 'flex';
}

// ==========================================
// 4. عرض الأسئلة (محدث لعرض الملاحظات)
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    canvases = {};

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const answerObj = answers.find(a => a.questionId === q.id);
        const savedAns = answerObj?.answer;
        const teacherNote = answerObj?.teacherNote; // جلب الملاحظة

        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `card_q_${index}`;
        
        // عرض الملاحظة إذا وجدت
        let noteHTML = '';
        if (teacherNote) {
            noteHTML = `
            <div class="teacher-note-alert" style="background:#fff3cd; color:#856404; padding:10px; border-radius:5px; margin-bottom:10px; border-right:4px solid #ffeeba;">
                <strong>📝 ملاحظة المعلم:</strong> ${teacherNote}
            </div>`;
        }

        let contentHTML = `<div class="question-number">سؤال ${index+1}</div>`;
        contentHTML += noteHTML; // إضافة الملاحظة في الأعلى

        // ... (باقي كود عرض الوسائط ونص السؤال والأنواع هو نفسه في الردود السابقة، انسخه هنا) ...
        if(q.mediaUrl) {
             contentHTML += `<div class="media-container mb-3" style="text-align:center;"><img src="${q.mediaUrl}" style="max-width:100%; max-height:250px;"></div>`;
        }
        if(q.text) contentHTML += `<h3 class="question-text">${q.text}</h3>`;
        
        contentHTML += `<div class="question-interaction-area">`;
        
        // أمثلة مختصرة للأنواع (يجب استخدام الكود الكامل من الرد السابق لجميع الأنواع 9)
        if (q.type.includes('multiple-choice')) {
             if(q.choices) {
                q.choices.forEach((c, i) => {
                    const checked = savedAns == i ? 'checked' : '';
                    contentHTML += `<label class="answer-option ${checked ? 'selected' : ''}" onclick="${!isReadOnly ? 'selectOption(this)' : ''}"><input type="radio" name="q_${index}" value="${i}" ${checked} ${isReadOnly?'disabled':''}> ${c}</label>`;
                });
            }
        }
        // ... (تكرار نفس المنطق لباقي الأنواع مع مراعاة isReadOnly) ...
        // بالنسبة لأنواع الكتابة والرسم، نضيف الكانفاس
         else if (q.type.includes('spelling') || q.type === 'missing-letter') {
             const wordToSay = q.spellingWord || q.fullWord || 'كلمة';
             contentHTML += `<div class="spelling-area text-center">
                 ${!isReadOnly ? `<button class="btn btn-info mb-2" onclick="speakText('${wordToSay}')">🔊 استمع</button>` : ''}
                 ${!isReadOnly ? `<div class="canvas-tools mb-2"><button onclick="setTool(${index}, 'pen')">✏️</button><button onclick="clearCanvas(${index})">❌</button></div>` : ''}
                 <canvas id="canvas_${index}" class="drawing-canvas" width="350" height="200" style="border:2px dashed #ccc; pointer-events:${isReadOnly?'none':'auto'}"></canvas>
                 <input type="hidden" name="q_${index}" id="input_q_${index}" value="${savedAns || ''}">
             </div>`;
         }

        contentHTML += `</div>`;
        card.innerHTML = contentHTML;
        container.appendChild(card);

        if (q.type.includes('spelling') || q.type === 'missing-letter') {
            setTimeout(() => initCanvas(index, savedAns, isReadOnly), 100);
        }
    });
}

// ... (دوال التنقل showQuestion, navigateQuestion، ودوال الكانفاس والصوت كما هي) ...

// ==========================================
// 5. الطباعة
// ==========================================
function printTest(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    if(!assignment) return;
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testDetails = allTests.find(t => t.id === assignment.testId);

    const printWindow = window.open('', '_blank');
    let questionsHtml = testDetails.questions.map((q, index) => {
        const ansObj = assignment.answers.find(a => a.questionId === q.id);
        const ans = ansObj ? ansObj.answer : '-';
        const note = ansObj?.teacherNote ? `<div style="background:#eee; padding:5px; margin-top:5px;"><strong>ملاحظة المعلم:</strong> ${ansObj.teacherNote}</div>` : '';
        
        let displayAns = ans;
        if(q.type.includes('multiple-choice')) displayAns = q.choices[ans] || ans;
        if(q.type.includes('spelling')) displayAns = ans.startsWith('data:image') ? `<img src="${ans}" height="50">` : ans;

        return `<div style="margin-bottom:20px; border-bottom:1px solid #ccc; padding-bottom:10px;">
            <p><strong>س${index+1}: ${q.text}</strong></p>
            <p>إجابتك: ${displayAns}</p>
            ${note}
        </div>`;
    }).join('');

    printWindow.document.write(`
        <html dir="rtl" style="font-family:sans-serif;">
        <h1 style="text-align:center">${testDetails.title}</h1>
        <div style="text-align:center; margin-bottom:20px;">الدرجة: ${assignment.score}%</div>
        ${questionsHtml}
        <script>window.print()</script>
        </html>
    `);
    printWindow.document.close();
}

function closeTestFocusMode() {
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentTestId = null;
    
    // إعادة تعيين أزرار الفوتر للوضع الافتراضي عند الخروج
    document.getElementById('testFooterControls').innerHTML = `
        <button id="btnPrev" class="btn-nav btn-prev" onclick="navigateQuestion(-1)">السابق</button>
        <button id="btnSave" class="btn-nav btn-save" onclick="saveTestProgress()">حفظ التقدم</button>
        <button id="btnNext" class="btn-nav btn-next" onclick="navigateQuestion(1)">التالي</button>
        <button id="btnSubmit" class="btn-nav btn-submit" style="display: none;" onclick="submitTestAnswers()">تسليم نهائي</button>
    `;
}

function showQuestion(index) {
     const total = currentOriginalTest.questions.length;
    document.querySelectorAll('.question-card').forEach(card => card.classList.remove('active'));
    const currentCard = document.getElementById(`card_q_${index}`);
    if(currentCard) currentCard.classList.add('active');
    document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${total}`;
    
    // التعامل مع الأزرار الموجودة حالياً في الـ DOM
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');

    if(btnPrev) btnPrev.disabled = (index === 0);
    
    if (index === total - 1) {
        if(btnNext) btnNext.style.display = 'none';
        if(btnSubmit && !document.querySelector('.btn-submit').textContent.includes('خروج')) { 
            // فقط إذا لم يكن زر خروج (وضع الاطلاع)
            btnSubmit.style.display = 'inline-block'; 
        }
    } else {
        if(btnNext) btnNext.style.display = 'inline-block';
        if(btnSubmit && !document.querySelector('.btn-submit').textContent.includes('خروج')) {
            btnSubmit.style.display = 'none';
        }
    }
    currentQuestionIndex = index;
}

// ... (تأكد من وجود باقي الدوال المساعدة: navigateQuestion, getCurrentUser, initCanvas, speakText, etc.) ...
function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < currentOriginalTest.questions.length) {
        showQuestion(newIndex);
    }
}
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }

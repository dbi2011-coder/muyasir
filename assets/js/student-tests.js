// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;
let canvases = {}; // لتخزين مراجع لوحات الرسم
let currentQuestionIndex = 0; // تتبع رقم السؤال الحالي

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('pendingTestsList')) {
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

// 1. تحميل الاختبارات المعلقة والجديدة والمعادة
function loadPendingTests() {
    const container = document.getElementById('pendingTestsList');
    if (!container) return;

    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

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
        let extraInfo = '';

        if(assignment.status === 'in-progress') {
            statusText = 'قيد التنفيذ';
            badgeClass = 'status-accelerated';
            btnText = '🔄 استكمال';
        } else if (assignment.status === 'returned') {
            statusText = '⚠️ معاد للتعديل';
            badgeClass = 'status-returned'; 
            btnText = '✏️ تعديل الإجابات';
            extraInfo = '<p class="text-danger small mt-2">طلب المعلم مراجعة هذا الاختبار.</p>';
        }

        const qCount = testDetails.questions ? testDetails.questions.length : 0;

        return `
            <div class="test-card pending">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status ${badgeClass}" style="${assignment.status === 'returned' ? 'background:#ffc107; color:#000;' : ''}">${statusText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-item"><span>📚 المادة:</span><strong>${testDetails.subject}</strong></div>
                    <div class="meta-item"><span>❓ الأسئلة:</span><strong>${qCount}</strong></div>
                    ${extraInfo}
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

// 2. تحميل الاختبارات المكتملة
function loadCompletedTests() {
    const container = document.getElementById('completedTestsList');
    if (!container) return;

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
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status status-completed">منجز</span>
                </div>
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
// 3. إدارة وضع التركيز (Focus Mode)
// ==========================================

// فتح الاختبار للحل أو التعديل
function openTestFocusMode(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    if (!assignment) return;

    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testDetails = allTests.find(t => t.id === assignment.testId);
    if (!testDetails) return;

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;
    currentQuestionIndex = 0;

    document.getElementById('focusTestTitle').textContent = testDetails.title;
    
    // إعداد الشاشات
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';

    // نصوص الشاشة الترحيبية
    const titleEl = document.querySelector('#testStartScreen h1');
    const descEl = document.querySelector('#testStartScreen p');
    const btnEl = document.querySelector('#testStartScreen button');
    
    if(assignment.status === 'returned') {
        titleEl.textContent = 'إعادة المحاولة';
        descEl.textContent = 'قام المعلم بإعادة الاختبار لك. يرجى مراجعة الملاحظات وتعديل الإجابات الخاطئة.';
        btnEl.textContent = 'تعديل الإجابات';
    } else {
        titleEl.textContent = 'جاهز؟';
        descEl.textContent = 'ركز جيداً، وتأكد من إجاباتك قبل التسليم.';
        btnEl.textContent = 'ابدأ الاختبار';
    }
    
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
}

// بدء الحل الفعلي
function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    
    // إعادة تعيين أزرار الفوتر للوضع الافتراضي (حل/حفظ)
    document.getElementById('testFooterControls').innerHTML = `
        <button id="btnPrev" class="btn-nav btn-prev" onclick="navigateQuestion(-1)">السابق</button>
        <button id="btnSave" class="btn-nav btn-save" onclick="saveTestProgress()">حفظ التقدم</button>
        <button id="btnNext" class="btn-nav btn-next" onclick="navigateQuestion(1)">التالي</button>
        <button id="btnSubmit" class="btn-nav btn-submit" style="display: none;" onclick="submitTestAnswers()">تسليم نهائي</button>
    `;
    document.getElementById('testFooterControls').style.display = 'flex';
    
    renderQuestions(false); // false = ليس للقراءة فقط
    showQuestion(0);
}

// عرض الاختبار المنجز (للاطلاع فقط)
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
    
    // إعداد أزرار الفوتر لوضع الاطلاع
    document.getElementById('testFooterControls').innerHTML = `
        <button id="btnPrev" class="btn-nav btn-prev" onclick="navigateQuestion(-1)">السابق</button>
        <button class="btn-nav btn-save" onclick="printTest(${assignmentId})">🖨️ طباعة</button>
        <button id="btnNext" class="btn-nav btn-next" onclick="navigateQuestion(1)">التالي</button>
        <button class="btn-nav btn-submit" onclick="closeTestFocusMode()">خروج</button>
    `;
    document.getElementById('testFooterControls').style.display = 'flex';
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 

    renderQuestions(true); // true = للقراءة فقط
    showQuestion(0);
}

// ==========================================
// 4. عرض الأسئلة
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    canvases = {}; // تصفير

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    // جلب الإجابات سواء كانت محفوظة مؤقتاً أو مسلمة نهائياً
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const ansObj = answers.find(a => a.questionId === q.id);
        const savedAns = ansObj?.answer;
        const teacherNote = ansObj?.teacherNote;

        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `card_q_${index}`;
        
        let contentHTML = `<div class="question-number" style="background:#e3f2fd; color:#0d47a1; padding:5px 15px; border-radius:15px; display:inline-block; margin-bottom:10px;">سؤال ${index+1}</div>`;

        // عرض ملاحظة المعلم
        if (teacherNote) {
            contentHTML += `
            <div class="teacher-note-alert" style="background:#fff3cd; color:#856404; padding:10px; border-radius:5px; margin-bottom:10px; border-right:4px solid #ffeeba;">
                <strong>📝 ملاحظة المعلم:</strong> ${teacherNote}
            </div>`;
        }
        
        // المرفقات
        if(q.mediaUrl) {
            contentHTML += `<div class="media-container mb-3" style="text-align:center;"><img src="${q.mediaUrl}" style="max-width:100%; max-height:250px; border-radius:10px;"></div>`;
        }
        
        if(q.text) contentHTML += `<h3 class="question-text" style="font-size:1.4rem; margin-bottom:20px;">${q.text}</h3>`;
        
        contentHTML += `<div class="question-interaction-area">`;
        
        // --- أنواع الأسئلة ---

        if (q.type.includes('multiple-choice')) {
            if(q.choices) {
                q.choices.forEach((c, i) => {
                    const checked = savedAns == i ? 'checked' : '';
                    // لاحظ إضافة onclick="selectOption(this)"
                    contentHTML += `
                        <label class="answer-option ${checked ? 'selected' : ''}" ${!isReadOnly ? 'onclick="selectOption(this)"' : ''}>
                            <input type="radio" name="q_${index}" value="${i}" ${checked} ${isReadOnly?'disabled':''}> ${c}
                        </label>`;
                });
            }
        }
        else if (q.type === 'drag-drop') {
             contentHTML += `<p class="text-muted">رتب العناصر: ${q.dragItems || ''}</p>
             <input type="text" class="form-control" name="q_${index}" value="${savedAns || ''}" ${isReadOnly?'disabled':''} placeholder="اكتب الترتيب...">`;
        }
        else if (q.type === 'open-ended') {
            contentHTML += `<textarea class="form-control" name="q_${index}" rows="4" ${isReadOnly?'disabled':''}>${savedAns || ''}</textarea>`;
        }
        else if (q.type.includes('reading')) {
            contentHTML += `
                <div class="reading-area p-3 border rounded text-center">
                    <h4 class="mb-3" style="font-size:1.5rem;">${q.readingText || ''}</h4>
                    ${!isReadOnly ? `
                    <button class="record-btn" onclick="startSpeechRecognition(${index})"><i class="fas fa-microphone"></i></button>
                    <p class="mt-2 text-muted" id="record_status_${index}">اضغط للتحدث</p>
                    <input type="hidden" name="q_${index}" value="${savedAns || ''}">
                    ` : `<p><strong>مسجل:</strong> ${savedAns || 'لا يوجد'}</p>`}
                </div>`;
        }
        else if (q.type.includes('spelling') || q.type === 'missing-letter') {
            const wordToSay = q.spellingWord || q.fullWord || 'كلمة';
            contentHTML += `
                <div class="spelling-area text-center">
                    ${!isReadOnly ? `<button class="btn btn-info mb-2" onclick="speakText('${wordToSay}')">🔊 استمع</button>` : ''}
                    
                    ${!isReadOnly ? `
                    <div class="canvas-tools mb-2" style="display:flex; justify-content:center; gap:5px;">
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'pen')">✏️</button>
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'eraser')">🧹</button>
                        <button class="btn btn-sm btn-danger" onclick="clearCanvas(${index})">❌</button>
                    </div>` : ''}

                    <canvas id="canvas_${index}" class="drawing-canvas" width="350" height="200" style="border:2px dashed #ccc; background:#fff; touch-action:none; pointer-events:${isReadOnly?'none':'auto'}"></canvas>
                    <input type="hidden" name="q_${index}" id="input_q_${index}" value="${savedAns || ''}">
                </div>`;
        }
        
        contentHTML += `</div>`; 
        card.innerHTML = contentHTML;
        container.appendChild(card);
        
        // تهيئة الكانفاس
        if (q.type.includes('spelling') || q.type === 'missing-letter') {
            setTimeout(() => initCanvas(index, savedAns, isReadOnly), 100);
        }
    });
}

// ==========================================
// 5. دوال التنقل (السابق / التالي)
// ==========================================

function showQuestion(index) {
    const total = currentOriginalTest.questions.length;
    
    // إخفاء جميع البطاقات
    document.querySelectorAll('.question-card').forEach(card => card.classList.remove('active'));
    
    // إظهار البطاقة الحالية
    const currentCard = document.getElementById(`card_q_${index}`);
    if(currentCard) currentCard.classList.add('active');
    
    // تحديث العداد
    document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${total}`;
    
    // التحكم في أزرار التنقل
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');

    if(btnPrev) btnPrev.disabled = (index === 0);
    
    if (index === total - 1) {
        if(btnNext) btnNext.style.display = 'none';
        // إظهار زر التسليم فقط إذا لم نكن في وضع القراءة (زر الخروج هو الموجود)
        if(btnSubmit && btnSubmit.textContent.includes('تسليم')) {
            btnSubmit.style.display = 'inline-block'; 
        }
    } else {
        if(btnNext) btnNext.style.display = 'inline-block';
        if(btnSubmit && btnSubmit.textContent.includes('تسليم')) {
            btnSubmit.style.display = 'none';
        }
    }
    
    currentQuestionIndex = index;
}

function navigateQuestion(direction) {
    // حفظ رسمة الكانفاس قبل الانتقال
    if(currentOriginalTest && currentOriginalTest.questions[currentQuestionIndex]) {
        const currentQType = currentOriginalTest.questions[currentQuestionIndex].type;
        if(currentQType.includes('spelling') || currentQType === 'missing-letter') {
            saveCanvasData(currentQuestionIndex);
        }
    }

    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < currentOriginalTest.questions.length) {
        showQuestion(newIndex);
    }
}

// ==========================================
// 6. الدوال المساعدة (التي كانت مفقودة)
// ==========================================

// دالة تحديد خيار (Radio Button)
function selectOption(label) {
    const parent = label.parentElement;
    // إزالة التحديد من الخيارات الأخرى في نفس السؤال
    parent.querySelectorAll('.answer-option').forEach(l => {
        l.classList.remove('selected');
        l.querySelector('input').checked = false;
    });
    // تحديد الخيار الحالي
    label.classList.add('selected');
    label.querySelector('input').checked = true;
}

// دالة نطق النص (لأسئلة الإملاء)
function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
    } else {
        alert('المتصفح لا يدعم نطق النصوص');
    }
}

// دالة التعرف الصوتي (لأسئلة القراءة)
function startSpeechRecognition(index) {
    if (!('webkitSpeechRecognition' in window)) {
        alert('متصفحك لا يدعم التعرف الصوتي (استخدم Chrome).');
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    
    const statusEl = document.getElementById(`record_status_${index}`);
    statusEl.textContent = '...جاري الاستماع';
    statusEl.style.color = 'red';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        statusEl.textContent = `تم التسجيل: "${transcript}"`;
        statusEl.style.color = 'green';
        // حفظ النص في الحقل المخفي
        const input = document.querySelector(`input[name="q_${index}"]`);
        if(input) input.value = transcript;
    };
    
    recognition.onerror = () => {
        statusEl.textContent = 'حدث خطأ. حاول مرة أخرى.';
        statusEl.style.color = 'orange';
    };
    
    recognition.start();
}

// --- دوال الكانفاس (الرسم) ---
function initCanvas(index, savedImage, isReadOnly) {
    const canvas = document.getElementById(`canvas_${index}`);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    if(savedImage) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = savedImage;
    }
    
    if(isReadOnly) return;

    let isDrawing = false;
    
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDraw = (e) => { isDrawing = true; ctx.beginPath(); const pos = getPos(e); ctx.moveTo(pos.x, pos.y); e.preventDefault(); };
    const draw = (e) => { 
        if(!isDrawing) return; 
        const pos = getPos(e); 
        ctx.lineTo(pos.x, pos.y); 
        ctx.stroke(); 
        e.preventDefault(); 
    };
    const endDraw = () => { isDrawing = false; saveCanvasData(index); };

    // Mouse Events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    // Touch Events
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', endDraw);
    
    canvases[index] = { ctx, canvas };
}

function setTool(index, tool) {
    if(!canvases[index]) return;
    const ctx = canvases[index].ctx;
    if(tool === 'pen') { 
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.lineWidth = 3; 
    } else if (tool === 'eraser') { 
        ctx.globalCompositeOperation = 'destination-out'; 
        ctx.lineWidth = 15; 
    }
}

function clearCanvas(index) {
    if(!canvases[index]) return;
    const { ctx, canvas } = canvases[index];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasData(index);
}

function saveCanvasData(index) {
    const canvas = document.getElementById(`canvas_${index}`);
    if(canvas) {
        const dataUrl = canvas.toDataURL();
        const input = document.getElementById(`input_q_${index}`);
        if(input) input.value = dataUrl;
    }
}

// ==========================================
// 7. دوال التجميع والحفظ والتسليم
// ==========================================

function collectAnswers() {
    // التأكد من حفظ الكانفاس للسؤال الحالي قبل التجميع
    if(currentOriginalTest && currentOriginalTest.questions[currentQuestionIndex]) {
        const type = currentOriginalTest.questions[currentQuestionIndex].type;
        if(type.includes('spelling') || type === 'missing-letter') {
            saveCanvasData(currentQuestionIndex);
        }
    }

    const answers = [];
    currentOriginalTest.questions.forEach((q, index) => {
        let studentAnswer = null;
        
        if (q.type.includes('multiple-choice')) {
            const selected = document.querySelector(`input[name="q_${index}"]:checked`);
            studentAnswer = selected ? selected.value : null;
        } else if (q.type.includes('reading') || q.type === 'drag-drop' || q.type === 'open-ended') {
            studentAnswer = document.querySelector(`[name="q_${index}"]`)?.value;
        } else if (q.type.includes('spelling') || q.type === 'missing-letter') {
            studentAnswer = document.getElementById(`input_q_${index}`)?.value;
        }
        
        // نحافظ على الملاحظات القديمة والدرجات إذا كانت موجودة
        const oldAnswers = JSON.parse(localStorage.getItem('studentTests')).find(t => t.id === currentTestId)?.answers || [];
        const oldAnsObj = oldAnswers.find(a => a.questionId === q.id);

        answers.push({ 
            questionId: q.id, 
            answer: studentAnswer,
            score: oldAnsObj?.score, // نحتفظ بالدرجة السابقة
            teacherNote: oldAnsObj?.teacherNote // نحتفظ بالملاحظة السابقة
        });
    });
    return answers;
}

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
    if (!confirm('هل أنت متأكد من تسليم الإجابات النهائية؟')) return;

    const answers = collectAnswers();
    // حساب درجة أولية (اختياري - المعلم سيعدلها)
    const score = 0; 

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    
    if (index !== -1) {
        studentTests[index].status = 'completed';
        studentTests[index].completedAt = new Date().toISOString();
        studentTests[index].score = score; // سيتم تعديلها من قبل المعلم
        studentTests[index].answers = answers;
        delete studentTests[index].savedAnswers;
        
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        alert(`تم التسليم بنجاح! سيقوم المعلم بمراجعة إجاباتك.`);
        closeTestFocusMode();
        loadStudentTests();
    }
}

function closeTestFocusMode() {
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentTestId = null;
}

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
        const note = ansObj?.teacherNote ? `<div style="background:#eee; padding:5px; margin-top:5px; border-right:3px solid #000;"><strong>ملاحظة المعلم:</strong> ${ansObj.teacherNote}</div>` : '';
        
        let displayAns = ans;
        if(q.type.includes('multiple-choice') && q.choices) displayAns = q.choices[ans] || ans;
        if(ans && ans.startsWith('data:image')) displayAns = `<br><img src="${ans}" style="max-height:100px; border:1px solid #ccc;">`;

        return `<div style="margin-bottom:20px; border-bottom:1px solid #ccc; padding-bottom:10px;">
            <p><strong>س${index+1}: ${q.text}</strong></p>
            <p>إجابة الطالب: ${displayAns}</p>
            ${note}
        </div>`;
    }).join('');

    printWindow.document.write(`
        <html dir="rtl" style="font-family:Tajawal, sans-serif;">
        <h2 style="text-align:center">${testDetails.title}</h2>
        <div style="text-align:center; margin-bottom:20px;">الدرجة النهائية: ${assignment.score}%</div>
        ${questionsHtml}
        <script>window.print()</script>
        </html>
    `);
    printWindow.document.close();
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

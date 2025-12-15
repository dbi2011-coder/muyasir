// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;
let canvases = {};
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

// 1. تحميل الاختبارات المعلقة
function loadPendingTests() {
    const container = document.getElementById('pendingTestsList');
    if (!container) return;

    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    const myTests = studentTests.filter(t => 
        t.studentId === currentStudent.id && 
        (t.status === 'pending' || t.status === 'in-progress')
    );

    if (myTests.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد اختبارات جديدة</h3></div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return '';

        const btnText = assignment.status === 'in-progress' ? '🔄 استكمال' : '🚀 ابدأ';
        const qCount = testDetails.questions ? testDetails.questions.length : 0;

        return `
            <div class="test-card pending">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status ${assignment.status === 'in-progress' ? 'status-accelerated' : 'status-pending'}">
                        ${assignment.status === 'in-progress' ? 'قيد التنفيذ' : 'جديد'}
                    </span>
                </div>
                <div class="card-meta">
                    <div class="meta-item"><span>📚 المادة:</span><strong>${testDetails.subject}</strong></div>
                    <div class="meta-item"><span>❓ الأسئلة:</span><strong>${qCount}</strong></div>
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
    // ... (نفس كود المرات السابقة للعرض المكتمل) ...
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
        return `
            <div class="test-card completed">
                <div class="card-header"><h3 class="card-title">${testDetails.title}</h3></div>
                <div class="card-meta">
                    <div class="meta-item"><span>⭐ الدرجة:</span><strong>${assignment.score}%</strong></div>
                    <div class="meta-item"><span>📅 التاريخ:</span><strong>${new Date(assignment.completedAt).toLocaleDateString('ar-SA')}</strong></div>
                </div>
            </div>`;
    }).join('');
}

// ==========================================
// 3. إدارة وضع التركيز (تم التحديث للتنقل خطوة بخطوة)
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
    currentQuestionIndex = 0; // إعادة تعيين للبداية

    document.getElementById('focusTestTitle').textContent = testDetails.title;
    
    // إعداد الشاشات
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
    
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    
    renderQuestions();
    showQuestion(0); // عرض السؤال الأول
}

// ==========================================
// 4. عرض الأسئلة والتنقل
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    canvases = {}; // تصفير الكانفاس

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const savedAns = answers.find(a => a.questionId === q.id)?.answer;
        const card = document.createElement('div');
        card.className = 'question-card'; // كلاس أساسي (مخفي بالـ CSS)
        card.dataset.index = index;
        card.id = `card_q_${index}`;
        
        let contentHTML = `<div class="question-number" style="background:#e3f2fd; color:#0d47a1; padding:5px 15px; border-radius:15px; display:inline-block; margin-bottom:10px;">سؤال ${index+1}</div>`;
        
        if(q.mediaUrl) {
            contentHTML += `<div class="media-container mb-3" style="text-align:center;"><img src="${q.mediaUrl}" style="max-width:100%; max-height:250px; border-radius:10px;"></div>`;
        }
        
        if(q.text) contentHTML += `<h3 class="question-text" style="font-size:1.4rem; margin-bottom:20px;">${q.text}</h3>`;
        
        contentHTML += `<div class="question-interaction-area">`;
        
        // --- بناء الواجهة حسب النوع ---
        if (q.type.includes('multiple-choice')) {
            if(q.choices) {
                q.choices.forEach((c, i) => {
                    const checked = savedAns == i ? 'checked' : '';
                    contentHTML += `
                        <label class="answer-option ${checked ? 'selected' : ''}" onclick="selectOption(this)">
                            <input type="radio" name="q_${index}" value="${i}" ${checked} ${isReadOnly?'disabled':''}> ${c}
                        </label>`;
                });
            }
        }
        else if (q.type === 'drag-drop') {
             contentHTML += `<p class="text-muted">رتب: ${q.dragItems}</p><input type="text" class="form-control" name="q_${index}" value="${savedAns || ''}">`;
        }
        else if (q.type === 'open-ended') {
            contentHTML += `<textarea class="form-control" name="q_${index}" rows="4" ${isReadOnly?'disabled':''}>${savedAns || ''}</textarea>`;
        }
        else if (q.type.includes('reading')) {
            contentHTML += `
                <div class="reading-area p-3 border rounded text-center">
                    <h4 class="mb-3" style="font-size:1.5rem;">${q.readingText}</h4>
                    ${!isReadOnly ? `
                    <button class="record-btn" onclick="startSpeechRecognition(${index})"><i class="fas fa-microphone"></i></button>
                    <p class="mt-2 text-muted" id="record_status_${index}">اضغط للتحدث</p>
                    <input type="hidden" name="q_${index}" value="${savedAns || ''}">
                    ` : `<p>مسجل</p>`}
                </div>`;
        }
        else if (q.type.includes('spelling') || q.type === 'missing-letter') {
            const wordToSay = q.spellingWord || q.fullWord || 'كلمة';
            contentHTML += `
                <div class="spelling-area text-center">
                    ${!isReadOnly ? `<button class="btn btn-info mb-2" onclick="speakText('${wordToSay}')">🔊 استمع</button>` : ''}
                    <div class="canvas-tools mb-2" style="display:flex; justify-content:center; gap:5px;">
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'pen')">✏️</button>
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'eraser')">🧹</button>
                        <button class="btn btn-sm btn-danger" onclick="clearCanvas(${index})">مسح</button>
                    </div>
                    <canvas id="canvas_${index}" class="drawing-canvas" width="350" height="200" style="border:2px dashed #ccc; background:#fff; touch-action:none;"></canvas>
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

// دالة التنقل بين الأسئلة
function showQuestion(index) {
    const total = currentOriginalTest.questions.length;
    
    // إخفاء الكل
    document.querySelectorAll('.question-card').forEach(card => card.classList.remove('active'));
    
    // إظهار الحالي
    const currentCard = document.getElementById(`card_q_${index}`);
    if(currentCard) currentCard.classList.add('active');
    
    // تحديث العداد
    document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${total}`;
    
    // التحكم في الأزرار
    document.getElementById('btnPrev').disabled = (index === 0); // تعطيل "السابق" في أول سؤال
    
    if (index === total - 1) {
        // وصلنا للسؤال الأخير
        document.getElementById('btnNext').style.display = 'none';
        document.getElementById('btnSubmit').style.display = 'inline-block';
    } else {
        // لسا في أسئلة
        document.getElementById('btnNext').style.display = 'inline-block';
        document.getElementById('btnSubmit').style.display = 'none';
    }
    
    currentQuestionIndex = index;
}

function navigateQuestion(direction) {
    // قبل الانتقال، نحفظ حالة الكانفاس إذا كان السؤال الحالي به رسم
    const currentQType = currentOriginalTest.questions[currentQuestionIndex].type;
    if(currentQType.includes('spelling') || currentQType === 'missing-letter') {
        saveCanvasData(currentQuestionIndex);
    }

    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < currentOriginalTest.questions.length) {
        showQuestion(newIndex);
    }
}

// ==========================================
// 5. أدوات (الرسم والصوت) + الحفظ
// ==========================================
// (نفس دوال initCanvas, speakText, startSpeechRecognition, selectOption من الرد السابق تماماً.. يجب نسخها هنا)

function initCanvas(index, savedImage, isReadOnly) {
    const canvas = document.getElementById(`canvas_${index}`);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000000';
    
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
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => { isDrawing = true; ctx.beginPath(); const pos = getPos(e); ctx.moveTo(pos.x, pos.y); e.preventDefault(); };
    const draw = (e) => { if(!isDrawing) return; const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); e.preventDefault(); };
    const endDraw = () => { isDrawing = false; saveCanvasData(index); };

    canvas.addEventListener('mousedown', startDraw); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, {passive: false}); canvas.addEventListener('touchmove', draw, {passive: false}); canvas.addEventListener('touchend', endDraw);
    canvases[index] = { ctx, canvas };
}

function setTool(index, tool) {
    const ctx = canvases[index].ctx;
    if(tool === 'pen') { ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = 3; }
    else if (tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 15; }
}

function clearCanvas(index) {
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

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
    } else {
        alert('المتصفح لا يدعم النطق');
    }
}

function startSpeechRecognition(index) {
    if (!('webkitSpeechRecognition' in window)) {
        alert('متصفحك لا يدعم التعرف الصوتي (استخدم Chrome).');
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    const statusEl = document.getElementById(`record_status_${index}`);
    statusEl.textContent = '...';
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        statusEl.textContent = `تم: "${transcript}"`;
        document.querySelector(`input[name="q_${index}"]`).value = transcript;
    };
    recognition.start();
}

function selectOption(label) {
    const parent = label.parentElement;
    parent.querySelectorAll('.answer-option').forEach(l => l.classList.remove('selected'));
    label.classList.add('selected');
    label.querySelector('input').checked = true;
}

function collectAnswers() {
    // التأكد من حفظ آخر رسمة
    const currentQType = currentOriginalTest.questions[currentQuestionIndex].type;
    if(currentQType.includes('spelling') || currentQType === 'missing-letter') {
        saveCanvasData(currentQuestionIndex);
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
        answers.push({ questionId: q.id, answer: studentAnswer });
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
        document.getElementById('testFocusMode').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadStudentTests();
    }
}

function submitTestAnswers() {
    if (!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;
    const answers = collectAnswers();
    const score = 100; // منطق التصحيح
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === currentTestId);
    if (index !== -1) {
        studentTests[index].status = 'completed';
        studentTests[index].completedAt = new Date().toISOString();
        studentTests[index].score = score;
        studentTests[index].answers = answers;
        delete studentTests[index].savedAnswers;
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        alert(`تم التسليم!`);
        document.getElementById('testFocusMode').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadStudentTests();
    }
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

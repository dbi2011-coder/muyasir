// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;
let canvases = {}; // لتخزين مراجع لوحات الرسم

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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3>لا توجد اختبارات جديدة</h3>
            </div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return '';

        const btnText = assignment.status === 'in-progress' ? '🔄 استكمال' : '🚀 ابدأ';
        const badgeClass = assignment.status === 'in-progress' ? 'status-accelerated' : 'status-pending';
        const badgeText = assignment.status === 'in-progress' ? 'قيد التنفيذ' : 'جديد';
        const qCount = testDetails.questions ? testDetails.questions.length : 0;

        return `
            <div class="test-card pending">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    <span class="card-status ${badgeClass}">${badgeText}</span>
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
                        <strong>${new Date(assignment.completedAt).toLocaleDateString('ar-SA')}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// 3. إدارة وضع التركيز (Focus Mode) - الدالة المفقودة
// ==========================================

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
    
    // إعادة تعيين الشاشات
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
    
    // إظهار الواجهة البيضاء الكاملة
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    
    renderQuestions();
}

// ==========================================
// 4. عرض الأسئلة (الأنواع الـ 9)
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const savedAns = answers.find(a => a.questionId === q.id)?.answer;
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `card_q_${index}`;
        
        let contentHTML = `<div class="question-number">سؤال ${index+1}</div>`;
        
        // عرض المرفقات
        if(q.mediaUrl) {
            contentHTML += `<div class="media-container mb-3" style="text-align:center;">
                <img src="${q.mediaUrl}" style="max-width:100%; max-height:300px; border-radius:10px; border:1px solid #ddd;">
            </div>`;
        }
        
        if(q.text) contentHTML += `<h3 class="question-text">${q.text}</h3>`;
        
        contentHTML += `<div class="question-interaction-area" id="interaction_${index}">`;
        
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
             // يمكن تطوير واجهة سحب وإفلات هنا، حالياً سنعرضها كاختيار للمحاكاة
             contentHTML += `<p class="text-muted">قم بترتيب العناصر: ${q.dragItems}</p>
             <input type="text" class="form-control" name="q_${index}" value="${savedAns || ''}" placeholder="اكتب الترتيب الصحيح...">`;
        }
        else if (q.type === 'open-ended') {
            contentHTML += `<textarea class="form-control" name="q_${index}" rows="3" ${isReadOnly?'disabled':''}>${savedAns || ''}</textarea>`;
        }
        else if (q.type === 'ai-reading' || q.type === 'manual-reading') {
            contentHTML += `
                <div class="reading-area p-3 border rounded text-center">
                    <h4 class="mb-3" style="line-height:1.8; font-size:1.5rem;">${q.readingText}</h4>
                    ${!isReadOnly ? `
                    <button class="record-btn" onclick="startSpeechRecognition(${index})"><i class="fas fa-microphone"></i></button>
                    <p class="mt-2 text-muted" id="record_status_${index}">اضغط للتحدث</p>
                    <input type="hidden" name="q_${index}" value="${savedAns || ''}">
                    ` : `<p>الإجابة المسجلة: ${savedAns || 'لا يوجد'}</p>`}
                </div>`;
        }
        else if (q.type === 'ai-spelling' || q.type === 'manual-spelling' || q.type === 'missing-letter') {
            const wordToSay = q.spellingWord || q.fullWord || 'كلمة';
            contentHTML += `
                <div class="spelling-area text-center">
                    ${!isReadOnly ? `<button class="btn btn-info mb-2" onclick="speakText('${wordToSay}')">🔊 استمع للكلمة</button>` : ''}
                    
                    <div class="canvas-tools mb-2" style="display:flex; justify-content:center; gap:5px;">
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'pen')">✏️ قلم</button>
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'eraser')">🧹 ممحاة</button>
                        <button class="btn btn-sm btn-danger" onclick="clearCanvas(${index})">مسح الكل</button>
                    </div>
                    <canvas id="canvas_${index}" class="drawing-canvas" width="400" height="200" style="border:2px dashed #ccc; background:#fff; touch-action:none;"></canvas>
                    <input type="hidden" name="q_${index}" id="input_q_${index}" value="${savedAns || ''}">
                </div>`;
        }
        
        contentHTML += `</div>`; 
        card.innerHTML = contentHTML;
        container.appendChild(card);
        
        // تهيئة الكانفاس بعد إضافته
        if (q.type.includes('spelling') || q.type === 'missing-letter') {
            setTimeout(() => initCanvas(index, savedAns, isReadOnly), 100);
        }
    });
}

// ==========================================
// 5. أدوات الرسم والصوت
// ==========================================

function initCanvas(index, savedImage, isReadOnly) {
    const canvas = document.getElementById(`canvas_${index}`);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    // استعادة الرسمة
    if(savedImage) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = savedImage;
    }
    
    if(isReadOnly) return;

    let isDrawing = false;
    
    // دالة للحصول على الإحداثيات الصحيحة (للموبايل والكمبيوتر)
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

    // Mouse
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    
    // Touch
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', endDraw);
    
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
    const dataUrl = canvas.toDataURL();
    const input = document.getElementById(`input_q_${index}`);
    if(input) input.value = dataUrl;
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
    statusEl.textContent = 'جاري الاستماع...';
    statusEl.style.color = 'red';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        statusEl.textContent = `تم التسجيل: "${transcript}"`;
        statusEl.style.color = 'green';
        document.querySelector(`input[name="q_${index}"]`).value = transcript;
    };
    
    recognition.start();
}

// ==========================================
// 6. الحفظ والتسليم
// ==========================================

function selectOption(label) {
    const parent = label.parentElement;
    parent.querySelectorAll('.answer-option').forEach(l => l.classList.remove('selected'));
    label.classList.add('selected');
    label.querySelector('input').checked = true;
}

function collectAnswers() {
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
        
        closeTestFocusMode();
        loadStudentTests();
    }
}

function submitTestAnswers() {
    if (!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;

    const answers = collectAnswers();
    // هنا يمكن إضافة منطق تصحيح بسيط أو وضع درجة افتراضية
    // للتبسيط: نعتبر أي إجابة بمثابة مشاركة ونعطي درجة كاملة، التصحيح الفعلي يحتاج منطق لكل نوع
    const score = 100; 

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
        closeTestFocusMode();
        loadStudentTests();
    }
}

function closeTestFocusMode() {
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentTestId = null;
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

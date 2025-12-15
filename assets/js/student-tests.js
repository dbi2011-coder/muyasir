// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;
let canvases = {};
let currentQuestionIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('allTestsList')) {
        loadAllTests();
    }
});

// دالة واحدة لتحميل وعرض كل الاختبارات
function loadAllTests() {
    const container = document.getElementById('allTestsList');
    if (!container) return;

    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

    // تصفية اختبارات الطالب الحالي فقط
    let myTests = studentTests.filter(t => t.studentId === currentStudent.id);

    if (myTests.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><h3>لا توجد اختبارات مسندة إليك حالياً</h3></div>`;
        return;
    }

    // ترتيب الاختبارات حسب الأهمية:
    // 1. المعاد للتعديل (Returned)
    // 2. قيد التنفيذ (In-Progress)
    // 3. الجديد (Pending)
    // 4. المكتمل (Completed)
    myTests.sort((a, b) => {
        const priority = { 'returned': 1, 'in-progress': 2, 'pending': 3, 'completed': 4 };
        return priority[a.status] - priority[b.status];
    });

    container.innerHTML = myTests.map(assignment => {
        const testDetails = allTests.find(t => t.id === assignment.testId);
        if (!testDetails) return ''; // تخطي الاختبارات المحذوفة

        // تحديد النصوص والألوان والأزرار بناءً على الحالة
        let statusBadge = '';
        let actionButtons = '';
        let extraInfo = '';
        const qCount = testDetails.questions ? testDetails.questions.length : 0;

        if (assignment.status === 'pending') {
            statusBadge = '<span class="card-status status-new">جديد</span>';
            actionButtons = `<button class="btn btn-success btn-block" onclick="openTestFocusMode(${assignment.id})">🚀 ابدأ الاختبار</button>`;
        } 
        else if (assignment.status === 'in-progress') {
            statusBadge = '<span class="card-status status-progress">قيد التنفيذ</span>';
            actionButtons = `<button class="btn btn-warning btn-block" onclick="openTestFocusMode(${assignment.id})">🔄 استكمال الحل</button>`;
        } 
        else if (assignment.status === 'returned') {
            statusBadge = '<span class="card-status status-returned">⚠️ معاد للتعديل</span>';
            extraInfo = '<p class="text-danger small mt-2">طلب المعلم مراجعة وتعديل الإجابات.</p>';
            actionButtons = `<button class="btn btn-danger btn-block" onclick="openTestFocusMode(${assignment.id})">✏️ تعديل الإجابات</button>`;
        } 
        else if (assignment.status === 'completed') {
            statusBadge = '<span class="card-status status-completed">منجز</span>';
            let scoreColor = assignment.score >= 80 ? 'green' : (assignment.score >= 50 ? 'orange' : 'red');
            extraInfo = `<div class="meta-item"><span>⭐ الدرجة:</span><strong style="color:${scoreColor}">${assignment.score}%</strong></div>`;
            actionButtons = `
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-primary btn-sm flex-1" onclick="viewCompletedTest(${assignment.id})">👁️ عرض</button>
                    <button class="btn btn-secondary btn-sm" onclick="printTest(${assignment.id})">🖨️ طباعة</button>
                </div>`;
        }

        return `
            <div class="test-card">
                <div class="card-header">
                    <h3 class="card-title">${testDetails.title}</h3>
                    ${statusBadge}
                </div>
                <div class="card-meta">
                    <div class="meta-item"><span>📚 المادة:</span><strong>${testDetails.subject}</strong></div>
                    <div class="meta-item"><span>❓ الأسئلة:</span><strong>${qCount}</strong></div>
                    ${extraInfo}
                </div>
                <div class="card-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// إدارة وضع التركيز (Focus Mode) - حل وتعديل
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

    document.getElementById('focusTestTitle').textContent = testDetails.title;
    
    // شاشات
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';

    // نصوص الشاشة الترحيبية
    const titleEl = document.querySelector('#testStartScreen h1');
    const descEl = document.querySelector('#testStartScreen p');
    const btnEl = document.querySelector('#testStartScreen button');
    
    if(assignment.status === 'returned') {
        titleEl.textContent = 'إعادة المحاولة';
        descEl.textContent = 'راجع ملاحظات المعلم وعدل الإجابات الخاطئة.';
        btnEl.textContent = 'تعديل الإجابات';
    } else {
        titleEl.textContent = 'جاهز؟';
        descEl.textContent = 'ركز جيداً، يمكنك التنقل ومراجعة إجاباتك قبل التسليم.';
        btnEl.textContent = 'ابدأ الاختبار';
    }
    
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    
    // إعداد أزرار الفوتر الافتراضية للحل
    document.getElementById('testFooterControls').innerHTML = `
        <button id="btnPrev" class="btn-nav btn-prev" onclick="navigateQuestion(-1)">السابق</button>
        <button id="btnSave" class="btn-nav btn-save" onclick="saveTestProgress()">حفظ التقدم</button>
        <button id="btnNext" class="btn-nav btn-next" onclick="navigateQuestion(1)">التالي</button>
        <button id="btnSubmit" class="btn-nav btn-submit" style="display: none;" onclick="submitTestAnswers()">تسليم نهائي</button>
    `;
    document.getElementById('testFooterControls').style.display = 'flex';
    
    renderQuestions(false); // قابل للتعديل
    showQuestion(0);
}

// ==========================================
// إدارة عرض المنجز (للاطلاع فقط)
// ==========================================

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
    
    // أزرار الفوتر للاطلاع
    document.getElementById('testFooterControls').innerHTML = `
        <button id="btnPrev" class="btn-nav btn-prev" onclick="navigateQuestion(-1)">السابق</button>
        <button class="btn-nav btn-save" onclick="printTest(${assignmentId})">🖨️ طباعة</button>
        <button id="btnNext" class="btn-nav btn-next" onclick="navigateQuestion(1)">التالي</button>
        <button class="btn-nav btn-submit" onclick="closeTestFocusMode()">خروج</button>
    `;
    document.getElementById('testFooterControls').style.display = 'flex';
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 

    renderQuestions(true); // للقراءة فقط
    showQuestion(0);
}

// ==========================================
// باقي الدوال (العرض، التنقل، الأدوات) - ثابتة
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    canvases = {};

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const ansObj = answers.find(a => a.questionId === q.id);
        const savedAns = ansObj?.answer;
        const teacherNote = ansObj?.teacherNote;

        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `card_q_${index}`;
        
        let contentHTML = `<div class="question-number" style="background:#e3f2fd; color:#0d47a1; padding:5px 15px; border-radius:15px; display:inline-block; margin-bottom:10px;">سؤال ${index+1}</div>`;

        if (teacherNote) {
            contentHTML += `
            <div class="teacher-note-alert" style="background:#fff3cd; color:#856404; padding:10px; border-radius:5px; margin-bottom:10px; border-right:4px solid #ffeeba;">
                <strong>📝 ملاحظة المعلم:</strong> ${teacherNote}
            </div>`;
        }
        
        if(q.mediaUrl) {
            contentHTML += `<div class="media-container mb-3" style="text-align:center;"><img src="${q.mediaUrl}" style="max-width:100%; max-height:250px; border-radius:10px;"></div>`;
        }
        
        if(q.text) contentHTML += `<h3 class="question-text" style="font-size:1.4rem; margin-bottom:20px;">${q.text}</h3>`;
        
        contentHTML += `<div class="question-interaction-area">`;
        
        // Render types
        if (q.type.includes('multiple-choice')) {
            if(q.choices) {
                q.choices.forEach((c, i) => {
                    const checked = savedAns == i ? 'checked' : '';
                    contentHTML += `<label class="answer-option ${checked ? 'selected' : ''}" ${!isReadOnly ? 'onclick="selectOption(this)"' : ''}><input type="radio" name="q_${index}" value="${i}" ${checked} ${isReadOnly?'disabled':''}> ${c}</label>`;
                });
            }
        }
        else if (q.type === 'drag-drop') {
             contentHTML += `<p class="text-muted">رتب: ${q.dragItems || ''}</p><input type="text" class="form-control" name="q_${index}" value="${savedAns || ''}" ${isReadOnly?'disabled':''}>`;
        }
        else if (q.type === 'open-ended') {
            contentHTML += `<textarea class="form-control" name="q_${index}" rows="4" ${isReadOnly?'disabled':''}>${savedAns || ''}</textarea>`;
        }
        else if (q.type.includes('reading')) {
            contentHTML += `
                <div class="reading-area p-3 border rounded text-center">
                    <h4 class="mb-3">${q.readingText || ''}</h4>
                    ${!isReadOnly ? `<button class="record-btn" onclick="startSpeechRecognition(${index})"><i class="fas fa-microphone"></i></button><p class="mt-2 text-muted" id="record_status_${index}">تحدث</p><input type="hidden" name="q_${index}" value="${savedAns || ''}">` : `<p>مسجل</p>`}
                </div>`;
        }
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

// التنقل
function showQuestion(index) {
    const total = currentOriginalTest.questions.length;
    document.querySelectorAll('.question-card').forEach(card => card.classList.remove('active'));
    const currentCard = document.getElementById(`card_q_${index}`);
    if(currentCard) currentCard.classList.add('active');
    
    document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${total}`;
    
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');

    if(btnPrev) btnPrev.disabled = (index === 0);
    
    if (index === total - 1) {
        if(btnNext) btnNext.style.display = 'none';
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
        const type = currentOriginalTest.questions[currentQuestionIndex].type;
        if(type.includes('spelling') || type === 'missing-letter') {
            saveCanvasData(currentQuestionIndex);
        }
    }
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < currentOriginalTest.questions.length) {
        showQuestion(newIndex);
    }
}

// أدوات مساعدة
function selectOption(label) {
    label.parentElement.querySelectorAll('.answer-option').forEach(l => {
        l.classList.remove('selected'); l.querySelector('input').checked = false;
    });
    label.classList.add('selected'); label.querySelector('input').checked = true;
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text); u.lang = 'ar-SA'; window.speechSynthesis.speak(u);
    } else alert('لا يدعم النطق');
}

function startSpeechRecognition(index) {
    if (!('webkitSpeechRecognition' in window)) { alert('استخدم Chrome'); return; }
    const r = new webkitSpeechRecognition(); r.lang = 'ar-SA'; r.continuous = false;
    const s = document.getElementById(`record_status_${index}`); s.textContent = '...';
    r.onresult = (e) => {
        const t = e.results[0][0].transcript; s.textContent = `تم: "${t}"`;
        document.querySelector(`input[name="q_${index}"]`).value = t;
    };
    r.start();
}

function initCanvas(index, savedImage, isReadOnly) {
    const c = document.getElementById(`canvas_${index}`); if(!c) return;
    const ctx = c.getContext('2d'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
    if(savedImage) { const i = new Image(); i.onload = () => ctx.drawImage(i,0,0); i.src = savedImage; }
    if(isReadOnly) return;
    let drawing = false;
    const getPos = (e) => { 
        const r = c.getBoundingClientRect(); 
        const x = e.touches ? e.touches[0].clientX : e.clientX; 
        const y = e.touches ? e.touches[0].clientY : e.clientY; 
        return { x: x - r.left, y: y - r.top }; 
    };
    const start = (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move = (e) => { if(!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const end = () => { drawing = false; saveCanvasData(index); };
    c.addEventListener('mousedown', start); c.addEventListener('mousemove', move); c.addEventListener('mouseup', end);
    c.addEventListener('touchstart', start, {passive:false}); c.addEventListener('touchmove', move, {passive:false}); c.addEventListener('touchend', end);
    canvases[index] = {ctx, c};
}

function setTool(index, t) { if(canvases[index]) { const x = canvases[index].ctx; if(t==='pen') { x.globalCompositeOperation='source-over'; x.lineWidth=3; } else { x.globalCompositeOperation='destination-out'; x.lineWidth=15; } } }
function clearCanvas(index) { if(canvases[index]) { const {ctx, c} = canvases[index]; ctx.clearRect(0,0,c.width,c.height); saveCanvasData(index); } }
function saveCanvasData(index) { const c = document.getElementById(`canvas_${index}`); if(c) document.getElementById(`input_q_${index}`).value = c.toDataURL(); }

// حفظ وتسليم
function collectAnswers() {
    // Save last canvas
    if(currentOriginalTest && currentOriginalTest.questions[currentQuestionIndex]) {
        const type = currentOriginalTest.questions[currentQuestionIndex].type;
        if(type.includes('spelling') || type === 'missing-letter') saveCanvasData(currentQuestionIndex);
    }
    const answers = [];
    currentOriginalTest.questions.forEach((q, index) => {
        let val = null;
        if (q.type.includes('multiple-choice')) {
            const sel = document.querySelector(`input[name="q_${index}"]:checked`); val = sel ? sel.value : null;
        } else if (q.type.includes('reading') || q.type === 'drag-drop' || q.type === 'open-ended') {
            val = document.querySelector(`[name="q_${index}"]`)?.value;
        } else if (q.type.includes('spelling') || q.type === 'missing-letter') {
            val = document.getElementById(`input_q_${index}`)?.value;
        }
        // Preserve old meta data
        const old = JSON.parse(localStorage.getItem('studentTests')).find(t => t.id === currentTestId)?.answers || [];
        const oldObj = old.find(a => a.questionId === q.id);
        answers.push({ questionId: q.id, answer: val, score: oldObj?.score, teacherNote: oldObj?.teacherNote });
    });
    return answers;
}

function saveTestProgress() {
    const ans = collectAnswers();
    const tests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = tests.findIndex(t => t.id === currentTestId);
    if(idx !== -1) {
        tests[idx].status = 'in-progress';
        tests[idx].savedAnswers = ans;
        localStorage.setItem('studentTests', JSON.stringify(tests));
        closeTestFocusMode();
        loadAllTests();
    }
}

function submitTestAnswers() {
    if(!confirm('تسليم نهائي؟')) return;
    const ans = collectAnswers();
    const tests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = tests.findIndex(t => t.id === currentTestId);
    if(idx !== -1) {
        tests[idx].status = 'completed';
        tests[idx].completedAt = new Date().toISOString();
        tests[idx].score = 0; // المعلم يصحح
        tests[idx].answers = ans;
        delete tests[idx].savedAnswers;
        localStorage.setItem('studentTests', JSON.stringify(tests));
        alert('تم التسليم!');
        closeTestFocusMode();
        loadAllTests();
    }
}

function closeTestFocusMode() {
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentTestId = null;
}

function printTest(assignmentId) {
    const assignment = JSON.parse(localStorage.getItem('studentTests')).find(t => t.id === assignmentId);
    const test = JSON.parse(localStorage.getItem('tests')).find(t => t.id === assignment.testId);
    const w = window.open('', '_blank');
    const qHtml = test.questions.map((q, i) => {
        const a = assignment.answers.find(x => x.questionId === q.id);
        let val = a ? a.answer : '-';
        if(q.type.includes('multiple-choice') && q.choices) val = q.choices[val] || val;
        if(val && val.startsWith('data:image')) val = `<br><img src="${val}" height="80">`;
        const note = a?.teacherNote ? `<br><b>ملاحظة:</b> ${a.teacherNote}` : '';
        return `<div style="border-bottom:1px solid #ccc; padding:10px;"><b>س${i+1}: ${q.text}</b><br>ج: ${val}${note}</div>`;
    }).join('');
    w.document.write(`<html dir="rtl"><h2 style="text-align:center">${test.title}</h2>${qHtml}<script>window.print()</script></html>`);
    w.document.close();
}

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }

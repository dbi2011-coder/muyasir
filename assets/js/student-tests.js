// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: محرك عرض الاختبارات (يدعم جميع أنواع الأسئلة)
// ============================================

let currentTest = null;
let currentAssignment = null;
let currentQuestionIndex = 0;
let userAnswers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadMyTests();
});

// 1. عرض قائمة الاختبارات
function loadMyTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}').user;
    if (!currentUser) return;

    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    const myTests = allAssignments.filter(t => t.studentId === currentUser.id);

    if (myTests.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📝</div>
                <h3>لا توجد اختبارات</h3>
            </div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const originalTest = allTestsLib.find(t => t.id === assignment.testId);
        if (!originalTest) return '';

        let statusText = 'جديد', statusClass = 'status-new', btnText = 'بدء', btnClass = 'btn-primary';
        if (assignment.status === 'in-progress') { statusText = 'جاري الحل'; statusClass = 'status-progress'; btnText = 'متابعة'; btnClass = 'btn-warning'; }
        else if (assignment.status === 'completed') { statusText = 'مكتمل'; statusClass = 'status-completed'; btnText = 'مراجعة'; btnClass = 'btn-success'; }
        else if (assignment.status === 'returned') { statusText = 'معاد'; statusClass = 'status-returned'; btnText = 'تعديل'; btnClass = 'btn-danger'; }

        return `
            <div class="test-card">
                <div class="card-header"><span class="card-status ${statusClass}">${statusText}</span><small>${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</small></div>
                <h3>${originalTest.title}</h3>
                <p class="text-muted small">${originalTest.description || ''}</p>
                <div class="mt-3 d-flex justify-content-between">
                    <span class="badge badge-secondary">${originalTest.questions?.length || 0} أسئلة</span>
                    <button class="btn btn-sm ${btnClass}" onclick="openTestMode(${assignment.id})">${btnText}</button>
                </div>
            </div>`;
    }).join('');
}

// 2. فتح وضع الاختبار
function openTestMode(assignmentId) {
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    
    currentAssignment = allAssignments.find(a => a.id === assignmentId);
    if (!currentAssignment) return;
    currentTest = allTestsLib.find(t => t.id === currentAssignment.testId);
    if (!currentTest) return;

    userAnswers = currentAssignment.answers || [];
    
    document.getElementById('focusTestTitle').textContent = currentTest.title;
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (currentAssignment.status === 'completed') alert('وضع المراجعة: لا يمكن تعديل الإجابات.');

    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    renderAllQuestions();
    showQuestion(0);
}

// 3. محرك عرض الأسئلة (النسخة المطورة)
function renderAllQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';

    currentTest.questions.forEach((q, index) => {
        const savedAns = userAnswers.find(a => a.questionId === q.id);
        const ansValue = savedAns ? savedAns.answer : null;

        let qHtml = `
            <div class="question-card" id="q-card-${index}">
                <div class="question-number">سؤال ${index + 1}</div>
                <h3 class="question-text">${q.text || 'سؤال'}</h3>
        `;

        // عرض المرفق (الصورة)
        if (q.attachment) {
            qHtml += `<div class="text-center mb-3"><img src="${q.attachment}" style="max-height:200px; border-radius:8px; border:1px solid #ddd;"></div>`;
        }

        // --- معالجة الأنواع المختلفة --- //
        
        // أ) اختيار من متعدد (MCQ)
        if (q.type.includes('mcq')) {
            qHtml += `<div class="options-list">`;
            (q.choices || []).forEach((choice, i) => {
                const isSel = (ansValue == i) ? 'selected' : '';
                qHtml += `<label class="answer-option ${isSel}" onclick="selectOption(this, ${index}, ${i})">
                            <input type="radio" name="q_${q.id}" value="${i}" ${ansValue == i ? 'checked' : ''}> ${choice}
                          </label>`;
            });
            qHtml += `</div>`;
        }

        // ب) الحرف الناقص (Missing Character)
        else if (q.type === 'missing-char') {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                // نبحث عن إجابة محفوظة لهذه الفقرة
                let val = '';
                if(ansValue && ansValue[`p_${pIdx}`]) val = ansValue[`p_${pIdx}`];
                
                qHtml += `
                    <div class="mb-4 p-3" style="background:#f9f9f9; border-radius:10px; border:1px solid #eee;">
                        <h4 style="letter-spacing:2px; color:#555; margin-bottom:15px; font-size:1.5rem; text-align:center;">${p.missing || p.text}</h4>
                        <div class="form-group">
                            <label>اكتب الكلمة كاملة:</label>
                            <input type="text" class="form-control" 
                                   onchange="saveInputAnswer(${index}, 'p_${pIdx}', this.value)" 
                                   value="${val}" placeholder="الإجابة هنا...">
                        </div>
                    </div>`;
            });
            qHtml += `</div>`;
        }

        // ج) القراءة (Reading)
        else if (q.type.includes('reading')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                qHtml += `
                    <div class="reading-box p-4 mb-3" style="background:#fff3e0; border-right:5px solid #ff9800; border-radius:5px;">
                        <p style="font-size:1.4rem; line-height:1.8;">${p.text}</p>
                    </div>
                    <div class="text-center mb-4">
                        <button class="btn btn-outline-primary"><i class="fas fa-microphone"></i> اضغط للتسجيل (محاكاة)</button>
                    </div>`;
            });
            qHtml += `</div>`;
        }

        // د) الإملاء (Spelling - Drawing)
        else if (q.type.includes('spelling')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                // لا نعرض النص الأصلي للطالب في الإملاء!
                qHtml += `
                    <div class="mb-4 text-center">
                        <button class="btn btn-info mb-2" onclick="playAudio('${p.text}')">🔊 استمع للكلمة</button>
                        <p class="text-muted small">ارسم الكلمة التي سمعتها في الأسفل</p>
                        <canvas id="canvas-${q.id}-${pIdx}" class="drawing-canvas" width="500" height="200" style="border:2px dashed #ccc; background:#fff; cursor:crosshair;"></canvas>
                        <button class="btn btn-sm btn-secondary mt-1" onclick="clearCanvas('${q.id}-${pIdx}')">مسح</button>
                    </div>`;
            });
            qHtml += `</div>`;
        }

        // هـ) السحب والإفلات (Drag Drop)
        else if (q.type === 'drag-drop') {
            (q.paragraphs || []).forEach((p, pIdx) => {
                let processedText = p.text;
                let draggables = [];
                if (p.gaps) {
                    p.gaps.forEach((g, gIdx) => {
                        // استرجاع الإجابة
                        let saved = '';
                        if(ansValue && ansValue[`p_${pIdx}_g_${gIdx}`]) saved = ansValue[`p_${pIdx}_g_${gIdx}`];

                        const dropId = `drop-${q.id}-${pIdx}-${gIdx}`;
                        processedText = processedText.replace(g.dragItem, `<span class="drop-zone" id="${dropId}" ondrop="drop(event)" ondragover="allowDrop(event)" data-qid="${index}" data-pid="${pIdx}" data-gid="${gIdx}">${saved}</span>`);
                        draggables.push(g.dragItem);
                    });
                }
                qHtml += `
                    <div class="word-bank">
                        ${draggables.sort(()=>Math.random()-0.5).map(w => `<div class="draggable-word" draggable="true" ondragstart="drag(event)" id="w-${Math.random()}">${w}</div>`).join('')}
                    </div>
                    <div class="sentence-area">${processedText}</div>
                `;
            });
        }

        // و) سؤال مفتوح
        else if (q.type === 'open-ended') {
            qHtml += `<textarea class="form-control" rows="4" placeholder="اكتب إجابتك هنا..." onchange="saveSimpleAnswer(${index}, this.value)">${ansValue || ''}</textarea>`;
        }

        qHtml += `</div>`; // إغلاق البطاقة
        container.insertAdjacentHTML('beforeend', qHtml);
    });

    updateNavigationButtons();
}

// 4. التنقل والتحكم
function showQuestion(index) {
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active'));
    const card = document.getElementById(`q-card-${index}`);
    if(card) {
        card.classList.add('active');
        currentQuestionIndex = index;
        document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${currentTest.questions.length}`;
        updateNavigationButtons();
        
        // تهيئة الكانفاس إذا وجد في السؤال الحالي
        const q = currentTest.questions[index];
        if (q.type.includes('spelling')) {
            (q.paragraphs || []).forEach((p, pIdx) => initCanvas(`${q.id}-${pIdx}`));
        }
    }
}

function nextQuestion() {
    saveCurrentCanvas(); // حفظ الرسم قبل الانتقال
    if (currentQuestionIndex < currentTest.questions.length - 1) showQuestion(currentQuestionIndex + 1);
}
function prevQuestion() {
    saveCurrentCanvas();
    if (currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1);
}

function updateNavigationButtons() {
    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === currentTest.questions.length - 1;
    document.getElementById('testFooterControls').innerHTML = `
        <button class="btn-nav btn-prev" onclick="prevQuestion()" ${isFirst ? 'disabled' : ''}>السابق</button>
        <div>
            <button class="btn-nav btn-save" onclick="saveTestProgress(false)">حفظ مؤقت</button>
            ${isLast ? '<button class="btn-nav btn-submit" onclick="finishTest()">تسليم الاختبار</button>' : '<button class="btn-nav btn-next" onclick="nextQuestion()">التالي</button>'}
        </div>`;
}

// 5. حفظ الإجابات
// حفظ الاختيار من متعدد
function selectOption(el, qIdx, choiceIdx) {
    const card = document.getElementById(`q-card-${qIdx}`);
    card.querySelectorAll('.answer-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input').checked = true;
    
    // حفظ في المصفوفة
    const qId = currentTest.questions[qIdx].id;
    updateUserAnswer(qId, choiceIdx);
}

// حفظ الحقول النصية (الحرف الناقص / المفتوح)
function saveInputAnswer(qIdx, key, val) {
    const qId = currentTest.questions[qIdx].id;
    let entry = userAnswers.find(a => a.questionId === qId);
    if (!entry) {
        entry = { questionId: qId, answer: {} };
        userAnswers.push(entry);
    }
    // إذا كان الجواب كائن (للفقرات المتعددة) أو قيمة مفردة
    if (typeof entry.answer !== 'object') entry.answer = {}; 
    entry.answer[key] = val;
}

function saveSimpleAnswer(qIdx, val) {
    const qId = currentTest.questions[qIdx].id;
    updateUserAnswer(qId, val);
}

function updateUserAnswer(qId, val) {
    const idx = userAnswers.findIndex(a => a.questionId === qId);
    if(idx !== -1) userAnswers[idx].answer = val;
    else userAnswers.push({ questionId: qId, answer: val });
}

// حفظ الرسم (Canvas)
function saveCurrentCanvas() {
    const q = currentTest.questions[currentQuestionIndex];
    if (q.type.includes('spelling')) {
        let canvasAnswers = {};
        let hasDrawing = false;
        
        (q.paragraphs || []).forEach((p, pIdx) => {
            const cvs = document.getElementById(`canvas-${q.id}-${pIdx}`);
            if(cvs) {
                canvasAnswers[`p_${pIdx}`] = cvs.toDataURL();
                hasDrawing = true;
            }
        });

        if(hasDrawing) updateUserAnswer(q.id, canvasAnswers);
    }
}

// الحفظ النهائي
function saveTestProgress(submit = false) {
    saveCurrentCanvas(); // تأكد من الحفظ الأخير
    
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = allAssignments.findIndex(a => a.id === currentAssignment.id);
    if(idx !== -1) {
        allAssignments[idx].answers = userAnswers;
        if(submit) {
            allAssignments[idx].status = 'completed';
            allAssignments[idx].completedDate = new Date().toISOString();
            // هنا يمكن إضافة منطق التصحيح التلقائي البسيط للأسئلة النصية
        } else {
            allAssignments[idx].status = 'in-progress';
        }
        localStorage.setItem('studentTests', JSON.stringify(allAssignments));
    }
    
    if(!submit) alert('تم الحفظ');
    else {
        alert('تم تسليم الاختبار! 🎉');
        document.getElementById('testFocusMode').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadMyTests();
    }
}

function finishTest() {
    if(confirm('هل أنت متأكد من التسليم النهائي؟')) saveTestProgress(true);
}

// ==========================================
// 6. أدوات الرسم (Canvas)
// ==========================================
let isDrawing = false;
let ctx = null;

function initCanvas(id) {
    const canvas = document.getElementById(`canvas-${id}`);
    if(!canvas) return;
    
    const context = canvas.getContext('2d');
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.strokeStyle = '#333';
    
    canvas.onmousedown = (e) => { isDrawing = true; ctx = context; draw(e, canvas); };
    canvas.onmousemove = (e) => { if(isDrawing) draw(e, canvas); };
    canvas.onmouseup = () => { isDrawing = false; ctx.beginPath(); };
    
    // استرجاع الرسم القديم
    const qId = id.split('-')[0]; // تقريبية، نحتاج منطق أدق لاستخراج ID السؤال
    // (المنطق هنا مبسط، في التطبيق الفعلي يجب ربط ID بدقة)
}

function draw(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function clearCanvas(id) {
    const cvs = document.getElementById(`canvas-${id}`);
    const cx = cvs.getContext('2d');
    cx.clearRect(0,0, cvs.width, cvs.height);
}

function playAudio(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    window.speechSynthesis.speak(speech);
}

// 7. أدوات السحب والإفلات
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.innerText); ev.dataTransfer.setData("id", ev.target.id); }
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const elId = ev.dataTransfer.getData("id");
    if(ev.target.classList.contains('drop-zone')) {
        ev.target.innerText = data;
        ev.target.style.background = '#e3f2fd';
        document.getElementById(elId).style.display = 'none';
        
        // حفظ الإجابة
        const qIdx = ev.target.dataset.qid;
        const pIdx = ev.target.dataset.pid;
        const gIdx = ev.target.dataset.gid;
        
        // نحتاج منطق لحفظ الإجابة في الهيكل المعقد (يمكن تبسيطه)
        saveInputAnswer(qIdx, `p_${pIdx}_g_${gIdx}`, data);
    }
}

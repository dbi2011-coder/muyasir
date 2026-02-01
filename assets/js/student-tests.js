// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات (إصلاح مشكلة ظهور الاختبارات)
// ============================================

let currentTest = null;
let currentAssignment = null;
let currentQuestionIndex = 0;
let userAnswers = [];

// متغيرات التسجيل الصوتي
let mediaRecorder = null;
let audioChunks = [];
let activeRecordingId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadMyTests();
});

// 1. عرض قائمة الاختبارات (الدالة المصححة)
function loadMyTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;

    // 🔥 الإصلاح الأول: جلب المستخدم بطريقة آمنة تدعم كل الصيغ
    let currentUser = null;
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        currentUser = sessionData.user || sessionData; // يدعم {user: {...}} أو {...} مباشرة
    } catch (e) {
        console.error("Error reading user session", e);
    }

    if (!currentUser || !currentUser.id) {
        container.innerHTML = '<div class="alert alert-danger text-center">يرجى تسجيل الدخول لعرض الاختبارات</div>';
        return;
    }

    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    
    // 🔥 الإصلاح الثاني: استخدام == بدلاً من === لتجاهل الفرق بين النص والرقم
    const myTests = allAssignments.filter(t => t.studentId == currentUser.id);

    if (myTests.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;">
            <h3>📭 لا توجد اختبارات مسندة إليك حالياً</h3>
        </div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        // البحث عن تفاصيل الاختبار الأصلي
        const originalTest = allTestsLib.find(t => t.id == assignment.testId);
        
        // حماية ضد الاختبارات المحذوفة من المكتبة
        if (!originalTest) return '';

        let statusText = 'جديد', statusClass = 'status-new', btnText = 'بدء الاختبار', btnClass = 'btn-primary';
        
        if (assignment.status === 'in-progress') { 
            statusText = 'جاري الحل'; statusClass = 'status-progress'; btnText = 'متابعة الحل'; btnClass = 'btn-warning'; 
        } else if (assignment.status === 'completed') { 
            statusText = 'تم التسليم'; statusClass = 'status-completed'; btnText = 'مراجعة الإجابات'; btnClass = 'btn-secondary'; 
        } else if (assignment.status === 'returned') { 
            statusText = 'معاد للتعديل'; statusClass = 'status-returned'; btnText = 'تعديل الإجابة'; btnClass = 'btn-danger'; 
        }

        return `
            <div class="test-card">
                <div class="card-header">
                    <span class="card-status ${statusClass}">${statusText}</span>
                    <small>${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</small>
                </div>
                <h3>${originalTest.title}</h3>
                <div class="mt-3 d-flex justify-content-between align-items-center">
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
    
    currentAssignment = allAssignments.find(a => a.id == assignmentId);
    if (!currentAssignment) return alert('لم يتم العثور على بيانات الاختبار');
    
    currentTest = allTestsLib.find(t => t.id == currentAssignment.testId);
    if (!currentTest) return alert('نموذج الاختبار الأصلي غير موجود');

    // إذا كان مكتمل، نعرض تنبيه فقط (أو يمكن تحويله لوضع العرض)
    if (currentAssignment.status === 'completed') {
        if(!confirm('هذا الاختبار تم تسليمه. هل تريد مراجعة إجاباتك؟ (لن يتم حفظ التعديلات)')) return;
    }

    // تحميل الإجابات السابقة
    userAnswers = currentAssignment.answers || [];
    
    document.getElementById('focusTestTitle').textContent = currentTest.title;
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // إعادة تعيين الواجهة
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
}

function startActualTest() {
    try {
        document.getElementById('testStartScreen').style.display = 'none';
        document.getElementById('testQuestionsContainer').style.display = 'block';
        document.getElementById('testFooterControls').style.display = 'flex';
        
        renderAllQuestions(); 
        showQuestion(0);
    } catch (e) {
        console.error("Error starting test:", e);
        alert("حدث خطأ أثناء تحميل الأسئلة.");
    }
}

// 3. محرك عرض الأسئلة
function renderAllQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';

    currentTest.questions.forEach((q, index) => {
        const savedAns = userAnswers.find(a => a.questionId == q.id); 
        const ansValue = savedAns ? savedAns.answer : null;

        let qHtml = `
            <div class="question-card" id="q-card-${index}">
                <div class="question-number">سؤال ${index + 1}</div>
                <h3 class="question-text">${q.text || 'سؤال'}</h3>
        `;

        if (q.attachment) {
            qHtml += `<div class="text-center mb-3"><img src="${q.attachment}" style="max-height:200px; border-radius:8px; border:1px solid #ddd;"></div>`;
        }

        // أ) اختيار من متعدد
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

        // ب) الحرف الناقص
        else if (q.type === 'missing-char') {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                qHtml += `
                    <div class="mb-5 p-3 text-center" style="background:#f9f9f9; border-radius:10px;">
                        <div class="handwriting-area">
                            <p class="text-muted small mb-2">أكمل الحرف الناقص:</p>
                            <canvas id="canvas-${q.id}-${pIdx}" 
                                    class="drawing-canvas missing-char-canvas" 
                                    width="300" height="150" 
                                    data-text="${p.missing || p.text}"
                                    style="border:2px solid #333; background:#fff; cursor:crosshair; border-radius:10px; touch-action: none;">
                            </canvas>
                            <br>
                            <button class="btn btn-sm btn-outline-danger mt-2" onclick="clearCanvas('${q.id}-${pIdx}')">مسح</button>
                        </div>
                    </div>`;
            });
            qHtml += `</div>`;
        }

        // ج) القراءة (صوت)
        else if (q.type.includes('reading')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                let audioSrc = '';
                if(ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}`]) {
                    audioSrc = ansValue[`p_${pIdx}`];
                }

                qHtml += `
                    <div class="reading-box p-4 mb-3" style="background:#fff3e0; border-right:5px solid #ff9800; border-radius:5px;">
                        <p style="font-size:1.8rem; text-align:center;">${p.text}</p>
                    </div>
                    <div class="recording-area text-center mb-4 p-3" style="background:#f8f9fa; border-radius:10px;">
                        <div id="recorder-controls-${q.id}-${pIdx}">
                            ${audioSrc ? 
                                `<audio controls src="${audioSrc}" class="mb-2 w-100"></audio>
                                 <button class="btn btn-warning btn-sm" onclick="resetRecording('${q.id}', '${pIdx}')">إعادة التسجيل</button>` 
                                : 
                                `<button class="btn btn-danger btn-lg" onclick="toggleRecording(this, '${q.id}', '${pIdx}')">🎙️ تسجيل</button>`
                            }
                        </div>
                    </div>`;
            });
            qHtml += `</div>`;
        }

        // د) الإملاء (رسم)
        else if (q.type.includes('spelling')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                qHtml += `
                    <div class="mb-4 text-center">
                        <button class="btn btn-info btn-lg mb-3" onclick="playAudio('${p.text}')">🔊 استماع</button>
                        <div style="background:#fff; padding:10px; border-radius:10px; border:1px solid #ddd;">
                            <canvas id="canvas-${q.id}-${pIdx}" class="drawing-canvas" width="600" height="250" style="border:2px dashed #ccc; background:#fff; cursor:crosshair; width:100%; touch-action: none;"></canvas>
                        </div>
                        <button class="btn btn-sm btn-secondary mt-2" onclick="clearCanvas('${q.id}-${pIdx}')">مسح</button>
                    </div>`;
            });
            qHtml += `</div>`;
        }

        // هـ) السحب والإفلات
        else if (q.type === 'drag-drop') {
            (q.paragraphs || []).forEach((p, pIdx) => {
                let processedText = p.text;
                let draggables = [];
                if (p.gaps) {
                    p.gaps.forEach((g, gIdx) => {
                        let saved = '';
                        if(ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}_g_${gIdx}`]) {
                            saved = ansValue[`p_${pIdx}_g_${gIdx}`];
                        }
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
        
        else if (q.type === 'open-ended') {
            qHtml += `<textarea class="form-control" rows="4" placeholder="اكتب إجابتك هنا..." onchange="saveSimpleAnswer(${index}, this.value)">${ansValue || ''}</textarea>`;
        }

        qHtml += `</div>`;
        container.insertAdjacentHTML('beforeend', qHtml);
    });

    updateNavigationButtons();
}

// 4. التنقل والتهيئة
function showQuestion(index) {
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active'));
    const card = document.getElementById(`q-card-${index}`);
    if(card) {
        card.classList.add('active');
        currentQuestionIndex = index;
        document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${currentTest.questions.length}`;
        updateNavigationButtons();
        
        // تهيئة الكانفاس
        const q = currentTest.questions[index];
        if (q.type.includes('spelling') || q.type === 'missing-char') {
            setTimeout(() => {
                (q.paragraphs || []).forEach((p, pIdx) => initCanvas(`${q.id}-${pIdx}`));
            }, 50);
        }
    }
}

function nextQuestion() {
    saveCurrentCanvas(); 
    if (currentQuestionIndex < currentTest.questions.length - 1) showQuestion(currentQuestionIndex + 1);
}
function prevQuestion() {
    saveCurrentCanvas();
    if (currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1);
}

function updateNavigationButtons() {
    const isLast = currentQuestionIndex === currentTest.questions.length - 1;
    document.getElementById('testFooterControls').innerHTML = `
        <button class="btn-nav btn-prev" onclick="prevQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>السابق</button>
        <div>
            <button class="btn-nav btn-save" onclick="saveTestProgress(false)">حفظ مؤقت</button>
            ${isLast ? '<button class="btn-nav btn-submit" onclick="finishTest()">تسليم الاختبار</button>' : '<button class="btn-nav btn-next" onclick="nextQuestion()">التالي</button>'}
        </div>`;
}

// ==========================================
// 5. أدوات الرسم
// ==========================================
let isDrawing = false;
let ctx = null;

function initCanvas(id) {
    const canvas = document.getElementById(`canvas-${id}`);
    if(!canvas) return;
    
    const context = canvas.getContext('2d');
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.strokeStyle = '#d32f2f';
    
    const bgText = canvas.dataset.text;
    if (bgText) drawTextBackground(canvas, bgText);
    
    const startDraw = (e) => { isDrawing = true; ctx = context; ctx.beginPath(); const pos = getPos(canvas, e); ctx.moveTo(pos.x, pos.y); };
    const moveDraw = (e) => { if(!isDrawing) return; e.preventDefault(); const pos = getPos(canvas, e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('touchmove', moveDraw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('touchend', () => isDrawing = false);

    // استرجاع الرسم القديم
    try {
        const qId = id.split('-')[0];
        const pIdx = id.split('-')[1];
        const savedEntry = userAnswers.find(a => a.questionId == qId);
        
        if(savedEntry && savedEntry.answer && typeof savedEntry.answer === 'object' && savedEntry.answer[`p_${pIdx}`]) {
            const img = new Image();
            img.onload = () => context.drawImage(img, 0, 0);
            img.src = savedEntry.answer[`p_${pIdx}`];
        }
    } catch (e) {}
}

function drawTextBackground(canvas, text) {
    const context = canvas.getContext('2d');
    context.font = "bold 50px 'Tajawal', sans-serif";
    context.fillStyle = "#212529"; 
    context.textAlign = "center";
    context.textBaseline = "middle";
    const displayText = text.replace(/[_\-]/g, '......');
    context.fillText(displayText, canvas.width / 2, canvas.height / 2);
}

function getPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function clearCanvas(id) {
    const cvs = document.getElementById(`canvas-${id}`);
    const cx = cvs.getContext('2d');
    cx.clearRect(0,0, cvs.width, cvs.height);
    const bgText = cvs.dataset.text;
    if (bgText) drawTextBackground(cvs, bgText);
}

// ==========================================
// 6. التسجيل الصوتي
// ==========================================
async function toggleRecording(btn, qId, pIdx) {
    if (!activeRecordingId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            activeRecordingId = `${qId}-${pIdx}`;

            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    saveInputAnswerByQId(qId, `p_${pIdx}`, base64Audio);
                    const container = document.getElementById(`recorder-controls-${qId}-${pIdx}`);
                    container.innerHTML = `<audio controls src="${base64Audio}" class="mb-2 w-100"></audio><button class="btn btn-warning btn-sm" onclick="resetRecording('${qId}', '${pIdx}')">إعادة التسجيل</button><div class="alert alert-success mt-2 p-1"><small>تم الحفظ!</small></div>`;
                };
                stream.getTracks().forEach(track => track.stop());
                activeRecordingId = null;
            };

            mediaRecorder.start();
            btn.classList.add('recording');
            btn.innerHTML = '<i class="fas fa-stop"></i> إيقاف';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-dark');
        } catch (err) {
            console.error(err);
            alert('تعذر الوصول للميكروفون.');
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    }
}

function resetRecording(qId, pIdx) {
    const container = document.getElementById(`recorder-controls-${qId}-${pIdx}`);
    container.innerHTML = `<button class="btn btn-danger btn-lg pulse-animation" id="btn-record-${qId}-${pIdx}" onclick="toggleRecording(this, '${qId}', '${pIdx}')"><i class="fas fa-microphone"></i> تسجيل</button>`;
    saveInputAnswerByQId(qId, `p_${pIdx}`, null);
}

// ==========================================
// 7. الحفظ
// ==========================================
function selectOption(el, qIdx, choiceIdx) {
    const card = document.getElementById(`q-card-${qIdx}`);
    card.querySelectorAll('.answer-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input').checked = true;
    updateUserAnswer(currentTest.questions[qIdx].id, choiceIdx);
}

function saveSimpleAnswer(qIdx, val) {
    updateUserAnswer(currentTest.questions[qIdx].id, val);
}

function saveInputAnswerByQId(qId, key, val) {
    let entry = userAnswers.find(a => a.questionId == qId);
    if (!entry) { entry = { questionId: qId, answer: {} }; userAnswers.push(entry); }
    if (typeof entry.answer !== 'object' || entry.answer === null) entry.answer = {}; 
    entry.answer[key] = val;
}

function saveCurrentCanvas() {
    const q = currentTest.questions[currentQuestionIndex];
    if (q.type.includes('spelling') || q.type === 'missing-char') {
        let canvasAnswers = {};
        let entry = userAnswers.find(a => a.questionId == q.id);
        if(entry && typeof entry.answer === 'object') canvasAnswers = entry.answer;

        let hasNewDrawing = false;
        (q.paragraphs || []).forEach((p, pIdx) => {
            const cvs = document.getElementById(`canvas-${q.id}-${pIdx}`);
            if(cvs) {
                canvasAnswers[`p_${pIdx}`] = cvs.toDataURL();
                hasNewDrawing = true;
            }
        });
        if(hasNewDrawing) updateUserAnswer(q.id, canvasAnswers);
    }
}

function updateUserAnswer(qId, val) {
    const idx = userAnswers.findIndex(a => a.questionId == qId);
    if(idx !== -1) userAnswers[idx].answer = val;
    else userAnswers.push({ questionId: qId, answer: val });
}

function saveTestProgress(submit = false) {
    saveCurrentCanvas(); 
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = allAssignments.findIndex(a => a.id == currentAssignment.id);
    
    if(idx !== -1) {
        allAssignments[idx].answers = userAnswers;
        if(submit) {
            allAssignments[idx].status = 'completed'; 
            allAssignments[idx].completedDate = new Date().toISOString();
        } else {
            allAssignments[idx].status = 'in-progress';
        }
        localStorage.setItem('studentTests', JSON.stringify(allAssignments));
    }
    
    if(!submit) alert('تم الحفظ مؤقتاً');
    else {
        alert('تم تسليم الاختبار! بانتظار تصحيح المعلم.');
        document.getElementById('testFocusMode').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadMyTests();
    }
}

function finishTest() {
    if(confirm('هل أنت متأكد من التسليم النهائي؟')) saveTestProgress(true);
}

function playAudio(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    window.speechSynthesis.speak(speech);
}
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.innerText); ev.dataTransfer.setData("id", ev.target.id); }
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const elId = ev.dataTransfer.getData("id");
    if(ev.target.classList.contains('drop-zone')) {
        ev.target.innerText = data;
        ev.target.style.background = '#e3f2fd';
        const srcEl = document.getElementById(elId);
        if(srcEl) srcEl.style.display = 'none';
        const qIdx = ev.target.dataset.qid;
        const pIdx = ev.target.dataset.pid;
        const gIdx = ev.target.dataset.gid;
        saveInputAnswerByQId(currentTest.questions[qIdx].id, `p_${pIdx}_g_${gIdx}`, data);
    }
}

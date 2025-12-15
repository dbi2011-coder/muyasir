// assets/js/student-tests.js

// ... (المتغيرات والدوال الأساسية للتحميل نفس السابق) ...
let currentTestId = null;
let currentOriginalTest = null;

// ==========================================
// عرض الأسئلة (الأنواع الـ 9)
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    
    // استرجاع الإجابات المحفوظة
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const savedAns = answers.find(a => a.questionId === q.id)?.answer;
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `card_q_${index}`;
        
        let contentHTML = `<div class="question-number">سؤال ${index+1}</div>`;
        
        // 1. عرض المرفقات (إن وجدت)
        if(q.mediaUrl) {
            contentHTML += `<div class="media-container mb-3"><img src="${q.mediaUrl}" style="max-width:100%; border-radius:10px;"></div>`;
        }
        
        // 2. نص السؤال
        if(q.text) contentHTML += `<h3 class="question-text">${q.text}</h3>`;
        
        // 3. بناء الواجهة حسب النوع
        contentHTML += `<div class="question-interaction-area" id="interaction_${index}">`;
        
        // --- أنواع الأسئلة ---
        
        if (q.type.includes('multiple-choice')) {
            q.choices.forEach((c, i) => {
                const checked = savedAns == i ? 'checked' : '';
                contentHTML += `
                    <label class="answer-option ${checked ? 'selected' : ''}" onclick="selectOption(this)">
                        <input type="radio" name="q_${index}" value="${i}" ${checked} ${isReadOnly?'disabled':''}> ${c}
                    </label>`;
            });
        }
        
        else if (q.type === 'ai-reading' || q.type === 'manual-reading') {
            contentHTML += `
                <div class="reading-area p-3 border rounded text-center">
                    <h4 class="mb-3" style="line-height:1.8;">${q.readingText}</h4>
                    ${!isReadOnly ? `
                    <button class="record-btn" onclick="startSpeechRecognition(${index}, '${q.type}')"><i class="fas fa-microphone"></i></button>
                    <p class="mt-2 text-muted" id="record_status_${index}">اضغط للتحدث</p>
                    <input type="hidden" name="q_${index}" value="${savedAns || ''}">
                    ` : `<p>تمت الإجابة</p>`}
                </div>`;
        }
        
        else if (q.type === 'ai-spelling' || q.type === 'manual-spelling' || q.type === 'missing-letter') {
            const wordToSay = q.spellingWord || q.fullWord || 'كلمة';
            contentHTML += `
                <div class="spelling-area text-center">
                    ${!isReadOnly ? `<button class="btn btn-info mb-2" onclick="speakText('${wordToSay}')">🔊 استمع للكلمة</button>` : ''}
                    
                    <div class="canvas-tools">
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'pen')">✏️ قلم</button>
                        <button class="btn btn-sm btn-outline-dark" onclick="setTool(${index}, 'eraser')">🧹 ممحاة</button>
                        <button class="btn btn-sm btn-danger" onclick="clearCanvas(${index})">مسح الكل</button>
                    </div>
                    <canvas id="canvas_${index}" class="drawing-canvas" width="400" height="200"></canvas>
                    <input type="hidden" name="q_${index}" id="input_q_${index}" value="">
                </div>`;
        }
        
        contentHTML += `</div>`; // End interaction area
        card.innerHTML = contentHTML;
        container.appendChild(card);
        
        // تهيئة الكانفاس بعد إضافته للـ DOM
        if (q.type.includes('spelling') || q.type === 'missing-letter') {
            setTimeout(() => initCanvas(index, savedAns, isReadOnly), 100);
        }
    });
}

// ==========================================
// 1. منطق الرسم (Canvas Logic)
// ==========================================
let canvases = {};

function initCanvas(index, savedImage, isReadOnly) {
    const canvas = document.getElementById(`canvas_${index}`);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // إعدادات افتراضية
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    // استرجاع الرسمة المحفوظة
    if(savedImage) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = savedImage;
    }
    
    if(isReadOnly) return; // تعطيل الرسم في وضع العرض

    let isDrawing = false;
    
    // Mouse Events
    canvas.onmousedown = (e) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
    canvas.onmousemove = (e) => { if(isDrawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } };
    canvas.onmouseup = () => { isDrawing = false; saveCanvasData(index); };
    
    // Touch Events (للموبايل)
    canvas.ontouchstart = (e) => {
        isDrawing = true; ctx.beginPath();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
        e.preventDefault();
    };
    canvas.ontouchmove = (e) => {
        if(isDrawing) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
            ctx.stroke();
        }
        e.preventDefault();
    };
    canvas.ontouchend = () => { isDrawing = false; saveCanvasData(index); };
    
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

// ==========================================
// 2. منطق الصوت (Speech & TTS)
// ==========================================

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
    } else {
        alert('المتصفح لا يدعم نطق النصوص');
    }
}

function startSpeechRecognition(index, type) {
    if (!('webkitSpeechRecognition' in window)) {
        alert('متصفحك لا يدعم التعرف الصوتي. يرجى استخدام Chrome.');
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
        
        // حفظ النص في الحقل المخفي
        document.querySelector(`input[name="q_${index}"]`).value = transcript;
        
        // (اختياري) هنا يمكن إضافة منطق المقارنة الفوري لـ AI Reading
    };
    
    recognition.onerror = () => {
        statusEl.textContent = 'حدث خطأ، حاول مرة أخرى';
        statusEl.style.color = 'orange';
    };
    
    recognition.start();
}

// ==========================================
// دوال الجمع والتسليم (تم تحديثها لتشمل الصور والنصوص)
// ==========================================

function collectAnswers() {
    const answers = [];
    currentOriginalTest.questions.forEach((q, index) => {
        let studentAnswer = null;
        
        if (q.type.includes('multiple-choice')) {
            const selected = document.querySelector(`input[name="q_${index}"]:checked`);
            studentAnswer = selected ? selected.value : null;
        } else if (q.type.includes('reading')) {
            // النص المسجل
            studentAnswer = document.querySelector(`input[name="q_${index}"]`)?.value;
        } else if (q.type.includes('spelling') || q.type === 'missing-letter') {
            // صورة الكانفاس Base64
            studentAnswer = document.getElementById(`input_q_${index}`)?.value;
        }
        
        answers.push({ questionId: q.id, answer: studentAnswer });
    });
    return answers;
}

// ... (باقي الدوال الأساسية: submitTestAnswers, saveTestProgress, etc. كما هي) ...

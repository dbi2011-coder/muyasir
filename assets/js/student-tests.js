// ============================================
// الجزء المضاف/المعدل داخل student-tests.js
// ============================================

// داخل دالة renderAllQuestions، أضف هذا الشرط لمعالجة سؤال handwriting
function renderAllQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    const isReadOnly = (currentAssignment.status === 'completed');

    currentTest.questions.forEach((q, index) => {
        const savedAns = userAnswers.find(a => a.questionId == q.id); 
        const ansValue = savedAns ? savedAns.answer : null;
        const evaluations = (savedAns && savedAns.evaluations) ? savedAns.evaluations : {};

        let qHtml = `<div class="question-card" id="q-card-${index}">
            <div class="question-number">سؤال ${index + 1}</div>`;

        // ------------------------------------
        // 🔥 إضافة: سؤال الرسم الكتابي (النسخ)
        // ------------------------------------
        if (q.type === 'handwriting') {
            qHtml += `<h3 class="question-text text-center" style="font-size:2rem; margin-bottom:20px; color:#1e293b;">${q.text || ''}</h3>`;
            if (q.attachment) qHtml += `<div class="text-center mb-4"><img src="${q.attachment}" style="max-height:150px; border-radius:8px;"></div>`;
            
            if (isReadOnly) {
                // عرض الصورة المصححة من المعلم إن وجدت، وإلا صورة الطالب
                let finalImg = evaluations.teacherCorrectionImage || ansValue;
                if(finalImg) qHtml += `<div class="text-center"><img src="${finalImg}" style="max-width:100%; border:2px solid #ccc; border-radius:10px; background:#fff;"></div>`;
                else qHtml += `<p class="text-muted text-center p-4 border rounded">لم يتم الحل</p>`;
            } else {
                // واجهة دفتر الطالب التفاعلية
                const linesCount = q.lines || 3;
                const canvasHeight = linesCount * 70; // 70px لكل سطر
                
                qHtml += `
                <div class="hw-toolbar mb-2" style="display:flex; justify-content:center; gap:10px; background:#f8f9fa; padding:10px; border-radius:10px; border:1px solid #e2e8f0;">
                    <button class="btn btn-sm btn-primary" onclick="setHwMode('${q.id}', 'pen')" id="btn-pen-${q.id}">✏️ قلم</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="setHwMode('${q.id}', 'eraser')" id="btn-eraser-${q.id}">🧽 ممحاة جزئية</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="clearHwCanvas('${q.id}')">🗑️ مسح الكل</button>
                </div>
                <div style="position:relative; width:100%; max-width:600px; height:${canvasHeight}px; margin:0 auto; border:2px solid #94a3b8; border-radius:8px; overflow:hidden; background:#fff; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);">
                    <canvas id="hw-bg-${q.id}" width="600" height="${canvasHeight}" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;"></canvas>
                    <canvas id="hw-draw-${q.id}" data-lines="${linesCount}" width="600" height="${canvasHeight}" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2; cursor:crosshair; touch-action:none;"></canvas>
                </div>
                `;
            }
        }
        // ... (بقية الأنواع الأخرى mcq, drag-drop... تبقى كما هي في ملفك الحالي) ...
        else {
             qHtml += `<h3 class="question-text">${q.text || 'سؤال'}</h3>`;
             // .. بقية كود renderAllQuestions السابق ..
        }

        qHtml += `</div>`;
        container.insertAdjacentHTML('beforeend', qHtml);
    });

    updateNavigationButtons();
}

// 🔥 دالة تهيئة الكانفاس عند ظهور السؤال (داخل showQuestion)
function showQuestion(index) {
    activeSelectedWord = null; 
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active'));
    const card = document.getElementById(`q-card-${index}`);
    if(card) {
        card.classList.add('active');
        currentQuestionIndex = index;
        document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${currentTest.questions.length}`;
        updateNavigationButtons();
        
        if(currentAssignment.status !== 'completed') {
            const q = currentTest.questions[index];
            if (q.type === 'handwriting') {
                setTimeout(() => initHandwritingCanvas(q.id), 100);
            }
            else if (q.type && (q.type.includes('spelling') || q.type === 'missing-char')) {
                setTimeout(() => { (q.paragraphs || []).forEach((p, pIdx) => initCanvas(`${q.id}-${pIdx}`)); }, 50);
            }
        }
    }
}

// ============================================
// منطق دفتر الرسم والنسخ (Handwriting Logic)
// ============================================
let hwContexts = {}; // لتخزين سياقات الرسم لكل سؤال

function initHandwritingCanvas(qId) {
    const canvasDraw = document.getElementById(`hw-draw-${qId}`);
    const canvasBg = document.getElementById(`hw-bg-${qId}`);
    if(!canvasDraw || !canvasBg) return;

    const ctxBg = canvasBg.getContext('2d');
    const ctxDraw = canvasDraw.getContext('2d');
    
    // رسم الأسطر في الخلفية
    const linesCount = parseInt(canvasDraw.dataset.lines) || 3;
    const lineHeight = canvasBg.height / linesCount;
    
    ctxBg.clearRect(0, 0, canvasBg.width, canvasBg.height);
    ctxBg.strokeStyle = '#cbd5e1'; // لون خط الدفتر
    ctxBg.lineWidth = 2;
    
    for(let i=1; i<=linesCount; i++) {
        let y = (i * lineHeight) - 20; // رفع السطر قليلاً للأسفل
        ctxBg.beginPath();
        ctxBg.moveTo(0, y);
        ctxBg.lineTo(canvasBg.width, y);
        ctxBg.stroke();
    }

    // إعدادات قلم الطالب الافتراضية
    ctxDraw.strokeStyle = '#0f172a'; // لون حبر القلم (أزرق داكن/أسود)
    ctxDraw.lineWidth = 4;
    ctxDraw.lineCap = 'round';
    ctxDraw.lineJoin = 'round';
    
    hwContexts[qId] = { ctx: ctxDraw, mode: 'pen' };

    // استرجاع الإجابة السابقة إن وجدت
    const savedEntry = userAnswers.find(a => a.questionId == qId);
    if(savedEntry && savedEntry.answer && typeof savedEntry.answer === 'string' && savedEntry.answer.startsWith('data:image')) {
        const img = new Image();
        img.onload = () => ctxDraw.drawImage(img, 0, 0);
        img.src = savedEntry.answer;
    }

    let isDrawing = false;
    let lastX = 0, lastY = 0;

    const getPosHw = (e) => {
        const rect = canvasDraw.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { 
            x: (clientX - rect.left) * (canvasDraw.width / rect.width), 
            y: (clientY - rect.top) * (canvasDraw.height / rect.height) 
        };
    };

    const startDraw = (e) => {
        if(e.type === 'touchstart') e.preventDefault();
        isDrawing = true;
        const pos = getPosHw(e);
        lastX = pos.x; lastY = pos.y;
        ctxDraw.beginPath();
        ctxDraw.moveTo(lastX, lastY);
    };

    const moveDraw = (e) => {
        if(!isDrawing) return;
        e.preventDefault();
        const pos = getPosHw(e);
        ctxDraw.lineTo(pos.x, pos.y);
        ctxDraw.stroke();
        lastX = pos.x; lastY = pos.y;
    };

    const stopDraw = () => { isDrawing = false; ctxDraw.closePath(); };

    canvasDraw.addEventListener('mousedown', startDraw);
    canvasDraw.addEventListener('touchstart', startDraw, { passive: false });
    canvasDraw.addEventListener('mousemove', moveDraw);
    canvasDraw.addEventListener('touchmove', moveDraw, { passive: false });
    canvasDraw.addEventListener('mouseup', stopDraw);
    canvasDraw.addEventListener('touchend', stopDraw);
    canvasDraw.addEventListener('mouseout', stopDraw);
}

window.setHwMode = function(qId, mode) {
    if(!hwContexts[qId]) return;
    const ctx = hwContexts[qId].ctx;
    
    document.getElementById(`btn-pen-${qId}`).className = 'btn btn-sm btn-outline-primary';
    document.getElementById(`btn-eraser-${qId}`).className = 'btn btn-sm btn-outline-secondary';

    if (mode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 4;
        document.getElementById(`btn-pen-${qId}`).className = 'btn btn-sm btn-primary';
    } else if (mode === 'eraser') {
        // الممحاة تمسح فقط رسم الطالب لأنها تعمل على canvasDraw، وتبقى الأسطر في canvasBg
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 25; // حجم ممحاة كبير نسبياً
        document.getElementById(`btn-eraser-${qId}`).className = 'btn btn-sm btn-secondary';
    }
}

window.clearHwCanvas = function(qId) {
    if(!hwContexts[qId]) return;
    const canvas = document.getElementById(`hw-draw-${qId}`);
    hwContexts[qId].ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// تحديث حفظ الإجابات ليدمج الخلفية (الأسطر) مع كتابة الطالب
// يتم استدعاء هذه الدالة عند الانتقال للسؤال التالي أو حفظ الاختبار
function saveCurrentCanvas() {
    if(currentAssignment.status === 'completed') return;
    const q = currentTest.questions[currentQuestionIndex];
    
    if (q.type === 'handwriting') {
        const bgCanvas = document.getElementById(`hw-bg-${q.id}`);
        const drawCanvas = document.getElementById(`hw-draw-${q.id}`);
        if(bgCanvas && drawCanvas) {
            // إنشاء كانفاس مؤقت لدمج الطبقتين
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = drawCanvas.width;
            tempCanvas.height = drawCanvas.height;
            const tCtx = tempCanvas.getContext('2d');
            
            // خلفية بيضاء أولاً
            tCtx.fillStyle = '#ffffff';
            tCtx.fillRect(0,0, tempCanvas.width, tempCanvas.height);
            // رسم الأسطر
            tCtx.drawImage(bgCanvas, 0, 0);
            // رسم كتابة الطالب فوقها
            tCtx.drawImage(drawCanvas, 0, 0);
            
            updateUserAnswer(q.id, tempCanvas.toDataURL('image/png'));
        }
    }
    // ... الكود السابق لـ spelling و missing-char يبقى كما هو ...
    else if (q.type && (q.type.includes('spelling') || q.type === 'missing-char')) {
        let canvasAnswers = {};
        let entry = userAnswers.find(a => a.questionId == q.id);
        if(entry && typeof entry.answer === 'object') canvasAnswers = entry.answer;
        let hasNewDrawing = false;
        (q.paragraphs || []).forEach((p, pIdx) => {
            const cvs = document.getElementById(`canvas-${q.id}-${pIdx}`);
            if(cvs) { canvasAnswers[`p_${pIdx}`] = cvs.toDataURL(); hasNewDrawing = true; }
        });
        if(hasNewDrawing) updateUserAnswer(q.id, canvasAnswers);
    }
}

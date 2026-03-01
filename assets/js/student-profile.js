// ============================================
// الجزء المضاف/المعدل داخل student-profile.js
// ============================================

function buildTeacherReviewItem(q, index, studentAnsObj) {
    let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
    let evaluations = (studentAnsObj && studentAnsObj.evaluations) ? studentAnsObj.evaluations : {};
    let maxScore = parseFloat(q.maxScore || q.passingScore || 1);
    let currentScore = studentAnsObj ? studentAnsObj.score : 0;
    let teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
    let html = '';

    // ------------------------------------
    // 🔥 إضافة: تصحيح الرسم الكتابي للمعلم
    // ------------------------------------
    if (q.type === 'handwriting') {
        if (rawAnswer) {
            let existingCorrection = evaluations.teacherCorrectionImage || '';
            html += `
            <div class="teacher-correction-area text-center" style="background:#fff; padding:15px; border-radius:10px; border:1px solid #ddd;">
                <div class="correction-toolbar mb-3" style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; background:#f8f9fa; padding:10px; border-radius:8px;">
                    <button type="button" class="btn btn-sm btn-outline-danger" id="tc-pen-${q.id}" onclick="setCorrectionMode('${q.id}', 'pen')"><i class="fas fa-pen"></i> قلم أحمر</button>
                    <button type="button" class="btn btn-sm btn-outline-success" id="tc-stamp-c-${q.id}" onclick="setCorrectionMode('${q.id}', 'stamp-correct')">✔️ ختم (صح)</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" id="tc-stamp-w-${q.id}" onclick="setCorrectionMode('${q.id}', 'stamp-wrong')">❌ ختم (خطأ)</button>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="clearCorrection('${q.id}', '${rawAnswer}')"><i class="fas fa-undo"></i> تراجع/مسح التقييم</button>
                </div>
                <div style="position:relative; display:inline-block; border:2px solid #ccc; border-radius:8px; overflow:hidden; max-width:100%;">
                    <canvas id="tc-canvas-${q.id}" style="cursor:crosshair; touch-action:none; display:block; max-width:100%;"></canvas>
                </div>
                <input type="hidden" name="correction_img_${q.id}" id="tc-output-${q.id}" value="${existingCorrection}">
            </div>
            `;
            // استدعاء دالة التهيئة بعد إدراج HTML
            setTimeout(()=> initTeacherCorrectionCanvas(q.id, rawAnswer, existingCorrection), 100);
        } else {
            html += '<span class="text-muted p-3 border rounded d-block text-center bg-light">لم يُجب الطالب</span>';
        }
    } 
    // ... (بقية أنواع الأسئلة كالسابق mcq, drag-drop, الخ) ...
    else if (q.type.includes('mcq')) {
        // .. كودك السابق ل mcq ..
    } // .. الخ
    
    return `<div class="review-question-item" id="q-review-item-${q.id}">
        <div class="review-q-header" style="background:#e3f2fd; border-bottom:2px solid #90caf9;">
            <div style="flex:1; font-size:1.1rem; color:#1565c0;"><strong>س${index+1}: ${q.text}</strong></div>
            <div class="score-input-container">
                <input type="number" step="0.5" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0">
                <span class="text-muted"> / ${maxScore} درجة</span>
            </div>
        </div>
        <div class="student-answer-box" style="background:transparent; border:none; padding:0;">${html}</div>
        <div class="teacher-feedback-box mt-3">
            <label>ملاحظات المعلم (تظهر للطالب):</label>
            <textarea class="form-control" name="note_${q.id}">${teacherNote}</textarea>
        </div>
    </div>`;
}

// ============================================
// لوحة تصحيح المعلم التفاعلية (Teacher Canvas)
// ============================================
let tcContexts = {};

function initTeacherCorrectionCanvas(qId, originalImgBase64, existingCorrection) {
    const canvas = document.getElementById(`tc-canvas-${qId}`);
    if(!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        // ضبط أبعاد الكانفاس لتطابق الصورة الأصلية
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        tcContexts[qId] = { ctx: ctx, canvas: canvas, mode: 'pen', baseImg: img };
        
        // إعداد القلم الأحمر كافتراضي
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setCorrectionMode(qId, 'pen');

        let isDrawing = false;
        let lastX = 0, lastY = 0;

        const getPosTC = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { 
                x: (clientX - rect.left) * (canvas.width / rect.width), 
                y: (clientY - rect.top) * (canvas.height / rect.height) 
            };
        };

        const handleDown = (e) => {
            if(e.type === 'touchstart') e.preventDefault();
            const pos = getPosTC(e);
            
            const mode = tcContexts[qId].mode;
            if(mode === 'pen') {
                isDrawing = true;
                lastX = pos.x; lastY = pos.y;
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
            } else if (mode === 'stamp-correct' || mode === 'stamp-wrong') {
                // وضع الختم
                ctx.font = 'bold 50px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = mode === 'stamp-correct' ? '#28a745' : '#dc3545';
                const stampText = mode === 'stamp-correct' ? '✔️' : '❌';
                ctx.fillText(stampText, pos.x, pos.y);
                updateOutput(qId);
            }
        };

        const handleMove = (e) => {
            if(!isDrawing || tcContexts[qId].mode !== 'pen') return;
            e.preventDefault();
            const pos = getPosTC(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        };

        const handleUp = () => { 
            if(isDrawing) { isDrawing = false; ctx.closePath(); updateOutput(qId); }
        };

        canvas.addEventListener('mousedown', handleDown);
        canvas.addEventListener('touchstart', handleDown, { passive: false });
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('touchmove', handleMove, { passive: false });
        canvas.addEventListener('mouseup', handleUp);
        canvas.addEventListener('touchend', handleUp);
        canvas.addEventListener('mouseout', handleUp);
    };
    
    // تحميل الصورة السابقة (تصحيح المعلم) إن وجدت، وإلا صورة الطالب الأصلية
    img.src = existingCorrection ? existingCorrection : originalImgBase64;
}

window.setCorrectionMode = function(qId, mode) {
    if(!tcContexts[qId]) return;
    tcContexts[qId].mode = mode;
    
    document.getElementById(`tc-pen-${qId}`).className = 'btn btn-sm btn-outline-danger';
    document.getElementById(`tc-stamp-c-${qId}`).className = 'btn btn-sm btn-outline-success';
    document.getElementById(`tc-stamp-w-${qId}`).className = 'btn btn-sm btn-outline-danger';

    if (mode === 'pen') document.getElementById(`tc-pen-${qId}`).classList.replace('btn-outline-danger', 'btn-danger');
    else if (mode === 'stamp-correct') document.getElementById(`tc-stamp-c-${qId}`).classList.replace('btn-outline-success', 'btn-success');
    else if (mode === 'stamp-wrong') document.getElementById(`tc-stamp-w-${qId}`).classList.replace('btn-outline-danger', 'btn-danger');
}

window.clearCorrection = function(qId) {
    if(!tcContexts[qId]) return;
    const ctx = tcContexts[qId].ctx;
    const canvas = tcContexts[qId].canvas;
    const baseImg = tcContexts[qId].baseImg; // الصورة الأصلية للطالب بدون تعديل
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // رسم الإجابة الأصلية من جديد
    ctx.drawImage(baseImg, 0, 0);
    updateOutput(qId);
}

function updateOutput(qId) {
    const canvas = document.getElementById(`tc-canvas-${qId}`);
    const output = document.getElementById(`tc-output-${qId}`);
    if(canvas && output) {
        output.value = canvas.toDataURL('image/png');
    }
}

// ----------------------------------------------------
// 🔥 تحديث دالة saveTestReview لحفظ التصحيح
// ----------------------------------------------------
// داخل دالة saveTestReview الموجودة حالياً في ملفك، ابحث عن حلقة المرور على الأسئلة (questions.forEach) وأضف هذا السطر لجمع الصورة:

/*
...
    updatedAnswers[ansIdx].score = newScore;
    updatedAnswers[ansIdx].teacherNote = noteInp ? noteInp.value : '';
    
    if (!updatedAnswers[ansIdx].evaluations) updatedAnswers[ansIdx].evaluations = {};
    // ...
    // +++ الإضافة المطلوبة هنا:
    const correctionInput = container.querySelector(`#tc-output-${q.id}`);
    if (correctionInput && correctionInput.value) {
        updatedAnswers[ansIdx].evaluations.teacherCorrectionImage = correctionInput.value;
    }
    // +++ نهاية الإضافة
...
*/

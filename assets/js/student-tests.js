// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات + النوافذ الاحترافية + الحفظ الصامت + إزالة الزر القديم
// ============================================

// =========================================================
// 🔥 نظام النوافذ المنبثقة الاحترافية (Toasts & Modals) 🔥
// =========================================================
if (!window.showConfirmModal) {
    window.showConfirmModal = function(message, onConfirm) {
        let modal = document.getElementById('globalConfirmModal');
        if (!modal) {
            const modalHtml = `
                <div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                    <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;">
                        <div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div>
                        <div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div>
                        <div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div>
                        <div style="display:flex; gap:15px; justify-content:center;">
                            <button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button>
                            <button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button>
                        </div>
                    </div>
                </div>
                <style>@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }</style>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalConfirmModal');
        }
        document.getElementById('globalConfirmMessage').innerHTML = message;
        modal.style.display = 'flex';
        document.getElementById('globalConfirmOk').onclick = function() {
            modal.style.display = 'none';
            if (typeof onConfirm === 'function') onConfirm();
        };
        document.getElementById('globalConfirmCancel').onclick = function() {
            modal.style.display = 'none';
        };
    };
}

if (!window.showSuccess) {
    window.showSuccess = function(message) {
        let toast = document.getElementById('globalSuccessToast');
        if (!toast) {
            const toastHtml = `
                <div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;">
                    <i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalSuccessToast');
        }
        document.getElementById('globalSuccessMessage').textContent = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    };
}

if (!window.showError) {
    window.showError = function(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            const toastHtml = `
                <div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;">
                    <i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalErrorToast');
        }
        document.getElementById('globalErrorMessage').innerHTML = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
    };
}

if (!window.showInfoModal) {
    window.showInfoModal = function(title, message, onClose) {
        let modal = document.getElementById('globalInfoModal');
        if (!modal) {
            const modalHtml = `
                <div id="globalInfoModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                    <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;">
                        <div style="font-size:3.5rem; color:#007bff; margin-bottom:15px;"><i class="fas fa-info-circle"></i></div>
                        <div id="globalInfoTitle" style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;"></div>
                        <div id="globalInfoMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div>
                        <div style="display:flex; justify-content:center;">
                            <button id="globalInfoOk" style="background:#007bff; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; font-family:'Tajawal'; w-100">حسناً، فهمت</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalInfoModal');
        }
        document.getElementById('globalInfoTitle').innerHTML = title;
        document.getElementById('globalInfoMessage').innerHTML = message;
        modal.style.display = 'flex';
        document.getElementById('globalInfoOk').onclick = function() {
            modal.style.display = 'none';
            if (typeof onClose === 'function') onClose();
        };
    };
}
// =========================================================

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

    // 🔥 كود التنظيف الذكي: إزالة أي زر خروج كلاسيكي قديم في أعلى الشاشة 🔥
    const focusMode = document.getElementById('testFocusMode');
    if (focusMode) {
        // نبحث عن أي عنصر يقوم بتشغيل دالة الخروج (وليس موجوداً في شريط التنقل السفلي) ونقوم بحذفه
        const allButtons = focusMode.querySelectorAll('button, a, i, span, div');
        allButtons.forEach(el => {
            const onclickAttr = el.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('closeTestMode') && !el.classList.contains('btn-nav')) {
                el.remove(); // حذف العنصر نهائياً من الواجهة
            }
        });
    }
});

// 1. عرض قائمة الاختبارات 
function loadMyTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;

    let currentUser = null;
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        currentUser = sessionData.user || sessionData; 
    } catch (e) {
        console.error("Error reading user session", e);
    }

    if (!currentUser || !currentUser.id) {
        container.innerHTML = '<div class="alert alert-danger text-center">يرجى تسجيل الدخول لعرض الاختبارات</div>';
        return;
    }

    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    
    const myTests = allAssignments.filter(t => t.studentId == currentUser.id);

    if (myTests.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;">
            <h3>📭 لا توجد اختبارات مسندة إليك حالياً</h3>
        </div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const originalTest = allTestsLib.find(t => t.id == assignment.testId);
        if (!originalTest) return '';

        let statusText = 'جديد', statusClass = 'status-new', btnText = 'بدء الاختبار', btnClass = 'btn-primary';
        
        if (assignment.status === 'in-progress') { 
            statusText = 'جاري الحل'; statusClass = 'status-progress'; btnText = 'متابعة الحل'; btnClass = 'btn-warning'; 
        } else if (assignment.status === 'completed') { 
            statusText = 'تم التسليم'; statusClass = 'status-completed'; btnText = '🔍 عرض النتيجة والمراجعة'; btnClass = 'btn-success'; 
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

// 2. فتح وضع الاختبار (التبديل بين وضع الحل ووضع القراءة)
function openTestMode(assignmentId) {
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    
    currentAssignment = allAssignments.find(a => a.id == assignmentId);
    if (!currentAssignment) return showError('لم يتم العثور على بيانات الاختبار');
    
    currentTest = allTestsLib.find(t => t.id == currentAssignment.testId);
    if (!currentTest) return showError('نموذج الاختبار الأصلي غير موجود');

    if (currentAssignment.status === 'completed') {
        showInfoModal('وضع المراجعة', 'أنت الآن في وضع المراجعة.<br>لا يمكنك تعديل الإجابات، يمكنك فقط الاطلاع على الحلول وملاحظات المعلم وتقييمه.');
    } else if (currentAssignment.status === 'returned') {
        showInfoModal('تعديل الإجابات', 'أعاد المعلم هذا الاختبار إليك.<br>يمكنك الآن مراجعة الأخطاء، تعديل إجاباتك، وتسليمها مرة أخرى.');
    }

    userAnswers = currentAssignment.answers || [];
    
    document.getElementById('focusTestTitle').textContent = currentTest.title;
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden';

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
        showError("حدث خطأ أثناء تحميل الأسئلة، يرجى المحاولة لاحقاً.");
    }
}

// إغلاق النافذة مع الحفظ الصامت التلقائي
function closeTestMode() {
    if (currentAssignment && currentAssignment.status !== 'completed') {
        saveCurrentCanvas();
        const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const idx = allAssignments.findIndex(a => a.id == currentAssignment.id);
        if(idx !== -1) {
            allAssignments[idx].answers = userAnswers;
            allAssignments[idx].status = 'in-progress';
            localStorage.setItem('studentTests', JSON.stringify(allAssignments));
        }
    }
    
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    loadMyTests();
}
window.closeTestMode = closeTestMode; 

// 3. محرك عرض الأسئلة
function renderAllQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    
    const isReadOnly = (currentAssignment.status === 'completed');

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

        if (isReadOnly) {
            let sc = savedAns && savedAns.score !== undefined ? savedAns.score : '-';
            let maxSc = q.passingScore || q.points || q.score || 1;
            let note = savedAns && savedAns.teacherNote ? `<div style="margin-top:10px; color:#664d03; background:#fff3cd; padding:10px; border-radius:5px; font-size:0.95rem; border-right:4px solid #ffc107;"><i class="fas fa-comment-dots"></i> <strong>ملاحظة المعلم:</strong> ${savedAns.teacherNote}</div>` : '';
            
            qHtml += `
            <div style="background: #f0fff4; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-weight:bold; color: #155724; font-size: 1.1rem; display:flex; justify-content:space-between; align-items:center;">
                    <span>التقييم:</span>
                    <span style="background:#28a745; color:white; padding:4px 12px; border-radius:20px;">${sc} / ${maxSc}</span>
                </div>
                ${note}
            </div>`;
        }

        // أ) اختيار من متعدد
        if (q.type.includes('mcq')) {
            qHtml += `<div class="options-list" style="${isReadOnly ? 'pointer-events: none; opacity:0.8;' : ''}">`;
            (q.choices || []).forEach((choice, i) => {
                const isSel = (ansValue == i) ? 'selected' : '';
                const clickEvt = isReadOnly ? '' : `onclick="selectOption(this, ${index}, ${i})"`;
                qHtml += `<label class="answer-option ${isSel}" ${clickEvt}>
                            <input type="radio" name="q_${q.id}" value="${i}" ${ansValue == i ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}> ${choice}
                          </label>`;
            });
            qHtml += `</div>`;
        }

        // ب) الحرف الناقص
        else if (q.type === 'missing-char') {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                if (isReadOnly) {
                    let savedImg = (ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}`]) 
                        ? `<img src="${ansValue[`p_${pIdx}`]}" style="max-width:100%; max-height:150px; border:2px solid #ccc; border-radius:10px; background:#fff;">` 
                        : `<p class="text-muted">لم يتم رسم إجابة</p>`;
                    qHtml += `<div class="mb-4 text-center p-3" style="background:#f9f9f9; border-radius:10px;"><p class="text-muted small mb-2">أكمل الحرف الناقص:</p>${savedImg}</div>`;
                } else {
                    qHtml += `
                        <div class="mb-5 p-3 text-center" style="background:#f9f9f9; border-radius:10px;">
                            <div class="handwriting-area">
                                <p class="text-muted small mb-2">أكمل الحرف الناقص:</p>
                                <canvas id="canvas-${q.id}-${pIdx}" class="drawing-canvas missing-char-canvas" width="300" height="150" data-text="${p.missing || p.text}" style="border:2px solid #333; background:#fff; cursor:crosshair; border-radius:10px; touch-action: none;"></canvas><br>
                                <button class="btn btn-sm btn-outline-danger mt-2" onclick="clearCanvas('${q.id}-${pIdx}')">مسح</button>
                            </div>
                        </div>`;
                }
            });
            qHtml += `</div>`;
        }

        // ج) القراءة (صوت)
        else if (q.type.includes('reading')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                let audioSrc = (ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}`]) ? ansValue[`p_${pIdx}`] : '';
                
                qHtml += `<div class="reading-box p-4 mb-3" style="background:#fff3e0; border-right:5px solid #ff9800; border-radius:5px;"><p style="font-size:1.8rem; text-align:center;">${p.text}</p></div>`;
                
                if (isReadOnly) {
                    qHtml += `<div class="text-center p-3" style="background:#f8f9fa; border-radius:10px;">${audioSrc ? `<audio controls src="${audioSrc}" class="w-100"></audio>` : `<span class="text-muted">لا يوجد تسجيل</span>`}</div>`;
                } else {
                    qHtml += `<div class="recording-area text-center mb-4 p-3" style="background:#f8f9fa; border-radius:10px;">
                        <div id="recorder-controls-${q.id}-${pIdx}">
                            ${audioSrc ? `<audio controls src="${audioSrc}" class="mb-2 w-100"></audio><button class="btn btn-warning btn-sm" onclick="resetRecording('${q.id}', '${pIdx}')">إعادة التسجيل</button>` : `<button class="btn btn-danger btn-lg" onclick="toggleRecording(this, '${q.id}', '${pIdx}')">🎙️ تسجيل</button>`}
                        </div>
                    </div>`;
                }
            });
            qHtml += `</div>`;
        }

        // د) الإملاء (رسم)
        else if (q.type.includes('spelling')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                qHtml += `<div class="mb-4 text-center"><button class="btn btn-info btn-lg mb-3" onclick="playAudio('${p.text}')">🔊 استماع للكلمة</button>`;
                if (isReadOnly) {
                    let savedImg = (ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}`]) ? `<img src="${ansValue[`p_${pIdx}`]}" style="max-width:100%; border:2px dashed #ccc; border-radius:10px; background:#fff;">` : `<p class="text-muted border p-4 bg-light rounded">لم يتم كتابة إجابة</p>`;
                    qHtml += `<div>${savedImg}</div></div>`;
                } else {
                    qHtml += `<div style="background:#fff; padding:10px; border-radius:10px; border:1px solid #ddd;">
                                <canvas id="canvas-${q.id}-${pIdx}" class="drawing-canvas" width="600" height="250" style="border:2px dashed #ccc; background:#fff; cursor:crosshair; width:100%; touch-action: none;"></canvas>
                              </div>
                              <button class="btn btn-sm btn-secondary mt-2" onclick="clearCanvas('${q.id}-${pIdx}')">مسح</button></div>`;
                }
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
                        let saved = (ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}_g_${gIdx}`]) ? ansValue[`p_${pIdx}_g_${gIdx}`] : '';
                        const dropId = `drop-${q.id}-${pIdx}-${gIdx}`;
                        const dropEvts = isReadOnly ? '' : `ondrop="drop(event)" ondragover="allowDrop(event)"`;
                        processedText = processedText.replace(g.dragItem, `<span class="drop-zone" id="${dropId}" ${dropEvts} data-qid="${index}" data-pid="${pIdx}" data-gid="${gIdx}" style="${isReadOnly ? 'background:#e2e8f0; pointer-events:none;' : ''}">${saved}</span>`);
                        draggables.push(g.dragItem);
                    });
                }
                
                if (!isReadOnly) {
                    qHtml += `<div class="word-bank">${draggables.sort(()=>Math.random()-0.5).map(w => `<div class="draggable-word" draggable="true" ondragstart="drag(event)" id="w-${Math.random()}">${w}</div>`).join('')}</div>`;
                }
                qHtml += `<div class="sentence-area" style="font-size:1.3rem; line-height:2.5;">${processedText}</div>`;
            });
        }
        
        // و) نصي
        else if (q.type === 'open-ended') {
            const roAttr = isReadOnly ? 'readonly style="background:#f1f5f9;"' : '';
            qHtml += `<textarea class="form-control" rows="4" placeholder="اكتب إجابتك هنا..." onchange="saveSimpleAnswer(${index}, this.value)" ${roAttr}>${ansValue || ''}</textarea>`;
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
        
        if(currentAssignment.status !== 'completed') {
            const q = currentTest.questions[index];
            if (q.type.includes('spelling') || q.type === 'missing-char') {
                setTimeout(() => { (q.paragraphs || []).forEach((p, pIdx) => initCanvas(`${q.id}-${pIdx}`)); }, 50);
            }
        }
    }
}

function nextQuestion() {
    if(currentAssignment.status !== 'completed') saveCurrentCanvas(); 
    if (currentQuestionIndex < currentTest.questions.length - 1) showQuestion(currentQuestionIndex + 1);
}

function prevQuestion() {
    if(currentAssignment.status !== 'completed') saveCurrentCanvas();
    if (currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1);
}

function updateNavigationButtons() {
    const isLast = currentQuestionIndex === currentTest.questions.length - 1;
    const isReadOnly = (currentAssignment.status === 'completed');

    let actionButtons = '';
    if (isReadOnly) {
        actionButtons = `<button class="btn-nav" style="background:#6c757d; color:white;" onclick="closeTestMode()">إغلاق المراجعة</button>`;
    } else {
        actionButtons = `
            <button class="btn-nav btn-save" onclick="exitAndSaveTest()">خروج وحفظ مؤقت</button>
            ${isLast ? '<button class="btn-nav btn-submit" onclick="finishTest()">تسليم الاختبار</button>' : ''}
        `;
    }

    document.getElementById('testFooterControls').innerHTML = `
        <button class="btn-nav btn-prev" onclick="prevQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>السابق</button>
        <div style="display:flex; gap:10px;">
            ${actionButtons}
            ${(!isLast) ? '<button class="btn-nav btn-next" onclick="nextQuestion()">التالي</button>' : ''}
        </div>`;
}

// ==========================================
// 5. أدوات الرسم (معادلة القياس الدقيقة)
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
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('touchend', () => isDrawing = false);

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
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return { 
        x: (clientX - rect.left) * scaleX, 
        y: (clientY - rect.top) * scaleY 
    };
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
            showError('عذراً، لم نتمكن من الوصول للميكروفون. يرجى التأكد من صلاحيات المتصفح.');
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
// 7. الحفظ والتسليم
// ==========================================
function selectOption(el, qIdx, choiceIdx) {
    if(currentAssignment.status === 'completed') return;
    const card = document.getElementById(`q-card-${qIdx}`);
    card.querySelectorAll('.answer-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input').checked = true;
    updateUserAnswer(currentTest.questions[qIdx].id, choiceIdx);
}

function saveSimpleAnswer(qIdx, val) {
    if(currentAssignment.status === 'completed') return;
    updateUserAnswer(currentTest.questions[qIdx].id, val);
}

function saveInputAnswerByQId(qId, key, val) {
    if(currentAssignment.status === 'completed') return;
    let entry = userAnswers.find(a => a.questionId == qId);
    if (!entry) { entry = { questionId: qId, answer: {} }; userAnswers.push(entry); }
    if (typeof entry.answer !== 'object' || entry.answer === null) entry.answer = {}; 
    entry.answer[key] = val;
}

function saveCurrentCanvas() {
    if(currentAssignment.status === 'completed') return;
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
    if(currentAssignment.status === 'completed') return;
    const idx = userAnswers.findIndex(a => a.questionId == qId);
    if(idx !== -1) userAnswers[idx].answer = val;
    else userAnswers.push({ questionId: qId, answer: val });
}

function saveTestProgress(submit = false, isExiting = false) {
    if(currentAssignment.status === 'completed') return;
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
    
    if(!submit) {
        showSuccess('تم حفظ إجاباتك بنجاح ✅');
        if (isExiting) {
            setTimeout(() => {
                closeTestMode();
            }, 1000); 
        }
    } else {
        showInfoModal('تم التسليم بنجاح! 🎉', 'لقد قمت بتسليم الاختبار بنجاح، وهو الآن بانتظار المراجعة والتصحيح من قبل المعلم.', function() {
            closeTestMode();
        });
    }
}

function exitAndSaveTest() {
    if (currentAssignment && currentAssignment.status !== 'completed') {
        saveTestProgress(false, true);
    } else {
        closeTestMode();
    }
}
window.exitAndSaveTest = exitAndSaveTest;

function finishTest() {
    showConfirmModal(
        'هل أنت متأكد من رغبتك في تسليم الاختبار نهائياً؟<br><span style="color:#dc3545; font-size:0.9rem; margin-top:5px; display:block;">⚠️ تذكر: لن تتمكن من تعديل إجاباتك بعد التسليم.</span>', 
        function() {
            saveTestProgress(true);
        }
    );
}

function playAudio(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    window.speechSynthesis.speak(speech);
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.innerText); ev.dataTransfer.setData("id", ev.target.id); }

function drop(ev) {
    if(currentAssignment.status === 'completed') return;
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

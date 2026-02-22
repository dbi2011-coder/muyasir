// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات + عرض التقييم الجزئي للطالب بعد التصحيح
// ============================================

let currentTest = null;
let currentAssignment = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let mediaRecorder = null;
let audioChunks = [];
let activeRecordingId = null;
let activeSelectedWord = null;

function injectMobileStyles() {
    if (document.getElementById('mobileTestStyles')) return;
    const style = document.createElement('style');
    style.id = 'mobileTestStyles';
    style.innerHTML = `
        .sentence-area { line-height: 2.8 !important; font-size: 1.25rem !important; padding: 15px !important; word-wrap: break-word; text-align: justify; }
        .drop-zone { display: inline-block !important; min-width: 100px; height: 38px; line-height: 36px !important; vertical-align: bottom; margin: 0 5px; padding: 0 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
        .draggable-word { cursor: pointer !important; touch-action: manipulation; transition: all 0.2s ease; }
        .selected-word { background: #fff9c4 !important; border-color: #fbc02d !important; transform: scale(1.1); box-shadow: 0 0 15px rgba(253, 216, 53, 0.6) !important; z-index: 10; }
    `;
    document.head.appendChild(style);
}

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
                            <button id="globalInfoOk" style="background:#007bff; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; font-family:'Tajawal'; width:100%;">حسناً، فهمت</button>
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

document.addEventListener('DOMContentLoaded', function() {
    injectMobileStyles();
    loadMyTests();

    const focusMode = document.getElementById('testFocusMode');
    if (focusMode) {
        const allButtons = focusMode.querySelectorAll('button, a, i, span, div');
        allButtons.forEach(el => {
            const onclickAttr = el.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('closeTestMode') && !el.classList.contains('btn-nav')) {
                el.remove(); 
            }
        });
    }
});

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
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;"><h3>📭 لا توجد اختبارات مسندة إليك حالياً</h3></div>`;
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
    activeSelectedWord = null; 
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    loadMyTests();
}

function getEvalBadgeHTML(evalState) {
    if (evalState === 'correct') return `<div style="position:absolute; top:-15px; right:-15px; background:#28a745; color:white; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; box-shadow:0 3px 6px rgba(0,0,0,0.2); z-index:10; border:2px solid #fff;"><i class="fas fa-check"></i></div>`;
    if (evalState === 'wrong') return `<div style="position:absolute; top:-15px; right:-15px; background:#dc3545; color:white; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; box-shadow:0 3px 6px rgba(0,0,0,0.2); z-index:10; border:2px solid #fff;"><i class="fas fa-times"></i></div>`;
    return '';
}

function renderAllQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    const isReadOnly = (currentAssignment.status === 'completed');

    currentTest.questions.forEach((q, index) => {
        const savedAns = userAnswers.find(a => a.questionId == q.id); 
        const ansValue = savedAns ? savedAns.answer : null;
        const evaluations = (savedAns && savedAns.evaluations) ? savedAns.evaluations : {};

        let qHtml = `<div class="question-card" id="q-card-${index}"><div class="question-number">سؤال ${index + 1}</div><h3 class="question-text">${q.text || 'سؤال'}</h3>`;

        if (q.attachment) {
            qHtml += `<div class="text-center mb-3"><img src="${q.attachment}" style="max-height:200px; border-radius:8px; border:1px solid #ddd;"></div>`;
        }

        if (isReadOnly) {
            let sc = savedAns && savedAns.score !== undefined ? savedAns.score : '-';
            let maxSc = q.passingScore || q.points || q.score || 1;
            let note = savedAns && savedAns.teacherNote ? `<div style="margin-top:10px; color:#664d03; background:#fff3cd; padding:10px; border-radius:5px; font-size:0.95rem; border-right:4px solid #ffc107;"><i class="fas fa-comment-dots"></i> <strong>ملاحظة المعلم:</strong> ${savedAns.teacherNote}</div>` : '';
            qHtml += `<div style="background:#f0fff4; border:1px solid #c3e6cb; padding:15px; border-radius:8px; margin-bottom:20px;">
                <div style="font-weight:bold; color:#155724; font-size:1.1rem; display:flex; justify-content:space-between; align-items:center;">
                    <span>الدرجة:</span><span style="background:#28a745; color:white; padding:4px 12px; border-radius:20px;">${sc} / ${maxSc}</span>
                </div>${note}
            </div>`;
        }

        if (q.type.includes('mcq')) {
            qHtml += `<div class="options-list" style="${isReadOnly ? 'pointer-events:none;' : ''}">`;
            let sAns = ansValue !== null ? parseInt(ansValue) : -1;
            let cAns = q.correctAnswer !== undefined ? parseInt(q.correctAnswer) : -1;

            (q.choices || []).forEach((choice, i) => {
                if (isReadOnly) {
                    let isStudent = (sAns === i);
                    let isCorrect = (cAns === i);
                    let bg = isCorrect ? '#d4edda' : (isStudent ? '#f8d7da' : '#fff');
                    let border = isCorrect ? '#c3e6cb' : (isStudent ? '#f5c6cb' : '#eee');
                    let icon = isCorrect ? '<i class="fas fa-check-circle text-success" style="font-size:1.4rem;"></i>' : (isStudent ? '<i class="fas fa-times-circle text-danger" style="font-size:1.4rem;"></i>' : '<i class="far fa-circle text-muted" style="font-size:1.4rem;"></i>');
                    
                    qHtml += `<div style="padding:15px; border:2px solid ${border}; border-radius:10px; margin-bottom:10px; background:${bg}; display:flex; align-items:center; justify-content:space-between; font-size:1.1rem; font-weight:bold;">
                                <div style="display:flex; align-items:center; gap:10px;">${icon} <span>${choice}</span></div>
                                ${isStudent && !isCorrect ? '<span class="badge badge-danger">إجابتك</span>' : ''}
                                ${isStudent && isCorrect ? '<span class="badge badge-success">إجابتك</span>' : ''}
                              </div>`;
                } else {
                    const isSel = (ansValue == i) ? 'selected' : '';
                    qHtml += `<label class="answer-option ${isSel}" onclick="selectOption(this, ${index}, ${i})"><input type="radio" name="q_${q.id}" value="${i}" ${ansValue == i ? 'checked' : ''}> ${choice}</label>`;
                }
            });
            qHtml += `</div>`;
        }

        else if (q.type === 'missing-char') {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                if (isReadOnly) {
                    let savedImg = (ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}`]) ? `<img src="${ansValue[`p_${pIdx}`]}" style="max-width:100%; max-height:150px; border:2px solid #ccc; border-radius:10px; background:#fff;">` : `<p class="text-muted">لم يتم رسم إجابة</p>`;
                    let evalBadge = getEvalBadgeHTML(evaluations[`p_${pIdx}`]);
                    qHtml += `<div class="mb-4 text-center p-3" style="background:#f9f9f9; border-radius:10px;"><p class="text-muted small mb-2">أكمل الحرف الناقص:</p><div style="position:relative; display:inline-block;">${evalBadge}${savedImg}</div></div>`;
                } else {
                    qHtml += `<div class="mb-5 p-3 text-center" style="background:#f9f9f9; border-radius:10px;"><div class="handwriting-area"><p class="text-muted small mb-2">أكمل الحرف الناقص:</p><canvas id="canvas-${q.id}-${pIdx}" class="drawing-canvas missing-char-canvas" width="300" height="150" data-text="${p.missing || p.text}" style="border:2px solid #333; background:#fff; cursor:crosshair; border-radius:10px; touch-action:none;"></canvas><br><button class="btn btn-sm btn-outline-danger mt-2" onclick="clearCanvas('${q.id}-${pIdx}')">مسح</button></div></div>`;
                }
            });
            qHtml += `</div>`;
        }

        else if (q.type.includes('reading')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                let audioSrc = (ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}`]) ? ansValue[`p_${pIdx}`] : '';
                qHtml += `<div class="reading-box p-4 mb-3" style="background:#fff3e0; border-right:5px solid #ff9800; border-radius:5px;"><p style="font-size:1.8rem; text-align:center;">${p.text}</p></div>`;
                if (isReadOnly) {
                    let evalBadge = getEvalBadgeHTML(evaluations[`p_${pIdx}`]);
                    qHtml += `<div class="text-center p-3" style="background:#f8f9fa; border-radius:10px;"><div style="position:relative; display:inline-block; width:100%; max-width:350px;">${evalBadge}${audioSrc ? `<audio controls src="${audioSrc}" class="w-100"></audio>` : `<span class="text-muted">لا يوجد تسجيل</span>`}</div></div>`;
                } else {
                    qHtml += `<div class="recording-area text-center mb-4 p-3" style="background:#f8f9fa; border-radius:10px;"><div id="recorder-controls-${q.id}-${pIdx}">${audioSrc ? `<audio controls src="${audioSrc}" class="mb-2 w-100"></audio><button class="btn btn-warning btn-sm" onclick="resetRecording('${q.id}', '${pIdx}')">إعادة التسجيل</button>` : `<button class="btn btn-danger btn-lg" onclick="toggleRecording(this, '${q.id}', '${pIdx}')">🎙️ تسجيل</button>`}</div></div>`;
                }
            });
            qHtml += `</div>`;
        }

        else if (q.type.includes('spelling')) {
            qHtml += `<div class="paragraphs-container">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                qHtml += `<div class="mb-4 text-center"><button class="btn btn-info btn-lg mb-3" onclick="playAudio('${p.text}')">🔊 استماع للكلمة</button>`;
                if (isReadOnly) {
                    let savedImg = (ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}`]) ? `<img src="${ansValue[`p_${pIdx}`]}" style="max-width:100%; border:2px dashed #ccc; border-radius:10px; background:#fff;">` : `<p class="text-muted border p-4 bg-light rounded">لم يتم كتابة إجابة</p>`;
                    let evalBadge = getEvalBadgeHTML(evaluations[`p_${pIdx}`]);
                    qHtml += `<div style="position:relative; display:inline-block;">${evalBadge}${savedImg}</div></div>`;
                } else {
                    qHtml += `<div style="background:#fff; padding:10px; border-radius:10px; border:1px solid #ddd;"><canvas id="canvas-${q.id}-${pIdx}" class="drawing-canvas" width="600" height="250" style="border:2px dashed #ccc; background:#fff; cursor:crosshair; width:100%; touch-action:none;"></canvas></div><button class="btn btn-sm btn-secondary mt-2" onclick="clearCanvas('${q.id}-${pIdx}')">مسح</button></div>`;
                }
            });
            qHtml += `</div>`;
        }

        else if (q.type === 'drag-drop') {
            let allDraggables = []; 
            let sentencesHtml = '<div class="sentences-container" style="display:flex; flex-direction:column; gap:15px;">';

            (q.paragraphs || []).forEach((p, pIdx) => {
                let processedText = p.text;
                if (p.gaps) {
                    p.gaps.forEach((g, gIdx) => {
                        let saved = '';
                        if(ansValue && typeof ansValue === 'object' && ansValue[`p_${pIdx}_g_${gIdx}`]) {
                            saved = ansValue[`p_${pIdx}_g_${gIdx}`];
                        }
                        
                        if (isReadOnly) {
                            let isCorrect = saved.trim() === g.dragItem.trim();
                            let color = isCorrect ? '#155724' : '#721c24';
                            let bg = isCorrect ? '#d4edda' : '#f8d7da';
                            let border = isCorrect ? '#c3e6cb' : '#f5c6cb';
                            let displayWord = saved ? saved : '<span style="color:#999; font-size:0.95rem;">(لم يُجب)</span>';
                            let icon = saved ? (isCorrect ? '<i class="fas fa-check" style="margin-right:8px;"></i>' : '<i class="fas fa-times" style="margin-right:8px;"></i>') : '';
                            let wordBadge = `<span style="background:${bg}; color:${color}; padding:2px 15px; border-radius:8px; border-bottom:3px solid ${border}; font-weight:bold; margin:0 5px; display:inline-flex; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.05); pointer-events:none;">${displayWord} ${icon}</span>`;
                            processedText = processedText.replace(g.dragItem, wordBadge);
                        } else {
                            const dropId = `drop-${q.id}-${pIdx}-${gIdx}`;
                            processedText = processedText.replace(g.dragItem, `<span class="drop-zone" id="${dropId}" ondrop="drop(event)" ondragover="allowDrop(event)" onclick="handleDropZoneTap(this)" title="اضغط لإضافة أو إزالة الكلمة" data-qid="${index}" data-pid="${pIdx}" data-gid="${gIdx}">${saved}</span>`);
                            const uniqueId = `w-${q.id}-${pIdx}-${gIdx}-${Math.random().toString(36).substr(2, 5)}`;
                            allDraggables.push({ word: g.dragItem, id: uniqueId });
                        }
                    });
                }
                sentencesHtml += `<div class="sentence-area">${processedText}</div>`;
            });
            sentencesHtml += '</div>';

            if (!isReadOnly && allDraggables.length > 0) {
                allDraggables.sort(() => Math.random() - 0.5);
                qHtml += `<div class="text-center text-muted mb-2" style="font-size:0.95rem; background:#fff3cd; color:#856404; padding:8px; border-radius:5px; border:1px solid #ffeeba;">💡 <strong>طريقة الحل:</strong> اسحب الكلمة للمكان المناسب، <br> (أو <strong>اضغط</strong> على الكلمة ثم <strong>اضغط</strong> على الفراغ لتنزيلها، ويمكنك الضغط على الفراغ لإعادتها).</div>`;
                qHtml += `<div class="word-bank mb-4" style="background:#f1f8e9; padding:20px; border-radius:10px; border:2px dashed #8bc34a; display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:25px;">`;
                allDraggables.forEach(item => {
                    qHtml += `<div class="draggable-word" draggable="true" ondragstart="drag(event)" onclick="handleWordTap(this)" id="${item.id}" style="background:#fff; border:2px solid #c5e1a5; color:#33691e; padding:8px 20px; border-radius:25px; font-weight:bold; font-size:1.1rem; box-shadow:0 2px 5px rgba(0,0,0,0.05); display:inline-block;">${item.word}</div>`;
                });
                qHtml += `</div>`;
            }
            qHtml += sentencesHtml;
        }
        
        else if (q.type === 'open-ended') {
            const roAttr = isReadOnly ? 'readonly style="background:#f1f5f9;"' : '';
            qHtml += `<textarea class="form-control" rows="4" placeholder="اكتب إجابتك هنا..." onchange="saveSimpleAnswer(${index}, this.value)" ${roAttr}>${ansValue || ''}</textarea>`;
        }

        qHtml += `</div>`;
        container.insertAdjacentHTML('beforeend', qHtml);
    });

    initializeDragAndDropState();
    updateNavigationButtons();
}

function initializeDragAndDropState() {
    if (currentAssignment && currentAssignment.status === 'completed') return;
    document.querySelectorAll('.question-card').forEach(card => {
        const dropZones = card.querySelectorAll('.drop-zone');
        const draggables = Array.from(card.querySelectorAll('.draggable-word'));
        dropZones.forEach(zone => {
            const text = zone.innerText.trim();
            if (text && !zone.dataset.sourceId) {
                const match = draggables.find(d => d.innerText.trim() === text && d.style.display !== 'none');
                if (match) { match.style.display = 'none'; zone.dataset.sourceId = match.id; zone.style.background = '#e3f2fd'; }
            }
        });
    });
}

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
        <div style="display:flex; gap:10px;">${actionButtons}${(!isLast) ? '<button class="btn-nav btn-next" onclick="nextQuestion()">التالي</button>' : ''}</div>`;
}

let isDrawing = false;
let ctx = null;

function initCanvas(id) {
    const canvas = document.getElementById(`canvas-${id}`);
    if(!canvas) return;
    const context = canvas.getContext('2d');
    context.lineWidth = 4; context.lineCap = 'round'; context.strokeStyle = '#d32f2f';
    const bgText = canvas.dataset.text;
    if (bgText) drawTextBackground(canvas, bgText);
    const startDraw = (e) => { isDrawing = true; ctx = context; ctx.beginPath(); const pos = getPos(canvas, e); ctx.moveTo(pos.x, pos.y); };
    const moveDraw = (e) => { if(!isDrawing) return; e.preventDefault(); const pos = getPos(canvas, e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); };
    canvas.addEventListener('mousedown', startDraw); canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('mousemove', moveDraw); canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('mouseup', () => isDrawing = false); canvas.addEventListener('touchend', () => isDrawing = false);
    try {
        const qId = id.split('-')[0]; const pIdx = id.split('-')[1];
        const savedEntry = userAnswers.find(a => a.questionId == qId);
        if(savedEntry && savedEntry.answer && typeof savedEntry.answer === 'object' && savedEntry.answer[`p_${pIdx}`]) {
            const img = new Image(); img.onload = () => context.drawImage(img, 0, 0); img.src = savedEntry.answer[`p_${pIdx}`];
        }
    } catch (e) {}
}

function drawTextBackground(canvas, text) {
    const context = canvas.getContext('2d');
    context.font = "bold 50px 'Tajawal', sans-serif"; context.fillStyle = "#212529"; 
    context.textAlign = "center"; context.textBaseline = "middle";
    const displayText = text.replace(/[_\-]/g, '......');
    context.fillText(displayText, canvas.width / 2, canvas.height / 2);
}

function getPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function clearCanvas(id) {
    const cvs = document.getElementById(`canvas-${id}`); const cx = cvs.getContext('2d');
    cx.clearRect(0,0, cvs.width, cvs.height);
    const bgText = cvs.dataset.text; if (bgText) drawTextBackground(cvs, bgText);
}

async function toggleRecording(btn, qId, pIdx) {
    if (!activeRecordingId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream); audioChunks = []; activeRecordingId = `${qId}-${pIdx}`;
            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader(); reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result; saveInputAnswerByQId(qId, `p_${pIdx}`, base64Audio);
                    const container = document.getElementById(`recorder-controls-${qId}-${pIdx}`);
                    container.innerHTML = `<audio controls src="${base64Audio}" class="mb-2 w-100"></audio><button class="btn btn-warning btn-sm" onclick="resetRecording('${qId}', '${pIdx}')">إعادة التسجيل</button><div class="alert alert-success mt-2 p-1"><small>تم الحفظ!</small></div>`;
                };
                stream.getTracks().forEach(track => track.stop()); activeRecordingId = null;
            };
            mediaRecorder.start(); btn.classList.add('recording'); btn.innerHTML = '<i class="fas fa-stop"></i> إيقاف';
            btn.classList.remove('btn-danger'); btn.classList.add('btn-dark');
        } catch (err) { showError('عذراً، لم نتمكن من الوصول للميكروفون. يرجى التأكد من صلاحيات المتصفح.'); }
    } else { if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop(); }
}

function resetRecording(qId, pIdx) {
    document.getElementById(`recorder-controls-${qId}-${pIdx}`).innerHTML = `<button class="btn btn-danger btn-lg pulse-animation" id="btn-record-${qId}-${pIdx}" onclick="toggleRecording(this, '${qId}', '${pIdx}')"><i class="fas fa-microphone"></i> تسجيل</button>`;
    saveInputAnswerByQId(qId, `p_${pIdx}`, null);
}

function selectOption(el, qIdx, choiceIdx) {
    if(currentAssignment.status === 'completed') return;
    const card = document.getElementById(`q-card-${qIdx}`);
    card.querySelectorAll('.answer-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected'); el.querySelector('input').checked = true;
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
        let canvasAnswers = {}; let entry = userAnswers.find(a => a.questionId == q.id);
        if(entry && typeof entry.answer === 'object') canvasAnswers = entry.answer;
        let hasNewDrawing = false;
        (q.paragraphs || []).forEach((p, pIdx) => {
            const cvs = document.getElementById(`canvas-${q.id}-${pIdx}`);
            if(cvs) { canvasAnswers[`p_${pIdx}`] = cvs.toDataURL(); hasNewDrawing = true; }
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
            allAssignments[idx].status = 'completed'; allAssignments[idx].completedDate = new Date().toISOString(); currentAssignment.status = 'completed'; 
        } else {
            allAssignments[idx].status = 'in-progress'; currentAssignment.status = 'in-progress';
        }
        localStorage.setItem('studentTests', JSON.stringify(allAssignments));
    }
    if(!submit) {
        showSuccess('تم حفظ إجاباتك بنجاح ✅');
        if (isExiting) setTimeout(() => { closeTestMode(); }, 1000); 
    } else {
        showInfoModal('تم التسليم بنجاح! 🎉', 'لقد قمت بتسليم الاختبار بنجاح، وهو الآن بانتظار المراجعة والتصحيح من قبل المعلم.', function() { closeTestMode(); });
    }
}

function exitAndSaveTest() { if (currentAssignment && currentAssignment.status !== 'completed') saveTestProgress(false, true); else closeTestMode(); }
window.exitAndSaveTest = exitAndSaveTest;

function finishTest() {
    showConfirmModal('هل أنت متأكد من رغبتك في تسليم الاختبار نهائياً؟<br><span style="color:#dc3545; font-size:0.9rem; margin-top:5px; display:block;">⚠️ تذكر: لن تتمكن من تعديل إجاباتك بعد التسليم.</span>', function() { saveTestProgress(true); });
}

function playAudio(text) { const speech = new SpeechSynthesisUtterance(text); speech.lang = 'ar-SA'; window.speechSynthesis.speak(speech); }

function handleWordTap(el) {
    if(currentAssignment.status === 'completed') return;
    document.querySelectorAll('.draggable-word').forEach(w => w.classList.remove('selected-word'));
    activeSelectedWord = el; el.classList.add('selected-word');
}

function handleDropZoneTap(zone) {
    if(currentAssignment.status === 'completed') return;
    const hasText = zone.innerText.trim() !== '';
    if (hasText) returnWordToBank(zone);
    if (activeSelectedWord) {
        zone.innerText = activeSelectedWord.innerText; zone.style.background = '#e3f2fd'; zone.dataset.sourceId = activeSelectedWord.id;
        activeSelectedWord.style.display = 'none'; activeSelectedWord.classList.remove('selected-word');
        const qIdx = zone.dataset.qid; const pIdx = zone.dataset.pid; const gIdx = zone.dataset.gid;
        saveInputAnswerByQId(currentTest.questions[qIdx].id, `p_${pIdx}_g_${gIdx}`, zone.innerText);
        activeSelectedWord = null; 
    }
}

function returnWordToBank(zone) {
    const text = zone.innerText.trim(); if (!text) return; 
    const sourceId = zone.dataset.sourceId;
    if (sourceId) {
        const srcEl = document.getElementById(sourceId); if (srcEl) srcEl.style.display = 'inline-block';
    } else {
        const card = zone.closest('.question-card');
        if (card) {
           const words = Array.from(card.querySelectorAll('.draggable-word'));
           const hiddenMatch = words.find(w => w.style.display === 'none' && w.innerText.trim() === text);
           if (hiddenMatch) hiddenMatch.style.display = 'inline-block';
        }
    }
    zone.innerText = ''; zone.style.background = '#fafafa'; delete zone.dataset.sourceId;
    const qIdx = zone.dataset.qid; const pIdx = zone.dataset.pid; const gIdx = zone.dataset.gid;
    saveInputAnswerByQId(currentTest.questions[qIdx].id, `p_${pIdx}_g_${gIdx}`, '');
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { 
    ev.dataTransfer.setData("text", ev.target.innerText); ev.dataTransfer.setData("id", ev.target.id); 
    if(activeSelectedWord) { activeSelectedWord.classList.remove('selected-word'); activeSelectedWord = null; }
}

function drop(ev) {
    if(currentAssignment.status === 'completed') return;
    ev.preventDefault(); const data = ev.dataTransfer.getData("text"); const elId = ev.dataTransfer.getData("id");
    if (!elId || !data) return;
    const dropZone = ev.target.closest('.drop-zone');
    if(dropZone) {
        if (dropZone.innerText.trim()) returnWordToBank(dropZone);
        dropZone.innerText = data; dropZone.style.background = '#e3f2fd'; dropZone.dataset.sourceId = elId;
        const srcEl = document.getElementById(elId); if(srcEl) srcEl.style.display = 'none';
        const qIdx = dropZone.dataset.qid; const pIdx = dropZone.dataset.pid; const gIdx = dropZone.dataset.gid;
        saveInputAnswerByQId(currentTest.questions[qIdx].id, `p_${pIdx}_g_${gIdx}`, data);
    }
}

window.handleWordTap = handleWordTap; window.handleDropZoneTap = handleDropZoneTap; window.returnWordToBank = returnWordToBank;

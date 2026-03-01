// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: ملف الطالب للمعلم + تصحيح المعلم للرسم الكتابي (سحابي 100%)
// ============================================

let currentStudentId = null; 
let currentStudent = null; 
let editingEventId = null;

// =========================================================
// 🔥 دوال النوافذ المنبثقة والإشعارات 🔥
// =========================================================
if (!window.showConfirmModal) { window.showConfirmModal = function(message, onConfirm) { let modal = document.getElementById('globalConfirmModal'); if (!modal) { const modalHtml = `<div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div><div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div><div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div><div style="display:flex; gap:15px; justify-content:center;"><button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button><button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', modalHtml); modal = document.getElementById('globalConfirmModal'); } document.getElementById('globalConfirmMessage').innerHTML = message; modal.style.display = 'flex'; document.getElementById('globalConfirmOk').onclick = function() { modal.style.display = 'none'; if (typeof onConfirm === 'function') onConfirm(); }; document.getElementById('globalConfirmCancel').onclick = function() { modal.style.display = 'none'; }; }; }
if (!window.showSuccess) { window.showSuccess = function(message) { let toast = document.getElementById('globalSuccessToast'); if (!toast) { const toastHtml = `<div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalSuccessToast'); } document.getElementById('globalSuccessMessage').textContent = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 3000); }; }
if (!window.showError) { window.showError = function(message) { let toast = document.getElementById('globalErrorToast'); if (!toast) { const toastHtml = `<div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalErrorToast'); } document.getElementById('globalErrorMessage').innerHTML = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 4000); }; }
if (!window.showInfoModal) { window.showInfoModal = function(title, message, onClose) { let modal = document.getElementById('globalInfoModal'); if (!modal) { const modalHtml = `<div id="globalInfoModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:3.5rem; color:#007bff; margin-bottom:15px;"><i class="fas fa-info-circle"></i></div><div id="globalInfoTitle" style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;"></div><div id="globalInfoMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div><div style="display:flex; justify-content:center;"><button id="globalInfoOk" style="background:#007bff; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; font-family:'Tajawal'; width:100%;">حسناً، فهمت</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', modalHtml); modal = document.getElementById('globalInfoModal'); } document.getElementById('globalInfoTitle').innerHTML = title; document.getElementById('globalInfoMessage').innerHTML = message; modal.style.display = 'flex'; document.getElementById('globalInfoOk').onclick = function() { modal.style.display = 'none'; if (typeof onClose === 'function') onClose(); }; }; }

function injectReviewStyles() {
    if (document.getElementById('customReviewStyles')) return;
    const style = document.createElement('style'); style.id = 'customReviewStyles';
    style.innerHTML = `.student-answer-box { padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; border-right: 4px solid #007bff; white-space: pre-wrap; word-break: break-word; font-size: 1.05rem; line-height: 1.6; overflow-x: hidden; } .review-question-item { border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; border-radius: 12px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.02); } .review-q-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; background: #f1f5f9; padding: 12px 15px; border-radius: 8px; } .score-input-container { display: flex; align-items: center; gap: 5px; background: #fff; padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; } .score-input { width: 70px; text-align: center; font-weight: bold; border: 1px solid #ccc; border-radius: 4px; padding: 4px; font-size:1.1rem; color:#007bff; } .teacher-feedback-box textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; min-height: 80px; margin-top: 10px; font-family: inherit; } .reading-word-eval { display:inline-block; font-size:1.2rem; margin:5px; cursor:pointer; padding:8px 15px; border-radius:8px; transition:0.2s; border:2px solid transparent; user-select:none; } .reading-word-eval:hover { transform:scale(1.05); } .word-neutral { background:#f1f5f9; color:#475569; border-color:#cbd5e1; } .word-correct { background:#d4edda; color:#155724; border-color:#c3e6cb; } .word-wrong { background:#f8d7da; color:#721c24; border-color:#f5c6cb; }`;
    document.head.appendChild(style);
}

function injectWordTableStyles() {
    if (document.getElementById('wordTableStyles')) return;
    const style = document.createElement('style'); style.id = 'wordTableStyles';
    style.innerHTML = `.word-table { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', 'Tajawal', serif; font-size: 1rem; background: white; border: 2px solid #000; } .word-table th, .word-table td { border: 1px solid #000; padding: 8px 12px; vertical-align: middle; } .word-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; border-bottom: 2px solid #000; } .word-table tr:nth-child(even) { background-color: #fafafa; } .bg-success-light { background-color: #e8f5e9 !important; } .bg-danger-light { background-color: #ffebee !important; } .bg-warning-light { background-color: #fff3e0 !important; } .bg-info-light { background-color: #e3f2fd !important; } .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0 5px; transition: transform 0.2s; } .btn-icon:hover { transform: scale(1.2); } .badge { padding: 5px 10px; border-radius: 12px; color: white; font-size: 0.8rem; } .badge-success { background-color: #28a745; } .badge-danger { background-color: #dc3545; } @media print { .no-print { display: none !important; } }`;
    document.head.appendChild(style);
}

function injectAdminEventModal() { 
    if (document.getElementById('adminEventModal')) return; 
    const html = `<div id="adminEventModal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="modalTitle">تسجيل حدث إداري</h3><button class="modal-close" onclick="closeAdminEventModal()">×</button></div><div class="modal-body"><input type="hidden" id="editingEventId"><div class="form-group"><label>نوع الحالة:</label><select id="manualEventType" class="form-control"><option value="excused">معفى (يخصم من الرصيد)</option><option value="vacation">إجازة (توقف مؤقت)</option></select></div><div class="form-group"><label>التاريخ:</label><input type="date" id="manualEventDate" class="form-control"></div><div class="form-group"><label>ملاحظات:</label><textarea id="manualEventNote" class="form-control"></textarea></div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeAdminEventModal()">إلغاء</button><button class="btn btn-primary" onclick="saveAdminEvent()">حفظ السجل</button></div></div></div>`; 
    document.body.insertAdjacentHTML('beforeend', html); 
}

function injectHomeworkModal() { 
    if (document.getElementById('assignHomeworkModal')) return; 
    const html = `<div id="assignHomeworkModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>إسناد واجب جديد</h3><button class="modal-close" onclick="closeModal('assignHomeworkModal')">×</button></div><div class="modal-body"><div class="form-group"><label>اختر الواجب من المكتبة:</label><select id="homeworkSelect" class="form-control"><option value="">جارِ التحميل...</option></select></div><div class="form-group"><label>تاريخ التسليم:</label><input type="date" id="homeworkDueDate" class="form-control"></div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('assignHomeworkModal')">إلغاء</button><button class="btn btn-primary" onclick="assignHomework()">حفظ الإسناد</button></div></div></div>`; 
    document.body.insertAdjacentHTML('beforeend', html); 
}

document.addEventListener('DOMContentLoaded', function() {
    injectAdminEventModal(); 
    injectHomeworkModal(); 
    injectWordTableStyles(); 
    injectReviewStyles(); 
    
    const params = new URLSearchParams(window.location.search); 
    currentStudentId = parseInt(params.get('id'));
    if (!currentStudentId) { 
        showError('لم يتم تحديد طالب'); 
        setTimeout(() => { window.location.href = 'students.html'; }, 1000); 
        return; 
    }
    loadStudentData();
});

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')); }

async function loadStudentData() {
    try {
        const { data: student, error } = await window.supabase.from('users').select('*').eq('id', currentStudentId).single();
        if (error || !student) throw new Error('الطالب غير موجود');
        
        currentStudent = student;
        if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
        if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
        if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
        if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
        document.title = `ملف الطالب: ${currentStudent.name}`;
        
        await calculateAndSetStudentProgress();
        switchSection('diagnostic');
    } catch(e) {
        console.error(e);
        showError('حدث خطأ في جلب بيانات الطالب');
        setTimeout(() => { window.location.href = 'students.html'; }, 1500);
    }
}

function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const activeLink = document.getElementById(`link-${sectionId}`); if(activeLink) activeLink.classList.add('active');
    const activeSection = document.getElementById(`section-${sectionId}`); if(activeSection) activeSection.classList.add('active');
    
    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

async function calculateAndSetStudentProgress() {
    try {
        const { data: myLessons } = await window.supabase.from('student_lessons').select('status, passedByAlternative').eq('studentId', currentStudentId);
        let progressPct = 0;
        if (myLessons && myLessons.length > 0) {
            const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
            progressPct = Math.round((completed / myLessons.length) * 100);
        }
        document.querySelectorAll('.progress-percentage, .progress-text, #progressPercentage, #studentProgressText, #sideProgress').forEach(el => el.innerText = progressPct + '%');
        document.querySelectorAll('.progress-bar, .progress-bar-fill, #studentProgressBar, #sideProgressBar').forEach(el => {
            el.style.width = progressPct + '%';
            if (progressPct >= 80) el.style.backgroundColor = '#28a745'; 
            else if (progressPct >= 50) el.style.backgroundColor = '#17a2b8'; 
            else el.style.backgroundColor = '#ffc107'; 
        });
        await window.supabase.from('users').update({ progress: progressPct }).eq('id', currentStudentId);
        return progressPct;
    } catch(e) { console.error(e); return 0; }
}

function normalizeText(text) {
    if (!text) return "";
    return String(text).trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
}

function getEvalBadgeHTML(evalState) {
    if (evalState === 'correct') return `<div style="position:absolute; top:-15px; right:-15px; background:#28a745; color:white; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; box-shadow:0 3px 6px rgba(0,0,0,0.2); z-index:10; border:2px solid #fff;">✔️</div>`;
    if (evalState === 'wrong') return `<div style="position:absolute; top:-15px; right:-15px; background:#dc3545; color:white; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; box-shadow:0 3px 6px rgba(0,0,0,0.2); z-index:10; border:2px solid #fff;">❌</div>`;
    return '';
}

// ============================================
// دالة بناء واجهة المراجعة والتصحيح
// ============================================
function buildTeacherReviewItem(q, index, studentAnsObj) {
    let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
    let evaluations = (studentAnsObj && studentAnsObj.evaluations) ? studentAnsObj.evaluations : {};
    let maxScore = parseFloat(q.maxScore || q.passingScore || 1);
    let currentScore = studentAnsObj ? studentAnsObj.score : 0;
    let teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
    let html = '';

    if (q.type === 'handwriting') { // 🔥 مراجعة الرسم الكتابي
        html += `<div class="paragraphs-container" style="display:flex; flex-direction:column; gap:20px;">`;
        (q.paragraphs || []).forEach((p, pIdx) => {
            let pKey = `p_${pIdx}`;
            let studentImg = (rawAnswer && typeof rawAnswer === 'object') ? rawAnswer[pKey] : null;
            let existingCorrection = evaluations[`${pKey}_teacherCorrection`] || '';
            
            html += `<div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:15px; text-align:center;">`;
            html += `<h5 style="color:#333; margin-bottom:10px; font-size:1.8rem;">${p.text}</h5>`;
            
            if(studentImg) {
                // إزالة تمرير الصورة كنص للزر لتجنب أخطاء HTML Parsing
                html += `
                <div class="correction-toolbar mb-3" style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; background:#f8f9fa; padding:10px; border-radius:8px;">
                    <button type="button" class="btn btn-sm btn-danger" id="tc-pen-${q.id}-${pIdx}" onclick="setCorrectionMode('${q.id}', '${pIdx}', 'pen')"><i class="fas fa-pen"></i> قلم أحمر</button>
                    <button type="button" class="btn btn-sm btn-outline-success" id="tc-stamp-c-${q.id}-${pIdx}" onclick="setCorrectionMode('${q.id}', '${pIdx}', 'stamp-correct')">✔️ ختم (صح)</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" id="tc-stamp-w-${q.id}-${pIdx}" onclick="setCorrectionMode('${q.id}', '${pIdx}', 'stamp-wrong')">❌ ختم (خطأ)</button>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="clearCorrection('${q.id}', '${pIdx}')"><i class="fas fa-undo"></i> تراجع/مسح</button>
                </div>
                <div style="position:relative; display:inline-block; border:2px solid #ccc; border-radius:8px; overflow:hidden; max-width:100%;">
                    <canvas id="tc-canvas-${q.id}-${pIdx}" style="cursor:crosshair; touch-action:none; display:block; max-width:100%;"></canvas>
                </div>
                <input type="hidden" name="correction_img_${q.id}_${pIdx}" id="tc-output-${q.id}-${pIdx}" value="${existingCorrection}">
                `;
                setTimeout(()=> initTeacherCorrectionCanvas(q.id, pIdx, studentImg, existingCorrection), 100);
            } else {
                html += '<span class="text-muted p-3 border rounded d-block bg-light">لم يُجب الطالب</span>';
            }
            html += `</div>`;
        });
        html += `</div>`;
    }
    else if (q.type.includes('mcq')) {
        let sAns = (rawAnswer !== null && rawAnswer !== undefined && rawAnswer !== '') ? parseInt(rawAnswer) : -1;
        let cAns = (q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== '') ? parseInt(q.correctAnswer) : -1;
        html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
        (q.choices || []).forEach((choice, i) => {
            let isStudent = (sAns === i); let isCorrect = (cAns === i);
            let bg = isCorrect ? '#d4edda' : (isStudent ? '#f8d7da' : '#f8f9fa'); let border = isCorrect ? '#c3e6cb' : (isStudent ? '#f5c6cb' : '#eee'); let icon = isCorrect ? '✅' : (isStudent ? '❌' : '');
            html += `<div style="padding:10px; border:2px solid ${border}; border-radius:8px; background:${bg}; display:flex; justify-content:space-between; align-items:center; font-weight:bold;"><span>${icon} ${choice}</span>${isStudent && !isCorrect ? '<span class="badge badge-danger">إجابة الطالب</span>' : ''}${isStudent && isCorrect ? '<span class="badge badge-success">إجابة الطالب</span>' : ''}</div>`;
        });
        html += `</div>`;
    } else if (q.type === 'drag-drop') {
        if (!q.paragraphs || q.paragraphs.length === 0) html += '<span class="text-muted">لا توجد جمل لعرضها</span>';
        else {
            let sentencesHtml = '<div style="display:flex; flex-direction:column; gap:15px; margin-top:10px;">';
            q.paragraphs.forEach((p, pIdx) => {
                let processedText = p.text;
                if (p.gaps) {
                    p.gaps.forEach((g, gIdx) => {
                        let studentWord = (rawAnswer && typeof rawAnswer === 'object' && rawAnswer[`p_${pIdx}_g_${gIdx}`]) ? rawAnswer[`p_${pIdx}_g_${gIdx}`] : '';
                        let isCorrect = studentWord.trim() === g.dragItem.trim();
                        let color = isCorrect ? '#155724' : '#721c24'; let bg = isCorrect ? '#d4edda' : '#f8d7da'; let border = isCorrect ? '#c3e6cb' : '#f5c6cb';
                        let displayWord = studentWord ? studentWord : '<span style="color:#999; font-size:0.95rem;">(لم يُجب)</span>';
                        let wordBadge = `<span style="background:${bg}; color:${color}; padding:2px 15px; border-radius:8px; border-bottom:3px solid ${border}; font-weight:bold; margin:0 5px;">${displayWord}</span>`;
                        processedText = processedText.replace(g.dragItem, wordBadge);
                    });
                }
                sentencesHtml += `<div style="background:#fff; padding:15px; border:1px solid #e2e8f0; border-radius:10px; font-size:1.2rem; line-height:2.6;">${processedText}</div>`;
            });
            html += sentencesHtml + '</div>';
        }
    } else if (q.paragraphs && q.paragraphs.length > 0) {
        if (q.type === 'manual-reading') {
            html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
            q.paragraphs.forEach((p, pIdx) => {
                let pKey = `p_${pIdx}`; let words = (p.text || '').trim().split(/\s+/);
                let wordsHtml = words.map((w, wIdx) => {
                    let wKey = `${pKey}_w_${wIdx}`; let wEval = evaluations[wKey] || '';
                    let wClass = wEval === 'correct' ? 'word-correct' : (wEval === 'wrong' ? 'word-wrong' : 'word-neutral'); let icon = wEval === 'correct' ? ' ✔️' : (wEval === 'wrong' ? ' ❌' : '');
                    return `<span class="reading-word-eval ${wClass}" onclick="toggleReadingWord(this, '${q.id}', '${wKey}')" data-state="${wEval}">${w}${icon}<input type="hidden" name="eval_${q.id}_${wKey}" value="${wEval}"></span>`;
                }).join(' ');
                html += `<div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; background:#fff;"><div style="font-weight:bold; margin-bottom:10px; color:#007bff;"><i class="fas fa-hand-pointer"></i> اضغط على الكلمة لتصحيحها:</div><div style="background:#f8f9fa; padding:15px; border-radius:5px; line-height:2.8; text-align:justify;">${wordsHtml}</div></div>`;
            });
            html += `</div>`;
        } else {
            html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
            q.paragraphs.forEach((p, pIdx) => {
                let pKey = `p_${pIdx}`; let pAns = (rawAnswer && typeof rawAnswer === 'object') ? rawAnswer[pKey] : null; let evalState = evaluations[pKey] || ''; 
                let displayAns = pAns ? (pAns.startsWith('data:image') ? `<img src="${pAns}" style="max-height:100px;">` : pAns) : '<span class="text-muted">لم يُجب</span>';
                let btnCorrect = `<button type="button" class="btn btn-sm ${evalState === 'correct' ? 'btn-success' : 'btn-outline-success'}" onclick="setEvalState(this, '${q.id}', '${pKey}', 'correct')">✔️ صحيح</button>`;
                let btnWrong = `<button type="button" class="btn btn-sm ${evalState === 'wrong' ? 'btn-danger' : 'btn-outline-danger'}" onclick="setEvalState(this, '${q.id}', '${pKey}', 'wrong')">❌ خاطئ</button>`;
                html += `<div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; background:#fff; text-align:center;">${displayAns}<br><div class="mt-2">${btnCorrect} ${btnWrong}</div><input type="hidden" name="eval_${q.id}_${pKey}" value="${evalState}"></div>`;
            });
            html += `</div>`;
        }
    } else {
        html += `<div style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #eee;">${rawAnswer || 'لم يُجب'}</div>`;
    }
    
    return `<div class="review-question-item" id="q-review-item-${q.id}">
        <div class="review-q-header" style="background:#e3f2fd; border-bottom:2px solid #90caf9;">
            <div style="flex:1; font-size:1.1rem; color:#1565c0;"><strong>س${index+1}: ${q.text}</strong></div>
            <div class="score-input-container">
                <input type="number" step="0.5" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0">
                <span class="text-muted"> / ${maxScore} درجة</span>
            </div>
        </div>
        <div class="student-answer-box" style="${q.type==='handwriting'?'background:transparent; border:none; padding:0;':''}">${html}</div>
        <div class="teacher-feedback-box mt-3">
            <label>ملاحظات المعلم (تظهر للطالب):</label>
            <textarea class="form-control" name="note_${q.id}">${teacherNote}</textarea>
        </div>
    </div>`;
}

// ============================================
// لوحة تصحيح المعلم للرسم الكتابي (Teacher Canvas)
// ============================================
let tcContexts = {};

function initTeacherCorrectionCanvas(qId, pIdx, originalImgBase64, existingCorrection) {
    const canvasId = `tc-canvas-${qId}-${pIdx}`;
    const key = `${qId}-${pIdx}`; // استخدام المفتاح الصحيح
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        tcContexts[key] = { ctx: ctx, canvas: canvas, mode: 'pen', baseImg: img }; // حفظ باستخدام المفتاح الموحد
        
        ctx.strokeStyle = '#dc3545'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        setCorrectionMode(qId, pIdx, 'pen');

        let isDrawing = false; let lastX = 0, lastY = 0;
        const getPosTC = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
        };

        const handleDown = (e) => {
            if(e.type === 'touchstart') e.preventDefault();
            const pos = getPosTC(e);
            const mode = tcContexts[key].mode;
            if(mode === 'pen') {
                isDrawing = true; lastX = pos.x; lastY = pos.y;
                ctx.beginPath(); ctx.moveTo(lastX, lastY);
            } else if (mode === 'stamp-correct' || mode === 'stamp-wrong') {
                ctx.font = 'bold 50px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = mode === 'stamp-correct' ? '#28a745' : '#dc3545';
                ctx.fillText(mode === 'stamp-correct' ? '✔️' : '❌', pos.x, pos.y);
                updateOutput(qId, pIdx);
            }
        };

        const handleMove = (e) => {
            if(!isDrawing || tcContexts[key].mode !== 'pen') return;
            e.preventDefault(); const pos = getPosTC(e);
            ctx.lineTo(pos.x, pos.y); ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        };

        const handleUp = () => { if(isDrawing) { isDrawing = false; ctx.closePath(); updateOutput(qId, pIdx); } };

        canvas.addEventListener('mousedown', handleDown); canvas.addEventListener('touchstart', handleDown, { passive: false });
        canvas.addEventListener('mousemove', handleMove); canvas.addEventListener('touchmove', handleMove, { passive: false });
        canvas.addEventListener('mouseup', handleUp); canvas.addEventListener('touchend', handleUp); canvas.addEventListener('mouseout', handleUp);
    };
    img.src = existingCorrection ? existingCorrection : originalImgBase64;
}

window.setCorrectionMode = function(qId, pIdx, mode) {
    const key = `${qId}-${pIdx}`;
    if(!tcContexts[key]) return;
    tcContexts[key].mode = mode;
    
    document.getElementById(`tc-pen-${key}`).className = 'btn btn-sm btn-outline-danger';
    document.getElementById(`tc-stamp-c-${key}`).className = 'btn btn-sm btn-outline-success';
    document.getElementById(`tc-stamp-w-${key}`).className = 'btn btn-sm btn-outline-danger';

    if (mode === 'pen') document.getElementById(`tc-pen-${key}`).classList.replace('btn-outline-danger', 'btn-danger');
    else if (mode === 'stamp-correct') document.getElementById(`tc-stamp-c-${key}`).classList.replace('btn-outline-success', 'btn-success');
    else if (mode === 'stamp-wrong') document.getElementById(`tc-stamp-w-${key}`).classList.replace('btn-outline-danger', 'btn-danger');
}

window.clearCorrection = function(qId, pIdx) {
    const key = `${qId}-${pIdx}`;
    if(!tcContexts[key]) return;
    tcContexts[key].ctx.clearRect(0, 0, tcContexts[key].canvas.width, tcContexts[key].canvas.height);
    tcContexts[key].ctx.drawImage(tcContexts[key].baseImg, 0, 0);
    updateOutput(qId, pIdx);
}

function updateOutput(qId, pIdx) {
    const canvas = document.getElementById(`tc-canvas-${qId}-${pIdx}`);
    const output = document.getElementById(`tc-output-${qId}-${pIdx}`);
    if(canvas && output) output.value = canvas.toDataURL('image/png');
}

// ============================================
// حفظ المراجعة والتقييم
// ============================================
async function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const type = document.getElementById('reviewAssignmentId').getAttribute('data-type');
    let tableName = type === 'test' ? 'student_tests' : (type === 'lesson' ? 'student_lessons' : 'student_assignments');

    try {
        const { data: record } = await window.supabase.from(tableName).select('*').eq('id', id).single();
        if (!record) return showError('السجل غير موجود');

        const container = document.getElementById('reviewQuestionsContainer');
        let totalScore = 0, maxTotalScore = 0, questions = [];
        
        if (type === 'assignment') {
            const { data: orig } = await window.supabase.from('assignments').select('*').eq('title', record.title).single();
            questions = record.questions || (orig ? orig.questions : []);
        } else if (type === 'test') {
            const { data: orig } = await window.supabase.from('tests').select('*').eq('id', record.testId).single();
            if(orig) questions = orig.questions;
        } else if (type === 'lesson') {
            const { data: orig } = await window.supabase.from('lessons').select('*').eq('id', record.originalLessonId).single();
            if(orig) questions = [...(orig.exercises?.questions || []), ...(orig.assessment?.questions || [])];
        }

        let updatedAnswers = record.answers || [];

        if(questions && questions.length > 0) {
            questions.forEach(q => {
                const scoreInp = container.querySelector(`input[name="score_${q.id}"]`);
                const noteInp = container.querySelector(`textarea[name="note_${q.id}"]`);
                let ansIdx = updatedAnswers.findIndex(a => a.questionId == q.id);
                let newScore = scoreInp && scoreInp.value !== '' ? parseFloat(scoreInp.value) : 0;
                
                if(ansIdx === -1) { updatedAnswers.push({ questionId: q.id, answer: null }); ansIdx = updatedAnswers.length - 1; }
                
                updatedAnswers[ansIdx].score = newScore;
                updatedAnswers[ansIdx].teacherNote = noteInp ? noteInp.value : '';
                if (!updatedAnswers[ansIdx].evaluations) updatedAnswers[ansIdx].evaluations = {};
                
                if (q.type === 'handwriting' && q.paragraphs) {
                    q.paragraphs.forEach((p, pIdx) => {
                        const correctionInput = container.querySelector(`#tc-output-${q.id}-${pIdx}`);
                        if (correctionInput && correctionInput.value) {
                            updatedAnswers[ansIdx].evaluations[`p_${pIdx}_teacherCorrection`] = correctionInput.value;
                        }
                    });
                }

                const evalInputs = container.querySelectorAll(`input[type="hidden"][name^="eval_${q.id}_"]`);
                evalInputs.forEach(inp => { let pKey = inp.name.replace(`eval_${q.id}_`, ''); updatedAnswers[ansIdx].evaluations[pKey] = inp.value; });

                totalScore += newScore; 
                let maxQScore = parseFloat(q.maxScore || q.passingScore || 1);
                maxTotalScore += maxQScore;
            });
            record.score = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
        }
        
        let updateData = { answers: updatedAnswers, score: record.score };

        if (type === 'lesson') {
            const { data: orig } = await window.supabase.from('lessons').select('exercises').eq('id', record.originalLessonId).single();
            const passScore = orig?.exercises?.passScore ? parseFloat(orig.exercises.passScore) : 80;
            
            if (record.score >= passScore) {
                updateData.status = 'completed'; updateData.completedDate = new Date().toISOString();
                showSuccess('تم حفظ التصحيح. الطالب اجتاز المحك واكتمل الدرس بنجاح!');
            } else {
                updateData.status = 'returned'; 
                showError(`تم حفظ التقييم. نتيجة الطالب (${record.score}%) لم تحقق المحك (${passScore}%). أُعيد الدرس للطالب.`);
            }
        } else {
            updateData.status = 'completed'; showSuccess('تم حفظ التصحيح واعتماد الدرجة بنجاح.');
        }

        await window.supabase.from(tableName).update(updateData).eq('id', id);
        closeModal('reviewTestModal');
        
        if (type === 'assignment') loadAssignmentsTab(); 
        else if (type === 'test') loadDiagnosticTab(); 
        else if (type === 'lesson') { loadLessonsTab(); calculateAndSetStudentProgress(); }
    } catch(e) { console.error(e); showError('حدث خطأ أثناء الحفظ'); }
}

async function openReviewModal(targetId, type = 'assignment') {
    document.getElementById('reviewAssignmentId').value = targetId;
    document.getElementById('reviewAssignmentId').setAttribute('data-type', type);
    const container = document.getElementById('reviewQuestionsContainer'); container.innerHTML = 'جاري التحميل...';
    let questions = [], studentAnswers = [], attachedSolution = null;

    try {
        if (type === 'lesson') {
            const { data: targetLesson } = await window.supabase.from('student_lessons').select('*').eq('id', targetId).single();
            const { data: originalLesson } = await window.supabase.from('lessons').select('*').eq('id', targetLesson.originalLessonId).single();
            if (originalLesson) questions = [...(originalLesson.exercises?.questions || []), ...(originalLesson.assessment?.questions || [])];
            studentAnswers = targetLesson.answers || [];
            document.querySelector('#reviewTestModal h3').innerHTML = '🔍 مراجعة الدرس: ' + targetLesson.title;
        } else if (type === 'assignment') {
            const { data: assignment } = await window.supabase.from('student_assignments').select('*').eq('id', targetId).single();
            const { data: originalAssignment } = await window.supabase.from('assignments').select('*').eq('title', assignment.title).single();
            questions = assignment.questions || (originalAssignment ? originalAssignment.questions : []);
            studentAnswers = assignment.answers || []; attachedSolution = assignment.attachedSolution;
            document.querySelector('#reviewTestModal h3').innerHTML = '🔍 مراجعة الواجب: ' + assignment.title;
        } else if (type === 'test') {
            const { data: test } = await window.supabase.from('student_tests').select('*').eq('id', targetId).single();
            const { data: originalTest } = await window.supabase.from('tests').select('*').eq('id', test.testId).single();
            questions = originalTest ? originalTest.questions : [];
            studentAnswers = test.answers || [];
            document.querySelector('#reviewTestModal h3').innerHTML = '🔍 مراجعة الاختبار: ' + (originalTest ? originalTest.title : '');
        }

        container.innerHTML = '';
        if (attachedSolution) container.innerHTML += `<div class="alert alert-info"><strong>📎 حل ورقي مرفق:</strong><br><a href="${attachedSolution}" download="solution" class="btn btn-primary btn-sm mt-2">تحميل ملف الحل</a></div>`;

        if (questions && questions.length > 0) {
            questions.forEach((q, index) => {
                const studentAnsObj = studentAnswers.find(a => a.questionId == q.id);
                container.innerHTML += buildTeacherReviewItem(q, index, studentAnsObj); 
            });
        } else { container.innerHTML += '<div class="text-center p-3 text-muted">لا توجد أسئلة مسجلة لعرضها.</div>'; }
        
        document.getElementById('reviewTestModal').classList.add('show');
    } catch(e) { console.error(e); showError('خطأ في جلب بيانات المراجعة'); }
}

async function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const type = document.getElementById('reviewAssignmentId').getAttribute('data-type');
    showConfirmModal('إعادة الاختبار/الدرس للطالب لتعديل الإجابات؟', async function() {
        let tableName = type === 'test' ? 'student_tests' : (type === 'lesson' ? 'student_lessons' : 'student_assignments');
        await window.supabase.from(tableName).update({ status: 'returned' }).eq('id', id);
        closeModal('reviewTestModal');
        if (type === 'assignment') loadAssignmentsTab();
        else if (type === 'test') loadDiagnosticTab();
        else if (type === 'lesson') loadLessonsTab();
        showSuccess('تمت الإعادة للطالب بنجاح');
    });
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ============================================
// التبويب: التشخيص والإجراءات الإضافية
// ============================================

async function loadDiagnosticTab() {
    try {
        const { data: studentTests } = await window.supabase.from('student_tests').select('*').eq('studentId', currentStudentId).eq('type', 'diagnostic');
        if (studentTests && studentTests.length > 0) {
            let assignedTest = studentTests[0]; 
            document.getElementById('noDiagnosticTest').style.display = 'none'; 
            const detailsDiv = document.getElementById('diagnosticTestDetails'); 
            detailsDiv.style.display = 'block'; 

            const { data: originalTest } = await window.supabase.from('tests').select('*').eq('id', assignedTest.testId).single();
            let finalPercentage = assignedTest.score || 0;
            
            let statusBadge = '', actionContent = '';
            if(assignedTest.status === 'completed') {
                statusBadge = '<span class="badge badge-success">مكتمل</span>';
                actionContent = `<div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:1.1rem;">الدرجة الحالية: <span style="font-size:1.4rem; color:#28a745; font-weight:900;">${finalPercentage}%</span></strong>
                    </div>
                    <div style="margin-top:15px; display:flex; gap:10px;">
                        <button class="btn btn-warning" onclick="openReviewModal(${assignedTest.id}, 'test')">🔍 مراجعة وتصحيح</button>
                        <button class="btn btn-primary" onclick="autoGenerateLessons()">⚡ توليد الخطة والدروس</button>
                    </div>
                </div>`;
            } else if (assignedTest.status === 'returned') { 
                statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>'; 
                actionContent = `<div class="alert alert-warning mt-2">تم إعادة الاختبار للطالب ليقوم بتعديله.</div>`; 
            } else { 
                statusBadge = '<span class="badge badge-secondary">بانتظار حل الطالب</span>'; 
            }
            
            detailsDiv.innerHTML = `
                <div class="card" style="border:1px solid #eee; box-shadow:0 4px 10px rgba(0,0,0,0.05); padding:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                        <div style="display:flex; gap:5px; align-items:center;">
                            ${statusBadge}
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignedTest(${assignedTest.id})" title="حذف الاختبار"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <p class="text-muted" style="margin-top:5px;"><i class="fas fa-calendar-alt"></i> تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                    ${actionContent}
                </div>`;
        } else { 
            document.getElementById('noDiagnosticTest').style.display = 'block'; 
            document.getElementById('diagnosticTestDetails').style.display = 'none'; 
        }
    } catch(e) { console.error(e); }
}

window.toggleReadingWord = function(span, qId, wKey) { let currentState = span.getAttribute('data-state'); let hiddenInput = span.querySelector('input'); let newState = currentState === '' ? 'correct' : (currentState === 'correct' ? 'wrong' : ''); let newClass = newState === 'correct' ? 'word-correct' : (newState === 'wrong' ? 'word-wrong' : 'word-neutral'); let textOnly = span.innerText.replace(/✔️|❌/g, '').trim(); span.setAttribute('data-state', newState); hiddenInput.value = newState; span.className = `reading-word-eval ${newClass}`; span.innerHTML = `${textOnly}${newState === 'correct' ? ' ✔️' : (newState === 'wrong' ? ' ❌' : '')}<input type="hidden" name="eval_${qId}_${wKey}" value="${newState}">`; }
window.setEvalState = function(btn, qId, pKey, state) { const container = btn.closest('.mt-2'); const hiddenInput = container.parentElement.querySelector(`input[name="eval_${qId}_${pKey}"]`); const btns = container.querySelectorAll('button'); btns[0].className = 'btn btn-sm btn-outline-success'; btns[1].className = 'btn btn-sm btn-outline-danger'; if (hiddenInput.value === state) { hiddenInput.value = ''; } else { hiddenInput.value = state; if (state === 'correct') btns[0].className = 'btn btn-sm btn-success'; else btns[1].className = 'btn btn-sm btn-danger'; } }

window.showAssignTestModal = showAssignTestModal; window.assignTest = assignTest; window.deleteAssignedTest = deleteAssignedTest;
window.autoGenerateLessons = autoGenerateLessons; window.accelerateLesson = accelerateLesson; window.resetLesson = resetLesson; window.deleteLesson = deleteLesson; window.regenerateLessons = regenerateLessons;
window.showAssignHomeworkModal = showAssignHomeworkModal; window.assignHomework = assignHomework; window.deleteAssignment = deleteAssignment;
window.openReviewModal = openReviewModal; window.saveTestReview = saveTestReview; window.returnTestForResubmission = returnTestForResubmission;
window.closeModal = closeModal;
window.deleteAdminEvent = deleteAdminEvent;
window.editAdminEvent = editAdminEvent;
window.saveAdminEvent = saveAdminEvent;
window.closeAdminEventModal = closeAdminEventModal;
window.openAdminEventModal = openAdminEventModal;
window.printProgressLog = printProgressLog;

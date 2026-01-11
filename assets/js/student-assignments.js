// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب - (إصلاح شامل لعرض الأسئلة والتسليم)
// ============================================

let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('assignmentsList') || window.location.pathname.includes('my-assignments.html')) {
        injectCleanStyles(); 
        injectSolveModal();
        loadStudentAssignments();
        updateCurrentAssignmentSection();
    }
});

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('currentUser')).user;
    } catch (e) {
        return { id: 0 }; 
    }
}

// ==========================================
// 🏗️ 1. بناء نافذة الحل (مع التنظيف)
// ==========================================
function injectSolveModal() {
    const oldModal = document.getElementById('solveAssignmentModal');
    if (oldModal) oldModal.remove();
    
    const modalHtml = `
    <div id="solveAssignmentModal" class="modal" style="display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(5px);">
        <div class="modal-content" style="background-color: #fff; margin: 5vh auto; padding: 25px; border: 1px solid #888; width: 90%; max-width: 800px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
                <h3 id="assignmentModalTitle" style="margin: 0; color: #333; font-weight:bold;">حل الواجب</h3>
                <span onclick="closeSolveAssignmentModal()" style="color: #666; font-size: 28px; font-weight: bold; cursor: pointer; line-height: 20px;">&times;</span>
            </div>
            
            <div id="assignmentContent" style="max-height: 65vh; overflow-y: auto; padding: 10px;">
                </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; text-align: left; display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="closeSolveAssignmentModal()" style="padding: 10px 20px; border-radius: 6px; border: 1px solid #ccc; background: #f8f9fa; color:#333; cursor: pointer;">إلغاء</button>
                <button id="btnSubmitAnswers" onclick="submitAssignment()" style="padding: 10px 25px; border-radius: 6px; border: none; background: #28a745; color: white; cursor: pointer; font-weight:bold;">✅ تسليم الإجابات</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ==========================================
// 🎨 2. التنسيقات (Clean CSS)
// ==========================================
function injectCleanStyles() {
    if (document.getElementById('cleanAssignmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'cleanAssignmentStyles';
    style.innerHTML = `
        .assignments-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Tajawal', sans-serif; }
        .modal.show { display: block !important; }
        
        /* تنبيه الواجب العاجل */
        .urgent-alert {
            background: linear-gradient(to right, #fff3cd, #fff8e1); 
            color: #856404; border: 1px solid #ffeeba;
            border-radius: 10px; padding: 20px; margin-bottom: 30px;
            display: flex; align-items: center; justify-content: space-between;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .urgent-info h4 { margin: 0 0 5px 0; font-size: 1.2rem; font-weight:bold; }
        .btn-urgent {
            background-color: #d39e00; color: white; border: none;
            padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight:bold;
        }

        /* القائمة */
        .assignments-list-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;
        }
        .assignment-row {
            background: white; border: 1px solid #e0e0e0; border-radius: 10px;
            padding: 15px 25px; margin-bottom: 15px; display: flex;
            align-items: center; justify-content: space-between; transition: all 0.2s ease;
        }
        .assignment-row:hover { border-color: #007bff; box-shadow: 0 5px 15px rgba(0,0,0,0.08); transform: translateY(-2px); }
        
        .row-info { display: flex; align-items: center; gap: 20px; flex-grow: 1; }
        .row-icon { 
            width: 45px; height: 45px; background: #f0f2f5; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: #555; font-size:1.2rem;
        }
        .row-text h5 { margin: 0 0 5px 0; font-size: 1.1rem; font-weight: bold; color:#333; }
        .row-text .meta { font-size: 0.9rem; color: #666; }
        .row-text .meta span { margin-left: 20px; display:inline-flex; align-items:center; gap:5px; }
        
        .btn-action {
            padding: 8px 20px; border-radius: 6px; border: 1px solid #ddd;
            background: white; color: #555; font-size: 0.95rem; cursor: pointer; transition:0.2s;
        }
        .btn-action:hover { background: #f8f9fa; border-color:#bbb; }
        .btn-primary-action { background: #007bff; color: white; border: none; }
        .btn-primary-action:hover { background: #0056b3; }

        .empty-list { text-align: center; padding: 60px; background: #fafafa; border-radius: 12px; color: #888; border:2px dashed #eee; }

        @media (max-width: 768px) {
            .assignment-row { flex-direction: column; align-items: flex-start; gap: 15px; }
            .row-actions { width: 100%; justify-content: flex-end; margin-top: 10px; border-top:1px solid #eee; padding-top:10px; }
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 📋 3. منطق العرض
// ==========================================

function filterAssignments() {
    const filterValue = document.getElementById('assignmentFilter').value;
    loadStudentAssignments(filterValue);
}

function loadStudentAssignments(filter = 'all') {
    const assignmentsList = document.getElementById('assignmentsList');
    if (!assignmentsList) return;
    assignmentsList.className = ''; 
    
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    let list = studentAssignments.filter(assignment => assignment.studentId === currentStudent.id);

    if (filter !== 'all') {
        list = list.filter(a => a.status === filter);
    }
    
    list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.assignedDate) - new Date(a.assignedDate);
    });

    if (list.length === 0) {
        assignmentsList.innerHTML = `<div class="empty-list"><h4>لا توجد واجبات مطابقة</h4></div>`;
        return;
    }
    
    let html = `<div class="assignments-list-header"><h3>📝 قائمة الواجبات (${list.length})</h3></div>`;

    html += list.map(assignment => {
        const isPending = assignment.status === 'pending';
        const dateStr = new Date(assignment.assignedDate).toLocaleDateString('ar-SA');
        const dueStr = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('ar-SA') : 'مفتوح';
        
        return `
            <div class="assignment-row" style="${isPending ? 'border-right: 5px solid #ffc107;' : 'border-right: 5px solid #28a745;'}">
                <div class="row-info">
                    <div class="row-icon"><i class="${isPending ? 'fas fa-hourglass-half text-warning' : 'fas fa-check-circle text-success'}"></i></div>
                    <div class="row-text">
                        <h5>${assignment.title}</h5>
                        <div class="meta">
                            <span><i class="fas fa-book"></i> ${assignment.subject || 'عام'}</span>
                            <span><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                            ${isPending ? `<span class="text-danger"><i class="far fa-clock"></i> تسليم: ${dueStr}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="row-actions">
                    ${!isPending && assignment.score !== undefined ? `<span class="badge badge-success" style="padding:8px 12px;">${assignment.score}%</span>` : ''}
                    <button class="btn-action ${isPending ? 'btn-primary-action' : ''}" 
                        onclick="${isPending ? `solveAssignment(${assignment.id})` : `viewAssignmentResult(${assignment.id})`}">
                        ${isPending ? '<i class="fas fa-pencil-alt"></i> ابدأ الحل' : '<i class="fas fa-eye"></i> مراجعة'}
                    </button>
                </div>
            </div>`;
    }).join('');

    assignmentsList.innerHTML = html;
}

function updateCurrentAssignmentSection() {
    const section = document.getElementById('currentAssignmentSection');
    if (!section) return;
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const urgent = studentAssignments.find(a => a.studentId === currentStudent.id && a.status === 'pending');
    
    if (!urgent) { section.style.display = 'none'; return; }
    
    section.style.display = 'block';
    section.innerHTML = `
        <div class="urgent-alert">
            <div class="urgent-info">
                <h4><i class="fas fa-exclamation-circle"></i> واجب مستحق</h4>
                <p><strong>${urgent.title}</strong> بانتظار الحل.</p>
            </div>
            <button class="btn-urgent" onclick="solveAssignment(${urgent.id})">الذهاب للواجب <i class="fas fa-arrow-left"></i></button>
        </div>`;
}

// ==========================================
// 🔥 4. محرك الحل (Robust Rendering)
// ==========================================

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) { alert('الواجب غير موجود'); return; }
    
    currentAssignmentId = assignmentId;
    document.getElementById('assignmentModalTitle').textContent = assignment.title;
    const contentDiv = document.getElementById('assignmentContent');
    contentDiv.innerHTML = ''; 

    const btnSubmit = document.getElementById('btnSubmitAnswers');
    if(btnSubmit) btnSubmit.style.display = (assignment.status === 'completed') ? 'none' : 'inline-block';

    if (assignment.description) {
        contentDiv.innerHTML += `<div class="alert alert-info mb-4" style="background:#e3f2fd; padding:15px; border-radius:8px; border:1px solid #bbdefb; color:#0d47a1;">${assignment.description}</div>`;
    }

    if (!assignment.questions || assignment.questions.length === 0) {
        contentDiv.innerHTML += `<div class="text-center p-5"><h3>لا توجد أسئلة مسجلة.</h3></div>`;
    } else {
        let questionsHtml = '<form id="studentAnswersForm">';
        assignment.questions.forEach((q, index) => {
            questionsHtml += renderSingleQuestion(q, index, assignment.status === 'completed', assignment.answers);
        });
        questionsHtml += '</form>';
        contentDiv.innerHTML += questionsHtml;
    }
    
    document.getElementById('solveAssignmentModal').classList.add('show');
}

function renderSingleQuestion(q, index, isReadOnly = false, previousAnswers = []) {
    const prevAnswer = previousAnswers ? previousAnswers.find(a => a.questionId === q.id) : null;
    let html = `
    <div class="question-box mb-4" style="margin-bottom:20px; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background:#fff;">
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <h5 style="font-weight:bold; margin:0;">سؤال ${index + 1}</h5>
            <span class="badge" style="background:#eee; padding:4px 10px; border-radius:15px; font-size:0.85rem;">${q.passingScore || 1} درجات</span>
        </div>`;

    // 🖼️ معالجة الصورة
    if (q.attachment) {
        html += `<div class="mb-3 text-center"><img src="${q.attachment}" style="max-width:100%; max-height:250px; border-radius:8px; border:1px solid #ddd; padding:5px;"></div>`;
    }

    // 🟢 1. أسئلة الاختيار من متعدد
    if (q.type === 'mcq' || q.type === 'mcq-media') {
        html += `<p class="lead mb-3" style="font-size:1.1rem; color:#222;">${q.text}</p>`;
        if (q.choices) {
            html += `<div class="choices-list" style="display:flex; flex-direction:column; gap:10px;">`;
            q.choices.forEach((choice, i) => {
                const isChecked = (prevAnswer && prevAnswer.value === i) ? 'checked' : '';
                const disabled = isReadOnly ? 'disabled' : '';
                let style = 'padding:10px; border:1px solid #eee; border-radius:6px; display:flex; align-items:center; gap:10px; cursor:pointer;';
                
                if (isReadOnly) {
                    if (i === parseInt(q.correctAnswer)) style += ' background-color:#d4edda; border-color:#c3e6cb;'; 
                    else if (isChecked && i !== parseInt(q.correctAnswer)) style += ' background-color:#f8d7da; border-color:#f5c6cb;';
                }
                
                html += `<label style="${style}"><input type="radio" name="q_${q.id}" value="${i}" ${isChecked} ${disabled} style="transform:scale(1.2);"> <span style="font-size:1rem;">${choice}</span></label>`;
            });
            html += `</div>`;
        }
    } 
    // 🟢 2. الأسئلة المقالية
    else if (q.type === 'open-ended') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        html += `<textarea class="form-control" name="q_${q.id}" rows="4" style="width:100%; padding:12px; border:1px solid #ccc; border-radius:6px;" placeholder="اكتب إجابتك هنا..." ${isReadOnly ? 'readonly' : ''}>${prevAnswer ? prevAnswer.value : ''}</textarea>`;
    } 
    // 🟢 3. الأسئلة المركبة (سحب وإفلات، إملاء، قراءة، حرف ناقص)
    else {
        html += `<p class="lead mb-3">${q.text || 'أجب عن الفقرات التالية:'}</p>`;
        
        // إذا كان يحتوي على فقرات (الوضع الطبيعي)
        if (q.paragraphs && q.paragraphs.length > 0) {
            q.paragraphs.forEach((p, pIdx) => {
                html += renderParagraphInput(q, p, pIdx, isReadOnly);
            });
        } else {
            // حالة احتياطية (Fallback): إذا لم تكن هناك فقرات، نعرض مربع نص عام
            html += `<div style="padding:10px; background:#fff3cd; border-radius:5px; font-size:0.9rem; margin-bottom:5px;">سؤال تفاعلي (أجب أدناه):</div>`;
            html += `<input type="text" class="form-control" name="q_${q.id}_fallback" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px;" placeholder="اكتب إجابتك..." ${isReadOnly ? 'readonly' : ''}>`;
        }
    }
    
    html += `</div>`;
    return html;
}

function renderParagraphInput(q, p, pIdx, isReadOnly) {
    let inputHtml = `<div style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px;">`;
    
    if (q.type === 'missing-char') {
        inputHtml += `<label style="display:block; margin-bottom:5px;">أكمل الحرف الناقص: <strong style="font-size:1.2rem; margin:0 5px;">${p.missing || ''}</strong></label>`;
        inputHtml += `<input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="اكتب الكلمة كاملة" ${isReadOnly ? 'readonly' : ''}>`;
    } else if (q.type.includes('reading')) {
        inputHtml += `<div style="padding:10px; border:1px solid #ddd; background:white; margin-bottom:5px;">${p.text}</div>`;
        inputHtml += `<label style="font-size:0.9rem; color:#666;">اقرأ النص (تقييم ذاتي)</label>`;
        inputHtml += `<div style="margin-top:5px;"><input type="checkbox" name="q_${q.id}_p${pIdx}" ${isReadOnly ? 'disabled' : ''}> قرأت النص بطلاقة</div>`;
    } else if (q.type.includes('spelling')) {
        inputHtml += `<label>استمع/انظر للكلمة ثم اكتبها:</label>`; // (في الواقع هذا يحتاج صوت، سنكتفي بالكتابة)
        inputHtml += `<p style="filter: blur(4px); user-select: none;">${p.text}</p>`; // تمويه النص للإملاء
        inputHtml += `<input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:8px;" placeholder="اكتب الكلمة هنا..." ${isReadOnly ? 'readonly' : ''}>`;
    } else {
        // الافتراضي (سحب وإفلات أو غيره)
        inputHtml += `<p style="margin-bottom:5px;">${p.text}</p>`;
        inputHtml += `<input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="إجابتك..." ${isReadOnly ? 'readonly' : ''}>`;
    }
    
    inputHtml += `</div>`;
    return inputHtml;
}

function submitAssignment() {
    if (!currentAssignmentId) return;
    
    const form = document.getElementById('studentAnswersForm');
    if (!form) { alert('خطأ في تحميل النموذج، يرجى إعادة المحاولة.'); return; } // 🔥 إصلاح التسليم

    if(!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;

    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const idx = studentAssignments.findIndex(a => a.id === currentAssignmentId);
    if (idx === -1) return;

    const assignment = studentAssignments[idx];
    
    let totalScore = 0;
    let earnedScore = 0;
    const studentAnswers = [];

    assignment.questions.forEach(q => {
        const qScore = parseInt(q.passingScore || 1);
        totalScore += qScore;
        let answerData = { questionId: q.id, type: q.type, score: 0 };

        if (q.type.includes('mcq')) {
            const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
            if (selected) {
                const val = parseInt(selected.value);
                answerData.value = val;
                if (val === parseInt(q.correctAnswer)) {
                    earnedScore += qScore;
                    answerData.score = qScore;
                }
            }
        } else if (q.type === 'open-ended') {
            answerData.value = form.querySelector(`textarea[name="q_${q.id}"]`)?.value;
        } else {
            // بقية الأنواع: جمع القيم كنص (للتصحيح اليدوي لاحقاً)
            answerData.value = "تم الحل";
        }
        studentAnswers.push(answerData);
    });

    let finalPercent = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 100;

    studentAssignments[idx].status = 'completed';
    studentAssignments[idx].completedDate = new Date().toISOString();
    studentAssignments[idx].score = finalPercent;
    studentAssignments[idx].answers = studentAnswers;

    localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
    
    alert(`تم التسليم بنجاح! النتيجة: ${finalPercent}%`);
    closeSolveAssignmentModal();
    loadStudentAssignments();
    updateCurrentAssignmentSection();
}

function closeSolveAssignmentModal() {
    const modal = document.getElementById('solveAssignmentModal');
    if(modal) modal.classList.remove('show');
    currentAssignmentId = null;
}

function viewAssignmentResult(assignmentId) {
    solveAssignment(assignmentId);
}

window.filterAssignments = filterAssignments;
window.solveAssignment = solveAssignment;
window.submitAssignment = submitAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.viewAssignmentResult = viewAssignmentResult;

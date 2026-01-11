// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب (إصلاح نهائي لظهور الأسئلة + شبكة أمان للأنواع غير المعروفة)
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
// 🏗️ 1. بناء نافذة الحل
// ==========================================
function injectSolveModal() {
    const oldModal = document.getElementById('solveAssignmentModal');
    if (oldModal) oldModal.remove();
    
    const modalHtml = `
    <div id="solveAssignmentModal" class="modal" style="display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(5px);">
        <div class="modal-content" style="background-color: #fff; margin: 2vh auto; padding: 25px; border: 1px solid #888; width: 90%; max-width: 850px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            
            <div class="modal-header-custom" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <h3 id="assignmentModalTitle" style="margin: 0; color: #333; font-weight:bold;">حل الواجب</h3>
                    <button onclick="printAssignment()" class="btn-print no-print" style="background:#6c757d; color:white; border:none; padding:6px 15px; border-radius:5px; cursor:pointer; font-size:0.9rem;">
                        <i class="fas fa-print"></i> طباعة الأسئلة
                    </button>
                </div>
                <span onclick="closeSolveAssignmentModal()" class="no-print" style="color: #666; font-size: 28px; font-weight: bold; cursor: pointer; line-height: 20px;">&times;</span>
            </div>
            
            <div id="assignmentContent" style="max-height: 60vh; overflow-y: auto; padding: 10px;">
                </div>
            
            <div id="uploadSolutionSection" class="upload-section no-print" style="margin-top:20px; background:#f8f9fa; padding:15px; border:2px dashed #ccc; border-radius:8px; text-align:center;">
                <label style="display:block; margin-bottom:10px; font-weight:bold; color:#555;">📤 هل قمت بالحل ورقياً؟ ارفع صورة الحل هنا:</label>
                <input type="file" id="assignmentFileUpload" accept="image/*,application/pdf" class="form-control" style="width:100%; max-width:400px; margin:0 auto;">
                <small class="text-muted d-block mt-1">يُسمح برفع الصور (JPG, PNG) أو ملفات PDF.</small>
            </div>

            <div class="modal-footer-custom no-print" style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; text-align: left; display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="closeSolveAssignmentModal()" style="padding: 10px 20px; border-radius: 6px; border: 1px solid #ccc; background: #f8f9fa; color:#333; cursor: pointer;">إلغاء</button>
                <button id="btnSubmitAnswers" onclick="submitAssignment()" style="padding: 10px 25px; border-radius: 6px; border: none; background: #28a745; color: white; cursor: pointer; font-weight:bold;">
                    ✅ تسليم الحل
                </button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ==========================================
// 🎨 2. التنسيقات
// ==========================================
function injectCleanStyles() {
    if (document.getElementById('cleanAssignmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'cleanAssignmentStyles';
    style.innerHTML = `
        .assignments-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Tajawal', sans-serif; }
        .modal.show { display: block !important; }
        .urgent-alert { background: linear-gradient(to right, #fff3cd, #fff8e1); color: #856404; border: 1px solid #ffeeba; border-radius: 10px; padding: 20px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .urgent-info h4 { margin: 0 0 5px 0; font-size: 1.2rem; font-weight:bold; }
        .btn-urgent { background-color: #d39e00; color: white; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight:bold; }
        .assignments-list-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
        .assignment-row { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 15px 25px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease; }
        .assignment-row:hover { border-color: #007bff; box-shadow: 0 5px 15px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .row-info { display: flex; align-items: center; gap: 20px; flex-grow: 1; }
        .row-icon { width: 45px; height: 45px; background: #f0f2f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #555; font-size:1.2rem; }
        .row-text h5 { margin: 0 0 5px 0; font-size: 1.1rem; font-weight: bold; color:#333; }
        .row-text .meta { font-size: 0.9rem; color: #666; }
        .row-text .meta span { margin-left: 20px; display:inline-flex; align-items:center; gap:5px; }
        .btn-action { padding: 8px 20px; border-radius: 6px; border: 1px solid #ddd; background: white; color: #555; font-size: 0.95rem; cursor: pointer; transition:0.2s; }
        .btn-action:hover { background: #f8f9fa; border-color:#bbb; }
        .btn-primary-action { background: #007bff; color: white; border: none; }
        .btn-primary-action:hover { background: #0056b3; }
        .empty-list { text-align: center; padding: 60px; background: #fafafa; border-radius: 12px; color: #888; border:2px dashed #eee; }

        @media (max-width: 768px) {
            .assignment-row { flex-direction: column; align-items: flex-start; gap: 15px; }
            .row-actions { width: 100%; justify-content: flex-end; margin-top: 10px; border-top:1px solid #eee; padding-top:10px; }
        }

        @media print {
            body * { visibility: hidden; }
            #solveAssignmentModal, #solveAssignmentModal * { visibility: visible; }
            #solveAssignmentModal { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white; border: none; overflow: visible; }
            .modal-content { box-shadow: none; border: none; width: 100%; margin: 0; padding: 0; }
            #assignmentContent { max-height: none !important; overflow: visible !important; }
            .no-print { display: none !important; }
            .question-box { border: 1px solid #000 !important; page-break-inside: avoid; background: white !important; color: black !important; margin-bottom: 20px; }
            textarea, input[type=text] { border: 1px solid #ccc !important; }
            #assignmentModalTitle::after { content: " - ورقة عمل"; font-size: 0.8em; font-weight: normal; }
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
// 🔥 4. محرك الحل (Robust Rendering & Fix)
// ==========================================

function printAssignment() {
    window.print();
}

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) { alert('الواجب غير موجود'); return; }
    
    currentAssignmentId = assignmentId;
    
    const titleElem = document.getElementById('assignmentModalTitle');
    titleElem.textContent = assignment.title;
    titleElem.setAttribute('data-student-name', getCurrentUser().name || '');

    const contentDiv = document.getElementById('assignmentContent');
    contentDiv.innerHTML = ''; 

    const isCompleted = assignment.status === 'completed';
    const btnSubmit = document.getElementById('btnSubmitAnswers');
    const uploadSection = document.getElementById('uploadSolutionSection');
    
    if(btnSubmit) btnSubmit.style.display = isCompleted ? 'none' : 'inline-block';
    
    if(uploadSection) {
        if (isCompleted) {
            uploadSection.innerHTML = assignment.attachedSolution ? 
                `<div class="alert alert-success">📎 <strong>تم إرفاق حل ورقي.</strong> <a href="${assignment.attachedSolution}" target="_blank" class="btn btn-sm btn-outline-success">عرض الملف</a></div>` :
                '';
        } else {
            uploadSection.style.display = 'block';
            uploadSection.innerHTML = `
                <label style="display:block; margin-bottom:10px; font-weight:bold; color:#555;">📤 هل قمت بالحل ورقياً؟ ارفع صورة الحل هنا:</label>
                <input type="file" id="assignmentFileUpload" accept="image/*,application/pdf" class="form-control" style="width:100%; max-width:400px; margin:0 auto;">
                <small class="text-muted d-block mt-1">يُسمح برفع الصور (JPG, PNG) أو ملفات PDF.</small>`;
        }
    }

    if (assignment.description) {
        contentDiv.innerHTML += `<div class="alert alert-info mb-4" style="background:#e3f2fd; padding:15px; border-radius:8px; border:1px solid #bbdefb; color:#0d47a1;">${assignment.description}</div>`;
    }

    // التحقق من وجود الأسئلة
    if (!assignment.questions || assignment.questions.length === 0) {
        contentDiv.innerHTML += `<div class="text-center p-5"><h3>لا توجد أسئلة مسجلة.</h3></div>`;
    } else {
        let questionsHtml = '<form id="studentAnswersForm">';
        assignment.questions.forEach((q, index) => {
            questionsHtml += renderSingleQuestion(q, index, isCompleted, assignment.answers);
        });
        questionsHtml += '</form>';
        contentDiv.innerHTML += questionsHtml;
    }
    
    document.getElementById('solveAssignmentModal').classList.add('show');
}

// 🔥🔥 الدالة المنقذة: عرض أي نوع سؤال 🔥🔥
function renderSingleQuestion(q, index, isReadOnly = false, previousAnswers = []) {
    const prevAnswer = previousAnswers ? previousAnswers.find(a => a.questionId === q.id) : null;
    let html = `
    <div class="question-box mb-4" style="margin-bottom:20px; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background:#fff;">
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <h5 style="font-weight:bold; margin:0;">سؤال ${index + 1}</h5>
            <span class="badge" style="background:#eee; padding:4px 10px; border-radius:15px; font-size:0.85rem;">${q.passingScore || 1} درجات</span>
        </div>`;

    if (q.attachment) {
        html += `<div class="mb-3 text-center"><img src="${q.attachment}" style="max-width:100%; max-height:250px; border-radius:8px; border:1px solid #ddd; padding:5px;"></div>`;
    }

    // 1. اختيار من متعدد
    if (q.type === 'mcq' || q.type === 'mcq-media') {
        html += `<p class="lead mb-3" style="font-size:1.1rem; color:#222;">${q.text}</p>`;
        if (q.choices) {
            html += `<div class="choices-list" style="display:flex; flex-direction:column; gap:10px;">`;
            q.choices.forEach((choice, i) => {
                const isChecked = (prevAnswer && prevAnswer.value === i) ? 'checked' : '';
                const disabled = isReadOnly ? 'disabled' : '';
                html += `<label style="padding:10px; border:1px solid #eee; margin-bottom:5px; display:block; cursor:pointer;"><input type="radio" name="q_${q.id}" value="${i}" ${isChecked} ${disabled} style="transform:scale(1.2); margin-left:10px;"> <span style="font-size:1rem;">${choice}</span></label>`;
            });
            html += `</div>`;
        }
    } 
    // 2. أسئلة مقالية
    else if (q.type === 'open-ended') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        html += `<textarea class="form-control" name="q_${q.id}" rows="4" style="width:100%; padding:12px; border:1px solid #ccc; border-radius:6px;" placeholder="اكتب إجابتك هنا..." ${isReadOnly ? 'readonly' : ''}>${prevAnswer ? prevAnswer.value : ''}</textarea>`;
    } 
    // 3. (الإنقاذ) أي نوع آخر: نعرض النص ومربع إجابة افتراضي
    else {
        html += `<p class="lead mb-3">${q.text || 'أجب عن السؤال التالي:'}</p>`;
        
        // محاولة رسم الفقرات إذا وجدت
        if (q.paragraphs && q.paragraphs.length > 0) {
            q.paragraphs.forEach((p, pIdx) => {
                html += `<div style="margin-bottom:10px; background:#f9f9f9; padding:10px; border-radius:5px;">
                            <p>${p.text || ''}</p>
                            <input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:8px; border:1px solid #ccc;" placeholder="إجابتك..." ${isReadOnly ? 'readonly' : ''}>
                         </div>`;
            });
        } else {
            // Fallback: مربع نص عام يضمن ظهور السؤال
            html += `<div style="padding:10px; background:#e2e3e5; border-radius:5px; margin-bottom:5px; font-size:0.9rem;">اكتب إجابتك أدناه:</div>`;
            html += `<textarea class="form-control" name="q_${q.id}_fallback" rows="3" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px;" placeholder="الإجابة..." ${isReadOnly ? 'readonly' : ''}>${prevAnswer ? prevAnswer.value : ''}</textarea>`;
        }
    }
    
    html += `</div>`;
    return html;
}

// 🗂️ قراءة الملف
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// 🚀 التسليم
async function submitAssignment() {
    if (!currentAssignmentId) return;
    
    const form = document.getElementById('studentAnswersForm');
    const fileInput = document.getElementById('assignmentFileUpload');
    
    const hasDigitalAnswers = form && (form.querySelectorAll('input:checked').length > 0 || form.querySelectorAll('textarea, input[type=text]').length > 0);
    const hasFile = fileInput && fileInput.files.length > 0;

    // السماح بالتسليم إذا كان هناك أي مدخلات
    if (!hasDigitalAnswers && !hasFile) {
        if(!confirm('لم تقم بالإجابة على أي سؤال ولم ترفع ملفاً. هل تريد التسليم فارغاً؟')) return;
    } else {
        if(!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;
    }

    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const idx = studentAssignments.findIndex(a => a.id === currentAssignmentId);
    if (idx === -1) return;

    const assignment = studentAssignments[idx];
    
    let attachedFile = null;
    if (hasFile) {
        try { attachedFile = await readFileAsBase64(fileInput.files[0]); } catch (e) { alert('خطأ في الملف'); return; }
    }

    let totalScore = 0;
    let earnedScore = 0;
    const studentAnswers = [];

    if (assignment.questions) {
        assignment.questions.forEach(q => {
            const qScore = parseInt(q.passingScore || 1);
            totalScore += qScore;
            let answerData = { questionId: q.id, type: q.type, score: 0 };

            if (q.type && q.type.includes('mcq')) {
                const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
                if (selected) {
                    const val = parseInt(selected.value);
                    answerData.value = val;
                    if (val === parseInt(q.correctAnswer)) {
                        earnedScore += qScore;
                        answerData.score = qScore;
                    }
                }
            } else {
                // التقاط الإجابة من أي نوع حقل موجود
                const textVal = form.querySelector(`textarea[name="q_${q.id}"]`)?.value || 
                                form.querySelector(`textarea[name="q_${q.id}_fallback"]`)?.value || 
                                "تم الحل";
                answerData.value = textVal;
            }
            studentAnswers.push(answerData);
        });
    }

    let finalPercent = hasFile ? 0 : (totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 100);

    studentAssignments[idx].status = 'completed';
    studentAssignments[idx].completedDate = new Date().toISOString();
    studentAssignments[idx].score = finalPercent;
    studentAssignments[idx].answers = studentAnswers;
    studentAssignments[idx].attachedSolution = attachedFile;

    localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
    
    alert(`تم التسليم! ${hasFile ? 'تم رفع الملف.' : 'النتيجة: ' + finalPercent + '%'}`);
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
window.printAssignment = printAssignment;

// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب - (نسخة كاملة: بناء النافذة + تصميم القائمة + حل ديناميكي)
// ============================================

let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-assignments.html')) {
        injectCleanStyles(); // 1. تنسيق القائمة
        injectSolveModal();  // 2. بناء نافذة الحل (الإصلاح الجذري)
        loadStudentAssignments();
        updateCurrentAssignmentSection();
    }
});

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('currentUser')).user;
    } catch (e) {
        console.error("لم يتم العثور على بيانات المستخدم");
        return { id: 0 }; // تجنب توقف النظام
    }
}

// ==========================================
// 🏗️ 1. بناء نافذة الحل (Modal Injection)
// ==========================================
function injectSolveModal() {
    if (document.getElementById('solveAssignmentModal')) return;
    
    const modalHtml = `
    <div id="solveAssignmentModal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
        <div class="modal-content" style="background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 90%; max-width: 800px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">
                <h3 id="assignmentModalTitle" style="margin: 0; color: #333;">حل الواجب</h3>
                <span onclick="closeSolveAssignmentModal()" style="color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
            </div>
            
            <div id="assignmentContent">
                </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; text-align: left; display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="closeSolveAssignmentModal()" style="padding: 10px 20px; border-radius: 5px; border: 1px solid #ccc; background: white; cursor: pointer;">إلغاء</button>
                <button id="btnSubmitAnswers" onclick="submitAssignment()" style="padding: 10px 20px; border-radius: 5px; border: none; background: #28a745; color: white; cursor: pointer;">تسليم الإجابات</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ==========================================
// 🎨 2. تنسيقات القائمة (CSS)
// ==========================================
function injectCleanStyles() {
    if (document.getElementById('cleanAssignmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'cleanAssignmentStyles';
    style.innerHTML = `
        /* تحسينات عامة */
        .assignments-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        
        /* نافذة الحل (تأكيد الظهور) */
        .modal.show { display: block !important; }

        /* 1. قسم التنبيه */
        .urgent-alert {
            background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba;
            border-radius: 8px; padding: 15px 20px; margin-bottom: 30px;
            display: flex; align-items: center; justify-content: space-between;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .urgent-info h4 { margin: 0 0 5px 0; font-size: 1.1rem; }
        .btn-urgent {
            background-color: #856404; color: white; border: none;
            padding: 8px 20px; border-radius: 5px; cursor: pointer;
        }

        /* 2. القائمة */
        .assignments-list-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;
        }
        
        .assignment-row {
            background: white; border: 1px solid #e0e0e0; border-radius: 8px;
            padding: 15px 20px; margin-bottom: 12px; display: flex;
            align-items: center; justify-content: space-between; transition: 0.2s;
        }
        .assignment-row:hover { border-color: #007bff; box-shadow: 0 3px 10px rgba(0,0,0,0.05); }
        
        .row-info { display: flex; align-items: center; gap: 20px; flex-grow: 1; }
        .row-icon { 
            width: 40px; height: 40px; background: #f0f2f5; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: #555;
        }
        .row-text h5 { margin: 0 0 4px 0; font-size: 1rem; font-weight: bold; }
        .row-text .meta { font-size: 0.85rem; color: #777; }
        .row-text .meta span { margin-left: 15px; }
        
        .btn-action {
            padding: 6px 15px; border-radius: 5px; border: 1px solid #ddd;
            background: white; color: #555; font-size: 0.9rem; cursor: pointer;
        }
        .btn-action:hover { background: #f8f9fa; }
        .btn-primary-action { background: #007bff; color: white; border: none; }
        .btn-primary-action:hover { background: #0056b3; }

        .empty-list { text-align: center; padding: 40px; background: #fafafa; border-radius: 8px; color: #777; }

        @media (max-width: 768px) {
            .assignment-row { flex-direction: column; align-items: flex-start; gap: 15px; }
            .row-actions { width: 100%; justify-content: space-between; margin-top: 10px; }
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 📋 3. منطق العرض والتصفية
// ==========================================

function filterAssignments() {
    const filterValue = document.getElementById('assignmentFilter').value;
    loadStudentAssignments(filterValue);
}

function loadStudentAssignments(filter = 'all') {
    const assignmentsList = document.getElementById('assignmentsList');
    if (!assignmentsList) return;
    
    assignmentsList.innerHTML = ''; // مسح المحتوى القديم
    
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    let list = studentAssignments.filter(assignment => assignment.studentId === currentStudent.id);

    // تصفية
    if (filter !== 'all') {
        list = list.filter(a => a.status === filter);
    }
    
    // ترتيب
    list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.assignedDate) - new Date(a.assignedDate);
    });

    if (list.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-list">
                <div style="font-size:2.5rem; margin-bottom:10px;">📂</div>
                <h4>لا توجد واجبات</h4>
            </div>`;
        return;
    }
    
    let html = `<div class="assignments-list-header"><h3>📝 قائمة الواجبات (${list.length})</h3></div>`;

    html += list.map(assignment => {
        const isPending = assignment.status === 'pending';
        const dateStr = new Date(assignment.assignedDate).toLocaleDateString('ar-SA');
        const dueStr = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('ar-SA') : 'مفتوح';
        
        return `
            <div class="assignment-row" style="${isPending ? 'border-right: 4px solid #ffc107;' : 'border-right: 4px solid #28a745;'}">
                <div class="row-info">
                    <div class="row-icon"><i class="${isPending ? 'fas fa-hourglass-half text-warning' : 'fas fa-check-circle text-success'}"></i></div>
                    <div class="row-text">
                        <h5>${assignment.title}</h5>
                        <div class="meta">
                            <span><i class="fas fa-book"></i> ${assignment.subject || 'عام'}</span>
                            <span><i class="far fa-calendar"></i> ${dateStr}</span>
                            ${isPending ? `<span class="text-danger"><i class="far fa-clock"></i> تسليم: ${dueStr}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="row-actions">
                    ${!isPending && assignment.score !== undefined ? `<span class="badge badge-success">${assignment.score}%</span>` : ''}
                    <button class="btn-action ${isPending ? 'btn-primary-action' : ''}" 
                        onclick="${isPending ? `solveAssignment(${assignment.id})` : `viewAssignmentResult(${assignment.id})`}">
                        ${isPending ? 'ابدأ الحل' : 'مراجعة الحل'}
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
            <button class="btn-urgent" onclick="solveAssignment(${urgent.id})">الذهاب للواجب</button>
        </div>`;
}

// ==========================================
// 🔥 4. محرك الحل الديناميكي
// ==========================================

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) { alert('الواجب غير موجود'); return; }
    
    currentAssignmentId = assignmentId;
    document.getElementById('assignmentModalTitle').textContent = assignment.title;
    const contentDiv = document.getElementById('assignmentContent');
    contentDiv.innerHTML = ''; 

    // إخفاء زر التسليم إذا كان الواجب مكتملاً (للعرض فقط)
    const btnSubmit = document.getElementById('btnSubmitAnswers');
    if(btnSubmit) btnSubmit.style.display = (assignment.status === 'completed') ? 'none' : 'inline-block';

    if (assignment.description) {
        contentDiv.innerHTML += `<div class="alert alert-info mb-4" style="background:#e3f2fd; padding:10px; border-radius:5px;">${assignment.description}</div>`;
    }

    if (!assignment.questions || assignment.questions.length === 0) {
        contentDiv.innerHTML += `<div class="text-center p-5"><h3>لا توجد أسئلة.</h3></div>`;
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
    // محاولة العثور على الإجابة السابقة للعرض
    const prevAnswer = previousAnswers ? previousAnswers.find(a => a.questionId === q.id) : null;
    
    let html = `
    <div class="question-box mb-4 p-3 border rounded bg-white shadow-sm" style="margin-bottom:15px; padding:15px; border:1px solid #ddd; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <h5 style="font-weight:bold;">سؤال ${index + 1}</h5>
            <span class="badge badge-secondary" style="background:#eee; padding:2px 8px; border-radius:10px;">${q.passingScore || 1} درجات</span>
        </div>
    `;

    if (q.type === 'mcq' || q.type === 'mcq-media') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        if (q.attachment) {
            html += `<div class="mb-3 text-center"><img src="${q.attachment}" style="max-width:100%; max-height:200px; border-radius:8px; border:1px solid #ddd;"></div>`;
        }
        if (q.choices) {
            q.choices.forEach((choice, i) => {
                const isChecked = (prevAnswer && prevAnswer.value === i) ? 'checked' : '';
                const disabled = isReadOnly ? 'disabled' : '';
                // تمييز الإجابة الصحيحة عند المراجعة
                let labelStyle = '';
                if (isReadOnly && i === parseInt(q.correctAnswer)) labelStyle = 'color:green; font-weight:bold;';
                if (isReadOnly && isChecked && i !== parseInt(q.correctAnswer)) labelStyle = 'color:red; text-decoration:line-through;';

                html += `
                <div style="margin-bottom:5px;">
                    <input type="radio" name="q_${q.id}" value="${i}" ${isChecked} ${disabled}>
                    <label style="${labelStyle}">${choice}</label>
                </div>`;
            });
        }
    } else if (q.type === 'open-ended') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        html += `<textarea class="form-control" name="q_${q.id}" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" ${isReadOnly ? 'readonly' : ''}>${prevAnswer ? prevAnswer.value : ''}</textarea>`;
    } else if (q.paragraphs) {
        html += `<p class="lead mb-3">${q.text || 'أجب عما يلي:'}</p>`;
        q.paragraphs.forEach((p, pIdx) => {
            html += `<div style="margin-bottom:10px; background:#f9f9f9; padding:10px; border-radius:5px;">`;
            html += `<p>${p.text}</p>`;
            html += `<input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:5px;" ${isReadOnly ? 'readonly' : ''}>`;
            html += `</div>`;
        });
    }
    html += `</div>`;
    return html;
}

function submitAssignment() {
    if (!currentAssignmentId) return;
    if(!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;

    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const idx = studentAssignments.findIndex(a => a.id === currentAssignmentId);
    if (idx === -1) return;

    const assignment = studentAssignments[idx];
    const form = document.getElementById('studentAnswersForm');
    
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
    document.getElementById('solveAssignmentModal').classList.remove('show');
    currentAssignmentId = null;
}

function viewAssignmentResult(assignmentId) {
    // إعادة استخدام نفس النافذة للعرض (وضع القراءة فقط)
    solveAssignment(assignmentId);
}

// تصدير الدوال للنطاق العام
window.filterAssignments = filterAssignments;
window.solveAssignment = solveAssignment;
window.submitAssignment = submitAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.viewAssignmentResult = viewAssignmentResult;

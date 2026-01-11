// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب - عرض وحل الواجبات (تصميم القائمة + إصلاح التصفية)
// ============================================

let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-assignments.html')) {
        injectCleanStyles(); 
        loadStudentAssignments(); // تحميل افتراضي (الكل)
        updateCurrentAssignmentSection();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// ==========================================
// 🎨 1. تنسيقات القائمة النظيفة (CSS)
// ==========================================
function injectCleanStyles() {
    if (document.getElementById('cleanAssignmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'cleanAssignmentStyles';
    style.innerHTML = `
        /* حاوية الصفحة */
        .assignments-container { max-width: 1000px; margin: 0 auto; padding: 20px; }

        /* 1. قسم التنبيه (الواجب العاجل) */
        .urgent-alert {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 30px;
            display: flex; align-items: center; justify-content: space-between;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .urgent-info h4 { margin: 0 0 5px 0; font-size: 1.1rem; font-weight: bold; }
        .urgent-info p { margin: 0; font-size: 0.9rem; }
        .btn-urgent {
            background-color: #856404; color: white; border: none;
            padding: 8px 20px; border-radius: 5px; text-decoration: none; font-size: 0.9rem;
            cursor: pointer;
        }
        .btn-urgent:hover { background-color: #6d5203; }

        /* 2. القائمة الرئيسية */
        .assignments-list-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;
        }
        .assignments-list-header h3 { margin: 0; color: #444; }

        /* 3. تصميم الصف (الواجب) */
        .assignment-row {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 12px;
            display: flex; align-items: center; justify-content: space-between;
            transition: all 0.2s ease;
        }
        .assignment-row:hover { border-color: #007bff; box-shadow: 0 3px 10px rgba(0,0,0,0.05); }
        
        .row-info { display: flex; align-items: center; gap: 20px; flex-grow: 1; }
        .row-icon { 
            width: 40px; height: 40px; background: #f0f2f5; 
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            color: #555; font-size: 1.2rem;
        }
        .row-text h5 { margin: 0 0 4px 0; font-size: 1rem; font-weight: bold; color: #333; }
        .row-text .meta { font-size: 0.85rem; color: #777; }
        .row-text .meta span { margin-left: 15px; }
        
        .row-actions { display: flex; align-items: center; gap: 15px; }
        .btn-action {
            padding: 6px 15px; border-radius: 5px; border: 1px solid #ddd;
            background: white; color: #555; font-size: 0.9rem; cursor: pointer; transition: 0.2s;
        }
        .btn-action:hover { background: #f8f9fa; border-color: #ccc; }
        .btn-primary-action { background: #007bff; color: white; border: none; }
        .btn-primary-action:hover { background: #0056b3; }

        /* حالة فارغة */
        .empty-list { text-align: center; padding: 40px; background: #fafafa; border-radius: 8px; color: #777; }

        @media (max-width: 768px) {
            .assignment-row { flex-direction: column; align-items: flex-start; gap: 15px; }
            .row-actions { width: 100%; justify-content: space-between; margin-top: 10px; }
            .row-info { width: 100%; }
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 📋 2. عرض الواجبات (مع دعم التصفية)
// ==========================================

// دالة التصفية التي يستدعيها ملف HTML
function filterAssignments() {
    const filterValue = document.getElementById('assignmentFilter').value;
    loadStudentAssignments(filterValue);
}

function loadStudentAssignments(filter = 'all') {
    const assignmentsList = document.getElementById('assignmentsList');
    assignmentsList.className = ''; 
    
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    // 1. فلترة حسب الطالب
    let list = studentAssignments.filter(assignment => 
        assignment.studentId === currentStudent.id
    );

    // 2. فلترة حسب الحالة (من القائمة المنسدلة)
    if (filter !== 'all') {
        list = list.filter(a => {
            if (filter === 'pending') return a.status === 'pending';
            if (filter === 'completed') return a.status === 'completed';
            if (filter === 'overdue') return a.status === 'overdue'; // (إذا كنت تستخدم هذه الحالة)
            return true;
        });
    }
    
    // 3. الفرز: المعلقة أولاً
    list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.assignedDate) - new Date(a.assignedDate);
    });

    if (list.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-list">
                <div style="font-size:2.5rem; margin-bottom:10px;">📂</div>
                <h4>لا توجد واجبات مطابقة</h4>
                <p>جرب تغيير خيار التصفية.</p>
            </div>
        `;
        return;
    }
    
    let html = `<div class="assignments-list-header">
                    <h3>📝 قائمة الواجبات (${list.length})</h3>
                </div>`;

    html += list.map(assignment => {
        const isPending = assignment.status === 'pending';
        const dateStr = new Date(assignment.assignedDate).toLocaleDateString('ar-SA');
        const dueStr = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('ar-SA') : 'مفتوح';
        
        return `
            <div class="assignment-row" style="${isPending ? 'border-right: 4px solid #ffc107;' : 'border-right: 4px solid #28a745;'}">
                <div class="row-info">
                    <div class="row-icon">
                        <i class="${isPending ? 'fas fa-hourglass-half text-warning' : 'fas fa-check-circle text-success'}"></i>
                    </div>
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
                    
                    ${isPending ? `
                        <button class="btn-action btn-primary-action" onclick="solveAssignment(${assignment.id})">
                            ابدأ الحل
                        </button>
                    ` : `
                        <button class="btn-action" onclick="viewAssignmentResult(${assignment.id})">
                            مراجعة الحل
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    assignmentsList.innerHTML = html;
}

// 3. تحديث قسم "الواجب الحالي"
function updateCurrentAssignmentSection() {
    const section = document.getElementById('currentAssignmentSection');
    if (!section) return;

    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const urgent = studentAssignments.find(a => a.studentId === currentStudent.id && a.status === 'pending');
    
    if (!urgent) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    section.innerHTML = `
        <div class="urgent-alert">
            <div class="urgent-info">
                <h4><i class="fas fa-exclamation-circle"></i> تذكير: واجب مستحق</h4>
                <p>لديك واجب بعنوان "<strong>${urgent.title}</strong>" بانتظار الحل.</p>
            </div>
            <button class="btn-urgent" onclick="solveAssignment(${urgent.id})">
                الذهاب للواجب
            </button>
        </div>
    `;
}

// ==========================================
// 🔥 4. محرك الحل (يعمل بشكل صحيح)
// ==========================================

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) { alert('الواجب غير موجود'); return; }
    
    currentAssignmentId = assignmentId;
    document.getElementById('assignmentModalTitle').textContent = assignment.title;
    const contentDiv = document.getElementById('assignmentContent');
    contentDiv.innerHTML = ''; 

    if (assignment.description) {
        contentDiv.innerHTML += `<div class="alert alert-info mb-4">${assignment.description}</div>`;
    }

    if (!assignment.questions || assignment.questions.length === 0) {
        contentDiv.innerHTML += `<div class="text-center p-5"><h3>لا توجد أسئلة.</h3></div>`;
    } else {
        let questionsHtml = '<form id="studentAnswersForm">';
        assignment.questions.forEach((q, index) => {
            questionsHtml += renderSingleQuestion(q, index);
        });
        questionsHtml += '</form>';
        contentDiv.innerHTML += questionsHtml;
    }
    
    document.getElementById('solveAssignmentModal').classList.add('show');
}

function renderSingleQuestion(q, index) {
    let html = `
    <div class="question-box mb-4 p-3 border rounded bg-white shadow-sm" data-id="${q.id}" data-type="${q.type}">
        <div class="d-flex justify-content-between mb-2">
            <h5 class="font-weight-bold">سؤال ${index + 1}</h5>
            <span class="badge badge-secondary">${q.passingScore || 1} درجات</span>
        </div>
    `;

    if (q.type === 'mcq' || q.type === 'mcq-media') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        if (q.attachment) {
            html += `<div class="mb-3 text-center"><img src="${q.attachment}" style="max-width:100%; max-height:200px; border-radius:8px; border:1px solid #ddd;"></div>`;
        }
        if (q.choices && q.choices.length > 0) {
            html += `<div class="choices-list">`;
            q.choices.forEach((choice, i) => {
                html += `
                <div class="custom-control custom-radio mb-2">
                    <input type="radio" id="q${index}_opt${i}" name="q_${q.id}" value="${i}" class="custom-control-input">
                    <label class="custom-control-label" for="q${index}_opt${i}">${choice}</label>
                </div>`;
            });
            html += `</div>`;
        }
    } else if (q.type === 'open-ended') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        html += `<textarea class="form-control" name="q_${q.id}" rows="4" placeholder="اكتب إجابتك هنا..."></textarea>`;
    } else if (q.paragraphs) {
        html += `<p class="lead mb-3">${q.text || 'أجب عما يلي:'}</p>`;
        q.paragraphs.forEach((p, pIdx) => {
            html += `<div class="mb-2 p-2 bg-light rounded">`;
            if (q.type === 'missing-char') {
                html += `<label>أكمل الحرف الناقص: <strong>${p.missing || ''}</strong></label>`;
                html += `<input type="text" class="form-control mt-1" name="q_${q.id}_p${pIdx}" placeholder="الكلمة كاملة">`;
            } else if (q.type.includes('reading')) {
                html += `<div class="p-2 border bg-white mb-2">${p.text}</div>`;
                html += `<p class="text-muted small">اقرأ النص أعلاه</p>`;
            } else {
                html += `<p>${p.text}</p>`;
                html += `<input type="text" class="form-control" name="q_${q.id}_p${pIdx}" placeholder="إجابتك...">`;
            }
            html += `</div>`;
        });
    }
    html += `</div>`;
    return html;
}

function submitAssignment() {
    if (!currentAssignmentId) return;
    if(!confirm('تسليم الإجابات النهائية؟')) return;

    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignmentIndex = studentAssignments.findIndex(a => a.id === currentAssignmentId);
    if (assignmentIndex === -1) return;

    const assignment = studentAssignments[assignmentIndex];
    const form = document.getElementById('studentAnswersForm');
    
    let totalScore = 0;
    let earnedScore = 0;
    const studentAnswers = [];

    assignment.questions.forEach(q => {
        const qScore = parseInt(q.passingScore || 1);
        totalScore += qScore;
        let answerData = { questionId: q.id, type: q.type, score: 0 };

        if (q.type === 'mcq' || q.type === 'mcq-media') {
            const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
            if (selected) {
                const val = parseInt(selected.value);
                answerData.value = val;
                if (val === parseInt(q.correctAnswer)) {
                    earnedScore += qScore;
                    answerData.score = qScore;
                }
            } else { answerData.value = null; }
        } else if (q.type === 'open-ended') {
            const textVal = form.querySelector(`textarea[name="q_${q.id}"]`)?.value;
            answerData.value = textVal;
        } else {
            answerData.value = "تم الحل";
        }
        studentAnswers.push(answerData);
    });

    let finalPercent = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 100;

    studentAssignments[assignmentIndex].status = 'completed';
    studentAssignments[assignmentIndex].completedDate = new Date().toISOString();
    studentAssignments[assignmentIndex].score = finalPercent;
    studentAssignments[assignmentIndex].answers = studentAnswers;

    localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
    
    alert(`تم التسليم! الدرجة التقديرية: ${finalPercent}%`);
    closeSolveAssignmentModal();
    loadStudentAssignments();
    updateCurrentAssignmentSection();
}

function closeSolveAssignmentModal() {
    document.getElementById('solveAssignmentModal').classList.remove('show');
    currentAssignmentId = null;
}

function viewAssignmentResult(assignmentId) {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const item = list.find(a => a.id == assignmentId);
    if(item) {
        alert(`تم الحل بتاريخ: ${new Date(item.completedDate).toLocaleDateString('ar-SA')}\nالدرجة: ${item.score}%`);
    }
}

// تصدير الدوال للاستخدام العالمي (لضمان عملها مع HTML onclick)
window.filterAssignments = filterAssignments;
window.solveAssignment = solveAssignment;
window.submitAssignment = submitAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.viewAssignmentResult = viewAssignmentResult;

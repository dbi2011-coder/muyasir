// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب - عرض وحل الواجبات (مع تصميم احترافي ومنظم)
// ============================================

let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-assignments.html')) {
        injectAssignmentStyles(); // 🔥 إضافة التصميم
        loadStudentAssignments();
        updateCurrentAssignmentSection();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// ==========================================
// 🎨 1. حقن التنسيقات (CSS Injection)
// ==========================================
function injectAssignmentStyles() {
    if (document.getElementById('assignmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'assignmentStyles';
    style.innerHTML = `
        /* تنسيق الحاوية الرئيسية */
        #currentAssignmentSection { margin-bottom: 30px; }
        
        /* تنسيق اللوحة العلوية (الواجب العاجل) */
        .hero-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(118, 75, 162, 0.2);
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .hero-banner h3 { margin: 0 0 10px 0; font-size: 1.8rem; font-weight: bold; }
        .hero-banner p { opacity: 0.9; margin-bottom: 20px; font-size: 1.1rem; }
        .btn-hero {
            background: white; color: #764ba2; border: none; padding: 10px 30px;
            border-radius: 25px; font-weight: bold; transition: transform 0.2s;
            cursor: pointer; text-decoration: none; display: inline-block;
        }
        .btn-hero:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

        /* تنسيق أدوات التصفية */
        .filters-container {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 10px; border: 1px solid #eee;
        }
        .filter-label { font-weight: bold; color: #555; margin-left: 10px; }

        /* تنسيق شبكة البطاقات */
        .assignments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* استجابة تلقائية */
            gap: 20px;
        }

        /* تنسيق البطاقة الواحدة */
        .assignment-card {
            background: white; border: 1px solid #e0e0e0; border-radius: 12px;
            overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;
            display: flex; flex-direction: column;
        }
        .assignment-card:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
        
        .card-header { padding: 15px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: flex-start; }
        .card-title { margin: 0; font-size: 1.1rem; color: #333; font-weight: bold; }
        
        .status-badge { font-size: 0.75rem; padding: 4px 8px; border-radius: 12px; font-weight: bold; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-overdue { background: #f8d7da; color: #721c24; }

        .card-body { padding: 15px; flex-grow: 1; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; color: #666; }
        .meta-label { color: #999; }
        .meta-val { color: #333; font-weight: 500; }

        .card-footer { padding: 15px; background: #fafafa; border-top: 1px solid #f0f0f0; text-align: center; }
        .btn-card { width: 100%; padding: 8px; border-radius: 6px; font-size: 0.95rem; }

        /* حالة فارغة */
        .empty-state { text-align: center; padding: 50px; color: #999; grid-column: 1 / -1; }
        .empty-icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.5; }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 📋 2. عرض الواجبات
// ==========================================

function loadStudentAssignments() {
    const assignmentsList = document.getElementById('assignmentsList');
    // إضافة كلاس الشبكة للحاوية
    assignmentsList.className = 'assignments-grid';
    
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    const studentAssignmentsFiltered = studentAssignments.filter(assignment => 
        assignment.studentId === currentStudent.id
    );
    
    if (studentAssignmentsFiltered.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3>لا توجد واجبات مطلوبة</h3>
                <p>أنت متفوق! لقد أنجزت جميع مهامك.</p>
            </div>
        `;
        return;
    }
    
    assignmentsList.innerHTML = studentAssignmentsFiltered.map(assignment => {
        const statusClass = getAssignmentStatusClass(assignment.status);
        const statusText = getAssignmentStatusText(assignment.status);
        
        // تحديد لون الشريط الجانبي بناءً على الحالة
        let borderStyle = '';
        if(assignment.status === 'pending') borderStyle = 'border-right: 4px solid #ffc107;';
        else if(assignment.status === 'completed') borderStyle = 'border-right: 4px solid #28a745;';
        
        return `
            <div class="assignment-card" style="${borderStyle}">
                <div class="card-header">
                    <h3 class="card-title">${assignment.title}</h3>
                    <span class="status-badge status-${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <div class="meta-row">
                        <span class="meta-label"><i class="fas fa-book"></i> المادة:</span>
                        <span class="meta-val">${assignment.subject || 'عام'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label"><i class="far fa-calendar-alt"></i> الإسناد:</span>
                        <span class="meta-val">${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</span>
                    </div>
                    ${assignment.dueDate ? `
                    <div class="meta-row">
                        <span class="meta-label"><i class="far fa-clock"></i> التسليم:</span>
                        <span class="meta-val text-danger">${new Date(assignment.dueDate).toLocaleDateString('ar-SA')}</span>
                    </div>` : ''}
                    ${assignment.score !== undefined ? `
                    <div class="meta-row" style="margin-top:10px; padding-top:10px; border-top:1px dashed #eee;">
                        <span class="meta-label">الدرجة:</span>
                        <span class="meta-val badge badge-success">${assignment.score}%</span>
                    </div>` : ''}
                </div>
                <div class="card-footer">
                    ${assignment.status === 'pending' ? `
                    <button class="btn btn-success btn-card" onclick="solveAssignment(${assignment.id})">
                        <i class="fas fa-pencil-alt"></i> حل الواجب
                    </button>
                    ` : ''}
                    ${assignment.status === 'completed' ? `
                    <button class="btn btn-primary btn-card" onclick="viewAssignmentResult(${assignment.id})">
                        <i class="fas fa-eye"></i> عرض إجابتي
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 3. تحديث قسم "الواجب الحالي" (Hero Section)
function updateCurrentAssignmentSection() {
    const currentAssignmentSection = document.getElementById('currentAssignmentSection');
    if (!currentAssignmentSection) return;

    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    // البحث عن أقرب واجب لم يتم حله
    const currentAssignment = studentAssignments.find(assignment => 
        assignment.studentId === currentStudent.id && assignment.status === 'pending'
    );
    
    if (!currentAssignment) {
        // إخفاء القسم إذا لم يوجد واجب عاجل لتوفير المساحة
        currentAssignmentSection.style.display = 'none';
        return;
    }
    
    currentAssignmentSection.style.display = 'block';
    currentAssignmentSection.innerHTML = `
        <div class="hero-banner">
            <div style="font-size:3rem; margin-bottom:10px;">🚀</div>
            <h3>واجب جديد: ${currentAssignment.title}</h3>
            <p>مطلوب تسليمه في: ${new Date(currentAssignment.dueDate).toLocaleDateString('ar-SA')}</p>
            <button class="btn-hero" onclick="solveAssignment(${currentAssignment.id})">
                ابدأ الحل الآن <i class="fas fa-arrow-left"></i>
            </button>
        </div>
    `;
}

// ==========================================
// 🔥 4. محرك الحل (كما هو - يعمل بشكل صحيح)
// ==========================================

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        alert('الواجب غير موجود');
        return;
    }
    
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

function getAssignmentStatusClass(status) {
    const statusClasses = { 'pending': 'pending', 'completed': 'completed', 'overdue': 'overdue' };
    return statusClasses[status] || 'pending';
}

function getAssignmentStatusText(status) {
    const statusTexts = { 'pending': 'معلقة', 'completed': 'مكتملة', 'overdue': 'متأخرة' };
    return statusTexts[status] || 'غير محدد';
}

window.solveAssignment = solveAssignment;
window.submitAssignment = submitAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.viewAssignmentResult = viewAssignmentResult;

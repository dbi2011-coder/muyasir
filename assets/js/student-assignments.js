// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب - (إصلاح نهائي: إجبار بناء نافذة الحل + تصميم القائمة)
// ============================================

let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من أننا في صفحة الواجبات
    if (document.getElementById('assignmentsList') || window.location.pathname.includes('my-assignments.html')) {
        console.log("🚀 تشغيل نظام الواجبات...");
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
        return { id: 0 }; 
    }
}

// ==========================================
// 🏗️ 1. بناء نافذة الحل (Modal Injection) - مع التنظيف القسري
// ==========================================
function injectSolveModal() {
    // 🧹 تنظيف: حذف أي نافذة قديمة لضمان عدم التعارض
    const oldModal = document.getElementById('solveAssignmentModal');
    if (oldModal) {
        oldModal.remove();
        console.log("تم حذف نافذة الحل القديمة.");
    }
    
    // بناء النافذة الجديدة
    const modalHtml = `
    <div id="solveAssignmentModal" class="modal" style="display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(5px);">
        <div class="modal-content" style="background-color: #fff; margin: 5vh auto; padding: 25px; border: 1px solid #888; width: 90%; max-width: 800px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: slideDown 0.3s ease-out;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
                <h3 id="assignmentModalTitle" style="margin: 0; color: #333; font-weight:bold;">حل الواجب</h3>
                <span onclick="closeSolveAssignmentModal()" style="color: #666; font-size: 28px; font-weight: bold; cursor: pointer; line-height: 20px;">&times;</span>
            </div>
            
            <div id="assignmentContent" style="max-height: 70vh; overflow-y: auto; padding-right: 5px;">
                <div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i> جاري التحميل...</div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; text-align: left; display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="closeSolveAssignmentModal()" style="padding: 10px 20px; border-radius: 6px; border: 1px solid #ccc; background: #f8f9fa; color:#333; cursor: pointer;">إلغاء</button>
                <button id="btnSubmitAnswers" onclick="submitAssignment()" style="padding: 10px 25px; border-radius: 6px; border: none; background: #28a745; color: white; cursor: pointer; font-weight:bold;">✅ تسليم الإجابات</button>
            </div>
        </div>
        <style>@keyframes slideDown { from {transform: translateY(-50px); opacity: 0;} to {transform: translateY(0); opacity: 1;} }</style>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log("تم بناء نافذة الحل الجديدة بنجاح.");
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
        .assignments-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Tajawal', sans-serif; }
        
        /* إظهار النافذة */
        .modal.show { display: block !important; }

        /* 1. قسم التنبيه */
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
            transition: 0.2s;
        }
        .btn-urgent:hover { background-color: #b38600; transform: translateY(-2px); }

        /* 2. القائمة */
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
        .btn-primary-action:hover { background: #0056b3; box-shadow: 0 4px 10px rgba(0,123,255,0.3); }

        .empty-list { text-align: center; padding: 60px; background: #fafafa; border-radius: 12px; color: #888; border:2px dashed #eee; }

        @media (max-width: 768px) {
            .assignment-row { flex-direction: column; align-items: flex-start; gap: 15px; }
            .row-actions { width: 100%; justify-content: flex-end; margin-top: 10px; border-top:1px solid #eee; padding-top:10px; }
            .row-text .meta { display:flex; flex-direction:column; gap:5px; }
            .row-text .meta span { margin-left:0; }
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
    
    assignmentsList.className = ''; // تنظيف الكلاسات
    
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    let list = studentAssignments.filter(assignment => assignment.studentId === currentStudent.id);

    // تصفية
    if (filter !== 'all') {
        list = list.filter(a => a.status === filter);
    }
    
    // ترتيب: الأحدث أولاً، والمعلق قبل المكتمل
    list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.assignedDate) - new Date(a.assignedDate);
    });

    if (list.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-list">
                <div style="font-size:3rem; margin-bottom:15px; opacity:0.5;">📂</div>
                <h4>لا توجد واجبات مطابقة</h4>
                <p>لم يتم العثور على واجبات في هذا التصنيف.</p>
            </div>`;
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
                    <div class="row-icon">
                        <i class="${isPending ? 'fas fa-hourglass-half text-warning' : 'fas fa-check-circle text-success'}"></i>
                    </div>
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
                    ${!isPending && assignment.score !== undefined ? `<span class="badge badge-success" style="padding:8px 12px; font-size:0.9rem;">${assignment.score}%</span>` : ''}
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
                <p>لديك واجب بعنوان "<strong>${urgent.title}</strong>" بانتظار الحل.</p>
            </div>
            <button class="btn-urgent" onclick="solveAssignment(${urgent.id})">
                الذهاب للواجب <i class="fas fa-arrow-left"></i>
            </button>
        </div>`;
}

// ==========================================
// 🔥 4. محرك الحل (الأسئلة الديناميكية)
// ==========================================

function solveAssignment(assignmentId) {
    console.log("بدء حل الواجب رقم:", assignmentId);
    
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) { alert('عذراً، لم يتم العثور على بيانات الواجب.'); return; }
    
    currentAssignmentId = assignmentId;
    
    // تحديث العنوان
    const titleEl = document.getElementById('assignmentModalTitle');
    if(titleEl) titleEl.textContent = assignment.title;
    
    const contentDiv = document.getElementById('assignmentContent');
    if(!contentDiv) { console.error("عنصر المحتوى غير موجود"); return; }
    
    contentDiv.innerHTML = ''; 

    // زر التسليم (إخفاء/إظهار)
    const btnSubmit = document.getElementById('btnSubmitAnswers');
    if(btnSubmit) btnSubmit.style.display = (assignment.status === 'completed') ? 'none' : 'inline-block';

    // الوصف
    if (assignment.description) {
        contentDiv.innerHTML += `<div class="alert alert-info mb-4" style="background:#e3f2fd; padding:15px; border-radius:8px; border:1px solid #bbdefb; color:#0d47a1;">${assignment.description}</div>`;
    }

    // الأسئلة
    if (!assignment.questions || assignment.questions.length === 0) {
        contentDiv.innerHTML += `<div class="text-center p-5"><h3>لا توجد أسئلة مسجلة في هذا الواجب.</h3></div>`;
    } else {
        let questionsHtml = '<form id="studentAnswersForm">';
        assignment.questions.forEach((q, index) => {
            questionsHtml += renderSingleQuestion(q, index, assignment.status === 'completed', assignment.answers);
        });
        questionsHtml += '</form>';
        contentDiv.innerHTML += questionsHtml;
    }
    
    // إظهار النافذة
    const modal = document.getElementById('solveAssignmentModal');
    if(modal) modal.classList.add('show');
}

function renderSingleQuestion(q, index, isReadOnly = false, previousAnswers = []) {
    const prevAnswer = previousAnswers ? previousAnswers.find(a => a.questionId === q.id) : null;
    
    let html = `
    <div class="question-box mb-4" style="margin-bottom:20px; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <h5 style="font-weight:bold; margin:0; color:#444;">سؤال ${index + 1}</h5>
            <span class="badge" style="background:#eee; padding:4px 10px; border-radius:15px; font-size:0.85rem;">${q.passingScore || 1} درجات</span>
        </div>
    `;

    // عرض صورة السؤال إن وجدت
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
                
                let rowStyle = 'padding:10px; border:1px solid #eee; border-radius:6px; display:flex; align-items:center; gap:10px;';
                if (isReadOnly) {
                    if (i === parseInt(q.correctAnswer)) rowStyle += ' background-color:#d4edda; border-color:#c3e6cb;'; // الإجابة الصحيحة (أخضر)
                    else if (isChecked && i !== parseInt(q.correctAnswer)) rowStyle += ' background-color:#f8d7da; border-color:#f5c6cb;'; // إجابة الطالب الخاطئة (أحمر)
                }

                html += `
                <label style="${rowStyle} cursor:pointer;">
                    <input type="radio" name="q_${q.id}" value="${i}" ${isChecked} ${disabled} style="transform:scale(1.2);">
                    <span style="font-size:1rem;">${choice}</span>
                </label>`;
            });
            html += `</div>`;
        }
    } 
    // 2. سؤال مقالي
    else if (q.type === 'open-ended') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        html += `<textarea class="form-control" name="q_${q.id}" rows="4" style="width:100%; padding:12px; border:1px solid #ccc; border-radius:6px; font-size:1rem;" placeholder="اكتب إجابتك هنا..." ${isReadOnly ? 'readonly' : ''}>${prevAnswer ? prevAnswer.value : ''}</textarea>`;
    } 
    // 3. أسئلة الفقرات (الفراغات)
    else if (q.paragraphs) {
        html += `<p class="lead mb-3">${q.text || 'أجب عما يلي:'}</p>`;
        q.paragraphs.forEach((p, pIdx) => {
            html += `<div style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px;">`;
            if (q.type === 'missing-char') {
                html += `<label style="display:block; margin-bottom:5px;">أكمل الحرف الناقص: <strong style="font-size:1.2rem; margin:0 5px;">${p.missing || ''}</strong></label>`;
                html += `<input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="اكتب الكلمة كاملة" ${isReadOnly ? 'readonly' : ''}>`;
            } else {
                html += `<p style="margin-bottom:5px;">${p.text}</p>`;
                html += `<input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="إجابتك..." ${isReadOnly ? 'readonly' : ''}>`;
            }
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
            answerData.value = "تم الحل"; // تصحيح يدوي لاحقاً
        }
        studentAnswers.push(answerData);
    });

    let finalPercent = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 100;

    studentAssignments[idx].status = 'completed';
    studentAssignments[idx].completedDate = new Date().toISOString();
    studentAssignments[idx].score = finalPercent;
    studentAssignments[idx].answers = studentAnswers;

    localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
    
    alert(`تم التسليم بنجاح! النتيجة التقديرية: ${finalPercent}%`);
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
    solveAssignment(assignmentId); // فتح نفس النافذة بوضع القراءة
}

// تصدير الدوال للنطاق العام (لتعمل مع HTML)
window.filterAssignments = filterAssignments;
window.solveAssignment = solveAssignment;
window.submitAssignment = submitAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.viewAssignmentResult = viewAssignmentResult;

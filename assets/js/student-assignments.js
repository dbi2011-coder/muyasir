// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب - عرض وحل الواجبات (ديناميكي)
// ============================================

let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-assignments.html')) {
        loadStudentAssignments();
        updateCurrentAssignmentSection();
    }
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}

// 1. تحميل قائمة الواجبات
function loadStudentAssignments() {
    const assignmentsList = document.getElementById('assignmentsList');
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    const studentAssignmentsFiltered = studentAssignments.filter(assignment => 
        assignment.studentId === currentStudent.id
    );
    
    if (studentAssignmentsFiltered.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>لا توجد واجبات مطلوبة</h3>
                <p>سيتم إضافة الواجبات المطلوبة هنا</p>
            </div>
        `;
        return;
    }
    
    assignmentsList.innerHTML = studentAssignmentsFiltered.map(assignment => {
        const statusClass = getAssignmentStatusClass(assignment.status);
        const statusText = getAssignmentStatusText(assignment.status);
        
        return `
            <div class="assignment-card ${statusClass}">
                <div class="card-header">
                    <h3 class="card-title">${assignment.title}</h3>
                    <span class="card-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-item">
                        <span>المادة:</span>
                        <strong>${assignment.subject || 'عام'}</strong>
                    </div>
                    <div class="meta-item">
                        <span>تاريخ الإضافة:</span>
                        <strong>${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</strong>
                    </div>
                    ${assignment.dueDate ? `
                    <div class="meta-item">
                        <span>موعد التسليم:</span>
                        <strong>${new Date(assignment.dueDate).toLocaleDateString('ar-SA')}</strong>
                    </div>
                    ` : ''}
                    ${assignment.score !== undefined ? `
                    <div class="meta-item">
                        <span>النتيجة:</span>
                        <strong>${assignment.score}%</strong>
                    </div>
                    ` : ''}
                </div>
                <div class="card-actions">
                    ${assignment.status === 'pending' ? `
                    <button class="btn btn-success" onclick="solveAssignment(${assignment.id})">📝 حل الواجب</button>
                    ` : ''}
                    ${assignment.status === 'completed' ? `
                    <button class="btn btn-primary" onclick="viewAssignmentResult(${assignment.id})">📄 عرض الإجابة</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 2. تحديث قسم "الواجب الحالي"
function updateCurrentAssignmentSection() {
    const currentAssignmentSection = document.getElementById('currentAssignmentSection');
    if (!currentAssignmentSection) return;

    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    const currentAssignment = studentAssignments.find(assignment => 
        assignment.studentId === currentStudent.id && assignment.status === 'pending'
    );
    
    if (!currentAssignment) {
        currentAssignmentSection.innerHTML = `
            <div class="current-assignment-content">
                <h3 class="current-assignment-title">ممتاز! لا توجد واجبات جديدة</h3>
                <p class="current-assignment-description">أنجزت جميع مهامك، استمتع بوقتك.</p>
            </div>
        `;
        return;
    }
    
    currentAssignmentSection.innerHTML = `
        <div class="current-assignment-content">
            <h3 class="current-assignment-title">واجب جديد: ${currentAssignment.title}</h3>
            <p class="current-assignment-description">يجب تسليم هذا الواجب قريباً.</p>
            <button class="btn btn-light btn-large" onclick="solveAssignment(${currentAssignment.id})">
                ابدأ الحل الآن
            </button>
        </div>
    `;
}

// ==========================================
// 🔥 3. محرك حل الواجبات (Dynamic Rendering) 🔥
// ==========================================

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    // البحث في واجبات الطالب (التي تم نسخها له)
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    // إذا لم نجد الأسئلة داخل واجب الطالب، نحاول البحث في المصدر (للحالات القديمة)
    // لكن في نظامنا الحالي، تم نسخ الأسئلة بالفعل داخل كائن الواجب عند الإسناد.
    
    if (!assignment) {
        alert('الواجب غير موجود');
        return;
    }
    
    currentAssignmentId = assignmentId;
    
    document.getElementById('assignmentModalTitle').textContent = assignment.title;
    
    // بناء واجهة الأسئلة
    const contentDiv = document.getElementById('assignmentContent');
    contentDiv.innerHTML = ''; // تنظيف

    // تعليمات
    if (assignment.description) {
        contentDiv.innerHTML += `<div class="alert alert-info mb-4">${assignment.description}</div>`;
    }

    // هل توجد أسئلة؟
    if (!assignment.questions || assignment.questions.length === 0) {
        contentDiv.innerHTML += `<div class="text-center p-5"><h3>لا توجد أسئلة في هذا الواجب.</h3><p>قد يكون واجباً للقراءة أو المراجعة فقط.</p></div>`;
    } else {
        // توليد الأسئلة
        let questionsHtml = '<form id="studentAnswersForm">';
        
        assignment.questions.forEach((q, index) => {
            questionsHtml += renderSingleQuestion(q, index);
        });
        
        questionsHtml += '</form>';
        contentDiv.innerHTML += questionsHtml;
    }
    
    document.getElementById('solveAssignmentModal').classList.add('show');
}

// دالة مساعدة لرسم سؤال واحد حسب نوعه
function renderSingleQuestion(q, index) {
    let html = `
    <div class="question-box mb-4 p-3 border rounded bg-white shadow-sm" data-id="${q.id}" data-type="${q.type}">
        <div class="d-flex justify-content-between mb-2">
            <h5 class="font-weight-bold">سؤال ${index + 1}</h5>
            <span class="badge badge-secondary">${q.passingScore || 1} درجات</span>
        </div>
    `;

    // 1. الأسئلة القياسية (MCQ)
    if (q.type === 'mcq' || q.type === 'mcq-media') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        
        // عرض الصورة إذا وجدت
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
    } 
    // 2. الأسئلة المقالية
    else if (q.type === 'open-ended') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        html += `<textarea class="form-control" name="q_${q.id}" rows="4" placeholder="اكتب إجابتك هنا..."></textarea>`;
    }
    // 3. الأسئلة المركبة (فقرات) - معالجة مبسطة للطالب
    else if (q.paragraphs) {
        html += `<p class="lead mb-3">${q.text || 'أجب عما يلي:'}</p>`;
        q.paragraphs.forEach((p, pIdx) => {
            html += `<div class="mb-2 p-2 bg-light rounded">`;
            if (q.type === 'missing-char') {
                html += `<label>أكمل الحرف الناقص: <strong>${p.missing || ''}</strong></label>`;
                html += `<input type="text" class="form-control mt-1" name="q_${q.id}_p${pIdx}" placeholder="الكلمة كاملة">`;
            } else if (q.type.includes('reading')) {
                html += `<div class="p-2 border bg-white mb-2">${p.text}</div>`;
                html += `<p class="text-muted small">اقرأ النص أعلاه (تقييم ذاتي أو يسجله المعلم لاحقاً)</p>`;
            } else {
                // fallback لبقية الأنواع
                html += `<p>${p.text}</p>`;
                html += `<input type="text" class="form-control" name="q_${q.id}_p${pIdx}" placeholder="إجابتك...">`;
            }
            html += `</div>`;
        });
    }

    html += `</div>`;
    return html;
}

// ==========================================
// 🔥 4. نظام التسليم والتصحيح 🔥
// ==========================================

function submitAssignment() {
    if (!currentAssignmentId) return;
    
    // إظهار تأكيد
    if(!confirm('هل أنت متأكد من تسليم الإجابات؟ لا يمكنك التعديل بعد ذلك.')) return;

    // جلب الواجب الأصلي
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignmentIndex = studentAssignments.findIndex(a => a.id === currentAssignmentId);
    if (assignmentIndex === -1) return;

    const assignment = studentAssignments[assignmentIndex];
    const form = document.getElementById('studentAnswersForm');
    
    // جمع الإجابات وتصحيح الآلي منها
    let totalScore = 0;
    let earnedScore = 0;
    const studentAnswers = [];

    assignment.questions.forEach(q => {
        const qScore = parseInt(q.passingScore || 1);
        totalScore += qScore;
        
        let answerData = { questionId: q.id, type: q.type, score: 0 };

        if (q.type === 'mcq' || q.type === 'mcq-media') {
            // البحث عن الخيار المحدد
            const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
            if (selected) {
                const val = parseInt(selected.value);
                answerData.value = val;
                // تصحيح آلي
                if (val === parseInt(q.correctAnswer)) {
                    earnedScore += qScore;
                    answerData.score = qScore;
                }
            } else {
                answerData.value = null;
            }
        } else if (q.type === 'open-ended') {
            // المقالي يحتاج تصحيح معلم، نعطيه 0 مؤقتاً أو درجة كاملة حسب سياستك
            // هنا سنجعله 0 بانتظار المعلم، أو يمكن اعتباره "مكتمل"
            const textVal = form.querySelector(`textarea[name="q_${q.id}"]`)?.value;
            answerData.value = textVal;
            // المقالي لا يصحح آلياً هنا (يمكنك تغييره)
        } else {
            // بقية الأنواع تعتبر مقالية/يدوية حالياً
            answerData.value = "تم الحل";
            // earnedScore += qScore; // (اختياري: إعطاء الدرجة لمجرد المحاولة)
        }
        
        studentAnswers.push(answerData);
    });

    // حساب النسبة المئوية (للأسئلة القابلة للتصحيح)
    // إذا كان كله مقالي، قد تكون النسبة 0 وهذا طبيعي بانتظار المعلم
    let finalPercent = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 100;

    // تحديث البيانات
    studentAssignments[assignmentIndex].status = 'completed';
    studentAssignments[assignmentIndex].completedDate = new Date().toISOString();
    studentAssignments[assignmentIndex].score = finalPercent; // الدرجة المحسوبة
    studentAssignments[assignmentIndex].answers = studentAnswers; // حفظ إجابات الطالب

    localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
    
    alert(`تم التسليم بنجاح! نتيجتك الأولية: ${finalPercent}%`);
    closeSolveAssignmentModal();
    loadStudentAssignments();
    updateCurrentAssignmentSection();
}

function closeSolveAssignmentModal() {
    document.getElementById('solveAssignmentModal').classList.remove('show');
    currentAssignmentId = null;
}

// عرض النتيجة (للمراجعة فقط)
function viewAssignmentResult(assignmentId) {
    const list = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const item = list.find(a => a.id == assignmentId);
    if(item) {
        alert(`تم حل هذا الواجب بتاريخ: ${new Date(item.completedDate).toLocaleDateString('ar-SA')}\nالدرجة: ${item.score}%`);
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

// تصدير الدوال
window.solveAssignment = solveAssignment;
window.submitAssignment = submitAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.viewAssignmentResult = viewAssignmentResult;

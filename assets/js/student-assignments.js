// ============================================
// 📁 المسار: assets/js/student-assignments.js
// الوصف: واجهة الطالب (تصميم البطاقات Cards + حل المشاكل السابقة)
// ============================================

let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('assignmentsList') || window.location.pathname.includes('my-assignments.html')) {
        injectCardStyles(); // 🎨 استخدام ستايل البطاقات
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
// 🏗️ 1. بناء نافذة الحل (Modal)
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
// 🎨 2. تنسيقات البطاقات (Card Styles)
// ==========================================
function injectCardStyles() {
    if (document.getElementById('cardAssignmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'cardAssignmentStyles';
    style.innerHTML = `
        .assignments-container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Tajawal', sans-serif; }
        .modal.show { display: block !important; }
        
        /* شبكة البطاقات */
        .assignments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* استجابة تلقائية */
            gap: 25px;
            margin-top: 20px;
        }

        /* تصميم البطاقة */
        .assignment-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #eee;
            position: relative;
        }
        
        .assignment-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        /* شريط الحالة الملون في الجانب */
        .card-status-bar {
            height: 6px;
            width: 100%;
        }
        .status-pending .card-status-bar { background: #ffc107; }
        .status-completed .card-status-bar { background: #28a745; }

        .card-body { padding: 20px; flex-grow: 1; }
        
        .card-title {
            margin: 0 0 10px 0;
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }

        .card-meta {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .card-badge {
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .badge-pending { background: #fff3cd; color: #856404; }
        .badge-completed { background: #d4edda; color: #155724; }

        .card-footer {
            padding: 15px 20px;
            background: #fcfcfc;
            border-top: 1px solid #f0f0f0;
            text-align: center;
        }

        .btn-card {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: none;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
        }
        .btn-solve { background: #007bff; color: white; }
        .btn-solve:hover { background: #0056b3; }
        .btn-review { background: white; border: 1px solid #ddd; color: #555; }
        .btn-review:hover { background: #f8f9fa; border-color: #bbb; }

        /* التنبيه العلوي */
        .urgent-alert {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 20px rgba(118, 75, 162, 0.2);
        }
        .urgent-info h4 { margin: 0 0 5px 0; font-size: 1.4rem; font-weight: bold; }
        .btn-urgent {
            background: white; color: #764ba2; border: none;
            padding: 10px 25px; border-radius: 25px; cursor: pointer; font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .empty-list { text-align: center; padding: 60px; color: #888; grid-column: 1/-1; }

        /* طباعة */
        @media print {
            body * { visibility: hidden; }
            #solveAssignmentModal, #solveAssignmentModal * { visibility: visible; }
            #solveAssignmentModal { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
            .question-box { border: 1px solid #000 !important; color: black !important; }
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 📋 3. منطق العرض (Grid Layout)
// ==========================================

function filterAssignments() {
    const filterValue = document.getElementById('assignmentFilter').value;
    loadStudentAssignments(filterValue);
}

function loadStudentAssignments(filter = 'all') {
    const assignmentsList = document.getElementById('assignmentsList');
    if (!assignmentsList) return;
    
    // 🔥 تغيير الكلاس إلى الشبكة
    assignmentsList.className = 'assignments-grid';
    assignmentsList.innerHTML = ''; 
    
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
        assignmentsList.innerHTML = `
            <div class="empty-list">
                <div style="font-size:3rem; margin-bottom:15px; opacity:0.5;">📭</div>
                <h4>لا توجد واجبات</h4>
                <p>سجلك نظيف تماماً!</p>
            </div>`;
        return;
    }
    
    // 🔥 بناء البطاقات
    assignmentsList.innerHTML = list.map(assignment => {
        const isPending = assignment.status === 'pending';
        const dateStr = new Date(assignment.assignedDate).toLocaleDateString('ar-SA');
        const dueStr = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('ar-SA') : 'مفتوح';
        const statusClass = isPending ? 'status-pending' : 'status-completed';
        const badgeClass = isPending ? 'badge-pending' : 'badge-completed';
        const statusText = isPending ? 'جديد' : 'مكتمل';

        return `
        <div class="assignment-card ${statusClass}">
            <div class="card-status-bar"></div>
            <span class="card-badge ${badgeClass}">${statusText}</span>
            
            <div class="card-body">
                <h3 class="card-title">${assignment.title}</h3>
                
                <div class="card-meta">
                    <i class="fas fa-book"></i>
                    <span>${assignment.subject || 'عام'}</span>
                </div>
                <div class="card-meta">
                    <i class="far fa-calendar-alt"></i>
                    <span>تاريخ الإسناد: ${dateStr}</span>
                </div>
                ${isPending ? `
                <div class="card-meta" style="color:#dc3545;">
                    <i class="far fa-clock"></i>
                    <span>آخر موعد: ${dueStr}</span>
                </div>` : `
                <div class="card-meta" style="color:#28a745;">
                    <i class="fas fa-check-circle"></i>
                    <span>الدرجة: ${assignment.score || 0}%</span>
                </div>
                `}
            </div>

            <div class="card-footer">
                <button class="btn-card ${isPending ? 'btn-solve' : 'btn-review'}" 
                    onclick="${isPending ? `solveAssignment(${assignment.id})` : `viewAssignmentResult(${assignment.id})`}">
                    ${isPending ? '<i class="fas fa-pencil-alt"></i> ابدأ الحل' : '<i class="fas fa-eye"></i> مراجعة الحل'}
                </button>
            </div>
        </div>
        `;
    }).join('');
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
                <h4>🚀 تذكير سريع!</h4>
                <p>لديك واجب بعنوان "<strong>${urgent.title}</strong>" بانتظار الحل.</p>
            </div>
            <button class="btn-urgent" onclick="solveAssignment(${urgent.id})">
                ابدأ الآن <i class="fas fa-arrow-left"></i>
            </button>
        </div>`;
}

// ==========================================
// 🔥 4. محرك الحل (نفس المنطق القوي السابق)
// ==========================================

function printAssignment() {
    window.print();
}

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    let assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) { alert('الواجب غير موجود'); return; }

    // جلب الأسئلة من المكتبة إذا كانت مفقودة
    if (!assignment.questions || assignment.questions.length === 0) {
        const allLibraryAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        const originalAssignment = allLibraryAssignments.find(a => a.title.trim() === assignment.title.trim());
        if (originalAssignment && originalAssignment.questions && originalAssignment.questions.length > 0) {
            assignment.questions = originalAssignment.questions;
            assignment.description = originalAssignment.description;
        }
    }
    
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

    if (!assignment.questions || assignment.questions.length === 0) {
        contentDiv.innerHTML += `
            <div class="text-center p-5" style="background:#fff3cd; border:1px solid #ffeeba; border-radius:10px;">
                <h3 style="color:#856404;">⚠️ لا توجد أسئلة مسجلة</h3>
                <p>يمكنك رفع الحل الورقي بالأسفل إذا طلب المعلم ذلك.</p>
            </div>`;
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

    if (q.type && (q.type === 'mcq' || q.type === 'mcq-media')) {
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
                html += `<label style="${style}"><input type="radio" name="q_${q.id}" value="${i}" ${isChecked} ${disabled} style="transform:scale(1.2); margin-left:10px;"> <span style="font-size:1rem;">${choice}</span></label>`;
            });
            html += `</div>`;
        }
    } else if (q.type === 'open-ended') {
        html += `<p class="lead mb-3">${q.text}</p>`;
        html += `<textarea class="form-control" name="q_${q.id}" rows="4" style="width:100%; padding:12px; border:1px solid #ccc; border-radius:6px;" placeholder="اكتب إجابتك هنا..." ${isReadOnly ? 'readonly' : ''}>${prevAnswer ? prevAnswer.value : ''}</textarea>`;
    } else {
        html += `<p class="lead mb-3">${q.text || 'أجب عن السؤال التالي:'}</p>`;
        if (q.paragraphs && q.paragraphs.length > 0) {
            q.paragraphs.forEach((p, pIdx) => {
                html += `<div style="margin-bottom:10px; background:#f9f9f9; padding:10px; border-radius:5px;">
                            <p>${p.text || ''}</p>
                            <input type="text" name="q_${q.id}_p${pIdx}" style="width:100%; padding:8px; border:1px solid #ccc;" placeholder="إجابتك..." ${isReadOnly ? 'readonly' : ''}>
                         </div>`;
            });
        } else {
            html += `<textarea class="form-control" name="q_${q.id}_fallback" rows="3" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px;" placeholder="اكتب إجابتك هنا..." ${isReadOnly ? 'readonly' : ''}>${prevAnswer ? prevAnswer.value : ''}</textarea>`;
        }
    }
    html += `</div>`;
    return html;
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function submitAssignment() {
    if (!currentAssignmentId) return;
    
    const form = document.getElementById('studentAnswersForm');
    const fileInput = document.getElementById('assignmentFileUpload');
    
    const hasDigitalAnswers = form && (form.querySelectorAll('input:checked').length > 0 || form.querySelectorAll('textarea, input[type=text]').length > 0);
    const hasFile = fileInput && fileInput.files.length > 0;

    if (!hasDigitalAnswers && !hasFile) {
        if(!confirm('تنبيه: أنت لم تجب على أي سؤال ولم ترفع ملفاً. هل تريد التسليم على أي حال؟')) return;
    } else {
        if(!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;
    }

    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const idx = studentAssignments.findIndex(a => a.id === currentAssignmentId);
    if (idx === -1) return;

    const assignment = studentAssignments[idx];
    
    // حفظ الأسئلة لضمان عدم ضياعها
    if (!assignment.questions || assignment.questions.length === 0) {
        const allLibraryAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        const originalAssignment = allLibraryAssignments.find(a => a.title.trim() === assignment.title.trim());
        if (originalAssignment) {
            assignment.questions = originalAssignment.questions;
        }
    }

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
    
    alert(`تم التسليم بنجاح!`);
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

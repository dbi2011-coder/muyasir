// ============================================
// 📁 الملف: muyasir-main/assets/js/educational-library.js
// ============================================

// نظام مكتبة المحتوى التعليمي المتكامل
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('library.html') || 
        window.location.pathname.includes('educational-library.html')) {
        initializeEducationalLibrary();
    }
});

function initializeEducationalLibrary() {
    loadAllContentSections();
    setupEventListeners();
    updateContentStats();
}

function loadAllContentSections() {
    loadDiagnosticAssessments();
    loadLessons();
    loadShortTermObjectives();
    loadAssignments();
}

// ============================================
// قسم الاختبارات التشخيصية
// ============================================

function loadDiagnosticAssessments() {
    const assessmentsList = document.getElementById('assessmentsList');
    const currentUser = getCurrentUser();
    
    // جلب الاختبارات التشخيصية للمستخدم الحالي
    const assessments = JSON.parse(localStorage.getItem(`diagnosticAssessments_${currentUser.id}`) || '[]');
    
    // ترتيب حسب التاريخ (الأحدث أولاً) ثم حسب المادة
    assessments.sort((a, b) => {
        const dateCompare = new Date(b.createdAt) - new Date(a.createdAt);
        if (dateCompare !== 0) return dateCompare;
        
        // ترتيب المواد: لغتي أولاً ثم رياضيات
        const subjectOrder = { 'لغتي': 1, 'رياضيات': 2 };
        return subjectOrder[a.subject] - subjectOrder[b.subject];
    });
    
    if (assessments.length === 0) {
        assessmentsList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📊</div>
                <h3>لا توجد اختبارات تشخيصية</h3>
                <p>قم بإضافة أول اختبار تشخيصي للمادة</p>
            </div>
        `;
        return;
    }
    
    assessmentsList.innerHTML = assessments.map(assessment => {
        const objectivesStatus = assessment.objectivesLinked ? 'تم الربط' : 'لم يتم الربط';
        const objectivesClass = assessment.objectivesLinked ? 'linked' : 'not-linked';
        
        return `
            <div class="content-card" data-id="${assessment.id}">
                <div class="content-header">
                    <h4>${assessment.title}</h4>
                    <span class="content-badge subject-${assessment.subject}">${assessment.subject}</span>
                </div>
                <div class="content-body">
                    <p>${assessment.description || 'لا يوجد وصف'}</p>
                    <div class="content-meta">
                        <span class="questions-count">${assessment.questions?.length || 0} سؤال</span>
                        <span class="objectives-status ${objectivesClass}">${objectivesStatus}</span>
                        <span class="creation-date">${formatDateShort(assessment.createdAt)}</span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewAssessment(${assessment.id})">
                        <span class="btn-icon">👁️</span> عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editAssessment(${assessment.id})">
                        <span class="btn-icon">✏️</span> تعديل
                    </button>
                    ${!assessment.objectivesLinked ? `
                    <button class="btn btn-sm btn-info" onclick="linkObjectivesToAssessment(${assessment.id})">
                        <span class="btn-icon">🔗</span> ربط الأهداف
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-success" onclick="exportAssessment(${assessment.id})">
                        <span class="btn-icon">📤</span> تصدير
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAssessment(${assessment.id})">
                        <span class="btn-icon">🗑️</span> حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function addNewDiagnosticAssessment() {
    showAssessmentCreationModal();
}

function showAssessmentCreationModal() {
    const modal = document.getElementById('assessmentCreationModal');
    if (!modal) {
        createAssessmentCreationModal();
    }
    
    document.getElementById('assessmentCreationModal').classList.add('show');
    resetAssessmentForm();
}

function createAssessmentCreationModal() {
    const modalHTML = `
        <div class="modal" id="assessmentCreationModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>إنشاء اختبار تشخيصي جديد</h3>
                    <button class="modal-close" onclick="closeAssessmentCreationModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="newAssessmentForm">
                        <div class="form-group">
                            <label for="assessmentTitle">عنوان الاختبار *</label>
                            <input type="text" id="assessmentTitle" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="assessmentSubject">المادة *</label>
                            <select id="assessmentSubject" class="form-control" required>
                                <option value="">اختر المادة</option>
                                <option value="لغتي">لغتي</option>
                                <option value="رياضيات">رياضيات</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="assessmentDescription">وصف الاختبار (اختياري)</label>
                            <textarea id="assessmentDescription" class="form-control" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>أنواع الأسئلة المتاحة:</label>
                            <div class="question-types-grid">
                                <div class="question-type-card" onclick="addQuestion('multipleChoice')">
                                    <div class="type-icon">🔘</div>
                                    <div class="type-name">اختيار من متعدد</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('dragDrop')">
                                    <div class="type-icon">↔️</div>
                                    <div class="type-name">سحب وإفلات</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('multipleChoiceWithAttachment')">
                                    <div class="type-icon">📎</div>
                                    <div class="type-name">اختيار مع مرفق</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('openEnded')">
                                    <div class="type-icon">📝</div>
                                    <div class="type-name">سؤال مفتوح</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('autoReading')">
                                    <div class="type-icon">📖</div>
                                    <div class="type-name">قراءة تلقائية</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('autoSpelling')">
                                    <div class="type-icon">✍️</div>
                                    <div class="type-name">إملاء تلقائي</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('manualReading')">
                                    <div class="type-icon">👂</div>
                                    <div class="type-name">قراءة يدوية</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('manualSpelling')">
                                    <div class="type-icon">📝</div>
                                    <div class="type-name">إملاء يدوي</div>
                                </div>
                                <div class="question-type-card" onclick="addQuestion('completeLetter')">
                                    <div class="type-icon">🔤</div>
                                    <div class="type-name">اكمل الحرف الناقص</div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="questionsContainer" class="questions-section">
                            <h4>أسئلة الاختبار</h4>
                            <div id="questionsList"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeAssessmentCreationModal()">إلغاء</button>
                    <button class="btn btn-primary" onclick="saveNewAssessment()">حفظ الاختبار</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    addQuestionTypesStyles();
}

function addQuestionTypesStyles() {
    if (!document.getElementById('questionTypesStyles')) {
        const styles = `
            <style id="questionTypesStyles">
                .question-types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .question-type-card {
                    background: var(--light-color);
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }
                
                .question-type-card:hover {
                    background: white;
                    border-color: var(--primary-color);
                    transform: translateY(-2px);
                }
                
                .type-icon {
                    font-size: 2rem;
                    margin-bottom: 5px;
                }
                
                .type-name {
                    font-size: 0.9rem;
                    color: var(--text-color);
                }
                
                .questions-section {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid var(--border-color);
                }
                
                .question-item {
                    background: var(--light-color);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border-left: 4px solid var(--primary-color);
                }
                
                .question-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

let currentQuestions = [];
let nextQuestionId = 1;

function addQuestion(questionType) {
    const question = {
        id: nextQuestionId++,
        type: questionType,
        questionText: '',
        passingThreshold: 70, // قيمة افتراضية
        options: questionType === 'multipleChoice' ? [] : undefined,
        attachment: questionType === 'multipleChoiceWithAttachment' ? null : undefined,
        modelAnswer: questionType === 'openEnded' ? '' : undefined,
        words: (questionType === 'autoReading' || questionType === 'manualReading') ? [] : undefined,
        // إضافة خصائص أخرى حسب نوع السؤال
    };
    
    currentQuestions.push(question);
    renderQuestion(question);
}

function renderQuestion(question) {
    const questionsList = document.getElementById('questionsList');
    let questionHTML = '';
    
    switch(question.type) {
        case 'multipleChoice':
            questionHTML = `
                <div class="question-item" data-id="${question.id}">
                    <div class="question-header">
                        <h5>سؤال اختيار من متعدد</h5>
                        <button class="btn btn-sm btn-danger" onclick="removeQuestion(${question.id})">حذف</button>
                    </div>
                    <div class="form-group">
                        <label>نص السؤال *</label>
                        <input type="text" class="form-control question-text" 
                               value="${question.questionText}"
                               onchange="updateQuestionText(${question.id}, this.value)">
                    </div>
                    <div class="form-group">
                        <label>خيارات الإجابة</label>
                        <div id="optionsContainer_${question.id}">
                            ${renderOptions(question.options || [])}
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="addOption(${question.id})">
                            إضافة خيار
                        </button>
                    </div>
                    <div class="form-group">
                        <label>نسبة النجاح المطلوبة *</label>
                        <input type="number" class="form-control passing-threshold" 
                               value="${question.passingThreshold}" min="0" max="100"
                               onchange="updatePassingThreshold(${question.id}, this.value)">
                        <small>النسبة المئوية المطلوبة لنجاح السؤال</small>
                    </div>
                </div>
            `;
            break;
            
        case 'openEnded':
            questionHTML = `
                <div class="question-item" data-id="${question.id}">
                    <div class="question-header">
                        <h5>سؤال مفتوح</h5>
                        <button class="btn btn-sm btn-danger" onclick="removeQuestion(${question.id})">حذف</button>
                    </div>
                    <div class="form-group">
                        <label>نص السؤال *</label>
                        <input type="text" class="form-control question-text" 
                               value="${question.questionText}"
                               onchange="updateQuestionText(${question.id}, this.value)">
                    </div>
                    <div class="form-group">
                        <label>نموذج الإجابة (اختياري)</label>
                        <textarea class="form-control model-answer" rows="3"
                                  onchange="updateModelAnswer(${question.id}, this.value)">
                            ${question.modelAnswer || ''}
                        </textarea>
                    </div>
                    <div class="form-group">
                        <label>نسبة النجاح المطلوبة *</label>
                        <input type="number" class="form-control passing-threshold" 
                               value="${question.passingThreshold}" min="0" max="100"
                               onchange="updatePassingThreshold(${question.id}, this.value)">
                    </div>
                </div>
            `;
            break;
            
        // إضافة أنواع الأسئلة الأخرى...
    }
    
    questionsList.insertAdjacentHTML('beforeend', questionHTML);
}

function renderOptions(options) {
    return options.map((option, index) => `
        <div class="choice-item">
            <input type="radio" name="correctOption" ${option.isCorrect ? 'checked' : ''}
                   onchange="setCorrectOption(${index})">
            <input type="text" class="form-control option-text" value="${option.text}"
                   onchange="updateOptionText(${index}, this.value)">
            <button class="btn btn-sm btn-danger" onclick="removeOption(${index})">حذف</button>
        </div>
    `).join('');
}

function addOption(questionId) {
    const question = currentQuestions.find(q => q.id === questionId);
    if (question && question.type === 'multipleChoice') {
        if (!question.options) question.options = [];
        question.options.push({
            text: '',
            isCorrect: false
        });
        
        // إعادة عرض الخيارات
        const optionsContainer = document.getElementById(`optionsContainer_${questionId}`);
        if (optionsContainer) {
            optionsContainer.innerHTML = renderOptions(question.options);
        }
    }
}

function updateQuestionText(questionId, text) {
    const question = currentQuestions.find(q => q.id === questionId);
    if (question) {
        question.questionText = text;
    }
}

function updatePassingThreshold(questionId, threshold) {
    const question = currentQuestions.find(q => q.id === questionId);
    if (question) {
        question.passingThreshold = parseInt(threshold);
    }
}

function removeQuestion(questionId) {
    currentQuestions = currentQuestions.filter(q => q.id !== questionId);
    const questionElement = document.querySelector(`.question-item[data-id="${questionId}"]`);
    if (questionElement) {
        questionElement.remove();
    }
}

function resetAssessmentForm() {
    document.getElementById('newAssessmentForm').reset();
    currentQuestions = [];
    nextQuestionId = 1;
    document.getElementById('questionsList').innerHTML = '';
}

function closeAssessmentCreationModal() {
    document.getElementById('assessmentCreationModal').classList.remove('show');
}

function saveNewAssessment() {
    const title = document.getElementById('assessmentTitle').value.trim();
    const subject = document.getElementById('assessmentSubject').value;
    const description = document.getElementById('assessmentDescription').value.trim();
    
    if (!title || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    if (currentQuestions.length === 0) {
        showAuthNotification('يرجى إضافة سؤال واحد على الأقل', 'error');
        return;
    }
    
    // التحقق من أن جميع الأسئلة لها نسبة نجاح محددة
    const invalidQuestions = currentQuestions.filter(q => 
        !q.passingThreshold || q.passingThreshold < 0 || q.passingThreshold > 100
    );
    
    if (invalidQuestions.length > 0) {
        showAuthNotification('جميع الأسئلة يجب أن تحتوي على نسبة نجاح صحيحة (0-100%)', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const assessments = JSON.parse(localStorage.getItem(`diagnosticAssessments_${currentUser.id}`) || '[]');
    
    const newAssessment = {
        id: generateId(),
        title: title,
        subject: subject,
        description: description,
        questions: currentQuestions,
        objectivesLinked: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id
    };
    
    assessments.push(newAssessment);
    localStorage.setItem(`diagnosticAssessments_${currentUser.id}`, JSON.stringify(assessments));
    
    showAuthNotification('تم حفظ الاختبار التشخيصي بنجاح', 'success');
    closeAssessmentCreationModal();
    loadDiagnosticAssessments();
    updateContentStats();
}

// ============================================
// ربط الأهداف القصيرة المدى
// ============================================

function linkObjectivesToAssessment(assessmentId) {
    const currentUser = getCurrentUser();
    const assessments = JSON.parse(localStorage.getItem(`diagnosticAssessments_${currentUser.id}`) || '[]');
    const assessment = assessments.find(a => a.id === assessmentId);
    
    if (!assessment) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // التحقق من وجود أهداف قصيرة المدى للمادة
    const objectives = JSON.parse(localStorage.getItem(`shortTermObjectives_${currentUser.id}`) || '[]');
    const subjectObjectives = objectives.filter(obj => obj.subject === assessment.subject);
    
    if (subjectObjectives.length === 0) {
        showAuthNotification(`لا توجد أهداف قصيرة المدى للمادة ${assessment.subject}. يرجى إضافة أهداف أولاً.`, 'warning');
        return;
    }
    
    // عرض واجهة الربط
    showObjectivesLinkingModal(assessment, subjectObjectives);
}

function showObjectivesLinkingModal(assessment, objectives) {
    const modalHTML = `
        <div class="modal" id="objectivesLinkingModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>ربط الأهداف القصيرة المدى لاختبار: ${assessment.title}</h3>
                    <button class="modal-close" onclick="closeObjectivesLinkingModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="linkingProgress">
                        <div class="progress-info">
                            <span>سؤال 1 من ${assessment.questions.length}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(1/assessment.questions.length)*100}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="currentQuestionContainer"></div>
                    
                    <div id="objectivesListContainer" class="objectives-section">
                        <h4>الأهداف القصيرة المدى المتاحة (${assessment.subject})</h4>
                        <div id="objectivesList"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeObjectivesLinkingModal()">إلغاء</button>
                    <button class="btn btn-primary" id="nextQuestionBtn" onclick="nextQuestion()">التالي</button>
                    <button class="btn btn-success" id="finishLinkingBtn" onclick="finishLinking()" style="display: none;">
                        إنهاء الربط
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // تهيئة عملية الربط
    window.currentLinkingData = {
        assessment: assessment,
        objectives: objectives,
        currentQuestionIndex: 0,
        questionObjectives: new Array(assessment.questions.length).fill(null)
    };
    
    showQuestionForLinking(0);
    document.getElementById('objectivesLinkingModal').classList.add('show');
}

function showQuestionForLinking(questionIndex) {
    const linkingData = window.currentLinkingData;
    const question = linkingData.assessment.questions[questionIndex];
    
    // عرض السؤال الحالي
    const questionContainer = document.getElementById('currentQuestionContainer');
    questionContainer.innerHTML = `
        <div class="current-question">
            <h4>السؤال ${questionIndex + 1}</h4>
            <div class="question-content">
                <p><strong>نص السؤال:</strong> ${question.questionText || 'لا يوجد نص'}</p>
                <p><strong>نوع السؤال:</strong> ${getQuestionTypeName(question.type)}</p>
            </div>
            <div class="selected-objective">
                ${linkingData.questionObjectives[questionIndex] ? 
                    `<div class="alert alert-success">
                        ✓ مرتبط بالهدف: ${getObjectiveTitle(linkingData.questionObjectives[questionIndex])}
                    </div>` : 
                    '<div class="alert alert-warning">⚠️ لم يتم ربط هذا السؤال بعد</div>'
                }
            </div>
        </div>
    `;
    
    // عرض قائمة الأهداف
    const objectivesList = document.getElementById('objectivesList');
    objectivesList.innerHTML = linkingData.objectives.map(obj => {
        const isSelected = linkingData.questionObjectives[questionIndex] === obj.id;
        return `
            <div class="objective-option">
                <label class="checkbox-label">
                    <input type="radio" 
                           name="selectedObjective" 
                           value="${obj.id}" 
                           ${isSelected ? 'checked' : ''}
                           onchange="selectObjectiveForQuestion(${questionIndex}, ${obj.id})">
                    <span>${obj.title}</span>
                </label>
            </div>
        `;
    }).join('');
    
    // تحديث زر الإنهاء إذا انتهت جميع الأسئلة
    const nextBtn = document.getElementById('nextQuestionBtn');
    const finishBtn = document.getElementById('finishLinkingBtn');
    
    if (questionIndex === linkingData.assessment.questions.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        finishBtn.style.display = 'none';
    }
    
    // تحديث شريط التقدم
    const progressFill = document.querySelector('.progress-fill');
    const progressPercent = ((questionIndex + 1) / linkingData.assessment.questions.length) * 100;
    progressFill.style.width = `${progressPercent}%`;
    
    document.querySelector('.progress-info span').textContent = 
        `سؤال ${questionIndex + 1} من ${linkingData.assessment.questions.length}`;
}

function getQuestionTypeName(type) {
    const types = {
        'multipleChoice': 'اختيار من متعدد',
        'openEnded': 'سؤال مفتوح',
        'dragDrop': 'سحب وإفلات',
        'multipleChoiceWithAttachment': 'اختيار مع مرفق',
        'autoReading': 'قراءة تلقائية',
        'autoSpelling': 'إملاء تلقائي',
        'manualReading': 'قراءة يدوية',
        'manualSpelling': 'إملاء يدوي',
        'completeLetter': 'اكمل الحرف الناقص'
    };
    return types[type] || type;
}

function getObjectiveTitle(objectiveId) {
    const linkingData = window.currentLinkingData;
    const objective = linkingData.objectives.find(obj => obj.id === objectiveId);
    return objective ? objective.title : 'هدف غير معروف';
}

function selectObjectiveForQuestion(questionIndex, objectiveId) {
    window.currentLinkingData.questionObjectives[questionIndex] = objectiveId;
    
    // تحديث العرض
    const selectedDiv = document.querySelector('.selected-objective');
    selectedDiv.innerHTML = `
        <div class="alert alert-success">
            ✓ مرتبط بالهدف: ${getObjectiveTitle(objectiveId)}
        </div>
    `;
}

function nextQuestion() {
    const linkingData = window.currentLinkingData;
    const currentIndex = linkingData.currentQuestionIndex;
    
    // التحقق من أن السؤال الحالي مرتبط
    if (!linkingData.questionObjectives[currentIndex]) {
        showAuthNotification('يرجى اختيار هدف لهذا السؤال قبل المتابعة', 'warning');
        return;
    }
    
    // الانتقال للسؤال التالي
    if (currentIndex < linkingData.assessment.questions.length - 1) {
        linkingData.currentQuestionIndex = currentIndex + 1;
        showQuestionForLinking(linkingData.currentQuestionIndex);
    }
}

function finishLinking() {
    const linkingData = window.currentLinkingData;
    
    // التحقق من أن جميع الأسئلة مرتبطة
    const unlinkedQuestions = linkingData.questionObjectives.filter(obj => !obj);
    if (unlinkedQuestions.length > 0) {
        showAuthNotification('يرجى ربط جميع الأسئلة قبل الإنهاء', 'warning');
        return;
    }
    
    // حفظ البيانات المرتبطة
    const currentUser = getCurrentUser();
    const assessments = JSON.parse(localStorage.getItem(`diagnosticAssessments_${currentUser.id}`) || '[]');
    const assessmentIndex = assessments.findIndex(a => a.id === linkingData.assessment.id);
    
    if (assessmentIndex !== -1) {
        assessments[assessmentIndex].objectivesLinked = true;
        assessments[assessmentIndex].linkedObjectives = linkingData.questionObjectives;
        assessments[assessmentIndex].linkedAt = new Date().toISOString();
        
        localStorage.setItem(`diagnosticAssessments_${currentUser.id}`, JSON.stringify(assessments));
    }
    
    showAuthNotification('تم ربط الأهداف بنجاح', 'success');
    closeObjectivesLinkingModal();
    loadDiagnosticAssessments();
}

function closeObjectivesLinkingModal() {
    const modal = document.getElementById('objectivesLinkingModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
    window.currentLinkingData = null;
}

// ============================================
// التصدير والاستيراد
// ============================================

function exportAssessment(assessmentId) {
    const currentUser = getCurrentUser();
    const assessments = JSON.parse(localStorage.getItem(`diagnosticAssessments_${currentUser.id}`) || '[]');
    const assessment = assessments.find(a => a.id === assessmentId);
    
    if (!assessment) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // إنشاء نسخة للتصدير بدون الأهداف المرتبطة
    const exportData = {
        ...assessment,
        objectivesLinked: false,
        linkedObjectives: null,
        linkedAt: null,
        createdBy: null, // إزالة بيانات المنشئ
        exportVersion: '1.0',
        exportedAt: new Date().toISOString()
    };
    
    // تحويل البيانات لـ JSON
    const jsonStr = JSON.stringify(exportData, null, 2);
    
    // إنشاء ملف للتنزيل
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `اختبار_${assessment.title}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAuthNotification('تم تصدير الاختبار بنجاح', 'success');
}

function importAssessment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // التحقق من صحة البيانات
                if (!importedData.title || !importedData.subject || !importedData.questions) {
                    showAuthNotification('ملف التصدير غير صالح', 'error');
                    return;
                }
                
                const currentUser = getCurrentUser();
                const assessments = JSON.parse(localStorage.getItem(`diagnosticAssessments_${currentUser.id}`) || '[]');
                
                // إضافة البيانات المستوردة
                const newAssessment = {
                    ...importedData,
                    id: generateId(),
                    objectivesLinked: false,
                    linkedObjectives: null,
                    linkedAt: null,
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser.id,
                    importedAt: new Date().toISOString()
                };
                
                assessments.push(newAssessment);
                localStorage.setItem(`diagnosticAssessments_${currentUser.id}`, JSON.stringify(assessments));
                
                showAuthNotification('تم استيراد الاختبار بنجاح', 'success');
                loadDiagnosticAssessments();
                updateContentStats();
                
            } catch (error) {
                console.error('خطأ في استيراد الملف:', error);
                showAuthNotification('خطأ في قراءة ملف التصدير', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// دوال مساعدة
// ============================================

function updateContentStats() {
    const currentUser = getCurrentUser();
    
    const assessments = JSON.parse(localStorage.getItem(`diagnosticAssessments_${currentUser.id}`) || '[]');
    const lessons = JSON.parse(localStorage.getItem(`lessons_${currentUser.id}`) || '[]');
    const objectives = JSON.parse(localStorage.getItem(`shortTermObjectives_${currentUser.id}`) || '[]');
    const assignments = JSON.parse(localStorage.getItem(`assignments_${currentUser.id}`) || '[]');
    
    document.getElementById('totalAssessments').textContent = assessments.length;
    document.getElementById('totalLessons').textContent = lessons.length;
    document.getElementById('totalObjectives').textContent = objectives.length;
    document.getElementById('totalAssignments').textContent = assignments.length;
}

function setupEventListeners() {
    // زر إضافة اختبار تشخيصي جديد
    const addAssessmentBtn = document.getElementById('addAssessmentBtn');
    if (addAssessmentBtn) {
        addAssessmentBtn.addEventListener('click', addNewDiagnosticAssessment);
    }
    
    // زر استيراد الاختبارات
    const importAssessmentBtn = document.getElementById('importAssessmentBtn');
    if (importAssessmentBtn) {
        importAssessmentBtn.addEventListener('click', importAssessment);
    }
}

// تصدير الدوال للاستخدام العالمي
window.addNewDiagnosticAssessment = addNewDiagnosticAssessment;
window.importAssessment = importAssessment;
window.linkObjectivesToAssessment = linkObjectivesToAssessment;
window.exportAssessment = exportAssessment;
window.viewAssessment = viewAssessment;
window.editAssessment = editAssessment;
window.deleteAssessment = deleteAssessment;

// نظام الاختبارات التشخيصية
let currentTest = null;
let currentQuestionIndex = 0;
let questions = [];
let selectedObjectives = {};

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('diagnostic-tests.html')) {
        initializeDiagnosticTests();
    }
});

function initializeDiagnosticTests() {
    loadDiagnosticTests();
}

function loadDiagnosticTests() {
    const tests = getDiagnosticTests();
    const arabicTests = tests.filter(test => test.subject === 'لغتي');
    const mathTests = tests.filter(test => test.subject === 'رياضيات');
    
    displayTestsBySubject('arabicTestsList', arabicTests, '📚', 'لغتي');
    displayTestsBySubject('mathTestsList', mathTests, '🔢', 'رياضيات');
}

function displayTestsBySubject(containerId, tests, icon, subjectName) {
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    if (tests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3>لا توجد اختبارات لمادة ${subjectName}</h3>
                <p>قم بإنشاء أول اختبار تشخيصي</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tests.map(test => {
        const objectivesStatus = test.objectivesLinked ? 
            '<span class="objectives-status status-linked">تم الربط</span>' :
            '<span class="objectives-status status-not-linked">لم يتم الربط</span>';
        
        return `
            <div class="test-card">
                <div class="test-header">
                    <div class="test-title">${test.title}</div>
                    <div class="test-meta">
                        <span class="test-subject-badge subject-${test.subject === 'لغتي' ? 'arabic' : 'math'}">
                            ${test.subject}
                        </span>
                        ${objectivesStatus}
                        <span>${formatDateShort(test.createdAt)}</span>
                    </div>
                </div>
                ${test.description ? `<p>${test.description}</p>` : ''}
                <div class="test-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">
                        عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})">
                        تعديل
                    </button>
                    <button class="btn btn-sm btn-info" onclick="linkObjectives(${test.id})">
                        ربط الأهداف
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="exportTest(${test.id})">
                        تصدير
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showCreateTestModal() {
    document.getElementById('createTestModal').classList.add('show');
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
    document.getElementById('createTestForm').reset();
}

function showImportTestModal() {
    document.getElementById('importTestModal').classList.add('show');
}

function closeImportTestModal() {
    document.getElementById('importTestModal').classList.remove('show');
}

function createNewTest() {
    const title = document.getElementById('testTitle').value.trim();
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value.trim();
    
    if (!title || !subject) {
        showAuthNotification('يرجى إدخال عنوان الاختبار وتحديد المادة', 'error');
        return;
    }
    
    const test = {
        id: generateId(),
        title: title,
        subject: subject,
        description: description,
        questions: [],
        passCriteria: 70,
        objectivesLinked: false,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser().id
    };
    
    saveDiagnosticTest(test);
    
    showAuthNotification('تم إنشاء الاختبار بنجاح', 'success');
    closeCreateTestModal();
    editTest(test.id); // الانتقال مباشرة لصفحة إضافة الأسئلة
}

function editTest(testId) {
    const test = getDiagnosticTestById(testId);
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    currentTest = test;
    questions = test.questions || [];
    loadTestEditor();
    
    // توجيه إلى صفحة محرر الأسئلة
    window.location.href = 'test-editor.html?id=' + testId;
}

function viewTest(testId) {
    const test = getDiagnosticTestById(testId);
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    document.getElementById('viewTestTitle').textContent = test.title;
    document.getElementById('viewTestSubject').textContent = test.subject;
    document.getElementById('viewTestDescription').textContent = test.description || 'لا يوجد وصف';
    document.getElementById('viewTestQuestionsCount').textContent = test.questions.length;
    document.getElementById('viewTestPassCriteria').textContent = test.passCriteria + '%';
    document.getElementById('viewTestCreatedAt').textContent = formatDate(test.createdAt);
    
    // عرض الأسئلة
    const questionsList = document.getElementById('viewTestQuestions');
    questionsList.innerHTML = test.questions.map((q, index) => `
        <div class="question-preview">
            <div class="question-header">
                <h5>السؤال ${index + 1}: ${getQuestionTypeText(q.type)}</h5>
            </div>
            <div class="question-content">
                <p>${q.text}</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('viewTestModal').classList.add('show');
}

function closeViewTestModal() {
    document.getElementById('viewTestModal').classList.remove('show');
}

function loadTestEditor() {
    if (!currentTest) return;
    
    document.getElementById('editorTestTitle').textContent = currentTest.title;
    updateQuestionsList();
}

function updateQuestionsList() {
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-preview';
        questionElement.innerHTML = `
            <div class="question-header">
                <h5>السؤال ${index + 1}: ${getQuestionTypeText(question.type)}</h5>
                <div class="question-actions">
                    <button class="btn btn-sm btn-primary" onclick="editQuestion(${index})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${index})">حذف</button>
                    <button class="btn btn-sm btn-secondary" onclick="moveQuestion(${index}, -1)">↑</button>
                    <button class="btn btn-sm btn-secondary" onclick="moveQuestion(${index}, 1)">↓</button>
                </div>
            </div>
            <div class="question-content">
                <p>${question.text.substring(0, 100)}...</p>
            </div>
        `;
        questionsList.appendChild(questionElement);
    });
}

function showAddQuestionModal() {
    document.getElementById('addQuestionModal').classList.add('show');
}

function closeAddQuestionModal() {
    document.getElementById('addQuestionModal').classList.remove('show');
    document.getElementById('questionForm').reset();
}

function selectQuestionType(type) {
    currentQuestionType = type;
    showQuestionForm(type);
}

function showQuestionForm(type) {
    const questionForm = document.getElementById('questionForm');
    questionForm.innerHTML = '';
    
    let formHtml = `
        <div class="form-group">
            <label for="questionText">نص السؤال:</label>
            <textarea id="questionText" class="form-control" rows="3" required></textarea>
        </div>
    `;
    
    switch(type) {
        case 'multiple-choice':
            formHtml += getMultipleChoiceForm();
            break;
        case 'drag-drop':
            formHtml += getDragDropForm();
            break;
        case 'multiple-choice-attachment':
            formHtml += getMultipleChoiceAttachmentForm();
            break;
        case 'open-ended':
            formHtml += getOpenEndedForm();
            break;
        case 'auto-reading':
            formHtml += getAutoReadingForm();
            break;
        case 'auto-spelling':
            formHtml += getAutoSpellingForm();
            break;
        case 'manual-reading':
            formHtml += getManualReadingForm();
            break;
        case 'manual-spelling':
            formHtml += getManualSpellingForm();
            break;
        case 'missing-letter':
            formHtml += getMissingLetterForm();
            break;
    }
    
    formHtml += `
        <div class="form-group">
            <label for="passCriteria">محك الاجتياز (%):</label>
            <input type="number" id="passCriteria" class="form-control" min="0" max="100" value="70" required>
        </div>
    `;
    
    questionForm.innerHTML = formHtml;
    
    if (type === 'auto-spelling' || type === 'manual-spelling' || type === 'missing-letter') {
        initializeHandwritingCanvas();
    }
}

function getMultipleChoiceForm() {
    return `
        <div class="form-group">
            <label>الخيارات:</label>
            <div id="choicesContainer">
                <div class="choice-item">
                    <input type="radio" name="correctChoice" value="0" required>
                    <input type="text" class="form-control choice-input" placeholder="النص الأول" required>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeChoice(this)">حذف</button>
                </div>
                <div class="choice-item">
                    <input type="radio" name="correctChoice" value="1" required>
                    <input type="text" class="form-control choice-input" placeholder="النص الثاني" required>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeChoice(this)">حذف</button>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-success" onclick="addChoice()">+ إضافة خيار</button>
        </div>
    `;
}

function addChoice() {
    const container = document.getElementById('choicesContainer');
    const choiceCount = container.children.length;
    
    const choiceElement = document.createElement('div');
    choiceElement.className = 'choice-item';
    choiceElement.innerHTML = `
        <input type="radio" name="correctChoice" value="${choiceCount}">
        <input type="text" class="form-control choice-input" placeholder="النص ${choiceCount + 1}" required>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeChoice(this)">حذف</button>
    `;
    
    container.appendChild(choiceElement);
}

function addQuestion() {
    const text = document.getElementById('questionText').value.trim();
    const passCriteria = parseInt(document.getElementById('passCriteria').value);
    
    if (!text) {
        showAuthNotification('يرجى إدخال نص السؤال', 'error');
        return;
    }
    
    const question = {
        id: generateId(),
        type: currentQuestionType,
        text: text,
        passCriteria: passCriteria,
        createdAt: new Date().toISOString()
    };
    
    switch(currentQuestionType) {
        case 'multiple-choice':
            question.choices = getMultipleChoiceData();
            question.correctChoice = getCorrectChoice();
            break;
        case 'drag-drop':
            question.items = getDragDropData();
            break;
        case 'multiple-choice-attachment':
            question.choices = getMultipleChoiceData();
            question.correctChoice = getCorrectChoice();
            question.attachment = getAttachmentData();
            break;
        case 'open-ended':
            question.modelAnswer = document.getElementById('modelAnswer')?.value.trim() || '';
            break;
        case 'auto-reading':
            question.texts = getReadingTexts();
            break;
        case 'auto-spelling':
            question.words = getSpellingWords();
            question.canvasData = getCanvasData();
            break;
        case 'manual-reading':
            question.texts = getReadingTexts();
            break;
        case 'manual-spelling':
            question.words = getSpellingWords();
            question.canvasData = getCanvasData();
            break;
        case 'missing-letter':
            question.words = getMissingLetterWords();
            question.canvasData = getCanvasData();
            break;
    }
    
    questions.push(question);
    saveTestQuestions();
    updateQuestionsList();
    closeAddQuestionModal();
    showAuthNotification('تم إضافة السؤال بنجاح', 'success');
}

function getMultipleChoiceData() {
    const choiceInputs = document.querySelectorAll('.choice-input');
    return Array.from(choiceInputs).map(input => input.value.trim());
}

function getCorrectChoice() {
    const radios = document.querySelectorAll('input[name="correctChoice"]:checked');
    return radios.length > 0 ? parseInt(radios[0].value) : 0;
}

function linkObjectives(testId) {
    const test = getDiagnosticTestById(testId);
    if (!test || test.questions.length === 0) {
        showAuthNotification('يجب أن يحتوي الاختبار على أسئلة أولاً', 'error');
        return;
    }
    
    currentTest = test;
    currentQuestionIndex = 0;
    selectedObjectives = {};
    
    loadQuestionForLinking();
    document.getElementById('linkObjectivesModal').classList.add('show');
}

function loadQuestionForLinking() {
    if (!currentTest || currentQuestionIndex >= currentTest.questions.length) {
        completeLinking();
        return;
    }
    
    const question = currentTest.questions[currentQuestionIndex];
    document.getElementById('linkingQuestionText').textContent = question.text;
    
    loadObjectivesForLinking();
    updateLinkingProgress();
}

function loadObjectivesForLinking() {
    const container = document.getElementById('objectivesList');
    const objectives = getShortTermObjectives(currentTest.subject);
    
    container.innerHTML = objectives.map((objective, index) => `
        <div class="objective-item">
            <input type="radio" 
                   id="objective_${index}" 
                   name="selectedObjective" 
                   value="${objective.id}"
                   onchange="selectObjective(${objective.id})">
            <label for="objective_${index}">${objective.text}</label>
        </div>
    `).join('');
}

function selectObjective(objectiveId) {
    selectedObjectives[currentQuestionIndex] = objectiveId;
}

function nextQuestionForLinking() {
    if (!selectedObjectives[currentQuestionIndex]) {
        showAuthNotification('يرجى اختيار هدف قصير لهذا السؤال', 'error');
        return;
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentTest.questions.length) {
        loadQuestionForLinking();
    } else {
        completeLinking();
    }
}

function completeLinking() {
    currentTest.objectivesLinked = true;
    currentTest.linkedObjectives = selectedObjectives;
    saveDiagnosticTest(currentTest);
    
    showAuthNotification('تم ربط جميع الأسئلة بالأهداف بنجاح', 'success');
    closeLinkObjectivesModal();
    loadDiagnosticTests();
}

function closeLinkObjectivesModal() {
    document.getElementById('linkObjectivesModal').classList.remove('show');
    currentTest = null;
    currentQuestionIndex = 0;
    selectedObjectives = {};
}

function updateLinkingProgress() {
    const progress = document.getElementById('linkingProgress');
    progress.textContent = `السؤال ${currentQuestionIndex + 1} من ${currentTest.questions.length}`;
}

function exportTest(testId) {
    const test = getDiagnosticTestById(testId);
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // استبعاد الأهداف المربوطة عند التصدير
    const exportData = {
        ...test,
        objectivesLinked: false,
        linkedObjectives: {},
        exportedAt: new Date().toISOString(),
        exportedBy: getCurrentUser().id
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-${test.id}-${test.title}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAuthNotification('تم تصدير الاختبار بنجاح', 'success');
}

function importTest() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAuthNotification('يرجى اختيار ملف للاستيراد', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTest = JSON.parse(e.target.result);
            
            // تعديل البيانات لتلائم النظام الجديد
            importedTest.id = generateId();
            importedTest.createdAt = new Date().toISOString();
            importedTest.createdBy = getCurrentUser().id;
            importedTest.objectivesLinked = false;
            importedTest.linkedObjectives = {};
            
            saveDiagnosticTest(importedTest);
            
            showAuthNotification('تم استيراد الاختبار بنجاح', 'success');
            closeImportTestModal();
            loadDiagnosticTests();
            
            // إظهار رسالة تنبيهية
            setTimeout(() => {
                showAuthNotification('يرجى ربط أسئلة الاختبار بالأهداف القصيرة', 'warning');
            }, 1000);
            
        } catch (error) {
            showAuthNotification('خطأ في تنسيق الملف', 'error');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
}

function getQuestionTypeText(type) {
    const types = {
        'multiple-choice': 'اختيار من متعدد',
        'drag-drop': 'سحب وإفلات',
        'multiple-choice-attachment': 'اختيار من متعدد مع مرفق',
        'open-ended': 'سؤال مفتوح',
        'auto-reading': 'تقييم القراءة الآلي',
        'auto-spelling': 'تقييم الإملاء الآلي',
        'manual-reading': 'تقييم القراءة اليدوي',
        'manual-spelling': 'تقييم الإملاء اليدوي',
        'missing-letter': 'أكمل الحرف الناقص'
    };
    
    return types[type] || type;
}

// وظائف التخزين المحلي
function getDiagnosticTests() {
    return JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
}

function getDiagnosticTestById(id) {
    const tests = getDiagnosticTests();
    return tests.find(test => test.id === id);
}

function saveDiagnosticTest(test) {
    const tests = getDiagnosticTests();
    const index = tests.findIndex(t => t.id === test.id);
    
    if (index >= 0) {
        tests[index] = test;
    } else {
        tests.push(test);
    }
    
    localStorage.setItem('diagnosticTests', JSON.stringify(tests));
}

function deleteTest(testId) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
        return;
    }
    
    const tests = getDiagnosticTests();
    const updatedTests = tests.filter(test => test.id !== testId);
    
    localStorage.setItem('diagnosticTests', JSON.stringify(updatedTests));
    
    showAuthNotification('تم حذف الاختبار بنجاح', 'success');
    loadDiagnosticTests();
}

function getShortTermObjectives(subject) {
    return JSON.parse(localStorage.getItem('shortTermObjectives') || '[]')
        .filter(obj => obj.subject === subject);
}

// تصدير الدوال للاستخدام العالمي
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.showImportTestModal = showImportTestModal;
window.closeImportTestModal = closeImportTestModal;
window.createNewTest = createNewTest;
window.viewTest = viewTest;
window.closeViewTestModal = closeViewTestModal;
window.linkObjectives = linkObjectives;
window.nextQuestionForLinking = nextQuestionForLinking;
window.importTest = importTest;
window.exportTest = exportTest;
// دالة إضافية لمعالجة البيانات
function getAttachmentData() {
    const fileInput = document.getElementById('questionAttachment');
    if (!fileInput.files.length) return null;
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    return new Promise((resolve) => {
        reader.onload = function(e) {
            resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            });
        };
        reader.readAsDataURL(file);
    });
}

// دالة لإزالة خيار
function removeChoice(button) {
    const choiceItem = button.closest('.choice-item');
    if (choiceItem && document.querySelectorAll('.choice-item').length > 2) {
        choiceItem.remove();
        updateChoiceIndices();
    }
}

function updateChoiceIndices() {
    const choiceItems = document.querySelectorAll('.choice-item');
    choiceItems.forEach((item, index) => {
        const radio = item.querySelector('input[type="radio"]');
        if (radio) {
            radio.value = index;
        }
    });
}

// دوال لرؤية الاختبار
function viewTest(testId) {
    const test = getDiagnosticTestById(testId);
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    document.getElementById('viewTestTitle').textContent = test.title;
    document.getElementById('viewTestSubject').textContent = test.subject;
    document.getElementById('viewTestDescription').textContent = test.description || 'لا يوجد وصف';
    document.getElementById('viewTestQuestionsCount').textContent = test.questions?.length || 0;
    document.getElementById('viewTestPassCriteria').textContent = test.passCriteria + '%';
    document.getElementById('viewTestCreatedAt').textContent = formatDate(test.createdAt);
    
    // عرض الأسئلة
    const questionsList = document.getElementById('viewTestQuestions');
    if (test.questions && test.questions.length > 0) {
        questionsList.innerHTML = test.questions.map((q, index) => `
            <div class="question-preview">
                <div class="question-header">
                    <h5>السؤال ${index + 1}: ${getQuestionTypeText(q.type)}</h5>
                </div>
                <div class="question-content">
                    <p>${q.text}</p>
                    ${q.choices ? `
                        <div class="choices-container">
                            ${q.choices.map((choice, i) => `
                                <div class="choice-item ${i === q.correctChoice ? 'correct' : ''}">
                                    ${i === q.correctChoice ? '✓ ' : ''}${choice}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } else {
        questionsList.innerHTML = '<p>لا توجد أسئلة في هذا الاختبار</p>';
    }
    
    document.getElementById('viewTestModal').classList.add('show');
}

function closeViewTestModal() {
    document.getElementById('viewTestModal').classList.remove('show');
}

// دوال مساعدة إضافية
function getQuestionTypeText(type) {
    const types = {
        'multiple-choice': 'اختيار من متعدد',
        'drag-drop': 'سحب وإفلات',
        'multiple-choice-attachment': 'اختيار من متعدد مع مرفق',
        'open-ended': 'سؤال مفتوح',
        'auto-reading': 'تقييم القراءة الآلي',
        'auto-spelling': 'تقييم الإملاء الآلي',
        'manual-reading': 'تقييم القراءة اليدوي',
        'manual-spelling': 'تقييم الإملاء اليدوي',
        'missing-letter': 'أكمل الحرف الناقص'
    };
    
    return types[type] || type;
}

// دالة لربط الأهداف
function linkObjectives(testId) {
    const test = getDiagnosticTestById(testId);
    if (!test || !test.questions || test.questions.length === 0) {
        showAuthNotification('يجب أن يحتوي الاختبار على أسئلة أولاً', 'error');
        return;
    }
    
    currentTest = test;
    currentQuestionIndex = 0;
    selectedObjectives = {};
    
    loadQuestionForLinking();
    document.getElementById('linkObjectivesModal').classList.add('show');
}

// دالة للمتابعة في الربط
function nextQuestionForLinking() {
    const selectedRadio = document.querySelector('input[name="selectedObjective"]:checked');
    
    if (!selectedRadio) {
        showAuthNotification('يرجى اختيار هدف قصير لهذا السؤال', 'error');
        return;
    }
    
    selectedObjectives[currentQuestionIndex] = parseInt(selectedRadio.value);
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentTest.questions.length) {
        loadQuestionForLinking();
    } else {
        completeLinking();
    }
}

// دالة لإكمال الربط
function completeLinking() {
    if (currentTest) {
        currentTest.objectivesLinked = true;
        currentTest.linkedObjectives = selectedObjectives;
        saveDiagnosticTest(currentTest);
        
        showAuthNotification('تم ربط جميع الأسئلة بالأهداف بنجاح', 'success');
        closeLinkObjectivesModal();
        loadDiagnosticTests();
    }
}

function closeLinkObjectivesModal() {
    document.getElementById('linkObjectivesModal').classList.remove('show');
    currentTest = null;
    currentQuestionIndex = 0;
    selectedObjectives = {};
}

function loadQuestionForLinking() {
    if (!currentTest || !currentTest.questions || currentQuestionIndex >= currentTest.questions.length) {
        completeLinking();
        return;
    }
    
    const question = currentTest.questions[currentQuestionIndex];
    document.getElementById('linkingQuestionText').textContent = question.text;
    
    loadObjectivesForLinking();
    updateLinkingProgress();
}

function loadObjectivesForLinking() {
    const container = document.getElementById('objectivesList');
    const objectives = getShortTermObjectives(currentTest.subject);
    
    if (objectives.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>لا توجد أهداف قصيرة لهذه المادة</p>
                <button class="btn btn-sm btn-primary" onclick="addDefaultObjectives()">إضافة أهداف افتراضية</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = objectives.map((objective, index) => `
        <div class="objective-item">
            <input type="radio" 
                   id="objective_${index}" 
                   name="selectedObjective" 
                   value="${objective.id}"
                   ${selectedObjectives[currentQuestionIndex] === objective.id ? 'checked' : ''}
                   onchange="selectObjective(${objective.id})">
            <label for="objective_${index}">${objective.text} - ${objective.grade || ''}</label>
        </div>
    `).join('');
}

function updateLinkingProgress() {
    const progress = document.getElementById('linkingProgress');
    if (currentTest && currentTest.questions) {
        progress.textContent = `السؤال ${currentQuestionIndex + 1} من ${currentTest.questions.length}`;
    }
}

function selectObjective(objectiveId) {
    selectedObjectives[currentQuestionIndex] = objectiveId;
}

// دالة لإضافة أهداف افتراضية
function addDefaultObjectives() {
    initializeShortTermObjectives();
    loadObjectivesForLinking();
    showAuthNotification('تمت إضافة الأهداف الافتراضية', 'success');
}

// استيراد الاختبار
async function importTest() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAuthNotification('يرجى اختيار ملف للاستيراد', 'error');
        return;
    }
    
    try {
        const text = await readFileAsText(file);
        const importedTest = JSON.parse(text);
        
        // تعديل البيانات
        importedTest.id = generateId();
        importedTest.createdAt = new Date().toISOString();
        importedTest.createdBy = getCurrentUser().id;
        importedTest.objectivesLinked = false;
        importedTest.linkedObjectives = {};
        
        saveDiagnosticTest(importedTest);
        
        showAuthNotification('تم استيراد الاختبار بنجاح', 'success');
        closeImportTestModal();
        loadDiagnosticTests();
        
        setTimeout(() => {
            showAuthNotification('يرجى ربط أسئلة الاختبار بالأهداف القصيرة', 'warning');
        }, 1000);
        
    } catch (error) {
        showAuthNotification('خطأ في تنسيق الملف', 'error');
        console.error(error);
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

// دالة للعودة لصفحة الاختبارات
function goBackToTests() {
    window.location.href = 'diagnostic-tests.html';
}

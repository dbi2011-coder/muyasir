// ============================================
// نظام إدارة الاختبارات التشخيصية
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('tests.html')) {
        initializeTestsPage();
        loadDiagnosticTests();
    }
    
    if (window.location.pathname.includes('create-test.html')) {
        initializeTestCreation();
    }
});

let currentTestQuestions = [];
let currentQuestionType = 'multiple-choice';
let handwritingCanvases = {};
let currentLinkingStep = 0;
let currentTestId = null;

// ============================================
// إدارة صفحة الاختبارات
// ============================================

function initializeTestsPage() {
    // التحقق من المصادقة
    const user = checkAuth();
    if (!user || user.role !== 'teacher') {
        redirectToLogin();
        return;
    }
    
    updatePageHeader();
}

function loadDiagnosticTests() {
    const testsList = document.getElementById('testsList');
    const currentUser = getCurrentUser();
    
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const userTests = tests.filter(test => test.teacherId === currentUser.id);
    
    if (userTests.length === 0) {
        testsList.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px 20px;">
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>لا توجد اختبارات تشخيصية</h3>
                        <p>قم بإنشاء أول اختبار تشخيصي لطلابك</p>
                        <button class="btn btn-success" onclick="window.location.href='create-test.html'">
                            إنشاء اختبار جديد
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // ترتيب الاختبارات: لغتي أولاً ثم رياضيات
    userTests.sort((a, b) => {
        if (a.subject === 'لغتي' && b.subject !== 'لغتي') return -1;
        if (a.subject !== 'لغتي' && b.subject === 'لغتي') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    testsList.innerHTML = userTests.map((test, index) => {
        const objectivesStatus = test.objectivesLinked ? 'تم الربط' : 'لم يتم الربط';
        const objectivesClass = test.objectivesLinked ? 'status-linked' : 'status-not-linked';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${test.title}</strong>
                    <br>
                    <small class="text-muted">${formatDateShort(test.createdAt)}</small>
                </td>
                <td>
                    <span class="test-subject subject-${test.subject === 'لغتي' ? 'arabic' : 'math'}">
                        ${test.subject}
                    </span>
                </td>
                <td>${test.description || 'لا يوجد وصف'}</td>
                <td>${test.questions?.length || 0} سؤال</td>
                <td>
                    <span class="test-status-badge ${objectivesClass}">
                        ${objectivesStatus}
                    </span>
                </td>
                <td>
                    <div class="test-actions">
                        <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">
                            <i class="fas fa-eye"></i> عرض
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                        <button class="btn btn-sm btn-info" onclick="exportTest(${test.id})">
                            <i class="fas fa-download"></i> تصدير
                        </button>
                        <button class="btn btn-sm btn-success" onclick="linkObjectives(${test.id})">
                            <i class="fas fa-link"></i> ربط أهداف
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewTest(testId) {
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // فتح واجهة عرض الاختبار
    showTestPreviewModal(test);
}

function showTestPreviewModal(test) {
    document.getElementById('previewTestTitle').textContent = test.title;
    document.getElementById('previewTestSubject').textContent = test.subject;
    document.getElementById('previewTestDescription').textContent = test.description || 'لا يوجد وصف';
    document.getElementById('previewTestQuestionsCount').textContent = `${test.questions.length} سؤال`;
    
    const questionsList = document.getElementById('previewQuestionsList');
    questionsList.innerHTML = test.questions.map((q, index) => `
        <div class="question-item">
            <div class="question-header">
                <span class="question-number">${index + 1}</span>
                <span class="question-title">${q.question || 'سؤال بدون عنوان'}</span>
                <span class="question-type-badge">${getQuestionTypeName(q.type)}</span>
            </div>
            <div class="question-content">
                ${renderQuestionPreview(q)}
            </div>
        </div>
    `).join('');
    
    document.getElementById('testPreviewModal').classList.add('show');
}

function closeTestPreviewModal() {
    document.getElementById('testPreviewModal').classList.remove('show');
}

function editTest(testId) {
    window.location.href = `create-test.html?edit=${testId}`;
}

function deleteTest(testId) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const updatedTests = tests.filter(t => t.id !== testId);
    
    localStorage.setItem('diagnosticTests', JSON.stringify(updatedTests));
    
    showAuthNotification('تم حذف الاختبار بنجاح', 'success');
    loadDiagnosticTests();
}

function exportTest(testId) {
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    showAuthNotification('جاري إنشاء نسخة للتصدير...', 'info');
    
    setTimeout(() => {
        // إنشاء نسخة من الاختبار بدون الأهداف المربوطة
        const testCopy = {
            ...test,
            id: generateId(), // معرف جديد
            teacherId: null, // إزالة معرف المعلم
            objectivesLinked: false, // إعادة تعيين حالة الربط
            questions: test.questions.map(q => ({
                ...q,
                objectiveId: null // إزالة معرف الهدف
            }))
        };
        
        // تحويل إلى JSON وتنزيل الملف
        const dataStr = JSON.stringify(testCopy, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `test-${test.title}-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showAuthNotification('تم تصدير الاختبار بنجاح', 'success');
    }, 1000);
}

function importTest() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedTest = JSON.parse(event.target.result);
                const currentUser = getCurrentUser();
                
                // تعيين معرف المعلم الحالي
                importedTest.teacherId = currentUser.id;
                importedTest.createdAt = new Date().toISOString();
                importedTest.updatedAt = new Date().toISOString();
                
                // حفظ الاختبار المستورد
                const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
                tests.push(importedTest);
                localStorage.setItem('diagnosticTests', JSON.stringify(tests));
                
                showAuthNotification('تم استيراد الاختبار بنجاح', 'success');
                loadDiagnosticTests();
                
                // عرض رسالة توجيهية لربط الأهداف
                setTimeout(() => {
                    showAuthNotification('يرجى ربط أسئلة الاختبار بالأهداف القصيرة', 'info', 5000);
                }, 1500);
                
            } catch (error) {
                showAuthNotification('خطأ في قراءة ملف الاختبار', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    };
    
    fileInput.click();
}

function linkObjectives(testId) {
    currentTestId = testId;
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    if (test.questions.length === 0) {
        showAuthNotification('لا توجد أسئلة في هذا الاختبار', 'warning');
        return;
    }
    
    // تهيئة عملية الربط
    initializeObjectivesLinking(test);
}

// ============================================
// إنشاء الاختبارات
// ============================================

function initializeTestCreation() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') {
        redirectToLogin();
        return;
    }
    
    // التحقق مما إذا كان تعديل اختبار موجود
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        loadTestForEdit(parseInt(editId));
    } else {
        initializeNewTest();
    }
    
    setupQuestionTypes();
    setupHandwritingTools();
}

function initializeNewTest() {
    currentTestQuestions = [];
    updateQuestionsList();
    
    // تعيين القيم الافتراضية
    document.getElementById('testTitle').value = '';
    document.getElementById('testSubject').value = '';
    document.getElementById('testDescription').value = '';
    document.getElementById('passingCriteria').value = 60;
}

function loadTestForEdit(testId) {
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        setTimeout(() => {
            window.location.href = 'tests.html';
        }, 2000);
        return;
    }
    
    // تعبئة النموذج
    document.getElementById('testTitle').value = test.title;
    document.getElementById('testSubject').value = test.subject;
    document.getElementById('testDescription').value = test.description || '';
    document.getElementById('passingCriteria').value = test.passingCriteria || 60;
    
    currentTestQuestions = test.questions || [];
    currentTestId = testId;
    
    updateQuestionsList();
    showAuthNotification('جاري تحميل الاختبار للتعديل...', 'info');
}

function setupQuestionTypes() {
    const questionTypes = document.querySelectorAll('.question-type-card');
    
    questionTypes.forEach(type => {
        type.addEventListener('click', function() {
            // إزالة النشاط من جميع الأنواع
            questionTypes.forEach(t => t.classList.remove('active'));
            
            // إضافة النشاط للنوع المحدد
            this.classList.add('active');
            
            // تحديث نوع السؤال الحالي
            currentQuestionType = this.getAttribute('data-type');
            
            // تحديث واجهة محرر السؤال
            updateQuestionEditor();
        });
    });
    
    // تحديد النوع الأول افتراضياً
    if (questionTypes.length > 0) {
        questionTypes[0].click();
    }
}

function updateQuestionEditor() {
    const questionEditor = document.getElementById('questionEditor');
    const questionTitle = document.getElementById('questionTitle');
    const questionContent = document.getElementById('questionContent');
    
    // إعادة تعيين العنوان
    questionTitle.value = '';
    
    // بناء واجهة نوع السؤال المناسب
    switch (currentQuestionType) {
        case 'multiple-choice':
            questionContent.innerHTML = getMultipleChoiceTemplate();
            break;
        case 'drag-drop':
            questionContent.innerHTML = getDragDropTemplate();
            break;
        case 'multiple-choice-attachment':
            questionContent.innerHTML = getMultipleChoiceAttachmentTemplate();
            break;
        case 'open-ended':
            questionContent.innerHTML = getOpenEndedTemplate();
            break;
        case 'auto-reading':
            questionContent.innerHTML = getAutoReadingTemplate();
            break;
        case 'auto-spelling':
            questionContent.innerHTML = getAutoSpellingTemplate();
            break;
        case 'manual-reading':
            questionContent.innerHTML = getManualReadingTemplate();
            break;
        case 'manual-spelling':
            questionContent.innerHTML = getManualSpellingTemplate();
            break;
        case 'missing-letter':
            questionContent.innerHTML = getMissingLetterTemplate();
            break;
        default:
            questionContent.innerHTML = '<p>نوع السؤال غير معروف</p>';
    }
}

// ============================================
// قوالب أنواع الأسئلة
// ============================================

function getMultipleChoiceTemplate() {
    return `
        <div class="question-type-template">
            <div class="choices-list" id="choicesList">
                <!-- سيتم إضافة الخيارات ديناميكياً -->
            </div>
            <button class="btn btn-sm btn-primary" onclick="addChoice()">
                <i class="fas fa-plus"></i> إضافة خيار
            </button>
            <div class="question-settings">
                <div class="setting-row">
                    <label>عدد الإجابات الصحيحة:</label>
                    <select id="correctAnswersCount">
                        <option value="1">إجابة واحدة صحيحة</option>
                        <option value="multiple">إجابات متعددة</option>
                    </select>
                </div>
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="1" min="1">
                </div>
            </div>
        </div>
    `;
}

function getDragDropTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>النص الأساسي (مع أماكن فارغة):</label>
                <textarea id="dragDropText" rows="4" placeholder="أدخل النص مع وضع ___ للأماكن الفارغة" 
                          class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label>الخيارات للسحب:</label>
                <div id="dragOptionsList" class="choices-list">
                    <!-- خيارات السحب -->
                </div>
                <button class="btn btn-sm btn-primary" onclick="addDragOption()">
                    <i class="fas fa-plus"></i> إضافة خيار
                </button>
            </div>
            <div class="question-settings">
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="2" min="1">
                </div>
            </div>
        </div>
    `;
}

function getMultipleChoiceAttachmentTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>المرفق (صورة/فيديو/صوت):</label>
                <div class="file-upload-area" onclick="document.getElementById('attachmentUpload').click()">
                    <div class="upload-placeholder">
                        <div class="upload-icon">📎</div>
                        <p>انقر لرفع ملف</p>
                        <small>يُسمح بالصور، الفيديو، والملفات الصوتية</small>
                    </div>
                </div>
                <input type="file" id="attachmentUpload" style="display: none;" 
                       accept="image/*,video/*,audio/*" onchange="handleAttachmentUpload(event)">
                <div id="attachmentPreview"></div>
            </div>
            <div class="choices-list" id="choicesList">
                <!-- خيارات الاختيار من متعدد -->
            </div>
            <button class="btn btn-sm btn-primary" onclick="addChoice()">
                <i class="fas fa-plus"></i> إضافة خيار
            </button>
            <div class="question-settings">
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="1" min="1">
                </div>
            </div>
        </div>
    `;
}

function getOpenEndedTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>الإجابة النموذجية (اختياري):</label>
                <textarea id="modelAnswer" rows="4" 
                          placeholder="أدخل الإجابة النموذجية هنا (اختياري)"
                          class="form-control"></textarea>
            </div>
            <div class="question-settings">
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="2" min="1">
                </div>
            </div>
        </div>
    `;
}

function getAutoReadingTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>النص للقراءة:</label>
                <textarea id="readingText" rows="6" 
                          placeholder="أدخل النص الذي سيقرأه الطالب"
                          class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label>الكلمات المستهدفة (لكل سطر):</label>
                <div id="targetWordsList" class="choices-list">
                    <!-- الكلمات المستهدفة -->
                </div>
                <button class="btn btn-sm btn-primary" onclick="addTargetWord()">
                    <i class="fas fa-plus"></i> إضافة كلمة
                </button>
            </div>
            <div class="question-settings">
                <div class="setting-row">
                    <label>الوقت المسموح (ثانية):</label>
                    <input type="number" id="timeLimit" value="60" min="10">
                </div>
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="3" min="1">
                </div>
            </div>
        </div>
    `;
}

function getAutoSpellingTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>الكلمات للإملاء:</label>
                <div id="spellingWordsList" class="choices-list">
                    <!-- الكلمات للإملاء -->
                </div>
                <button class="btn btn-sm btn-primary" onclick="addSpellingWord()">
                    <i class="fas fa-plus"></i> إضافة كلمة
                </button>
            </div>
            <div class="form-group">
                <label>منطقة الكتابة اليدوية:</label>
                <div class="handwriting-area">
                    <div class="handwriting-tools">
                        <button class="tool-btn active" data-tool="pen" onclick="selectTool('pen')">
                            ✏️
                        </button>
                        <button class="tool-btn" data-tool="eraser" onclick="selectTool('eraser')">
                            🗑️
                        </button>
                        <button class="tool-btn" onclick="clearCanvas('autoSpellingCanvas')">
                            🧹
                        </button>
                        <input type="color" class="color-picker" value="#000000" 
                               onchange="changePenColor(this.value)">
                    </div>
                    <canvas id="autoSpellingCanvas" class="canvas-container"></canvas>
                </div>
            </div>
            <div class="question-settings">
                <div class="setting-row">
                    <label>الوقت المسموح (ثانية):</label>
                    <input type="number" id="timeLimit" value="90" min="10">
                </div>
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="3" min="1">
                </div>
            </div>
        </div>
    `;
}

function getManualReadingTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>النص للقراءة:</label>
                <textarea id="readingText" rows="6" 
                          placeholder="أدخل النص الذي سيقرأه الطالب"
                          class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label>الكلمات المستهدفة:</label>
                <input type="text" id="targetWords" 
                       placeholder="أدخل الكلمات مفصولة بفواصل (كلمة1, كلمة2, ...)"
                       class="form-control">
            </div>
            <div class="question-settings">
                <div class="setting-row">
                    <label>الوقت المسموح (ثانية):</label>
                    <input type="number" id="timeLimit" value="60" min="10">
                </div>
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="3" min="1">
                </div>
            </div>
        </div>
    `;
}

function getManualSpellingTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>الكلمات للإملاء:</label>
                <div id="spellingWordsList" class="choices-list">
                    <!-- الكلمات للإملاء -->
                </div>
                <button class="btn btn-sm btn-primary" onclick="addSpellingWord()">
                    <i class="fas fa-plus"></i> إضافة كلمة
                </button>
            </div>
            <div class="question-settings">
                <div class="setting-row">
                    <label>الوقت المسموح (ثانية):</label>
                    <input type="number" id="timeLimit" value="90" min="10">
                </div>
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="3" min="1">
                </div>
            </div>
        </div>
    `;
}

function getMissingLetterTemplate() {
    return `
        <div class="question-type-template">
            <div class="form-group">
                <label>الكلمات الناقصة:</label>
                <div id="missingWordsList" class="choices-list">
                    <!-- الكلمات الناقصة -->
                </div>
                <button class="btn btn-sm btn-primary" onclick="addMissingWord()">
                    <i class="fas fa-plus"></i> إضافة كلمة
                </button>
            </div>
            <div class="question-settings">
                <div class="setting-row">
                    <label>عدد المحاولات:</label>
                    <input type="number" id="attemptsAllowed" value="3" min="1">
                </div>
                <div class="setting-row">
                    <label>درجة السؤال:</label>
                    <input type="number" id="questionPoints" value="2" min="1">
                </div>
            </div>
        </div>
    `;
}

// ============================================
// وظائف إدارة الأسئلة
// ============================================

function addNewQuestion() {
    const questionTitle = document.getElementById('questionTitle').value.trim();
    const questionPoints = parseInt(document.getElementById('questionPoints')?.value) || 1;
    
    if (!questionTitle) {
        showAuthNotification('يرجى إدخال عنوان للسؤال', 'warning');
        return;
    }
    
    // بناء كائن السؤال بناءً على النوع
    const newQuestion = {
        id: generateId(),
        type: currentQuestionType,
        question: questionTitle,
        points: questionPoints,
        createdAt: new Date().toISOString()
    };
    
    // إضافة بيانات إضافية حسب نوع السؤال
    switch (currentQuestionType) {
        case 'multiple-choice':
            const choices = getChoicesData();
            const correctAnswersCount = document.getElementById('correctAnswersCount').value;
            newQuestion.choices = choices;
            newQuestion.correctAnswersCount = correctAnswersCount;
            break;
            
        case 'drag-drop':
            const dragDropText = document.getElementById('dragDropText').value;
            const dragOptions = getDragOptions();
            newQuestion.text = dragDropText;
            newQuestion.options = dragOptions;
            break;
            
        case 'multiple-choice-attachment':
            const attachmentData = getAttachmentData();
            const attachmentChoices = getChoicesData();
            newQuestion.attachment = attachmentData;
            newQuestion.choices = attachmentChoices;
            break;
            
        case 'open-ended':
            const modelAnswer = document.getElementById('modelAnswer').value;
            newQuestion.modelAnswer = modelAnswer;
            break;
            
        case 'auto-reading':
            const readingText = document.getElementById('readingText').value;
            const targetWords = getTargetWords();
            const timeLimit = parseInt(document.getElementById('timeLimit')?.value) || 60;
            newQuestion.text = readingText;
            newQuestion.targetWords = targetWords;
            newQuestion.timeLimit = timeLimit;
            break;
            
        case 'auto-spelling':
            const spellingWords = getSpellingWords();
            const handwritingData = getCanvasData('autoSpellingCanvas');
            const spellingTimeLimit = parseInt(document.getElementById('timeLimit')?.value) || 90;
            newQuestion.words = spellingWords;
            newQuestion.handwritingData = handwritingData;
            newQuestion.timeLimit = spellingTimeLimit;
            break;
            
        case 'manual-reading':
            const manualReadingText = document.getElementById('readingText').value;
            const manualTargetWords = document.getElementById('targetWords').value.split(',').map(w => w.trim());
            const manualReadingTimeLimit = parseInt(document.getElementById('timeLimit')?.value) || 60;
            newQuestion.text = manualReadingText;
            newQuestion.targetWords = manualTargetWords;
            newQuestion.timeLimit = manualReadingTimeLimit;
            break;
            
        case 'manual-spelling':
            const manualSpellingWords = getSpellingWords();
            const manualSpellingTimeLimit = parseInt(document.getElementById('timeLimit')?.value) || 90;
            newQuestion.words = manualSpellingWords;
            newQuestion.timeLimit = manualSpellingTimeLimit;
            break;
            
        case 'missing-letter':
            const missingWords = getMissingWords();
            const attemptsAllowed = parseInt(document.getElementById('attemptsAllowed')?.value) || 3;
            newQuestion.words = missingWords;
            newQuestion.attempts = attemptsAllowed;
            break;
    }
    
    // إضافة السؤال إلى القائمة
    currentTestQuestions.push(newQuestion);
    
    // تحديث عرض الأسئلة
    updateQuestionsList();
    
    // إعادة تعيين النموذج
    document.getElementById('questionTitle').value = '';
    showAuthNotification('تم إضافة السؤال بنجاح', 'success');
}

function getChoicesData() {
    const choiceElements = document.querySelectorAll('#choicesList .choice-item');
    const choices = [];
    
    choiceElements.forEach((choice, index) => {
        const textInput = choice.querySelector('input[type="text"]');
        const isCorrect = choice.querySelector('input[type="checkbox"]')?.checked || 
                         choice.querySelector('input[type="radio"]')?.checked;
        
        if (textInput && textInput.value.trim()) {
            choices.push({
                id: index + 1,
                text: textInput.value.trim(),
                isCorrect: isCorrect
            });
        }
    });
    
    return choices;
}

function addChoice() {
    const choicesList = document.getElementById('choicesList');
    if (!choicesList) return;
    
    const choiceCount = choicesList.children.length;
    const choiceId = choiceCount + 1;
    
    const choiceElement = document.createElement('div');
    choiceElement.className = 'choice-item';
    choiceElement.innerHTML = `
        <input type="checkbox" id="choice${choiceId}">
        <input type="text" placeholder="النص الخاص بالخيار ${choiceId}">
        <button class="choice-remove" onclick="removeChoice(this)">×</button>
    `;
    
    choicesList.appendChild(choiceElement);
}

function removeChoice(button) {
    const choiceItem = button.closest('.choice-item');
    if (choiceItem) {
        choiceItem.remove();
    }
}

function updateQuestionsList() {
    const questionsList = document.getElementById('questionsList');
    
    if (currentTestQuestions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❓</div>
                <h3>لا توجد أسئلة</h3>
                <p>قم بإضافة أسئلة لاختبارك</p>
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = currentTestQuestions.map((q, index) => `
        <div class="question-item">
            <div class="question-header">
                <div class="question-number">${index + 1}</div>
                <div class="question-title-input">${q.question}</div>
                <div class="question-actions">
                    <button class="btn btn-sm btn-primary" onclick="editQuestion(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removeQuestion(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="question-info">
                <span class="badge">${getQuestionTypeName(q.type)}</span>
                <span class="badge">${q.points} نقطة</span>
                ${q.objectiveId ? '<span class="badge badge-success">مربوط بهدف</span>' : ''}
            </div>
        </div>
    `).join('');
}

function editQuestion(index) {
    const question = currentTestQuestions[index];
    if (!question) return;
    
    // تحميل بيانات السؤال في المحرر
    currentQuestionType = question.type;
    
    // تحديث واجهة نوع السؤال
    const questionTypeCards = document.querySelectorAll('.question-type-card');
    questionTypeCards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-type') === question.type) {
            card.classList.add('active');
        }
    });
    
    updateQuestionEditor();
    
    // تعبئة بيانات السؤال
    document.getElementById('questionTitle').value = question.question;
    
    // TODO: تعبئة البيانات الخاصة بنوع السؤال
    
    showAuthNotification('جاري تحميل السؤال للتعديل', 'info');
}

function removeQuestion(index) {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        currentTestQuestions.splice(index, 1);
        updateQuestionsList();
        showAuthNotification('تم حذف السؤال', 'success');
    }
}

function saveTest() {
    const title = document.getElementById('testTitle').value.trim();
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value.trim();
    const passingCriteria = parseInt(document.getElementById('passingCriteria').value) || 60;
    
    if (!title) {
        showAuthNotification('يرجى إدخال عنوان للاختبار', 'error');
        return;
    }
    
    if (!subject) {
        showAuthNotification('يرجى اختيار المادة', 'error');
        return;
    }
    
    if (currentTestQuestions.length === 0) {
        showAuthNotification('يرجى إضافة أسئلة للاختبار', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    
    const testData = {
        id: currentTestId || generateId(),
        title: title,
        subject: subject,
        description: description,
        questions: currentTestQuestions,
        passingCriteria: passingCriteria,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        objectivesLinked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (currentTestId) {
        // تحديث اختبار موجود
        const index = tests.findIndex(t => t.id === currentTestId);
        if (index !== -1) {
            tests[index] = testData;
        }
    } else {
        // إضافة اختبار جديد
        tests.push(testData);
    }
    
    localStorage.setItem('diagnosticTests', JSON.stringify(tests));
    
    showAuthNotification(`تم ${currentTestId ? 'تحديث' : 'حفظ'} الاختبار بنجاح`, 'success');
    
    setTimeout(() => {
        window.location.href = 'tests.html';
    }, 1500);
}

// ============================================
// نظام ربط الأهداف القصيرة
// ============================================

function initializeObjectivesLinking(test) {
    const currentUser = getCurrentUser();
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    
    // تصفية الأهداف حسب المادة والمعلم
    const filteredObjectives = objectives.filter(obj => 
        obj.subject === test.subject && obj.teacherId === currentUser.id
    );
    
    if (filteredObjectives.length === 0) {
        showAuthNotification('لا توجد أهداف قصيرة لهذه المادة', 'warning');
        return;
    }
    
    document.getElementById('linkingModal').classList.add('show');
    
    // تخزين البيانات مؤقتاً
    window.linkingData = {
        test: test,
        objectives: filteredObjectives,
        currentStep: 0,
        selections: {}
    };
    
    loadLinkingStep(0);
}

function loadLinkingStep(stepIndex) {
    const linkingData = window.linkingData;
    if (!linkingData || stepIndex >= linkingData.test.questions.length) {
        completeLinking();
        return;
    }
    
    currentLinkingStep = stepIndex;
    const question = linkingData.test.questions[stepIndex];
    
    // تحديث شريط التقدم
    updateLinkingProgress(stepIndex, linkingData.test.questions.length);
    
    // عرض السؤال الحالي
    document.getElementById('currentQuestionText').textContent = question.question;
    
    // عرض قائمة الأهداف
    const objectivesList = document.getElementById('objectivesList');
    objectivesList.innerHTML = linkingData.objectives.map(obj => {
        const isSelected = linkingData.selections[question.id] === obj.id;
        
        return `
            <div class="objective-item ${isSelected ? 'selected' : ''}" 
                 onclick="selectObjective(${obj.id}, ${question.id})">
                <input type="radio" class="objective-checkbox" 
                       name="objective_${question.id}" 
                       ${isSelected ? 'checked' : ''}>
                <div class="objective-text">${obj.text}</div>
            </div>
        `;
    }).join('');
    
    // تحديث أزرار التنقل
    document.getElementById('prevStepBtn').style.display = stepIndex > 0 ? 'block' : 'none';
    document.getElementById('nextStepBtn').style.display = 'block';
    document.getElementById('finishBtn').style.display = 'none';
}

function selectObjective(objectiveId, questionId) {
    if (!window.linkingData) return;
    
    window.linkingData.selections[questionId] = objectiveId;
    
    // إعادة تحميل الخطوة الحالية
    loadLinkingStep(currentLinkingStep);
}

function nextLinkingStep() {
    const linkingData = window.linkingData;
    if (!linkingData) return;
    
    const currentQuestion = linkingData.test.questions[currentLinkingStep];
    
    // التحقق من اختيار هدف للسؤال الحالي
    if (!linkingData.selections[currentQuestion.id]) {
        showAuthNotification('يرجى اختيار هدف قصير لهذا السؤال', 'warning');
        return;
    }
    
    if (currentLinkingStep < linkingData.test.questions.length - 1) {
        loadLinkingStep(currentLinkingStep + 1);
    } else {
        // إذا كانت هذه آخر سؤال، إظهار زر الإنهاء
        document.getElementById('nextStepBtn').style.display = 'none';
        document.getElementById('finishBtn').style.display = 'block';
    }
}

function prevLinkingStep() {
    if (currentLinkingStep > 0) {
        loadLinkingStep(currentLinkingStep - 1);
    }
}

function updateLinkingProgress(currentStep, totalSteps) {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    progressSteps.forEach((step, index) => {
        step.classList.remove('active');
        if (index < currentStep + 1) {
            step.classList.add('active');
        }
    });
    
    // تحديث العداد
    document.getElementById('currentStep').textContent = currentStep + 1;
    document.getElementById('totalSteps').textContent = totalSteps;
}

function completeLinking() {
    const linkingData = window.linkingData;
    if (!linkingData) return;
    
    // تحديث الاختبار بالأهداف المربوطة
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const testIndex = tests.findIndex(t => t.id === linkingData.test.id);
    
    if (testIndex !== -1) {
        // ربط الأهداف بالأسئلة
        tests[testIndex].questions = tests[testIndex].questions.map(q => ({
            ...q,
            objectiveId: linkingData.selections[q.id] || null
        }));
        
        tests[testIndex].objectivesLinked = true;
        tests[testIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('diagnosticTests', JSON.stringify(tests));
        
        showAuthNotification('تم ربط الأهداف بنجاح', 'success');
        closeLinkingModal();
        loadDiagnosticTests();
    }
}

function closeLinkingModal() {
    document.getElementById('linkingModal').classList.remove('show');
    window.linkingData = null;
    currentLinkingStep = 0;
}

// ============================================
// وظائف الكتابة اليدوية
// ============================================

function setupHandwritingTools() {
    // سيتم تنفيذ هذه الوظيفة عند تحميل منطقة الكتابة
}

function selectTool(tool) {
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => btn.classList.remove('active'));
    
    const selectedBtn = document.querySelector(`[data-tool="${tool}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function changePenColor(color) {
    // تغيير لون القلم
    // سيتم تطبيقه عند استخدام القلم
}

function getCanvasData(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    return canvas.toDataURL(); // إرجاع البيانات كصورة
}

// ============================================
// دوال مساعدة
// ============================================

function getQuestionTypeName(type) {
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

function renderQuestionPreview(question) {
    switch (question.type) {
        case 'multiple-choice':
            return `
                <div class="choices-preview">
                    ${question.choices?.map(choice => `
                        <div class="choice-preview ${choice.isCorrect ? 'correct' : ''}">
                            ${choice.text}
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'open-ended':
            return question.modelAnswer ? 
                   `<p><strong>الإجابة النموذجية:</strong> ${question.modelAnswer}</p>` : 
                   '<p>سؤال مفتوح بدون إجابة نموذجية</p>';
            
        default:
            return `<p>نوع السؤال: ${getQuestionTypeName(question.type)}</p>`;
    }
}

function updatePageHeader() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name;
    }
}

function redirectToLogin() {
    window.location.href = '../../index.html';
}

// تصدير الدوال للاستخدام العالمي
window.viewTest = viewTest;
window.closeTestPreviewModal = closeTestPreviewModal;
window.editTest = editTest;
window.deleteTest = deleteTest;
window.exportTest = exportTest;
window.importTest = importTest;
window.linkObjectives = linkObjectives;
window.addNewQuestion = addNewQuestion;
window.addChoice = addChoice;
window.removeChoice = removeChoice;
window.editQuestion = editQuestion;
window.removeQuestion = removeQuestion;
window.saveTest = saveTest;
window.selectTool = selectTool;
window.clearCanvas = clearCanvas;
window.changePenColor = changePenColor;
window.nextLinkingStep = nextLinkingStep;
window.prevLinkingStep = prevLinkingStep;
window.completeLinking = completeLinking;
window.closeLinkingModal = closeLinkingModal;

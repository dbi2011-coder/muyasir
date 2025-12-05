// محرر الاختبارات التشخيصية
let currentQuestionType = null;
let currentQuestionIndex = -1;
let isEditing = false;
let canvas = null;
let ctx = null;
let drawing = false;
let currentTool = 'pen';
let currentColor = '#000000';

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('test-editor.html')) {
        initializeTestEditor();
    }
});

function initializeTestEditor() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    
    if (!testId) {
        showAuthNotification('معرف الاختبار غير موجود', 'error');
        setTimeout(() => window.location.href = 'diagnostic-tests.html', 2000);
        return;
    }
    
    const test = getDiagnosticTestById(parseInt(testId));
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        setTimeout(() => window.location.href = 'diagnostic-tests.html', 2000);
        return;
    }
    
    currentTest = test;
    questions = test.questions || [];
    
    loadTestInfo();
    updateQuestionsList();
}

function loadTestInfo() {
    if (!currentTest) return;
    
    document.getElementById('testTitleHeader').textContent = currentTest.title;
    document.getElementById('testSubjectBadge').textContent = currentTest.subject;
    
    const subjectClass = currentTest.subject === 'لغتي' ? 'subject-arabic' : 'subject-math';
    document.getElementById('testSubjectBadge').className = `test-subject-badge ${subjectClass}`;
    
    if (currentTest.description) {
        document.getElementById('testDescription').textContent = currentTest.description;
    }
}

function updateQuestionsList() {
    const questionsList = document.getElementById('questionsList');
    if (!questionsList) return;
    
    if (questions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❓</div>
                <h3>لا توجد أسئلة</h3>
                <p>قم بإضافة أول سؤال إلى الاختبار</p>
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = questions.map((question, index) => {
        return `
            <div class="test-card">
                <div class="test-header">
                    <div class="test-title">${question.text.substring(0, 50)}...</div>
                    <div class="test-meta">
                        <span class="test-subject-badge subject-arabic">
                            ${getQuestionTypeText(question.type)}
                        </span>
                        <span>نسبة الاجتياز: ${question.passCriteria}%</span>
                    </div>
                </div>
                <div class="test-actions">
                    <button class="btn btn-sm btn-primary" onclick="editQuestion(${index})">
                        تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${index})">
                        حذف
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="moveQuestion(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
                        ↑
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="moveQuestion(${index}, 1)" ${index === questions.length - 1 ? 'disabled' : ''}>
                        ↓
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddQuestionModal() {
    document.getElementById('addQuestionModal').classList.add('show');
}

function closeAddQuestionModal() {
    document.getElementById('addQuestionModal').classList.remove('show');
}

function selectQuestionType(type) {
    currentQuestionType = type;
    
    // إغلاق نافذة الاختيار
    closeAddQuestionModal();
    
    // فتح نافذة نموذج السؤال
    showQuestionForm(type);
}

function showQuestionForm(type) {
    currentQuestionType = type;
    isEditing = false;
    currentQuestionIndex = -1;
    
    const modalTitle = document.getElementById('questionModalLabel');
    const formContainer = document.getElementById('questionFormContainer');
    
    modalTitle.textContent = 'إضافة سؤال جديد';
    formContainer.innerHTML = getQuestionFormHTML(type);
    
    // تهيئة لوحة الكتابة إذا لزم الأمر
    if (type === 'auto-spelling' || type === 'manual-spelling' || type === 'missing-letter') {
        setTimeout(() => initializeHandwritingCanvas(), 100);
    }
    
    document.getElementById('questionModal').classList.add('show');
}

function getQuestionFormHTML(type) {
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
        <div class="pass-criteria">
            <div class="criteria-input">
                <label for="passCriteria">محك الاجتياز (%):</label>
                <input type="number" id="passCriteria" class="form-control" min="0" max="100" value="70" required>
            </div>
        </div>
    `;
    
    return formHtml;
}

function getMultipleChoiceForm() {
    return `
        <div class="form-group">
            <label>الخيارات:</label>
            <div id="choicesContainer">
                <div class="choice-item">
                    <input type="radio" name="correctChoice" value="0" required>
                    <input type="text" class="form-control choice-input" placeholder="الخيار الأول" required>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeChoice(this)">حذف</button>
                </div>
                <div class="choice-item">
                    <input type="radio" name="correctChoice" value="1" required>
                    <input type="text" class="form-control choice-input" placeholder="الخيار الثاني" required>
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
        <input type="text" class="form-control choice-input" placeholder="الخيار ${choiceCount + 1}" required>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeChoice(this)">حذف</button>
    `;
    
    container.appendChild(choiceElement);
}

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

function getDragDropForm() {
    return `
        <div class="form-group">
            <label for="dragItems">عناصر السحب:</label>
            <textarea id="dragItems" class="form-control" rows="3" placeholder="أدخل العناصر، كل عنصر في سطر" required></textarea>
        </div>
        <div class="form-group">
            <label for="dropZones">مناطق الإفلات:</label>
            <textarea id="dropZones" class="form-control" rows="3" placeholder="أدخل مناطق الإفلات، كل منطقة في سطر" required></textarea>
        </div>
    `;
}

function getMultipleChoiceAttachmentForm() {
    return `
        ${getMultipleChoiceForm()}
        <div class="form-group">
            <label for="questionAttachment">المرفق (صورة/فيديو/صوت):</label>
            <input type="file" id="questionAttachment" class="form-control" accept="image/*,video/*,audio/*">
            <div id="attachmentPreview"></div>
        </div>
    `;
}

function getOpenEndedForm() {
    return `
        <div class="form-group">
            <label for="modelAnswer">الإجابة النموذجية (اختياري):</label>
            <textarea id="modelAnswer" class="form-control" rows="3"></textarea>
        </div>
    `;
}

function getAutoReadingForm() {
    return `
        <div class="form-group">
            <label for="readingText">النص:</label>
            <textarea id="readingText" class="form-control" rows="5" required></textarea>
        </div>
        <div class="form-group">
            <label for="targetWords">الكلمات المستهدفة (مفصولة بفاصلة):</label>
            <input type="text" id="targetWords" class="form-control" placeholder="مثال: كتاب, قلم, دفتر">
        </div>
    `;
}

function getAutoSpellingForm() {
    return `
        <div class="form-group">
            <label for="spellingWords">الكلمات (مفصولة بفاصلة):</label>
            <input type="text" id="spellingWords" class="form-control" placeholder="مثال: كتاب, قلم, دفتر" required>
        </div>
        <div class="form-group">
            <label>لوحة الكتابة:</label>
            <div class="handwriting-canvas-container">
                <div class="canvas-tools">
                    <button type="button" class="tool-btn active" data-tool="pen" onclick="selectTool('pen')">✏️</button>
                    <button type="button" class="tool-btn" data-tool="eraser" onclick="selectTool('eraser')">🧽</button>
                    <button type="button" class="tool-btn" data-tool="clear" onclick="clearCanvas()">🗑️</button>
                </div>
                <div class="color-picker">
                    <div class="color-option active" style="background: #000" onclick="selectColor('#000')"></div>
                    <div class="color-option" style="background: #f00" onclick="selectColor('#f00')"></div>
                    <div class="color-option" style="background: #00f" onclick="selectColor('#00f')"></div>
                    <div class="color-option" style="background: #0f0" onclick="selectColor('#0f0')"></div>
                </div>
                <canvas id="handwritingCanvas" width="600" height="200" style="border: 1px solid #ccc; background: white;"></canvas>
            </div>
        </div>
    `;
}

function getManualReadingForm() {
    return getAutoReadingForm();
}

function getManualSpellingForm() {
    return getAutoSpellingForm();
}

function getMissingLetterForm() {
    return `
        <div class="form-group">
            <label for="missingWords">الكلمات مع الحرف الناقص (مفصولة بفاصلة):</label>
            <input type="text" id="missingWords" class="form-control" placeholder="مثال: ك_تب, ق_لم, د_تر" required>
        </div>
        <div class="form-group">
            <label>لوحة الكتابة:</label>
            <div class="handwriting-canvas-container">
                <div class="canvas-tools">
                    <button type="button" class="tool-btn active" data-tool="pen" onclick="selectTool('pen')">✏️</button>
                    <button type="button" class="tool-btn" data-tool="eraser" onclick="selectTool('eraser')">🧽</button>
                    <button type="button" class="tool-btn" data-tool="clear" onclick="clearCanvas()">🗑️</button>
                </div>
                <div class="color-picker">
                    <div class="color-option active" style="background: #000" onclick="selectColor('#000')"></div>
                    <div class="color-option" style="background: #f00" onclick="selectColor('#f00')"></div>
                    <div class="color-option" style="background: #00f" onclick="selectColor('#00f')"></div>
                    <div class="color-option" style="background: #0f0" onclick="selectColor('#0f0')"></div>
                </div>
                <canvas id="handwritingCanvas" width="600" height="200" style="border: 1px solid #ccc; background: white;"></canvas>
            </div>
        </div>
    `;
}

// دوال لوحة الكتابة
function initializeHandwritingCanvas() {
    const canvasElement = document.getElementById('handwritingCanvas');
    if (!canvasElement) return;
    
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // دعم اللمس للأجهزة المحمولة
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
    drawing = true;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!drawing) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function stopDrawing() {
    drawing = false;
}

function selectTool(tool) {
    currentTool = tool;
    
    // تحديث أزرار الأدوات
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // تنشيط الزر المحدد
    document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
    
    if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 10;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        ctx.strokeStyle = currentColor;
    }
}

function selectColor(color) {
    currentColor = color;
    
    // تحديث أزرار الألوان
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    if (currentTool !== 'eraser') {
        ctx.strokeStyle = color;
    }
}

function clearCanvas() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function getCanvasData() {
    if (!canvas) return null;
    return canvas.toDataURL();
}

async function saveQuestion() {
    const text = document.getElementById('questionText').value.trim();
    const passCriteria = parseInt(document.getElementById('passCriteria').value);
    
    if (!text) {
        showAuthNotification('يرجى إدخال نص السؤال', 'error');
        return;
    }
    
    if (isNaN(passCriteria) || passCriteria < 0 || passCriteria > 100) {
        showAuthNotification('محك الاجتياز يجب أن يكون بين 0 و 100', 'error');
        return;
    }
    
    const question = {
        id: isEditing ? questions[currentQuestionIndex].id : generateId(),
        type: currentQuestionType,
        text: text,
        passCriteria: passCriteria,
        createdAt: new Date().toISOString()
    };
    
    try {
        switch(currentQuestionType) {
            case 'multiple-choice':
                question.choices = getMultipleChoiceData();
                question.correctChoice = getCorrectChoice();
                break;
            case 'drag-drop':
                question.dragItems = getDragDropData('dragItems');
                question.dropZones = getDragDropData('dropZones');
                break;
            case 'multiple-choice-attachment':
                question.choices = getMultipleChoiceData();
                question.correctChoice = getCorrectChoice();
                const attachment = await getAttachmentData();
                if (attachment) question.attachment = attachment;
                break;
            case 'open-ended':
                question.modelAnswer = document.getElementById('modelAnswer')?.value.trim() || '';
                break;
            case 'auto-reading':
            case 'manual-reading':
                question.readingText = document.getElementById('readingText')?.value.trim() || '';
                question.targetWords = document.getElementById('targetWords')?.value.split(',').map(w => w.trim()).filter(w => w) || [];
                break;
            case 'auto-spelling':
            case 'manual-spelling':
                question.words = document.getElementById('spellingWords')?.value.split(',').map(w => w.trim()).filter(w => w) || [];
                question.canvasData = getCanvasData();
                break;
            case 'missing-letter':
                question.words = document.getElementById('missingWords')?.value.split(',').map(w => w.trim()).filter(w => w) || [];
                question.canvasData = getCanvasData();
                break;
        }
        
        if (isEditing) {
            questions[currentQuestionIndex] = question;
        } else {
            questions.push(question);
        }
        
        saveTestQuestions();
        updateQuestionsList();
        closeQuestionModal();
        
        showAuthNotification(isEditing ? 'تم تحديث السؤال بنجاح' : 'تم إضافة السؤال بنجاح', 'success');
        
    } catch (error) {
        showAuthNotification('حدث خطأ أثناء حفظ السؤال', 'error');
        console.error(error);
    }
}

function getMultipleChoiceData() {
    const choiceInputs = document.querySelectorAll('.choice-input');
    return Array.from(choiceInputs).map(input => input.value.trim());
}

function getCorrectChoice() {
    const radios = document.querySelectorAll('input[name="correctChoice"]:checked');
    return radios.length > 0 ? parseInt(radios[0].value) : 0;
}

function getDragDropData(fieldId) {
    const textarea = document.getElementById(fieldId);
    if (!textarea) return [];
    return textarea.value.split('\n').map(item => item.trim()).filter(item => item);
}

async function getAttachmentData() {
    const fileInput = document.getElementById('questionAttachment');
    if (!fileInput || !fileInput.files.length) return null;
    
    const file = fileInput.files[0];
    return new Promise((resolve) => {
        const reader = new FileReader();
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

function editQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    const question = questions[index];
    if (!question) return;
    
    currentQuestionIndex = index;
    currentQuestionType = question.type;
    isEditing = true;
    
    const modalTitle = document.getElementById('questionModalLabel');
    const formContainer = document.getElementById('questionFormContainer');
    
    modalTitle.textContent = 'تعديل السؤال';
    formContainer.innerHTML = getQuestionFormHTML(question.type);
    
    // تعبئة البيانات
    setTimeout(() => {
        document.getElementById('questionText').value = question.text;
        document.getElementById('passCriteria').value = question.passCriteria;
        
        // تعبئة البيانات حسب نوع السؤال
        switch(question.type) {
            case 'multiple-choice':
            case 'multiple-choice-attachment':
                fillMultipleChoiceData(question);
                break;
            case 'drag-drop':
                if (question.dragItems) {
                    document.getElementById('dragItems').value = question.dragItems.join('\n');
                }
                if (question.dropZones) {
                    document.getElementById('dropZones').value = question.dropZones.join('\n');
                }
                break;
            case 'open-ended':
                if (question.modelAnswer) {
                    document.getElementById('modelAnswer').value = question.modelAnswer;
                }
                break;
            case 'auto-reading':
            case 'manual-reading':
                if (question.readingText) {
                    document.getElementById('readingText').value = question.readingText;
                }
                if (question.targetWords) {
                    document.getElementById('targetWords').value = question.targetWords.join(', ');
                }
                break;
            case 'auto-spelling':
            case 'manual-spelling':
                if (question.words) {
                    document.getElementById('spellingWords').value = question.words.join(', ');
                }
                if (question.type === 'auto-spelling' || question.type === 'manual-spelling' || question.type === 'missing-letter') {
                    setTimeout(() => initializeHandwritingCanvas(), 100);
                }
                break;
            case 'missing-letter':
                if (question.words) {
                    document.getElementById('missingWords').value = question.words.join(', ');
                }
                setTimeout(() => initializeHandwritingCanvas(), 100);
                break;
        }
    }, 100);
    
    document.getElementById('questionModal').classList.add('show');
}

function fillMultipleChoiceData(question) {
    const container = document.getElementById('choicesContainer');
    if (!container || !question.choices || !Array.isArray(question.choices)) return;
    
    container.innerHTML = '';
    
    question.choices.forEach((choice, index) => {
        const choiceElement = document.createElement('div');
        choiceElement.className = 'choice-item';
        choiceElement.innerHTML = `
            <input type="radio" name="correctChoice" value="${index}" ${index === question.correctChoice ? 'checked' : ''}>
            <input type="text" class="form-control choice-input" value="${choice}">
            <button type="button" class="btn btn-sm btn-danger" onclick="removeChoice(this)">حذف</button>
        `;
        container.appendChild(choiceElement);
    });
    
    if (question.choices.length < 2) {
        addChoice();
        addChoice();
    }
}

function deleteQuestion(index) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        return;
    }
    
    questions.splice(index, 1);
    saveTestQuestions();
    updateQuestionsList();
    showAuthNotification('تم حذف السؤال', 'success');
}

function moveQuestion(index, direction) {
    if ((index === 0 && direction < 0) || (index === questions.length - 1 && direction > 0)) {
        return;
    }
    
    const newIndex = index + direction;
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
    
    saveTestQuestions();
    updateQuestionsList();
}

function saveTestQuestions() {
    if (!currentTest) return;
    
    currentTest.questions = questions;
    saveDiagnosticTest(currentTest);
}

function closeQuestionModal() {
    document.getElementById('questionModal').classList.remove('show');
    currentQuestionType = null;
    currentQuestionIndex = -1;
    isEditing = false;
}

function saveTest() {
    if (!currentTest) return;
    
    currentTest.questions = questions;
    saveDiagnosticTest(currentTest);
    
    showAuthNotification('تم حفظ الاختبار بنجاح', 'success');
    
    setTimeout(() => {
        window.location.href = 'diagnostic-tests.html';
    }, 1500);
}

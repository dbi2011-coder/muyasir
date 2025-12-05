// محرر الأسئلة للاختبارات التشخيصية
let currentQuestionType = null;
let currentQuestionIndex = -1;
let isEditing = false;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('test-editor.html')) {
        initializeTestEditor();
    }
});

function initializeTestEditor() {
    const testId = getUrlParameter('id');
    if (!testId) {
        showAuthNotification('معرف الاختبار غير موجود', 'error');
        window.location.href = 'diagnostic-tests.html';
        return;
    }
    
    const test = getDiagnosticTestById(parseInt(testId));
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        window.location.href = 'diagnostic-tests.html';
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
    document.getElementById('testSubjectBadge').className = `test-subject-badge subject-${currentTest.subject === 'لغتي' ? 'arabic' : 'math'}`;
    
    if (currentTest.description) {
        document.getElementById('testDescription').textContent = currentTest.description;
    }
}

function showQuestionForm(type) {
    currentQuestionType = type;
    isEditing = false;
    currentQuestionIndex = -1;
    
    const modalTitle = document.getElementById('questionModalLabel');
    const formContainer = document.getElementById('questionFormContainer');
    
    modalTitle.textContent = 'إضافة سؤال جديد';
    formContainer.innerHTML = getQuestionFormHTML(type);
    
    if (type === 'auto-spelling' || type === 'manual-spelling' || type === 'missing-letter') {
        initializeHandwritingCanvas();
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

function getDragDropForm() {
    return `
        <div class="form-group">
            <label for="dragItems">عناصر السحب:</label>
            <textarea id="dragItems" class="form-control" rows="3" placeholder="أدخل العناصر، كل عنصر في سطر"></textarea>
        </div>
        <div class="form-group">
            <label for="dropZones">مناطق الإفلات:</label>
            <textarea id="dropZones" class="form-control" rows="3" placeholder="أدخل مناطق الإفلات، كل منطقة في سطر"></textarea>
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
            <label for="targetWords">الكلمات المستهدفة:</label>
            <input type="text" id="targetWords" class="form-control" placeholder="الكلمات المفصولة بفاصلة">
        </div>
    `;
}

function getAutoSpellingForm() {
    return `
        <div class="form-group">
            <label for="spellingWords">الكلمات:</label>
            <input type="text" id="spellingWords" class="form-control" placeholder="الكلمات المفصولة بفاصلة" required>
        </div>
        <div class="form-group">
            <label>لوحة الكتابة:</label>
            <div class="handwriting-canvas-container">
                <div class="canvas-tools">
                    <button type="button" class="tool-btn active" onclick="selectTool('pen')">✏️</button>
                    <button type="button" class="tool-btn" onclick="selectTool('eraser')">🧽</button>
                    <button type="button" class="tool-btn" onclick="clearCanvas()">🗑️</button>
                </div>
                <div class="color-picker">
                    <div class="color-option active" style="background: #000" onclick="selectColor('#000')"></div>
                    <div class="color-option" style="background: #f00" onclick="selectColor('#f00')"></div>
                    <div class="color-option" style="background: #00f" onclick="selectColor('#00f')"></div>
                    <div class="color-option" style="background: #0f0" onclick="selectColor('#0f0')"></div>
                </div>
                <canvas id="handwritingCanvas" width="600" height="200"></canvas>
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
            <label for="missingWords">الكلمات الناقصة:</label>
            <input type="text" id="missingWords" class="form-control" placeholder="الكلمات مع الحرف الناقص (مثال: ك_تب)" required>
        </div>
        <div class="form-group">
            <label>لوحة الكتابة:</label>
            <div class="handwriting-canvas-container">
                <div class="canvas-tools">
                    <button type="button" class="tool-btn active" onclick="selectTool('pen')">✏️</button>
                    <button type="button" class="tool-btn" onclick="selectTool('eraser')">🧽</button>
                    <button type="button" class="tool-btn" onclick="clearCanvas()">🗑️</button>
                </div>
                <div class="color-picker">
                    <div class="color-option active" style="background: #000" onclick="selectColor('#000')"></div>
                    <div class="color-option" style="background: #f00" onclick="selectColor('#f00')"></div>
                    <div class="color-option" style="background: #00f" onclick="selectColor('#00f')"></div>
                    <div class="color-option" style="background: #0f0" onclick="selectColor('#0f0')"></div>
                </div>
                <canvas id="handwritingCanvas" width="600" height="200"></canvas>
            </div>
        </div>
    `;
}

function saveQuestion() {
    const text = document.getElementById('questionText').value.trim();
    const passCriteria = parseInt(document.getElementById('passCriteria').value);
    
    if (!text) {
        showAuthNotification('يرجى إدخال نص السؤال', 'error');
        return;
    }
    
    const question = {
        id: isEditing ? questions[currentQuestionIndex].id : generateId(),
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
    
    if (isEditing) {
        questions[currentQuestionIndex] = question;
    } else {
        questions.push(question);
    }
    
    saveTestQuestions();
    updateQuestionsList();
    closeQuestionModal();
    showAuthNotification(isEditing ? 'تم تحديث السؤال' : 'تم إضافة السؤال', 'success');
}

function editQuestion(index) {
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
    document.getElementById('questionText').value = question.text;
    document.getElementById('passCriteria').value = question.passCriteria;
    
    // تعبئة البيانات الإضافية حسب نوع السؤال
    switch(question.type) {
        case 'multiple-choice':
            fillMultipleChoiceData(question);
            break;
        case 'open-ended':
            if (question.modelAnswer) {
                document.getElementById('modelAnswer').value = question.modelAnswer;
            }
            break;
        // يمكن إضافة حالات أخرى حسب الحاجة
    }
    
    document.getElementById('questionModal').classList.add('show');
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
    const temp = questions[index];
    questions[index] = questions[newIndex];
    questions[newIndex] = temp;
    
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
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// دوال لمعالجة أنواع الأسئلة المختلفة
function getDragDropData() {
    const items = document.getElementById('dragItems')?.value.split('\n').filter(item => item.trim()) || [];
    const zones = document.getElementById('dropZones')?.value.split('\n').filter(zone => zone.trim()) || [];
    
    return { items, zones };
}

function getReadingTexts() {
    const text = document.getElementById('readingText')?.value.trim() || '';
    const words = document.getElementById('targetWords')?.value.split(',').map(w => w.trim()).filter(w => w) || [];
    
    return { text, words };
}

function getSpellingWords() {
    const words = document.getElementById('spellingWords')?.value.split(',').map(w => w.trim()).filter(w => w) || [];
    return words;
}

function getMissingLetterWords() {
    const words = document.getElementById('missingWords')?.value.split(',').map(w => w.trim()).filter(w => w) || [];
    return words;
}

function fillMultipleChoiceData(question) {
    if (!question.choices || !question.correctChoice) return;
    
    const container = document.getElementById('choicesContainer');
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
}

// وظائف لوحة الكتابة
let canvas, ctx;
let drawing = false;
let currentTool = 'pen';
let currentColor = '#000000';

function initializeHandwritingCanvas() {
    canvas = document.getElementById('handwritingCanvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

function startDrawing(e) {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {
    if (!drawing) return;
    
    if (currentTool === 'eraser') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 10;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        ctx.strokeStyle = currentColor;
    }
    
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    
    if (currentTool === 'eraser') {
        ctx.restore();
    }
}

function stopDrawing() {
    drawing = false;
}

function selectTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function selectColor(color) {
    currentColor = color;
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    event.target.classList.add('active');
    ctx.strokeStyle = color;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getCanvasData() {
    return canvas.toDataURL();
}

// تصدير الدوال للاستخدام العالمي
window.showQuestionForm = showQuestionForm;
window.saveQuestion = saveQuestion;
window.closeQuestionModal = closeQuestionModal;
window.editQuestion = editQuestion;
window.deleteQuestion = deleteQuestion;
window.moveQuestion = moveQuestion;
window.saveTest = saveTest;

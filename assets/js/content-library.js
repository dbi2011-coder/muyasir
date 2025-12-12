// ===== content-library.js =====
// إدارة مكتبة المحتوى التعليمي - نسخة محسنة
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('content-library.html')) {
        initializeContentLibrary();
    }
});

function initializeContentLibrary() {
    // إضافة زر إضافة اختبار جديد بجانب زر الاستيراد
    const importButton = document.querySelector('button[onclick*="showImportModal"]');
    if (importButton) {
        const addTestBtn = document.createElement('button');
        addTestBtn.className = 'btn btn-success ml-2';
        addTestBtn.innerHTML = '➕ إضافة اختبار تشخيصي';
        addTestBtn.onclick = showCreateTestModal;
        importButton.parentNode.insertBefore(addTestBtn, importButton.nextSibling);
    }
    
    loadContentLibrary();
}

function loadContentLibrary() {
    loadTests();
    loadLessons();
    loadObjectives();
    loadAssignments();
}

function loadTests() {
    const testsGrid = document.getElementById('testsGrid');
    if (!testsGrid) return;

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية اختبارات المعلم الحالي
    const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);
    
    // ترتيب الاختبارات: أولاً حسب المادة (لغتي ثم رياضيات)، ثم حسب التاريخ
    teacherTests.sort((a, b) => {
        // ترتيب حسب المادة
        const subjectOrder = { 'لغتي': 1, 'رياضيات': 2 };
        const subjectA = subjectOrder[a.subject] || 3;
        const subjectB = subjectOrder[b.subject] || 3;
        
        if (subjectA !== subjectB) {
            return subjectA - subjectB;
        }
        
        // ترتيب حسب التاريخ (الأحدث أولاً)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (teacherTests.length === 0) {
        testsGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات تشخيصية</h3>
                <p>ابدأ بإنشاء أول اختبار تشخيصي</p>
                <button class="btn btn-success" onclick="showCreateTestModal()">إنشاء اختبار</button>
            </div>
        `;
        return;
    }

    testsGrid.innerHTML = teacherTests.map(test => `
        <div class="content-card">
            <div class="content-header">
                <h4>${test.title}</h4>
                <div class="content-meta-top">
                    <span class="content-badge subject-${test.subject}">${test.subject}</span>
                    <span class="content-date">${formatDate(test.createdAt)}</span>
                </div>
            </div>
            <div class="content-body">
                <p>${test.description || 'لا يوجد وصف'}</p>
                <div class="content-stats">
                    <div class="stat-item">
                        <span class="stat-label">عدد الأسئلة:</span>
                        <span class="stat-value">${test.questions?.length || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">الأهداف المربوطة:</span>
                        <span class="objectives-status ${test.objectivesLinked ? 'linked' : 'not-linked'}">
                            ${test.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTestDetails(${test.id})" title="عرض التفاصيل">👁️</button>
                <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})" title="تعديل">✏️</button>
                <button class="btn btn-sm btn-info" onclick="exportTest(${test.id})" title="تصدير">📤</button>
                <button class="btn btn-sm btn-secondary" onclick="linkTestObjectives(${test.id})" title="ربط الأهداف">🎯</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})" title="حذف">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ===== إدارة الاختبارات التشخيصية =====
let currentTestEditing = null;
let currentQuestionIndex = 0;
let linkedObjectives = {};

function showCreateTestModal() {
    currentTestEditing = null;
    document.getElementById('createTestModal').classList.add('show');
    document.getElementById('modalTitle').textContent = 'إنشاء اختبار تشخيصي جديد';
    document.getElementById('createTestForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    document.getElementById('saveTestBtn').textContent = 'حفظ الاختبار';
}

function showEditTestModal(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) return;
    
    currentTestEditing = test;
    document.getElementById('createTestModal').classList.add('show');
    document.getElementById('modalTitle').textContent = 'تعديل اختبار تشخيصي';
    document.getElementById('testTitle').value = test.title;
    document.getElementById('testSubject').value = test.subject;
    document.getElementById('testDescription').value = test.description || '';
    
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    
    if (test.questions && test.questions.length > 0) {
        test.questions.forEach((question, index) => {
            addQuestionToContainer(question, index);
        });
    }
    
    document.getElementById('saveTestBtn').textContent = 'تحديث الاختبار';
}

function addQuestionToContainer(questionData, index) {
    const questionsContainer = document.getElementById('questionsContainer');
    
    const questionHTML = `
        <div class="question-item" data-index="${index}">
            <div class="question-header">
                <h5>السؤال ${index + 1}</h5>
                <div class="question-actions">
                    <span class="question-type-badge">${getQuestionTypeName(questionData.type)}</span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(${index})">🗑️</button>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">نوع السؤال</label>
                <select class="form-control question-type" onchange="changeQuestionType(${index})" ${questionData.type ? 'disabled' : ''}>
                    <option value="multiple-choice" ${questionData.type === 'multiple-choice' ? 'selected' : ''}>اختيار من متعدد</option>
                    <option value="multiple-choice-attachment" ${questionData.type === 'multiple-choice-attachment' ? 'selected' : ''}>اختيار من متعدد مع مرفق</option>
                    <option value="drag-drop" ${questionData.type === 'drag-drop' ? 'selected' : ''}>سحب وإفلات</option>
                    <option value="open-ended" ${questionData.type === 'open-ended' ? 'selected' : ''}>سؤال مفتوح</option>
                    <option value="reading-auto" ${questionData.type === 'reading-auto' ? 'selected' : ''}>تقييم القراءة الآلي</option>
                    <option value="spelling-auto" ${questionData.type === 'spelling-auto' ? 'selected' : ''}>تقييم الإملاء الآلي</option>
                    <option value="reading-manual" ${questionData.type === 'reading-manual' ? 'selected' : ''}>تقييم القراءة اليدوي</option>
                    <option value="spelling-manual" ${questionData.type === 'spelling-manual' ? 'selected' : ''}>تقييم الإملاء اليدوي</option>
                    <option value="missing-letter" ${questionData.type === 'missing-letter' ? 'selected' : ''}>أكمل الحرف الناقص</option>
                </select>
            </div>
            <div class="question-content">
                ${generateQuestionContent(questionData, index)}
            </div>
            <div class="question-footer">
                <div class="form-group">
                    <label class="form-label">محك الاجتياز (%)</label>
                    <input type="number" class="form-control passing-criteria" min="0" max="100" value="${questionData.passingCriteria || 80}">
                </div>
            </div>
        </div>
    `;
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHTML);
}

function getQuestionTypeName(type) {
    const types = {
        'multiple-choice': 'اختيار من متعدد',
        'multiple-choice-attachment': 'اختيار من متعدد مع مرفق',
        'drag-drop': 'سحب وإفلات',
        'open-ended': 'سؤال مفتوح',
        'reading-auto': 'تقييم القراءة الآلي',
        'spelling-auto': 'تقييم الإملاء الآلي',
        'reading-manual': 'تقييم القراءة اليدوي',
        'spelling-manual': 'تقييم الإملاء اليدوي',
        'missing-letter': 'أكمل الحرف الناقص'
    };
    return types[type] || type;
}

function generateQuestionContent(questionData, index) {
    let contentHTML = '';
    
    switch(questionData.type) {
        case 'multiple-choice':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">نص السؤال</label>
                    <textarea class="form-control question-text" rows="3">${questionData.text || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">الخيارات</label>
                    <div class="choices-container">
                        ${questionData.choices ? questionData.choices.map((choice, i) => `
                            <div class="choice-item">
                                <input type="text" class="form-control choice-text" placeholder="النص" value="${choice.text || ''}">
                                <label class="choice-correct-label">
                                    <input type="checkbox" class="choice-correct" ${choice.correct ? 'checked' : ''}>
                                    صحيح
                                </label>
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `).join('') : `
                            <div class="choice-item">
                                <input type="text" class="form-control choice-text" placeholder="النص">
                                <label class="choice-correct-label">
                                    <input type="checkbox" class="choice-correct">
                                    صحيح
                                </label>
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addChoice(${index})">+ إضافة خيار</button>
                </div>
            `;
            break;
            
        case 'multiple-choice-attachment':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">نص السؤال</label>
                    <textarea class="form-control question-text" rows="3">${questionData.text || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">المرفق</label>
                    <div class="attachment-upload">
                        <input type="file" class="form-control attachment-file" accept="image/*,video/*,audio/*" 
                               onchange="previewAttachment(${index}, this)">
                        ${questionData.attachment ? `
                            <div class="attachment-preview" id="preview-${index}">
                                <span>${questionData.attachment.name}</span>
                                <button type="button" class="btn btn-sm btn-danger" onclick="removeAttachment(${index})">حذف</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">الخيارات</label>
                    <div class="choices-container">
                        ${questionData.choices ? questionData.choices.map((choice, i) => `
                            <div class="choice-item">
                                <input type="text" class="form-control choice-text" placeholder="النص" value="${choice.text || ''}">
                                <label class="choice-correct-label">
                                    <input type="checkbox" class="choice-correct" ${choice.correct ? 'checked' : ''}>
                                    صحيح
                                </label>
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `).join('') : `
                            <div class="choice-item">
                                <input type="text" class="form-control choice-text" placeholder="النص">
                                <label class="choice-correct-label">
                                    <input type="checkbox" class="choice-correct">
                                    صحيح
                                </label>
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addChoice(${index})">+ إضافة خيار</button>
                </div>
            `;
            break;
            
        case 'open-ended':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">نص السؤال</label>
                    <textarea class="form-control question-text" rows="3">${questionData.text || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">الإجابة النموذجية (اختياري)</label>
                    <textarea class="form-control model-answer" rows="2">${questionData.modelAnswer || ''}</textarea>
                </div>
            `;
            break;
            
        case 'reading-auto':
        case 'spelling-auto':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">الكلمات/النصوص</label>
                    <div class="words-container">
                        ${questionData.words ? questionData.words.map((word, i) => `
                            <div class="word-item">
                                <input type="text" class="form-control word-text" value="${word}" placeholder="أدخل الكلمة">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `).join('') : `
                            <div class="word-item">
                                <input type="text" class="form-control word-text" placeholder="أدخل الكلمة">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addWord(${index})">+ إضافة كلمة</button>
                </div>
                <div class="form-group">
                    <label class="form-label">تعليمات للطالب</label>
                    <textarea class="form-control instructions" rows="2">${questionData.instructions || 'استمع للكلمة واكتبها/اقرأها'}</textarea>
                </div>
            `;
            break;
            
        case 'reading-manual':
        case 'spelling-manual':
        case 'missing-letter':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">المحتوى</label>
                    <div class="interactive-content">
                        <div class="form-group">
                            <label class="form-label">${questionData.type === 'missing-letter' ? 'الكلمة الناقصة حرف' : 'الكلمات'}</label>
                            <input type="text" class="form-control content-text" value="${questionData.content || ''}" 
                                   placeholder="${questionData.type === 'missing-letter' ? 'مثال: ق_ب (قلم)' : 'أدخل الكلمات'}">
                        </div>
                        <div class="drawing-tools">
                            <label>أدوات الرسم:</label>
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="activatePen(${index})">✏️ قلم</button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="activateEraser(${index})">🧽 ممحاة</button>
                            <input type="color" class="color-picker" onchange="changeColor(${index}, this.value)">
                            <button type="button" class="btn btn-sm btn-danger" onclick="clearDrawing(${index})">🗑️ مسح الكل</button>
                        </div>
                        <div class="drawing-canvas-container">
                            <canvas class="drawing-canvas" id="canvas-${index}" width="600" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">تعليمات التصحيح للمعلم</label>
                    <textarea class="form-control correction-instructions" rows="2">${questionData.correctionInstructions || 'اضغط على الكلمة الخاطئة لتغيير لون خلفيتها'}</textarea>
                </div>
            `;
            break;
            
        case 'drag-drop':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">نص السؤال</label>
                    <textarea class="form-control question-text" rows="3">${questionData.text || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">العناصر القابلة للسحب</label>
                    <div class="draggable-items">
                        ${questionData.draggableItems ? questionData.draggableItems.map((item, i) => `
                            <div class="draggable-item">
                                <input type="text" class="form-control draggable-text" value="${item}" placeholder="عنصر">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `).join('') : `
                            <div class="draggable-item">
                                <input type="text" class="form-control draggable-text" placeholder="عنصر">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addDraggableItem(${index})">+ إضافة عنصر</button>
                </div>
                <div class="form-group">
                    <label class="form-label">المناطق المستهدفة</label>
                    <div class="drop-zones">
                        ${questionData.dropZones ? questionData.dropZones.map((zone, i) => `
                            <div class="drop-zone-item">
                                <input type="text" class="form-control drop-zone-label" value="${zone.label}" placeholder="تسمية المنطقة">
                                <input type="text" class="form-control correct-item" value="${zone.correctItem}" placeholder="العنصر الصحيح">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `).join('') : `
                            <div class="drop-zone-item">
                                <input type="text" class="form-control drop-zone-label" placeholder="تسمية المنطقة">
                                <input type="text" class="form-control correct-item" placeholder="العنصر الصحيح">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addDropZone(${index})">+ إضافة منطقة</button>
                </div>
            `;
            break;
            
        default:
            contentHTML = `<p>نوع السؤال: ${questionData.type}</p>`;
    }
    
    return contentHTML;
}

function changeQuestionType(questionIndex) {
    const questionItem = document.querySelector(`.question-item[data-index="${questionIndex}"]`);
    const questionType = questionItem.querySelector('.question-type').value;
    const questionContent = questionItem.querySelector('.question-content');
    
    const questionData = {
        type: questionType,
        passingCriteria: 80
    };
    
    questionContent.innerHTML = generateQuestionContent(questionData, questionIndex);
    
    // إضافة أدوات الرسم للأنواع التفاعلية
    if (['reading-manual', 'spelling-manual', 'missing-letter'].includes(questionType)) {
        initializeDrawingCanvas(questionIndex);
    }
}

function addQuestion() {
    const questionsContainer = document.getElementById('questionsContainer');
    const questionIndex = questionsContainer.children.length;
    
    const questionHTML = `
        <div class="question-item" data-index="${questionIndex}">
            <div class="question-header">
                <h5>السؤال ${questionIndex + 1}</h5>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(${questionIndex})">🗑️</button>
            </div>
            <div class="form-group">
                <label class="form-label">نوع السؤال</label>
                <select class="form-control question-type" onchange="changeQuestionType(${questionIndex})">
                    <option value="multiple-choice">اختيار من متعدد</option>
                    <option value="multiple-choice-attachment">اختيار من متعدد مع مرفق</option>
                    <option value="drag-drop">سحب وإفلات</option>
                    <option value="open-ended">سؤال مفتوح</option>
                    <option value="reading-auto">تقييم القراءة الآلي</option>
                    <option value="spelling-auto">تقييم الإملاء الآلي</option>
                    <option value="reading-manual">تقييم القراءة اليدوي</option>
                    <option value="spelling-manual">تقييم الإملاء اليدوي</option>
                    <option value="missing-letter">أكمل الحرف الناقص</option>
                </select>
            </div>
            <div class="question-content">
                <!-- سيتم تعبئته بناءً على نوع السؤال -->
            </div>
            <div class="question-footer">
                <div class="form-group">
                    <label class="form-label">محك الاجتياز (%)</label>
                    <input type="number" class="form-control passing-criteria" min="0" max="100" value="80">
                </div>
            </div>
        </div>
    `;
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHTML);
    changeQuestionType(questionIndex);
}

function removeQuestion(questionIndex) {
    const questionItem = document.querySelector(`.question-item[data-index="${questionIndex}"]`);
    if (questionItem) {
        questionItem.remove();
        // إعادة ترقيم الأسئلة المتبقية
        const remainingQuestions = document.querySelectorAll('.question-item');
        remainingQuestions.forEach((item, index) => {
            item.setAttribute('data-index', index);
            item.querySelector('h5').textContent = `السؤال ${index + 1}`;
        });
    }
}

function addChoice(questionIndex) {
    const choicesContainer = document.querySelector(`.question-item[data-index="${questionIndex}"] .choices-container`);
    const choiceHTML = `
        <div class="choice-item">
            <input type="text" class="form-control choice-text" placeholder="النص">
            <label class="choice-correct-label">
                <input type="checkbox" class="choice-correct">
                صحيح
            </label>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
        </div>
    `;
    choicesContainer.insertAdjacentHTML('beforeend', choiceHTML);
}

function addWord(questionIndex) {
    const wordsContainer = document.querySelector(`.question-item[data-index="${questionIndex}"] .words-container`);
    const wordHTML = `
        <div class="word-item">
            <input type="text" class="form-control word-text" placeholder="أدخل الكلمة">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
        </div>
    `;
    wordsContainer.insertAdjacentHTML('beforeend', wordHTML);
}

function addDraggableItem(questionIndex) {
    const draggableItems = document.querySelector(`.question-item[data-index="${questionIndex}"] .draggable-items`);
    const itemHTML = `
        <div class="draggable-item">
            <input type="text" class="form-control draggable-text" placeholder="عنصر">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
        </div>
    `;
    draggableItems.insertAdjacentHTML('beforeend', itemHTML);
}

function addDropZone(questionIndex) {
    const dropZones = document.querySelector(`.question-item[data-index="${questionIndex}"] .drop-zones`);
    const zoneHTML = `
        <div class="drop-zone-item">
            <input type="text" class="form-control drop-zone-label" placeholder="تسمية المنطقة">
            <input type="text" class="form-control correct-item" placeholder="العنصر الصحيح">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
        </div>
    `;
    dropZones.insertAdjacentHTML('beforeend', zoneHTML);
}

// ==== وظائف المرفقات والرسم ====
function previewAttachment(questionIndex, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewDiv = document.querySelector(`#preview-${questionIndex}`) || 
                               document.createElement('div');
            previewDiv.className = 'attachment-preview';
            previewDiv.id = `preview-${questionIndex}`;
            previewDiv.innerHTML = `
                <span>${input.files[0].name}</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeAttachment(${questionIndex})">حذف</button>
            `;
            input.parentNode.appendChild(previewDiv);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removeAttachment(questionIndex) {
    const preview = document.querySelector(`#preview-${questionIndex}`);
    const fileInput = document.querySelector(`.question-item[data-index="${questionIndex}"] .attachment-file`);
    if (preview) preview.remove();
    if (fileInput) fileInput.value = '';
}

function initializeDrawingCanvas(questionIndex) {
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    let drawing = false;
    let isErasing = false;
    
    canvas.addEventListener('mousedown', (e) => startDrawing(e, canvas, ctx));
    canvas.addEventListener('mousemove', (e) => draw(e, canvas, ctx, isErasing));
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e.touches[0], canvas, ctx);
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e.touches[0], canvas, ctx, isErasing);
    });
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e, canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    drawing = true;
}

function draw(e, canvas, ctx, isErasing) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    
    if (isErasing) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    }
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

function activatePen(questionIndex) {
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    isErasing = false;
}

function activateEraser(questionIndex) {
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    const ctx = canvas.getContext('2d');
    isErasing = true;
}

function changeColor(questionIndex, color) {
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
}

function clearDrawing(questionIndex) {
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ==== حفظ الاختبار ====
function saveTest() {
    const title = document.getElementById('testTitle').value.trim();
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value.trim();

    if (!title || !subject) {
        showAuthNotification('يرجى ملء عنوان الاختبار والمادة', 'error');
        return;
    }

    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');
    
    if (questionItems.length === 0) {
        showAuthNotification('يرجى إضافة سؤال واحد على الأقل', 'error');
        return;
    }
    
    questionItems.forEach((item, index) => {
        const questionType = item.querySelector('.question-type').value;
        const questionText = item.querySelector('.question-text')?.value.trim() || '';
        const passingCriteria = parseInt(item.querySelector('.passing-criteria')?.value || 80);
        
        let questionData = {
            type: questionType,
            text: questionText,
            passingCriteria: passingCriteria
        };
        
        switch(questionType) {
            case 'multiple-choice':
            case 'multiple-choice-attachment':
                const choices = [];
                item.querySelectorAll('.choice-item').forEach(choiceItem => {
                    const text = choiceItem.querySelector('.choice-text').value.trim();
                    const correct = choiceItem.querySelector('.choice-correct').checked;
                    if (text) {
                        choices.push({ text, correct });
                    }
                });
                questionData.choices = choices;
                
                if (questionType === 'multiple-choice-attachment') {
                    const fileInput = item.querySelector('.attachment-file');
                    if (fileInput && fileInput.files[0]) {
                        questionData.attachment = {
                            name: fileInput.files[0].name,
                            type: fileInput.files[0].type,
                            size: fileInput.files[0].size
                        };
                    }
                }
                break;
                
            case 'open-ended':
                const modelAnswer = item.querySelector('.model-answer')?.value.trim() || '';
                questionData.modelAnswer = modelAnswer;
                break;
                
            case 'reading-auto':
            case 'spelling-auto':
                const words = [];
                item.querySelectorAll('.word-item .word-text').forEach(wordInput => {
                    if (wordInput.value.trim()) {
                        words.push(wordInput.value.trim());
                    }
                });
                questionData.words = words;
                questionData.instructions = item.querySelector('.instructions')?.value.trim() || '';
                break;
                
            case 'drag-drop':
                const draggableItems = [];
                item.querySelectorAll('.draggable-item .draggable-text').forEach(input => {
                    if (input.value.trim()) {
                        draggableItems.push(input.value.trim());
                    }
                });
                
                const dropZones = [];
                item.querySelectorAll('.drop-zone-item').forEach(zoneItem => {
                    const label = zoneItem.querySelector('.drop-zone-label').value.trim();
                    const correctItem = zoneItem.querySelector('.correct-item').value.trim();
                    if (label && correctItem) {
                        dropZones.push({ label, correctItem });
                    }
                });
                
                questionData.draggableItems = draggableItems;
                questionData.dropZones = dropZones;
                break;
                
            case 'reading-manual':
            case 'spelling-manual':
            case 'missing-letter':
                questionData.content = item.querySelector('.content-text')?.value.trim() || '';
                questionData.correctionInstructions = item.querySelector('.correction-instructions')?.value.trim() || '';
                // يمكن حفظ حالة الرسم هنا إذا لزم الأمر
                break;
        }
        
        questions.push(questionData);
    });

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentTeacher = getCurrentUser();

    if (currentTestEditing) {
        // تحديث الاختبار الحالي
        const testIndex = tests.findIndex(t => t.id === currentTestEditing.id);
        if (testIndex !== -1) {
            tests[testIndex] = {
                ...tests[testIndex],
                title,
                subject,
                description,
                questions,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // إنشاء اختبار جديد
        const newTest = {
            id: generateId(),
            teacherId: currentTeacher.id,
            title: title,
            subject: subject,
            description: description,
            questions: questions,
            objectivesLinked: false,
            linkedObjectives: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tests.push(newTest);
    }

    localStorage.setItem('tests', JSON.stringify(tests));

    showAuthNotification(currentTestEditing ? 'تم تحديث الاختبار بنجاح' : 'تم حفظ الاختبار بنجاح', 'success');
    closeCreateTestModal();
    loadTests();
}

// ==== ربط الأهداف القصيرة ====
function linkTestObjectives(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) return;
    
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية الأهداف الخاصة بالمعلم الحالي ونفس المادة
    const relevantObjectives = objectives.filter(obj => 
        obj.teacherId === currentTeacher.id && 
        obj.subject === test.subject
    );
    
    if (relevantObjectives.length === 0) {
        showAuthNotification('لا توجد أهداف قصيرة مرتبطة بهذه المادة', 'warning');
        return;
    }
    
    // تهيئة واجهة الربط
    currentQuestionIndex = 0;
    linkedObjectives = test.linkedObjectives || {};
    
    showLinkObjectivesModal(test, relevantObjectives);
}

function showLinkObjectivesModal(test, objectives) {
    const modal = document.getElementById('linkObjectivesModal');
    if (!modal) {
        createLinkObjectivesModal();
    }
    
    document.getElementById('linkObjectivesTitle').textContent = `ربط أهداف اختبار: ${test.title}`;
    document.getElementById('linkObjectivesProgress').textContent = `السؤال 1 من ${test.questions.length}`;
    document.getElementById('linkObjectivesNextBtn').style.display = test.questions.length > 1 ? 'inline-block' : 'none';
    document.getElementById('linkObjectivesFinishBtn').style.display = test.questions.length === 1 ? 'inline-block' : 'none';
    
    // عرض السؤال الحالي
    const currentQuestion = test.questions[currentQuestionIndex];
    document.getElementById('currentQuestionText').textContent = currentQuestion.text || `السؤال ${currentQuestionIndex + 1}`;
    
    // عرض الأهداف المتاحة
    const objectivesList = document.getElementById('objectivesChecklist');
    objectivesList.innerHTML = objectives.map(obj => `
        <div class="objective-checkbox-item">
            <label class="checkbox-label">
                <input type="radio" 
                       name="objective-${currentQuestionIndex}" 
                       value="${obj.id}"
                       ${linkedObjectives[currentQuestionIndex] === obj.id ? 'checked' : ''}
                       onchange="selectObjective(${currentQuestionIndex}, ${obj.id})">
                <span class="checkbox-custom"></span>
                <span class="objective-text">${obj.shortTerm}</span>
            </label>
        </div>
    `).join('');
    
    modal.classList.add('show');
}

function createLinkObjectivesModal() {
    const modalHTML = `
        <div id="linkObjectivesModal" class="modal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3 id="linkObjectivesTitle">ربط الأهداف القصيرة</h3>
                    <button class="modal-close" onclick="closeLinkObjectivesModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="link-objectives-container">
                        <div class="current-question-section">
                            <h4>السؤال الحالي:</h4>
                            <div class="question-preview" id="currentQuestionText"></div>
                        </div>
                        
                        <div class="objectives-section">
                            <h4>اختر هدف قصير واحد:</h4>
                            <div class="objectives-checklist" id="objectivesChecklist">
                                <!-- الأهداف ستظهر هنا -->
                            </div>
                        </div>
                        
                        <div class="link-progress">
                            <div class="progress-text" id="linkObjectivesProgress"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="prevQuestion()" id="linkObjectivesPrevBtn" style="display: none;">السابق</button>
                    <button class="btn btn-primary" onclick="nextQuestion()" id="linkObjectivesNextBtn">التالي</button>
                    <button class="btn btn-success" onclick="finishLinking()" id="linkObjectivesFinishBtn">إنهاء الربط</button>
                    <button class="btn btn-danger" onclick="closeLinkObjectivesModal()">إلغاء</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function selectObjective(questionIndex, objectiveId) {
    linkedObjectives[questionIndex] = objectiveId;
}

function nextQuestion() {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testId = parseInt(document.getElementById('linkObjectivesTitle').textContent.split(':')[1].trim());
    const test = tests.find(t => t.title.includes(testId));
    
    if (!test) return;
    
    if (!linkedObjectives[currentQuestionIndex]) {
        showAuthNotification('يرجى اختيار هدف قصير للسؤال الحالي', 'warning');
        return;
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < test.questions.length) {
        updateLinkObjectivesUI(test);
    } else {
        finishLinking();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const testId = parseInt(document.getElementById('linkObjectivesTitle').textContent.split(':')[1].trim());
        const test = tests.find(t => t.title.includes(testId));
        
        if (test) {
            updateLinkObjectivesUI(test);
        }
    }
}

function updateLinkObjectivesUI(test) {
    document.getElementById('linkObjectivesProgress').textContent = 
        `السؤال ${currentQuestionIndex + 1} من ${test.questions.length}`;
    
    document.getElementById('linkObjectivesPrevBtn').style.display = 
        currentQuestionIndex > 0 ? 'inline-block' : 'none';
    
    document.getElementById('linkObjectivesNextBtn').style.display = 
        currentQuestionIndex < test.questions.length - 1 ? 'inline-block' : 'none';
    
    document.getElementById('linkObjectivesFinishBtn').style.display = 
        currentQuestionIndex === test.questions.length - 1 ? 'inline-block' : 'none';
    
    // تحديث السؤال المعروض
    const currentQuestion = test.questions[currentQuestionIndex];
    document.getElementById('currentQuestionText').textContent = 
        currentQuestion.text || `السؤال ${currentQuestionIndex + 1}`;
    
    // تحديث اختيار الهدف
    const selectedObjective = linkedObjectives[currentQuestionIndex];
    const checkboxes = document.querySelectorAll(`input[name="objective-${currentQuestionIndex}"]`);
    checkboxes.forEach(cb => {
        cb.checked = cb.value === selectedObjective;
    });
}

function finishLinking() {
    if (!linkedObjectives[currentQuestionIndex]) {
        showAuthNotification('يرجى اختيار هدف قصير للسؤال الأخير', 'warning');
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testTitle = document.getElementById('linkObjectivesTitle').textContent.split(':')[1].trim();
    const testIndex = tests.findIndex(t => t.title === testTitle);
    
    if (testIndex !== -1) {
        tests[testIndex].linkedObjectives = { ...linkedObjectives };
        tests[testIndex].objectivesLinked = Object.keys(linkedObjectives).length > 0;
        localStorage.setItem('tests', JSON.stringify(tests));
        
        showAuthNotification('تم ربط الأهداف بنجاح', 'success');
        closeLinkObjectivesModal();
        loadTests();
    }
}

function closeLinkObjectivesModal() {
    const modal = document.getElementById('linkObjectivesModal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentQuestionIndex = 0;
    linkedObjectives = {};
}

// ==== تصدير الاختبار ====
function exportTest(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // إنشاء نسخة من الاختبار بدون الأهداف المربوطة
    const exportData = {
        ...test,
        id: generateId(), // توليد معرف جديد
        teacherId: null, // إزالة معرف المعلم
        objectivesLinked: false,
        linkedObjectives: {},
        createdAt: new Date().toISOString(),
        isExported: true
    };
    
    // حذف المرفقات الكبيرة إذا وجدت
    if (exportData.questions) {
        exportData.questions = exportData.questions.map(q => {
            const { attachment, ...rest } = q;
            return rest;
        });
    }
    
    // تحويل البيانات إلى JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // إنشاء ملف للتحميل
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `اختبار_${test.title.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAuthNotification('تم تصدير الاختبار بنجاح', 'success');
}

// ==== استيراد الاختبار ====
function showImportModal(type) {
    if (type === 'test') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => importTest(e.target.files[0]);
        input.click();
    } else {
        showAuthNotification(`سيتم تطوير استيراد ${type} في المرحلة القادمة`, 'info');
    }
}

function importTest(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedTest = JSON.parse(e.target.result);
            
            if (!importedTest.title || !importedTest.questions) {
                throw new Error('ملف الاختبار غير صالح');
            }
            
            const currentTeacher = getCurrentUser();
            const tests = JSON.parse(localStorage.getItem('tests') || '[]');
            
            // تحديث البيانات للمعلم الجديد
            const newTest = {
                ...importedTest,
                id: generateId(),
                teacherId: currentTeacher.id,
                objectivesLinked: false,
                linkedObjectives: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            tests.push(newTest);
            localStorage.setItem('tests', JSON.stringify(tests));
            
            showAuthNotification('تم استيراد الاختبار بنجاح', 'success');
            loadTests();
            
        } catch (error) {
            showAuthNotification('فشل استيراد الملف. تأكد من صحة تنسيق الملف', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// ==== دوال مساعدة ====
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-SA', options);
}

function viewTestDetails(testId) {
    // سيتم تطوير عرض تفاصيل الاختبار في مرحلة لاحقة
    showAuthNotification('جاري عرض تفاصيل الاختبار...', 'info');
}

function editTest(testId) {
    showEditTestModal(testId);
}

function deleteTest(testId) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return;
    
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const updatedTests = tests.filter(test => test.id !== testId);
    localStorage.setItem('tests', JSON.stringify(updatedTests));
    
    showAuthNotification('تم حذف الاختبار بنجاح', 'success');
    loadTests();
}

// تصدير الدوال للاستخدام العالمي
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.changeQuestionType = changeQuestionType;
window.addChoice = addChoice;
window.saveTest = saveTest;
window.exportTest = exportTest;
window.linkTestObjectives = linkTestObjectives;
window.showImportModal = showImportModal;
window.viewTestDetails = viewTestDetails;
window.editTest = editTest;
window.deleteTest = deleteTest;

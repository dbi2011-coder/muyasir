/**
 * ملف JavaScript للاختبارات التشخيصية
 * نظام ميسر التعلم
 * تاريخ الإنشاء: 2024
 */

// بيانات الاختبارات المخزنة محلياً
let tests = [];
let currentUser = null;

// أنواع الأسئلة المتاحة
const QUESTION_TYPES = [
    {
        id: 'mcq',
        name: 'اختيار من متعدد',
        icon: '🔘',
        description: 'سؤال باختيارات متعددة'
    },
    {
        id: 'drag_drop',
        name: 'سحب وإفلات',
        icon: '🔄',
        description: 'سحب العناصر وإفلاتها في المكان المناسب'
    },
    {
        id: 'mcq_attachment',
        name: 'اختيار مع مرفق',
        icon: '📎',
        description: 'اختيار من متعدد مع مرفق (صورة/فيديو/صوت)'
    },
    {
        id: 'open_ended',
        name: 'سؤال مفتوح',
        icon: '📝',
        description: 'سؤال يتطلب إجابة نصية مفتوحة'
    },
    {
        id: 'auto_reading',
        name: 'تقييم القراءة الآلي',
        icon: '📖',
        description: 'تقييم قراءة النصوص آلياً'
    },
    {
        id: 'auto_spelling',
        name: 'تقييم الإملاء الآلي',
        icon: '✍️',
        description: 'تقييم الإملاء آلياً'
    },
    {
        id: 'manual_reading',
        name: 'تقييم القراءة اليدوي',
        icon: '👂',
        description: 'تقييم قراءة النصوص يدوياً'
    },
    {
        id: 'manual_spelling',
        name: 'تقييم الإملاء اليدوي',
        icon: '✏️',
        description: 'تقييم الإملاء يدوياً'
    },
    {
        id: 'missing_letter',
        name: 'أكمل الحرف الناقص',
        icon: '🔤',
        description: 'إكمال الكلمات بحروف ناقصة'
    }
];

// بيانات الربط الحالية
let linkingData = {
    currentQuestionIndex: 0,
    testId: null,
    questions: [],
    objectives: [],
    linkages: {}
};

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تهيئة صفحة الاختبارات التشخيصية...');
    
    // التحقق من المصادقة
    currentUser = checkAuth();
    if (!currentUser) return;
    
    // تحميل بيانات المستخدم
    loadUserInfo();
    
    // تحميل الاختبارات
    loadTests();
    
    // تحديث الإحصائيات
    updateStats();
    
    // تهيئة أزرار إضافية
    initAdditionalButtons();
});

// ============================================
// الدوال الأساسية
// ============================================

/**
 * تحميل الاختبارات من التخزين المحلي
 */
async function loadTests() {
    try {
        console.log('جاري تحميل الاختبارات...');
        
        // محاولة جلب البيانات من ملف JSON
        const response = await fetch('../../data/tests.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // تصفية الاختبارات للمعلم الحالي فقط
        tests = data.tests.filter(test => test.teacherId === currentUser.id);
        
        console.log(`تم تحميل ${tests.length} اختبار`);
        
        // عرض الاختبارات
        renderTests();
        
    } catch (error) {
        console.error('خطأ في تحميل الاختبارات:', error);
        
        // استخدام بيانات تجريبية في حالة الخطأ
        tests = getDemoTests();
        renderTests();
        
        showNotification('تم تحميل البيانات من الذاكرة المحلية', 'info');
    }
}

/**
 * إنشاء بيانات تجريبية للاختبارات
 */
function getDemoTests() {
    return [
        {
            id: 1,
            teacherId: currentUser.id,
            title: "اختبار القراءة الأساسية",
            subject: "لغتي",
            description: "اختبار تشخيصي لمهارات القراءة الأساسية",
            createdDate: "2024-01-15",
            questionCount: 10,
            objectivesLinked: true,
            status: "active",
            questions: [
                {
                    id: 1,
                    type: "mcq",
                    text: "ما هو الحرف الأول في كلمة 'قلم'؟",
                    passingCriteria: 70,
                    options: [
                        { id: 0, text: "ق" },
                        { id: 1, text: "ل" },
                        { id: 2, text: "م" },
                        { id: 3, text: "أ" }
                    ],
                    correctAnswer: 0,
                    linkedObjectiveId: 1
                }
            ]
        },
        {
            id: 2,
            teacherId: currentUser.id,
            title: "اختبار العمليات الحسابية",
            subject: "رياضيات",
            description: "اختبار تشخيصي للعمليات الحسابية الأساسية",
            createdDate: "2024-01-18",
            questionCount: 8,
            objectivesLinked: false,
            status: "active",
            questions: []
        },
        {
            id: 3,
            teacherId: currentUser.id,
            title: "اختبار الإملاء البسيط",
            subject: "لغتي",
            description: "اختبار إملائي لكلمات من ثلاث حروف",
            createdDate: "2024-01-20",
            questionCount: 5,
            objectivesLinked: false,
            status: "active",
            questions: []
        }
    ];
}

/**
 * عرض الاختبارات في القائمة
 */
function renderTests() {
    const container = document.getElementById('testsContainer');
    if (!container) {
        console.error('عنصر testsContainer غير موجود');
        return;
    }
    
    // تصفية حسب المادة
    const subjectFilter = document.getElementById('subjectFilter')?.value || 'all';
    const filteredTests = subjectFilter === 'all' 
        ? tests 
        : tests.filter(test => test.subject === subjectFilter);
    
    // ترتيب حسب المادة ثم التاريخ
    filteredTests.sort((a, b) => {
        if (a.subject !== b.subject) {
            return a.subject.localeCompare(b.subject);
        }
        return new Date(b.createdDate) - new Date(a.createdDate);
    });
    
    container.innerHTML = '';
    
    if (filteredTests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات</h3>
                <p>لم تقم بإنشاء أي اختبارات بعد. ابدأ بإنشاء اختبار جديد.</p>
                <button class="btn btn-success" onclick="createNewTest()">
                    <span class="btn-icon">➕</span> إنشاء اختبار جديد
                </button>
            </div>
        `;
        return;
    }
    
    filteredTests.forEach(test => {
        const testCard = createTestCard(test);
        container.appendChild(testCard);
    });
}

/**
 * إنشاء بطاقة عرض للاختبار
 */
function createTestCard(test) {
    const card = document.createElement('div');
    card.className = `test-card ${test.subject === 'لغتي' ? 'language' : 'math'}`;
    
    card.innerHTML = `
        <div class="test-header">
            <h4 class="test-title">${test.title}</h4>
            <span class="test-status ${test.objectivesLinked ? 'status-linked' : 'status-not-linked'}">
                ${test.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}
            </span>
        </div>
        
        <div class="test-meta">
            <div class="test-meta-item">
                <span class="material-icon">📚</span>
                <span>المادة: ${test.subject}</span>
            </div>
            <div class="test-meta-item">
                <span class="material-icon">📅</span>
                <span>تاريخ الإضافة: ${formatDateShort(test.createdDate)}</span>
            </div>
            <div class="test-meta-item">
                <span class="material-icon">❓</span>
                <span>عدد الأسئلة: ${test.questionCount}</span>
            </div>
        </div>
        
        <div class="test-description">
            <p>${test.description || 'لا يوجد وصف'}</p>
        </div>
        
        <div class="test-actions">
            <button class="btn btn-primary btn-sm" onclick="viewTest(${test.id})">
                <span class="btn-icon">👁️</span> عرض
            </button>
            <button class="btn btn-warning btn-sm" onclick="editTest(${test.id})">
                <span class="btn-icon">✏️</span> تعديل
            </button>
            <button class="btn btn-export btn-sm" onclick="exportTest(${test.id})">
                <span class="btn-icon">📤</span> تصدير
            </button>
            <button class="btn btn-link btn-sm" onclick="linkObjectives(${test.id})" 
                ${test.objectivesLinked ? 'disabled' : ''}>
                <span class="btn-icon">🔗</span> ربط الأهداف
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteTest(${test.id})">
                <span class="btn-icon">🗑️</span> حذف
            </button>
        </div>
    `;
    
    return card;
}

/**
 * تحديث إحصائيات الاختبارات
 */
function updateStats() {
    const totalTests = tests.length;
    const activeTests = tests.filter(t => t.status === 'active').length;
    const pendingTests = tests.filter(t => !t.objectivesLinked).length;
    
    document.getElementById('totalTests').textContent = totalTests;
    document.getElementById('activeTests').textContent = activeTests;
    document.getElementById('pendingTests').textContent = pendingTests;
}

/**
 * تصفية الاختبارات حسب المادة
 */
function filterTests() {
    renderTests();
}

/**
 * ترتيب الاختبارات
 */
function sortTests() {
    const sortBy = document.getElementById('sortFilter').value;
    
    if (sortBy === 'date') {
        tests.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    } else if (sortBy === 'subject') {
        tests.sort((a, b) => a.subject.localeCompare(b.subject));
    }
    
    renderTests();
}

// ============================================
// إدارة الاختبارات
// ============================================

/**
 * إنشاء اختبار جديد
 */
function createNewTest() {
    showTestModal('new');
}

/**
 * استيراد اختبار من ملف
 */
function importTest() {
    // إنشاء عنصر إدخال ملف مخفي
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.txt';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedTest = JSON.parse(event.target.result);
                    
                    // التحقق من صحة الملف
                    if (!importedTest.title || !importedTest.subject) {
                        throw new Error('ملف غير صالح: بيانات ناقصة');
                    }
                    
                    // تعيين المعرف والمعلم
                    importedTest.id = generateId();
                    importedTest.teacherId = currentUser.id;
                    importedTest.createdDate = new Date().toISOString().split('T')[0];
                    importedTest.objectivesLinked = false;
                    importedTest.status = 'active';
                    
                    // إضافة للقائمة
                    tests.push(importedTest);
                    
                    // حفظ في التخزين
                    saveToLocalStorage();
                    
                    // تحديث العرض
                    renderTests();
                    updateStats();
                    
                    showNotification('تم استيراد الاختبار بنجاح', 'success');
                } catch (error) {
                    console.error('خطأ في قراءة الملف:', error);
                    showNotification('خطأ في قراءة الملف: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

/**
 * عرض تفاصيل الاختبار
 */
function viewTest(testId) {
    const test = tests.find(t => t.id === testId);
    if (test) {
        showTestViewModal(test);
    }
}

/**
 * تعديل اختبار
 */
function editTest(testId) {
    const test = tests.find(t => t.id === testId);
    if (test) {
        showTestModal('edit', test);
    }
}

/**
 * تصدير اختبار إلى ملف
 */
function exportTest(testId) {
    const test = tests.find(t => t.id === testId);
    if (!test) {
        showNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // إنشاء نسخة من الاختبار بدون الأهداف المربوطة
    const exportData = { ...test };
    delete exportData.objectivesLinked;
    delete exportData.teacherId;
    
    // إزالة الربط من الأسئلة إن وجد
    if (exportData.questions) {
        exportData.questions = exportData.questions.map(q => {
            const questionCopy = { ...q };
            delete questionCopy.linkedObjectiveId;
            return questionCopy;
        });
    }
    
    // تحويل إلى JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // إنشاء رابط تنزيل
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = `${test.title.replace(/\s+/g, '_')}_${test.subject}.json`;
    
    // إضافة للصفحة والنقر ثم الإزالة
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // تحرير الذاكرة
    URL.revokeObjectURL(downloadLink.href);
    
    showNotification('تم تصدير الاختبار بنجاح', 'success');
}

/**
 * حذف اختبار
 */
function deleteTest(testId) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟ سيتم حذف جميع الأسئلة المرتبطة به.')) {
        return;
    }
    
    const index = tests.findIndex(t => t.id === testId);
    if (index !== -1) {
        tests.splice(index, 1);
        
        // حفظ في التخزين
        saveToLocalStorage();
        
        // تحديث العرض
        renderTests();
        updateStats();
        
        showNotification('تم حذف الاختبار بنجاح', 'success');
    }
}

// ============================================
// النماذج المنبثقة
// ============================================

/**
 * عرض نموذج إنشاء/تعديل اختبار
 */
function showTestModal(mode, test = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'testModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${mode === 'new' ? 'إنشاء اختبار تشخيصي جديد' : 'تعديل الاختبار'}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="testForm">
                    <div class="form-group">
                        <label for="testTitle">عنوان الاختبار *</label>
                        <input type="text" id="testTitle" required 
                            value="${test ? test.title : ''}"
                            placeholder="مثال: اختبار القراءة الأساسية">
                    </div>
                    
                    <div class="form-group">
                        <label for="testSubject">المادة *</label>
                        <select id="testSubject" required>
                            <option value="">اختر المادة</option>
                            <option value="لغتي" ${test?.subject === 'لغتي' ? 'selected' : ''}>لغتي</option>
                            <option value="رياضيات" ${test?.subject === 'رياضيات' ? 'selected' : ''}>رياضيات</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="testDescription">وصف الاختبار (اختياري)</label>
                        <textarea id="testDescription" rows="3" 
                            placeholder="وصف مختصر للاختبار وأهدافه">${test ? test.description : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <h4>إضافة الأسئلة</h4>
                        <p class="text-muted">أضف أنواع مختلفة من الأسئلة حسب احتياجاتك</p>
                        <div class="question-type-selector" id="questionTypes">
                            <!-- أنواع الأسئلة سيتم تعبئتها بواسطة JavaScript -->
                        </div>
                    </div>
                    
                    <div class="questions-container" id="questionsContainer">
                        <!-- الأسئلة المضافة ستظهر هنا -->
                    </div>
                    
                    <div class="add-question-section">
                        <button type="button" class="btn btn-primary" onclick="addQuestion()">
                            <span class="btn-icon">➕</span> إضافة سؤال جديد
                        </button>
                        <p class="text-muted">اضغط لإضافة سؤال جديد من الأنواع المتاحة</p>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
                        <button type="submit" class="btn btn-success">${mode === 'new' ? 'إنشاء الاختبار' : 'حفظ التغييرات'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').appendChild(modal);
    
    // تحميل أنواع الأسئلة
    loadQuestionTypes();
    
    // تحميل الأسئلة الحالية إن وجدت
    if (test && test.questions) {
        loadTestQuestions(test.questions);
    }
    
    // إضافة معالج النموذج
    document.getElementById('testForm').onsubmit = function(e) {
        e.preventDefault();
        saveTest(mode, test?.id);
    };
}

/**
 * عرض نموذج معاينة الاختبار
 */
function showTestViewModal(test) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${test.title}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="test-info">
                    <div class="info-row">
                        <strong>المادة:</strong> <span class="badge ${test.subject === 'لغتي' ? 'badge-primary' : 'badge-danger'}">${test.subject}</span>
                    </div>
                    <div class="info-row">
                        <strong>تاريخ الإنشاء:</strong> ${formatDate(test.createdDate)}
                    </div>
                    <div class="info-row">
                        <strong>عدد الأسئلة:</strong> ${test.questionCount}
                    </div>
                    <div class="info-row">
                        <strong>حالة الربط:</strong> 
                        <span class="status ${test.objectivesLinked ? 'status-success' : 'status-warning'}">
                            ${test.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}
                        </span>
                    </div>
                </div>
                
                <div class="test-description-view">
                    <h4>وصف الاختبار:</h4>
                    <p>${test.description || 'لا يوجد وصف'}</p>
                </div>
                
                ${test.questions && test.questions.length > 0 ? `
                    <div class="questions-preview">
                        <h4>الأسئلة (${test.questions.length})</h4>
                        <div class="questions-list">
                            ${test.questions.map((q, index) => `
                                <div class="question-preview">
                                    <div class="question-header">
                                        <span class="question-number">السؤال ${index + 1}</span>
                                        <span class="question-type">${getQuestionTypeName(q.type)}</span>
                                    </div>
                                    <p class="question-text">${q.text}</p>
                                    ${q.passingCriteria ? `<small>محك الاجتياز: ${q.passingCriteria}%</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : '<p class="text-muted">لا توجد أسئلة مضافة بعد</p>'}
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="editTest(${test.id}); closeModal();">
                        <span class="btn-icon">✏️</span> تعديل الاختبار
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal()">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').appendChild(modal);
}

// ============================================
// إدارة الأسئلة
// ============================================

/**
 * تحميل أنواع الأسئلة في النموذج
 */
function loadQuestionTypes() {
    const container = document.getElementById('questionTypes');
    if (!container) return;
    
    container.innerHTML = '';
    
    QUESTION_TYPES.forEach(type => {
        const typeCard = document.createElement('div');
        typeCard.className = 'question-type-card';
        typeCard.dataset.type = type.id;
        typeCard.innerHTML = `
            <span class="question-type-icon">${type.icon}</span>
            <h5>${type.name}</h5>
            <p class="text-muted">${type.description}</p>
        `;
        typeCard.onclick = () => selectQuestionType(type.id);
        container.appendChild(typeCard);
    });
}

/**
 * تحميل الأسئلة الحالية للنموذج
 */
function loadTestQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    if (!container || !questions) return;
    
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        addQuestionToForm(question.type, question);
    });
}

/**
 * إضافة سؤال جديد
 */
function addQuestion() {
    // عرض قائمة أنواع الأسئلة
    const questionTypeModal = `
        <div class="modal active" id="questionTypeModal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>اختر نوع السؤال</h3>
                    <button class="modal-close" onclick="closeModalById('questionTypeModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="question-type-selection">
                        ${QUESTION_TYPES.map(type => `
                            <div class="type-option" onclick="selectQuestionType('${type.id}'); closeModalById('questionTypeModal');">
                                <span class="type-icon">${type.icon}</span>
                                <div class="type-info">
                                    <h5>${type.name}</h5>
                                    <p>${type.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML += questionTypeModal;
}

/**
 * اختيار نوع السؤال
 */
function selectQuestionType(typeId) {
    // إزالة التحديد من جميع البطاقات
    document.querySelectorAll('.question-type-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // تحديد البطاقة المختارة
    const selectedCard = document.querySelector(`[data-type="${typeId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // إضافة السؤال للنموذج
    addQuestionToForm(typeId);
}

/**
 * إضافة سؤال للنموذج
 */
function addQuestionToForm(typeId, existingQuestion = null) {
    const container = document.getElementById('questionsContainer');
    if (!container) return;
    
    // إنقال للسؤال الجديد
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-form';
    questionDiv.dataset.type = typeId;
    
    // إنشاء معرف فريد للسؤال
    const questionId = existingQuestion ? existingQuestion.id : `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    questionDiv.id = questionId;
    
    // بناء النموذج حسب النوع
    let formContent = `
        <div class="question-header">
            <h5>${getQuestionTypeName(typeId)}</h5>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeQuestion('${questionId}')">
                <span class="btn-icon">🗑️</span> حذف
            </button>
        </div>
        
        <div class="form-group">
            <label>نص السؤال *</label>
            <textarea class="question-text" placeholder="أدخل نص السؤال..." required>${existingQuestion?.text || ''}</textarea>
        </div>
    `;
    
    // إضافة حقول خاصة بكل نوع
    switch(typeId) {
        case 'mcq':
            formContent += buildMCQForm(existingQuestion);
            break;
        case 'drag_drop':
            formContent += buildDragDropForm(existingQuestion);
            break;
        case 'auto_reading':
            formContent += buildAutoReadingForm(existingQuestion);
            break;
        case 'auto_spelling':
            formContent += buildAutoSpellingForm(existingQuestion);
            break;
        case 'missing_letter':
            formContent += buildMissingLetterForm(existingQuestion);
            break;
        default:
            formContent += buildBasicForm(existingQuestion);
    }
    
    // إضافة محك الاجتياز
    formContent += `
        <div class="form-group passing-criteria">
            <label>محك الاجتياز (نسبة %) *</label>
            <input type="range" class="range-slider" min="0" max="100" value="${existingQuestion?.passingCriteria || 70}" 
                   oninput="updatePassingValue(this)">
            <div class="range-value">
                <span class="passing-value">${existingQuestion?.passingCriteria || 70}</span>%
            </div>
        </div>
    `;
    
    questionDiv.innerHTML = formContent;
    container.appendChild(questionDiv);
}

/**
 * بناء نموذج MCQ
 */
function buildMCQForm(existingQuestion) {
    const options = existingQuestion?.options || [
        { id: 0, text: '' },
        { id: 1, text: '' }
    ];
    
    let optionsHTML = '';
    options.forEach((option, index) => {
        optionsHTML += `
            <div class="option-item">
                <input type="radio" name="correctAnswer_${Date.now()}" 
                       value="${option.id}" ${existingQuestion?.correctAnswer === option.id ? 'checked' : ''}>
                <input type="text" class="option-text" placeholder="الخيار ${index + 1}" 
                       value="${option.text}" required>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeOption(this)" ${options.length <= 2 ? 'disabled' : ''}>✕</button>
            </div>
        `;
    });
    
    return `
        <div class="form-group">
            <label>الخيارات *</label>
            <div class="options-container">
                ${optionsHTML}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addOption(this)">
                <span class="btn-icon">➕</span> إضافة خيار
            </button>
        </div>
    `;
}

/**
 * بناء نموذج تقييم القراءة الآلي
 */
function buildAutoReadingForm(existingQuestion) {
    return `
        <div class="form-group">
            <label>النص للقراءة *</label>
            <textarea class="reading-text" placeholder="أدخل النص الذي سيقوم الطالب بقراءته..." 
                      rows="4" required>${existingQuestion?.readingText || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label>إعدادات التسجيل</label>
            <div class="recording-settings">
                <label>
                    <input type="checkbox" class="allow-rerecord" ${existingQuestion?.allowRerecord !== false ? 'checked' : ''}>
                    السماح بإعادة التسجيل
                </label>
                <label>
                    عدد المحاولات: 
                    <input type="number" class="max-attempts" min="1" max="5" value="${existingQuestion?.maxAttempts || 3}">
                </label>
            </div>
        </div>
    `;
}

/**
 * بناء نموذج تقييم الإملاء الآلي
 */
function buildAutoSpellingForm(existingQuestion) {
    const words = existingQuestion?.words || [''];
    
    let wordsHTML = '';
    words.forEach((word, index) => {
        wordsHTML += `
            <div class="spelling-word">
                <input type="text" class="word-to-spell" placeholder="الكلمة ${index + 1}" value="${word}" required>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeSpellingWord(this)" ${words.length <= 1 ? 'disabled' : ''}>✕</button>
            </div>
        `;
    });
    
    return `
        <div class="form-group">
            <label>الكلمات للإملاء *</label>
            <div class="spelling-words">
                ${wordsHTML}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addSpellingWord(this)">
                <span class="btn-icon">➕</span> إضافة كلمة
            </button>
        </div>
    `;
}

/**
 * بناء نموذج إكمال الحرف الناقص
 */
function buildMissingLetterForm(existingQuestion) {
    return `
        <div class="form-group">
            <label>الكلمة أو الجملة *</label>
            <input type="text" class="sentence-input" 
                   placeholder="مثال: ق_م" 
                   value="${existingQuestion?.sentence || ''}"
                   oninput="updateMissingLetterPreview(this)" required>
        </div>
        
        <div class="form-group">
            <label>عدد المحاولات المسموحة</label>
            <input type="number" class="attempts-allowed" min="1" max="5" value="${existingQuestion?.attemptsAllowed || 2}">
        </div>
    `;
}

/**
 * بناء نموذج أساسي
 */
function buildBasicForm(existingQuestion) {
    return `
        <div class="form-group">
            <label>الإجابة النموذجية (اختياري)</label>
            <textarea class="model-answer" placeholder="أدخل الإجابة النموذجية إن وجدت...">${existingQuestion?.modelAnswer || ''}</textarea>
        </div>
    `;
}

/**
 * حذف سؤال
 */
function removeQuestion(questionId) {
    const questionElement = document.getElementById(questionId);
    if (questionElement && confirm('هل تريد حذف هذا السؤال؟')) {
        questionElement.remove();
    }
}

/**
 * تحديث قيمة محك الاجتياز
 */
function updatePassingValue(slider) {
    const valueSpan = slider.parentElement.querySelector('.passing-value');
    if (valueSpan) {
        valueSpan.textContent = slider.value;
    }
}

// ============================================
// حفظ الاختبار
// ============================================

/**
 * حفظ الاختبار
 */
function saveTest(mode, testId = null) {
    const form = document.getElementById('testForm');
    if (!form.checkValidity()) {
        showNotification('يرجى ملء جميع الحقول الإلزامية', 'warning');
        return;
    }
    
    // جمع بيانات الاختبار
    const testData = {
        title: document.getElementById('testTitle').value,
        subject: document.getElementById('testSubject').value,
        description: document.getElementById('testDescription').value || '',
        questions: collectQuestionsData(),
        createdDate: new Date().toISOString().split('T')[0],
        objectivesLinked: false,
        status: 'active',
        teacherId: currentUser.id
    };
    
    if (mode === 'new') {
        testData.id = generateId();
        tests.push(testData);
    } else if (mode === 'edit' && testId) {
        const index = tests.findIndex(t => t.id === testId);
        if (index !== -1) {
            testData.id = testId;
            tests[index] = testData;
        }
    }
    
    // تحديث عدد الأسئلة
    testData.questionCount = testData.questions.length;
    
    // حفظ في التخزين
    saveToLocalStorage();
    
    // تحديث العرض
    renderTests();
    updateStats();
    
    // إغلاق النموذج
    closeModal();
    
    showNotification(`تم ${mode === 'new' ? 'إنشاء' : 'تحديث'} الاختبار بنجاح`, 'success');
}

/**
 * جمع بيانات الأسئلة
 */
function collectQuestionsData() {
    const questions = [];
    const questionForms = document.querySelectorAll('.question-form');
    
    questionForms.forEach((form, index) => {
        const question = {
            id: index + 1,
            type: form.dataset.type,
            text: form.querySelector('.question-text')?.value || '',
            passingCriteria: parseInt(form.querySelector('.range-slider')?.value || 70)
        };
        
        // جمع بيانات إضافية حسب نوع السؤال
        switch(question.type) {
            case 'mcq':
                question.options = collectMCQOptions(form);
                question.correctAnswer = collectCorrectAnswer(form);
                break;
            case 'auto_reading':
                question.readingText = form.querySelector('.reading-text')?.value || '';
                question.allowRerecord = form.querySelector('.allow-rerecord')?.checked || false;
                question.maxAttempts = parseInt(form.querySelector('.max-attempts')?.value || 3);
                break;
            case 'auto_spelling':
                question.words = collectSpellingWords(form);
                break;
            case 'missing_letter':
                question.sentence = form.querySelector('.sentence-input')?.value || '';
                question.missingChar = extractMissingChar(question.sentence);
                question.attemptsAllowed = parseInt(form.querySelector('.attempts-allowed')?.value || 2);
                break;
            default:
                question.modelAnswer = form.querySelector('.model-answer')?.value || '';
        }
        
        questions.push(question);
    });
    
    return questions;
}

/**
 * جمع خيارات MCQ
 */
function collectMCQOptions(form) {
    const options = [];
    form.querySelectorAll('.option-item').forEach((item, index) => {
        const text = item.querySelector('.option-text')?.value;
        if (text) {
            options.push({
                id: index,
                text: text
            });
        }
    });
    return options;
}

/**
 * جمع الإجابة الصحيحة لـ MCQ
 */
function collectCorrectAnswer(form) {
    const selectedRadio = form.querySelector('input[type="radio"]:checked');
    return selectedRadio ? parseInt(selectedRadio.value) : 0;
}

/**
 * جمع كلمات الإملاء
 */
function collectSpellingWords(form) {
    const words = [];
    form.querySelectorAll('.word-to-spell').forEach(input => {
        if (input.value.trim()) {
            words.push(input.value.trim());
        }
    });
    return words;
}

/**
 * استخراج الحرف الناقص
 */
function extractMissingChar(sentence) {
    const match = sentence.match(/_(.)/);
    return match ? match[1] : '';
}

// ============================================
// ربط الأهداف القصيرة
// ============================================

/**
 * عرض واجهة ربط الأهداف
 */
async function linkObjectives(testId) {
    const test = tests.find(t => t.id === testId);
    if (!test) {
        showNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    if (!test.questions || test.questions.length === 0) {
        showNotification('لا يوجد أسئلة في هذا الاختبار', 'warning');
        return;
    }
    
    // تحميل الأهداف القصيرة
    const objectives = await loadObjectives();
    const filteredObjectives = objectives.filter(obj => obj.subject === test.subject);
    
    if (filteredObjectives.length === 0) {
        showNotification('لا توجد أهداف قصيرة لهذه المادة', 'warning');
        return;
    }
    
    // تهيئة بيانات الربط
    linkingData = {
        currentQuestionIndex: 0,
        testId: testId,
        questions: test.questions,
        objectives: filteredObjectives,
        linkages: {}
    };
    
    // عرض واجهة الربط
    showLinkingModal();
}

/**
 * تحميل الأهداف القصيرة
 */
async function loadObjectives() {
    try {
        const response = await fetch('../../data/objectives.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        return data.objectives.filter(obj => obj.teacherId === currentUser.id);
        
    } catch (error) {
        console.error('خطأ في تحميل الأهداف:', error);
        return getDemoObjectives();
    }
}

/**
 * عرض واجهة الربط
 */
function showLinkingModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active linking-modal';
    modal.id = 'linkingModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>ربط الأهداف القصيرة بالأسئلة</h3>
                <button class="modal-close" onclick="closeLinkingModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="linking-progress">
                    <h4>السؤال <span id="currentQuestionNum">1</span> من <span id="totalQuestions">${linkingData.questions.length}</span></h4>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width: ${(1/linkingData.questions.length)*100}%"></div>
                    </div>
                </div>
                
                <div class="current-question">
                    <h5>السؤال الحالي:</h5>
                    <div class="question-content" id="currentQuestionContent">
                        <!-- سيتم تعبئته -->
                    </div>
                </div>
                
                <div class="objectives-section">
                    <h5>اختر الهدف القصير المناسب:</h5>
                    <div class="objectives-list" id="objectivesList">
                        <!-- سيتم تعبئته -->
                    </div>
                    
                    <div class="selected-objective" id="selectedObjective" style="display: none;">
                        <h6>الهدف المختار:</h6>
                        <p id="selectedObjectiveText"></p>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="deselectObjective()">
                            <span class="btn-icon">✕</span> إلغاء الاختيار
                        </button>
                    </div>
                </div>
                
                <div class="linking-navigation">
                    <button class="btn btn-secondary" id="prevBtn" onclick="previousLinkingQuestion()" disabled>
                        السابق
                    </button>
                    <button class="btn btn-primary" id="nextBtn" onclick="nextLinkingQuestion()">
                        ${linkingData.currentQuestionIndex === linkingData.questions.length - 1 ? 'إنهاء الربط' : 'التالي'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').appendChild(modal);
    loadLinkingQuestion();
}

/**
 * تحميل السؤال الحالي في واجهة الربط
 */
function loadLinkingQuestion() {
    const currentQuestion = linkingData.questions[linkingData.currentQuestionIndex];
    const totalQuestions = linkingData.questions.length;
    
    // تحديث الأرقام
    document.getElementById('currentQuestionNum').textContent = linkingData.currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    
    // تحديث شريط التقدم
    const progress = ((linkingData.currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // عرض السؤال
    const questionContent = document.getElementById('currentQuestionContent');
    questionContent.innerHTML = renderQuestionForLinking(currentQuestion);
    
    // تحميل قائمة الأهداف
    loadObjectivesList();
    
    // التحقق إذا كان السؤال مربوطاً مسبقاً
    const currentLinkage = linkingData.linkages[linkingData.currentQuestionIndex];
    if (currentLinkage) {
        selectObjectiveForQuestion(currentLinkage);
    }
    
    // تحديث أزرار التنقل
    updateLinkingNavigation();
}

/**
 * تحميل قائمة الأهداف
 */
function loadObjectivesList() {
    const container = document.getElementById('objectivesList');
    container.innerHTML = '';
    
    linkingData.objectives.forEach((objective) => {
        const objectiveDiv = document.createElement('div');
        objectiveDiv.className = 'objective-item';
        objectiveDiv.dataset.objectiveId = objective.id;
        
        objectiveDiv.innerHTML = `
            <input type="radio" 
                   name="selectedObjective" 
                   id="obj_${objective.id}" 
                   value="${objective.id}"
                   onchange="handleObjectiveSelection(${objective.id})">
            <label for="obj_${objective.id}" class="objective-text">
                <h6>${objective.title}</h6>
                <p>${objective.description || 'لا يوجد وصف'}</p>
            </label>
        `;
        
        container.appendChild(objectiveDiv);
    });
}

/**
 * التعامل مع اختيار الهدف
 */
function handleObjectiveSelection(objectiveId) {
    const objective = linkingData.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return;
    
    // حفظ الربط
    linkingData.linkages[linkingData.currentQuestionIndex] = {
        questionIndex: linkingData.currentQuestionIndex,
        objectiveId: objectiveId,
        objectiveTitle: objective.title
    };
    
    // عرض الهدف المختار
    const selectedDiv = document.getElementById('selectedObjective');
    const selectedText = document.getElementById('selectedObjectiveText');
    
    selectedText.textContent = objective.title;
    selectedDiv.style.display = 'block';
    
    // إخفاء قائمة الأهداف
    document.getElementById('objectivesList').style.display = 'none';
}

/**
 * إلغاء اختيار الهدف
 */
function deselectObjective() {
    delete linkingData.linkages[linkingData.currentQuestionIndex];
    
    document.getElementById('selectedObjective').style.display = 'none';
    document.getElementById('objectivesList').style.display = 'block';
    
    // إلغاء تحديد الراديو
    const radio = document.querySelector('input[name="selectedObjective"]:checked');
    if (radio) radio.checked = false;
}

/**
 * اختيار الهدف للسؤال الحالي
 */
function selectObjectiveForQuestion(linkage) {
    const radio = document.getElementById(`obj_${linkage.objectiveId}`);
    if (radio) {
        radio.checked = true;
        handleObjectiveSelection(linkage.objectiveId);
    }
}

/**
 * التحرك بين الأسئلة في الربط
 */
function nextLinkingQuestion() {
    // التحقق من ربط السؤال الحالي
    if (!linkingData.linkages[linkingData.currentQuestionIndex]) {
        showNotification('يجب ربط السؤال الحالي بهدف قصير', 'warning');
        return;
    }
    
    if (linkingData.currentQuestionIndex < linkingData.questions.length - 1) {
        linkingData.currentQuestionIndex++;
        loadLinkingQuestion();
    } else {
        // إنهاء الربط
        finishLinking();
    }
}

function previousLinkingQuestion() {
    if (linkingData.currentQuestionIndex > 0) {
        linkingData.currentQuestionIndex--;
        loadLinkingQuestion();
    }
}

/**
 * تحديث أزرار التنقل
 */
function updateLinkingNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = linkingData.currentQuestionIndex === 0;
    }
    
    if (nextBtn) {
        if (linkingData.currentQuestionIndex === linkingData.questions.length - 1) {
            nextBtn.textContent = 'إنهاء الربط';
        } else {
            nextBtn.textContent = 'التالي';
        }
    }
}

/**
 * إنهاء الربط
 */
function finishLinking() {
    // التحقق من ربط جميع الأسئلة
    const unlinkedQuestions = [];
    for (let i = 0; i < linkingData.questions.length; i++) {
        if (!linkingData.linkages[i]) {
            unlinkedQuestions.push(i + 1);
        }
    }
    
    if (unlinkedQuestions.length > 0) {
        const confirmMsg = `لم يتم ربط الأسئلة التالية: ${unlinkedQuestions.join(', ')}. هل تريد المتابعة؟`;
        if (!confirm(confirmMsg)) {
            return;
        }
    }
    
    // حفظ الربط في الاختبار
    const testIndex = tests.findIndex(t => t.id === linkingData.testId);
    if (testIndex !== -1) {
        // ربط الأهداف بالأسئلة
        linkingData.questions.forEach((question, index) => {
            const linkage = linkingData.linkages[index];
            if (linkage && tests[testIndex].questions) {
                const questionIndex = tests[testIndex].questions.findIndex(q => q.id === question.id);
                if (questionIndex !== -1) {
                    tests[testIndex].questions[questionIndex].linkedObjectiveId = linkage.objectiveId;
                }
            }
        });
        
        tests[testIndex].objectivesLinked = true;
        
        // حفظ في التخزين
        saveToLocalStorage();
        
        // تحديث العرض
        renderTests();
        updateStats();
        
        showNotification('تم ربط الأهداف بنجاح', 'success');
        closeLinkingModal();
    }
}

/**
 * إغلاق واجهة الربط
 */
function closeLinkingModal() {
    document.getElementById('linkingModal')?.remove();
}

// ============================================
// دوال مساعدة
// ============================================

/**
 * عرض سؤال في واجهة الربط
 */
function renderQuestionForLinking(question) {
    let html = `<p><strong>${question.text}</strong></p>`;
    
    switch(question.type) {
        case 'mcq':
            if (question.options) {
                html += `<div class="question-options">`;
                question.options.forEach((option, index) => {
                    html += `<div class="option">${String.fromCharCode(65 + index)}) ${option.text}</div>`;
                });
                html += `</div>`;
            }
            break;
            
        case 'auto_reading':
            html += `<div class="reading-preview">
                <p><small>نص القراءة:</small></p>
                <p class="reading-text">${question.readingText?.substring(0, 100) || '...'}${question.readingText?.length > 100 ? '...' : ''}</p>
            </div>`;
            break;
            
        case 'missing_letter':
            html += `<div class="missing-letter-preview">
                <p class="sentence">${question.sentence || ''}</p>
            </div>`;
            break;
    }
    
    return html;
}

/**
 * الحصول على اسم نوع السؤال
 */
function getQuestionTypeName(typeId) {
    const type = QUESTION_TYPES.find(t => t.id === typeId);
    return type ? type.name : 'نوع غير معروف';
}

/**
 * الحصول على أهداف تجريبية
 */
function getDemoObjectives() {
    return [
        {
            id: 1,
            teacherId: currentUser.id,
            title: "تمييز الحروف في أول الكلمة",
            subject: "لغتي",
            description: "القدرة على تمييز الحرف الأول في الكلمة",
            teachingObjectives: [
                "يتعرف على شكل الحرف",
                "ينطق الحرف بشكل صحيح",
                "يميز الحرف في الكلمات المختلفة"
            ]
        },
        {
            id: 2,
            teacherId: currentUser.id,
            title: "الجمع حتى العدد 10",
            subject: "رياضيات",
            description: "القدرة على جمع الأعداد حتى 10",
            teachingObjectives: [
                "يتعرف على الأعداد من 1 إلى 10",
                "يجمع الأعداد باستخدام الأصابع",
                "يحل مسائل جمع بسيطة"
            ]
        }
    ];
}

/**
 * حفظ في التخزين المحلي
 */
function saveToLocalStorage() {
    // في الإصدار النهائي، سيتم حفظ في قاعدة البيانات
    // حالياً نخزن في localStorage للتجربة
    try {
        localStorage.setItem(`teacher_tests_${currentUser.id}`, JSON.stringify(tests));
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
    }
}

/**
 * تحميل معلومات المستخدم
 */
function loadUserInfo() {
    if (currentUser) {
        const userNameElement = document.getElementById('userName');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        
        if (userAvatarElement) {
            userAvatarElement.textContent = currentUser.name.charAt(0);
        }
    }
}

/**
 * تهيئة الأزرار الإضافية
 */
function initAdditionalButtons() {
    // إضافة زر إدارة الأهداف إن لم يكن موجوداً
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('manageObjectivesBtn')) {
        const manageBtn = document.createElement('button');
        manageBtn.id = 'manageObjectivesBtn';
        manageBtn.className = 'btn btn-info';
        manageBtn.innerHTML = '<span class="btn-icon">🎯</span> إدارة الأهداف';
        manageBtn.onclick = manageShortTermObjectives;
        
        headerActions.appendChild(manageBtn);
    }
}

/**
 * إدارة الأهداف القصيرة
 */
function manageShortTermObjectives() {
    showNotification('هذه الميزة قيد التطوير', 'info');
}

/**
 * إغلاق النموذج المنبثق
 */
function closeModal() {
    const modal = document.getElementById('testModal');
    if (modal) modal.remove();
}

/**
 * إغلاق نموذج محدد
 */
function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}

/**
 * إظهار إشعار
 */
function showNotification(message, type = 'info') {
    // يمكن استبدال هذا بمكتبة إشعارات أفضل
    alert(`${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'} ${message}`);
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

window.filterTests = filterTests;
window.sortTests = sortTests;
window.createNewTest = createNewTest;
window.importTest = importTest;
window.viewTest = viewTest;
window.editTest = editTest;
window.exportTest = exportTest;
window.linkObjectives = linkObjectives;
window.deleteTest = deleteTest;
window.closeModal = closeModal;
window.closeModalById = closeModalById;
window.toggleSidebar = toggleSidebar;
window.logout = logout;

// دوال إدارة الأسئلة
window.selectQuestionType = selectQuestionType;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.updatePassingValue = updatePassingValue;
window.addOption = function(button) {
    const container = button.parentElement.querySelector('.options-container');
    const newIndex = container.children.length;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input type="radio" name="${container.parentElement.querySelector('input[type="radio"]').name}" value="${newIndex}">
        <input type="text" class="option-text" placeholder="الخيار ${newIndex + 1}" required>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeOption(this)">✕</button>
    `;
    
    container.appendChild(optionDiv);
};

window.removeOption = function(button) {
    const optionItem = button.parentElement;
    if (optionItem.parentElement.children.length > 2) {
        optionItem.remove();
    }
};

window.addSpellingWord = function(button) {
    const container = button.parentElement.querySelector('.spelling-words');
    const newIndex = container.children.length + 1;
    
    const wordDiv = document.createElement('div');
    wordDiv.className = 'spelling-word';
    wordDiv.innerHTML = `
        <input type="text" class="word-to-spell" placeholder="الكلمة ${newIndex}" required>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeSpellingWord(this)">✕</button>
    `;
    
    container.appendChild(wordDiv);
};

window.removeSpellingWord = function(button) {
    const wordItem = button.parentElement;
    if (wordItem.parentElement.children.length > 1) {
        wordItem.remove();
    }
};

// دوال الربط
window.previousLinkingQuestion = previousLinkingQuestion;
window.nextLinkingQuestion = nextLinkingQuestion;
window.handleObjectiveSelection = handleObjectiveSelection;
window.deselectObjective = deselectObjective;

console.log('تم تحميل ملف tests.js بنجاح');

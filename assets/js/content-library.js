// ===== content-library.js =====
// إدارة مكتبة المحتوى التعليمي - النسخة الكاملة والمحدثة

// متغيرات عامة
let currentTestEditing = null;
let currentQuestionIndex = 0;
let linkedObjectives = {};
let currentTab = 'tests';
let currentDrawingCanvas = null;
let currentDrawingContext = null;
let isDrawing = false;
let isErasing = false;

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('الصفحة جاهزة...');
    initializeContentLibrary();
    loadCurrentUser();
});

// تهيئة مكتبة المحتوى
function initializeContentLibrary() {
    console.log('جاري تهيئة مكتبة المحتوى...');
    
    // التحقق من وجود زر الاستيراد وإضافة زر إنشاء الاختبار
    setTimeout(() => {
        const importButton = document.querySelector('.btn-primary');
        if (importButton && importButton.textContent.includes('استيراد')) {
            const existingAddBtn = importButton.parentNode.querySelector('.add-test-btn');
            if (!existingAddBtn) {
                const addTestBtn = document.createElement('button');
                addTestBtn.className = 'btn btn-success add-test-btn';
                addTestBtn.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة اختبار تشخيصي';
                addTestBtn.onclick = showCreateTestModal;
                importButton.parentNode.insertBefore(addTestBtn, importButton.nextSibling);
                console.log('تم إضافة زر إنشاء الاختبار');
            }
        }
    }, 100);
    
    // إنشاء modals إذا لم تكن موجودة
    createModalsIfNeeded();
    
    // تحميل محتوى الصفحة
    loadContentLibrary();
    
    // إضافة معالج الأحداث للأزرار
    setupEventListeners();
}

// تحميل المستخدم الحالي
function loadCurrentUser() {
    // إذا لم يكن هناك مستخدم مسجل، ننشئ واحدًا افتراضيًا للاختبار
    if (!localStorage.getItem('currentTeacher')) {
        const defaultTeacher = {
            id: 1,
            name: 'أحمد محمد',
            email: 'ahmed@school.com',
            subject: 'لغتي',
            school: 'مدرسة النموذجية'
        };
        localStorage.setItem('currentTeacher', JSON.stringify(defaultTeacher));
    }
    
    return getCurrentUser();
}

// الحصول على بيانات المعلم الحالي
function getCurrentUser() {
    const userData = localStorage.getItem('currentTeacher');
    if (userData) {
        return JSON.parse(userData);
    }
    
    // بيانات افتراضية في حالة عدم العثور على بيانات المستخدم
    return {
        id: 1,
        name: 'معلم تجريبي',
        subject: 'لغتي'
    };
}

// إنشاء Modals ديناميكيًا
function createModalsIfNeeded() {
    if (!document.getElementById('createTestModal')) {
        createTestModal();
    }
    
    if (!document.getElementById('linkObjectivesModal')) {
        createLinkObjectivesModal();
    }
    
    if (!document.getElementById('viewMessageModal')) {
        createMessageModal();
    }
    
    if (!document.getElementById('notificationBox')) {
        createNotificationBox();
    }
}

// إنشاء Modal إنشاء الاختبار
function createTestModal() {
    const modalHTML = `
        <div id="createTestModal" class="modal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3 id="modalTitle">إنشاء اختبار تشخيصي جديد</h3>
                    <button class="modal-close" onclick="closeCreateTestModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createTestForm">
                        <div class="form-group">
                            <label class="form-label">عنوان الاختبار *</label>
                            <input type="text" id="testTitle" class="form-control" required 
                                   placeholder="أدخل عنوان الاختبار">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">المادة *</label>
                            <select id="testSubject" class="form-control" required>
                                <option value="">اختر المادة</option>
                                <option value="لغتي">لغتي</option>
                                <option value="رياضيات">رياضيات</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">وصف الاختبار (اختياري)</label>
                            <textarea id="testDescription" class="form-control" rows="3" 
                                      placeholder="وصف مختصر للاختبار"></textarea>
                        </div>
                        
                        <h4><i class="fas fa-question-circle"></i> الأسئلة</h4>
                        <div id="questionsContainer">
                            <!-- الأسئلة ستضاف هنا -->
                        </div>
                        
                        <button type="button" class="btn btn-outline-primary mt-2" onclick="addQuestion()">
                            <i class="fas fa-plus"></i> إضافة سؤال جديد
                        </button>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" onclick="saveTest()" id="saveTestBtn">
                        <i class="fas fa-save"></i> حفظ الاختبار
                    </button>
                    <button class="btn btn-secondary" onclick="closeCreateTestModal()">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('تم إنشاء نافذة إنشاء الاختبار');
}

// إنشاء Modal ربط الأهداف
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
                            <h4><i class="fas fa-question"></i> السؤال الحالي:</h4>
                            <div class="question-preview" id="currentQuestionText"></div>
                        </div>
                        
                        <div class="objectives-section">
                            <h4><i class="fas fa-bullseye"></i> اختر هدف قصير واحد:</h4>
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
                    <button class="btn btn-secondary" onclick="prevQuestion()" id="linkObjectivesPrevBtn" style="display: none;">
                        <i class="fas fa-arrow-right"></i> السابق
                    </button>
                    <button class="btn btn-primary" onclick="nextQuestion()" id="linkObjectivesNextBtn">
                        التالي <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="btn btn-success" onclick="finishLinking()" id="linkObjectivesFinishBtn">
                        <i class="fas fa-check"></i> إنهاء الربط
                    </button>
                    <button class="btn btn-danger" onclick="closeLinkObjectivesModal()">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('تم إنشاء نافذة ربط الأهداف');
}

// إنشاء Modal الرسائل
function createMessageModal() {
    const modalHTML = `
        <div id="viewMessageModal" class="modal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3 id="viewMessageSubject">عرض الرسالة</h3>
                    <button class="modal-close" onclick="closeViewMessageModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="message-view-header">
                        <div id="viewMessageFrom"></div>
                        <div id="viewMessageDate"></div>
                        <div id="viewMessageAttachment"></div>
                    </div>
                    <div class="message-view-content" id="viewMessageContent"></div>
                    <div class="message-reply-section" id="replySection">
                        <h4><i class="fas fa-reply"></i> الرد على الرسالة</h4>
                        <textarea class="form-control" id="replyContent" rows="4" 
                                  placeholder="اكتب ردك هنا..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="sendReply()">
                        <i class="fas fa-paper-plane"></i> إرسال الرد
                    </button>
                    <button class="btn btn-secondary" onclick="closeViewMessageModal()">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// إنشاء صندوق الإشعارات
function createNotificationBox() {
    const notificationBoxHTML = `
        <div class="notification-box" id="notificationBox"></div>
    `;
    document.body.insertAdjacentHTML('afterbegin', notificationBoxHTML);
}

// ===== دوال إدارة الـ Modals =====

function showCreateTestModal() {
    console.log('فتح نافذة إنشاء اختبار...');
    
    // إنشاء الـ modal إذا لم يكن موجودًا
    if (!document.getElementById('createTestModal')) {
        createTestModal();
    }
    
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'block';
        
        // إعادة تهيئة البيانات
        currentTestEditing = null;
        document.getElementById('modalTitle').textContent = 'إنشاء اختبار تشخيصي جديد';
        document.getElementById('createTestForm').reset();
        document.getElementById('questionsContainer').innerHTML = '';
        document.getElementById('saveTestBtn').textContent = 'حفظ الاختبار';
        document.getElementById('saveTestBtn').innerHTML = '<i class="fas fa-save"></i> حفظ الاختبار';
        
        console.log('تم فتح نافذة إنشاء الاختبار بنجاح');
    } else {
        console.error('عنصر نافذة الاختبار غير موجود!');
        showNotification('حدث خطأ في فتح نافذة إنشاء الاختبار', 'error');
    }
}

function closeCreateTestModal() {
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

function showEditTestModal(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    currentTestEditing = test;
    
    // التأكد من وجود النافذة
    if (!document.getElementById('createTestModal')) {
        createTestModal();
    }
    
    const modal = document.getElementById('createTestModal');
    modal.classList.add('show');
    modal.style.display = 'block';
    
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
    document.getElementById('saveTestBtn').innerHTML = '<i class="fas fa-sync"></i> تحديث الاختبار';
}

// ===== تحميل مكتبة المحتوى =====

function loadContentLibrary() {
    console.log('جاري تحميل مكتبة المحتوى...');
    
    // تحميل المحتوى حسب التبويب النشط
    switch(currentTab) {
        case 'tests':
            loadTests();
            break;
        case 'lessons':
            loadLessons();
            break;
        case 'objectives':
            loadObjectives();
            break;
        case 'assignments':
            loadAssignments();
            break;
    }
}

function loadTests() {
    const testsGrid = document.getElementById('testsGrid');
    if (!testsGrid) {
        console.warn('عنصر عرض الاختبارات غير موجود');
        return;
    }

    console.log('جاري تحميل الاختبارات...');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية اختبارات المعلم الحالي
    const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);
    console.log(`تم العثور على ${teacherTests.length} اختبار للمعلم ${currentTeacher.name}`);
    
    // ترتيب الاختبارات: أولاً حسب المادة (لغتي ثم رياضيات)، ثم حسب التاريخ
    teacherTests.sort((a, b) => {
        const subjectOrder = { 'لغتي': 1, 'رياضيات': 2 };
        const subjectA = subjectOrder[a.subject] || 3;
        const subjectB = subjectOrder[b.subject] || 3;
        
        if (subjectA !== subjectB) {
            return subjectA - subjectB;
        }
        
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (teacherTests.length === 0) {
        testsGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات تشخيصية</h3>
                <p>ابدأ بإنشاء أول اختبار تشخيصي</p>
                <button class="btn btn-success" onclick="showCreateTestModal()">
                    <i class="fas fa-plus-circle"></i> إنشاء اختبار
                </button>
            </div>
        `;
        console.log('لا توجد اختبارات، تم عرض الحالة الفارغة');
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
                <button class="btn btn-sm btn-primary" onclick="viewTestDetails(${test.id})" title="عرض التفاصيل">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="exportTest(${test.id})" title="تصدير">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="linkTestObjectives(${test.id})" title="ربط الأهداف">
                    <i class="fas fa-bullseye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    console.log('تم تحميل الاختبارات بنجاح');
}

function loadLessons() {
    const lessonsGrid = document.getElementById('lessonsGrid');
    if (!lessonsGrid) return;

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherLessons = lessons.filter(lesson => lesson.teacherId === currentTeacher.id);

    if (teacherLessons.length === 0) {
        lessonsGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس</h3>
                <p>ابدأ بإنشاء أول درس</p>
                <button class="btn btn-success" onclick="showCreateLessonModal()">إنشاء درس</button>
            </div>
        `;
        return;
    }

    lessonsGrid.innerHTML = teacherLessons.map(lesson => `
        <div class="content-card">
            <div class="content-header">
                <h4>${lesson.title}</h4>
                <span class="content-badge subject-${lesson.subject}">${lesson.subject}</span>
            </div>
            <div class="content-body">
                <p>${lesson.description || 'لا يوجد وصف'}</p>
                <div class="content-meta">
                    <span class="strategy">${lesson.strategy}</span>
                    <span class="priority">الأولوية: ${lesson.priority || 'غير محدد'}</span>
                    <span class="objectives-status ${lesson.objectivesLinked ? 'linked' : 'not-linked'}">
                        ${lesson.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}
                    </span>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})" title="عرض">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="exportContent('lesson', ${lesson.id})" title="تصدير">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="linkTeachingObjectives(${lesson.id})" title="ربط الأهداف">
                    <i class="fas fa-bullseye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadObjectives() {
    const objectivesList = document.getElementById('objectivesList');
    if (!objectivesList) return;

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherObjectives = objectives.filter(obj => obj.teacherId === currentTeacher.id);

    if (teacherObjectives.length === 0) {
        objectivesList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">🎯</div>
                <h3>لا توجد أهداف قصيرة المدى</h3>
                <p>ابدأ بإضافة أول هدف قصير المدى</p>
                <button class="btn btn-success" onclick="showCreateObjectiveModal()">إضافة هدف</button>
            </div>
        `;
        return;
    }

    objectivesList.innerHTML = teacherObjectives.map(obj => `
        <div class="objective-item">
            <div class="objective-header">
                <h4>${obj.shortTerm}</h4>
                <div class="objective-actions">
                    <button class="btn btn-sm btn-warning" onclick="editObjective(${obj.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteObjective(${obj.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="teaching-objectives">
                ${obj.teachingObjectives?.map(to => `
                    <div class="teaching-objective">${to}</div>
                `).join('') || '<div class="no-objectives">لا توجد أهداف تدريسية</div>'}
            </div>
        </div>
    `).join('');
}

function loadAssignments() {
    const assignmentsGrid = document.getElementById('assignmentsGrid');
    if (!assignmentsGrid) return;

    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherAssignments = assignments.filter(assignment => assignment.teacherId === currentTeacher.id);

    if (teacherAssignments.length === 0) {
        assignmentsGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد واجبات</h3>
                <p>ابدأ بإنشاء أول واجب</p>
                <button class="btn btn-success" onclick="showCreateAssignmentModal()">إنشاء واجب</button>
            </div>
        `;
        return;
    }

    assignmentsGrid.innerHTML = teacherAssignments.map(assignment => `
        <div class="content-card">
            <div class="content-header">
                <h4>${assignment.title}</h4>
                <span class="content-badge subject-${assignment.subject}">${assignment.subject}</span>
            </div>
            <div class="content-body">
                <p>${assignment.description || 'لا يوجد وصف'}</p>
                <div class="content-meta">
                    <span class="exercises-count">${assignment.exercises?.length || 0} تمرين</span>
                    <span class="total-grade">الدرجة: ${assignment.totalGrade || 0}</span>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewAssignment(${assignment.id})" title="عرض">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editAssignment(${assignment.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="exportContent('assignment', ${assignment.id})" title="تصدير">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${assignment.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ===== إدارة الاختبارات التشخيصية =====

function addQuestion() {
    const questionsContainer = document.getElementById('questionsContainer');
    const questionIndex = questionsContainer.children.length;
    
    const questionHTML = `
        <div class="question-item" data-index="${questionIndex}">
            <div class="question-header">
                <h5><i class="fas fa-question"></i> السؤال ${questionIndex + 1}</h5>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(${questionIndex})">
                    <i class="fas fa-trash"></i>
                </button>
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

function addQuestionToContainer(questionData, index) {
    const questionsContainer = document.getElementById('questionsContainer');
    
    const questionHTML = `
        <div class="question-item" data-index="${index}">
            <div class="question-header">
                <h5>السؤال ${index + 1}</h5>
                <div class="question-actions">
                    <span class="question-type-badge">${getQuestionTypeName(questionData.type)}</span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
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
    
    // إذا كان نوع السؤال تفاعليًا، نقوم بتهيئة لوحة الرسم
    if (['reading-manual', 'spelling-manual', 'missing-letter'].includes(questionData.type)) {
        setTimeout(() => initializeDrawingCanvas(index), 100);
    }
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
        case 'multiple-choice-attachment':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">نص السؤال</label>
                    <textarea class="form-control question-text" rows="3">${questionData.text || ''}</textarea>
                </div>
                ${questionData.type === 'multiple-choice-attachment' ? `
                <div class="form-group">
                    <label class="form-label">المرفق (صورة/فيديو/صوت)</label>
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
                ` : ''}
                <div class="form-group">
                    <label class="form-label">الخيارات (ضع علامة صح على الإجابة الصحيحة)</label>
                    <div class="choices-container">
                        ${questionData.choices ? questionData.choices.map((choice, i) => `
                            <div class="choice-item">
                                <input type="text" class="form-control choice-text" value="${choice.text || ''}" placeholder="النص">
                                <label class="choice-correct-label">
                                    <input type="checkbox" class="choice-correct" ${choice.correct ? 'checked' : ''}>
                                    صحيح
                                </label>
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('') : `
                            <div class="choice-item">
                                <input type="text" class="form-control choice-text" placeholder="النص">
                                <label class="choice-correct-label">
                                    <input type="checkbox" class="choice-correct">
                                    صحيح
                                </label>
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addChoice(${index})">
                        <i class="fas fa-plus"></i> إضافة خيار
                    </button>
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
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('') : `
                            <div class="word-item">
                                <input type="text" class="form-control word-text" placeholder="أدخل الكلمة">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addWord(${index})">
                        <i class="fas fa-plus"></i> إضافة كلمة
                    </button>
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
                    <label class="form-label">${questionData.type === 'missing-letter' ? 'الكلمة الناقصة حرف' : 'الكلمات'}</label>
                    <input type="text" class="form-control content-text" value="${questionData.content || ''}" 
                           placeholder="${questionData.type === 'missing-letter' ? 'مثال: ق_ب (قلم)' : 'أدخل الكلمات'}">
                </div>
                <div class="drawing-tools">
                    <label>أدوات الرسم:</label>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="activatePen(${index})">
                        <i class="fas fa-pen"></i> قلم
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="activateEraser(${index})">
                        <i class="fas fa-eraser"></i> ممحاة
                    </button>
                    <input type="color" class="color-picker" value="#000000" onchange="changeColor(${index}, this.value)" title="اختر لون القلم">
                    <button type="button" class="btn btn-sm btn-danger" onclick="clearDrawing(${index})">
                        <i class="fas fa-trash"></i> مسح الكل
                    </button>
                </div>
                <div class="drawing-canvas-container">
                    <canvas class="drawing-canvas" id="canvas-${index}" width="600" height="200"></canvas>
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
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('') : `
                            <div class="draggable-item">
                                <input type="text" class="form-control draggable-text" placeholder="عنصر">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addDraggableItem(${index})">
                        <i class="fas fa-plus"></i> إضافة عنصر
                    </button>
                </div>
                <div class="form-group">
                    <label class="form-label">المناطق المستهدفة</label>
                    <div class="drop-zones">
                        ${questionData.dropZones ? questionData.dropZones.map((zone, i) => `
                            <div class="drop-zone-item">
                                <input type="text" class="form-control drop-zone-label" value="${zone.label}" placeholder="تسمية المنطقة">
                                <input type="text" class="form-control correct-item" value="${zone.correctItem}" placeholder="العنصر الصحيح">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('') : `
                            <div class="drop-zone-item">
                                <input type="text" class="form-control drop-zone-label" placeholder="تسمية المنطقة">
                                <input type="text" class="form-control correct-item" placeholder="العنصر الصحيح">
                                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addDropZone(${index})">
                        <i class="fas fa-plus"></i> إضافة منطقة
                    </button>
                </div>
            `;
            break;
            
        default:
            contentHTML = `<p class="text-muted">نوع السؤال: ${getQuestionTypeName(questionData.type)}</p>`;
    }
    
    return contentHTML;
}

function changeQuestionType(questionIndex) {
    const questionItem = document.querySelector(`.question-item[data-index="${questionIndex}"]`);
    if (!questionItem) return;
    
    const questionType = questionItem.querySelector('.question-type').value;
    const questionContent = questionItem.querySelector('.question-content');
    
    const questionData = {
        type: questionType,
        passingCriteria: 80
    };
    
    questionContent.innerHTML = generateQuestionContent(questionData, questionIndex);
    
    // إضافة أدوات الرسم للأنواع التفاعلية
    if (['reading-manual', 'spelling-manual', 'missing-letter'].includes(questionType)) {
        setTimeout(() => initializeDrawingCanvas(questionIndex), 100);
    }
}

function removeQuestion(questionIndex) {
    const questionItem = document.querySelector(`.question-item[data-index="${questionIndex}"]`);
    if (questionItem) {
        questionItem.remove();
        
        // إعادة ترقيم الأسئلة المتبقية
        const remainingQuestions = document.querySelectorAll('.question-item');
        remainingQuestions.forEach((item, index) => {
            item.setAttribute('data-index', index);
            item.querySelector('h5').innerHTML = `<i class="fas fa-question"></i> السؤال ${index + 1}`;
        });
    }
}

function addChoice(questionIndex) {
    const choicesContainer = document.querySelector(`.question-item[data-index="${questionIndex}"] .choices-container`);
    if (!choicesContainer) return;
    
    const choiceHTML = `
        <div class="choice-item">
            <input type="text" class="form-control choice-text" placeholder="النص">
            <label class="choice-correct-label">
                <input type="checkbox" class="choice-correct">
                صحيح
            </label>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    choicesContainer.insertAdjacentHTML('beforeend', choiceHTML);
}

function addWord(questionIndex) {
    const wordsContainer = document.querySelector(`.question-item[data-index="${questionIndex}"] .words-container`);
    if (!wordsContainer) return;
    
    const wordHTML = `
        <div class="word-item">
            <input type="text" class="form-control word-text" placeholder="أدخل الكلمة">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    wordsContainer.insertAdjacentHTML('beforeend', wordHTML);
}

function addDraggableItem(questionIndex) {
    const draggableItems = document.querySelector(`.question-item[data-index="${questionIndex}"] .draggable-items`);
    if (!draggableItems) return;
    
    const itemHTML = `
        <div class="draggable-item">
            <input type="text" class="form-control draggable-text" placeholder="عنصر">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    draggableItems.insertAdjacentHTML('beforeend', itemHTML);
}

function addDropZone(questionIndex) {
    const dropZones = document.querySelector(`.question-item[data-index="${questionIndex}"] .drop-zones`);
    if (!dropZones) return;
    
    const zoneHTML = `
        <div class="drop-zone-item">
            <input type="text" class="form-control drop-zone-label" placeholder="تسمية المنطقة">
            <input type="text" class="form-control correct-item" placeholder="العنصر الصحيح">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
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
                <span><i class="fas fa-paperclip"></i> ${input.files[0].name}</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeAttachment(${questionIndex})">
                    <i class="fas fa-trash"></i> حذف
                </button>
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
    if (!ctx) return;
    
    // حفظ المرجع للاستخدام في دوال الرسم
    currentDrawingCanvas = canvas;
    currentDrawingContext = ctx;
    
    // إعداد القلم
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // مسح الخلفية
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // إضافة معالجات الأحداث
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // دعم اللمس
    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const canvas = currentDrawingCanvas;
    const ctx = currentDrawingContext;
    
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    
    e.preventDefault();
    const canvas = currentDrawingCanvas;
    const ctx = currentDrawingContext;
    
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    if (isErasing) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function stopDrawing() {
    isDrawing = false;
    const ctx = currentDrawingContext;
    if (ctx) {
        ctx.beginPath();
    }
}

function handleTouchStart(e) {
    if (e.cancelable) {
        e.preventDefault();
    }
    startDrawing(e.touches[0]);
}

function handleTouchMove(e) {
    if (e.cancelable) {
        e.preventDefault();
    }
    draw(e.touches[0]);
}

function activatePen(questionIndex) {
    isErasing = false;
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.globalCompositeOperation = 'source-over';
    }
}

function activateEraser(questionIndex) {
    isErasing = true;
}

function changeColor(questionIndex, color) {
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.strokeStyle = color;
    }
}

function clearDrawing(questionIndex) {
    const canvas = document.getElementById(`canvas-${questionIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ==== حفظ الاختبار ====

function saveTest() {
    const title = document.getElementById('testTitle').value.trim();
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value.trim();

    if (!title || !subject) {
        showNotification('يرجى ملء عنوان الاختبار والمادة', 'warning');
        return;
    }

    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');
    
    if (questionItems.length === 0) {
        showNotification('يرجى إضافة سؤال واحد على الأقل', 'warning');
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
            showNotification('تم تحديث الاختبار بنجاح', 'success');
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
        showNotification('تم حفظ الاختبار بنجاح', 'success');
    }

    localStorage.setItem('tests', JSON.stringify(tests));
    closeCreateTestModal();
    loadTests();
}

// ==== ربط الأهداف القصيرة ====

function linkTestObjectives(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    if (!test.questions || test.questions.length === 0) {
        showNotification('لا يوجد أسئلة في هذا الاختبار', 'warning');
        return;
    }
    
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية الأهداف الخاصة بالمعلم الحالي ونفس المادة
    const relevantObjectives = objectives.filter(obj => 
        obj.teacherId === currentTeacher.id && 
        obj.subject === test.subject
    );
    
    if (relevantObjectives.length === 0) {
        showNotification('لا توجد أهداف قصيرة مرتبطة بهذه المادة', 'warning');
        return;
    }
    
    // تهيئة واجهة الربط
    currentQuestionIndex = 0;
    linkedObjectives = test.linkedObjectives || {};
    
    showLinkObjectivesModal(test, relevantObjectives);
}

function showLinkObjectivesModal(test, objectives) {
    // التأكد من وجود النافذة
    if (!document.getElementById('linkObjectivesModal')) {
        createLinkObjectivesModal();
    }
    
    const modal = document.getElementById('linkObjectivesModal');
    modal.classList.add('show');
    modal.style.display = 'block';
    
    document.getElementById('linkObjectivesTitle').textContent = `ربط أهداف اختبار: ${test.title}`;
    document.getElementById('linkObjectivesProgress').textContent = `السؤال 1 من ${test.questions.length}`;
    document.getElementById('linkObjectivesNextBtn').style.display = test.questions.length > 1 ? 'inline-block' : 'none';
    document.getElementById('linkObjectivesFinishBtn').style.display = test.questions.length === 1 ? 'inline-block' : 'none';
    document.getElementById('linkObjectivesPrevBtn').style.display = 'none';
    
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
}

function selectObjective(questionIndex, objectiveId) {
    linkedObjectives[questionIndex] = objectiveId;
}

function nextQuestion() {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const title = document.getElementById('linkObjectivesTitle').textContent.split(':')[1].trim();
    const test = tests.find(t => t.title === title);
    
    if (!test) return;
    
    if (!linkedObjectives[currentQuestionIndex]) {
        showNotification('يرجى اختيار هدف قصير للسؤال الحالي', 'warning');
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
        const title = document.getElementById('linkObjectivesTitle').textContent.split(':')[1].trim();
        const test = tests.find(t => t.title === title);
        
        if (test) {
            updateLinkObjectivesUI(test);
        }
    }
}

function updateLinkObjectivesUI(test) {
    if (!test || !test.questions) return;
    
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
        showNotification('يرجى اختيار هدف قصير للسؤال الأخير', 'warning');
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const title = document.getElementById('linkObjectivesTitle').textContent.split(':')[1].trim();
    const testIndex = tests.findIndex(t => t.title === title);
    
    if (testIndex !== -1) {
        tests[testIndex].linkedObjectives = { ...linkedObjectives };
        tests[testIndex].objectivesLinked = Object.keys(linkedObjectives).length > 0;
        localStorage.setItem('tests', JSON.stringify(tests));
        
        showNotification('تم ربط الأهداف بنجاح', 'success');
        closeLinkObjectivesModal();
        loadTests();
    }
}

function closeLinkObjectivesModal() {
    const modal = document.getElementById('linkObjectivesModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    currentQuestionIndex = 0;
    linkedObjectives = {};
}

// ==== تصدير الاختبار ====

function exportTest(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // إنشاء نسخة من الاختبار بدون الأهداف المربوطة
    const exportData = {
        ...test,
        id: generateId(),
        teacherId: null,
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
    
    showNotification('تم تصدير الاختبار بنجاح', 'success');
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
        showNotification(`سيتم تطوير استيراد ${type} في المرحلة القادمة`, 'info');
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
            
            showNotification('تم استيراد الاختبار بنجاح', 'success');
            loadTests();
            
        } catch (error) {
            showNotification('فشل استيراد الملف. تأكد من صحة تنسيق الملف', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// ==== إدارة الدروس والواجبات والأهداف ====

function showCreateLessonModal() {
    showNotification('سيتم تطوير هذه الوظيفة في المرحلة القادمة', 'info');
}

function showCreateObjectiveModal() {
    showNotification('سيتم تطوير هذه الوظيفة في المرحلة القادمة', 'info');
}

function showCreateAssignmentModal() {
    showNotification('سيتم تطوير هذه الوظيفة في المرحلة القادمة', 'info');
}

// ==== دوال العرض والحذف ====

function viewTestDetails(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    const modalHTML = `
        <div id="viewTestModal" class="modal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${test.title}</h3>
                    <button class="modal-close" onclick="closeModal('viewTestModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="test-details-container">
                        <div class="test-info-grid">
                            <div class="info-item">
                                <span class="info-label">المادة:</span>
                                <span class="info-value">${test.subject}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">تاريخ الإنشاء:</span>
                                <span class="info-value">${formatDate(test.createdAt)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">عدد الأسئلة:</span>
                                <span class="info-value">${test.questions?.length || 0}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">حالة الربط:</span>
                                <span class="info-value objectives-status ${test.objectivesLinked ? 'linked' : 'not-linked'}">
                                    ${test.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="test-description">
                            <h4>الوصف:</h4>
                            <p>${test.description || 'لا يوجد وصف'}</p>
                        </div>
                        
                        <div class="questions-list">
                            <h4>الأسئلة:</h4>
                            ${test.questions?.map((q, index) => `
                                <div class="question-item">
                                    <h5>السؤال ${index + 1} (${getQuestionTypeName(q.type)})</h5>
                                    <p>${q.text || 'لا يوجد نص'}</p>
                                    <div class="question-meta">
                                        <span>محك الاجتياز: ${q.passingCriteria}%</span>
                                    </div>
                                </div>
                            `).join('') || '<p>لا توجد أسئلة</p>'}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="editTest(${testId})">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal('viewTestModal')">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // إضافة الـ modal إلى الصفحة إذا لم يكن موجودًا
    if (!document.getElementById('viewTestModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } else {
        document.getElementById('viewTestModal').innerHTML = modalHTML;
    }
    
    document.getElementById('viewTestModal').classList.add('show');
    document.getElementById('viewTestModal').style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

function editTest(testId) {
    showEditTestModal(testId);
}

function deleteTest(testId) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟ لن يمكنك استرجاعه.')) {
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const updatedTests = tests.filter(test => test.id !== testId);
    localStorage.setItem('tests', JSON.stringify(updatedTests));
    
    showNotification('تم حذف الاختبار بنجاح', 'success');
    loadTests();
}

// ==== دوال التبويبات والتصفية ====

function switchTab(tabName) {
    currentTab = tabName;
    
    // تحديث أزرار التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // إخفاء جميع المحتويات
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // إظهار المحتوى المحدد
    document.getElementById(`${tabName}Tab`).style.display = 'block';
    
    // تحميل المحتوى الخاص بالتبويب
    loadContentLibrary();
}

function filterTests(subject) {
    // تحديث أزرار التصفية
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // سيتم تطوير التصفية الفعلية في مرحلة لاحقة
    showNotification(`سيتم تطوير تصفية الاختبارات حسب المادة: ${subject}`, 'info');
}

// ==== دوال مساعدة ====

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    try {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('ar-SA', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'تاريخ غير معروف';
    }
}

function setupEventListeners() {
    // إغلاق الـ modal عند النقر خارج المحتوى
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            e.target.style.display = 'none';
        }
    });
}

function showNotification(message, type = 'info') {
    const notificationBox = document.getElementById('notificationBox');
    if (!notificationBox) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${getNotificationTitle(type)}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationBox.appendChild(notification);
    
    // إزالة الإشعار تلقائيًا بعد 5 ثوانٍ
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationTitle(type) {
    const titles = {
        success: 'نجاح',
        error: 'خطأ',
        warning: 'تحذير',
        info: 'معلومة'
    };
    return titles[type] || 'إشعار';
}

// ===== دوال التصدير للاستخدام العالمي =====

window.initializeContentLibrary = initializeContentLibrary;
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.showCreateLessonModal = showCreateLessonModal;
window.closeCreateLessonModal = closeCreateLessonModal;
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
window.switchTab = switchTab;
window.filterTests = filterTests;
window.closeModal = closeModal;
window.closeLinkObjectivesModal = closeLinkObjectivesModal;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.finishLinking = finishLinking;
window.selectObjective = selectObjective;
window.activatePen = activatePen;
window.activateEraser = activateEraser;
window.changeColor = changeColor;
window.clearDrawing = clearDrawing;
window.previewAttachment = previewAttachment;
window.removeAttachment = removeAttachment;
window.addWord = addWord;
window.addDraggableItem = addDraggableItem;
window.addDropZone = addDropZone;

console.log('تم تحميل مكتبة المحتوى بنجاح');

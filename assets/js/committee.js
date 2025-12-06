// ============================================
// 📁 الملف: muyasir-main/assets/js/committee.js
// ============================================

// إدارة لجنة صعوبات التعلم + الاختبارات التشخيصية
let currentEditingMemberId = null;
let currentQuestionIndex = 0;
let currentTestQuestions = [];
let currentQuestionType = '';
let currentTestId = null;
let currentObjectiveId = null;
let canvas = null;
let ctx = null;
let isDrawing = false;
let currentTestData = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('committee.html')) {
        initializeCommitteePage();
        setupCommitteeTabs();
    }
    
    if (window.location.pathname.includes('content-library.html')) {
        initializeContentLibrary();
    }
});

// ============================================
// اللجنة الأصلية
// ============================================

function initializeCommitteePage() {
    loadCommitteeMembers();
    loadCommitteeNotes();
    updateCommitteeStats();
}

function setupCommitteeTabs() {
    const tabBtns = document.querySelectorAll('.committee-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.committee-tabs .tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function loadCommitteeMembers() {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;
    
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية أعضاء اللجنة الخاصة بالمعلم الحالي فقط
    const teacherMembers = committeeMembers.filter(member => member.teacherId === currentTeacher.id);
    
    if (teacherMembers.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>لا توجد أعضاء في اللجنة</h3>
                <p>قم بإضافة أعضاء لجنة صعوبات التعلم لمشاركة متابعة الطلاب</p>
                <button class="btn btn-success" onclick="showAddMemberModal()">إضافة أول عضو</button>
            </div>
        `;
        return;
    }
    
    membersList.innerHTML = teacherMembers.map(member => `
        <div class="member-card">
            <div class="member-info">
                <div class="member-avatar">${member.name.charAt(0)}</div>
                <div class="member-details">
                    <h4>${member.name}</h4>
                    <div class="member-meta">
                        <span class="member-role">${member.role}</span>
                        <span class="member-username">اسم المستخدم: ${member.username}</span>
                    </div>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn btn-sm btn-primary" onclick="editCommitteeMember(${member.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCommitteeMember(${member.id})">حذف</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="viewMemberCredentials(${member.id})">عرض بيانات الدخول</button>
            </div>
        </div>
    `).join('');
}

function loadCommitteeNotes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const currentTeacher = getCurrentUser();
    
    // تصفية الملاحظات الخاصة بالمعلم الحالي فقط
    const teacherNotes = committeeNotes.filter(note => note.teacherId === currentTeacher.id);
    
    if (teacherNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد ملاحظات</h3>
                <p>لم يتم إرسال أي ملاحظات من أعضاء اللجنة بعد</p>
            </div>
        `;
        return;
    }
    
    // ترتيب الملاحظات من الأحدث إلى الأقدم
    teacherNotes.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    notesList.innerHTML = teacherNotes.map(note => {
        const member = getCommitteeMemberById(note.memberId);
        return `
            <div class="note-card ${note.isRead ? 'read' : 'unread'}">
                <div class="note-header">
                    <div class="note-sender">
                        <strong>${member?.name || 'عضو غير معروف'}</strong>
                        <span class="sender-role">${member?.role || ''}</span>
                    </div>
                    <div class="note-date">${formatDate(note.sentAt)}</div>
                </div>
                <div class="note-content">
                    <p>${note.content}</p>
                </div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewNote(${note.id})">عرض</button>
                    ${!note.isRead ? `<button class="btn btn-sm btn-success" onclick="markNoteAsRead(${note.id})">تعليم كمقروء</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateCommitteeStats() {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherMembers = committeeMembers.filter(member => member.teacherId === currentTeacher.id);
    
    const totalMembersElement = document.getElementById('totalMembers');
    const activeMembersElement = document.getElementById('activeMembers');
    
    if (totalMembersElement) {
        totalMembersElement.textContent = teacherMembers.length;
    }
    
    if (activeMembersElement) {
        activeMembersElement.textContent = teacherMembers.length; // يمكن إضافة حالة النشاط لاحقاً
    }
}

function getCommitteeMemberById(memberId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    return committeeMembers.find(member => member.id === memberId);
}

function showAddMemberModal() {
    document.getElementById('addMemberModal').classList.add('show');
    document.getElementById('addMemberForm').reset();
}

function closeAddMemberModal() {
    document.getElementById('addMemberModal').classList.remove('show');
}

function viewMemberCredentials(memberId) {
    // تنفيذ عرض بيانات الدخول
    showAuthNotification('جاري تحميل بيانات الدخول...', 'info');
}

function editCommitteeMember(memberId) {
    // تنفيذ تعديل العضو
    showAuthNotification('جاري تحميل بيانات العضو...', 'info');
}

function deleteCommitteeMember(memberId) {
    if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const currentTeacher = getCurrentUser();
        
        const updatedMembers = committeeMembers.filter(member => 
            !(member.id === memberId && member.teacherId === currentTeacher.id)
        );
        
        localStorage.setItem('committeeMembers', JSON.stringify(updatedMembers));
        showAuthNotification('تم حذف العضو بنجاح', 'success');
        loadCommitteeMembers();
        updateCommitteeStats();
    }
}

function viewNote(noteId) {
    const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
        showAuthNotification('عرض ملاحظة: ' + (note.content.substring(0, 50) + '...'), 'info');
    }
}

function markNoteAsRead(noteId) {
    const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
        notes[noteIndex].isRead = true;
        localStorage.setItem('committeeNotes', JSON.stringify(notes));
        showAuthNotification('تم تعليم الملاحظة كمقروءة', 'success');
        loadCommitteeNotes();
    }
}

function deleteNote(noteId) {
    if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
        const notes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
        const updatedNotes = notes.filter(n => n.id !== noteId);
        
        localStorage.setItem('committeeNotes', JSON.stringify(updatedNotes));
        showAuthNotification('تم حذف الملاحظة بنجاح', 'success');
        loadCommitteeNotes();
    }
}

// ============================================
// مكتبة المحتوى التعليمي - الاختبارات التشخيصية
// ============================================

function initializeContentLibrary() {
    loadDiagnosticTests();
    setupLibraryTabs();
    setupTestCreation();
    
    // تهيئة البيانات الافتراضية إذا لزم الأمر
    initializeDefaultData();
}

function setupLibraryTabs() {
    const tabBtns = document.querySelectorAll('.library-tab-btn');
    const tabPanes = document.querySelectorAll('.library-tab-pane');
    
    if (tabBtns.length === 0) return;
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            const targetPane = document.getElementById(`${tabId}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // تحميل المحتوى بناءً على التبويب
            switch(tabId) {
                case 'tests':
                    loadDiagnosticTests();
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
        });
    });
}

function initializeDefaultData() {
    // تهيئة الاختبارات إذا لم تكن موجودة
    if (!localStorage.getItem('diagnosticTests')) {
        localStorage.setItem('diagnosticTests', JSON.stringify([]));
    }
    
    // تهيئة الأهداف القصيرة إذا لم تكن موجودة
    if (!localStorage.getItem('shortTermObjectives')) {
        const defaultObjectives = [
            {
                id: 1,
                teacherId: getCurrentUser()?.id || 0,
                subject: 'لغتي',
                text: 'قراءة الحروف الهجائية',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                teacherId: getCurrentUser()?.id || 0,
                subject: 'لغتي',
                text: 'كتابة الكلمات البسيطة',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                teacherId: getCurrentUser()?.id || 0,
                subject: 'رياضيات',
                text: 'الجمع حتى 10',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('shortTermObjectives', JSON.stringify(defaultObjectives));
    }
}

function loadDiagnosticTests() {
    const testsContainer = document.getElementById('diagnosticTestsContainer');
    if (!testsContainer) return;
    
    // جلب الاختبارات من localStorage
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const currentUser = getCurrentUser();
    
    // تصفية الاختبارات الخاصة بالمعلم الحالي
    const teacherTests = tests.filter(test => test.teacherId === currentUser.id);
    
    if (teacherTests.length === 0) {
        testsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات تشخيصية</h3>
                <p>قم بإنشاء أول اختبار تشخيصي للطلاب</p>
                <button class="btn btn-success" onclick="showCreateTestModal()">إنشاء اختبار جديد</button>
            </div>
        `;
        return;
    }
    
    // ترتيب الاختبارات حسب المادة ثم تاريخ الإضافة
    const arabicTests = teacherTests
        .filter(test => test.subject === 'لغتي')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const mathTests = teacherTests
        .filter(test => test.subject === 'رياضيات')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = '';
    
    if (arabicTests.length > 0) {
        html += `
            <div class="subject-section">
                <div class="subject-header">
                    <div class="subject-icon arabic">ل</div>
                    <h3>اختبارات مادة لغتي</h3>
                </div>
                <div class="tests-list">
                    ${arabicTests.map(test => renderTestItem(test)).join('')}
                </div>
            </div>
        `;
    }
    
    if (mathTests.length > 0) {
        html += `
            <div class="subject-section">
                <div class="subject-header">
                    <div class="subject-icon math">ر</div>
                    <h3>اختبارات مادة الرياضيات</h3>
                </div>
                <div class="tests-list">
                    ${mathTests.map(test => renderTestItem(test)).join('')}
                </div>
            </div>
        `;
    }
    
    testsContainer.innerHTML = html;
}

function renderTestItem(test) {
    const linkedObjectives = test.linkedObjectives ? test.linkedObjectives.length : 0;
    const totalQuestions = test.questions ? test.questions.length : 0;
    const hasLinkedQuestions = test.questions ? 
        test.questions.some(q => q.linkedObjectiveId) : false;
    
    return `
        <div class="test-item ${test.subject === 'لغتي' ? 'arabic' : 'math'}">
            <div class="test-header">
                <div class="test-title-section">
                    <div class="test-title">${test.title}</div>
                    <div class="test-meta">
                        <span>${formatDateShort(test.createdAt)}</span>
                        <span class="test-badge ${test.subject === 'لغتي' ? 'badge-arabic' : 'badge-math'}">
                            ${test.subject}
                        </span>
                        <span class="test-badge ${hasLinkedQuestions ? 'badge-linked' : 'badge-not-linked'}">
                            ${hasLinkedQuestions ? 'تم الربط' : 'لم يتم الربط'}
                        </span>
                        <span>${totalQuestions} سؤال</span>
                    </div>
                </div>
                <div class="test-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">
                        <span class="btn-icon">👁️</span> عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})">
                        <span class="btn-icon">✏️</span> تعديل
                    </button>
                    <button class="btn btn-sm btn-info" onclick="linkObjectives(${test.id})">
                        <span class="btn-icon">🔗</span> ربط الأهداف
                    </button>
                    <button class="btn btn-sm btn-success" onclick="exportTest(${test.id})">
                        <span class="btn-icon">📥</span> تصدير
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">
                        <span class="btn-icon">🗑️</span> حذف
                    </button>
                </div>
            </div>
            ${test.description ? `<div class="test-description">${test.description}</div>` : ''}
        </div>
    `;
}

function showCreateTestModal() {
    document.getElementById('createTestModal').classList.add('show');
    document.getElementById('testCreationForm').reset();
    currentTestQuestions = [];
    currentTestId = null;
    updateQuestionsCounter();
    showQuestionTypeSelection();
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
    currentTestQuestions = [];
    currentTestId = null;
}

function setupTestCreation() {
    // إعداد أنواع الأسئلة
    setupQuestionTypes();
    
    // إضافة مستمعي الأحداث للنموذج
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const saveTestBtn = document.getElementById('saveTestBtn');
    
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', showQuestionTypeSelection);
    }
    
    if (saveTestBtn) {
        saveTestBtn.addEventListener('click', saveDiagnosticTest);
    }
}

function setupQuestionTypes() {
    const container = document.getElementById('questionTypeGrid');
    if (!container) return;
    
    const questionTypes = [
        {
            id: 'mcq',
            icon: '🔘',
            title: 'اختيار من متعدد',
            description: 'سؤال باختيارات متعددة'
        },
        {
            id: 'dragdrop',
            icon: '↔️',
            title: 'سحب وإفلات',
            description: 'سحب العناصر وإفلاتها في المكان الصحيح'
        },
        {
            id: 'mcq-attachment',
            icon: '📎',
            title: 'اختيار متعدد مع مرفق',
            description: 'سؤال باختيارات متعددة مع مرفق (صورة/فيديو/صوت)'
        },
        {
            id: 'open-ended',
            icon: '📝',
            title: 'سؤال مفتوح',
            description: 'سؤال بإجابة حرة'
        },
        {
            id: 'auto-reading',
            icon: '🔊',
            title: 'تقييم القراءة الآلي',
            description: 'تقييم قراءة الطالب آلياً مع تسجيل الصوت'
        },
        {
            id: 'auto-spelling',
            icon: '✍️',
            title: 'تقييم الإملاء الآلي',
            description: 'تقييم إملاء الطالب آلياً مع الكتابة اليدوية'
        },
        {
            id: 'manual-reading',
            icon: '👂',
            title: 'تقييم القراءة اليدوي',
            description: 'تقييم قراءة الطالب يدوياً'
        },
        {
            id: 'manual-spelling',
            icon: '📝',
            title: 'تقييم الإملاء اليدوي',
            description: 'تقييم إملاء الطالب يدوياً'
        },
        {
            id: 'missing-letter',
            icon: '🔤',
            title: 'أكمل الحرف الناقص',
            description: 'إكمال الحرف الناقص في الكلمة'
        }
    ];
    
    container.innerHTML = questionTypes.map(type => `
        <div class="question-type-card" onclick="selectQuestionType('${type.id}')">
            <div class="question-type-icon">${type.icon}</div>
            <div class="question-type-title">${type.title}</div>
            <div class="question-type-desc">${type.description}</div>
        </div>
    `).join('');
}

function selectQuestionType(type) {
    currentQuestionType = type;
    
    // إضافة تأثير التحديد
    document.querySelectorAll('.question-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = event?.currentTarget;
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // إظهار نموذج السؤال بعد 300 مللي ثانية
    setTimeout(() => {
        showQuestionForm(type);
    }, 300);
}

function showQuestionTypeSelection() {
    const selectionDiv = document.getElementById('questionTypeSelection');
    const formContainer = document.getElementById('questionFormContainer');
    const navigationDiv = document.getElementById('questionsNavigation');
    
    if (selectionDiv) selectionDiv.style.display = 'block';
    if (formContainer) formContainer.style.display = 'none';
    if (navigationDiv) navigationDiv.style.display = 'none';
    
    // إزالة التحديد من جميع البطاقات
    document.querySelectorAll('.question-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    currentQuestionType = '';
}

function showQuestionForm(type) {
    const selectionDiv = document.getElementById('questionTypeSelection');
    const formContainer = document.getElementById('questionFormContainer');
    const navigationDiv = document.getElementById('questionsNavigation');
    
    if (selectionDiv) selectionDiv.style.display = 'none';
    if (formContainer) formContainer.style.display = 'block';
    if (navigationDiv) navigationDiv.style.display = 'block';
    
    // تنظيف الحاوية
    if (formContainer) {
        formContainer.innerHTML = '';
    }
    
    // إنشاء النموذج بناءً على نوع السؤال
    switch(type) {
        case 'mcq':
            createMCQForm();
            break;
        case 'dragdrop':
            createDragDropForm();
            break;
        case 'mcq-attachment':
            createMCQAttachmentForm();
            break;
        case 'open-ended':
            createOpenEndedForm();
            break;
        case 'auto-reading':
            createAutoReadingForm();
            break;
        case 'auto-spelling':
            createAutoSpellingForm();
            break;
        case 'manual-reading':
            createManualReadingForm();
            break;
        case 'manual-spelling':
            createManualSpellingForm();
            break;
        case 'missing-letter':
            createMissingLetterForm();
            break;
        default:
            createMCQForm();
            break;
    }
}

function createMCQForm() {
    const container = document.getElementById('questionFormContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="question-form">
            <div class="question-header">
                <div class="question-number">سؤال اختيار من متعدد</div>
                <div class="question-actions">
                    <button type="button" class="btn btn-sm btn-success" onclick="addMCQOption()">إضافة خيار</button>
                </div>
            </div>
            <div class="question-body">
                <div class="form-group">
                    <label for="mcqQuestionText">نص السؤال:</label>
                    <textarea id="mcqQuestionText" class="form-control" rows="3" placeholder="أدخل نص السؤال..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label>خيارات الإجابة:</label>
                    <div id="mcqOptionsContainer" class="options-container">
                        <!-- سيتم إضافة الخيارات هنا -->
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="mcqPassingCriteria">محك الاجتياز (%):</label>
                    <div class="criteria-input">
                        <input type="number" id="mcqPassingCriteria" min="0" max="100" value="60" required>
                        <span>يجب أن يحقق الطالب نسبة % لاجتياز هذا السؤال</span>
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button type="button" class="btn btn-primary" onclick="saveMCQQuestion()">حفظ السؤال</button>
                <button type="button" class="btn btn-secondary" onclick="showQuestionTypeSelection()">رجوع</button>
            </div>
        </div>
    `;
    
    // إضافة أول خيارين افتراضيين
    addMCQOption();
    addMCQOption();
}

function addMCQOption() {
    const container = document.getElementById('mcqOptionsContainer');
    if (!container) return;
    
    const optionCount = container.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input type="radio" name="correctOption" class="option-checkbox" value="option${optionCount}">
        <input type="text" class="option-text" placeholder="النص ${optionCount}" required>
        <button type="button" class="remove-option" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(optionDiv);
}

function saveMCQQuestion() {
    const questionText = document.getElementById('mcqQuestionText')?.value.trim();
    const options = [];
    const optionElements = document.querySelectorAll('#mcqOptionsContainer .option-item');
    const passingCriteria = parseInt(document.getElementById('mcqPassingCriteria')?.value) || 60;
    
    if (!questionText) {
        showAuthNotification('يرجى إدخال نص السؤال', 'error');
        return;
    }
    
    optionElements.forEach((element, index) => {
        const optionText = element.querySelector('.option-text')?.value.trim();
        const isCorrect = element.querySelector('.option-checkbox')?.checked || false;
        
        if (optionText) {
            options.push({
                id: index + 1,
                text: optionText,
                isCorrect: isCorrect
            });
        }
    });
    
    if (options.length < 2) {
        showAuthNotification('يرجى إضافة خيارين على الأقل', 'error');
        return;
    }
    
    // التحقق من وجود إجابة صحيحة
    const hasCorrectAnswer = options.some(option => option.isCorrect);
    if (!hasCorrectAnswer) {
        showAuthNotification('يرجى تحديد إجابة صحيحة واحدة على الأقل', 'error');
        return;
    }
    
    const question = {
        id: currentTestQuestions.length + 1,
        type: 'mcq',
        text: questionText,
        options: options,
        passingCriteria: passingCriteria,
        createdAt: new Date().toISOString()
    };
    
    currentTestQuestions.push(question);
    updateQuestionsCounter();
    showQuestionTypeSelection();
    showAuthNotification('تم حفظ السؤال بنجاح', 'success');
}

function createDragDropForm() {
    const container = document.getElementById('questionFormContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="question-form">
            <div class="question-header">
                <div class="question-number">سؤال سحب وإفلات</div>
            </div>
            <div class="question-body">
                <div class="form-group">
                    <label for="dragdropQuestionText">نص السؤال:</label>
                    <textarea id="dragdropQuestionText" class="form-control" rows="3" placeholder="أدخل نص السؤال..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="dragdropItems">العناصر القابلة للسحب (افصل بينها بفاصلة):</label>
                    <input type="text" id="dragdropItems" class="form-control" placeholder="عنصر1, عنصر2, عنصر3" required>
                </div>
                
                <div class="form-group">
                    <label for="dragdropTargets">الأهداف (افصل بينها بفاصلة):</label>
                    <input type="text" id="dragdropTargets" class="form-control" placeholder="هدف1, هدف2, هدف3" required>
                </div>
                
                <div class="form-group">
                    <label for="dragdropPassingCriteria">محك الاجتياز (%):</label>
                    <div class="criteria-input">
                        <input type="number" id="dragdropPassingCriteria" min="0" max="100" value="60" required>
                        <span>يجب أن يحقق الطالب نسبة % لاجتياز هذا السؤال</span>
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button type="button" class="btn btn-primary" onclick="saveDragDropQuestion()">حفظ السؤال</button>
                <button type="button" class="btn btn-secondary" onclick="showQuestionTypeSelection()">رجوع</button>
            </div>
        </div>
    `;
}

function saveDragDropQuestion() {
    const questionText = document.getElementById('dragdropQuestionText')?.value.trim();
    const items = document.getElementById('dragdropItems')?.value.split(',').map(item => item.trim());
    const targets = document.getElementById('dragdropTargets')?.value.split(',').map(target => target.trim());
    const passingCriteria = parseInt(document.getElementById('dragdropPassingCriteria')?.value) || 60;
    
    if (!questionText || !items || !targets) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (items.length < 2 || targets.length < 2) {
        showAuthNotification('يرجى إدخال عنصرين وهدفين على الأقل', 'error');
        return;
    }
    
    const question = {
        id: currentTestQuestions.length + 1,
        type: 'dragdrop',
        text: questionText,
        dragItems: items,
        dropTargets: targets,
        passingCriteria: passingCriteria,
        createdAt: new Date().toISOString()
    };
    
    currentTestQuestions.push(question);
    updateQuestionsCounter();
    showQuestionTypeSelection();
    showAuthNotification('تم حفظ السؤال بنجاح', 'success');
}

function createAutoSpellingForm() {
    const container = document.getElementById('questionFormContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="question-form">
            <div class="question-header">
                <div class="question-number">تقييم الإملاء الآلي</div>
            </div>
            <div class="question-body">
                <div class="form-group">
                    <label for="spellingWords">الكلمات للإملاء (افصل بينها بفاصلة):</label>
                    <input type="text" id="spellingWords" class="form-control" placeholder="قلم, كتاب, مدرسة" required>
                </div>
                
                <div class="form-group">
                    <label>منطقة الكتابة اليدوية:</label>
                    <div class="handwriting-area" id="spellingHandwritingArea">
                        <div class="handwriting-tools">
                            <button type="button" class="tool-btn" onclick="setDrawingTool('pen')">
                                <span>✏️</span> قلم
                            </button>
                            <button type="button" class="tool-btn" onclick="setDrawingTool('eraser')">
                                <span>🧽</span> ممحاة
                            </button>
                            <input type="color" class="color-picker" id="spellingPenColor" value="#000000" onchange="setPenColor(this.value)">
                            <button type="button" class="tool-btn" onclick="clearCanvas()">
                                <span>🗑️</span> مسح الكل
                            </button>
                        </div>
                        <canvas id="spellingCanvas" width="800" height="300"></canvas>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="spellingPassingCriteria">محك الاجتياز (%):</label>
                    <div class="criteria-input">
                        <input type="number" id="spellingPassingCriteria" min="0" max="100" value="70" required>
                        <span>يجب أن يحقق الطالب نسبة % لاجتياز هذا السؤال</span>
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button type="button" class="btn btn-primary" onclick="saveAutoSpellingQuestion()">حفظ السؤال</button>
                <button type="button" class="btn btn-secondary" onclick="showQuestionTypeSelection()">رجوع</button>
            </div>
        </div>
    `;
    
    // تهيئة الكانفاس
    setTimeout(() => {
        canvas = document.getElementById('spellingCanvas');
        if (canvas) {
            initializeCanvas();
        }
    }, 100);
}

function initializeCanvas() {
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // إعداد مستمعي الأحداث
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // للشاشات التي تعمل باللمس
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
}

function setDrawingTool(tool) {
    if (!ctx) return;
    
    if (tool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
    } else if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
    }
}

function setPenColor(color) {
    if (ctx) {
        ctx.strokeStyle = color;
    }
}

function clearCanvas() {
    if (ctx && canvas) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
    }
}

function saveAutoSpellingQuestion() {
    const words = document.getElementById('spellingWords')?.value.split(',').map(word => word.trim());
    const passingCriteria = parseInt(document.getElementById('spellingPassingCriteria')?.value) || 70;
    
    if (!words || words.length === 0) {
        showAuthNotification('يرجى إدخال كلمات للإملاء', 'error');
        return;
    }
    
    const question = {
        id: currentTestQuestions.length + 1,
        type: 'auto-spelling',
        words: words,
        passingCriteria: passingCriteria,
        createdAt: new Date().toISOString()
    };
    
    currentTestQuestions.push(question);
    updateQuestionsCounter();
    showQuestionTypeSelection();
    showAuthNotification('تم حفظ السؤال بنجاح', 'success');
}

function createMissingLetterForm() {
    const container = document.getElementById('questionFormContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="question-form">
            <div class="question-header">
                <div class="question-number">أكمل الحرف الناقص</div>
            </div>
            <div class="question-body">
                <div class="form-group">
                    <label for="missingLetterText">النص مع الحرف الناقص (استخدم _ للحرف الناقص):</label>
                    <input type="text" id="missingLetterText" class="form-control" placeholder="مثلاً: ق_م" required>
                </div>
                
                <div class="form-group">
                    <label>منطقة الكتابة اليدوية:</label>
                    <div class="handwriting-area" id="missingLetterHandwritingArea">
                        <div class="handwriting-tools">
                            <button type="button" class="tool-btn" onclick="setDrawingTool('pen')">
                                <span>✏️</span> قلم
                            </button>
                            <button type="button" class="tool-btn" onclick="setDrawingTool('eraser')">
                                <span>🧽</span> ممحاة
                            </button>
                            <input type="color" class="color-picker" id="missingLetterPenColor" value="#000000" onchange="setPenColor(this.value)">
                            <button type="button" class="tool-btn" onclick="clearCanvas()">
                                <span>🗑️</span> مسح الكل
                            </button>
                        </div>
                        <canvas id="missingLetterCanvas" width="800" height="200"></canvas>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="missingLetterAnswer">الإجابة الصحيحة:</label>
                    <input type="text" id="missingLetterAnswer" class="form-control" placeholder="الحرف الصحيح" required>
                </div>
                
                <div class="form-group">
                    <label for="missingLetterPassingCriteria">محك الاجتياز (%):</label>
                    <div class="criteria-input">
                        <input type="number" id="missingLetterPassingCriteria" min="0" max="100" value="70" required>
                        <span>يجب أن يحقق الطالب نسبة % لاجتياز هذا السؤال</span>
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button type="button" class="btn btn-primary" onclick="saveMissingLetterQuestion()">حفظ السؤال</button>
                <button type="button" class="btn btn-secondary" onclick="showQuestionTypeSelection()">رجوع</button>
            </div>
        </div>
    `;
    
    // تهيئة الكانفاس
    setTimeout(() => {
        canvas = document.getElementById('missingLetterCanvas');
        if (canvas) {
            initializeCanvas();
        }
    }, 100);
}

function saveMissingLetterQuestion() {
    const text = document.getElementById('missingLetterText')?.value.trim();
    const correctAnswer = document.getElementById('missingLetterAnswer')?.value.trim();
    const passingCriteria = parseInt(document.getElementById('missingLetterPassingCriteria')?.value) || 70;
    
    if (!text || !correctAnswer) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (!text.includes('_')) {
        showAuthNotification('يجب أن يحتوي النص على حرف ناقص (_)', 'error');
        return;
    }
    
    const question = {
        id: currentTestQuestions.length + 1,
        type: 'missing-letter',
        text: text,
        correctAnswer: correctAnswer,
        passingCriteria: passingCriteria,
        createdAt: new Date().toISOString()
    };
    
    currentTestQuestions.push(question);
    updateQuestionsCounter();
    showQuestionTypeSelection();
    showAuthNotification('تم حفظ السؤال بنجاح', 'success');
}

// دالة إنشاء النماذج الأخرى (مبسطة لأغراض العرض)
function createMCQAttachmentForm() {
    createMCQForm();
    showAuthNotification('هذا النوع قيد التطوير', 'info');
}

function createOpenEndedForm() {
    const container = document.getElementById('questionFormContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="question-form">
            <div class="question-header">
                <div class="question-number">سؤال مفتوح</div>
            </div>
            <div class="question-body">
                <div class="form-group">
                    <label for="openEndedQuestionText">نص السؤال:</label>
                    <textarea id="openEndedQuestionText" class="form-control" rows="3" placeholder="أدخل نص السؤال..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="openEndedModelAnswer">الإجابة النموذجية (اختياري):</label>
                    <textarea id="openEndedModelAnswer" class="form-control" rows="2" placeholder="الإجابة النموذجية..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="openEndedPassingCriteria">محك الاجتياز (%):</label>
                    <div class="criteria-input">
                        <input type="number" id="openEndedPassingCriteria" min="0" max="100" value="50" required>
                        <span>يجب أن يحقق الطالب نسبة % لاجتياز هذا السؤال</span>
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button type="button" class="btn btn-primary" onclick="saveOpenEndedQuestion()">حفظ السؤال</button>
                <button type="button" class="btn btn-secondary" onclick="showQuestionTypeSelection()">رجوع</button>
            </div>
        </div>
    `;
}

function saveOpenEndedQuestion() {
    const questionText = document.getElementById('openEndedQuestionText')?.value.trim();
    const modelAnswer = document.getElementById('openEndedModelAnswer')?.value.trim();
    const passingCriteria = parseInt(document.getElementById('openEndedPassingCriteria')?.value) || 50;
    
    if (!questionText) {
        showAuthNotification('يرجى إدخال نص السؤال', 'error');
        return;
    }
    
    const question = {
        id: currentTestQuestions.length + 1,
        type: 'open-ended',
        text: questionText,
        modelAnswer: modelAnswer || '',
        passingCriteria: passingCriteria,
        createdAt: new Date().toISOString()
    };
    
    currentTestQuestions.push(question);
    updateQuestionsCounter();
    showQuestionTypeSelection();
    showAuthNotification('تم حفظ السؤال بنجاح', 'success');
}

function createAutoReadingForm() {
    showAuthNotification('هذا النوع قيد التطوير', 'info');
    showQuestionTypeSelection();
}

function createManualReadingForm() {
    showAuthNotification('هذا النوع قيد التطوير', 'info');
    showQuestionTypeSelection();
}

function createManualSpellingForm() {
    createAutoSpellingForm();
    showAuthNotification('هذا النوع مشابه للإملاء الآلي', 'info');
}

function updateQuestionsCounter() {
    const counter = document.getElementById('questionsCounter');
    if (counter) {
        counter.textContent = `(${currentTestQuestions.length} سؤال)`;
    }
}

function saveDiagnosticTest() {
    const title = document.getElementById('testTitle')?.value.trim();
    const subject = document.getElementById('testSubject')?.value;
    const description = document.getElementById('testDescription')?.value.trim();
    
    if (!title || !subject) {
        showAuthNotification('يرجى إدخال عنوان الاختبار واختيار المادة', 'error');
        return;
    }
    
    if (currentTestQuestions.length === 0) {
        showAuthNotification('يرجى إضافة سؤال واحد على الأقل', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    
    const newTest = {
        id: generateId(),
        teacherId: currentUser.id,
        title: title,
        subject: subject,
        description: description,
        questions: currentTestQuestions,
        passingCriteria: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tests.push(newTest);
    localStorage.setItem('diagnosticTests', JSON.stringify(tests));
    
    showAuthNotification('تم إنشاء الاختبار بنجاح', 'success');
    closeCreateTestModal();
    loadDiagnosticTests();
    
    // إضافة نشاط
    addCommitteeActivity({
        type: 'test',
        title: 'أنشأت اختباراً تشخيصياً',
        description: `${title} - ${subject}`
    });
}

function viewTest(testId) {
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    currentTestData = test;
    
    // عرض تفاصيل الاختبار
    document.getElementById('viewTestTitle').textContent = test.title;
    document.getElementById('viewTestSubject').textContent = test.subject;
    document.getElementById('viewTestDescription').textContent = test.description || 'لا يوجد وصف';
    document.getElementById('viewTestDate').textContent = formatDate(test.createdAt);
    document.getElementById('viewTestQuestionsCount').textContent = test.questions.length;
    
    let questionsHtml = '';
    test.questions.forEach((question, index) => {
        const questionType = getQuestionTypeName(question.type);
        questionsHtml += `
            <div class="question-item">
                <div class="question-header">
                    <div class="question-number">سؤال ${index + 1}: ${questionType}</div>
                </div>
                <div class="question-text">${question.text || 'سؤال بدون نص'}</div>
                <div class="question-meta">
                    <span>محك الاجتياز: ${question.passingCriteria}%</span>
                    ${question.linkedObjectiveId ? 
                        '<span class="badge badge-success">مربوط بهدف</span>' : 
                        '<span class="badge badge-warning">غير مربوط</span>'}
                </div>
            </div>
        `;
    });
    
    document.getElementById('viewTestQuestions').innerHTML = questionsHtml || '<p>لا توجد أسئلة</p>';
    document.getElementById('viewTestModal').classList.add('show');
}

function closeViewTestModal() {
    document.getElementById('viewTestModal').classList.remove('show');
    currentTestData = null;
}

function editTest(testId) {
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // تحميل بيانات الاختبار للنموذج
    document.getElementById('testTitle').value = test.title;
    document.getElementById('testSubject').value = test.subject;
    document.getElementById('testDescription').value = test.description || '';
    
    currentTestQuestions = test.questions;
    currentTestId = testId;
    
    updateQuestionsCounter();
    document.getElementById('createTestModal').classList.add('show');
    showQuestionTypeSelection();
    
    showAuthNotification('جاري تحميل الاختبار للتعديل...', 'info');
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
    
    // إزالة الأهداف المربوطة قبل التصدير
    const testToExport = {
        ...test,
        questions: test.questions.map(q => ({
            ...q,
            linkedObjectiveId: undefined
        }))
    };
    
    const blob = new Blob([JSON.stringify(testToExport, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `اختبار_${test.title.replace(/\s+/g, '_')}_${test.subject}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAuthNotification('تم تصدير الاختبار بنجاح', 'success');
}

function linkObjectives(testId) {
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    if (!test.questions || test.questions.length === 0) {
        showAuthNotification('لا توجد أسئلة في هذا الاختبار', 'error');
        return;
    }
    
    currentTestId = testId;
    currentQuestionIndex = 0;
    
    loadQuestionForLinking(test, 0);
    document.getElementById('linkObjectivesModal').classList.add('show');
}

function loadQuestionForLinking(test, questionIndex) {
    if (questionIndex >= test.questions.length) {
        showAuthNotification('تم الانتهاء من جميع الأسئلة', 'success');
        saveLinkingProgress();
        closeLinkObjectivesModal();
        return;
    }
    
    const question = test.questions[questionIndex];
    currentQuestionIndex = questionIndex;
    
    document.getElementById('linkingQuestionNumber').textContent = 
        `السؤال ${questionIndex + 1} من ${test.questions.length}`;
    document.getElementById('linkingQuestionText').textContent = 
        question.text || `سؤال ${question.type}`;
    
    // جلب الأهداف المتاحة للمادة
    const objectives = getObjectivesForSubject(test.subject);
    const linkedObjectiveId = question.linkedObjectiveId;
    
    let objectivesHtml = '';
    if (objectives.length === 0) {
        objectivesHtml = `
            <div class="alert alert-warning">
                لا توجد أهداف قصيرة مضافة للمادة "${test.subject}" بعد.
                <br>
                <button class="btn btn-sm btn-primary mt-2" onclick="showAddObjectiveModal('${test.subject}')">
                    إضافة هدف جديد
                </button>
            </div>
        `;
    } else {
        objectives.forEach(objective => {
            const isSelected = linkedObjectiveId === objective.id;
            objectivesHtml += `
                <div class="objective-option ${isSelected ? 'selected' : ''}" 
                     onclick="selectLinkingObjective(${objective.id}, this)">
                    <input type="radio" name="linkingObjective" 
                           value="${objective.id}" 
                           ${isSelected ? 'checked' : ''}>
                    <span>${objective.text}</span>
                </div>
            `;
        });
    }
    
    document.getElementById('objectivesList').innerHTML = objectivesHtml;
}

function selectLinkingObjective(objectiveId, element) {
    // إزالة التحديد من جميع الخيارات
    document.querySelectorAll('.objective-option').forEach(opt => {
        opt.classList.remove('selected');
        opt.querySelector('input[type="radio"]').checked = false;
    });
    
    // إضافة التحديد للخيار المحدد
    element.classList.add('selected');
    element.querySelector('input[type="radio"]').checked = true;
    currentObjectiveId = objectiveId;
}

function nextLinkingQuestion() {
    const selectedRadio = document.querySelector('input[name="linkingObjective"]:checked');
    
    if (!selectedRadio && currentQuestionIndex < currentTestData?.questions.length) {
        showAuthNotification('يرجى اختيار هدف قصير للسؤال الحالي', 'error');
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const testIndex = tests.findIndex(t => t.id === currentTestId);
    
    if (testIndex !== -1) {
        if (selectedRadio) {
            tests[testIndex].questions[currentQuestionIndex].linkedObjectiveId = 
                parseInt(selectedRadio.value);
        }
        
        localStorage.setItem('diagnosticTests', JSON.stringify(tests));
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < tests[testIndex].questions.length) {
        loadQuestionForLinking(tests[testIndex], currentQuestionIndex);
    } else {
        showAuthNotification('تم الانتهاء من ربط جميع الأسئلة', 'success');
        saveLinkingProgress();
        closeLinkObjectivesModal();
        loadDiagnosticTests();
    }
}

function saveLinkingProgress() {
    const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
    const testIndex = tests.findIndex(t => t.id === currentTestId);
    
    if (testIndex !== -1) {
        tests[testIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('diagnosticTests', JSON.stringify(tests));
        showAuthNotification('تم حفظ عملية الربط', 'success');
    }
}

function closeLinkObjectivesModal() {
    document.getElementById('linkObjectivesModal').classList.remove('show');
    currentTestId = null;
    currentQuestionIndex = 0;
    currentObjectiveId = null;
}

function showAddObjectiveModal(subject) {
    const modalHtml = `
        <div class="modal" id="addObjectiveModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>إضافة هدف قصير جديد</h3>
                    <button class="modal-close" onclick="closeAddObjectiveModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="newObjectiveText">نص الهدف:</label>
                        <textarea id="newObjectiveText" class="form-control" rows="3" placeholder="أدخل نص الهدف..." required></textarea>
                    </div>
                    <input type="hidden" id="newObjectiveSubject" value="${subject}">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeAddObjectiveModal()">إلغاء</button>
                    <button class="btn btn-success" onclick="addNewObjective()">إضافة</button>
                </div>
            </div>
        </div>
    `;
    
    // إزالة أي نافذة سابقة
    const existingModal = document.getElementById('addObjectiveModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // إضافة النافذة الجديدة
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('addObjectiveModal').classList.add('show');
}

function closeAddObjectiveModal() {
    const modal = document.getElementById('addObjectiveModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function addNewObjective() {
    const text = document.getElementById('newObjectiveText')?.value.trim();
    const subject = document.getElementById('newObjectiveSubject')?.value;
    
    if (!text) {
        showAuthNotification('يرجى إدخال نص الهدف', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const objectives = JSON.parse(localStorage.getItem('shortTermObjectives') || '[]');
    
    const newObjective = {
        id: generateId(),
        teacherId: currentUser.id,
        subject: subject,
        text: text,
        createdAt: new Date().toISOString()
    };
    
    objectives.push(newObjective);
    localStorage.setItem('shortTermObjectives', JSON.stringify(objectives));
    
    showAuthNotification('تم إضافة الهدف بنجاح', 'success');
    closeAddObjectiveModal();
    
    // إعادة تحميل قائمة الأهداف في نافذة الربط
    if (currentTestId) {
        const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
        const test = tests.find(t => t.id === currentTestId);
        if (test) {
            loadQuestionForLinking(test, currentQuestionIndex);
        }
    }
}

function getObjectivesForSubject(subject) {
    const objectives = JSON.parse(localStorage.getItem('shortTermObjectives') || '[]');
    const currentUser = getCurrentUser();
    
    return objectives.filter(obj => 
        obj.subject === subject && 
        obj.teacherId === currentUser.id
    );
}

function getQuestionTypeName(type) {
    const types = {
        'mcq': 'اختيار من متعدد',
        'dragdrop': 'سحب وإفلات',
        'mcq-attachment': 'اختيار متعدد مع مرفق',
        'open-ended': 'سؤال مفتوح',
        'auto-reading': 'تقييم القراءة الآلي',
        'auto-spelling': 'تقييم الإملاء الآلي',
        'manual-reading': 'تقييم القراءة اليدوي',
        'manual-spelling': 'تقييم الإملاء اليدوي',
        'missing-letter': 'أكمل الحرف الناقص'
    };
    
    return types[type] || type;
}

function importTest() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const importedTest = JSON.parse(event.target.result);
                const currentUser = getCurrentUser();
                
                // التحقق من صحة هيكل الملف
                if (!importedTest.title || !importedTest.subject || !importedTest.questions) {
                    showAuthNotification('ملف غير صالح: تأكد من أن الملف يحتوي على بيانات اختبار كاملة', 'error');
                    return;
                }
                
                // تعديل بيانات الاختبار المستورد
                importedTest.id = generateId();
                importedTest.teacherId = currentUser.id;
                importedTest.createdAt = new Date().toISOString();
                importedTest.updatedAt = new Date().toISOString();
                
                // إزالة الأهداف المربوطة من الأسئلة
                importedTest.questions = importedTest.questions.map(question => {
                    const { linkedObjectiveId, ...questionWithoutLink } = question;
                    return questionWithoutLink;
                });
                
                // حفظ الاختبار المستورد
                const tests = JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
                tests.push(importedTest);
                localStorage.setItem('diagnosticTests', JSON.stringify(tests));
                
                showAuthNotification('تم استيراد الاختبار بنجاح', 'success');
                loadDiagnosticTests();
                
                // إضافة نشاط
                addCommitteeActivity({
                    type: 'test',
                    title: 'استورد اختباراً تشخيصياً',
                    description: `${importedTest.title} - ${importedTest.subject}`
                });
                
            } catch (error) {
                console.error('خطأ في قراءة الملف:', error);
                showAuthNotification('خطأ في قراءة الملف: تأكد من أن الملف بتنسيق JSON صحيح', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// الدوال المساعدة
// ============================================

function addCommitteeActivity(activity) {
    try {
        const activities = JSON.parse(localStorage.getItem('committeeActivities') || '[]');
        activity.timestamp = new Date().toISOString();
        activity.userId = getCurrentUser()?.id;
        
        activities.unshift(activity);
        
        // الاحتفاظ بآخر 50 نشاط فقط
        if (activities.length > 50) {
            activities.splice(50);
        }
        
        localStorage.setItem('committeeActivities', JSON.stringify(activities));
    } catch (error) {
        console.error('خطأ في إضافة النشاط:', error);
    }
}

function loadLessons() {
    const container = document.getElementById('lessonsContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس</h3>
                <p>سيتم إضافة نظام الدروس قريباً</p>
            </div>
        `;
    }
}

function loadObjectives() {
    const container = document.getElementById('objectivesContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>لا توجد أهداف قصيرة المدى</h3>
                <p>سيتم إضافة نظام الأهداف قريباً</p>
            </div>
        `;
    }
}

function loadAssignments() {
    const container = document.getElementById('assignmentsContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد واجبات</h3>
                <p>سيتم إضافة نظام الواجبات قريباً</p>
            </div>
        `;
    }
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

// دوال اللجنة الأصلية
window.showAddMemberModal = showAddMemberModal;
window.closeAddMemberModal = closeAddMemberModal;
window.viewMemberCredentials = viewMemberCredentials;
window.editCommitteeMember = editCommitteeMember;
window.deleteCommitteeMember = deleteCommitteeMember;
window.viewNote = viewNote;
window.markNoteAsRead = markNoteAsRead;
window.deleteNote = deleteNote;

// دوال الاختبارات التشخيصية
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.selectQuestionType = selectQuestionType;
window.addMCQOption = addMCQOption;
window.saveMCQQuestion = saveMCQQuestion;
window.saveDragDropQuestion = saveDragDropQuestion;
window.saveAutoSpellingQuestion = saveAutoSpellingQuestion;
window.saveMissingLetterQuestion = saveMissingLetterQuestion;
window.saveOpenEndedQuestion = saveOpenEndedQuestion;
window.viewTest = viewTest;
window.closeViewTestModal = closeViewTestModal;
window.editTest = editTest;
window.deleteTest = deleteTest;
window.exportTest = exportTest;
window.linkObjectives = linkObjectives;
window.selectLinkingObjective = selectLinkingObjective;
window.nextLinkingQuestion = nextLinkingQuestion;
window.closeLinkObjectivesModal = closeLinkObjectivesModal;
window.importTest = importTest;

// دوال الكتابة اليدوية
window.initializeCanvas = initializeCanvas;
window.setDrawingTool = setDrawingTool;
window.setPenColor = setPenColor;
window.clearCanvas = clearCanvas;

// دوال الأهداف
window.showAddObjectiveModal = showAddObjectiveModal;
window.closeAddObjectiveModal = closeAddObjectiveModal;
window.addNewObjective = addNewObjective;

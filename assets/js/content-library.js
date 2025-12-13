// إدارة مكتبة المحتوى التعليمي
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('content-library.html')) {
        loadContentLibrary();
    }
});

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
    const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);

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
                <span class="content-badge subject-${test.subject}">${test.subject}</span>
            </div>
            <div class="content-body">
                <p>${test.description || 'لا يوجد وصف'}</p>
                <div class="content-meta">
                    <span class="questions-count">${test.questions?.length || 0} سؤال</span>
                    <span class="objectives-status ${test.objectivesLinked ? 'linked' : 'not-linked'}">
                        ${test.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}
                    </span>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})" title="عرض">👁️</button>
                <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})" title="تعديل">✏️</button>
                <button class="btn btn-sm btn-info" onclick="exportContent('test', ${test.id})" title="تصدير">📤</button>
                <button class="btn btn-sm btn-secondary" onclick="linkObjectives(${test.id})" title="ربط الأهداف">🎯</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})" title="حذف">🗑️</button>
            </div>
        </div>
    `).join('');
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
                <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})" title="عرض">👁️</button>
                <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})" title="تعديل">✏️</button>
                <button class="btn btn-sm btn-info" onclick="exportContent('lesson', ${lesson.id})" title="تصدير">📤</button>
                <button class="btn btn-sm btn-secondary" onclick="linkTeachingObjectives(${lesson.id})" title="ربط الأهداف">🎯</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})" title="حذف">🗑️</button>
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
                    <button class="btn btn-sm btn-warning" onclick="editObjective(${obj.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteObjective(${obj.id})">🗑️</button>
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
                <button class="btn btn-sm btn-primary" onclick="viewAssignment(${assignment.id})" title="عرض">👁️</button>
                <button class="btn btn-sm btn-warning" onclick="editAssignment(${assignment.id})" title="تعديل">✏️</button>
                <button class="btn btn-sm btn-info" onclick="exportContent('assignment', ${assignment.id})" title="تصدير">📤</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${assignment.id})" title="حذف">🗑️</button>
            </div>
        </div>
    `).join('');
}

// دوال إدارة الاختبارات
function showCreateTestModal() {
    document.getElementById('createTestModal').classList.add('show');
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
    document.getElementById('createTestForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
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
                    <option value="drag-drop">سحب وإفلات</option>
                    <option value="open-ended">سؤال مفتوح</option>
                    <option value="reading-auto">تقييم القراءة الآلي</option>
                    <option value="spelling-auto">تقييم الإملاء الآلي</option>
                </select>
            </div>
            <div class="question-content">
                <!-- سيتم تعبئته بناءً على نوع السؤال -->
            </div>
        </div>
    `;
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHTML);
    changeQuestionType(questionIndex);
}

function changeQuestionType(questionIndex) {
    const questionItem = document.querySelector(`.question-item[data-index="${questionIndex}"]`);
    const questionType = questionItem.querySelector('.question-type').value;
    const questionContent = questionItem.querySelector('.question-content');
    
    let contentHTML = '';
    
    switch(questionType) {
        case 'multiple-choice':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">نص السؤال</label>
                    <textarea class="form-control question-text" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">الخيارات</label>
                    <div class="choices-container">
                        <div class="choice-item">
                            <input type="text" class="form-control choice-text" placeholder="النص">
                            <input type="checkbox" class="choice-correct"> صحيح
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addChoice(${questionIndex})">+ إضافة خيار</button>
                </div>
                <div class="form-group">
                    <label class="form-label">محك الاجتياز (%)</label>
                    <input type="number" class="form-control passing-criteria" min="0" max="100" value="80">
                </div>
            `;
            break;
            
        case 'open-ended':
            contentHTML = `
                <div class="form-group">
                    <label class="form-label">نص السؤال</label>
                    <textarea class="form-control question-text" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">الإجابة النموذجية (اختياري)</label>
                    <textarea class="form-control model-answer" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">محك الاجتياز (%)</label>
                    <input type="number" class="form-control passing-criteria" min="0" max="100" value="80">
                </div>
            `;
            break;
            
        // يمكن إضافة الأنواع الأخرى هنا
        default:
            contentHTML = `<p>نوع السؤال: ${questionType} - سيتم تطويره لاحقاً</p>`;
    }
    
    questionContent.innerHTML = contentHTML;
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
            <input type="checkbox" class="choice-correct"> صحيح
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">🗑️</button>
        </div>
    `;
    choicesContainer.insertAdjacentHTML('beforeend', choiceHTML);
}

function saveTest() {
    const form = document.getElementById('createTestForm');
    const title = document.getElementById('testTitle').value.trim();
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value.trim();

    if (!title || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }

    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');
    
    questionItems.forEach(item => {
        const questionType = item.querySelector('.question-type').value;
        const questionText = item.querySelector('.question-text')?.value.trim();
        const passingCriteria = item.querySelector('.passing-criteria')?.value || 80;
        
        if (questionText) {
            questions.push({
                type: questionType,
                text: questionText,
                passingCriteria: parseInt(passingCriteria)
            });
        }
    });

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentTeacher = getCurrentUser();

    const newTest = {
        id: generateId(),
        teacherId: currentTeacher.id,
        title: title,
        subject: subject,
        description: description,
        questions: questions,
        objectivesLinked: false,
        createdAt: new Date().toISOString()
    };

    tests.push(newTest);
    localStorage.setItem('tests', JSON.stringify(tests));

    showAuthNotification('تم حفظ الاختبار بنجاح', 'success');
    closeCreateTestModal();
    loadTests();
}

// دوال إدارة الدروس
function showCreateLessonModal() {
    document.getElementById('createLessonModal').classList.add('show');
}

function closeCreateLessonModal() {
    document.getElementById('createLessonModal').classList.remove('show');
    document.getElementById('createLessonForm').reset();
    document.getElementById('exercisesContainer').innerHTML = '';
}

function addExercise() {
    const exercisesContainer = document.getElementById('exercisesContainer');
    const exerciseIndex = exercisesContainer.children.length;
    
    const exerciseHTML = `
        <div class="exercise-item" data-index="${exerciseIndex}">
            <div class="exercise-header">
                <h5>التمرين ${exerciseIndex + 1}</h5>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeExercise(${exerciseIndex})">🗑️</button>
            </div>
            <div class="form-group">
                <label class="form-label">نوع التمرين</label>
                <select class="form-control exercise-type">
                    <option value="multiple-choice">اختيار من متعدد</option>
                    <option value="drag-drop">سحب وإفلات</option>
                    <option value="open-ended">سؤال مفتوح</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">نص التمرين</label>
                <textarea class="form-control exercise-text" rows="3"></textarea>
            </div>
        </div>
    `;
    
    exercisesContainer.insertAdjacentHTML('beforeend', exerciseHTML);
}

function removeExercise(exerciseIndex) {
    const exerciseItem = document.querySelector(`.exercise-item[data-index="${exerciseIndex}"]`);
    if (exerciseItem) {
        exerciseItem.remove();
        // إعادة ترقيم التمارين المتبقية
        const remainingExercises = document.querySelectorAll('.exercise-item');
        remainingExercises.forEach((item, index) => {
            item.setAttribute('data-index', index);
            item.querySelector('h5').textContent = `التمرين ${index + 1}`;
        });
    }
}

function saveLesson() {
    const form = document.getElementById('createLessonForm');
    const title = document.getElementById('lessonTitle').value.trim();
    const strategy = document.getElementById('lessonStrategy').value.trim();
    const subject = document.getElementById('lessonSubject').value;
    const description = document.getElementById('lessonDescription').value.trim();

    if (!title || !strategy || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }

    const exercises = [];
    const exerciseItems = document.querySelectorAll('.exercise-item');
    
    exerciseItems.forEach(item => {
        const exerciseType = item.querySelector('.exercise-type').value;
        const exerciseText = item.querySelector('.exercise-text')?.value.trim();
        
        if (exerciseText) {
            exercises.push({
                type: exerciseType,
                text: exerciseText
            });
        }
    });

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentTeacher = getCurrentUser();

    const newLesson = {
        id: generateId(),
        teacherId: currentTeacher.id,
        title: title,
        strategy: strategy,
        subject: subject,
        description: description,
        exercises: exercises,
        objectivesLinked: false,
        priority: 1,
        createdAt: new Date().toISOString()
    };

    lessons.push(newLesson);
    localStorage.setItem('lessons', JSON.stringify(lessons));

    showAuthNotification('تم حفظ الدرس بنجاح', 'success');
    closeCreateLessonModal();
    loadLessons();
}

// دوال عامة
function showCreateObjectiveModal() {
    showAuthNotification('سيتم تطوير هذه الوظيفة في المرحلة القادمة', 'info');
}

function showCreateAssignmentModal() {
    showAuthNotification('سيتم تطوير هذه الوظيفة في المرحلة القادمة', 'info');
}

function showImportModal(type) {
    showAuthNotification(`سيتم تطوير استيراد ${type} في المرحلة القادمة`, 'info');
}

function exportContent(type, id) {
    showAuthNotification(`جاري تصدير ${type}...`, 'info');
    setTimeout(() => {
        showAuthNotification(`تم تصدير ${type} بنجاح`, 'success');
    }, 1500);
}

function linkObjectives(testId) {
    showAuthNotification('جاري فتح نافذة ربط الأهداف...', 'info');
    // سيتم تطوير هذه الوظيفة بالكامل لاحقاً
}

function linkTeachingObjectives(lessonId) {
    showAuthNotification('جاري فتح نافذة ربط الأهداف التدريسية...', 'info');
    // سيتم تطوير هذه الوظيفة بالكامل لاحقاً
}

// تصدير الدوال للاستخدام العالمي
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.showCreateLessonModal = showCreateLessonModal;
window.closeCreateLessonModal = closeCreateLessonModal;
window.addQuestion = addQuestion;
window.addExercise = addExercise;
window.removeQuestion = removeQuestion;
window.removeExercise = removeExercise;
window.changeQuestionType = changeQuestionType;
window.addChoice = addChoice;
window.saveTest = saveTest;
window.saveLesson = saveLesson;
window.showCreateObjectiveModal = showCreateObjectiveModal;
window.showCreateAssignmentModal = showCreateAssignmentModal;
window.showImportModal = showImportModal;
window.exportContent = exportContent;
window.linkObjectives = linkObjectives;

window.linkTeachingObjectives = linkTeachingObjectives;
<!-- نافذة إنشاء اختبار -->
<div id="createTestModal" class="modal">
    <div class="modal-content large">
        <div class="modal-header">
            <h3>إنشاء اختبار تشخيصي جديد</h3>
            <button class="modal-close" onclick="closeCreateTestModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="createTestForm">
                <div class="form-group">
                    <label class="form-label">عنوان الاختبار *</label>
                    <input type="text" id="testTitle" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">المادة *</label>
                    <select id="testSubject" class="form-control" required>
                        <option value="لغتي">لغتي</option>
                        <option value="رياضيات">رياضيات</option>
                        <option value="علوم">علوم</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">وصف الاختبار (اختياري)</label>
                    <textarea id="testDescription" class="form-control" rows="3"></textarea>
                </div>
                
                <h4>الأسئلة</h4>
                <div id="questionsContainer">
                    <!-- الأسئلة ستضاف هنا -->
                </div>
                
                <button type="button" class="btn btn-outline-primary" onclick="addQuestion()">
                    + إضافة سؤال
                </button>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-success" onclick="saveTest()">حفظ الاختبار</button>
            <button class="btn btn-secondary" onclick="closeCreateTestModal()">إلغاء</button>
        </div>
    </div>
</div>

<!-- نافذة إنشاء درس -->
<div id="createLessonModal" class="modal">
    <div class="modal-content large">
        <div class="modal-header">
            <h3>إنشاء درس جديد</h3>
            <button class="modal-close" onclick="closeCreateLessonModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="createLessonForm">
                <div class="form-group">
                    <label class="form-label">عنوان الدرس *</label>
                    <input type="text" id="lessonTitle" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">الاستراتيجية التدريسية *</label>
                    <input type="text" id="lessonStrategy" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">المادة *</label>
                    <select id="lessonSubject" class="form-control" required>
                        <option value="لغتي">لغتي</option>
                        <option value="رياضيات">رياضيات</option>
                        <option value="علوم">علوم</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">وصف الدرس (اختياري)</label>
                    <textarea id="lessonDescription" class="form-control" rows="3"></textarea>
                </div>
                
                <h4>التمارين</h4>
                <div id="exercisesContainer">
                    <!-- التمارين ستضاف هنا -->
                </div>
                
                <button type="button" class="btn btn-outline-primary" onclick="addExercise()">
                    + إضافة تمرين
                </button>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-success" onclick="saveLesson()">حفظ الدرس</button>
            <button class="btn btn-secondary" onclick="closeCreateLessonModal()">إلغاء</button>
        </div>
    </div>
</div>

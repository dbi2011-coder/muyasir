// إدارة مكتبة المحتوى التعليمي - ميسر التعلم

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

// ==========================================
// 1. إدارة الأهداف قصيرة المدى (Short-term Objectives)
// ==========================================

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

function showCreateObjectiveModal() {
    document.getElementById('createObjectiveModal').classList.add('show');
    document.getElementById('createObjectiveForm').reset();
    document.getElementById('instructionalGoalsContainer').innerHTML = `
        <div class="input-group mb-2" style="display:flex; gap:5px;">
            <input type="text" class="form-control instructional-goal-input" placeholder="هدف تدريسي 1" required>
        </div>`;
}

function closeCreateObjectiveModal() {
    document.getElementById('createObjectiveModal').classList.remove('show');
}

function addInstructionalGoalInput() {
    const container = document.getElementById('instructionalGoalsContainer');
    const count = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.style.display = 'flex';
    div.style.gap = '5px';
    div.style.marginTop = '5px';
    div.innerHTML = `
        <input type="text" class="form-control instructional-goal-input" placeholder="هدف تدريسي ${count}" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function saveObjective() {
    const subject = document.getElementById('objSubject').value;
    const shortTermText = document.getElementById('shortTermGoal').value.trim();
    
    const instructionalInputs = document.querySelectorAll('.instructional-goal-input');
    const instructionalGoals = [];
    instructionalInputs.forEach(input => {
        if(input.value.trim()) instructionalGoals.push(input.value.trim());
    });

    if (!shortTermText || instructionalGoals.length === 0) {
        showAuthNotification('يرجى كتابة الهدف القصير وهدف تدريسي واحد على الأقل', 'error');
        return;
    }

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const exists = objectives.some(obj => obj.shortTerm === shortTermText && obj.teacherId === getCurrentUser().id);
    if (exists) {
        showAuthNotification('هذا الهدف موجود مسبقاً', 'error');
        return;
    }

    const newObj = {
        id: generateId(),
        teacherId: getCurrentUser().id,
        subject: subject,
        shortTerm: shortTermText,
        teachingObjectives: instructionalGoals,
        createdAt: new Date().toISOString()
    };

    objectives.push(newObj);
    localStorage.setItem('objectives', JSON.stringify(objectives));
    
    showAuthNotification('تم حفظ الهدف بنجاح', 'success');
    closeCreateObjectiveModal();
    loadObjectives();
}

function deleteObjective(objectiveId) {
    if (!confirm('هل أنت متأكد من حذف هذا الهدف؟')) return;
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const updated = objectives.filter(o => o.id !== objectiveId);
    localStorage.setItem('objectives', JSON.stringify(updated));
    showAuthNotification('تم الحذف بنجاح', 'success');
    loadObjectives();
}

function editObjective(id) {
    showAuthNotification('ميزة التعديل قيد التطوير', 'info');
}

// ==========================================
// 2. إدارة الاختبارات والدروس والأسئلة
// ==========================================

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
                <p>${lesson.strategy ? 'الاستراتيجية: ' + lesson.strategy : ''}</p>
                <div class="content-meta">
                    <span class="priority">الأولوية: ${lesson.priority || 1}</span>
                    <span class="objectives-status ${lesson.objectivesLinked ? 'linked' : 'not-linked'}">
                        ${lesson.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}
                    </span>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})" title="عرض">👁️</button>
                <button class="btn btn-sm btn-secondary" onclick="linkTeachingObjectives(${lesson.id})" title="ربط الأهداف">🎯</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})" title="حذف">🗑️</button>
            </div>
        </div>
    `).join('');
}

function showCreateTestModal() {
    document.getElementById('createTestModal').classList.add('show');
    document.getElementById('questionsContainer').innerHTML = '';
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
    document.getElementById('createTestForm').reset();
}

function showCreateLessonModal() {
    document.getElementById('createLessonModal').classList.add('show');
    document.getElementById('exercisesContainer').innerHTML = '';
}

function closeCreateLessonModal() {
    document.getElementById('createLessonModal').classList.remove('show');
    document.getElementById('createLessonForm').reset();
}

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    addQuestionToContainer(container, 'السؤال');
}

function addExercise() {
    const container = document.getElementById('exercisesContainer');
    addQuestionToContainer(container, 'تمرين');
}

function addQuestionToContainer(container, labelPrefix) {
    const index = container.children.length;
    
    const questionHTML = `
        <div class="question-item card p-3 mb-3" data-index="${index}" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px; background: #f9f9f9;">
            <div class="d-flex justify-content-between mb-2" style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <h5>${labelPrefix} ${index + 1}</h5>
                <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">حذف</button>
            </div>
            
            <div class="form-group">
                <label>نوع ${labelPrefix}</label>
                <select class="form-control question-type" onchange="renderQuestionInputs(this, ${index})">
                    <option value="multiple-choice">اختيار من متعدد</option>
                    <option value="true-false">صواب / خطأ</option>
                    <option value="drag-drop">سحب وإفلات</option>
                    <option value="open-ended">سؤال مفتوح</option>
                    <option value="reading-auto">تقييم قراءة آلي</option>
                    <option value="spelling-auto">تقييم إملاء آلي</option>
                    <option value="complete-letter">أكمل الحرف الناقص</option>
                </select>
            </div>

            <div class="question-inputs-area">
                ${getMultipleChoiceTemplate(index)}
            </div>

            <div class="form-group mt-2" style="margin-top:10px;">
                <label>محك الاجتياز (درجة)</label>
                <input type="number" class="form-control passing-score" value="100" min="1" max="100" style="width: 100px;">
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function renderQuestionInputs(selectElement, index) {
    const type = selectElement.value;
    const area = selectElement.parentElement.nextElementSibling;
    let html = '';
    
    switch(type) {
        case 'multiple-choice': html = getMultipleChoiceTemplate(index); break;
        case 'true-false': html = getTrueFalseTemplate(index); break;
        case 'drag-drop': html = getDragDropTemplate(index); break;
        case 'open-ended': html = getOpenEndedTemplate(index); break;
        case 'reading-auto': html = getReadingAutoTemplate(index); break;
        case 'spelling-auto': html = getSpellingAutoTemplate(index); break;
        case 'complete-letter': html = getCompleteLetterTemplate(index); break;
        default: html = '<p class="text-muted">إعدادات هذا السؤال قيد التطوير...</p>';
    }
    area.innerHTML = html;
}

// Templates
function getMultipleChoiceTemplate(index) {
    return `
        <div class="form-group">
            <label>نص السؤال</label>
            <input type="text" class="form-control q-text" placeholder="اكتب السؤال هنا...">
        </div>
        <label>الخيارات (حدد الإجابة الصحيحة)</label>
        <div class="choices-list">
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="radio" name="correct_${index}" value="0">
                <input type="text" class="form-control q-choice" placeholder="الخيار 1">
            </div>
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="radio" name="correct_${index}" value="1">
                <input type="text" class="form-control q-choice" placeholder="الخيار 2">
            </div>
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="radio" name="correct_${index}" value="2">
                <input type="text" class="form-control q-choice" placeholder="الخيار 3">
            </div>
        </div>
    `;
}

function getTrueFalseTemplate(index) {
    return `
        <div class="form-group">
            <label>نص العبارة</label>
            <input type="text" class="form-control q-text" placeholder="اكتب العبارة هنا...">
        </div>
        <div style="display:flex; gap:15px; margin-top:10px;">
            <label><input type="radio" name="correct_${index}" value="true"> صواب</label>
            <label><input type="radio" name="correct_${index}" value="false"> خطأ</label>
        </div>
    `;
}

function getReadingAutoTemplate(index) {
    return `
        <div class="alert alert-info" style="background:#e3f2fd; padding:10px; border-radius:5px; margin-bottom:10px;">
            <small>يتيح هذا النوع للطالب قراءة النص، وسيقوم النظام بتحليله.</small>
        </div>
        <div class="form-group">
            <label>النص المراد قراءته</label>
            <textarea class="form-control q-text" rows="3" placeholder="اكتب الجملة أو الكلمة هنا..."></textarea>
        </div>
    `;
}

function getSpellingAutoTemplate(index) {
    return `
        <div class="alert alert-info" style="background:#e3f2fd; padding:10px; border-radius:5px; margin-bottom:10px;">
            <small>سيقوم النظام بنطق الكلمة، ويقوم الطالب بكتابتها يدوياً.</small>
        </div>
        <div class="form-group">
            <label>الكلمة للإملاء</label>
            <input type="text" class="form-control q-target-word" placeholder="اكتب الكلمة الصحيحة هنا">
        </div>
    `;
}

function getCompleteLetterTemplate(index) {
    return `
        <div class="form-group">
            <label>الكلمة مع الحرف الناقص (استخدم _ للحرف الناقص)</label>
            <input type="text" class="form-control q-text" placeholder="مثال: أ_د">
        </div>
        <div class="form-group">
            <label>الحرف الصحيح</label>
            <input type="text" class="form-control q-answer" placeholder="س">
        </div>
    `;
}

function getDragDropTemplate(index) { return '<p>إعدادات السحب والإفلات (متقدم)</p>'; }
function getOpenEndedTemplate(index) { return '<div class="form-group"><label>نص السؤال</label><textarea class="form-control q-text"></textarea></div>'; }

function saveTest() {
    const title = document.getElementById('testTitle').value;
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value;
    
    const questions = [];
    document.querySelectorAll('#questionsContainer .question-item').forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || item.querySelector('.q-target-word')?.value || '';
        const score = item.querySelector('.passing-score').value;
        
        if (text) {
            questions.push({
                id: generateId(),
                type,
                text,
                passingScore: parseInt(score)
            });
        }
    });

    if (!title || questions.length === 0) {
        showAuthNotification('يرجى كتابة العنوان وإضافة سؤال واحد على الأقل', 'error');
        return;
    }

    const newTest = {
        id: generateId(),
        teacherId: getCurrentUser().id,
        title,
        subject,
        description,
        questions,
        objectivesLinked: false,
        createdAt: new Date().toISOString()
    };

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    tests.push(newTest);
    localStorage.setItem('tests', JSON.stringify(tests));
    
    showAuthNotification('تم حفظ الاختبار بنجاح', 'success');
    closeCreateTestModal();
    loadTests();
}

function saveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    const strategy = document.getElementById('lessonStrategy').value;
    const priority = document.getElementById('lessonPriority').value;
    const intro = document.getElementById('lessonIntro').value;

    const exercises = [];
    document.querySelectorAll('#exercisesContainer .question-item').forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || '';
        if (text) {
            exercises.push({ id: generateId(), type, text });
        }
    });

    if (!title || !strategy) {
        showAuthNotification('يرجى ملء الحقول الإجبارية', 'error');
        return;
    }

    const newLesson = {
        id: generateId(),
        teacherId: getCurrentUser().id,
        title,
        subject,
        strategy,
        priority: parseInt(priority),
        intro,
        exercises,
        objectivesLinked: false,
        createdAt: new Date().toISOString()
    };
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    lessons.push(newLesson);
    localStorage.setItem('lessons', JSON.stringify(lessons));
    
    showAuthNotification('تم حفظ الدرس بنجاح', 'success');
    closeCreateLessonModal();
    loadLessons();
}

// ==========================================
// 3. نظام الربط (Linking System)
// ==========================================

function linkObjectives(contentId) {
    openLinkModal(contentId, 'test');
}

function linkTeachingObjectives(contentId) {
    openLinkModal(contentId, 'lesson');
}

function openLinkModal(contentId, type) {
    document.getElementById('linkTargetId').value = contentId;
    document.getElementById('linkType').value = type;
    
    const title = type === 'test' ? 'ربط الأسئلة بالأهداف قصيرة المدى' : 'ربط الدرس بالأهداف التدريسية';
    document.querySelector('#linkObjectivesModal h3').textContent = title;
    
    renderObjectivesList(type);
    document.getElementById('linkObjectivesModal').classList.add('show');
}

function renderObjectivesList(type, filterText = '') {
    const container = document.getElementById('objectivesSelectionList');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentUser = getCurrentUser();
    const teacherObjs = objectives.filter(o => o.teacherId === currentUser.id);
    
    container.innerHTML = '';
    
    if (teacherObjs.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">لا توجد أهداف مضافة.</p>';
        return;
    }

    teacherObjs.forEach(obj => {
        if (filterText && !obj.shortTerm.includes(filterText)) return;

        if (type === 'test') {
            container.innerHTML += `
                <div class="checkbox-item p-2 border-bottom" style="padding:10px; border-bottom:1px solid #eee;">
                    <label style="display:flex; gap:10px; cursor:pointer;">
                        <input type="radio" name="selectedObjective" value="${obj.id}">
                        <div>
                            <strong>${obj.shortTerm}</strong>
                            <div class="text-muted small">${obj.subject}</div>
                        </div>
                    </label>
                </div>`;
        } else {
            obj.teachingObjectives.forEach((tObj, idx) => {
                container.innerHTML += `
                    <div class="checkbox-item p-2 border-bottom" style="padding:10px; border-bottom:1px solid #eee;">
                        <label style="display:flex; gap:10px; cursor:pointer;">
                            <input type="radio" name="selectedObjective" value="${obj.id}_${idx}">
                            <div>
                                <strong>${tObj}</strong>
                                <div class="text-muted small">هدف قصير: ${obj.shortTerm}</div>
                            </div>
                        </label>
                    </div>`;
            });
        }
    });
}

function saveLinking() {
    const targetId = parseInt(document.getElementById('linkTargetId').value);
    const type = document.getElementById('linkType').value;
    const selected = document.querySelector('input[name="selectedObjective"]:checked');
    
    if (!selected) {
        showAuthNotification('يرجى اختيار هدف للربط', 'error');
        return;
    }
    
    if (type === 'test') {
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const test = tests.find(t => t.id === targetId);
        if (test) {
            test.objectivesLinked = true;
            test.linkedObjectiveId = selected.value;
            localStorage.setItem('tests', JSON.stringify(tests));
        }
    } else {
        const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        const lesson = lessons.find(l => l.id === targetId);
        if (lesson) {
            lesson.objectivesLinked = true;
            lesson.linkedInstructionalObjective = selected.value;
            localStorage.setItem('lessons', JSON.stringify(lessons));
        }
    }
    
    showAuthNotification('تم الربط بنجاح', 'success');
    closeLinkObjectivesModal();
    loadContentLibrary();
}

function closeLinkObjectivesModal() {
    document.getElementById('linkObjectivesModal').classList.remove('show');
}

function filterObjectivesList() {
    renderObjectivesList(document.getElementById('linkType').value, document.getElementById('searchObjectives').value);
}

function deleteTest(id) {
    if(!confirm('حذف الاختبار؟')) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    localStorage.setItem('tests', JSON.stringify(tests.filter(t => t.id !== id)));
    loadTests();
}

function deleteLesson(id) {
    if(!confirm('حذف الدرس؟')) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    localStorage.setItem('lessons', JSON.stringify(lessons.filter(l => l.id !== id)));
    loadLessons();
}

function loadAssignments() {
    const assignmentsGrid = document.getElementById('assignmentsGrid');
    if(assignmentsGrid) assignmentsGrid.innerHTML = '<p class="text-muted p-3">سيتم تفعيل الواجبات قريباً</p>';
}

function showCreateAssignmentModal() {
    document.getElementById('createAssignmentModal').classList.add('show');
}
function closeCreateAssignmentModal() {
    document.getElementById('createAssignmentModal').classList.remove('show');
}
function showImportModal(type) {
    showAuthNotification(`استيراد ${type} قيد التطوير`, 'info');
}
function viewTest(id) { showAuthNotification('عرض الاختبار...', 'info'); }
function viewLesson(id) { showAuthNotification('عرض الدرس...', 'info'); }

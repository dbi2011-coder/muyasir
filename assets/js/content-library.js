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

// 1. الأهداف قصيرة المدى
function loadObjectives() {
    const objectivesList = document.getElementById('objectivesList');
    if (!objectivesList) return;
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherObjectives = objectives.filter(obj => obj.teacherId === currentTeacher.id);

    if (teacherObjectives.length === 0) {
        objectivesList.innerHTML = `<div class="empty-content-state"><h3>لا توجد أهداف</h3><button class="btn btn-success" onclick="showCreateObjectiveModal()">إضافة هدف</button></div>`;
        return;
    }
    objectivesList.innerHTML = teacherObjectives.map(obj => `
        <div class="objective-item">
            <div class="objective-header"><h4>${obj.shortTerm}</h4><div class="objective-actions"><button class="btn btn-sm btn-danger" onclick="deleteObjective(${obj.id})">🗑️</button></div></div>
            <div class="teaching-objectives">${obj.teachingObjectives?.map(to => `<div class="teaching-objective">${to}</div>`).join('') || ''}</div>
        </div>`).join('');
}

function showCreateObjectiveModal() {
    document.getElementById('createObjectiveModal').classList.add('show');
    document.getElementById('createObjectiveForm').reset();
    document.getElementById('instructionalGoalsContainer').innerHTML = `<div class="input-group mb-2"><input type="text" class="form-control instructional-goal-input" placeholder="هدف تدريسي 1" required></div>`;
}
function closeCreateObjectiveModal() { document.getElementById('createObjectiveModal').classList.remove('show'); }

function addInstructionalGoalInput() {
    const div = document.createElement('div');
    div.className = 'input-group mb-2'; div.style.cssText = 'display:flex; gap:5px; margin-top:5px;';
    div.innerHTML = `<input type="text" class="form-control instructional-goal-input" placeholder="هدف تدريسي" required><button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('instructionalGoalsContainer').appendChild(div);
}

function saveObjective() {
    const subject = document.getElementById('objSubject').value;
    const shortTermText = document.getElementById('shortTermGoal').value.trim();
    const instructionalGoals = Array.from(document.querySelectorAll('.instructional-goal-input')).map(i => i.value.trim()).filter(v => v);

    if (!shortTermText || instructionalGoals.length === 0) return showAuthNotification('يرجى إدخال البيانات كاملة', 'error');

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const newObj = { id: generateId(), teacherId: getCurrentUser().id, subject, shortTerm: shortTermText, teachingObjectives: instructionalGoals, createdAt: new Date().toISOString() };
    objectives.push(newObj);
    localStorage.setItem('objectives', JSON.stringify(objectives));
    showAuthNotification('تم الحفظ', 'success');
    closeCreateObjectiveModal(); loadObjectives();
}

function deleteObjective(id) {
    if(!confirm('حذف؟')) return;
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    localStorage.setItem('objectives', JSON.stringify(objectives.filter(o => o.id !== id)));
    loadObjectives();
}

// 2. الاختبارات والدروس
function loadTests() {
    const grid = document.getElementById('testsGrid');
    if (!grid) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const myTests = tests.filter(t => t.teacherId === getCurrentUser().id);
    if (myTests.length === 0) { grid.innerHTML = `<div class="empty-content-state"><h3>لا توجد اختبارات</h3><button class="btn btn-success" onclick="showCreateTestModal()">إنشاء اختبار</button></div>`; return; }
    grid.innerHTML = myTests.map(t => `
        <div class="content-card">
            <div class="content-header"><h4>${t.title}</h4><span class="content-badge subject-${t.subject}">${t.subject}</span></div>
            <div class="content-body"><p>${t.description || ''}</p><div class="content-meta"><span class="objectives-status ${t.objectivesLinked ? 'linked' : 'not-linked'}">${t.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}</span></div></div>
            <div class="content-actions">
                <button class="btn btn-sm btn-secondary" onclick="linkObjectives(${t.id}, 'test')">🎯 ربط</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${t.id})">🗑️</button>
            </div>
        </div>`).join('');
}

function loadLessons() {
    const grid = document.getElementById('lessonsGrid');
    if (!grid) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const myLessons = lessons.filter(l => l.teacherId === getCurrentUser().id);
    if (myLessons.length === 0) { grid.innerHTML = `<div class="empty-content-state"><h3>لا توجد دروس</h3><button class="btn btn-success" onclick="showCreateLessonModal()">إنشاء درس</button></div>`; return; }
    grid.innerHTML = myLessons.map(l => `
        <div class="content-card">
            <div class="content-header"><h4>${l.title}</h4><span class="content-badge subject-${l.subject}">${l.subject}</span></div>
            <div class="content-body"><p>الاستراتيجية: ${l.strategy}</p><div class="content-meta"><span class="priority">أولوية: ${l.priority}</span><span class="objectives-status ${l.objectivesLinked ? 'linked' : 'not-linked'}">${l.objectivesLinked ? 'تم الربط' : 'لم يتم الربط'}</span></div></div>
            <div class="content-actions">
                <button class="btn btn-sm btn-secondary" onclick="linkObjectives(${l.id}, 'lesson')">🎯 ربط</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${l.id})">🗑️</button>
            </div>
        </div>`).join('');
}

// النوافذ والأسئلة
function showCreateTestModal() { document.getElementById('createTestModal').classList.add('show'); document.getElementById('questionsContainer').innerHTML = ''; }
function closeCreateTestModal() { document.getElementById('createTestModal').classList.remove('show'); }
function showCreateLessonModal() { document.getElementById('createLessonModal').classList.add('show'); document.getElementById('exercisesContainer').innerHTML = ''; }
function closeCreateLessonModal() { document.getElementById('createLessonModal').classList.remove('show'); }

function addQuestion(isExercise = false) {
    const container = document.getElementById(isExercise ? 'exercisesContainer' : 'questionsContainer');
    const index = container.children.length;
    const html = `
        <div class="question-item" data-index="${index}">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><h5>${isExercise ? 'تمرين' : 'سؤال'} ${index + 1}</h5><button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">حذف</button></div>
            <div class="form-group"><label>النوع</label><select class="form-control question-type" onchange="renderQuestionInputs(this, ${index})"><option value="multiple-choice">اختيار من متعدد</option><option value="true-false">صواب/خطأ</option><option value="spelling-auto">إملاء آلي</option></select></div>
            <div class="question-inputs-area">${getMultipleChoiceTemplate(index)}</div>
            <div class="form-group mt-2"><label>الدرجة</label><input type="number" class="form-control passing-score" value="10" style="width:100px;"></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}
function addExercise() { addQuestion(true); }

function renderQuestionInputs(select, index) {
    const type = select.value;
    const area = select.parentElement.nextElementSibling;
    if (type === 'multiple-choice') area.innerHTML = getMultipleChoiceTemplate(index);
    else if (type === 'true-false') area.innerHTML = `<div class="form-group"><label>العبارة</label><input type="text" class="form-control q-text"></div><div style="display:flex; gap:15px;"><label><input type="radio" name="correct_${index}" value="true"> صواب</label><label><input type="radio" name="correct_${index}" value="false"> خطأ</label></div>`;
    else if (type === 'spelling-auto') area.innerHTML = `<div class="alert alert-info">سينطق النظام الكلمة ويكتبها الطالب</div><div class="form-group"><label>الكلمة الصحيحة</label><input type="text" class="form-control q-target-word"></div>`;
}

function getMultipleChoiceTemplate(index) {
    return `<div class="form-group"><label>السؤال</label><input type="text" class="form-control q-text"></div><label>الخيارات (حدد الصحيح)</label>
    <div style="display:flex; gap:5px; margin-bottom:5px;"><input type="radio" name="correct_${index}" value="0"><input type="text" class="form-control q-choice"></div>
    <div style="display:flex; gap:5px; margin-bottom:5px;"><input type="radio" name="correct_${index}" value="1"><input type="text" class="form-control q-choice"></div>`;
}

function saveTest() {
    const title = document.getElementById('testTitle').value;
    const subject = document.getElementById('testSubject').value;
    const questions = [];
    document.querySelectorAll('#questionsContainer .question-item').forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || item.querySelector('.q-target-word')?.value;
        const score = item.querySelector('.passing-score').value;
        let data = {};
        if(type === 'multiple-choice') {
            const choices = []; item.querySelectorAll('.q-choice').forEach(c => choices.push(c.value));
            data = { choices, correctIndex: item.querySelector('input[type="radio"]:checked')?.value };
        } else if (type === 'true-false') {
            data = { correctValue: item.querySelector('input[type="radio"]:checked')?.value };
        }
        if(text) questions.push({ id: generateId(), type, text, data, passingScore: parseInt(score) });
    });

    if (!title || questions.length === 0) return showAuthNotification('أكمل البيانات', 'error');
    
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    tests.push({ id: generateId(), teacherId: getCurrentUser().id, title, subject, questions, objectivesLinked: false, createdAt: new Date().toISOString() });
    localStorage.setItem('tests', JSON.stringify(tests));
    showAuthNotification('تم الحفظ', 'success'); closeCreateTestModal(); loadTests();
}

function saveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    const strategy = document.getElementById('lessonStrategy').value;
    const priority = document.getElementById('lessonPriority').value;
    // (يتم جمع التمارين بنفس طريقة الأسئلة)
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    lessons.push({ id: generateId(), teacherId: getCurrentUser().id, title, subject, strategy, priority, objectivesLinked: false, createdAt: new Date().toISOString() });
    localStorage.setItem('lessons', JSON.stringify(lessons));
    showAuthNotification('تم الحفظ', 'success'); closeCreateLessonModal(); loadLessons();
}

// الربط
function linkObjectives(id, type) {
    document.getElementById('linkTargetId').value = id;
    document.getElementById('linkType').value = type;
    const container = document.getElementById('objectivesSelectionList');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]').filter(o => o.teacherId === getCurrentUser().id);
    container.innerHTML = objectives.length ? objectives.map(obj => `
        <div class="checkbox-item p-2 border-bottom" style="padding:10px; border-bottom:1px solid #eee;">
            <label style="display:flex; gap:10px; cursor:pointer;">
                <input type="radio" name="selectedObjective" value="${obj.id}">
                <div><strong>${obj.shortTerm}</strong></div>
            </label>
        </div>`).join('') : 'لا توجد أهداف';
    document.getElementById('linkObjectivesModal').classList.add('show');
}

function saveLinking() {
    const targetId = parseInt(document.getElementById('linkTargetId').value);
    const type = document.getElementById('linkType').value;
    const selected = document.querySelector('input[name="selectedObjective"]:checked');
    if (!selected) return;
    
    const key = type === 'test' ? 'tests' : 'lessons';
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const item = items.find(i => i.id === targetId);
    if(item) {
        item.objectivesLinked = true;
        item.linkedObjectiveId = selected.value;
        localStorage.setItem(key, JSON.stringify(items));
    }
    showAuthNotification('تم الربط', 'success');
    document.getElementById('linkObjectivesModal').classList.remove('show');
    loadContentLibrary();
}
function closeLinkObjectivesModal() { document.getElementById('linkObjectivesModal').classList.remove('show'); }
function deleteTest(id) { if(confirm('حذف؟')) { const t = JSON.parse(localStorage.getItem('tests')||'[]'); localStorage.setItem('tests', JSON.stringify(t.filter(x=>x.id!==id))); loadTests(); } }
function deleteLesson(id) { if(confirm('حذف؟')) { const l = JSON.parse(localStorage.getItem('lessons')||'[]'); localStorage.setItem('lessons', JSON.stringify(l.filter(x=>x.id!==id))); loadLessons(); } }
function loadAssignments() { document.getElementById('assignmentsGrid').innerHTML = '<p class="text-center p-3 text-muted">قيد التطوير</p>'; }
function showCreateAssignmentModal() { showAuthNotification('قيد التطوير', 'info'); }

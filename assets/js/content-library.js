/* 
    content-library.js
    منطق مكتبة المحتوى التعليمي (للمعلم)

    التخزين حالياً يتم في localStorage على مستوى المتصفح؛
    ويمكن لاحقاً استبداله بربط مع ملفات JSON أو API حسب ما هو مخطط في مجلد data (tests.json, lessons.json, assignments.json). 
*/

let tests = [];
let lessons = [];
let objectives = [];
let assignments = [];
let currentImportType = null;

/* مفاتيح التخزين */
const STORAGE_KEYS = {
    tests: 'muyasir_teacher_tests',
    lessons: 'muyasir_teacher_lessons',
    objectives: 'muyasir_teacher_objectives',
    assignments: 'muyasir_teacher_assignments'
};

/* تشغيل عند تحميل الصفحة */
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    renderAll();
});

/* -----------------------------
   تحميل / حفظ البيانات
----------------------------- */

function loadAllData() {
    tests = loadFromStorage(STORAGE_KEYS.tests);
    lessons = loadFromStorage(STORAGE_KEYS.lessons);
    objectives = loadFromStorage(STORAGE_KEYS.objectives);
    assignments = loadFromStorage(STORAGE_KEYS.assignments);
}

function loadFromStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('خطأ في قراءة البيانات من التخزين:', key, e);
        return [];
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('خطأ في حفظ البيانات في التخزين:', key, e);
    }
}

function renderAll() {
    renderTests();
    renderLessons();
    renderObjectives();
    renderAssignments();
}

/* -----------------------------
   التبويبات
----------------------------- */

function switchContentTab(tabName) {
    const tabs = document.querySelectorAll('.content-tab');
    const tabButtons = document.querySelectorAll('.content-tabs .settings-tab');

    tabs.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    const activeBtn = document.querySelector(`.content-tabs .settings-tab[data-tab="${tabName}"]`);

    if (activeTab) activeTab.classList.add('active');
    if (activeBtn) activeBtn.classList.add('active');
}

/* -----------------------------
   أدوات مساعدة عامة
----------------------------- */

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return '-';
    // يوم/شهر/سنة
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
}

function getSubjectLabel(subject) {
    if (subject === 'arabic') return 'لغتي';
    if (subject === 'math') return 'رياضيات';
    return '-';
}

function getSubjectBadgeClass(subject) {
    if (subject === 'arabic') return 'badge badge-pill badge-subject-ar';
    if (subject === 'math') return 'badge badge-pill badge-subject-ma';
    return 'badge badge-pill badge-secondary';
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('show');
    }
}

/* حذف عنصر مع تأكيد بسيط */
function confirmDelete(callback) {
    if (confirm('هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذه العملية.')) {
        callback();
    }
}

/* -----------------------------
   الاختبارات التشخيصية
----------------------------- */

function renderTests() {
    const tbody = document.querySelector('#testsTable tbody');
    const emptyState = document.getElementById('testsEmptyState');
    const searchValue = (document.getElementById('testsSearchInput')?.value || '').trim().toLowerCase();

    if (!tbody) return;

    tbody.innerHTML = '';

    let filtered = tests;
    if (searchValue) {
        filtered = tests.filter(t =>
            t.title.toLowerCase().includes(searchValue) ||
            (getSubjectLabel(t.subject) || '').toLowerCase().includes(searchValue)
        );
    }

    if (!filtered.length) {
        emptyState && (emptyState.style.display = 'block');
        return;
    } else {
        emptyState && (emptyState.style.display = 'none');
    }

    filtered.forEach(test => {
        const tr = document.createElement('tr');

        const subjectLabel = getSubjectLabel(test.subject);
        const linkedStatus = test.linkedObjectives && test.linkedObjectives.length
            ? '<span class="badge badge-success">تم الربط</span>'
            : '<span class="badge badge-warning">لم يتم الربط</span>';

        tr.innerHTML = `
            <td>
                ${test.title}
                ${test.description ? `<small>${test.description}</small>` : ''}
            </td>
            <td>
                <span class="${getSubjectBadgeClass(test.subject)}">${subjectLabel}</span>
            </td>
            <td>${(test.questions || []).length}</td>
            <td>${linkedStatus}</td>
            <td>${formatDate(test.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewTest('${test.id}')">عرض</button>
                    <button class="btn btn-sm btn-secondary" onclick="editTest('${test.id}')">تعديل</button>
                    <button class="btn btn-sm btn-primary" onclick="exportSingle('tests','${test.id}')">تصدير</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTest('${test.id}')">حذف</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function openTestModal() {
    document.getElementById('testId').value = '';
    document.getElementById('testTitle').value = '';
    document.getElementById('testSubject').value = '';
    document.getElementById('testDescription').value = '';
    clearQuestions('test');

    document.getElementById('testModalTitle').textContent = 'إنشاء اختبار تشخيصي جديد';
    openModal('testModal');
}

function editTest(id) {
    const test = tests.find(t => t.id === id);
    if (!test) return;

    document.getElementById('testId').value = test.id;
    document.getElementById('testTitle').value = test.title || '';
    document.getElementById('testSubject').value = test.subject || '';
    document.getElementById('testDescription').value = test.description || '';

    clearQuestions('test');
    (test.questions || []).forEach(q => addQuestion('test', q));

    document.getElementById('testModalTitle').textContent = 'تعديل اختبار تشخيصي';
    openModal('testModal');
}

function saveTest() {
    const id = document.getElementById('testId').value || generateId();
    const title = document.getElementById('testTitle').value.trim();
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value.trim();
    const questions = collectQuestions('test');

    if (!title) {
        alert('يرجى إدخال عنوان الاختبار.');
        return;
    }
    if (!subject) {
        alert('يرجى اختيار المادة.');
        return;
    }

    let existing = tests.find(t => t.id === id);
    if (existing) {
        existing.title = title;
        existing.subject = subject;
        existing.description = description;
        existing.questions = questions;
        existing.updatedAt = new Date().toISOString();
    } else {
        tests.push({
            id,
            title,
            subject,
            description,
            questions,
            linkedObjectives: [],
            createdAt: new Date().toISOString()
        });
    }

    saveToStorage(STORAGE_KEYS.tests, tests);
    renderTests();
    closeModal('testModal');
}

function deleteTest(id) {
    confirmDelete(() => {
        tests = tests.filter(t => t.id !== id);
        saveToStorage(STORAGE_KEYS.tests, tests);
        renderTests();
    });
}

function viewTest(id) {
    const test = tests.find(t => t.id === id);
    if (!test) return;
    alert(`عنوان الاختبار: ${test.title}\nالمادة: ${getSubjectLabel(test.subject)}\nعدد الأسئلة: ${(test.questions || []).length}`);
}

/* -----------------------------
   الدروس
----------------------------- */

function renderLessons() {
    const tbody = document.querySelector('#lessonsTable tbody');
    const emptyState = document.getElementById('lessonsEmptyState');
    const searchValue = (document.getElementById('lessonsSearchInput')?.value || '').trim().toLowerCase();

    if (!tbody) return;

    tbody.innerHTML = '';

    let filtered = lessons;
    if (searchValue) {
        filtered = lessons.filter(l =>
            l.title.toLowerCase().includes(searchValue) ||
            (getSubjectLabel(l.subject) || '').toLowerCase().includes(searchValue)
        );
    }

    if (!filtered.length) {
        emptyState && (emptyState.style.display = 'block');
        return;
    } else {
        emptyState && (emptyState.style.display = 'none');
    }

    filtered.forEach(lesson => {
        const tr = document.createElement('tr');

        const subjectLabel = getSubjectLabel(lesson.subject);
        const linkedStatus = lesson.teachingGoalLinked
            ? '<span class="badge badge-success">تم الربط</span>'
            : '<span class="badge badge-warning">لم يتم الربط</span>';

        tr.innerHTML = `
            <td>
                ${lesson.title}
                ${lesson.description ? `<small>${lesson.description}</small>` : ''}
            </td>
            <td>
                <span class="${getSubjectBadgeClass(lesson.subject)}">${subjectLabel}</span>
            </td>
            <td>${lesson.teachingGoal || '-'}</td>
            <td>${lesson.priority || '-'}</td>
            <td>${lesson.mastery || '-'}</td>
            <td>${linkedStatus}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewLesson('${lesson.id}')">عرض</button>
                    <button class="btn btn-sm btn-secondary" onclick="editLesson('${lesson.id}')">تعديل</button>
                    <button class="btn btn-sm btn-primary" onclick="exportSingle('lessons','${lesson.id}')">تصدير</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteLesson('${lesson.id}')">حذف</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function openLessonModal() {
    document.getElementById('lessonId').value = '';
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonSubject').value = '';
    document.getElementById('lessonStrategy').value = '';
    document.getElementById('lessonMastery').value = 80;
    document.getElementById('lessonPriority').value = 1;
    document.getElementById('lessonDescription').value = '';
    clearQuestions('lesson');

    document.getElementById('lessonModalTitle').textContent = 'إنشاء درس جديد';
    openModal('lessonModal');
}

function editLesson(id) {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    document.getElementById('lessonId').value = lesson.id;
    document.getElementById('lessonTitle').value = lesson.title || '';
    document.getElementById('lessonSubject').value = lesson.subject || '';
    document.getElementById('lessonStrategy').value = lesson.strategy || '';
    document.getElementById('lessonMastery').value = lesson.mastery || 80;
    document.getElementById('lessonPriority').value = lesson.priority || 1;
    document.getElementById('lessonDescription').value = lesson.description || '';

    clearQuestions('lesson');
    (lesson.questions || []).forEach(q => addQuestion('lesson', q));

    document.getElementById('lessonModalTitle').textContent = 'تعديل درس';
    openModal('lessonModal');
}

function saveLesson() {
    const id = document.getElementById('lessonId').value || generateId();
    const title = document.getElementById('lessonTitle').value.trim();
    const subject = document.getElementById('lessonSubject').value;
    const strategy = document.getElementById('lessonStrategy').value.trim();
    const mastery = parseInt(document.getElementById('lessonMastery').value, 10) || 0;
    const priority = parseInt(document.getElementById('lessonPriority').value, 10) || 0;
    const description = document.getElementById('lessonDescription').value.trim();
    const questions = collectQuestions('lesson');

    if (!title) {
        alert('يرجى إدخال عنوان الدرس.');
        return;
    }
    if (!subject) {
        alert('يرجى اختيار المادة.');
        return;
    }
    if (!mastery || mastery < 1 || mastery > 100) {
        alert('يرجى إدخال محك اجتياز صحيح من 1 إلى 100.');
        return;
    }
    if (!priority || priority < 1 || priority > 100) {
        alert('يرجى إدخال أولوية صحيحة من 1 إلى 100.');
        return;
    }

    let existing = lessons.find(l => l.id === id);
    if (existing) {
        existing.title = title;
        existing.subject = subject;
        existing.strategy = strategy;
        existing.mastery = mastery;
        existing.priority = priority;
        existing.description = description;
        existing.questions = questions;
        existing.updatedAt = new Date().toISOString();
    } else {
        lessons.push({
            id,
            title,
            subject,
            strategy,
            mastery,
            priority,
            description,
            questions,
            teachingGoal: '',
            teachingGoalLinked: false,
            createdAt: new Date().toISOString()
        });
    }

    saveToStorage(STORAGE_KEYS.lessons, lessons);
    renderLessons();
    closeModal('lessonModal');
}

function deleteLesson(id) {
    confirmDelete(() => {
        lessons = lessons.filter(l => l.id !== id);
        saveToStorage(STORAGE_KEYS.lessons, lessons);
        renderLessons();
    });
}

function viewLesson(id) {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;
    alert(`عنوان الدرس: ${lesson.title}\nالمادة: ${getSubjectLabel(lesson.subject)}\nالأولوية: ${lesson.priority}\nمحك الاجتياز: ${lesson.mastery}%`);
}

/* -----------------------------
   الأهداف قصيرة المدى
----------------------------- */

function renderObjectives() {
    const tbody = document.querySelector('#objectivesTable tbody');
    const emptyState = document.getElementById('objectivesEmptyState');
    const searchValue = (document.getElementById('objectivesSearchInput')?.value || '').trim().toLowerCase();

    if (!tbody) return;

    tbody.innerHTML = '';

    let filtered = objectives;
    if (searchValue) {
        filtered = objectives.filter(o =>
            o.text.toLowerCase().includes(searchValue)
        );
    }

    if (!filtered.length) {
        emptyState && (emptyState.style.display = 'block');
        return;
    } else {
        emptyState && (emptyState.style.display = 'none');
    }

    filtered.forEach(obj => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${obj.text}</td>
            <td>${(obj.teachingGoals || []).length}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editObjective('${obj.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteObjective('${obj.id}')">حذف</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function openObjectiveModal() {
    document.getElementById('objectiveId').value = '';
    document.getElementById('objectiveText').value = '';
    document.getElementById('objectiveTeachingGoals').value = '';

    document.getElementById('objectiveModalTitle').textContent = 'إضافة هدف قصير المدى';
    openModal('objectiveModal');
}

function editObjective(id) {
    const obj = objectives.find(o => o.id === id);
    if (!obj) return;

    document.getElementById('objectiveId').value = obj.id;
    document.getElementById('objectiveText').value = obj.text || '';
    document.getElementById('objectiveTeachingGoals').value = (obj.teachingGoals || []).join('\n');

    document.getElementById('objectiveModalTitle').textContent = 'تعديل هدف قصير المدى';
    openModal('objectiveModal');
}

function saveObjective() {
    const id = document.getElementById('objectiveId').value || generateId();
    const text = document.getElementById('objectiveText').value.trim();
    const teachingGoalsRaw = document.getElementById('objectiveTeachingGoals').value.trim();

    if (!text) {
        alert('يرجى إدخال نص الهدف قصير المدى.');
        return;
    }

    const duplicate = objectives.find(o => o.text === text && o.id !== id);
    if (duplicate) {
        alert('هذا الهدف القصير مضاف مسبقاً. لا يُسمح بالتكرار.');
        return;
    }

    const teachingGoals = teachingGoalsRaw
        ? teachingGoalsRaw.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

    if (!teachingGoals.length) {
        alert('يجب إضافة هدف تدريسي واحد على الأقل.');
        return;
    }

    let existing = objectives.find(o => o.id === id);
    if (existing) {
        existing.text = text;
        existing.teachingGoals = teachingGoals;
        existing.updatedAt = new Date().toISOString();
    } else {
        objectives.push({
            id,
            text,
            teachingGoals,
            createdAt: new Date().toISOString()
        });
    }

    saveToStorage(STORAGE_KEYS.objectives, objectives);
    renderObjectives();
    closeModal('objectiveModal');
}

function deleteObjective(id) {
    confirmDelete(() => {
        objectives = objectives.filter(o => o.id !== id);
        saveToStorage(STORAGE_KEYS.objectives, objectives);
        renderObjectives();
    });
}

/* -----------------------------
   الواجبات
----------------------------- */

function renderAssignments() {
    const tbody = document.querySelector('#assignmentsTable tbody');
    const emptyState = document.getElementById('assignmentsEmptyState');
    const searchValue = (document.getElementById('assignmentsSearchInput')?.value || '').trim().toLowerCase();

    if (!tbody) return;

    tbody.innerHTML = '';

    let filtered = assignments;
    if (searchValue) {
        filtered = assignments.filter(a =>
            a.title.toLowerCase().includes(searchValue) ||
            (getSubjectLabel(a.subject) || '').toLowerCase().includes(searchValue)
        );
    }

    if (!filtered.length) {
        emptyState && (emptyState.style.display = 'block');
        return;
    } else {
        emptyState && (emptyState.style.display = 'none');
    }

    filtered.forEach(a => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>
                ${a.title}
                ${a.description ? `<small>${a.description}</small>` : ''}
            </td>
            <td><span class="${getSubjectBadgeClass(a.subject)}">${getSubjectLabel(a.subject)}</span></td>
            <td>${(a.questions || []).length}</td>
            <td>${a.grade || '-'}</td>
            <td>${formatDate(a.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewAssignment('${a.id}')">عرض</button>
                    <button class="btn btn-sm btn-secondary" onclick="editAssignment('${a.id}')">تعديل</button>
                    <button class="btn btn-sm btn-primary" onclick="exportSingle('assignments','${a.id}')">تصدير</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAssignment('${a.id}')">حذف</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function openAssignmentModal() {
    document.getElementById('assignmentId').value = '';
    document.getElementById('assignmentTitle').value = '';
    document.getElementById('assignmentSubject').value = '';
    document.getElementById('assignmentGrade').value = 10;
    document.getElementById('assignmentDescription').value = '';
    clearQuestions('assignment');

    document.getElementById('assignmentModalTitle').textContent = 'إنشاء واجب جديد';
    openModal('assignmentModal');
}

function editAssignment(id) {
    const a = assignments.find(x => x.id === id);
    if (!a) return;

    document.getElementById('assignmentId').value = a.id;
    document.getElementById('assignmentTitle').value = a.title || '';
    document.getElementById('assignmentSubject').value = a.subject || '';
    document.getElementById('assignmentGrade').value = a.grade || 10;
    document.getElementById('assignmentDescription').value = a.description || '';

    clearQuestions('assignment');
    (a.questions || []).forEach(q => addQuestion('assignment', q));

    document.getElementById('assignmentModalTitle').textContent = 'تعديل واجب';
    openModal('assignmentModal');
}

function saveAssignment() {
    const id = document.getElementById('assignmentId').value || generateId();
    const title = document.getElementById('assignmentTitle').value.trim();
    const subject = document.getElementById('assignmentSubject').value;
    const grade = parseInt(document.getElementById('assignmentGrade').value, 10) || 0;
    const description = document.getElementById('assignmentDescription').value.trim();
    const questions = collectQuestions('assignment');

    if (!title) {
        alert('يرجى إدخال عنوان الواجب.');
        return;
    }
    if (!subject) {
        alert('يرجى اختيار المادة.');
        return;
    }
    if (!grade || grade < 1) {
        alert('يرجى إدخال درجة الواجب.');
        return;
    }

    let existing = assignments.find(a => a.id === id);
    if (existing) {
        existing.title = title;
        existing.subject = subject;
        existing.grade = grade;
        existing.description = description;
        existing.questions = questions;
        existing.updatedAt = new Date().toISOString();
    } else {
        assignments.push({
            id,
            title,
            subject,
            grade,
            description,
            questions,
            createdAt: new Date().toISOString()
        });
    }

    saveToStorage(STORAGE_KEYS.assignments, assignments);
    renderAssignments();
    closeModal('assignmentModal');
}

function deleteAssignment(id) {
    confirmDelete(() => {
        assignments = assignments.filter(a => a.id !== id);
        saveToStorage(STORAGE_KEYS.assignments, assignments);
        renderAssignments();
    });
}

function viewAssignment(id) {
    const a = assignments.find(x => x.id === id);
    if (!a) return;
    alert(`عنوان الواجب: ${a.title}\nالمادة: ${getSubjectLabel(a.subject)}\nالدرجة: ${a.grade}\nعدد الأسئلة: ${(a.questions || []).length}`);
}

/* -----------------------------
   إدارة الأسئلة المشتركة
----------------------------- */

const QUESTION_TYPES = [
    { value: 'mcq', label: 'اختيار من متعدد' },
    { value: 'drag_drop', label: 'سحب وإفلات' },
    { value: 'mcq_media', label: 'اختيار من متعدد مع مرفق' },
    { value: 'open', label: 'سؤال مفتوح' },
    { value: 'read_auto', label: 'تقييم القراءة الآلي' },
    { value: 'spell_auto', label: 'تقييم الإملاء الآلي' },
    { value: 'read_manual', label: 'تقييم القراءة اليدوي' },
    { value: 'spell_manual', label: 'تقييم الإملاء اليدوي' },
    { value: 'missing_letter', label: 'أكمل الحرف الناقص' }
];

function clearQuestions(scope) {
    const container = document.getElementById(`${scope}QuestionsContainer`);
    if (!container) return;
    container.innerHTML = '<div class="no-questions-msg">لم تتم إضافة أي سؤال بعد.</div>';
}

function addQuestion(scope, data) {
    const container = document.getElementById(`${scope}QuestionsContainer`);
    if (!container) return;

    const noMsg = container.querySelector('.no-questions-msg');
    if (noMsg) noMsg.remove();

    const questionId = generateId();
    const qType = data?.type || QUESTION_TYPES[0].value;
    const qText = data?.text || '';

    const wrapper = document.createElement('div');
    wrapper.className = 'question-item';
    wrapper.dataset.id = questionId;
    wrapper.innerHTML = `
        <div class="question-item-header">
            <div>
                <span class="question-type-label">نوع السؤال:</span>
                <select class="form-control question-type-select" style="display:inline-block;width:auto;min-width:180px;">
                    ${QUESTION_TYPES.map(q => `
                        <option value="${q.value}" ${q.value === qType ? 'selected' : ''}>${q.label}</option>
                    `).join('')}
                </select>
            </div>
            <button class="btn btn-sm btn-danger" type="button" onclick="removeQuestion('${scope}','${questionId}')">حذف</button>
        </div>
        <div class="question-item-body">
            <textarea placeholder="نص السؤال أو التوجيه للطالب"></textarea>
        </div>
    `;

    wrapper.querySelector('textarea').value = qText;
    container.appendChild(wrapper);
}

function removeQuestion(scope, qId) {
    const container = document.getElementById(`${scope}QuestionsContainer`);
    if (!container) return;

    const item = container.querySelector(`.question-item[data-id="${qId}"]`);
    if (item) item.remove();

    if (!container.querySelector('.question-item')) {
        clearQuestions(scope);
    }
}

function collectQuestions(scope) {
    const container = document.getElementById(`${scope}QuestionsContainer`);
    if (!container) return [];

    const items = container.querySelectorAll('.question-item');
    const result = [];

    items.forEach(item => {
        const select = item.querySelector('.question-type-select');
        const textarea = item.querySelector('textarea');
        const type = select ? select.value : '';
        const text = textarea ? textarea.value.trim() : '';

        if (text) {
            result.push({ type, text });
        }
    });

    return result;
}

/* -----------------------------
   التصدير / الاستيراد
----------------------------- */

function exportSingle(type, id) {
    let list = [];
    let filenamePrefix = '';

    switch (type) {
        case 'tests':
            list = tests;
            filenamePrefix = 'test';
            break;
        case 'lessons':
            list = lessons;
            filenamePrefix = 'lesson';
            break;
        case 'assignments':
            list = assignments;
            filenamePrefix = 'assignment';
            break;
        default:
            return;
    }

    const item = list.find(x => x.id === id);
    if (!item) return;

    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}-${item.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportAll(type) {
    let list = [];
    let filenamePrefix = '';

    switch (type) {
        case 'tests':
            list = tests;
            filenamePrefix = 'tests';
            break;
        case 'lessons':
            list = lessons;
            filenamePrefix = 'lessons';
            break;
        case 'assignments':
            list = assignments;
            filenamePrefix = 'assignments';
            break;
        default:
            return;
    }

    if (!list.length) {
        alert('لا توجد بيانات لتصديرها في هذا القسم.');
        return;
    }

    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function triggerImport(type) {
    currentImportType = type;
    const input = document.getElementById('importInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file || !currentImportType) return;

    const reader = new FileReader();
    reader.onload = e => {
        try {
            const content = JSON.parse(e.target.result);

            if (Array.isArray(content)) {
                importList(currentImportType, content);
            } else {
                importList(currentImportType, [content]);
            }

            currentImportType = null;
            event.target.value = '';
        } catch (err) {
            console.error('خطأ في قراءة ملف الاستيراد:', err);
            alert('ملف غير صالح. تأكد أنه بصيغة JSON تم تصديره من النظام.');
        }
    };

    reader.readAsText(file, 'utf-8');
}

function importList(type, list) {
    switch (type) {
        case 'tests':
            list.forEach(item => {
                item.id = item.id || generateId();
                tests.push(item);
            });
            saveToStorage(STORAGE_KEYS.tests, tests);
            renderTests();
            break;

        case 'lessons':
            list.forEach(item => {
                item.id = item.id || generateId();
                lessons.push(item);
            });
            saveToStorage(STORAGE_KEYS.lessons, lessons);
            renderLessons();
            break;

        case 'assignments':
            list.forEach(item => {
                item.id = item.id || generateId();
                assignments.push(item);
            });
            saveToStorage(STORAGE_KEYS.assignments, assignments);
            renderAssignments();
            break;
    }

    alert('تم الاستيراد بنجاح.');
}

/* -----------------------------
   بحث في الجداول
----------------------------- */

function filterTable(type) {
    switch (type) {
        case 'tests':
            renderTests();
            break;
        case 'lessons':
            renderLessons();
            break;
        case 'objectives':
            renderObjectives();
            break;
        case 'assignments':
            renderAssignments();
            break;
    }
}

/* -----------------------------
   أدوات عامة
----------------------------- */

function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

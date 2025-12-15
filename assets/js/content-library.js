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
// 1. إدارة الأهداف قصيرة المدى
// ==========================================
function loadObjectives() {
    const objectivesList = document.getElementById('objectivesList');
    if (!objectivesList) return;

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherObjectives = objectives.filter(obj => obj.teacherId === currentTeacher.id);

    if (teacherObjectives.length === 0) {
        objectivesList.innerHTML = `<div class="empty-content-state"><p>لا توجد أهداف. ابدأ بإضافة هدف جديد.</p></div>`;
        return;
    }

    objectivesList.innerHTML = teacherObjectives.map(obj => `
        <div class="objective-item">
            <div class="objective-header">
                <h4>${obj.shortTerm}</h4>
                <div class="objective-actions">
                    <button class="btn btn-sm btn-danger" onclick="deleteObjective(${obj.id})">🗑️</button>
                </div>
            </div>
            <div class="teaching-objectives">
                ${obj.teachingObjectives?.map(to => `<div class="teaching-objective">${to}</div>`).join('')}
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

function closeCreateObjectiveModal() { document.getElementById('createObjectiveModal').classList.remove('show'); }

function addInstructionalGoalInput() {
    const container = document.getElementById('instructionalGoalsContainer');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.style.display = 'flex';
    div.style.gap = '5px';
    div.innerHTML = `<input type="text" class="form-control instructional-goal-input" placeholder="هدف تدريسي" required>
                     <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(div);
}

function saveObjective() {
    const subject = document.getElementById('objSubject').value;
    const shortTermText = document.getElementById('shortTermGoal').value.trim();
    const instructionalInputs = document.querySelectorAll('.instructional-goal-input');
    const instructionalGoals = [];
    instructionalInputs.forEach(input => { if(input.value.trim()) instructionalGoals.push(input.value.trim()); });

    if (!shortTermText || instructionalGoals.length === 0) {
        showAuthNotification('يرجى كتابة البيانات كاملة', 'error');
        return;
    }

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const newObj = {
        id: Date.now(),
        teacherId: getCurrentUser().id,
        subject: subject,
        shortTerm: shortTermText,
        teachingObjectives: instructionalGoals,
        createdAt: new Date().toISOString()
    };
    objectives.push(newObj);
    localStorage.setItem('objectives', JSON.stringify(objectives));
    
    showAuthNotification('تم الحفظ بنجاح', 'success');
    closeCreateObjectiveModal();
    loadObjectives();
}

function deleteObjective(id) {
    if(!confirm('حذف الهدف؟')) return;
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    localStorage.setItem('objectives', JSON.stringify(objectives.filter(o => o.id !== id)));
    loadObjectives();
}

// ==========================================
// 2. إدارة الاختبارات (إنشاء، تعديل، محك اجتياز)
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
                <h3>لا توجد اختبارات</h3>
                <button class="btn btn-success" onclick="showCreateTestModal()">إنشاء اختبار</button>
            </div>`;
        return;
    }

    testsGrid.innerHTML = teacherTests.map(test => `
        <div class="content-card">
            <div class="content-header">
                <h4>${test.title}</h4>
                <span class="content-badge subject-${test.subject}">${test.subject}</span>
            </div>
            <div class="content-body">
                <p>${test.description || ''}</p>
                <div class="content-meta">
                    <span class="questions-count">${test.questions?.length || 0} سؤال</span>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})" title="تعديل الاختبار"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-sm btn-secondary" onclick="linkObjectives(${test.id})" title="ربط الأهداف"><i class="fas fa-link"></i> ربط الأهداف</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})" title="حذف"><i class="fas fa-trash"></i> حذف</button>
            </div>
        </div>
    `).join('');
}

// فتح نافذة الإنشاء (وضع جديد)
function showCreateTestModal() {
    document.getElementById('testModalTitle').textContent = 'إنشاء اختبار تشخيصي جديد';
    document.getElementById('editTestId').value = ''; // تفريغ المعرف ليعني "إنشاء"
    document.getElementById('createTestForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    
    // إضافة سؤال افتراضي واحد
    addQuestion(); 
    
    document.getElementById('createTestModal').classList.add('show');
}

// فتح نافذة التعديل (وضع تعديل)
function editTest(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) return;

    document.getElementById('testModalTitle').textContent = 'تعديل الاختبار';
    document.getElementById('editTestId').value = test.id;
    document.getElementById('testTitle').value = test.title;
    document.getElementById('testSubject').value = test.subject;
    document.getElementById('testDescription').value = test.description || '';
    
    // إعادة بناء الأسئلة
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    if (test.questions && test.questions.length > 0) {
        test.questions.forEach((q, index) => {
            // إضافة هيكل السؤال
            addQuestionToContainer(container, 'سؤال', q);
        });
    } else {
        addQuestion();
    }

    document.getElementById('createTestModal').classList.add('show');
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
}

// إضافة قالب سؤال جديد (مع حقل محك الاجتياز)
function addQuestion() {
    const container = document.getElementById('questionsContainer');
    addQuestionToContainer(container, 'السؤال');
}

function addQuestionToContainer(container, labelPrefix, existingData = null) {
    const index = container.children.length;
    
    // استرجاع البيانات إذا كنا في وضع التعديل
    const textVal = existingData ? existingData.text : '';
    const typeVal = existingData ? existingData.type : 'multiple-choice';
    const scoreVal = existingData ? (existingData.passingScore || 5) : 5;
    
    // بناء HTML السؤال
    const questionHTML = `
        <div class="question-item card p-3 mb-3" data-index="${index}" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px; background: #fdfdfd;">
            <div class="d-flex justify-content-between mb-2" style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <h5>${labelPrefix} ${index + 1}</h5>
                <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">حذف</button>
            </div>
            
            <div class="row" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;">
                    <label>نوع السؤال</label>
                    <select class="form-control question-type" onchange="renderQuestionInputs(this, ${index})">
                        <option value="multiple-choice" ${typeVal === 'multiple-choice' ? 'selected' : ''}>اختيار من متعدد</option>
                        <option value="true-false" ${typeVal === 'true-false' ? 'selected' : ''}>صواب / خطأ</option>
                    </select>
                </div>
                <div class="form-group" style="width:150px;">
                    <label style="color:#e67e22; font-weight:bold;">محك الاجتياز (درجة)</label>
                    <input type="number" class="form-control passing-score" value="${scoreVal}" min="1" max="100">
                </div>
            </div>

            <div class="question-inputs-area">
                </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
    
    // تفعيل عرض المدخلات المناسبة (خيارات/صح وخطأ) وتعبئة البيانات إذا وجدت
    const newSelect = container.lastElementChild.querySelector('.question-type');
    renderQuestionInputs(newSelect, index, existingData);
}

function renderQuestionInputs(selectElement, index, existingData = null) {
    const type = selectElement.value;
    const area = selectElement.parentElement.parentElement.nextElementSibling;
    let html = '';
    
    const textVal = existingData ? existingData.text : '';
    
    if (type === 'multiple-choice') {
        const choices = existingData && existingData.choices ? existingData.choices : ['', '', ''];
        // نفترض أن الخيار الأول هو الصحيح للتبسيط في هذا المثال، أو يمكن إضافة radio لتحديده
        html = `
            <div class="form-group">
                <label>نص السؤال</label>
                <input type="text" class="form-control q-text" value="${textVal}" placeholder="اكتب السؤال هنا...">
            </div>
            <label>الخيارات</label>
            <div class="choices-list">
                <input type="text" class="form-control mb-1 q-choice" value="${choices[0]}" placeholder="الخيار 1">
                <input type="text" class="form-control mb-1 q-choice" value="${choices[1]}" placeholder="الخيار 2">
                <input type="text" class="form-control mb-1 q-choice" value="${choices[2]}" placeholder="الخيار 3">
            </div>
        `;
    } else if (type === 'true-false') {
        html = `
            <div class="form-group">
                <label>نص العبارة</label>
                <input type="text" class="form-control q-text" value="${textVal}" placeholder="اكتب العبارة...">
            </div>
        `;
    }
    
    area.innerHTML = html;
}

// حفظ الاختبار (إنشاء أو تحديث)
function saveTest() {
    const editId = document.getElementById('editTestId').value;
    const title = document.getElementById('testTitle').value;
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value;
    
    const questions = [];
    document.querySelectorAll('#questionsContainer .question-item').forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || '';
        const score = item.querySelector('.passing-score').value;
        
        // جمع الخيارات
        const choices = [];
        item.querySelectorAll('.q-choice').forEach(c => choices.push(c.value));
        
        // الحفاظ على objectiveId إذا كان موجوداً مسبقاً (في حالة التعديل)
        // هذا يتطلب منطقاً أكثر تعقيداً لربط DOM بالبيانات القديمة،
        // للتبسيط هنا: سنقوم بإعادة الحفظ، والربط يتم في نافذة منفصلة لاحقاً.
        // إذا أردنا الحفاظ على الربط، يجب تخزين objectiveId في حقل مخفي داخل العنصر.
        
        if (text) {
            questions.push({
                id: Date.now() + Math.random(), // معرف جديد للسؤال
                type,
                text,
                choices: type === 'multiple-choice' ? choices : null,
                passingScore: parseInt(score),
                objectiveId: null // الربط يتم لاحقاً
            });
        }
    });

    if (!title || questions.length === 0) {
        showAuthNotification('يرجى كتابة العنوان وإضافة سؤال واحد على الأقل', 'error');
        return;
    }

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');

    if (editId) {
        // تحديث اختبار موجود
        const index = tests.findIndex(t => t.id == editId);
        if (index !== -1) {
            // ملاحظة: عند التعديل الكامل للأسئلة، قد نفقد الربط القديم إذا تغيرت الأسئلة كلياً.
            // الحل الأفضل هو محاولة دمج objectiveId إذا لم يتغير السؤال، لكن هنا سنستبدل الأسئلة.
            // يمكن للمعلم إعادة الربط بسهولة عبر النافذة المخصصة.
            tests[index].title = title;
            tests[index].subject = subject;
            tests[index].description = description;
            tests[index].questions = questions;
            tests[index].updatedAt = new Date().toISOString();
            
            showAuthNotification('تم تحديث الاختبار بنجاح', 'success');
        }
    } else {
        // إنشاء جديد
        const newTest = {
            id: Date.now(),
            teacherId: getCurrentUser().id,
            title,
            subject,
            description,
            questions,
            createdAt: new Date().toISOString()
        };
        tests.push(newTest);
        showAuthNotification('تم إنشاء الاختبار بنجاح', 'success');
    }

    localStorage.setItem('tests', JSON.stringify(tests));
    closeCreateTestModal();
    loadTests();
}

function deleteTest(id) {
    if(!confirm('حذف الاختبار؟')) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    localStorage.setItem('tests', JSON.stringify(tests.filter(t => t.id !== id)));
    loadTests();
}

// ==========================================
// 3. ربط الأسئلة بالأهداف (مستوى السؤال)
// ==========================================

function linkObjectives(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) return;
    
    document.getElementById('linkTargetId').value = testId;
    
    // جلب أهداف المعلم
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const teacherObjs = objectives.filter(o => o.teacherId === getCurrentUser().id);
    
    const container = document.getElementById('questionsLinkingContainer');
    container.innerHTML = '';
    
    // إنشاء جدول الربط
    let html = `<table class="linking-table">
        <thead>
            <tr>
                <th width="40%">السؤال</th>
                <th width="15%">محك الاجتياز</th>
                <th width="45%">الهدف القصير المرتبط</th>
            </tr>
        </thead>
        <tbody>`;
        
    test.questions.forEach((q, index) => {
        // إنشاء قائمة الأهداف المنسدلة
        let optionsHtml = '<option value="">-- اختر هدفاً --</option>';
        teacherObjs.forEach(obj => {
            const selected = q.objectiveId == obj.id ? 'selected' : '';
            optionsHtml += `<option value="${obj.id}" ${selected}>${obj.shortTerm}</option>`;
        });
        
        html += `
            <tr>
                <td>
                    <span class="q-preview">${q.text}</span>
                    <span class="q-meta">${q.type === 'multiple-choice' ? 'اختيار من متعدد' : 'صواب/خطأ'}</span>
                </td>
                <td>
                    <span class="badge badge-info">${q.passingScore || 5} درجة</span>
                </td>
                <td>
                    <select class="form-control objective-select" data-question-index="${index}">
                        ${optionsHtml}
                    </select>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
    
    document.getElementById('linkObjectivesModal').classList.add('show');
}

function closeLinkObjectivesModal() {
    document.getElementById('linkObjectivesModal').classList.remove('show');
}

function saveLinking() {
    const testId = document.getElementById('linkTargetId').value;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testIndex = tests.findIndex(t => t.id == testId);
    
    if (testIndex === -1) return;
    
    // جمع البيانات من القوائم المنسدلة
    const selects = document.querySelectorAll('.objective-select');
    let linkedCount = 0;
    
    selects.forEach(select => {
        const qIndex = select.getAttribute('data-question-index');
        const objId = select.value;
        
        // تحديث السؤال في المصفوفة
        tests[testIndex].questions[qIndex].objectiveId = objId ? parseInt(objId) : null;
        
        if (objId) linkedCount++;
    });
    
    localStorage.setItem('tests', JSON.stringify(tests));
    
    showAuthNotification(`تم ربط ${linkedCount} سؤال بالأهداف بنجاح`, 'success');
    closeLinkObjectivesModal();
}

// ==========================================
// 4. إدارة الدروس (مبسط)
// ==========================================
function loadLessons() {
    const lessonsGrid = document.getElementById('lessonsGrid');
    if (!lessonsGrid) return;
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherLessons = lessons.filter(l => l.teacherId === currentTeacher.id);
    
    if (teacherLessons.length === 0) {
        lessonsGrid.innerHTML = `<div class="empty-content-state"><h3>لا توجد دروس</h3><button class="btn btn-success" onclick="showCreateLessonModal()">إنشاء درس</button></div>`;
        return;
    }
    
    lessonsGrid.innerHTML = teacherLessons.map(l => `
        <div class="content-card">
            <h4>${l.title}</h4>
            <p>المادة: ${l.subject}</p>
            <button class="btn btn-sm btn-danger" onclick="deleteLesson(${l.id})">حذف</button>
        </div>
    `).join('');
}

function showCreateLessonModal() { document.getElementById('createLessonModal').classList.add('show'); }
function closeCreateLessonModal() { document.getElementById('createLessonModal').classList.remove('show'); }

function addExercise() {
    const container = document.getElementById('exercisesContainer');
    container.innerHTML += `<div class="p-2 border mb-2">تمرين جديد (قيد التطوير) <button type="button" onclick="this.parentElement.remove()" class="btn btn-sm btn-danger">حذف</button></div>`;
}

function saveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    
    if(!title) return;
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    lessons.push({
        id: Date.now(),
        teacherId: getCurrentUser().id,
        title,
        subject,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('lessons', JSON.stringify(lessons));
    closeCreateLessonModal();
    loadLessons();
    showAuthNotification('تم حفظ الدرس', 'success');
}

function deleteLesson(id) {
    if(!confirm('حذف الدرس؟')) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    localStorage.setItem('lessons', JSON.stringify(lessons.filter(l => l.id !== id)));
    loadLessons();
}

// الواجبات (عرض فقط للمثال)
function loadAssignments() {
    const grid = document.getElementById('assignmentsGrid');
    if(grid) grid.innerHTML = '<p class="text-muted p-3">سيتم تفعيل الواجبات قريباً</p>';
}
function showCreateAssignmentModal() { document.getElementById('createAssignmentModal').classList.add('show'); }
function closeCreateAssignmentModal() { document.getElementById('createAssignmentModal').classList.remove('show'); }
function showImportModal(type) { alert(`استيراد ${type} قيد التطوير`); }

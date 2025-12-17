// ============================================
// 📁 المسار: assets/js/content-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود عناصر الصفحة قبل التحميل لتجنب الأخطاء
    if (document.getElementById('testsGrid') || document.getElementById('lessonsGrid') || document.getElementById('objectivesList')) {
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    // استخدام try-catch لكل دالة لضمان عمل البقية حتى لو فشلت واحدة
    try { loadTests(); } catch(e) { console.error("Error loading tests:", e); }
    try { loadLessons(); } catch(e) { console.error("Error loading lessons:", e); }
    try { loadObjectives(); } catch(e) { console.error("Error loading objectives:", e); }
}

// ==========================================
// 1. إدارة الاختبارات
// ==========================================
function loadTests() {
    const testsGrid = document.getElementById('testsGrid');
    if (!testsGrid) return;

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);

    if (teacherTests.length === 0) {
        testsGrid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;padding:30px;"><h3>لا توجد اختبارات</h3><button class="btn btn-success mt-3" onclick="showCreateTestModal()">+ إنشاء اختبار</button></div>`;
        return;
    }

    testsGrid.innerHTML = teacherTests.map(test => `
        <div class="content-card">
            <div class="content-header"><h4 title="${test.title}">${test.title}</h4><span class="content-badge subject-${test.subject}">${test.subject}</span></div>
            <div class="content-body"><div class="content-meta"><span class="questions-count">❓ ${test.questions?.length||0} أسئلة</span></div></div>
            <div class="content-actions">
                <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}

// ==========================================
// 2. إدارة الدروس (كانت مفقودة أو فارغة)
// ==========================================
function loadLessons() {
    const lessonsGrid = document.getElementById('lessonsGrid');
    if (!lessonsGrid) return;

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentTeacher = getCurrentUser();
    // تصفية دروس المعلم
    const teacherLessons = lessons.filter(l => l.teacherId === currentTeacher.id);

    if (teacherLessons.length === 0) {
        lessonsGrid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;padding:20px;"><h3>لا توجد دروس</h3><button class="btn btn-success mt-2" onclick="showCreateLessonModal()">+ درس جديد</button></div>`;
        return;
    }

    lessonsGrid.innerHTML = teacherLessons.map(lesson => `
        <div class="content-card">
            <div class="content-header">
                <h4>${lesson.title}</h4>
                <span class="content-badge subject-${lesson.subject}">${lesson.subject}</span>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function showCreateLessonModal() {
    document.getElementById('createLessonModal').classList.add('show');
}

function saveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    
    if(!title) { alert('العنوان مطلوب'); return; }

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    lessons.push({
        id: Date.now(),
        teacherId: getCurrentUser().id,
        title,
        subject,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('lessons', JSON.stringify(lessons));
    document.getElementById('createLessonModal').classList.remove('show');
    loadLessons(); // تحديث القائمة
}

function deleteLesson(id) {
    if(!confirm('حذف الدرس؟')) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const newLessons = lessons.filter(l => l.id !== id);
    localStorage.setItem('lessons', JSON.stringify(newLessons));
    loadLessons();
}

// ==========================================
// 3. إدارة الأهداف (كانت مفقودة أو فارغة)
// ==========================================
function loadObjectives() {
    const listContainer = document.getElementById('objectivesList');
    if (!listContainer) return;

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherObjectives = objectives.filter(o => o.teacherId === currentTeacher.id);

    if (teacherObjectives.length === 0) {
        listContainer.innerHTML = `<div class="text-center p-3">لا توجد أهداف مضافة. <button class="btn btn-sm btn-success" onclick="showCreateObjectiveModal()">+ إضافة</button></div>`;
        return;
    }

    listContainer.innerHTML = teacherObjectives.map(obj => `
        <div class="objective-item card p-2 mb-2" style="border-right: 4px solid var(--primary-color);">
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${obj.shortTermGoal}</strong>
                    <br><small class="text-muted">${obj.subject}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteObjective(${obj.id})">×</button>
            </div>
        </div>
    `).join('');
}

function showCreateObjectiveModal() {
    document.getElementById('createObjectiveModal').classList.add('show');
}

function saveObjective() {
    const subject = document.getElementById('objSubject').value;
    const shortTerm = document.getElementById('shortTermGoal').value;
    
    // جمع الأهداف التدريسية
    const instructionalGoals = [];
    document.querySelectorAll('.instructional-goal-input').forEach(input => {
        if(input.value) instructionalGoals.push(input.value);
    });

    if(!shortTerm) { alert('الهدف مطلوب'); return; }

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    objectives.push({
        id: Date.now(),
        teacherId: getCurrentUser().id,
        subject,
        shortTermGoal: shortTerm,
        instructionalGoals,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('objectives', JSON.stringify(objectives));
    document.getElementById('createObjectiveModal').classList.remove('show');
    loadObjectives(); // تحديث القائمة
}

function deleteObjective(id) {
    if(!confirm('حذف الهدف؟')) return;
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    localStorage.setItem('objectives', JSON.stringify(objectives.filter(o => o.id !== id)));
    loadObjectives();
}

// ==========================================
// دوال الاختبارات (Create, Edit, Inputs)
// ==========================================
function showCreateTestModal() {
    document.getElementById('editTestId').value = ''; 
    document.getElementById('createTestForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    addQuestion(); 
    document.getElementById('createTestModal').classList.add('show');
}
function closeCreateTestModal() { document.getElementById('createTestModal').classList.remove('show'); }

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    addQuestionToContainer(container, 'السؤال');
}

function addQuestionToContainer(container, labelPrefix, existingData = null) {
    const index = container.children.length;
    const typeVal = existingData ? existingData.type : 'multiple-choice';
    const scoreVal = existingData ? (existingData.passingScore || 5) : 5;
    
    const html = `
        <div class="question-item card p-3 mb-3" data-index="${index}" style="border:1px solid #ddd; padding:15px; border-radius:8px; background:#fff;">
            <div class="d-flex justify-content-between mb-2">
                <h5>${labelPrefix} ${index + 1}</h5>
                <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">حذف</button>
            </div>
            <div class="row" style="display:flex; gap:10px; margin-bottom:10px;">
                <div class="form-group" style="flex:1;">
                    <label>نوع السؤال</label>
                    <select class="form-control question-type" onchange="renderQuestionInputs(this, ${index})">
                        <option value="multiple-choice" ${typeVal==='multiple-choice'?'selected':''}>اختيار من متعدد</option>
                        <option value="drag-drop" ${typeVal==='drag-drop'?'selected':''}>سحب وإفلات (إكمال فراغات)</option>
                        <option value="open-ended" ${typeVal==='open-ended'?'selected':''}>سؤال مفتوح</option>
                        <option value="ai-reading" ${typeVal==='ai-reading'?'selected':''}>تقييم قراءة آلي</option>
                        <option value="ai-spelling" ${typeVal==='ai-spelling'?'selected':''}>تقييم إملاء آلي</option>
                        <option value="missing-letter" ${typeVal==='missing-letter'?'selected':''}>أكمل الحرف الناقص</option>
                    </select>
                </div>
                <div class="form-group" style="width:100px;">
                    <label>الدرجة</label>
                    <input type="number" class="form-control passing-score" value="${scoreVal}" min="1">
                </div>
            </div>
            <div class="question-inputs-area" style="background:#f8f9fa; padding:10px; border-radius:5px;"></div>
        </div>`;
    
    container.insertAdjacentHTML('beforeend', html);
    renderQuestionInputs(container.lastElementChild.querySelector('.question-type'), index, existingData);
}

function renderQuestionInputs(selectElement, index, data = null) {
    const type = selectElement.value;
    const area = selectElement.parentElement.parentElement.parentElement.querySelector('.question-inputs-area');
    const textVal = data ? data.text : '';
    let html = '';
    
    if (type === 'multiple-choice') {
        const choices = data?.choices || ['', '', ''];
        html = `<div class="form-group mb-2"><label>نص السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <label>الخيارات</label>${choices.map((c, i) => `<input type="text" class="form-control mb-1 q-choice" value="${c}" placeholder="الخيار ${i+1}">`).join('')}`;
    } 
    else if (type === 'drag-drop') {
        html = `
            <div class="form-group mb-2">
                <label>نص الجملة (ضع الإجابات بين قوسين {})</label>
                <div class="alert alert-info small p-1">مثال: عاصمة السعودية هي {الرياض} وتقع في {نجد}.</div>
                <textarea class="form-control q-text" rows="3" placeholder="اكتب الجملة هنا...">${textVal}</textarea>
            </div>`;
    }
    else if (type === 'open-ended') {
        html = `<div class="form-group mb-2"><label>السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>`;
    }
    else if (type.includes('reading')) {
        html = `<div class="form-group mb-2"><label>التعليمات</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <div class="form-group"><label>النص المقروء</label><textarea class="form-control q-reading-text">${data?.readingText || ''}</textarea></div>`;
    }
    else if (type.includes('spelling') || type === 'missing-letter') {
        html = `<div class="form-group mb-2"><label>التعليمات</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <div class="form-group"><label>الكلمة</label><input type="text" class="form-control q-full-word" value="${data?.fullWord || data?.spellingWord || ''}"></div>
                ${type === 'missing-letter' ? `<div class="form-group mt-2"><label>الكلمة ناقصة (_)</label><input type="text" class="form-control q-missing-word" value="${data?.missingWord || ''}"></div>` : ''}`;
    }
    area.innerHTML = html;
}

function saveTest() {
    const title = document.getElementById('testTitle').value;
    if (!title) { alert('العنوان مطلوب'); return; }
    
    const questions = [];
    document.querySelectorAll('#questionsContainer .question-item').forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || 'سؤال';
        const score = item.querySelector('.passing-score').value;
        
        let qData = { id: Date.now()+Math.random(), type, text, passingScore: parseInt(score) };
        
        if(item.querySelector('.q-choice')) qData.choices = Array.from(item.querySelectorAll('.q-choice')).map(c => c.value);
        if(item.querySelector('.q-reading-text')) qData.readingText = item.querySelector('.q-reading-text').value;
        if(item.querySelector('.q-full-word')) { qData.spellingWord = item.querySelector('.q-full-word').value; qData.fullWord = item.querySelector('.q-full-word').value; }
        if(item.querySelector('.q-missing-word')) qData.missingWord = item.querySelector('.q-missing-word').value;
        
        questions.push(qData);
    });

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const editId = document.getElementById('editTestId').value;
    const newTest = {
        id: editId ? parseInt(editId) : Date.now(),
        teacherId: getCurrentUser().id,
        title, subject: document.getElementById('testSubject').value, description: document.getElementById('testDescription').value,
        questions, createdAt: new Date().toISOString()
    };

    if (editId) {
        const idx = tests.findIndex(t => t.id == editId);
        if(idx !== -1) tests[idx] = newTest;
    } else {
        tests.push(newTest);
    }
    localStorage.setItem('tests', JSON.stringify(tests));
    closeCreateTestModal();
    loadTests();
    alert('تم الحفظ');
}

function editTest(id) {
    const t = JSON.parse(localStorage.getItem('tests')).find(x => x.id === id);
    if(!t) return;
    document.getElementById('editTestId').value = t.id;
    document.getElementById('testTitle').value = t.title;
    document.getElementById('testSubject').value = t.subject;
    document.getElementById('testDescription').value = t.description;
    document.getElementById('questionsContainer').innerHTML = '';
    t.questions.forEach(q => addQuestionToContainer(document.getElementById('questionsContainer'), 'سؤال', q));
    document.getElementById('createTestModal').classList.add('show');
}

function deleteTest(id) {
    if(confirm('حذف؟')) {
        const t = JSON.parse(localStorage.getItem('tests')).filter(x => x.id !== id);
        localStorage.setItem('tests', JSON.stringify(t));
        loadTests();
    }
}

// أدوات عامة
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }

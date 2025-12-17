// ============================================
// 📁 المسار: assets/js/content-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('testsGrid') || document.getElementById('lessonsGrid')) {
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    // الترتيب: الاختبارات -> الدروس -> الأهداف -> الواجبات
    try { loadTests(); } catch(e) { console.error(e); }
    try { loadLessons(); } catch(e) { console.error(e); }
    try { loadObjectives(); } catch(e) { console.error(e); }
    try { loadHomeworks(); } catch(e) { console.error(e); }
}

// ==========================================
// 1. الاختبارات التشخيصية
// ==========================================
function loadTests() {
    const grid = document.getElementById('testsGrid'); if(!grid) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === getCurrentUser().id);
    if(tests.length === 0) { 
        grid.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:20px; color:#777;">لا توجد اختبارات تشخيصية</div>'; 
        return; 
    }
    grid.innerHTML = tests.map(t => `
        <div class="content-card">
            <div class="content-header">
                <h4 title="${t.title}">${t.title}</h4>
                <span class="content-badge subject-${t.subject}">${t.subject}</span>
            </div>
            <div class="content-body">
                <p class="text-muted small">${t.description || 'لا يوجد وصف'}</p>
                <div class="content-meta"><span>❓ ${t.questions?.length || 0} أسئلة</span></div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-warning" onclick="editTest(${t.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${t.id})">حذف</button>
            </div>
        </div>`).join('');
}

// ==========================================
// 2. الدروس التفاعلية
// ==========================================
function loadLessons() {
    const grid = document.getElementById('lessonsGrid'); if(!grid) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === getCurrentUser().id);
    if (lessons.length === 0) { 
        grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد دروس تفاعلية</h3></div>`; 
        return; 
    }
    grid.innerHTML = lessons.map(l => `
        <div class="content-card" style="border-top:4px solid var(--secondary-color);">
            <div class="content-header">
                <h4 title="${l.title}">${l.title}</h4>
                <span class="content-badge subject-${l.subject}">${l.subject}</span>
            </div>
            <div class="content-body">
                <div class="small text-muted">
                    تمهيد، تمارين (${l.exercises?.questions?.length || 0})، تقييم (${l.assessment?.questions?.length || 0})
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-warning" onclick="editLesson(${l.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${l.id})">حذف</button>
            </div>
        </div>`).join('');
}

// ==========================================
// 3. الأهداف قصيرة المدى
// ==========================================
function loadObjectives() {
    const list = document.getElementById('objectivesList'); if (!list) return;
    const objs = JSON.parse(localStorage.getItem('objectives') || '[]').filter(o => o.teacherId === getCurrentUser().id);
    if (objs.length === 0) { 
        list.innerHTML = `<div class="empty-content-state" style="text-align:center;padding:20px;"><h3>لا توجد أهداف</h3><button class="btn btn-success mt-2" onclick="showCreateObjectiveModal()">+ هدف جديد</button></div>`; 
        return; 
    }
    list.innerHTML = objs.map(o => {
        const subGoalsHtml = o.instructionalGoals && o.instructionalGoals.length > 0 
            ? `<ul class="instructional-goals-list">${o.instructionalGoals.map(g => `<li>${g}</li>`).join('')}</ul>` 
            : '<span class="text-muted small">لا توجد أهداف فرعية</span>';
        
        return `
        <div class="objective-row">
            <div class="obj-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h4 class="short-term-title">${o.shortTermGoal}</h4>
                    <span class="content-badge subject-${o.subject}" style="font-size:0.8rem; padding:2px 8px;">${o.subject}</span>
                </div>
                <div class="obj-actions">
                    <button class="btn btn-sm btn-warning" onclick="editObjective(${o.id})"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteObjective(${o.id})"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
            <div class="obj-body">${subGoalsHtml}</div>
        </div>`;
    }).join('');
}

// ==========================================
// 4. الواجبات
// ==========================================
function loadHomeworks() {
    const grid = document.getElementById('homeworksGrid'); if (!grid) return;
    const homeworks = JSON.parse(localStorage.getItem('assignments') || '[]').filter(h => h.teacherId === getCurrentUser().id);
    if (homeworks.length === 0) { 
        grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد واجبات</h3><button class="btn btn-success mt-2" onclick="showCreateHomeworkModal()">+ واجب جديد</button></div>`; 
        return; 
    }
    grid.innerHTML = homeworks.map(h => `
        <div class="content-card" style="border-top: 4px solid #ff9800;">
            <div class="content-header">
                <h4 title="${h.title}">${h.title}</h4>
                <span class="content-badge subject-${h.subject}">${h.subject}</span>
            </div>
            <div class="content-body">
                <p class="text-muted small">${h.description || 'لا يوجد وصف'}</p>
                <div class="content-meta"><span>📋 ${h.questions?.length || 0} أسئلة</span></div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-warning" onclick="editHomework(${h.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteHomework(${h.id})">حذف</button>
            </div>
        </div>`).join('');
}


// ==========================================
// إدارة المودالات (Add/Edit/Save/Delete)
// ==========================================

// --- 1. دوال الاختبارات التشخيصية (تم إصلاح الخطأ هنا) ---
function showCreateTestModal() {
    // تصفير الحقول يدوياً (بدل reset) لتجنب الخطأ
    document.getElementById('editTestId').value = ''; 
    document.getElementById('testTitle').value = ''; 
    document.getElementById('testSubject').value = 'لغتي';
    document.getElementById('testDescription').value = '';
    
    document.getElementById('questionsContainer').innerHTML = '';
    addQuestion(); // إضافة سؤال افتراضي
    document.getElementById('createTestModal').classList.add('show');
}

function saveTest() { 
    const t = document.getElementById('testTitle').value; 
    if (!t) { alert('العنوان مطلوب'); return; }
    
    const qs = collectQuestionsFromContainer('questionsContainer');
    const ts = JSON.parse(localStorage.getItem('tests') || '[]'); 
    const id = document.getElementById('editTestId').value;
    
    const d = { 
        id: id ? parseInt(id) : Date.now(), 
        teacherId: getCurrentUser().id, 
        title: t, 
        subject: document.getElementById('testSubject').value, 
        description: document.getElementById('testDescription').value, 
        questions: qs, 
        createdAt: new Date().toISOString() 
    };
    
    if (id) { const i = ts.findIndex(x => x.id == id); if (i !== -1) ts[i] = d; } 
    else ts.push(d);
    
    localStorage.setItem('tests', JSON.stringify(ts)); 
    document.getElementById('createTestModal').classList.remove('show'); 
    loadTests(); 
}

function editTest(id) { 
    const t = JSON.parse(localStorage.getItem('tests')).find(x => x.id === id); 
    if (!t) return;
    document.getElementById('editTestId').value = t.id; 
    document.getElementById('testTitle').value = t.title; 
    document.getElementById('testSubject').value = t.subject; 
    document.getElementById('testDescription').value = t.description; 
    const c = document.getElementById('questionsContainer'); 
    c.innerHTML = ''; 
    if(t.questions && t.questions.length > 0) t.questions.forEach(q => addQuestionToContainer(c, 'سؤال', q));
    else addQuestion();
    document.getElementById('createTestModal').classList.add('show'); 
}

function deleteTest(id) { 
    if (confirm('حذف؟')) { 
        const t = JSON.parse(localStorage.getItem('tests')).filter(x => x.id !== id); 
        localStorage.setItem('tests', JSON.stringify(t)); 
        loadTests(); 
    } 
}

// --- 2. دوال الواجبات ---
function showCreateHomeworkModal() { 
    document.getElementById('editHomeworkId').value = ''; 
    document.getElementById('homeworkTitle').value = ''; 
    document.getElementById('homeworkDescription').value = ''; 
    document.getElementById('homeworkQuestionsContainer').innerHTML = ''; 
    addHomeworkQuestion(); 
    document.getElementById('createHomeworkModal').classList.add('show'); 
}

function addHomeworkQuestion() { addQuestionToContainer(document.getElementById('homeworkQuestionsContainer'), 'سؤال'); }

function saveHomework() { 
    const id = document.getElementById('editHomeworkId').value; 
    const t = document.getElementById('homeworkTitle').value; 
    if (!t) return; 
    const qs = collectQuestionsFromContainer('homeworkQuestionsContainer'); 
    const hws = JSON.parse(localStorage.getItem('assignments') || '[]');
    const d = { id: id ? parseInt(id) : Date.now(), teacherId: getCurrentUser().id, title: t, subject: document.getElementById('homeworkSubject').value, description: document.getElementById('homeworkDescription').value, questions: qs, createdAt: new Date().toISOString() };
    if (id) { const i = hws.findIndex(x => x.id == id); if (i !== -1) hws[i] = d; } else hws.push(d); 
    localStorage.setItem('assignments', JSON.stringify(hws)); 
    document.getElementById('createHomeworkModal').classList.remove('show'); 
    loadHomeworks(); 
}

function editHomework(id) {
    const h = JSON.parse(localStorage.getItem('assignments')).find(x => x.id === id); 
    if (!h) return; 
    document.getElementById('editHomeworkId').value = h.id; 
    document.getElementById('homeworkTitle').value = h.title; 
    document.getElementById('homeworkSubject').value = h.subject; 
    document.getElementById('homeworkDescription').value = h.description;
    const c = document.getElementById('homeworkQuestionsContainer'); 
    c.innerHTML = ''; 
    if (h.questions?.length > 0) h.questions.forEach(q => addQuestionToContainer(c, 'سؤال', q)); 
    else addHomeworkQuestion(); 
    document.getElementById('createHomeworkModal').classList.add('show');
}

function deleteHomework(id) { 
    if (confirm('حذف؟')) { 
        const h = JSON.parse(localStorage.getItem('assignments')).filter(x => x.id !== id); 
        localStorage.setItem('assignments', JSON.stringify(h)); 
        loadHomeworks(); 
    } 
}

// --- 3. دوال الأهداف ---
function showCreateObjectiveModal() { 
    document.getElementById('editObjectiveId').value = ''; 
    document.getElementById('shortTermGoal').value = ''; 
    document.getElementById('instructionalGoalsContainer').innerHTML = ''; 
    addInstructionalGoalInput(); 
    document.getElementById('createObjectiveModal').classList.add('show'); 
}

function editObjective(id) {
    const o = JSON.parse(localStorage.getItem('objectives')).find(x => x.id === id); 
    if (!o) return; 
    document.getElementById('editObjectiveId').value = o.id; 
    document.getElementById('objSubject').value = o.subject; 
    document.getElementById('shortTermGoal').value = o.shortTermGoal;
    const c = document.getElementById('instructionalGoalsContainer'); 
    c.innerHTML = ''; 
    if (o.instructionalGoals?.length > 0) o.instructionalGoals.forEach(g => addInstructionalGoalInput(g)); 
    else addInstructionalGoalInput(); 
    document.getElementById('createObjectiveModal').classList.add('show');
}

function addInstructionalGoalInput(v = '') { 
    const c = document.getElementById('instructionalGoalsContainer'); 
    const d = document.createElement('div'); 
    d.className = 'd-flex mb-2'; 
    d.innerHTML = `<input type="text" class="form-control instructional-goal-input" value="${v}" placeholder="هدف تدريسي فرعي"><button class="btn btn-outline-danger btn-sm ml-2" onclick="this.parentElement.remove()">×</button>`; 
    c.appendChild(d); 
}

function saveObjective() { 
    const id = document.getElementById('editObjectiveId').value; 
    const s = document.getElementById('objSubject').value; 
    const g = document.getElementById('shortTermGoal').value; 
    if (!g) { alert('الهدف مطلوب'); return; }
    const ig = []; 
    document.querySelectorAll('.instructional-goal-input').forEach(i => { if (i.value.trim()) ig.push(i.value.trim()); });
    const objs = JSON.parse(localStorage.getItem('objectives') || '[]'); 
    const d = { id: id ? parseInt(id) : Date.now(), teacherId: getCurrentUser().id, subject: s, shortTermGoal: g, instructionalGoals: ig };
    if (id) { const i = objs.findIndex(x => x.id == id); if (i !== -1) objs[i] = d; } else objs.push(d); 
    localStorage.setItem('objectives', JSON.stringify(objs)); 
    document.getElementById('createObjectiveModal').classList.remove('show'); 
    loadObjectives(); 
}

function deleteObjective(id) { 
    if (confirm('حذف؟')) { 
        const o = JSON.parse(localStorage.getItem('objectives')).filter(x => x.id !== id); 
        localStorage.setItem('objectives', JSON.stringify(o)); 
        loadObjectives(); 
    } 
}

// --- 4. دوال الدروس ---
function showCreateLessonModal() { 
    document.getElementById('editLessonId').value = ''; 
    document.getElementById('lessonTitle').value = ''; 
    document.getElementById('introUrl').value = ''; 
    document.getElementById('introText').value = ''; 
    document.getElementById('exercisesContainer').innerHTML = ''; 
    document.getElementById('assessmentContainer').innerHTML = ''; 
    addLessonQuestion('exercisesContainer'); 
    addLessonQuestion('assessmentContainer'); 
    switchLessonStep('intro'); 
    document.getElementById('createLessonModal').classList.add('show'); 
}

function editLesson(id) { 
    const l = JSON.parse(localStorage.getItem('lessons')).find(x => x.id === id); 
    if (!l) return; 
    document.getElementById('editLessonId').value = l.id; 
    document.getElementById('lessonTitle').value = l.title; 
    document.getElementById('lessonSubject').value = l.subject; 
    if (l.intro) { document.getElementById('introType').value = l.intro.type; document.getElementById('introUrl').value = l.intro.url; document.getElementById('introText').value = l.intro.text; toggleIntroInputs(); } 
    document.getElementById('exercisesPassScore').value = l.exercises?.passScore || 80; 
    const ec = document.getElementById('exercisesContainer'); 
    ec.innerHTML = ''; 
    (l.exercises?.questions || []).forEach(q => addQuestionToContainer(ec, 'سؤال', q)); 
    const ac = document.getElementById('assessmentContainer'); 
    ac.innerHTML = ''; 
    (l.assessment?.questions || []).forEach(q => addQuestionToContainer(ac, 'سؤال', q)); 
    switchLessonStep('intro'); 
    document.getElementById('createLessonModal').classList.add('show'); 
}

function saveLesson() { 
    const id = document.getElementById('editLessonId').value; 
    const t = document.getElementById('lessonTitle').value; 
    if (!t) return; 
    const intro = { type: document.getElementById('introType').value, url: document.getElementById('introUrl').value, text: document.getElementById('introText').value }; 
    const ex = { passScore: document.getElementById('exercisesPassScore').value, questions: collectQuestionsFromContainer('exercisesContainer') }; 
    const as = { questions: collectQuestionsFromContainer('assessmentContainer') }; 
    const ls = JSON.parse(localStorage.getItem('lessons') || '[]'); 
    const d = { id: id ? parseInt(id) : Date.now(), teacherId: getCurrentUser().id, title: t, subject: document.getElementById('lessonSubject').value, intro, exercises: ex, assessment: as, createdAt: new Date().toISOString() }; 
    if (id) { const i = ls.findIndex(x => x.id == id); if (i !== -1) ls[i] = d; } else ls.push(d); 
    localStorage.setItem('lessons', JSON.stringify(ls)); 
    document.getElementById('createLessonModal').classList.remove('show'); 
    loadLessons(); 
}

function deleteLesson(id) { 
    if (confirm('حذف؟')) { 
        const l = JSON.parse(localStorage.getItem('lessons')).filter(x => x.id !== id); 
        localStorage.setItem('lessons', JSON.stringify(l)); 
        loadLessons(); 
    } 
}

function toggleIntroInputs() { 
    const t = document.getElementById('introType').value; 
    const u = document.getElementById('introUrl'); 
    u.placeholder = t === 'video' ? 'رابط يوتيوب' : (t === 'image' ? 'رابط الصورة' : 'رابط'); 
}

// ==========================================
// دوال الأسئلة المساعدة (مشتركة للجميع)
// ==========================================
function addQuestion() { addQuestionToContainer(document.getElementById('questionsContainer'), 'سؤال'); }
function addLessonQuestion(id) { addQuestionToContainer(document.getElementById(id), 'سؤال'); }

function addQuestionToContainer(container, lbl, data = null) {
    const idx = container.children.length; 
    const type = data ? data.type : 'multiple-choice'; 
    const score = data ? data.passingScore : 5;
    const h = `
    <div class="question-item card p-3 mb-3" style="border:1px solid #ddd;">
        <div class="d-flex justify-content-between mb-2">
            <h5>${lbl} ${idx + 1}</h5>
            <button class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">حذف</button>
        </div>
        <div class="row" style="gap:10px;">
            <div style="flex:1;">
                <select class="form-control question-type" onchange="renderQuestionInputs(this,${idx})">
                    <option value="multiple-choice" ${type === 'multiple-choice' ? 'selected' : ''}>اختيار من متعدد</option>
                    <option value="drag-drop" ${type === 'drag-drop' ? 'selected' : ''}>سحب وإفلات</option>
                    <option value="open-ended" ${type === 'open-ended' ? 'selected' : ''}>مفتوح</option>
                    <option value="ai-reading" ${type === 'ai-reading' ? 'selected' : ''}>قراءة</option>
                    <option value="ai-spelling" ${type === 'ai-spelling' ? 'selected' : ''}>إملاء</option>
                    <option value="missing-letter" ${type === 'missing-letter' ? 'selected' : ''}>حرف ناقص</option>
                </select>
            </div>
            <div style="width:80px;">
                <input type="number" class="form-control passing-score" value="${score}">
            </div>
        </div>
        <div class="question-inputs-area"></div>
    </div>`;
    container.insertAdjacentHTML('beforeend', h); 
    renderQuestionInputs(container.lastElementChild.querySelector('.question-type'), idx, data);
}

function renderQuestionInputs(sel, idx, data = null) {
    const t = sel.value; 
    const area = sel.parentElement.parentElement.parentElement.querySelector('.question-inputs-area'); 
    const txt = data ? data.text : ''; 
    let h = '';
    
    if (t === 'multiple-choice') { 
        const ch = data?.choices || ['', '', '']; 
        h = `<div class="mb-2"><label>السؤال</label><input class="form-control q-text" value="${txt}"></div><label>الخيارات</label>${ch.map((c, i) => `<input class="form-control mb-1 q-choice" value="${c}" placeholder="خيار ${i + 1}">`).join('')}`; 
    } else if (t === 'drag-drop') { 
        h = `<div class="mb-2"><label>الجملة (ضع الإجابات بين {})</label><textarea class="form-control q-text">${txt}</textarea></div>`; 
    } else { 
        h = `<div class="mb-2"><label>السؤال/التعليمات</label><input class="form-control q-text" value="${txt}"></div>`; 
    }
    
    if (t.includes('reading')) h += `<div class="mt-2"><label>النص</label><textarea class="form-control q-reading-text">${data?.readingText || ''}</textarea></div>`;
    if (t.includes('spelling') || t === 'missing-letter') h += `<div class="mt-2"><label>الكلمة</label><input class="form-control q-full-word" value="${data?.fullWord || data?.spellingWord || ''}"></div>`;
    if (t === 'missing-letter') h += `<div class="mt-2"><label>الكلمة ناقصة (_)</label><input class="form-control q-missing-word" value="${data?.missingWord || ''}"></div>`;

    area.innerHTML = h;
}

function collectQuestionsFromContainer(id) {
    const qs = []; 
    document.querySelectorAll(`#${id} .question-item`).forEach(i => {
        const t = i.querySelector('.question-type').value; 
        const txt = i.querySelector('.q-text')?.value || '';
        const d = { id: Date.now() + Math.random(), type: t, text: txt, passingScore: i.querySelector('.passing-score').value };
        if (i.querySelector('.q-choice')) d.choices = Array.from(i.querySelectorAll('.q-choice')).map(c => c.value);
        if (i.querySelector('.q-reading-text')) d.readingText = i.querySelector('.q-reading-text').value;
        if (i.querySelector('.q-full-word')) { d.fullWord = i.querySelector('.q-full-word').value; d.spellingWord = d.fullWord; }
        if (i.querySelector('.q-missing-word')) d.missingWord = i.querySelector('.q-missing-word').value;
        qs.push(d);
    }); 
    return qs;
}

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }

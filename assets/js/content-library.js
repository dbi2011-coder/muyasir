// ============================================
// 📁 المسار: assets/js/content-library.js (نسخة Supabase)
// ============================================

// إغلاق القوائم المنسدلة عند النقر في أي مكان فارغ
document.addEventListener('click', function(event) {
    const isDropdownButton = event.target.closest('.dropdown-btn, .dropbtn, .dropdown-toggle, [onclick*="toggle"], [onclick*="classList.toggle"]');
    if (!isDropdownButton) {
        const openDropdowns = document.querySelectorAll('.dropdown-content.show, .dropdown-menu.show, .menu-options.show, #addContentMenu.show');
        openDropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('show'); 
                if(dropdown.style.display === 'block') dropdown.style.display = 'none';
            }
        });
    }
});

// نظام النوافذ المنبثقة والإشعارات
if (!window.showError) { window.showError = function(msg) { alert("❌ خطأ: " + msg); }; }
if (!window.showSuccess) { window.showSuccess = function(msg) { alert("✅ نجاح: " + msg); }; }
if (!window.showConfirmModal) { window.showConfirmModal = function(msg, onConfirm) { if(confirm(msg)) onConfirm(); }; }

// التهيئة وجلب البيانات
document.addEventListener('DOMContentLoaded', async function() {
    injectLinkContentModal(); 
    await loadContentLibrary();
});

function getCurrentUser() { 
    return JSON.parse(sessionStorage.getItem('currentUser')); 
}

async function loadContentLibrary() {
    const loadingHtml = '<div class="text-center p-4"><div class="loading-spinner"></div><p>جاري التحميل من السحابة...</p></div>';
    if(document.getElementById('testsGrid')) document.getElementById('testsGrid').innerHTML = loadingHtml;
    if(document.getElementById('lessonsGrid')) document.getElementById('lessonsGrid').innerHTML = loadingHtml;
    if(document.getElementById('objectivesList')) document.getElementById('objectivesList').innerHTML = loadingHtml;
    if(document.getElementById('homeworksGrid')) document.getElementById('homeworksGrid').innerHTML = loadingHtml;

    await Promise.all([
        loadTests(),
        loadLessons(),
        loadObjectives(),
        loadHomeworks()
    ]);
}

// ----------------------------------------------------
// 1. إدارة الاختبارات (Tests)
// ----------------------------------------------------
async function loadTests() {
    const grid = document.getElementById('testsGrid'); if(!grid) return;
    const user = getCurrentUser();
    try {
        const { data: tests, error } = await window.supabase.from('tests').select('*').eq('teacherId', user.id).order('createdAt', { ascending: false });
        if (error) throw error;

        if(!tests || tests.length === 0) { grid.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:20px; color:#777;">لا توجد اختبارات تشخيصية</div>'; return; }
        
        grid.innerHTML = tests.map(t => {
            const isLinked = t.questions && t.questions.some(q => q.linkedGoalId);
            return `<div class="content-card card-test"><div class="content-header"><h4 title="${t.title}">${t.title}</h4><span class="content-badge subject-${t.subject}">${t.subject}</span></div><div class="content-body"><p class="text-muted small" style="margin-bottom:10px;">${t.description || 'لا يوجد وصف'}</p><div class="content-meta"><span><i class="fas fa-question-circle"></i> ${t.questions?.length || 0} أسئلة</span>${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بأهداف</span>' : ''}</div></div><div class="content-footer"><button class="btn-card-action btn-test-light" onclick="showLinkModal('test', ${t.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-test-light" onclick="editTest(${t.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteTest(${t.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
        }).join('');
    } catch(e) { console.error(e); }
}

async function saveTest() { 
    const title = document.getElementById('testTitle').value; if(!title) return; 
    const qs = await collectQuestionsFromContainer('questionsContainer'); if (!qs) return; 
    const id = document.getElementById('editTestId').value; 
    
    const testData = {
        id: id ? parseInt(id) : Date.now(), 
        teacherId: getCurrentUser().id, 
        title: title, 
        subject: document.getElementById('testSubject').value, 
        description: document.getElementById('testDescription').value, 
        questions: qs
    }; 
    
    try {
        const { error } = await window.supabase.from('tests').upsert(testData);
        if (error) throw error;
        closeModal('createTestModal'); 
        loadTests(); 
        showSuccess('تم الحفظ في السحابة بنجاح');
    } catch(e) { console.error(e); showError("فشل الحفظ في السحابة"); }
}

async function editTest(id) { 
    const { data, error } = await window.supabase.from('tests').select('*').eq('id', id).single();
    if(error || !data) return; 
    document.getElementById('editTestId').value = data.id; 
    document.getElementById('testTitle').value = data.title; 
    document.getElementById('testSubject').value = data.subject; 
    document.getElementById('testDescription').value = data.description; 
    const c = document.getElementById('questionsContainer'); 
    c.innerHTML = ''; 
    (data.questions||[]).forEach(q => addQuestionToContainer(c,'سؤال',q)); 
    document.getElementById('createTestModal').classList.add('show'); 
}

function deleteTest(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا الاختبار نهائياً؟', async function() { 
        try {
            await window.supabase.from('tests').delete().eq('id', id);
            loadTests(); 
            showSuccess('تم الحذف بنجاح'); 
        } catch(e) { console.error(e); }
    }); 
}

// ----------------------------------------------------
// 2. إدارة الأهداف (Objectives)
// ----------------------------------------------------
async function loadObjectives() {
    const list = document.getElementById('objectivesList'); if (!list) return;
    const user = getCurrentUser();
    try {
        const { data: objs, error } = await window.supabase.from('objectives').select('*').eq('teacherId', user.id).order('createdAt', { ascending: false });
        if (error) throw error;

        if (!objs || objs.length === 0) { list.innerHTML = `<div class="empty-content-state" style="text-align:center;padding:20px;"><h3>لا توجد أهداف</h3><button class="btn btn-success mt-2" onclick="showCreateObjectiveModal()">+ هدف جديد</button></div>`; return; }
        
        list.innerHTML = objs.map(o => `<div class="objective-row" id="obj-row-${o.id}"><div class="obj-header" onclick="toggleObjective(${o.id})"><div style="display:flex; align-items:center; gap:10px;"><i class="fas fa-chevron-down toggle-icon" id="icon-${o.id}"></i><h4 class="short-term-title">${o.shortTermGoal}</h4><span class="content-badge subject-${o.subject}" style="font-size:0.8rem; padding:2px 8px;">${o.subject}</span></div><div class="obj-actions" onclick="event.stopPropagation()"><button class="btn-card-action btn-lesson-light" onclick="editObjective(${o.id})" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn-card-action btn-delete-card" onclick="deleteObjective(${o.id})" title="حذف"><i class="fas fa-trash"></i></button></div></div><div class="obj-body" id="obj-body-${o.id}">${o.instructionalGoals && o.instructionalGoals.length > 0 ? `<div style="font-weight:bold; margin-bottom:5px; color:#555;">الأهداف التدريسية:</div><ul class="instructional-goals-list">${o.instructionalGoals.map(g => `<li>${g}</li>`).join('')}</ul>` : '<span class="text-muted small">لا توجد أهداف فرعية</span>'}</div></div>`).join('');
    } catch(e) { console.error(e); }
}

async function saveObjective() { 
    const id = document.getElementById('editObjectiveId').value; 
    const subject = document.getElementById('objSubject').value; 
    const shortTermGoal = document.getElementById('shortTermGoal').value; 
    if(!shortTermGoal) return; 
    
    const ig = []; 
    document.querySelectorAll('.instructional-goal-input').forEach(i => { if(i.value.trim()) ig.push(i.value.trim()) }); 
    
    const objData = { 
        id: id ? parseInt(id) : Date.now(), 
        teacherId: getCurrentUser().id, 
        subject: subject, 
        shortTermGoal: shortTermGoal, 
        instructionalGoals: ig 
    }; 
    
    try {
        const { error } = await window.supabase.from('objectives').upsert(objData);
        if (error) throw error;
        closeModal('createObjectiveModal'); 
        loadObjectives(); 
        showSuccess('تم حفظ الهدف في السحابة بنجاح'); 
    } catch(e) { console.error(e); showError("فشل الحفظ"); }
}

async function editObjective(id) { 
    const { data, error } = await window.supabase.from('objectives').select('*').eq('id', id).single();
    if(error || !data) return; 
    document.getElementById('editObjectiveId').value = data.id; 
    document.getElementById('objSubject').value = data.subject; 
    document.getElementById('shortTermGoal').value = data.shortTermGoal; 
    const c = document.getElementById('instructionalGoalsContainer'); 
    c.innerHTML = ''; 
    if(data.instructionalGoals?.length > 0) data.instructionalGoals.forEach(g => addInstructionalGoalInput(g)); 
    else addInstructionalGoalInput(); 
    document.getElementById('createObjectiveModal').classList.add('show'); 
}

function deleteObjective(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا الهدف؟', async function() { 
        try {
            await window.supabase.from('objectives').delete().eq('id', id);
            loadObjectives(); 
            showSuccess('تم الحذف'); 
        } catch(e) { console.error(e); }
    }); 
}

// ----------------------------------------------------
// 3. إدارة الدروس (Lessons)
// ----------------------------------------------------
async function loadLessons() {
    const grid = document.getElementById('lessonsGrid'); if(!grid) return;
    const user = getCurrentUser();
    try {
        const { data: lessons, error } = await window.supabase.from('lessons').select('*').eq('teacherId', user.id).order('createdAt', { ascending: false });
        if (error) throw error;

        if (!lessons || lessons.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد دروس تفاعلية</h3></div>`; return; }
        
        grid.innerHTML = lessons.map(l => {
            const isLinked = !!l.linkedInstructionalGoal;
            return `<div class="content-card card-lesson"><div class="content-header"><h4 title="${l.title}">${l.title}</h4><span class="content-badge subject-${l.subject}">${l.subject}</span></div><div class="content-body"><div class="small text-muted" style="margin-bottom:10px;">تمهيد، تمارين (${l.exercises?.questions?.length || 0})، تقييم (${l.assessment?.questions?.length || 0})</div><div class="content-meta">${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف تدريسي</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}</div></div><div class="content-footer"><button class="btn-card-action btn-lesson-light" onclick="showLinkModal('lesson', ${l.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-lesson-light" onclick="editLesson(${l.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteLesson(${l.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
        }).join('');
    } catch(e) { console.error(e); }
}

async function saveLesson() { 
    const id = document.getElementById('editLessonId').value; 
    const title = document.getElementById('lessonTitle').value; if(!title) return; 
    const intro = {type: document.getElementById('introType').value, url: document.getElementById('introUrl').value, text: document.getElementById('introText').value}; 
    const exQs = await collectQuestionsFromContainer('exercisesContainer'); if (!exQs) return; 
    const ex = {passScore: document.getElementById('exercisesPassScore').value, questions: exQs}; 
    const asQs = await collectQuestionsFromContainer('assessmentContainer'); if (!asQs) return; 
    const as = {questions: asQs}; 
    
    const lessonData = {
        id: id ? parseInt(id) : Date.now(), 
        teacherId: getCurrentUser().id, 
        title: title, 
        subject: document.getElementById('lessonSubject').value, 
        intro: intro, 
        exercises: ex, 
        assessment: as
    }; 
    
    try {
        const { error } = await window.supabase.from('lessons').upsert(lessonData);
        if (error) throw error;
        closeModal('createLessonModal'); 
        loadLessons(); 
        showSuccess('تم حفظ الدرس في السحابة بنجاح'); 
    } catch(e) { console.error(e); showError("فشل الحفظ"); }
}

async function editLesson(id) { 
    const { data: l, error } = await window.supabase.from('lessons').select('*').eq('id', id).single();
    if(error || !l) return; 
    
    document.getElementById('editLessonId').value = l.id; 
    document.getElementById('lessonTitle').value = l.title; 
    document.getElementById('lessonSubject').value = l.subject; 
    if(l.intro){document.getElementById('introType').value=l.intro.type; document.getElementById('introUrl').value=l.intro.url; document.getElementById('introText').value=l.intro.text; toggleIntroInputs();} 
    document.getElementById('exercisesPassScore').value=l.exercises?.passScore||80; 
    
    const ec=document.getElementById('exercisesContainer'); ec.innerHTML=''; 
    (l.exercises?.questions||[]).forEach(q=>addQuestionToContainer(ec,'سؤال',q)); 
    
    const ac=document.getElementById('assessmentContainer'); ac.innerHTML=''; 
    (l.assessment?.questions||[]).forEach(q=>addQuestionToContainer(ac,'سؤال',q)); 
    
    switchLessonStep('intro'); 
    document.getElementById('createLessonModal').classList.add('show'); 
}

function deleteLesson(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا الدرس؟', async function() { 
        try {
            await window.supabase.from('lessons').delete().eq('id', id);
            loadLessons(); 
            showSuccess('تم الحذف'); 
        } catch(e) { console.error(e); }
    }); 
}

// ----------------------------------------------------
// 4. إدارة الواجبات (Assignments)
// ----------------------------------------------------
async function loadHomeworks() {
    const grid = document.getElementById('homeworksGrid'); if (!grid) return;
    const user = getCurrentUser();
    try {
        const { data: homeworks, error } = await window.supabase.from('assignments').select('*').eq('teacherId', user.id).order('createdAt', { ascending: false });
        if (error) throw error;

        if (!homeworks || homeworks.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد واجبات</h3><button class="btn btn-success mt-2" onclick="showCreateHomeworkModal()">+ واجب جديد</button></div>`; return; }
        
        grid.innerHTML = homeworks.map(h => {
            const isLinked = !!h.linkedInstructionalGoal;
            return `<div class="content-card card-homework"><div class="content-header"><h4 title="${h.title}">${h.title}</h4><span class="content-badge subject-${h.subject}">${h.subject}</span></div><div class="content-body"><p class="text-muted small" style="margin-bottom:10px;">${h.description || 'لا يوجد وصف'}</p><div class="content-meta"><span><i class="fas fa-list-ol"></i> ${h.questions?.length || 0} أسئلة</span>${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}</div></div><div class="content-footer"><button class="btn-card-action btn-homework-light" onclick="showLinkModal('homework', ${h.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-homework-light" onclick="editHomework(${h.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteHomework(${h.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
        }).join('');
    } catch(e) { console.error(e); }
}

async function saveHomework() { 
    const id = document.getElementById('editHomeworkId').value; 
    const title = document.getElementById('homeworkTitle').value; if(!title) return; 
    const qs = await collectQuestionsFromContainer('homeworkQuestionsContainer'); if (!qs) return; 
    
    const hwData = {
        id: id ? parseInt(id) : Date.now(), 
        teacherId: getCurrentUser().id, 
        title: title, 
        subject: document.getElementById('homeworkSubject').value, 
        description: document.getElementById('homeworkDescription').value, 
        questions: qs
    }; 
    
    try {
        const { error } = await window.supabase.from('assignments').upsert(hwData);
        if (error) throw error;
        closeModal('createHomeworkModal'); 
        loadHomeworks(); 
        showSuccess('تم الحفظ بنجاح');
    } catch(e) { console.error(e); showError("فشل الحفظ"); }
}

async function editHomework(id) { 
    const { data: h, error } = await window.supabase.from('assignments').select('*').eq('id', id).single();
    if(error || !h) return; 
    
    document.getElementById('editHomeworkId').value = h.id; 
    document.getElementById('homeworkTitle').value = h.title; 
    document.getElementById('homeworkSubject').value = h.subject; 
    document.getElementById('homeworkDescription').value = h.description; 
    
    const c = document.getElementById('homeworkQuestionsContainer'); c.innerHTML=''; 
    (h.questions||[]).forEach(q => addQuestionToContainer(c,'سؤال',q)); 
    document.getElementById('createHomeworkModal').classList.add('show'); 
}

function deleteHomework(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا الواجب؟', async function() { 
        try {
            await window.supabase.from('assignments').delete().eq('id', id);
            loadHomeworks(); 
            showSuccess('تم الحذف'); 
        } catch(e) { console.error(e); }
    }); 
}

// ----------------------------------------------------
// دوال واجهة المستخدم (تتعلق بعرض الأسئلة وإدارتها) - كما هي بالأساس
// ----------------------------------------------------
function showCreateTestModal() { document.getElementById('editTestId').value=''; document.getElementById('testTitle').value=''; document.getElementById('testSubject').value='لغتي'; document.getElementById('testDescription').value=''; document.getElementById('questionsContainer').innerHTML=''; addQuestion(); document.getElementById('createTestModal').classList.add('show'); }
function showCreateHomeworkModal() { document.getElementById('editHomeworkId').value=''; document.getElementById('homeworkTitle').value=''; document.getElementById('homeworkDescription').value=''; document.getElementById('homeworkQuestionsContainer').innerHTML=''; addHomeworkQuestion(); document.getElementById('createHomeworkModal').classList.add('show'); }
function showCreateLessonModal() { document.getElementById('editLessonId').value=''; document.getElementById('lessonTitle').value=''; document.getElementById('introUrl').value=''; document.getElementById('introText').value=''; document.getElementById('exercisesContainer').innerHTML=''; document.getElementById('assessmentContainer').innerHTML=''; addLessonQuestion('exercisesContainer'); addLessonQuestion('assessmentContainer'); switchLessonStep('intro'); document.getElementById('createLessonModal').classList.add('show'); }
function showCreateObjectiveModal() { document.getElementById('editObjectiveId').value=''; document.getElementById('shortTermGoal').value=''; document.getElementById('instructionalGoalsContainer').innerHTML=''; addInstructionalGoalInput(); document.getElementById('createObjectiveModal').classList.add('show'); }
function toggleObjective(id) { const body = document.getElementById(`obj-body-${id}`); const row = document.getElementById(`obj-row-${id}`); if (body.classList.contains('show')) { body.classList.remove('show'); row.classList.remove('expanded'); } else { body.classList.add('show'); row.classList.add('expanded'); } }
function addInstructionalGoalInput(v='') { const c=document.getElementById('instructionalGoalsContainer'); const d=document.createElement('div'); d.className='d-flex mb-2'; d.innerHTML=`<input type="text" class="form-control instructional-goal-input" value="${v}" placeholder="هدف تدريسي فرعي"><button type="button" class="btn btn-outline-danger btn-sm ml-2" onclick="this.parentElement.remove()">×</button>`; c.appendChild(d); }
function toggleIntroInputs() { const t=document.getElementById('introType').value; const u=document.getElementById('introUrl'); u.placeholder=t==='video'?'رابط يوتيوب':(t==='image'?'رابط الصورة':'رابط'); }
function switchLessonStep(step) { document.querySelectorAll('.lesson-step-content').forEach(el => el.style.display = 'none'); document.querySelectorAll('.step-indicator').forEach(el => el.classList.remove('active')); const stepEl = document.getElementById('step-' + step); const indEl = document.getElementById('indicator-' + step); if (stepEl) stepEl.style.display = 'block'; if (indEl) indEl.classList.add('active'); }
function closeModal(id) { const modal = document.getElementById(id); if(modal) modal.classList.remove('show'); }

// ----------------------------------------------------
// بناء الأسئلة (UI Logic - لم يتغير)
// ----------------------------------------------------
function addQuestion() { addQuestionToContainer(document.getElementById('questionsContainer'), 'سؤال'); }
function addLessonQuestion(id) { addQuestionToContainer(document.getElementById(id), 'سؤال'); }
function addHomeworkQuestion() { addQuestionToContainer(document.getElementById('homeworkQuestionsContainer'), 'سؤال'); }

function addQuestionToContainer(container, lbl, data = null) {
    const qUniqueId = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 10000); 
    const type = data ? data.type : 'mcq';
    const maxScore = data ? (data.maxScore || data.passingScore || 1) : 1;
    const passCriterion = data ? (data.passingCriterion || 80) : 80;

    const isTestOrHomework = (container.id === 'questionsContainer' || container.id === 'homeworkQuestionsContainer');
    let stripeClass = 'mcq';
    if(type.includes('drag')) stripeClass = 'drag'; else if(type.includes('ai')) stripeClass = 'ai'; else if(type.includes('manual')) stripeClass = 'manual';

    const criterionHtml = isTestOrHomework ? `
        <div style="display:flex; flex-direction:column; align-items:center;">
            <label style="font-size:0.75rem; font-weight:bold; color:#dc3545; margin-bottom:2px;">المحك (%)</label>
            <input type="number" class="passing-criterion" value="${passCriterion}" style="width:60px; border:1px solid #ffcdd2; border-radius:5px; text-align:center; background:#ffebee; font-weight:bold;">
        </div>` : '';

    const cardHtml = `
    <div class="question-card" id="${qUniqueId}">
        <div class="q-stripe ${stripeClass}"></div>
        <div class="q-header">
            <div class="q-title">
                <span class="badge badge-secondary">${container.children.length + 1}</span>
                <select class="form-control form-control-sm" style="width:200px;" onchange="renderQuestionInputs(this, '${qUniqueId}')">
                    <optgroup label="أسئلة قياسية">
                        <option value="mcq" ${type==='mcq'?'selected':''}>اختيار من متعدد</option>
                        <option value="mcq-media" ${type==='mcq-media'?'selected':''}>اختيار من متعدد (مرفق)</option>
                        <option value="drag-drop" ${type==='drag-drop'?'selected':''}>سحب وإفلات (ذكية)</option>
                        <option value="open-ended" ${type==='open-ended'?'selected':''}>سؤال مفتوح</option>
                    </optgroup>
                    <optgroup label="التقييم الآلي">
                        <option value="ai-reading" ${type==='ai-reading'?'selected':''}>تقييم قراءة آلي</option>
                        <option value="ai-spelling" ${type==='ai-spelling'?'selected':''}>تقييم إملاء آلي</option>
                    </optgroup>
                    <optgroup label="التقييم اليدوي">
                        <option value="manual-reading" ${type==='manual-reading'?'selected':''}>تقييم قراءة يدوي</option>
                        <option value="manual-spelling" ${type==='manual-spelling'?'selected':''}>تقييم إملاء يدوي</option>
                        <option value="missing-char" ${type==='missing-char'?'selected':''}>أكمل الحرف الناقص</option>
                    </optgroup>
                </select>
            </div>
            <div class="q-actions" style="display:flex; align-items:flex-end; gap:10px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <label style="font-size:0.75rem; font-weight:bold; color:#0056b3; margin-bottom:2px;">الدرجة</label>
                    <input type="number" step="0.5" class="max-score" value="${maxScore}" style="width:60px; border:1px solid #90caf9; border-radius:5px; text-align:center; background:#e3f2fd; font-weight:bold;">
                </div>
                ${criterionHtml}
                <button type="button" onclick="this.closest('.question-card').remove()" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="q-body question-inputs-area"></div>
    </div>`;

    container.insertAdjacentHTML('beforeend', cardHtml);
    const selectElem = container.lastElementChild.querySelector('select');
    renderQuestionInputs(selectElem, qUniqueId, data);
}

function renderQuestionInputs(selectElem, qUniqueId, data = null) {
    const type = selectElem.value;
    const card = document.getElementById(qUniqueId);
    const area = card.querySelector('.question-inputs-area');
    
    const multiTypes = ['drag-drop', 'ai-reading', 'ai-spelling', 'manual-reading', 'manual-spelling', 'missing-char'];
    if (multiTypes.includes(type)) {
        let html = `<div class="form-group mb-3"><label class="q-label">عنوان السؤال</label><input type="text" class="form-control q-text" value="${data?.text || ''}"></div>`;
        html += `<div id="paragraphs-container-${qUniqueId}" class="paragraphs-list"></div>`;
        html += `<button type="button" class="btn btn-sm btn-primary mt-2 mb-3" onclick="addParagraphInput('${qUniqueId}', '${type}')" style="width:100%; border:2px dashed #007bff; background:transparent; color:#007bff;">+ إضافة فقرة/جملة</button>`;
        area.innerHTML = html;
        const items = data?.paragraphs || [];
        if (items.length > 0) items.forEach(item => addParagraphInput(qUniqueId, type, item));
        else { addParagraphInput(qUniqueId, type); if (type === 'drag-drop') setTimeout(() => addParagraphInput(qUniqueId, type), 50); }
    } else {
        let html = `<div class="form-group mb-3"><label class="q-label">النص</label><input type="text" class="form-control q-text" value="${data?.text || ''}"></div>`;
        if (type === 'mcq' || type === 'mcq-media') {
            if (type === 'mcq-media') html += `<div class="form-group mb-3 p-2 bg-light border rounded"><label>مرفق</label><input type="file" class="form-control-file q-attachment"><input type="hidden" class="q-existing-attachment" value="${data?.attachment || ''}"></div>`;
            html += `<label class="q-label">الخيارات</label><div class="choices-container" id="choices-${qUniqueId}">`;
            const choices = data?.choices || ['خيار 1', 'خيار 2'];
            const correct = data?.correctAnswer ? parseInt(data.correctAnswer) : 0; 
            choices.forEach((c, i) => { html += `<div class="choice-row"><input type="radio" name="correct-${qUniqueId}" value="${i}" ${i === correct ? 'checked' : ''}><input type="text" class="form-control q-choice" value="${c}"><button type="button" class="btn-remove-choice" onclick="this.parentElement.remove()">×</button></div>`; });
            html += `</div><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addChoiceInput('${qUniqueId}')">+ إضافة خيار</button>`;
        } else if (type === 'open-ended') {
            html += `<div class="form-group"><label class="q-label">الإجابة النموذجية</label><textarea class="form-control q-model-answer" rows="2">${data?.modelAnswer || ''}</textarea></div>`;
        }
        area.innerHTML = html;
    }
}

function addChoiceInput(qUniqueId) { 
    const container = document.getElementById(`choices-${qUniqueId}`); 
    const count = container.children.length; 
    const div = document.createElement('div'); div.className = 'choice-row'; 
    div.innerHTML = `<input type="radio" name="correct-${qUniqueId}" value="${count}"><input type="text" class="form-control q-choice" placeholder="الخيار الجديد"><button type="button" class="btn-remove-choice" onclick="this.parentElement.remove()">×</button>`; 
    container.appendChild(div); 
}

function addParagraphInput(qUniqueId, type, itemData = null) {
    const container = document.getElementById(`paragraphs-container-${qUniqueId}`);
    if(!container) return;
    const pIdx = Date.now() + Math.floor(Math.random() * 1000); 
    let innerHtml = '';
    if (type === 'drag-drop') {
        const text = itemData?.text || '';
        innerHtml = `<label class="q-label">الجملة:</label><div class="input-group mb-2"><input type="text" class="form-control p-text" id="drag-source-${qUniqueId}-${pIdx}" value="${text}"><div class="input-group-append"><button class="btn btn-warning" type="button" onclick="initDragHighlighter('${qUniqueId}', '${pIdx}')">تجهيز</button></div></div><div id="highlighter-area-${qUniqueId}-${pIdx}" class="highlight-area" style="display:none;"></div><input type="hidden" class="p-gaps-data" id="gaps-data-${qUniqueId}-${pIdx}" value='${itemData?.gaps ? JSON.stringify(itemData.gaps) : ''}'>`;
        if (text && itemData?.gaps) { setTimeout(() => initDragHighlighter(qUniqueId, pIdx, itemData.gaps), 100); }
    } else if (type === 'ai-reading' || type === 'manual-reading') {
        innerHtml = `<label class="q-label">فقرة القراءة</label><textarea class="form-control p-text" rows="2">${itemData?.text || ''}</textarea>`;
    } else if (type === 'ai-spelling' || type === 'manual-spelling') {
        innerHtml = `<label class="q-label">الكلمة</label><input type="text" class="form-control p-text" value="${itemData?.text || ''}">`;
    } else if (type === 'missing-char') {
        innerHtml = `<div class="row"><div class="col-6"><input type="text" class="form-control p-text" value="${itemData?.text || ''}" placeholder="الكلمة"></div><div class="col-6"><input type="text" class="form-control p-missing" value="${itemData?.missing || ''}" placeholder="الناقص"></div></div>`;
    }
    const div = document.createElement('div'); div.className = 'paragraph-item'; div.id = `p-item-${qUniqueId}-${pIdx}`;
    div.innerHTML = innerHtml + `<button type="button" class="btn-remove-paragraph" onclick="this.parentElement.remove()" style="position:absolute; top:5px; left:5px;">×</button>`;
    container.appendChild(div);
}

function initDragHighlighter(qUniqueId, pIdx, savedGaps = null) {
    const sourceInput = document.getElementById(`drag-source-${qUniqueId}-${pIdx}`);
    const area = document.getElementById(`highlighter-area-${qUniqueId}-${pIdx}`);
    const text = sourceInput.value.trim();
    if(!text) return;
    area.style.display = 'block';
    area.innerHTML = `<div style="margin-bottom:10px;"><p id="sel-text-${qUniqueId}-${pIdx}" style="font-size:1.3rem;">${text}</p></div><button type="button" class="btn btn-warning btn-sm" onclick="markGap('${qUniqueId}', '${pIdx}')">تحديد فراغ</button><button type="button" class="btn btn-secondary btn-sm" onclick="resetGap('${qUniqueId}', '${pIdx}')">إعادة تعيين</button><div id="gap-prev-${qUniqueId}-${pIdx}" class="gap-preview mt-2"></div>`;
    if(savedGaps) { const preview = document.getElementById(`gap-prev-${qUniqueId}-${pIdx}`); preview.innerHTML = '<strong>الفراغات:</strong> ' + savedGaps.map(g => `<span class="badge badge-warning m-1">${g.dragItem}</span>`).join(' '); }
}
function markGap(qUniqueId, pIdx) {
    const selection = window.getSelection(); const selectedText = selection.toString();
    if (!selectedText) { alert('حدد النص أولاً'); return; }
    let processed = selectedText;
    if (selectedText.length === 1 && /[جحخعغفقثصضشسيبلتنمكطظ]/.test(selectedText)) { processed = 'ـ' + selectedText + 'ـ'; }
    const preview = document.getElementById(`gap-prev-${qUniqueId}-${pIdx}`);
    preview.innerHTML += `<span class="badge badge-warning m-1">${processed}</span>`;
    const hiddenInput = document.getElementById(`gaps-data-${qUniqueId}-${pIdx}`);
    let data = hiddenInput.value ? JSON.parse(hiddenInput.value) : [];
    data.push({ original: selectedText, dragItem: processed });
    hiddenInput.value = JSON.stringify(data);
    selection.removeAllRanges();
}
function resetGap(qUniqueId, pIdx) { document.getElementById(`gap-prev-${qUniqueId}-${pIdx}`).innerHTML = ''; document.getElementById(`gaps-data-${qUniqueId}-${pIdx}`).value = ''; }
function readFileAsBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); }); }

async function collectQuestionsFromContainer(id) {
    const cards = document.querySelectorAll(`#${id} .question-card`);
    const qs = [];
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const type = card.querySelector('select').value;
        const maxScoreVal = parseFloat(card.querySelector('.max-score').value) || 1;
        const criterionInput = card.querySelector('.passing-criterion');
        const criterionVal = criterionInput ? (parseFloat(criterionInput.value) || 80) : 80;
        
        const qData = { id: Date.now() + Math.random(), type: type, maxScore: maxScoreVal, passingScore: maxScoreVal, passingCriterion: criterionVal };
        
        if (type === 'mcq' || type === 'mcq-media' || type === 'open-ended') {
            qData.text = card.querySelector('.q-text')?.value || '';
            if (type.includes('mcq')) {
                qData.choices = Array.from(card.querySelectorAll('.q-choice')).map(c => c.value);
                card.querySelectorAll('input[type="radio"]').forEach((r, idx) => { if(r.checked) qData.correctAnswer = idx; });
                const fileInput = card.querySelector('.q-attachment'); const existingFile = card.querySelector('.q-existing-attachment')?.value;
                if (fileInput && fileInput.files[0]) { qData.attachment = await readFileAsBase64(fileInput.files[0]); } else if (existingFile) { qData.attachment = existingFile; }
            } else { qData.modelAnswer = card.querySelector('.q-model-answer').value; }
        } else {
            qData.text = card.querySelector('.q-text')?.value || ''; qData.paragraphs = [];
            card.querySelectorAll('.paragraph-item').forEach(pItem => {
                const pData = { id: Date.now() + Math.random() };
                if (type === 'drag-drop') {
                    pData.text = pItem.querySelector('.p-text').value;
                    const gapsVal = pItem.querySelector('.p-gaps-data').value;
                    pData.gaps = gapsVal ? JSON.parse(gapsVal) : [];
                } else if (type === 'missing-char') {
                    pData.text = pItem.querySelector('.p-text').value; pData.missing = pItem.querySelector('.p-missing').value;
                } else { pData.text = pItem.querySelector('.p-text').value; }
                qData.paragraphs.push(pData);
            });
        }
        qs.push(qData);
    }
    return qs;
}

// ----------------------------------------------------
// نافذة ربط المحتوى بالأهداف
// ----------------------------------------------------
function injectLinkContentModal() { /* متواجدة ضمن HTML */ }
async function showLinkModal(type, id) {
    document.getElementById('linkTargetId').value = id; document.getElementById('linkTargetType').value = type;
    const container = document.getElementById('linkContentBody'); const instruction = document.getElementById('linkInstructionText'); container.innerHTML = '';
    
    // جلب الأهداف من السحابة
    const user = getCurrentUser();
    const { data: objectives, error: objError } = await window.supabase.from('objectives').select('*').eq('teacherId', user.id);
    if(objError || !objectives || objectives.length === 0) { container.innerHTML = '<div class="text-center text-danger p-3">لا توجد أهداف مضافة. الرجاء إضافة أهداف أولاً.</div>'; document.getElementById('linkContentModal').classList.add('show'); return; }
    
    if (type === 'test') {
        instruction.textContent = 'قم بربط كل سؤال بالهدف قصير المدى الذي يقيسه.';
        const { data: test, error } = await window.supabase.from('tests').select('*').eq('id', id).single();
        if(error || !test || !test.questions) return;

        const relevantObjs = objectives.filter(o => o.subject === test.subject);
        let optionsHtml = '<option value="">-- اختر الهدف --</option>'; relevantObjs.forEach(o => { optionsHtml += `<option value="${o.id}">${o.shortTermGoal}</option>`; });
        
        test.questions.forEach((q, idx) => { 
            const row = document.createElement('div'); row.className = 'linking-row mb-2'; 
            row.innerHTML = `<div class="mb-1"><strong>س${idx+1}:</strong> ${q.text || 'سؤال'}</div><select class="form-control question-link-select" data-question-id="${q.id}">${optionsHtml}</select>`; 
            if(q.linkedGoalId) row.querySelector('select').value = q.linkedGoalId; 
            container.appendChild(row); 
        });
    } else {
        instruction.textContent = 'قم باختيار هدف تدريسي واحد لربط هذا المحتوى به.';
        const table = (type === 'lesson') ? 'lessons' : 'assignments';
        const { data: item, error } = await window.supabase.from(table).select('*').eq('id', id).single();
        if(error || !item) return;

        const relevantObjs = objectives.filter(o => o.subject === item.subject);
        let selectHtml = '<select class="form-control" id="singleInstructionalLink"><option value="">-- غير مرتبط --</option>';
        relevantObjs.forEach(o => { if(o.instructionalGoals && o.instructionalGoals.length > 0) { selectHtml += `<optgroup label="${o.shortTermGoal}">`; o.instructionalGoals.forEach(ig => { selectHtml += `<option value="${ig}">${ig}</option>`; }); selectHtml += `</optgroup>`; } }); selectHtml += '</select>';
        
        container.innerHTML = `<div><label>الهدف التدريسي:</label>${selectHtml}</div>`;
        if(item.linkedInstructionalGoal) { setTimeout(() => { const el = document.getElementById('singleInstructionalLink'); if(el) el.value = item.linkedInstructionalGoal; }, 100); }
    }
    document.getElementById('linkContentModal').classList.add('show');
}

async function saveContentLinks() {
    const id = parseInt(document.getElementById('linkTargetId').value); const type = document.getElementById('linkTargetType').value;
    if (type === 'test') {
        const { data: test, error } = await window.supabase.from('tests').select('*').eq('id', id).single();
        if(error || !test) return;

        const selects = document.querySelectorAll('.question-link-select'); 
        selects.forEach(sel => { 
            const qId = parseFloat(sel.getAttribute('data-question-id')); 
            const goalId = sel.value; 
            const q = test.questions.find(qx => qx.id === qId || Math.abs(qx.id - qId) < 0.0001); 
            if(q) q.linkedGoalId = goalId ? parseInt(goalId) : null; 
        }); 
        
        await window.supabase.from('tests').update({ questions: test.questions }).eq('id', id);
        loadTests(); 
    } else {
        const table = (type === 'lesson') ? 'lessons' : 'assignments'; 
        const linkedVal = document.getElementById('singleInstructionalLink').value || null;
        await window.supabase.from(table).update({ linkedInstructionalGoal: linkedVal }).eq('id', id);
        
        if(type === 'lesson') loadLessons(); else loadHomeworks(); 
    }
    closeModal('linkContentModal'); showSuccess('تم حفظ الارتباطات بنجاح');
}

// ----------------------------------------------------
// الاستيراد والتصدير (Export/Import) 
// ----------------------------------------------------
// يمكنك إبقاء التصدير يتعامل مع Supabase بجلب البيانات وتصديرها כـ JSON
function showExportModal() { alert("ميزة التصدير سيتم برمجتها للعمل مع السحابة في التحديث القادم."); }
function executeExport() {}
function toggleGlobalSelect() {}
function triggerImport() { document.getElementById('importFileInput').click(); }
function importContent(input) { alert("ميزة الاستيراد سيتم برمجتها للعمل مع السحابة في التحديث القادم."); input.value = ''; }

// الربط العام (Global Scope)
window.showCreateTestModal = showCreateTestModal; window.editTest = editTest; window.deleteTest = deleteTest; window.saveTest = saveTest;
window.showCreateHomeworkModal = showCreateHomeworkModal; window.editHomework = editHomework; window.deleteHomework = deleteHomework; window.saveHomework = saveHomework;
window.showCreateLessonModal = showCreateLessonModal; window.editLesson = editLesson; window.deleteLesson = deleteLesson; window.saveLesson = saveLesson;
window.toggleIntroInputs = toggleIntroInputs; window.switchLessonStep = switchLessonStep;
window.showCreateObjectiveModal = showCreateObjectiveModal; window.editObjective = editObjective; window.deleteObjective = deleteObjective; window.saveObjective = saveObjective;
window.addInstructionalGoalInput = addInstructionalGoalInput; window.toggleObjective = toggleObjective;
window.showLinkModal = showLinkModal; window.saveContentLinks = saveContentLinks; window.closeModal = closeModal;
window.addQuestion = addQuestion; window.addLessonQuestion = addLessonQuestion; window.addHomeworkQuestion = addHomeworkQuestion;
window.renderQuestionInputs = renderQuestionInputs; window.addChoiceInput = addChoiceInput; window.addParagraphInput = addParagraphInput;
window.initDragHighlighter = initDragHighlighter; window.markGap = markGap; window.resetGap = resetGap;
window.showExportModal = showExportModal; window.triggerImport = triggerImport; window.importContent = importContent;
window.toggleDropdown = toggleDropdown;

// ============================================
// 📁 المسار: assets/js/content-library.js
// الوصف: مكتبة المحتوى + نافذة التصدير التفاعلية (Supabase Version)
// ============================================

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

// =========================================================
// 🔥 نظام النوافذ المنبثقة والإشعارات 🔥
// =========================================================
if (!window.showError) {
    window.showError = function(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            const toastHtml = `<div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:15px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px; max-width:90%; text-align:center;"><i class="fas fa-exclamation-triangle" style="font-size:1.5rem;"></i> <span>${message}</span></div>`;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalErrorToast');
        }
        toast.querySelector('span').innerHTML = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 5000);
    };
}

if (!window.showSuccess) {
    window.showSuccess = function(message) {
        let toast = document.getElementById('globalSuccessToast');
        if (!toast) {
            const toastHtml = `<div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span></div>`;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalSuccessToast');
        }
        document.getElementById('globalSuccessMessage').textContent = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    };
}

// =========================================================
// 🔥 التهيئة وجلب البيانات 🔥
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    injectLinkContentModal(); 
    loadContentLibrary();
});

async function loadContentLibrary() {
    await Promise.all([
        loadTests(),
        loadLessons(),
        loadObjectives(),
        loadHomeworks()
    ]);
}

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }

// =========================================================
// 📚 جلب المحتوى من Supabase
// =========================================================

async function loadTests() {
    const grid = document.getElementById('testsGrid'); if(!grid) return;
    const { data: tests, error } = await supa.from('tests').select('*').eq('teacherId', getCurrentUser().id).order('createdAt', { ascending: false });
    
    if(error || !tests || tests.length === 0) { grid.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:20px; color:#777;">لا توجد اختبارات تشخيصية</div>'; return; }
    
    grid.innerHTML = tests.map(t => {
        const isLinked = t.questions && t.questions.some(q => q.linkedGoalId);
        return `<div class="content-card card-test"><div class="content-header"><h4 title="${t.title}">${t.title}</h4><span class="content-badge subject-${t.subject}">${t.subject}</span></div><div class="content-body"><p class="text-muted small" style="margin-bottom:10px;">${t.description || 'لا يوجد وصف'}</p><div class="content-meta"><span><i class="fas fa-question-circle"></i> ${t.questions?.length || 0} أسئلة</span>${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بأهداف</span>' : ''}</div></div><div class="content-footer"><button class="btn-card-action btn-test-light" onclick="showLinkModal('test', ${t.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-test-light" onclick="editTest(${t.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteTest(${t.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

async function loadLessons() {
    const grid = document.getElementById('lessonsGrid'); if(!grid) return;
    const { data: lessons, error } = await supa.from('lessons').select('*').eq('teacherId', getCurrentUser().id).order('createdAt', { ascending: false });
    
    if (error || !lessons || lessons.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد دروس تفاعلية</h3></div>`; return; }
    
    grid.innerHTML = lessons.map(l => {
        const isLinked = !!l.linkedInstructionalGoal;
        return `<div class="content-card card-lesson"><div class="content-header"><h4 title="${l.title}">${l.title}</h4><span class="content-badge subject-${l.subject}">${l.subject}</span></div><div class="content-body"><div class="small text-muted" style="margin-bottom:10px;">تمهيد، تمارين (${l.exercises?.questions?.length || 0})، تقييم (${l.assessment?.questions?.length || 0})</div><div class="content-meta">${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف تدريسي</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}</div></div><div class="content-footer"><button class="btn-card-action btn-lesson-light" onclick="showLinkModal('lesson', ${l.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-lesson-light" onclick="editLesson(${l.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteLesson(${l.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

async function loadObjectives() {
    const list = document.getElementById('objectivesList'); if (!list) return;
    const { data: objs, error } = await supa.from('objectives').select('*').eq('teacherId', getCurrentUser().id);
    
    if (error || !objs || objs.length === 0) { list.innerHTML = `<div class="empty-content-state" style="text-align:center;padding:20px;"><h3>لا توجد أهداف</h3><button class="btn btn-success mt-2" onclick="showCreateObjectiveModal()">+ هدف جديد</button></div>`; return; }
    
    list.innerHTML = objs.map(o => `<div class="objective-row" id="obj-row-${o.id}"><div class="obj-header" onclick="toggleObjective(${o.id})"><div style="display:flex; align-items:center; gap:10px;"><i class="fas fa-chevron-down toggle-icon" id="icon-${o.id}"></i><h4 class="short-term-title">${o.shortTermGoal}</h4><span class="content-badge subject-${o.subject}" style="font-size:0.8rem; padding:2px 8px;">${o.subject}</span></div><div class="obj-actions" onclick="event.stopPropagation()"><button class="btn-card-action btn-lesson-light" onclick="editObjective(${o.id})" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn-card-action btn-delete-card" onclick="deleteObjective(${o.id})" title="حذف"><i class="fas fa-trash"></i></button></div></div><div class="obj-body" id="obj-body-${o.id}">${o.instructionalGoals && o.instructionalGoals.length > 0 ? `<div style="font-weight:bold; margin-bottom:5px; color:#555;">الأهداف التدريسية:</div><ul class="instructional-goals-list">${o.instructionalGoals.map(g => `<li>${g}</li>`).join('')}</ul>` : '<span class="text-muted small">لا توجد أهداف فرعية</span>'}</div></div>`).join('');
}

async function loadHomeworks() {
    const grid = document.getElementById('homeworksGrid'); if (!grid) return;
    const { data: homeworks, error } = await supa.from('assignments').select('*').eq('teacherId', getCurrentUser().id).order('createdAt', { ascending: false });
    
    if (error || !homeworks || homeworks.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد واجبات</h3><button class="btn btn-success mt-2" onclick="showCreateHomeworkModal()">+ واجب جديد</button></div>`; return; }
    
    grid.innerHTML = homeworks.map(h => {
        const isLinked = !!h.linkedInstructionalGoal;
        return `<div class="content-card card-homework"><div class="content-header"><h4 title="${h.title}">${h.title}</h4><span class="content-badge subject-${h.subject}">${h.subject}</span></div><div class="content-body"><p class="text-muted small" style="margin-bottom:10px;">${h.description || 'لا يوجد وصف'}</p><div class="content-meta"><span><i class="fas fa-list-ol"></i> ${h.questions?.length || 0} أسئلة</span>${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}</div></div><div class="content-footer"><button class="btn-card-action btn-homework-light" onclick="showLinkModal('homework', ${h.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-homework-light" onclick="editHomework(${h.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteHomework(${h.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

function toggleObjective(id) {
    const body = document.getElementById(`obj-body-${id}`); const row = document.getElementById(`obj-row-${id}`);
    if (body.classList.contains('show')) { body.classList.remove('show'); row.classList.remove('expanded'); } else { body.classList.add('show'); row.classList.add('expanded'); }
}

// =========================================================
// 🔥 دوال بناء الأسئلة (UI Functions - unchanged)
// =========================================================
function addQuestion() { addQuestionToContainer(document.getElementById('questionsContainer'), 'سؤال'); }
function addLessonQuestion(id) { addQuestionToContainer(document.getElementById(id), 'سؤال'); }
function addHomeworkQuestion() { addQuestionToContainer(document.getElementById('homeworkQuestionsContainer'), 'سؤال'); }

// (نفس دوال بناء الأسئلة، لم أغيرها لأنها UI فقط وتعمل بشكل ممتاز)
function addQuestionToContainer(container, lbl, data = null) {
    const qUniqueId = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 10000); 
    const type = data ? data.type : 'mcq';
    const maxScore = data ? (data.maxScore || data.passingScore || 1) : 1;
    const passCriterion = data ? (data.passingCriterion || 80) : 80;
    const isTestOrHomework = (container.id === 'questionsContainer' || container.id === 'homeworkQuestionsContainer');
    let stripeClass = type.includes('drag') ? 'drag' : (type.includes('ai') ? 'ai' : (type.includes('manual') ? 'manual' : 'mcq'));

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
                    <optgroup label="التقييم الآلي (AI)">
                        <option value="ai-reading" ${type==='ai-reading'?'selected':''}>تقييم قراءة آلي</option>
                        <option value="ai-spelling" ${type==='ai-spelling'?'selected':''}>تقييم إملاء آلي (رسم)</option>
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
                    <label style="font-size:0.75rem; font-weight:bold; color:#0056b3; margin-bottom:2px;">درجة السؤال</label>
                    <input type="number" step="0.5" class="max-score" value="${maxScore}" style="width:60px; border:1px solid #90caf9; border-radius:5px; text-align:center; background:#e3f2fd; font-weight:bold;">
                </div>
                ${criterionHtml}
                <button type="button" onclick="this.closest('.question-card').remove()" class="btn btn-sm btn-outline-danger" style="height:32px;"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="q-body question-inputs-area"></div>
    </div>`;

    container.insertAdjacentHTML('beforeend', cardHtml);
    renderQuestionInputs(container.lastElementChild.querySelector('select'), qUniqueId, data);
}

function renderQuestionInputs(selectElem, qUniqueId, data = null) {
    const type = selectElem.value; const area = document.getElementById(qUniqueId).querySelector('.question-inputs-area');
    const multiTypes = ['drag-drop', 'ai-reading', 'ai-spelling', 'manual-reading', 'manual-spelling', 'missing-char'];
    
    if (multiTypes.includes(type)) {
        let placeholder = type === 'drag-drop' ? 'مثال: رتب الكلمات...' : 'مثال: أكمل الفراغات...';
        area.innerHTML = `<div class="form-group mb-3"><label class="q-label">عنوان السؤال</label><input type="text" class="form-control q-text" value="${data?.text || ''}" placeholder="${placeholder}"></div><div id="paragraphs-container-${qUniqueId}"></div><button type="button" class="btn btn-sm btn-primary mt-2 mb-3 w-100" style="border: 2px dashed #007bff; background: transparent; color: #007bff;" onclick="addParagraphInput('${qUniqueId}', '${type}')"><i class="fas fa-plus"></i> إضافة فقرة</button>`;
        const items = data?.paragraphs || [];
        if (items.length > 0) items.forEach(item => addParagraphInput(qUniqueId, type, item));
        else addParagraphInput(qUniqueId, type);
    } else {
        let html = `<div class="form-group mb-3"><label class="q-label">نص السؤال</label><input type="text" class="form-control q-text" value="${data?.text || ''}"></div>`;
        if (type === 'mcq' || type === 'mcq-media') {
            if (type === 'mcq-media') html += `<div class="form-group mb-3"><label class="q-label"><i class="fas fa-paperclip"></i> مرفق</label><input type="file" class="form-control-file q-attachment"><input type="hidden" class="q-existing-attachment" value="${data?.attachment || ''}"></div>`;
            html += `<label class="q-label">الخيارات</label><div class="choices-container" id="choices-${qUniqueId}">`;
            const choices = data?.choices || ['خيار 1', 'خيار 2'];
            const correct = (data && data.correctAnswer !== undefined) ? parseInt(data.correctAnswer) : 0; 
            choices.forEach((c, i) => { html += `<div class="choice-row" style="display:flex; gap:10px; margin-bottom:5px;"><input type="radio" name="correct-${qUniqueId}" value="${i}" ${i === correct ? 'checked' : ''}><input type="text" class="form-control q-choice" value="${c}"><button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button></div>`; });
            html += `</div><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addChoiceInput('${qUniqueId}')">+ إضافة خيار</button>`;
        } else {
            html += `<div class="form-group mt-2"><label class="q-label">الإجابة النموذجية (اختياري)</label><textarea class="form-control q-model-answer">${data?.modelAnswer || ''}</textarea></div>`;
        }
        area.innerHTML = html;
    }
}

function addChoiceInput(qUniqueId) { 
    const container = document.getElementById(`choices-${qUniqueId}`); 
    const count = container.children.length; 
    container.insertAdjacentHTML('beforeend', `<div class="choice-row" style="display:flex; gap:10px; margin-bottom:5px;"><input type="radio" name="correct-${qUniqueId}" value="${count}"><input type="text" class="form-control q-choice" placeholder="خيار جديد"><button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button></div>`); 
}

function addParagraphInput(qUniqueId, type, itemData = null) {
    const container = document.getElementById(`paragraphs-container-${qUniqueId}`);
    const pIdx = Date.now(); 
    let innerHtml = '';

    if (type === 'drag-drop') {
        innerHtml = `<label class="q-label text-primary">الجملة:</label><div class="input-group mb-2"><input type="text" class="form-control p-text" id="drag-source-${qUniqueId}-${pIdx}" value="${itemData?.text || ''}"><div class="input-group-append"><button class="btn btn-warning" type="button" onclick="initDragHighlighter('${qUniqueId}', '${pIdx}')">تجهيز الفراغات</button></div></div><div id="highlighter-area-${qUniqueId}-${pIdx}" class="highlight-area" style="display:none; background:#fff; padding:10px; border:1px solid #ddd;"></div><input type="hidden" class="p-gaps-data" id="gaps-data-${qUniqueId}-${pIdx}" value='${itemData?.gaps ? JSON.stringify(itemData.gaps) : ''}'>`;
        if (itemData?.text && itemData?.gaps) setTimeout(() => initDragHighlighter(qUniqueId, pIdx, itemData.gaps), 100);
    } else if (type.includes('reading')) {
        innerHtml = `<label class="q-label">الفقرة</label><textarea class="form-control p-text">${itemData?.text || ''}</textarea>`;
    } else if (type.includes('spelling')) {
        innerHtml = `<label class="q-label">الكلمة</label><input type="text" class="form-control p-text" value="${itemData?.text || ''}">`;
    } else if (type === 'missing-char') {
        innerHtml = `<div class="row" style="display:flex; gap:10px;"><div style="flex:1"><input type="text" class="form-control p-text" value="${itemData?.text || ''}" placeholder="الكلمة كاملة"></div><div style="flex:1"><input type="text" class="form-control p-missing" value="${itemData?.missing || ''}" placeholder="الناقص"></div></div>`;
    }

    container.insertAdjacentHTML('beforeend', `<div class="paragraph-item" style="position:relative; background:#fff; border:1px solid #eee; padding:15px; border-radius:8px; margin-bottom:15px;">${innerHtml}<button type="button" onclick="this.parentElement.remove()" style="position:absolute; top:5px; left:5px; background:none; border:none; color:#dc3545;">✖</button></div>`);
}

function initDragHighlighter(qUniqueId, pIdx, savedGaps = null) {
    const sourceInput = document.getElementById(`drag-source-${qUniqueId}-${pIdx}`);
    const area = document.getElementById(`highlighter-area-${qUniqueId}-${pIdx}`);
    const text = sourceInput.value.trim();
    if(!text) return alert('اكتب الجملة أولاً');
    area.style.display = 'block';
    area.innerHTML = `<p id="sel-text-${qUniqueId}-${pIdx}" style="font-size:1.3rem;">${text}</p><button type="button" class="btn btn-warning btn-sm" onclick="markGap('${qUniqueId}', '${pIdx}')">تحويل المحدد لفراغ</button> <button type="button" class="btn btn-secondary btn-sm" onclick="resetGap('${qUniqueId}', '${pIdx}')">إعادة تعيين</button><div id="gap-prev-${qUniqueId}-${pIdx}" class="mt-2"></div>`;
    if(savedGaps) document.getElementById(`gap-prev-${qUniqueId}-${pIdx}`).innerHTML = savedGaps.map(g => `<span class="badge badge-warning m-1">${g.dragItem}</span>`).join(' ');
}

function markGap(qUniqueId, pIdx) {
    const selection = window.getSelection(); const selectedText = selection.toString();
    if (!selectedText) return alert('حدد النص أولاً');
    let processed = selectedText;
    if (selectedText.length === 1 && /[جحخعغفقثصضشسيبلتنمكطظ]/.test(selectedText)) processed = 'ـ' + selectedText + 'ـ';
    document.getElementById(`gap-prev-${qUniqueId}-${pIdx}`).innerHTML += `<span class="badge badge-warning m-1">${processed}</span>`;
    const hiddenInput = document.getElementById(`gaps-data-${qUniqueId}-${pIdx}`);
    let data = hiddenInput.value ? JSON.parse(hiddenInput.value) : [];
    data.push({ original: selectedText, dragItem: processed });
    hiddenInput.value = JSON.stringify(data);
    selection.removeAllRanges();
}

function resetGap(qUniqueId, pIdx) { document.getElementById(`gap-prev-${qUniqueId}-${pIdx}`).innerHTML = ''; document.getElementById(`gaps-data-${qUniqueId}-${pIdx}`).value = ''; }

function readFileAsBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error); reader.readAsDataURL(file); }); }

async function collectQuestionsFromContainer(id) {
    const cards = document.querySelectorAll(`#${id} .question-card`);
    const qs = [];
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const type = card.querySelector('select').value;
        const maxScoreVal = parseFloat(card.querySelector('.max-score').value) || 1;
        const criterionVal = parseFloat(card.querySelector('.passing-criterion')?.value || 80);
        
        const qData = { id: Date.now() + Math.random(), type: type, maxScore: maxScoreVal, passingScore: maxScoreVal, passingCriterion: criterionVal };
        
        if (type === 'mcq' || type === 'mcq-media' || type === 'open-ended') {
            qData.text = card.querySelector('.q-text')?.value || '';
            if (type.includes('mcq')) {
                qData.choices = Array.from(card.querySelectorAll('.q-choice')).map(c => c.value);
                card.querySelectorAll('input[type="radio"]').forEach((r, idx) => { if(r.checked) qData.correctAnswer = idx; });
                const fileInput = card.querySelector('.q-attachment'); const existingFile = card.querySelector('.q-existing-attachment')?.value;
                if (fileInput && fileInput.files[0]) qData.attachment = await readFileAsBase64(fileInput.files[0]); else if (existingFile) qData.attachment = existingFile;
            } else { qData.modelAnswer = card.querySelector('.q-model-answer').value; }
        } else {
            qData.text = card.querySelector('.q-text')?.value || ''; qData.paragraphs = [];
            card.querySelectorAll('.paragraph-item').forEach(pItem => {
                const pData = { id: Date.now() + Math.random() };
                if (type === 'drag-drop') {
                    pData.text = pItem.querySelector('.p-text').value;
                    pData.gaps = JSON.parse(pItem.querySelector('.p-gaps-data').value || '[]');
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

// =========================================================
// 💾 حفظ المحتوى في Supabase
// =========================================================

async function saveTest() { 
    const title = document.getElementById('testTitle').value; if(!title) return; 
    const qs = await collectQuestionsFromContainer('questionsContainer'); if (!qs) return; 
    
    const id = document.getElementById('editTestId').value; 
    const data = {
        teacherId: getCurrentUser().id, 
        title: title, 
        subject: document.getElementById('testSubject').value, 
        description: document.getElementById('testDescription').value, 
        questions: qs
    }; 
    
    try {
        if(id) {
            await supa.from('tests').update(data).eq('id', id);
        } else {
            data.id = Date.now();
            await supa.from('tests').insert([data]);
        }
        closeModal('createTestModal'); 
        loadTests(); 
        showSuccess('تم الحفظ بنجاح');
    } catch(e) { showError('خطأ في الحفظ'); console.error(e); }
}

async function saveHomework() { 
    const id = document.getElementById('editHomeworkId').value; 
    const title = document.getElementById('homeworkTitle').value; if(!title) return; 
    const qs = await collectQuestionsFromContainer('homeworkQuestionsContainer'); if (!qs) return; 
    
    const data = {
        teacherId: getCurrentUser().id, 
        title: title, 
        subject: document.getElementById('homeworkSubject').value, 
        description: document.getElementById('homeworkDescription').value, 
        questions: qs
    }; 
    
    try {
        if(id) {
            await supa.from('assignments').update(data).eq('id', id);
        } else {
            data.id = Date.now();
            await supa.from('assignments').insert([data]);
        }
        closeModal('createHomeworkModal'); 
        loadHomeworks(); 
        showSuccess('تم الحفظ بنجاح');
    } catch(e) { showError('خطأ في الحفظ'); }
}

async function saveLesson() { 
    const id = document.getElementById('editLessonId').value; 
    const title = document.getElementById('lessonTitle').value; if(!title) return; 
    const intro = {type: document.getElementById('introType').value, url: document.getElementById('introUrl').value, text: document.getElementById('introText').value}; 
    const exQs = await collectQuestionsFromContainer('exercisesContainer'); if (!exQs) return; 
    const asQs = await collectQuestionsFromContainer('assessmentContainer'); if (!asQs) return; 
    
    const data = {
        teacherId: getCurrentUser().id, 
        title: title, 
        subject: document.getElementById('lessonSubject').value, 
        intro: intro, 
        exercises: {passScore: document.getElementById('exercisesPassScore').value, questions: exQs}, 
        assessment: {questions: asQs}
    }; 
    
    try {
        if(id) {
            await supa.from('lessons').update(data).eq('id', id);
        } else {
            data.id = Date.now();
            await supa.from('lessons').insert([data]);
        }
        closeModal('createLessonModal'); 
        loadLessons(); 
        showSuccess('تم الحفظ بنجاح');
    } catch(e) { showError('خطأ في الحفظ'); }
}

async function saveObjective() { 
    const id = document.getElementById('editObjectiveId').value; 
    const subject = document.getElementById('objSubject').value; 
    const stg = document.getElementById('shortTermGoal').value; if(!stg) return; 
    
    const ig = []; document.querySelectorAll('.instructional-goal-input').forEach(i=>{if(i.value.trim())ig.push(i.value.trim())}); 
    
    const data = {
        teacherId: getCurrentUser().id, 
        subject: subject, 
        shortTermGoal: stg, 
        instructionalGoals: ig
    }; 
    
    try {
        if(id) {
            await supa.from('objectives').update(data).eq('id', id);
        } else {
            data.id = Date.now();
            await supa.from('objectives').insert([data]);
        }
        closeModal('createObjectiveModal'); 
        loadObjectives(); 
        showSuccess('تم الحفظ بنجاح');
    } catch(e) { showError('خطأ في الحفظ'); }
}

// =========================================================
// 🗑️ التعديل والحذف
// =========================================================

async function editTest(id) { 
    const { data: t } = await supa.from('tests').select('*').eq('id', id).single();
    if(!t) return; 
    document.getElementById('editTestId').value=t.id; 
    document.getElementById('testTitle').value=t.title; 
    document.getElementById('testSubject').value=t.subject; 
    document.getElementById('testDescription').value=t.description; 
    const c=document.getElementById('questionsContainer'); c.innerHTML=''; 
    (t.questions||[]).forEach(q=>addQuestionToContainer(c,'سؤال',q)); 
    document.getElementById('createTestModal').classList.add('show'); 
}

function deleteTest(id) { 
    showConfirmModal('هل أنت متأكد من الحذف؟', async function() { 
        await supa.from('tests').delete().eq('id', id); 
        loadTests(); showSuccess('تم الحذف'); 
    }); 
}

async function editHomework(id) { 
    const { data: h } = await supa.from('assignments').select('*').eq('id', id).single();
    if(!h) return; 
    document.getElementById('editHomeworkId').value=h.id; 
    document.getElementById('homeworkTitle').value=h.title; 
    document.getElementById('homeworkSubject').value=h.subject; 
    document.getElementById('homeworkDescription').value=h.description; 
    const c=document.getElementById('homeworkQuestionsContainer'); c.innerHTML=''; 
    (h.questions||[]).forEach(q=>addQuestionToContainer(c,'سؤال',q)); 
    document.getElementById('createHomeworkModal').classList.add('show'); 
}

function deleteHomework(id) { 
    showConfirmModal('هل أنت متأكد من الحذف؟', async function() { 
        await supa.from('assignments').delete().eq('id', id); 
        loadHomeworks(); showSuccess('تم الحذف'); 
    }); 
}

async function editLesson(id) { 
    const { data: l } = await supa.from('lessons').select('*').eq('id', id).single();
    if(!l) return; 
    document.getElementById('editLessonId').value=l.id; 
    document.getElementById('lessonTitle').value=l.title; 
    document.getElementById('lessonSubject').value=l.subject; 
    if(l.intro){document.getElementById('introType').value=l.intro.type; document.getElementById('introUrl').value=l.intro.url; document.getElementById('introText').value=l.intro.text; toggleIntroInputs();} 
    document.getElementById('exercisesPassScore').value=l.exercises?.passScore||80; 
    const ec=document.getElementById('exercisesContainer'); ec.innerHTML=''; (l.exercises?.questions||[]).forEach(q=>addQuestionToContainer(ec,'سؤال',q)); 
    const ac=document.getElementById('assessmentContainer'); ac.innerHTML=''; (l.assessment?.questions||[]).forEach(q=>addQuestionToContainer(ac,'سؤال',q)); 
    switchLessonStep('intro'); document.getElementById('createLessonModal').classList.add('show'); 
}

function deleteLesson(id) { 
    showConfirmModal('هل أنت متأكد من الحذف؟', async function() { 
        await supa.from('lessons').delete().eq('id', id); 
        loadLessons(); showSuccess('تم الحذف'); 
    }); 
}

async function editObjective(id) { 
    const { data: o } = await supa.from('objectives').select('*').eq('id', id).single();
    if(!o) return; 
    document.getElementById('editObjectiveId').value=o.id; 
    document.getElementById('objSubject').value=o.subject; 
    document.getElementById('shortTermGoal').value=o.shortTermGoal; 
    const c=document.getElementById('instructionalGoalsContainer'); c.innerHTML=''; 
    if(o.instructionalGoals?.length>0)o.instructionalGoals.forEach(g=>addInstructionalGoalInput(g)); else addInstructionalGoalInput(); 
    document.getElementById('createObjectiveModal').classList.add('show'); 
}

function deleteObjective(id) { 
    showConfirmModal('هل أنت متأكد من الحذف؟', async function() { 
        await supa.from('objectives').delete().eq('id', id); 
        loadObjectives(); showSuccess('تم الحذف'); 
    }); 
}

// =========================================================
// 🔗 ربط المحتوى بالأهداف
// =========================================================

async function showLinkModal(type, id) {
    document.getElementById('linkTargetId').value = id; 
    document.getElementById('linkTargetType').value = type;
    const container = document.getElementById('linkContentBody'); 
    const instruction = document.getElementById('linkInstructionText'); 
    container.innerHTML = '';
    
    // جلب الأهداف الخاصة بالمعلم
    const { data: objectives } = await supa.from('objectives').select('*').eq('teacherId', getCurrentUser().id);
    
    if(!objectives || objectives.length === 0) { container.innerHTML = '<div class="text-center text-danger p-3">لا توجد أهداف مضافة. الرجاء إضافة أهداف أولاً.</div>'; document.getElementById('linkContentModal').classList.add('show'); return; }
    
    if (type === 'test') {
        instruction.textContent = 'قم بربط كل سؤال بالهدف قصير المدى الذي يقيسه.';
        const { data: test } = await supa.from('tests').select('*').eq('id', id).single();
        if(!test || !test.questions) return;
        
        const relevantObjs = objectives.filter(o => o.subject === test.subject);
        let optionsHtml = '<option value="">-- اختر الهدف --</option>'; 
        relevantObjs.forEach(o => { optionsHtml += `<option value="${o.id}">${o.shortTermGoal}</option>`; });
        
        test.questions.forEach((q, idx) => { 
            const row = document.createElement('div'); row.className = 'linking-row mb-2 d-flex align-items-center gap-2'; 
            row.innerHTML = `<div style="flex:1;"><strong>س${idx+1}:</strong> ${q.text || 'سؤال'}</div><select class="form-control question-link-select" style="flex:1;" data-question-id="${q.id}">${optionsHtml}</select>`; 
            if(q.linkedGoalId) row.querySelector('select').value = q.linkedGoalId; 
            container.appendChild(row); 
        });
    } else {
        instruction.textContent = 'قم باختيار هدف تدريسي واحد لربط هذا المحتوى به.';
        const table = type === 'lesson' ? 'lessons' : 'assignments';
        const { data: currentItem } = await supa.from(table).select('*').eq('id', id).single();
        if (!currentItem) return;
        
        const relevantObjs = objectives.filter(o => o.subject === currentItem.subject);
        let selectHtml = '<select class="form-control" id="singleInstructionalLink"><option value="">-- غير مرتبط --</option>';
        relevantObjs.forEach(o => { 
            if(o.instructionalGoals && o.instructionalGoals.length > 0) { 
                selectHtml += `<optgroup label="${o.shortTermGoal}">`; 
                o.instructionalGoals.forEach(ig => { selectHtml += `<option value="${ig}">${ig}</option>`; }); 
                selectHtml += `</optgroup>`; 
            } 
        }); 
        selectHtml += '</select>';
        
        container.innerHTML = `<div class="p-3"><label>الهدف التدريسي:</label>${selectHtml}</div>`;
        if(currentItem.linkedInstructionalGoal) { setTimeout(() => { document.getElementById('singleInstructionalLink').value = currentItem.linkedInstructionalGoal; }, 100); }
    }
    document.getElementById('linkContentModal').classList.add('show');
}

async function saveContentLinks() {
    const id = parseInt(document.getElementById('linkTargetId').value); 
    const type = document.getElementById('linkTargetType').value;
    
    try {
        if (type === 'test') {
            const { data: test } = await supa.from('tests').select('*').eq('id', id).single();
            if(test) { 
                const selects = document.querySelectorAll('.question-link-select'); 
                selects.forEach(sel => { 
                    const qId = parseFloat(sel.getAttribute('data-question-id')); 
                    const goalId = sel.value; 
                    const q = test.questions.find(qx => qx.id === qId || Math.abs(qx.id - qId) < 0.0001); 
                    if(q) q.linkedGoalId = goalId ? parseInt(goalId) : null; 
                }); 
                await supa.from('tests').update({ questions: test.questions }).eq('id', id);
                loadTests(); 
            }
        } else {
            const table = type === 'lesson' ? 'lessons' : 'assignments'; 
            const linkedGoal = document.getElementById('singleInstructionalLink').value || null;
            await supa.from(table).update({ linkedInstructionalGoal: linkedGoal }).eq('id', id);
            
            if(type === 'lesson') loadLessons(); else loadHomeworks(); 
        }
        closeModal('linkContentModal'); showSuccess('تم حفظ الارتباطات بنجاح');
    } catch(e) { showError('حدث خطأ أثناء الحفظ'); }
}

// =========================================================
// 🪟 واجهة المستخدم (UI Helpers)
// =========================================================
function showCreateTestModal() { document.getElementById('editTestId').value=''; document.getElementById('testTitle').value=''; document.getElementById('testSubject').value='لغتي'; document.getElementById('testDescription').value=''; document.getElementById('questionsContainer').innerHTML=''; addQuestion(); document.getElementById('createTestModal').classList.add('show'); }
function showCreateHomeworkModal() { document.getElementById('editHomeworkId').value=''; document.getElementById('homeworkTitle').value=''; document.getElementById('homeworkDescription').value=''; document.getElementById('homeworkQuestionsContainer').innerHTML=''; addHomeworkQuestion(); document.getElementById('createHomeworkModal').classList.add('show'); }
function showCreateLessonModal() { document.getElementById('editLessonId').value=''; document.getElementById('lessonTitle').value=''; document.getElementById('introUrl').value=''; document.getElementById('introText').value=''; document.getElementById('exercisesContainer').innerHTML=''; document.getElementById('assessmentContainer').innerHTML=''; addLessonQuestion('exercisesContainer'); addLessonQuestion('assessmentContainer'); switchLessonStep('intro'); document.getElementById('createLessonModal').classList.add('show'); }
function showCreateObjectiveModal() { document.getElementById('editObjectiveId').value=''; document.getElementById('shortTermGoal').value=''; document.getElementById('instructionalGoalsContainer').innerHTML=''; addInstructionalGoalInput(); document.getElementById('createObjectiveModal').classList.add('show'); }
function addInstructionalGoalInput(v='') { const c=document.getElementById('instructionalGoalsContainer'); const d=document.createElement('div'); d.className='d-flex mb-2'; d.innerHTML=`<input type="text" class="form-control instructional-goal-input" value="${v}" placeholder="هدف تدريسي فرعي" style="flex:1;"><button type="button" class="btn btn-outline-danger btn-sm ml-2" onclick="this.parentElement.remove()">×</button>`; c.appendChild(d); }
function toggleIntroInputs() { const t=document.getElementById('introType').value; const u=document.getElementById('introUrl'); u.placeholder=t==='video'?'رابط يوتيوب':(t==='image'?'رابط الصورة':'رابط'); }

// 📥 التصدير
async function executeExport() {
    // جلب جميع البيانات من Supabase
    const user = getCurrentUser();
    const { data: tests } = await supa.from('tests').select('*').eq('teacherId', user.id);
    const { data: lessons } = await supa.from('lessons').select('*').eq('teacherId', user.id);
    const { data: objectives } = await supa.from('objectives').select('*').eq('teacherId', user.id);
    const { data: assignments } = await supa.from('assignments').select('*').eq('teacherId', user.id);

    const selected = {
        tests: tests || [],
        lessons: lessons || [],
        objectives: objectives || [],
        assignments: assignments || [],
        exportDate: new Date().toISOString(),
        exportedBy: user.name
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selected));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "muyasir_content_backup_" + new Date().toISOString().split('T')[0] + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    closeModal('exportContentModal');
    showSuccess(`تم تصدير مكتبة المحتوى بنجاح 📥`);
}

function showExportModal() { document.getElementById('exportContentModal').classList.add('show'); }
function toggleGlobalSelect(source) { document.querySelectorAll('.export-item').forEach(cb => cb.checked = source.checked); }

window.showExportModal = showExportModal;
window.executeExport = executeExport;
window.toggleGlobalSelect = toggleGlobalSelect;

window.showCreateTestModal = showCreateTestModal;
window.editTest = editTest;
window.deleteTest = deleteTest;
window.saveTest = saveTest;

window.showCreateHomeworkModal = showCreateHomeworkModal;
window.editHomework = editHomework;
window.deleteHomework = deleteHomework;
window.saveHomework = saveHomework;

window.showCreateLessonModal = showCreateLessonModal;
window.editLesson = editLesson;
window.deleteLesson = deleteLesson;
window.saveLesson = saveLesson;
window.toggleIntroInputs = toggleIntroInputs;
window.switchLessonStep = function(step) {
    document.querySelectorAll('.step-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.step-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${step}`).classList.add('active');
    document.getElementById(`step-${step}`).classList.add('active');
};

window.showCreateObjectiveModal = showCreateObjectiveModal;
window.editObjective = editObjective;
window.deleteObjective = deleteObjective;
window.saveObjective = saveObjective;
window.addInstructionalGoalInput = addInstructionalGoalInput;

window.showLinkModal = showLinkModal;
window.saveContentLinks = saveContentLinks;
window.closeModal = function(id) { document.getElementById(id).classList.remove('show'); };
window.addQuestion = addQuestion;
window.addLessonQuestion = addLessonQuestion;
window.addHomeworkQuestion = addHomeworkQuestion;

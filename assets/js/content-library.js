// ============================================
// 📁 المسار: assets/js/content-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('testsGrid') || document.getElementById('lessonsGrid')) {
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    try { loadTests(); } catch(e) { console.error(e); }
    try { loadLessons(); } catch(e) { console.error(e); }
    try { loadObjectives(); } catch(e) { console.error(e); }
    try { loadHomeworks(); } catch(e) { console.error(e); }
}

// ==========================================
// 1. دوال العرض (البطاقات الملونة)
// ==========================================

// الاختبارات (أزرق)
function loadTests() {
    const grid = document.getElementById('testsGrid'); if(!grid) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === getCurrentUser().id);
    if(tests.length === 0) { grid.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:20px; color:#777;">لا توجد اختبارات تشخيصية</div>'; return; }
    
    grid.innerHTML = tests.map(t => {
        const isLinked = t.questions && t.questions.some(q => q.linkedGoalId);
        return `
        <div class="content-card card-test">
            <div class="content-header">
                <h4 title="${t.title}">${t.title}</h4>
                <span class="content-badge subject-${t.subject}">${t.subject}</span>
            </div>
            <div class="content-body">
                <p class="text-muted small" style="margin-bottom:10px;">${t.description || 'لا يوجد وصف'}</p>
                <div class="content-meta">
                    <span><i class="fas fa-question-circle"></i> ${t.questions?.length || 0} أسئلة</span>
                    ${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بأهداف</span>' : ''}
                </div>
            </div>
            <div class="content-footer">
                <button class="btn-card-action btn-test-light" onclick="showLinkModal('test', ${t.id})"><i class="fas fa-link"></i> ربط</button>
                <button class="btn-card-action btn-test-light" onclick="editTest(${t.id})"><i class="fas fa-pen"></i> تعديل</button>
                <button class="btn-card-action btn-delete-card" onclick="deleteTest(${t.id})"><i class="fas fa-trash"></i> حذف</button>
            </div>
        </div>`;
    }).join('');
}

// الدروس (أخضر)
function loadLessons() {
    const grid = document.getElementById('lessonsGrid'); if(!grid) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === getCurrentUser().id);
    if (lessons.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد دروس تفاعلية</h3></div>`; return; }
    
    grid.innerHTML = lessons.map(l => {
        const isLinked = !!l.linkedInstructionalGoal;
        return `
        <div class="content-card card-lesson">
            <div class="content-header">
                <h4 title="${l.title}">${l.title}</h4>
                <span class="content-badge subject-${l.subject}">${l.subject}</span>
            </div>
            <div class="content-body">
                <div class="small text-muted" style="margin-bottom:10px;">تمهيد، تمارين (${l.exercises?.questions?.length || 0})، تقييم (${l.assessment?.questions?.length || 0})</div>
                <div class="content-meta">
                    ${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف تدريسي</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}
                </div>
            </div>
            <div class="content-footer">
                <button class="btn-card-action btn-lesson-light" onclick="showLinkModal('lesson', ${l.id})"><i class="fas fa-link"></i> ربط</button>
                <button class="btn-card-action btn-lesson-light" onclick="editLesson(${l.id})"><i class="fas fa-pen"></i> تعديل</button>
                <button class="btn-card-action btn-delete-card" onclick="deleteLesson(${l.id})"><i class="fas fa-trash"></i> حذف</button>
            </div>
        </div>`;
    }).join('');
}

// الأهداف (Accordion)
function loadObjectives() {
    const list = document.getElementById('objectivesList'); if (!list) return;
    const objs = JSON.parse(localStorage.getItem('objectives') || '[]').filter(o => o.teacherId === getCurrentUser().id);
    if (objs.length === 0) { list.innerHTML = `<div class="empty-content-state" style="text-align:center;padding:20px;"><h3>لا توجد أهداف</h3><button class="btn btn-success mt-2" onclick="showCreateObjectiveModal()">+ هدف جديد</button></div>`; return; }
    
    list.innerHTML = objs.map(o => `
        <div class="objective-row" id="obj-row-${o.id}">
            <div class="obj-header" onclick="toggleObjective(${o.id})">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-chevron-down toggle-icon" id="icon-${o.id}"></i>
                    <h4 class="short-term-title">${o.shortTermGoal}</h4>
                    <span class="content-badge subject-${o.subject}" style="font-size:0.8rem; padding:2px 8px;">${o.subject}</span>
                </div>
                <div class="obj-actions" onclick="event.stopPropagation()">
                    <button class="btn-card-action btn-lesson-light" onclick="editObjective(${o.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="btn-card-action btn-delete-card" onclick="deleteObjective(${o.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="obj-body" id="obj-body-${o.id}">
                ${o.instructionalGoals && o.instructionalGoals.length > 0 ? `<div style="font-weight:bold; margin-bottom:5px; color:#555;">الأهداف التدريسية:</div><ul class="instructional-goals-list">${o.instructionalGoals.map(g => `<li>${g}</li>`).join('')}</ul>` : '<span class="text-muted small">لا توجد أهداف فرعية</span>'}
            </div>
        </div>`).join('');
}

function toggleObjective(id) {
    const body = document.getElementById(`obj-body-${id}`);
    const row = document.getElementById(`obj-row-${id}`);
    if (body.classList.contains('show')) {
        body.classList.remove('show');
        row.classList.remove('expanded');
    } else {
        body.classList.add('show');
        row.classList.add('expanded');
    }
}

// الواجبات (برتقالي)
function loadHomeworks() {
    const grid = document.getElementById('homeworksGrid'); if (!grid) return;
    const homeworks = JSON.parse(localStorage.getItem('assignments') || '[]').filter(h => h.teacherId === getCurrentUser().id);
    if (homeworks.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد واجبات</h3><button class="btn btn-success mt-2" onclick="showCreateHomeworkModal()">+ واجب جديد</button></div>`; return; }
    
    grid.innerHTML = homeworks.map(h => {
        const isLinked = !!h.linkedInstructionalGoal;
        return `
        <div class="content-card card-homework">
            <div class="content-header">
                <h4 title="${h.title}">${h.title}</h4>
                <span class="content-badge subject-${h.subject}">${h.subject}</span>
            </div>
            <div class="content-body">
                <p class="text-muted small" style="margin-bottom:10px;">${h.description || 'لا يوجد وصف'}</p>
                <div class="content-meta">
                    <span><i class="fas fa-list-ol"></i> ${h.questions?.length || 0} أسئلة</span>
                    ${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف</span>' : ''}
                </div>
            </div>
            <div class="content-footer">
                <button class="btn-card-action btn-homework-light" onclick="showLinkModal('homework', ${h.id})"><i class="fas fa-link"></i> ربط</button>
                <button class="btn-card-action btn-homework-light" onclick="editHomework(${h.id})"><i class="fas fa-pen"></i> تعديل</button>
                <button class="btn-card-action btn-delete-card" onclick="deleteHomework(${h.id})"><i class="fas fa-trash"></i> حذف</button>
            </div>
        </div>`;
    }).join('');
}

// ==========================================
// 🏗️ محرك بناء الأسئلة الجديد (Question Builder Engine)
// ==========================================

function addQuestion() { addQuestionToContainer(document.getElementById('questionsContainer'), 'سؤال'); }
function addLessonQuestion(id) { addQuestionToContainer(document.getElementById(id), 'سؤال'); }
function addHomeworkQuestion() { addQuestionToContainer(document.getElementById('homeworkQuestionsContainer'), 'سؤال'); }

function addQuestionToContainer(container, lbl, data = null) {
    const idx = container.children.length;
    const type = data ? data.type : 'mcq';
    const score = data ? data.passingScore : 1;

    let stripeClass = 'mcq';
    if(type.includes('drag')) stripeClass = 'drag';
    else if(type.includes('ai')) stripeClass = 'ai';
    else if(type.includes('manual')) stripeClass = 'manual';

    const cardHtml = `
    <div class="question-card" id="q-card-${idx}">
        <div class="q-stripe ${stripeClass}"></div>
        <div class="q-header">
            <div class="q-title">
                <span class="badge badge-secondary">${idx + 1}</span>
                <select class="form-control form-control-sm" style="width:200px;" onchange="renderQuestionInputs(this, ${idx})">
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
            <div class="q-actions">
                <div style="display:inline-block; margin-left:10px;">
                    <label style="font-size:0.8rem;">الدرجة:</label>
                    <input type="number" class="passing-score" value="${score}" style="width:50px; border:1px solid #ccc; border-radius:4px; text-align:center;">
                </div>
                <button onclick="this.closest('.question-card').remove()" title="حذف السؤال"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="q-body question-inputs-area"></div>
    </div>`;

    container.insertAdjacentHTML('beforeend', cardHtml);
    const selectElem = container.lastElementChild.querySelector('select');
    renderQuestionInputs(selectElem, idx, data);
}

function renderQuestionInputs(selectElem, idx, data = null) {
    const type = selectElem.value;
    const card = selectElem.closest('.question-card');
    const area = card.querySelector('.question-inputs-area');
    const stripe = card.querySelector('.q-stripe');
    
    stripe.className = 'q-stripe';
    if(type.includes('drag')) stripe.classList.add('drag');
    else if(type.includes('ai')) stripe.classList.add('ai');
    else if(type.includes('manual')) stripe.classList.add('manual');
    else stripe.classList.add('mcq');

    const txt = data ? data.text : '';
    let html = '';

    if (type === 'mcq' || type === 'mcq-media') {
        html += `<div class="form-group mb-3"><label class="q-label">نص السؤال</label><input type="text" class="form-control q-text" value="${txt}" placeholder="اكتب السؤال هنا..."></div>`;
        if (type === 'mcq-media') {
            html += `<div class="form-group mb-3 p-2 bg-light border rounded"><label class="q-label"><i class="fas fa-paperclip"></i> مرفق (صورة/فيديو/صوت)</label><input type="file" class="form-control-file q-attachment">${data?.attachment ? `<div class="attachment-preview">ملف حالي: ${data.attachment}</div>` : ''}</div>`;
        }
        html += `<label class="q-label">الخيارات (حدد الإجابة الصحيحة)</label><div class="choices-container" id="choices-${idx}">`;
        const choices = data?.choices || ['خيار 1', 'خيار 2'];
        const correct = data?.correctAnswer || 0;
        choices.forEach((c, i) => {
            html += `<div class="choice-row"><input type="radio" name="correct-${idx}" value="${i}" ${i == correct ? 'checked' : ''}><input type="text" class="form-control q-choice" value="${c}" placeholder="الخيار ${i+1}"><button class="btn-remove-choice" onclick="this.parentElement.remove()">×</button></div>`;
        });
        html += `</div><button class="btn btn-sm btn-outline-primary mt-2" onclick="addChoiceInput(${idx})">+ إضافة خيار</button>`;
    
    } else if (type === 'drag-drop') {
        html += `<div class="alert alert-info small"><i class="fas fa-info-circle"></i> اكتب الجملة كاملة، ثم حدد الكلمات أو الحروف التي تريد تحويلها لفراغات واضغط "تحويل لفراغ".</div>
                 <div class="form-group"><label class="q-label">الجملة الأصلية</label><div class="input-group mb-2"><input type="text" class="form-control q-source-text" id="drag-source-${idx}" value="${txt}" placeholder="مثال: ذهب محمد إلى المدرسة"><div class="input-group-append"><button class="btn btn-warning" type="button" onclick="initDragHighlighter(${idx})">تجهيز الفراغات</button></div></div></div>
                 <div id="highlighter-area-${idx}" class="highlight-area" style="display:none;"></div><input type="hidden" class="q-gaps-data" id="gaps-data-${idx}">`;
    
    } else if (type === 'open-ended') {
        html += `<div class="form-group"><label class="q-label">السؤال</label><textarea class="form-control q-text" rows="2">${txt}</textarea></div><div class="form-group mt-2"><label class="q-label">الإجابة النموذجية (اختياري)</label><textarea class="form-control q-model-answer" rows="2">${data?.modelAnswer || ''}</textarea></div>`;
    
    } else if (type === 'ai-reading') {
        html += `<div class="form-group"><label class="q-label">النص المراد قراءته</label><textarea class="form-control q-reading-text" rows="3">${data?.readingText || ''}</textarea></div><div class="text-muted small mt-2"><i class="fas fa-robot"></i> سيقوم النظام بتسجيل

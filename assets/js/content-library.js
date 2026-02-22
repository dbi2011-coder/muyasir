// ============================================
// 📁 المسار: assets/js/content-library.js
// الوصف: مكتبة المحتوى + إصلاح واجهة السحب والإفلات (إضافة فقرات متعددة) + الشرط التربوي
// ============================================

// 🔥 إضافة دالة الخطأ الاحترافية (إذا لم تكن موجودة) 🔥
if (!window.showError) {
    window.showError = function(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            const toastHtml = `
                <div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:15px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px; max-width:90%; text-align:center;">
                    <i class="fas fa-exclamation-triangle" style="font-size:1.5rem;"></i> <span>${message}</span>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            toast = document.getElementById('globalErrorToast');
        }
        toast.querySelector('span').innerHTML = message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 5000);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    injectLinkContentModal(); 
    loadContentLibrary();
});

function loadContentLibrary() {
    try { loadTests(); } catch(e) { console.error(e); }
    try { loadLessons(); } catch(e) { console.error(e); }
    try { loadObjectives(); } catch(e) { console.error(e); }
    try { loadHomeworks(); } catch(e) { console.error(e); }
}

// ---------------------------------------------------------
// دوال العرض (Tests, Lessons, Objectives, Homeworks)
// ---------------------------------------------------------

function loadTests() {
    const grid = document.getElementById('testsGrid'); if(!grid) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === getCurrentUser().id);
    if(tests.length === 0) { grid.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:20px; color:#777;">لا توجد اختبارات تشخيصية</div>'; return; }
    grid.innerHTML = tests.map(t => {
        const isLinked = t.questions && t.questions.some(q => q.linkedGoalId);
        return `<div class="content-card card-test"><div class="content-header"><h4 title="${t.title}">${t.title}</h4><span class="content-badge subject-${t.subject}">${t.subject}</span></div><div class="content-body"><p class="text-muted small" style="margin-bottom:10px;">${t.description || 'لا يوجد وصف'}</p><div class="content-meta"><span><i class="fas fa-question-circle"></i> ${t.questions?.length || 0} أسئلة</span>${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بأهداف</span>' : ''}</div></div><div class="content-footer"><button class="btn-card-action btn-test-light" onclick="showLinkModal('test', ${t.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-test-light" onclick="editTest(${t.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteTest(${t.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

function loadLessons() {
    const grid = document.getElementById('lessonsGrid'); if(!grid) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === getCurrentUser().id);
    if (lessons.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد دروس تفاعلية</h3></div>`; return; }
    grid.innerHTML = lessons.map(l => {
        const isLinked = !!l.linkedInstructionalGoal;
        return `<div class="content-card card-lesson"><div class="content-header"><h4 title="${l.title}">${l.title}</h4><span class="content-badge subject-${l.subject}">${l.subject}</span></div><div class="content-body"><div class="small text-muted" style="margin-bottom:10px;">تمهيد، تمارين (${l.exercises?.questions?.length || 0})، تقييم (${l.assessment?.questions?.length || 0})</div><div class="content-meta">${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف تدريسي</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}</div></div><div class="content-footer"><button class="btn-card-action btn-lesson-light" onclick="showLinkModal('lesson', ${l.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-lesson-light" onclick="editLesson(${l.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteLesson(${l.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

function loadObjectives() {
    const list = document.getElementById('objectivesList'); if (!list) return;
    const objs = JSON.parse(localStorage.getItem('objectives') || '[]').filter(o => o.teacherId === getCurrentUser().id);
    if (objs.length === 0) { list.innerHTML = `<div class="empty-content-state" style="text-align:center;padding:20px;"><h3>لا توجد أهداف</h3><button class="btn btn-success mt-2" onclick="showCreateObjectiveModal()">+ هدف جديد</button></div>`; return; }
    list.innerHTML = objs.map(o => `<div class="objective-row" id="obj-row-${o.id}"><div class="obj-header" onclick="toggleObjective(${o.id})"><div style="display:flex; align-items:center; gap:10px;"><i class="fas fa-chevron-down toggle-icon" id="icon-${o.id}"></i><h4 class="short-term-title">${o.shortTermGoal}</h4><span class="content-badge subject-${o.subject}" style="font-size:0.8rem; padding:2px 8px;">${o.subject}</span></div><div class="obj-actions" onclick="event.stopPropagation()"><button class="btn-card-action btn-lesson-light" onclick="editObjective(${o.id})" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn-card-action btn-delete-card" onclick="deleteObjective(${o.id})" title="حذف"><i class="fas fa-trash"></i></button></div></div><div class="obj-body" id="obj-body-${o.id}">${o.instructionalGoals && o.instructionalGoals.length > 0 ? `<div style="font-weight:bold; margin-bottom:5px; color:#555;">الأهداف التدريسية:</div><ul class="instructional-goals-list">${o.instructionalGoals.map(g => `<li>${g}</li>`).join('')}</ul>` : '<span class="text-muted small">لا توجد أهداف فرعية</span>'}</div></div>`).join('');
}

function toggleObjective(id) {
    const body = document.getElementById(`obj-body-${id}`); const row = document.getElementById(`obj-row-${id}`);
    if (body.classList.contains('show')) { body.classList.remove('show'); row.classList.remove('expanded'); } else { body.classList.add('show'); row.classList.add('expanded'); }
}

function loadHomeworks() {
    const grid = document.getElementById('homeworksGrid'); if (!grid) return;
    const homeworks = JSON.parse(localStorage.getItem('assignments') || '[]').filter(h => h.teacherId === getCurrentUser().id);
    if (homeworks.length === 0) { grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد واجبات</h3><button class="btn btn-success mt-2" onclick="showCreateHomeworkModal()">+ واجب جديد</button></div>`; return; }
    grid.innerHTML = homeworks.map(h => {
        const isLinked = !!h.linkedInstructionalGoal;
        return `<div class="content-card card-homework"><div class="content-header"><h4 title="${h.title}">${h.title}</h4><span class="content-badge subject-${h.subject}">${h.subject}</span></div><div class="content-body"><p class="text-muted small" style="margin-bottom:10px;">${h.description || 'لا يوجد وصف'}</p><div class="content-meta"><span><i class="fas fa-list-ol"></i> ${h.questions?.length || 0} أسئلة</span>${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}</div></div><div class="content-footer"><button class="btn-card-action btn-homework-light" onclick="showLinkModal('homework', ${h.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-homework-light" onclick="editHomework(${h.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteHomework(${h.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

// ---------------------------------------------------------
// دوال إدارة الأسئلة (Questions Logic)
// ---------------------------------------------------------

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
                <button type="button" onclick="this.closest('.question-card').remove()" title="حذف السؤال"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="q-body question-inputs-area"></div>
    </div>`;

    container.insertAdjacentHTML('beforeend', cardHtml);
    const selectElem = container.lastElementChild.querySelector('select');
    renderQuestionInputs(selectElem, idx, data);
}

// 🔥 تم إعادة بناء هذه الدالة لضمان ظهور زر الإضافة بشكل صحيح وتوليد فقرتين تلقائياً 🔥
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

    const multiTypes = ['drag-drop', 'ai-reading', 'ai-spelling', 'manual-reading', 'manual-spelling', 'missing-char'];
    
    if (multiTypes.includes(type)) {
        // بناء الـ HTML كنص كامل أولاً لضمان عدم ضياع العناصر
        let html = '';
        let placeholder = type === 'drag-drop' ? 'مثال: رتب الكلمات وضعها في الفراغات...' : 'مثال: أكمل الفراغات التالية...';
        
        html += `<div class="form-group mb-3">
                    <label class="q-label">عنوان السؤال الرئيسي</label>
                    <input type="text" class="form-control q-text" value="${data?.text || ''}" placeholder="${placeholder}">
                 </div>`;
        
        // حاوية الجمل بخلفية مميزة
        html += `<div id="paragraphs-container-${idx}" class="paragraphs-list" style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:15px;"></div>`;
        
        // زر الإضافة العريض والواضح
        let btnText = type === 'drag-drop' ? '<i class="fas fa-plus"></i> إضافة جملة أخرى' : '<i class="fas fa-plus"></i> إضافة فقرة';
        html += `<button type="button" class="btn btn-sm btn-primary mt-2 mb-3" onclick="addParagraphInput(${idx}, '${type}')" style="width: 100%; border: 2px dashed #007bff; background: transparent; color: #007bff; font-weight: bold; padding: 10px;">${btnText}</button>`;
        
        area.innerHTML = html;

        const items = data?.paragraphs || [];
        if (items.length > 0) {
            items.forEach(item => addParagraphInput(idx, type, item));
        } else {
            // 🔥 إضافة فقرتين تلقائياً إذا كان سحب وإفلات لضمان الجودة التربوية 🔥
            if (type === 'drag-drop') {
                addParagraphInput(idx, type);
                setTimeout(() => { addParagraphInput(idx, type); }, 50); 
            } else {
                addParagraphInput(idx, type);
            }
        }

    } else {
        let html = '';
        if (type === 'mcq' || type === 'mcq-media') {
            html += `<div class="form-group mb-3"><label class="q-label">نص السؤال</label><input type="text" class="form-control q-text" value="${data?.text || ''}" placeholder="اكتب السؤال هنا..."></div>`;
            if (type === 'mcq-media') {
                const existingFile = data?.attachment || '';
                html += `<div class="form-group mb-3 p-2 bg-light border rounded">
                            <label class="q-label"><i class="fas fa-paperclip"></i> مرفق (صورة/فيديو/صوت)</label>
                            <input type="file" class="form-control-file q-attachment">
                            <input type="hidden" class="q-existing-attachment" value="${existingFile}">
                            ${existingFile ? `<div class="attachment-preview mt-2"><img src="${existingFile}" style="max-height:80px; border:1px solid #ddd;"> (صورة محفوظة)</div>` : ''}
                        </div>`;
            }
            html += `<label class="q-label">الخيارات (حدد الإجابة الصحيحة)</label><div class="choices-container" id="choices-${idx}">`;
            const choices = data?.choices || ['خيار 1', 'خيار 2'];
            const correct = data?.correctAnswer || 0;
            choices.forEach((c, i) => {
                html += `<div class="choice-row"><input type="radio" name="correct-${idx}" value="${i}" ${i == correct ? 'checked' : ''}><input type="text" class="form-control q-choice" value="${c}" placeholder="الخيار ${i+1}"><button type="button" class="btn-remove-choice" onclick="this.parentElement.remove()">×</button></div>`;
            });
            html += `</div><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addChoiceInput(${idx})">+ إضافة خيار</button>`;
        } else if (type === 'open-ended') {
            html += `<div class="form-group"><label class="q-label">السؤال</label><textarea class="form-control q-text" rows="2">${data?.text || ''}</textarea></div><div class="form-group mt-2"><label class="q-label">الإجابة النموذجية (اختياري)</label><textarea class="form-control q-model-answer" rows="2">${data?.modelAnswer || ''}</textarea></div>`;
        }
        area.innerHTML = html;
    }
}

function addParagraphInput(qIdx, type, itemData = null) {
    const container = document.getElementById(`paragraphs-container-${qIdx}`);
    if(!container) return;

    const pIdx = Date.now() + Math.floor(Math.random() * 1000); 
    
    let innerHtml = '';

    if (type === 'drag-drop') {
        const text = itemData?.text || '';
        innerHtml = `
            <label class="q-label" style="color:#007bff;">الجملة أو الفقرة:</label>
            <div class="input-group mb-2">
                <input type="text" class="form-control p-text" id="drag-source-${qIdx}-${pIdx}" value="${text}" placeholder="مثال: ذهب محمد إلى المدرسة">
                <div class="input-group-append"><button class="btn btn-warning" type="button" onclick="initDragHighlighter(${qIdx}, ${pIdx})">تجهيز الفراغات</button></div>
            </div>
            <div id="highlighter-area-${qIdx}-${pIdx}" class="highlight-area" style="display:none; background:#fff; padding:10px; border-radius:5px; border:1px solid #ddd; margin-bottom:10px;"></div>
            <input type="hidden" class="p-gaps-data" id="gaps-data-${qIdx}-${pIdx}" value='${itemData?.gaps ? JSON.stringify(itemData.gaps) : ''}'>
        `;
        if (text && itemData?.gaps) { setTimeout(() => initDragHighlighter(qIdx, pIdx, itemData.gaps), 100); }

    } else if (type === 'ai-reading' || type === 'manual-reading') {
        innerHtml = `<label class="q-label">فقرة القراءة</label><textarea class="form-control p-text" rows="2">${itemData?.text || ''}</textarea>`;
    
    } else if (type === 'ai-spelling' || type === 'manual-spelling') {
        innerHtml = `<label class="q-label">الكلمة/الجملة للإملاء</label><input type="text" class="form-control p-text" value="${itemData?.text || ''}">
                     <div class="canvas-preview-box"><div class="canvas-placeholder">مساحة الكتابة (Canvas)</div></div>`;
    
    } else if (type === 'missing-char') {
        innerHtml = `<div class="row">
                        <div class="col-6"><input type="text" class="form-control p-text" value="${itemData?.text || ''}" placeholder="الكلمة كاملة (محمد)"></div>
                        <div class="col-6"><input type="text" class="form-control p-missing" value="${itemData?.missing || ''}" placeholder="الناقص (مـ_ـمد)"></div>
                     </div>`;
    }

    const div = document.createElement('div');
    div.className = 'paragraph-item';
    div.id = `p-item-${qIdx}-${pIdx}`;
    div.style.cssText = "position:relative; background:#fff; border:1px solid #eee; padding:15px; border-radius:8px; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.02);";
    div.innerHTML = innerHtml + `<button type="button" class="btn-remove-paragraph" onclick="this.parentElement.remove()" style="position:absolute; top:5px; left:5px; background:#ffebee; border:none; color:#dc3545; border-radius:50%; width:25px; height:25px; display:flex; align-items:center; justify-content:center; cursor:pointer;">×</button>`;
    container.appendChild(div);
}

function initDragHighlighter(qIdx, pIdx, savedGaps = null) {
    const sourceInput = document.getElementById(`drag-source-${qIdx}-${pIdx}`);
    const area = document.getElementById(`highlighter-area-${qIdx}-${pIdx}`);
    const text = sourceInput.value.trim();
    if(!text) { alert('اكتب الجملة أولاً'); return; }

    area.style.display = 'block';
    area.innerHTML = `
        <div style="margin-bottom:10px;"><p id="sel-text-${qIdx}-${pIdx}" style="font-size:1.3rem; letter-spacing:1px; line-height:1.8;">${text}</p></div>
        <button type="button" class="btn btn-warning btn-sm" onclick="markGap(${qIdx}, ${pIdx})"><i class="fas fa-highlighter"></i> تحويل المحدد لفراغ</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="resetGap(${qIdx}, ${pIdx})">إعادة تعيين</button>
        <div id="gap-prev-${qIdx}-${pIdx}" class="gap-preview mt-2"></div>
    `;

    if(savedGaps) {
        const preview = document.getElementById(`gap-prev-${qIdx}-${pIdx}`);
        preview.innerHTML = '<strong>الفراغات:</strong> ' + savedGaps.map(g => `<span class="badge badge-warning m-1" style="font-size:1rem;">${g.dragItem}</span>`).join(' ');
    }
}

function markGap(qIdx, pIdx) {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (!selectedText) { alert('حدد النص أولاً'); return; }

    let processed = selectedText;
    if (selectedText.length === 1 && /[جحخعغفقثصضشسيبلتنمكطظ]/.test(selectedText)) { processed = 'ـ' + selectedText + 'ـ'; }

    const preview = document.getElementById(`gap-prev-${qIdx}-${pIdx}`);
    const span = document.createElement('span'); span.className = 'badge badge-warning m-1'; 
    span.style.fontSize = '1rem';
    span.innerText = processed;
    preview.appendChild(span);

    const hiddenInput = document.getElementById(`gaps-data-${qIdx}-${pIdx}`);
    let data = hiddenInput.value ? JSON.parse(hiddenInput.value) : [];
    data.push({ original: selectedText, dragItem: processed });
    hiddenInput.value = JSON.stringify(data);
    selection.removeAllRanges();
}

function resetGap(qIdx, pIdx) {
    document.getElementById(`gap-prev-${qIdx}-${pIdx}`).innerHTML = '';
    document.getElementById(`gaps-data-${qIdx}-${pIdx}`).value = '';
}

function addChoiceInput(idx) {
    const container = document.getElementById(`choices-${idx}`);
    const count = container.children.length;
    const div = document.createElement('div'); div.className = 'choice-row';
    div.innerHTML = `<input type="radio" name="correct-${idx}" value="${count}"><input type="text" class="form-control q-choice" placeholder="الخيار ${count+1}"><button type="button" class="btn-remove-choice" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(div);
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ---------------------------------------------------------
// 🔥 تجميع البيانات للحفظ (مع الشرط التربوي الذكي) 🔥
// ---------------------------------------------------------

async function collectQuestionsFromContainer(id) {
    const cards = document.querySelectorAll(`#${id} .question-card`);
    const qs = [];
    
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const type = card.querySelector('select').value;
        const score = card.querySelector('.passing-score').value;
        const qData = { id: Date.now() + Math.random(), type: type, passingScore: score };
        
        if (type === 'mcq' || type === 'mcq-media' || type === 'open-ended') {
            qData.text = card.querySelector('.q-text')?.value || '';
            if (type.includes('mcq')) {
                qData.choices = Array.from(card.querySelectorAll('.q-choice')).map(c => c.value);
                card.querySelectorAll('input[type="radio"]').forEach((r, idx) => { if(r.checked) qData.correctAnswer = idx; });
                
                const fileInput = card.querySelector('.q-attachment');
                const existingFile = card.querySelector('.q-existing-attachment')?.value;
                
                if (fileInput && fileInput.files[0]) {
                    qData.attachment = await readFileAsBase64(fileInput.files[0]);
                } else if (existingFile) {
                    qData.attachment = existingFile;
                }
            } else {
                qData.modelAnswer = card.querySelector('.q-model-answer').value;
            }
        } 
        else {
            qData.text = card.querySelector('.q-text')?.value || '';
            qData.paragraphs = [];
            
            // عداد الجمل الصالحة (التي تحتوي على فراغات)
            let validDragParagraphs = 0; 

            card.querySelectorAll('.paragraph-item').forEach(pItem => {
                const pData = { id: Date.now() + Math.random() };
                if (type === 'drag-drop') {
                    pData.text = pItem.querySelector('.p-text').value;
                    const gapsVal = pItem.querySelector('.p-gaps-data').value;
                    pData.gaps = gapsVal ? JSON.parse(gapsVal) : [];
                    
                    // التحقق من أن الجملة غير فارغة وبها فراغ واحد على الأقل
                    if (pData.text.trim() !== '' && pData.gaps.length > 0) {
                        validDragParagraphs++;
                    }
                } else if (type === 'missing-char') {
                    pData.text = pItem.querySelector('.p-text').value;
                    pData.missing = pItem.querySelector('.p-missing').value;
                } else {
                    pData.text = pItem.querySelector('.p-text').value;
                }
                qData.paragraphs.push(pData);
            });

            // 🔥 تطبيق الشرط التربوي الذكي هنا 🔥
            if (type === 'drag-drop' && validDragParagraphs < 2) {
                showError(`تنبيه تربوي في السؤال رقم ${i + 1}:<br>سؤال السحب والإفلات يجب أن يتكون من <strong>جملتين مختلفتين على الأقل</strong>، مع إخفاء كلمة من كل جملة.<br><small>الهدف: تشتيت الخيارات في بنك الكلمات لضمان قياس مهارة الطالب بدقة.</small>`);
                return null; // إيقاف الحفظ
            }
        }
        qs.push(qData);
    }
    return qs;
}

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function getAllObjectives() { return JSON.parse(localStorage.getItem('objectives') || '[]').filter(o => o.teacherId === getCurrentUser().id); }

// ---------------------------------------------------------
// دوال الحفظ الأساسية (مع استقبال خطأ التحقق)
// ---------------------------------------------------------

async function saveTest() { 
    const t = document.getElementById('testTitle').value; 
    if(!t) return; 
    
    // جمع الأسئلة (إذا رجع null يعني فشل الشرط التربوي)
    const qs = await collectQuestionsFromContainer('questionsContainer'); 
    if (!qs) return; // توقف العملية

    const ts = JSON.parse(localStorage.getItem('tests') || '[]'); 
    const id = document.getElementById('editTestId').value; 
    const d = {id: id ? parseInt(id) : Date.now(), teacherId: getCurrentUser().id, title: t, subject: document.getElementById('testSubject').value, description: document.getElementById('testDescription').value, questions: qs, createdAt: new Date().toISOString()}; 
    
    if(id){const i = ts.findIndex(x => x.id == id); if(i !== -1) ts[i] = d;} else ts.push(d); 
    
    localStorage.setItem('tests', JSON.stringify(ts)); 
    document.getElementById('createTestModal').classList.remove('show'); 
    loadTests(); 
}

async function saveHomework() { 
    const id = document.getElementById('editHomeworkId').value; 
    const t = document.getElementById('homeworkTitle').value; 
    if(!t) return; 
    
    const qs = await collectQuestionsFromContainer('homeworkQuestionsContainer'); 
    if (!qs) return; // توقف العملية

    const hws = JSON.parse(localStorage.getItem('assignments') || '[]'); 
    const d = {id: id ? parseInt(id) : Date.now(), teacherId: getCurrentUser().id, title: t, subject: document.getElementById('homeworkSubject').value, description: document.getElementById('homeworkDescription').value, questions: qs, createdAt: new Date().toISOString()}; 
    
    if(id){const i = hws.findIndex(x => x.id == id); if(i !== -1) hws[i] = d;} else hws.push(d); 
    
    localStorage.setItem('assignments', JSON.stringify(hws)); 
    document.getElementById('createHomeworkModal').classList.remove('show'); 
    loadHomeworks(); 
}

async function saveLesson() { 
    const id = document.getElementById('editLessonId').value; 
    const t = document.getElementById('lessonTitle').value; 
    if(!t) return; 
    const intro = {type: document.getElementById('introType').value, url: document.getElementById('introUrl').value, text: document.getElementById('introText').value}; 
    
    const exQs = await collectQuestionsFromContainer('exercisesContainer');
    if (!exQs) return; // توقف العملية
    const ex = {passScore: document.getElementById('exercisesPassScore').value, questions: exQs}; 
    
    const asQs = await collectQuestionsFromContainer('assessmentContainer');
    if (!asQs) return; // توقف العملية
    const as = {questions: asQs}; 
    
    const ls = JSON.parse(localStorage.getItem('lessons') || '[]'); 
    const d = {id: id ? parseInt(id) : Date.now(), teacherId: getCurrentUser().id, title: t, subject: document.getElementById('lessonSubject').value, intro, exercises: ex, assessment: as, createdAt: new Date().toISOString()}; 
    
    if(id){const i = ls.findIndex(x => x.id == id); if(i !== -1) ls[i] = d;} else ls.push(d); 
    
    localStorage.setItem('lessons', JSON.stringify(ls)); 
    document.getElementById('createLessonModal').classList.remove('show'); 
    loadLessons(); 
}


// ---------------------------------------------------------
// النوافذ المنبثقة للربط (Modals)
// ---------------------------------------------------------

function injectLinkContentModal() {
    if (document.getElementById('linkContentModal')) return;
    console.log("Link Modal already exists in HTML");
}

function showLinkModal(type, id) {
    document.getElementById('linkTargetId').value = id;
    document.getElementById('linkTargetType').value = type;
    
    const container = document.getElementById('linkContentBody');
    const instruction = document.getElementById('linkInstructionText');
    container.innerHTML = '';

    const objectives = getAllObjectives();
    if(objectives.length === 0) {
        container.innerHTML = '<div class="text-center text-danger p-3">لا توجد أهداف مضافة. الرجاء إضافة أهداف أولاً.</div>';
        document.getElementById('linkContentModal').classList.add('show');
        return;
    }

    if (type === 'test') {
        instruction.textContent = 'قم بربط كل سؤال بالهدف قصير المدى الذي يقيسه.';
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const test = tests.find(t => t.id === id);
        if(!test || !test.questions) return;
        const relevantObjs = objectives.filter(o => o.subject === test.subject);
        let optionsHtml = '<option value="">-- اختر الهدف --</option>';
        relevantObjs.forEach(o => { optionsHtml += `<option value="${o.id}">${o.shortTermGoal}</option>`; });
        test.questions.forEach((q, idx) => {
            const row = document.createElement('div');
            row.className = 'linking-row';
            row.innerHTML = `<div class="linking-question-text"><strong>س${idx+1}:</strong> ${q.text || 'سؤال بدون نص'}</div><select class="form-control linking-select question-link-select" data-question-id="${q.id}">${optionsHtml}</select>`;
            if(q.linkedGoalId) row.querySelector('select').value = q.linkedGoalId;
            container.appendChild(row);
        });
    } else {
        instruction.textContent = 'قم باختيار هدف تدريسي واحد لربط هذا المحتوى به.';
        
        let currentItem;
        let storageKey = (type === 'lesson') ? 'lessons' : 'assignments';
        currentItem = JSON.parse(localStorage.getItem(storageKey) || '[]').find(x => x.id === id);

        if (!currentItem) { alert('العنصر غير موجود!'); return; }

        const relevantObjs = objectives.filter(o => o.subject && currentItem.subject && o.subject.trim() === currentItem.subject.trim());
        
        let selectHtml = '<select class="form-control" id="singleInstructionalLink"><option value="">-- غير مرتبط --</option>';
        relevantObjs.forEach(o => {
            if(o.instructionalGoals && o.instructionalGoals.length > 0) {
                selectHtml += `<optgroup label="${o.shortTermGoal}">`;
                o.instructionalGoals.forEach(ig => {
                    selectHtml += `<option value="${ig}">${ig}</option>`;
                });
                selectHtml += `</optgroup>`;
            }
        });
        selectHtml += '</select>';
        
        container.innerHTML = `<div class="p-3"><label>الهدف التدريسي:</label>${selectHtml}</div>`;
        
        if(currentItem.linkedInstructionalGoal) {
            setTimeout(() => {
                const el = document.getElementById('singleInstructionalLink');
                if(el) el.value = currentItem.linkedInstructionalGoal;
            }, 0);
        }
    }
    document.getElementById('linkContentModal').classList.add('show');
}

function saveContentLinks() {
    const id = parseInt(document.getElementById('linkTargetId').value);
    const type = document.getElementById('linkTargetType').value;

    if (type === 'test') {
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const testIndex = tests.findIndex(t => t.id === id);
        if(testIndex !== -1) {
            const selects = document.querySelectorAll('.question-link-select');
            selects.forEach(sel => {
                const qId = parseFloat(sel.getAttribute('data-question-id'));
                const goalId = sel.value;
                const q = tests[testIndex].questions.find(qx => qx.id === qId || Math.abs(qx.id - qId) < 0.0001);
                if(q) q.linkedGoalId = goalId ? parseInt(goalId) : null;
            });
            localStorage.setItem('tests', JSON.stringify(tests));
            loadTests();
        }
    } else {
        const key = (type === 'lesson') ? 'lessons' : 'assignments';
        
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = arr.findIndex(x => x.id === id);
        
        if(idx !== -1) {
            arr[idx].linkedInstructionalGoal = document.getElementById('singleInstructionalLink').value || null;
            localStorage.setItem(key, JSON.stringify(arr));
            
            if(type === 'lesson') loadLessons();
            else loadHomeworks();
        }
    }
    document.getElementById('linkContentModal').classList.remove('show');
    showSuccess('تم حفظ الارتباطات بنجاح');
}

// ---------------------------------------------------------
// دوال الفتح والإغلاق وتعديل المحتوى (بدون تغيير)
// ---------------------------------------------------------
function showCreateTestModal() { document.getElementById('editTestId').value=''; document.getElementById('testTitle').value=''; document.getElementById('testSubject').value='لغتي'; document.getElementById('testDescription').value=''; document.getElementById('questionsContainer').innerHTML=''; addQuestion(); document.getElementById('createTestModal').classList.add('show'); }
function editTest(id) { const t=JSON.parse(localStorage.getItem('tests')).find(x=>x.id===id); if(!t)return; document.getElementById('editTestId').value=t.id; document.getElementById('testTitle').value=t.title; document.getElementById('testSubject').value=t.subject; document.getElementById('testDescription').value=t.description; const c=document.getElementById('questionsContainer'); c.innerHTML=''; (t.questions||[]).forEach(q=>addQuestionToContainer(c,'سؤال',q)); document.getElementById('createTestModal').classList.add('show'); }
function deleteTest(id) { showConfirmModal('هل أنت متأكد من حذف هذا الاختبار؟', function() { const t = JSON.parse(localStorage.getItem('tests')).filter(x => x.id !== id); localStorage.setItem('tests', JSON.stringify(t)); loadTests(); showSuccess('تم الحذف'); }); }

function showCreateHomeworkModal() { document.getElementById('editHomeworkId').value=''; document.getElementById('homeworkTitle').value=''; document.getElementById('homeworkDescription').value=''; document.getElementById('homeworkQuestionsContainer').innerHTML=''; addHomeworkQuestion(); document.getElementById('createHomeworkModal').classList.add('show'); }
function editHomework(id) { const h=JSON.parse(localStorage.getItem('assignments')).find(x=>x.id===id); if(!h)return; document.getElementById('editHomeworkId').value=h.id; document.getElementById('homeworkTitle').value=h.title; document.getElementById('homeworkSubject').value=h.subject; document.getElementById('homeworkDescription').value=h.description; const c=document.getElementById('homeworkQuestionsContainer'); c.innerHTML=''; (h.questions||[]).forEach(q=>addQuestionToContainer(c,'سؤال',q)); document.getElementById('createHomeworkModal').classList.add('show'); }
function deleteHomework(id) { showConfirmModal('هل أنت متأكد من حذف هذا الواجب؟', function() { const h = JSON.parse(localStorage.getItem('assignments')).filter(x => x.id !== id); localStorage.setItem('assignments', JSON.stringify(h)); loadHomeworks(); showSuccess('تم الحذف'); }); }

function showCreateLessonModal() { document.getElementById('editLessonId').value=''; document.getElementById('lessonTitle').value=''; document.getElementById('introUrl').value=''; document.getElementById('introText').value=''; document.getElementById('exercisesContainer').innerHTML=''; document.getElementById('assessmentContainer').innerHTML=''; addLessonQuestion('exercisesContainer'); addLessonQuestion('assessmentContainer'); switchLessonStep('intro'); document.getElementById('createLessonModal').classList.add('show'); }
function editLesson(id) { const l=JSON.parse(localStorage.getItem('lessons')).find(x=>x.id===id); if(!l)return; document.getElementById('editLessonId').value=l.id; document.getElementById('lessonTitle').value=l.title; document.getElementById('lessonSubject').value=l.subject; if(l.intro){document.getElementById('introType').value=l.intro.type; document.getElementById('introUrl').value=l.intro.url; document.getElementById('introText').value=l.intro.text; toggleIntroInputs();} document.getElementById('exercisesPassScore').value=l.exercises?.passScore||80; const ec=document.getElementById('exercisesContainer'); ec.innerHTML=''; (l.exercises?.questions||[]).forEach(q=>addQuestionToContainer(ec,'سؤال',q)); const ac=document.getElementById('assessmentContainer'); ac.innerHTML=''; (l.assessment?.questions||[]).forEach(q=>addQuestionToContainer(ac,'سؤال',q)); switchLessonStep('intro'); document.getElementById('createLessonModal').classList.add('show'); }
function deleteLesson(id) { showConfirmModal('هل أنت متأكد من حذف هذا الدرس؟', function() { const l = JSON.parse(localStorage.getItem('lessons')).filter(x => x.id !== id); localStorage.setItem('lessons', JSON.stringify(l)); loadLessons(); showSuccess('تم الحذف'); }); }

function toggleIntroInputs() { const t=document.getElementById('introType').value; const u=document.getElementById('introUrl'); u.placeholder=t==='video'?'رابط يوتيوب':(t==='image'?'رابط الصورة':'رابط'); }
function showCreateObjectiveModal() { document.getElementById('editObjectiveId').value=''; document.getElementById('shortTermGoal').value=''; document.getElementById('instructionalGoalsContainer').innerHTML=''; addInstructionalGoalInput(); document.getElementById('createObjectiveModal').classList.add('show'); }
function editObjective(id) { const o=JSON.parse(localStorage.getItem('objectives')).find(x=>x.id===id); if(!o)return; document.getElementById('editObjectiveId').value=o.id; document.getElementById('objSubject').value=o.subject; document.getElementById('shortTermGoal').value=o.shortTermGoal; const c=document.getElementById('instructionalGoalsContainer'); c.innerHTML=''; if(o.instructionalGoals?.length>0)o.instructionalGoals.forEach(g=>addInstructionalGoalInput(g)); else addInstructionalGoalInput(); document.getElementById('createObjectiveModal').classList.add('show'); }
function addInstructionalGoalInput(v='') { const c=document.getElementById('instructionalGoalsContainer'); const d=document.createElement('div'); d.className='d-flex mb-2'; d.innerHTML=`<input type="text" class="form-control instructional-goal-input" value="${v}" placeholder="هدف تدريسي فرعي"><button type="button" class="btn btn-outline-danger btn-sm ml-2" onclick="this.parentElement.remove()">×</button>`; c.appendChild(d); }
function saveObjective() { const id=document.getElementById('editObjectiveId').value; const s=document.getElementById('objSubject').value; const g=document.getElementById('shortTermGoal').value; if(!g)return; const ig=[]; document.querySelectorAll('.instructional-goal-input').forEach(i=>{if(i.value.trim())ig.push(i.value.trim())}); const objs=JSON.parse(localStorage.getItem('objectives')||'[]'); const d={id:id?parseInt(id):Date.now(), teacherId:getCurrentUser().id, subject:s, shortTermGoal:g, instructionalGoals:ig}; if(id){const i=objs.findIndex(x=>x.id==id); if(i!==-1)objs[i]=d;}else objs.push(d); localStorage.setItem('objectives',JSON.stringify(objs)); document.getElementById('createObjectiveModal').classList.remove('show'); loadObjectives(); }

function deleteObjective(id) { showConfirmModal('هل أنت متأكد من حذف هذا الهدف؟', function() { const o = JSON.parse(localStorage.getItem('objectives')).filter(x => x.id !== id); localStorage.setItem('objectives', JSON.stringify(o)); loadObjectives(); showSuccess('تم الحذف'); }); }

// =======================================================
// ✅ 1. دوال التصدير (Export Logic)
// =======================================================

function showExportModal() {
    const modal = document.getElementById('exportContentModal');
    if (!modal) { console.error('exportContentModal not found'); return; }

    const container = document.getElementById('exportListsContainer');
    container.innerHTML = ''; 

    const user = getCurrentUser();
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(x => x.teacherId === user.id);
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(x => x.teacherId === user.id);
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]').filter(x => x.teacherId === user.id);
    const homeworks = JSON.parse(localStorage.getItem('assignments') || '[]').filter(x => x.teacherId === user.id);

    const createSection = (title, items, type) => {
        if (items.length === 0) return '';
        let html = `<div class="mb-3"><h5 style="border-bottom:1px solid #eee; padding-bottom:5px;">${title}</h5>`;
        items.forEach(item => {
            let label = item.title || item.shortTermGoal;
            html += `
                <div class="form-check">
                    <input class="form-check-input export-item" type="checkbox" data-type="${type}" value="${item.id}" id="export-${type}-${item.id}" checked>
                    <label class="form-check-label" for="export-${type}-${item.id}">${label}</label>
                </div>`;
        });
        html += `</div>`;
        return html;
    };

    let contentHtml = '';
    contentHtml += createSection('الاختبارات التشخيصية', tests, 'tests');
    contentHtml += createSection('الدروس التفاعلية', lessons, 'lessons');
    contentHtml += createSection('الأهداف التعليمية', objectives, 'objectives');
    contentHtml += createSection('الواجبات', homeworks, 'assignments'); 

    if (contentHtml === '') {
        container.innerHTML = '<p class="text-center text-muted">لا يوجد محتوى لتصديره.</p>';
    } else {
        container.innerHTML = contentHtml;
    }

    modal.classList.add('show');
}

function toggleGlobalSelect(source) {
    const checkboxes = document.querySelectorAll('.export-item');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function executeExport() {
    const selected = {
        tests: [],
        lessons: [],
        objectives: [],
        assignments: [],
        exportDate: new Date().toISOString(),
        exportedBy: getCurrentUser().name
    };

    document.querySelectorAll('.export-item:checked').forEach(cb => {
        const type = cb.getAttribute('data-type');
        const id = parseInt(cb.value);
        
        let sourceKey = type;
        if(type === 'assignments') sourceKey = 'assignments'; 

        const allItems = JSON.parse(localStorage.getItem(sourceKey) || '[]');
        const item = allItems.find(x => x.id === id);
        if (item) selected[type].push(item);
    });

    const totalCount = selected.tests.length + selected.lessons.length + selected.objectives.length + selected.assignments.length;
    if (totalCount === 0) {
        alert('الرجاء تحديد عنصر واحد على الأقل للتصدير.');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selected));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "muyasir_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    document.getElementById('exportContentModal').classList.remove('show');
    showSuccess(`تم تصدير ${totalCount} عنصر بنجاح`);
}

// =======================================================
// ✅ 2. دوال الاستيراد (Import Logic)
// =======================================================

function importContent(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const user = getCurrentUser();
            let count = 0;

            const mergeData = (key, newItems) => {
                if (!newItems || newItems.length === 0) return 0;
                const currentItems = JSON.parse(localStorage.getItem(key) || '[]');
                let added = 0;
                newItems.forEach(item => {
                    if (!currentItems.some(x => x.id === item.id)) {
                        item.teacherId = user.id; 
                        currentItems.push(item);
                        added++;
                    }
                });
                localStorage.setItem(key, JSON.stringify(currentItems));
                return added;
            };

            count += mergeData('tests', data.tests);
            count += mergeData('lessons', data.lessons);
            count += mergeData('objectives', data.objectives);
            count += mergeData('assignments', data.assignments);

            showSuccess(`تم استيراد ${count} عنصر بنجاح`);
            loadContentLibrary(); 

        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء قراءة الملف. تأكد أنه ملف JSON صالح.');
        }
    };
    reader.readAsText(file);
    input.value = ''; 
}

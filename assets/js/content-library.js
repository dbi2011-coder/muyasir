// ============================================
// 📁 المسار: assets/js/content-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('testsGrid') || document.getElementById('lessonsGrid')) {
        loadContentLibrary();
    }
});

// ... (دوال loadTests, loadLessons, etc تبقى كما هي من الردود السابقة ولا تغيير عليها) ...
// سنركز هنا فقط على دوال بناء الأسئلة الجديدة

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

    // تحديد لون الشريط الجانبي بناءً على النوع
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
        <div class="q-body question-inputs-area">
            </div>
    </div>`;

    container.insertAdjacentHTML('beforeend', cardHtml);
    
    // تفعيل الحقول
    const selectElem = container.lastElementChild.querySelector('select');
    renderQuestionInputs(selectElem, idx, data);
}

// الدالة الرئيسية لرسم الحقول حسب النوع
function renderQuestionInputs(selectElem, idx, data = null) {
    const type = selectElem.value;
    const card = selectElem.closest('.question-card');
    const area = card.querySelector('.question-inputs-area');
    
    // تحديث لون الشريط الجانبي
    const stripe = card.querySelector('.q-stripe');
    stripe.className = 'q-stripe'; // reset
    if(type.includes('drag')) stripe.classList.add('drag');
    else if(type.includes('ai')) stripe.classList.add('ai');
    else if(type.includes('manual')) stripe.classList.add('manual');
    else stripe.classList.add('mcq');

    const txt = data ? data.text : '';
    let html = '';

    // --- 1. اختيار من متعدد (مع وبدون مرفق) ---
    if (type === 'mcq' || type === 'mcq-media') {
        html += `<div class="form-group mb-3">
                    <label class="q-label">نص السؤال</label>
                    <input type="text" class="form-control q-text" value="${txt}" placeholder="اكتب السؤال هنا...">
                 </div>`;
        
        if (type === 'mcq-media') {
            html += `<div class="form-group mb-3 p-2 bg-light border rounded">
                        <label class="q-label"><i class="fas fa-paperclip"></i> مرفق (صورة/فيديو/صوت)</label>
                        <input type="file" class="form-control-file q-attachment">
                        ${data?.attachment ? `<div class="attachment-preview">ملف حالي: ${data.attachment}</div>` : ''}
                     </div>`;
        }

        html += `<label class="q-label">الخيارات (حدد الإجابة الصحيحة)</label>
                 <div class="choices-container" id="choices-${idx}">`;
        
        const choices = data?.choices || ['خيار 1', 'خيار 2'];
        const correct = data?.correctAnswer || 0; // index

        choices.forEach((c, i) => {
            html += `<div class="choice-row">
                        <input type="radio" name="correct-${idx}" value="${i}" ${i == correct ? 'checked' : ''}>
                        <input type="text" class="form-control q-choice" value="${c}" placeholder="الخيار ${i+1}">
                        <button class="btn-remove-choice" onclick="this.parentElement.remove()">×</button>
                     </div>`;
        });
        html += `</div>
                 <button class="btn btn-sm btn-outline-primary mt-2" onclick="addChoiceInput(${idx})">+ إضافة خيار</button>`;
    
    // --- 2. سحب وإفلات (المنطق الذكي) ---
    } else if (type === 'drag-drop') {
        html += `<div class="alert alert-info small">
                    <i class="fas fa-info-circle"></i> اكتب الجملة كاملة، ثم حدد الكلمات أو الحروف التي تريد تحويلها لفراغات واضغط "تحويل لفراغ".
                 </div>
                 <div class="form-group">
                    <label class="q-label">الجملة الأصلية</label>
                    <div class="input-group mb-2">
                        <input type="text" class="form-control q-source-text" id="drag-source-${idx}" value="${txt}" placeholder="مثال: ذهب محمد إلى المدرسة">
                        <div class="input-group-append">
                            <button class="btn btn-warning" type="button" onclick="initDragHighlighter(${idx})">تجهيز الفراغات</button>
                        </div>
                    </div>
                 </div>
                 <div id="highlighter-area-${idx}" class="highlight-area" style="display:none;"></div>
                 <input type="hidden" class="q-gaps-data" id="gaps-data-${idx}">`;
    
    // --- 3. سؤال مفتوح ---
    } else if (type === 'open-ended') {
        html += `<div class="form-group">
                    <label class="q-label">السؤال</label>
                    <textarea class="form-control q-text" rows="2">${txt}</textarea>
                 </div>
                 <div class="form-group mt-2">
                    <label class="q-label">الإجابة النموذجية (اختياري للمعلم)</label>
                    <textarea class="form-control q-model-answer" rows="2">${data?.modelAnswer || ''}</textarea>
                 </div>`;
    
    // --- 4. تقييم قراءة آلي ---
    } else if (type === 'ai-reading') {
        html += `<div class="form-group">
                    <label class="q-label">النص المراد قراءته</label>
                    <textarea class="form-control q-reading-text" rows="3">${data?.readingText || ''}</textarea>
                 </div>
                 <div class="text-muted small mt-2">
                    <i class="fas fa-robot"></i> سيقوم النظام بتسجيل صوت الطالب ومطابقته مع هذا النص آلياً.
                 </div>`;
    
    // --- 5. تقييم إملاء آلي (رسم) ---
    } else if (type === 'ai-spelling') {
        html += `<div class="form-group">
                    <label class="q-label">الكلمة/الجملة (للنطق)</label>
                    <input type="text" class="form-control q-full-word" value="${data?.fullWord || ''}">
                 </div>
                 <div class="canvas-preview-box mt-3">
                    <label class="q-label">واجهة الطالب (معاينة)</label>
                    <div class="canvas-placeholder">
                        <i class="fas fa-pen-fancy fa-2x"></i> &nbsp; مساحة الكتابة الحرة (Canvas)
                    </div>
                    <div class="canvas-tools-mock">
                        <div class="tool-btn-mock" style="background:black"></div>
                        <div class="tool-btn-mock" style="background:red"></div>
                        <div class="tool-btn-mock" style="background:blue"></div>
                        <span style="font-size:20px;">🧹</span>
                    </div>
                 </div>`;

    // --- 6. تقييم قراءة يدوي ---
    } else if (type === 'manual-reading') {
        html += `<div class="form-group">
                    <label class="q-label">النص للقراءة</label>
                    <textarea class="form-control q-reading-text" rows="3">${data?.readingText || ''}</textarea>
                 </div>
                 <div class="alert alert-success small mt-2">
                    آلية التصحيح: عند عرض الإجابة، ستضغط على الكلمة الخاطئة لتصبح <span style="background:#ffcccc; padding:2px;">حمراء</span>، وضغطة أخرى تعيدها خضراء.
                 </div>`;

    // --- 7. تقييم إملاء يدوي ---
    } else if (type === 'manual-spelling') {
        html += `<div class="form-group">
                    <label class="q-label">الكلمة للإملاء</label>
                    <input type="text" class="form-control q-full-word" value="${data?.fullWord || ''}">
                 </div>
                 <div class="alert alert-success small mt-2">
                    سيظهر لك خط يد الطالب والنص الصحيح. اضغط على الكلمات في النص الصحيح لتمييز الأخطاء.
                 </div>
                 <div class="canvas-preview-box">
                    <div class="canvas-placeholder">مساحة كتابة الطالب</div>
                 </div>`;

    // --- 8. أكمل الحرف الناقص ---
    } else if (type === 'missing-char') {
        html += `<div class="row">
                    <div class="col-md-6">
                        <label class="q-label">الكلمة كاملة</label>
                        <input type="text" class="form-control q-full-word" value="${data?.fullWord || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="q-label">الكلمة مع النقص (استخدم _ )</label>
                        <input type="text" class="form-control q-missing-word" value="${data?.missingWord || ''}" placeholder="مـ_ـمد">
                    </div>
                 </div>
                 <div class="mt-2 text-muted small">سيتمكن الطالب من رسم الحرف الناقص في الفراغ.</div>`;
    }

    area.innerHTML = html;

    // إعادة تحميل بيانات السحب والإفلات إذا كانت موجودة
    if(type === 'drag-drop' && data?.gaps) {
        initDragHighlighter(idx, data.gaps);
    }
}

// دالة إضافة خيار جديد للاختيار من متعدد
function addChoiceInput(idx) {
    const container = document.getElementById(`choices-${idx}`);
    const count = container.children.length;
    const div = document.createElement('div');
    div.className = 'choice-row';
    div.innerHTML = `
        <input type="radio" name="correct-${idx}" value="${count}">
        <input type="text" class="form-control q-choice" placeholder="الخيار ${count+1}">
        <button class="btn-remove-choice" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

// ==========================================
// 🧠 منطق السحب والإفلات الذكي (Arabic Connectivity)
// ==========================================

function initDragHighlighter(idx, savedGaps = null) {
    const sourceInput = document.getElementById(`drag-source-${idx}`);
    const area = document.getElementById(`highlighter-area-${idx}`);
    const text = sourceInput.value.trim();
    
    if(!text) { alert('الرجاء كتابة الجملة أولاً'); return; }

    area.style.display = 'block';
    area.innerHTML = ''; // reset

    // تقسيم الجملة إلى كلمات وحروف لنجعلها قابلة للضغط
    // سنستخدم التمييز البسيط هنا: النقر على الكلمة يحولها لفراغ
    // للتعقيد (تحديد حرف وسط الكلمة): سنعرض الكلمة كحروف
    
    // لتبسيط الواجهة للمعلم: سنعرض النص، وهو يظلل بالفأرة (Select) ثم يضغط زر
    area.innerHTML = `
        <div style="margin-bottom:10px;">
            <p id="selectable-text-${idx}" style="font-size:1.5rem; letter-spacing:1px;">${text}</p>
        </div>
        <button class="btn btn-warning btn-sm" onclick="markSelectionAsGap(${idx})"><i class="fas fa-highlighter"></i> تحويل المحدد إلى فراغ</button>
        <button class="btn btn-secondary btn-sm" onclick="resetHighlighter(${idx})">إعادة تعيين</button>
        <div id="gaps-preview-${idx}" class="gap-preview"></div>
    `;

    // تخزين البيانات
    if(savedGaps) {
        // استرجاع الفراغات (للعرض فقط في هذه النسخة المبسطة)
        const preview = document.getElementById(`gaps-preview-${idx}`);
        preview.innerHTML = '<strong>الفراغات الحالية:</strong> ' + savedGaps.map(g => `<span class="badge badge-warning">${g.dragItem}</span>`).join(' ');
    }
}

function markSelectionAsGap(idx) {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (!selectedText) { alert('حدد جزءاً من النص أولاً'); return; }
    
    // 🧠 المعالجة الذكية للحروف العربية (Tatweel Logic)
    let processedDragItem = selectedText;
    
    // فحص ما قبل وما بعد (محاكاة بسيطة)
    // إذا كان الحرف في وسط الكلمة (مثل 'ح' في 'محمد')، نضيف كشيدة قبله وبعده
    // هذا المنطق يتطلب تحليل موقع التحديد بدقة، لكن للتبسيط سنضيف الكشيدة يدوياً
    // أو نسأل المعلم، لكن الأفضل هو الافتراض الذكي:
    
    // إذا كان طول المحدد حرف واحد وهو ليس الأول ولا الأخير تقديراً
    if (selectedText.length === 1 && /[جحخعغفقثصضشسيبلتنمكطظ]/.test(selectedText)) {
        processedDragItem = 'ـ' + selectedText + 'ـ';
    } else if (selectedText.length > 1) {
        // للكلمات لا نغير شيء غالباً
    }

    const preview = document.getElementById(`gaps-preview-${idx}`);
    const span = document.createElement('span');
    span.className = 'badge badge-warning m-1';
    span.innerText = processedDragItem;
    preview.appendChild(span);

    // تحديث البيانات المخفية
    const hiddenInput = document.getElementById(`gaps-data-${idx}`);
    let currentData = hiddenInput.value ? JSON.parse(hiddenInput.value) : [];
    currentData.push({ original: selectedText, dragItem: processedDragItem });
    hiddenInput.value = JSON.stringify(currentData);

    // تفريغ التحديد
    selection.removeAllRanges();
}

function resetHighlighter(idx) {
    document.getElementById(`gaps-preview-${idx}`).innerHTML = '';
    document.getElementById(`gaps-data-${idx}`).value = '';
}

// ==========================================
// 📥 تجميع البيانات عند الحفظ
// ==========================================

function collectQuestionsFromContainer(id) {
    const qs = [];
    document.querySelectorAll(`#${id} .question-card`).forEach(card => {
        const type = card.querySelector('select').value;
        const score = card.querySelector('.passing-score').value;
        const qData = {
            id: Date.now() + Math.random(),
            type: type,
            passingScore: score,
            text: card.querySelector('.q-text')?.value || ''
        };

        if (type === 'mcq' || type === 'mcq-media') {
            qData.choices = Array.from(card.querySelectorAll('.q-choice')).map(c => c.value);
            // البحث عن الراديو المحدد
            const radios = card.querySelectorAll('input[type="radio"]');
            radios.forEach((r, i) => { if(r.checked) qData.correctAnswer = i; });
            if(card.querySelector('.q-attachment')?.files[0]) {
                qData.attachment = card.querySelector('.q-attachment').files[0].name; // تخزين الاسم فقط حالياً
            }
        }
        else if (type === 'drag-drop') {
            qData.text = card.querySelector('.q-source-text').value;
            const gapsVal = card.querySelector('.q-gaps-data').value;
            qData.gaps = gapsVal ? JSON.parse(gapsVal) : [];
        }
        else if (type === 'open-ended') {
            qData.modelAnswer = card.querySelector('.q-model-answer').value;
        }
        else if (type === 'ai-reading' || type === 'manual-reading') {
            qData.readingText = card.querySelector('.q-reading-text').value;
        }
        else if (type === 'ai-spelling' || type === 'manual-spelling' || type === 'missing-char') {
            qData.fullWord = card.querySelector('.q-full-word')?.value || '';
            qData.missingWord = card.querySelector('.q-missing-word')?.value || '';
        }

        qs.push(qData);
    });
    return qs;
}

// ==========================================
// (بقية الكود: الدوال المساعدة والاستيراد والتصدير كما هي في الردود السابقة)
// ==========================================
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
// ... انسخ دوال التصدير والربط والمودالات كما هي ...
// لضمان عمل الكود، تأكد من وجود دوال: showLinkModal, saveContentLinks, showExportModal, executeExport, importContent
// بنفس المنطق السابق تماماً.

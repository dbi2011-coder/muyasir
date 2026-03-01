// ============================================
// الجزء المضاف داخل content-library.js
// ============================================

function addQuestionToContainer(container, lbl, data = null) {
    const qUniqueId = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 10000); 
    const type = data ? data.type : 'mcq';
    const maxScore = data ? (data.maxScore || data.passingScore || 1) : 1;
    const passCriterion = data ? (data.passingCriterion || 80) : 80;

    const isTestOrHomework = (container.id === 'questionsContainer' || container.id === 'homeworkQuestionsContainer');

    let stripeClass = 'mcq';
    if(type.includes('drag')) stripeClass = 'drag';
    else if(type.includes('ai')) stripeClass = 'ai';
    else if(type.includes('manual') || type === 'handwriting') stripeClass = 'manual';

    const criterionHtml = isTestOrHomework ? `
        <div style="display:flex; flex-direction:column; align-items:center;">
            <label style="font-size:0.75rem; font-weight:bold; color:#dc3545; margin-bottom:2px;">المحك (%)</label>
            <input type="number" class="passing-criterion" value="${passCriterion}" style="width:60px; border:1px solid #ffcdd2; border-radius:5px; text-align:center; background:#ffebee; font-weight:bold;">
        </div>
    ` : '';

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
                    <optgroup label="التقييم اليدوي والتفاعلي">
                        <option value="handwriting" ${type==='handwriting'?'selected':''}>رسم كتابي (نسخ)</option>
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
                <button type="button" onclick="this.closest('.question-card').remove()" class="btn btn-sm btn-outline-danger" style="height:32px; padding:0 10px; margin-bottom:1px;"><i class="fas fa-trash"></i></button>
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
    
    // تحديث الشريط الجانبي
    const stripe = card.querySelector('.q-stripe');
    stripe.className = 'q-stripe';
    if(type.includes('drag')) stripe.classList.add('drag');
    else if(type.includes('ai')) stripe.classList.add('ai');
    else if(type.includes('manual') || type === 'handwriting') stripe.classList.add('manual');
    else stripe.classList.add('mcq');

    const multiTypes = ['drag-drop', 'ai-reading', 'ai-spelling', 'manual-reading', 'manual-spelling', 'missing-char'];
    
    if (multiTypes.includes(type)) {
        // ... (نفس كودك السابق للأسئلة الأخرى دون تغيير) ...
        let html = '';
        let placeholder = type === 'drag-drop' ? 'مثال: رتب الكلمات...' : 'مثال: أكمل الفراغات...';
        html += `<div class="form-group mb-3"><label class="q-label">عنوان السؤال الرئيسي</label><input type="text" class="form-control q-text" value="${data?.text || ''}" placeholder="${placeholder}"></div>`;
        html += `<div id="paragraphs-container-${qUniqueId}" class="paragraphs-list"></div>`;
        html += `<button type="button" class="btn btn-sm btn-primary mt-2 mb-3" onclick="addParagraphInput('${qUniqueId}', '${type}')"><i class="fas fa-plus"></i> إضافة فقرة</button>`;
        area.innerHTML = html;
        const items = data?.paragraphs || [];
        if (items.length > 0) items.forEach(item => addParagraphInput(qUniqueId, type, item));
        else addParagraphInput(qUniqueId, type);
        
    } else if (type === 'handwriting') { // 🔥 التحديث الجديد
        let existingFile = data?.attachment || '';
        area.innerHTML = `
            <div class="form-group mb-3">
                <label class="q-label">النص أو الجملة المراد نسخها</label>
                <textarea class="form-control q-text" rows="2" placeholder="اكتب النص ليقوم الطالب بنسخه...">${data?.text || ''}</textarea>
            </div>
            <div class="form-group mb-3">
                <label class="q-label">عدد الأسطر لدفتر الطالب</label>
                <select class="form-control q-lines" style="width: 150px;">
                    <option value="1" ${data?.lines == 1 ? 'selected' : ''}>سطر واحد</option>
                    <option value="2" ${data?.lines == 2 ? 'selected' : ''}>سطرين</option>
                    <option value="3" ${(!data || data?.lines == 3) ? 'selected' : ''}>3 أسطر</option>
                    <option value="4" ${data?.lines == 4 ? 'selected' : ''}>4 أسطر</option>
                    <option value="5" ${data?.lines == 5 ? 'selected' : ''}>5 أسطر</option>
                </select>
            </div>
            <div class="form-group mb-3 p-2 bg-light border rounded">
                <label class="q-label"><i class="fas fa-paperclip"></i> إرفاق صورة (اختياري - للكلمات المنقطة مثلاً)</label>
                <input type="file" class="form-control-file q-attachment" accept="image/*">
                <input type="hidden" class="q-existing-attachment" value="${existingFile}">
                ${existingFile ? `<div class="attachment-preview mt-2"><img src="${existingFile}" style="max-height:80px; border:1px solid #ddd;"> (صورة محفوظة)</div>` : ''}
            </div>
        `;
    } else {
        // ... (كود mcq و open-ended كما هو) ...
        let html = '';
        if (type === 'mcq' || type === 'mcq-media') {
            html += `<div class="form-group mb-3"><label class="q-label">نص السؤال</label><input type="text" class="form-control q-text" value="${data?.text || ''}"></div>`;
            html += `<label class="q-label">الخيارات</label><div class="choices-container" id="choices-${qUniqueId}">`;
            const choices = data?.choices || ['خيار 1', 'خيار 2'];
            const correct = data?.correctAnswer !== undefined ? parseInt(data.correctAnswer) : 0; 
            choices.forEach((c, i) => { 
                html += `<div class="choice-row"><input type="radio" name="correct-${qUniqueId}" value="${i}" ${i === correct ? 'checked' : ''}><input type="text" class="form-control q-choice" value="${c}"><button type="button" class="btn-remove-choice" onclick="this.parentElement.remove()">×</button></div>`; 
            });
            html += `</div><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addChoiceInput('${qUniqueId}')">+ إضافة خيار</button>`;
        } else if (type === 'open-ended') {
            html += `<div class="form-group"><label class="q-label">السؤال</label><textarea class="form-control q-text" rows="2">${data?.text || ''}</textarea></div>`;
        }
        area.innerHTML = html;
    }
}

// تعديل الدالة لجمع السؤال الجديد
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
        
        if (type === 'handwriting') { // 🔥 تجميع سؤال الرسم الكتابي
            qData.text = card.querySelector('.q-text').value;
            qData.lines = parseInt(card.querySelector('.q-lines').value) || 3;
            const fileInput = card.querySelector('.q-attachment'); 
            const existingFile = card.querySelector('.q-existing-attachment')?.value;
            if (fileInput && fileInput.files[0]) { 
                qData.attachment = await readFileAsBase64(fileInput.files[0]); 
            } else if (existingFile) { 
                qData.attachment = existingFile; 
            }
        } 
        else if (type === 'mcq' || type === 'mcq-media' || type === 'open-ended') {
           // ... نفس الكود السابق ...
           qData.text = card.querySelector('.q-text')?.value || '';
            if (type.includes('mcq')) {
                qData.choices = Array.from(card.querySelectorAll('.q-choice')).map(c => c.value);
                card.querySelectorAll('input[type="radio"]').forEach((r, idx) => { if(r.checked) qData.correctAnswer = idx; });
                const fileInput = card.querySelector('.q-attachment'); const existingFile = card.querySelector('.q-existing-attachment')?.value;
                if (fileInput && fileInput.files[0]) { qData.attachment = await readFileAsBase64(fileInput.files[0]); } else if (existingFile) { qData.attachment = existingFile; }
            } else { qData.modelAnswer = card.querySelector('.q-model-answer')?.value || ''; }
        } else {
            // ... نفس الكود للأسئلة المتقدمة ...
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

// assets/js/content-library.js

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('content-library.html')) {
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    loadTests();
    loadLessons();
    loadObjectives();
}

// ... (دوال الأهداف والدروس والربط نفس السابق، التركيز هنا على الاختبارات) ...

// ==========================================
// إدارة الاختبارات وأنواع الأسئلة الـ 9
// ==========================================

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    addQuestionToContainer(container, 'السؤال');
}

function addQuestionToContainer(container, labelPrefix, existingData = null) {
    const index = container.children.length;
    const typeVal = existingData ? existingData.type : 'multiple-choice';
    const scoreVal = existingData ? (existingData.passingScore || 5) : 5;
    
    const questionHTML = `
        <div class="question-item card p-3 mb-3" data-index="${index}" style="border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:15px; background:#fff;">
            <div class="d-flex justify-content-between mb-2">
                <h5>${labelPrefix} ${index + 1}</h5>
                <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">حذف</button>
            </div>
            
            <div class="row" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;">
                    <label>نوع السؤال</label>
                    <select class="form-control question-type" onchange="renderQuestionInputs(this, ${index})">
                        <option value="multiple-choice" ${typeVal==='multiple-choice'?'selected':''}>اختيار من متعدد</option>
                        <option value="multiple-choice-media" ${typeVal==='multiple-choice-media'?'selected':''}>اختيار من متعدد (مرفق)</option>
                        <option value="drag-drop" ${typeVal==='drag-drop'?'selected':''}>سحب وإفلات</option>
                        <option value="open-ended" ${typeVal==='open-ended'?'selected':''}>سؤال مفتوح</option>
                        <option value="ai-reading" ${typeVal==='ai-reading'?'selected':''}>تقييم قراءة آلي (AI)</option>
                        <option value="ai-spelling" ${typeVal==='ai-spelling'?'selected':''}>تقييم إملاء آلي (AI)</option>
                        <option value="manual-reading" ${typeVal==='manual-reading'?'selected':''}>تقييم قراءة يدوي</option>
                        <option value="manual-spelling" ${typeVal==='manual-spelling'?'selected':''}>تقييم إملاء يدوي</option>
                        <option value="missing-letter" ${typeVal==='missing-letter'?'selected':''}>أكمل الحرف الناقص</option>
                    </select>
                </div>
                <div class="form-group" style="width:150px;">
                    <label style="color:#e67e22;">محك الاجتياز</label>
                    <input type="number" class="form-control passing-score" value="${scoreVal}" min="1">
                </div>
            </div>

            <div class="question-inputs-area"></div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
    const newSelect = container.lastElementChild.querySelector('.question-type');
    renderQuestionInputs(newSelect, index, existingData);
}

function renderQuestionInputs(selectElement, index, data = null) {
    const type = selectElement.value;
    const area = selectElement.parentElement.parentElement.nextElementSibling;
    const textVal = data ? data.text : '';
    let html = '';
    
    // 1. الأسئلة النمطية
    if (type === 'multiple-choice' || type === 'multiple-choice-media') {
        const choices = data?.choices || ['', '', ''];
        html = `
            ${type === 'multiple-choice-media' ? `
                <div class="form-group advanced-input-area">
                    <label>رابط المرفق (صورة/فيديو/صوت)</label>
                    <input type="text" class="form-control q-media" value="${data?.mediaUrl || ''}" placeholder="رابط URL أو سيتم رفع الملف لاحقاً">
                </div>` : ''}
            <div class="form-group"><label>نص السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
            <label>الخيارات (حدد الصحيحة)</label>
            ${choices.map((c, i) => `<input type="text" class="form-control mb-1 q-choice" value="${c}" placeholder="الخيار ${i+1}">`).join('')}
        `;
    } 
    else if (type === 'drag-drop') {
        html = `
            <div class="form-group"><label>نص السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
            <div class="advanced-input-area"><p class="text-muted">أدخل العناصر المراد سحبها وترتيبها (مفصولة بفاصلة)</p>
            <input type="text" class="form-control q-drag-items" value="${data?.dragItems || ''}" placeholder="مثال: أسد, نمر, قطة"></div>
        `;
    }
    else if (type === 'open-ended') {
        html = `
            <div class="form-group"><label>نص السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
            <div class="form-group"><label>الإجابة النموذجية (اختياري)</label><textarea class="form-control q-model-answer">${data?.modelAnswer || ''}</textarea></div>
        `;
    }
    
    // 2. أسئلة الذكاء الاصطناعي
    else if (type === 'ai-reading' || type === 'manual-reading') {
        html = `
            <div class="form-group"><label>تعليمات السؤال</label><input type="text" class="form-control q-text" value="${textVal}" placeholder="مثال: اقرأ النص التالي قراءة جهرية"></div>
            <div class="form-group"><label>النص المراد قراءته</label><textarea class="form-control q-reading-text" rows="3">${data?.readingText || ''}</textarea></div>
        `;
    }
    else if (type === 'ai-spelling' || type === 'manual-spelling') {
        html = `
            <div class="form-group"><label>تعليمات السؤال</label><input type="text" class="form-control q-text" value="${textVal}" placeholder="مثال: اكتب الكلمة التي تسمعها"></div>
            <div class="form-group"><label>الكلمة/الجملة (سيقوم النظام بنطقها)</label><input type="text" class="form-control q-spelling-word" value="${data?.spellingWord || ''}"></div>
        `;
    }
    
    // 3. أسئلة يدوية أخرى
    else if (type === 'missing-letter') {
        html = `
            <div class="form-group"><label>الكلمة كاملة</label><input type="text" class="form-control q-full-word" value="${data?.fullWord || ''}" placeholder="مثال: كتاب"></div>
            <div class="form-group"><label>الكلمة مع النقص (استخدم _ مكان الحرف)</label><input type="text" class="form-control q-missing-word" value="${data?.missingWord || ''}" placeholder="مثال: كتا_"></div>
        `;
    }

    area.innerHTML = html;
}

function saveTest() {
    // ... (نفس منطق الحفظ السابق، ولكن مع جمع الحقول الجديدة)
    const title = document.getElementById('testTitle').value;
    const subject = document.getElementById('testSubject').value;
    const questions = [];
    
    document.querySelectorAll('#questionsContainer .question-item').forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || 'سؤال'; // fallback if no text input in some types
        const score = item.querySelector('.passing-score').value;
        
        let qData = {
            id: Date.now() + Math.random(),
            type, text, passingScore: parseInt(score), objectiveId: null
        };
        
        // جمع البيانات الخاصة لكل نوع
        if(item.querySelector('.q-choice')) {
            qData.choices = Array.from(item.querySelectorAll('.q-choice')).map(c => c.value);
        }
        if(item.querySelector('.q-media')) qData.mediaUrl = item.querySelector('.q-media').value;
        if(item.querySelector('.q-reading-text')) qData.readingText = item.querySelector('.q-reading-text').value;
        if(item.querySelector('.q-spelling-word')) qData.spellingWord = item.querySelector('.q-spelling-word').value;
        if(item.querySelector('.q-full-word')) qData.fullWord = item.querySelector('.q-full-word').value;
        if(item.querySelector('.q-missing-word')) qData.missingWord = item.querySelector('.q-missing-word').value;
        
        questions.push(qData);
    });

    // ... (حفظ في LocalStorage - نفس الكود السابق)
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const newTest = { id: Date.now(), teacherId: getCurrentUser().id, title, subject, questions, createdAt: new Date().toISOString() };
    tests.push(newTest);
    localStorage.setItem('tests', JSON.stringify(tests));
    closeCreateTestModal();
    loadTests();
}

// ... (باقي دوال الحذف والتحميل والربط كما هي في الردود السابقة) ...
function deleteTest(id) { /* ... */ }
function linkObjectives(id) { /* ... */ }
function saveLinking() { /* ... */ }
function loadObjectives() { /* ... */ }
function saveObjective() { /* ... */ }
function deleteObjective(id) { /* ... */ }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function loadTests() { /* كود التحميل السابق */ }
function showCreateTestModal() { /* كود الفتح */ document.getElementById('createTestModal').classList.add('show'); document.getElementById('questionsContainer').innerHTML=''; addQuestion(); }
function closeCreateTestModal() { document.getElementById('createTestModal').classList.remove('show'); }
function closeLinkObjectivesModal() { document.getElementById('linkObjectivesModal').classList.remove('show'); }
function loadLessons() { /* ... */ }

// ============================================
// 📁 المسار: assets/js/content-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('testsGrid')) {
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    loadTests();
    loadLessons();
    loadObjectives();
}

// ==========================================
// 1. إدارة الاختبارات (الكود المصحح)
// ==========================================

function loadTests() {
    const testsGrid = document.getElementById('testsGrid');
    if (!testsGrid) return;

    try {
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const currentTeacher = getCurrentUser();
        // تصفية اختبارات المعلم الحالي
        const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);

        if (teacherTests.length === 0) {
            testsGrid.innerHTML = `
                <div class="empty-content-state" style="grid-column: 1/-1; text-align:center; padding: 30px;">
                    <div style="font-size: 3rem; margin-bottom:15px;">📝</div>
                    <h3>لا توجد اختبارات مضافة</h3>
                    <p class="text-muted">ابدأ بإنشاء اختبارك الأول الآن</p>
                    <button class="btn btn-success mt-3" onclick="showCreateTestModal()">+ إنشاء اختبار جديد</button>
                </div>`;
            return;
        }

        testsGrid.innerHTML = teacherTests.map(test => {
            const qCount = test.questions ? test.questions.length : 0;
            const desc = test.description || '';
            const date = test.createdAt ? new Date(test.createdAt).toLocaleDateString('ar-SA') : '-';
            
            return `
            <div class="content-card">
                <div class="content-header">
                    <h4 title="${test.title}">${test.title}</h4>
                    <span class="content-badge subject-${test.subject}">${test.subject}</span>
                </div>
                <div class="content-body">
                    <p class="text-muted small" style="min-height:40px;">${desc.substring(0, 50)}${desc.length>50?'...':''}</p>
                    <div class="content-meta">
                        <span class="questions-count">❓ ${qCount} أسئلة</span>
                        <span class="date-badge">📅 ${date}</span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})" title="تعديل"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="btn btn-sm btn-secondary" onclick="linkObjectives(${test.id})" title="ربط الأهداف"><i class="fas fa-link"></i> ربط</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})" title="حذف"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading tests:", e);
        testsGrid.innerHTML = '<div class="alert alert-danger">حدث خطأ في عرض الاختبارات. يرجى مراجعة وحدة التحكم (Console).</div>';
    }
}

// دالة الحفظ (تم إصلاحها لتتجنب الأخطاء عند قراءة الحقول الجديدة)
function saveTest() {
    try {
        const editId = document.getElementById('editTestId').value;
        const title = document.getElementById('testTitle').value;
        const subject = document.getElementById('testSubject').value;
        const desc = document.getElementById('testDescription').value;
        
        if (!title) { alert('عنوان الاختبار مطلوب'); return; }

        const questions = [];
        const questionItems = document.querySelectorAll('#questionsContainer .question-item');

        if(questionItems.length === 0) { alert('يجب إضافة سؤال واحد على الأقل'); return; }

        questionItems.forEach(item => {
            const typeSelect = item.querySelector('.question-type');
            const type = typeSelect ? typeSelect.value : 'multiple-choice';
            
            const textInput = item.querySelector('.q-text');
            const text = textInput ? textInput.value : 'سؤال';
            
            const scoreInput = item.querySelector('.passing-score');
            const score = scoreInput ? parseInt(scoreInput.value) : 5;
            
            let qData = {
                id: Date.now() + Math.random(),
                type: type,
                text: text,
                passingScore: score,
                objectiveId: null // سيتم الربط لاحقاً
            };
            
            // جمع البيانات الفرعية (باستخدام الفحص الآمن ?.)
            
            // 1. الخيارات
            const choiceInputs = item.querySelectorAll('.q-choice');
            if(choiceInputs.length > 0) {
                qData.choices = Array.from(choiceInputs).map(c => c.value);
            }

            // 2. المرفقات (media)
            const mediaInput = item.querySelector('.q-media');
            if(mediaInput) qData.mediaUrl = mediaInput.value;

            // 3. نصوص القراءة
            const readingInput = item.querySelector('.q-reading-text');
            if(readingInput) qData.readingText = readingInput.value;

            // 4. كلمات الإملاء / الكلمة الكاملة
            const fullWordInput = item.querySelector('.q-full-word') || item.querySelector('.q-spelling-word');
            if(fullWordInput) {
                qData.fullWord = fullWordInput.value;
                qData.spellingWord = fullWordInput.value;
            }

            // 5. الكلمة الناقصة
            const missingWordInput = item.querySelector('.q-missing-word');
            if(missingWordInput) qData.missingWord = missingWordInput.value;

            // 6. عناصر السحب
            const dragInput = item.querySelector('.q-drag-items');
            if(dragInput) qData.dragItems = dragInput.value;

            // 7. الإجابة النموذجية
            const modelAnsInput = item.querySelector('.q-model-answer');
            if(modelAnsInput) qData.modelAnswer = modelAnsInput.value;

            questions.push(qData);
        });

        // عملية الحفظ في LocalStorage
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const currentTeacher = getCurrentUser();

        const newTest = {
            id: editId ? parseInt(editId) : Date.now(),
            teacherId: currentTeacher.id,
            title: title,
            subject: subject,
            description: desc,
            questions: questions,
            createdAt: new Date().toISOString()
        };

        if (editId) {
            const index = tests.findIndex(t => t.id == editId);
            if(index !== -1) tests[index] = newTest;
        } else {
            tests.push(newTest);
        }

        localStorage.setItem('tests', JSON.stringify(tests));
        
        closeCreateTestModal();
        loadTests(); // إعادة تحميل الشبكة
        showAuthNotification('تم حفظ الاختبار بنجاح', 'success');

    } catch (e) {
        console.error("Save Error:", e);
        alert('حدث خطأ أثناء الحفظ. تأكد من تعبئة جميع الحقول المطلوبة.');
    }
}

// -----------------------------------------------------
// بقية الدوال المساعدة (إضافة سؤال، عرض الحقول، الخ)
// -----------------------------------------------------

function showCreateTestModal() {
    document.getElementById('testModalTitle').textContent = 'إنشاء اختبار تشخيصي جديد';
    document.getElementById('editTestId').value = ''; 
    document.getElementById('createTestForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    addQuestion(); // إضافة سؤال افتراضي
    document.getElementById('createTestModal').classList.add('show');
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
}

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    addQuestionToContainer(container, 'السؤال');
}

function addQuestionToContainer(container, labelPrefix, existingData = null) {
    const index = container.children.length;
    const typeVal = existingData ? existingData.type : 'multiple-choice';
    const scoreVal = existingData ? (existingData.passingScore || 5) : 5;
    
    const questionHTML = `
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
                <div class="form-group" style="width:100px;">
                    <label style="color:#e67e22; font-size:0.8rem;">درجة الاجتياز</label>
                    <input type="number" class="form-control passing-score" value="${scoreVal}" min="1">
                </div>
            </div>

            <div class="question-inputs-area" style="background:#f8f9fa; padding:10px; border-radius:5px;"></div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
    const newSelect = container.lastElementChild.querySelector('.question-type');
    renderQuestionInputs(newSelect, index, existingData);
}

function renderQuestionInputs(selectElement, index, data = null) {
    const type = selectElement.value;
    const area = selectElement.parentElement.parentElement.parentElement.querySelector('.question-inputs-area');
    const textVal = data ? data.text : '';
    let html = '';
    
    if (type.includes('multiple-choice')) {
        const choices = data?.choices || ['', '', ''];
        html = `
            ${type.includes('media') ? `<div class="form-group mb-2"><label>رابط المرفق</label><input type="text" class="form-control q-media" value="${data?.mediaUrl || ''}" placeholder="رابط صورة/فيديو"></div>` : ''}
            <div class="form-group mb-2"><label>نص السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
            <label>الخيارات</label>
            ${choices.map((c, i) => `<input type="text" class="form-control mb-1 q-choice" value="${c}" placeholder="الخيار ${i+1}">`).join('')}
        `;
    } 
    else if (type === 'drag-drop') {
        html = `<div class="form-group mb-2"><label>السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <div class="form-group"><label>العناصر (مفصولة بفاصلة)</label><input type="text" class="form-control q-drag-items" value="${data?.dragItems || ''}"></div>`;
    }
    else if (type === 'open-ended') {
        html = `<div class="form-group mb-2"><label>السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <div class="form-group"><label>الإجابة النموذجية</label><textarea class="form-control q-model-answer">${data?.modelAnswer || ''}</textarea></div>`;
    }
    else if (type.includes('reading')) {
        html = `<div class="form-group mb-2"><label>التعليمات</label><input type="text" class="form-control q-text" value="${textVal}" placeholder="اقرأ النص..."></div>
                <div class="form-group"><label>النص المقروء</label><textarea class="form-control q-reading-text">${data?.readingText || ''}</textarea></div>`;
    }
    else if (type.includes('spelling') || type === 'missing-letter') {
        html = `<div class="form-group mb-2"><label>التعليمات</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <div class="form-group"><label>${type === 'missing-letter' ? 'الكلمة الكاملة' : 'الكلمة المسموعة'}</label><input type="text" class="form-control q-full-word" value="${data?.fullWord || data?.spellingWord || ''}"></div>
                ${type === 'missing-letter' ? `<div class="form-group mt-2"><label>الكلمة ناقصة (_)</label><input type="text" class="form-control q-missing-word" value="${data?.missingWord || ''}"></div>` : ''}`;
    }

    area.innerHTML = html;
}

function editTest(id) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === id);
    if (!test) return;

    document.getElementById('testModalTitle').textContent = 'تعديل الاختبار';
    document.getElementById('editTestId').value = test.id;
    document.getElementById('testTitle').value = test.title;
    document.getElementById('testSubject').value = test.subject;
    document.getElementById('testDescription').value = test.description || '';
    
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    if (test.questions && test.questions.length > 0) {
        test.questions.forEach(q => addQuestionToContainer(container, 'سؤال', q));
    } else {
        addQuestion();
    }
    document.getElementById('createTestModal').classList.add('show');
}

function deleteTest(id) {
    if(!confirm('هل أنت متأكد من الحذف؟')) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    localStorage.setItem('tests', JSON.stringify(tests.filter(t => t.id !== id)));
    loadTests();
}

// الدوال المساعدة للأهداف والدروس
function loadObjectives() { /* (كما هي في الكود السابق) */ }
function loadLessons() { /* (كما هي في الكود السابق) */ }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function showAuthNotification(msg, type) { alert(msg); }

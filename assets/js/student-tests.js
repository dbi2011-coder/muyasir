// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;
let canvases = {};
let currentQuestionIndex = 0;
let selectedWord = null; // للموبايل (النقر ثم النقر)

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('allTestsList')) loadAllTests();
});

// ... (دوال التحميل loadAllTests, openTestFocusMode, viewCompletedTest نفس السابق) ...
// لتوفير المساحة سأركز على الجزء الذي تغير جذرياً وهو renderQuestions ومنطق السحب

function loadAllTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;
    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    let myTests = studentTests.filter(t => t.studentId === currentStudent.id);
    
    if (myTests.length === 0) { container.innerHTML = `<div class="empty-state"><h3>لا توجد اختبارات</h3></div>`; return; }
    
    container.innerHTML = myTests.map(assignment => {
        const tDetails = allTests.find(t => t.id === assignment.testId);
        if (!tDetails) return '';
        
        let status = assignment.status === 'pending' ? 'جديد' : (assignment.status === 'completed' ? 'منجز' : 'جاري');
        let btnAction = assignment.status === 'completed' ? 
            `<button class="btn btn-primary btn-sm" onclick="viewCompletedTest(${assignment.id})">عرض</button>` : 
            `<button class="btn btn-success btn-block" onclick="openTestFocusMode(${assignment.id})">ابدأ / استكمال</button>`;

        return `
            <div class="test-card">
                <div class="card-header"><h3>${tDetails.title}</h3><span>${status}</span></div>
                <div class="card-actions">${btnAction}</div>
            </div>`;
    }).join('');
}

function openTestFocusMode(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testDetails = allTests.find(t => t.id === assignment.testId);

    currentTestId = assignmentId;
    currentOriginalTest = testDetails;
    currentQuestionIndex = 0;

    document.getElementById('focusTestTitle').textContent = testDetails.title;
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
    document.getElementById('testFocusMode').style.display = 'flex';
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    document.getElementById('testFooterControls').innerHTML = `
        <button id="btnPrev" class="btn-nav btn-prev" onclick="navigateQuestion(-1)">السابق</button>
        <button id="btnSave" class="btn-nav btn-save" onclick="saveTestProgress()">حفظ</button>
        <button id="btnNext" class="btn-nav btn-next" onclick="navigateQuestion(1)">التالي</button>
        <button id="btnSubmit" class="btn-nav btn-submit" style="display:none;" onclick="submitTestAnswers()">تسليم</button>
    `;
    renderQuestions(false);
    showQuestion(0);
}

function viewCompletedTest(assignmentId) {
    openTestFocusMode(assignmentId);
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').innerHTML = `<button class="btn-nav btn-submit" onclick="closeTestFocusMode()">خروج</button>`;
    document.getElementById('testFooterControls').style.display = 'flex';
    renderQuestions(true);
    showQuestion(0);
}

// ==========================================
// منطق العرض والسحب والإفلات (تم التحديث)
// ==========================================

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    canvases = {};

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === currentTestId);
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const savedAns = answers.find(a => a.questionId === q.id)?.answer;
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `card_q_${index}`;
        
        let html = `<div class="question-number">سؤال ${index+1}</div>`;

        // 1. منطق السحب والإفلات الجديد
        if (q.type === 'drag-drop') {
            // تحليل النص: استخراج الكلمات بين {}
            // النص المخزن: "عاصمة السعودية {الرياض} وتقع في {نجد}"
            const regex = /\{([^}]+)\}/g;
            let parts = q.text.split(regex); // يقسم النص بناء على الأقواس
            let matches = [...q.text.matchAll(regex)].map(m => m[1]); // الكلمات الصحيحة
            
            // تجهيز الإجابات المحفوظة (عبارة عن كائن { "zone0": "word", "zone1": "word" })
            let savedMap = savedAns ? (typeof savedAns === 'string' ? JSON.parse(savedAns) : savedAns) : {};

            // أ. إنشاء بنك الكلمات (Word Bank)
            // نأخذ الكلمات ونبعثرها
            let wordsPool = [...matches]; 
            if(!isReadOnly) wordsPool.sort(() => Math.random() - 0.5);

            html += `<div class="drag-instructions alert alert-info small">اسحب الكلمة وضعها في الفراغ المناسب (أو اضغط عليها ثم اضغط الفراغ).</div>`;
            
            // منطقة الكلمات
            html += `<div class="word-bank" id="bank_${index}">`;
            wordsPool.forEach((word, i) => {
                // التحقق إذا كانت الكلمة مستخدمة بالفعل في إجابة محفوظة، لا نعرضها في البنك
                const isUsed = Object.values(savedMap).includes(word);
                if (!isUsed && !isReadOnly) {
                    html += createDraggableItem(word, index);
                }
            });
            html += `</div>`;

            // ب. إنشاء الجملة مع الفراغات
            html += `<div class="sentence-area" style="line-height: 2.5; font-size: 1.2rem;">`;
            
            let gapCounter = 0;
            // إعادة بناء الجملة
            // parts[0] هو نص قبل القوس، parts[1] هو الكلمة داخل القوس (التي تم تقسيمها بواسطة split لكن split مع capturing group تبقي الفاصل)
            // الطريقة الأسهل: تقسيم النص الأصلي واستبدال {} بفراغات
            
            // سنقوم بتقسيم النص الأصلي بشكل يدوي لضمان الترتيب
            let sentenceHtml = q.text.replace(/\{([^}]+)\}/g, (match, word) => {
                const zoneId = `zone_${index}_${gapCounter}`;
                const filledWord = savedMap[zoneId] || '';
                
                let content = '';
                if (filledWord) {
                    // إذا كان هناك كلمة محفوظة في الفراغ
                    content = createDraggableItem(filledWord, index, true); 
                }
                
                gapCounter++;
                return `<span class="drop-zone" id="${zoneId}" ondragover="allowDrop(event)" ondrop="handleDrop(event, ${index})" onclick="handleClickDrop('${zoneId}', ${index})">${content}</span>`;
            });
            
            html += sentenceHtml;
            html += `</div>`;
            
            // حقل مخفي لتجميع الإجابة كـ JSON string عند الحفظ
            html += `<input type="hidden" id="input_q_${index}" value='${JSON.stringify(savedMap)}'>`;

        } 
        // 2. باقي الأنواع (كما هي)
        else if (q.type.includes('multiple-choice')) {
            html += `<h3 class="question-text">${q.text}</h3>`;
            q.choices.forEach((c, i) => {
                const checked = savedAns == i ? 'checked' : '';
                html += `<label class="answer-option ${checked ? 'selected' : ''}" onclick="selectOption(this)"><input type="radio" name="q_${index}" value="${i}" ${checked} ${isReadOnly?'disabled':''}> ${c}</label>`;
            });
        }
        else {
            // fallback لباقي الأنواع
            html += `<h3 class="question-text">${q.text}</h3><input type="text" class="form-control" name="q_${index}" value="${savedAns||''}" ${isReadOnly?'disabled':''}>`;
        }

        card.innerHTML = html;
        container.appendChild(card);
    });
}

// ==========================================
// دوال السحب والإفلات (Drag & Drop Logic)
// ==========================================

function createDraggableItem(word, qIndex, isPlaced = false) {
    // ننشئ العنصر كـ HTML string
    return `<span class="draggable-word" draggable="true" ondragstart="handleDragStart(event, '${word}', ${qIndex})" onclick="handleClickWord(this, '${word}', ${qIndex})">${word}</span>`;
}

function handleDragStart(ev, word, qIndex) {
    ev.dataTransfer.setData("text", word);
    ev.dataTransfer.setData("qIndex", qIndex);
    ev.dataTransfer.setData("originId", ev.target.parentElement.id); // معرف المكان الذي سحبنا منه
}

function allowDrop(ev) {
    ev.preventDefault();
}

function handleDrop(ev, qIndex) {
    ev.preventDefault();
    const word = ev.dataTransfer.getData("text");
    const dragQIndex = ev.dataTransfer.getData("qIndex");
    
    // التأكد من أننا نسحب داخل نفس السؤال
    if (String(dragQIndex) !== String(qIndex)) return;

    const dropZone = ev.target.closest('.drop-zone');
    const bank = document.getElementById(`bank_${qIndex}`);

    if (dropZone) {
        // إذا كان الفراغ ممتلئاً بالفعل، نعيد الكلمة الموجودة فيه للبنك
        if (dropZone.children.length > 0) {
            const existingWord = dropZone.innerText;
            bank.innerHTML += createDraggableItem(existingWord, qIndex);
            dropZone.innerHTML = '';
        }
        
        // وضع الكلمة الجديدة في الفراغ
        dropZone.innerHTML = createDraggableItem(word, qIndex, true);
        
        // إزالة الكلمة من مصدرها القديم (البنك أو فراغ آخر)
        // (يتم ذلك تلقائياً في HTML5 drag لكننا نحتاج لتحديث البيانات)
        
        // تحديث البيانات المخفية
        updateDragDropData(qIndex);
        
        // تنظيف البنك من الكلمة المسحوبة (لأننا أضفناها HTML string جديد في الفراغ)
        // الطريقة الأبسط: إعادة رسم السؤال، لكن لتجربة سلسة سنحذف العنصر الذي بدأ السحب
        // ملاحظة: HTML5 drop لا يحذف المصدر تلقائياً إذا قمنا بـ innerHTML +=
        // الحل العملي هنا: تحديث "حالة" السؤال كاملة هو الأسلم، لكن سنجرب الحذف اليدوي
        // حالياً سنعتمد على أن المتصفح قد لا يحذف المصدر، لذا يجب أن نبحث عن الكلمة في البنك ونخفيها
        const sourceItems = bank.querySelectorAll('.draggable-word');
        sourceItems.forEach(item => {
            if (item.innerText === word) item.remove();
        });
    }
}

// --- دعم النقر (Click to Select) للموبايل ---
function handleClickWord(el, word, qIndex) {
    // إذا كانت الكلمة في البنك أو في فراغ
    if (selectedWord && selectedWord.element === el) {
        // إلغاء التحديد
        el.classList.remove('selected-word');
        selectedWord = null;
        return;
    }
    
    // إزالة تحديد سابق
    document.querySelectorAll('.draggable-word').forEach(d => d.classList.remove('selected-word'));
    
    // تحديد جديد
    el.classList.add('selected-word');
    selectedWord = { element: el, word: word, qIndex: qIndex };
}

function handleClickDrop(zoneId, qIndex) {
    if (!selectedWord || String(selectedWord.qIndex) !== String(qIndex)) return;
    
    const dropZone = document.getElementById(zoneId);
    const bank = document.getElementById(`bank_${qIndex}`);
    
    // 1. إذا الفراغ ممتلئ، أعد الكلمة القديمة للبنك
    if (dropZone.children.length > 0) {
        const oldWord = dropZone.innerText;
        bank.innerHTML += createDraggableItem(oldWord, qIndex);
        dropZone.innerHTML = '';
    }
    
    // 2. ضع الكلمة المختارة في الفراغ
    dropZone.innerHTML = createDraggableItem(selectedWord.word, qIndex, true);
    
    // 3. احذف الكلمة من مكانها الأصلي
    selectedWord.element.remove();
    
    // 4. تنظيف
    selectedWord = null;
    updateDragDropData(qIndex);
}

function updateDragDropData(qIndex) {
    // نجمع كل الفراغات وما بداخلها
    const container = document.getElementById(`card_q_${qIndex}`);
    const zones = container.querySelectorAll('.drop-zone');
    let data = {};
    
    zones.forEach(z => {
        if (z.children.length > 0) {
            data[z.id] = z.innerText; // حفظ الكلمة الموجودة في الفراغ
        }
    });
    
    document.getElementById(`input_q_${qIndex}`).value = JSON.stringify(data);
}

// ==========================================
// دوال التجميع والحفظ
// ==========================================
function collectAnswers() {
    const answers = [];
    currentOriginalTest.questions.forEach((q, index) => {
        let val = null;
        if (q.type === 'drag-drop') {
            // القيمة موجودة كـ JSON string في الحقل المخفي
            val = document.getElementById(`input_q_${index}`)?.value;
        } else if (q.type.includes('multiple-choice')) {
            const sel = document.querySelector(`input[name="q_${index}"]:checked`);
            val = sel ? sel.value : null;
        } else {
            val = document.querySelector(`[name="q_${index}"]`)?.value;
        }
        answers.push({ questionId: q.id, answer: val });
    });
    return answers;
}

// ... (بقية دوال التنقل والحفظ showQuestion, navigateQuestion, saveTestProgress, submitTestAnswers, closeTestFocusMode, getCurrentUser... انسخها من الردود السابقة فهي لم تتغير) ...
function showQuestion(i){ const total=currentOriginalTest.questions.length; document.querySelectorAll('.question-card').forEach(c=>c.classList.remove('active')); document.getElementById(`card_q_${i}`).classList.add('active'); document.getElementById('questionCounter').textContent=`${i+1}/${total}`; const n=document.getElementById('btnNext'); const p=document.getElementById('btnPrev'); const s=document.getElementById('btnSubmit'); if(p)p.disabled=(i===0); if(i===total-1){ if(n)n.style.display='none'; if(s)s.style.display='inline-block'; }else{ if(n)n.style.display='inline-block'; if(s)s.style.display='none'; } currentQuestionIndex=i; }
function navigateQuestion(d){ const n=currentQuestionIndex+d; if(n>=0 && n<currentOriginalTest.questions.length) showQuestion(n); }
function saveTestProgress(){ const ans=collectAnswers(); const tests=JSON.parse(localStorage.getItem('studentTests')); const i=tests.findIndex(t=>t.id===currentTestId); tests[i].savedAnswers=ans; tests[i].status='in-progress'; localStorage.setItem('studentTests',JSON.stringify(tests)); closeTestFocusMode(); loadAllTests(); }
function submitTestAnswers(){ if(!confirm('تسليم؟'))return; const ans=collectAnswers(); const tests=JSON.parse(localStorage.getItem('studentTests')); const i=tests.findIndex(t=>t.id===currentTestId); tests[i].answers=ans; tests[i].status='completed'; tests[i].completedAt=new Date().toISOString(); tests[i].score=0; localStorage.setItem('studentTests',JSON.stringify(tests)); closeTestFocusMode(); loadAllTests(); alert('تم التسليم'); }
function closeTestFocusMode(){ document.getElementById('testFocusMode').style.display='none'; document.body.style.overflow='auto'; }
function selectOption(l){ l.parentElement.querySelectorAll('.answer-option').forEach(x=>x.classList.remove('selected')); l.classList.add('selected'); l.querySelector('input').checked=true; }
function getCurrentUser(){ return JSON.parse(sessionStorage.getItem('currentUser')).user; }

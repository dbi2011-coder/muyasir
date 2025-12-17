// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;
let canvases = {};
let currentQuestionIndex = 0;
let selectedWord = null; 

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('allTestsList')) loadAllTests();
});

function loadAllTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;
    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    let myTests = studentTests.filter(t => t.studentId === currentStudent.id);
    
    if (myTests.length === 0) { container.innerHTML = `<div class="empty-state"><h3>لا توجد اختبارات</h3></div>`; return; }
    
    // الترتيب: المعاد > الجاري > الجديد > المنجز
    myTests.sort((a, b) => {
        const p = { 'returned': 1, 'in-progress': 2, 'pending': 3, 'completed': 4 };
        return p[a.status] - p[b.status];
    });

    container.innerHTML = myTests.map(assignment => {
        const tDetails = allTests.find(t => t.id === assignment.testId);
        if (!tDetails) return '';
        
        let status = 'جديد', badge = 'status-new', btn = '🚀 ابدأ';
        if(assignment.status==='in-progress') { status='جاري'; badge='status-progress'; btn='🔄 استكمال'; }
        if(assignment.status==='returned') { status='معاد'; badge='status-returned'; btn='✏️ تعديل'; }
        if(assignment.status==='completed') { status='منجز'; badge='status-completed'; btn='👁️ عرض'; }

        let action = assignment.status === 'completed' ? 
            `<button class="btn btn-primary btn-block" onclick="viewCompletedTest(${assignment.id})">${btn}</button>` :
            `<button class="btn btn-success btn-block" onclick="openTestFocusMode(${assignment.id})">${btn}</button>`;

        return `
            <div class="test-card">
                <div class="card-header"><h3 class="card-title">${tDetails.title}</h3><span class="card-status ${badge}">${status}</span></div>
                <div class="card-meta"><span>${tDetails.questions?.length||0} أسئلة</span></div>
                <div class="card-actions">${action}</div>
            </div>`;
    }).join('');
}

function openTestFocusMode(assignmentId) {
    const assignment = JSON.parse(localStorage.getItem('studentTests')).find(t => t.id === assignmentId);
    const test = JSON.parse(localStorage.getItem('tests')).find(t => t.id === assignment.testId);
    
    currentTestId = assignmentId; currentOriginalTest = test; currentQuestionIndex = 0;
    
    document.getElementById('focusTestTitle').textContent = test.title;
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
    document.getElementById('testFooterControls').style.display = 'flex';
    document.getElementById('testFooterControls').innerHTML = `<button class="btn-nav btn-submit" onclick="closeTestFocusMode()">خروج</button>`;
    renderQuestions(true);
    showQuestion(0);
}

function renderQuestions(isReadOnly = false) {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    const assignment = JSON.parse(localStorage.getItem('studentTests')).find(t => t.id === currentTestId);
    const answers = assignment.status === 'completed' ? assignment.answers : (assignment.savedAnswers || []);

    currentOriginalTest.questions.forEach((q, index) => {
        const savedAns = answers.find(a => a.questionId === q.id)?.answer;
        const note = answers.find(a => a.questionId === q.id)?.teacherNote;
        
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `card_q_${index}`;
        
        let html = `<div class="question-number">سؤال ${index+1}</div>`;
        if(note) html += `<div class="alert alert-warning">📝 ملاحظة: ${note}</div>`;
        
        // --- Drag & Drop Type ---
        if (q.type === 'drag-drop') {
            const regex = /\{([^}]+)\}/g;
            let matches = [...q.text.matchAll(regex)].map(m => m[1]);
            let savedMap = savedAns ? (typeof savedAns==='string'?JSON.parse(savedAns):savedAns) : {};

            if(!isReadOnly) {
                let wordsPool = matches.filter(w => !Object.values(savedMap).includes(w));
                wordsPool.sort(()=>Math.random()-0.5);
                html += `<div class="word-bank" id="bank_${index}">`;
                wordsPool.forEach(w => html += createDraggableItem(w, index));
                html += `</div>`;
            }

            html += `<div class="sentence-area">`;
            let gapCounter = 0;
            html += q.text.replace(/\{([^}]+)\}/g, (m, w) => {
                const zoneId = `zone_${index}_${gapCounter++}`;
                const filled = savedMap[zoneId] || '';
                const content = filled ? createDraggableItem(filled, index, true) : '';
                // إضافة الأحداث (Events) للفراغ
                return `<span class="drop-zone" id="${zoneId}" 
                        ondragover="allowDrop(event)" 
                        ondrop="handleDrop(event, ${index})" 
                        onclick="handleClickDrop('${zoneId}', ${index})">${content}</span>`;
            });
            html += `</div><input type="hidden" id="input_q_${index}" value='${JSON.stringify(savedMap)}'>`;
        } 
        // --- Other Types ---
        else if (q.type.includes('multiple-choice')) {
            html += `<h3 class="question-text">${q.text}</h3>`;
            q.choices?.forEach((c, i) => {
                const checked = savedAns == i ? 'checked' : '';
                html += `<label class="answer-option ${checked?'selected':''}" onclick="${!isReadOnly?'selectOption(this)':''}"><input type="radio" name="q_${index}" value="${i}" ${checked} ${isReadOnly?'disabled':''}> ${c}</label>`;
            });
        }
        else {
             html += `<h3 class="question-text">${q.text}</h3><textarea class="form-control" name="q_${index}" ${isReadOnly?'disabled':''}>${savedAns||''}</textarea>`;
        }
        card.innerHTML = html;
        container.appendChild(card);
    });
}

// --- Drag & Drop Helpers ---
function createDraggableItem(word, qIndex, placed=false) {
    return `<span class="draggable-word" draggable="true" ondragstart="handleDragStart(event, '${word}', ${qIndex})" onclick="handleClickWord(this, '${word}', ${qIndex})">${word}</span>`;
}
function handleDragStart(ev, word, qIndex) { ev.dataTransfer.setData("text", word); ev.dataTransfer.setData("qIndex", qIndex); }
function allowDrop(ev) { ev.preventDefault(); ev.target.closest('.drop-zone').classList.add('drag-over'); }
function handleDrop(ev, qIndex) {
    ev.preventDefault();
    const zone = ev.target.closest('.drop-zone');
    zone.classList.remove('drag-over');
    const word = ev.dataTransfer.getData("text");
    if(ev.dataTransfer.getData("qIndex") != qIndex) return;
    
    // إذا الفراغ ممتلئ، أعد الكلمة القديمة
    const bank = document.getElementById(`bank_${qIndex}`);
    if(zone.children.length > 0) bank.innerHTML += createDraggableItem(zone.innerText, qIndex);
    
    zone.innerHTML = createDraggableItem(word, qIndex, true);
    
    // حذف من المصدر (البنك)
    const bankItems = bank.querySelectorAll('.draggable-word');
    bankItems.forEach(i => { if(i.innerText === word) i.remove(); });
    
    updateDragData(qIndex);
}
// Mobile Click Logic
function handleClickWord(el, word, qIndex) {
    if(selectedWord && selectedWord.el === el) { el.classList.remove('selected-word'); selectedWord=null; return; }
    document.querySelectorAll('.selected-word').forEach(x=>x.classList.remove('selected-word'));
    el.classList.add('selected-word'); selectedWord = {el, word, qIndex};
}
function handleClickDrop(zoneId, qIndex) {
    if(!selectedWord || selectedWord.qIndex !== qIndex) return;
    const zone = document.getElementById(zoneId);
    const bank = document.getElementById(`bank_${qIndex}`);
    
    if(zone.children.length > 0) bank.innerHTML += createDraggableItem(zone.innerText, qIndex);
    zone.innerHTML = createDraggableItem(selectedWord.word, qIndex, true);
    selectedWord.el.remove();
    selectedWord = null;
    updateDragData(qIndex);
}
function updateDragData(idx) {
    const zones = document.getElementById(`card_q_${idx}`).querySelectorAll('.drop-zone');
    let d = {}; zones.forEach(z => { if(z.innerText) d[z.id]=z.innerText; });
    document.getElementById(`input_q_${idx}`).value = JSON.stringify(d);
}

// --- Common ---
function showQuestion(i) {
    document.querySelectorAll('.question-card').forEach(c=>c.classList.remove('active'));
    document.getElementById(`card_q_${i}`).classList.add('active');
    document.getElementById('questionCounter').textContent = `س${i+1}`;
    const tot = currentOriginalTest.questions.length;
    document.getElementById('btnPrev').disabled = i===0;
    if(i===tot-1) { 
        if(document.getElementById('btnNext')) document.getElementById('btnNext').style.display='none';
        if(document.getElementById('btnSubmit')) document.getElementById('btnSubmit').style.display='inline-block';
    } else {
        if(document.getElementById('btnNext')) document.getElementById('btnNext').style.display='inline-block';
        if(document.getElementById('btnSubmit')) document.getElementById('btnSubmit').style.display='none';
    }
    currentQuestionIndex = i;
}
function navigateQuestion(d) { showQuestion(currentQuestionIndex+d); }
function selectOption(l) { l.parentElement.querySelectorAll('.answer-option').forEach(x=>x.classList.remove('selected')); l.classList.add('selected'); l.querySelector('input').checked=true; }
function collectAnswers() {
    // Save last drag drop
    if(currentOriginalTest.questions[currentQuestionIndex].type === 'drag-drop') updateDragData(currentQuestionIndex);
    
    return currentOriginalTest.questions.map((q, i) => {
        let v = null;
        if(q.type==='drag-drop') v = document.getElementById(`input_q_${i}`)?.value;
        else if(q.type.includes('multiple')) { const c=document.querySelector(`input[name="q_${i}"]:checked`); v=c?c.value:null; }
        else v = document.querySelector(`[name="q_${i}"]`)?.value;
        return { questionId: q.id, answer: v };
    });
}
function saveTestProgress() {
    const ans = collectAnswers();
    const tests = JSON.parse(localStorage.getItem('studentTests'));
    const t = tests.find(x=>x.id===currentTestId);
    t.savedAnswers = ans; t.status = 'in-progress';
    localStorage.setItem('studentTests', JSON.stringify(tests));
    closeTestFocusMode(); loadAllTests();
}
function submitTestAnswers() {
    if(!confirm('تسليم؟')) return;
    const ans = collectAnswers();
    const tests = JSON.parse(localStorage.getItem('studentTests'));
    const t = tests.find(x=>x.id===currentTestId);
    t.answers = ans; t.status = 'completed'; t.completedAt = new Date().toISOString(); t.score=0;
    localStorage.setItem('studentTests', JSON.stringify(tests));
    closeTestFocusMode(); loadAllTests();
}
function closeTestFocusMode() { document.getElementById('testFocusMode').style.display='none'; document.body.style.overflow='auto'; }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }

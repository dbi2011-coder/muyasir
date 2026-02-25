let currentTestSession = { questions: [], currentIndex: 0, answers: {}, startTime: null };

function initializeTestSession(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    if (!test) return alert('خطأ في تحميل الاختبار');
    currentTestSession = { questions: test.questions, currentIndex: 0, answers: {}, startTime: new Date(), testData: test };
    document.getElementById('startTestModal').classList.remove('show');
    showTestInterface(); renderCurrentQuestion();
}

function showTestInterface() {
    const testUI = document.createElement('div');
    testUI.id = 'activeTestUI'; testUI.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f4f6f9; z-index:10000; display:flex; flex-direction:column;';
    testUI.innerHTML = `<div style="background:white; padding:15px; display:flex; justify-content:space-between; box-shadow:0 2px 10px rgba(0,0,0,0.1);"><h3>${currentTestSession.testData.title}</h3><div id="testTimer">00:00</div></div><div id="questionDisplayArea" style="flex:1; padding:40px; overflow-y:auto;"></div><div style="background:white; padding:15px; text-align:center;"><button class="btn btn-primary" onclick="nextQuestion()">التالي ⬅</button></div>`;
    document.body.appendChild(testUI);
    startTimer();
}

function renderCurrentQuestion() {
    const q = currentTestSession.questions[currentTestSession.currentIndex];
    let html = `<div style="background:white; padding:20px; border-radius:10px; margin-bottom:20px;"><h4>${q.text}</h4>`;
    if(q.type === 'multiple-choice') {
        q.data.choices.forEach((c, i) => html += `<label style="display:block; padding:10px; border:1px solid #ddd; margin:5px; border-radius:5px; cursor:pointer;"><input type="radio" name="ans" value="${i}" onchange="saveAnswer('${i}')"> ${c}</label>`);
    } else if(q.type === 'true-false') {
        html += `<label style="display:block; padding:10px; border:1px solid #ddd; margin:5px;"><input type="radio" name="ans" value="true" onchange="saveAnswer('true')"> صواب</label><label style="display:block; padding:10px; border:1px solid #ddd; margin:5px;"><input type="radio" name="ans" value="false" onchange="saveAnswer('false')"> خطأ</label>`;
    } else {
        html += `<input type="text" class="form-control" placeholder="اكتب الإجابة..." onkeyup="saveAnswer(this.value)">`;
    }
    html += `</div>`;
    document.getElementById('questionDisplayArea').innerHTML = html;
}

function saveAnswer(val) { currentTestSession.answers[currentTestSession.currentIndex] = val; }
function nextQuestion() {
    if (currentTestSession.currentIndex < currentTestSession.questions.length - 1) { currentTestSession.currentIndex++; renderCurrentQuestion(); } 
    else { finishTest(); }
}

function finishTest() {
    if(!confirm('تسليم؟')) return;
    let score = 0, total = 0, failedObjs = [];
    currentTestSession.questions.forEach((q, i) => {
        total += q.passingScore || 10;
        const ans = currentTestSession.answers[i];
        let correct = false;
        if(q.type === 'multiple-choice' && ans == q.data.correctIndex) correct = true;
        if(q.type === 'true-false' && ans == q.data.correctValue) correct = true;
        if(q.type === 'spelling-auto' && ans && ans.trim() === q.text.trim()) correct = true;
        
        if(correct) score += q.passingScore || 10;
        else if(currentTestSession.testData.objectivesLinked) failedObjs.push(currentTestSession.testData.linkedObjectiveId);
    });
    
    const pct = Math.round((score/total)*100);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.testId === currentTestSession.testData.id && t.studentId === getCurrentUser().id);
    if(idx !== -1) {
        studentTests[idx].status = 'completed'; studentTests[idx].score = pct; studentTests[idx].completedDate = new Date().toISOString();
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
    }
    document.getElementById('activeTestUI').remove();
    if(pct < 80) generateAutoIEP(failedObjs);
    else { alert(`النتيجة: ${pct}%`); location.reload(); }
}

function startTimer() {
    let s = 0; setInterval(() => { s++; document.getElementById('testTimer').innerText = `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }, 1000);
}

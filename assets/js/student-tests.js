// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات التشخيصية للطالب - واجهة كلاسيكية أصلية مع ربط Supabase
// ============================================

let currentTestSession = { questions: [], currentIndex: 0, answers: {}, startTime: null, testData: null };
let currentAssignment = null;
let testTimerInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    // نضع تأخير بسيط (100 مللي ثانية) لضمان تحميل مكتبة Supabase وملف الاتصال (auth.js) أولاً
    setTimeout(async () => {
        await loadMyTests();
    }, 100);
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

async function loadMyTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) return;

    // التحقق من أن Supabase تم تهيئته بشكل صحيح
    if (!window.supabase) {
        console.error("Supabase is not initialized!");
        container.innerHTML = '<div class="alert alert-danger text-center">خطأ في الاتصال بقاعدة البيانات. تأكد من استدعاء Supabase.</div>';
        return;
    }

    try {
        container.innerHTML = '<div class="text-center p-4">جاري التحميل...</div>';

        // جلب الاختبارات المسندة للطالب من السحابة
        const { data: myTests, error } = await window.supabase
            .from('student_tests')
            .select('*')
            .eq('studentId', currentUser.id)
            .order('assignedDate', { ascending: false });

        if (error) throw error;

        if (!myTests || myTests.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #777;"><h3>لا توجد اختبارات حالياً</h3></div>`;
            return;
        }

        // جلب تفاصيل الاختبارات الأصلية من السحابة
        const { data: allTestsLib } = await window.supabase.from('tests').select('id, title, questions');

        container.innerHTML = myTests.map(assignment => {
            const originalTest = allTestsLib.find(t => t.id == assignment.testId);
            if (!originalTest) return '';

            let statusText = 'جديد', statusClass = 'status-new', btnText = 'بدء الاختبار', btnClass = 'btn-primary';
            
            if (assignment.status === 'completed') { 
                statusText = 'مكتمل'; statusClass = 'status-completed'; btnText = 'تم الحل'; btnClass = 'btn-secondary'; 
            } 

            return `
                <div class="test-card" style="background:#fff; padding:20px; border-radius:10px; border:1px solid #eee; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span class="badge ${statusClass}">${statusText}</span>
                        <small>${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</small>
                    </div>
                    <h3>${originalTest.title}</h3>
                    <div style="display:flex; justify-content:space-between; margin-top:20px;">
                        <span class="badge badge-secondary">${originalTest.questions?.length || 0} أسئلة</span>
                        <button class="btn btn-sm ${btnClass}" ${assignment.status === 'completed' ? 'disabled' : `onclick="initializeTestSession(${assignment.id})"`}>${btnText}</button>
                    </div>
                </div>`;
        }).join('');
    } catch(e) { 
        console.error(e); 
        container.innerHTML = '<div class="alert alert-danger text-center">حدث خطأ غير متوقع أثناء تحميل البيانات.</div>';
    }
}

// =========================================================
// 🔥 واجهة الاختبار الأصلية الكلاسيكية (من الكود القديم تماماً) 🔥
// =========================================================

async function initializeTestSession(assignmentId) {
    try {
        const { data: assignment } = await window.supabase.from('student_tests').select('*').eq('id', assignmentId).single();
        const { data: test } = await window.supabase.from('tests').select('*').eq('id', assignment.testId).single();
        
        currentAssignment = assignment;
        currentTestSession = { 
            questions: test.questions || [], 
            currentIndex: 0, 
            answers: {}, 
            startTime: new Date(), 
            testData: test 
        };
        
        showTestInterface(); 
        renderCurrentQuestion();
    } catch (e) { console.error(e); }
}

function showTestInterface() {
    let oldUI = document.getElementById('activeTestUI');
    if(oldUI) oldUI.remove();

    const testUI = document.createElement('div');
    testUI.id = 'activeTestUI'; 
    testUI.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f4f6f9; z-index:10000; display:flex; flex-direction:column; direction:rtl; font-family:"Tajawal", sans-serif;';
    
    testUI.innerHTML = `
        <div style="background:white; padding:15px; display:flex; justify-content:space-between; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h3>${currentTestSession.testData.title}</h3>
            <div id="testTimer" style="font-weight:bold; color:red;">00:00</div>
        </div>
        <div id="questionDisplayArea" style="flex:1; padding:40px; overflow-y:auto; display:flex; justify-content:center;"></div>
        <div style="background:white; padding:15px; text-align:center; box-shadow:0 -2px 10px rgba(0,0,0,0.05);">
            <button class="btn btn-primary" style="padding:10px 40px; font-size:1.1rem; font-weight:bold;" onclick="nextQuestion()">التالي ⬅</button>
        </div>`;
        
    document.body.appendChild(testUI);
    startTimer();
}

function renderCurrentQuestion() {
    const q = currentTestSession.questions[currentTestSession.currentIndex];
    const qType = q.type || 'multiple-choice';
    
    let html = `<div style="background:white; padding:30px; border-radius:10px; margin-bottom:20px; width:100%; max-width:700px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <h4 style="margin-bottom:25px; font-size:1.4rem; color:#333;">${q.text}</h4>`;
    
    let choices = q.choices || (q.data && q.data.choices) || [];
    
    if(qType === 'multiple-choice' || qType === 'mcq') {
        choices.forEach((c, i) => {
            html += `<label style="display:block; padding:15px; border:1px solid #ddd; margin:10px 0; border-radius:5px; cursor:pointer; font-size:1.1rem; background:#fafafa;">
                        <input type="radio" name="ans" value="${i}" onchange="saveAnswer('${i}')" style="margin-left:10px; transform:scale(1.2);"> ${c}
                     </label>`;
        });
    } else if(qType === 'true-false') {
        html += `<label style="display:block; padding:15px; border:1px solid #ddd; margin:10px 0; border-radius:5px; cursor:pointer; font-size:1.1rem; background:#fafafa;">
                    <input type="radio" name="ans" value="true" onchange="saveAnswer('true')" style="margin-left:10px; transform:scale(1.2);"> صواب
                 </label>
                 <label style="display:block; padding:15px; border:1px solid #ddd; margin:10px 0; border-radius:5px; cursor:pointer; font-size:1.1rem; background:#fafafa;">
                    <input type="radio" name="ans" value="false" onchange="saveAnswer('false')" style="margin-left:10px; transform:scale(1.2);"> خطأ
                 </label>`;
    } else {
        html += `<input type="text" class="form-control" style="padding:15px; font-size:1.1rem;" placeholder="اكتب الإجابة..." onkeyup="saveAnswer(this.value)" onchange="saveAnswer(this.value)">`;
    }
    
    html += `</div>`;
    document.getElementById('questionDisplayArea').innerHTML = html;
}

function saveAnswer(val) { 
    currentTestSession.answers[currentTestSession.currentIndex] = val; 
}

function nextQuestion() {
    if (currentTestSession.currentIndex < currentTestSession.questions.length - 1) { 
        currentTestSession.currentIndex++; 
        renderCurrentQuestion(); 
    } 
    else { 
        finishTest(); 
    }
}

async function finishTest() {
    if(!confirm('تسليم؟')) return;
    
    let score = 0;
    let total = 0;
    let failedObjs = [];
    let formattedAnswers = [];

    // التصحيح ومطابقة الإجابات
    currentTestSession.questions.forEach((q, i) => {
        let maxQScore = parseFloat(q.passingScore || q.maxScore || 10);
        total += maxQScore;
        
        const ans = currentTestSession.answers[i];
        let correct = false;
        
        let correctIdx = q.correctAnswer !== undefined ? q.correctAnswer : (q.data && q.data.correctIndex);
        let correctVal = q.correctAnswer !== undefined ? q.correctAnswer : (q.data && q.data.correctValue);

        if((q.type === 'multiple-choice' || q.type === 'mcq') && ans == correctIdx) correct = true;
        if(q.type === 'true-false' && ans == correctVal) correct = true;
        if((q.type === 'spelling-auto' || q.type === 'open-ended') && ans && ans.trim() === q.text.trim()) correct = true;
        
        let earnedScore = correct ? maxQScore : 0;
        if(correct) score += earnedScore;
        
        // التقاط الأهداف المخفقة (كما في كودك القديم) لتوليد الخطة الفردية
        if(!correct) {
            if(q.linkedGoalId) failedObjs.push(q.linkedGoalId);
            else if(currentTestSession.testData.objectivesLinked) failedObjs.push(currentTestSession.testData.linkedObjectiveId);
        }

        formattedAnswers.push({
            questionId: q.id,
            answer: ans,
            score: earnedScore
        });
    });
    
    const pct = total > 0 ? Math.round((score/total)*100) : 0;
    
    try {
        // تحديث حالة الاختبار في السحابة
        await window.supabase.from('student_tests').update({
            status: 'completed',
            score: pct,
            answers: formattedAnswers,
            completedDate: new Date().toISOString()
        }).eq('id', currentAssignment.id);

        clearInterval(testTimerInterval);
        document.getElementById('activeTestUI').remove();
        
        // تشغيل دالة توليد الخطة التلقائية إذا كانت النتيجة أقل من 80
        if(pct < 80 && failedObjs.length > 0 && typeof generateAutoIEP === 'function') {
            generateAutoIEP(failedObjs);
        } else { 
            alert(`تم التسليم! النتيجة: ${pct}%`); 
            window.location.reload(); 
        }
    } catch(e) {
        console.error(e);
        alert('حدث خطأ أثناء إرسال النتيجة للسحابة');
    }
}

function startTimer() {
    let s = 0; 
    clearInterval(testTimerInterval);
    testTimerInterval = setInterval(() => { 
        s++; 
        let timerDiv = document.getElementById('testTimer');
        if(timerDiv) timerDiv.innerText = `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; 
    }, 1000);
}

// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات التشخيصية للطالب - واجهة أصلية مع ربط Supabase
// ============================================

let currentTestSession = { questions: [], currentIndex: 0, answers: {}, startTime: null, testData: null };
let currentAssignment = null;
let testTimerInterval = null;

// تهيئة Supabase (بافتراض أنك قمت بتهيئة window.supabase في ملف رئيسي مثل auth.js أو main.js)
const supabase = window.supabase; 

document.addEventListener('DOMContentLoaded', async function() {
    await loadMyTests();
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

async function loadMyTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
         container.innerHTML = '<div class="alert alert-danger text-center">يرجى تسجيل الدخول لعرض الاختبارات</div>';
         return;
    }

    try {
        container.innerHTML = '<div class="text-center p-4">جاري التحميل...</div>';

        // 1. جلب اختبارات الطالب من Supabase
        const { data: studentTests, error: stError } = await supabase
            .from('student_tests')
            .select('*')
            .eq('studentId', currentUser.id)
            .order('assignedDate', { ascending: false });

        if (stError) throw stError;

        if (!studentTests || studentTests.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #777;"><h3>لا توجد اختبارات حالياً</h3></div>`;
            return;
        }

        // 2. جلب تفاصيل الاختبارات (الأسئلة وغيرها) من Supabase
        const testIds = studentTests.map(t => t.testId);
        const { data: allTestsLib, error: tError } = await supabase
            .from('tests')
            .select('id, title, questions, objectivesLinked, linkedObjectiveId')
            .in('id', testIds);

        if (tError) throw tError;

        // 3. عرض البطاقات
        container.innerHTML = studentTests.map(assignment => {
            const originalTest = allTestsLib.find(t => t.id == assignment.testId);
            if (!originalTest) return '';

            let statusText = 'جديد', statusClass = 'status-new', btnText = 'بدء الاختبار', btnClass = 'btn-primary';
            
            if (assignment.status === 'completed') { 
                statusText = 'مكتمل'; statusClass = 'status-completed'; btnText = 'تم الحل'; btnClass = 'btn-secondary'; 
            } 

            // استخدام JSON.stringify لتمرير البيانات كمعامل للدالة بأمان
            const assignmentDataStr = JSON.stringify(assignment).replace(/"/g, '&quot;');
            const testDataStr = JSON.stringify(originalTest).replace(/"/g, '&quot;');

            return `
                <div class="test-card" style="background:#fff; padding:20px; border-radius:10px; border:1px solid #eee; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span class="badge ${statusClass}">${statusText}</span>
                        <small>${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</small>
                    </div>
                    <h3>${originalTest.title}</h3>
                    <div style="display:flex; justify-content:space-between; margin-top:20px;">
                        <span class="badge badge-secondary">${originalTest.questions?.length || 0} أسئلة</span>
                        <button class="btn btn-sm ${btnClass}" 
                                ${assignment.status === 'completed' ? 'disabled' : `onclick="initializeTestSession(${assignmentDataStr}, ${testDataStr})"`}>
                                ${btnText}
                        </button>
                    </div>
                </div>`;
        }).join('');
    } catch(e) { 
        console.error("Error loading tests:", e); 
        container.innerHTML = '<div class="alert alert-danger text-center">حدث خطأ أثناء جلب البيانات. الرجاء المحاولة لاحقاً.</div>';
    }
}

// =========================================================
// 🔥 بدء جلسة الاختبار (نفس الشكل القديم)
// =========================================================

function initializeTestSession(assignmentData, testData) {
    if (!testData || !testData.questions || testData.questions.length === 0) {
        alert('هذا الاختبار لا يحتوي على أسئلة.');
        return;
    }

    currentAssignment = assignmentData;
    currentTestSession = { 
        questions: testData.questions, 
        currentIndex: 0, 
        answers: {}, 
        startTime: new Date(), 
        testData: testData 
    };
    
    // إخفاء أي نوافذ مفتوحة
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.classList.remove('show'));

    showTestInterface(); 
    renderCurrentQuestion();
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
    
    // منع التمرير في الخلفية
    document.body.style.overflow = 'hidden'; 
    
    startTimer();
}

function renderCurrentQuestion() {
    const q = currentTestSession.questions[currentTestSession.currentIndex];
    
    // التوافقية مع البيانات القديمة والجديدة:
    // في النظام القديم كان النوع يسمى multiple-choice، الآن mcq
    // في النظام القديم كان يسمى true-false
    // في النظام القديم كان يسمى spelling-auto
    const qType = q.type || 'multiple-choice'; 
    
    let html = `<div style="background:white; padding:30px; border-radius:10px; margin-bottom:20px; width:100%; max-width:700px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <h4 style="margin-bottom:25px; font-size:1.4rem; color:#333;">${q.text}</h4>`;
    
    // جلب الخيارات سواء كانت في الجذر (النسخة الجديدة) أو داخل data (النسخة القديمة)
    let choices = q.choices || (q.data && q.data.choices) || [];
    
    // الخيارات المتعددة
    if(qType === 'multiple-choice' || qType === 'mcq') {
        choices.forEach((c, i) => {
            html += `<label style="display:block; padding:15px; border:1px solid #ddd; margin:10px 0; border-radius:5px; cursor:pointer; font-size:1.1rem; background:#fafafa;">
                        <input type="radio" name="ans" value="${i}" onchange="saveAnswer('${i}')" style="margin-left:10px; transform:scale(1.2);"> ${c}
                     </label>`;
        });
    } 
    // الصح والخطأ
    else if(qType === 'true-false') {
        html += `<label style="display:block; padding:15px; border:1px solid #ddd; margin:10px 0; border-radius:5px; cursor:pointer; font-size:1.1rem; background:#fafafa;">
                    <input type="radio" name="ans" value="true" onchange="saveAnswer('true')" style="margin-left:10px; transform:scale(1.2);"> صواب
                 </label>
                 <label style="display:block; padding:15px; border:1px solid #ddd; margin:10px 0; border-radius:5px; cursor:pointer; font-size:1.1rem; background:#fafafa;">
                    <input type="radio" name="ans" value="false" onchange="saveAnswer('false')" style="margin-left:10px; transform:scale(1.2);"> خطأ
                 </label>`;
    } 
    // الأسئلة النصية (إملاء، إكمال فراغ، أسئلة مفتوحة)
    else {
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

// =========================================================
// 🔥 إنهاء الاختبار والتصحيح وحفظ البيانات في Supabase 🔥
// =========================================================

async function finishTest() {
    if(!confirm('هل أنت متأكد من تسليم الإجابات وإنهاء الاختبار؟')) return;
    
    // إظهار رسالة تحميل لمنع الطالب من الضغط المتكرر
    const activeTestUI = document.getElementById('activeTestUI');
    if (activeTestUI) {
        activeTestUI.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; flex-direction:column;">
            <div class="loading-spinner" style="margin-bottom:20px;"></div>
            <h3 style="color:#007bff;">جاري تصحيح الاختبار وحفظ النتيجة...</h3>
        </div>`;
    }

    let score = 0;
    let total = 0;
    let failedObjs = [];
    let formattedAnswers = [];

    // عملية التصحيح
    currentTestSession.questions.forEach((q, i) => {
        // تحديد الدرجة العظمى للسؤال
        let maxQScore = parseFloat(q.passingScore || q.maxScore || q.points || 10);
        total += maxQScore;
        
        const ans = currentTestSession.answers[i];
        let correct = false;
        
        // تحديد الإجابة الصحيحة (دعم للبيانات القديمة والجديدة)
        let correctIdx = q.correctAnswer !== undefined ? q.correctAnswer : (q.data && q.data.correctIndex);
        let correctVal = q.correctAnswer !== undefined ? q.correctAnswer : (q.data && q.data.correctValue);

        const qType = q.type || 'multiple-choice';

        // التصحيح حسب نوع السؤال
        if((qType === 'multiple-choice' || qType === 'mcq') && ans == correctIdx) {
            correct = true;
        }
        else if(qType === 'true-false' && ans == correctVal) {
            correct = true;
        }
        else if((qType === 'spelling-auto' || qType === 'open-ended') && ans && ans.trim() === q.text.trim()) {
            correct = true;
        }
        
        let earnedScore = correct ? maxQScore : 0;
        if(correct) score += earnedScore;
        
        // تسجيل الأهداف التي أخفق فيها الطالب لتوليد الخطة العلاجية (IEP)
        if(!correct) {
            if(q.linkedGoalId) failedObjs.push(q.linkedGoalId);
            else if(currentTestSession.testData.objectivesLinked) failedObjs.push(currentTestSession.testData.linkedObjectiveId);
        }

        // تحضير مصفوفة الإجابات لتخزينها في Supabase
        formattedAnswers.push({
            questionId: q.id,
            answer: ans || null,
            score: earnedScore
        });
    });
    
    // حساب النسبة المئوية
    const pct = total > 0 ? Math.round((score/total)*100) : 0;
    
    try {
        // تحديث السجل في Supabase
        const { error } = await supabase
            .from('student_tests')
            .update({
                status: 'completed',
                score: pct,
                answers: formattedAnswers,
                completedDate: new Date().toISOString()
            })
            .eq('id', currentAssignment.id);

        if (error) throw error;

        // إيقاف المؤقت وإزالة واجهة الاختبار
        clearInterval(testTimerInterval);
        if(document.getElementById('activeTestUI')) {
            document.getElementById('activeTestUI').remove();
        }
        
        // إعادة تفعيل التمرير
        document.body.style.overflow = 'auto';

        // إنشاء الخطة الفردية تلقائياً إذا كانت النتيجة أقل من 80% (أو كما هو محدد في ملف iep-generator)
        if(pct < 80 && failedObjs.length > 0 && typeof generateAutoIEP === 'function') {
            alert(`تم التسليم! نتيجتك هي ${pct}%. سيتم الآن إعداد خطة علاجية مخصصة لك.`);
            // ملاحظة: دالة generateAutoIEP في ملف iep-generator.js يجب أن تكون محدثة لدعم Supabase أيضاً
            generateAutoIEP(failedObjs); 
        } else { 
            alert(`أحسنت! تم التسليم. النتيجة: ${pct}%`); 
            window.location.reload(); 
        }

    } catch(e) {
        console.error("Error saving test results:", e);
        alert('حدث خطأ أثناء إرسال النتيجة إلى السحابة. يرجى إبلاغ المعلم.');
        
        // في حالة الخطأ، نخرج الطالب من الواجهة حتى لا يعلق
        if(document.getElementById('activeTestUI')) {
            document.getElementById('activeTestUI').remove();
        }
        document.body.style.overflow = 'auto';
        clearInterval(testTimerInterval);
    }
}

function startTimer() {
    let s = 0; 
    clearInterval(testTimerInterval);
    testTimerInterval = setInterval(() => { 
        s++; 
        let timerDiv = document.getElementById('testTimer');
        if(timerDiv) {
            timerDiv.innerText = `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; 
        }
    }, 1000);
}

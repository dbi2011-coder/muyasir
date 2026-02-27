// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات - واجهة الاختبار الأصلية (سؤال بسؤال) متصلة مع Supabase
// ============================================

let currentAssignment = null;
let userAnswers = [];
let currentTestSession = { questions: [], currentIndex: 0, testData: null };
let testTimerInterval = null;

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
        container.innerHTML = '<div class="text-center p-4">جاري تحميل اختباراتك...</div>';

        const { data: myTests, error } = await window.supabase
            .from('student_tests')
            .select('*')
            .eq('studentId', currentUser.id)
            .order('assignedDate', { ascending: false });

        if (error) throw error;

        if (!myTests || myTests.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;">
                <h3>📭 لا توجد اختبارات مسندة إليك حالياً</h3>
            </div>`;
            return;
        }

        const { data: allTestsLib } = await window.supabase.from('tests').select('id, title, questions');

        container.innerHTML = myTests.map(assignment => {
            const originalTest = allTestsLib.find(t => t.id == assignment.testId);
            if (!originalTest) return '';

            let statusText = 'جديد', statusClass = 'status-new', btnText = 'بدء الاختبار', btnClass = 'btn-primary';
            
            if (assignment.status === 'in-progress') { 
                statusText = 'جاري الحل'; statusClass = 'status-progress'; btnText = 'متابعة الحل'; btnClass = 'btn-warning'; 
            } else if (assignment.status === 'completed') { 
                statusText = 'تم التسليم'; statusClass = 'status-completed'; btnText = '🔍 عرض النتيجة والمراجعة'; btnClass = 'btn-success'; 
            } else if (assignment.status === 'returned') { 
                statusText = 'معاد للتعديل'; statusClass = 'status-returned'; btnText = 'تعديل الإجابة'; btnClass = 'btn-danger'; 
            }

            return `
                <div class="test-card" style="background:#fff; padding:20px; border-radius:10px; border:1px solid #eee; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <div class="card-header" style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span class="card-status badge ${statusClass}">${statusText}</span>
                        <small>${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</small>
                    </div>
                    <h3>${originalTest.title}</h3>
                    <div class="mt-3 d-flex justify-content-between align-items-center" style="display:flex; justify-content:space-between; margin-top:20px;">
                        <span class="badge badge-secondary" style="background:#eee; padding:5px 10px; border-radius:5px; color:#333;">${originalTest.questions?.length || 0} أسئلة</span>
                        <button class="btn btn-sm ${btnClass}" onclick="openTestMode(${assignment.id})" style="padding:8px 15px; border:none; border-radius:5px; cursor:pointer;">${btnText}</button>
                    </div>
                </div>`;
        }).join('');
    } catch(e) {
        console.error("Error loading tests:", e);
        container.innerHTML = '<div class="alert alert-danger text-center">حدث خطأ أثناء تحميل الاختبارات</div>';
    }
}

// ---------------------------------------------------------
// 🔥 واجهة الاختبار الأصلية (student-test-engine) 🔥
// ---------------------------------------------------------

async function openTestMode(assignmentId) {
    try {
        const { data: assignment } = await window.supabase.from('student_tests').select('*').eq('id', assignmentId).single();
        if (!assignment) return alert('لم يتم العثور على بيانات الاختبار');
        
        const { data: test } = await window.supabase.from('tests').select('*').eq('id', assignment.testId).single();
        if (!test) return alert('نموذج الاختبار الأصلي غير موجود');

        currentAssignment = assignment;
        userAnswers = currentAssignment.answers || [];
        
        currentTestSession = { 
            questions: test.questions, 
            currentIndex: 0, 
            testData: test 
        };

        if (currentAssignment.status === 'completed') {
            alert('أنت الآن في وضع المراجعة. لا يمكنك التعديل على الإجابات.');
        }

        showTestInterface();
        renderCurrentQuestion();
    } catch (e) { 
        console.error(e); 
        alert('حدث خطأ أثناء تهيئة الاختبار.');
    }
}

function showTestInterface() {
    let existingUI = document.getElementById('activeTestUI');
    if (existingUI) existingUI.remove();

    const testUI = document.createElement('div');
    testUI.id = 'activeTestUI'; 
    testUI.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f4f6f9; z-index:100000; display:flex; flex-direction:column; font-family:"Tajawal", sans-serif; direction:rtl;';
    
    testUI.innerHTML = `
        <div style="background:white; padding:15px 20px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,0.1); z-index:10;">
            <h3 style="margin:0; color:#333;">${currentTestSession.testData.title}</h3>
            <div style="display:flex; align-items:center; gap:15px;">
                <div id="testTimer" style="font-weight:bold; font-size:1.2rem; color:#d32f2f; background:#ffebee; padding:5px 15px; border-radius:20px; display:${currentAssignment.status==='completed'?'none':'block'};">00:00</div>
                <button class="btn btn-sm btn-outline-danger" onclick="closeTestInterface()" style="border-radius:5px; padding:8px 15px; border:1px solid #dc3545; background:white; color:#dc3545; cursor:pointer; font-weight:bold;">خروج ✕</button>
            </div>
        </div>
        <div id="questionDisplayArea" style="flex:1; padding:40px 20px; overflow-y:auto; display:flex; flex-direction:column; align-items:center;">
        </div>
        <div style="background:white; padding:15px; text-align:center; box-shadow:0 -2px 10px rgba(0,0,0,0.05); z-index:10; display:flex; justify-content:center; gap:15px;">
            <button class="btn btn-secondary btn-lg" id="prevQuestionBtn" onclick="prevQuestion()" style="min-width:120px; padding:12px; font-weight:bold; border-radius:8px; border:none; cursor:pointer; background:#eceff1; color:#333; display:none;">السابق ➡</button>
            <button class="btn btn-primary btn-lg" id="nextQuestionBtn" onclick="nextQuestion()" style="min-width:200px; padding:12px; font-weight:bold; border-radius:8px; border:none; cursor:pointer; background:#007bff; color:white;">التالي ⬅</button>
        </div>
    `;
    
    document.body.appendChild(testUI);
    document.body.style.overflow = 'hidden';
    
    if (currentAssignment.status !== 'completed') {
        startTimer();
    }
}

function renderCurrentQuestion() {
    const q = currentTestSession.questions[currentTestSession.currentIndex];
    const isReadOnly = (currentAssignment.status === 'completed');
    
    let savedAns = userAnswers.find(a => a.questionId == q.id);
    let ansValue = savedAns ? savedAns.answer : null;
    
    // إذا كانت الإجابة محفوظة كـ JSON (للأسئلة المتقدمة)
    if (typeof ansValue === 'string' && ansValue.startsWith('{')) {
        try { ansValue = JSON.parse(ansValue); } catch(e){}
    }

    let html = `<div style="background:white; padding:30px; border-radius:15px; margin-bottom:20px; width:100%; max-width:800px; box-shadow:0 4px 15px rgba(0,0,0,0.05); border:1px solid #eee;">`;
    
    html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div style="color:#1565c0; font-weight:bold; background:#e3f2fd; padding:5px 15px; border-radius:20px;">سؤال ${currentTestSession.currentIndex + 1} من ${currentTestSession.questions.length}</div>
             </div>`;
             
    html += `<h4 style="font-size:1.5rem; line-height:1.6; margin-bottom:25px; color:#222;">${q.text || 'أجب عن السؤال التالي:'}</h4>`;

    if (q.attachment && q.attachment.startsWith('data:image')) {
        html += `<div style="text-align:center; margin-bottom:25px;"><img src="${q.attachment}" style="max-width:100%; max-height:250px; border-radius:10px; border:1px solid #ddd;"></div>`;
    }

    const qType = q.type || '';

    // 1. خيارات متعددة (النمط الأصلي القديم يدعم mcq و multiple-choice)
    if (qType === 'multiple-choice' || qType === 'mcq' || qType === 'mcq-media') {
        const choices = q.choices || (q.data && q.data.choices) || [];
        choices.forEach((c, i) => {
            const isChecked = (ansValue == i) ? 'checked' : '';
            const disabled = isReadOnly ? 'disabled' : '';
            const bgColor = isChecked ? '#e3f2fd' : '#fafafa';
            const borderColor = isChecked ? '#2196f3' : '#ddd';

            html += `<label style="display:block; padding:15px; border:2px solid ${borderColor}; margin:10px 0; border-radius:8px; cursor:pointer; font-size:1.2rem; background:${bgColor}; transition:0.2s;" onclick="if(!${isReadOnly}) updateRadioStyle(this)">
                        <input type="radio" name="ans" value="${i}" onchange="saveAnswer('${i}')" ${isChecked} ${disabled} style="transform:scale(1.3); margin-left:15px;"> ${c}
                     </label>`;
        });
    } 
    // 2. صح وخطأ (النسخة القديمة)
    else if (qType === 'true-false') {
        const trueChecked = (ansValue === 'true' || ansValue === true || ansValue == 0) ? 'checked' : '';
        const falseChecked = (ansValue === 'false' || ansValue === false || ansValue == 1) ? 'checked' : '';
        const disabled = isReadOnly ? 'disabled' : '';

        const trueBg = trueChecked ? '#e3f2fd' : '#fafafa'; const trueBorder = trueChecked ? '#2196f3' : '#ddd';
        const falseBg = falseChecked ? '#e3f2fd' : '#fafafa'; const falseBorder = falseChecked ? '#2196f3' : '#ddd';

        html += `
            <label style="display:block; padding:15px; border:2px solid ${trueBorder}; margin:10px 0; border-radius:8px; cursor:pointer; font-size:1.2rem; background:${trueBg}; transition:0.2s;" onclick="if(!${isReadOnly}) updateRadioStyle(this)">
                <input type="radio" name="ans" value="true" onchange="saveAnswer('true')" ${trueChecked} ${disabled} style="transform:scale(1.3); margin-left:15px;"> صواب
            </label>
            <label style="display:block; padding:15px; border:2px solid ${falseBorder}; margin:10px 0; border-radius:8px; cursor:pointer; font-size:1.2rem; background:${falseBg}; transition:0.2s;" onclick="if(!${isReadOnly}) updateRadioStyle(this)">
                <input type="radio" name="ans" value="false" onchange="saveAnswer('false')" ${falseChecked} ${disabled} style="transform:scale(1.3); margin-left:15px;"> خطأ
            </label>`;
    } 
    // 3. الحرف الناقص
    else if (qType === 'missing-char') {
        (q.paragraphs || []).forEach((p, pIdx) => {
            let savedChar = (ansValue && ansValue[`p_${pIdx}`]) ? ansValue[`p_${pIdx}`] : '';
            html += `<div style="display:flex; align-items:center; justify-content:center; gap:15px; font-size:1.8rem; background:#fafafa; padding:20px; border-radius:10px; border:1px solid #eee; margin-bottom:15px;">
               <span>${p.text}</span>
               <input type="text" maxlength="1" class="form-control text-center" style="width:60px; height:60px; font-size:1.8rem; font-weight:bold; border:2px solid #2196f3; border-radius:8px;" value="${savedChar}" onchange="saveComplexAnswer('p_${pIdx}', this.value)" ${isReadOnly ? 'disabled' : ''}>
            </div>`;
        });
    }
    // 4. السؤال المفتوح الافتراضي
    else {
        const disabled = isReadOnly ? 'readonly style="background:#f1f5f9;"' : '';
        html += `<input type="text" class="form-control" style="font-size:1.2rem; padding:15px; width:100%; border:2px solid #ccc; border-radius:8px;" placeholder="اكتب الإجابة هنا..." onkeyup="saveAnswer(this.value)" onchange="saveAnswer(this.value)" value="${ansValue || ''}" ${disabled}>`;
    }

    html += `</div>`;
    document.getElementById('questionDisplayArea').innerHTML = html;

    // تحديث أزرار التنقل (السابق والتالي)
    const nextBtn = document.getElementById('nextQuestionBtn');
    const prevBtn = document.getElementById('prevQuestionBtn');
    
    if (currentTestSession.currentIndex === 0) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }

    if (currentTestSession.currentIndex === currentTestSession.questions.length - 1) {
        nextBtn.innerHTML = isReadOnly ? 'إغلاق المراجعة ✖' : 'تسليم الاختبار ✅';
        nextBtn.style.background = isReadOnly ? '#6c757d' : '#28a745';
    } else {
        nextBtn.innerHTML = 'التالي ⬅';
        nextBtn.style.background = '#007bff';
    }
}

// دالة تجميلية لتغيير لون الخيار عند النقر
window.updateRadioStyle = function(label) {
    const parent = label.parentElement;
    parent.querySelectorAll('label').forEach(lbl => {
        lbl.style.background = '#fafafa';
        lbl.style.borderColor = '#ddd';
    });
    label.style.background = '#e3f2fd';
    label.style.borderColor = '#2196f3';
}

function saveAnswer(val) {
    if(currentAssignment.status === 'completed') return;
    const qId = currentTestSession.questions[currentTestSession.currentIndex].id;
    const idx = userAnswers.findIndex(a => a.questionId == qId);
    if(idx !== -1) userAnswers[idx].answer = val;
    else userAnswers.push({ questionId: qId, answer: val });
}

function saveComplexAnswer(key, val) {
    if(currentAssignment.status === 'completed') return;
    const qId = currentTestSession.questions[currentTestSession.currentIndex].id;
    
    let ansIndex = userAnswers.findIndex(a => a.questionId == qId);
    let currentAnsObj = {};

    if (ansIndex !== -1) {
        let existingAns = userAnswers[ansIndex].answer;
        if (typeof existingAns === 'string' && existingAns.startsWith('{')) {
            try { currentAnsObj = JSON.parse(existingAns); } catch(e){}
        } else if (typeof existingAns === 'object' && existingAns !== null) {
            currentAnsObj = existingAns;
        }
    } else {
        ansIndex = userAnswers.length;
        userAnswers.push({ questionId: qId, answer: '' });
    }

    currentAnsObj[key] = val;
    userAnswers[ansIndex].answer = JSON.stringify(currentAnsObj); 
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

function prevQuestion() {
    if (currentTestSession.currentIndex > 0) { 
        currentTestSession.currentIndex--; 
        renderCurrentQuestion(); 
    }
}

async function finishTest() {
    if (currentAssignment.status === 'completed') {
        closeTestInterface();
        return;
    }

    if(!confirm('هل أنت متأكد من رغبتك في تسليم الاختبار نهائياً؟')) return;
    
    const updateData = { 
        answers: userAnswers, 
        status: 'completed',
        completedDate: new Date().toISOString()
    };

    try {
        const { error } = await window.supabase.from('student_tests').update(updateData).eq('id', currentAssignment.id);
        if (error) throw error;

        alert('تم التسليم بنجاح! 🎉 الاختبار الآن بانتظار تصحيح المعلم.');
        closeTestInterface();
    } catch(e) { 
        console.error(e); 
        alert('حدث خطأ في الحفظ!'); 
    }
}

function closeTestInterface() {
    // حفظ مسودة في حالة الخروج قبل الإكمال
    if (currentAssignment && currentAssignment.status !== 'completed') {
        window.supabase.from('student_tests')
            .update({ answers: userAnswers, status: 'in-progress' })
            .eq('id', currentAssignment.id)
            .then(() => console.log('تم حفظ المسودة'));
    }

    const testUI = document.getElementById('activeTestUI');
    if (testUI) testUI.remove();
    document.body.style.overflow = 'auto';
    clearInterval(testTimerInterval);
    loadMyTests();
}

window.closeTestInterface = closeTestInterface;

function startTimer() {
    let s = 0; 
    const timerDisplay = document.getElementById('testTimer');
    clearInterval(testTimerInterval);
    testTimerInterval = setInterval(() => { 
        s++; 
        if(timerDisplay) {
            timerDisplay.innerText = `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; 
        }
    }, 1000);
}

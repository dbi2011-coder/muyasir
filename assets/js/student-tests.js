// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات + دعم شامل للأسئلة القديمة والجديدة بجميع أنواعها التفاعلية
// ============================================

let currentTest = null;
let currentAssignment = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let selectedWordForDrop = null; 

let mediaRecorder = null;
let audioChunks = [];
let activeRecordingId = null;

function injectMobileStyles() {
    if (document.getElementById('mobileTestStyles')) return;
    const style = document.createElement('style');
    style.id = 'mobileTestStyles';
    style.innerHTML = `
        .sentence-area { line-height: 2.8 !important; font-size: 1.25rem !important; padding: 15px !important; word-wrap: break-word; text-align: justify; }
        .drop-zone { display: inline-block !important; min-width: 100px; height: 38px; line-height: 36px !important; vertical-align: bottom; margin: 0 5px; padding: 0 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; background: #f0f0f0; border-bottom: 2px solid #333; text-align: center; }
        .draggable-word { cursor: pointer !important; touch-action: manipulation; transition: all 0.2s ease; display: inline-block; background: #fff; border: 2px solid #c5e1a5; padding: 8px 15px; border-radius: 20px; font-weight: bold; margin: 5px; }
        .selected-word { background: #fff9c4 !important; border-color: #fbc02d !important; transform: scale(1.1); box-shadow: 0 0 15px rgba(253, 216, 53, 0.6) !important; z-index: 10; }
        .answer-option { display: block; padding: 15px; border: 2px solid #eee; margin-bottom: 10px; border-radius: 10px; cursor: pointer; transition: 0.2s; font-size: 1.1rem; }
        .answer-option:hover { background: #f8f9fa; }
        .answer-option.selected { border-color: #2196f3; background: #e3f2fd; }
        .question-card { display: none; background: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto; animation: slideIn 0.3s ease; }
        .question-card.active { display: block; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', async function() {
    injectMobileStyles();
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

async function openTestMode(assignmentId) {
    try {
        const { data: assignment } = await window.supabase.from('student_tests').select('*').eq('id', assignmentId).single();
        if (!assignment) return alert('لم يتم العثور على بيانات الاختبار');
        
        const { data: test } = await window.supabase.from('tests').select('*').eq('id', assignment.testId).single();
        if (!test) return alert('نموذج الاختبار الأصلي غير موجود');

        currentAssignment = assignment;
        currentTest = test;
        userAnswers = currentAssignment.answers || [];
        
        document.getElementById('focusTestTitle').textContent = currentTest.title;
        document.getElementById('testFocusMode').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        document.getElementById('testStartScreen').style.display = 'block';
        document.getElementById('testQuestionsContainer').style.display = 'none';
        document.getElementById('testFooterControls').style.display = 'none';
    } catch (e) { console.error(e); }
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    
    renderAllQuestions(); 
    showQuestion(0);
}

function closeTestMode() {
    document.getElementById('testFocusMode').style.display = 'none';
    document.body.style.overflow = 'auto';
    loadMyTests();
}

// 🔥 الدالة السحرية: تدعم الأسئلة القديمة والجديدة معاً 🔥
function renderAllQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';
    const isReadOnly = (currentAssignment.status === 'completed');

    currentTest.questions.forEach((q, index) => {
        const savedAns = userAnswers.find(a => a.questionId == q.id); 
        let ansValue = savedAns ? savedAns.answer : null;
        if (typeof ansValue === 'string' && ansValue.startsWith('{')) {
            try { ansValue = JSON.parse(ansValue); } catch(e){}
        }

        const qType = q.type || '';
        let qHtml = `
            <div class="question-card" id="q-card-${index}">
                <div class="question-number" style="background:#e3f2fd; color:#1565c0; padding:5px 15px; border-radius:20px; display:inline-block; margin-bottom:15px; font-weight:bold;">سؤال ${index + 1}</div>
                <h3 class="question-text" style="font-size:1.4rem; margin-bottom:25px;">${q.text || 'السؤال:'}</h3>
        `;

        if (q.attachment && q.attachment.startsWith('data:image')) {
            qHtml += `<div style="text-align:center; margin-bottom:20px;"><img src="${q.attachment}" style="max-width:100%; max-height:200px; border-radius:10px; border:1px solid #eee;"></div>`;
        }

        // 1. أسئلة الخيارات (يدعم mcq الجديد و multiple-choice القديم و true-false القديم)
        if (qType.includes('mcq') || qType === 'multiple-choice' || qType === 'true-false') {
            qHtml += `<div class="options-list" style="${isReadOnly ? 'pointer-events: none;' : ''}">`;
            
            let choices = [];
            if (qType === 'true-false') {
                choices = ['صواب', 'خطأ'];
            } else {
                choices = q.choices || (q.data && q.data.choices) || [];
            }

            let savedValueForRadio = ansValue;
            if(qType === 'true-false' && ansValue !== null) {
                savedValueForRadio = (ansValue === 'true' || ansValue === true) ? 0 : 1;
            }

            choices.forEach((choice, i) => {
                const isSel = (savedValueForRadio == i) ? 'background:#e3f2fd; border-color:#2196f3;' : 'background:#fff; border-color:#eee;';
                
                // تحديد القيمة المراد حفظها (رقم الخيار، أو true/false)
                let valToSave = i;
                if(qType === 'true-false') valToSave = (i === 0) ? 'true' : 'false';

                qHtml += `<label class="answer-option" onclick="selectOption(this, ${index}, '${valToSave}')" style="display:block; padding:15px; border:2px solid #eee; margin-bottom:10px; border-radius:10px; cursor:pointer; transition:0.2s; ${isSel}">
                            <input type="radio" name="q_${q.id}" value="${valToSave}" ${savedValueForRadio == i ? 'checked' : ''} style="transform:scale(1.2); margin-left:10px;"> ${choice}
                          </label>`;
            });
            qHtml += `</div>`;
        } 
        // 2. السحب والإفلات
        else if (qType === 'drag-drop') {
            let allGaps = [];
            let paragraphsHtml = '';

            (q.paragraphs || []).forEach((p, pIdx) => {
                let pText = p.text;
                if (p.gaps && p.gaps.length > 0) {
                    p.gaps.forEach((g, gIdx) => {
                        allGaps.push(g.dragItem);
                        let savedWord = (ansValue && ansValue[`p_${pIdx}_g_${gIdx}`]) ? ansValue[`p_${pIdx}_g_${gIdx}`] : '';
                        let dropZone = `<span class="drop-zone" id="dz_${index}_${pIdx}_${gIdx}" onclick="handleDropClick(${index}, ${pIdx}, ${gIdx})" style="${isReadOnly ? 'pointer-events:none;' : ''}">${savedWord}</span>`;
                        pText = pText.replace(g.dragItem, dropZone);
                    });
                }
                paragraphsHtml += `<div class="sentence-area mb-4">${pText}</div>`;
            });

            allGaps = allGaps.sort(() => Math.random() - 0.5);
            let wordBankHtml = `<div class="word-bank" id="wb_${index}" style="${isReadOnly ? 'display:none;' : ''}">`;
            allGaps.forEach(word => {
                wordBankHtml += `<span class="draggable-word" onclick="selectWordToDrop(this, ${index})">${word}</span>`;
            });
            wordBankHtml += `</div>`;

            qHtml += wordBankHtml + paragraphsHtml;
        }
        // 3. الحرف الناقص
        else if (qType === 'missing-char') {
            qHtml += `<div style="display:flex; flex-direction:column; gap:15px; ${isReadOnly ? 'pointer-events: none;' : ''}">`;
            (q.paragraphs || []).forEach((p, pIdx) => {
                let savedChar = (ansValue && ansValue[`p_${pIdx}`]) ? ansValue[`p_${pIdx}`] : '';
                qHtml += `<div style="display:flex; align-items:center; justify-content:center; gap:15px; font-size:1.8rem; background:#fafafa; padding:20px; border-radius:10px; border:1px solid #eee;">
                   <span>${p.text}</span>
                   <input type="text" maxlength="1" class="form-control text-center" style="width:60px; height:60px; font-size:1.8rem; font-weight:bold; border:2px solid #2196f3; border-radius:8px;" value="${savedChar}" onchange="saveComplexAnswer(${index}, 'p_${pIdx}', this.value)" ${isReadOnly ? 'readonly' : ''}>
                </div>`;
            });
            qHtml += `</div>`;
        }
        // 4. القراءة
        else if (qType === 'ai-reading' || qType === 'manual-reading') {
            qHtml += `<div style="display:flex; flex-direction:column; gap:15px;">`;
            (q.paragraphs || []).forEach((p) => {
                qHtml += `<div style="font-size:1.8rem; line-height:2.5; background:#fff9c4; padding:20px; border-radius:10px; text-align:center; border:2px solid #fbc02d; color:#333;">${p.text}</div>`;
            });
            qHtml += `<div class="alert alert-info mt-3 text-center"><i class="fas fa-microphone"></i> يرجى قراءة النص بصوت واضح لمعلمك</div>`;
            qHtml += `<textarea class="form-control mt-2" rows="2" placeholder="اكتب ما قرأته هنا..." onchange="saveSimpleAnswer(${index}, this.value)" ${isReadOnly ? 'readonly' : ''} style="border-radius:10px;">${ansValue || ''}</textarea></div>`;
        }
        // 5. الإملاء (يدعم الجديد والقديم spelling-auto)
        else if (qType.includes('spelling') || qType === 'spelling-auto') {
            qHtml += `<div class="alert alert-info text-center" style="font-size:1.1rem;"><i class="fas fa-headphones"></i> استمع للكلمة واكتبها في الخانة السفلية</div>`;
            
            // دعم النسخة القديمة (spelling-auto)
            if (qType === 'spelling-auto') {
                qHtml += `<input type="text" class="form-control text-center mt-3" style="font-size:1.5rem; padding:15px; border:2px solid #ccc; border-radius:10px;" placeholder="اكتب إجابتك هنا" value="${ansValue || ''}" onchange="saveSimpleAnswer(${index}, this.value)" ${isReadOnly ? 'readonly' : ''}>`;
            } else {
                // النسخة الجديدة (مصفوفة فقرات)
                qHtml += `<div style="display:flex; flex-direction:column; gap:15px; margin-top:20px; ${isReadOnly ? 'pointer-events: none;' : ''}">`;
                (q.paragraphs || []).forEach((p, pIdx) => {
                    let savedSpell = (ansValue && ansValue[`p_${pIdx}`]) ? ansValue[`p_${pIdx}`] : '';
                    qHtml += `<input type="text" class="form-control text-center" style="font-size:1.5rem; padding:15px; border:2px solid #ccc; border-radius:10px;" placeholder="اكتب الكلمة ${pIdx + 1} هنا" value="${savedSpell}" onchange="saveComplexAnswer(${index}, 'p_${pIdx}', this.value)" ${isReadOnly ? 'readonly' : ''}>`;
                });
                qHtml += `</div>`;
            }
        }
        // 6. الأسئلة المفتوحة أو غير المعرفة
        else {
            qHtml += `<textarea class="form-control" rows="4" placeholder="اكتب إجابتك هنا..." onchange="saveSimpleAnswer(${index}, this.value)" ${isReadOnly ? 'readonly' : ''} style="width:100%; padding:15px; border-radius:10px; border:1px solid #ccc; font-size:1.1rem;">${ansValue || ''}</textarea>`;
        }

        qHtml += `</div>`;
        container.insertAdjacentHTML('beforeend', qHtml);
    });
    updateNavigationButtons();
}

// 🔥 دوال مساعدة لأسئلة السحب والإفلات 🔥
function selectWordToDrop(el, qIdx) {
    if(currentAssignment.status === 'completed') return;
    document.querySelectorAll(`#wb_${qIdx} .draggable-word`).forEach(w => w.classList.remove('selected-word'));
    el.classList.add('selected-word');
    selectedWordForDrop = el.innerText;
}

function handleDropClick(qIdx, pIdx, gIdx) {
    if(currentAssignment.status === 'completed') return;
    
    const dz = document.getElementById(`dz_${qIdx}_${pIdx}_${gIdx}`);
    
    if (!selectedWordForDrop) {
        if (dz.innerText !== '') {
            dz.innerText = ''; 
            saveComplexAnswer(qIdx, `p_${pIdx}_g_${gIdx}`, '');
        }
        return;
    }

    dz.innerText = selectedWordForDrop;
    saveComplexAnswer(qIdx, `p_${pIdx}_g_${gIdx}`, selectedWordForDrop);

    document.querySelectorAll('.draggable-word').forEach(w => w.classList.remove('selected-word'));
    selectedWordForDrop = null;
}

function saveComplexAnswer(qIdx, key, val) {
    if(currentAssignment.status === 'completed') return;
    const qId = currentTest.questions[qIdx].id;

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

function selectOption(el, qIdx, choiceVal) {
    if(currentAssignment.status === 'completed') return;
    const card = document.getElementById(`q-card-${qIdx}`);
    card.querySelectorAll('.answer-option').forEach(e => { e.style.background = '#fff'; e.style.borderColor = '#eee'; });
    el.style.background = '#e3f2fd'; el.style.borderColor = '#2196f3';
    el.querySelector('input').checked = true;
    updateUserAnswer(currentTest.questions[qIdx].id, choiceVal);
}

function saveSimpleAnswer(qIdx, val) {
    if(currentAssignment.status === 'completed') return;
    updateUserAnswer(currentTest.questions[qIdx].id, val);
}

function updateUserAnswer(qId, val) {
    if(currentAssignment.status === 'completed') return;
    const idx = userAnswers.findIndex(a => a.questionId == qId);
    if(idx !== -1) userAnswers[idx].answer = val;
    else userAnswers.push({ questionId: qId, answer: val });
}

function showQuestion(index) {
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active'));
    const card = document.getElementById(`q-card-${index}`);
    if(card) {
        card.classList.add('active');
        currentQuestionIndex = index;
        document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${currentTest.questions.length}`;
        updateNavigationButtons();
    }
}

function nextQuestion() { 
    if (currentQuestionIndex < currentTest.questions.length - 1) showQuestion(currentQuestionIndex + 1); 
}
function prevQuestion() { 
    if (currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1); 
}

function updateNavigationButtons() {
    const isLast = currentQuestionIndex === currentTest.questions.length - 1;
    const isReadOnly = (currentAssignment.status === 'completed');

    let actionButtons = isReadOnly ? 
        `<button class="btn-nav" style="background:#6c757d; color:white;" onclick="closeTestMode()">إغلاق المراجعة</button>` : 
        `<button class="btn-nav btn-save" onclick="exitAndSaveTest()">خروج وحفظ مؤقت</button>
         ${isLast ? `<button class="btn-nav btn-submit" onclick="finishTest()">تسليم الاختبار</button>` : ''}`;

    document.getElementById('testFooterControls').innerHTML = `
        <button class="btn-nav btn-prev" onclick="prevQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>السابق</button>
        <div style="display:flex; gap:10px;">
            ${actionButtons}
            ${(!isLast) ? `<button class="btn-nav btn-next" onclick="nextQuestion()">التالي</button>` : ''}
        </div>`;
}

async function saveTestProgress(submit = false) {
    if(currentAssignment.status === 'completed') return;
    
    const updateData = { answers: userAnswers, status: submit ? 'completed' : 'in-progress' };
    if (submit) updateData.completedDate = new Date().toISOString();

    try {
        const { error } = await window.supabase.from('student_tests').update(updateData).eq('id', currentAssignment.id);
        if (error) throw error;

        if(!submit) {
            window.showSuccess('تم حفظ إجاباتك مؤقتاً ✅');
            closeTestMode();
        } else {
            window.showSuccess('تم التسليم بنجاح! 🎉 الاختبار الآن بانتظار تصحيح المعلم.');
            closeTestMode();
        }
    } catch(e) { console.error(e); window.showError('حدث خطأ في الحفظ!'); }
}

function exitAndSaveTest() { saveTestProgress(false); }
function finishTest() {
    window.showConfirmModal('هل أنت متأكد من رغبتك في تسليم الاختبار نهائياً؟ لن تتمكن من التعديل بعد التسليم.', function() {
        saveTestProgress(true);
    });
}

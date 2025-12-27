// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة وعرض اختبارات الطالب
// ============================================

let currentTest = null;      // بيانات الاختبار الأصلي
let currentAssignment = null; // بيانات تعيين الطالب (الإجابات والحالة)
let currentQuestionIndex = 0;
let userAnswers = []; // لتخزين الإجابات المؤقتة

document.addEventListener('DOMContentLoaded', function() {
    loadMyTests();
});

// 1. عرض قائمة الاختبارات في الصفحة الرئيسية
function loadMyTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}').user;
    if (!currentUser) return;

    // جلب الاختبارات المسندة لهذا الطالب
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');

    // تصفية اختبارات الطالب الحالي
    const myTests = allAssignments.filter(t => t.studentId === currentUser.id);

    if (myTests.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📝</div>
                <h3>لا توجد اختبارات متاحة حالياً</h3>
                <p>أنت بطل! لقد أنهيت جميع مهامك، أو لم يقم المعلم بإسناد اختبارات بعد.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const originalTest = allTestsLib.find(t => t.id === assignment.testId);
        if (!originalTest) return ''; // تخطي إذا كان الاختبار الأصلي محذوفاً

        // تحديد الحالة واللون
        let statusText = 'جديد';
        let statusClass = 'status-new';
        let btnText = 'بدء الاختبار';
        let btnClass = 'btn-primary';

        if (assignment.status === 'in-progress') {
            statusText = 'جاري الحل';
            statusClass = 'status-progress';
            btnText = 'متابعة';
            btnClass = 'btn-warning';
        } else if (assignment.status === 'completed') {
            statusText = 'مكتمل';
            statusClass = 'status-completed';
            btnText = 'مراجعة';
            btnClass = 'btn-success';
        } else if (assignment.status === 'returned') {
            statusText = 'معاد للتصحيح';
            statusClass = 'status-returned';
            btnText = 'تعديل الإجابات';
            btnClass = 'btn-danger';
        }

        return `
            <div class="test-card">
                <div class="card-header">
                    <span class="card-status ${statusClass}">${statusText}</span>
                    <small class="text-muted">${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</small>
                </div>
                <h3>${originalTest.title}</h3>
                <p class="text-muted small">${originalTest.description || 'لا يوجد وصف'}</p>
                <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-secondary">${originalTest.questions ? originalTest.questions.length : 0} أسئلة</span>
                    <button class="btn btn-sm ${btnClass}" onclick="openTestMode(${assignment.id})">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// 2. منطق وضع الاختبار (Focus Mode)
// ==========================================

function openTestMode(assignmentId) {
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    
    currentAssignment = allAssignments.find(a => a.id === assignmentId);
    if (!currentAssignment) return;

    currentTest = allTestsLib.find(t => t.id === currentAssignment.testId);
    if (!currentTest) return;

    // تحميل الإجابات السابقة إن وجدت
    userAnswers = currentAssignment.answers || [];

    // إعداد الواجهة
    document.getElementById('focusTestTitle').textContent = currentTest.title;
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // منع التمرير في الخلفية

    // إذا كان مكتمل، اعرض النتائج فقط (Read Only) أو اسمح بالمراجعة حسب المنطق
    if (currentAssignment.status === 'completed') {
        alert('هذا الاختبار مكتمل. سيتم عرضه للمراجعة فقط.');
    }

    // إظهار شاشة البدء أولاً
    document.getElementById('testStartScreen').style.display = 'block';
    document.getElementById('testQuestionsContainer').style.display = 'none';
    document.getElementById('testFooterControls').style.display = 'none';
}

function startActualTest() {
    document.getElementById('testStartScreen').style.display = 'none';
    document.getElementById('testQuestionsContainer').style.display = 'block';
    document.getElementById('testFooterControls').style.display = 'flex';
    
    renderAllQuestions();
    showQuestion(0);
}

function closeTestMode() {
    if (confirm('هل تريد الخروج؟ سيتم حفظ تقدمك.')) {
        saveTestProgress(false); // حفظ دون تسليم
        document.getElementById('testFocusMode').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadMyTests(); // تحديث القائمة
    }
}

// 3. عرض الأسئلة
function renderAllQuestions() {
    const container = document.getElementById('testQuestionsContainer');
    container.innerHTML = '';

    currentTest.questions.forEach((q, index) => {
        // البحث عن إجابة سابقة
        const savedAns = userAnswers.find(a => a.questionId === q.id);
        const ansValue = savedAns ? savedAns.answer : null;

        let questionHtml = `
            <div class="question-card" id="q-card-${index}">
                <div class="question-number">سؤال ${index + 1} من ${currentTest.questions.length}</div>
                <h3 class="question-text">${q.text}</h3>
        `;

        // === نوع السؤال: اختيار من متعدد ===
        if (q.type.includes('mcq')) {
            if (q.choices) {
                questionHtml += `<div class="options-list">`;
                q.choices.forEach((choice, i) => {
                    const isSelected = (ansValue == i) ? 'selected' : ''; // مقارنة مرنة
                    const isChecked = (ansValue == i) ? 'checked' : '';
                    
                    questionHtml += `
                        <label class="answer-option ${isSelected}" onclick="selectOption(this, ${index}, ${i})">
                            <input type="radio" name="q_${q.id}" value="${i}" ${isChecked}>
                            ${choice}
                        </label>
                    `;
                });
                questionHtml += `</div>`;
            }
        }
        
        // === نوع السؤال: سحب وإفلات (Drag & Drop) ===
        else if (q.type === 'drag-drop') {
             // نفترض أن السؤال يحتوي على فقرات (paragraphs) وكل فقرة بها فراغات
             if (q.paragraphs) {
                q.paragraphs.forEach((p, pIdx) => {
                    // معالجة النص لاستبدال الفراغات بمناطق الإسقاط
                    let processedText = p.text;
                    let draggableWords = [];
                    
                    if (p.gaps) {
                        p.gaps.forEach((gap, gIdx) => {
                            // استبدال النص الأصلي بمنطقة إسقاط
                            // نستخدم gap.original للبحث والاستبدال
                            const dropZoneId = `drop-${q.id}-${pIdx}-${gIdx}`;
                            // إذا كانت هناك إجابة محفوظة لهذا الفراغ
                            let savedWord = '';
                            if (ansValue && ansValue[`p_${pIdx}_g_${gIdx}`]) {
                                savedWord = ansValue[`p_${pIdx}_g_${gIdx}`];
                            }

                            const dropZoneHtml = `<span class="drop-zone" id="${dropZoneId}" ondrop="drop(event)" ondragover="allowDrop(event)">${savedWord}</span>`;
                            processedText = processedText.replace(gap.dragItem, dropZoneHtml); // أو gap.original حسب تخزينك
                            draggableWords.push(gap.dragItem);
                        });
                    }

                    questionHtml += `
                        <div class="word-bank" id="bank-${q.id}-${pIdx}">
                            ${draggableWords.sort(() => Math.random() - 0.5).map(word => 
                                `<div class="draggable-word" draggable="true" ondragstart="drag(event)" id="word-${q.id}-${pIdx}-${word}">${word}</div>`
                            ).join('')}
                        </div>
                        <div class="sentence-area">
                            ${processedText}
                        </div>
                    `;
                });
            }
        }

        // === نوع السؤال: رسم/إملاء (Drawing) ===
        else if (q.type.includes('spelling') || q.type.includes('drawing')) {
            questionHtml += `
                <div style="text-align: center;">
                    <canvas id="canvas-${q.id}" class="drawing-canvas" width="600" height="300"></canvas>
                    <div style="margin-top: 10px;">
                        <button class="btn btn-sm btn-secondary" onclick="clearCanvas('${q.id}')">مسح الرسم</button>
                    </div>
                    ${ansValue ? `<div class="mt-2 text-success">تم حفظ رسم سابق</div>` : ''}
                </div>
            `;
            // ملاحظة: تهيئة الكانفاس تتم بعد عرض السؤال (في دالة showQuestion)
        }

        questionHtml += `</div>`; // إغلاق البطاقة
        container.insertAdjacentHTML('beforeend', questionHtml);
    });

    updateNavigationButtons();
}

// 4. التنقل بين الأسئلة
function showQuestion(index) {
    // إخفاء الكل
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active'));
    
    // إظهار الحالي
    const currentCard = document.getElementById(`q-card-${index}`);
    if (currentCard) {
        currentCard.classList.add('active');
        currentQuestionIndex = index;
        
        // تحديث العداد
        document.getElementById('questionCounter').textContent = `سؤال ${index + 1} من ${currentTest.questions.length}`;
        
        updateNavigationButtons();

        // تهيئة الكانفاس إذا كان السؤال الحالي سؤال رسم
        const q = currentTest.questions[index];
        if (q.type.includes('spelling') || q.type.includes('drawing')) {
            initCanvas(q.id);
        }
    }
}

function nextQuestion() {
    saveCurrentAnswer(); // حفظ إجابة السؤال الحالي قبل الانتقال
    if (currentQuestionIndex < currentTest.questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

function prevQuestion() {
    saveCurrentAnswer();
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

function updateNavigationButtons() {
    const footer = document.getElementById('testFooterControls');
    const isLast = currentQuestionIndex === currentTest.questions.length - 1;
    const isFirst = currentQuestionIndex === 0;

    footer.innerHTML = `
        <button class="btn-nav btn-prev" onclick="prevQuestion()" ${isFirst ? 'disabled' : ''} style="opacity: ${isFirst ? 0.5 : 1}">السابق</button>
        
        <div>
            <button class="btn-nav btn-save" onclick="saveTestProgress(false)">حفظ ومتابعة لاحقاً</button>
            ${isLast ? `<button class="btn-nav btn-submit" onclick="finishTest()">تسليم الاختبار</button>` : `<button class="btn-nav btn-next" onclick="nextQuestion()">التالي</button>`}
        </div>
    `;
}

// 5. التعامل مع الإجابات

// خيار متعدد
function selectOption(element, qIndex, choiceIndex) {
    // إزالة التحديد من الكل
    const card = document.getElementById(`q-card-${qIndex}`);
    card.querySelectorAll('.answer-option').forEach(el => el.classList.remove('selected'));
    
    // تحديد الحالي
    element.classList.add('selected');
    element.querySelector('input').checked = true;
}

// حفظ إجابة السؤال الحالي في المصفوفة المؤقتة
function saveCurrentAnswer() {
    const q = currentTest.questions[currentQuestionIndex];
    let answer = null;

    if (q.type.includes('mcq')) {
        const checked = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (checked) answer = parseInt(checked.value);
    } 
    else if (q.type.includes('spelling')) {
        const canvas = document.getElementById(`canvas-${q.id}`);
        if (canvas) answer = canvas.toDataURL(); // حفظ الصورة كـ Base64
    }
    // السحب والإفلات يتم حفظه لحظياً عند الإفلات (يمكن تحسينه)

    if (answer !== null) {
        const existingIndex = userAnswers.findIndex(a => a.questionId === q.id);
        if (existingIndex !== -1) {
            userAnswers[existingIndex].answer = answer;
        } else {
            userAnswers.push({ questionId: q.id, answer: answer });
        }
    }
}

// حفظ التقدم العام (localStorage)
function saveTestProgress(isSubmitting = false) {
    saveCurrentAnswer(); // تأكد من حفظ آخر سؤال

    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = allAssignments.findIndex(a => a.id === currentAssignment.id);
    
    if (index !== -1) {
        allAssignments[index].answers = userAnswers;
        if (isSubmitting) {
            allAssignments[index].status = 'completed';
            allAssignments[index].completedDate = new Date().toISOString();
            // هنا يمكن إضافة منطق التصحيح الآلي
            gradeTest(allAssignments[index]); 
        } else {
            allAssignments[index].status = 'in-progress';
        }
        
        localStorage.setItem('studentTests', JSON.stringify(allAssignments));
        
        if (!isSubmitting) {
            alert('تم حفظ تقدمك بنجاح');
            document.getElementById('testFocusMode').style.display = 'none';
            document.body.style.overflow = 'auto';
            loadMyTests();
        }
    }
}

function finishTest() {
    if (confirm('هل أنت متأكد من تسليم الاختبار؟ لا يمكن التعديل بعد ذلك.')) {
        saveTestProgress(true); // true تعني تسليم نهائي
        alert('تم تسليم الاختبار بنجاح! أحسنت يا بطل 🌟');
        document.getElementById('testFocusMode').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadMyTests();
    }
}

// تصحيح آلي بسيط (للاختيار من متعدد)
function gradeTest(assignment) {
    let score = 0;
    let maxScore = 0;
    
    currentTest.questions.forEach(q => {
        const qMax = q.passingScore || 1;
        maxScore += qMax;
        
        const studentAns = assignment.answers.find(a => a.questionId === q.id);
        
        if (q.type.includes('mcq') && studentAns) {
            if (studentAns.answer == q.correctAnswer) {
                studentAns.score = qMax;
                score += qMax;
            } else {
                studentAns.score = 0;
            }
        } else {
            // الأسئلة الأخرى تحتاج تصحيح يدوي أو منطق معقد
            // نعتبرها 0 مبدئياً أو نتركها للمعلم
        }
    });
    
    // إذا كان كله MCQ
    const isAllMcq = currentTest.questions.every(q => q.type.includes('mcq'));
    if (isAllMcq) {
        assignment.score = Math.round((score / maxScore) * 100);
    }
}


// ==========================================
// 6. أدوات الرسم (Canvas Logic)
// ==========================================
let isDrawing = false;
let ctx = null;

function initCanvas(qId) {
    const canvas = document.getElementById(`canvas-${qId}`);
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    // دعم الماوس
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // دعم اللمس (للموبايل)
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX, clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, false);
    
    // استرجاع الرسم القديم إذا وجد
    const savedAns = userAnswers.find(a => a.questionId === qId);
    if (savedAns && savedAns.answer) {
        const img = new Image();
        img.onload = function() { ctx.drawImage(img, 0, 0); };
        img.src = savedAns.answer;
    }
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function clearCanvas(qId) {
    const canvas = document.getElementById(`canvas-${qId}`);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}


// ==========================================
// 7. أدوات السحب والإفلات (Drag & Drop)
// ==========================================
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.innerText);
    ev.dataTransfer.setData("id", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var elementId = ev.dataTransfer.getData("id");
    
    if (ev.target.classList.contains('drop-zone')) {
        ev.target.innerText = data;
        ev.target.style.background = '#e3f2fd';
        ev.target.style.borderColor = '#2196f3';
        
        // إخفاء الكلمة من البنك
        document.getElementById(elementId).style.visibility = 'hidden';
    }
}

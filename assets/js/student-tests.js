// ============================================
// 📁 المسار: assets/js/student-tests.js
// الوصف: إدارة الاختبارات (مع القفل بعد التسليم)
// ============================================

let currentTest = null;
let currentAssignment = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let mediaRecorder = null;
let audioChunks = [];
let activeRecordingId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadMyTests();
});

function loadMyTests() {
    const container = document.getElementById('allTestsList');
    if(!container) return;

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}').user;
    if (!currentUser) return;

    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    const myTests = allAssignments.filter(t => t.studentId === currentUser.id);

    if (myTests.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;"><h3>لا توجد اختبارات</h3></div>`;
        return;
    }

    container.innerHTML = myTests.map(assignment => {
        const originalTest = allTestsLib.find(t => t.id === assignment.testId);
        if (!originalTest) return '';

        let statusText = 'جديد', statusClass = 'status-new', btnText = 'بدء', btnClass = 'btn-primary';
        
        if (assignment.status === 'in-progress') { 
            statusText = 'جاري الحل'; statusClass = 'status-progress'; btnText = 'متابعة'; btnClass = 'btn-warning'; 
        } else if (assignment.status === 'completed') { 
            statusText = 'تم التسليم'; statusClass = 'status-completed'; btnText = 'عرض فقط'; btnClass = 'btn-secondary'; 
        } else if (assignment.status === 'returned') { 
            statusText = 'معاد للتعديل'; statusClass = 'status-returned'; btnText = 'تعديل الإجابة'; btnClass = 'btn-danger'; 
        }

        return `
            <div class="test-card">
                <div class="card-header"><span class="card-status ${statusClass}">${statusText}</span><small>${new Date(assignment.assignedDate).toLocaleDateString('ar-SA')}</small></div>
                <h3>${originalTest.title}</h3>
                <div class="mt-3 d-flex justify-content-between">
                    <span class="badge badge-secondary">${originalTest.questions?.length || 0} أسئلة</span>
                    <button class="btn btn-sm ${btnClass}" onclick="openTestMode(${assignment.id})">${btnText}</button>
                </div>
            </div>`;
    }).join('');
}

// 🔒 الدالة المعدلة للقفل
function openTestMode(assignmentId) {
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTestsLib = JSON.parse(localStorage.getItem('tests') || '[]');
    
    currentAssignment = allAssignments.find(a => a.id === assignmentId);
    if (!currentAssignment) return;
    currentTest = allTestsLib.find(t => t.id === currentAssignment.testId);
    if (!currentTest) return;

    // ⛔ التحقق من الحالة للقفل
    if (currentAssignment.status === 'completed') {
        alert('لقد قمت بتسليم هذا الاختبار مسبقاً. لا يمكن التعديل عليه إلا بعد إعادته من قبل المعلم.');
        return; // منع الدخول
    }

    userAnswers = currentAssignment.answers || [];
    
    document.getElementById('focusTestTitle').textContent = currentTest.title;
    document.getElementById('testFocusMode').style.display = 'flex';
    document.body.style.overflow = 'hidden';

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

// ... (باقي دوال العرض renderAllQuestions, showQuestion, etc كما هي في النسخة السابقة تماماً بدون تغيير) ...
// تأكد من نسخ دالة renderAllQuestions التي تحتوي على (الكانفاس، والتسجيل الصوتي) من ردي السابق هنا.
// للاختصار، سأضع دوال الحفظ والإنهاء الأساسية فقط للتأكد من عمل القفل.

function saveTestProgress(submit = false) {
    if(typeof saveCurrentCanvas === 'function') saveCurrentCanvas(); 
    
    const allAssignments = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = allAssignments.findIndex(a => a.id === currentAssignment.id);
    if(idx !== -1) {
        allAssignments[idx].answers = userAnswers;
        if(submit) {
            allAssignments[idx].status = 'completed'; // 🔒 هنا يتم القفل
            allAssignments[idx].completedDate = new Date().toISOString();
        } else {
            allAssignments[idx].status = 'in-progress';
        }
        localStorage.setItem('studentTests', JSON.stringify(allAssignments));
    }
    
    if(!submit) alert('تم الحفظ');
    else {
        alert('تم تسليم الاختبار بنجاح! سيقوم المعلم بمراجعته.');
        document.getElementById('testFocusMode').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadMyTests();
    }
}

// ... (يرجى دمج باقي دوال الرسم والتسجيل الصوتي من الكود السابق هنا) ...
// الدوال المطلوبة: renderAllQuestions, showQuestion, next/prevQuestion, initCanvas, clearCanvas, toggleRecording, etc.
// لقد قمت بتزويدك بها في الرد السابق، وهي متوافقة تماماً مع هذا الهيكل.

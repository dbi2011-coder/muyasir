// ============================================
// 📁 المسار: assets/js/student-profile.js (تحديث العرض للمعلم)
// ============================================

// ... (الجزء العلوي من الملف: تعريف المتغيرات ودوال التحميل الأساسية تبقى كما هي) ...

// الدالة المعدلة: مراجعة وتصحيح الاختبار
function openReviewModal(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id === assignmentId);
    if(!assignment) return;
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id === assignment.testId);
    
    document.getElementById('reviewAssignmentId').value = assignmentId;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';

    originalTest.questions.forEach((q, index) => {
        const studentAnsObj = assignment.answers?.find(a => a.questionId === q.id);
        let studentAns = studentAnsObj ? studentAnsObj.answer : null;
        
        const currentScore = studentAnsObj?.score !== undefined ? studentAnsObj.score : (q.passingScore || 1);
        const teacherNote = studentAnsObj?.teacherNote || '';

        // 🌟 تجهيز طريقة عرض الإجابة حسب نوع السؤال
        let displayAnswer = '<span class="text-muted">لم يجب الطالب</span>';

        if (studentAns) {
            // 1. إذا كان صورة (رسم إملائي أو حرف ناقص)
            if (q.type.includes('spelling') || q.type === 'missing-char') {
                if (typeof studentAns === 'object') {
                    // إذا كان كائن يحتوي على عدة فقرات
                    displayAnswer = '<div style="display:flex; gap:10px; flex-wrap:wrap;">';
                    Object.keys(studentAns).forEach(key => {
                        displayAnswer += `<div style="text-align:center;"><img src="${studentAns[key]}" style="max-width:200px; border:1px solid #ccc; background:#fff;"><br><small>فقرة ${key}</small></div>`;
                    });
                    displayAnswer += '</div>';
                } else if (String(studentAns).startsWith('data:image')) {
                    displayAnswer = `<img src="${studentAns}" style="max-width:300px; border:1px solid #333; background:#fff;">`;
                }
            } 
            // 2. إذا كان صوت (قراءة)
            else if (q.type.includes('reading')) {
                if (typeof studentAns === 'object') {
                    displayAnswer = '';
                    Object.keys(studentAns).forEach(key => {
                        if(studentAns[key]) {
                            displayAnswer += `<div class="mb-2"><strong>فقرة ${key}:</strong><br><audio controls src="${studentAns[key]}"></audio></div>`;
                        }
                    });
                }
            }
            // 3. اختيار من متعدد
            else if (q.type.includes('mcq')) {
                displayAnswer = (q.choices && q.choices[studentAns]) 
                    ? `<span class="badge badge-primary" style="font-size:1rem;">${q.choices[studentAns]}</span>` 
                    : studentAns;
            }
            // 4. نص عادي
            else {
                displayAnswer = `<span style="font-size:1.1rem;">${studentAns}</span>`;
            }
        }

        const item = document.createElement('div');
        item.className = 'review-question-item';
        item.innerHTML = `
            <div class="review-q-header">
                <div><strong>س${index+1}:</strong> ${q.text}</div>
                <div>
                    <label>الدرجة:</label>
                    <input type="number" class="score-input" name="score_${q.id}" value="${currentScore}" max="${q.passingScore || 5}">
                    <span class="text-muted"> / ${q.passingScore || 1}</span>
                </div>
            </div>
            
            <div class="student-answer-box">
                <div class="mb-1"><strong>إجابة الطالب:</strong></div>
                ${displayAnswer}
            </div>
            
            <div class="teacher-feedback-box">
                <textarea name="note_${q.id}" class="form-control" placeholder="ملاحظات المعلم...">${teacherNote}</textarea>
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById('reviewTestModal').classList.add('show');
}

// دالة إعادة الاختبار للطالب (مهمة جداً للسماح بالتعديل)
function returnTestForResubmission() {
    const assignmentId = parseInt(document.getElementById('reviewAssignmentId').value);
    if(!confirm('هل أنت متأكد من إعادة الاختبار للطالب؟ سيتمكن الطالب من الدخول وتعديل إجاباته.')) return;

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const index = studentTests.findIndex(t => t.id === assignmentId);
    
    if(index !== -1) {
        studentTests[index].status = 'returned'; // 🔓 هذا هو مفتاح السماح بالتعديل
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        
        alert('تم إعادة الاختبار للطالب.');
        closeModal('reviewTestModal');
        loadDiagnosticTab();
    }
}

// ... (باقي الدوال saveTestReview, deleteAssignedTest, etc تبقى كما هي) ...

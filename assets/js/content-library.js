// ============================================
// 📁 المسار: assets/js/content-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('testsGrid') || document.getElementById('lessonsGrid')) {
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    try { loadTests(); } catch(e) {}
    try { loadLessons(); } catch(e) {}
    try { loadObjectives(); } catch(e) {}
}

// ... (loadTests, loadObjectives نفس الكود السابق تماماً) ...
function loadTests() {
    const grid = document.getElementById('testsGrid'); if(!grid) return;
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === getCurrentUser().id);
    if(tests.length===0) { grid.innerHTML='<div class="text-center">لا توجد اختبارات</div>'; return; }
    grid.innerHTML = tests.map(t => `<div class="content-card"><h4>${t.title}</h4><button class="btn btn-sm btn-danger" onclick="deleteTest(${t.id})">حذف</button></div>`).join('');
}
function loadObjectives(){ /* ... */ }

// ==========================================
// إدارة الدروس (النظام المطور 3 أقسام)
// ==========================================

function loadLessons() {
    const grid = document.getElementById('lessonsGrid');
    if (!grid) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === getCurrentUser().id);

    if (lessons.length === 0) {
        grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد دروس</h3><button class="btn btn-success mt-2" onclick="showCreateLessonModal()">+ درس جديد</button></div>`;
        return;
    }

    grid.innerHTML = lessons.map(l => `
        <div class="content-card">
            <div class="content-header">
                <h4 title="${l.title}">${l.title}</h4>
                <span class="content-badge subject-${l.subject}">${l.subject}</span>
            </div>
            <div class="content-body">
                <p class="text-muted small">
                    التمهيد: ${l.intro?.type || 'لا يوجد'}<br>
                    التمارين: ${l.exercises?.questions?.length || 0} أسئلة<br>
                    التقييم: ${l.assessment?.questions?.length || 0} أسئلة
                </p>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${l.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function showCreateLessonModal() {
    document.getElementById('editLessonId').value = '';
    document.getElementById('lessonTitle').value = '';
    document.getElementById('introUrl').value = '';
    document.getElementById('introText').value = '';
    document.getElementById('exercisesContainer').innerHTML = '';
    document.getElementById('assessmentContainer').innerHTML = '';
    
    // إضافة سؤال افتراضي في كل قسم لتسهيل البداية
    addLessonQuestion('exercisesContainer');
    addLessonQuestion('assessmentContainer');
    
    switchLessonStep('intro'); // العودة للخطوة الأولى
    document.getElementById('createLessonModal').classList.add('show');
}

// دالة عامة لإضافة الأسئلة في أي حاوية (تمارين أو تقييم أو اختبار)
function addLessonQuestion(containerId) {
    const container = document.getElementById(containerId);
    // نستخدم نفس دالة بناء HTML السؤال الموجودة مسبقاً
    addQuestionToContainer(container, 'سؤال');
}

function saveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    
    // 1. بيانات التمهيد
    const intro = {
        type: document.getElementById('introType').value,
        url: document.getElementById('introUrl').value,
        text: document.getElementById('introText').value
    };

    // 2. بيانات التمارين
    const exQuestions = collectQuestionsFromContainer('exercisesContainer');
    const exercises = {
        passScore: parseInt(document.getElementById('exercisesPassScore').value) || 50,
        questions: exQuestions
    };

    // 3. بيانات التقييم
    const asQuestions = collectQuestionsFromContainer('assessmentContainer');
    const assessment = {
        questions: asQuestions
    };

    if(!title) { alert('العنوان مطلوب'); return; }

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    lessons.push({
        id: Date.now(),
        teacherId: getCurrentUser().id,
        title, subject, intro, exercises, assessment,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('lessons', JSON.stringify(lessons));
    document.getElementById('createLessonModal').classList.remove('show');
    loadLessons();
    alert('تم حفظ الدرس التفاعلي بنجاح');
}

function deleteLesson(id) {
    if(!confirm('حذف الدرس؟')) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    localStorage.setItem('lessons', JSON.stringify(lessons.filter(l => l.id !== id)));
    loadLessons();
}

// دالة مساعدة لجمع الأسئلة من حاوية معينة
function collectQuestionsFromContainer(containerId) {
    const questions = [];
    document.querySelectorAll(`#${containerId} .question-item`).forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || 'سؤال';
        const score = item.querySelector('.passing-score').value; // سنستخدمها كثقل للسؤال
        
        let qData = { id: Date.now()+Math.random(), type, text, passingScore: parseInt(score) };
        
        if(item.querySelector('.q-choice')) qData.choices = Array.from(item.querySelectorAll('.q-choice')).map(c => c.value);
        if(item.querySelector('.q-media')) qData.mediaUrl = item.querySelector('.q-media').value;
        if(item.querySelector('.q-reading-text')) qData.readingText = item.querySelector('.q-reading-text').value;
        if(item.querySelector('.q-full-word')) { qData.spellingWord = item.querySelector('.q-full-word').value; qData.fullWord = item.querySelector('.q-full-word').value; }
        
        questions.push(qData);
    });
    return questions;
}

// ... (دوال الاختبارات saveTest, addQuestion, renderQuestionInputs، يفضل نسخها من الردود السابقة لضمان عمل إنشاء الاختبارات أيضاً) ...
// لتجنب التكرار الطويل، اعتمدت على أنك تملك دوال addQuestionToContainer و renderQuestionInputs من الرد السابق الخاص بالسحب والإفلات.
// تأكد من وجود دالة addQuestionToContainer في الملف لكي يعمل saveLesson.

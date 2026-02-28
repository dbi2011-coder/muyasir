// ============================================
// 📁 المسار: assets/js/student-lessons.js
// الوصف: نظام التعلم للإتقان، توثيق الإخفاق في السجل، الشفاء التلقائي (مربوط بـ Supabase)
// ============================================

let currentAssignmentId = null;
let currentLessonContent = null;
let tempLessonAnswers = [];
let currentLessonStatus = ''; 

document.addEventListener('DOMContentLoaded', function() {
    injectLessonModalHTML();
    if (document.getElementById('lessonsContainer')) {
        // تأخير بسيط لضمان تهيئة الاتصال بقاعدة البيانات (Supabase)
        setTimeout(() => {
            loadStudentLessons();
        }, 100);
    }
});

async function loadStudentLessons() {
    const container = document.getElementById('lessonsContainer');
    
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') currentStudent = getCurrentUser();
        if (!currentStudent && sessionStorage.getItem('currentUser')) currentStudent = JSON.parse(sessionStorage.getItem('currentUser'));
    } catch (e) {}
    
    if (currentStudent && currentStudent.user) currentStudent = currentStudent.user;

    if (!currentStudent || !currentStudent.id) {
        container.innerHTML = '<div class="alert alert-danger">يرجى تسجيل الدخول.</div>';
        return;
    }

    if (!window.supabase) {
        container.innerHTML = '<div class="alert alert-danger text-center">خطأ في الاتصال بالسحابة.</div>';
        return;
    }

    try {
        container.innerHTML = '<div class="text-center p-4">جاري تحميل مسارك التعليمي...</div>';

        // جلب دروس الطالب من السحابة
        const { data: myLessons, error } = await window.supabase
            .from('student_lessons')
            .select('*')
            .eq('studentId', currentStudent.id);

        if (error) throw error;
        
        if (!myLessons || myLessons.length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس حالياً</h3></div>`;
            return;
        }

        // ترتيب الدروس بناءً على orderIndex
        myLessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

        container.innerHTML = '';
        myLessons.forEach((lesson, index) => {
            let isLocked = false;
            let lockMessage = '';

            if (index > 0) {
                const prevLesson = myLessons[index - 1];
                if (prevLesson.status !== 'completed' && prevLesson.status !== 'accelerated') {
                    if (prevLesson.status === 'struggling' && lesson.rescueLessonId === prevLesson.id) {
                        isLocked = false; 
                    } else {
                        isLocked = true;
                        lockMessage = `أكمل السابق أولاً`;
                    }
                }
            }

            let cardClass = '', badge = '', btnAction = '';

            if (lesson.status === 'completed') {
                if (lesson.passedByAlternative) {
                    cardClass = 'completed';
                    badge = '<span class="badge badge-info" style="background:#17a2b8;">🎯 مجتاز باستراتيجية بديلة</span>';
                    btnAction = `<button class="btn btn-info w-100" style="font-weight:bold;" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId}, 'passedByAlternative')">استعراض إنجازك 🎯</button>`;
                } else {
                    cardClass = 'completed';
                    badge = '<span class="badge badge-success">✅ مكتمل</span>';
                    btnAction = `<button class="btn btn-outline-primary w-100" onclick="alert('تم إنجاز هذا الدرس وتصحيحه. مراجعته متاحة عبر المعلم.')">مكتمل</button>`;
                }
            } else if (lesson.status === 'accelerated') {
                cardClass = 'accelerated';
                badge = '<span class="badge badge-warning" style="background:#ffc107; color:#000; box-shadow:0 0 10px rgba(255,193,7,0.5);">🌟 تم التسريع للتفوق</span>';
                btnAction = `<button class="btn btn-warning w-100" style="font-weight:bold; color:#000;" onclick="openLessonOverlay(${lesson.id}, ${lesson.originalLessonId}, 'accelerated')">استعراض إنجازك 🏆</button>`;
            } else if (lesson.status === 'pending_review') { 
                cardClass = 'pending';
                badge = '<span class="badge badge-warning" style="background:#fd7e14; color:#fff;">⏳ بانتظار تصحيح المعلم</span>';
                btnAction = `<button class="btn btn-secondary w-100" disabled>النتيجة معلقة للتقييم اليدوي...</button>`;
            } else if (lesson.status === 'struggling') {
                cardClass = 'returned';
                badge = '<span class="badge badge-danger">🙋‍♂️ يطلب مساعدة المعلم</span>';
                btnAction = `<button class="btn btn-outline-danger w-100" onclick="startAndOpenLesson(${lesson.id}, ${lesson.originalLessonId}, 'struggling')">إعادة المحاولة</button>`;
            } else if (lesson.status === 'returned') {
                cardClass = 'returned';
                badge = '<span class="badge badge-danger">↩️ إعادة لعدم الإتقان</span>';
                btnAction = `<button class="btn btn-danger w-100" onclick="startAndOpenLesson(${lesson.id}, ${lesson.originalLessonId}, 'returned')">إعادة المحاولة</button>`;
            } else if (isLocked) {
                cardClass = 'locked';
                badge = '<span class="badge badge-secondary">🔒 مقفل</span>';
                btnAction = `<button class="btn btn-secondary w-100" disabled>${lockMessage}</button>`;
            } else {
                cardClass = 'active';
                badge = lesson.isAdditional ? '<span class="badge badge-info" style="background:#17a2b8; box-shadow:0 0 10px rgba(23,162,184,0.5);">✨ درس علاجي (مسار بديل)</span>' : '<span class="badge badge-primary">🔓 متاح للحل</span>';
                btnAction = `<button class="btn btn-success w-100" onclick="startAndOpenLesson(${lesson.id}, ${lesson.originalLessonId}, 'pending')">ابدأ الدرس</button>`;
            }

            let extraStyle = '';
            if (lesson.status === 'accelerated') extraStyle = 'border: 2px solid #ffc107; background: #fffbf0; transform: scale(1.02);';
            if (lesson.status === 'struggling') extraStyle = 'border: 2px solid #dc3545; background: #fff5f5;';
            if (lesson.status === 'pending_review') extraStyle = 'border: 2px solid #fd7e14; background: #fffaf6;';
            if (lesson.passedByAlternative) extraStyle = 'border: 2px solid #17a2b8; background: #f0f9fa;';

            const html = `
                <div class="test-card ${cardClass}" style="${extraStyle}">
                    <div class="card-header"><div style="display:flex; justify-content:space-between; align-items:center;"><span class="badge badge-light">#${index + 1}</span>${badge}</div><h3 style="margin-top:10px;">${lesson.title}</h3></div>
                    <div style="margin-top:auto;">${btnAction}</div>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
        });

    } catch (e) {
        console.error("Error loading lessons:", e);
        container.innerHTML = '<div class="alert alert-danger text-center">حدث خطأ أثناء تحميل الدروس.</div>';
    }
}

async function startAndOpenLesson(assignmentId, originalLessonId, status) {
    try {
        // جلب سجل الدرس لتوثيق الدخول في السجل التاريخي
        const { data: lesson, error } = await window.supabase
            .from('student_lessons')
            .select('*')
            .eq('id', assignmentId)
            .single();

        if (lesson) {
            if (!lesson.historyLog) lesson.historyLog = [];
            const todayStr = new Date().toISOString();
            const todayDateOnly = todayStr.split('T')[0];
            const hasLogToday = lesson.historyLog.some(log => log.date.startsWith(todayDateOnly));
            
            if (!hasLogToday) {
                const type = lesson.historyLog.length === 0 ? 'started' : 'extension';
                lesson.historyLog.push({ date: todayStr, status: type });
                // حفظ التحديث في السحابة
                await window.supabase.from('student_lessons').update({ historyLog: lesson.historyLog }).eq('id', assignmentId);
            }
        }
        openLessonOverlay(assignmentId, originalLessonId, status);
    } catch(e) {
        console.error(e);
        openLessonOverlay(assignmentId, originalLessonId, status); // الاستمرار حتى لو فشل التوثيق
    }
}

async function openLessonOverlay(assignmentId, originalLessonId, status) {
    try {
        // جلب محتوى الدرس الأصلي من المكتبة في السحابة
        const { data: lessonContent, error } = await window.supabase
            .from('lessons')
            .select('*')
            .eq('id', originalLessonId)
            .single();

        if (error || !lessonContent) { 
            alert('عذراً، محتوى هذا الدرس غير متوفر.'); 
            return; 
        }

        currentLessonContent = lessonContent;
        currentAssignmentId = assignmentId;
        currentLessonStatus = status;
        tempLessonAnswers = [];

        const modal = document.getElementById('lessonFocusMode');
        if(modal) {
            document.getElementById('lessonFocusTitle').textContent = currentLessonContent.title;
            const passScore = (currentLessonContent.exercises && currentLessonContent.exercises.passScore) ? currentLessonContent.exercises.passScore : 80;
            const scoreSpan = document.getElementById('reqScore');
            if(scoreSpan) scoreSpan.textContent = passScore;

            renderIntro();
            
            renderAdvancedQuestions((currentLessonContent.exercises ? currentLessonContent.exercises.questions : []), 'exercisesList', currentLessonStatus);
            renderAdvancedQuestions((currentLessonContent.assessment ? currentLessonContent.assessment.questions : []), 'assessmentList', currentLessonStatus);

            const btnEx = document.getElementById('btnSubmitExercises');
            const btnAs = document.getElementById('btnSubmitAssessment');
            
            if (currentLessonStatus === 'accelerated' || currentLessonStatus === 'passedByAlternative') {
                if(btnEx) { btnEx.innerHTML = 'تجاوز التمارين (مُعفى) ⬅'; btnEx.className = 'btn btn-secondary btn-block mt-4 p-3'; }
                if(btnAs) { btnAs.innerHTML = 'إغلاق الدرس ✅'; btnAs.className = 'btn btn-secondary btn-block mt-4 p-3'; }
            } else {
                if(btnEx) { btnEx.innerHTML = 'تحقق وانتقل للتقييم النهائي ⬅'; btnEx.className = 'btn btn-success btn-block mt-4 p-3'; }
                if(btnAs) { btnAs.innerHTML = '✅ تسليم وإنهاء الدرس'; btnAs.className = 'btn btn-primary btn-block mt-4 p-3'; }
            }

            modal.style.display = 'block';
            showStage('intro');
        }
    } catch(e) {
        console.error(e);
        alert('حدث خطأ أثناء تحميل محتوى الدرس.');
    }
}

function renderIntro() {
    const container = document.getElementById('introContent');
    const intro = currentLessonContent.intro || {};
    container.innerHTML = '';
    if (intro.text) container.innerHTML += `<div class="alert alert-info" style="font-size:1.2rem; line-height:1.8;">${intro.text}</div>`;
    if (intro.type === 'video' && intro.url) {
        let videoId = intro.url.split('v=')[1];
        if (!videoId && intro.url.includes('youtu.be')) videoId = intro.url.split('/').pop();
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : intro.url;
        container.innerHTML += `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:10px; margin-top:15px;"><iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
    } else if (intro.type === 'image' && intro.url) {
        container.innerHTML += `<img src="${intro.url}" style="max-width:100%; border-radius:10px; margin-top:15px;">`;
    }
}

function renderAdvancedQuestions(questions, containerId, status) {
    const container = document.getElementById(containerId);
    if (!questions || questions.length === 0) { container.innerHTML = '<p class="text-muted text-center p-4">لا توجد أسئلة في هذه المرحلة.</p>'; return; }
    
    let html = '';
    if (status === 'accelerated') {
        html += `<div style="position:relative;"><div style="position:absolute; top:0; left:0; right:0; bottom:0; z-index:50; background:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; border-radius:10px; backdrop-filter:blur(2px);"><div style="transform: rotate(-10deg); border: 8px solid #28a745; color: #28a745; padding: 25px 40px; font-size: 2.5rem; font-weight: 900; border-radius: 20px; background: rgba(255,255,255,0.95); box-shadow: 0 15px 30px rgba(40,167,69,0.4); text-align:center; text-shadow: 1px 1px 0 #fff;">🌟 مُجتاز بتفوق 🌟<br><span style="font-size:1.2rem; color:#444; font-weight:bold; display:block; margin-top:10px;">منحك المعلم الدرجة كاملة لتميزك!</span></div></div><div style="pointer-events:none; filter: grayscale(30%); opacity:0.7;">`;
    } else if (status === 'passedByAlternative') {
        html += `<div style="position:relative;"><div style="position:absolute; top:0; left:0; right:0; bottom:0; z-index:50; background:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; border-radius:10px; backdrop-filter:blur(2px);"><div style="transform: rotate(-5deg); border: 8px solid #17a2b8; color: #17a2b8; padding: 25px 40px; font-size: 2.2rem; font-weight: 900; border-radius: 20px; background: rgba(255,255,255,0.95); box-shadow: 0 15px 30px rgba(23,162,184,0.4); text-align:center; text-shadow: 1px 1px 0 #fff;">🎯 تم الاجتياز بنجاح 🎯<br><span style="font-size:1.2rem; color:#444; font-weight:bold; display:block; margin-top:10px;">اجتزت هذه المهارة باستراتيجية بديلة! استمر في تقدمك!</span></div></div><div style="pointer-events:none; filter: grayscale(20%); opacity:0.8;">`;
    }

    questions.forEach((q, index) => {
        let qHtml = `<div class="question-card active" style="margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:20px; border-radius:10px; background:#fff; border:1px solid #e2e8f0;"><h4 style="color:#334155; margin-bottom:15px;">${q.text || 'سؤال'}</h4>`;
        if (q.attachment) qHtml += `<div class="text-center mb-3"><img src="${q.attachment}" style="max-height:200px; border-radius:8px; border:1px solid #ddd;"></div>`;
        if (q.type.includes('mcq')) {
            qHtml += `<div class="options-list">`;
            (q.choices || []).forEach((choice, i) => { qHtml += `<label class="answer-option" style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; display:block; margin-bottom:10px; cursor:pointer;" onclick="this.parentElement.querySelectorAll('.answer-option').forEach(e=>e.style.background='#fff'); this.style.background='#e3f2fd'; this.querySelector('input').checked=true;"><input type="radio" name="${containerId}_q_${q.id}" value="${i}" style="margin-left:10px;"> ${choice}</label>`; });
            qHtml += `</div>`;
        } else if (q.type === 'drag-drop') {
            let allDraggables = []; let sentencesHtml = '<div class="sentences-container" style="display:flex; flex-direction:column; gap:15px;">';
            (q.paragraphs || []).forEach((p, pIdx) => {
                let processedText = p.text;
                if (p.gaps) { p.gaps.forEach((g, gIdx) => { const dropId = `drop-${containerId}-${q.id}-${pIdx}-${gIdx}`; processedText = processedText.replace(g.dragItem, `<span class="drop-zone" id="${dropId}" style="display:inline-block; min-width:100px; height:35px; border-bottom:2px solid #333; background:#f8f9fa; margin:0 5px; text-align:center;"></span>`); allDraggables.push({ word: g.dragItem }); }); }
                sentencesHtml += `<div style="font-size:1.3rem; line-height:2.6;">${processedText}</div>`;
            });
            sentencesHtml += '</div>';
            if (allDraggables.length > 0) {
                allDraggables.sort(() => Math.random() - 0.5);
                qHtml += `<div class="text-center text-muted mb-2 small">💡 اسحب الكلمة للمكان المناسب.</div><div class="word-bank mb-4" style="background:#f1f8e9; padding:15px; border-radius:10px; border:2px dashed #8bc34a; display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">`;
                allDraggables.forEach(item => { qHtml += `<div style="background:#fff; border:2px solid #c5e1a5; color:#33691e; padding:5px 15px; border-radius:20px; font-weight:bold; cursor:move;" draggable="true" ondragstart="event.dataTransfer.setData('text', event.target.innerText)">${item.word}</div>`; });
                qHtml += `</div>`;
            }
            qHtml += sentencesHtml;
            setTimeout(() => { document.querySelectorAll(`#${containerId} .drop-zone`).forEach(z => { z.ondragover = e => e.preventDefault(); z.ondrop = e => { e.preventDefault(); z.innerText = e.dataTransfer.getData('text'); z.style.background = '#e3f2fd'; }; }); }, 100);
        } else {
            qHtml += `<textarea class="form-control" name="${containerId}_q_${q.id}" rows="2" placeholder="اكتب إجابتك هنا..."></textarea>`;
        }
        qHtml += `</div>`; html += qHtml;
    });

    if (status === 'accelerated' || status === 'passedByAlternative') html += `</div></div>`;
    container.innerHTML = html;
}

function showStage(stageName) {
    document.querySelectorAll('.lesson-stage').forEach(el => el.classList.remove('active'));
    const stage = document.getElementById(`stage-${stageName}`);
    if(stage) stage.classList.add('active');
    const steps = ['intro', 'exercises', 'assessment'];
    const currentIdx = steps.indexOf(stageName);
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.className = 'progress-step';
        if (idx < currentIdx) el.classList.add('completed');
        if (idx === currentIdx) el.classList.add('active');
    });
}

function calculateStageScore(questions, containerId) {
    let totalScore = 0; let maxTotalScore = 0; let answersToSave = [];
    questions.forEach(q => {
        let maxScore = parseFloat(q.maxScore || q.passingScore || q.points || q.score || 1);
        maxTotalScore += maxScore;
        let score = 0; let rawAnswer = null;

        if (q.type.includes('mcq')) {
            const selected = document.querySelector(`input[name="${containerId}_q_${q.id}"]:checked`);
            rawAnswer = selected ? selected.value : null;
            if (rawAnswer !== null && parseInt(rawAnswer) === parseInt(q.correctAnswer)) score = maxScore;
        } else if (q.type === 'drag-drop') {
            let totalGaps = 0; let correctGaps = 0; rawAnswer = {};
            (q.paragraphs || []).forEach((p, pIdx) => {
                (p.gaps || []).forEach((g, gIdx) => {
                    totalGaps++;
                    const dropZone = document.getElementById(`drop-${containerId}-${q.id}-${pIdx}-${gIdx}`);
                    if (dropZone) {
                        const w = dropZone.innerText.trim();
                        rawAnswer[`p_${pIdx}_g_${gIdx}`] = w;
                        if (w === String(g.dragItem).trim() && w !== '') correctGaps++;
                    }
                });
            });
            if (totalGaps > 0) score = ((correctGaps / totalGaps) * maxScore);
        } else {
            const txt = document.querySelector(`textarea[name="${containerId}_q_${q.id}"]`);
            if (txt) rawAnswer = txt.value;
            if (q.correctAnswer && String(rawAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) score = maxScore;
        }
        totalScore += score;
        answersToSave.push({ questionId: q.id, answer: rawAnswer, score: score });
    });
    
    const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
    return { percentage, answers: answersToSave };
}

function hasManualQuestions(questions) {
    return questions.some(q => ['open-ended', 'manual-reading', 'manual-spelling', 'missing-char'].includes(q.type));
}

// ---------------- نوافذ الإخفاق والتعليق ----------------
function showLessonFailModal(currentPct, reqPct) {
    let modal = document.getElementById('lessonFailModal');
    if (!modal) {
        const html = `<div id="lessonFailModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(5px);"><div style="background:white; padding:30px; border-radius:15px; width:90%; max-width:400px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:4rem; margin-bottom:10px;">📉</div><h3 style="color:#dc3545;">لم تجتز المحك المطلوب</h3><p style="font-size:1.1rem; color:#555; line-height:1.6;">لقد حصلت على <strong id="failCurrentPct"></strong> بينما المحك هو <strong id="failReqPct"></strong>.</p><p style="margin-bottom:25px;">لا تقلق! التعلم يحتاج إلى تكرار. ماذا تريد أن تفعل الآن؟</p><div style="display:flex; flex-direction:column; gap:10px;"><button class="btn btn-warning p-2" style="font-weight:bold; font-size:1.1rem; border:2px solid #d39e00;" onclick="handleFailAction('help')">🙋‍♂️ أواجه صعوبة.. أطلب مساعدة المعلم</button><button class="btn btn-primary p-2" style="font-weight:bold; font-size:1.1rem;" onclick="handleFailAction('retry')">🔄 أريد العودة للتمهيد والمحاولة</button></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('lessonFailModal');
    }
    document.getElementById('failCurrentPct').innerText = currentPct + '%';
    document.getElementById('failReqPct').innerText = reqPct + '%';
    modal.style.display = 'flex';
}

function showPendingReviewModal() {
    let modal = document.getElementById('lessonPendingModal');
    if (!modal) {
        const html = `<div id="lessonPendingModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(5px);"><div style="background:white; padding:30px; border-radius:15px; width:90%; max-width:400px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:4rem; margin-bottom:10px;">⏳</div><h3 style="color:#fd7e14;">بانتظار تصحيح المعلم</h3><p style="font-size:1.1rem; color:#555; line-height:1.6;">عمل رائع يا بطل! 🌟 لقد تم استلام إجاباتك.</p><p style="margin-bottom:25px;">توجد أسئلة تحتاج لتقييم المعلم (قراءة أو كتابة). يرجى الانتظار حتى تُعتمد نتيجتك.</p><button class="btn btn-primary w-100 p-2" style="font-weight:bold; font-size:1.1rem;" onclick="closePendingAndLesson()">حسناً، فهمت</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('lessonPendingModal');
    }
    modal.style.display = 'flex';
}

window.handleFailAction = async function(action) {
    document.getElementById('lessonFailModal').style.display = 'none';
    if (action === 'help') {
        try {
            const { data: lesson } = await window.supabase.from('student_lessons').select('*').eq('id', currentAssignmentId).single();
            if (lesson) {
                let hLog = lesson.historyLog || [];
                hLog.push({ date: new Date().toISOString(), status: 'struggling' });
                await window.supabase.from('student_lessons').update({ status: 'struggling', historyLog: hLog }).eq('id', currentAssignmentId);
            }
            closeLessonMode();
            alert('تم إشعار المعلم بصعوبتك، وسيتم توفير استراتيجية علاجية بديلة لك قريباً.');
        } catch(e) {
            console.error('Error logging struggle:', e);
            closeLessonMode();
        }
    } else {
        showStage('intro');
    }
}

window.closePendingAndLesson = function() {
    document.getElementById('lessonPendingModal').style.display = 'none';
    closeLessonMode();
}

// ---------------- البوابات والشفاء الذاتي ----------------
function submitExercises() { 
    if (currentLessonStatus === 'accelerated' || currentLessonStatus === 'passedByAlternative') return showStage('assessment');
    const questions = currentLessonContent.exercises?.questions || [];
    if (questions.length === 0) return showStage('assessment'); 
    
    const result = calculateStageScore(questions, 'exercisesList');
    const passScore = currentLessonContent.exercises?.passScore || 80;
    const hasManual = hasManualQuestions(questions);

    if (result.percentage >= passScore || hasManual) {
        tempLessonAnswers = [...tempLessonAnswers, ...result.answers];
        if (hasManual) alert('توجد أسئلة في التمارين تحتاج لتصحيح المعلم. سننتقل الآن للتقييم النهائي، وسيتم الاعتماد لاحقاً.');
        else alert(`أحسنت! اجتزت التمارين بنجاح (مجموعك: ${Math.round(result.percentage)}%). ننتقل للتقييم النهائي.`);
        showStage('assessment');
    } else {
        showLessonFailModal(Math.round(result.percentage), passScore);
    }
}

async function submitAssessment() {
    if (currentLessonStatus === 'accelerated' || currentLessonStatus === 'passedByAlternative') return closeLessonMode();
    const questions = currentLessonContent.assessment?.questions || [];
    const result = calculateStageScore(questions, 'assessmentList');
    const passScore = currentLessonContent.exercises?.passScore || 80;

    const hasManualAs = hasManualQuestions(questions);
    const hasManualEx = hasManualQuestions(currentLessonContent.exercises?.questions || []);
    const needsManualReview = hasManualAs || hasManualEx;

    if (needsManualReview) {
        tempLessonAnswers = [...tempLessonAnswers, ...result.answers];
        try {
            const { data: lesson } = await window.supabase.from('student_lessons').select('*').eq('id', currentAssignmentId).single();
            if(lesson) {
                let hLog = lesson.historyLog || [];
                hLog.push({ date: new Date().toISOString(), status: 'pending_review' });
                await window.supabase.from('student_lessons').update({
                    status: 'pending_review',
                    answers: tempLessonAnswers,
                    historyLog: hLog
                }).eq('id', currentAssignmentId);
            }
            showPendingReviewModal();
        } catch(e) { console.error(e); }
        return;
    }

    if (questions.length === 0 || result.percentage >= passScore) {
        tempLessonAnswers = [...tempLessonAnswers, ...result.answers];
        try {
            const { data: lesson } = await window.supabase.from('student_lessons').select('*').eq('id', currentAssignmentId).single();
            if (lesson) {
                let hLog = lesson.historyLog || [];
                hLog.push({ date: new Date().toISOString(), status: 'completed' });
                
                await window.supabase.from('student_lessons').update({
                    status: 'completed',
                    completedDate: new Date().toISOString(),
                    answers: tempLessonAnswers,
                    historyLog: hLog
                }).eq('id', currentAssignmentId);

                // معالجة درس الشفاء التلقائي (الدرس الأصلي الذي تعثر فيه الطالب)
                if (lesson.rescueLessonId) {
                    const { data: originalLesson } = await window.supabase.from('student_lessons').select('*').eq('id', lesson.rescueLessonId).single();
                    if (originalLesson) {
                        let origLog = originalLesson.historyLog || [];
                        origLog.push({ date: new Date().toISOString(), status: 'passed_by_alternative' });
                        await window.supabase.from('student_lessons').update({
                            status: 'completed',
                            passedByAlternative: true,
                            historyLog: origLog
                        }).eq('id', lesson.rescueLessonId);
                    }
                }
            }
            alert(`عمل رائع! لقد أتممت الدرس بنجاح.`);
            closeLessonMode();
        } catch(e) { console.error(e); alert('حدث خطأ في الحفظ!'); }
    } else {
        showLessonFailModal(Math.round(result.percentage), passScore);
    }
}

function closeLessonMode() {
    document.getElementById('lessonFocusMode').style.display = 'none';
    loadStudentLessons(); 
}

function injectLessonModalHTML() {
    if (document.getElementById('lessonFocusMode')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div id="lessonFocusMode" class="lesson-focus-mode" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:#f1f5f9; z-index:99999; overflow-y:auto;">
        <div class="focus-header" style="background:white; padding:15px 30px; box-shadow:0 2px 10px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100;">
            <h3 style="margin:0; color:#1e293b;"><span id="lessonFocusTitle">عنوان الدرس</span></h3>
            <div class="lesson-progress-bar" style="display:flex; gap:10px;">
                <span class="progress-step" style="padding:5px 15px; border-radius:20px; font-weight:bold; background:#e2e8f0; color:#64748b;">1. الشرح</span>
                <span class="progress-step" style="padding:5px 15px; border-radius:20px; font-weight:bold; background:#e2e8f0; color:#64748b;">2. التمارين</span>
                <span class="progress-step" style="padding:5px 15px; border-radius:20px; font-weight:bold; background:#e2e8f0; color:#64748b;">3. التقييم</span>
            </div>
            <button onclick="closeLessonMode()" class="btn btn-sm btn-danger" style="border-radius:20px; padding:5px 20px;">خروج ✕</button>
        </div>
        <div class="lesson-container" style="max-width:800px; margin:40px auto; padding:20px;">
            <div id="stage-intro" class="lesson-stage" style="display:none;"><div id="introContent" style="background:white; padding:30px; border-radius:15px; box-shadow:0 5px 20px rgba(0,0,0,0.05);"></div><button class="btn btn-primary btn-block mt-4 p-3" style="font-size:1.2rem; border-radius:10px;" onclick="showStage('exercises')">التالي: التمارين ⬅</button></div>
            <div id="stage-exercises" class="lesson-stage" style="display:none;"><div class="alert alert-warning mb-4" style="border-right:5px solid #ffc107;"><strong>ملاحظة:</strong> لن تتمكن من الانتقال للتقييم النهائي إلا باجتياز جميع التمارين بنسبة ( <span id="reqScore"></span>% ) على الأقل.</div><div id="exercisesList"></div><button id="btnSubmitExercises" class="btn btn-success btn-block mt-4 p-3" style="font-size:1.2rem; border-radius:10px;" onclick="submitExercises()">تحقق وانتقل للتقييم النهائي ⬅</button></div>
            <div id="stage-assessment" class="lesson-stage" style="display:none;"><div class="alert alert-info mb-4" style="border-right:5px solid #007bff;"><strong>التقييم النهائي:</strong> أثبت مهارتك واجتز هذا التقييم لإنهاء الدرس بالكامل!</div><div id="assessmentList"></div><button id="btnSubmitAssessment" class="btn btn-primary btn-block mt-4 p-3" style="font-size:1.2rem; border-radius:10px;" onclick="submitAssessment()">✅ تسليم وإنهاء الدرس</button></div>
        </div>
    </div>
    <style> .progress-step.active { background:#007bff !important; color:white !important; } .progress-step.completed { background:#28a745 !important; color:white !important; } .lesson-stage.active { display:block !important; animation: fadeIn 0.4s ease; } </style>
    `);
}

window.openLessonOverlay = openLessonOverlay;
window.startAndOpenLesson = startAndOpenLesson;
window.submitAssessment = submitAssessment;
window.submitExercises = submitExercises;
window.closeLessonMode = closeLessonMode;
window.showStage = showStage;

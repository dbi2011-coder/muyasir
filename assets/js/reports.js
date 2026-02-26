// ============================================
// 📁 المسار: assets/js/reports.js (النسخة السحابية الذكية والمحمية)
// ============================================

// 1. جلب بيانات المعلم الحالي من الجلسة
function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
}

// 🌟 دوال ذكية للبحث عن القوائم المنسدلة مهما كان اسمها (ID) في الـ HTML
function getStudentDropdown() {
    let el = document.getElementById('reportStudentSelect') || document.getElementById('studentSelect') || document.getElementById('student');
    if (!el) {
        const selects = document.getElementsByTagName('select');
        if(selects.length > 0) el = selects[0]; // عادةً القائمة الأولى تكون للطلاب
    }
    return el;
}

function getReportTypeDropdown() {
    let el = document.getElementById('reportTypeSelect') || document.getElementById('reportType') || document.getElementById('type');
    if (!el) {
        const selects = document.getElementsByTagName('select');
        if(selects.length > 1) el = selects[1]; // عادةً القائمة الثانية تكون لنوع التقرير
    }
    return el;
}

// 2. التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') {
        alert('الرجاء تسجيل الدخول بحساب معلم للوصول للتقارير.');
        window.location.href = 'index.html';
        return;
    }

    const teacherNameDisplay = document.getElementById('teacherNameDisplay') || document.getElementById('userName');
    if (teacherNameDisplay) teacherNameDisplay.textContent = "أ/ " + user.name;

    // بدء جلب قائمة الطلاب
    loadStudentsList(user.id);
});

// 3. تحميل قائمة الطلاب من السحابة (Supabase)
async function loadStudentsList(teacherId) {
    try {
        const { data: students, error } = await window.supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('teacherId', teacherId)
            .order('name', { ascending: true });

        if (error) throw error;

        const select = getStudentDropdown();
        if (!select) {
            console.error("لم يتم العثور على أي قائمة منسدلة (select) في صفحة HTML");
            return;
        }

        select.innerHTML = '<option value="">-- اختر الطالب --</option>';
        if (students && students.length > 0) {
            students.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        } else {
            select.innerHTML += '<option value="" disabled>لا يوجد طلاب مسجلين</option>';
        }
    } catch (e) {
        console.error("Error loading students:", e);
        alert('حدث خطأ في جلب قائمة الطلاب من قاعدة البيانات.');
    }
}

// 4. الدالة الرئيسية لتوليد التقرير
window.initiateReport = async function() {
    const studentEl = getStudentDropdown();
    const typeEl = getReportTypeDropdown();
    
    if (!studentEl || !typeEl) {
        alert('خطأ في واجهة HTML: لم يتم العثور على قوائم اختيار الطالب أو نوع التقرير.');
        return;
    }

    const studentId = studentEl.value;
    const type = typeEl.value;
    
    if (!studentId || !type) {
        alert('الرجاء تحديد الطالب ونوع التقرير أولاً من القوائم.');
        return;
    }

    // البحث عن حاويات التحميل والنتائج
    const loadingArea = document.getElementById('reportLoading') || document.getElementById('loadingArea');
    const resultArea = document.getElementById('reportResultArea') || document.getElementById('resultArea') || document.querySelector('.result-container');
    const contentArea = document.getElementById('generatedReportContent') || document.getElementById('reportContent') || document.getElementById('reportResultArea');
    
    if (loadingArea) loadingArea.style.display = 'block';
    if (resultArea) resultArea.style.display = 'none';
    if (contentArea) contentArea.innerHTML = '';

    try {
        if (type === 'diagnostic' || type.includes('diag')) await generateDiagnosticReport(studentId);
        else if (type === 'iep' || type.includes('iep')) await generateIEPReport(studentId);
        else if (type === 'progress' || type.includes('prog')) await generateProgressReport(studentId);
        else if (type === 'comprehensive' || type.includes('comp')) await generateComprehensiveReport(studentId);
        else await generateComprehensiveReport(studentId); // افتراضي في حال كان الاسم مختلفاً
    } catch (e) {
        console.error("Report Generation Error:", e);
        alert('حدث خطأ أثناء بناء التقرير. تأكد من اتصالك بالإنترنت وتوفر البيانات.');
    } finally {
        if (loadingArea) loadingArea.style.display = 'none';
    }
};

// ============================================
// دوال توليد التقارير المخصصة
// ============================================

// أ. التقرير التشخيصي
async function generateDiagnosticReport(studentId) {
    const { data: student } = await window.supabase.from('users').select('*').eq('id', studentId).single();
    const { data: diagTests } = await window.supabase.from('student_tests').select('*').eq('studentId', studentId).eq('type', 'diagnostic').eq('status', 'completed');

    let html = buildReportHeader('تقرير الاختبار التشخيصي', student);

    if (!diagTests || diagTests.length === 0) {
        html += `<div style="padding:20px; background:#fff3cd; border:1px solid #ffeeba; text-align:center; border-radius:8px; font-weight:bold; color:#856404;">لا يوجد اختبار تشخيصي مكتمل ومصحح لهذا الطالب حتى الآن.</div>`;
    } else {
        const test = diagTests[0];
        const { data: origTest } = await window.supabase.from('tests').select('*').eq('id', test.testId).single();
        
        html += `
        <div style="background:#fff; padding:20px; border:1px solid #ddd; border-radius:8px; margin-bottom:20px;">
            <h4 style="color:#0056b3; border-bottom:2px solid #eee; padding-bottom:10px;">تفاصيل الاختبار</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:15px; border:1px solid #ddd;">
                <tr><td style="background:#f8f9fa; padding:10px; border:1px solid #ddd; width:30%;"><strong>اسم الاختبار:</strong></td><td style="padding:10px; border:1px solid #ddd;">${origTest ? origTest.title : 'اختبار محذوف'}</td></tr>
                <tr><td style="background:#f8f9fa; padding:10px; border:1px solid #ddd;"><strong>المادة:</strong></td><td style="padding:10px; border:1px solid #ddd;">${origTest ? origTest.subject : (student.subject || 'عام')}</td></tr>
                <tr><td style="background:#f8f9fa; padding:10px; border:1px solid #ddd;"><strong>الدرجة الكلية:</strong></td><td style="padding:10px; border:1px solid #ddd;"><span style="font-size:1.2rem; font-weight:bold; color:${test.score >= 80 ? '#28a745' : '#dc3545'};">${test.score}%</span></td></tr>
                <tr><td style="background:#f8f9fa; padding:10px; border:1px solid #ddd;"><strong>تاريخ الإنجاز:</strong></td><td style="padding:10px; border:1px solid #ddd;">${new Date(test.assignedDate).toLocaleDateString('ar-SA')}</td></tr>
            </table>
            <div style="margin-top:20px; padding:15px; border-radius:5px; background:${test.score >= 80 ? '#d4edda' : '#f8d7da'}; color:${test.score >= 80 ? '#155724' : '#721c24'}; border:1px solid ${test.score >= 80 ? '#c3e6cb' : '#f5c6cb'};">
                <strong>النتيجة والتوصية:</strong> ${test.score >= 80 ? 'الطالب متفوق وتجاوز محك الاجتياز. لا يحتاج لخطة علاجية في هذا التقييم.' : 'يحتاج الطالب إلى خطة علاجية فردية (IEP) بناءً على نقاط الاحتياج المستخرجة من الاختبار.'}
            </div>
        </div>`;
    }
    displayReport(html);
}

// ب. تقرير الخطة التربوية (IEP)
async function generateIEPReport(studentId) {
    const { data: student } = await window.supabase.from('users').select('*').eq('id', studentId).single();
    const teacher = getCurrentUser();
    const { data: diagTests } = await window.supabase.from('student_tests').select('*').eq('studentId', studentId).eq('type', 'diagnostic').eq('status', 'completed');
    
    let html = buildReportHeader('الخطة التربوية الفردية (IEP)', student);

    if (!diagTests || diagTests.length === 0) {
        html += `<div style="padding:20px; background:#fff3cd; border:1px solid #ffeeba; text-align:center; border-radius:8px; font-weight:bold; color:#856404;">لا يمكن توليد الخطة. يجب إكمال الاختبار التشخيصي وتصحيحه أولاً.</div>`;
        displayReport(html);
        return;
    }

    const test = diagTests[0];
    const { data: originalTest } = await window.supabase.from('tests').select('*').eq('id', test.testId).single();
    const { data: allObjectives } = await window.supabase.from('objectives').select('*').eq('teacherId', teacher.id);
    const { data: studentLessons } = await window.supabase.from('student_lessons').select('*').eq('studentId', studentId);

    let strengthHTML = '', needsHTML = ''; let needsObjects = [];
    
    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const ans = test.answers ? test.answers.find(a => a.questionId == q.id) : null;
            const score = ans ? parseFloat(ans.score || 0) : 0; 
            const maxScore = parseFloat(q.maxScore || q.passingScore || 1); 
            const criterion = parseFloat(q.passingCriterion || 80); 
            let percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

            if (q.linkedGoalId) {
                const obj = (allObjectives || []).find(o => o.id == q.linkedGoalId);
                if (obj) {
                    if (percentage >= criterion) { if (!strengthHTML.includes(obj.shortTermGoal)) strengthHTML += `<li>${obj.shortTermGoal}</li>`; } 
                    else { if (!needsObjects.find(o => o.id == obj.id)) { needsObjects.push(obj); needsHTML += `<li>${obj.shortTermGoal}</li>`; } }
                }
            }
        });
    }
    
    if(!strengthHTML) strengthHTML = '<li>لا توجد نقاط مسجلة.</li>'; 
    if(!needsHTML) needsHTML = '<li>لا توجد نقاط احتياج مسجلة.</li>';

    const completedLessonsMap = {};
    (studentLessons || []).forEach(l => { 
        if (l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative) {
            completedLessonsMap[l.objective] = l.completedDate || 'مكتمل'; 
        }
    });

    let objectivesRows = ''; let stgCounter = 1;
    needsObjects.forEach(obj => {
        objectivesRows += `<tr style="background-color:#e3f2fd;"><td style="text-align:center; font-weight:bold; color:#0056b3; border:1px solid #ccc; padding:10px;">${stgCounter++}</td><td colspan="2" style="font-weight:bold; color:#0056b3; border:1px solid #ccc; padding:10px;">الهدف القصير: ${obj.shortTermGoal}</td></tr>`;
        if (obj.instructionalGoals) {
            obj.instructionalGoals.forEach(iGoal => {
                const compDate = completedLessonsMap[iGoal];
                let dateDisplay = compDate ? `<span style="color:#28a745; font-weight:bold;">✔ ${new Date(compDate).toLocaleDateString('ar-SA')}</span>` : `<span style="color:#999;">--/--/----</span>`;
                objectivesRows += `<tr><td style="text-align:center; border:1px solid #ccc; padding:10px;">-</td><td style="border:1px solid #ccc; padding:10px;">${iGoal}</td><td style="text-align:center; border:1px solid #ccc; padding:10px;">${dateDisplay}</td></tr>`;
            });
        }
    });

    html += `
    <div style="display:flex; gap:20px; margin-bottom:20px; flex-wrap:wrap;">
        <div style="flex:1; min-width:250px; border:1px solid #c3e6cb; background:#f0fff4; padding:15px; border-radius:8px;">
            <h5 style="color:#155724; border-bottom:2px solid #c3e6cb; padding-bottom:8px; margin-top:0;">نقاط القوة</h5>
            <ul style="padding-right:20px; margin-top:10px; color:#155724;">${strengthHTML}</ul>
        </div>
        <div style="flex:1; min-width:250px; border:1px solid #f5c6cb; background:#fff5f5; padding:15px; border-radius:8px;">
            <h5 style="color:#721c24; border-bottom:2px solid #f5c6cb; padding-bottom:8px; margin-top:0;">نقاط الاحتياج</h5>
            <ul style="padding-right:20px; margin-top:10px; color:#721c24;">${needsHTML}</ul>
        </div>
    </div>
    
    <div style="background:#e2e3e5; padding:15px; text-align:center; border-radius:5px; margin-bottom:20px; font-size:1.1rem; font-weight:bold; color:#383d41;">
        الهدف بعيد المدى: أن يتقن التلميذ مهارات مادة <span style="color:#0056b3;">${originalTest ? originalTest.subject : (student.subject || 'عام')}</span> بنسبة 80%
    </div>
    
    <h4 style="margin-top:20px; margin-bottom:15px; color:#333;">الأهداف التدريسية للبرنامج:</h4>
    <table style="width:100%; border-collapse:collapse; border:2px solid #333;">
        <thead style="background:#333; color:white;">
            <tr>
                <th style="width:5%; text-align:center; padding:12px; border:1px solid #555;">#</th>
                <th style="padding:12px; border:1px solid #555; text-align:right;">الهدف التدريسي</th>
                <th style="width:20%; text-align:center; padding:12px; border:1px solid #555;">حالة التحقق</th>
            </tr>
        </thead>
        <tbody>
            ${objectivesRows || '<tr><td colspan="3" style="text-align:center; padding:20px; border:1px solid #ccc;">لا توجد أهداف تدريسية مسجلة ضمن خطة هذا الطالب</td></tr>'}
        </tbody>
    </table>`;

    displayReport(html);
}

// ج. تقرير المتابعة والتقدم
async function generateProgressReport(studentId) {
    const { data: student } = await window.supabase.from('users').select('*').eq('id', studentId).single();
    const { data: myLessons } = await window.supabase.from('student_lessons').select('*').eq('studentId', studentId).order('orderIndex', { ascending: true });
    
    let html = buildReportHeader('تقرير المتابعة وتقدم الطالب', student);

    if (!myLessons || myLessons.length === 0) {
        html += `<div style="padding:20px; background:#fff3cd; border:1px solid #ffeeba; text-align:center; border-radius:8px; font-weight:bold; color:#856404;">لا توجد دروس مدرجة في خطة الطالب الحالية أو لم يتم توليد الخطة بعد.</div>`;
        displayReport(html);
        return;
    }

    let completedCount = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
    let progressPct = Math.round((completedCount / myLessons.length) * 100);

    html += `
    <div style="display:flex; gap:15px; margin-bottom:25px; flex-wrap:wrap;">
        <div style="flex:1; min-width:150px; background:#f1f5f9; padding:20px; border-radius:10px; text-align:center; border:1px solid #cbd5e1; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="font-size:2.5rem; font-weight:bold; color:#007bff; margin-bottom:5px;">${progressPct}%</div>
            <div style="color:#475569; font-weight:bold;">نسبة الإنجاز الكلية</div>
        </div>
        <div style="flex:1; min-width:150px; background:#f0fff4; padding:20px; border-radius:10px; text-align:center; border:1px solid #c3e6cb; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="font-size:2.5rem; font-weight:bold; color:#28a745; margin-bottom:5px;">${completedCount}</div>
            <div style="color:#155724; font-weight:bold;">الدروس المنجزة</div>
        </div>
        <div style="flex:1; min-width:150px; background:#fff5f5; padding:20px; border-radius:10px; text-align:center; border:1px solid #f5c6cb; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="font-size:2.5rem; font-weight:bold; color:#dc3545; margin-bottom:5px;">${myLessons.length - completedCount}</div>
            <div style="color:#721c24; font-weight:bold;">الدروس المتبقية</div>
        </div>
    </div>
    
    <h4 style="margin-top:20px; margin-bottom:15px; color:#333; border-bottom:2px solid #eee; padding-bottom:10px;">سجل الدروس المجدولة:</h4>
    <table style="width:100%; border-collapse:collapse; border:1px solid #ccc;">
        <thead style="background:#e9ecef; color:#333;">
            <tr>
                <th style="width:5%; padding:12px; border:1px solid #ccc; text-align:center;">م</th>
                <th style="padding:12px; border:1px solid #ccc; text-align:right;">اسم الدرس (الهدف)</th>
                <th style="width:20%; padding:12px; border:1px solid #ccc; text-align:center;">الحالة</th>
                <th style="width:20%; padding:12px; border:1px solid #ccc; text-align:center;">تاريخ الإنجاز</th>
            </tr>
        </thead>
        <tbody>`;

    myLessons.forEach((l, index) => {
        let statusText = '', statusColor = '', bgClass = '';
        if (l.status === 'completed' || l.passedByAlternative) { statusText = 'مكتمل'; statusColor = '#155724'; bgClass = '#d4edda'; }
        else if (l.status === 'accelerated') { statusText = 'مكتمل بتفوق'; statusColor = '#856404'; bgClass = '#fff3cd'; }
        else if (l.status === 'pending_review') { statusText = 'بانتظار التصحيح'; statusColor = '#854d0e'; bgClass = '#fef08a'; }
        else if (l.status === 'struggling') { statusText = 'يواجه صعوبة'; statusColor = '#721c24'; bgClass = '#f8d7da'; }
        else { statusText = 'قيد الانتظار'; statusColor = '#475569'; bgClass = '#f1f5f9'; }

        let dateStr = (l.completedDate) ? new Date(l.completedDate).toLocaleDateString('ar-SA') : '-';

        html += `<tr>
            <td style="padding:12px; border:1px solid #ccc; text-align:center;">${index + 1}</td>
            <td style="padding:12px; border:1px solid #ccc;"><strong>${l.title}</strong><br><span style="color:#666; font-size:0.9rem;">${l.objective || 'بدون هدف مرتبط'}</span></td>
            <td style="padding:12px; border:1px solid #ccc; text-align:center;"><span style="background:${bgClass}; color:${statusColor}; padding:5px 10px; border-radius:15px; font-weight:bold; font-size:0.9rem;">${statusText}</span></td>
            <td style="padding:12px; border:1px solid #ccc; text-align:center; font-family:monospace;">${dateStr}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    displayReport(html);
}

// د. التقرير الشامل
async function generateComprehensiveReport(studentId) {
    const { data: student } = await window.supabase.from('users').select('*').eq('id', studentId).single();
    let html = buildReportHeader('التقرير الشامل (تشخيص + خطة + تقدم)', student);

    // إظهار رسالة جاري التجميع
    displayReport(html + `<div style="text-align:center; padding:40px; color:#666;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>جاري تجميع التقرير الشامل من السحابة...</div>`);

    // جلب كل البيانات دفعة واحدة
    const [diagRes, lessonsRes] = await Promise.all([
        window.supabase.from('student_tests').select('*').eq('studentId', studentId).eq('type', 'diagnostic').eq('status', 'completed'),
        window.supabase.from('student_lessons').select('*').eq('studentId', studentId)
    ]);

    let fullHtml = html;
    
    // 1. قسم التشخيص
    fullHtml += `<div style="border-bottom:3px solid #333; margin:30px 0 15px 0;"><h3 style="color:#333; margin-bottom:5px;">1. نتيجة التقييم التشخيصي</h3></div>`;
    if (diagRes.data && diagRes.data.length > 0) {
        fullHtml += `<div style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #eee; display:flex; align-items:center; gap:15px;">
            <div style="font-size:3rem; color:${diagRes.data[0].score >= 80 ? '#28a745' : '#007bff'};"><i class="fas fa-clipboard-check"></i></div>
            <div>
                <div style="font-size:1.1rem; color:#666;">درجة الاختبار التشخيصي:</div>
                <div style="font-size:1.8rem; font-weight:bold; color:${diagRes.data[0].score >= 80 ? '#28a745' : '#007bff'};">${diagRes.data[0].score}%</div>
            </div>
        </div>`;
    } else {
        fullHtml += `<p style="color:#dc3545; font-weight:bold;">لم يتم إنجاز الاختبار التشخيصي أو لم يتم تصحيحه بعد.</p>`;
    }

    // 2. قسم التقدم العام
    fullHtml += `<div style="border-bottom:3px solid #333; margin:30px 0 15px 0;"><h3 style="color:#333; margin-bottom:5px;">2. التقدم والإنجاز في الخطة العلاجية</h3></div>`;
    if (lessonsRes.data && lessonsRes.data.length > 0) {
        let myLessons = lessonsRes.data;
        let completedCount = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
        let progressPct = Math.round((completedCount / myLessons.length) * 100);
        
        fullHtml += `
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #eee; margin-bottom:15px;">
            <p style="font-size:1.1rem; margin-bottom:10px;"><strong>نسبة إنجاز الخطة المجدولة:</strong> <span style="font-size:1.3rem; font-weight:bold; color:${progressPct >= 80 ? '#28a745' : '#007bff'};">${progressPct}%</span></p>
            <div style="background:#e9ecef; border-radius:10px; height:20px; width:100%; overflow:hidden;">
                <div style="background:${progressPct >= 80 ? '#28a745' : '#007bff'}; width:${progressPct}%; height:100%;"></div>
            </div>
            <p style="text-align:center; margin-top:10px; color:#666;">تم إنجاز ( ${completedCount} ) دروس من أصل ( ${myLessons.length} ) درس مسند.</p>
        </div>`;
    } else {
        fullHtml += `<p style="color:#dc3545; font-weight:bold;">لا توجد خطة علاجية مسندة للطالب حتى الآن.</p>`;
    }

    // 3. التوصيات العامة
    fullHtml += `<div style="border-bottom:3px solid #333; margin:30px 0 15px 0;"><h3 style="color:#333; margin-bottom:5px;">3. التوصيات العامة</h3></div>
                 <div style="background:#fffbcc; padding:20px; border:1px solid #ffeeba; border-radius:8px; line-height:1.8; font-size:1.1rem; color:#856404;">
                 بناءً على المعطيات أعلاه في نظام ميسر التعلم، يوصى بالاستمرار في متابعة الخطة العلاجية الفردية للطالب (إن وجدت)، وتقديم التعزيز الإيجابي المستمر، مع مراجعة الأهداف التي قد يواجه فيها صعوبة بشكل دوري لضمان الإتقان التام للمهارات المستهدفة والمشاركة الفعالة لولي الأمر في المتابعة.
                 </div>`;

    displayReport(fullHtml);
}

// ============================================
// أدوات مساعدة (Helpers) للتقارير
// ============================================

function buildReportHeader(title, student) {
    const teacher = getCurrentUser() || { name: 'غير معروف' };
    const today = new Date().toLocaleDateString('ar-SA');
    return `
    <div id="printArea" style="font-family:'Tajawal', sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px;">
            <div style="width: 30%; font-size: 13px; line-height: 1.6; font-weight:bold;">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                برنامج صعوبات التعلم<br>
                نظام ميسر التعلم
            </div>
            <div style="width: 40%; text-align: center;">
                <h2 style="margin: 0; font-size: 24px; color: #000; font-weight:900;">${title}</h2>
            </div>
            <div style="width: 30%; text-align: left; font-size: 13px; line-height: 1.6; font-weight:bold;">
                التاريخ: ${today}<br>
                المعلم: أ/ ${teacher.name}
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8f9fa; padding: 20px; border: 1px solid #ddd; margin-bottom: 25px; border-radius: 8px;">
            <div style="font-size: 15px; color: #333;"><strong>اسم الطالب:</strong> <span style="color:#0056b3;">${student.name}</span></div>
            <div style="font-size: 15px; color: #333;"><strong>الصف الدراسي:</strong> ${student.grade || '-'}</div>
            <div style="font-size: 15px; color: #333;"><strong>المادة المستهدفة:</strong> ${student.subject || 'عام'}</div>
            <div style="font-size: 15px; color: #333;"><strong>حالة الملف:</strong> ${student.status === 'active' ? '<span style="color:#28a745;">نشط</span>' : '<span style="color:#dc3545;">موقوف</span>'}</div>
        </div>
    </div>`;
}

function displayReport(htmlContent) {
    const resultArea = document.getElementById('reportResultArea') || document.getElementById('resultArea') || document.querySelector('.result-container');
    const contentArea = document.getElementById('generatedReportContent') || document.getElementById('reportContent') || document.getElementById('reportResultArea');
    
    if (contentArea) contentArea.innerHTML = htmlContent;
    if (resultArea) resultArea.style.display = 'block';
}

window.printReport = function() {
    const contentArea = document.getElementById('generatedReportContent') || document.getElementById('reportContent') || document.getElementById('reportResultArea');
    const reportContent = contentArea ? contentArea.innerHTML : '';
    
    if (!reportContent) {
        alert('لا يوجد تقرير لطباعته. الرجاء توليد التقرير أولاً.');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>طباعة التقرير</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                body { font-family: 'Tajawal', serif; padding: 40px; color: #000; background: #fff; line-height: 1.6; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; border: 2px solid #000; }
                th, td { border: 1px solid #000 !important; padding: 12px; }
                th { background-color: #eee !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                .text-center { text-align: center; }
                .footer-signatures { margin-top: 60px; display: flex; justify-content: space-between; text-align: center; font-weight: bold; }
                .footer-signatures div { width: 35%; border-top: 1px dashed #000; padding-top: 10px; }
                @media print {
                    body { padding: 0; }
                    button, .no-print { display: none !important; }
                    .badge { border: 1px solid #000; padding: 2px 5px; border-radius: 4px; }
                }
            </style>
        </head>
        <body>
            ${reportContent}
            <div class="footer-signatures">
                <div>توقيع معلم صعوبات التعلم</div>
                <div>ختم وتوقيع مدير المدرسة</div>
            </div>
            <script>
                window.onload = function() { 
                    setTimeout(() => { window.print(); window.close(); }, 500); 
                }
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// ============================================
// 📁 المسار: assets/js/reports.js (النسخة السحابية الكاملة)
// الوصف: توليد التقارير الشاملة من Supabase
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentsList();
});

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

// 1. تحميل قائمة الطلاب في القائمة المنسدلة
async function loadStudentsList() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const { data: students, error } = await window.supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('teacherId', user.id)
            .order('name', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('reportStudentSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- اختر الطالب --</option>';
        if (students && students.length > 0) {
            students.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        } else {
            select.innerHTML += '<option value="" disabled>لا يوجد طلاب مضافين</option>';
        }
    } catch (e) {
        console.error("Error loading students:", e);
    }
}

// 2. الدالة الرئيسية لتوجيه طلب التقرير
window.initiateReport = async function() {
    const studentId = document.getElementById('reportStudentSelect').value;
    const type = document.getElementById('reportTypeSelect').value;
    
    if (!studentId || !type) {
        alert('الرجاء تحديد الطالب ونوع التقرير أولاً.');
        return;
    }

    const loadingArea = document.getElementById('reportLoading');
    const resultArea = document.getElementById('reportResultArea');
    
    if (loadingArea) loadingArea.style.display = 'block';
    if (resultArea) resultArea.style.display = 'none';

    try {
        if (type === 'diagnostic') await generateDiagnosticReport(studentId);
        else if (type === 'iep') await generateIEPReport(studentId);
        else if (type === 'progress') await generateProgressReport(studentId);
        else if (type === 'comprehensive') await generateComprehensiveReport(studentId);
    } catch (e) {
        console.error("Report Generation Error:", e);
        alert('حدث خطأ أثناء توليد التقرير. تأكد من اتصالك بالإنترنت.');
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
        html += `<div class="alert alert-warning text-center">لا يوجد اختبار تشخيصي مكتمل ومصحح لهذا الطالب حتى الآن.</div>`;
    } else {
        const test = diagTests[0];
        const { data: origTest } = await window.supabase.from('tests').select('*').eq('id', test.testId).single();
        
        html += `
        <div style="background:#fff; padding:20px; border:1px solid #ddd; border-radius:8px; margin-bottom:20px;">
            <h4 style="color:#0056b3;">تفاصيل الاختبار</h4>
            <table class="table table-bordered mt-3">
                <tr><td style="background:#f8f9fa; width:30%;"><strong>اسم الاختبار:</strong></td><td>${origTest ? origTest.title : 'اختبار محذوف'}</td></tr>
                <tr><td style="background:#f8f9fa;"><strong>المادة:</strong></td><td>${origTest ? origTest.subject : student.subject}</td></tr>
                <tr><td style="background:#f8f9fa;"><strong>الدرجة الكلية:</strong></td><td><span style="font-size:1.2rem; font-weight:bold; color:${test.score >= 80 ? '#28a745' : '#dc3545'};">${test.score}%</span></td></tr>
                <tr><td style="background:#f8f9fa;"><strong>تاريخ الإنجاز:</strong></td><td>${new Date(test.assignedDate).toLocaleDateString('ar-SA')}</td></tr>
            </table>
            <div class="alert ${test.score >= 80 ? 'alert-success' : 'alert-danger'} mt-3">
                <strong>النتيجة:</strong> ${test.score >= 80 ? 'الطالب متفوق وتجاوز محك الاجتياز.' : 'يحتاج الطالب إلى خطة علاجية فردية (IEP) بناءً على نقاط الاحتياج.'}
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
        html += `<div class="alert alert-warning text-center">لا يمكن توليد الخطة. يجب إكمال الاختبار التشخيصي أولاً.</div>`;
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
        if (l.status === 'completed' || l.status === 'accelerated') {
            completedLessonsMap[l.objective] = l.completedDate || 'مكتمل'; 
        }
    });

    let objectivesRows = ''; let stgCounter = 1;
    needsObjects.forEach(obj => {
        objectivesRows += `<tr style="background-color:#dbeeff !important;"><td class="text-center" style="font-weight:bold; color:#0056b3;">${stgCounter++}</td><td colspan="2" style="font-weight:bold; color:#0056b3;">الهدف القصير: ${obj.shortTermGoal}</td></tr>`;
        if (obj.instructionalGoals) {
            obj.instructionalGoals.forEach(iGoal => {
                const compDate = completedLessonsMap[iGoal];
                let dateDisplay = compDate ? `<span class="text-success font-weight-bold">✔ ${new Date(compDate).toLocaleDateString('ar-SA')}</span>` : `<span style="color:#ccc;">--/--/----</span>`;
                objectivesRows += `<tr><td class="text-center">-</td><td>${iGoal}</td><td class="text-center">${dateDisplay}</td></tr>`;
            });
        }
    });

    html += `
    <div style="display:flex; gap:20px; margin-bottom:20px;">
        <div style="flex:1; border:1px solid #ddd; padding:15px; border-radius:8px;">
            <h5 style="color:#28a745; border-bottom:2px solid #28a745; padding-bottom:5px;">نقاط القوة</h5>
            <ul style="padding-right:20px; margin-top:10px;">${strengthHTML}</ul>
        </div>
        <div style="flex:1; border:1px solid #ddd; padding:15px; border-radius:8px;">
            <h5 style="color:#dc3545; border-bottom:2px solid #dc3545; padding-bottom:5px;">نقاط الاحتياج</h5>
            <ul style="padding-right:20px; margin-top:10px;">${needsHTML}</ul>
        </div>
    </div>
    
    <div class="alert alert-info text-center" style="font-size:1.1rem;">
        الهدف بعيد المدى: أن يتقن التلميذ مهارات مادة <strong>${originalTest ? originalTest.subject : student.subject}</strong> بنسبة 80%
    </div>
    
    <h4 style="margin-top:20px; margin-bottom:15px;">الأهداف التدريسية للبرنامج:</h4>
    <table class="table table-bordered">
        <thead style="background:#333; color:white;">
            <tr><th style="width:5%; text-align:center;">#</th><th>الهدف التدريسي</th><th style="width:20%; text-align:center;">حالة التحقق</th></tr>
        </thead>
        <tbody>
            ${objectivesRows || '<tr><td colspan="3" class="text-center">لا توجد أهداف تدريسية مسجلة</td></tr>'}
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
        html += `<div class="alert alert-warning text-center">لا توجد دروس أو سجل متابعة لهذا الطالب.</div>`;
        displayReport(html);
        return;
    }

    let completedCount = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
    let progressPct = Math.round((completedCount / myLessons.length) * 100);

    html += `
    <div style="display:flex; gap:20px; margin-bottom:20px;">
        <div style="flex:1; background:#f8f9fa; padding:15px; border-radius:8px; text-align:center; border:1px solid #ddd;">
            <div style="font-size:2rem; font-weight:bold; color:#007bff;">${progressPct}%</div>
            <div>نسبة الإنجاز الكلية</div>
        </div>
        <div style="flex:1; background:#f8f9fa; padding:15px; border-radius:8px; text-align:center; border:1px solid #ddd;">
            <div style="font-size:2rem; font-weight:bold; color:#28a745;">${completedCount}</div>
            <div>الدروس المنجزة</div>
        </div>
        <div style="flex:1; background:#f8f9fa; padding:15px; border-radius:8px; text-align:center; border:1px solid #ddd;">
            <div style="font-size:2rem; font-weight:bold; color:#dc3545;">${myLessons.length - completedCount}</div>
            <div>الدروس المتبقية</div>
        </div>
    </div>
    
    <h4 style="margin-top:20px; margin-bottom:15px;">سجل الدروس المجدولة:</h4>
    <table class="table table-bordered">
        <thead style="background:#f1f5f9;">
            <tr><th style="width:5%;">م</th><th>اسم الدرس (الهدف)</th><th style="width:15%;">الحالة</th><th style="width:20%;">تاريخ الإنجاز</th></tr>
        </thead>
        <tbody>`;

    myLessons.forEach((l, index) => {
        let statusText = '', statusColor = '';
        if (l.status === 'completed') { statusText = 'مكتمل'; statusColor = 'color:#28a745;'; }
        else if (l.status === 'accelerated') { statusText = 'مكتمل بتفوق'; statusColor = 'color:#ffc107;'; }
        else if (l.status === 'pending_review') { statusText = 'بانتظار التصحيح'; statusColor = 'color:#fd7e14;'; }
        else { statusText = 'قيد الانتظار'; statusColor = 'color:#6c757d;'; }

        let dateStr = (l.completedDate) ? new Date(l.completedDate).toLocaleDateString('ar-SA') : '-';

        html += `<tr>
            <td class="text-center">${index + 1}</td>
            <td><strong>${l.title}</strong><br><small class="text-muted">${l.objective || ''}</small></td>
            <td class="text-center" style="font-weight:bold; ${statusColor}">${statusText}</td>
            <td class="text-center">${dateStr}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    displayReport(html);
}

// د. التقرير الشامل
async function generateComprehensiveReport(studentId) {
    const { data: student } = await window.supabase.from('users').select('*').eq('id', studentId).single();
    let html = buildReportHeader('التقرير الشامل (تشخيص + خطة + تقدم)', student);

    html += `<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin fa-2x"></i> جاري تجميع التقرير الشامل...</div>`;
    displayReport(html);

    // دمج التقارير الثلاثة
    setTimeout(async () => {
        let fullHtml = buildReportHeader('التقرير الشامل لأداء الطالب', student);
        
        // 1. قسم التشخيص
        fullHtml += `<div style="border-bottom:3px solid #333; margin:30px 0 15px 0;"><h3>1. نتيجة التشخيص</h3></div>`;
        const { data: diagTests } = await window.supabase.from('student_tests').select('*').eq('studentId', studentId).eq('type', 'diagnostic').eq('status', 'completed');
        if (diagTests && diagTests.length > 0) {
            fullHtml += `<p><strong>درجة الاختبار التشخيصي:</strong> <span style="font-size:1.2rem; font-weight:bold; color:#007bff;">${diagTests[0].score}%</span></p>`;
        } else {
            fullHtml += `<p class="text-muted">لم يتم إنجاز الاختبار التشخيصي.</p>`;
        }

        // 2. قسم التقدم العام
        fullHtml += `<div style="border-bottom:3px solid #333; margin:30px 0 15px 0;"><h3>2. التقدم والإنجاز</h3></div>`;
        const { data: myLessons } = await window.supabase.from('student_lessons').select('*').eq('studentId', studentId);
        if (myLessons && myLessons.length > 0) {
            let completedCount = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated').length;
            let progressPct = Math.round((completedCount / myLessons.length) * 100);
            fullHtml += `<p><strong>نسبة إنجاز الخطة:</strong> <span style="font-size:1.2rem; font-weight:bold; color:#28a745;">${progressPct}%</span> (${completedCount} من ${myLessons.length} درس)</p>`;
        } else {
            fullHtml += `<p class="text-muted">لا توجد دروس مسندة في الخطة.</p>`;
        }

        // 3. ملاحظات عامة
        fullHtml += `<div style="border-bottom:3px solid #333; margin:30px 0 15px 0;"><h3>3. التوصيات</h3></div>
                     <p style="line-height:1.8; font-size:1.1rem;">بناءً على المعطيات أعلاه، يوصى بالاستمرار في متابعة الخطة العلاجية الفردية للطالب، وتقديم التعزيز الإيجابي المستمر، مع مراجعة الأهداف التي يواجه فيها صعوبة بشكل دوري لضمان الإتقان التام للمهارات المستهدفة.</p>`;

        displayReport(fullHtml);
    }, 1000);
}

// ============================================
// أدوات مساعدة (Helpers)
// ============================================

function buildReportHeader(title, student) {
    const teacher = getCurrentUser();
    const today = new Date().toLocaleDateString('ar-SA');
    return `
    <style>
        .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .report-header-side { width: 30%; font-size: 13px; line-height: 1.6; }
        .report-header-mid { width: 40%; text-align: center; }
        .report-header-mid h2 { margin: 0; font-size: 22px; color: #000; }
        .student-info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f9f9f9; padding: 15px; border: 1px solid #000; margin-bottom: 20px; border-radius: 5px; }
        .student-info-box div { font-size: 14px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ddd; }
        th, td { border: 1px solid #ddd; padding: 10px; }
        th { background-color: #f1f5f9; font-weight: bold; }
    </style>
    <div id="printArea">
        <div class="report-header">
            <div class="report-header-side">المملكة العربية السعودية<br>برنامج صعوبات التعلم<br>نظام ميسر التعلم</div>
            <div class="report-header-mid"><h2>${title}</h2></div>
            <div class="report-header-side" style="text-align: left;">التاريخ: ${today}<br>المعلم: أ/ ${teacher.name}</div>
        </div>
        <div class="student-info-box">
            <div><strong>اسم الطالب:</strong> ${student.name}</div>
            <div><strong>الصف الدراسي:</strong> ${student.grade || '-'}</div>
            <div><strong>المادة:</strong> ${student.subject || 'عام'}</div>
            <div><strong>حالة الحساب:</strong> ${student.status === 'active' ? 'نشط' : 'موقوف'}</div>
        </div>
    </div>`;
}

function displayReport(htmlContent) {
    const resultArea = document.getElementById('reportResultArea');
    const contentArea = document.getElementById('generatedReportContent');
    
    if (contentArea) contentArea.innerHTML = htmlContent;
    if (resultArea) resultArea.style.display = 'block';
}

window.printReport = function() {
    const reportContent = document.getElementById('generatedReportContent').innerHTML;
    if (!reportContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>طباعة التقرير</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                body { font-family: 'Tajawal', serif; padding: 40px; color: #000; background: #fff; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 2px solid #000; }
                th, td { border: 1px solid #000; padding: 10px; }
                th { background-color: #eee !important; -webkit-print-color-adjust: exact; }
                .text-center { text-align: center; }
                .alert { border: 1px solid #000; padding: 10px; text-align: center; border-radius: 5px; }
                .footer-signatures { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-weight: bold; }
                .footer-signatures div { width: 30%; border-top: 1px solid #000; padding-top: 10px; }
            </style>
        </head>
        <body>
            ${reportContent}
            <div class="footer-signatures">
                <div>توقيع معلم صعوبات التعلم</div>
                <div>توقيع مدير المدرسة</div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// ============================================
// 📁 المسار: assets/js/reports.js
// الوصف: محرك التقارير + مولد بيانات تلقائي
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initMockData(); // 🔥 خطوة مهمة: تجهيز بيانات وهمية إذا كانت الذاكرة فارغة
    checkPermissions();
    loadStudentList();
});

// ==========================================
// 🛠️ 0. تجهيز بيانات وهمية (لحل مشكلة الصفحة الفارغة)
// ==========================================
function initMockData() {
    // 1. إنشاء مستخدم (معلم)
    if (!sessionStorage.getItem('currentUser')) {
        const teacher = { id: 1, name: "أ. محمد العتيبي", role: "teacher", email: "teacher@school.com" };
        sessionStorage.setItem('currentUser', JSON.stringify({ user: teacher }));
    }

    // 2. إنشاء قائمة طلاب وهمية
    if (!localStorage.getItem('students')) {
        const mockStudents = [
            { id: 101, name: "نايف محمد", grade: "الرابع", diagnosis: "عسر قراءة" },
            { id: 102, name: "سعود فيصل", grade: "الخامس", diagnosis: "تشتت انتباه" },
            { id: 103, name: "عبدالله أحمد", grade: "الثالث", diagnosis: "عسر حساب" }
        ];
        localStorage.setItem('students', JSON.stringify(mockStudents));
        console.log("تم إنشاء بيانات طلاب وهمية للتجربة");
    }
}

// ==========================================
// 🔒 1. الصلاحيات
// ==========================================
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{"user":{"role":"guest", "name":"زائر"}}').user;
}

function checkPermissions() {
    const user = getCurrentUser();
    document.getElementById('currentUserName') ? document.getElementById('currentUserName').innerText = user.name : null;
    
    const balanceOption = document.getElementById('optSessionBalance');
    if (user.role !== 'teacher' && user.role !== 'admin') {
        if(balanceOption) balanceOption.remove();
    }
}

// ==========================================
// 👥 2. القوائم
// ==========================================
function loadStudentList() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const container = document.getElementById('studentCheckboxes');
    
    if (students.length === 0) {
        container.innerHTML = '<div style="color:red;">لا يوجد طلاب</div>';
        return;
    }

    container.innerHTML = '';
    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'student-checkbox';
        div.innerHTML = `
            <input type="checkbox" name="selectedStudent" value="${student.id}" id="st_${student.id}">
            <label for="st_${student.id}">${student.name}</label>
        `;
        container.appendChild(div);
    });
}

function selectAllStudents(source) {
    const checkboxes = document.getElementsByName('selectedStudent');
    for(let i=0; i<checkboxes.length; i++) { checkboxes[i].checked = source.checked; }
}

function toggleStudentSelector() {
    // يمكن إضافة منطق لإخفاء قائمة الطلاب في تقارير معينة
}

// ==========================================
// 📊 3. توليد التقرير
// ==========================================
function generateReport() {
    const type = document.getElementById('reportTypeSelector').value;
    const checkboxes = document.querySelectorAll('input[name="selectedStudent"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    if (!type) { alert("الرجاء اختيار نوع التقرير"); return; }
    if (selectedIds.length === 0 && type !== 'schedule') { // الجدول الدراسي عام
        alert("الرجاء اختيار طالب واحد على الأقل"); return;
    }

    const paper = document.getElementById('reportPaper');
    document.getElementById('reportActions').style.display = 'block';
    
    // الترويسة
    const headerHtml = `
        <div class="report-header">
            <h1>المملكة العربية السعودية</h1>
            <h2>وزارة التعليم - برنامج صعوبات التعلم</h2>
            <br>
            <h1>${getReportTitle(type)}</h1>
            <div class="report-meta">
                <span><strong>المعلم:</strong> ${getCurrentUser().name}</span>
                <span><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</span>
            </div>
        </div>
    `;

    let bodyHtml = '';
    switch(type) {
        case 'attendance': bodyHtml = generateAttendanceReport(selectedIds); break;
        case 'progress': bodyHtml = generateProgressReport(selectedIds); break;
        case 'assignments': bodyHtml = generateAssignmentsReport(selectedIds); break;
        case 'iep': bodyHtml = generateIEPReport(selectedIds); break;
        case 'diagnostic': bodyHtml = generateDiagnosticReport(selectedIds); break;
        case 'schedule': bodyHtml = generateScheduleReport(); break;
        case 'balance': bodyHtml = generateSessionBalanceReport(selectedIds); break;
        case 'committee': bodyHtml = generateCommitteeReport(selectedIds); break;
        case 'certificate': bodyHtml = generateCertificates(selectedIds); break;
    }

    paper.innerHTML = headerHtml + bodyHtml;
}

function getReportTitle(type) {
    const titles = {
        'attendance': 'تقرير متابعة الغياب والحضور',
        'progress': 'تقرير نسب الإنجاز للمهارات',
        'assignments': 'تقرير متابعة الواجبات',
        'iep': 'الخطة التربوية الفردية (IEP)',
        'diagnostic': 'نتائج الاختبارات التشخيصية',
        'schedule': 'الجدول الدراسي لغرفة المصادر',
        'balance': 'سجل رصيد الحصص (داخلي)',
        'committee': 'محاضر وقرارات لجنة صعوبات التعلم',
        'certificate': 'شهادة شكر وتقدير'
    };
    return titles[type] || 'تقرير';
}

// ------------------------------------------
// 🏗️ دوال بناء الجداول (مع بيانات عشوائية للعرض)
// ------------------------------------------

function getStudentById(id) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.find(s => s.id == id) || {name: 'طالب'};
}

// 1. الغياب
function generateAttendanceReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>م</th><th>الطالب</th><th>أيام الغياب</th><th>التواريخ</th><th>الملاحظات</th></tr></thead><tbody>`;
    ids.forEach((id, index) => {
        const st = getStudentById(id);
        const days = Math.floor(Math.random() * 6);
        html += `<tr>
            <td>${index + 1}</td>
            <td>${st.name}</td>
            <td class="${days > 3 ? 'status-bad' : ''}">${days} أيام</td>
            <td>${days > 0 ? '2023-10-01, 2023-10-15' : '-'}</td>
            <td>${days > 3 ? 'تنبيه: الغياب أثر على التحسن' : 'منتظم'}</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 2. الإنجاز
function generateProgressReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>الدرس الحالي</th><th>نسبة الإنجاز</th><th>الحالة</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const st = getStudentById(id);
        const progress = Math.floor(Math.random() * 100);
        html += `<tr>
            <td>${st.name}</td>
            <td>التمييز بين الحروف المتشابهة</td>
            <td>
                <div style="background:#eee; height:10px; width:100px; margin:auto; border-radius:5px;">
                    <div style="background:${progress>50?'#28a745':'#ffc107'}; height:100%; width:${progress}%; border-radius:5px;"></div>
                </div>
                ${progress}%
            </td>
            <td>${progress > 70 ? 'متقدم' : 'يحتاج دعم'}</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 3. الواجبات
function generateAssignmentsReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>المسندة</th><th>المحلولة</th><th>غير المحلولة</th><th>نسبة الالتزام</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const st = getStudentById(id);
        const total = 12;
        const solved = Math.floor(Math.random() * 13);
        const missed = total - solved;
        html += `<tr>
            <td>${st.name}</td>
            <td>${total}</td>
            <td class="status-good">${solved}</td>
            <td class="status-bad">${Math.max(0, missed)}</td>
            <td>${Math.round((solved/total)*100)}%</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 4. الخطة (IEP)
function generateIEPReport(ids) {
    let html = '';
    ids.forEach(id => {
        const st = getStudentById(id);
        html += `
        <div style="border:1px solid #333; padding:15px; margin-bottom:20px; text-align:right;">
            <h3 style="border-bottom:1px solid #ccc; padding-bottom:5px;">بيانات الطالب: ${st.name}</h3>
            <p><strong>التشخيص:</strong> ${st.diagnosis || 'غير محدد'}</p>
            <p><strong>نقاط القوة:</strong> التعاون، حب الرسم.</p>
            <p><strong>نقاط الاحتياج:</strong> التمييز السمعي، الانتباه.</p>
            <table class="report-table" style="margin-top:10px;">
                <thead><tr><th>الهدف التدريسي</th><th>تاريخ البدء</th><th>تاريخ المتوقع للإنجاز</th><th>حالة الهدف</th></tr></thead>
                <tbody>
                    <tr><td>أن يقرأ الطالب كلمات ثلاثية بحركة الفتح</td><td>2023-09-01</td><td>2023-09-30</td><td>✅ تم الإتقان</td></tr>
                    <tr><td>أن يميز الطالب بين التاء المفتوحة والمربوطة</td><td>2023-10-01</td><td>2023-10-20</td><td>🔄 قيد التدريب</td></tr>
                </tbody>
            </table>
        </div>`;
    });
    return html;
}

// 5. التشخيص
function generateDiagnosticReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>نوع الاختبار</th><th>الدرجة</th><th>النتيجة</th><th>التوصية</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const st = getStudentById(id);
        html += `<tr>
            <td>${st.name}</td>
            <td>اختبار نمائي (انتباه)</td>
            <td>6/10</td>
            <td>متوسط</td>
            <td>يحتاج تدريبات تركيز بصري</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 6. الجدول الدراسي
function generateScheduleReport() {
    return `
    <table class="report-table">
        <thead><tr><th>الحصة / اليوم</th><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th></tr></thead>
        <tbody>
            <tr><td><strong>الأولى</strong></td><td>نايف محمد</td><td>-</td><td>سعود فيصل</td><td>-</td><td>عبدالله أحمد</td></tr>
            <tr><td><strong>الثانية</strong></td><td>-</td><td>عبدالله أحمد</td><td>-</td><td>نايف محمد</td><td>-</td></tr>
            <tr><td><strong>الثالثة</strong></td><td>سعود فيصل</td><td>-</td><td>عبدالله أحمد</td><td>-</td><td>سعود فيصل</td></tr>
        </tbody>
    </table>
    <p style="margin-top:10px; text-align:right;">* هذا الجدول يوضح توزيع الطلاب على حصص غرفة المصادر.</p>
    `;
}

// 7. رصيد الحصص
function generateSessionBalanceReport(ids) {
    // فحص أمان إضافي
    if (getCurrentUser().role !== 'teacher' && getCurrentUser().role !== 'admin') return '';

    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>المقرر</th><th>المنفذ</th><th>الرصيد</th><th>الحالة</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const st = getStudentById(id);
        const req = 15;
        const done = Math.floor(Math.random() * 20);
        const balance = done - req;
        let status = balance < 0 ? `<span class="status-bad">نقص (${balance})</span>` : `<span class="status-good">زيادة (+${balance})</span>`;
        if(balance === 0) status = 'منتظم';
        
        html += `<tr><td>${st.name}</td><td>${req}</td><td>${done}</td><td style="direction:ltr">${balance}</td><td>${status}</td></tr>`;
    });
    return html + `</tbody></table>`;
}

// 8. اللجنة
function generateCommitteeReport(ids) {
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>تاريخ الاجتماع</th><th>الأعضاء</th><th>التوصيات</th><th>التوقيع</th></tr></thead><tbody>`;
    ids.forEach(id => {
        const st = getStudentById(id);
        html += `<tr>
            <td>${st.name}</td>
            <td>2023-12-01</td>
            <td>المدير، المرشد، المعلم</td>
            <td>استمرار الطالب في البرنامج مع تكثيف الخطط السلوكية</td>
            <td style="font-family:'Reem Kufi', cursive; color:#007bff;">(تم التوقيع إلكترونياً)</td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

// 9. الشهادة
function generateCertificates(ids) {
    let html = '';
    ids.forEach(id => {
        const st = getStudentById(id);
        html += `
        <div style="border: 10px double #1565c0; padding: 40px; margin-bottom: 30px; text-align: center; height: 200mm; position: relative;">
            <div style="position: absolute; top:0; left:0; width:100%; height:100%; opacity:0.05; background:url('assets/images/logo.png') no-repeat center center; background-size:contain;"></div>
            
            <h1 style="color:#d4af37; font-size:40px; margin-bottom:10px;">شهادة شكر وتقدير</h1>
            <p style="font-size:18px;">يسر إدارة برنامج صعوبات التعلم أن تتقدم بأجمل عبارات الشكر للبطل:</p>
            
            <h2 style="color:#1565c0; font-size:35px; margin: 30px 0; border-bottom:2px solid #eee; display:inline-block; padding-bottom:10px;">${st.name}</h2>
            
            <p style="font-size:20px;">وذلك لتميزه وإتقانه لمهارة:</p>
            <h3 style="background:#f9f9f9; padding:10px; display:inline-block;">( قراءة الكلمات البصرية )</h3>
            
            <div style="margin-top: 80px; display:flex; justify-content:space-between; padding:0 50px;">
                <div style="text-align:center;">
                    <p><strong>معلم الصعوبات</strong></p>
                    <p style="color:#777;">أ. محمد العتيبي</p>
                </div>
                <div style="text-align:center;">
                    <p><strong>مدير المدرسة</strong></p>
                    <p style="color:#777;">....................</p>
                </div>
            </div>
        </div>
        <div style="page-break-after: always;"></div>
        `;
    });
    return html;
}

// تحميل PDF
function downloadPDF() {
    const element = document.getElementById('reportPaper');
    const opt = {
        margin: 0,
        filename: 'تقرير_ميسر_التعلم.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

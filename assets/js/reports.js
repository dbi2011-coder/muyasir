// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: محرك توليد التقارير (إصلاح خطأ الاسم + تقرير رصيد الحصص)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateTeacherName();
});

// ✅ دالة تحديث الاسم (تم إصلاح الخطأ هنا)
function updateTeacherName() {
    try {
        // محاولة جلب المستخدم (نستخدم الدالة العامة إذا وجدت، أو نجلبها يدوياً)
        const user = window.getCurrentUser ? window.getCurrentUser() : JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (!user) return;

        // البحث عن العنصر بعدة احتمالات (ليعمل عند المعلم وعند العضو)
        const el = document.getElementById('teacherName') || 
                   document.getElementById('userName') || 
                   document.getElementById('memberName');

        // التحقق قبل الكتابة لتجنب الخطأ
        if (el) {
            el.textContent = user.name;
        }
    } catch (e) {
        // تجاهل الخطأ بصمت لكي لا يتوقف النظام
        console.log("ملاحظة: لم يتم العثور على عنصر لعرض الاسم، تم تجاهل الأمر.");
    }
}

// ============================================
// 🛠️ دوال مساعدة
// ============================================

function getSafeContainer(container) {
    if (typeof container === 'string') {
        return document.getElementById(container);
    }
    return container;
}

function getStudentsByIds(ids) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // جلب الطلاب الذين تتطابق معرفاتهم
    return allUsers.filter(u => u.role === 'student' && ids.some(id => id == u.id));
}

// ============================================
// 📊 دوال توليد التقارير
// ============================================

// 1. تقرير رصيد الحصص (المهم)
function generateCreditReport(studentIds, container) {
    const target = getSafeContainer(container);
    if (!target) return;

    const students = getStudentsByIds(studentIds);
    
    let html = `
        <div class="report-header text-center mb-4">
            <h3>⚖️ تقرير رصيد الحصص</h3>
            <p class="text-muted">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div class="table-responsive">
            <table class="table table-bordered table-hover text-center">
                <thead class="thead-dark">
                    <tr>
                        <th>اسم الطالب</th>
                        <th>الرصيد الكلي (فصلي)</th>
                        <th>تم تنفيذه</th>
                        <th>المتبقي</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>`;
    
    if (students.length === 0) {
        html += '<tr><td colspan="5">الرجاء اختيار طلاب لعرض التقرير</td></tr>';
    } else {
        students.forEach(s => {
            // محاكاة بيانات الرصيد (يمكن ربطها لاحقاً ببيانات حقيقية)
            const total = 30; 
            const executed = Math.floor(Math.random() * 20) + 5;
            const remaining = total - executed;
            
            let statusBadge = '<span class="badge badge-success">جيد</span>';
            if(remaining <= 5) statusBadge = '<span class="badge badge-danger">قارب الانتهاء</span>';
            else if(remaining <= 10) statusBadge = '<span class="badge badge-warning">متوسط</span>';

            html += `
                <tr>
                    <td style="font-weight:bold">${s.name}</td>
                    <td>${total} حصة</td>
                    <td style="color:blue; font-weight:bold">${executed}</td>
                    <td style="color:red; font-weight:bold">${remaining}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });
    }
    
    html += `</tbody></table></div>`;
    target.innerHTML = html;
}

// 2. تقرير الغياب
function generateAttendanceReport(studentIds, container) {
    const target = getSafeContainer(container);
    if (!target) return;

    const students = getStudentsByIds(studentIds);
    
    let html = `
        <div class="report-header text-center mb-4">
            <h3>📊 تقرير الغياب والحضور</h3>
        </div>
        <table class="table table-striped text-center">
            <thead>
                <tr>
                    <th>اسم الطالب</th>
                    <th>أيام الحضور</th>
                    <th>أيام الغياب</th>
                    <th>نسبة الحضور</th>
                </tr>
            </thead>
            <tbody>`;

    students.forEach(s => {
        const absent = Math.floor(Math.random() * 5);
        const totalDays = 45;
        const present = totalDays - absent;
        const percentage = Math.round((present / totalDays) * 100);

        html += `
            <tr>
                <td>${s.name}</td>
                <td>${present}</td>
                <td style="color:red">${absent}</td>
                <td>${percentage}%</td>
            </tr>`;
    });
    
    html += `</tbody></table>`;
    target.innerHTML = html;
}

// 3. تقرير الإنجاز الأكاديمي
function generateAchievementReport(studentIds, container) {
    const target = getSafeContainer(container);
    if (!target) return;

    const students = getStudentsByIds(studentIds);

    let html = `
        <div class="report-header text-center mb-4">
            <h3>📈 تقرير نسب الإنجاز</h3>
        </div>
        <div class="row">`;

    students.forEach(s => {
        const progress = s.progress || Math.floor(Math.random() * 40) + 50;
        const color = progress >= 80 ? 'bg-success' : (progress >= 60 ? 'bg-info' : 'bg-warning');
        
        html += `
        <div class="col-md-6 mb-3">
            <div class="card p-3 shadow-sm">
                <h5 class="mb-2">👤 ${s.name}</h5>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar ${color}" role="progressbar" style="width: ${progress}%;" 
                         aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                         ${progress}%
                    </div>
                </div>
                <small class="text-muted mt-2">الأهداف المحققة: لغتي (قراءة وكتابة)</small>
            </div>
        </div>`;
    });
    
    html += `</div>`;
    target.innerHTML = html;
}

// 4. تقرير الخطة التربوية (IEP)
function generateIEPReport(studentIds, container) {
    const target = getSafeContainer(container);
    if (!target) return;

    const students = getStudentsByIds(studentIds);
    let html = `<div class="report-header text-center mb-4"><h3>📄 الخطط التربوية الفردية</h3></div>`;
    
    students.forEach(s => {
        html += `
            <div class="card mb-3" style="border:1px solid #ddd;">
                <div class="card-header bg-light"><strong>${s.name}</strong> - الفصل الدراسي الأول</div>
                <div class="card-body">
                    <p><strong>نقاط القوة:</strong> التفاعل الصفي، الذاكرة البصرية.</p>
                    <p><strong>نقاط الضعف:</strong> التمييز بين الحروف المتشابهة.</p>
                    <p><strong>الهدف العام:</strong> إتقان مهارات القراءة والكتابة الأساسية بنسبة 80%.</p>
                    <hr>
                    <small style="color:green;">✅ الحالة: الخطة تسير بشكل جيد.</small>
                </div>
            </div>
        `;
    });
    target.innerHTML = html;
}

// 5. تقرير الجدول الدراسي
function generateScheduleReport(studentIds, container) {
    const target = getSafeContainer(container);
    if (!target) return;
    
    target.innerHTML = `
        <div class="report-header text-center mb-4"><h3>📅 الجدول الدراسي (غرفة المصادر)</h3></div>
        <table class="table table-bordered text-center">
            <thead class="bg-info text-white">
                <tr><th>اليوم</th><th>الحصة 2</th><th>الحصة 3</th><th>الحصة 5</th></tr>
            </thead>
            <tbody>
                <tr><td>الأحد</td><td>لغتي (خالد)</td><td>-</td><td>رياضيات (أحمد)</td></tr>
                <tr><td>الاثنين</td><td>-</td><td>لغتي (سعد)</td><td>سلوك</td></tr>
                <tr><td>الثلاثاء</td><td>رياضيات</td><td>-</td><td>لغتي</td></tr>
                <tr><td>الأربعاء</td><td>قراءة</td><td>إملاء</td><td>-</td></tr>
                <tr><td>الخميس</td><td>نشاط</td><td>-</td><td>مراجعة</td></tr>
            </tbody>
        </table>
        <div class="alert alert-warning text-center">هذا الجدول ينطبق على الطلاب المختارين.</div>
    `;
}

// 6. تقرير الواجبات
function generateAssignmentsReport(studentIds, container) {
    const target = getSafeContainer(container);
    if (!target) return;

    const students = getStudentsByIds(studentIds);
    let html = `
        <div class="report-header text-center mb-4"><h3>📝 تقرير الواجبات</h3></div>
        <table class="table table-hover">
            <thead><tr><th>الطالب</th><th>المسندة</th><th>المنجزة</th><th>التقييم</th></tr></thead>
            <tbody>`;
            
    students.forEach(s => {
        html += `<tr>
            <td>${s.name}</td>
            <td>15</td>
            <td class="text-success">12</td>
            <td>⭐⭐⭐⭐</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    target.innerHTML = html;
}

// 7. تقرير الاختبار التشخيصي
function generateDiagnosticReport(studentIds, container) {
    const target = getSafeContainer(container);
    if (!target) return;

    const students = getStudentsByIds(studentIds);
    let html = `<div class="report-header text-center mb-4"><h3>🩺 نتائج التشخيص</h3></div>`;
    
    students.forEach(s => {
        html += `
            <div class="mb-3 border-bottom pb-2">
                <h5>${s.name}</h5>
                <p>المهارة المفقودة: <strong>المدود والتاء المربوطة</strong></p>
                <p>الدرجة: <span class="badge badge-danger">4/10</span> - يحتاج خطة علاجية.</p>
            </div>
        `;
    });
    target.innerHTML = html;
}

// تصدير الدوال للاستخدام الخارجي (مهم جداً لتعمل الأزرار)
window.generateCreditReport = generateCreditReport;
window.generateAttendanceReport = generateAttendanceReport;
window.generateAchievementReport = generateAchievementReport;
window.generateIEPReport = generateIEPReport;
window.generateScheduleReport = generateScheduleReport;
window.generateAssignmentsReport = generateAssignmentsReport;
window.generateDiagnosticReport = generateDiagnosticReport;
window.updateTeacherName = updateTeacherName;

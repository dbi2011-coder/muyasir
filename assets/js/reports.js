// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: محرك توليد التقارير (يعمل مع المعلم وعضو اللجنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateTeacherName();
});

// ✅ دالة تحديث الاسم (تم إصلاح الخطأ هنا)
function updateTeacherName() {
    try {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user) return;

        // البحث عن العنصر بعدة معرفات محتملة لضمان العمل في كل الصفحات
        const nameElement = document.getElementById('teacherName') || 
                            document.getElementById('userName') || 
                            document.getElementById('memberName') ||
                            document.querySelector('.user-name');

        // التحقق من وجود العنصر قبل الكتابة عليه لمنع الخطأ
        if (nameElement) {
            nameElement.textContent = user.name;
        }
    } catch (e) {
        // تجاهل الخطأ في حالة عدم وجود العنصر في هذه الصفحة
        console.log("ملاحظة: عنصر اسم المستخدم غير موجود في هذه الصفحة، تم تجاهل التحديث.");
    }
}

// ============================================
// 🛠️ دوال مساعدة
// ============================================

function getStudentsByIds(ids) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // جلب الطلاب فقط ومقارنة الـ ID
    // نستخدم "==" بدلاً من "===" لضمان تطابق النصوص والأرقام
    return allUsers.filter(u => u.role === 'student' && ids.some(id => id == u.id));
}

function getSafeContainer(container) {
    if (typeof container === 'string') {
        return document.getElementById(container);
    }
    return container;
}

// ============================================
// 📊 دوال توليد التقارير
// ============================================

// 1. تقرير الغياب
function generateAttendanceReport(studentIds, container) {
    const target = getSafeContainer(container);
    const students = getStudentsByIds(studentIds);
    
    let html = `
        <div class="report-header text-center mb-4">
            <h3>📊 تقرير الغياب والحضور</h3>
            <p class="text-muted">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <table class="table table-bordered text-center">
            <thead class="thead-light">
                <tr>
                    <th>اسم الطالب</th>
                    <th>أيام الحضور</th>
                    <th>أيام الغياب</th>
                    <th>أيام التأخر</th>
                    <th>نسبة الحضور</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>`;

    if (students.length === 0) {
        html += '<tr><td colspan="6">لا توجد بيانات للطلاب المحددين</td></tr>';
    } else {
        students.forEach(s => {
            // بيانات وهمية للعرض (يمكنك ربطها ببيانات حقيقية لاحقاً)
            const absent = s.absent || Math.floor(Math.random() * 5); 
            const totalDays = 45; // افتراض عدد أيام الفصل
            const present = totalDays - absent;
            const percentage = Math.round((present / totalDays) * 100);
            
            let statusBadge = '<span class="badge badge-success">منتظم</span>';
            if(percentage < 85) statusBadge = '<span class="badge badge-warning">تنبيه</span>';
            if(percentage < 75) statusBadge = '<span class="badge badge-danger">منذر</span>';

            html += `
                <tr>
                    <td class="font-weight-bold">${s.name}</td>
                    <td>${present}</td>
                    <td style="color:red; font-weight:bold;">${absent}</td>
                    <td>${s.late || 0}</td>
                    <td>${percentage}%</td>
                    <td>${statusBadge}</td>
                </tr>`;
        });
    }
    
    html += `</tbody></table>`;
    target.innerHTML = html;
}

// 2. تقرير نسب الإنجاز
function generateAchievementReport(studentIds, container) {
    const target = getSafeContainer(container);
    const students = getStudentsByIds(studentIds);

    let html = `
        <div class="report-header text-center mb-4">
            <h3>📈 تقرير نسب الإنجاز الأكاديمي</h3>
        </div>
        <div class="row">`;

    if (students.length === 0) {
        html = '<div class="alert alert-info w-100 text-center">لا توجد بيانات</div>';
    } else {
        students.forEach(s => {
            const progress = s.progress || Math.floor(Math.random() * (100 - 50) + 50); // نسبة عشوائية للتجربة
            const color = progress >= 90 ? '#28a745' : (progress >= 70 ? '#17a2b8' : '#ffc107');
            
            html += `
            <div class="col-md-6 mb-3">
                <div class="card p-3">
                    <h5>👤 ${s.name}</h5>
                    <div class="progress mt-2" style="height: 25px;">
                        <div class="progress-bar" role="progressbar" style="width: ${progress}%; background-color:${color};" 
                             aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                             ${progress}%
                        </div>
                    </div>
                    <div class="mt-2 text-muted small">
                        <strong>المادة:</strong> لغتي | <strong>الأهداف المحققة:</strong> ${Math.floor(progress/10)} من 10
                    </div>
                </div>
            </div>`;
        });
    }
    
    html += `</div>`;
    target.innerHTML = html;
}

// 3. تقرير الواجبات
function generateAssignmentsReport(studentIds, container) {
    const target = getSafeContainer(container);
    const students = getStudentsByIds(studentIds);

    let html = `
        <div class="report-header text-center mb-4">
            <h3>📝 تقرير متابعة الواجبات</h3>
        </div>
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>اسم الطالب</th>
                    <th>الواجبات المسندة</th>
                    <th>تم الحل</th>
                    <th>لم يتم الحل</th>
                    <th>متوسط الدرجات</th>
                </tr>
            </thead>
            <tbody>`;

    students.forEach(s => {
        // بيانات افتراضية
        const total = 20;
        const solved = Math.floor(Math.random() * 20);
        const unsolved = total - solved;
        const avg = Math.floor(Math.random() * (10 - 5) + 5);

        html += `
            <tr>
                <td>${s.name}</td>
                <td>${total}</td>
                <td class="text-success">${solved}</td>
                <td class="text-danger">${unsolved}</td>
                <td>${avg}/10</td>
            </tr>`;
    });
    
    html += `</tbody></table>`;
    target.innerHTML = html;
}

// 4. تقرير الخطط التربوية الفردية (IEP)
function generateIEPReport(studentIds, container) {
    const target = getSafeContainer(container);
    const students = getStudentsByIds(studentIds);

    let html = `<div class="report-header text-center mb-4"><h3>📄 تقرير الخطط التربوية الفردية</h3></div>`;
    
    students.forEach(s => {
        html += `
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">خطة الطالب: ${s.name}</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>⛔ نقاط الضعف:</strong> صعوبة في التمييز بين الحروف المتشابهة رسمًا.</p>
                            <p><strong>💪 نقاط القوة:</strong> ذاكرة سمعية جيدة، مشاركة فعالة شفهياً.</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>🎯 الهدف العام:</strong> إتقان مهارات القراءة والكتابة الأساسية.</p>
                            <p><strong>📅 تاريخ البدء:</strong> 01/02/1447هـ</p>
                        </div>
                    </div>
                    <hr>
                    <h6>📊 الأهداف التدريسية:</h6>
                    <ul>
                        <li>أن يقرأ الطالب الحروف (ب، ت، ث) بحركاتها القصيرة (تم الإنجاز ✅)</li>
                        <li>أن يكتب الطالب كلمات ثلاثية الحروف (جاري العمل ⏳)</li>
                    </ul>
                </div>
            </div>
        `;
    });
    
    target.innerHTML = html;
}

// 5. تقرير الاختبار التشخيصي
function generateDiagnosticReport(studentIds, container) {
    const target = getSafeContainer(container);
    const students = getStudentsByIds(studentIds);
    
    let html = `
        <div class="report-header text-center mb-4">
            <h3>🩺 نتائج الاختبار التشخيصي</h3>
        </div>
        <table class="table table-bordered">
            <thead>
                <tr class="bg-light">
                    <th>الطالب</th>
                    <th>المهارة المفقودة</th>
                    <th>درجة الاختبار</th>
                    <th>التوصية</th>
                </tr>
            </thead>
            <tbody>`;
            
    students.forEach(s => {
        html += `
            <tr>
                <td>${s.name}</td>
                <td>المدود والتاء المربوطة</td>
                <td>4/10</td>
                <td><span class="text-danger">يحتاج خطة علاجية مكثفة</span></td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    target.innerHTML = html;
}

// 6. تقرير الجدول الدراسي
function generateScheduleReport(studentIds, container) {
    const target = getSafeContainer(container);
    // الجدول عادة يكون موحد أو للفصل، سنعرض نموذج بسيط
    let html = `
        <div class="report-header text-center mb-4">
            <h3>📅 الجدول الدراسي الأسبوعي</h3>
            <p>غرفة المصادر</p>
        </div>
        <div class="table-responsive">
            <table class="table table-bordered text-center">
                <thead class="bg-info text-white">
                    <tr>
                        <th>اليوم</th>
                        <th>الحصة 1</th>
                        <th>الحصة 2</th>
                        <th>الحصة 3</th>
                        <th>الحصة 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>الأحد</td><td>لغتي (خالد)</td><td>-</td><td>رياضيات (أحمد)</td><td>-</td></tr>
                    <tr><td>الاثنين</td><td>-</td><td>لغتي (سعد)</td><td>-</td><td>سلوك (محمد)</td></tr>
                    <tr><td>الثلاثاء</td><td>رياضيات (علي)</td><td>-</td><td>لغتي (خالد)</td><td>-</td></tr>
                    <tr><td>الأربعاء</td><td>-</td><td>-</td><td>قراءة (سعد)</td><td>إملاء (أحمد)</td></tr>
                    <tr><td>الخميس</td><td>نشاط</td><td>لغتي (مراجعة)</td><td>-</td><td>-</td></tr>
                </tbody>
            </table>
        </div>
        <div class="alert alert-warning mt-3">
            * هذا الجدول يوضح الحصص التي يحضرها الطلاب المختارون (${studentIds.length} طالب) في غرفة المصادر.
        </div>
    `;
    target.innerHTML = html;
}

// 7. تقرير رصيد الحصص
function generateCreditReport(studentIds, container) {
    const target = getSafeContainer(container);
    const students = getStudentsByIds(studentIds);
    
    let html = `
        <div class="report-header text-center mb-4">
            <h3>⚖️ تقرير رصيد الحصص</h3>
        </div>
        <div class="row d-flex justify-content-center">
            <div class="col-md-8">
                <table class="table table-hover table-bordered">
                    <thead class="thead-dark">
                        <tr>
                            <th>اسم الطالب</th>
                            <th>الرصيد الكلي للفصل</th>
                            <th>تم تنفيذه</th>
                            <th>المتبقي</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    students.forEach(s => {
        const total = 30; // حصة في الفصل
        const done = Math.floor(Math.random() * 15) + 5;
        const remain = total - done;
        
        html += `
            <tr>
                <td>${s.name}</td>
                <td class="text-center font-weight-bold">${total}</td>
                <td class="text-center text-success">${done}</td>
                <td class="text-center text-primary">${remain}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div></div>`;
    target.innerHTML = html;
}

// تصدير الدوال لاستخدامها في ملفات أخرى إذا لزم الأمر
// (في بيئة المتصفح العادية، هذه الدوال متاحة تلقائياً في window)

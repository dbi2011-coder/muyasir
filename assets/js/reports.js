// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: توليد التقارير للمعلم الحالي (مع إصلاح البيانات تلقائياً)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // تشغيل عملية التعريف والإصلاح فور تحميل الصفحة
    initReportsPage();
});

function initReportsPage() {
    // 1. محاولة جلب المستخدم الحالي بأكثر من طريقة
    let currentUser = null;
    
    if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
    } else {
        // خطة بديلة إذا لم تكن الدالة موجودة
        const session = sessionStorage.getItem('currentUser');
        if (session) currentUser = JSON.parse(session);
    }

    if (!currentUser) {
        console.log("⚠️ لم يتم العثور على مستخدم مسجل. العودة للدخول...");
        // window.location.href = '../../index.html'; // يمكنك تفعيل هذا السطر لاحقاً
        return;
    }

    // 2. عرض اسم المعلم في الصفحة
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = currentUser.name;

    console.log(`✅ تم التعرف على المعلم: ${currentUser.name} (ID: ${currentUser.id})`);

    // 3. تشغيل إصلاح الطلاب (ربطهم بهذا المعلم)
    forceFixData(false); // false تعني بدون رسالة تنبيه مزعجة
}

// دالة إصلاح البيانات (تربط الطلاب بالمعلم الحالي)
function forceFixData(showAlert = true) {
    let currentUser = null;
    if (typeof getCurrentUser === 'function') currentUser = getCurrentUser();
    else currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

    if (!currentUser) return;

    let allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let modified = false;
    let fixedCount = 0;

    // المرور على كل المستخدمين
    allUsers = allUsers.map(u => {
        // إذا كان طالباً وليس لديه معلم، أو معلمه غير محدد
        if (u.role === 'student' && (!u.teacherId || u.teacherId === 'undefined')) {
            u.teacherId = currentUser.id; // نربطه بالمعلم الحالي
            modified = true;
            fixedCount++;
        }
        return u;
    });

    if (modified) {
        localStorage.setItem('users', JSON.stringify(allUsers));
        console.log(`🔄 تم إصلاح ${fixedCount} طالب وربطهم بالمعلم.`);
        if (showAlert) alert(`تم تحديث بيانات ${fixedCount} طالب وربطهم بحسابك بنجاح.`);
    } else {
        if (showAlert) alert("بيانات الطلاب سليمة ومحدثة.");
    }
}

// دالة توليد التقرير
function generateClassBalanceReport() {
    // إظهار منطقة العرض
    document.getElementById('reportPreviewContainer').style.display = 'block';
    
    let currentUser = null;
    if (typeof getCurrentUser === 'function') currentUser = getCurrentUser();
    else currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

    // جلب الطلاب المرتبطين بهذا المعلم
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // المقارنة بـ == لضمان توافق الأنواع (نص/رقم)
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId == currentUser.id);

    if (myStudents.length === 0) {
        document.getElementById('reportPreviewArea').innerHTML = `
            <div style="text-align:center; color:red; padding:20px;">
                <h3>⚠️ لا يوجد طلاب</h3>
                <p>لم يتم العثور على طلاب مسجلين بحسابك.</p>
                <button class="btn btn-sm btn-primary" onclick="forceFixData()">حاول إصلاح البيانات</button>
            </div>`;
        return;
    }

    // جلب الجدول لحساب الحصص
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const mySchedule = allSchedules.filter(s => s.teacherId == currentUser.id);

    const counts = {};
    mySchedule.forEach(sess => {
        if (sess.students) {
            sess.students.forEach(sid => counts[sid] = (counts[sid] || 0) + 1);
        }
    });

    let html = `
    <div style="text-align:center; margin-bottom:20px; border-bottom:2px solid #333; padding-bottom:10px;">
        <h2>تقرير متابعة الطلاب</h2>
        <h4>المعلم: ${currentUser.name}</h4>
    </div>
    <table border="1" style="width:100%; border-collapse:collapse; text-align:right;">
        <thead style="background:#f0f0f0;">
            <tr><th>م</th><th>الطالب</th><th>الصف</th><th>عدد الحصص</th><th>الحالة</th></tr>
        </thead>
        <tbody>
    `;

    myStudents.forEach((std, idx) => {
        const c = counts[std.id] || 0;
        let status = 'منتظم';
        if(c < 5) status = 'يحتاج متابعة';
        
        html += `
        <tr>
            <td>${idx+1}</td>
            <td><strong>${std.name}</strong></td>
            <td>${std.grade || '-'}</td>
            <td>${c}</td>
            <td>${status}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    
    document.getElementById('reportPreviewArea').innerHTML = html;
}

// تصدير الدوال
window.forceFixData = forceFixData;
window.generateClassBalanceReport = generateClassBalanceReport;

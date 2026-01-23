/**
 * تحميل قائمة الطلاب (نسخة محسنة لإصلاح مشكلة الاختفاء)
 */
function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return; // حماية في حال لم يتم تحميل الصفحة

    // 1. جلب البيانات
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUserData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // تأكد من وجود مستخدم مسجل دخول
    if (!currentUserData || !currentUserData.user) {
        container.innerHTML = '<div class="text-danger">يرجى تسجيل الدخول أولاً.</div>';
        return;
    }

    const currentTeacherId = currentUserData.user.id;
    const currentRole = currentUserData.user.role;

    console.log("المعلم الحالي:", currentTeacherId, "عدد المستخدمين الكلي:", allUsers.length);

    // 2. تصفية الطلاب
    // التعديل: نستخدم (==) بدل (===) لتجاهل الفرق بين النص والرقم
    let students = [];

    if (currentRole === 'admin') {
        // إذا كان مدير، اعرض كل الطلاب
        students = allUsers.filter(u => u.role === 'student');
    } else {
        // إذا كان معلم، اعرض طلابه فقط
        students = allUsers.filter(u => 
            u.role === 'student' && 
            (u.teacherId == currentTeacherId) // مقارنة مرنة
        );
    }

    // --- تصحيح طوارئ: إذا لم يجد طلاباً للمعلم، ابحث عن أي طالب غير مسند لمعلم ---
    if (students.length === 0 && currentRole !== 'admin') {
        console.warn("لم يتم العثور على طلاب مرتبطين بالمعلم، جاري البحث عن طلاب بدون معلم...");
        const orphanedStudents = allUsers.filter(u => u.role === 'student' && !u.teacherId);
        if (orphanedStudents.length > 0) {
            students = orphanedStudents; // عرض الطلاب الذين ليس لهم معلم مؤقتاً
        }
    }

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = `
            <div class="p-3 text-center text-danger" style="border: 1px dashed #ccc; padding: 20px;">
                لا يوجد طلاب مسجلين في قائمتك.
                <br>
                <small style="color: #666">تأكد من إضافة طلاب من لوحة التحكم.</small>
            </div>`;
        return;
    }

    // 3. رسم القائمة
    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'student-checkbox-item';
        // ستايل بسيط لجعل القائمة واضحة
        div.style.cssText = "padding: 8px; border-bottom: 1px solid #eee; display: flex; align-items: center;";
        
        div.innerHTML = `
            <label style="cursor: pointer; width: 100%; display: flex; align-items: center;">
                <input type="checkbox" name="selectedStudents" value="${student.id}" style="margin-left: 10px; width: 18px; height: 18px;">
                <span style="font-weight: bold; font-size: 1.1em;">${student.name}</span>
                <span style="margin-right: auto; color: #666; font-size: 0.9em; background: #f0f0f0; padding: 2px 8px; border-radius: 4px;">
                    ${student.grade || 'غير محدد'}
                </span>
            </label>
        `;
        container.appendChild(div);
    });
}

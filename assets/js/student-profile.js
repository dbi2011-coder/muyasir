// ============================================
// 🔥 1. محرك سجل التقدم الذكي (The Smart Progress Engine)
// ============================================
function loadProgressTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const adminEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');

    // تصفية بيانات الطالب الحالي
    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    let myEvents = adminEvents.filter(e => e.studentId == currentStudentId);

    // ترتيب الدروس لضمان معرفة "الدرس الحالي" بدقة عند الغياب
    myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    // 1. تحديد تاريخ بداية الخطة (أول درس تم تعيينه)
    let planStartDate = null;
    if (myList.length > 0) {
        const sortedByCreation = [...myList].sort((a, b) => new Date(a.assignedDate) - new Date(b.assignedDate));
        planStartDate = new Date(sortedByCreation[0].assignedDate);
    }

    if (!planStartDate) {
        document.getElementById('section-progress').innerHTML = `
            <div class="content-header"><h1>سجل المتابعة اليومي</h1></div>
            <div class="empty-state"><h3>لم تبدأ الخطة بعد</h3><p>يجب إكمال التشخيص وتوليد الدروس لبدء الحساب.</p></div>`;
        return;
    }

    // 2. تجهيز البيانات الخام (Raw Data)
    let rawLogs = [];

    // أ) تفكيك سجلات الدروس
    myList.forEach(l => {
        if (l.historyLog && l.historyLog.length > 0) {
            l.historyLog.forEach(log => {
                rawLogs.push({
                    dateObj: new Date(log.date),
                    dateStr: new Date(log.date).toDateString(),
                    type: 'lesson',
                    status: log.status, // started, extension, completed, absence, accelerated
                    title: l.title,
                    lessonId: l.id,
                    cachedType: log.cachedSessionType || null
                });
            });
        }
    });

    // ب) تفكيك الأحداث الإدارية
    myEvents.forEach(e => {
        rawLogs.push({
            dateObj: new Date(e.date),
            dateStr: new Date(e.date).toDateString(),
            type: 'event',
            status: e.type,
            title: 'حدث إداري',
            id: e.id,
            note: e.note
        });
    });

    // 3. المعالجة الزمنية (يوم بيوم)
    let finalTimeline = [];
    let balance = 0; // الرصيد التراكمي
    const today = new Date();
    // ضبط الوقت لنهاية اليوم لضمان شمولية المقارنة
    today.setHours(23, 59, 59, 999);
    
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // حلقة التكرار الرئيسية (من البداية حتى اليوم)
    for (let d = new Date(planStartDate); d <= today; d.setDate(d.getDate() + 1)) {
        const currentDateStr = d.toDateString();
        const dayKey = dayMap[d.getDay()];

        // هل هذا اليوم موجود في جدول الطالب؟
        const isScheduledDay = teacherSchedule.some(s => 
            s.day === dayKey && 
            (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId)))
        );

        // جلب جميع أحداث هذا اليوم
        let daysLogs = rawLogs.filter(log => log.dateStr === currentDateStr);

        // 🧹 تنظيف العرض (Filtering Logic) - القواعد الجديدة 🧹
        const completedIdsToday = daysLogs.filter(l => l.status === 'completed' || l.status === 'accelerated').map(l => l.lessonId);
        
        if (completedIdsToday.length > 0) {
            daysLogs = daysLogs.filter(l => {
                // القاعدة 1 (نفس اليوم): إذا تحقق الدرس، احذف "بدأ"
                if (l.status === 'started' && completedIdsToday.includes(l.lessonId)) return false;
                
                // القاعدة 2 (اليوم التالي): إذا تحقق الدرس، احذف "تمديد" (يكتفى بمتحقق)
                if (l.status === 'extension' && completedIdsToday.includes(l.lessonId)) return false;
                
                return true;
            });
        }

        // 🚨 معالجة الغياب التلقائي (Gap Detection) 🚨
        if (daysLogs.length === 0 && isScheduledDay) {
            // البحث عن الدرس الذي كان مفترضاً أن يكون نشطاً في ذلك التاريخ
            // هو الدرس الذي لم يكتمل، أو اكتمل بتاريخ لاحق لتاريخ الغياب الحالي
            let activeLessonAtThatTime = myList.find(l => {
                if (l.status === 'pending') return true; // ما زال معلقاً حتى اليوم
                // أو اكتمل في المستقبل بالنسبة ليوم الغياب هذا
                const completionDate = l.completedDate ? new Date(l.completedDate) : new Date();
                return completionDate > d; 
            });

            daysLogs.push({
                dateObj: new Date(d),
                type: 'auto-absence', // علامة لتمييز المعالجة
                title: activeLessonAtThatTime ? activeLessonAtThatTime.title : 'درس غير محدد',
                // القيم النصية المطلوبة بدقة:
                customLessonStatus: 'لم ينفذ',
                customStudentStatus: 'غائب',
                customSessionType: 'أساسية'
            });
        }

        // 🧮 معالجة السجلات وحساب الرصيد 🧮
        daysLogs.forEach(log => {
            let displayStatus = '';
            let displayType = ''; 
            let rowClass = '';
            let studentState = '';
            
            // --- حالة 1: حدث إداري ---
            if (log.type === 'event') {
                if (log.status === 'vacation') {
                    studentState = 'إجازة'; displayStatus = 'توقف مؤقت'; rowClass = 'bg-info-light';
                } else if (log.status === 'excused') {
                    studentState = 'معفى'; displayStatus = 'مؤجل'; rowClass = 'bg-warning-light';
                    balance--; // خصم
                }

            // --- حالة 2: غياب تلقائي (المنطق الجديد) ---
            } else if (log.type === 'auto-absence') {
                studentState = `<span class="text-danger font-weight-bold">${log.customStudentStatus}</span>`; // غائب
                displayStatus = log.customLessonStatus; // لم ينفذ
                displayType = log.customSessionType; // أساسية
                rowClass = 'bg-danger-light';
                balance--; // خصم من الرصيد

            // --- حالة 3: غياب مسجل يدوياً (قديم) ---
            } else if (log.status === 'absence') {
                studentState = '<span class="text-danger font-weight-bold">غائب</span>';
                displayStatus = 'لم ينفذ'; // توحيد المسمى
                displayType = 'أساسية';
                rowClass = 'bg-danger-light';
                balance--;

            // --- حالة 4: حضور ونشاط ---
            } else {
                studentState = 'حاضر';

                // مسميات حالة الدرس
                if (log.status === 'started') displayStatus = 'بدأ';
                else if (log.status === 'extension') displayStatus = 'تمديد';
                else if (log.status === 'completed') { displayStatus = '<span class="text-success font-weight-bold">✔ متحقق</span>'; rowClass = 'bg-success-light'; }
                else if (log.status === 'accelerated') { displayStatus = '<span class="text-warning font-weight-bold">⚡ تسريع</span>'; rowClass = 'bg-warning-light'; }

                // 🔥 تحديد نوع الحصة (المحاسبة) 🔥
                if (log.cachedType) {
                    // إذا كانت مخزنة سابقاً
                    if (log.cachedType === 'basic') displayType = 'أساسية';
                    else if (log.cachedType === 'compensation') { displayType = '<span class="text-primary font-weight-bold">تعويضية</span>'; balance++; }
                    else if (log.cachedType === 'additional') { displayType = 'إضافية'; balance++; }
                } else {
                    // الحساب التلقائي
                    if (isScheduledDay) {
                        displayType = 'أساسية';
                        // الرصيد ثابت (0)
                    } else {
                        // يوم غير مجدول
                        if (balance < 0) {
                            displayType = '<span class="text-primary font-weight-bold">تعويضية</span>';
                            balance++; // سداد الدين
                        } else {
                            displayType = 'إضافية';
                            balance++; // زيادة الرصيد
                        }
                    }
                }
            }

            // إضافة للصف
            finalTimeline.push({
                title: log.title,
                lessonStatus: displayStatus,
                studentStatus: studentState,
                sessionType: displayType || '-',
                date: d.toLocaleDateString('ar-SA'),
                rawDate: d,
                balanceSnapshot: balance,
                actions: log.type === 'event' ? log.id : null,
                note: log.note,
                rowClass: rowClass
            });
        });
    }

    // 4. الترتيب والعرض النهائي
    finalTimeline.sort((a, b) => a.rawDate - b.rawDate);

    const container = document.getElementById('section-progress');
    container.innerHTML = `
        <div class="content-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <h2>سجل المتابعة اليومي</h2>
                <span class="badge ${balance < 0 ? 'badge-danger' : 'badge-success'}">الرصيد الحالي: ${balance > 0 ? '+' + balance : balance} حصة</span>
            </div>
            <button class="btn btn-primary" onclick="openAdminEventModal()">
                <i class="fas fa-plus-circle"></i> تسجيل حدث (إعفاء/إجازة)
            </button>
        </div>
        
        <div class="table-responsive">
            <table class="word-table">
                <thead>
                    <tr>
                        <th style="width: 30%;">البيان</th>
                        <th style="width: 15%;">حالة الدرس</th>
                        <th style="width: 15%;">حالة الطالب (الرصيد)</th>
                        <th style="width: 15%;">نوع الحصة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 10%;">إجراءات</th>
                    </tr>
                </thead>
                <tbody id="progressTableBody"></tbody>
            </table>
        </div>
    `;

    const tbody = document.getElementById('progressTableBody');
    if (finalTimeline.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد سجلات.</td></tr>';
        return;
    }

    tbody.innerHTML = finalTimeline.map(item => {
        let actionsHtml = '-';
        if (item.actions) {
            actionsHtml = `
                <button class="btn-icon text-primary" onclick="editAdminEvent(${item.actions})">✏️</button>
                <button class="btn-icon text-danger" onclick="deleteAdminEvent(${item.actions})">🗑️</button>
            `;
        }

        let statusWithBalance = item.studentStatus;
        // عرض الرصيد بجانب حالات الغياب أو الإعفاء فقط
        if (item.studentStatus.includes('غائب') || item.studentStatus.includes('معفى')) {
             statusWithBalance += ` <br><span style="font-size:0.75rem; color:${item.balanceSnapshot < 0 ? 'red' : 'green'};">(${item.balanceSnapshot > 0 ? '+' : ''}${item.balanceSnapshot})</span>`;
        }

        let noteHtml = item.note ? `<br><small class="text-muted">[${item.note}]</small>` : '';

        return `
            <tr class="${item.rowClass || ''}">
                <td><strong>${item.title}</strong>${noteHtml}</td>
                <td class="text-center">${item.lessonStatus}</td>
                <td class="text-center">${statusWithBalance}</td>
                <td class="text-center">${item.sessionType}</td>
                <td class="text-center">${item.date}</td>
                <td class="text-center">${actionsHtml}</td>
            </tr>
        `;
    }).join('');

    // عرض الدرس الحالي (القادم)
    const activeLesson = studentLessons.find(l => l.studentId == currentStudentId && l.status !== 'completed' && l.status !== 'accelerated');
    if (activeLesson) {
        tbody.innerHTML += `
            <tr style="background-color:#f8f9fa; border-top:2px dashed #ccc; color:#666;">
                <td>${activeLesson.title} <small>(الدرس الحالي)</small></td>
                <td class="text-center">قيد التنفيذ</td>
                <td class="text-center">-</td>
                <td class="text-center">قادم</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
            </tr>
        `;
    }
}

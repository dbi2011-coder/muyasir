// ============================================
// 📁 الملف: assets/js/dashboard.js
// الوصف: إدارة منطق لوحة التحكم وحساب الإحصائيات لجميع الأدوار
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    
    // إعداد القائمة المتنقلة
    setupMobileMenu();

    if (!currentUser) {
        // إذا لم يكن مسجلاً، لا تفعل شيئاً (سيقوم auth.js بالتوجيه)
        return;
    }

    // تحديث واجهة المستخدم (الاسم والصورة)
    updateUserInterface(currentUser);

    // تحديث الإحصائيات بناءً على الدور
    if (currentUser.role === 'student') {
        updateStudentStats(currentUser.id);
    } else if (currentUser.role === 'teacher') {
        updateTeacherStats(currentUser.id);
    } else if (currentUser.role === 'admin') {
        updateAdminStats();
    }

    // إعداد تحذير انتهاء الجلسة
    setupSessionWarning();
});

// ----------------------------------------------------------------
// 1. إحصائيات الطالب (Dashboard Student)
// ----------------------------------------------------------------
function updateStudentStats(studentId) {
    // التحقق من وجود العناصر في الصفحة قبل التحديث
    if (!document.getElementById('pendingTests')) return;

    // جلب البيانات
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');

    // 1. الاختبارات التي تنتظرك (الحالة: pending)
    const pendingTestsCount = studentTests.filter(t => t.studentId == studentId && t.status === 'pending').length;
    document.getElementById('pendingTests').textContent = pendingTestsCount;

    // 2. الدروس الحالية (الحالة: pending أو started)
    const currentLessonsCount = studentLessons.filter(l => l.studentId == studentId && (l.status === 'pending' || l.status === 'started')).length;
    document.getElementById('currentLessons').textContent = currentLessonsCount;

    // 3. الواجبات المعلقة (الحالة: pending)
    const pendingAssignmentsCount = studentAssignments.filter(a => a.studentId == studentId && a.status === 'pending').length;
    document.getElementById('pendingAssignments').textContent = pendingAssignmentsCount;

    // 4. مستوى التقدم (الدروس المكتملة / إجمالي الدروس)
    const myLessons = studentLessons.filter(l => l.studentId == studentId);
    const completedLessons = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated').length;
    
    let progress = 0;
    if (myLessons.length > 0) {
        progress = Math.round((completedLessons / myLessons.length) * 100);
    }
    document.getElementById('progressPercentage').textContent = progress + '%';
}

// ----------------------------------------------------------------
// 2. إحصائيات المعلم (Dashboard Teacher)
// ----------------------------------------------------------------
function updateTeacherStats(teacherId) {
    if (!document.getElementById('studentsCount')) return;

    // جلب البيانات
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');

    // 1. إجمالي الطلاب (المرتبطين بهذا المعلم)
    // هنا سنعد جميع الطلاب كحل افتراضي، أو نفلتر حسب teacherId إذا كان مفعلاً
    // const myStudentsCount = users.filter(u => u.role === 'student' && u.teacherId == teacherId).length;
    const myStudentsCount = users.filter(u => u.role === 'student').length; 
    document.getElementById('studentsCount').textContent = myStudentsCount;

    // 2. الدروس المضافة (التي أنشأها المعلم)
    // نعد الكل لأن المكتبة عامة، أو يمكن الفلترة بـ authorId
    const myLessonsCount = lessons.length; 
    document.getElementById('lessonsCount').textContent = myLessonsCount;

    // 3. الواجبات النشطة
    const myAssignmentsCount = assignments.length;
    document.getElementById('assignmentsCount').textContent = myAssignmentsCount;

    // 4. رسائل جديدة (التي لم يتم الرد عليها أو غير المقروءة)
    const unreadMsgCount = messages.filter(m => m.toId == teacherId && !m.isRead).length;
    document.getElementById('unreadMessages').textContent = unreadMsgCount;
}

// ----------------------------------------------------------------
// 3. إحصائيات المدير (Dashboard Admin)
// ----------------------------------------------------------------
function updateAdminStats() {
    // التحقق من وجود عنصر خاص بصفحة المدير
    if (!document.getElementById('teachersCount')) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 1. عدد المعلمين
    const teachersCount = users.filter(u => u.role === 'teacher').length;
    document.getElementById('teachersCount').textContent = teachersCount;

    // 2. عدد الطلاب
    const studentsCount = users.filter(u => u.role === 'student').length;
    if(document.getElementById('studentsCount')) {
        document.getElementById('studentsCount').textContent = studentsCount;
    }

    // 3. جلسات نشطة (محاكاة: عدد المستخدمين المسجلين دخولهم مؤخراً)
    // يمكننا افتراض رقم أو حسابه من السجلات إذا توفرت
    const activeSessions = Math.floor(Math.random() * 5) + 1; // رقم افتراضي للتوضيح
    if(document.getElementById('activeSessions')) {
        document.getElementById('activeSessions').textContent = activeSessions;
    }

    // 4. إجراءات معلقة (مثلاً: معلمين بانتظار التفعيل)
    const pendingActions = users.filter(u => u.status === 'suspended' || u.status === 'pending').length;
    if(document.getElementById('pendingActions')) {
        document.getElementById('pendingActions').textContent = pendingActions;
    }
}

// ----------------------------------------------------------------
// واجهة المستخدم والقوائم
// ----------------------------------------------------------------

function updateUserInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        if (user.role === 'teacher') {
            userNameElement.textContent = `أ/ ${user.name}`;
        } else if (user.role === 'admin') {
            userNameElement.textContent = 'مدير النظام';
        } else if (user.role === 'student') {
            userNameElement.textContent = user.name;
        } else {
            userNameElement.textContent = user.name;
        }
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }

    updatePageTitle(user.role);
}

function updatePageTitle(role) {
    const titles = {
        'admin': 'لوحة تحكم المدير',
        'teacher': 'لوحة تحكم المعلم',
        'student': 'لوحة تحكم الطالب',
        'committee': 'لوحة تحكم اللجنة'
    };
    
    const title = titles[role] || 'لوحة التحكم';
    // لا نغير العنوان إذا كان محدداً مسبقاً في HTML
    if (document.title === 'ميسر التعلم') {
        document.title = `${title} - ميسر التعلم`;
    }
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        // إزالة المستمعين القدامى لتجنب التكرار (Optional but good practice)
        const newBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnMenuBtn = newBtn.contains(event.target);
                
                if (!isClickInsideSidebar && !isClickOnMenuBtn && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
}

// ----------------------------------------------------------------
// دوال مساعدة عامة (Authentication & Utilities)
// ----------------------------------------------------------------

function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
}

// دالة لتسجيل الخروج (تستخدم في القوائم الجانبية)
function logout() {
    if(confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../../index.html';
    }
}

// التحقق من المصادقة (يمكن استخدامها في بداية كل صفحة)
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return null;
    }
    return user;
}

// توليد معرف فريد
function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}

// تحذير انتهاء الجلسة
function setupSessionWarning() {
    setInterval(() => {
        const loginTime = sessionStorage.getItem('loginTime');
        if (loginTime) {
            const now = new Date();
            const loginDate = new Date(loginTime);
            const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            
            // إذا اقترب وقت انتهاء الجلسة (مثلاً 8 ساعات عمل)
            if (hoursDiff > 7.5) {
                showSessionWarningUI();
            }
        }
    }, 60000); // التحقق كل دقيقة
}

function showSessionWarningUI() {
    if (!document.getElementById('sessionWarning')) {
        const warning = document.createElement('div');
        warning.id = 'sessionWarning';
        warning.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; right: 20px;
            background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;
            padding: 15px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: flex; justify-content: space-between; align-items: center; color: #856404;
        `;
        warning.innerHTML = `
            <span>⚠️ جلسة العمل ستنتهي قريباً. يرجى حفظ العمل الحالي.</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">✕</button>
        `;
        document.body.appendChild(warning);
        
        // إزالة التحذير تلقائياً بعد 30 ثانية
        setTimeout(() => {
            if (warning.parentElement) warning.remove();
        }, 30000);
    }
}

// دالة عرض الإشعارات (تم تعطيلها حالياً حسب الطلب)
function showNotifications() {
    // يمكن تفعيلها لاحقاً
    // alert('لا توجد إشعارات جديدة');
}

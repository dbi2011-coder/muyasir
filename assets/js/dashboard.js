// ============================================
// نظام لوحة التحكم الرئيسي
// ============================================

// تهيئة لوحة التحكم
function initializeDashboard() {
    console.log('🏠 بدء تهيئة لوحة التحكم...');
    
    // التحقق من المصادقة
    const user = checkAuth();
    if (!user) {
        console.log('❌ لم يتم العثور على مستخدم مسجل الدخول');
        showAuthNotification('يجب تسجيل الدخول أولاً', 'warning');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }
    
    console.log(`✅ تم التحقق من المستخدم: ${user.name} (${user.role})`);
    
    // تحديث واجهة المستخدم
    updateDashboardUI(user);
    
    // تحميل الإحصائيات
    loadDashboardData();
    
    console.log('✅ تم إعداد لوحة التحكم بنجاح');
}

// تحديث واجهة المستخدم
function updateDashboardUI(user) {
    console.log('👤 تحديث واجهة المستخدم...');
    
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
        console.log(`✅ تم تحديث اسم المستخدم: ${user.name}`);
    } else {
        console.log('⚠️ عنصر اسم المستخدم غير موجود');
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
        console.log(`✅ تم تحديث الصورة الرمزية: ${user.name.charAt(0)}`);
    } else {
        console.log('⚠️ عنصر الصورة الرمزية غير موجود');
    }
}

// تحميل بيانات لوحة التحكم
function loadDashboardData() {
    console.log('📊 جاري تحميل بيانات لوحة التحكم...');
    
    // تحميل الإحصائيات
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const teachers = users.filter(u => u.role === 'teacher');
        const students = users.filter(u => u.role === 'student');
        
        console.log(`👨‍🏫 عدد المعلمين: ${teachers.length}`);
        console.log(`👨‍🎓 عدد الطلاب: ${students.length}`);
        
        // تحديث العناصر إذا كانت موجودة
        updateStatElement('teachersCount', teachers.length);
        updateStatElement('studentsCount', students.length);
        updateStatElement('activeSessions', Math.floor(Math.random() * 10) + 1);
        updateStatElement('pendingActions', Math.floor(Math.random() * 5));
        
        // تحميل النشاط الأخير
        loadRecentActivity();
        
        console.log('✅ تم تحميل بيانات لوحة التحكم');
    }, 1000);
}

// تحديث عنصر الإحصاء
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        console.log(`📈 ${elementId}: ${value}`);
    } else {
        console.log(`⚠️ عنصر ${elementId} غير موجود`);
    }
}

// تحميل النشاط الأخير
function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) {
        console.log('⚠️ قائمة النشاط غير موجودة');
        return;
    }

    console.log('📝 جاري تحميل النشاط الأخير...');

    const activities = [
        {
            icon: '👨‍🏫',
            title: 'تم إضافة معلم جديد',
            time: 'منذ 5 دقائق',
            color: '#3498db'
        },
        {
            icon: '🎓',
            title: 'طالب جديد انضم للنظام',
            time: 'منذ ساعة',
            color: '#27ae60'
        },
        {
            icon: '📊',
            title: 'تقرير شهري تم إنشاؤه',
            time: 'منذ 3 ساعات',
            color: '#f39c12'
        },
        {
            icon: '⚠️',
            title: 'حساب معلم تم تعليقه',
            time: 'منذ يوم',
            color: '#e74c3c'
        }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color}">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ تم تحميل ${activities.length} نشاط`);
}

// ============================================
// إعداد الشريط الجانبي
// ============================================

function setupSidebar() {
    console.log('🗂️ جاري إعداد الشريط الجانبي...');
    
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            console.log('📱 تم تبديل حالة الشريط الجانبي');
        });
    }
    
    // إغلاق الشريط الجانبي عند النقر خارجها (للأجهزة المحمولة)
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                sidebar.classList.remove('active');
                console.log('📱 تم إغلاق الشريط الجانبي');
            }
        }
    });
}

// ============================================
// تهيئة الصفحة
// ============================================

// تهيئة الصفحة عند تحميلها
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 تم تحميل الصفحة، بدء التهيئة...');
    
    // تهيئة لوحة التحكم
    initializeDashboard();
    
    // إعداد الشريط الجانبي
    setupSidebar();
    
    // إعداد القائمة المتنقلة
    setupMobileMenu();
    
    console.log('🎉 تم اكتمال تهيئة الصفحة');
});

// إعداد القائمة المتنقلة
function setupMobileMenu() {
    console.log('📱 جاري إعداد القائمة المتنقلة...');
    
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        console.log('✅ تم العثور على زر القائمة المتنقلة');
    } else {
        console.log('⚠️ زر القائمة المتنقلة غير موجود');
    }
}

// ============================================
// دوال مساعدة
// ============================================

// تحديث بيانات لوحة التحكم
function refreshDashboard() {
    console.log('🔄 جاري تحديث لوحة التحكم...');
    showAuthNotification('جاري تحديث البيانات...', 'info');
    
    loadDashboardData();
    
    setTimeout(() => {
        showAuthNotification('تم تحديث البيانات بنجاح', 'success');
        console.log('✅ تم تحديث لوحة التحكم');
    }, 1500);
}

// عرض رسالة ترحيب
function showWelcomeMessage(user) {
    if (user) {
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 12) {
            greeting = 'صباح الخير';
        } else if (hour < 18) {
            greeting = 'مساء الخير';
        } else {
            greeting = 'مساء الخير';
        }
        
        showAuthNotification(`${greeting} ${user.name}!`, 'success', 3000);
        console.log(`👋 ${greeting} ${user.name}`);
    }
}

// ============================================
// تصدير الدوال
// ============================================

// تصدير الدوال للاستخدام العالمي
if (typeof window !== 'undefined') {
    window.initializeDashboard = initializeDashboard;
    window.refreshDashboard = refreshDashboard;
    window.updateDashboardUI = updateDashboardUI;
    window.loadDashboardData = loadDashboardData;
    
    console.log('📤 تم تصدير دوال لوحة التحكم');
}

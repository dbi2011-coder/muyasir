// ============================================
// 📁 الملف: muyasir-main/assets/js/dashboard.js
// ============================================

// نظام لوحة التحكم الرئيسية
let dashboardInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    // تهيئة لوحة التحكم بعد تحميل الصفحة
    setTimeout(() => {
        initializeDashboard();
    }, 100);
});

function initializeDashboard() {
    if (dashboardInitialized) return;
    
    console.log('🚀 بدء تهيئة لوحة التحكم...');
    
    // التحقق من المصادقة أولاً
    const user = checkAuth();
    if (!user) {
        console.log('❌ لم يتم العثور على مستخدم، إعادة التوجيه إلى صفحة تسجيل الدخول');
        redirectToLogin();
        return;
    }
    
    // تحديث واجهة المستخدم
    updateDashboardUI(user);
    
    // تهيئة الأحداث
    setupDashboardEvents();
    
    // تحميل البيانات
    loadDashboardData(user);
    
    // تهيئة الشريط الجانبي للهواتف
    setupMobileMenu();
    
    // تحديث حالة النظام
    updateSystemStatus();
    
    dashboardInitialized = true;
    console.log('✅ تم إعداد لوحة التحكم بنجاح');
}

function updateDashboardUI(user) {
    // تحديث اسم المستخدم
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    } else {
        console.warn('⚠️ لم يتم العثور على عنصر userName');
    }
    
    // تحديث الصورة الرمزية
    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
        // إضافة لون عشوائي للصورة الرمزية
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const colorIndex = user.id % colors.length;
        userAvatarElement.style.backgroundColor = colors[colorIndex];
        userAvatarElement.style.color = 'white';
        userAvatarElement.style.fontWeight = 'bold';
    }
    
    // تحديث الترحيب حسب الوقت
    updateWelcomeMessage();
    
    // تحديث القائمة الجانبية حسب دور المستخدم
    updateSidebarForRole(user.role);
}

function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('welcomeMessage');
    if (!welcomeElement) return;
    
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 12) {
        greeting = 'صباح الخير';
    } else if (hour < 18) {
        greeting = 'مساء الخير';
    } else {
        greeting = 'مساء الخير';
    }
    
    welcomeElement.textContent = greeting;
}

function updateSidebarForRole(role) {
    // إخفاء/إظهار عناصر القائمة حسب الدور
    const menuItems = {
        'admin': ['dashboard', 'teachers', 'students', 'settings', 'reports', 'logs'],
        'teacher': ['dashboard', 'students', 'lessons', 'assignments', 'tests', 'library', 'schedule', 'committee', 'messages'],
        'student': ['dashboard', 'lessons', 'assignments', 'tests', 'progress', 'messages'],
        'committee': ['dashboard', 'reports', 'notes', 'teachers', 'students']
    };
    
    const allowedItems = menuItems[role] || [];
    
    // يمكن إضافة منطق لإخفاء العناصر غير المسموحة هنا
    // حاليًا، جميع العناصر ظاهرة وتعتمد على التحقق من الصلاحيات في الصفحات
}

function setupDashboardEvents() {
    // أحداث أزرار الرأس
    setupHeaderEvents();
    
    // أحداث القائمة الجانبية
    setupSidebarEvents();
    
    // أحداث البطاقات الإحصائية
    setupStatsCardsEvents();
    
    // أحداث البحث
    setupSearchEvents();
    
    // مراقبة تغيير حجم النافذة
    window.addEventListener('resize', handleResize);
}

function setupHeaderEvents() {
    // زر الإشعارات
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', showNotifications);
    }
    
    // زر الإعدادات
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettings);
    }
    
    // زر المساعدة
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
    
    // زر الملف الشخصي
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', showProfile);
    }
}

function setupSidebarEvents() {
    // إضافة تأثير hover للعناصر
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // تحديث العنصر النشط في القائمة
    updateActiveMenuItem();
}

function setupStatsCardsEvents() {
    // جعل البطاقات الإحصائية قابلة للنقر
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const cardType = this.getAttribute('data-card-type');
            if (cardType) {
                showDetailedStats(cardType);
            }
        });
    });
}

function setupSearchEvents() {
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performDashboardSearch(this.value);
            }
        });
        
        // بحث أثناء الكتابة مع تأخير
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length >= 2) {
                    performDashboardSearch(this.value);
                }
            }, 500);
        });
    }
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            this.classList.toggle('active');
            
            // إضافة/إزالة قفل التمرير
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        });
        
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
            sidebar.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    }
}

function loadDashboardData(user) {
    console.log('📊 تحميل بيانات لوحة التحكم...');
    
    // إظهار حالة التحميل
    showLoadingState();
    
    // محاكاة تحميل البيانات
    setTimeout(() => {
        loadDashboardStats(user);
        loadRecentActivity(user);
        loadQuickActions(user);
        loadImportantUpdates(user);
        
        // إخفاء حالة التحميل
        hideLoadingState();
        
        console.log('✅ تم تحميل بيانات لوحة التحكم');
    }, 1500);
}

function loadDashboardStats(user) {
    const stats = calculateDashboardStats(user);
    
    // تحديث البطاقات الإحصائية
    updateStatCard('totalStudents', stats.totalStudents);
    updateStatCard('activeStudents', stats.activeStudents);
    updateStatCard('totalLessons', stats.totalLessons);
    updateStatCard('pendingAssignments', stats.pendingAssignments);
    updateStatCard('completedTests', stats.completedTests);
    updateStatCard('averageProgress', stats.averageProgress);
    
    // تحديث الرسوم البيانية إذا كانت موجودة
    updateCharts(stats);
}

function calculateDashboardStats(user) {
    // جمع البيانات من localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    let stats = {
        totalStudents: 0,
        activeStudents: 0,
        totalLessons: 0,
        pendingAssignments: 0,
        completedTests: 0,
        averageProgress: 0
    };
    
    switch (user.role) {
        case 'admin':
            stats.totalStudents = users.filter(u => u.role === 'student').length;
            stats.activeStudents = users.filter(u => u.role === 'student' && u.status === 'active').length;
            stats.totalLessons = lessons.length;
            stats.pendingAssignments = assignments.filter(a => a.status === 'pending').length;
            stats.completedTests = tests.filter(t => t.status === 'completed').length;
            stats.averageProgress = calculateAverageProgress(users);
            break;
            
        case 'teacher':
            // طلاب هذا المعلم فقط
            const teacherStudents = users.filter(u => 
                u.role === 'student' && u.teacherId === user.id
            );
            
            stats.totalStudents = teacherStudents.length;
            stats.activeStudents = teacherStudents.filter(s => s.status === 'active').length;
            
            // دروس هذا المعلم
            stats.totalLessons = lessons.filter(l => l.teacherId === user.id).length;
            
            // واجبات طلاب هذا المعلم
            const teacherAssignments = assignments.filter(a => 
                teacherStudents.some(s => s.id === a.studentId)
            );
            stats.pendingAssignments = teacherAssignments.filter(a => a.status === 'pending').length;
            
            // اختبارات طلاب هذا المعلم
            const teacherTests = tests.filter(t => 
                teacherStudents.some(s => s.id === t.studentId)
            );
            stats.completedTests = teacherTests.filter(t => t.status === 'completed').length;
            
            stats.averageProgress = calculateAverageProgress(teacherStudents);
            break;
            
        case 'student':
            // إحصائيات الطالب
            stats.totalLessons = lessons.filter(l => 
                l.grade === user.grade || l.studentId === user.id
            ).length;
            
            stats.pendingAssignments = assignments.filter(a => 
                a.studentId === user.id && a.status === 'pending'
            ).length;
            
            stats.completedTests = tests.filter(t => 
                t.studentId === user.id && t.status === 'completed'
            ).length;
            
            stats.averageProgress = user.progress || 0;
            break;
    }
    
    return stats;
}

function calculateAverageProgress(students) {
    if (!students || students.length === 0) return 0;
    
    const totalProgress = students.reduce((sum, student) => {
        return sum + (student.progress || 0);
    }, 0);
    
    return Math.round(totalProgress / students.length);
}

function updateStatCard(cardId, value) {
    const cardElement = document.getElementById(cardId);
    if (!cardElement) return;
    
    // تأثير العد المتزايد
    animateCounter(cardElement, value);
    
    // تحديث لون البطاقة بناءً على القيمة
    updateCardColor(cardElement, value);
}

function animateCounter(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    let current = currentValue;
    
    const interval = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        if (current === targetValue) {
            clearInterval(interval);
        }
    }, 20);
}

function updateCardColor(element, value) {
    const card = element.closest('.stat-card');
    if (!card) return;
    
    // إزالة ألوان الحالة السابقة
    card.classList.remove('success', 'warning', 'danger', 'info');
    
    // إضافة لون بناءً على القيمة
    if (value >= 80) {
        card.classList.add('success');
    } else if (value >= 50) {
        card.classList.add('warning');
    } else {
        card.classList.add('danger');
    }
}

function loadRecentActivity(user) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    // جلب النشاط الأخير من localStorage
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    
    // تصفية النشاط حسب المستخدم
    let userActivities = activities;
    if (user.role !== 'admin') {
        userActivities = activities.filter(activity => 
            activity.userId === user.id || 
            (user.role === 'teacher' && activity.type === 'student_activity')
        );
    }
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    userActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // عرض آخر 5 أنشطة فقط
    const recentActivities = userActivities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا يوجد نشاط حديث</h3>
                <p>سيظهر هنا سجل الأنشطة عند وجودها</p>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = recentActivities.map(activity => {
        const timeAgo = getTimeAgo(activity.timestamp);
        const icon = getActivityIcon(activity.type);
        const color = getActivityColor(activity.type);
        
        return `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${color}20; color: ${color}">
                    ${icon}
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getActivityIcon(type) {
    const icons = {
        'login': '🔐',
        'logout': '🚪',
        'lesson_completed': '✅',
        'assignment_submitted': '📝',
        'test_taken': '📊',
        'message_sent': '✉️',
        'profile_updated': '👤',
        'system': '⚙️',
        'warning': '⚠️',
        'success': '🎉'
    };
    
    return icons[type] || '📌';
}

function getActivityColor(type) {
    const colors = {
        'login': '#3498db',
        'logout': '#95a5a6',
        'lesson_completed': '#2ecc71',
        'assignment_submitted': '#f39c12',
        'test_taken': '#9b59b6',
        'message_sent': '#e74c3c',
        'profile_updated': '#1abc9c',
        'system': '#34495e',
        'warning': '#f39c12',
        'success': '#27ae60'
    };
    
    return colors[type] || '#7f8c8d';
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'منذ فترة';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
}

function loadQuickActions(user) {
    const quickActionsContainer = document.getElementById('quickActions');
    if (!quickActionsContainer) return;
    
    const actions = getQuickActionsForRole(user.role);
    
    if (actions.length === 0) {
        quickActionsContainer.style.display = 'none';
        return;
    }
    
    quickActionsContainer.innerHTML = actions.map(action => `
        <div class="action-card" onclick="${action.action}">
            <div class="action-icon">${action.icon}</div>
            <div class="action-title">${action.title}</div>
            <div class="action-description">${action.description}</div>
        </div>
    `).join('');
}

function getQuickActionsForRole(role) {
    const commonActions = [
        {
            icon: '📊',
            title: 'تقرير سريع',
            description: 'عرض تقرير الأداء',
            action: 'showQuickReport()'
        },
        {
            icon: '🔔',
            title: 'الإشعارات',
            description: 'عرض الإشعارات الجديدة',
            action: 'showNotifications()'
        }
    ];
    
    const roleActions = {
        'admin': [
            {
                icon: '👨‍🏫',
                title: 'إضافة معلم',
                description: 'إضافة معلم جديد للنظام',
                action: 'window.location.href="teachers.html?action=add"'
            },
            {
                icon: '⚙️',
                title: 'الإعدادات',
                description: 'تعديل إعدادات النظام',
                action: 'showSettings()'
            }
        ],
        'teacher': [
            {
                icon: '📚',
                title: 'إضافة درس',
                description: 'إنشاء درس جديد',
                action: 'window.location.href="lessons.html?action=add"'
            },
            {
                icon: '📝',
                title: 'إنشاء واجب',
                description: 'إضافة واجب جديد',
                action: 'window.location.href="assignments.html?action=add"'
            },
            {
                icon: '📊',
                title: 'اختبار تشخيصي',
                description: 'إنشاء اختبار جديد',
                action: 'window.location.href="tests.html"'
            }
        ],
        'student': [
            {
                icon: '📖',
                title: 'الدرس الحالي',
                description: 'استئناف الدرس الأخير',
                action: 'continueCurrentLesson()'
            },
            {
                icon: '✍️',
                title: 'الواجبات',
                description: 'عرض الواجبات المطلوبة',
                action: 'window.location.href="assignments.html"'
            }
        ]
    };
    
    return [...commonActions, ...(roleActions[role] || [])];
}

function loadImportantUpdates(user) {
    const updatesContainer = document.getElementById('importantUpdates');
    if (!updatesContainer) return;
    
    // جلب التحديثات المهمة
    const updates = getImportantUpdates(user);
    
    if (updates.length === 0) {
        updatesContainer.style.display = 'none';
        return;
    }
    
    updatesContainer.innerHTML = `
        <div class="updates-header">
            <h3><i class="fas fa-bullhorn"></i> تحديثات مهمة</h3>
            <button class="btn btn-sm btn-secondary" onclick="markAllUpdatesAsRead()">
                تعليم الكل كمقروء
            </button>
        </div>
        <div class="updates-list">
            ${updates.map(update => `
                <div class="update-item ${update.isRead ? 'read' : 'unread'}">
                    <div class="update-icon">${update.icon}</div>
                    <div class="update-content">
                        <div class="update-title">${update.title}</div>
                        <div class="update-description">${update.description}</div>
                        <div class="update-time">${update.time}</div>
                    </div>
                    ${!update.isRead ? 
                        `<button class="btn btn-sm btn-success" onclick="markUpdateAsRead(${update.id})">
                            تعليم كمقروء
                        </button>` : ''
                    }
                </div>
            `).join('')}
        </div>
    `;
}

function getImportantUpdates(user) {
    // في تطبيق حقيقي، هذه البيانات تأتي من السيرفر
    // هنا نستخدم بيانات وهمية
    return [
        {
            id: 1,
            icon: '🎉',
            title: 'تحديث النظام',
            description: 'تم إضافة ميزات جديدة للاختبارات التشخيصية',
            time: 'منذ يومين',
            isRead: false
        },
        {
            id: 2,
            icon: '⚠️',
            title: 'صيانة مجدولة',
            description: 'سيكون النظام غير متاح يوم الجمعة من 2-4 صباحاً',
            time: 'منذ أسبوع',
            isRead: true
        },
        {
            id: 3,
            icon: '📚',
            title: 'دروس جديدة',
            description: 'تم إضافة 5 دروس جديدة في مادة الرياضيات',
            time: 'منذ 3 أيام',
            isRead: false
        }
    ];
}

function updateCharts(stats) {
    // هذه دالة لتهيئة الرسوم البيانية
    // يمكن إضافة مكتبة مثل Chart.js هنا
    const chartsContainer = document.getElementById('chartsContainer');
    if (!chartsContainer) return;
    
    // محاكاة الرسوم البيانية
    chartsContainer.innerHTML = `
        <div class="chart-placeholder">
            <i class="fas fa-chart-bar" style="font-size: 3rem; color: #3498db; margin-bottom: 15px;"></i>
            <h4>الرسوم البيانية</h4>
            <p>سيتم عرض الرسوم البيانية التفصيلية هنا</p>
            <button class="btn btn-primary" onclick="showDetailedCharts()">
                عرض الرسوم البيانية المتقدمة
            </button>
        </div>
    `;
}

function showLoadingState() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

function hideLoadingState() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function updateActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function updateSystemStatus() {
    // تحديث حالة النظام (متصل/غير متصل)
    const statusElement = document.getElementById('systemStatus');
    if (!statusElement) return;
    
    const isOnline = navigator.onLine;
    
    if (isOnline) {
        statusElement.innerHTML = '<i class="fas fa-circle" style="color: #2ecc71;"></i> متصل';
        statusElement.style.color = '#2ecc71';
    } else {
        statusElement.innerHTML = '<i class="fas fa-circle" style="color: #e74c3c;"></i> غير متصل';
        statusElement.style.color = '#e74c3c';
    }
}

function handleResize() {
    // إغلاق القائمة الجانبية على الهواتف عند التكبير
    if (window.innerWidth > 768) {
        const sidebar = document.querySelector('.sidebar');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (mobileMenuBtn) {
                mobileMenuBtn.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }
    
    // تحديث الرسوم البيانية إذا كانت موجودة
    updateChartsOnResize();
}

function updateChartsOnResize() {
    // إعادة رسم الرسوم البيانية عند تغيير حجم النافذة
    // هذه دالة افتراضية، سيتم تنفيذها إذا كانت هناك رسوم بيانية
}

// ============================================
// دوال واجهة المستخدم
// ============================================

function showNotifications() {
    showAuthNotification('نظام الإشعارات المتكامل قيد التطوير', 'info');
    // يمكن توجيه المستخدم إلى صفحة الإشعارات
    // window.location.href = 'notifications.html';
}

function showSettings() {
    showAuthNotification('سيتم توجيهك إلى صفحة الإعدادات', 'info');
    setTimeout(() => {
        window.location.href = 'settings.html';
    }, 1000);
}

function showHelp() {
    // فتح نافذة المساعدة
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
        helpModal.classList.add('show');
    } else {
        showAuthNotification('مركز المساعدة قيد التطوير', 'info');
    }
}

function showProfile() {
    window.location.href = 'profile.html';
}

function showQuickReport() {
    showAuthNotification('جاري إنشاء التقرير السريع...', 'info');
    
    setTimeout(() => {
        // محاكاة إنشاء التقرير
        const reportData = generateQuickReport();
        
        // عرض التقرير في نافذة منبثقة
        const reportModal = document.getElementById('quickReportModal');
        if (reportModal) {
            document.getElementById('reportContent').innerHTML = reportData;
            reportModal.classList.add('show');
        } else {
            showAuthNotification('تم إنشاء التقرير السريع بنجاح', 'success');
        }
    }, 1500);
}

function generateQuickReport() {
    const user = getCurrentUser();
    const stats = calculateDashboardStats(user);
    
    return `
        <div class="quick-report">
            <h4>تقرير سريع - ${user.name}</h4>
            <div class="report-stats">
                <div class="stat-item">
                    <span class="stat-label">إجمالي الطلاب:</span>
                    <span class="stat-value">${stats.totalStudents}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">الدروس:</span>
                    <span class="stat-value">${stats.totalLessons}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">متوسط التقدم:</span>
                    <span class="stat-value">${stats.averageProgress}%</span>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn btn-sm btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> طباعة
                </button>
                <button class="btn btn-sm btn-success" onclick="downloadReport()">
                    <i class="fas fa-download"></i> تحميل
                </button>
            </div>
        </div>
    `;
}

function closeQuickReport() {
    const modal = document.getElementById('quickReportModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function performDashboardSearch(query) {
    if (!query || query.trim() === '') return;
    
    showAuthNotification(`جاري البحث عن: ${query}`, 'info');
    
    // محاكاة البحث
    setTimeout(() => {
        // في تطبيق حقيقي، هنا يتم البحث في قاعدة البيانات
        const results = simulateSearch(query);
        
        if (results.length > 0) {
            showSearchResults(results);
        } else {
            showAuthNotification('لم يتم العثور على نتائج', 'warning');
        }
    }, 1000);
}

function simulateSearch(query) {
    // محاكاة نتائج البحث
    return [
        {
            type: 'student',
            title: 'طالب',
            name: 'أحمد محمد',
            match: 'اسم الطالب يحتوي على "' + query + '"',
            link: 'student.html?id=1'
        },
        {
            type: 'lesson',
            title: 'درس',
            name: 'الرياضيات - الجمع',
            match: 'عنوان الدرس يحتوي على "' + query + '"',
            link: 'lesson.html?id=1'
        }
    ];
}

function showSearchResults(results) {
    const searchResultsModal = document.getElementById('searchResultsModal');
    if (!searchResultsModal) return;
    
    const resultsList = document.getElementById('searchResultsList');
    if (!resultsList) return;
    
    resultsList.innerHTML = results.map(result => `
        <div class="search-result-item">
            <div class="result-type">${result.title}</div>
            <div class="result-name">${result.name}</div>
            <div class="result-match">${result.match}</div>
            <button class="btn btn-sm btn-primary" onclick="window.location.href='${result.link}'">
                عرض
            </button>
        </div>
    `).join('');
    
    searchResultsModal.classList.add('show');
}

function closeSearchResults() {
    const modal = document.getElementById('searchResultsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function markUpdateAsRead(updateId) {
    showAuthNotification('تم تعليم التحديث كمقروء', 'success');
    
    // في تطبيق حقيقي، هنا يتم تحديث قاعدة البيانات
    const updateElement = document.querySelector(`.update-item button[onclick*="${updateId}"]`);
    if (updateElement) {
        updateElement.closest('.update-item').classList.remove('unread');
        updateElement.closest('.update-item').classList.add('read');
        updateElement.remove();
    }
}

function markAllUpdatesAsRead() {
    showAuthNotification('تم تعليم جميع التحديثات كمقروءة', 'success');
    
    const updateItems = document.querySelectorAll('.update-item');
    updateItems.forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        
        const markButton = item.querySelector('button');
        if (markButton) {
            markButton.remove();
        }
    });
}

function showDetailedStats(cardType) {
    showAuthNotification(`جاري تحميل إحصائيات ${cardType}...`, 'info');
    
    setTimeout(() => {
        // توجيه إلى صفحة الإحصائيات التفصيلية
        window.location.href = `stats.html?type=${cardType}`;
    }, 1000);
}

function showDetailedCharts() {
    showAuthNotification('جاري تحميل الرسوم البيانية المتقدمة...', 'info');
    
    setTimeout(() => {
        // توجيه إلى صفحة الرسوم البيانية
        window.location.href = 'charts.html';
    }, 1000);
}

function continueCurrentLesson() {
    const user = getCurrentUser();
    
    // البحث عن الدرس الحالي للطالب
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentLesson = lessons.find(lesson => 
        lesson.studentId === user.id && lesson.status === 'in_progress'
    );
    
    if (currentLesson) {
        window.location.href = `lesson.html?id=${currentLesson.id}`;
    } else {
        showAuthNotification('لا يوجد درس حالياً', 'info');
        window.location.href = 'lessons.html';
    }
}

function downloadReport() {
    showAuthNotification('جاري تحميل التقرير...', 'info');
    
    setTimeout(() => {
        // محاكاة تنزيل الملف
        const blob = new Blob(['تقرير أداء الطلاب'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'تقرير-الأداء.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAuthNotification('تم تحميل التقرير بنجاح', 'success');
    }, 1500);
}

// ============================================
// دوال المساعدة
// ============================================

function redirectToLogin() {
    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 2000);
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

window.showNotifications = showNotifications;
window.showSettings = showSettings;
window.showHelp = showHelp;
window.showProfile = showProfile;
window.showQuickReport = showQuickReport;
window.closeQuickReport = closeQuickReport;
window.performDashboardSearch = performDashboardSearch;
window.closeSearchResults = closeSearchResults;
window.markUpdateAsRead = markUpdateAsRead;
window.markAllUpdatesAsRead = markAllUpdatesAsRead;
window.showDetailedStats = showDetailedStats;
window.showDetailedCharts = showDetailedCharts;
window.continueCurrentLesson = continueCurrentLesson;
window.downloadReport = downloadReport;

// تهيئة لوحة التحكم عند تحميل الصفحة
console.log('📊 نظام لوحة التحكم - جاهز للتهيئة');

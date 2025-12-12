// ============================================
// 📁 الملف: muyasir-main/assets/js/library-interactive.js
// ============================================

// نظام التفاعلية المتقدم لمكتبة المحتوى التعليمي

let libraryData = {
    lessons: [],
    tests: [],
    objectives: [],
    recentItems: []
};

// تهيئة النظام التفاعلي
function initializeInteractiveFeatures() {
    console.log('🚀 نظام التفاعلية للمكتبة التعليمية - جاهز للتشغيل');
    
    // تحميل البيانات
    loadLibraryData();
    
    // تهيئة البطاقات القابلة للنقر
    initializeClickableCards();
    
    // تهيئة تأثيرات التمرير
    initializeHoverEffects();
    
    // إعداد البحث الذكي
    setupSmartSearch();
    
    // إعداد الفلترة المتقدمة
    setupAdvancedFilters();
    
    // مراقبة التغييرات
    observeLibraryChanges();
}

// تحميل بيانات المكتبة
function loadLibraryData() {
    try {
        // محاكاة تحميل البيانات من localStorage أو API
        setTimeout(() => {
            libraryData = {
                lessons: JSON.parse(localStorage.getItem('teacherLessons') || '[]'),
                tests: JSON.parse(localStorage.getItem('teacherDiagnosticTests') || '[]'),
                objectives: JSON.parse(localStorage.getItem('teacherObjectives') || '[]'),
                recentItems: JSON.parse(localStorage.getItem('recentLibraryItems') || '[]')
            };
            
            console.log('✅ بيانات المكتبة التعليمية تم تحميلها بنجاح');
            updateLibraryStats();
            
        }, 1000);
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات المكتبة:', error);
    }
}

// تهيئة البطاقات القابلة للنقر
function initializeClickableCards() {
    const clickableCards = document.querySelectorAll('.clickable-card');
    
    clickableCards.forEach(card => {
        // إضافة تأثير النقر
        card.addEventListener('click', handleCardClick);
        
        // إضافة تأثيرات التمرير
        card.addEventListener('mouseenter', handleCardHoverEnter);
        card.addEventListener('mouseleave', handleCardHoverLeave);
        
        // إضافة تأثير النقر باستخدام لوحة المفاتيح
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', handleCardKeydown);
        
        // إضافة بيانات إضافية
        card.dataset.interactive = 'true';
        card.dataset.animation = 'enabled';
    });
    
    console.log(`✅ تم تهيئة ${clickableCards.length} بطاقة تفاعلية`);
}

// معالجة النقر على البطاقة
function handleCardClick(event) {
    const card = event.currentTarget;
    const cardType = getCardType(card);
    const cardId = getCardId(card);
    
    // تسجيل النشاط
    logLibraryActivity('card_click', {
        type: cardType,
        id: cardId,
        title: card.querySelector('h4')?.textContent || 'غير معروف'
    });
    
    // تأثير النقر
    animateCardClick(card);
    
    // الانتقال إلى الصفحة المناسبة بعد التأخير
    setTimeout(() => {
        navigateToCardPage(cardType, cardId);
    }, 300);
}

// الحصول على نوع البطاقة
function getCardType(card) {
    if (card.closest('#testsSection')) return 'test';
    if (card.closest('#lessonsSection')) return 'lesson';
    if (card.closest('#objectivesSection')) return 'objective';
    return 'unknown';
}

// الحصول على معرف البطاقة
function getCardId(card) {
    // محاولة استخراج المعرف من بيانات البطاقة
    const title = card.querySelector('h4')?.textContent || '';
    const match = title.match(/\d+/);
    return match ? parseInt(match[0]) : generateRandomId();
}

// توليد معرف عشوائي
function generateRandomId() {
    return Math.floor(Math.random() * 1000) + 1;
}

// تأثير النقر على البطاقة
function animateCardClick(card) {
    // إضافة فئة التأثير
    card.classList.add('card-click-animation');
    
    // إضافة تأثير النبض
    const pulseEffect = document.createElement('div');
    pulseEffect.className = 'card-pulse-effect';
    pulseEffect.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: rgba(52, 152, 219, 0.1);
        border-radius: inherit;
        transform: translate(-50%, -50%) scale(0);
        animation: pulse 0.5s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    card.style.position = 'relative';
    card.appendChild(pulseEffect);
    
    // إزالة التأثير بعد الانتهاء
    setTimeout(() => {
        card.classList.remove('card-click-animation');
        pulseEffect.remove();
    }, 500);
    
    // إضافة أنماط التأثير إذا لم تكن موجودة
    if (!document.querySelector('#card-animation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'card-animation-styles';
        styles.textContent = `
            @keyframes pulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
            }
            
            .card-click-animation {
                animation: clickScale 0.3s ease;
            }
            
            @keyframes clickScale {
                0% { transform: scale(1); }
                50% { transform: scale(0.98); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(styles);
    }
}

// معالجة التمرير على البطاقة
function handleCardHoverEnter(event) {
    const card = event.currentTarget;
    
    // زيادة الظل وإضافة تأثير الارتفاع
    card.style.boxShadow = '0 15px 30px rgba(0,0,0,0.15)';
    card.style.zIndex = '10';
    
    // إظهار التفاصيل الإضافية
    showCardDetails(card);
    
    // إضافة تأثير اهتزاز خفيف
    card.style.animation = 'gentleShake 0.5s ease';
    
    // تسجيل النشاط
    logLibraryActivity('card_hover', {
        title: card.querySelector('h4')?.textContent || 'غير معروف'
    });
}

function handleCardHoverLeave(event) {
    const card = event.currentTarget;
    
    // استعادة الظل الأصلي
    card.style.boxShadow = '';
    card.style.zIndex = '';
    card.style.animation = '';
    
    // إخفاء التفاصيل الإضافية
    hideCardDetails(card);
}

// معالجة الضغط على المفاتيح
function handleCardKeydown(event) {
    const card = event.currentTarget;
    
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCardClick({ currentTarget: card });
    }
}

// إظهار تفاصيل البطاقة
function showCardDetails(card) {
    const details = card.querySelector('.card-details');
    if (!details) {
        createCardDetails(card);
    } else {
        details.style.display = 'block';
    }
}

// إنشاء تفاصيل البطاقة
function createCardDetails(card) {
    const details = document.createElement('div');
    details.className = 'card-details';
    details.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        opacity: 0;
        animation: fadeIn 0.3s ease forwards;
        z-index: 2;
    `;
    
    const title = card.querySelector('h4').textContent;
    const badge = card.querySelector('.content-badge');
    const subject = badge ? badge.textContent : 'غير محدد';
    
    details.innerHTML = `
        <h4 style="color: var(--primary-color); margin-bottom: 10px;">${title}</h4>
        <p style="color: #666; margin-bottom: 15px;">${subject}</p>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); quickView(this)">
                <i class="fas fa-eye"></i> معاينة سريعة
            </button>
            <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); quickAssign(this)">
                <i class="fas fa-share"></i> تعيين سريع
            </button>
        </div>
        <p style="font-size: 0.8rem; color: #999; margin-top: 15px;">
            اضغط Enter أو Space للانتقال
        </p>
    `;
    
    card.style.position = 'relative';
    card.appendChild(details);
    
    // إضافة أنماط التحريك إذا لم تكن موجودة
    if (!document.querySelector('#card-details-styles')) {
        const styles = document.createElement('style');
        styles.id = 'card-details-styles';
        styles.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes gentleShake {
                0%, 100% { transform: translateY(0); }
                25% { transform: translateY(-3px); }
                75% { transform: translateY(3px); }
            }
        `;
        document.head.appendChild(styles);
    }
}

// إخفاء تفاصيل البطاقة
function hideCardDetails(card) {
    const details = card.querySelector('.card-details');
    if (details) {
        details.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (details.parentElement === card) {
                details.remove();
            }
        }, 300);
    }
}

// الانتقال إلى صفحة البطاقة
function navigateToCardPage(type, id) {
    let url = '';
    
    switch (type) {
        case 'test':
            url = `diagnostic-tests.html?test=${id}`;
            break;
        case 'lesson':
            url = `lesson-details.html?id=${id}`;
            break;
        case 'objective':
            url = `objective-details.html?id=${id}`;
            break;
        default:
            url = 'content-library.html';
    }
    
    // تسجيل الانتقال
    logNavigation(type, id);
    
    // الانتقال إلى الصفحة
    window.location.href = url;
}

// تهيئة تأثيرات التمرير
function initializeHoverEffects() {
    // تأثيرات للعناوين القابلة للنقر
    document.querySelectorAll('.clickable-title').forEach(title => {
        title.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-8px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        title.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // تأثيرات للأيقونات
    document.querySelectorAll('.stat-icon').forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2) rotate(10deg)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });
}

// إعداد البحث الذكي
function setupSmartSearch() {
    const searchInput = document.getElementById('librarySearch');
    if (!searchInput) return;
    
    // بحث في الوقت الحقيقي
    searchInput.addEventListener('input', debounce(function() {
        performSmartSearch(this.value);
    }, 300));
    
    // اقتراحات البحث
    searchInput.addEventListener('focus', showSearchSuggestions);
    searchInput.addEventListener('blur', hideSearchSuggestions);
}

// البحث الذكي
function performSmartSearch(query) {
    if (!query.trim()) {
        resetSearch();
        return;
    }
    
    const cards = document.querySelectorAll('.content-card');
    let foundCount = 0;
    
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const badge = card.querySelector('.content-badge');
        const subject = badge ? badge.textContent.toLowerCase() : '';
        
        const searchTerms = query.toLowerCase().split(' ');
        let match = false;
        
        // البحث المتقدم
        searchTerms.forEach(term => {
            if (title.includes(term) || 
                description.includes(term) || 
                subject.includes(term)) {
                match = true;
            }
        });
        
        if (match) {
            card.style.display = 'block';
            highlightSearchTerms(card, query);
            foundCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // إظهار نتائج البحث
    showSearchResults(foundCount, query);
}

// إبراز مصطلحات البحث
function highlightSearchTerms(card, query) {
    const terms = query.split(' ').filter(term => term.length > 2);
    
    terms.forEach(term => {
        const elements = card.querySelectorAll('h4, p');
        elements.forEach(element => {
            const html = element.innerHTML;
            const regex = new RegExp(`(${term})`, 'gi');
            const highlighted = html.replace(regex, '<mark class="search-highlight">$1</mark>');
            element.innerHTML = highlighted;
        });
    });
    
    // إضافة أنماط التمييز إذا لم تكن موجودة
    if (!document.querySelector('#search-highlight-styles')) {
        const styles = document.createElement('style');
        styles.id = 'search-highlight-styles';
        styles.textContent = `
            .search-highlight {
                background-color: #fff3cd;
                color: #856404;
                padding: 2px 4px;
                border-radius: 3px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(styles);
    }
}

// إعادة تعيين البحث
function resetSearch() {
    document.querySelectorAll('.content-card').forEach(card => {
        card.style.display = 'block';
        
        // إزالة التمييز
        const marks = card.querySelectorAll('.search-highlight');
        marks.forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    });
    
    hideSearchResults();
}

// إظهار نتائج البحث
function showSearchResults(count, query) {
    let resultsDiv = document.getElementById('searchResults');
    
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'searchResults';
        resultsDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(resultsDiv);
    }
    
    resultsDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-search" style="color: var(--primary-color);"></i>
            <div>
                <strong>نتائج البحث:</strong>
                <div>تم العثور على ${count} نتيجة لـ "${query}"</div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="clearSearch()" style="margin-right: auto;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

// إخفاء نتائج البحث
function hideSearchResults() {
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) {
        resultsDiv.remove();
    }
}

// مسح البحث
function clearSearch() {
    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
        searchInput.value = '';
    }
    resetSearch();
    hideSearchResults();
}

// إظهار اقتراحات البحث
function showSearchSuggestions() {
    const suggestions = [
        'اختبار القراءة',
        'درس الرياضيات',
        'هدف الإملاء',
        'لغتي',
        'الرياضيات',
        'العلوم'
    ];
    
    let suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (!suggestionsDiv) {
        suggestionsDiv = document.createElement('div');
        suggestionsDiv.id = 'searchSuggestions';
        suggestionsDiv.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            left: 0;
            background: white;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        const searchBox = document.querySelector('.search-box');
        searchBox.style.position = 'relative';
        searchBox.appendChild(suggestionsDiv);
    }
    
    suggestionsDiv.innerHTML = suggestions.map(suggestion => `
        <div class="search-suggestion" 
             onclick="selectSearchSuggestion('${suggestion}')"
             style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background 0.2s;">
            <i class="fas fa-search" style="color: #666; margin-left: 10px;"></i>
            ${suggestion}
        </div>
    `).join('');
}

// إخفاء اقتراحات البحث
function hideSearchSuggestions() {
    setTimeout(() => {
        const suggestionsDiv = document.getElementById('searchSuggestions');
        if (suggestionsDiv) {
            suggestionsDiv.remove();
        }
    }, 200);
}

// اختيار اقتراح البحث
function selectSearchSuggestion(suggestion) {
    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
        searchInput.value = suggestion;
        searchInput.focus();
        performSmartSearch(suggestion);
    }
    hideSearchSuggestions();
}

// إعداد الفلترة المتقدمة
function setupAdvancedFilters() {
    // فلترة حسب التاريخ
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const period = this.textContent.trim();
            filterByDate(period);
        });
    });
    
    // فلترة حسب الحالة
    document.querySelectorAll('.objectives-status').forEach(status => {
        status.addEventListener('click', function(e) {
            e.stopPropagation();
            const state = this.classList.contains('linked') ? 'linked' : 'not-linked';
            filterByState(state);
        });
    });
}

// فلترة حسب التاريخ
function filterByDate(period) {
    const cards = document.querySelectorAll('.content-card');
    const now = new Date();
    
    cards.forEach(card => {
        const dateElement = card.querySelector('.content-meta span');
        if (!dateElement) return;
        
        const dateText = dateElement.textContent.toLowerCase();
        let show = true;
        
        switch (period) {
            case 'هذا الأسبوع':
                show = dateText.includes('اليوم') || dateText.includes('أمس') || dateText.includes('أسبوع');
                break;
            case 'هذا الشهر':
                show = !dateText.includes('أسبوع') || dateText.includes('شهر');
                break;
            default:
                show = true;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

// فلترة حسب الحالة
function filterByState(state) {
    const cards = document.querySelectorAll('.content-card');
    
    cards.forEach(card => {
        const status = card.querySelector('.objectives-status');
        if (!status) return;
        
        const cardState = status.classList.contains('linked') ? 'linked' : 'not-linked';
        card.style.display = (state === 'all' || cardState === state) ? 'block' : 'none';
    });
}

// تحديث إحصائيات المكتبة
function updateLibraryStats() {
    const stats = calculateLibraryStats();
    
    document.getElementById('totalLessons').textContent = stats.lessons;
    document.getElementById('totalTests').textContent = stats.tests;
    document.getElementById('totalObjectives').textContent = stats.objectives;
    document.getElementById('linkedContent').textContent = stats.linked;
    
    // تأثيرات التحديث
    animateStatsUpdate();
}

// حساب إحصائيات المكتبة
function calculateLibraryStats() {
    return {
        lessons: libraryData.lessons.length,
        tests: libraryData.tests.length,
        objectives: libraryData.objectives.length,
        linked: libraryData.lessons.filter(l => l.linked).length + 
               libraryData.tests.filter(t => t.linked).length
    };
}

// تأثيرات تحديث الإحصائيات
function animateStatsUpdate() {
    document.querySelectorAll('.stat-number').forEach(stat => {
        stat.style.animation = 'pulseUpdate 0.5s ease';
        setTimeout(() => {
            stat.style.animation = '';
        }, 500);
    });
    
    // إضافة أنماط التحريك إذا لم تكن موجودة
    if (!document.querySelector('#stats-animation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'stats-animation-styles';
        styles.textContent = `
            @keyframes pulseUpdate {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(styles);
    }
}

// مراقبة التغييرات في المكتبة
function observeLibraryChanges() {
    // مراقبة إضافة محتوى جديد
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                handleNewContent(mutation.addedNodes);
            }
        });
    });
    
    // بدء المراقبة
    const libraryContainer = document.querySelector('.library-sections');
    if (libraryContainer) {
        observer.observe(libraryContainer, { childList: true, subtree: true });
    }
}

// معالجة المحتوى الجديد
function handleNewContent(nodes) {
    nodes.forEach(node => {
        if (node.nodeType === 1 && node.classList && node.classList.contains('content-card')) {
            // تهيئة البطاقة الجديدة
            if (!node.dataset.interactive) {
                node.classList.add('clickable-card');
                initializeClickableCardsForNode(node);
            }
        }
    });
}

// تهيئة البطاقات لعقدة محددة
function initializeClickableCardsForNode(node) {
    node.addEventListener('click', handleCardClick);
    node.addEventListener('mouseenter', handleCardHoverEnter);
    node.addEventListener('mouseleave', handleCardHoverLeave);
    node.setAttribute('tabindex', '0');
    node.addEventListener('keydown', handleCardKeydown);
    node.dataset.interactive = 'true';
}

// تسجيل نشاط المكتبة
function logLibraryActivity(action, data) {
    const activity = {
        action,
        data,
        timestamp: new Date().toISOString(),
        user: getCurrentUser()?.name || 'مستخدم غير معروف'
    };
    
    // حفظ في localStorage
    const activities = JSON.parse(localStorage.getItem('libraryActivities') || '[]');
    activities.push(activity);
    
    // الاحتفاظ بآخر 100 نشاط فقط
    if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
    }
    
    localStorage.setItem('libraryActivities', JSON.stringify(activities));
}

// تسجيل الانتقال
function logNavigation(type, id) {
    const navigation = {
        from: 'content-library',
        to: type,
        id,
        timestamp: new Date().toISOString()
    };
    
    // حفظ في sessionStorage للاستخدام في الصفحة التالية
    sessionStorage.setItem('lastNavigation', JSON.stringify(navigation));
}

// دوال مساعدة
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    try {
        const sessionData = sessionStorage.getItem('currentUser');
        return sessionData ? JSON.parse(sessionData).user : null;
    } catch (error) {
        return null;
    }
}

// معاينة سريعة
function quickView(button) {
    const card = button.closest('.content-card');
    const title = card.querySelector('h4').textContent;
    showNotification(`معاينة سريعة: ${title}`, 'info');
}

// تعيين سريع
function quickAssign(button) {
    const card = button.closest('.content-card');
    const title = card.querySelector('h4').textContent;
    showNotification(`جاري تعيين: ${title}`, 'success');
}

// إظهار إشعار
function showNotification(message, type = 'info') {
    // استخدام نظام الإشعارات الموجود في النظام
    if (typeof showAuthNotification === 'function') {
        showAuthNotification(message, type);
    } else {
        alert(message);
    }
}

// تصدير الوظائف للاستخدام العالمي
window.initializeInteractiveFeatures = initializeInteractiveFeatures;
window.navigateToTest = navigateToCardPage;
window.clearSearch = clearSearch;
window.selectSearchSuggestion = selectSearchSuggestion;
window.quickView = quickView;
window.quickAssign = quickAssign;

// التهيئة التلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التأخير لضمان تحميل جميع العناصر
    setTimeout(() => {
        initializeInteractiveFeatures();
    }, 100);
});

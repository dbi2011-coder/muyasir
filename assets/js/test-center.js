/**
 * دوال مركز الاختبار للمدير
 */

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('test-center.html')) {
        initializeTestCenter();
    }
});

function initializeTestCenter() {
    // التحقق من صلاحيات المدير
    const currentUser = getCurrentUser();
    
    if (currentUser?.role !== 'admin') {
        showAuthNotification('غير مصرح بالوصول', 'error');
        setTimeout(() => window.location.href = '../../index.html', 2000);
        return;
    }
    
    loadSystemStats();
    loadPreviousResults();
}

// تحميل إحصائيات النظام
function loadSystemStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    // حساب معدل نجاح الاختبارات
    const testReports = JSON.parse(localStorage.getItem('systemTestReport') || '{}');
    const successRate = testReports.summary?.successRate || 0;
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalLessons').textContent = lessons.length;
    document.getElementById('totalTests').textContent = tests.length;
    document.getElementById('successRate').textContent = `${successRate}%`;
}

// تحميل نتائج الاختبارات السابقة
function loadPreviousResults() {
    const resultsList = document.getElementById('previousResults');
    const testReports = JSON.parse(localStorage.getItem('systemTestReport') || '{}');
    
    if (!testReports.details || testReports.details.length === 0) {
        resultsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>لا توجد نتائج سابقة</h3>
                <p>قم بتشغيل اختبارات جديدة لرؤية النتائج هنا</p>
            </div>
        `;
        return;
    }
    
    // عرض آخر 5 نتائج
    const recentResults = testReports.details.slice(-5).reverse();
    
    resultsList.innerHTML = recentResults.map(result => `
        <div class="result-item ${result.status}">
            <div class="result-header">
                <div class="result-name">${result.name}</div>
                <div class="result-status-badge ${result.status}">
                    ${result.status === 'passed' ? '✅ نجاح' : '❌ فشل'}
                </div>
            </div>
            <div class="result-meta">
                <span>${formatDate(result.timestamp)}</span>
                <span>${result.result || 'لا توجد تفاصيل'}</span>
            </div>
        </div>
    `).join('');
}

// تشغيل اختبارات الأمان
function runSecurityTests() {
    showAuthNotification('جاري تشغيل اختبارات الأمان...', 'info');
    
    const securityTests = [
        {
            name: 'فحص عزل البيانات',
            test: () => checkDataIsolation()
        },
        {
            name: 'فحص صلاحيات الوصول',
            test: () => testAccessPermissions()
        },
        {
            name: 'فحص تسجيل الدخول',
            test: () => testAuthentication()
        }
    ];
    
    runCustomTests(securityTests, 'اختبارات الأمان');
}

// تشغيل اختبارات الأداء
function runPerformanceTests() {
    showAuthNotification('جاري تشغيل اختبارات الأداء...', 'info');
    
    const performanceTests = [
        {
            name: 'قياس وقت تحميل الصفحات',
            test: () => measurePageLoadTime()
        },
        {
            name: 'اختبار سرعة الاستجابة',
            test: () => testResponseTime()
        },
        {
            name: 'فحص استخدام الذاكرة',
            test: () => checkMemoryUsage()
        }
    ];
    
    runCustomTests(performanceTests, 'اختبارات الأداء');
}

// تشغيل اختبارات الوظائف
function runFunctionalityTests() {
    showAuthNotification('جاري تشغيل اختبارات الوظائف...', 'info');
    
    // هنا يمكن إضافة اختبارات لكل وظيفة في النظام
    const functionalityTests = [
        {
            name: 'اختبار إضافة الطلاب',
            test: () => testStudentAddition()
        },
        {
            name: 'اختبار إنشاء الدروس',
            test: () => testLessonCreation()
        },
        {
            name: 'اختبار توليد التقارير',
            test: () => testReportGeneration()
        },
        {
            name: 'اختبار نظام المراسلة',
            test: () => testMessagingSystem()
        }
    ];
    
    runCustomTests(functionalityTests, 'اختبارات الوظائف');
}

// تشغيل اختبارات عزل البيانات
function runDataIsolationTests() {
    showAuthNotification('جاري اختبار عزل البيانات...', 'info');
    
    const isolationTests = [
        {
            name: 'فحص عزل بيانات المعلمين',
            test: () => testTeacherDataIsolation()
        },
        {
            name: 'فحص عزل بيانات الطلاب',
            test: () => testStudentDataIsolation()
        },
        {
            name: 'فحص عزل بيانات اللجنة',
            test: () => testCommitteeDataIsolation()
        }
    ];
    
    runCustomTests(isolationTests, 'اختبارات عزل البيانات');
}

// تشغيل جميع الاختبارات
function runAllTests() {
    showAuthNotification('جاري التشغيل الشامل لجميع الاختبارات...', 'info');
    runSystemTests();
}

// تشغيل اختبارات مخصصة
async function runCustomTests(tests, category) {
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.test();
            results.push({
                name: test.name,
                status: 'passed',
                result: result
            });
        } catch (error) {
            results.push({
                name: test.name,
                status: 'failed',
                result: error.message
            });
        }
    }
    
    displayCustomTestResults(results, category);
}

// عرض نتائج الاختبارات المخصصة
function displayCustomTestResults(results, category) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    const resultsHTML = `
        <div class="custom-test-results">
            <h3>نتائج ${category}</h3>
            <div class="results-summary">
                <span class="summary-passed">✅ ${passed} نجاح</span>
                <span class="summary-failed">❌ ${failed} فشل</span>
            </div>
            <div class="results-details">
                ${results.map(result => `
                    <div class="result-detail ${result.status}">
                        <span class="detail-name">${result.name}</span>
                        <span class="detail-status">${result.status === 'passed' ? '✅' : '❌'}</span>
                        <div class="detail-result">${result.result || 'لا توجد تفاصيل'}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal(`نتائج ${category}`, resultsHTML);
}

// توليد تقرير الجودة
function generateQualityReport() {
    showAuthNotification('جاري توليد تقرير الجودة...', 'info');
    
    setTimeout(() => {
        const report = generateSystemQualityReport();
        downloadQualityReport(report);
        
        showAuthNotification('تم توليد تقرير الجودة بنجاح', 'success');
    }, 2000);
}

// توليد تقرير جودة النظام
function generateSystemQualityReport() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    
    const testReports = JSON.parse(localStorage.getItem('systemTestReport') || '{}');
    const securityLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    
    const report = {
        metadata: {
            generatedAt: new Date().toISOString(),
            systemVersion: '1.0.0',
            reportType: 'quality_assessment'
        },
        
        statistics: {
            totalUsers: users.length,
            teachers: teachers.length,
            students: students.length,
            lessons: lessons.length,
            tests: tests.length,
            assignments: assignments.length
        },
        
        testResults: {
            lastRun: testReports.summary?.timestamp,
            successRate: testReports.summary?.successRate || 0,
            totalTests: testReports.summary?.totalTests || 0,
            passed: testReports.summary?.passed || 0,
            failed: testReports.summary?.failed || 0
        },
        
        security: {
            totalAccessAttempts: securityLogs.length,
            unauthorizedAttempts: securityLogs.filter(log => 
                log.action === 'unauthorized_access_attempt'
            ).length
        },
        
        recommendations: generateQualityRecommendations(testReports)
    };
    
    return report;
}

// توليد توصيات الجودة
function generateQualityRecommendations(testReports) {
    const recommendations = [];
    
    if (testReports.summary?.successRate < 90) {
        recommendations.push({
            priority: 'high',
            title: 'تحسين معدل نجاح الاختبارات',
            description: 'معدل النجاح الحالي أقل من 90%، يجب إصلاح الاختبارات الفاشلة'
        });
    }
    
    const securityLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    const unauthorizedAttempts = securityLogs.filter(log => 
        log.action === 'unauthorized_access_attempt'
    ).length;
    
    if (unauthorizedAttempts > 0) {
        recommendations.push({
            priority: 'high',
            title: 'تعزيز الأمان',
            description: `تم اكتشاف ${unauthorizedAttempts} محاولة وصول غير مصرح بها`
        });
    }
    
    // التحقق من البيانات الفارغة
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
        recommendations.push({
            priority: 'medium',
            title: 'إضافة بيانات تجريبية',
            description: 'لا توجد بيانات مستخدمين في النظام'
        });
    }
    
    return recommendations;
}

// تنزيل تقرير الجودة
function downloadQualityReport(report) {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `quality_report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// تنظيف البيانات القديمة
function cleanupOldData() {
    if (!confirm('هل أنت متأكد من تنظيف البيانات القديمة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    showAuthNotification('جاري تنظيف البيانات القديمة...', 'info');
    
    // حذف البيانات التي عمرها أكثر من 30 يوم
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    cleanupOldItems('systemTestReport', thirtyDaysAgo);
    cleanupOldItems('securityLogs', thirtyDaysAgo);
    cleanupOldItems('userActivities', thirtyDaysAgo);
    
    setTimeout(() => {
        showAuthNotification('تم تنظيف البيانات القديمة بنجاح', 'success');
    }, 1500);
}

// نسخ احتياطي للنظام
function backupSystem() {
    showAuthNotification('جاري إنشاء نسخة احتياطية...', 'info');
    
    const backup = {
        timestamp: new Date().toISOString(),
        data: {
            users: JSON.parse(localStorage.getItem('users') || '[]'),
            teachers: JSON.parse(localStorage.getItem('teachers') || '[]'),
            students: JSON.parse(localStorage.getItem('students') || '[]'),
            lessons: JSON.parse(localStorage.getItem('lessons') || '[]'),
            tests: JSON.parse(localStorage.getItem('tests') || '[]'),
            assignments: JSON.parse(localStorage.getItem('assignments') || '[]'),
            committeeNotes: JSON.parse(localStorage.getItem('committeeNotes') || '[]'),
            committeeReports: JSON.parse(localStorage.getItem('committeeReports') || '[]')
        }
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAuthNotification('تم إنشاء النسخة الاحتياطية بنجاح', 'success');
}

// إعادة تعيين بيانات الاختبار
function resetTestData() {
    if (!confirm('هل أنت متأكد من إعادة تعيين جميع بيانات الاختبار؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    localStorage.removeItem('systemTestReport');
    localStorage.removeItem('securityLogs');
    localStorage.removeItem('testData');
    
    showAuthNotification('تم إعادة تعيين بيانات الاختبار', 'success');
    loadPreviousResults();
    loadSystemStats();
}

// عرض سجلات النظام
function viewSystemLogs() {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    
    if (logs.length === 0) {
        showModal('سجلات النظام', '<p>لا توجد سجلات نظام حالياً.</p>');
        return;
    }
    
    const logsHTML = `
        <div class="system-logs">
            <h4>سجلات النظام (آخر ${Math.min(logs.length, 20)} سجل)</h4>
            <div class="logs-list">
                ${logs.slice(-20).reverse().map(log => `
                    <div class="log-item">
                        <div class="log-header">
                            <span class="log-action">${log.action}</span>
                            <span class="log-time">${formatDate(log.timestamp)}</span>
                        </div>
                        <div class="log-details">
                            <span>المستخدم: ${log.userId || 'غير معروف'}</span>
                            <span>الدور: ${log.role || 'غير معروف'}</span>
                            <span>الصفحة: ${log.page || 'غير معروفة'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal('سجلات النظام', logsHTML);
}

// عرض لوحة الاختبار
function showTestPanel() {
    const testPanel = document.getElementById('testResultsContainer');
    
    if (testPanel.innerHTML.trim() === '') {
        runSystemTests();
    } else {
        testPanel.innerHTML = '';
    }
}

// دوال مساعدة للتنظيف
function cleanupOldItems(key, cutoffDate) {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const filteredItems = items.filter(item => {
        const itemDate = new Date(item.timestamp || item.createdAt || Date.now());
        return itemDate >= cutoffDate;
    });
    
    localStorage.setItem(key, JSON.stringify(filteredItems));
}

// اختبارات تجريبية
async function testTeacherDataIsolation() {
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    
    if (teachers.length < 2) {
        return 'يحتاج إلى معلمين على الأقل لاختبار العزل';
    }
    
    // محاكاة تسجيل الدخول كمعلم
    const originalUser = getCurrentUser();
    localStorage.setItem('currentUser', JSON.stringify(teachers[0]));
    
    // جلب بيانات المعلم الأول
    const teacher1Students = getTeacherStudents(teachers[0].id);
    const teacher1Tests = getTeacherTests(teachers[0].id);
    
    // محاكاة تسجيل الدخول كمعلم ثاني
    localStorage.setItem('currentUser', JSON.stringify(teachers[1]));
    
    // جلب بيانات المعلم الثاني
    const teacher2Students = getTeacherStudents(teachers[1].id);
    const teacher2Tests = getTeacherTests(teachers[1].id);
    
    // استعادة المستخدم الأصلي
    localStorage.setItem('currentUser', JSON.stringify(originalUser));
    
    // التحقق من عدم وجود تداخل
    const studentOverlap = teacher1Students.some(s1 => 
        teacher2Students.some(s2 => s2.id === s1.id)
    );
    
    const testOverlap = teacher1Tests.some(t1 => 
        teacher2Tests.some(t2 => t2.id === t1.id)
    );
    
    if (studentOverlap || testOverlap) {
        throw new Error('تم اكتشاف تداخل في البيانات بين المعلمين');
    }
    
    return 'عزل بيانات المعلمين يعمل بشكل صحيح';
}

async function testStudentDataIsolation() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    if (students.length === 0) {
        return 'لا توجد بيانات طلاب لاختبار العزل';
    }
    
    // محاكاة تسجيل الدخول كطالب
    const originalUser = getCurrentUser();
    localStorage.setItem('currentUser', JSON.stringify(students[0]));
    
    // جلب بيانات الطالب الأول
    const student1Tests = getStudentTests(students[0].id);
    const student1Lessons = getStudentLessons(students[0].id);
    
    // استعادة المستخدم الأصلي
    localStorage.setItem('currentUser', JSON.stringify(originalUser));
    
    return `الطالب لديه ${student1Tests.length} اختبار و ${student1Lessons.length} درس`;
}

// تصدير الدوال للاستخدام العالمي
window.runSecurityTests = runSecurityTests;
window.runPerformanceTests = runPerformanceTests;
window.runFunctionalityTests = runFunctionalityTests;
window.runDataIsolationTests = runDataIsolationTests;
window.runAllTests = runAllTests;
window.generateQualityReport = generateQualityReport;
window.cleanupOldData = cleanupOldData;
window.backupSystem = backupSystem;
window.resetTestData = resetTestData;
window.viewSystemLogs = viewSystemLogs;
window.loadPreviousResults = loadPreviousResults;
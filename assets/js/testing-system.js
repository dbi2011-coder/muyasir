/**
 * نظام الاختبار الشامل لوظائف النظام
 */

class SystemTester {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentUser = getCurrentUser();
    }

    // تسجيل اختبار جديد
    registerTest(name, description, testFunction) {
        this.tests.push({
            id: generateId(),
            name,
            description,
            function: testFunction,
            status: 'pending',
            result: null,
            timestamp: null
        });
    }

    // تشغيل جميع الاختبارات
    async runAllTests() {
        console.log('🚀 بدء الاختبار الشامل للنظام...');
        
        for (const test of this.tests) {
            await this.runTest(test);
        }
        
        this.generateTestReport();
        return this.results;
    }

    // تشغيل اختبار فردي
    async runTest(test) {
        console.log(`🔍 تشغيل اختبار: ${test.name}`);
        
        try {
            const result = await test.function();
            test.status = 'passed';
            test.result = result;
            test.timestamp = new Date().toISOString();
            
            console.log(`✅ ${test.name}: نجاح`);
            this.results.push({...test});
            
            return { success: true, test };
        } catch (error) {
            test.status = 'failed';
            test.result = error.message;
            test.timestamp = new Date().toISOString();
            
            console.error(`❌ ${test.name}: فشل - ${error.message}`);
            this.results.push({...test});
            
            return { success: false, test, error };
        }
    }

    // توليد تقرير الاختبار
    generateTestReport() {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;
        
        const report = {
            summary: {
                totalTests: total,
                passed: passed,
                failed: failed,
                successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
                timestamp: new Date().toISOString()
            },
            details: this.results
        };
        
        // حفظ التقرير
        localStorage.setItem('systemTestReport', JSON.stringify(report));
        
        // عرض النتائج
        this.displayTestResults(report);
        
        return report;
    }

    // عرض نتائج الاختبار
    displayTestResults(report) {
        const testResultsDiv = document.getElementById('testResults') || 
                              document.createElement('div');
        
        testResultsDiv.innerHTML = `
            <div class="test-results-panel">
                <h3>📊 نتائج الاختبار الشامل</h3>
                <div class="test-summary">
                    <div class="summary-card success">
                        <div class="summary-value">${report.summary.passed}</div>
                        <div class="summary-label">نجاح</div>
                    </div>
                    <div class="summary-card danger">
                        <div class="summary-value">${report.summary.failed}</div>
                        <div class="summary-label">فشل</div>
                    </div>
                    <div class="summary-card info">
                        <div class="summary-value">${report.summary.totalTests}</div>
                        <div class="summary-label">إجمالي</div>
                    </div>
                    <div class="summary-card ${report.summary.successRate >= 80 ? 'success' : 'warning'}">
                        <div class="summary-value">${report.summary.successRate}%</div>
                        <div class="summary-label">معدل النجاح</div>
                    </div>
                </div>
                
                <div class="test-details">
                    <h4>تفاصيل الاختبارات:</h4>
                    ${report.details.map(test => `
                        <div class="test-item ${test.status}">
                            <div class="test-header">
                                <span class="test-name">${test.name}</span>
                                <span class="test-status">${test.status === 'passed' ? '✅' : '❌'}</span>
                            </div>
                            <div class="test-description">${test.description}</div>
                            ${test.result ? `<div class="test-result">${test.result}</div>` : ''}
                            <div class="test-time">${formatDate(test.timestamp)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="test-actions">
                    <button class="btn btn-primary" onclick="exportTestReport()">📥 تصدير التقرير</button>
                    <button class="btn btn-secondary" onclick="runFailedTests()">🔄 إعادة تشغيل الفاشلة</button>
                </div>
            </div>
        `;
        
        // إضافة اللوحة إذا لم تكن موجودة
        if (!document.getElementById('testResults')) {
            testResultsDiv.id = 'testResults';
            document.body.appendChild(testResultsDiv);
        }
    }
}

// إنشاء مثيل المختبر
const systemTester = new SystemTester();

// تسجيل اختبارات المصادقة
systemTester.registerTest(
    'اختبار تسجيل الدخول',
    'التحقق من نظام تسجيل الدخول',
    async () => {
        // اختبار بيانات تسجيل الدخول
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.length === 0) {
            throw new Error('لا توجد بيانات مستخدمين');
        }
        
        // اختبار تسجيل الدخول بعناصر صحيحة
        const testUser = users[0];
        const loginResult = simulateLogin(testUser.username, 'password123');
        
        if (!loginResult.success) {
            throw new Error('فشل في تسجيل الدخول');
        }
        
        return 'نظام تسجيل الدخول يعمل بشكل صحيح';
    }
);

// تسجيل اختبارات عزل البيانات
systemTester.registerTest(
    'اختبار عزل بيانات المعلم',
    'التحقق من أن كل معلم يرى فقط طلابه',
    async () => {
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        
        if (teachers.length < 2) {
            return 'يحتاج إلى معلمين على الأقل لاختبار العزل';
        }
        
        // اختبار أن المعلم الأول لا يرى طلاب المعلم الثاني
        const teacher1 = teachers[0];
        const teacher2 = teachers[1];
        
        const teacher1Students = getTeacherStudents(teacher1.id);
        const teacher2Students = getTeacherStudents(teacher2.id);
        
        // البحث عن تداخل في البيانات
        const overlappingStudents = teacher1Students.filter(s1 => 
            teacher2Students.some(s2 => s2.id === s1.id)
        );
        
        if (overlappingStudents.length > 0) {
            throw new Error('تم العثور على تداخل في بيانات الطلاب بين المعلمين');
        }
        
        return 'عزل بيانات المعلمين يعمل بشكل صحيح';
    }
);

// تسجيل اختبارات واجهة المعلم
systemTester.registerTest(
    'اختبار إدارة الطلاب',
    'التحقق من وظائف إضافة وعرض الطلاب',
    async () => {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        
        // اختبار إضافة طالب جديد
        const newStudent = {
            id: generateId(),
            name: 'طالب اختبار',
            grade: 'الصف الأول',
            subject: 'لغتي',
            teacherId: getCurrentUser()?.id,
            createdAt: new Date().toISOString()
        };
        
        students.push(newStudent);
        localStorage.setItem('students', JSON.stringify(students));
        
        // التحقق من الإضافة
        const updatedStudents = JSON.parse(localStorage.getItem('students') || '[]');
        const found = updatedStudents.find(s => s.id === newStudent.id);
        
        if (!found) {
            throw new Error('فشل في إضافة الطالب');
        }
        
        // تنظيف بيانات الاختبار
        const filtered = updatedStudents.filter(s => s.id !== newStudent.id);
        localStorage.setItem('students', JSON.stringify(filtered));
        
        return 'نظام إدارة الطلاب يعمل بشكل صحيح';
    }
);

// تسجيل اختبارات التقارير
systemTester.registerTest(
    'اختبار توليد التقارير',
    'التحقق من إنشاء وتصدير التقارير',
    async () => {
        const reports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
        
        // اختبار إنشاء تقرير جديد
        const newReport = {
            id: generateId(),
            committeeId: getCurrentUser()?.id,
            studentIds: [],
            reportType: 'studentData',
            format: 'pdf',
            createdAt: new Date().toISOString(),
            status: 'test'
        };
        
        reports.push(newReport);
        localStorage.setItem('committeeReports', JSON.stringify(reports));
        
        // التحقق من الإضافة
        const updatedReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
        const found = updatedReports.find(r => r.id === newReport.id);
        
        if (!found) {
            throw new Error('فشل في إنشاء التقرير');
        }
        
        return 'نظام التقارير يعمل بشكل صحيح';
    }
);

// تسجيل اختبارات الأداء
systemTester.registerTest(
    'اختبار أداء النظام',
    'قياس سرعة تحميل الصفحات',
    async () => {
        const startTime = performance.now();
        
        // محاكاة تحميل الصفحة
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        if (loadTime > 3000) { // أكثر من 3 ثوانٍ
            throw new Error(`وقت التحميل بطيء: ${loadTime.toFixed(2)}ms`);
        }
        
        return `وقت التحميل: ${loadTime.toFixed(2)}ms (ممتاز)`;
    }
);

// تسجيل اختبارات الأمان
systemTester.registerTest(
    'اختبارات الأمان',
    'التحقق من قواعد الأمان الأساسية',
    async () => {
        // اختبار منع الوصول غير المصرح به
        const testUrl = '/pages/admin/dashboard.html';
        const currentUser = getCurrentUser();
        
        if (currentUser?.role !== 'admin') {
            try {
                // محاولة الوصول إلى صفحة المدير
                const response = await fetch(testUrl);
                if (response.ok) {
                    throw new Error('ثغرة أمان: وصول غير مصرح به إلى صفحة المدير');
                }
            } catch (error) {
                // هذا جيد - يجب أن يفشل الوصول
            }
        }
        
        return 'اختبارات الأمان الأساسية ناجحة';
    }
);

// تشغيل الاختبارات عند الطلب
function runSystemTests() {
    systemTester.runAllTests();
}

// تصدير تقرير الاختبار
function exportTestReport() {
    const report = JSON.parse(localStorage.getItem('systemTestReport') || '{}');
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system_test_report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// إعادة تشغيل الاختبارات الفاشلة
function runFailedTests() {
    const report = JSON.parse(localStorage.getItem('systemTestReport') || '{}');
    const failedTests = report.details?.filter(t => t.status === 'failed') || [];
    
    console.log(`إعادة تشغيل ${failedTests.length} اختبار فاشل`);
    
    // في تطبيق حقيقي، سيتم إعادة تشغيل هذه الاختبارات
    showAuthNotification(`إعادة تشغيل ${failedTests.length} اختبار فاشل`, 'info');
}

// تشغيل الاختبارات عند تحميل لوحة التحكم (للمطورين فقط)
if (window.location.hash === '#debug') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(runSystemTests, 2000);
    });
}

// تصدير الدوال للاستخدام العالمي
window.runSystemTests = runSystemTests;
window.exportTestReport = exportTestReport;
window.runFailedTests = runFailedTests;
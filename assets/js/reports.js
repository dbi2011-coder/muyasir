// ============================================
// 1. تحميل قائمة الطلاب في القائمة المنسدلة
// ============================================
async function loadStudentsList() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const { data: students, error } = await window.supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('teacherId', user.id)
            .order('name', { ascending: true });

        if (error) throw error;

        // البحث عن قائمة الطلاب بأكثر من اسم محتمل لتفادي الأخطاء
        const select = document.getElementById('reportStudentSelect') || document.getElementById('studentSelect');
        if (!select) {
            console.error("لم يتم العثور على قائمة الطلاب في HTML");
            return;
        }

        select.innerHTML = '<option value="">-- اختر الطالب --</option>';
        if (students && students.length > 0) {
            students.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        } else {
            select.innerHTML += '<option value="" disabled>لا يوجد طلاب مضافين</option>';
        }
    } catch (e) {
        console.error("Error loading students:", e);
    }
}

// ============================================
// 2. الدالة الرئيسية لتوجيه طلب التقرير
// ============================================
window.initiateReport = async function() {
    // جلب العناصر بأمان لتجنب خطأ null
    const studentEl = document.getElementById('reportStudentSelect') || document.getElementById('studentSelect');
    const typeEl = document.getElementById('reportTypeSelect') || document.getElementById('reportType');
    
    if (!studentEl || !typeEl) {
        alert('خطأ في ملف HTML: لم يتم العثور على قوائم الاختيار. تأكد من وجود القوائم المنسدلة للطالب ونوع التقرير.');
        return;
    }

    const studentId = studentEl.value;
    const type = typeEl.value;
    
    if (!studentId || !type) {
        alert('الرجاء تحديد الطالب ونوع التقرير أولاً.');
        return;
    }

    // البحث عن حاويات التحميل والنتائج
    const loadingArea = document.getElementById('reportLoading') || document.getElementById('loadingArea');
    const resultArea = document.getElementById('reportResultArea') || document.getElementById('resultArea');
    const contentArea = document.getElementById('generatedReportContent') || document.getElementById('reportContent');
    
    if (loadingArea) loadingArea.style.display = 'block';
    if (resultArea) resultArea.style.display = 'none';
    if (contentArea) contentArea.innerHTML = '';

    try {
        if (type === 'diagnostic') await generateDiagnosticReport(studentId);
        else if (type === 'iep') await generateIEPReport(studentId);
        else if (type === 'progress') await generateProgressReport(studentId);
        else if (type === 'comprehensive') await generateComprehensiveReport(studentId);
    } catch (e) {
        console.error("Report Generation Error:", e);
        alert('حدث خطأ أثناء توليد التقرير. تأكد من اتصالك بالإنترنت.');
    } finally {
        if (loadingArea) loadingArea.style.display = 'none';
    }
};

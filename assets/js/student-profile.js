// =========================================================
// دالة البحث الشامل عن الاختبارات (تحل مشكلة عدم الظهور)
// =========================================================
function loadAvailableTests() {
    const select = document.getElementById('assignTestSelect');
    if (!select) {
        console.error("عنصر القائمة المنسدلة assignTestSelect غير موجود في HTML");
        return;
    }

    select.innerHTML = '<option value="">اختر الاختبار...</option>';
    let allFoundTests = [];

    // 1. جلب كل المفاتيح الموجودة في الذاكرة
    const storageKeys = Object.keys(localStorage);
    
    console.log("جاري البحث عن اختبارات في المفاتيح التالية:", storageKeys);

    // 2. فحص كل مفتاح لمعرفة ما إذا كان يحتوي على اختبارات
    storageKeys.forEach(key => {
        try {
            const rawData = localStorage.getItem(key);
            // نتجاوز البيانات الصغيرة جداً أو التي ليست مصفوفات
            if (!rawData || !rawData.startsWith('[') || rawData.length < 10) return;

            const data = JSON.parse(rawData);

            if (Array.isArray(data) && data.length > 0) {
                // فحص العنصر الأول للتأكد أنه يشبه هيكل الاختبار
                const sample = data[0];
                
                // علامات تدل على أن هذا الكائن هو اختبار
                const isTest = (
                    sample.hasOwnProperty('questions') || 
                    sample.hasOwnProperty('items') || 
                    (sample.hasOwnProperty('title') && sample.hasOwnProperty('id')) ||
                    sample.hasOwnProperty('bankName') ||
                    key.toLowerCase().includes('bank') || // الاسم يحتوي على bank
                    key.toLowerCase().includes('test') || // الاسم يحتوي على test
                    key.toLowerCase().includes('exam')    // الاسم يحتوي على exam
                );

                if (isTest) {
                    console.log(`✅ تم العثور على اختبارات محتملة داخل المفتاح: [${key}]`);
                    allFoundTests = [...allFoundTests, ...data];
                }
            }
        } catch (e) {
            // تجاهل الأخطاء في البيانات غير المتوافقة
        }
    });

    // 3. إزالة التكرار (في حال تم العثور على نفس الاختبار في مكانين)
    // نستخدم Map لإزالة العناصر التي لها نفس الـ ID
    const uniqueTestsMap = new Map();
    allFoundTests.forEach(test => {
        if (test.id) uniqueTestsMap.set(test.id, test);
    });
    const uniqueTests = Array.from(uniqueTestsMap.values());

    console.log(`العدد النهائي للاختبارات التي تم العثور عليها: ${uniqueTests.length}`);

    // 4. عرض النتائج في القائمة
    if (uniqueTests.length === 0) {
        const option = document.createElement('option');
        option.text = "⚠️ لم يتم العثور على أي اختبارات في النظام";
        option.disabled = true;
        select.appendChild(option);
        
        // خيار للطوارئ (اختبار وهمي للتجربة إذا فشل كل شيء)
        const debugOption = document.createElement('option');
        debugOption.value = "debug_test_1";
        debugOption.text = "[اختبار تجريبي للطوارئ]";
        select.appendChild(debugOption);
        return;
    }

    uniqueTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        // محاولة استخراج العنوان بأي اسم محتمل
        option.textContent = test.title || test.name || test.bankName || test.subject || `اختبار #${test.id}`;
        select.appendChild(option);
    });
}

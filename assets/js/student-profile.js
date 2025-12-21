// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب وتعبئة الخطة التربوية (نموذج 9) تلقائياً
// =========================================================

function loadIEPTab(studentId) {
    console.log("Loading IEP for student:", studentId);
    
    // 1. جلب البيانات اللازمة من قاعدة البيانات المحلية
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]'); // للحصول على تفاصيل الأسئلة
    const student = students.find(s => s.id == studentId);
    
    // محاكاة أو جلب نتائج الطالب (يجب أن تكون مخزنة باسم diagnosticResults أو مشابه)
    // هنا نفترض وجود مصفوفة نتائج، سنبحث عن أحدث اختبار تشخيصي للطالب
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]; // الأحدث

    // 2. تحليل نقاط القوة والاحتياج
    let strengthPoints = [];
    let needPoints = []; // هذه ستتحول لأهداف قصيرة المدى
    let targetObjectives = []; // الأهداف التفصيلية (التدريسية)

    if (studentResult && studentResult.answers) {
        // جلب الاختبار المرتبط بالنتيجة لمعرفة معرفات الأهداف المربوطة بالأسئلة
        const originalTest = tests.find(t => t.id == studentResult.testId);
        
        if (originalTest) {
            studentResult.answers.forEach(answer => {
                // البحث عن السؤال الأصلي لمعرفة الهدف المرتبط به
                const question = originalTest.questions.find(q => q.id == answer.questionId);
                
                if (question && question.linkedGoalId) {
                    // البحث عن نص الهدف في بنك الأهداف
                    const objective = objectives.find(obj => obj.id == question.linkedGoalId);
                    
                    if (objective) {
                        if (answer.isCorrect) {
                            // إجابة صحيحة => نقطة قوة
                            strengthPoints.push(objective.shortTermGoal);
                        } else {
                            // إجابة خاطئة => نقطة احتياج (هدف للخطة)
                            needPoints.push(objective.shortTermGoal);
                            
                            // إضافة الأهداف التدريسية المرتبطة بهذا الهدف القصير
                            if (objective.instructionalGoals && objective.instructionalGoals.length > 0) {
                                targetObjectives.push({
                                    short: objective.shortTermGoal,
                                    instructional: objective.instructionalGoals
                                });
                            } else {
                                // في حال عدم وجود أهداف تدريسية فرعية، نستخدم الهدف القصير نفسه
                                targetObjectives.push({
                                    short: objective.shortTermGoal,
                                    instructional: [objective.shortTermGoal]
                                });
                            }
                        }
                    }
                }
            });
        }
    }

    // 3. تعبئة "نقاط القوة" و "نقاط الاحتياج" في النموذج
    // نفترض وجود Textarea أو Inputs لهذه الحقول في نموذج 9
    const strengthsField = document.getElementById('iep-strengths');
    const needsField = document.getElementById('iep-needs');

    if (strengthsField) {
        strengthsField.value = strengthPoints.length > 0 
            ? strengthPoints.join('\n- ') 
            : '- لا توجد نقاط قوة مسجلة من الاختبار التشخيصي';
    }

    if (needsField) {
        needsField.value = needPoints.length > 0 
            ? needPoints.join('\n- ') 
            : '- لم يتم تحديد نقاط احتياج بعد';
    }

    // 4. تعبئة جدول الأهداف (قصيرة المدى + التدريسية)
    const goalsTableBody = document.getElementById('iep-goals-body');
    if (goalsTableBody) {
        goalsTableBody.innerHTML = ''; // مسح المحتوى القديم
        
        if (targetObjectives.length > 0) {
            targetObjectives.forEach((objGroup, index) => {
                // لكل هدف تدريسي فرعي سطر، مع دمج خلية الهدف القصير إذا لزم الأمر
                objGroup.instructional.forEach((instrGoal, i) => {
                    const row = document.createElement('tr');
                    
                    // عمود الهدف قصير المدى (يظهر مرة واحدة لكل مجموعة)
                    /* ملاحظة: لتبسيط التعديل، سنكرر الهدف القصير في كل سطر 
                       أو نضعه في input قابل للتعديل */
                    const shortTermCell = `
                        <td>
                            <input type="text" class="form-control" 
                                   value="${objGroup.short}" 
                                   placeholder="الهدف قصير المدى">
                        </td>`;
                    
                    // عمود الهدف التدريسي
                    const instructionalCell = `
                        <td>
                            <input type="text" class="form-control" 
                                   value="${instrGoal}" 
                                   placeholder="الهدف التدريسي">
                        </td>`;
                    
                    // أعمدة التقييم والتاريخ (فارغة للمعلم)
                    const otherCells = `
                        <td><input type="date" class="form-control"></td>
                        <td><input type="text" class="form-control" placeholder="%"></td>
                        <td><input type="text" class="form-control"></td>
                    `;

                    row.innerHTML = shortTermCell + instructionalCell + otherCells;
                    goalsTableBody.appendChild(row);
                });
            });
        } else {
            // سطر فارغ إذا لم توجد بيانات
            goalsTableBody.innerHTML = `
                <tr>
                    <td><input type="text" class="form-control" placeholder="الهدف قصير المدى"></td>
                    <td><input type="text" class="form-control" placeholder="الهدف التدريسي"></td>
                    <td><input type="date" class="form-control"></td>
                    <td><input type="text" class="form-control"></td>
                    <td><input type="text" class="form-control"></td>
                </tr>`;
        }
    }

    // 5. تعبئة جدول الحصص (من جدول المعلم)
    fillScheduleTable(studentId);
}

// دالة مساعدة لملء جدول الحصص
function fillScheduleTable(studentId) {
    const scheduleBody = document.getElementById('iep-schedule-body'); // تأكد من مطابقة هذا الـ ID في الـ HTML
    if (!scheduleBody) return;

    // جلب الجدول الدراسي للمعلم
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    // تصفية الحصص الخاصة بهذا الطالب
    // هيكل البيانات المفترض: { day: 'الأحد', period: 1, studentId: 123, ... }
    
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    let html = '';

    days.forEach(day => {
        html += `<tr><td><strong>${day}</strong></td>`;
        for (let period = 1; period <= 7; period++) { // 7 حصص
            // البحث هل الطالب مسجل في هذا اليوم وهذه الحصة
            const session = teacherSchedule.find(s => 
                s.day === day && 
                s.period == period && 
                s.studentId == studentId
            );

            if (session) {
                // إذا وجد الطالب، نضع اسم المادة أو "حصة فردية"
                html += `<td><input type="text" class="form-control schedule-input filled" value="${session.subject || 'صعوبات'}" readonly></td>`;
            } else {
                // حصة فارغة
                html += `<td><input type="text" class="form-control schedule-input" disabled></td>`;
            }
        }
        html += '</tr>';
    });

    scheduleBody.innerHTML = html;
}

// تشغيل الدالة عند فتح التبويب (يجب ربط هذا الحدث في ملف HTML)
// مثال: <button onclick="loadIEPTab(currentStudentId)">الخطة التربوية</button>

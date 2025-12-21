<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ملف الطالب - ميسر التعلم</title>
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="../../assets/css/teacher.css">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .sidebar-menu li a { cursor: pointer; }
        .content-section { display: none; animation: fadeIn 0.3s ease; }
        .content-section.active { display: block; }
        .sidebar-student-info { padding: 20px; text-align: center; background: rgba(0, 0, 0, 0.1); margin-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .sidebar-student-avatar { width: 60px; height: 60px; margin: 0 auto 10px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; border: 2px solid rgba(255,255,255,0.2); }
        .sidebar-student-name { color: white; font-weight: bold; margin-bottom: 5px; }
        .sidebar-student-grade { color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        /* أنماط نافذة التصحيح */
        .review-question-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fff; }
        .review-q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #f9f9f9; padding: 10px; border-radius: 5px; }
        .student-answer-box { padding: 10px; background: #e3f2fd; border-radius: 5px; margin-bottom: 10px; border-right: 4px solid #2196f3; }
        .teacher-feedback-box textarea { width: 100%; border: 1px solid #ccc; border-radius: 5px; padding: 8px; min-height: 60px; margin-top: 5px; }
        .score-input { width: 70px; text-align: center; font-weight: bold; }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <img src="../../assets/images/logo.png" alt="شعار">
                    <h2>ميسر التعلم</h2>
                </div>
            </div>
            <div class="sidebar-student-info">
                <div class="sidebar-student-avatar" id="sideAvatar">ط</div>
                <div class="sidebar-student-name" id="sideName">جار التحميل...</div>
                <div class="sidebar-student-grade" id="sideGrade">...</div>
            </div>
            <ul class="sidebar-menu">
                <li><a onclick="switchSection('diagnostic')" class="nav-link active" id="link-diagnostic"><span class="menu-icon">📝</span>الاختبار التشخيصي</a></li>
                <li><a onclick="switchSection('iep')" class="nav-link" id="link-iep"><span class="menu-icon">📊</span>الخطة التربوية</a></li>
                <li><a onclick="switchSection('lessons')" class="nav-link" id="link-lessons"><span class="menu-icon">📚</span>الدروس</a></li>
                <li><a onclick="switchSection('assignments')" class="nav-link" id="link-assignments"><span class="menu-icon">📋</span>الواجبات</a></li>
                <li><a onclick="switchSection('progress')" class="nav-link" id="link-progress"><span class="menu-icon">📈</span>تقدم الطالب</a></li>
                <li style="margin-top: 40px;"><a href="students.html"><span class="menu-icon">↩️</span>عودة للقائمة</a></li>
            </ul>
        </aside>
        
        <main class="main-content-dashboard">
            <header class="dashboard-header">
                <button class="mobile-menu-btn" onclick="document.querySelector('.sidebar').classList.toggle('active')">☰</button>
                <div class="user-info">
                    <div class="user-welcome">
                        <div class="welcome-text">ملف الطالب</div>
                        <div class="user-name" id="headerStudentName">...</div>
                    </div>
                </div>
            </header>
            
            <div class="dashboard-content">
                <div id="section-diagnostic" class="content-section active">
                    <div class="content-header"><h1>الاختبار التشخيصي</h1><button class="btn btn-primary" onclick="showAssignTestModal()">+ تعيين اختبار</button></div>
                    <div id="diagnosticContent">
                        <div class="empty-state" id="noDiagnosticTest"><div class="empty-icon">📝</div><h3>لم يتم تعيين اختبار</h3></div>
                        <div id="diagnosticTestDetails" style="display: none;"></div>
                    </div>
                </div>

                <div id="section-iep" class="content-section">
                    <div class="content-header"><h1>الخطة التربوية</h1><button class="btn btn-info" onclick="window.print()">طباعة</button></div>
                    
                    <div class="iep-word-model">
                        <h3 style="text-align: center; margin-bottom: 15px; color: #000;">الخطة التربوية الفردية</h3>
                        
                        <table class="word-table">
                            <tr>
                                <th width="15%">اسم الطالب</th>
                                <td><input type="text" value="نايف"></td>
                                <th width="15%">المادة</th>
                                <td><input type="text" value="لغتي"></td>
                                <th width="10%">الصف</th>
                                <td><input type="text" value="الأول"></td>
                                <th width="15%">المستوى الفعلي</th>
                                <td><input type="text"></td>
                            </tr>
                        </table>

                        <table class="word-table">
                            <thead>
                                <tr>
                                    <th>اليوم</th>
                                    <th>الأحد</th>
                                    <th>الاثنين</th>
                                    <th>الثلاثاء</th>
                                    <th>الأربعاء</th>
                                    <th>الخميس</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>الحصة</strong></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="word-table">
                            <thead>
                                <tr>
                                    <th width="5%">م</th>
                                    <th width="45%">نقاط القوة</th>
                                    <th width="5%">م</th>
                                    <th width="45%">نقاط الاحتياج</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td><textarea rows="2" class="text-right"></textarea></td>
                                    <td>1</td>
                                    <td><textarea rows="2" class="text-right"></textarea></td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td><textarea rows="2" class="text-right"></textarea></td>
                                    <td>2</td>
                                    <td><textarea rows="2" class="text-right"></textarea></td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="long-term-goal-box">
                            <strong>الهدف بعيد المدى:</strong>
                            <textarea rows="2" class="text-right" style="width: 100%; border: none; resize: none;" placeholder="أن يتقن التلميذ مهارات..."></textarea>
                            <div style="margin-top: 10px; text-align: center;">
                                <span>الفترة الزمنية المتوقعة: من <input type="date" style="border: 1px solid #ccc;"></span>
                                <span style="margin-right: 20px;">إلى <input type="date" style="border: 1px solid #ccc;"></span>
                            </div>
                        </div>

                        <table class="word-table">
                            <thead>
                                <tr>
                                    <th width="5%">م</th>
                                    <th width="75%">الأهداف التدريسية</th>
                                    <th width="20%">تاريخ التحقق</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="background-color: #f9f9f9;">
                                    <td><strong>1</strong></td>
                                    <td class="text-right" colspan="2">
                                        <strong>الهدف قصير المدى (1):</strong> 
                                        <input type="text" style="width: 60%; border-bottom: 1px solid #ccc;" placeholder="اكتب الهدف القصير هنا">
                                    </td>
                                </tr>
                                <tr>
                                    <td>1</td>
                                    <td><textarea rows="1" class="text-right" placeholder="الهدف التدريسي.."></textarea></td>
                                    <td><input type="date"></td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td><textarea rows="1" class="text-right" placeholder="الهدف التدريسي.."></textarea></td>
                                    <td><input type="date"></td>
                                </tr>
                                <tr style="background-color: #f9f9f9;">
                                    <td><strong>2</strong></td>
                                    <td class="text-right" colspan="2">
                                        <strong>الهدف قصير المدى (2):</strong> 
                                        <input type="text" style="width: 60%; border-bottom: 1px solid #ccc;" placeholder="اكتب الهدف القصير هنا">
                                    </td>
                                </tr>
                                <tr>
                                    <td>1</td>
                                    <td><textarea rows="1" class="text-right" placeholder="الهدف التدريسي.."></textarea></td>
                                    <td><input type="date"></td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td><textarea rows="1" class="text-right" placeholder="الهدف التدريسي.."></textarea></td>
                                    <td><input type="date"></td>
                                </tr>
                            </tbody>
                        </table>
                        <button class="add-row-btn">+ إضافة هدف قصير مدى جديد</button>
                    </div>
                    <div id="iepContent" style="display:none;"></div>
                </div>

                <div id="section-lessons" class="content-section"><div class="content-header"><h1>الدروس</h1><button class="btn btn-outline-primary" onclick="regenerateLessons()">تحديث</button></div><div class="content-grid" id="studentLessonsGrid"></div></div>
                <div id="section-assignments" class="content-section"><div class="content-header"><h1>الواجبات</h1><button class="btn btn-primary" onclick="showAssignHomeworkModal()">+ واجب</button></div><div class="content-grid" id="studentAssignmentsGrid"></div></div>
                <div id="section-progress" class="content-section"><div class="content-header"><h1>التقدم</h1></div><div class="card"><table class="table"><thead><tr><th>الهدف</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody id="progressTableBody"></tbody></table></div></div>
            </div>
        </main>
    </div>

    <div id="assignTestModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>تعيين اختبار</h3><button class="modal-close" onclick="closeModal('assignTestModal')">×</button></div>
            <div class="modal-body"><select id="testSelect" class="form-control"></select></div>
            <div class="modal-footer"><button class="btn btn-success" onclick="assignTest()">حفظ</button></div>
        </div>
    </div>
    <div id="assignHomeworkModal" class="modal">
        <div class="modal-content"><div class="modal-header"><h3>إسناد واجب</h3><button class="modal-close" onclick="closeModal('assignHomeworkModal')">×</button></div><div class="modal-body"><select id="homeworkLessonSelect" class="form-control mb-2"></select><select id="homeworkSelect" class="form-control mb-2"></select><input type="date" id="homeworkDueDate" class="form-control"></div><div class="modal-footer"><button class="btn btn-success" onclick="assignHomework()">حفظ</button></div></div>
    </div>
    <div id="reviewTestModal" class="modal">
        <div class="modal-content large" style="max-width: 900px;">
            <div class="modal-header">
                <h3>مراجعة إجابات الطالب وتصحيحها</h3>
                <button class="modal-close" onclick="closeModal('reviewTestModal')">×</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="reviewAssignmentId">
                <div id="reviewQuestionsContainer" style="max-height: 60vh; overflow-y: auto; padding: 10px;"></div>
            </div>
            <div class="modal-footer" style="justify-content: space-between;">
                <div>
                    <button class="btn btn-warning" onclick="returnTestForResubmission()">↩️ إعادة الاختبار للطالب للتعديل</button>
                </div>
                <div>
                    <button class="btn btn-secondary" onclick="closeModal('reviewTestModal')">إلغاء</button>
                    <button class="btn btn-success" onclick="saveTestReview()">💾 حفظ التعديلات والملاحظات</button>
                </div>
            </div>
        </div>
    </div>

    <script src="../../assets/js/auth.js"></script>
    <script src="../../assets/js/student-profile.js"></script>
</body>
</html>
// دالة التعبئة التلقائية الذكية (قابلة للتعديل)
function autoFillIEPForm(studentId) {
    console.log("جاري التعبئة التلقائية للطالب:", studentId);

    // 1. جلب البيانات
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    // جمع كل الاختبارات للبحث عن الأسئلة
    let allTests = [];
    Object.keys(localStorage).forEach(k => {
        try {
            let d = JSON.parse(localStorage.getItem(k));
            if(Array.isArray(d)) allTests = [...allTests, ...d];
        } catch(e){}
    });

    // 2. البحث عن آخر اختبار تشخيصي
    const result = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!result) {
        console.log("لا توجد نتائج تشخيصية لهذا الطالب.");
        return; 
    }

    let strengthText = [];
    let needsText = [];
    let goalsList = [];

    // 3. تحليل الإجابات
    const testRef = allTests.find(t => t.id == result.testId);
    if (testRef) {
        const questions = testRef.questions || testRef.items || [];
        result.answers.forEach(ans => {
            const q = questions.find(x => x.id == ans.questionId);
            if (q && q.linkedGoalId) {
                const obj = objectives.find(o => o.id == q.linkedGoalId);
                if (obj) {
                    if (ans.isCorrect) {
                        // نقطة قوة
                        if(!strengthText.includes(obj.shortTermGoal)) strengthText.push(obj.shortTermGoal);
                    } else {
                        // نقطة احتياج
                        if(!needsText.includes(obj.shortTermGoal)) {
                            needsText.push(obj.shortTermGoal);
                            // جلب الأهداف التدريسية
                            const subGoals = (obj.instructionalGoals && obj.instructionalGoals.length > 0) 
                                ? obj.instructionalGoals : [obj.shortTermGoal];
                            goalsList.push({ short: obj.shortTermGoal, sub: subGoals });
                        }
                    }
                }
            }
        });
    }

    // ============================================================
    // 4. تعبئة الحقول (هنا السحر: نستخدم .value لتبقى قابلة للتعديل)
    // ============================================================

    // أ) نقاط القوة
    const sEl = document.getElementById('iep-strengths');
    if (sEl) sEl.value = strengthText.join('\n'); // يضع النص ويسمح لك بتغييره

    // ب) نقاط الاحتياج
    const nEl = document.getElementById('iep-needs');
    if (nEl) nEl.value = needsText.join('\n'); // يضع النص ويسمح لك بتغييره

    // ج) جدول الأهداف (تعبئة Inputs)
    const tableBody = document.getElementById('iep-goals-body');
    if (tableBody) {
        tableBody.innerHTML = ''; // تنظيف الجدول
        
        goalsList.forEach(goal => {
            goal.sub.forEach(subGoal => {
                const row = `
                    <tr>
                        <td><input type="text" class="form-control" value="${goal.short}"></td>
                        
                        <td><input type="text" class="form-control" value="${subGoal}"></td>
                        
                        <td><input type="date" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        });
    }
}

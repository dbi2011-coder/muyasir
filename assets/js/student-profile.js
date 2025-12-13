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
        /* أنماط خاصة لجداول الخطة */
        .iep-page { background: white; padding: 30px; margin-bottom: 20px; border: 1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .iep-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .iep-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .iep-table th, .iep-table td { border: 1px solid #000; padding: 10px; text-align: center; }
        .iep-table th { background-color: #f0f0f0; }
        .shaded-day { background-color: #3498db !important; color: white; }
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
            <ul class="sidebar-menu">
                <li><a href="dashboard.html"><i class="fas fa-chart-line"></i> لوحة التحكم</a></li>
                <li><a href="students.html" class="active"><i class="fas fa-user-graduate"></i> الطلاب</a></li>
                <li><a href="content-library.html"><i class="fas fa-book"></i> مكتبة المحتوى</a></li>
                <li><a href="#" onclick="window.history.back()"><i class="fas fa-arrow-right"></i> عودة</a></li>
            </ul>
        </aside>

        <main class="main-content-dashboard">
            <header class="dashboard-header">
                <div class="user-info">
                    <div class="user-name">ملف الطالب</div>
                </div>
            </header>

            <div class="dashboard-content">
                <div class="content-header">
                    <h1 id="pageStudentName">جاري التحميل...</h1>
                    <div class="header-actions">
                        <button class="btn btn-outline-secondary" onclick="window.location.href='students.html'">عودة للقائمة</button>
                    </div>
                </div>

                <div class="student-tabs">
                    <div class="tabs-header">
                        <button class="tab-btn active" data-tab="diagnostic" onclick="switchTab('diagnostic')">الاختبار التشخيصي</button>
                        <button class="tab-btn" data-tab="iep" onclick="switchTab('iep')">الخطة التربوية الفردية</button>
                        <button class="tab-btn" data-tab="lessons" onclick="switchTab('lessons')">الدروس</button>
                        <button class="tab-btn" data-tab="assignments" onclick="switchTab('assignments')">الواجبات</button>
                        <button class="tab-btn" data-tab="progress" onclick="switchTab('progress')">تقدم الطالب</button>
                    </div>

                    <div class="tabs-content">
                        
                        <div class="tab-pane active" id="diagnostic-tab">
                            <div class="empty-state" id="noDiagnosticTest">
                                <div class="empty-icon">📝</div>
                                <h3>لم يتم تعيين اختبار تشخيصي</h3>
                                <button class="btn btn-primary" onclick="showAssignTestModal()">تعيين اختبار تشخيصي</button>
                            </div>
                            <div id="diagnosticTestDetails" style="display: none;">
                                </div>
                        </div>

                        <div class="tab-pane" id="iep-tab">
                            <div id="iepContent">
                                </div>
                            <div style="margin-top: 20px; text-align: left;">
                                <button class="btn btn-success" onclick="printIEP()"><i class="fas fa-print"></i> طباعة الخطة</button>
                            </div>
                        </div>

                        <div class="tab-pane" id="lessons-tab">
                            <div class="section-header">
                                <h3>الدروس المخصصة (بناءً على الخطة)</h3>
                                <button class="btn btn-sm btn-outline-primary" onclick="regenerateLessons()">تحديث الدروس</button>
                            </div>
                            <div class="content-grid" id="studentLessonsGrid"></div>
                        </div>

                        <div class="tab-pane" id="assignments-tab">
                            <div class="section-header">
                                <h3>الواجبات المسندة</h3>
                                <button class="btn btn-primary" onclick="showAssignHomeworkModal()">+ إسناد واجب</button>
                            </div>
                            <div class="content-grid" id="studentAssignmentsGrid"></div>
                        </div>

                        <div class="tab-pane" id="progress-tab">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>الهدف التدريسي</th>
                                        <th>الاستراتيجية</th>
                                        <th>حالة الدرس</th>
                                        <th>التواريخ والملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody id="progressTableBody"></tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    </div>

    <div id="assignTestModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>تعيين اختبار تشخيصي</h3></div>
            <div class="modal-body">
                <select id="testSelect" class="form-control"></select>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('assignTestModal')">إلغاء</button>
                <button class="btn btn-success" onclick="assignTest()">حفظ</button>
            </div>
        </div>
    </div>

    <div id="assignHomeworkModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>إسناد واجب</h3></div>
            <div class="modal-body">
                <div class="form-group">
                    <label>الدرس</label>
                    <select id="homeworkLessonSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                    <label>الواجب</label>
                    <select id="homeworkSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                    <label>تاريخ التسليم (اختياري)</label>
                    <input type="date" id="homeworkDueDate" class="form-control">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('assignHomeworkModal')">إلغاء</button>
                <button class="btn btn-success" onclick="assignHomework()">إسناد</button>
            </div>
        </div>
    </div>

    <script src="../../assets/js/dashboard.js"></script>
    <script src="../../assets/js/auth.js"></script>
    <script src="../../assets/js/student-profile.js"></script>
</body>
</html>

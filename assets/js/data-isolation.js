/**
 * نظام عزل البيانات بين المستخدمين
 * كل معلم يرى فقط طلابه وبياناته
 * أعضاء اللجنة يرون فقط طلاب المعلمين المتابعين
 */

// التحقق من عزل البيانات عند تسجيل الدخول
function checkDataIsolation() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        redirectToLogin();
        return;
    }

    // التحقق من نوع المستخدم وتطبيق قواعد العزل
    switch(currentUser.role) {
        case 'teacher':
            enforceTeacherDataIsolation(currentUser.id);
            break;
        case 'committee':
            enforceCommitteeDataIsolation(currentUser.id);
            break;
        case 'student':
            enforceStudentDataIsolation(currentUser.id);
            break;
        case 'admin':
            // المدير يرى كل شيء
            break;
        default:
            redirectToLogin();
    }
}

// تطبيق عزل بيانات المعلم
function enforceTeacherDataIsolation(teacherId) {
    // تنظيف التخزين المحلي من بيانات غير تابعة للمعلم
    cleanupNonTeacherData(teacherId);
    
    // التأكد من أن جميع الاستعلامات تستخدم teacherId
    window.getTeacherData = function() {
        return {
            students: getTeacherStudents(teacherId),
            tests: getTeacherTests(teacherId),
            lessons: getTeacherLessons(teacherId),
            assignments: getTeacherAssignments(teacherId)
        };
    };
}

// تطبيق عزل بيانات عضو اللجنة
function enforceCommitteeDataIsolation(committeeId) {
    const assignedTeachers = getAssignedTeachers(committeeId);
    const assignedTeacherIds = assignedTeachers.map(t => t.id);
    
    window.getCommitteeData = function() {
        return {
            teachers: assignedTeachers,
            students: getStudentsByTeacherIds(assignedTeacherIds),
            reports: getCommitteeReports(committeeId),
            notes: getCommitteeNotes(committeeId)
        };
    };
}

// تطبيق عزل بيانات الطالب
function enforceStudentDataIsolation(studentId) {
    const student = getStudentById(studentId);
    
    if (!student) {
        redirectToLogin();
        return;
    }
    
    window.getStudentData = function() {
        return {
            profile: student,
            tests: getStudentTests(studentId),
            lessons: getStudentLessons(studentId),
            assignments: getStudentAssignments(studentId),
            messages: getStudentMessages(studentId)
        };
    };
}

// دعم الدوال المساعدة للعزل
function getTeacherStudents(teacherId) {
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    return allStudents.filter(student => student.teacherId === teacherId);
}

function getTeacherTests(teacherId) {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    return allTests.filter(test => test.teacherId === teacherId);
}

function getTeacherLessons(teacherId) {
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    return allLessons.filter(lesson => lesson.teacherId === teacherId);
}

function getTeacherAssignments(teacherId) {
    const allAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    return allAssignments.filter(assignment => assignment.teacherId === teacherId);
}

function getStudentsByTeacherIds(teacherIds) {
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    return allStudents.filter(student => teacherIds.includes(student.teacherId));
}

function getCommitteeReports(committeeId) {
    const allReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    return allReports.filter(report => report.committeeId === committeeId);
}

function getCommitteeNotes(committeeId) {
    const allNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    return allNotes.filter(note => note.committeeId === committeeId);
}

function getStudentTests(studentId) {
    const allTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    return allTests.filter(test => test.studentId === studentId);
}

function getStudentLessons(studentId) {
    const allLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    return allLessons.filter(lesson => lesson.studentId === studentId);
}

function getStudentAssignments(studentId) {
    const allAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    return allAssignments.filter(assignment => assignment.studentId === studentId);
}

function getStudentMessages(studentId) {
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    return allMessages.filter(msg => msg.studentId === studentId || msg.toStudentId === studentId);
}

// تنظيف البيانات غير التابعة للمستخدم الحالي
function cleanupNonTeacherData(teacherId) {
    const currentUser = getCurrentUser();
    
    if (currentUser.role === 'teacher') {
        // الاحتفاظ فقط ببيانات المعلم الحالي
        const students = getTeacherStudents(teacherId);
        const tests = getTeacherTests(teacherId);
        const lessons = getTeacherLessons(teacherId);
        const assignments = getTeacherAssignments(teacherId);
        
        // تحديث التخزين المحلي
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('tests', JSON.stringify(tests));
        localStorage.setItem('lessons', JSON.stringify(lessons));
        localStorage.setItem('assignments', JSON.stringify(assignments));
    }
}

// إضافة العزل إلى جميع الصفحات
document.addEventListener('DOMContentLoaded', function() {
    // تنفيذ العزل فقط إذا كان المستخدم مسجل الدخول
    if (isUserLoggedIn()) {
        checkDataIsolation();
        
        // تسجيل محاولات الوصول غير المصرح بها
        window.addEventListener('error', function(e) {
            if (e.message.includes('permission') || e.message.includes('access')) {
                logUnauthorizedAccessAttempt();
            }
        });
    }
});

// تسجيل محاولات الوصول غير المصرح بها
function logUnauthorizedAccessAttempt() {
    const currentUser = getCurrentUser();
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    
    logs.push({
        userId: currentUser?.id,
        role: currentUser?.role,
        action: 'unauthorized_access_attempt',
        timestamp: new Date().toISOString(),
        page: window.location.pathname
    });
    
    localStorage.setItem('securityLogs', JSON.stringify(logs));
}

// تصدير الدوال للاستخدام العالمي
window.checkDataIsolation = checkDataIsolation;
window.enforceTeacherDataIsolation = enforceTeacherDataIsolation;
window.enforceCommitteeDataIsolation = enforceCommitteeDataIsolation;
window.enforceStudentDataIsolation = enforceStudentDataIsolation;
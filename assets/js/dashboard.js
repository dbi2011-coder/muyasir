function updateUserInterface(user) {
    if (!user || !user.name) return; // منع الخطأ إذا لم يكن هناك مستخدم

    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    const safeName = user.name;
    
    if (userNameElement) {
        if (user.role === 'teacher') userNameElement.textContent = `أ/ ${safeName}`;
        else if (user.role === 'admin') userNameElement.textContent = 'مدير النظام';
        else userNameElement.textContent = safeName;
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = safeName.charAt(0);
    }
    
    updatePageTitle(user.role);
}

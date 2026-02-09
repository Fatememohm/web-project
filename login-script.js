const API_BASE_URL = 'https://edu-api.havirkesht.ir';
const CLIENT_ID = 'web-client';
const CLIENT_SECRET = 'secret-key';

// وقتی DOM کاملاً لود شد
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Initializing login page');
    
    // ابتدا وضعیت توکن را بررسی کنید
    checkExistingToken();
    
    // سپس صفحه را مقداردهی کنید
    initLoginPage();
    checkApiStatus();
});

// بررسی اگر کاربر قبلاً لاگین کرده باشد
function checkExistingToken() {
    const token = localStorage.getItem('havirkesht_token');
    const tokenExpiry = localStorage.getItem('havirkesht_token_expiry');
    
    if (token && tokenExpiry) {
        const currentTime = new Date().getTime();
        const expiryTime = parseInt(tokenExpiry);
        
        // اگر توکن هنوز معتبر است
        if (currentTime < expiryTime) {
            console.log('Token is still valid, redirecting to dashboard');
            // هدایت به داشبورد
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 100);
            return true;
        } else {
            // توکن منقضی شده، پاکسازی
            console.log('Token expired, clearing data');
            clearUserData();
        }
    }
    return false;
}

// مقداردهی اولیه صفحه
function initLoginPage() {
    console.log('Initializing login page elements');
    
    // نمایش/مخفی کردن رمز عبور
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
        console.log('Password toggle initialized');
    }
    
    // ارسال فرم لاگین
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // ابتدا تمام event listeners قبلی را حذف کنید
        const newLoginForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newLoginForm, loginForm);
        
        // سپس listener جدید اضافه کنید
        newLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            handleLogin(e);
        });
        console.log('Login form handler initialized');
    }
    
    // پشتیبانی
    const supportLink = document.getElementById('supportLink');
    if (supportLink) {
        supportLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Support link clicked');
            showMessage('شماره پشتیبانی: ۰۹۱۲۱۲۳۴۵۶۷', 'info');
        });
    }
    
    // اطلاعات آزمایشی
    const demoInfo = document.getElementById('demoInfo');
    if (demoInfo) {
        demoInfo.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Demo info clicked');
            
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            if (usernameInput && passwordInput) {
                usernameInput.value = 'test_user';
                passwordInput.value = 'test123456';
                showMessage('اطلاعات آزمایشی وارد شدند', 'info');
                passwordInput.focus();
            }
        });
    }
    
    // اگر در محیط توسعه هستیم، اطلاعات تست را پر کنیم
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development environment detected');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput && passwordInput) {
            // فقط اگر کاربر قبلاً چیزی وارد نکرده باشد
            if (!usernameInput.value && !passwordInput.value) {
                usernameInput.value = 'test_user';
                passwordInput.value = 'test123456';
                console.log('Auto-filled test credentials');
            }
        }
    }
    
    console.log('Login page initialization complete');
}

// بررسی وضعیت API
async function checkApiStatus() {
    console.log('Checking API status...');
    
    const statusElement = document.getElementById('apiStatus');
    if (!statusElement) {
        console.warn('API status element not found');
        return;
    }
    
    const statusText = statusElement.querySelector('.status-text');
    const statusDot = statusElement.querySelector('.status-dot');
    
    if (!statusText || !statusDot) {
        console.warn('Status text or dot not found');
        return;
    }
    
    statusText.textContent = 'در حال اتصال...';
    statusElement.className = 'status-indicator';
    
    try {
        console.log('Making API status request to:', API_BASE_URL);
        const response = await fetch(`${API_BASE_URL}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors' // اضافه کردن mode برای CORS
        });
        
        console.log('API status response:', response.status);
        
        if (response.ok) {
            statusText.textContent = 'آنلاین ✓';
            statusElement.classList.add('connected');
            console.log('API is online');
        } else {
            statusText.textContent = `خطا: ${response.status}`;
            statusElement.classList.add('error');
            console.warn('API responded with error:', response.status);
        }
    } catch (error) {
        console.error('Error checking API status:', error);
        statusText.textContent = 'آفلاین';
        statusElement.classList.add('error');
    }
}

// هندل کردن لاگین
async function handleLogin(e) {
    console.log('Starting login process...');
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    
    if (!usernameInput || !passwordInput || !loginBtn) {
        console.error('Required elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('Username:', username);
    
    // اعتبارسنجی اولیه
    if (!username) {
        console.log('Username is empty');
        showMessage('لطفاً نام کاربری را وارد کنید', 'error');
        usernameInput.focus();
        return;
    }
    
    if (!password) {
        console.log('Password is empty');
        showMessage('لطفاً رمز عبور را وارد کنید', 'error');
        passwordInput.focus();
        return;
    }
    
    // ذخیره نام کاربری برای دفعات بعد
    try {
        localStorage.setItem('havirkesht_last_username', username);
    } catch (error) {
        console.warn('Could not save username to localStorage:', error);
    }
    
    // تنظیم حالت لودینگ
    setButtonLoading(loginBtn, true, 'در حال ورود...');
    
    try {
        // درخواست توکن
        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', username);
        formData.append('password', password);
        formData.append('scope', '');
        formData.append('client_id', CLIENT_ID);
        formData.append('client_secret', CLIENT_SECRET);
        
        console.log('Making token request to:', `${API_BASE_URL}/token`);
        
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: formData
        });
        
        console.log('Token response status:', response.status);
        
        // بررسی پاسخ
        if (!response.ok) {
            let errorMessage = 'خطا در ورود به سیستم';
            
            if (response.status === 400) {
                errorMessage = 'درخواست نامعتبر است';
            } else if (response.status === 401) {
                errorMessage = 'نام کاربری یا رمز عبور اشتباه است';
            } else if (response.status === 403) {
                errorMessage = 'دسترسی غیرمجاز';
            } else if (response.status === 422) {
                errorMessage = 'اطلاعات وارد شده معتبر نیست';
            } else if (response.status === 429) {
                errorMessage = 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید';
            } else if (response.status >= 500) {
                errorMessage = 'خطای سرور. لطفاً بعداً تلاش کنید';
            }
            
            console.error('Login failed:', errorMessage);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Token received:', data.access_token ? 'Yes' : 'No');
        
        // بررسی وجود توکن
        if (!data.access_token) {
            throw new Error('توکن احراز هویت دریافت نشد');
        }
        
        // ذخیره اطلاعات کاربر
        saveUserData(username, data);
        
        // نمایش موفقیت
        showMessage(`ورود موفق! در حال انتقال به داشبورد...`, 'success');
        
        console.log('Login successful, redirecting to dashboard...');
        
        // تاخیر کوتاه برای نمایش پیام
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error in login process:', error);
        showMessage(error.message, 'error');
        
        // اگر خطای احراز هویت بود، اطلاعات ذخیره شده را پاک کن
        if (error.message.includes('اشتباه') || error.message.includes('احراز')) {
            clearUserData();
        }
        
    } finally {
        setButtonLoading(loginBtn, false, 'ورود به سیستم');
    }
}

// ذخیره اطلاعات کاربر
function saveUserData(username, tokenData) {
    console.log('Saving user data for:', username);
    
    try {
        localStorage.setItem('havirkesht_token', tokenData.access_token);
        
        if (tokenData.refresh_token) {
            localStorage.setItem('havirkesht_refresh_token', tokenData.refresh_token);
        }
        
        localStorage.setItem('havirkesht_username', username);
        localStorage.setItem('havirkesht_login_time', new Date().toISOString());
        
        // محاسبه زمان انقضای توکن
        const now = new Date();
        const expiresIn = tokenData.expires_in || 3600; // پیش‌فرض 1 ساعت
        const expiryTime = now.getTime() + (expiresIn * 1000);
        localStorage.setItem('havirkesht_token_expiry', expiryTime.toString());
        
        console.log('User data saved successfully');
    } catch (error) {
        console.error('Error saving user data to localStorage:', error);
    }
}

// پاک کردن اطلاعات کاربر
function clearUserData() {
    console.log('Clearing user data from localStorage');
    
    try {
        localStorage.removeItem('havirkesht_token');
        localStorage.removeItem('havirkesht_refresh_token');
        localStorage.removeItem('havirkesht_username');
        localStorage.removeItem('havirkesht_login_time');
        localStorage.removeItem('havirkesht_token_expiry');
        localStorage.removeItem('havirkesht_user_data');
        console.log('User data cleared successfully');
    } catch (error) {
        console.error('Error clearing user data:', error);
    }
}

// نمایش پیام
function showMessage(message, type = 'info') {
    console.log('Showing message:', type, message);
    
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        console.error('Message container not found');
        return;
    }
    
    // مخفی کردن پیام پیش‌فرض
    const defaultMessage = messageContainer.querySelector('.default-message');
    if (defaultMessage) {
        defaultMessage.style.display = 'none';
    }
    
    // حذف پیام‌های قبلی از همان نوع
    const existingMessages = messageContainer.querySelectorAll(`.message.${type}`);
    existingMessages.forEach(msg => msg.remove());
    
    // ایجاد پیام جدید
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    let icon = 'fa-info-circle';
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
    }
    
    messageDiv.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    messageContainer.appendChild(messageDiv);
    
    // پنهان کردن خودکار پیام‌های موقت
    if (type !== 'default-message') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
            
            // نمایش مجدد پیام پیش‌فرض اگر پیامی باقی نمانده
            if (defaultMessage && messageContainer.children.length === 1) {
                defaultMessage.style.display = 'flex';
            }
        }, type === 'success' ? 3000 : 5000);
    }
}

// تنظیم حالت لودینگ برای دکمه
function setButtonLoading(button, isLoading, text = '') {
    if (!button) {
        console.error('Button not found for loading state');
        return;
    }
    
    const btnText = button.querySelector('.btn-text');
    const icon = button.querySelector('.fa-sign-in-alt');
    
    if (isLoading) {
        button.disabled = true;
        if (btnText) {
            btnText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        }
        if (icon) {
            icon.style.display = 'none';
        }
    } else {
        button.disabled = false;
        if (btnText) {
            btnText.textContent = text;
        }
        if (icon) {
            icon.style.display = 'inline-block';
        }
    }
    
    console.log('Button loading state:', isLoading ? 'loading' : 'normal');
}

// پیشگیری از ارسال فرم با کلیک اشتباه
document.addEventListener('click', function(e) {
    if (e.target && e.target.type === 'submit') {
        console.log('Submit button clicked via direct click');
    }
});

// پیشگیری از رفتار پیش‌فرض فرم
document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'loginForm') {
        console.log('Form submit event captured');
    }
});

// افزودن console.log برای دیباگ
console.log('Login script loaded successfully');
// --- CREDENCIALES (Solicitadas por el usuario) ---
const AUTH_DATA = {
    email: "admin@gmail.com",
    pass: "123456"
};

// --- MOTOR DE LOGIN ---
document.getElementById('form-login').onsubmit = (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('login-email').value;
    const passInput = document.getElementById('login-pass').value;

    // Validación local
    if (emailInput === AUTH_DATA.email && passInput === AUTH_DATA.pass) {
        // Guardar sesión en localStorage
        localStorage.setItem('mb_session', JSON.stringify({
            loggedIn: true,
            user: "Admin",
            timestamp: new Date().getTime()
        }));

        showLoginToast("Acceso concedido. Redirigiendo...", "success");

        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } else {
        showLoginToast("Credenciales incorrectas", "error");
    }
};

// --- SISTEMA DE TOASTS PARA LOGIN ---
function showLoginToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const colors = type === 'success' ? 'border-green-500' : 'border-red-500';
    const icon = type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500';

    toast.className = `toast-msg bg-white text-slate-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border-l-4 ${colors} min-w-[280px]`;
    toast.innerHTML = `
        <i class="fas ${icon} text-lg"></i>
        <span class="text-sm font-bold">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.4s';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
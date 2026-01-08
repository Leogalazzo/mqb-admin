// --- VERIFICACIÓN DE SEGURIDAD AL INICIO ---
(function checkAuth() {
    const session = JSON.parse(localStorage.getItem('mb_session'));
    if (!session || !session.loggedIn) {
        window.location.href = "login.html";
    }
})();

// --- ESTADO Y DATOS ---
let boletas = JSON.parse(localStorage.getItem('mb_boletas')) || [];
let historial = JSON.parse(localStorage.getItem('mb_historial')) || [];
let empleados = JSON.parse(localStorage.getItem('mb_empleados')) || [];
let proveedores = JSON.parse(localStorage.getItem('mb_proveedores')) || [];
let currentFilter = 'todos'; 

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('es-AR', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    updateDashboard();
});

// --- SISTEMA DE AVISOS ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border-l-4 border-green-500';
    toast.innerHTML = `<i class="fas fa-check-circle text-green-500"></i> <span class="text-sm font-bold">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function customConfirm({ title, text, okText = 'Confirmar', type = 'blue' }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirm');
        const content = document.getElementById('confirm-content');
        const titleEl = document.getElementById('confirm-title');
        const textEl = document.getElementById('confirm-text');
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');
        const iconEl = document.getElementById('confirm-icon');

        titleEl.innerText = title;
        textEl.innerText = text;
        btnOk.innerText = okText;
        
        if(type === 'red') {
            btnOk.className = "flex-1 py-3 px-4 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition";
            iconEl.innerHTML = '<i class="fas fa-trash-alt text-2xl text-red-600"></i>';
            iconEl.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50";
        } else {
            btnOk.className = "flex-1 py-3 px-4 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition";
            iconEl.innerHTML = '<i class="fas fa-question text-2xl text-blue-600"></i>';
            iconEl.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-50";
        }

        modal.classList.remove('hidden');
        setTimeout(() => content.classList.add('confirm-animate'), 10);

        function close(res) {
            content.classList.remove('confirm-animate');
            setTimeout(() => { modal.classList.add('hidden'); resolve(res); }, 200);
        }
        btnOk.onclick = () => close(true);
        btnCancel.onclick = () => close(false);
    });
}

// Función Cerrar Sesión Definitiva
async function logout() {
    if(await customConfirm({ title: 'Cerrar Sesión', text: '¿Deseas salir del sistema?', okText: 'Salir' })) {
        localStorage.removeItem('mb_session');
        window.location.href = "login.html";
    }
}

// --- NAVEGACIÓN ---
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById('sec-' + sectionId).classList.remove('hidden');
    const titles = { 'dashboard': 'Dashboard', 'boletas': 'Gastos del Mes', 'empleados': 'Personal', 'proveedores': 'Proveedores', 'historial': 'Historial' };
    document.getElementById('section-title').innerText = titles[sectionId];
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-link'));
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.onclick.toString().includes(sectionId));
    if(activeBtn) activeBtn.classList.add('active-link');
    if(sectionId === 'dashboard') updateDashboard();
    if(sectionId === 'boletas') updateBoletasTable();
    if(sectionId === 'empleados') updateEmpleadosTable();
    if(sectionId === 'proveedores') updateProveedoresGrid();
    if(sectionId === 'historial') updateHistorialTable();
}

function openModal(id) { 
    document.getElementById(id).classList.remove('hidden'); 
    if(id === 'modal-boleta') {
        const selectProv = document.getElementById('b-proveedor');
        selectProv.innerHTML = '<option value="">Seleccionar Proveedor...</option><option value="Particular">Particular / Otros</option>';
        proveedores.forEach(p => {
            const opt = document.createElement('option'); opt.value = p.nombre; opt.textContent = p.nombre; selectProv.appendChild(opt);
        });
    }
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// --- GESTIÓN DE EMPLEADOS ---
document.getElementById('form-empleado').onsubmit = (e) => {
    e.preventDefault();
    const index = document.getElementById('emp-index').value;
    const nuevoEmp = { nombre: document.getElementById('emp-nombre').value, puesto: document.getElementById('emp-puesto').value, sueldo: parseFloat(document.getElementById('emp-sueldo').value) };
    if(index === "") { empleados.push(nuevoEmp); } else { empleados[index] = nuevoEmp; }
    saveData('mb_empleados', empleados); closeModal('modal-empleado'); updateEmpleadosTable(); showToast("Personal guardado");
};

function updateEmpleadosTable() {
    const table = document.getElementById('table-empleados');
    table.innerHTML = empleados.map((emp, i) => `
        <tr class="hover:bg-slate-50 transition">
            <td class="p-4 font-bold text-slate-700">${emp.nombre}</td>
            <td class="p-4 text-slate-500">${emp.puesto}</td>
            <td class="p-4 font-bold text-blue-600">$${emp.sueldo.toLocaleString()}</td>
            <td class="p-4 text-right space-x-2">
                <button onclick="cargarSueldoComoGasto(${i})" class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Sueldo</button>
                <button onclick="editEmpleado(${i})" class="text-blue-600"><i class="fas fa-edit"></i></button>
                <button onclick="deleteEmpleado(${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="p-8 text-center text-slate-400 italic text-sm">Sin empleados.</td></tr>';
}

async function cargarSueldoComoGasto(i) {
    const emp = empleados[i];
    if(await customConfirm({ title: 'Cargar Sueldo', text: `¿Cargar el sueldo de ${emp.nombre} como gasto?` })) {
        const hoy = new Date();
        boletas.push({ tipo: 'Sueldos', proveedor: 'Interno', detalle: `Sueldo ${emp.nombre}`, monto: emp.sueldo, vencimiento: hoy.toISOString().split('T')[0], pagado: false, mes: hoy.getMonth() + 1, anio: hoy.getFullYear() });
        saveData('mb_boletas', boletas); showToast("Sueldo cargado");
    }
}

function editEmpleado(i) {
    const emp = empleados[i]; document.getElementById('emp-index').value = i; document.getElementById('emp-nombre').value = emp.nombre; document.getElementById('emp-puesto').value = emp.puesto; document.getElementById('emp-sueldo').value = emp.sueldo; openModal('modal-empleado');
}

async function deleteEmpleado(i) {
    if(await customConfirm({ title: 'Eliminar', text: '¿Borrar empleado?', type: 'red' })) {
        empleados.splice(i, 1); saveData('mb_empleados', empleados); updateEmpleadosTable();
    }
}

// --- GESTIÓN DE PROVEEDORES ---
document.getElementById('form-proveedor').onsubmit = (e) => {
    e.preventDefault();
    proveedores.push({ nombre: document.getElementById('prov-nombre').value, rubro: document.getElementById('prov-rubro').value, tel: document.getElementById('prov-tel').value });
    saveData('mb_proveedores', proveedores); closeModal('modal-proveedor'); updateProveedoresGrid(); showToast("Proveedor guardado");
};

function updateProveedoresGrid() {
    const grid = document.getElementById('grid-proveedores');
    grid.innerHTML = proveedores.map((p, i) => `
        <div class="bg-white p-6 rounded-lg border shadow-sm flex justify-between items-start">
            <div><h4 class="font-bold text-lg leading-tight">${p.nombre}</h4><p class="text-blue-600 text-xs font-bold uppercase mt-1 tracking-wider">${p.rubro}</p><p class="text-slate-500 text-sm mt-3"><i class="fas fa-phone mr-1"></i> ${p.tel || 'S/T'}</p></div>
            <button onclick="deleteProveedor(${i})" class="text-slate-300 hover:text-red-500"><i class="fas fa-times-circle"></i></button>
        </div>
    `).join('') || '<p class="col-span-3 text-center p-8 text-slate-400 italic">Sin proveedores.</p>';
}

async function deleteProveedor(i) {
    if(await customConfirm({ title: 'Eliminar', text: '¿Borrar proveedor?', type: 'red' })) {
        proveedores.splice(i, 1); saveData('mb_proveedores', proveedores); updateProveedoresGrid();
    }
}

// --- GESTIÓN DE BOLETAS ---
function setFilter(filter) {
    currentFilter = filter; document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active-filter')); document.getElementById('filter-' + filter).classList.add('active-filter'); updateBoletasTable();
}

document.getElementById('form-boleta').onsubmit = (e) => {
    e.preventDefault(); const hoy = new Date();
    boletas.push({ tipo: document.getElementById('b-tipo').value, proveedor: document.getElementById('b-proveedor').value, detalle: document.getElementById('b-detalle').value, monto: parseFloat(document.getElementById('b-monto').value), vencimiento: document.getElementById('b-vencimiento').value, pagado: false, mes: hoy.getMonth() + 1, anio: hoy.getFullYear() });
    saveData('mb_boletas', boletas); closeModal('modal-boleta'); updateBoletasTable(); showToast("Gasto registrado");
};

function updateBoletasTable() {
    const hoy = new Date();
    let boletasFiltradas = boletas.filter(b => {
        const diff = Math.ceil((new Date(b.vencimiento) - hoy) / 86400000);
        if (currentFilter === 'pagado') return b.pagado;
        if (currentFilter === 'pendiente') return !b.pagado && diff >= 0;
        if (currentFilter === 'vencido') return !b.pagado && diff < 0;
        return true; 
    });

    document.getElementById('table-boletas').innerHTML = boletasFiltradas.map((b, i) => {
        const originalIndex = boletas.indexOf(b); 
        const diff = Math.ceil((new Date(b.vencimiento) - hoy) / (86400000));
        let badge = b.pagado ? 'bg-green-100 text-green-700' : (diff < 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700');
        let text = b.pagado ? 'PAGADO' : (diff < 0 ? 'VENCIDO' : `Faltan ${diff}d`);
        return `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-bold text-xs text-slate-400 uppercase">${b.tipo}</td>
                <td class="p-4"><span class="font-bold block text-slate-700">${b.proveedor}</span><span class="text-[10px] text-slate-400 italic">${b.detalle}</span></td>
                <td class="p-4 text-slate-500">${b.vencimiento}</td>
                <td class="p-4 font-bold text-slate-800">$${b.monto.toLocaleString()}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-[10px] font-black ${badge}">${text}</span></td>
                <td class="p-4 text-right">
                    ${!b.pagado ? `<button onclick="pagar(${originalIndex})" class="bg-blue-600 text-white px-3 py-1 rounded text-xs shadow hover:bg-blue-700 transition">PAGAR</button>` : '<i class="fas fa-check-circle text-green-500 text-lg"></i>'}
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="6" class="p-12 text-center text-slate-300 italic">Nada por aquí.</td></tr>';
}

async function pagar(i) {
    if (await customConfirm({ title: 'Confirmar Pago', text: `¿Marcas como paga esta boleta de $${boletas[i].monto.toLocaleString()}?` })) {
        boletas[i].pagado = true; saveData('mb_boletas', boletas); updateBoletasTable(); showToast("Pago registrado");
    }
}

// --- DASHBOARD ---
function updateDashboard() {
    const hoy = new Date(); const mesActual = hoy.getMonth() + 1; const anioActual = hoy.getFullYear();
    let stats = { vencidas: 0, porVencer: 0, pagado: 0, pendiente: 0 };
    let categorias = {};
    const boletasMes = boletas.filter(b => b.mes === mesActual && b.anio === anioActual);

    boletasMes.forEach(b => {
        const diff = Math.ceil((new Date(b.vencimiento) - hoy) / 86400000);
        if(b.pagado) stats.pagado += b.monto;
        else {
            stats.pendiente += b.monto;
            if(diff < 0) stats.vencidas++; else if(diff <= 7) stats.porVencer++;
        }
        categorias[b.tipo] = (categorias[b.tipo] || 0) + b.monto;
    });

    document.getElementById('kpi-cards').innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500"><p class="text-slate-500 text-xs font-bold uppercase">Vencidas</p><h3 class="text-3xl font-bold text-red-600 mt-1">${stats.vencidas}</h3></div>
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500"><p class="text-slate-500 text-xs font-bold uppercase">A vencer (7d)</p><h3 class="text-3xl font-bold text-yellow-600 mt-1">${stats.porVencer}</h3></div>
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500"><p class="text-slate-500 text-xs font-bold uppercase">Pagado Mes</p><h3 class="text-3xl font-bold text-green-600 mt-1">$${stats.pagado.toLocaleString()}</h3></div>
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500"><p class="text-slate-500 text-xs font-bold uppercase">Deuda Pendiente</p><h3 class="text-3xl font-bold text-blue-600 mt-1">$${stats.pendiente.toLocaleString()}</h3></div>
    `;

    const total = stats.pagado + stats.pendiente;
    document.getElementById('category-chart').innerHTML = Object.entries(categorias).map(([cat, m]) => `
        <div><div class="flex justify-between text-xs mb-1"><span class="font-bold text-slate-500 uppercase">${cat}</span><span class="font-black">$${m.toLocaleString()}</span></div><div class="w-full bg-slate-50 h-2 rounded-full overflow-hidden border"><div class="bg-blue-600 h-full" style="width: ${Math.min((m/total)*100, 100)}%"></div></div></div>
    `).join('') || '<p class="text-slate-300 italic text-sm">Sin movimientos.</p>';
}

// --- HISTORIAL ---
async function confirmarFinalizarMes() {
    if(await customConfirm({ title: 'Finalizar Mes', text: 'Se archivarán las boletas pagadas y se limpiará el Dashboard.' })) {
        const periodo = new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' });
        const total = boletas.filter(b => b.pagado).reduce((acc, b) => acc + b.monto, 0);
        historial.push({ periodo, cant: boletas.filter(b => b.pagado).length, total, id: Date.now(), fechaCierre: new Date().toISOString() });
        boletas = boletas.filter(b => !b.pagado); saveData('mb_boletas', boletas); saveData('mb_historial', historial); updateDashboard(); showToast("Mes archivado");
    }
}

function updateHistorialTable() {
    const query = document.getElementById('history-search').value.toLowerCase();
    const historialFiltrado = historial.filter(h => h.periodo.toLowerCase().includes(query));
    
    document.getElementById('table-historial').innerHTML = historialFiltrado.map(h => `
        <tr class="hover:bg-slate-50 transition">
            <td class="p-4 font-bold capitalize text-slate-700">${h.periodo}<div class="text-[9px] text-slate-400 font-normal uppercase mt-1">Cierre: ${new Date(h.fechaCierre).toLocaleDateString()}</div></td>
            <td class="p-4 text-slate-500 font-medium">${h.cant} boletas</td>
            <td class="p-4 font-black text-blue-600">$${h.total.toLocaleString()}</td>
            <td class="p-4 text-right"><span class="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-400 tracking-tighter uppercase">Archivado</span></td>
        </tr>
    `).reverse().join('') || '<tr><td colspan="4" class="p-12 text-center text-slate-300 italic">No se encontraron registros.</td></tr>';
}

async function borrarHistorialCompleto() {
    if(await customConfirm({ title: 'Borrar Todo', text: 'Se eliminará todo el historial permanentemente. ¿Estás seguro?', type: 'red', okText: 'Borrar Historial' })) {
        historial = []; saveData('mb_historial', historial); updateHistorialTable(); showToast("Historial eliminado");
    }
}

function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
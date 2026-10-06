
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const API_URL = 'https://jsonplaceholder.typicode.com/posts';

    // Lista de insumos de empaque reales para reemplazar los títulos en latín de la API REST
    const insumosRealesAPI = [
        {
            nombre: 'Caja Archivo Muerto',
            categoria: 'Empaque Especializado',
            descripcion: 'Resistente con tapa armada para resguardo de documentos.',
            unidad: 'pzas'
        },
        {
            nombre: 'Cinta Canela 48mm x 100m',
            categoria: 'Insumos de Sellado',
            descripcion: 'Adhesivo acrílico de alta adherencia para sellado de cajas.',
            unidad: 'rollos'
        },
        {
            nombre: 'Película Playo Manual (Emplaye)',
            categoria: 'Material de Protección',
            descripcion: 'Plástico estirable transparente para paletizado de carga.',
            unidad: 'rollos'
        },
        {
            nombre: 'Esquinero de Cartón Rígido',
            categoria: 'Cartón Corrugado',
            descripcion: 'Protección de bordes e incremento de resistencia al estibado.',
            unidad: 'pzas'
        }
    ];

    //  INICIALIZACIÓN DEL MODAL DE BOOTSTRAP

    const modalElement = document.getElementById('modalDetalleStock');
    const modalDetalle = modalElement ? new bootstrap.Modal(modalElement) : null;

    const modalNombre = document.getElementById('modalNombreProducto');
    const modalSKU = document.getElementById('modalSKU');
    const modalCategoria = document.getElementById('modalCategoria');
    const modalStock = document.getElementById('modalStock');
    const modalUbicacion = document.getElementById('modalUbicacion');
    const modalEstadoBadge = document.getElementById('modalEstadoBadge');

    //  DELEGACIÓN GLOBAL DE EVENTOS (Abre Modal y Elimina Tarjetas)

    document.addEventListener('click', async (e) => {
        //  Abrir Modal de Detalle
        const btnDetalle = e.target.closest('.btn-detalle');
        if (btnDetalle && modalDetalle) {
            const data = btnDetalle.dataset;
            
            if (modalNombre) modalNombre.textContent = data.nombre || 'Sin descripción';
            if (modalSKU) modalSKU.textContent = `SKU: ${data.sku || 'N/A'}`;
            if (modalCategoria) modalCategoria.textContent = data.categoria || 'N/A';
            if (modalStock) modalStock.textContent = `${Number(data.stock || 0).toLocaleString()} ${data.unidad || 'pzas'}`;
            if (modalUbicacion) modalUbicacion.textContent = data.ubicacion || 'N/A';

            if (modalEstadoBadge) {
                modalEstadoBadge.textContent = data.estado || 'Indefinido';
                modalEstadoBadge.className = 'badge fs-6 px-3 py-2 mb-2 ';
                
                if (data.estado === 'Crítico') {
                    modalEstadoBadge.classList.add('bg-danger');
                } else if (data.estado === 'Reorden') {
                    modalEstadoBadge.classList.add('bg-warning', 'text-dark');
                } else {
                    modalEstadoBadge.classList.add('bg-success');
                }
            }

            modalDetalle.show();
        }

        // Manipulación del DOM: Eliminar cualquier tarjeta de la lista y de la API
        const btnEliminar = e.target.closest('.btn-eliminar');
        if (btnEliminar) {
            const idInsumo = btnEliminar.dataset.id;
            const cantidad = parseInt(btnEliminar.dataset.stock || '0', 10);
            const tarjetaPadre = btnEliminar.closest('article');

            if (confirm(`¿Confirmas que deseas eliminar este insumo del inventario?`)) {
                try {
                    // Si el elemento proviene de la API REST, ejecutar petición DELETE
                    if (!String(idInsumo).startsWith('estatica-')) {
                        await fetch(`${API_URL}/${idInsumo}`, {
                            method: 'DELETE'
                        });
                    }

                    // Remoción directa del elemento HTML en el DOM
                    if (tarjetaPadre) {
                        tarjetaPadre.remove();
                    }

                    // Recálculo dinámico de los contadores del Dashboard
                    descontarMetricas(cantidad);

                    alert(`Insumo eliminado exitosamente del inventario.`);
                } catch (error) {
                    console.error('Error al intentar eliminar en la API:', error);
                }
            }
        }
    });

    //  CARGA INICIAL DESDE LA API REST (GET) CON NOMBRES REALES
    async function cargarInsumosAPI() {
        try {
            const respuesta = await fetch(`${API_URL}?_limit=4`);
            if (!respuesta.ok) throw new Error('Error al consultar la API');
            
            const datos = await respuesta.json();
            
            datos.forEach((item, index) => {
                const plantilla = insumosRealesAPI[index] || {
                    nombre: `Micro corrugado #${item.id}`,
                    categoria: 'Empaque Especializado',
                    descripcion: 'Protección liviana y moldeable para envíos.',
                    unidad: 'pzas'
                };

                const insumoSimulado = {
                    id: item.id,
                    sku: `SKU-00${item.id}`,
                    categoria: plantilla.categoria,
                    nombre: plantilla.nombre,
                    descripcion: plantilla.descripcion,
                    cantidad: (index + 1) * 120,
                    unidad: plantilla.unidad,
                    ubicacion: `Pasillo ${item.id}-A`
                };

                renderizarTarjetaDOM(insumoSimulado);
            });
        } catch (error) {
            console.error('Error al conectar con la API REST:', error);
        }
    }

    cargarInsumosAPI();

    // ENVÍO Y CAPTURA A LA API REST (POST) Y AL DOM

    const formulario = document.getElementById('formCapturaInsumo');

    if (formulario) {
        formulario.addEventListener('submit', async (event) => {
            if (!formulario.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                event.preventDefault();

                const nuevoInsumo = {
                    sku: document.getElementById('sku')?.value.toUpperCase() || 'N/A',
                    categoria: document.getElementById('categoria')?.value || 'General',
                    nombre: document.getElementById('descripcion')?.value || 'Insumo sin nombre',
                    descripcion: 'Insumo registrado manualmente vía formulario.',
                    cantidad: parseInt(document.getElementById('cantidad')?.value, 10) || 0,
                    unidad: document.getElementById('unidad')?.value || 'pzas',
                    ubicacion: document.getElementById('ubicacion')?.value || 'Sin asignar'
                };

                try {
                    const respuesta = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(nuevoInsumo)
                    });

                    if (respuesta.ok) {
                        const dataAPI = await respuesta.json();
                        nuevoInsumo.id = dataAPI.id;

                        // Insertar dinámicamente en el DOM
                        renderizarTarjetaDOM(nuevoInsumo);

                        alert(`¡Insumo [${nuevoInsumo.sku}] agregado correctamente al DOM con ID ${nuevoInsumo.id}!`);

                        formulario.reset();
                        formulario.classList.remove('was-validated');
                        return;
                    }
                } catch (err) {
                    alert('Hubo un error al guardar en el servidor.');
                    console.error(err);
                }
            }

            formulario.classList.add('was-validated');
        }, false);
    }
    //FUNCIONES AUXILIARES DE RENDERIZADO Y MÉTRICAS
    function renderizarTarjetaDOM(insumo) {
        let estado = 'Óptimo';
        let badgeClass = 'bg-success';
        if (insumo.cantidad < 50) {
            estado = 'Crítico';
            badgeClass = 'bg-danger';
        } else if (insumo.cantidad <= 300) {
            estado = 'Reorden';
            badgeClass = 'bg-warning text-dark';
        }

        const contenedor = document.getElementById('contenedorTarjetas');
        if (contenedor) {
            const nuevaTarjetaHTML = `
                <article class="h-100">
                    <div class="card h-100 border-0 shadow-sm card-hover">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <span class="badge bg-warning text-dark font-monospace">${insumo.categoria}</span>
                                <button class="btn btn-sm btn-outline-danger btn-eliminar border-0" 
                                        data-id="${insumo.id}" 
                                        data-stock="${insumo.cantidad}" 
                                        title="Eliminar insumo">
                                    <i class="bi bi-trash fs-5"></i>
                                </button>
                            </div>
                            <h5 class="card-title fw-bold">${insumo.nombre}</h5>
                            <p class="card-text text-muted flex-grow-1">${insumo.descripcion || 'Ubicación: ' + insumo.ubicacion}</p>
                            <button class="btn btn-sm btn-outline-dark mb-3 w-100 btn-detalle" 
                                    data-sku="${insumo.sku}" 
                                    data-nombre="${insumo.nombre}" 
                                    data-categoria="${insumo.categoria}" 
                                    data-stock="${insumo.cantidad}" 
                                    data-unidad="${insumo.unidad}" 
                                    data-estado="${estado}" 
                                    data-ubicacion="${insumo.ubicacion}">
                                <i class="bi bi-info-circle me-1"></i>Ver Detalle
                            </button>
                            <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                <small class="text-secondary">SKU: <strong>${insumo.sku}</strong></small>
                                <span class="badge ${badgeClass}">${estado} (${insumo.cantidad.toLocaleString()} ${insumo.unidad})</span>
                            </div>
                        </div>
                    </div>
                </article>
            `;
            contenedor.insertAdjacentHTML('beforeend', nuevaTarjetaHTML);
        }

        sumarMetricas(insumo.cantidad, estado);
    }

    function sumarMetricas(nuevaCantidad, estado) {
        const metricSkus = document.getElementById('metric-skus');
        const metricUnidades = document.getElementById('metric-unidades');
        const metricAlertas = document.getElementById('metric-alertas');

        if (metricSkus && metricUnidades && metricAlertas) {
            let totalSkus = parseInt(metricSkus.textContent.replace(/,/g, ''), 10) || 0;
            let totalUnidades = parseInt(metricUnidades.textContent.replace(/,/g, ''), 10) || 0;
            let totalAlertas = parseInt(metricAlertas.textContent.replace(/,/g, ''), 10) || 0;

            totalSkus += 1;
            totalUnidades += nuevaCantidad;

            if (estado === 'Crítico' || estado === 'Reorden') {
                totalAlertas += 1;
            }

            metricSkus.textContent = totalSkus.toLocaleString();
            metricUnidades.textContent = totalUnidades.toLocaleString();
            metricAlertas.textContent = totalAlertas.toLocaleString();
        }
    }

    function descontarMetricas(cantidadRestada) {
        const metricSkus = document.getElementById('metric-skus');
        const metricUnidades = document.getElementById('metric-unidades');

        if (metricSkus && metricUnidades) {
            let totalSkus = parseInt(metricSkus.textContent.replace(/,/g, ''), 10) || 0;
            let totalUnidades = parseInt(metricUnidades.textContent.replace(/,/g, ''), 10) || 0;

            totalSkus = Math.max(0, totalSkus - 1);
            totalUnidades = Math.max(0, totalUnidades - cantidadRestada);

            metricSkus.textContent = totalSkus.toLocaleString();
            metricUnidades.textContent = totalUnidades.toLocaleString();
        }
    }
});

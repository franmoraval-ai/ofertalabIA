# OfertaLab IA Clientes

Primer prototipo del portal para empresas que desean competir en compras
públicas aunque no tengan experiencia previa en SICOP.

## Alcance del MVP

- Presentación clara de la propuesta de valor.
- Registro local de un perfil comercial básico.
- Oportunidades públicas vigentes exportadas desde la base local de OfertaLab IA.
- Afinidad por actividad comercial, con exclusiones para falsos positivos.
- Ficha resumida con encaje, riesgo, monto y fecha de cierre.
- Selección entre autogestión, oferta asistida y gestión integral.
- Diseño adaptable para teléfono y computadora.

El prototipo guarda el perfil únicamente en el navegador del dispositivo. No
solicita credenciales de SICOP, firma digital ni información de pago.

## Actualizar oportunidades públicas

Desde la raíz del proyecto:

```powershell
.\.venv\Scripts\python.exe tools\export_client_opportunities.py
```

El exportador genera `public/data/opportunities.json` con campos públicos de
SICOP. No incluye perfiles comerciales, documentos, notas internas ni datos
privados.

Cuando `data/portal_sync.json` está configurado en la aplicación de escritorio,
cada actualización exitosa también envía ese mismo paquete público a la base
privada del portal. La ruta `/api/opportunities` se consulta primero; el archivo
estático funciona como respaldo si la sincronización remota no está disponible.

## Desarrollo local

```bash
npm install
npm run dev
npm run build
```

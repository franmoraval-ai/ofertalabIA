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

## Migración de Mesa Legal

La primera pieza de la migración multiusuario ya vive en este proyecto web.

- `app/api/legal-cases`: API autenticada para leer y actualizar casos legales.
- `app/api/legal-staff`: API autenticada para administrar responsables y equipo legal.
- `db/schema.ts`: tablas `legal_cases`, `legal_case_events` y `legal_staff` para seguimiento compartido, historial y catálogo interno.
- `lib/legal-workbench.ts`: lógica reusable para construir la bandeja legal a partir de perfiles, solicitudes e historial.

El objetivo es sacar la colaboración humana del escritorio sin perder la lógica
ya validada. La API acepta token técnico para la sincronización del escritorio y
sesión web interna para el trabajo diario de Legal.

### Variables de entorno nuevas

- `OFERTALAB_LEGAL_TOKEN`: token para lectura y escritura de la bandeja legal.
	Si no se define, la API acepta `OFERTALAB_SYNC_TOKEN` como respaldo.
- `OFERTALAB_LEGAL_ALLOWED_EMAILS`: correos separados por coma con acceso a Mesa Legal.
- `OFERTALAB_LEGAL_ADMIN_EMAILS`: correos con permisos de administrador.
- `SUPABASE_SECRET_KEY`: clave privada de Supabase usada solamente por el servidor para invitar usuarios desde Mesa Legal. Nunca se publica con `NEXT_PUBLIC_`.

### Ruta inicial

- `GET /api/legal-cases`
- `POST /api/legal-cases`
- `GET /api/legal-staff`
- `POST /api/legal-staff`
- `POST /api/legal-session`
- `DELETE /api/legal-session`
- `POST /api/legal-users`: invitación de usuarios, solo para administradores.

### Acceso interno inicial

- `GET /legal/login`
- `GET /legal`

La ruta `/legal` usa sesión interna con cookie `httpOnly` y control por correos permitidos.

### Capacidades actuales de Mesa Legal

- Filtro por responsable.
- Historial cronológico por caso.
- Catálogo interno de equipo legal desde la propia web.
- Invitaciones de usuarios desde Mesa Legal; Supabase envía el correo para activar la cuenta.
- Reasignación masiva de casos usando la misma API central.
- Vista rápida de carga por responsable.

### Para activar la base real

Defina estas variables antes de migrar:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OFERTALAB_LEGAL_ALLOWED_EMAILS`
- `OFERTALAB_LEGAL_ADMIN_EMAILS`

Después ejecute:

```bash
npm run db:generate
npm run db:migrate
```

Si la sincronización del escritorio también va a escribir casos legales, mantenga:

- `OFERTALAB_SYNC_TOKEN`
- o `OFERTALAB_LEGAL_TOKEN`

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

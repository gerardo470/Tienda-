# Límites de los planes gratuitos y qué hacer

Llavecita corre hoy en los planes gratuitos de Supabase (datos) y Vercel (la app).
Cifras revisadas en noviembre de 2026 en las páginas oficiales de precios y términos; pueden cambiar, así que
conviene volver a mirarlas una vez al año: <https://supabase.com/pricing> y <https://vercel.com/pricing>.

## Supabase (plan Free)

| Límite | Cuánto | Qué pasa al llegar | Qué hacer |
| --- | --- | --- | --- |
| Base de datos | 500 MB | El proyecto pasa a solo lectura: se puede ver pero no guardar | Sacar respaldo y pasar a Pro. Para un taller, los datos de texto tardan años en llenar esto |
| Fotos (Storage) | 1 GB | No se pueden subir más fotos | Quitar fotos viejas (editar el gasto y tocar la X de la foto) o pasar a Pro |
| Tráfico de salida | 5 GB al mes | Puede restringirse el servicio hasta el mes siguiente | Muy difícil de alcanzar con un solo taller |
| Inactividad | 1 semana sin uso | El proyecto se **pausa**; los datos no se pierden y se reactiva desde el panel (hasta 90 días después) | Ver "Latido" abajo |
| Copias de seguridad | No incluye | Si algo se borra o se daña, Supabase no puede devolverlo | Ver "Respaldos" abajo |
| Proyectos activos | 2 | No se pueden crear más | — |

Llavecita avisa sola (Ajustes → Respaldo y espacio, y un mensaje al abrir la app) cuando la base de datos o las fotos pasan del **70 %**.

Para ahorrar espacio, cada foto se reduce en el teléfono antes de subirla: máximo 1280 px y menos de 200 KB. A ese tamaño caben unas 5,000 fotos en 1 GB.

### Respaldos

1. **Manual, desde la app** (lo principal): Ajustes → Respaldo y espacio → *Compartir* o *Guardar en el teléfono*. Es un Excel con todas las tablas. Llavecita lo recuerda si pasan más de 30 días. Guárdelo fuera del teléfono (WhatsApp a usted mismo, Drive, correo).
2. **Restaurar**: en la misma pantalla, *Elegir archivo de respaldo*. Solo agrega lo que falte; nunca borra ni duplica.
3. **Automático semanal** (opcional, gratis): `.github/workflows/respaldo.yml` hace una copia completa cifrada cada lunes y la guarda 90 días en GitHub. Hay que activarlo una vez agregando dos secretos (las instrucciones están dentro del archivo). Límite: GitHub apaga las tareas programadas si el repositorio pasa 60 días sin cambios; se reactivan con un clic en la pestaña *Actions*.

Las **fotos no entran** en ningún respaldo; solo los datos.

### Latido (para que no se pause)

`api/latido.js` hace una consulta mínima a Supabase una vez al día, programada en `vercel.json`. Usa las variables que ya están en Vercel.

- Si el taller usa la app todas las semanas, el proyecto nunca se pausa y el latido no hace falta.
- Sirve para vacaciones o temporadas sin uso.
- Depende de Vercel: si la app se muda a otro hosting, hay que programar el latido allá.
- Supabase no prohíbe expresamente estas consultas, pero tampoco las garantiza: la pausa por inactividad es parte del plan gratuito. Si algún día lo restringen, la salida limpia es el plan Pro.
- Si el proyecto llegara a pausarse: panel de Supabase → *Restore project*. Los datos siguen ahí.

## Vercel (plan Hobby)

| Límite | Cuánto | Qué pasa al llegar |
| --- | --- | --- |
| Uso permitido | **Solo personal, no comercial** | Vercel puede pausar la cuenta o el despliegue |
| Tareas programadas | Una vez al día por tarea | Suficiente para el latido |

El punto delicado es el primero: una app que apoya a un negocio cuenta como uso comercial según los términos de Vercel. Opciones:

1. **Mudar la app a Cloudflare Pages (gratis).** Su contrato no restringe el uso comercial en el plan gratuito. Es un cambio de una tarde: el código no cambia, cambia dónde se publica y cómo se programa el latido.
2. **Vercel Pro (de pago; alrededor de US$20 al mes, confirme el precio en su página).** No cambia nada técnico; solo se paga.
3. **Seguir en Hobby.** Funciona, pero con el riesgo de que Vercel pause la app sin aviso. Los datos no se perderían (están en Supabase).

## Cuándo pasar a Supabase Pro (US$25 al mes)

Conviene cuando pase cualquiera de estas: hay empleados usando la app a diario, la base de datos o las fotos pasan del 70 %, o un día sin la app ya es un problema para el taller.

Qué cambia:

- Copias de seguridad automáticas diarias, guardadas 7 días.
- El proyecto nunca se pausa (el latido deja de hacer falta).
- Bastante más espacio para la base de datos y para las fotos (las cifras exactas están en la página de precios).

Cómo hacerlo (5 minutos, sin tocar código ni datos):

1. Panel de Supabase → nombre de la organización → **Billing** → **Upgrade to Pro**.
2. Poner la tarjeta y confirmar.
3. Activar el **Spend Cap** (tope de gasto) para que nunca cobre de más.
4. En `src/modules/ajustes/respaldo.ts` cambiar `LIMITE_BD` y `LIMITE_ARCHIVOS` a los nuevos límites, para que las barras de espacio sigan siendo correctas.

La app, las claves y la dirección siguen siendo las mismas.

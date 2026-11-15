// "Latido": una consulta ligera a Supabase para que el proyecto gratuito
// no se pause por inactividad (Supabase pausa tras 1 semana sin uso).
// Vercel la ejecuta sola una vez al día (ver "crons" en vercel.json).
// Usa las mismas variables que ya están configuradas en Vercel; no guarda claves aquí.
export default async function handler(_req, res) {
  const url = process.env.VITE_SUPABASE_URL;
  const clave = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !clave) {
    res.status(500).json({ ok: false, motivo: 'Faltan las variables de Supabase en Vercel' });
    return;
  }
  try {
    const r = await fetch(`${url}/rest/v1/tipos_servicio?select=id&limit=1`, {
      headers: { apikey: clave, Authorization: `Bearer ${clave}` },
    });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, estado: r.status, fecha: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ ok: false, motivo: String(e) });
  }
}

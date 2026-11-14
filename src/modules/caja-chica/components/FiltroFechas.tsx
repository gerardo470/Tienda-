interface Props {
  desde: string;
  hasta: string;
  alCambiar: (rango: { desde: string; hasta: string }) => void;
}

/** Filtro por fechas (desde / hasta). */
export function FiltroFechas({ desde, hasta, alCambiar }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="etiqueta" htmlFor="filtro-desde">
          Desde
        </label>
        <input id="filtro-desde" type="date" className="campo px-3 py-2.5 text-[15px]" value={desde} max={hasta || undefined} onChange={(e) => alCambiar({ desde: e.target.value, hasta })} />
      </div>
      <div>
        <label className="etiqueta" htmlFor="filtro-hasta">
          Hasta
        </label>
        <input id="filtro-hasta" type="date" className="campo px-3 py-2.5 text-[15px]" value={hasta} min={desde || undefined} onChange={(e) => alCambiar({ desde, hasta: e.target.value })} />
      </div>
    </div>
  );
}

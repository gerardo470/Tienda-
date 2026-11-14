// La voz de Llavecita: frases cortas, cálidas, en español salvadoreño suave.
const elegir = (lista: string[]) => lista[Math.floor(Math.random() * lista.length)];

export const frases = {
  saludo: () => elegir(['¡Buenas, jefe! Aquí ando lista.', '¡Qué ondas, jefe! A darle.', '¡Buenas! La caja le está esperando.']),
  cajaAbierta: () => elegir(['¡Caja abierta, jefe! A trabajar.', '¡Listo! Ya abrimos caja.']),
  gastoGuardado: () => elegir(['¡Listo, jefe! Gasto guardado.', 'Anotado, jefe.', '¡Va pues! Ya quedó el gasto.']),
  gastoGrande: () => elegir(['¡Púchica! Ese gasto está grandecito.', '¡Ay, jefe! Ese sí pesó.']),
  abonoGuardado: () => elegir(['¡Eso! Entró pisto a la caja.', '¡Qué alegre! Abono guardado.', '¡Buenísimo, jefe! Ya lo anoté.']),
  saldoBajo: () => elegir(['Ojo, que el saldo anda bajito.', 'Jefe, la caja ya casi no tiene.']),
  saldoNegativo: () => 'Ojo, jefe: gastamos más de lo que hay.',
  editado: () => elegir(['¡Cambio guardado, jefe!', 'Ya quedó corregido.']),
  eliminado: () => elegir(['Ya lo quité, jefe.', 'Borrado. Quedó en la bitácora.']),
  cierreCuadrado: () => elegir(['¡Cabal, jefe! La caja cuadró.', '¡Ni un centavo de más ni de menos!']),
  cierreConDiferencia: () => 'Caja cerrada. Quedó anotada la diferencia.',
  exportado: () => elegir(['¡Ahí le va el reporte!', 'Reporte listo, jefe.']),
  error: () => elegir(['Uy, algo falló. Probemos otra vez.', 'No se pudo, jefe. Revise el internet.']),
  sinConexion: () => 'Estamos sin internet, jefe.',
  adios: () => '¡Nos vemos, jefe!',
};

/**
 * Store de Redux del módulo de seguridad.
 * Si el proyecto que integra el módulo ya tiene su propio store, en vez de usar
 * este archivo, agregar el reducer al configureStore existente:
 *   import autenticacionReducer from "./seguridad/autenticacionSlice";
 *   reducer: { ...tusReducers, autenticacion: autenticacionReducer }
 */

import { configureStore } from "@reduxjs/toolkit";
import autenticacionReducer from "./autenticacionSlice";

export const almacen = configureStore({
  reducer: {
    autenticacion: autenticacionReducer,
  },
});

export type EstadoRaiz = ReturnType<typeof almacen.getState>;
export type DespachoApp = typeof almacen.dispatch;

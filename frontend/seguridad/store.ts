/**
 * Store de Redux para el módulo de seguridad.
 * Importar desde la raíz de la app y configurar el provider.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

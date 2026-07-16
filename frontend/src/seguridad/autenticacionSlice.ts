/**
 * Módulo de seguridad de usuarios — Estado de autenticación (Redux Toolkit)
 * El refresh token NO vive acá: se maneja directo en localStorage (ver api.ts).
 * El access token vive solo en memoria, nunca se persiste.
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UsuarioAutenticado {
  id: string;
  email: string;
  nombre_completo: string | null;
  email_verificado: boolean;
  roles: string[];
}

interface EstadoAutenticacion {
  usuario: UsuarioAutenticado | null;
  accessToken: string | null;
  estaAutenticado: boolean;
  cargando: boolean;
  error: string | null;
}

const estadoInicial: EstadoAutenticacion = {
  usuario: null,
  accessToken: null,
  estaAutenticado: false,
  cargando: true,
  error: null,
};

const autenticacionSlice = createSlice({
  name: "autenticacion",
  initialState: estadoInicial,
  reducers: {
    credencialesEstablecidas: (
      state,
      action: PayloadAction<{ usuario: UsuarioAutenticado; accessToken: string }>
    ) => {
      state.usuario = action.payload.usuario;
      state.accessToken = action.payload.accessToken;
      state.estaAutenticado = true;
      state.cargando = false;
      state.error = null;
    },
    accessTokenActualizado: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    sesionCerrada: (state) => {
      state.usuario = null;
      state.accessToken = null;
      state.estaAutenticado = false;
      state.cargando = false;
      state.error = null;
    },
    cargandoCambiado: (state, action: PayloadAction<boolean>) => {
      state.cargando = action.payload;
    },
    errorEstablecido: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.cargando = false;
    },
  },
});

export const {
  credencialesEstablecidas,
  accessTokenActualizado,
  sesionCerrada,
  cargandoCambiado,
  errorEstablecido,
} = autenticacionSlice.actions;

export default autenticacionSlice.reducer;

/**
 * Estado de autenticación con Redux Toolkit.
 * Maneja login, logout, registro y el estado del usuario actual.
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  apiRequest,
  guardarTokens,
  limpiarTokens,
  cargarTokens,
} from "./api";

interface Usuario {
  id: string;
  email: string;
  nombre_completo: string | null;
  email_verificado: boolean;
  roles: string[];
}

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  error: string | null;
}

const initialState: AuthState = {
  usuario: null,
  cargando: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      return rejectWithValue(data.detail);
    }

    const tokens = await res.json();
    guardarTokens(tokens);
    return tokens;
  }
);

export const cargarPerfil = createAsyncThunk(
  "auth/cargarPerfil",
  async (_, { rejectWithValue }) => {
    const tokenLocal = cargarTokens();
    if (!tokenLocal) return rejectWithValue("No hay sesión");

    const res = await apiRequest("/auth/perfil");
    if (!res.ok) {
      limpiarTokens();
      return rejectWithValue("Sesión expirada");
    }
    return res.json();
  }
);

export const registrar = createAsyncThunk(
  "auth/registrar",
  async (
    {
      email,
      password,
      nombre,
    }: { email: string; password: string; nombre?: string },
    { rejectWithValue }
  ) => {
    const res = await apiRequest("/auth/registro", {
      method: "POST",
      body: JSON.stringify({ email, password, nombre }),
    });

    if (!res.ok) {
      const data = await res.json();
      return rejectWithValue(data.detail);
    }
    return res.json();
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.usuario = null;
      state.error = null;
      limpiarTokens();
    },
    limpiarError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.cargando = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state) => {
        state.cargando = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.cargando = false;
        state.error = action.payload as string;
      })
      // Cargar perfil
      .addCase(cargarPerfil.fulfilled, (state, action) => {
        state.usuario = action.payload;
      })
      .addCase(cargarPerfil.rejected, (state) => {
        state.usuario = null;
      })
      // Registro
      .addCase(registrar.pending, (state) => {
        state.cargando = true;
        state.error = null;
      })
      .addCase(registrar.fulfilled, (state) => {
        state.cargando = false;
      })
      .addCase(registrar.rejected, (state, action) => {
        state.cargando = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, limpiarError } = authSlice.actions;
export default authSlice.reducer;

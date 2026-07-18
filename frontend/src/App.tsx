import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useRestaurarSesion, useAuth } from "./seguridad/useAuth";
import { RutaProtegida } from "./seguridad/RutaProtegida";
import { Layout } from "./componentes/Layout";
import { PaginaLogin } from "./paginas/PaginaLogin";
import { PaginaRegistro } from "./paginas/PaginaRegistro";
import { PaginaPerfil } from "./paginas/PaginaPerfil";
import { PaginaVerificarEmail } from "./paginas/PaginaVerificarEmail";
import { PaginaSolicitarRecuperacion } from "./paginas/PaginaSolicitarRecuperacion";
import { PaginaRestablecerPassword } from "./paginas/PaginaRestablecerPassword";
import { PaginaAdmin } from "./paginas/PaginaAdmin";

function RutaRaiz() {
  const { estaAutenticado, cargando } = useAuth();
  if (cargando) return null;
  return <Navigate to={estaAutenticado ? "/perfil" : "/login"} replace />;
}

function App() {
  useRestaurarSesion();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<RutaRaiz />} />
          <Route path="/login" element={<PaginaLogin />} />
          <Route path="/registro" element={<PaginaRegistro />} />
          <Route path="/verificar-email" element={<PaginaVerificarEmail />} />
          <Route path="/solicitar-recuperacion" element={<PaginaSolicitarRecuperacion />} />
          <Route path="/restablecer-password" element={<PaginaRestablecerPassword />} />
          <Route
            path="/perfil"
            element={
              <RutaProtegida>
                <PaginaPerfil />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin"
            element={
              <RutaProtegida>
                <PaginaAdmin />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

# Informe de Mejoras de Accesibilidad (WCAG 2.1/2.2 AA)

Este documento detalla las correcciones implementadas para resolver problemas de accesibilidad detectados en la auditoría, enfocándose en nombres accesibles, contraste, semántica y estructura.

## 1. Nombres y Etiquetas (Names and Labels)

**Problema:** Los botones y enlaces que solo contienen iconos no tenían nombres accesibles, lo que los hacía inutilizables para usuarios de lectores de pantalla.

### Soluciones Implementadas:

#### Botones de Solo Icono (`frontend/src/pages/Competitions.jsx`)
Se añadió texto descriptivo oculto visualmente pero disponible para tecnologías de asistencia usando la clase `sr-only`.

```jsx
// Antes
<Button variant="ghost" size="icon">
  {isOpen ? <ChevronUp /> : <ChevronDown />}
</Button>

// Después
<Button variant="ghost" size="icon">
  {isOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
  <span className="sr-only">
    {isOpen ? t('common.collapse') : t('common.expand')}
  </span>
</Button>
```

#### Enlaces de Redes Sociales (`frontend/src/components/layout/Footer.jsx`)
Se añadieron atributos `aria-label` a los enlaces que contienen iconos SVG de redes sociales.

```jsx
// Antes
<a href="#">
  <svg ... />
</a>

// Después
<a href="#" aria-label="Twitter">
  <svg ... aria-hidden="true" />
</a>
```

#### Enlaces Externos (`frontend/src/pages/Home.jsx`)
Se añadió una advertencia para usuarios de lectores de pantalla sobre enlaces que abren nuevas pestañas.

```jsx
// Antes
<a href="..." target="_blank">Link</a>

// Después
<a href="..." target="_blank">
  Link <span className="sr-only">(opens in a new tab)</span>
</a>
```

#### Botones de Navegación y Menú (`frontend/src/components/layout/Navbar.jsx`)
Se añadieron etiquetas accesibles a los botones de menú móvil, selector de idioma y menú de usuario.

```jsx
// Antes
<Button><Menu /></Button>

// Después
<Button>
  <Menu aria-hidden="true" />
  <span className="sr-only">Menu</span>
</Button>
```

#### Botón de Cierre en Toasts (`frontend/src/components/ui/toast.jsx`)
Se añadió texto oculto al botón de cerrar notificaciones.

```jsx
// Antes
<ToastClose><X /></ToastClose>

// Después
<ToastClose>
  <X aria-hidden="true" />
  <span className="sr-only">Close</span>
</ToastClose>
```

## 2. Contraste (Contrast)

**Problema:** La relación de contraste entre el texto y el fondo era insuficiente en algunos componentes (ej. texto azul sobre fondo azul claro), dificultando la lectura para usuarios con baja visión.

### Soluciones Implementadas:

#### Pasos de "Cómo Funciona" (`frontend/src/pages/Home.jsx`)
Se oscurecieron los colores del texto para cumplir con el ratio mínimo de 4.5:1 (AA).

```javascript
// Antes (Ratio bajo)
color: "bg-blue-100 text-blue-600"

// Después (Ratio suficiente)
color: "bg-blue-100 text-blue-700"
```
*Se aplicó el mismo ajuste a las variantes Indigo, Purple y Amber.*

## 3. Estructura Semántica y Listas

**Problema:** Uso incorrecto de etiquetas HTML, como listas (`li`) fuera de contenedores de lista (`ul`) y jerarquía de encabezados rota.

### Soluciones Implementadas:

#### Listas en el Pie de Página (`frontend/src/components/layout/Footer.jsx`)
Se reemplazaron los contenedores `div` por `ul` para agrupar correctamente los elementos de lista.

```jsx
// Antes
<div className="text-sm ...">
  <li><a href="#">Link</a></li>
</div>

// Después
<ul className="text-sm ... list-none">
  <li><a href="#">Link</a></li>
</ul>
```

#### Jerarquía de Encabezados (`frontend/src/pages/Login.jsx`, `Register.jsx`)
Se aseguró que las páginas principales tengan un título de nivel 1 (`h1`).

```jsx
// Antes
<CardTitle className="text-3xl">Título</CardTitle> // Renderizaba h3

// Después
<CardTitle as="h1" className="text-3xl">Título</CardTitle> // Renderiza h1
```

#### Corrección de Encabezados Falsos (`frontend/src/pages/Home.jsx`)
Se cambiaron elementos que parecían encabezados (`h3`) pero eran datos estadísticos a `div` con estilos.

```jsx
// Antes
<h3>50+</h3>

// Después
<div className="text-4xl font-bold...">50+</div>
```

## 4. Elementos Decorativos

**Problema:** Iconos decorativos eran anunciados por lectores de pantalla, generando ruido.

### Solución:
Se añadió `aria-hidden="true"` a todos los iconos SVG decorativos en `Home.jsx`, `Competitions.jsx` y `Footer.jsx`.

```jsx
<Calendar className="h-4 w-4" aria-hidden="true" />
```

## 5. Actualización (Diciembre 2025) - Botones y Contraste

Se han abordado problemas específicos reportados sobre botones sin etiquetas y contraste insuficiente en enlaces.

### Botones sin Nombre Accesible
Se identificaron botones que solo contenían iconos y carecían de etiquetas para lectores de pantalla.

*   **Sidebar Toggle (`Sidebar.jsx`)**: Se añadió `aria-label` dinámico ("Expand sidebar" / "Collapse sidebar").
*   **Botón de Notificaciones (`NotificationsBell.jsx`)**: Se añadió un elemento `<span className="sr-only">` con el texto "Notifications".

### Mejoras de Contraste
Se detectaron enlaces con color `text-blue-600` que no cumplían con el ratio de contraste AA sobre fondo blanco.

*   **Archivos afectados**: `Home.jsx`, `MyTeam.jsx`, `CompetitionDetail.jsx`.
*   **Corrección**: Se cambió la clase de color a `text-blue-700` (modo claro) y `dark:text-blue-400` (modo oscuro) para garantizar una legibilidad óptima.

```jsx
// Antes
className="text-blue-600 hover:underline"

// Después
className="text-blue-700 hover:underline dark:text-blue-400"
```

## 6. Actualización (Diciembre 2025) - Revisión Integral de Contraste y Etiquetas

Se realizó una segunda pasada exhaustiva para corregir problemas de contraste y etiquetas faltantes en toda la aplicación.

### Mejoras de Contraste (Texto Azul y Gris)
Se reemplazaron instancias de `text-blue-600` por `text-blue-700` y `text-slate-500` por `text-slate-600` en contextos donde el contraste era insuficiente.

*   **Componentes UI**: `Card` (descripciones), `Button` (variante link).
*   **Páginas**: `Contact`, `Competitions`, `Navbar`, `TeamChat`, `TeamCompetitionDashboard`.
*   **Acción**: Se estandarizó el uso de `text-blue-700` para enlaces y textos importantes en modo claro, manteniendo `dark:text-blue-400` para modo oscuro.

### Etiquetas Accesibles en Botones de Icono
Se añadieron etiquetas `sr-only` o `aria-label` a botones que solo contenían iconos en múltiples componentes.

*   **TeamChat**: Botones de adjuntar archivo y enviar mensaje.
*   **Posts**: Botones de fijar (Pin), opciones (MoreVertical), compartir (Share) y comentarios.
*   **Profile**: Botón de enlace externo a equipo.
*   **TeamCompetitionDashboard**: Botón de refrescar datos.

```jsx
// Ejemplo en TeamChat
<Button>
  <Send aria-hidden="true" />
  <span className="sr-only">{t('common.send')}</span>
</Button>
```

### Correcciones Visuales Específicas (Teams Page)
Se solucionó un problema crítico de visibilidad en la página de Equipos donde el badge de "Miembros" era invisible en modo oscuro (texto blanco sobre fondo blanco).

*   **Teams.jsx**:
    *   Se modificó el badge para tener fondo oscuro en modo oscuro: `bg-slate-50 dark:bg-slate-800`.
    *   Se eliminaron clases de color explícitas (`text-blue-900`) en títulos de tarjetas para permitir que los estilos por defecto del componente (compatibles con modo oscuro) funcionen correctamente.
    *   Se añadieron variantes de modo oscuro (`dark:text-slate-400`, `dark:text-blue-100`) a textos descriptivos y encabezados.
    *   Se añadieron `aria-label` a los inputs de búsqueda y selectores de filtro.

## 7. Actualización (Diciembre 2025) - Formularios, Feedback y Navegación

Se añadieron mejoras para que la UI comunique estados y errores de forma fiable a lectores de pantalla y mejore la navegación por teclado.

### Skip Link + Foco al Contenido

*   **AppLayout (`frontend/src/components/layout/AppLayout.jsx`)**: se añadió un “skip link” y un `<main id="main-content" tabIndex={-1}>` para permitir saltar al contenido principal y mover el foco correctamente.

### Landmarks y Navegación

*   **Navbar/Sidebar (`frontend/src/components/layout/Navbar.jsx`, `frontend/src/components/layout/Sidebar.jsx`)**: se añadieron `aria-label` en `<nav>` para identificar la navegación principal.

### Mensajes y Estados (aria-live)

*   **Login/Register/Forgot/Reset/Profile** (`frontend/src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Profile.jsx`):
  *   Errores: `role="alert"` + `aria-live="assertive"`.
  *   Éxito/información: `role="status"` + `aria-live="polite"`.

### Validación de Campos (aria-invalid / aria-describedby)

*   **Formularios**: inputs con error usan `aria-invalid` y enlazan el texto de ayuda/error con `aria-describedby`.
*   **Confirmación de contraseña** (`Register.jsx`, `ResetPassword.jsx`): se anunció el mismatch con `<p role="alert">` y se enlazó al input.

### Botones de “Mostrar/Ocultar” Contraseña

*   **Login/Register**: botones de icono para mostrar/ocultar contraseña ahora tienen nombre accesible (`aria-label`) y estado (`aria-pressed`) usando claves i18n.

### Autocomplete

*   Se añadieron valores de `autoComplete` adecuados (por ejemplo `email`, `current-password`, `new-password`, `given-name`, `family-name`, `tel`, `one-time-code`) en los formularios de autenticación y perfil.

### Traducciones (i18n)

*   **i18n (`frontend/src/lib/i18n.js`)**: se añadieron claves nuevas necesarias para accesibilidad (texto de botones icon-only, LDAP, send/sending, labels de formularios), en `es/en/de`.

### Correcciones JSX en SVG (Feedback)

*   **Feedback (`frontend/src/pages/Feedback.jsx`)**: se corrigieron atributos JSX (`className`, `fillRule`, `clipRule`) para evitar problemas de render/árbol accesible.

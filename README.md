# PLANIFY para Android

Aplicación móvil en React Native + Expo con autenticación por correo/contraseña y tareas guardadas en Supabase. Interfaz en español, tema negro y morado.

## Requisitos

- Node.js LTS
- npm
- Android Studio (emulador) o un móvil Android
- Cuenta gratuita de Supabase

## 1. Instalar dependencias

```bash
npm install
```

## 2. Crear el backend

1. Crea un proyecto en https://supabase.com/.
2. Abre **SQL Editor** en el panel del proyecto.
3. Copia y ejecuta el contenido de `supabase/schema.sql`.
4. En **Authentication > Providers > Email**, deja activado el proveedor Email.
5. Para pruebas, puedes desactivar temporalmente la confirmación de correo en Authentication > Sign In / Providers. Para una app pública, es mejor mantenerla activada y configurar el correo de confirmación.

## 3. Configurar las claves

Copia `.env.example` como `.env` y rellena los valores desde **Project Settings > API** de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_ANON
```

Usa únicamente la clave pública/anon en la app. **Nunca pongas la `service_role` key en una aplicación móvil ni la compartas.**

## 4. Ejecutar en Android

```bash
npx expo start
```

- En Android físico: instala **Expo Go** desde Google Play y escanea el QR.
- En emulador: abre Android Studio, inicia un emulador y ejecuta `npm run android`.

## 5. Crear un APK instalable

Instala EAS CLI e inicia sesión:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Crea `eas.json` con:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Después:

```bash
eas build --platform android --profile preview
```

EAS compilará el APK en sus servidores y te dará un enlace cuando termine. Para Google Play, utiliza el perfil `production` para generar un AAB.

## Funciones incluidas

- Crear cuenta e iniciar sesión con correo y contraseña.
- Sesión persistente en el dispositivo.
- Crear, completar y eliminar tareas.
- Sincronización de tareas con Supabase.
- Puntos, niveles y logros básicos calculados desde las tareas.
- Políticas Row Level Security para que cada usuario solo pueda acceder a sus propias tareas.

## Notas antes de publicar

Este es un proyecto inicial funcional, no una app ya publicada. Debes configurar Supabase y generar tu propio APK/AAB. Antes de publicar, añade política de privacidad, revisión de accesibilidad, pruebas en dispositivos reales y recuperación de contraseña. Los puntos y niveles actuales se calculan en el cliente; para competiciones o recompensas con valor real, traslada esa lógica a funciones seguras del servidor.

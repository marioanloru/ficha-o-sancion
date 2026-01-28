# Fichaje Bot

> **Aviso:** Este proyecto es solo para **fines educativos y de aprendizaje**. No esta pensado para uso real. El fichaje debe hacerse siempre de forma manual y en tiempo real siguiendo las politicas de tu empresa y los requisitos legales. El autor no se hace responsable de cualquier uso indebido de este software. Usalo bajo tu propia responsabilidad.

Bot de fichaje automatizado usando Puppeteer.

## Requisitos

- Node.js >= 14.0.0
- Google Chrome, Chromium o Brave (macOS)

## Clonar el repositorio

```bash
# SSH
git clone git@github.com:marioanloru/ficha-o-sancion.git

# HTTPS
git clone https://github.com/marioanloru/ficha-o-sancion.git
```

```bash
cd ficha-o-sancion
```

## Instalacion

```bash
npm install
```

## Uso

```bash
npm start
```

Modos disponibles:

1. **Real** - Jornada completa de 7.5 horas
2. **Simulacion** - Intervalos de 5 segundos para probar

### Primera ejecucion

> **Importante:** La primera vez que se abra Chrome aparecera un popup preguntando si quieres iniciar sesion. Haz clic en **"Continuar sin iniciar sesion"** para que el bot funcione correctamente.

La primera vez que ejecutes el bot, te preguntara como quieres hacer login:

1. **Login con Google (automatico)** - El bot hace clic automaticamente en el boton de "Login con Google". Solo tendras que seleccionar tu cuenta de Google.
2. **Login manual** - Introduces tu usuario y contrasena manualmente.

Esta preferencia se guarda en el archivo `.holded-config.json` y se recuerda en futuras ejecuciones.

Para cambiar el metodo de login, elimina el archivo de configuracion:

```bash
rm .holded-config.json
```

### Flujo de login

1. Se abre el navegador automaticamente
2. Se aceptan las cookies si aparece el banner
3. Segun tu configuracion:
   - **Google**: El bot hace clic en "Login con Google" y esperas a seleccionar tu cuenta
   - **Manual**: Introduces tus credenciales manualmente
4. El bot detecta cuando estas logueado y empieza
5. La sesion se guarda para futuros usos

## Funcionamiento

1. **Entrada** - Ficha inmediatamente al iniciar
2. **Pausa inicio** - 2.5-3.5 horas despues
3. **Pausa fin** - 13-17 minutos de descanso
4. **Salida** - 7.5 horas desde la entrada

Cada fichaje reproduce una alerta sonora (macOS).

## Estructura

```
ficha-o-sancion/
├── holded_bot.js          # Bot principal
├── alarma.js              # Alertas sonoras
├── package.json
├── .gitignore
├── .holded-config.json    # Configuracion (metodo de login)
└── .chrome-session/       # Sesion del navegador (cookies)
```

## Licencia

MIT

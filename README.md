# Fichaje Bot

> **Aviso:** Este proyecto es solo para **fines educativos y de aprendizaje**. No esta pensado para uso real. El fichaje debe hacerse siempre de forma manual y en tiempo real siguiendo las politicas de tu empresa y los requisitos legales. El autor no se hace responsable de cualquier uso indebido de este software. Usalo bajo tu propia responsabilidad.

Bot de fichaje automatizado usando Puppeteer.

## Requisitos

- Node.js >= 14.0.0
- Google Chrome, Chromium o Brave (macOS)

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

1. Se abre el navegador automaticamente
2. Haz login manualmente (solo la primera vez)
3. El bot detecta cuando estas logueado y empieza
4. La sesion se guarda para futuros usos

## Funcionamiento

1. **Entrada** - Ficha inmediatamente al iniciar
2. **Pausa inicio** - 2.5-3.5 horas despues
3. **Pausa fin** - 13-17 minutos de descanso
4. **Salida** - 7.5 horas desde la entrada

Cada fichaje reproduce una alerta sonora (macOS).

## Estructura

```
fichajes/
├── holded_bot.js    # Bot principal
├── alarma.js        # Alertas sonoras
├── package.json
└── .gitignore
```

## Licencia

MIT

#!/usr/bin/env node

/**
 * BOT REALISTA DE FICHAJE PARA HOLDED
 * Escrito en JavaScript/Node.js con Puppeteer
 *
 * Características:
 * - Abre navegador real
 * - Hace login con comportamiento humano
 * - Clickea botones de fichaje
 * - Espera horarios exactos
 * - Genera variabilidad realista
 */

import puppeteer from 'puppeteer';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { AlarmaAudio, AlarmaVisual } from './alarma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para guardar la sesión del navegador
const USER_DATA_DIR = path.join(__dirname, '.chrome-session');

// Archivo de configuración
const CONFIG_FILE = path.join(__dirname, '.holded-config.json');

// ==================== CONFIGURACIÓN ====================

class Configuracion {
  static cargar() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (e) {
      // Ignorar errores de lectura
    }
    return null;
  }

  static guardar(config) {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error guardando configuración:', e.message);
      return false;
    }
  }

  static existe() {
    return fs.existsSync(CONFIG_FILE);
  }
}

// ==================== LOGGING ====================

class Logger {
  log(level, message) {
    const timestamp = new Date().toLocaleString('es-ES');
    const formattedMessage = `${timestamp} - ${level} - ${message}`;
    console.log(formattedMessage);
  }

  info(message) {
    this.log('INFO', message);
  }

  error(message) {
    this.log('ERROR', message);
  }

  warning(message) {
    this.log('WARNING', message);
  }

  close() {
    // No-op: ya no usamos archivo
  }
}

const logger = new Logger();

// ==================== COMPORTAMIENTO HUMANO ====================

class ComportamientoHumano {
  /**
   * Pausa realista entre acciones
   */
  static async pausaRealista(minSeg = 0.5, maxSeg = 3.0) {
    const tiempo = Math.random() * (maxSeg - minSeg) + minSeg;
    await new Promise(resolve => setTimeout(resolve, tiempo * 1000));
  }

  /**
   * Delay realista para tipeo
   */
  static tiempoTipeo(texto, velocidad = 0.05) {
    return Math.random() * velocidad * 1000;
  }

  /**
   * Mover ratón suavemente hacia un elemento
   */
  static async moverRatonSuave(page, selector) {
    try {
      const elemento = await page.$(selector);
      if (elemento) {
        const box = await elemento.boundingBox();
        if (box) {
          // Mover a la posición del elemento
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await this.pausaRealista(0.1, 0.3);
        }
      }
    } catch (e) {
      // Ignorar si no se puede mover
    }
  }

  /**
   * Scroll natural simulando lectura
   */
  static async scrollNatural(page, cantidad = 3) {
    for (let i = 0; i < cantidad; i++) {
      const scrollAmount = Math.random() * 600 - 300;
      await page.evaluate((amount) => {
        window.scrollBy(0, amount);
      }, scrollAmount);
      await this.pausaRealista(0.5, 1.5);
    }
  }

  /**
   * Tipear de forma realista
   */
  static async tipearRealista(page, selector, texto) {
    await page.click(selector);
    await this.pausaRealista(0.2, 0.5);

    for (const char of texto) {
      await page.type(selector, char, {
        delay: this.tiempoTipeo(texto),
      });
    }
  }
}

// ==================== GENERADOR DE HORARIOS ====================

class GeneradorHorarios {
  /**
   * Genera hora de entrada realista: 7:30 - 8:00
   */
  static generarHoraEntrada() {
    const minutos = Math.floor(Math.random() * 30) + 450; // 7:30 a 8:00
    const segundos = Math.floor(Math.random() * 60);
    
    const ahora = new Date();
    const entrada = new Date(ahora);
    entrada.setHours(7, 0, 0, 0);
    entrada.setTime(entrada.getTime() + minutos * 60 * 1000 + segundos * 1000);
    
    return entrada;
  }

  /**
   * Genera pausa de 15 min ±2 min, a 3-4 horas de la entrada
   */
  static generarHorasPausa(entrada) {
    const minutosHastapausa = Math.floor(Math.random() * 60) + 180; // 3-4 horas
    const inicioPausa = new Date(entrada.getTime() + minutosHastapausa * 60 * 1000);
    
    const duracionPausa = Math.floor(Math.random() * 5) + 13; // 13-17 minutos
    const finPausa = new Date(inicioPausa.getTime() + duracionPausa * 60 * 1000);
    
    return { inicioPausa, finPausa };
  }

  /**
   * Genera hora de salida: 7.5 horas después de entrada ±2 minutos
   */
  static generarHoraSalida(entrada) {
    const variabilidad = Math.floor(Math.random() * 5) - 2; // ±2 minutos
    const minutosJornada = 450 + variabilidad; // 7.5 horas
    
    const salida = new Date(entrada.getTime() + minutosJornada * 60 * 1000);
    return salida;
  }

  /**
   * Formatea hora como HH:MM:SS
   */
  static formatearHora(fecha) {
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Calcula horas entre dos fechas
   */
  static calcularHoras(inicio, fin) {
    const diferencia = fin.getTime() - inicio.getTime();
    return (diferencia / (1000 * 60 * 60)).toFixed(2);
  }
}

// ==================== BOT PRINCIPAL ====================

class HolledBot {
  constructor(headless = false, loginGoogle = true) {
    this.headless = headless;
    this.loginGoogle = loginGoogle;
    this.browser = null;
    this.page = null;
    this.comportamiento = ComportamientoHumano;
    this.generador = GeneradorHorarios;
    this.alarma = new AlarmaAudio();
  }

  /**
   * Inicia el navegador
   */
  async inicializarNavegador() {
    logger.info('🌐 Inicializando navegador...');

    try {
      // Buscar Chrome instalado en el sistema
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      ];

      let executablePath = null;
      for (const p of chromePaths) {
        try {
          await fs.promises.access(p);
          executablePath = p;
          logger.info(`  Usando navegador: ${p}`);
          break;
        } catch {
          // No existe, probar siguiente
        }
      }

      this.browser = await puppeteer.launch({
        headless: this.headless ? 'new' : false,
        executablePath: executablePath,
        userDataDir: USER_DATA_DIR, // Guarda cookies y sesión
        args: [
          '--start-maximized',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-infobars',
          '--disable-features=TranslateUI',
          '--deny-permission-prompts',
        ],
      });

      logger.info(`  Sesión guardada en: ${USER_DATA_DIR}`);

      this.page = await this.browser.newPage();

      // Establecer viewport
      await this.page.setViewport({
        width: 1366,
        height: 768,
      });

      // User agent realista (macOS)
      await this.page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Denegar permisos de ubicación
      const context = this.browser.defaultBrowserContext();
      await context.overridePermissions('https://app.holded.com', []);

      // Evitar detección de automatización
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      // Manejar diálogos del navegador (cancelar ubicación, etc.)
      this.page.on('dialog', async (dialog) => {
        logger.info(`  📢 Diálogo detectado: ${dialog.type()} - Cancelando...`);
        await dialog.dismiss();
      });

      logger.info('✓ Navegador inicializado correctamente');
      return true;
    } catch (e) {
      logger.error(`✗ Error al inicializar navegador: ${e.message}`);
      return false;
    }
  }

  /**
   * Maneja popups de Chrome (usar sin cuenta, ubicación, etc.)
   */
  async manejarPopupsChrome() {
    try {
      // Esperar un poco para que aparezcan los popups
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Buscar y clickear "Usar Chrome sin cuenta" o similar
      const selectoresUsarSinCuenta = [
        'button:has-text("sin cuenta")',
        'button:has-text("without")',
        'button:has-text("No thanks")',
        'button:has-text("Ahora no")',
        '[aria-label*="sin cuenta"]',
        '[aria-label*="without"]',
      ];

      for (const selector of selectoresUsarSinCuenta) {
        try {
          const boton = await this.page.$(selector);
          if (boton) {
            await boton.click();
            logger.info('  ✓ Popup "Usar Chrome sin cuenta" cerrado');
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch {
          // Continuar
        }
      }

      // Buscar y clickear "Cancelar" o "Denegar" para ubicación
      const selectoresCancelar = [
        'button:has-text("Cancelar")',
        'button:has-text("Cancel")',
        'button:has-text("Denegar")',
        'button:has-text("Deny")',
        'button:has-text("Bloquear")',
        'button:has-text("Block")',
        '[aria-label*="Cancelar"]',
        '[aria-label*="Denegar"]',
      ];

      for (const selector of selectoresCancelar) {
        try {
          const boton = await this.page.$(selector);
          if (boton) {
            await boton.click();
            logger.info('  ✓ Popup de ubicación cancelado');
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch {
          // Continuar
        }
      }
    } catch (e) {
      // Ignorar errores, los popups son opcionales
    }
  }

  /**
   * Navega a Holded y espera login manual (o usa sesión guardada)
   */
  async irAHolledYLogin() {
    logger.info('📍 Navegando a Holded...');

    // Selector del botón de fichaje
    const SELECTOR_BOTON_FICHAJE = '#root > div.MuiStack-root.css-ip40ae > div > div > main > div.MuiStack-root.css-dxi5gs > div > div > div > main > div > div > div > div.MuiStack-root.css-11w9353 > div > div.MuiStack-root.css-1scg5pb > div.MuiStack-root.css-9jay18 > div.MuiStack-root.css-8v90jo > span > button';

    // Selector del botón de login con Google
    const SELECTOR_LOGIN_GOOGLE = '#root-auth > div > div > div.MuiStack-root.css-b95f0i > div > div > div.MuiStack-root.css-157nwov > div.MuiStack-root.css-4ip17j > div.MuiStack-root.css-h2ymkg > a.css-4ahj5c';

    // Selector del botón de aceptar cookies (OneTrust)
    const SELECTOR_ACEPTAR_COOKIES = '#onetrust-accept-btn-handler';

    try {
      // Ir a la app de Holded
      await this.page.goto('https://app.holded.com', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Manejar popups de Chrome (usar sin cuenta, ubicación, etc.)
      await this.manejarPopupsChrome();

      // Manejar banner de cookies si aparece
      try {
        const botonCookies = await this.page.$(SELECTOR_ACEPTAR_COOKIES);
        if (botonCookies) {
          logger.info('🍪 Banner de cookies detectado - Aceptando...');
          await botonCookies.click();
          logger.info('✓ Cookies aceptadas');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch {
        // Ignorar si no hay banner de cookies
      }

      logger.info('✓ Página cargada');
      logger.info('');
      if (this.loginGoogle) {
        logger.info('🔐 Modo: Login con Google automático');
      } else {
        logger.info('🔐 Modo: Login manual (haz login manualmente)');
      }
      logger.info('');

      // Buscar el botón de fichaje cada 10 segundos, hasta 2 minutos
      const maxIntentos = 12; // 12 intentos x 10 segundos = 2 minutos
      let loginGoogleClickeado = false;

      for (let intento = 1; intento <= maxIntentos; intento++) {
        try {
          // Primero verificar si ya estamos logueados (botón de fichaje visible)
          const botonFichaje = await this.page.$(SELECTOR_BOTON_FICHAJE);

          if (botonFichaje) {
            logger.info('✓ Botón de fichaje encontrado - Login correcto');
            return true;
          }

          // Si no estamos logueados y está habilitado login con Google, buscar el botón
          if (this.loginGoogle && !loginGoogleClickeado) {
            const botonLoginGoogle = await this.page.$(SELECTOR_LOGIN_GOOGLE);

            if (botonLoginGoogle) {
              logger.info('🔑 Botón de Login con Google encontrado - Clickeando...');
              await this.comportamiento.pausaRealista(0.5, 1);
              await botonLoginGoogle.click();
              loginGoogleClickeado = true;
              logger.info('✓ Click en Login con Google realizado');
              logger.info('⏳ Esperando autenticación de Google...');
              // Dar más tiempo para la autenticación de Google
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }
          }
        } catch {
          // Ignorar errores
        }

        logger.info(`  ⏳ Intento ${intento}/${maxIntentos} - Esperando login, 10s...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      logger.error('✗ Timeout: No se encontró el botón de fichaje en 2 minutos');
      return false;
    } catch (e) {
      logger.error(`✗ Error: ${e.message}`);
      return false;
    }
  }

  /**
   * Busca la sección de fichaje
   */
  async buscarSeccionFichaje() {
    logger.info('🕐 Buscando sección de fichaje...');

    try {
      // Hacer scroll natural
      await this.comportamiento.scrollNatural(this.page, 2);

      // Selectores posibles para la sección de fichaje
      const selectoresFichaje = [
        'a:has-text("Fichaje")',
        'a:has-text("Jornada")',
        'a:has-text("Horas")',
        'a:has-text("Asistencia")',
        'a:has-text("Timeclock")',
        'button:has-text("Fichaje")',
        '[class*="fichaje" i]',
      ];

      for (const selector of selectoresFichaje) {
        try {
          const elemento = await this.page.$(selector);
          if (elemento) {
            logger.info(`  ✓ Encontrado: ${selector}`);
            await this.comportamiento.moverRatonSuave(this.page, selector);
            await this.comportamiento.pausaRealista(0.5, 1.5);
            await this.page.click(selector);
            await this.comportamiento.pausaRealista(2, 4);
            logger.info('✓ Sección de fichaje abierta');
            return true;
          }
        } catch (e) {
          // Continuar
        }
      }

      logger.warning('⚠️  No se encontró botón de fichaje visible');
      logger.info('  Intentando acceso directo por URL...');

      // Intentar URLs directas
      const urlsFichaje = ['/timeclocks', '/jornada', '/asistencia', '/fichaje'];

      for (const url of urlsFichaje) {
        try {
          const baseUrl = new URL(this.page.url());
          await this.page.goto(`${baseUrl.origin}${url}`, {
            waitUntil: 'networkidle2',
            timeout: 10000,
          });
          logger.info(`  ✓ Acceso directo por URL: ${url}`);
          await this.comportamiento.pausaRealista(2, 3);
          return true;
        } catch (e) {
          // Continuar
        }
      }

      return false;
    } catch (e) {
      logger.error(`✗ Error buscando sección de fichaje: ${e.message}`);
      return false;
    }
  }

  /**
   * Realiza un fichaje clickeando el botón
   */
  async hacerFichaje(tipo, hora) {
    logger.info(`\n${'='.repeat(50)}`);
    logger.info(`📌 Realizando fichaje: ${tipo.toUpperCase()}`);
    if (hora) {
      logger.info(`   Hora: ${this.generador.formatearHora(hora)}`);
    }
    logger.info(`${'='.repeat(50)}`);

    // Selectores específicos para cada tipo de fichaje
    const SELECTORES = {
      'entrada': '#root > div.MuiStack-root.css-ip40ae > div > div > main > div.MuiStack-root.css-dxi5gs > div > div > div > main > div > div > div > div.MuiStack-root.css-11w9353 > div > div.MuiStack-root.css-1scg5pb > div.MuiStack-root.css-9jay18 > div.MuiStack-root.css-8v90jo > span > button',
      'pausa_inicio': '#root > div.MuiStack-root.css-ip40ae > div > div > main > div.MuiStack-root.css-dxi5gs > div > div > div > main > div > div > div > div.MuiStack-root.css-11w9353 > div > div.MuiStack-root.css-qibh50 > div.MuiStack-root.css-9jay18 > div.MuiStack-root.css-8v90jo > button:nth-child(2)',
      'pausa_fin': '#root > div.MuiStack-root.css-ip40ae > div > div > main > div.MuiStack-root.css-dxi5gs > div > div > div > main > div > div > div > div.MuiStack-root.css-11w9353 > div > div.MuiStack-root.css-1scg5pb > div.MuiStack-root.css-9jay18 > div.MuiStack-root.css-8v90jo > span > button',
      'salida': '#root > div.MuiStack-root.css-ip40ae > div > div > main > div.MuiStack-root.css-dxi5gs > div > div > div > main > div > div > div > div.MuiStack-root.css-11w9353 > div > div.MuiStack-root.css-qibh50 > div.MuiStack-root.css-9jay18 > div.MuiStack-root.css-8v90jo > button:nth-child(1)',
    };

    try {
      const selector = SELECTORES[tipo];

      if (!selector) {
        logger.error(`  ✗ Tipo de fichaje desconocido: ${tipo}`);
        return false;
      }

      await this.comportamiento.pausaRealista(1, 2);

      // Buscar el botón
      let boton = await this.page.$(selector);

      if (!boton) {
        logger.error(`  ✗ No se encontró botón para ${tipo}`);
        await this.page.screenshot({ path: `fichaje_error_${tipo}.png` });
        return false;
      }

      logger.info(`  ✓ Botón de ${tipo} encontrado`);

      // Click
      logger.info('  Clickeando botón...');
      await boton.click();

      // Reproducir alarma justo al hacer click
      await this.alarma.reproducir(tipo);

      // Esperar confirmación
      await this.comportamiento.pausaRealista(2, 4);

      logger.info(`  ✓ Fichaje de ${tipo} completado`);

      return true;
    } catch (e) {
      logger.error(`  ✗ Error realizando fichaje: ${e.message}`);
      return false;
    }
  }

  /**
   * Espera hasta un tiempo específico
   */
  async esperarHasta(horaDestino) {
    while (true) {
      const ahora = new Date();
      const diferencia = horaDestino.getTime() - ahora.getTime();

      if (diferencia <= 0) {
        break;
      }

      const minutos = Math.floor(diferencia / 60000);
      const segundos = Math.floor((diferencia % 60000) / 1000);

      process.stdout.write(
        `\r⏱️  Faltan ${minutos}m ${segundos}s...          `
      );

      // Esperar 1 segundo antes de actualizar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n');
  }

  /**
   * Ejecuta jornada completa: entrada inmediata + pausa + salida programadas
   * @param {boolean} simulacion - Si es true, usa intervalos de 1 minuto
   */
  async ejecutarJornada(simulacion = false) {
    logger.info('\n' + '='.repeat(60));
    logger.info('🚀 INICIANDO BOT DE FICHAJE HOLDED');
    if (simulacion) {
      logger.info('⚠️  MODO SIMULACIÓN - Intervalos de 5 segundos');
    } else {
      logger.info('✅ MODO REAL - Jornada completa de 7.5 horas');
    }
    logger.info('='.repeat(60) + '\n');

    try {
      // Inicializar
      if (!(await this.inicializarNavegador())) {
        return false;
      }

      // Navegar y esperar login
      if (!(await this.irAHolledYLogin())) {
        await this.browser.close();
        return false;
      }

      // 1. ENTRADA - Hacer fichaje inmediatamente
      logger.info('\n📌 Realizando fichaje de ENTRADA...');
      if (!(await this.hacerFichaje('entrada', new Date()))) {
        logger.error('❌ Error en fichaje de entrada');
        await this.browser.close();
        return false;
      }

      const horaEntrada = new Date();
      logger.info(`✅ Entrada registrada a las ${this.generador.formatearHora(horaEntrada)}`);

      // Calcular horarios basados en la hora de entrada
      let minutosHastaPausa, duracionPausa, minutosJornada;

      if (simulacion) {
        // Modo simulación: 5 segundos entre cada fichaje
        minutosHastaPausa = 5 / 60; // 5 segundos
        duracionPausa = 5 / 60; // 5 segundos
        minutosJornada = 15 / 60; // 15 segundos total
      } else {
        // Modo real
        minutosHastaPausa = Math.floor(Math.random() * 60) + 150; // 2.5-3.5 horas
        duracionPausa = Math.floor(Math.random() * 5) + 13; // 13-17 minutos
        minutosJornada = 450 + Math.floor(Math.random() * 5) - 2; // 7.5 horas ±2 min
      }

      const horaPausaInicio = new Date(horaEntrada.getTime() + minutosHastaPausa * 60 * 1000);
      const horaPausaFin = new Date(horaPausaInicio.getTime() + duracionPausa * 60 * 1000);
      const horaSalida = new Date(horaEntrada.getTime() + minutosJornada * 60 * 1000);

      // Mostrar plan
      logger.info('\n' + '='.repeat(60));
      logger.info('📋 PLAN DE JORNADA:');
      logger.info(`   ✅ Entrada:        ${this.generador.formatearHora(horaEntrada)} (completado)`);
      logger.info(`   ⏳ Pausa inicio:   ${this.generador.formatearHora(horaPausaInicio)}`);
      logger.info(`   ⏳ Pausa fin:      ${this.generador.formatearHora(horaPausaFin)}`);
      logger.info(`   ⏳ Salida:         ${this.generador.formatearHora(horaSalida)}`);
      logger.info('='.repeat(60) + '\n');

      // 2. PAUSA INICIO - Esperar y fichar
      logger.info('⏳ Esperando para fichar PAUSA...');
      await this.esperarHasta(horaPausaInicio);

      logger.info('\n📌 Realizando fichaje de PAUSA (inicio)...');
      await this.hacerFichaje('pausa_inicio', horaPausaInicio);
      logger.info(`✅ Pausa iniciada a las ${this.generador.formatearHora(new Date())}`);

      // 3. PAUSA FIN - Esperar y fichar
      logger.info('\n⏳ Esperando para REANUDAR trabajo...');
      await this.esperarHasta(horaPausaFin);

      logger.info('\n📌 Realizando fichaje de VUELTA DE PAUSA...');
      await this.hacerFichaje('pausa_fin', horaPausaFin);
      logger.info(`✅ Pausa finalizada a las ${this.generador.formatearHora(new Date())}`);

      // 4. SALIDA - Esperar y fichar
      logger.info('\n⏳ Esperando para fichar SALIDA...');
      await this.esperarHasta(horaSalida);

      logger.info('\n📌 Realizando fichaje de SALIDA...');
      await this.hacerFichaje('salida', horaSalida);
      logger.info(`✅ Salida registrada a las ${this.generador.formatearHora(new Date())}`);

      // Finalizar
      logger.info('\n' + '='.repeat(60));
      logger.info('✅ JORNADA COMPLETADA EXITOSAMENTE');
      logger.info('='.repeat(60));

      logger.info('Cerrando navegador en 5 segundos...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await this.browser.close();

      return true;
    } catch (e) {
      logger.error(`Error fatal: ${e.message}`);
      if (this.browser) {
        await this.browser.close();
      }
      return false;
    }
  }
}

// ==================== ENTRADA ====================

async function leerEntrada(pregunta) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(pregunta, respuesta => {
      rl.close();
      resolve(respuesta);
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 BOT DE FICHAJE PARA HOLDED');
  console.log('='.repeat(60) + '\n');

  try {
    // Cargar o crear configuración
    let config = Configuracion.cargar();

    if (!config) {
      console.log('⚙️  Primera ejecución - Configuración inicial\n');
      console.log('¿Cómo quieres hacer login en Holded?');
      console.log('1. Login con Google (automático)');
      console.log('2. Login manual (usuario y contraseña)');

      const metodoLogin = await leerEntrada('\nElige (1/2) [1]: ');
      const loginGoogle = metodoLogin !== '2';

      config = { loginGoogle };
      Configuracion.guardar(config);

      console.log(`\n✓ Configuración guardada: ${loginGoogle ? 'Login con Google' : 'Login manual'}`);
      console.log('  (Para cambiarla, elimina el archivo .holded-config.json)\n');
    } else {
      console.log(`⚙️  Configuración cargada: ${config.loginGoogle ? 'Login con Google' : 'Login manual'}\n`);
    }

    // Preguntar modo
    console.log('¿Modo de ejecución?');
    console.log('1. Real (jornada completa de 7.5 horas)');
    console.log('2. Simulación (intervalos de 5 segundos)');

    const modo = await leerEntrada('\nElige (1/2) [1]: ');
    const simulacion = modo === '2';

    // Crear bot y ejecutar jornada
    const bot = new HolledBot(false, config.loginGoogle);
    const resultado = await bot.ejecutarJornada(simulacion);

    process.exit(resultado ? 0 : 1);
  } catch (e) {
    logger.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

// Ejecutar
main();

export { HolledBot, ComportamientoHumano, GeneradorHorarios };

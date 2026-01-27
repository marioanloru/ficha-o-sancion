import { exec } from 'child_process';
import os from 'os';

class AlarmaAudio {
  constructor() {
    this.tipoSO = os.platform();
  }

  async reproducir(tipo = 'entrada') {
    try {
      if (this.tipoSO === 'darwin') {
        await this.reproducirMac(tipo);
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }

  reproducirMac(tipo = 'entrada') {
    return new Promise((resolve) => {
      const mensajes = {
        'entrada': [
          'Ficha illo que viene perro sanche con la sancion',
          'Cuidado que viene el inspector',
          'A fichar que vienen los picoletos',
          'Alerta, que viene la gestapo',
          'Ficha ya que estan los pacos en la puerta',
          'Que viene la policia del fichaje',
        ],
        'pausa_inicio': [
          'Al cafe que no te lo va a pagar perro sanche',
          'Descanso que te lo mereces, bebe cafe',
          'Tomate un respiro antes de que venga el inspector',
        ],
        'pausa_fin': [
          'Venga al tajo que viene la gestapo',
          'A currar que hay que pagar los impuestos de perro sanche',
          'Ficha que te estan vigilando los picoletos',
        ],
        'salida': [
          'Libertad al fin, hoy no te pillo perro sanche',
          'A casita, otro dia escapando de los picoletos',
          'Otro dia mas sin que te pille la gestapo',
          'Hasta mañana inspector',
        ],
      };

      const lista = mensajes[tipo] || ['Fichaje'];
      const mensaje = lista[Math.floor(Math.random() * lista.length)];
      const comando = `say -v "Monica" "${mensaje}" && afplay /System/Library/Sounds/Glass.aiff`;

      exec(comando, () => {
        this.imprimirAlarma(tipo);
        resolve();
      });
    });
  }

  imprimirAlarma(tipo) {
    const msgs = {
      'entrada': [
        'FICHA ILLO QUE VIENE PERRO SANCHE CON LA SANCION',
        'CUIDADO QUE VIENE EL INSPECTOR',
        'A FICHAR QUE VIENEN LOS PICOLETOS',
        'ALERTA, QUE VIENE LA GESTAPO',
        'FICHA YA QUE ESTAN LOS PACOS EN LA PUERTA',
        'QUE VIENE LA POLICIA DEL FICHAJE',
      ],
      'pausa_inicio': [
        'AL CAFE QUE NO TE LO VA A PAGAR PERRO SANCHE',
        'DESCANSO QUE TE LO MERECES, BEBE CAFE',
        'TOMATE UN RESPIRO ANTES DE QUE VENGA EL INSPECTOR',
      ],
      'pausa_fin': [
        'VENGA AL TAJO QUE VIENE LA GESTAPO',
        'A CURRAR QUE HAY QUE PAGAR LOS IMPUESTOS DE PERRO SANCHE',
        'FICHA QUE TE ESTAN VIGILANDO LOS PICOLETOS',
      ],
      'salida': [
        'LIBERTAD AL FIN, HOY NO TE PILLO PERRO SANCHE',
        'A CASITA, OTRO DIA ESCAPANDO DE LOS PICOLETOS',
        'OTRO DIA MAS SIN QUE TE PILLE LA GESTAPO',
        'HASTA MAÑANA INSPECTOR',
      ],
    };

    const desc = {
      'entrada': 'FICHAJE DE ENTRADA',
      'pausa_inicio': 'PAUSA INICIADA',
      'pausa_fin': 'VUELTA AL TRABAJO',
      'salida': 'FICHAJE DE SALIDA',
    };

    const lista = msgs[tipo] || ['FICHAJE'];
    const m = lista[Math.floor(Math.random() * lista.length)];
    const d = desc[tipo] || 'FICHAJE';

    console.log('');
    console.log('============================================================');
    console.log('  ' + m);
    console.log('  ' + d);
    console.log('============================================================');
  }
}

class AlarmaVisual {
  static mostrarPatron() {}
}

export { AlarmaAudio, AlarmaVisual };

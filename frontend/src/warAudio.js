// Motor de audio procedural: gera o ambiente de guerra em tempo real com Web Audio API
// Nao usa arquivo de audio, tudo e sintetizado por osciladores e ruido

export default class WarAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    this.hornTimer = null;
    this.running = false;
    this.faction = 0;
  }

  // Cria o buffer de ruido rosa usado como vento e textura de areia
  createNoiseBuffer() {
    const seconds = 4;
    const size = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  start() {
    if (this.running) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.running = true;

    // O navegador entrega o contexto suspenso ate existir gesto do usuario
    // Sem este resume nenhum oscilador chega na saida
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Ganho geral com fade in lento para nao assustar
    this.master = this.ctx.createGain();
    this.master.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.master.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 4);
    this.master.connect(this.ctx.destination);

    // Reverb curto por conveluicao de ruido decaindo, da sensacao de espaco aberto
    const convolver = this.ctx.createConvolver();
    const irLen = this.ctx.sampleRate * 2.6;
    const ir = this.ctx.createBuffer(2, irLen, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = ir.getChannelData(c);
      for (let i = 0; i < irLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.8);
      }
    }
    convolver.buffer = ir;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.3;
    convolver.connect(wet);
    wet.connect(this.master);
    this.reverb = convolver;

    this.buildDrone();
    this.buildWind();
    this.scheduleHorn();
  }

  // Drone grave sustentado: tonica mais quinta justa, filtrado e com batimento lento
  buildDrone() {
    const t = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 6;

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.5;

    filter.connect(droneGain);
    droneGain.connect(this.master);
    droneGain.connect(this.reverb);

    // Tres vozes levemente desafinadas criam o batimento que deixa o som tenso
    [55, 55.4, 82.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i === 2 ? 'triangle' : 'sawtooth';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.value = i === 2 ? 0.22 : 0.4;
      osc.connect(g);
      g.connect(filter);
      osc.start(t);
      this.nodes.push(osc);
    });

    // LFO abre e fecha o filtro lentamente, cria a respiracao do drone
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t);
    this.nodes.push(lfo);

    this.droneFilter = filter;
    this.droneGain = droneGain;
  }

  // Vento: ruido rosa em loop passando por filtro passa banda que varre devagar
  buildWind() {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer();
    src.loop = true;

    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 500;
    band.Q.value = 1.1;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.3;

    src.connect(band);
    band.connect(windGain);
    windGain.connect(this.master);
    windGain.connect(this.reverb);
    src.start(t);
    this.nodes.push(src);

    // Varredura do filtro simula as rajadas
    const sweep = this.ctx.createOscillator();
    sweep.frequency.value = 0.04;
    const sweepGain = this.ctx.createGain();
    sweepGain.gain.value = 380;
    sweep.connect(sweepGain);
    sweepGain.connect(band.frequency);
    sweep.start(t);
    this.nodes.push(sweep);

    this.windBand = band;
    this.windGain = windGain;
  }

  // Trompa de guerra: sopro grave com ataque lento e queda de afinacao no fim
  blastHorn() {
    if (!this.running || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const dur = 3.4;

    // Arrakis usa intervalo aberto, Latveria usa segunda menor para soar hostil
    const base = this.faction === 0 ? 73.4 : 69.3;
    const partials = this.faction === 0 ? [1, 2, 3, 4.01] : [1, 2, 2.12, 3, 4.03];

    const hornGain = this.ctx.createGain();
    hornGain.gain.setValueAtTime(0.0001, t);
    hornGain.gain.exponentialRampToValueAtTime(0.5, t + 0.9);
    hornGain.gain.setValueAtTime(0.5, t + dur * 0.55);
    hornGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const shaper = this.ctx.createBiquadFilter();
    shaper.type = 'lowpass';
    shaper.frequency.setValueAtTime(400, t);
    shaper.frequency.linearRampToValueAtTime(900, t + 1.2);
    shaper.frequency.linearRampToValueAtTime(260, t + dur);

    hornGain.connect(shaper);
    shaper.connect(this.master);
    shaper.connect(this.reverb);

    partials.forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      const f = base * mult;
      osc.frequency.setValueAtTime(f, t);
      // Leve queda de afinacao no final da nota
      osc.frequency.linearRampToValueAtTime(f * 0.985, t + dur);
      const g = this.ctx.createGain();
      g.gain.value = 0.42 / (i + 1.3);
      osc.connect(g);
      g.connect(hornGain);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    });
  }

  // Agenda a proxima trompa em intervalo irregular
  scheduleHorn() {
    const next = 11000 + Math.random() * 13000;
    this.hornTimer = setTimeout(() => {
      this.blastHorn();
      if (this.running) this.scheduleHorn();
    }, next);
  }

  // Ajusta o timbre quando o campo de batalha troca de faccao
  setFaction(faction) {
    this.faction = faction;
    if (!this.running || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Arrakis: mais vento e filtro aberto. Latveria: mais drone e filtro fechado
    const windTarget = faction === 0 ? 0.36 : 0.16;
    const filterTarget = faction === 0 ? 220 : 130;
    const droneTarget = faction === 0 ? 0.42 : 0.62;

    this.windGain.gain.linearRampToValueAtTime(windTarget, t + 3);
    this.droneFilter.frequency.linearRampToValueAtTime(filterTarget, t + 3);
    this.droneGain.gain.linearRampToValueAtTime(droneTarget, t + 3);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    clearTimeout(this.hornTimer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    setTimeout(() => {
      this.nodes.forEach((n) => {
        try { n.stop(); } catch (e) { /* no-op */ }
      });
      this.nodes = [];
      this.ctx.close();
      this.ctx = null;
    }, 1400);
  }
}

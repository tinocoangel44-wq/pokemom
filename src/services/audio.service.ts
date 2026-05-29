import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  private isMuted: boolean = false;
  private currentTheme: 'mainMenu' | 'battle' | null = null;
  
  private nextNoteTime: number = 0;
  private timerID: any = null;
  private currentNote: number = 0;
  
  // Canción 1: Menú Principal (Ahora usa MP3 local)
  private mainMenuAudio = new Audio('assets/audio/inicio.mp3');
  
  // Canción 2: Campo de Batalla (Ahora usa MP3 local)
  private battleAudio = new Audio('assets/audio/lucha.mp3');

  constructor() { }

  private initAudio() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      
      this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx?.currentTime || 0);
    }
    this.mainMenuAudio.muted = this.isMuted;
    this.battleAudio.muted = this.isMuted;
  }

  public setMainMenuVolume(volume: number) {
    if (this.mainMenuAudio) {
      this.mainMenuAudio.volume = volume;
    }
  }

  public playMainMenuTheme() {
    this.initAudio();
    if (this.currentTheme === 'mainMenu') return; // Ya está sonando, no reiniciar
    
    if (this.currentTheme === 'battle') {
       this.stopBattleTheme();
    }
    
    this.currentTheme = 'mainMenu';
    this.mainMenuAudio.loop = true;
    this.mainMenuAudio.volume = 0.5;
    this.mainMenuAudio.muted = this.isMuted;
    this.mainMenuAudio.play().catch(err => console.log('Esperando interacción del usuario para reproducir audio.'));
  }

  public stopMainMenuTheme() {
    let vol = this.mainMenuAudio.volume;
    const fadeOut = setInterval(() => {
      if (vol > 0.05) {
        vol -= 0.05;
        this.mainMenuAudio.volume = vol;
      } else {
        clearInterval(fadeOut);
        this.mainMenuAudio.pause();
        this.mainMenuAudio.currentTime = 0;
      }
    }, 100);
  }

  private stopBattleTheme() {
    let vol = this.battleAudio.volume;
    const fadeOut = setInterval(() => {
      if (vol > 0.05) {
        vol -= 0.05;
        this.battleAudio.volume = vol;
      } else {
        clearInterval(fadeOut);
        this.battleAudio.pause();
        this.battleAudio.currentTime = 0;
      }
    }, 100);
  }

  public playBattleTheme() {
    this.initAudio();
    if (this.currentTheme === 'battle') return;
    
    if (this.currentTheme === 'mainMenu') {
        this.stopMainMenuTheme();
    }
    
    this.currentTheme = 'battle';
    
    setTimeout(() => {
        this.battleAudio.loop = true;
        this.battleAudio.volume = 0.5;
        this.battleAudio.muted = this.isMuted;
        this.battleAudio.play().catch(err => console.log('Esperando interacción del usuario para reproducir audio de batalla.'));
    }, 1000);
  }

  public stopAll() {
    this.stopMainMenuTheme();
    this.stopBattleTheme();
    this.currentTheme = null;
  }

  public lowerBattleVolume() {
    if (this.currentTheme === 'battle') {
      this.battleAudio.volume = 0.2;
    }
  }
}



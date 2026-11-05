import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiIconName =
  | 'sun'
  | 'moon'
  | 'close'
  | 'lightning'
  | 'folder'
  | 'camera'
  | 'pen'
  | 'trash'
  | 'elder-sign'
  | 'star'
  | 'check'
  | 'chevron-down'
  | 'chevron-up'
  | 'transfer'
  | 'backpack';

@Component({
  selector: 'app-ui-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="ui-icon-wrapper icon-{{ name }}"
      [class]="customClass"
      [style.width.px]="size"
      [style.height.px]="size"
      aria-hidden="true"
    >
      <!-- ÍCONE: SOL (TEMA CLARO) -->
      @if (name === 'sun') {
        <svg class="ui-svg anim-sun" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5" fill="var(--accent-gold, #c5a059)" stroke="none" />
          <g class="sun-rays">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>
      }

      <!-- ÍCONE: LUA (TEMA ESCURO) -->
      @if (name === 'moon') {
        <svg class="ui-svg anim-moon" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          <circle cx="16" cy="6" r="1" class="moon-twinkle" fill="var(--accent-gold, #c5a059)" />
        </svg>
      }

      <!-- ÍCONE: FECHAR / CRUZ (X) -->
      @if (name === 'close') {
        <svg class="ui-svg anim-close" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      }

      <!-- ÍCONE: RAIO / DANO / VITAIS -->
      @if (name === 'lightning') {
        <svg class="ui-svg anim-lightning" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="var(--accent-gold, #c5a059)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      }

      <!-- ÍCONE: PASTA / ARQUIVO -->
      @if (name === 'folder') {
        <svg class="ui-svg anim-folder" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="8" y1="13" x2="16" y2="13" class="folder-line" stroke-width="1.5" />
        </svg>
      }

      <!-- ÍCONE: CÂMERA DE FOTOGRAFIA VINTAGE -->
      @if (name === 'camera') {
        <svg class="ui-svg anim-camera" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" class="camera-lens" stroke-width="2" />
          <circle cx="12" cy="13" r="1.5" fill="currentColor" />
        </svg>
      }

      <!-- ÍCONE: PENA / CANETA DE TINTA (EDITAR) -->
      @if (name === 'pen') {
        <svg class="ui-svg anim-pen" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          <path d="M15 5l4 4" />
        </svg>
      }

      <!-- ÍCONE: LIXEIRA (EXCLUIR) -->
      @if (name === 'trash') {
        <svg class="ui-svg anim-trash" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18" class="trash-lid" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      }

      <!-- ÍCONE: SIGNO ANCESTRAL / ESTRELA OCULTA -->
      @if (name === 'elder-sign' || name === 'star') {
        <svg class="ui-svg anim-star" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="var(--accent-gold, #c5a059)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      }

      <!-- ÍCONE: CHECKMARK (CONFIRMAÇÃO / COMPLETO) -->
      @if (name === 'check') {
        <svg class="ui-svg anim-check" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      }

      <!-- ÍCONE: CHEVRON PARA BAIXO -->
      @if (name === 'chevron-down') {
        <svg class="ui-svg anim-chevron-down" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      }

      <!-- ÍCONE: CHEVRON PARA CIMA -->
      @if (name === 'chevron-up') {
        <svg class="ui-svg anim-chevron-up" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      }

      <!-- ÍCONE: TRANSFERIR / MOVER -->
      @if (name === 'transfer') {
        <svg class="ui-svg anim-transfer" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 5h18" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 19H3" />
        </svg>
      }

      <!-- ÍCONE: MOCHILA / SACOLA VINTAGE -->
      @if (name === 'backpack') {
        <svg class="ui-svg anim-backpack" viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M4 12h16" />
          <path d="M10 12v3a2 2 0 0 0 4 0v-3" />
        </svg>
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }

    .ui-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }

    .ui-svg {
      display: block;
      width: 100%;
      height: 100%;
      transform-origin: 50% 50%;
      transition: transform 0.2s ease, filter 0.2s ease;
    }

    /* Animação: Sol girando raios suavemente */
    .sun-rays {
      transform-origin: 12px 12px;
      animation: anim-sun-spin 12s linear infinite;
    }

    @keyframes anim-sun-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Animação: Lua com cintilação de estrela */
    .anim-moon .moon-twinkle {
      animation: anim-twinkle 2s ease-in-out infinite alternate;
    }

    @keyframes anim-twinkle {
      0% { opacity: 0.3; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1.2); }
    }

    /* Animação: Fechar com rotação suave ao hover */
    :host-context(button:hover) .anim-close,
    .ui-icon-wrapper:hover .anim-close {
      transform: rotate(90deg) scale(1.1);
    }

    /* Animação: Raio pulsando */
    .anim-lightning {
      animation: anim-pulse-lightning 2.2s ease-in-out infinite;
    }

    @keyframes anim-pulse-lightning {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(197, 160, 89, 0)); }
      50% { transform: scale(1.12); filter: drop-shadow(0 0 3px rgba(197, 160, 89, 0.6)); }
    }

    /* Animação: Câmera com clique no obturador */
    :host-context(:hover) .camera-lens {
      transform: scale(0.85);
      transition: transform 0.15s ease;
    }

    /* Animação: Caneta escrevendo (inclinação) */
    :host-context(button:hover) .anim-pen {
      transform: rotate(-12deg) translateY(-1px);
    }

    /* Animação: Lixeira abrindo a tampa */
    :host-context(button:hover) .trash-lid {
      transform: translateY(-2px) rotate(-6deg);
      transform-origin: 3px 6px;
      transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    /* Animação: Estrela Oculta / Signo Ancestral com rotação cósmica */
    .anim-star {
      animation: anim-cosmic-shimmer 8s ease-in-out infinite alternate;
    }

    @keyframes anim-cosmic-shimmer {
      0% { transform: scale(1); filter: drop-shadow(0 0 0 transparent); }
      100% { transform: scale(1.08); filter: drop-shadow(0 0 2px var(--accent-gold, #c5a059)); }
    }

    /* Animação: Checkmark com pulso */
    .anim-check {
      animation: anim-pop-check 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes anim-pop-check {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class UiIconComponent {
  @Input() public name!: UiIconName;
  @Input() public size: number = 16;
  @Input() public customClass: string = '';
}

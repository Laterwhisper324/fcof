import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-d20-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="d20-wrapper"
      [class.is-spinning]="spinning"
      [class]="customClass"
      [style.width.px]="size"
      [style.height.px]="size"
      aria-hidden="true"
    >
      <svg
        class="d20-svg"
        viewBox="0 0 100 100"
        [attr.width]="size"
        [attr.height]="size"
        focusable="false"
      >
        <g class="d20-faces">
          <!-- Facetas Tridimensionais do Icosaedro (D20) -->
          <polygon points="50,6 67.3,40 32.7,40" class="d20-facet d20-facet-top" />
          <polygon points="50,6 32.7,40 11.9,28" class="d20-facet d20-facet-top-left" />
          <polygon points="88.1,28 67.3,40 50,6" class="d20-facet d20-facet-top-right" />
          <polygon points="11.9,28 32.7,40 11.9,72" class="d20-facet d20-facet-mid-left" />
          <polygon points="88.1,72 67.3,40 88.1,28" class="d20-facet d20-facet-mid-right" />
          <polygon points="11.9,72 32.7,40 50,70" class="d20-facet d20-facet-bottom-left" />
          <polygon points="88.1,72 50,70 67.3,40" class="d20-facet d20-facet-bottom-right" />
          <polygon points="11.9,72 50,70 50,94" class="d20-facet d20-facet-bottom-c-left" />
          <polygon points="50,94 50,70 88.1,72" class="d20-facet d20-facet-bottom-c-right" />

          <!-- Faceta Central com Inscrição '20' -->
          <polygon points="32.7,40 67.3,40 50,70" class="d20-facet d20-facet-center" />
          <text x="50" y="52" text-anchor="middle" dominant-baseline="central" class="d20-val">20</text>
        </g>
      </svg>
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

    .d20-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      perspective: 320px;
      transform-style: preserve-3d;
      user-select: none;
      flex-shrink: 0;
    }

    .d20-svg {
      display: block;
      transform-origin: 50% 50%;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.22));
      will-change: transform;
      transition: transform 0.25s ease;
    }

    /* Facetas do D20 com estética vintage / latão dos anos 1920 */
    .d20-facet {
      stroke: var(--d20-stroke, currentColor);
      stroke-width: 2.2;
      stroke-linejoin: round;
      fill: var(--accent-gold, #c5a059);
      transition: fill 0.2s ease, opacity 0.2s ease;
    }

    .d20-facet-top { opacity: 0.95; }
    .d20-facet-top-left { opacity: 0.82; }
    .d20-facet-top-right { opacity: 0.72; }
    .d20-facet-mid-left { opacity: 0.65; }
    .d20-facet-mid-right { opacity: 0.55; }
    .d20-facet-bottom-left { opacity: 0.48; }
    .d20-facet-bottom-right { opacity: 0.42; }
    .d20-facet-bottom-c-left { opacity: 0.35; }
    .d20-facet-bottom-c-right { opacity: 0.30; }

    .d20-facet-center {
      opacity: 0.95;
      fill: var(--accent-primary, #1a4233);
    }

    .d20-val {
      font-family: 'Instrument Serif', Georgia, serif;
      font-size: 16px;
      font-weight: 700;
      fill: #f4efe6;
      letter-spacing: -0.5px;
      pointer-events: none;
    }

    /* Animação de Giro Contínuo 3D (quando spinning=true ou pai com hover) */
    .is-spinning .d20-svg {
      animation: d20-rotacao-3d 1.3s linear infinite;
    }

    @keyframes d20-rotacao-3d {
      0% {
        transform: rotateY(0deg) rotateX(14deg) rotateZ(0deg);
      }
      25% {
        transform: rotateY(90deg) rotateX(-12deg) rotateZ(5deg);
      }
      50% {
        transform: rotateY(180deg) rotateX(14deg) rotateZ(0deg);
      }
      75% {
        transform: rotateY(270deg) rotateX(-12deg) rotateZ(-5deg);
      }
      100% {
        transform: rotateY(360deg) rotateX(14deg) rotateZ(0deg);
      }
    }

    @keyframes d20-tumulto-rolagem {
      0% {
        transform: scale(0.92) rotate(0deg) rotateY(0deg) rotateX(0deg);
      }
      25% {
        transform: scale(1.18) rotate(120deg) rotateY(280deg) rotateX(40deg);
      }
      50% {
        transform: scale(1.05) rotate(240deg) rotateY(560deg) rotateX(-30deg);
      }
      75% {
        transform: scale(1.14) rotate(310deg) rotateY(840deg) rotateX(20deg);
      }
      100% {
        transform: scale(1) rotate(360deg) rotateY(1080deg) rotateX(0deg);
      }
    }
  `]
})
export class D20IconComponent {
  @Input() public size: number = 18;
  @Input() public spinning: boolean = false;
  @Input() public customClass: string = '';
}

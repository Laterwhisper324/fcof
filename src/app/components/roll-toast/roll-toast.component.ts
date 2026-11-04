import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CocStateService } from '../../services/coc-state.service';

@Component({
  selector: 'app-roll-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.toastRolagemVisivel() && svc.ultimaRolagem() && !svc.gavetaDadosAberta()) {
      <aside class="floating-roll-toast no-print" aria-live="assertive">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <div style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">
            Última Rolagem ({{ svc.ultimaRolagem()?.horario }})
          </div>
          <button
            type="button"
            class="btn btn-sm"
            style="padding:0.05rem 0.35rem; font-size:0.7rem;"
            (click)="svc.toastRolagemVisivel.set(false)"
            aria-label="Fechar notificação"
          >
            ✕
          </button>
        </div>

        <div style="font-size:0.86rem; font-weight:bold; margin-bottom:0.25rem;">
          {{ svc.ultimaRolagem()?.rotulo }}
        </div>

        <div class="roll-result-banner {{ svc.ultimaRolagem()?.avaliacao?.classeCss }}" style="margin-bottom:0.4rem; padding:0.55rem;">
          <div class="roll-d100-number" style="font-size:1.85rem;">{{ svc.ultimaRolagem()?.d100?.resultadoFinal }}</div>
          <div style="font-weight:bold; font-size:0.9rem;">{{ svc.ultimaRolagem()?.avaliacao?.rotulo }}</div>
          @if (svc.ultimaRolagem()?.d100?.tipoModificador !== 'DANO') {
            <div style="font-size:0.74rem; font-variant-numeric:tabular-nums;">
              Alvo: {{ svc.ultimaRolagem()?.avaliacao?.regular }}% | ½: {{ svc.ultimaRolagem()?.avaliacao?.dificil }}% | ⅕: {{ svc.ultimaRolagem()?.avaliacao?.extremo }}%
            </div>
          }
        </div>

        <!-- Ações Rápidas: Forçar Rolagem ou Gastar Sorte -->
        @if (!svc.ultimaRolagem()?.avaliacao?.sucesso) {
          <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
            @if (!svc.ultimaRolagem()?.forcada && !svc.ultimaRolagem()?.ehTesteSorte && !svc.ultimaRolagem()?.ehTesteSanidade) {
              <button
                type="button"
                class="btn btn-sm btn-danger"
                style="flex:1;"
                (click)="svc.forcarUltimaRolagem()"
              >
                Forçar Rolagem (Push)
              </button>
            }

            @if (svc.ultimaRolagem()?.podeGastarSorte && svc.ultimaRolagem()!.sorteParaRegular! > 0 && svc.inv().derivados.sorteAtual >= svc.ultimaRolagem()!.sorteParaRegular!) {
              <button
                type="button"
                class="btn btn-sm btn-gold"
                style="flex:1;"
                (click)="svc.gastarSorteUltimaRolagem('REGULAR')"
              >
                Gastar {{ svc.ultimaRolagem()?.sorteParaRegular }} Sorte → Regular
              </button>
            }
          </div>
        }
      </aside>
    }
  `
})
export class RollToastComponent {
  public readonly svc = inject(CocStateService);
}

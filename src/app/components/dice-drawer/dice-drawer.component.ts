import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocStateService } from '../../services/coc-state.service';

@Component({
  selector: 'app-dice-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (svc.gavetaDadosAberta()) {
      <div class="dice-drawer-backdrop no-print" (click)="svc.gavetaDadosAberta.set(false)"></div>
      <aside class="dice-drawer no-print" aria-label="Rolador 1D100 e Histórico">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--border-strong); padding-bottom:0.6rem; margin-bottom:0.85rem;">
          <h2 style="margin:0; font-family:var(--font-serif); font-size:1.25rem;">Rolador 1D100 &amp; Histórico</h2>
          <button type="button" class="btn btn-sm" (click)="svc.gavetaDadosAberta.set(false)">✕ Fechar</button>
        </div>

        <!-- Modificadores de Bônus e Penalidade -->
        <div style="margin-bottom:0.85rem;">
          <div style="font-size:0.8rem; font-weight:bold; margin-bottom:0.3rem;">Dados de Bônus / Penalidade (pág. 91):</div>
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:0.25rem;">
            @for (mod of [-2, -1, 0, 1, 2]; track mod) {
              <button
                type="button"
                class="btn btn-sm"
                [class.btn-primary]="svc.dadosBonusPenalidade() === mod"
                (click)="svc.dadosBonusPenalidade.set(mod)"
              >
                {{ mod === 0 ? '0' : (mod > 0 ? '+' + mod + 'B' : mod + 'P') }}
              </button>
            }
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary"
          style="width:100%; margin-bottom:0.85rem;"
          (click)="svc.rolarPericiaOuAtributo('Rolagem Livre 1D100', 50)"
        >
          🎲 Rolar 1D100 Livre (Alvo 50%)
        </button>

        <!-- Resultado Atual Detalhado -->
        @if (svc.ultimaRolagem()) {
          <div style="margin-bottom:1rem;">
            <div class="roll-result-banner {{ svc.ultimaRolagem()?.avaliacao?.classeCss }}">
              <div style="font-size:0.82rem; font-weight:bold;">{{ svc.ultimaRolagem()?.rotulo }}</div>
              <div class="roll-d100-number">{{ svc.ultimaRolagem()?.d100?.resultadoFinal }}</div>
              <div style="font-weight:bold; font-size:0.95rem;">{{ svc.ultimaRolagem()?.avaliacao?.rotulo }}</div>
              @if (svc.ultimaRolagem()?.d100?.tipoModificador !== 'DANO') {
                <div style="font-size:0.75rem; font-variant-numeric:tabular-nums; margin-top:0.2rem;">
                  Reg: {{ svc.ultimaRolagem()?.avaliacao?.regular }}% | Dif: {{ svc.ultimaRolagem()?.avaliacao?.dificil }}% | Ext: {{ svc.ultimaRolagem()?.avaliacao?.extremo }}%
                </div>
              }
            </div>

            <!-- Opções de Ação no Resultado -->
            @if (!svc.ultimaRolagem()?.avaliacao?.sucesso) {
              <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.45rem;">
                @if (!svc.ultimaRolagem()?.forcada && !svc.ultimaRolagem()?.ehTesteSorte && !svc.ultimaRolagem()?.ehTesteSanidade) {
                  <button type="button" class="btn btn-danger btn-sm" (click)="svc.forcarUltimaRolagem()">
                    Forçar Rolagem (Push the Roll)
                  </button>
                }

                @if (svc.ultimaRolagem()?.podeGastarSorte && svc.ultimaRolagem()!.sorteParaRegular! > 0) {
                  <button
                    type="button"
                    class="btn btn-gold btn-sm"
                    [disabled]="svc.inv().derivados.sorteAtual < svc.ultimaRolagem()!.sorteParaRegular!"
                    (click)="svc.gastarSorteUltimaRolagem('REGULAR')"
                  >
                    Gastar {{ svc.ultimaRolagem()?.sorteParaRegular }} Sorte → Regular
                  </button>
                }
              </div>
            }
          </div>
        }

        <!-- Histórico da Sessão -->
        <h3 style="font-family:var(--font-serif); font-size:1.05rem; margin:1rem 0 0.5rem; border-top:1px solid var(--border); padding-top:0.6rem;">
          Histórico da Sessão ({{ svc.historicoRolagens().length }})
        </h3>
        <div class="roll-log-list custom-scrollbar" style="max-height: 280px; overflow-y: auto;">
          @for (item of svc.historicoRolagens(); track item.id) {
            <div class="roll-log-item">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted);">
                <span>{{ item.horario }} • {{ item.investigador }}</span>
                <span>Alvo: {{ item.valorAlvo }}%</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.2rem;">
                <span style="font-weight:bold;">{{ item.rotulo }}</span>
                <span class="test-badge {{ item.avaliacao.sucesso ? 'pass' : 'fail' }}">
                  {{ item.d100.resultadoFinal }} ({{ item.avaliacao.rotulo }})
                </span>
              </div>
            </div>
          } @empty {
            <div style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.82rem;">
              Nenhuma rolagem registrada ainda nesta sessão.
            </div>
          }
        </div>
      </aside>
    }
  `
})
export class DiceDrawerComponent {
  public readonly svc = inject(CocStateService);
}

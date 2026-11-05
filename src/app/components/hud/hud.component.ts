import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocStateService } from '../../services/coc-state.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule, FormsModule, UiIconComponent],
  template: `
    <section class="hud-status-bar no-print" aria-label="Status Rápido do Investigador">
      <div class="hud-identity">
        <div class="hud-identity-name">{{ svc.inv().identidade.nome || 'Investigador Sem Nome' }}</div>
        <div class="hud-identity-sub">
          {{ svc.inv().ocupacaoNome }} • {{ svc.inv().identidade.idade }} anos • MOV {{ svc.inv().derivados.mov }}
        </div>
      </div>

      <!-- Pílula PV -->
      <div class="hud-vital-pill" [class.critical-state]="svc.inv().derivados.lesaoGrave || svc.inv().derivados.morrendo">
        <div class="hud-vital-info">
          <span class="hud-vital-label">Pontos de Vida (PV)</span>
          <span class="hud-vital-val">{{ svc.inv().derivados.pvAtual }} / {{ svc.inv().derivados.pvMax }}</span>
        </div>
        <div class="hud-vital-btns">
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('pvAtual', 'pvMax', -1)" title="-1 PV">−</button>
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('pvAtual', 'pvMax', 1)" title="+1 PV">+</button>
        </div>
      </div>

      <!-- Pílula Sanidade -->
      <div class="hud-vital-pill" [class.critical-state]="svc.inv().derivados.insanidadeTemporaria || svc.inv().derivados.insanidadeIndefinida">
        <div class="hud-vital-info">
          <button
            type="button"
            class="roll-trigger-btn hud-vital-label"
            (click)="svc.rolarPericiaOuAtributo('Sanidade (SAN)', svc.inv().derivados.sanAtual, { ehTesteSanidade: true })"
            title="Clique para Rolar Teste de Sanidade (1D100)"
          >
            Sanidade (SAN)
          </button>
          <span class="hud-vital-val">{{ svc.inv().derivados.sanAtual }} / {{ svc.inv().derivados.sanMax }}</span>
        </div>
        <div class="hud-vital-btns">
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('sanAtual', 'sanMax', -1)" title="-1 SAN">−</button>
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('sanAtual', 'sanMax', 1)" title="+1 SAN">+</button>
        </div>
      </div>

      <!-- Pílula Magia -->
      <div class="hud-vital-pill">
        <div class="hud-vital-info">
          <span class="hud-vital-label">Pontos de Magia (PM)</span>
          <span class="hud-vital-val">{{ svc.inv().derivados.pmAtual }} / {{ svc.inv().derivados.pmMax }}</span>
        </div>
        <div class="hud-vital-btns">
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('pmAtual', 'pmMax', -1)" title="-1 PM">−</button>
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('pmAtual', 'pmMax', 1)" title="+1 PM">+</button>
        </div>
      </div>

      <!-- Pílula Sorte -->
      <div class="hud-vital-pill">
        <div class="hud-vital-info">
          <button
            type="button"
            class="roll-trigger-btn hud-vital-label"
            (click)="svc.rolarPericiaOuAtributo('Sorte', svc.inv().derivados.sorteAtual, { ehTesteSorte: true })"
            title="Clique para Rolar Teste de Sorte (1D100)"
          >
            Sorte
          </button>
          <span class="hud-vital-val">{{ svc.inv().derivados.sorteAtual }}%</span>
        </div>
        <div class="hud-vital-btns">
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('sorteAtual', 'sorteInicial', -1)" title="-1 Sorte">−</button>
          <button type="button" class="hud-mini-btn" (click)="ajustarVital('sorteAtual', 'sorteInicial', 1)" title="+1 Sorte">+</button>
        </div>
      </div>

      <!-- Botão para Expandir Condições e Calculadora de Dano/Trauma -->
      <div>
        <button
          type="button"
          class="btn btn-sm"
          [class.btn-danger]="svc.painelVitaisAberto()"
          (click)="svc.painelVitaisAberto.set(!svc.painelVitaisAberto())"
          title="Expandir calculadora de Dano Único e Condições Vitais"
          style="display:inline-flex; align-items:center; gap:0.35rem;"
        >
          @if (svc.painelVitaisAberto()) {
            <app-ui-icon name="close" [size]="12"></app-ui-icon>
            <span>Fechar Dano</span>
          } @else {
            <app-ui-icon name="lightning" [size]="13"></app-ui-icon>
            <span>Dano / Condições</span>
          }
        </button>
      </div>
    </section>

    <!-- Painel Expansível de Condições & Calculadora de Dano -->
    @if (svc.painelVitaisAberto()) {
      <div class="sheet-section-box no-print" style="margin-bottom: 1rem; border: 1.5px solid var(--border-strong);">
        <div class="grid-2" style="margin-bottom: 0.75rem;">
          <!-- Calculadora de Ferimento / Golpe Único -->
          <div>
            <h4 style="margin: 0 0 0.4rem; font-size: 0.95rem;">Aplicar Ferimento / Golpe Único (PV):</h4>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input
                type="number"
                min="0"
                class="form-input"
                style="max-width: 140px;"
                placeholder="Dano em PV"
                [(ngModel)]="danoGolpeInput"
              />
              <button type="button" class="btn btn-danger btn-sm" (click)="aplicarGolpeUnico()">
                Aplicar Dano
              </button>
            </div>
            <span class="form-hint">
              Metade do PV Máximo = {{ Math.ceil(svc.inv().derivados.pvMax / 2) }} PV. Ferimento $\ge$ esse valor causa Lesão Grave (pág. 120).
            </span>
          </div>

          <!-- Perda de Sanidade -->
          <div>
            <h4 style="margin: 0 0 0.4rem; font-size: 0.95rem;">Registrar Perda de Sanidade (SAN):</h4>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input
                type="number"
                min="0"
                class="form-input"
                style="max-width: 140px;"
                placeholder="Perda SAN"
                [(ngModel)]="perdaSanInput"
              />
              <button type="button" class="btn btn-primary btn-sm" (click)="aplicarPerdaSanidade()">
                Registrar Perda
              </button>
            </div>
            <span class="form-hint">
              Perda de 5+ SAN em um único evento exige Teste de Ideia (INT) para Insanidade Temporária (pág. 154).
            </span>
          </div>
        </div>

        @if (svc.avisoVital()) {
          <div class="alert alert-warning" style="margin: 0.5rem 0 0;">
            <strong>Resultado:</strong> {{ svc.avisoVital() }}
          </div>
        }
      </div>
    }
  `
})
export class HudComponent {
  public readonly svc = inject(CocStateService);
  public readonly Math = Math;

  public danoGolpeInput = 0;
  public perdaSanInput = 0;

  public ajustarVital(campo: 'pvAtual' | 'sanAtual' | 'pmAtual' | 'sorteAtual', campoMax: string, delta: number): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      const maxVal = campoMax === 'sanMax' ? inv.derivados.sanMax : (campoMax === 'pvMax' ? inv.derivados.pvMax : (campoMax === 'pmMax' ? inv.derivados.pmMax : 99));
      let val = (inv.derivados as any)[campo] + delta;
      if (val < 0) val = 0;
      if (campo !== 'sorteAtual' && val > maxVal) val = maxVal;
      (inv.derivados as any)[campo] = val;

      if (campo === 'pvAtual' && val === 0) {
        inv.derivados.inconsciente = true;
        if (inv.derivados.lesaoGrave) inv.derivados.morrendo = true;
      }
    });
  }

  public aplicarGolpeUnico(): void {
    const inv = this.svc.inv();
    const dano = Number(this.danoGolpeInput) || 0;
    if (this.svc.R.aplicarDanoPV) {
      const res = this.svc.R.aplicarDanoPV(inv.derivados.pvAtual, inv.derivados.pvMax, dano, inv.derivados.lesaoGrave);
      this.svc.atualizarInvestigadorAtivo((curr) => {
        curr.derivados.pvAtual = res.pvNovo;
        curr.derivados.lesaoGrave = res.lesaoGrave;
        if (res.inconsciente) curr.derivados.inconsciente = true;
        if (res.morrendo) curr.derivados.morrendo = true;
      });
      this.svc.avisoVital.set(res.avisos && res.avisos.length > 0 ? res.avisos.join(' | ') : 'Dano de ' + dano + ' PV aplicado.');
    }
    this.danoGolpeInput = 0;
  }

  public aplicarPerdaSanidade(): void {
    const inv = this.svc.inv();
    const perda = Number(this.perdaSanInput) || 0;
    if (this.svc.R.aplicarPerdaSanidade) {
      const res = this.svc.R.aplicarPerdaSanidade(inv.derivados.sanAtual, perda);
      this.svc.atualizarInvestigadorAtivo((curr) => {
        curr.derivados.sanAtual = res.sanNova;
        if (res.insanidadeTemporaria) curr.derivados.insanidadeTemporaria = true;
        if (res.insanidadeIndefinida) curr.derivados.insanidadeIndefinida = true;
      });
      this.svc.avisoVital.set(res.avisos && res.avisos.length > 0 ? res.avisos.join(' | ') : 'Perda de ' + perda + ' SAN registrada.');
    }
    this.perdaSanInput = 0;
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CocStateService } from '../../services/coc-state.service';

@Component({
  selector: 'app-investigadores-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.modalAberto() === 'investigadores') {
      <div class="modal-backdrop" (click)="fechar()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:0.75rem; margin-bottom:1rem;">
            <h3 style="margin:0; font-family:var(--font-serif); font-size:1.35rem;">Investigadores Registrados</h3>
            <button type="button" class="btn btn-sm" (click)="fechar()">✕ Fechar</button>
          </div>

          <p style="font-size:0.86rem; color:var(--text-muted); margin:0 0 1rem;">
            Selecione qual investigador carregar na mesa ou gerencie seus arquivos. O salvamento é 100% automático no navegador.
          </p>

          <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.25rem;">
            @for (i of svc.investigadores(); track i.id) {
              <div
                style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem 0.85rem; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; transition:border-color 0.15s ease;"
                [style.background]="svc.investigadorAtivoId() === i.id ? 'var(--raised)' : 'var(--ground)'"
                [style.borderLeft]="svc.investigadorAtivoId() === i.id ? '4px solid var(--accent-primary)' : '1px solid var(--border)'"
                (click)="selecionar(i.id)"
              >
                <div>
                  <strong style="font-size:0.95rem;">{{ i.identidade.nome || 'Investigador Sem Nome' }}</strong>
                  <div style="font-size:0.78rem; color:var(--text-muted);">
                    {{ i.ocupacaoNome }} • {{ i.identidade.idade }} anos • PV: {{ i.derivados.pvAtual }}/{{ i.derivados.pvMax }} | SAN: {{ i.derivados.sanAtual }}
                  </div>
                </div>

                @if (svc.investigadorAtivoId() === i.id) {
                  <span class="badge-occ">ATIVO NA MESA</span>
                }
              </div>
            }
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:0.85rem;">
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="btn btn-primary btn-sm" (click)="criarNovo()">+ Novo Investigador</button>
              <button type="button" class="btn btn-sm" (click)="duplicar()">Duplicar Ativo</button>
            </div>
            <button type="button" class="btn btn-sm btn-danger" (click)="excluir()">Excluir Ativo</button>
          </div>
        </div>
      </div>
    }
  `
})
export class InvestigadoresModalComponent {
  public readonly svc = inject(CocStateService);

  public fechar(): void {
    this.svc.modalAberto.set(null);
  }

  public selecionar(id: string): void {
    this.svc.trocarInvestigadorAtivo(id);
    this.fechar();
  }

  public criarNovo(): void {
    this.svc.criarNovoInvestigador();
    this.fechar();
  }

  public duplicar(): void {
    this.svc.duplicarInvestigadorAtivo();
    this.fechar();
  }

  public excluir(): void {
    if (confirm('Deseja realmente excluir o investigador ativo? Esta ação não pode ser desfeita.')) {
      this.svc.excluirInvestigadorAtivo();
      this.fechar();
    }
  }
}

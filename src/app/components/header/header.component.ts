import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CocStateService } from '../../services/coc-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header no-print">
      <div class="header-inner">
        <!-- Logo e Identidade do Investigador Ativo -->
        <div class="brand-block">
          <div class="brand-seal" aria-hidden="true">★</div>
          <div>
            <h1 class="brand-title">Chamado de Cthulhu • 7ª Ed.</h1>
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-top:0.15rem;">
              <button
                type="button"
                class="active-inv-pill"
                (click)="abrirGerenciadorInvestigadores()"
                title="Trocar ou gerenciar investigadores salvos"
              >
                <span><strong>{{ svc.inv().identidade.nome || 'Sem Nome' }}</strong></span>
                <span style="color:var(--text-muted);">• {{ svc.inv().ocupacaoNome }}</span>
                <span style="font-size:0.7rem; color:var(--text-faint);">▼</span>
              </button>
              <span class="brand-subtitle" style="margin:0;">Dossiê &amp; Ficha Viva (1920s)</span>
            </div>
          </div>
        </div>

        <!-- Ações do Cabeçalho -->
        <div class="header-actions">
          <!-- Alternância de Modo (Assistente vs Ficha) -->
          <div class="segmented-control" role="tablist" aria-label="Modos de Visualização">
            <button
              type="button"
              class="segmented-btn"
              [class.active]="svc.modoView() === 'wizard'"
              (click)="svc.modoView.set('wizard')"
              role="tab"
              [attr.aria-selected]="svc.modoView() === 'wizard'"
            >
              Assistente de Criação
            </button>
            <button
              type="button"
              class="segmented-btn"
              [class.active]="svc.modoView() === 'sheet'"
              (click)="svc.modoView.set('sheet')"
              role="tab"
              [attr.aria-selected]="svc.modoView() === 'sheet'"
            >
              Ficha Viva
            </button>
          </div>

          <!-- Rolador 1D100 -->
          <button
            type="button"
            class="btn btn-sm"
            (click)="svc.gavetaDadosAberta.set(!svc.gavetaDadosAberta())"
            title="Abrir Rolador 1D100 e Histórico da Sessão"
          >
            🎲 1D100
          </button>

          <!-- Exportador PDF Oficial -->
          <button
            type="button"
            class="btn btn-sm btn-primary"
            (click)="svc.exportarFichaOficialPDF(false)"
            title="Exportar na Ficha Oficial Editável de 2 páginas (AcroForm dos Anos 1920)"
          >
            Exportar PDF
          </button>

          <!-- Alternador de Tema Claro / Escuro -->
          <button
            type="button"
            class="btn btn-sm"
            (click)="svc.alternarTema()"
            [title]="svc.tema() === 'dark' ? 'Mudar para Modo Claro (Papel Linho)' : 'Mudar para Modo Escuro (Gabinete Noturno)'"
            aria-label="Alternar tema de cores"
          >
            {{ svc.tema() === 'dark' ? '☀️ Claro' : '🌙 Noturno' }}
          </button>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  public readonly svc = inject(CocStateService);

  public abrirGerenciadorInvestigadores(): void {
    this.svc.modalAberto.set('investigadores');
  }
}

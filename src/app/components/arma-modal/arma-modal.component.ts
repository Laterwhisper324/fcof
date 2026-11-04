import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocStateService } from '../../services/coc-state.service';
import { ArmaInvestigador } from '../../models/coc.models';

@Component({
  selector: 'app-arma-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="modal-backdrop-blur"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-arma-title"
      >
        <div class="modal-centered-box" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="modal-close-btn"
            (click)="fechar()"
            aria-label="Fechar modal de adicionar arma"
            title="Fechar (ESC)"
          >
            ✕
          </button>

          <h3 id="modal-arma-title" style="margin: 0 0 0.5rem; font-family: var(--font-serif); font-size: 1.35rem;">
            Adicionar Arma ao Investigador
          </h3>
          <p style="margin: 0 0 1rem; font-size: 0.85rem; color: var(--text-muted);">
            Selecione uma arma clássica da Década de 1920 (Tabela XVII do Livro Básico) ou personalize as estatísticas.
          </p>

          <!-- Busca e Catálogo -->
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label class="form-label" for="busca-arma-modal">Buscar no Catálogo Oficial (Anos 1920):</label>
            <input
              #buscaInput
              id="busca-arma-modal"
              type="search"
              class="form-input"
              placeholder="Ex.: Revólver, Espingarda, Faca, Machado..."
              [ngModel]="termoBusca()"
              (ngModelChange)="termoBusca.set($event)"
            />
          </div>

          <div class="custom-scrollbar" style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 1rem; background: var(--ground);">
            @for (a of catalogoFiltrado(); track a.id) {
              <div
                (click)="selecionarDoCatalogo(a)"
                style="padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background-color 0.1s ease;"
                [style.background]="armaSelecionadaCatalogo()?.id === a.id ? 'var(--raised)' : 'transparent'"
                [style.borderLeft]="armaSelecionadaCatalogo()?.id === a.id ? '3px solid var(--accent-primary)' : 'none'"
              >
                <div>
                  <strong style="font-size: 0.88rem;">{{ a.nome }}</strong>
                  <span style="font-size: 0.74rem; color: var(--text-muted); margin-left: 0.4rem;">[{{ a.categoria }}]</span>
                  <div style="font-size: 0.76rem; color: var(--text-muted); font-variant-numeric: tabular-nums;">
                    Dano: {{ a.danoBase }} | Alcance: {{ a.alcance }} | Tiros: {{ a.disparos }} | Defeito: {{ a.defeito }}
                  </div>
                </div>
                <button type="button" class="btn btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.76rem;">
                  Preencher
                </button>
              </div>
            } @empty {
              <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                Nenhuma arma encontrada para "{{ termoBusca() }}".
              </div>
            }
          </div>

          <!-- Formulário Detalhado da Arma (Permite Ajustes / Arma Customizada) -->
          <div style="background: var(--ground); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1rem;">
            <div style="font-weight: bold; font-size: 0.88rem; margin-bottom: 0.6rem; color: var(--text-main);">
              Dados da Arma a Adicionar:
            </div>

            <div class="grid-2" style="margin-bottom: 0.6rem;">
              <div class="form-group">
                <label class="form-label">Nome da Arma:</label>
                <input type="text" class="form-input" [(ngModel)]="formNome" placeholder="Ex.: Revólver .38 Especial" />
              </div>

              <div class="form-group">
                <label class="form-label">Perícia de Combate:</label>
                <input type="text" class="form-input" [(ngModel)]="formPericiaNome" placeholder="Ex.: Armas de Fogo (Pistola) ou Lutar (Briga)" />
              </div>
            </div>

            <div class="grid-4" style="margin-bottom: 0.6rem;">
              <div class="form-group">
                <label class="form-label">Dano Base:</label>
                <input type="text" class="form-input" [(ngModel)]="formDanoBase" placeholder="1D10" />
              </div>

              <div class="form-group">
                <label class="form-label">Alcance:</label>
                <input type="text" class="form-input" [(ngModel)]="formAlcance" placeholder="15m" />
              </div>

              <div class="form-group">
                <label class="form-label">Ataques / Tiros:</label>
                <input type="text" class="form-input" [(ngModel)]="formDisparos" placeholder="1(3)" />
              </div>

              <div class="form-group">
                <label class="form-label">Munição (Capacidade):</label>
                <input type="number" min="0" max="100" class="form-input" [(ngModel)]="formMunicao" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Soma Dano Extra (DX):</label>
                <select class="form-select" [(ngModel)]="formSomaDX">
                  <option value="nenhum">Nenhum (Arma de Fogo)</option>
                  <option value="completo">+ DX Completo (Corpo a Corpo)</option>
                  <option value="metade">+ ½ DX (Metade do DX)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Defeito da Arma:</label>
                <input type="number" min="50" max="100" class="form-input" [(ngModel)]="formDefeito" placeholder="100" />
              </div>
            </div>
          </div>

          <!-- Ações do Modal -->
          <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
            <button type="button" class="btn" (click)="fechar()">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" (click)="confirmarAdicionar()" [disabled]="!formNome.trim()">
              Confirmar &amp; Adicionar Arma
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ArmaModalComponent {
  private readonly svc = inject(CocStateService);

  @ViewChild('buscaInput') buscaInputElement?: ElementRef<HTMLInputElement>;

  public readonly isOpen = computed(() => this.svc.modalAberto() === 'arma');
  public readonly termoBusca = signal<string>('');
  public readonly armaSelecionadaCatalogo = signal<any | null>(null);

  // Campos do formulário editável
  public formNome = '';
  public formPericiaNome = 'Armas de Fogo (Pistola)';
  public formDanoBase = '1D10';
  public formAlcance = '15m';
  public formDisparos = '1(3)';
  public formMunicao = 6;
  public formDefeito = 100;
  public formSomaDX: 'nenhum' | 'completo' | 'metade' = 'nenhum';
  public formCategoria = 'Armas de Fogo';

  private previouslyFocusedElement: HTMLElement | null = null;

  public readonly catalogoFiltrado = computed(() => {
    const termo = this.termoBusca().toLowerCase().trim();
    const catalogo = this.svc.ARMAS_LIVRO || [];
    if (!termo) return catalogo;
    return catalogo.filter((a: any) =>
      a.nome.toLowerCase().includes(termo) ||
      (a.categoria && a.categoria.toLowerCase().includes(termo)) ||
      (a.danoBase && a.danoBase.toLowerCase().includes(termo))
    );
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.previouslyFocusedElement = document.activeElement as HTMLElement;
        document.body.classList.add('modal-open');
        this.resetarFormulario();
        setTimeout(() => {
          this.buscaInputElement?.nativeElement?.focus();
        }, 50);
      } else {
        document.body.classList.remove('modal-open');
        if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
          this.previouslyFocusedElement.focus();
        }
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isOpen() && event.key === 'Escape') {
      event.preventDefault();
      this.fechar();
    }
  }

  public onBackdropClick(event: MouseEvent): void {
    this.fechar();
  }

  public fechar(): void {
    this.svc.modalAberto.set(null);
  }

  public selecionarDoCatalogo(arma: any): void {
    this.armaSelecionadaCatalogo.set(arma);
    this.formNome = arma.nome;
    this.formPericiaNome = arma.periciaNome || 'Armas de Fogo (Pistola)';
    this.formDanoBase = arma.danoBase || '1D10';
    this.formAlcance = arma.alcance || '15m';
    this.formDisparos = arma.disparos || '1';
    this.formMunicao = Number(arma.municao) || 0;
    this.formDefeito = Number(arma.defeito) || 100;
    this.formSomaDX = arma.somaDX || (arma.categoria === 'Corpo a Corpo' ? 'completo' : 'nenhum');
    this.formCategoria = arma.categoria || 'Geral';
  }

  private resetarFormulario(): void {
    this.termoBusca.set('');
    this.armaSelecionadaCatalogo.set(null);
    const catalogo = this.svc.ARMAS_LIVRO || [];
    if (catalogo.length > 0) {
      this.selecionarDoCatalogo(catalogo[0]);
    }
  }

  public confirmarAdicionar(): void {
    if (!this.formNome.trim()) return;

    const novaArma: ArmaInvestigador = {
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      nome: this.formNome.trim(),
      periciaNome: this.formPericiaNome.trim(),
      danoBase: this.formDanoBase.trim(),
      alcance: this.formAlcance.trim(),
      disparos: this.formDisparos.trim(),
      municao: Number(this.formMunicao) || 0,
      defeito: Number(this.formDefeito) || 100,
      somaDX: this.formSomaDX,
      categoria: this.formCategoria
    };

    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.armas = [...(inv.armas || []), novaArma];
    });

    this.fechar();
  }
}

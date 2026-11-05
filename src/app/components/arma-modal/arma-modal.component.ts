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
import { ITEM_ICON_PRESETS, ItemIconPreset, obterIconePadrao } from '../../utils/item-icons';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-arma-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, UiIconComponent],
  template: `
    @if (isOpen()) {
      <div
        class="modal-backdrop-blur"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-arma-title"
      >
        <div class="modal-centered-box custom-scrollbar" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="modal-close-btn"
            (click)="fechar()"
            aria-label="Fechar modal de item"
            title="Fechar (ESC)"
            style="display:inline-flex; align-items:center; justify-content:center;"
          >
            <app-ui-icon name="close" [size]="14"></app-ui-icon>
          </button>

          <h3 id="modal-arma-title" style="margin: 0 0 0.35rem; font-family: var(--font-serif); font-size: 1.35rem;">
            {{ isEditing() ? 'Editar Item do Arsenal' : 'Adicionar Item ao Arsenal' }}
          </h3>
          <p style="margin: 0 0 1rem; font-size: 0.85rem; color: var(--text-muted);">
            {{ isEditing() ? 'Modifique os detalhes, estatísticas e imagem do item.' : 'Selecione uma arma clássica dos Anos 1920 ou crie um equipamento customizado.' }}
          </p>

          <!-- Seletor de Tipo e Localização -->
          <div class="grid-2" style="margin-bottom: 1rem; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Tipo de Item:</label>
              <select class="form-select" [(ngModel)]="formTipoItem">
                <option value="arma">Arma de Combate (Com Rolagem de Dano/Ataque)</option>
                <option value="geral">Equipamento Geral / Ferramenta (Corda, Lanterna, etc.)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Onde Carregar:</label>
              <select class="form-select" [(ngModel)]="formLocalizacao">
                <option value="corpo">Corpo (Equipado / Em mãos - máx. 3)</option>
                <option value="mochila">Mochila (Bagagem / Reserva - máx. 6)</option>
              </select>
            </div>
          </div>

          <!-- Seção de Imagem do Item -->
          <div style="background: var(--ground); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1rem;">
            <div style="font-weight: 600; font-size: 0.88rem; margin-bottom: 0.5rem; color: var(--text-main);">
              Imagem / Ilustração do Item
            </div>

            <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
              <!-- Preview Quadrado da Imagem -->
              <div
                style="width: 84px; height: 84px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;"
              >
                @if (formImagemUrl) {
                  <img [src]="formImagemUrl" alt="Preview do item" style="max-width: 90%; max-height: 90%; object-fit: contain;" />
                } @else {
                  <span style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 0.2rem;">Sem Foto</span>
                }
              </div>

              <!-- Controles de Imagem (Upload + URL) -->
              <div style="flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 0.45rem;">
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <label class="btn btn-sm" style="cursor: pointer; margin: 0; display: inline-flex; align-items: center; gap: 0.4rem;">
                    <app-ui-icon name="folder" [size]="14"></app-ui-icon>
                    <span>Carregar Imagem Local...</span>
                    <input type="file" accept="image/*" style="display: none;" (change)="onFileSelected($event)" />
                  </label>
                  @if (formImagemUrl) {
                    <button type="button" class="btn btn-sm" (click)="formImagemUrl = ''" title="Remover imagem atual">
                      Remover Foto
                    </button>
                  }
                </div>

                <div class="form-group" style="margin: 0;">
                  <input
                    type="url"
                    class="form-input"
                    style="padding: 0.3rem 0.5rem; font-size: 0.82rem;"
                    placeholder="Ou cole o link (URL) da imagem..."
                    [(ngModel)]="formImagemUrl"
                  />
                </div>
              </div>
            </div>

            <!-- Presets Rápidos de Ilustrações dos Anos 1920 -->
            <div style="margin-top: 0.75rem;">
              <span style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">
                Ilustrações clássicas da Década de 1920 (clique para escolher):
              </span>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                @for (preset of presets; track preset.id) {
                  <button
                    type="button"
                    class="btn btn-sm"
                    style="padding: 0.2rem 0.45rem; font-size: 0.74rem;"
                    [style.borderColor]="formImagemUrl === preset.svgDataUri ? 'var(--accent-gold)' : 'var(--border)'"
                    [style.fontWeight]="formImagemUrl === preset.svgDataUri ? 'bold' : 'normal'"
                    (click)="selecionarPreset(preset)"
                    [title]="preset.nome"
                  >
                    {{ preset.nome }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Catálogo do Livro (Se for nova arma) -->
          @if (!isEditing() && formTipoItem === 'arma') {
            <div class="form-group" style="margin-bottom: 0.65rem;">
              <label class="form-label" for="busca-arma-modal">Buscar no Catálogo Oficial (Tabela XVII - Anos 1920):</label>
              <input
                #buscaInput
                id="busca-arma-modal"
                type="search"
                class="form-input"
                placeholder="Ex.: Revólver, Espingarda, Faca, Machado, Soco..."
                [ngModel]="termoBusca()"
                (ngModelChange)="termoBusca.set($event)"
              />
            </div>

            <div class="custom-scrollbar" style="max-height: 140px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 1rem; background: var(--ground);">
              @for (a of catalogoFiltrado(); track a.id) {
                <div
                  (click)="selecionarDoCatalogo(a)"
                  style="padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                  [style.background]="armaSelecionadaCatalogo()?.id === a.id ? 'var(--raised)' : 'transparent'"
                  [style.borderLeft]="armaSelecionadaCatalogo()?.id === a.id ? '3px solid var(--accent-primary)' : 'none'"
                >
                  <div>
                    <strong style="font-size: 0.88rem;">{{ a.nome }}</strong>
                    <span style="font-size: 0.74rem; color: var(--text-muted); margin-left: 0.4rem;">[{{ a.categoria }}]</span>
                    <div style="font-size: 0.76rem; color: var(--text-muted); font-variant-numeric: tabular-nums;">
                      Dano: {{ a.danoBase }} | Alcance: {{ a.alcance }} | Tiros: {{ a.disparos }}
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.76rem;">
                    Preencher
                  </button>
                </div>
              }
            </div>
          }

          <!-- Dados Detalhados do Formulário -->
          <div style="background: var(--ground); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1rem;">
            <div class="grid-2" style="margin-bottom: 0.6rem;">
              <div class="form-group">
                <label class="form-label">Nome do Item *:</label>
                <input type="text" class="form-input" [(ngModel)]="formNome" placeholder="Ex.: Revólver .38 Especial, Corda (15 metros)..." />
              </div>

              <div class="form-group">
                <label class="form-label">Categoria / Perícia:</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="formPericiaNome"
                  [placeholder]="formTipoItem === 'arma' ? 'Ex.: Armas de Fogo (Pistola) ou Lutar (Briga)' : 'Ex.: Equipamento de Exploração, Ferramenta'"
                />
              </div>
            </div>

            <!-- Campos de Combate (Se arma) -->
            @if (formTipoItem === 'arma') {
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
                  <label class="form-label">Munição Máx:</label>
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
            } @else {
              <!-- Campos de Equipamento Geral -->
              <div class="form-group">
                <label class="form-label">Observações / Efeito / Utilidade:</label>
                <textarea
                  class="form-input"
                  rows="2"
                  [(ngModel)]="formObservacoes"
                  placeholder="Ex.: Corda resistente de cânhamo, suporta até 3 pessoas simultaneamente."
                ></textarea>
              </div>
            }
          </div>

          <!-- Ações do Modal -->
          <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
            <button type="button" class="btn" (click)="fechar()">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" (click)="confirmarSalvar()" [disabled]="!formNome.trim()">
              {{ isEditing() ? 'Salvar Alterações' : 'Confirmar & Adicionar ao Arsenal' }}
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
  public readonly isEditing = computed(() => !!this.svc.armaEmEdicao());
  public readonly termoBusca = signal<string>('');
  public readonly armaSelecionadaCatalogo = signal<any | null>(null);
  public readonly presets: ItemIconPreset[] = ITEM_ICON_PRESETS;

  // Campos do formulário
  public formNome = '';
  public formTipoItem: 'arma' | 'geral' = 'arma';
  public formLocalizacao: 'corpo' | 'mochila' = 'corpo';
  public formImagemUrl = '';
  public formPericiaNome = 'Armas de Fogo (Pistola)';
  public formDanoBase = '1D10';
  public formAlcance = '15m';
  public formDisparos = '1(3)';
  public formMunicao = 6;
  public formDefeito = 100;
  public formSomaDX: 'nenhum' | 'completo' | 'metade' = 'nenhum';
  public formCategoria = 'Armas de Fogo';
  public formObservacoes = '';

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
        this.carregarOuResetarFormulario();
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
    this.svc.armaEmEdicao.set(null);
    this.svc.modalAberto.set(null);
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.formImagemUrl = String(e.target?.result || '');
      };
      reader.readAsDataURL(file);
    }
  }

  public selecionarPreset(preset: ItemIconPreset): void {
    this.formImagemUrl = preset.svgDataUri;
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
    this.formTipoItem = 'arma';

    // Se ainda não escolheu imagem customizada, sugere ícone vintage do catálogo
    if (!this.formImagemUrl || this.formImagemUrl.startsWith('data:image/svg+xml')) {
      this.formImagemUrl = obterIconePadrao(arma.nome);
    }
  }

  private carregarOuResetarFormulario(): void {
    const editando = this.svc.armaEmEdicao();
    if (editando) {
      this.formNome = editando.nome || '';
      this.formTipoItem = editando.tipoItem || (editando.danoBase && editando.danoBase !== '-' ? 'arma' : 'geral');
      this.formLocalizacao = editando.localizacao || 'corpo';
      this.formImagemUrl = editando.imagemUrl || obterIconePadrao(editando.nome);
      this.formPericiaNome = editando.periciaNome || '';
      this.formDanoBase = editando.danoBase || '-';
      this.formAlcance = editando.alcance || '-';
      this.formDisparos = editando.disparos || '1';
      this.formMunicao = Number(editando.municao) || 0;
      this.formDefeito = Number(editando.defeito) || 100;
      this.formSomaDX = editando.somaDX || 'nenhum';
      this.formCategoria = editando.categoria || 'Geral';
      this.formObservacoes = editando.observacoes || '';
    } else {
      this.termoBusca.set('');
      this.armaSelecionadaCatalogo.set(null);
      this.formTipoItem = 'arma';
      this.formLocalizacao = this.svc.localizacaoNovoItem() || 'corpo';
      this.formObservacoes = '';
      const catalogo = this.svc.ARMAS_LIVRO || [];
      if (catalogo.length > 0) {
        this.selecionarDoCatalogo(catalogo[0]);
      } else {
        this.formNome = 'Revólver .38';
        this.formPericiaNome = 'Armas de Fogo (Pistola)';
        this.formDanoBase = '1D10';
        this.formAlcance = '15m';
        this.formDisparos = '1(3)';
        this.formMunicao = 6;
        this.formDefeito = 100;
        this.formSomaDX = 'nenhum';
        this.formCategoria = 'Armas de Fogo';
        this.formImagemUrl = ITEM_ICON_PRESETS[0].svgDataUri;
      }
    }
  }

  public confirmarSalvar(): void {
    if (!this.formNome.trim()) return;

    const editando = this.svc.armaEmEdicao();
    const id = editando ? editando.id : 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    const itemSalvo: ArmaInvestigador = {
      id,
      nome: this.formNome.trim(),
      tipoItem: this.formTipoItem,
      localizacao: this.formLocalizacao,
      imagemUrl: this.formImagemUrl || obterIconePadrao(this.formNome),
      periciaNome: this.formPericiaNome.trim(),
      danoBase: this.formTipoItem === 'arma' ? this.formDanoBase.trim() : '-',
      alcance: this.formTipoItem === 'arma' ? this.formAlcance.trim() : '-',
      disparos: this.formTipoItem === 'arma' ? this.formDisparos.trim() : '-',
      municao: this.formTipoItem === 'arma' ? Number(this.formMunicao) || 0 : 0,
      defeito: this.formTipoItem === 'arma' ? Number(this.formDefeito) || 100 : 100,
      somaDX: this.formTipoItem === 'arma' ? this.formSomaDX : 'nenhum',
      categoria: this.formCategoria,
      observacoes: this.formObservacoes.trim()
    };

    this.svc.atualizarInvestigadorAtivo((inv) => {
      const lista = inv.armas || [];
      const idx = lista.findIndex((a) => a.id === id);
      if (idx >= 0) {
        lista[idx] = itemSalvo;
      } else {
        lista.push(itemSalvo);
      }
      inv.armas = [...lista];
    });

    this.fechar();
  }
}

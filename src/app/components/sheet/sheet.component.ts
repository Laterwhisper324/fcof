import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocStateService } from '../../services/coc-state.service';
import { HudComponent } from '../hud/hud.component';
import { D20IconComponent } from '../d20-icon/d20-icon.component';
import { UiIconComponent } from '../ui-icon/ui-icon.component';
import { PericiaInvestigador, ArmaInvestigador } from '../../models/coc.models';

@Component({
  selector: 'app-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, HudComponent, D20IconComponent, UiIconComponent],
  template: `
    <div class="sheet-clean-container">
      <!-- 1. HUD COMPACTO DE STATUS VITAL (Sempre Visível) -->
      <app-hud></app-hud>

      <!-- 2. BARRA DE NAVEGAÇÃO EM 6 ABAS FOCADAS -->
      <nav class="sheet-toolbar no-print" aria-label="Seções da Ficha">
        <div class="segmented-control">
          <button
            type="button"
            class="segmented-btn"
            [class.active]="svc.abaFicha() === 'resumo'"
            (click)="svc.abaFicha.set('resumo')"
          >
            Atributos &amp; Resumo
          </button>
          <button
            type="button"
            class="segmented-btn"
            [class.active]="svc.abaFicha() === 'pericias'"
            (click)="svc.abaFicha.set('pericias')"
          >
            Perícias
          </button>
          <button
            type="button"
            class="segmented-btn"
            [class.active]="svc.abaFicha() === 'combate'"
            (click)="svc.abaFicha.set('combate')"
          >
            Combate ({{ svc.inv().armas.length }})
          </button>
          <button
            type="button"
            class="segmented-btn"
            [class.active]="svc.abaFicha() === 'antecedentes'"
            (click)="svc.abaFicha.set('antecedentes')"
          >
            Antecedentes
          </button>
          <button
            type="button"
            class="segmented-btn"
            [class.active]="svc.abaFicha() === 'inventario'"
            (click)="svc.abaFicha.set('inventario')"
          >
            Inventário &amp; Finanças
          </button>
          <button
            type="button"
            class="segmented-btn"
            [class.active]="svc.abaFicha() === 'folha2p'"
            (click)="svc.abaFicha.set('folha2p')"
          >
            Folha Oficial (2P)
          </button>
        </div>

        <!-- Seletor Rápido de Dados de Bônus / Penalidade -->
        <div style="display:flex; align-items:center; gap:0.4rem; font-size:0.82rem;">
          <span style="color:var(--text-muted); font-weight:bold;">Modificador 1D100:</span>
          <select
            class="form-select"
            style="padding:0.25rem 0.5rem; font-size:0.82rem;"
            [ngModel]="svc.dadosBonusPenalidade()"
            (ngModelChange)="svc.dadosBonusPenalidade.set(+$event)"
          >
            <option [value]="-2">-2 Penalidade</option>
            <option [value]="-1">-1 Penalidade</option>
            <option [value]="0">Normal (0)</option>
            <option [value]="1">+1 Bônus</option>
            <option [value]="2">+2 Bônus</option>
          </select>
        </div>
      </nav>

      <!-- ==================== ABA 1: ATRIBUTOS & RESUMO ==================== -->
      @if (svc.abaFicha() === 'resumo') {
        <div class="deco-frame" style="margin-bottom:1.5rem;">
          <div class="sheet-top-grid">
            <!-- Características Clicáveis para Rolagem Direta -->
            <div class="sheet-section-box">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <h3 class="sheet-section-title" style="margin:0;">
                  <span>Características (Clique para Rolar 1D100)</span>
                </h3>
                <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Reg | ½ | ⅕</span>
              </div>
              <div class="live-attrs-grid">
                @for (sigla of listaSiglas; track sigla) {
                  <button
                    type="button"
                    class="live-attr-box"
                    (click)="svc.rolarPericiaOuAtributo('Teste de ' + sigla, svc.inv().atributosFinais[sigla])"
                    [attr.aria-label]="'Rolar 1D100 de ' + nomesAtributos[sigla] + ' (' + sigla + ' ' + svc.inv().atributosFinais[sigla] + '%)'"
                    [title]="'Clique para rolar 1D100 de ' + nomesAtributos[sigla] + ' (' + sigla + ': ' + svc.inv().atributosFinais[sigla] + '%)'"
                  >
                    <div class="live-attr-header">
                      <span class="live-attr-sigla">{{ sigla }}</span>
                      <span class="live-attr-nome">{{ nomesAtributos[sigla] }}</span>
                    </div>
                    <span class="live-attr-valor">{{ svc.inv().atributosFinais[sigla] }}%</span>
                    <div class="live-attr-fractions">
                      <span class="live-attr-frac-badge" title="Sucesso Difícil (metade)">½ {{ svc.mq(svc.inv().atributosFinais[sigla]).metade }}</span>
                      <span class="live-attr-frac-badge" title="Sucesso Extremo (quinto)">⅕ {{ svc.mq(svc.inv().atributosFinais[sigla]).quinto }}</span>
                    </div>
                  </button>
                }
              </div>
            </div>

            <!-- Destaques de Perícias e Combate Rápido -->
            <div>
              <!-- Perícias mais Altas -->
              <div class="sheet-section-box" style="margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                  <h3 style="margin:0; font-size:1.05rem; display:inline-flex; align-items:center; gap:0.4rem;">
                    <app-ui-icon name="elder-sign" [size]="16"></app-ui-icon>
                    <span>Perícias Mais Altas (Rolagem Rápida)</span>
                  </h3>
                  <button type="button" class="btn btn-sm" (click)="svc.abaFicha.set('pericias')">Ver Todas →</button>
                </div>
                <div class="focus-skills-grid">
                  @for (p of topPericias(); track p.id) {
                    <div class="focus-skill-card is-occ">
                      <button
                        type="button"
                        class="roll-trigger-btn"
                        (click)="svc.rolarPericiaOuAtributo(p.nome, svc.obterTotalPericiaObj(p), { periciaId: p.id })"
                        [title]="'Rolar 1D100 de ' + p.nome"
                      >
                        <strong>{{ p.nome }}</strong>
                      </button>
                      <div class="live-skill-fractions">
                        <strong>{{ svc.obterTotalPericiaObj(p) }}</strong>
                        <span>½: {{ svc.mq(svc.obterTotalPericiaObj(p)).metade }}</span>
                        <span>⅕: {{ svc.mq(svc.obterTotalPericiaObj(p)).quinto }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Dano Extra & Esquiva -->
              <div class="sheet-section-box">
                <h3 class="sheet-section-title"><span>Dano Extra, Corpo e Esquiva</span></h3>
                <div class="grid-3" style="font-size:0.86rem;">
                  <div><strong>Dano Extra:</strong> {{ svc.inv().derivados.danoExtra }}</div>
                  <div><strong>Corpo:</strong> {{ svc.inv().derivados.corpo }}</div>
                  <div>
                    <button
                      type="button"
                      class="roll-trigger-btn"
                      (click)="svc.rolarPericiaOuAtributo('Esquiva', svc.inv().derivados.esquivaBase)"
                    >
                      <strong>Esquiva:</strong> {{ svc.inv().derivados.esquivaBase }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ==================== ABA 2: PERÍCIAS (INTERATIVAS & ROLAGEM) ==================== -->
      @if (svc.abaFicha() === 'pericias') {
        <div class="deco-frame" style="margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
            <div class="filter-chips-row">
              <button
                type="button"
                class="filter-chip"
                [class.active]="svc.modoVisaoPericiasFicha() === 'destaque'"
                (click)="svc.modoVisaoPericiasFicha.set('destaque')"
                style="display:inline-flex; align-items:center; gap:0.35rem;"
              >
                <app-ui-icon name="elder-sign" [size]="13"></app-ui-icon>
                <span>Perícias em Destaque ({{ periciasDestaque().length }})</span>
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.active]="svc.modoVisaoPericiasFicha() === 'todas'"
                (click)="svc.modoVisaoPericiasFicha.set('todas')"
              >
                Todas as Perícias ({{ svc.inv().pericias.length }})
              </button>
            </div>

            <input
              type="search"
              class="form-input"
              style="max-width:240px; padding:0.35rem 0.6rem; font-size:0.85rem;"
              placeholder="Buscar perícia na ficha..."
              [ngModel]="svc.buscaPericiaFicha()"
              (ngModelChange)="svc.buscaPericiaFicha.set($event)"
            />
          </div>

          <div class="focus-skills-grid">
            @for (p of periciasExibidasFicha(); track p.id) {
              <div class="focus-skill-card" [class.is-occ]="svc.ehPericiaOcupacional(svc.inv(), p)">
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <input
                    type="checkbox"
                    class="skill-check-mark"
                    [checked]="p.marcada"
                    (change)="alternarMarcada(p)"
                    title="Marcar para desenvolvimento (teste de aumento após a sessão)"
                  />
                  <button
                    type="button"
                    class="roll-trigger-btn"
                    (click)="svc.rolarPericiaOuAtributo(p.nome, svc.obterTotalPericiaObj(p), { periciaId: p.id })"
                    [title]="'Rolar 1D100 de ' + p.nome + ' (' + svc.obterTotalPericiaObj(p) + ')'"
                  >
                    <strong>{{ p.nome }}</strong>
                  </button>
                </div>
                <div class="live-skill-fractions">
                  <strong>{{ svc.obterTotalPericiaObj(p) }}</strong>
                  <span>½: {{ svc.mq(svc.obterTotalPericiaObj(p)).metade }}</span>
                  <span>⅕: {{ svc.mq(svc.obterTotalPericiaObj(p)).quinto }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ==================== ABA 3: COMBATE & ARMAS (TAREFA 7 - MODAL CENTRALIZADO) ==================== -->
      @if (svc.abaFicha() === 'combate') {
        <div class="deco-frame sheet-tab-content" style="margin-bottom:1.5rem;">
          <!-- Barra de Título do Arsenal (Tag ARSENAL + Botão + ITEM) -->
          <div class="arsenal-header">
            <div class="arsenal-badge-tag">
              ARSENAL
            </div>
            <button type="button" class="btn btn-primary btn-sm" (click)="abrirModalNovoItem('corpo')">
              + ITEM
            </button>
          </div>

          <!-- Seção 1: CORPO (3/3) -->
          <div class="arsenal-category-header">
            <span class="arsenal-category-bar"></span>
            <span>CORPO ({{ itensCorpo().length }}/3)</span>
          </div>

          <div class="arsenal-grid">
            @for (item of itensCorpo(); track item.id) {
              <div class="arsenal-card">
                <!-- Imagem do item / arma -->
                <div class="arsenal-img-container" (click)="trocarImagemItem(item)" title="Clique para trocar imagem">
                  @if (item.imagemUrl) {
                    <img [src]="item.imagemUrl" [alt]="item.nome" loading="lazy" />
                  } @else {
                    <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; display:flex; flex-direction:column; align-items:center; gap:0.2rem;">
                      <app-ui-icon name="camera" [size]="18"></app-ui-icon>
                      <span>+ Imagem</span>
                    </div>
                  }
                  <div class="arsenal-img-overlay">
                    <span style="display:inline-flex; align-items:center; gap:0.3rem;"><app-ui-icon name="camera" [size]="14"></app-ui-icon> Trocar Imagem</span>
                  </div>
                </div>

                <!-- Informações em baixo -->
                <div class="arsenal-card-body">
                  <div class="arsenal-item-title" [title]="item.nome">{{ item.nome }}</div>
                  <div class="arsenal-item-meta">
                    @if (item.tipoItem !== 'geral' && item.danoBase && item.danoBase !== '-') {
                      <span><strong>Dano:</strong> {{ item.danoBase }} | {{ item.alcance }}</span>
                    } @else {
                      <span>{{ item.observacoes || item.categoria || 'Equipamento' }}</span>
                    }
                  </div>
                </div>

                <!-- Ações do Card (Dado/Ação, Editar, Excluir) -->
                <div class="arsenal-card-footer">
                  <button
                    type="button"
                    class="arsenal-action-btn btn-roll"
                    (click)="executarAcaoItem(item)"
                    [title]="item.tipoItem !== 'geral' && item.danoBase && item.danoBase !== '-' ? 'Rolar Dano (' + item.danoBase + ')' : 'Inspecionar Item'"
                  >
                    <app-d20-icon [size]="15"></app-d20-icon>
                  </button>
                  <button
                    type="button"
                    class="arsenal-action-btn"
                    (click)="editarItem(item)"
                    title="Editar dados e imagem do item"
                  >
                    <app-ui-icon name="pen" [size]="14"></app-ui-icon>
                  </button>
                  <button
                    type="button"
                    class="arsenal-action-btn btn-delete"
                    (click)="removerArma(item.id)"
                    title="Remover item do inventário"
                  >
                    <app-ui-icon name="trash" [size]="14"></app-ui-icon>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="arsenal-empty-slot" (click)="abrirModalNovoItem('corpo')" style="grid-column: 1 / -1; height: 120px;" title="Clique para equipar um item no corpo">
                <span style="font-size:1.2rem; color:var(--text-faint);">+</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">Nenhum item equipado no corpo. Clique para equipar.</span>
              </div>
            }
          </div>

          <!-- Seção 2: MOCHILA (0/6) -->
          <div class="arsenal-category-header" style="margin-top:1.5rem;">
            <span class="arsenal-category-bar"></span>
            <span>MOCHILA ({{ itensMochila().length }}/6)</span>
          </div>

          <div class="arsenal-grid">
            @for (item of itensMochila(); track item.id) {
              <div class="arsenal-card">
                <div class="arsenal-img-container" (click)="trocarImagemItem(item)" title="Clique para trocar imagem">
                  @if (item.imagemUrl) {
                    <img [src]="item.imagemUrl" [alt]="item.nome" loading="lazy" />
                  } @else {
                    <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; display:flex; flex-direction:column; align-items:center; gap:0.2rem;">
                      <app-ui-icon name="camera" [size]="18"></app-ui-icon>
                      <span>+ Imagem</span>
                    </div>
                  }
                  <div class="arsenal-img-overlay">
                    <span style="display:inline-flex; align-items:center; gap:0.3rem;"><app-ui-icon name="camera" [size]="14"></app-ui-icon> Trocar Imagem</span>
                  </div>
                </div>

                <div class="arsenal-card-body">
                  <div class="arsenal-item-title" [title]="item.nome">{{ item.nome }}</div>
                  <div class="arsenal-item-meta">
                    @if (item.tipoItem !== 'geral' && item.danoBase && item.danoBase !== '-') {
                      <span><strong>Dano:</strong> {{ item.danoBase }} | {{ item.alcance }}</span>
                    } @else {
                      <span>{{ item.observacoes || item.categoria || 'Equipamento' }}</span>
                    }
                  </div>
                </div>

                <div class="arsenal-card-footer">
                  <button
                    type="button"
                    class="arsenal-action-btn btn-roll"
                    (click)="executarAcaoItem(item)"
                    [title]="item.tipoItem !== 'geral' && item.danoBase && item.danoBase !== '-' ? 'Rolar Dano (' + item.danoBase + ')' : 'Inspecionar Item'"
                  >
                    <app-d20-icon [size]="15"></app-d20-icon>
                  </button>
                  <button
                    type="button"
                    class="arsenal-action-btn"
                    (click)="editarItem(item)"
                    title="Editar dados e imagem do item"
                  >
                    <app-ui-icon name="pen" [size]="14"></app-ui-icon>
                  </button>
                  <button
                    type="button"
                    class="arsenal-action-btn btn-delete"
                    (click)="removerArma(item.id)"
                    title="Remover item da mochila"
                  >
                    <app-ui-icon name="trash" [size]="14"></app-ui-icon>
                  </button>
                </div>
              </div>
            }

            <!-- Slots vazios da mochila (iguais aos da imagem de referência) -->
            @for (slot of slotsVaziosMochila(); track $index) {
              <div class="arsenal-empty-slot" (click)="abrirModalNovoItem('mochila')" title="Clique para adicionar item à mochila">
                <span style="font-size:1.5rem; color:var(--text-faint);">+</span>
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Vazio</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- ==================== ABA 4: ANTECEDENTES & LORE ==================== -->
      @if (svc.abaFicha() === 'antecedentes') {
        <div class="deco-frame" style="margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">
            <h3 style="margin:0; font-family:var(--font-serif); font-size:1.25rem;">Antecedentes &amp; Registros Pessoais</h3>
            <span class="badge-occ" style="background:var(--accent-gold); color:#101214;">
              Conexão-Chave: {{ svc.inv().antecedentes.conexaoChave }}
            </span>
          </div>

          <div class="lore-accordion-grid">
            @for (c of svc.CAMPOS_ANTECEDENTES; track c.chave) {
              <div class="lore-card" [class.is-key-connection]="svc.inv().antecedentes.conexaoChave === c.titulo">
                <div class="lore-card-header" (click)="alternarLore(c.chave)">
                  <strong>{{ c.titulo }}</strong>
                  @if (loreAberto() === c.chave) {
                    <span style="font-size:0.8rem; color:var(--text-muted); display:inline-flex; align-items:center; gap:0.25rem;">
                      <app-ui-icon name="chevron-up" [size]="12"></app-ui-icon> Fechar
                    </span>
                  } @else {
                    <span style="font-size:0.8rem; color:var(--text-muted); display:inline-flex; align-items:center; gap:0.25rem;">
                      <app-ui-icon name="chevron-down" [size]="12"></app-ui-icon> Editar
                    </span>
                  }
                </div>
                @if (loreAberto() !== c.chave) {
                  <div class="lore-card-preview" (click)="alternarLore(c.chave)">
                    {{ svc.inv().antecedentes[c.chave] || 'Sem anotações registradas. Clique para adicionar.' }}
                  </div>
                } @else {
                  <div class="lore-card-editor">
                    <textarea
                      class="form-input"
                      rows="3"
                      [placeholder]="c.dica"
                      [ngModel]="svc.inv().antecedentes[c.chave]"
                      (ngModelChange)="atualizarLore(c.chave, $event)"
                    ></textarea>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ==================== ABA 5: INVENTÁRIO & FINANÇAS ==================== -->
      @if (svc.abaFicha() === 'inventario') {
        <div class="deco-frame" style="margin-bottom:1.5rem;">
          <div class="sheet-section-box" style="margin-bottom:1rem;">
            <h3 style="margin:0 0 0.5rem; font-family:var(--font-serif); font-size:1.2rem;">
              Finanças (Nível de Crédito: {{ svc.totaisPericias().nivelCredito }})
            </h3>
            <div class="grid-3" style="font-size:0.88rem;">
              <div><strong>Nível de Gastos:</strong> \${{ svc.inv().financas.nivelGastos }}</div>
              <div><strong>Dinheiro em Caixa:</strong> \${{ svc.inv().financas.dinheiro }}</div>
              <div><strong>Patrimônio Total:</strong> \${{ svc.inv().financas.patrimonio }}</div>
            </div>
          </div>

          <div class="sheet-section-box">
            <h3 style="margin:0 0 0.75rem; font-family:var(--font-serif); font-size:1.2rem;">Equipamentos &amp; Bens Carregados</h3>
            <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem;">
              <input
                type="text"
                class="form-input"
                placeholder="Adicionar novo item ao inventário..."
                [(ngModel)]="novoItemInput"
                (keydown.enter)="adicionarItem()"
              />
              <button type="button" class="btn btn-primary" (click)="adicionarItem()">+ Item</button>
            </div>
            <ul style="margin:0; padding-left:1.2rem; font-size:0.88rem; line-height:1.6;">
              @for (item of svc.inv().equipamentos; track $index) {
                <li style="display:flex; justify-content:space-between; align-items:center; padding:0.25rem 0;">
                  <span>{{ item }}</span>
                  <button type="button" class="btn btn-sm btn-danger" style="padding:0.15rem 0.4rem; font-size:0.7rem; display:inline-flex; align-items:center;" (click)="removerItem($index)" title="Remover item">
                    <app-ui-icon name="close" [size]="10"></app-ui-icon>
                  </button>
                </li>
              }
            </ul>
          </div>
        </div>
      }

      <!-- ==================== ABA 6: FOLHA OFICIAL 2 PÁGINAS A4 ==================== -->
      @if (svc.abaFicha() === 'folha2p') {
        <div class="deco-frame print-only-sheet" style="margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-strong); padding-bottom:0.75rem;">
            <div>
              <h2 style="margin:0; font-family:var(--font-serif); font-size:1.5rem;">Dossiê do Investigador — Anos 1920</h2>
              <span style="font-size:0.82rem; color:var(--text-muted);">Chamado de Cthulhu 7ª Edição • Miskatonic University Archives</span>
            </div>
            <button type="button" class="btn btn-primary btn-sm no-print" (click)="svc.exportarFichaOficialPDF(false)">
              Exportar PDF Oficial (AcroForm)
            </button>
          </div>

          <div class="grid-3" style="font-size:0.86rem; margin-bottom:1rem;">
            <div><strong>Nome:</strong> {{ svc.inv().identidade.nome || 'Sem Nome' }}</div>
            <div><strong>Ocupação:</strong> {{ svc.inv().ocupacaoNome }}</div>
            <div><strong>Idade:</strong> {{ svc.inv().identidade.idade }} anos</div>
          </div>
        </div>
      }
    </div>
  `
})
export class SheetComponent {
  public readonly svc = inject(CocStateService);

  public readonly listaSiglas = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'];
  public readonly nomesAtributos: Record<string, string> = {
    FOR: 'Força',
    CON: 'Constituição',
    TAM: 'Tamanho',
    DES: 'Destreza',
    APA: 'Aparência',
    INT: 'Inteligência',
    POD: 'Poder',
    EDU: 'Educação'
  };
  public readonly loreAberto = signal<string | null>(null);
  public novoItemInput = '';

  public readonly topPericias = computed(() => {
    const inv = this.svc.inv();
    if (!inv || !inv.pericias) return [];
    return [...inv.pericias]
      .sort((a, b) => this.svc.obterTotalPericiaObj(b) - this.svc.obterTotalPericiaObj(a))
      .slice(0, 8);
  });

  public readonly periciasDestaque = computed(() => {
    const inv = this.svc.inv();
    if (!inv || !inv.pericias) return [];
    return inv.pericias.filter((p) => {
      const tot = this.svc.obterTotalPericiaObj(p);
      return this.svc.ehPericiaOcupacional(inv, p) || p.marcada || tot >= 25;
    });
  });

  public readonly periciasExibidasFicha = computed(() => {
    const inv = this.svc.inv();
    const busca = this.svc.buscaPericiaFicha().toLowerCase().trim();
    const modo = this.svc.modoVisaoPericiasFicha();

    return (inv.pericias || []).filter((p) => {
      if (busca) return p.nome.toLowerCase().includes(busca);
      if (modo === 'destaque') {
        const tot = this.svc.obterTotalPericiaObj(p);
        return this.svc.ehPericiaOcupacional(inv, p) || p.marcada || tot >= 25;
      }
      return true;
    });
  });

  public alternarMarcada(p: PericiaInvestigador): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      const per = (inv.pericias || []).find((x) => x.id === p.id);
      if (per) per.marcada = !per.marcada;
    });
  }

  public alternarLore(chave: string): void {
    this.loreAberto.set(this.loreAberto() === chave ? null : chave);
  }

  public atualizarLore(chave: string, val: string): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.antecedentes[chave] = val;
    });
  }

    public readonly itensCorpo = computed(() => {
    return (this.svc.inv().armas || []).filter((w) => (w.localizacao || 'corpo') === 'corpo');
  });

  public readonly itensMochila = computed(() => {
    return (this.svc.inv().armas || []).filter((w) => w.localizacao === 'mochila');
  });

  public readonly slotsVaziosMochila = computed(() => {
    const qtd = this.itensMochila().length;
    const faltam = Math.max(1, 6 - qtd);
    return new Array(faltam);
  });

  public abrirModalNovoItem(localizacao: 'corpo' | 'mochila' = 'corpo'): void {
    this.svc.armaEmEdicao.set(null);
    this.svc.localizacaoNovoItem.set(localizacao);
    this.svc.modalAberto.set('arma');
  }

  public editarItem(item: ArmaInvestigador): void {
    this.svc.armaEmEdicao.set({ ...item });
    this.svc.modalAberto.set('arma');
  }

  public executarAcaoItem(item: ArmaInvestigador): void {
    if (item.danoBase && item.danoBase !== '-') {
      this.svc.rolarDanoArma(item);
    } else if (item.periciaNome) {
      this.svc.rolarAtaqueArma(item);
    } else {
      this.svc.rolarPericiaOuAtributo('Inspecionar / Usar ' + item.nome, 50);
    }
  }

  public trocarImagemItem(item: ArmaInvestigador): void {
    this.editarItem(item);
  }

  public abrirModalArma(): void {
    this.svc.modalAberto.set('arma');
  }

  public removerArma(id: string): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.armas = (inv.armas || []).filter((w) => w.id !== id);
    });
  }

  public adicionarItem(): void {
    const txt = this.novoItemInput.trim();
    if (!txt) return;
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.equipamentos = [...(inv.equipamentos || []), txt];
    });
    this.novoItemInput = '';
  }

  public removerItem(idx: number): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.equipamentos = (inv.equipamentos || []).filter((_, i) => i !== idx);
    });
  }
}

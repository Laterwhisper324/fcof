import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocStateService } from '../../services/coc-state.service';
import { HudComponent } from '../hud/hud.component';
import { PericiaInvestigador, ArmaInvestigador } from '../../models/coc.models';

@Component({
  selector: 'app-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, HudComponent],
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
                  <h3 style="margin:0; font-size:1.05rem;">⭐ Perícias Mais Altas (Rolagem Rápida)</h3>
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
                        <strong>{{ svc.obterTotalPericiaObj(p) }}%</strong>
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
                      <strong>Esquiva:</strong> {{ svc.inv().derivados.esquivaBase }}%
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
              >
                ⭐ Perícias em Destaque ({{ periciasDestaque().length }})
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
                    [title]="'Rolar 1D100 de ' + p.nome + ' (' + svc.obterTotalPericiaObj(p) + '%)'"
                  >
                    <strong>{{ p.nome }}</strong>
                  </button>
                </div>
                <div class="live-skill-fractions">
                  <strong>{{ svc.obterTotalPericiaObj(p) }}%</strong>
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
        <div class="deco-frame" style="margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
            <div>
              <h3 style="margin:0; font-family:var(--font-serif); font-size:1.25rem;">Arsenal e Ações de Combate</h3>
              <span style="font-size:0.84rem; color:var(--text-muted);">Clique no botão de Dano para rolar dados diretamente na mesa.</span>
            </div>

            <!-- Botão que abre o Modal Centralizado (Tarefa 7) -->
            <button type="button" class="btn btn-primary btn-sm" (click)="abrirModalArma()">
              + Adicionar Arma
            </button>
          </div>

          <div class="skills-table-wrapper custom-scrollbar">
            <table class="skills-table">
              <thead>
                <tr>
                  <th>Arma</th>
                  <th>Perícia</th>
                  <th>Dano Base</th>
                  <th>Alcance</th>
                  <th>Tiros</th>
                  <th>Munição</th>
                  <th>Defeito</th>
                  <th>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                @for (w of svc.inv().armas; track w.id) {
                  <tr>
                    <td><strong>{{ w.nome }}</strong></td>
                    <td>{{ w.periciaNome }}</td>
                    <td style="font-variant-numeric:tabular-nums; font-weight:bold;">{{ w.danoBase }}</td>
                    <td>{{ w.alcance }}</td>
                    <td>{{ w.disparos }}</td>
                    <td style="font-variant-numeric:tabular-nums;">{{ w.municao }}</td>
                    <td style="font-variant-numeric:tabular-nums;">{{ w.defeito }}</td>
                    <td style="white-space:nowrap;">
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        style="padding:0.15rem 0.5rem; font-size:0.74rem; margin-right:0.3rem;"
                        (click)="svc.rolarDanoArma(w)"
                        title="Rolar Dano da Arma com 1 Clique"
                      >
                        🎲 Dano
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        style="padding:0.15rem 0.45rem; font-size:0.74rem;"
                        (click)="removerArma(w.id)"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
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
                  <span style="font-size:0.8rem; color:var(--text-muted);">
                    {{ loreAberto() === c.chave ? '▲ Fechar' : '▼ Editar' }}
                  </span>
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
              Finanças (Nível de Crédito: {{ svc.totaisPericias().nivelCredito }}%)
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
                  <button type="button" class="btn btn-sm btn-danger" style="padding:0.1rem 0.4rem; font-size:0.7rem;" (click)="removerItem($index)">✕</button>
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

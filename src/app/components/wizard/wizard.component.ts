import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocStateService } from '../../services/coc-state.service';
import { D20IconComponent } from '../d20-icon/d20-icon.component';
import { UiIconComponent } from '../ui-icon/ui-icon.component';
import { PericiaInvestigador, ArmaInvestigador } from '../../models/coc.models';

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, D20IconComponent, UiIconComponent],
  template: `
    <main class="wizard-container" aria-label="Assistente de Criação de Investigador">
      <!-- Barra de Progresso e Navegação dos 9 Passos -->
      <nav class="wizard-steps-nav no-print" aria-label="Etapas da Criação">
        <ol class="wizard-steps-list">
          @for (step of etapas; track step.num) {
            <li class="wizard-step-item">
              <button
                type="button"
                class="wizard-step-btn"
                [class.active]="svc.etapaWizard() === step.num"
                [class.completed]="svc.etapaWizard() > step.num"
                (click)="svc.etapaWizard.set(step.num)"
              >
                <span class="step-num">{{ step.num }}</span>
                <span class="step-name">{{ step.curto }}</span>
              </button>
            </li>
          }
        </ol>
        <div class="wizard-progress-bar-track" aria-hidden="true">
          <div class="wizard-progress-bar-fill" [style.width]="((svc.etapaWizard() / 9) * 100) + '%'"></div>
        </div>
      </nav>

      <div class="deco-frame" style="margin-bottom: 2rem;">
        <!-- Cabeçalho da Etapa Atual -->
        <header class="step-header">
          <h2 class="step-title">{{ etapaAtualInfo().titulo }}</h2>
          <p class="step-desc">{{ etapaAtualInfo().descricao }}</p>
        </header>

        <!-- ==================== ETAPA 1: CONCEITO & IDENTIDADE ==================== -->
        @if (svc.etapaWizard() === 1) {
          <div class="step-content">
            <div class="grid-3" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label" for="w-nome">Nome do Investigador *</label>
                <input
                  id="w-nome"
                  type="text"
                  class="form-input"
                  placeholder="Ex.: Harvey Walters, Edward Derby..."
                  [ngModel]="svc.inv().identidade.nome"
                  (ngModelChange)="atualizarIdentidade('nome', $event)"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="w-jogador">Nome do Jogador</label>
                <input
                  id="w-jogador"
                  type="text"
                  class="form-input"
                  placeholder="Seu nome ou apelido"
                  [ngModel]="svc.inv().identidade.jogador"
                  (ngModelChange)="atualizarIdentidade('jogador', $event)"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="w-idade">Idade (15 a 90 anos) *</label>
                <input
                  id="w-idade"
                  type="number"
                  min="15"
                  max="90"
                  class="form-input"
                  [ngModel]="svc.inv().identidade.idade"
                  (ngModelChange)="atualizarIdade($event)"
                />
                <span class="form-hint">{{ regraIdade().rotulo }}</span>
              </div>
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label" for="w-sexo">Gênero / Pronomes</label>
                <input
                  id="w-sexo"
                  type="text"
                  class="form-input"
                  placeholder="Ex.: Masculino, Feminino..."
                  [ngModel]="svc.inv().identidade.sexo"
                  (ngModelChange)="atualizarIdentidade('sexo', $event)"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="w-residencia">Residência Atual</label>
                <input
                  id="w-residencia"
                  type="text"
                  class="form-input"
                  placeholder="Ex.: Boston, Arkham, Providence..."
                  [ngModel]="svc.inv().identidade.residencia"
                  (ngModelChange)="atualizarIdentidade('residencia', $event)"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="w-nascimento">Local de Nascimento</label>
                <input
                  id="w-nascimento"
                  type="text"
                  class="form-input"
                  placeholder="Ex.: Massachusetts, Londres..."
                  [ngModel]="svc.inv().identidade.localNascimento"
                  (ngModelChange)="atualizarIdentidade('localNascimento', $event)"
                />
              </div>
            </div>
          </div>
        }

        <!-- ==================== ETAPA 2: CARACTERÍSTICAS (TAREFA 1) ==================== -->
        @if (svc.etapaWizard() === 2) {
          <div class="step-content">
            <!-- Barra de Ações Rápidas de Rolagem -->
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1.25rem; background:var(--ground); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border);">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <button type="button" class="btn btn-primary btn-roll" (click)="rolarTodosAtributos()" title="Rolar todos os 8 atributos com as fórmulas canônicas" style="display:inline-flex; align-items:center; gap:0.4rem;">
                  <app-d20-icon [size]="16" [spinning]="svc.rolandoDado()"></app-d20-icon>
                  <span>Rolar Todos os Atributos</span>
                </button>
                <button type="button" class="btn" (click)="aplicarArranjoPadrao()" title="Aplicar conjunto fixo: 40, 50, 50, 50, 60, 60, 70, 80">
                  Conjunto Rápido Padrão
                </button>
              </div>
              <div style="font-size:0.82rem; color:var(--text-muted);">
                Regras oficiais págs. 30–31: <strong>FOR, CON, DES, APA, POD</strong> usam <code>3d6×5</code> | <strong>TAM, INT, EDU</strong> usam <code>(2d6+6)×5</code>.
              </div>
            </div>

            <!-- Grade dos 8 Atributos com Rótulo Visível, Ícone e Fórmula (Tarefa 1) -->
            <div class="attrs-grid">
              @for (atr of atributosDef; track atr.sigla) {
                <div class="attr-card">
                  <div class="attr-card-header">
                    <div>
                      <span class="attr-sigla">{{ atr.sigla }}</span>
                      <div style="font-size:0.82rem; color:var(--text-muted); font-weight:500;">{{ atr.nome }}</div>
                    </div>
                    <span class="attr-formula-badge" title="Fórmula de rolagem: {{ atr.formula }}">{{ atr.formula }}</span>
                  </div>

                  <div class="attr-main-row" style="margin: 0.4rem 0;">
                    <!-- Input Numérico Direto -->
                    <input
                      type="number"
                      min="15"
                      max="99"
                      step="1"
                      class="attr-value-input"
                      [attr.aria-label]="atr.nome + ' Base'"
                      [ngModel]="svc.inv().atributosBase[atr.sigla]"
                      (ngModelChange)="atualizarAtributoBase(atr.sigla, $event)"
                    />

                    <!-- Frações ½ e ⅕ -->
                    <div class="coc-fraction-boxes" title="Metade (Difícil) e Quinto (Extremo)">
                      <div class="coc-fraction-box">
                        <span class="coc-fraction-label">½</span>
                        <span class="coc-fraction-val">{{ svc.mq(svc.inv().atributosBase[atr.sigla]).metade }}</span>
                      </div>
                      <div class="coc-fraction-box">
                        <span class="coc-fraction-label">⅕</span>
                        <span class="coc-fraction-val">{{ svc.mq(svc.inv().atributosBase[atr.sigla]).quinto }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Botão de Rolagem Individual com Rótulo Visível, Ícone, Aria-label e Tooltip (Tarefa 1) -->
                  <button
                    type="button"
                    class="btn btn-sm btn-roll"
                    style="width: 100%; margin-top: 0.35rem; font-size: 0.78rem; display:inline-flex; align-items:center; justify-content:center; gap:0.35rem;"
                    (click)="rolarAtributoUnico(atr)"
                    [attr.aria-label]="'Rolar ' + atr.nome + ' (' + atr.sigla + ') usando a fórmula ' + atr.formula"
                    [title]="'Clique para rolar ' + atr.sigla + ' usando ' + atr.formula + ' (' + atr.descricao + ')'"
                  >
                    <app-d20-icon [size]="14"></app-d20-icon>
                    <span>Rolar {{ atr.sigla }} ({{ atr.formula }})</span>
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- ==================== ETAPA 3: IDADE & SORTE — CARD UNIFICADO (TAREFA 2) ==================== -->
        @if (svc.etapaWizard() === 3) {
          <div class="step-content">
            <!-- Card Unificado Sem Abas Divididas -->
            <div class="sheet-section-box" style="padding: 1.25rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:0.75rem; margin-bottom:1.15rem;">
                <h3 style="margin:0; font-family:var(--font-serif); font-size:1.25rem;">
                  Modificadores de Idade &amp; Sorte Inicial ({{ svc.inv().identidade.idade }} anos)
                </h3>
                <span class="attr-formula-badge" style="font-size:0.85rem;">{{ regraIdade().rotulo }}</span>
              </div>

              <!-- SEÇÃO 1: EDUCAÇÃO (EDU) -->
              <div style="margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px dashed var(--border);">
                <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 0.35rem; color: var(--text-main);">
                  1. Ajuste de Educação (EDU Base: {{ svc.inv().atributosBase['EDU'] }} → Final: {{ svc.inv().atributosFinais['EDU'] }}%)
                </div>

                @if (regraIdade().penalidadeEDU > 0) {
                  <div class="alert alert-warning" style="margin-bottom: 0.65rem;">
                    Jovens de 15 a 19 anos sofrem redução automática de <strong>-5 pontos em EDU</strong> (EDU Final: <strong>{{ svc.inv().atributosFinais['EDU'] }}%</strong>).
                  </div>
                } @else {
                  <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                    <div style="font-size:0.86rem; color:var(--text-muted);">
                      Sua faixa etária concede <strong>{{ regraIdade().testesMelhoriaEDU }} teste(s) de melhoria de EDU</strong> (Role 1D100; se for maior que EDU atual, adicione +1D10).
                    </div>
                    <button type="button" class="btn btn-primary btn-sm btn-roll" (click)="rolarTestesMelhoriaEDU()" style="display:inline-flex; align-items:center; gap:0.4rem;">
                      <app-d20-icon [size]="15" [spinning]="svc.rolandoDado()"></app-d20-icon>
                      <span>Rolar {{ regraIdade().testesMelhoriaEDU }} Teste(s) de EDU</span>
                    </button>
                  </div>

                  <div class="form-group" style="max-width:260px; margin-bottom:0.6rem;">
                    <label class="form-label">Bônus Ganho em EDU:</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      class="form-input"
                      [ngModel]="svc.inv().idadeAjustes.ganhoEDU"
                      (ngModelChange)="atualizarAjusteIdade('ganhoEDU', $event)"
                    />
                  </div>

                  @if (svc.inv().idadeAjustes.historicoTestesEDU && svc.inv().idadeAjustes.historicoTestesEDU!.length > 0) {
                    <div class="alert alert-success" style="font-size:0.82rem; padding:0.55rem 0.85rem;">
                      <strong>Histórico das Rolagens de EDU:</strong>
                      <ul style="margin:0.25rem 0 0; padding-left:1.2rem; font-variant-numeric:tabular-nums;">
                        @for (h of svc.inv().idadeAjustes.historicoTestesEDU; track $index) {
                          <li>
                            Teste #{{ h.teste }}: 1D100 = {{ h.d100 }} → {{ h.melhorou ? ('MELHOROU +' + h.ganho + '% (Novo: ' + h.eduNova + '%)') : 'Não superou' }}
                          </li>
                        }
                      </ul>
                    </div>
                  }
                }
              </div>

              <!-- SEÇÃO 2: PENALIDADE FÍSICA E APARÊNCIA -->
              <div style="margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px dashed var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                  <div style="font-weight: bold; font-size: 0.95rem; color: var(--text-main);">
                    2. Penalidades Físicas e Redução de Aparência (APA)
                  </div>
                  <span class="attr-formula-badge">
                    Total Reduzido: {{ somaReducaoFisica() }} / {{ regraIdade().penalidadeFisicaTotal }} pts
                  </span>
                </div>

                @if (regraIdade().penalidadeFisicaTotal === 0) {
                  <div class="alert alert-success" style="font-size:0.86rem; margin:0;">
                    Investigadores entre 20 e 39 anos não sofrem penalidades físicas nem redução de Aparência.
                  </div>
                } @else {
                  <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.75rem; font-size:0.86rem; color:var(--text-muted);">
                    <div>
                      Deduzir <strong>{{ regraIdade().penalidadeFisicaTotal }} pontos</strong> distribuídos livremente entre
                      <strong>{{ regraIdade().atributosPenalidadeFisica.join(', ') }}</strong>.
                      @if (regraIdade().penalidadeAPA > 0) {
                        <span>(APA sofre redução automática de -{{ regraIdade().penalidadeAPA }}).</span>
                      }
                    </div>
                    <button type="button" class="btn btn-sm" (click)="distribuirPenalidadeAutomatica()">
                      Distribuir Automaticamente
                    </button>
                  </div>

                  <div class="grid-3">
                    @for (sigla of regraIdade().atributosPenalidadeFisica; track sigla) {
                      <div class="attr-card">
                        <div class="attr-card-header">
                          <span class="attr-sigla">Reduzir de {{ sigla }}</span>
                          <span class="attr-formula-badge">Base: {{ svc.inv().atributosBase[sigla] }}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="80"
                          class="form-input"
                          [ngModel]="svc.inv().idadeAjustes['reducao' + sigla]"
                          (ngModelChange)="atualizarReducaoAtributo(sigla, $event)"
                        />
                        <span class="form-hint">{{ sigla }} Final: <strong>{{ svc.inv().atributosFinais[sigla] }}%</strong></span>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- SEÇÃO 3: ROLAGEM DE SORTE INICIAL (TAREFA 2) -->
              <div>
                <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 0.35rem; color: var(--text-main);">
                  3. Sorte Inicial (3D6×5) — Valor Atual: {{ svc.inv().derivados.sorteInicial }}%
                </div>
                <p style="font-size: 0.84rem; color: var(--text-muted); margin: 0 0 0.75rem;">
                  @if (regraIdade().duplaSorte) {
                    <span>Investigadores jovens (15 a 19 anos) jogam a Sorte <strong>duas vezes</strong> e escolhem o maior resultado!</span>
                  } @else {
                    <span>A Sorte inicial é rolada uma vez com 3D6×5 e não pode ser aumentada por pontos de criação.</span>
                  }
                </p>

                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.75rem;">
                  <button type="button" class="btn btn-primary btn-roll" (click)="rolarSorteInicial()" style="display:inline-flex; align-items:center; gap:0.4rem;">
                    <app-d20-icon [size]="16" [spinning]="svc.rolandoDado()"></app-d20-icon>
                    <span>{{ regraIdade().duplaSorte ? 'Rolar Sorte 2x (Jovem 15–19 anos)' : 'Rolar Sorte (3D6×5)' }}</span>
                  </button>

                  <div style="display:flex; align-items:center; gap:0.4rem;">
                    <label class="form-label" style="margin:0;">Rolagem 1:</label>
                    <input
                      type="number"
                      min="15"
                      max="99"
                      class="attr-value-input"
                      [ngModel]="svc.inv().idadeAjustes.sorteRolagem1"
                      (ngModelChange)="atualizarSorteRolagem(1, $event)"
                    />
                  </div>

                  @if (regraIdade().duplaSorte) {
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <label class="form-label" style="margin:0;">Rolagem 2:</label>
                      <input
                        type="number"
                        min="15"
                        max="99"
                        class="attr-value-input"
                        [ngModel]="svc.inv().idadeAjustes.sorteRolagem2"
                        (ngModelChange)="atualizarSorteRolagem(2, $event)"
                      />
                    </div>
                  }

                  <span class="badge-occ" style="font-size:0.86rem; padding:0.35rem 0.65rem;">
                    Sorte Escolhida: <strong>{{ svc.inv().derivados.sorteInicial }}%</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ==================== ETAPA 4: DERIVADOS (COM CORREÇÃO REATIVA DE MOV - TAREFA 3) ==================== -->
        @if (svc.etapaWizard() === 4) {
          <div class="step-content">
            <div class="grid-3" style="margin-bottom: 1rem;">
              <div class="attr-card">
                <div class="attr-card-header">
                  <span class="attr-sigla">Pontos de Vida (PV)</span>
                  <span class="attr-formula-badge">(CON+TAM) ÷ 10</span>
                </div>
                <div class="vital-big-number">{{ svc.inv().derivados.pvMax }} PV</div>
              </div>

              <div class="attr-card">
                <div class="attr-card-header">
                  <span class="attr-sigla">Sanidade Inicial (SAN)</span>
                  <span class="attr-formula-badge">Igual ao POD</span>
                </div>
                <div class="vital-big-number">{{ svc.inv().derivados.sanInicial }} / {{ svc.inv().derivados.sanMax }}</div>
              </div>

              <div class="attr-card">
                <div class="attr-card-header">
                  <span class="attr-sigla">Pontos de Magia (PM)</span>
                  <span class="attr-formula-badge">POD ÷ 5</span>
                </div>
                <div class="vital-big-number">{{ svc.inv().derivados.pmMax }} PM</div>
              </div>
            </div>

            <div class="grid-3">
              <div class="attr-card">
                <div class="attr-card-header">
                  <span class="attr-sigla">Dano Extra (DX) &amp; Corpo</span>
                  <span class="attr-formula-badge">FOR+TAM = {{ svc.inv().atributosFinais['FOR'] + svc.inv().atributosFinais['TAM'] }}</span>
                </div>
                <div class="vital-big-number">DX: {{ svc.inv().derivados.danoExtra }} | Corpo: {{ svc.inv().derivados.corpo }}</div>
              </div>

              <!-- MOV REATIVO CORRIGIDO (Tarefa 3) -->
              <div class="attr-card" style="border: 1.5px solid var(--accent-primary);">
                <div class="attr-card-header">
                  <span class="attr-sigla">Taxa de Movimento (MOV)</span>
                  <span class="attr-formula-badge">Regras pág. 33–34</span>
                </div>
                <div class="vital-big-number">MOV {{ svc.inv().derivados.mov }}</div>
                <span class="form-hint" style="margin-top: 0.35rem;">
                  Base: {{ svc.inv().derivados.movBase || 8 }} | Penalidade de Idade: -{{ svc.inv().derivados.penalidadeMOV || 0 }}
                </span>
              </div>

              <div class="attr-card">
                <div class="attr-card-header">
                  <span class="attr-sigla">Esquiva Base</span>
                  <span class="attr-formula-badge">DES ÷ 2</span>
                </div>
                <div class="vital-big-number">{{ svc.inv().derivados.esquivaBase }}</div>
              </div>
            </div>
          </div>
        }

        <!-- ==================== ETAPA 5: OCUPAÇÃO (TAREFA 4 - CHECKBOX, SCROLLBAR & LIMITE 8 PERÍCIAS) ==================== -->
        @if (svc.etapaWizard() === 5) {
          <div class="step-content">
            <div class="grid-2" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label" for="sel-ocup-wizard">Selecionar Ocupação do Livro Básico (7ª Edição):</label>
                <select
                  id="sel-ocup-wizard"
                  class="form-select"
                  [ngModel]="svc.inv().ocupacaoId"
                  (ngModelChange)="aoMudarOcupacao($event)"
                >
                  @for (o of svc.OCUPACOES; track o.id) {
                    <option [value]="o.id">
                      {{ o.nome }} — [{{ o.formulaTexto }} | Crédito {{ o.creditoMin }}–{{ o.creditoMax }}]
                    </option>
                  }
                </select>
              </div>

              @if (ocupacaoAtual()?.formula?.tipo === 'escolha' || (ocupacaoAtual()?.formula?.opcoes && ocupacaoAtual()?.formula?.opcoes.length > 0)) {
                <div class="form-group">
                  <label class="form-label" for="sel-atr-opc">Atributo Secundário da Fórmula ({{ ocupacaoAtual()?.formulaTexto }}):</label>
                  <select
                    id="sel-atr-opc"
                    class="form-select"
                    [ngModel]="svc.inv().ocupacaoAtributoEscolhido"
                    (ngModelChange)="aoMudarAtributoOpcaoOcupacao($event)"
                  >
                    @for (op of ocupacaoAtual().formula.opcoes; track op.atr) {
                      <option [value]="op.atr">
                        {{ op.atr }} (Atual: {{ svc.inv().atributosFinais[op.atr] }} × {{ op.mult }} = {{ svc.inv().atributosFinais[op.atr] * op.mult }} pts)
                      </option>
                    }
                  </select>
                </div>
              }
            </div>

            <!-- Resumo da Ocupação -->
            <div class="sheet-section-box" style="margin-bottom: 1rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
                <h3 style="margin:0; font-family:var(--font-serif); font-size:1.2rem;">{{ ocupacaoAtual()?.nome }}</h3>
                <span class="badge-occ" style="font-size:0.9rem;">
                  Total: {{ svc.totaisPericias().totalOcupacao }} Pontos de Ocupação
                </span>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:1.2rem; font-size:0.86rem; color:var(--text-muted);">
                <div><strong>Fórmula:</strong> <code>{{ svc.totaisPericias().detalheOcupacao }}</code></div>
                <div><strong>Faixa de Nível de Crédito:</strong> <code>{{ ocupacaoAtual()?.creditoMin }} a {{ ocupacaoAtual()?.creditoMax }}</code></div>
              </div>
            </div>

            <!-- Seleção de Perícias da Ocupação com Limite Rigoroso de 8 Perícias (Tarefa 4) -->
            <div class="sheet-section-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.75rem;">
                <div>
                  <h3 style="margin:0; font-size:1.05rem;">
                    Perícias de Ocupação
                  </h3>
                  <span style="font-size:0.82rem; color:var(--text-muted);">
                    A regra do livro define exatamente 8 perícias de ocupação (incluindo Nível de Crédito).
                  </span>
                </div>

                <!-- Contador Visível X/8 (Tarefa 4) -->
                <div
                  class="counter-pill"
                  [class.is-exceeded]="totalPericiasOcupacionaisSelecionadas() > 8"
                  [style.borderColor]="totalPericiasOcupacionaisSelecionadas() === 8 ? 'var(--accent-primary)' : 'var(--border)'"
                >
                  <span>Contador:</span>
                  <strong>{{ totalPericiasOcupacionaisSelecionadas() }} / 8 Selecionadas</strong>
                  @if (totalPericiasOcupacionaisSelecionadas() === 8) {
                    <span style="color:var(--accent-primary); font-weight:bold; display:inline-flex; align-items:center; gap:0.25rem;">
                      <app-ui-icon name="check" [size]="14"></app-ui-icon> Completo
                    </span>
                  } @else {
                    <span style="font-size:0.75rem;">(Faltam: {{ 8 - totalPericiasOcupacionaisSelecionadas() }})</span>
                  }
                </div>
              </div>

              <!-- Filtro de Busca -->
              <div style="margin-bottom: 0.65rem;">
                <input
                  type="search"
                  class="form-input"
                  style="max-width: 320px; padding: 0.35rem 0.6rem; font-size: 0.86rem;"
                  placeholder="Filtrar perícia para marcar como ocupacional..."
                  [ngModel]="svc.buscaEscolhaOcupacional()"
                  (ngModelChange)="svc.buscaEscolhaOcupacional.set($event)"
                />
              </div>

              <!-- Lista com Scrollbar Temática e Checkboxes Personalizados (Tarefa 4) -->
              <div
                class="custom-scrollbar"
                style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.5rem; max-height: 260px; overflow-y: auto; padding: 0.35rem; background: var(--ground); border: 1px solid var(--border); border-radius: var(--radius-sm);"
              >
                @for (p of periciasParaEscolhaOcupacional(); track p.id) {
                  <label
                    class="custom-checkbox-label"
                    [class.checked]="isPericiaOcupacionalMarcada(p.id)"
                    [class.disabled]="isCheckboxOcupacionalDesabilitado(p.id)"
                    [title]="isPericiaFixa(p.id) ? 'Perícia obrigatória fixa da ocupação' : (isCheckboxOcupacionalDesabilitado(p.id) ? 'Limite de 8 perícias atingido' : 'Clique para alternar')"
                  >
                    <input
                      type="checkbox"
                      class="custom-checkbox-input"
                      [checked]="isPericiaOcupacionalMarcada(p.id)"
                      [disabled]="isCheckboxOcupacionalDesabilitado(p.id)"
                      (change)="alternarEscolhaOcupacional(p.id)"
                    />
                    <div style="display:flex; flex-direction:column; line-height:1.2;">
                      <span style="font-weight: 500;">{{ p.nome }}</span>
                      <span style="font-size: 0.74rem; color: var(--text-muted);">Base: {{ p.base }} {{ isPericiaFixa(p.id) ? '(Fixa)' : '' }}</span>
                    </div>
                  </label>
                }
              </div>
            </div>
          </div>
        }

        <!-- ==================== ETAPA 6: PERÍCIAS (TAREFA 5 - BLOQUEIO E TETO 75%) ==================== -->
        @if (svc.etapaWizard() === 6) {
          <div class="step-content">
            <!-- Barra de Contadores e Saldo em Destaque (Tarefa 5) -->
            <div class="skills-counters-bar">
              <div class="counter-pill" [class.is-exceeded]="svc.totaisPericias().restantesOcupacao < 0">
                <span>Ocupação:</span>
                <strong>{{ svc.totaisPericias().gastosOcupacao }} / {{ svc.totaisPericias().totalOcupacao }}</strong>
                <span [style.color]="svc.totaisPericias().restantesOcupacao === 0 ? 'var(--accent-primary)' : 'var(--text-muted)'">
                  (Restam: {{ svc.totaisPericias().restantesOcupacao }})
                </span>
              </div>

              <div class="counter-pill" [class.is-exceeded]="svc.totaisPericias().restantesInteresse < 0">
                <span>Interesse Pessoal (INT×2):</span>
                <strong>{{ svc.totaisPericias().gastosInteresse }} / {{ svc.totaisPericias().totalInteresse }}</strong>
                <span [style.color]="svc.totaisPericias().restantesInteresse === 0 ? 'var(--accent-primary)' : 'var(--text-muted)'">
                  (Restam: {{ svc.totaisPericias().restantesInteresse }})
                </span>
              </div>

              <div class="counter-pill" [class.is-exceeded]="!svc.totaisPericias().creditoValido">
                <span>Crédito:</span>
                <strong>{{ svc.totaisPericias().nivelCredito }}</strong>
                <span style="font-size:0.75rem;">(Faixa: {{ svc.totaisPericias().creditoMin }}–{{ svc.totaisPericias().creditoMax }})</span>
              </div>
            </div>

            <!-- Filtros de Perícias -->
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.65rem; margin-bottom:0.85rem;">
              <div class="filter-chips-row">
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="svc.filtroPericiaWizard() === 'ocupacionais' && !svc.buscaPericiaWizard()"
                  (click)="svc.filtroPericiaWizard.set('ocupacionais'); svc.buscaPericiaWizard.set('')"
                  style="display:inline-flex; align-items:center; gap:0.35rem;"
                >
                  <app-ui-icon name="star" [size]="13"></app-ui-icon>
                  <span>Ocupacionais ({{ contarPericiasFiltro('ocupacionais') }})</span>
                </button>
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="svc.filtroPericiaWizard() === 'investidas' && !svc.buscaPericiaWizard()"
                  (click)="svc.filtroPericiaWizard.set('investidas'); svc.buscaPericiaWizard.set('')"
                >
                  Com Pontos ({{ contarPericiasFiltro('investidas') }})
                </button>
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="svc.filtroPericiaWizard() === 'todas' && !svc.buscaPericiaWizard()"
                  (click)="svc.filtroPericiaWizard.set('todas'); svc.buscaPericiaWizard.set('')"
                >
                  Todas ({{ svc.inv().pericias.length }})
                </button>
              </div>

              <input
                type="search"
                class="form-input"
                style="max-width: 220px; padding: 0.3rem 0.6rem; font-size: 0.84rem;"
                placeholder="Buscar perícia..."
                [ngModel]="svc.buscaPericiaWizard()"
                (ngModelChange)="svc.buscaPericiaWizard.set($event)"
              />
            </div>

            <!-- Tabela com Bloqueio Estrito no Teto de 75% e Saldo Restante (Tarefa 5) -->
            <div class="skills-table-wrapper custom-scrollbar">
              <table class="skills-table">
                <thead>
                  <tr>
                    <th>Perícia</th>
                    <th>Base</th>
                    <th>Pts Ocupação</th>
                    <th>Pts Interesse</th>
                    <th>Total (Reg)</th>
                    <th>½ / ⅕</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of periciasFiltradas(); track p.id) {
                    <tr [class.is-occupational]="svc.ehPericiaOcupacional(svc.inv(), p)">
                      <td>
                        <div style="display:flex; align-items:center; gap:0.35rem;">
                          <strong>{{ p.nome }}</strong>
                          @if (svc.ehPericiaOcupacional(svc.inv(), p)) {
                            <span class="badge-occ">OCUP</span>
                          }
                          @if (p.id === 'mythos_de_cthulhu') {
                            <span class="attr-formula-badge" style="color:var(--accent-crimson);">Inicia em 0</span>
                          }
                        </div>
                      </td>
                      <td style="font-variant-numeric:tabular-nums;">{{ p.base }}</td>

                      <!-- Pontos de Ocupação com Bloqueio Imediato Estrito (Tarefa 5) -->
                      <td>
                        <div style="display:inline-flex; align-items:center; gap:0.25rem;">
                          <button
                            type="button"
                            class="hud-mini-btn"
                            [disabled]="p.ocupacao <= 0"
                            (click)="ajustarPonto(p, 'ocupacao', -5)"
                            title="-5 pontos de ocupação"
                          >−</button>

                          <input
                            type="number"
                            min="0"
                            [max]="obterMaximoAlocavel(p, 'ocupacao')"
                            class="skill-num-input"
                            [disabled]="!svc.ehPericiaOcupacional(svc.inv(), p) || p.id === 'mythos_de_cthulhu'"
                            [ngModel]="p.ocupacao"
                            (ngModelChange)="validarPontoDigitado(p, 'ocupacao', $event)"
                          />

                          <button
                            type="button"
                            class="hud-mini-btn"
                            [disabled]="isBotaoMaisDesabilitado(p, 'ocupacao')"
                            (click)="ajustarPonto(p, 'ocupacao', 5)"
                            title="+5 pontos de ocupação"
                          >+</button>
                        </div>
                      </td>

                      <!-- Pontos de Interesse Pessoal com Bloqueio Imediato Estrito (Tarefa 5) -->
                      <td>
                        <div style="display:inline-flex; align-items:center; gap:0.25rem;">
                          <button
                            type="button"
                            class="hud-mini-btn"
                            [disabled]="p.interesse <= 0"
                            (click)="ajustarPonto(p, 'interesse', -5)"
                            title="-5 pontos de interesse"
                          >−</button>

                          <input
                            type="number"
                            min="0"
                            [max]="obterMaximoAlocavel(p, 'interesse')"
                            class="skill-num-input"
                            [disabled]="p.id === 'mythos_de_cthulhu'"
                            [ngModel]="p.interesse"
                            (ngModelChange)="validarPontoDigitado(p, 'interesse', $event)"
                          />

                          <button
                            type="button"
                            class="hud-mini-btn"
                            [disabled]="isBotaoMaisDesabilitado(p, 'interesse')"
                            (click)="ajustarPonto(p, 'interesse', 5)"
                            title="+5 pontos de interesse"
                          >+</button>
                        </div>
                      </td>

                      <td style="font-variant-numeric:tabular-nums; font-weight:bold;">
                        {{ svc.obterTotalPericiaObj(p) }}
                      </td>
                      <td style="font-variant-numeric:tabular-nums; font-size:0.78rem; color:var(--text-muted);">
                        {{ svc.mq(svc.obterTotalPericiaObj(p)).metade }} / {{ svc.mq(svc.obterTotalPericiaObj(p)).quinto }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ==================== ETAPA 7: ANTECEDENTES (TAREFA 6 - SEM BOTÃO SORTEAR) ==================== -->
        @if (svc.etapaWizard() === 7) {
          <div class="step-content">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem; background:var(--ground); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border);">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <label class="form-label" style="margin:0;">Conexão-Chave:</label>
                <select
                  class="form-select"
                  style="max-width: 280px; padding: 0.3rem 0.6rem; font-size: 0.85rem;"
                  [ngModel]="svc.inv().antecedentes.conexaoChave"
                  (ngModelChange)="atualizarAntecedente('conexaoChave', $event)"
                >
                  @for (c of svc.CAMPOS_ANTECEDENTES; track c.chave) {
                    <option [value]="c.titulo">{{ c.titulo }}</option>
                  }
                </select>
              </div>
              <div style="font-size:0.82rem; color:var(--text-muted);">
                A Conexão-Chave protege seu investigador de episódios graves de insanidade.
              </div>
            </div>

            <!-- Grade de Antecedentes em Acordeão Sem Nenhum Botão de Sortear (Tarefa 6) -->
            <div class="lore-accordion-grid">
              @for (c of svc.CAMPOS_ANTECEDENTES; track c.chave) {
                <div class="lore-card" [class.is-key-connection]="svc.inv().antecedentes.conexaoChave === c.titulo">
                  <div class="lore-card-header" (click)="alternarCardLore(c.chave)">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <strong>{{ c.titulo }}</strong>
                      @if (svc.inv().antecedentes.conexaoChave === c.titulo) {
                        <span class="badge-occ" style="background:var(--accent-gold); color:#101214;">CHAVE</span>
                      }
                    </div>
                    <span style="font-size:0.8rem; color:var(--text-muted);">
                      {{ cardAberto() === c.chave ? '▲ Recolher' : '▼ Escrever' }}
                    </span>
                  </div>

                  @if (cardAberto() !== c.chave) {
                    <div class="lore-card-preview" (click)="alternarCardLore(c.chave)">
                      {{ svc.inv().antecedentes[c.chave] || ('Clique para escrever: ' + c.dica) }}
                    </div>
                  } @else {
                    <div class="lore-card-editor">
                      <textarea
                        class="form-input"
                        rows="3"
                        [placeholder]="c.dica"
                        [ngModel]="svc.inv().antecedentes[c.chave]"
                        (ngModelChange)="atualizarAntecedente(c.chave, $event)"
                      ></textarea>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- ==================== ETAPA 8: BENS & ARMAS (TAREFA 7 - MODAL CENTRALIZADO) ==================== -->
        @if (svc.etapaWizard() === 8) {
          <div class="step-content">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
              <div>
                <h3 style="margin:0; font-family:var(--font-serif); font-size:1.25rem;">Arsenal do Investigador</h3>
                <span style="font-size:0.84rem; color:var(--text-muted);">Armas equipadas e preparadas para combate.</span>
              </div>

              <!-- Botão que abre o Modal Centralizado com Blur (Tarefa 7) -->
              <button
                type="button"
                class="btn btn-primary"
                (click)="abrirModalArma()"
                title="Abrir formulário modal para adicionar arma"
              >
                + Adicionar Arma
              </button>
            </div>

            <!-- Tabela de Armas -->
            <div class="skills-table-wrapper custom-scrollbar" style="margin-bottom:1.5rem;">
              <table class="skills-table">
                <thead>
                  <tr>
                    <th>Arma</th>
                    <th>Perícia</th>
                    <th>Dano</th>
                    <th>Alcance</th>
                    <th>Tiros</th>
                    <th>Munição</th>
                    <th>Defeito</th>
                    <th>Ações</th>
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
                      <td>
                        <button
                          type="button"
                          class="btn btn-sm btn-danger"
                          style="padding:0.15rem 0.45rem; font-size:0.75rem;"
                          (click)="removerArma(w.id)"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" style="text-align:center; padding:1.2rem; color:var(--text-muted);">
                        Nenhuma arma equipada além do combate desarmado. Clique em "+ Adicionar Arma".
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Finanças dos Anos 1920 -->
            <div class="sheet-section-box">
              <h3 style="margin:0 0 0.5rem; font-family:var(--font-serif); font-size:1.2rem;">
                Finanças da Década de 1920 (Nível de Crédito: {{ svc.totaisPericias().nivelCredito }})
              </h3>
              <div class="grid-3" style="font-size:0.88rem;">
                <div><strong>Nível de Gastos:</strong> \${{ svc.inv().financas.nivelGastos }}</div>
                <div><strong>Dinheiro em Caixa:</strong> \${{ svc.inv().financas.dinheiro }}</div>
                <div><strong>Patrimônio Total:</strong> \${{ svc.inv().financas.patrimonio }}</div>
              </div>
            </div>
          </div>
        }

        <!-- ==================== ETAPA 9: REVISÃO & CONCLUSÃO ==================== -->
        @if (svc.etapaWizard() === 9) {
          <div class="step-content">
            <div class="alert alert-success" style="margin-bottom:1rem;">
              <strong>Dossiê Concluído!</strong> Seu investigador está criado com regras oficiais da 7ª Edição e pronto para jogar ou exportar.
            </div>

            <div class="grid-2" style="margin-bottom:1.5rem;">
              <div class="sheet-section-box">
                <h3 style="margin:0 0 0.5rem; font-family:var(--font-serif); font-size:1.15rem;">Resumo Vital</h3>
                <ul style="margin:0; padding-left:1.2rem; font-size:0.88rem; line-height:1.6;">
                  <li><strong>Nome:</strong> {{ svc.inv().identidade.nome || 'Investigador Sem Nome' }}</li>
                  <li><strong>Ocupação:</strong> {{ svc.inv().ocupacaoNome }} ({{ svc.inv().identidade.idade }} anos)</li>
                  <li><strong>PV Máximos:</strong> {{ svc.inv().derivados.pvMax }} PV</li>
                  <li><strong>Sanidade:</strong> {{ svc.inv().derivados.sanInicial }} / {{ svc.inv().derivados.sanMax }}</li>
                  <li><strong>Taxa de Movimento (MOV):</strong> MOV {{ svc.inv().derivados.mov }}</li>
                  <li><strong>Dano Extra:</strong> {{ svc.inv().derivados.danoExtra }} | Corpo: {{ svc.inv().derivados.corpo }}</li>
                </ul>
              </div>

              <div class="sheet-section-box">
                <h3 style="margin:0 0 0.5rem; font-family:var(--font-serif); font-size:1.15rem;">Ações Finais</h3>
                <div style="display:flex; flex-direction:column; gap:0.6rem;">
                  <button type="button" class="btn btn-primary" (click)="svc.modoView.set('sheet')">
                    Ir para a Ficha Viva Interativa →
                  </button>
                  <button type="button" class="btn" (click)="svc.exportarFichaOficialPDF(false)" [disabled]="svc.exportandoPDF()">
                    @if (svc.exportandoPDF()) { Gerando PDF... } @else { Exportar na Ficha Oficial Editável (PDF) }
                  </button>
                  <button type="button" class="btn" (click)="svc.gerarPDFNativo()">
                    Visualizar Impressão A4 Oficial
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Botões de Avanço e Recuo do Wizard -->
        <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:1rem; margin-top:1.5rem;">
          <button
            type="button"
            class="btn"
            [disabled]="svc.etapaWizard() === 1"
            (click)="voltarEtapa()"
          >
            ← Etapa Anterior
          </button>

          <span style="font-size:0.86rem; color:var(--text-muted); font-weight:600;">
            Etapa {{ svc.etapaWizard() }} de 9
          </span>

          @if (svc.etapaWizard() < 9) {
            <button
              type="button"
              class="btn btn-primary"
              (click)="avancarEtapa()"
            >
              Próxima Etapa →
            </button>
          } @else {
            <button
              type="button"
              class="btn btn-primary"
              (click)="svc.modoView.set('sheet')"
              style="display:inline-flex; align-items:center; gap:0.4rem;"
            >
              <span>Concluir &amp; Abrir Ficha Viva</span>
              <app-ui-icon name="check" [size]="14"></app-ui-icon>
            </button>
          }
        </footer>
      </div>
    </main>
  `
})
export class WizardComponent {
  public readonly svc = inject(CocStateService);

  public readonly cardAberto = signal<string | null>(null);

  public readonly etapas = [
    { num: 1, curto: 'Conceito', titulo: 'Etapa 1: Conceito & Identidade', descricao: 'Nome, idade, profissão e dados pessoais do seu investigador nos Anos 1920.' },
    { num: 2, curto: 'Características', titulo: 'Etapa 2: Características Básicas', descricao: 'Geração dos 8 atributos principais através de rolagens ou arranjo padrão.' },
    { num: 3, curto: 'Idade & Sorte', titulo: 'Etapa 3: Modificadores de Idade & Sorte', descricao: 'Ajuste unificado de EDU, penalidades físicas e rolagem de Sorte 3D6×5.' },
    { num: 4, curto: 'Derivados', titulo: 'Etapa 4: Atributos Derivados', descricao: 'Pontos de Vida, Sanidade, Magia, Dano Extra e Taxa de Movimento (MOV).' },
    { num: 5, curto: 'Ocupação', titulo: 'Etapa 5: Escolha da Ocupação', descricao: 'Selecione sua carreira e exatamente 8 perícias de ocupação (incluindo Crédito).' },
    { num: 6, curto: 'Perícias', titulo: 'Etapa 6: Distribuição de Pontos de Perícia', descricao: 'Distribua os pontos de ocupação e interesses pessoais respeitando o teto de 75%.' },
    { num: 7, curto: 'Antecedentes', titulo: 'Etapa 7: Antecedentes & Conexão-Chave', descricao: 'Histórico pessoal, ideologias, pessoas amadas e sua âncora de sanidade.' },
    { num: 8, curto: 'Bens & Armas', titulo: 'Etapa 8: Arsenal & Finanças', descricao: 'Equipamentos, armas clássicas da Tabela XVII e patrimônio em dólares.' },
    { num: 9, curto: 'Conclusão', titulo: 'Etapa 9: Revisão Geral & Ficha Pronta', descricao: 'Revisão das regras canônicas, ficha pronta para a mesa ou exportação PDF.' }
  ];

  public readonly atributosDef = [
    { sigla: 'FOR', nome: 'Força', formula: '3d6×5', tipoDado: '3D6', descricao: 'Poder muscular e dano físico' },
    { sigla: 'CON', nome: 'Constituição', formula: '3d6×5', tipoDado: '3D6', descricao: 'Resistência a ferimentos e venenos' },
    { sigla: 'TAM', nome: 'Tamanho', formula: '(2d6+6)×5', tipoDado: '2D6+6', descricao: 'Estatura e massa corporal' },
    { sigla: 'DES', nome: 'Destreza', formula: '3d6×5', tipoDado: '3D6', descricao: 'Agilidade e velocidade física' },
    { sigla: 'APA', nome: 'Aparência', formula: '3d6×5', tipoDado: '3D6', descricao: 'Atratividade e presença' },
    { sigla: 'INT', nome: 'Inteligência', formula: '(2d6+6)×5', tipoDado: '2D6+6', descricao: 'Raciocínio e pontos de interesse' },
    { sigla: 'POD', nome: 'Poder', formula: '3d6×5', tipoDado: '3D6', descricao: 'Força de vontade e Sanidade' },
    { sigla: 'EDU', nome: 'Educação', formula: '(2d6+6)×5', tipoDado: '2D6+6', descricao: 'Conhecimento formal e pontos ocupacionais' }
  ];

  public readonly etapaAtualInfo = computed(() => {
    const e = this.svc.etapaWizard();
    return this.etapas.find((x) => x.num === e) || this.etapas[0];
  });

  public readonly regraIdade = computed(() => {
    const idade = Number(this.svc.inv().identidade.idade) || 28;
    return this.svc.regraIdade(idade);
  });

  public readonly ocupacaoAtual = computed(() => {
    const id = this.svc.inv().ocupacaoId;
    return this.svc.OCUPACOES.find((o: any) => o.id === id) || this.svc.OCUPACOES[0];
  });

  // --- TAREFA 4: CONTAGEM E LIMITE DE 8 PERÍCIAS DE OCUPAÇÃO ---
  public isPericiaFixa(periciaId: string): boolean {
    if (periciaId === 'nivel_de_credito') return true;
    const fixas = this.ocupacaoAtual()?.periciasFixas || [];
    return fixas.includes(periciaId);
  }

  public isPericiaOcupacionalMarcada(periciaId: string): boolean {
    if (this.isPericiaFixa(periciaId)) return true;
    const escolhidas = this.svc.inv().ocupacaoPericiasEscolhidas || [];
    return escolhidas.includes(periciaId);
  }

  public readonly totalPericiasOcupacionaisSelecionadas = computed(() => {
    const fixas = this.ocupacaoAtual()?.periciasFixas || [];
    const escolhidas = this.svc.inv().ocupacaoPericiasEscolhidas || [];
    // Nível de crédito sempre conta como 1
    return 1 + fixas.length + escolhidas.length;
  });

  public isCheckboxOcupacionalDesabilitado(periciaId: string): boolean {
    if (this.isPericiaFixa(periciaId)) return true; // Fixas são obrigatórias
    const estaMarcada = (this.svc.inv().ocupacaoPericiasEscolhidas || []).includes(periciaId);
    if (estaMarcada) return false; // Pode desmarcar
    return this.totalPericiasOcupacionaisSelecionadas() >= 8; // Bloqueia novas escolhas se já atingiu 8
  }

  public alternarEscolhaOcupacional(periciaId: string): void {
    if (this.isPericiaFixa(periciaId)) return;
    this.svc.atualizarInvestigadorAtivo((inv) => {
      const list = inv.ocupacaoPericiasEscolhidas || [];
      const idx = list.indexOf(periciaId);
      if (idx >= 0) {
        inv.ocupacaoPericiasEscolhidas = list.filter((id) => id !== periciaId);
      } else {
        const totalAtual = 1 + (this.ocupacaoAtual()?.periciasFixas || []).length + list.length;
        if (totalAtual < 8) {
          inv.ocupacaoPericiasEscolhidas = [...list, periciaId];
        }
      }
    });
  }

  public readonly periciasParaEscolhaOcupacional = computed(() => {
    const inv = this.svc.inv();
    const termo = this.svc.buscaEscolhaOcupacional().toLowerCase().trim();
    return (inv.pericias || []).filter((p) => {
      if (p.id === 'mythos_de_cthulhu') return false;
      if (termo && !p.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  });

  // --- TAREFA 5: BLOQUEIO IMEDIATO E TETO DE 75% ---
  public obterMaximoAlocavel(p: PericiaInvestigador, campo: 'ocupacao' | 'interesse'): number {
    const teto = p.id === 'nivel_de_credito' ? (this.ocupacaoAtual()?.creditoMax ?? 99) : 75;
    const outro = campo === 'ocupacao' ? (Number(p.interesse) || 0) : (Number(p.ocupacao) || 0);
    const base = Number(p.base) || 0;
    const outros = Number(p.outros) || 0;
    const tetoRestante = Math.max(0, teto - base - outro - outros);
    const saldoReserva = campo === 'ocupacao'
      ? (this.svc.totaisPericias().restantesOcupacao + (Number(p.ocupacao) || 0))
      : (this.svc.totaisPericias().restantesInteresse + (Number(p.interesse) || 0));
    return Math.min(tetoRestante, saldoReserva);
  }

  public isBotaoMaisDesabilitado(p: PericiaInvestigador, campo: 'ocupacao' | 'interesse'): boolean {
    if (p.id === 'mythos_de_cthulhu') return true;
    if (campo === 'ocupacao' && !this.svc.ehPericiaOcupacional(this.svc.inv(), p)) return true;
    const saldo = campo === 'ocupacao' ? this.svc.totaisPericias().restantesOcupacao : this.svc.totaisPericias().restantesInteresse;
    if (saldo <= 0) return true;
    const totalAtual = this.svc.obterTotalPericiaObj(p);
    const teto = p.id === 'nivel_de_credito' ? (this.ocupacaoAtual()?.creditoMax ?? 99) : 75;
    return totalAtual >= teto;
  }

  public ajustarPonto(p: PericiaInvestigador, campo: 'ocupacao' | 'interesse', delta: number): void {
    if (delta > 0 && this.isBotaoMaisDesabilitado(p, campo)) return;
    this.svc.atualizarInvestigadorAtivo((inv) => {
      const per = (inv.pericias || []).find((x) => x.id === p.id);
      if (!per) return;
      const atual = Number(per[campo]) || 0;
      let novo = Math.max(0, atual + delta);
      const maximo = this.obterMaximoAlocavel(per, campo);
      if (novo > maximo) novo = maximo;
      per[campo] = novo;
    });
  }

  public validarPontoDigitado(p: PericiaInvestigador, campo: 'ocupacao' | 'interesse', val: any): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      const per = (inv.pericias || []).find((x) => x.id === p.id);
      if (!per) return;
      let digitado = Math.max(0, Math.floor(Number(val) || 0));
      const maximo = this.obterMaximoAlocavel(per, campo);
      if (digitado > maximo) digitado = maximo;
      per[campo] = digitado;
    });
  }

  public readonly periciasFiltradas = computed(() => {
    const inv = this.svc.inv();
    const filtro = this.svc.filtroPericiaWizard();
    const busca = this.svc.buscaPericiaWizard().toLowerCase().trim();

    return (inv.pericias || []).filter((p) => {
      if (busca) return p.nome.toLowerCase().includes(busca);
      if (filtro === 'ocupacionais') return this.svc.ehPericiaOcupacional(inv, p);
      if (filtro === 'investidas') return (Number(p.ocupacao) || 0) > 0 || (Number(p.interesse) || 0) > 0;
      return true;
    });
  });

  public contarPericiasFiltro(tipo: 'ocupacionais' | 'investidas'): number {
    const inv = this.svc.inv();
    if (!inv || !inv.pericias) return 0;
    if (tipo === 'ocupacionais') return inv.pericias.filter((p) => this.svc.ehPericiaOcupacional(inv, p)).length;
    return inv.pericias.filter((p) => (Number(p.ocupacao) || 0) > 0 || (Number(p.interesse) || 0) > 0).length;
  }

  // --- TAREFA 1: AÇÕES DE CARACTERÍSTICAS ---
  public rolarTodosAtributos(): void {
    this.svc.dispararAnimacaoDado();
    if (this.svc.R.rolarConjuntoAtributos) {
      const res = this.svc.R.rolarConjuntoAtributos('padrao');
      this.svc.atualizarInvestigadorAtivo((inv) => {
        Object.keys(res.atributos).forEach((sigla) => {
          inv.atributosBase[sigla] = res.atributos[sigla].valor;
        });
        inv.poolRolado = res.poolLivre;
      });
    }
  }

  public rolarAtributoUnico(atr: any): void {
    this.svc.dispararAnimacaoDado();
    const valor = atr.tipoDado === '2D6+6'
      ? (this.svc.R.rolarAtributo2D6Mais6 ? this.svc.R.rolarAtributo2D6Mais6().valor : 60)
      : (this.svc.R.rolarAtributo3D6 ? this.svc.R.rolarAtributo3D6().valor : 50);

    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.atributosBase[atr.sigla] = valor;
    });
  }

  public aplicarArranjoPadrao(): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.atributosBase = { FOR: 50, CON: 50, TAM: 60, DES: 60, APA: 50, INT: 70, POD: 60, EDU: 80 };
    });
  }

  // --- TAREFA 2: IDADE & SORTE ---
  public rolarTestesMelhoriaEDU(): void {
    this.svc.dispararAnimacaoDado();
    const reg = this.regraIdade();
    const eduBase = this.svc.inv().atributosBase['EDU'];
    if (this.svc.R.executarTestesMelhoriaEDU) {
      const res = this.svc.R.executarTestesMelhoriaEDU(eduBase, reg.testesMelhoriaEDU);
      this.svc.atualizarInvestigadorAtivo((inv) => {
        inv.idadeAjustes.ganhoEDU = res.eduFinal - eduBase;
        inv.idadeAjustes.historicoTestesEDU = res.historico;
      });
    }
  }

  public rolarSorteInicial(): void {
    this.svc.dispararAnimacaoDado();
    const reg = this.regraIdade();
    if (this.svc.R.rolarSorteInicial) {
      const res = this.svc.R.rolarSorteInicial(reg.duplaSorte);
      this.svc.atualizarInvestigadorAtivo((inv) => {
        inv.idadeAjustes.sorteRolagem1 = res.rolagens[0].valor;
        inv.idadeAjustes.sorteRolagem2 = res.rolagens[1] ? res.rolagens[1].valor : 0;
        inv.idadeAjustes.sorteInicial = res.valorEscolhido;
        inv.derivados.sorteInicial = res.valorEscolhido;
        inv.derivados.sorteAtual = res.valorEscolhido;
      });
    }
  }

  public somaReducaoFisica(): number {
    const aj = this.svc.inv().idadeAjustes || {};
    const reg = this.regraIdade();
    return (reg.atributosPenalidadeFisica || []).reduce((acc: number, s: string) => {
      return acc + (Number(aj['reducao' + s]) || 0);
    }, 0);
  }

  public distribuirPenalidadeAutomatica(): void {
    const reg = this.regraIdade();
    const atrs = reg.atributosPenalidadeFisica || [];
    const total = reg.penalidadeFisicaTotal || 0;
    this.svc.atualizarInvestigadorAtivo((inv) => {
      atrs.forEach((s: string) => {
        inv.idadeAjustes['reducao' + s] = 0;
      });
      if (atrs.length > 0 && total > 0) {
        inv.idadeAjustes['reducao' + atrs[0]] = total;
      }
    });
  }

  // --- NAVEGAÇÃO E ATUALIZAÇÕES ---
  public avancarEtapa(): void {
    if (this.svc.etapaWizard() < 9) {
      this.svc.etapaWizard.set(this.svc.etapaWizard() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public voltarEtapa(): void {
    if (this.svc.etapaWizard() > 1) {
      this.svc.etapaWizard.set(this.svc.etapaWizard() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public atualizarIdentidade(campo: string, valor: any): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      (inv.identidade as any)[campo] = valor;
    });
  }

  public atualizarIdade(valor: any): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.identidade.idade = Math.max(15, Math.min(90, Number(valor) || 28));
    });
  }

  public atualizarAtributoBase(sigla: string, valor: any): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.atributosBase[sigla] = Math.max(15, Math.min(99, Number(valor) || 50));
    });
  }

  public atualizarAjusteIdade(campo: string, valor: any): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      (inv.idadeAjustes as any)[campo] = Number(valor) || 0;
    });
  }

  public atualizarReducaoAtributo(sigla: string, valor: any): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.idadeAjustes['reducao' + sigla] = Math.max(0, Number(valor) || 0);
    });
  }

  public atualizarSorteRolagem(num: 1 | 2, valor: any): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      const v = Math.max(15, Math.min(99, Number(valor) || 50));
      if (num === 1) inv.idadeAjustes.sorteRolagem1 = v;
      else inv.idadeAjustes.sorteRolagem2 = v;
      const s1 = inv.idadeAjustes.sorteRolagem1 || 50;
      const s2 = inv.idadeAjustes.sorteRolagem2 || 0;
      const escolhido = this.regraIdade().duplaSorte ? Math.max(s1, s2) : s1;
      inv.idadeAjustes.sorteInicial = escolhido;
      inv.derivados.sorteInicial = escolhido;
      inv.derivados.sorteAtual = escolhido;
    });
  }

  public aoMudarOcupacao(ocupId: string): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.ocupacaoId = ocupId;
      inv.ocupacaoPericiasEscolhidas = [];
      const ncPer = (inv.pericias || []).find((p) => p.id === 'nivel_de_credito');
      const ocup = this.svc.OCUPACOES.find((o: any) => o.id === ocupId);
      if (ncPer && ocup) {
        ncPer.base = ocup.creditoMin;
      }
    });
  }

  public aoMudarAtributoOpcaoOcupacao(atr: string): void {
    this.svc.atualizarInvestigadorAtivo((inv) => {
      inv.ocupacaoAtributoEscolhido = atr;
    });
  }

  public alternarCardLore(chave: string): void {
    this.cardAberto.set(this.cardAberto() === chave ? null : chave);
  }

  public atualizarAntecedente(chave: string, val: string): void {
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
}

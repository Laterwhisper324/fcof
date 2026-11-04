import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CocStateService } from './services/coc-state.service';
import { HeaderComponent } from './components/header/header.component';
import { WizardComponent } from './components/wizard/wizard.component';
import { SheetComponent } from './components/sheet/sheet.component';
import { ArmaModalComponent } from './components/arma-modal/arma-modal.component';
import { InvestigadoresModalComponent } from './components/investigadores-modal/investigadores-modal.component';
import { RollToastComponent } from './components/roll-toast/roll-toast.component';
import { DiceDrawerComponent } from './components/dice-drawer/dice-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    WizardComponent,
    SheetComponent,
    ArmaModalComponent,
    InvestigadoresModalComponent,
    RollToastComponent,
    DiceDrawerComponent
  ],
  template: `
    <div id="app-root" aria-live="polite">
      <!-- Cabeçalho Principal -->
      <app-header></app-header>

      <!-- Alternância Central: Assistente (Wizard) vs Ficha Viva (Sheet) -->
      @if (svc.modoView() === 'wizard') {
        <app-wizard></app-wizard>
      } @else {
        <app-sheet></app-sheet>
      }

      <!-- Rodapé Editorial dos Anos 1920 -->
      <footer class="no-print app-footer">
        <div class="footer-inner">
          <span>Chamado de Cthulhu, 7ª Edição (Década de 1920 • Regras Oficiais PT-BR) • Miskatonic University Archives</span>
          <span class="footer-sep">•</span>
          <span>100% Offline com salvamento automático local</span>
          <span class="footer-sep">•</span>
          <a href="testes.html" class="footer-link">
            Suíte de Testes Automatizados das Regras (testes.html)
          </a>
        </div>
      </footer>

      <!-- Modais e Gavetas Interativas -->
      <app-arma-modal></app-arma-modal>
      <app-investigadores-modal></app-investigadores-modal>
      <app-roll-toast></app-roll-toast>
      <app-dice-drawer></app-dice-drawer>
    </div>
  `
})
export class AppComponent {
  public readonly svc = inject(CocStateService);
}

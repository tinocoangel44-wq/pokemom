import { Routes } from '@angular/router';
import { Auth } from './components/auth/auth';
import { GamePortalComponent } from './components/game-portal/game-portal.component';

export const routes: Routes = [
  { path: '', component: Auth },
  { path: 'portal', component: GamePortalComponent },
  { path: '**', redirectTo: '' }
];

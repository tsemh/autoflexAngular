import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisplayComponent } from './view/display/display.component';
import { DisplayMaterialComponent } from './view/display-material/display-material.component';
import { SuggestionsComponent } from './view/suggestions/suggestions.component';

const routes: Routes = [
  { path: '', redirectTo: 'display', pathMatch: 'full' },
  { path: 'display', component: DisplayComponent },
  { path: 'materials', component: DisplayMaterialComponent },
  { path: 'suggestions', component: SuggestionsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

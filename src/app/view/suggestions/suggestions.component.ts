import { Component, OnInit } from '@angular/core';
import { SuggestionsService } from '../../Service/suggestions.service';

@Component({
  selector: 'app-suggestions',
  templateUrl: './suggestions.component.html',
  styleUrls: ['./suggestions.component.css']
})
export class SuggestionsComponent implements OnInit {
  products: any[] = [];
  totalValue: number = 0;
  loading = false;
  error: string | null = null;

  constructor(private suggestionsService: SuggestionsService) {}

  ngOnInit(): void {
    this.fetchSuggestions();
  }

  fetchSuggestions(): void {
    this.loading = true;
    this.error = null;
    this.suggestionsService.getSuggestions().subscribe({
      next: (data: any) => {
        console.log('Suggestions endpoint result:', data);
        this.products = data.products || [];
        this.totalValue = data.totalValue || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Falha ao buscar sugestões.';
        this.loading = false;
      }
    });
  }
}

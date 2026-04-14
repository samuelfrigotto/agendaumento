import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface Servico {
  id: string;
  nome: string;
  duracaoMin: number;
  precoPequeno: number;
  precoMedio: number;
  precoGrande: number;
  precoGigante: number;
}

export interface TimeSlot {
  hora: string;
  dataHora: string;
}

export interface DisponibilidadeResponse {
  data: string;
  servicoId: string;
  duracaoMin: number;
  slots: TimeSlot[];
}

export interface Estabelecimento {
  nome: string;
  telefone?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getServicos(): Observable<{ servicos: Servico[] }> {
    return this.http.get<{ servicos: Servico[] }>(`${this.baseUrl}/public/servicos`);
  }

  getServico(id: string): Observable<Servico> {
    return this.http.get<Servico>(`${this.baseUrl}/public/servicos/${id}`);
  }

  getDisponibilidade(data: string, servicoId: string): Observable<DisponibilidadeResponse> {
    const params = new HttpParams()
      .set('data', data)
      .set('servicoId', servicoId);

    return this.http.get<DisponibilidadeResponse>(`${this.baseUrl}/public/disponibilidade`, { params });
  }

  getEstabelecimento(): Observable<Estabelecimento> {
    return this.http.get<Estabelecimento>(`${this.baseUrl}/public/estabelecimento`);
  }
}

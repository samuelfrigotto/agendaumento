import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface Pet {
  id: string;
  nome: string;
  especie: string;
  raca?: string;
  tamanho: string;
  pesoKg?: number;
  observacoes?: string;
}

export interface Agendamento {
  id: string;
  dataHora: string;
  duracaoMin: number;
  preco: number;
  status: string;
  observacoes?: string;
  pet: {
    id: string;
    nome: string;
    raca?: string;
    tamanho: string;
  };
  servico: {
    id: string;
    nome: string;
  };
}

export interface CriarAgendamentoData {
  petId: string;
  servicoId: string;
  dataHora: string;
  observacoes?: string;
}

export interface CriarPetData {
  nome: string;
  especie?: string;
  raca?: string;
  tamanho?: string;
  pesoKg?: number;
  observacoes?: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Agendamentos
  getAgendamentos(futuros = false): Observable<{ agendamentos: Agendamento[] }> {
    const url = futuros
      ? `${this.baseUrl}/cliente/agendamentos?futuros=true`
      : `${this.baseUrl}/cliente/agendamentos`;
    return this.http.get<{ agendamentos: Agendamento[] }>(url);
  }

  criarAgendamento(data: CriarAgendamentoData): Observable<Agendamento> {
    return this.http.post<Agendamento>(`${this.baseUrl}/cliente/agendamentos`, data);
  }

  cancelarAgendamento(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/cliente/agendamentos/${id}`);
  }

  // Pets
  getPets(): Observable<{ pets: Pet[] }> {
    return this.http.get<{ pets: Pet[] }>(`${this.baseUrl}/cliente/pets`);
  }

  criarPet(data: CriarPetData): Observable<Pet> {
    return this.http.post<Pet>(`${this.baseUrl}/cliente/pets`, data);
  }

  // Perfil
  getPerfil(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cliente/perfil`);
  }

  atualizarPerfil(data: { nome?: string; telefone?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/cliente/perfil`, data);
  }
}

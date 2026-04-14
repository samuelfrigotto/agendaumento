import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Banhista
  getPerfil(): Observable<any> {
    return this.http.get(`${this.baseUrl}/banhista/perfil`);
  }

  atualizarPerfil(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/banhista/perfil`, data);
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/banhista/dashboard`);
  }

  // Clientes
  getClientes(params?: { page?: number; limit?: number; busca?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.busca) httpParams = httpParams.set('busca', params.busca);

    return this.http.get(`${this.baseUrl}/clientes`, { params: httpParams });
  }

  getCliente(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/clientes/${id}`);
  }

  criarCliente(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/clientes`, data);
  }

  atualizarCliente(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/clientes/${id}`, data);
  }

  deletarCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clientes/${id}`);
  }

  // Pets
  getPets(params?: { page?: number; limit?: number; busca?: string; clienteId?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.busca) httpParams = httpParams.set('busca', params.busca);
    if (params?.clienteId) httpParams = httpParams.set('clienteId', params.clienteId);

    return this.http.get(`${this.baseUrl}/pets`, { params: httpParams });
  }

  getPet(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/pets/${id}`);
  }

  criarPet(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/pets`, data);
  }

  atualizarPet(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/pets/${id}`, data);
  }

  deletarPet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pets/${id}`);
  }

  uploadFotoPet(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post(`${this.baseUrl}/pets/${id}/foto`, formData);
  }

  // Servicos
  getServicos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/servicos`);
  }

  criarServico(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/servicos`, data);
  }

  atualizarServico(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/servicos/${id}`, data);
  }

  deletarServico(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/servicos/${id}`);
  }

  // Agendamentos
  getAgendamentos(params?: { dataInicio?: string; dataFim?: string; status?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.dataInicio) httpParams = httpParams.set('dataInicio', params.dataInicio);
    if (params?.dataFim) httpParams = httpParams.set('dataFim', params.dataFim);
    if (params?.status) httpParams = httpParams.set('status', params.status);

    return this.http.get(`${this.baseUrl}/agendamentos`, { params: httpParams });
  }

  getAgendamentosHoje(): Observable<any> {
    return this.http.get(`${this.baseUrl}/agendamentos/hoje`);
  }

  getAgendamentosSemana(data?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (data) httpParams = httpParams.set('data', data);

    return this.http.get(`${this.baseUrl}/agendamentos/semana`, { params: httpParams });
  }

  getAgendamento(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/agendamentos/${id}`);
  }

  criarAgendamento(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/agendamentos`, data);
  }

  atualizarAgendamento(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/agendamentos/${id}`, data);
  }

  atualizarStatusAgendamento(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/agendamentos/${id}/status`, { status });
  }

  marcarPago(id: string, formaPagamento?: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/agendamentos/${id}/pago`, { formaPagamento });
  }

  cancelarAgendamento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/agendamentos/${id}`);
  }

  avisarPronto(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/agendamentos/${id}/avisar-pronto`, {});
  }

  uploadFotoPronto(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post(`${this.baseUrl}/agendamentos/${id}/foto-pronto`, formData);
  }

  // Financeiro
  getFinanceiroResumo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/financeiro/resumo`);
  }

  getFinanceiroHistorico(meses?: number): Observable<any> {
    let httpParams = new HttpParams();
    if (meses) httpParams = httpParams.set('meses', meses.toString());

    return this.http.get(`${this.baseUrl}/financeiro/historico`, { params: httpParams });
  }

  getFinanceiroPendentes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/financeiro/pendentes`);
  }

  // WhatsApp
  getWhatsappStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/whatsapp/status`);
  }

  enviarMensagemCustom(telefone: string, mensagem: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/whatsapp/enviar-custom`, { telefone, mensagem });
  }

  // Tipos de Animais
  getTiposAnimais(especie?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (especie) httpParams = httpParams.set('especie', especie);
    return this.http.get(`${this.baseUrl}/tipos-animais`, { params: httpParams });
  }

  getEspecies(): Observable<any> {
    return this.http.get(`${this.baseUrl}/tipos-animais/especies`);
  }

  getRacas(especie: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/tipos-animais/racas/${especie}`);
  }

  criarTipoAnimal(data: { especie: string; raca?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/tipos-animais`, data);
  }

  atualizarTipoAnimal(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/tipos-animais/${id}`, data);
  }

  deletarTipoAnimal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tipos-animais/${id}`);
  }
}

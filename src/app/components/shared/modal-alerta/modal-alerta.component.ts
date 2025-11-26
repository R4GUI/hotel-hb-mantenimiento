import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-alerta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-alerta.component.html',
  styleUrl: './modal-alerta.component.css'
})
export class ModalAlertaComponent {
  @Input() mostrar: boolean = false;
  @Input() mensaje: string = '';
  @Input() tipo: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Output() cerrar = new EventEmitter<void>();

  get iconoClass(): string {
    switch (this.tipo) {
      case 'success': return 'bi-check-circle-fill text-success';
      case 'error': return 'bi-x-circle-fill text-danger';
      case 'warning': return 'bi-exclamation-triangle-fill text-warning';
      case 'info': return 'bi-info-circle-fill text-info';
      default: return 'bi-info-circle-fill text-info';
    }
  }

  get tituloModal(): string {
    switch (this.tipo) {
      case 'success': return 'Éxito';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      case 'info': return 'Información';
      default: return 'Información';
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
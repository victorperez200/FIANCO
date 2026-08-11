import { useMemo, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Users, Power, PowerOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../lib/useRealtime';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import {
  Button,
  IconButton,
  Input,
  Badge,
  EmptyState,
  DataTable,
  Money,
  PageHeader,
  type Column,
} from '../components/ui';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Cliente } from '../types';

const vacio = { nombre: '', telefono: '', limite: '' };

export function Clientes() {
  const toast = useToast();
  const { perfil } = useAuth();
  const esDueno = perfil?.rol === 'dueño';
  const { data: clientes, cargando } = useRealtime<Cliente>({
    query: async () => {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre');
      return { data, error };
    },
    tabla: 'clientes',
  });

  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(vacio);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    let r = clientes;
    if (!mostrarInactivos) r = r.filter((c) => c.activo);
    const q = busqueda.toLowerCase().trim();
    if (q) {
      r = r.filter(
        (c) => c.nombre.toLowerCase().includes(q) || (c.telefono ?? '').toLowerCase().includes(q),
      );
    }
    return r;
  }, [clientes, busqueda, mostrarInactivos]);

  const activosCount = clientes.filter((c) => c.activo).length;
  const inactivosCount = clientes.length - activosCount;

  const abrirEditar = (c: Cliente) => {
    setEditando(c);
    setForm({
      nombre: c.nombre,
      telefono: c.telefono ?? '',
      limite: String(c.limite_credito),
    });
  };

  const abrirCrear = () => {
    setCreando(true);
    setForm(vacio);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const limite = parseFloat(form.limite);
    if (form.limite && (isNaN(limite) || limite < 0)) {
      toast.error('Límite de crédito inválido');
      return;
    }

    setGuardando(true);
    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      limite_credito: form.limite ? limite : 0,
    };
    if (editando) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', editando.id);
      if (error) toast.error('Error al actualizar el cliente');
      else {
        toast.success('Cliente actualizado');
        setEditando(null);
      }
    } else {
      const { error } = await supabase.from('clientes').insert(payload);
      if (error) toast.error('Error al crear el cliente');
      else {
        toast.success('Cliente creado');
        setCreando(false);
      }
    }
    setGuardando(false);
  };

  const toggleActivo = async (c: Cliente) => {
    const { error } = await supabase.from('clientes').update({ activo: !c.activo }).eq('id', c.id);
    if (error) toast.error('Error al cambiar el estado del cliente');
    else toast.success(c.activo ? 'Cliente desactivado' : 'Cliente reactivado');
  };

  const eliminar = async (c: Cliente) => {
    const { error } = await supabase.from('clientes').delete().eq('id', c.id);
    if (error) toast.error('No se pudo eliminar (puede tener ventas o deudas asociadas)');
    else toast.success('Cliente eliminado');
  };

  const modalOpen = editando !== null || creando;
  const cerrarModal = () => {
    setEditando(null);
    setCreando(false);
  };

  const columnas: Column<Cliente>[] = [
    { key: 'nombre', header: 'Nombre', cell: (c) => <span className="font-semibold text-ink">{c.nombre}</span>, hideOnCard: true },
    {
      key: 'telefono',
      header: 'Teléfono',
      cell: (c) =>
        c.telefono ? (
          <a
            href={`tel:${c.telefono.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-1.5 text-primary-700 hover:underline"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            {c.telefono}
          </a>
        ) : (
          <span className="text-ink-muted">Sin teléfono</span>
        ),
    },
    {
      key: 'limite',
      header: 'Límite crédito',
      align: 'right',
      cell: (c) =>
        c.limite_credito > 0 ? (
          <Money value={c.limite_credito} className="font-semibold" />
        ) : (
          <span className="text-ink-muted">Sin límite</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      /* Antes las filas inactivas se atenuaban con opacity-50, lo que hundia el
         contraste del texto por debajo del minimo legible. El estado se comunica
         solo con la etiqueta. */
      cell: (c) => (c.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="default">Inactivo</Badge>),
    },
  ];

  const acciones = (c: Cliente) => (
    <>
      <IconButton
        label={c.activo ? `Desactivar a ${c.nombre}` : `Reactivar a ${c.nombre}`}
        icon={c.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
        onClick={() => toggleActivo(c)}
      />
      <IconButton label={`Editar a ${c.nombre}`} icon={<Edit2 className="w-4 h-4" />} tone="primary" onClick={() => abrirEditar(c)} />
      {esDueno && (
        <IconButton label={`Eliminar a ${c.nombre}`} icon={<Trash2 className="w-4 h-4" />} tone="danger" onClick={() => setAEliminar(c)} />
      )}
    </>
  );

  return (
    <div className="page-shell animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={
          `${activosCount} cliente${activosCount !== 1 ? 's' : ''} activo${activosCount !== 1 ? 's' : ''}` +
          (inactivosCount > 0 ? ` · ${inactivosCount} inactivo${inactivosCount !== 1 ? 's' : ''}` : '')
        }
        actions={
          <Button onClick={abrirCrear}>
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Agregar cliente</span>
            <span className="sm:hidden sr-only">Agregar cliente</span>
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          label="Buscar cliente"
          wrapperClassName="flex-1"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre o teléfono…"
          leading={<Search className="w-5 h-5" />}
        />
        <Button
          variant={mostrarInactivos ? 'secondary' : 'outline'}
          className="sm:self-end"
          aria-pressed={mostrarInactivos}
          onClick={() => setMostrarInactivos((v) => !v)}
        >
          {mostrarInactivos ? <PowerOff className="w-5 h-5" aria-hidden="true" /> : <Power className="w-5 h-5" aria-hidden="true" />}
          {mostrarInactivos ? 'Ver activos' : 'Ver inactivos'}
        </Button>
      </div>

      <DataTable
        caption="Listado de clientes del colmado"
        rows={filtrados}
        columns={columnas}
        getKey={(c) => c.id}
        cardTitle={(c) => c.nombre}
        rowActions={acciones}
        loading={cargando}
        empty={
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Sin clientes"
            description="No hay clientes que mostrar. Agrega uno para empezar."
            action={
              <Button onClick={abrirCrear}>
                <Plus className="w-4 h-4" aria-hidden="true" /> Agregar cliente
              </Button>
            }
          />
        }
      />

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={editando ? 'Editar cliente' : 'Nuevo cliente'}
        size="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" block onClick={cerrarModal} className="sm:flex-1">
              Cancelar
            </Button>
            <Button block onClick={guardar} loading={guardando} className="sm:flex-1">
              {editando ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nombre completo"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre del cliente"
          />
          <Input
            label="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            hint="Opcional. Sirve para llamar al cliente desde la ficha."
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="809-555-0000"
          />
          <Input
            label="Límite de crédito (RD$)"
            type="number"
            inputMode="decimal"
            step="0.01"
            hint="Deja 0 para no aplicar límite de fiao."
            value={form.limite}
            onChange={(e) => setForm({ ...form, limite: e.target.value })}
            placeholder="0"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={aEliminar !== null}
        onClose={() => setAEliminar(null)}
        onConfirm={() => aEliminar && eliminar(aEliminar)}
        title="Eliminar cliente"
        message={
          <>
            ¿Seguro que quieres eliminar a <strong>{aEliminar?.nombre}</strong>? Esta acción no se puede deshacer. No
            podrás eliminar clientes que ya tengan ventas o deudas registradas.
          </>
        }
        confirmLabel="Sí, eliminar"
      />
    </div>
  );
}

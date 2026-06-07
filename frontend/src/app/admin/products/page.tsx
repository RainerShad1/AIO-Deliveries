'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product, Category } from '@/types';

const EMPTY = {
  nombre: '',
  descripcion: '',
  imagen: '',
  precio: 0,
  activo: true,
  categoryId: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Gestion de categorias
  const [newCat, setNewCat] = useState('');
  const [showCatManager, setShowCatManager] = useState(false);

  const load = () =>
    Promise.all([
      api<Product[]>('/products/all'),
      api<Category[]>('/categories/all'),
    ]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
    });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setBusy(true);
    const body = JSON.stringify({
      ...form,
      precio: Number(form.precio),
      categoryId: form.categoryId || null,
    });
    if (editId) await api(`/products/${editId}`, { method: 'PATCH', body });
    else await api('/products', { method: 'POST', body });
    setForm(EMPTY);
    setEditId(null);
    await load();
    setBusy(false);
  };

  const toggle = async (p: Product) => {
    await api(`/products/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !p.activo }),
    });
    load();
  };

  const edit = (p: Product) => {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      imagen: p.imagen,
      precio: Number(p.precio),
      activo: p.activo,
      categoryId: p.categoryId || '',
    });
  };

  const remove = async (p: Product) => {
    if (
      !confirm(
        `Eliminar "${p.nombre}"? Si ya tiene pedidos asociados, se ocultara en vez de borrarse (para no romper el historial).`,
      )
    )
      return;
    await api(`/products/${p.id}`, { method: 'DELETE' });
    load();
  };

  // --- Categorias ---
  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api('/categories', {
      method: 'POST',
      body: JSON.stringify({ nombre: newCat, orden: categories.length + 1 }),
    });
    setNewCat('');
    load();
  };

  const removeCategory = async (id: string, nombre: string) => {
    if (
      !confirm(
        `Eliminar la categoria "${nombre}"? Los productos de esta categoria quedaran sin categoria (no se borran).`,
      )
    )
      return;
    await api(`/categories/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button
          onClick={() => setShowCatManager(!showCatManager)}
          className="text-primary text-sm font-semibold"
        >
          {showCatManager ? 'Cerrar categorias' : '🏷️ Categorias'}
        </button>
      </div>

      {/* Gestor de categorias */}
      {showCatManager && (
        <div className="bg-card rounded-2xl p-4 mb-6 space-y-3">
          <p className="font-semibold">Gestionar categorias</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nueva categoria (ej. Refrescos)"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
            <button
              onClick={addCategory}
              className="bg-primary text-black rounded-xl px-4 font-semibold"
            >
              Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="bg-surface border border-white/10 rounded-full pl-3 pr-2 py-1.5 text-sm flex items-center gap-2"
              >
                {c.nombre}
                <button
                  onClick={() => removeCategory(c.id, c.nombre)}
                  className="text-red-300"
                  aria-label="Eliminar categoria"
                >
                  ✕
                </button>
              </span>
            ))}
            {categories.length === 0 && (
              <p className="text-muted text-sm">Sin categorias aun.</p>
            )}
          </div>
        </div>
      )}

      {/* Formulario crear/editar */}
      <div className="bg-card rounded-2xl p-4 mb-6 space-y-3">
        <p className="font-semibold">
          {editId ? 'Editar producto' : 'Nuevo producto'}
        </p>
        <input
          className="input"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <input
          className="input"
          placeholder="Descripcion"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <input
          className="input"
          placeholder="URL imagen"
          value={form.imagen}
          onChange={(e) => setForm({ ...form, imagen: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Precio"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
        />
        {/* Selector de categoria */}
        <select
          className="input"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">Sin categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={save} disabled={busy} className="btn-primary flex-1">
            {editId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editId && (
            <button
              onClick={() => {
                setForm(EMPTY);
                setEditId(null);
              }}
              className="bg-card border border-white/10 rounded-xl px-4"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-card rounded-xl p-3 flex items-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imagen}
              alt=""
              className="w-12 h-12 rounded-lg object-cover bg-surface"
            />
            <div className="flex-1">
              <p className="font-medium">{p.nombre}</p>
              <p className="text-accent text-sm">
                RD${p.precio}
                {p.category && (
                  <span className="text-muted ml-2">· {p.category.nombre}</span>
                )}
              </p>
            </div>
            <button
              onClick={() => toggle(p)}
              className={`text-xs px-3 py-1.5 rounded-full ${
                p.activo
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-white/10 text-muted'
              }`}
            >
              {p.activo ? 'Activo' : 'Inactivo'}
            </button>
            <button onClick={() => edit(p)} className="text-muted text-sm px-2">
              ✏️
            </button>
            <button
              onClick={() => remove(p)}
              className="text-red-300 text-sm px-2"
              aria-label="Eliminar producto"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

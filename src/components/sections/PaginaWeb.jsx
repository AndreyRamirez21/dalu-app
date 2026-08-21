import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Film, ImagePlus, Loader2, MonitorUp, RefreshCw, Save, Sparkles, Upload, X } from 'lucide-react';

const { ipcRenderer, webUtils } = window.require('electron');

const CATEGORY_SLOTS = [
  { slug: 'pijamas', name: 'Sleepwear' },
  { slug: 'pantuflas', name: 'Slippers' },
  { slug: 'antifaces', name: 'Antifaces' },
  { slug: 'accesorios', name: 'Accesorios' },
];

const INITIAL_CONTENT = {
  hero: { title: 'Comodidad que te acompaña', subtitle: 'Pijamas, pantuflas y accesorios para tus mejores momentos.', primaryLink: '/pijamas', slides: [] },
  categories: CATEGORY_SLOTS.map((category) => ({ ...category, imageUrl: '' })),
  collection: { mediaUrl: '', mediaType: 'image', eyebrow: 'Colección del mes', title: 'Comodidad para quedarte un rato más', description: 'Descubre una selección especial de pijamas para tus momentos más tranquilos.', link: '/pijamas' },
  video: { mediaUrl: '', posterUrl: '', title: 'Momentos que se sienten como en casa', description: 'Descubre cómo se mueve Dalú en cada detalle.', link: '/pijamas' },
  featuredReferences: [],
};

const emptyFiles = { hero: [null, null, null, null], categories: [null, null, null, null], collection: null, video: null };

function normalizarContenido(data) {
  return {
    ...INITIAL_CONTENT,
    ...data,
    hero: { ...INITIAL_CONTENT.hero, ...(data.hero || {}), slides: data.hero?.slides || [] },
    categories: CATEGORY_SLOTS.map((slot, index) => ({ ...slot, ...(data.categories?.[index] || {}) })),
    collection: { ...INITIAL_CONTENT.collection, ...(data.collection || {}) },
    video: { ...INITIAL_CONTENT.video, ...(data.video || {}) },
    featuredReferences: data.featuredReferences || [],
  };
}

const Field = ({ label, value, onChange, placeholder, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="text-xs font-semibold text-gray-600">{label}</span>
    <input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
      className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
  </label>
);

function MediaPicker({ label, value, file, type = 'image', onChange }) {
  const accept = type === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp';
  const preview = file ? `dalu-file://${file.path}` : value;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {file && <span className="text-[11px] font-medium text-amber-600">Pendiente de publicar</span>}
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
        {preview && type === 'image' && <img src={preview} alt={label} className="h-full w-full object-cover" />}
        {preview && type === 'video' && <video src={preview} className="h-full w-full object-cover" muted controls />}
        {!preview && <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400"><ImagePlus size={25} /><span className="text-xs">Aún no has elegido un archivo</span></div>}
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100">
        <Upload size={15} /> Elegir {type === 'video' ? 'video' : 'imagen'}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            onChange(selectedFile ? { path: webUtils.getPathForFile(selectedFile), name: selectedFile.name } : null);
          }}
        />
      </label>
    </div>
  );
}

export default function PaginaWeb() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [files, setFiles] = useState(emptyFiles);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedProducts = useMemo(() => content.featuredReferences.map((reference) => products.find((item) => item.referencia === reference)).filter(Boolean), [content.featuredReferences, products]);

  const load = async () => {
    setLoading(true); setNotice(null);
    try {
      const [savedContent, productRows] = await Promise.all([
        ipcRenderer.invoke('pagina-web-obtener-contenido'),
        ipcRenderer.invoke('pagina-web-listar-productos'),
      ]);
      setContent(normalizarContenido(savedContent));
      setProducts(productRows);
      setFiles(emptyFiles);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'No se pudo conectar con la configuración web.' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateHero = (key, value) => setContent((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));
  const setFile = (group, index, file) => setFiles((current) => {
    if (group === 'collection' || group === 'video') return { ...current, [group]: file };
    const next = [...current[group]]; next[index] = file; return { ...current, [group]: next };
  });

  const toggleFeatured = (reference) => setContent((current) => {
    const currentRefs = current.featuredReferences;
    if (currentRefs.includes(reference)) return { ...current, featuredReferences: currentRefs.filter((item) => item !== reference) };
    if (currentRefs.length >= 4) { setNotice({ type: 'error', text: 'Puedes elegir hasta cuatro productos destacados.' }); return current; }
    return { ...current, featuredReferences: [...currentRefs, reference] };
  });

  const moveFeatured = (reference, direction) => setContent((current) => {
    const items = [...current.featuredReferences]; const index = items.indexOf(reference); const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return current;
    [items[index], items[target]] = [items[target], items[index]];
    return { ...current, featuredReferences: items };
  });

  const publish = async () => {
    setSaving(true); setNotice(null);
    try {
      const next = JSON.parse(JSON.stringify(content));
      for (let index = 0; index < files.hero.length; index += 1) {
        if (files.hero[index]) {
          const { url } = await ipcRenderer.invoke('pagina-web-subir-archivo', files.hero[index].path, 'image', `carrusel-${index + 1}`);
          next.hero.slides[index] = url;
        }
      }
      for (let index = 0; index < files.categories.length; index += 1) {
        if (files.categories[index]) {
          const { url } = await ipcRenderer.invoke('pagina-web-subir-archivo', files.categories[index].path, 'image', `categoria-${next.categories[index].slug}`);
          next.categories[index].imageUrl = url;
        }
      }
      if (files.collection) {
        const { url } = await ipcRenderer.invoke('pagina-web-subir-archivo', files.collection.path, 'image', 'coleccion-destacada');
        next.collection.mediaUrl = url;
      }
      if (files.video) {
        const { url } = await ipcRenderer.invoke('pagina-web-subir-archivo', files.video.path, 'video', 'video-portada');
        next.video.mediaUrl = url;
      }
      await ipcRenderer.invoke('pagina-web-guardar-contenido', next);
      setContent(normalizarContenido(next)); setFiles(emptyFiles);
      setNotice({ type: 'success', text: 'Contenido publicado. La web lo mostrará cuando se conecte a esta configuración.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'No se pudo publicar el contenido.' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[420px] items-center justify-center gap-3 text-gray-500"><Loader2 className="animate-spin text-teal-600" /> Cargando configuración web...</div>;

  return <div className="mx-auto max-w-7xl space-y-7 p-6 md:p-8">
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-6 md:flex-row md:items-center">
      <div><div className="flex items-center gap-2 text-teal-700"><MonitorUp size={21} /><span className="text-sm font-bold">Administrador de portada</span></div><p className="mt-1 text-sm text-gray-600">Aquí preparas el contenido que verá tu tienda: imágenes, video y productos destacados.</p></div>
      <div className="flex gap-3"><button onClick={load} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"><RefreshCw size={16} /> Recargar</button><button onClick={publish} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Publicando...' : 'Publicar cambios'}</button></div>
    </div>

    {notice && <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {notice.text}<button className="ml-auto" onClick={() => setNotice(null)}><X size={16} /></button></div>}

    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"><div className="mb-5"><h2 className="text-lg font-bold text-gray-900">Carrusel principal</h2><p className="text-sm text-gray-500">Sube hasta cuatro imágenes. El texto queda sobre todas las diapositivas.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((index) => <MediaPicker key={index} label={`Imagen ${index + 1}`} value={content.hero.slides[index]} file={files.hero[index]} onChange={(file) => setFile('hero', index, file)} />)}</div><div className="mt-5 grid gap-4 md:grid-cols-3"><Field label="Título" value={content.hero.title} onChange={(value) => updateHero('title', value)} /><Field label="Texto" value={content.hero.subtitle} onChange={(value) => updateHero('subtitle', value)} /><Field label="Enlace del botón principal" value={content.hero.primaryLink} onChange={(value) => updateHero('primaryLink', value)} placeholder="/pijamas" /></div></section>

    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"><div className="mb-5"><h2 className="text-lg font-bold text-gray-900">Categorías</h2><p className="text-sm text-gray-500">Cambia la imagen de cada una de las cuatro tarjetas de la página de inicio.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{content.categories.map((category, index) => <MediaPicker key={category.slug} label={category.name} value={category.imageUrl} file={files.categories[index]} onChange={(file) => setFile('categories', index, file)} />)}</div></section>

    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"><div className="mb-5"><h2 className="text-lg font-bold text-gray-900">Colección destacada</h2><p className="text-sm text-gray-500">Cambia la imagen y los textos de la colección.</p></div><div className="grid gap-6 lg:grid-cols-[320px_1fr]"><MediaPicker label="Imagen de colección" value={content.collection.mediaUrl} file={files.collection} onChange={(file) => setFile('collection', null, file)} /><div className="grid content-start gap-4 md:grid-cols-2"><Field label="Texto superior" value={content.collection.eyebrow} onChange={(value) => setContent((current) => ({ ...current, collection: { ...current.collection, eyebrow: value } }))} /><Field label="Título" value={content.collection.title} onChange={(value) => setContent((current) => ({ ...current, collection: { ...current.collection, title: value } }))} /><Field label="Enlace del botón" value={content.collection.link} onChange={(value) => setContent((current) => ({ ...current, collection: { ...current.collection, link: value } }))} /><label className="block md:col-span-2"><span className="text-xs font-semibold text-gray-600">Descripción</span><textarea value={content.collection.description || ''} onChange={(event) => setContent((current) => ({ ...current, collection: { ...current.collection, description: event.target.value } }))} rows="3" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500" /></label></div></div></section>

    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"><div className="mb-5"><h2 className="text-lg font-bold text-gray-900">Video de portada</h2><p className="text-sm text-gray-500">Este es el video grande de la página de inicio. Formatos MP4 o WEBM, máximo 60 MB.</p></div><div className="grid gap-6 lg:grid-cols-[320px_1fr]"><MediaPicker label="Video de portada" value={content.video.mediaUrl} file={files.video} type="video" onChange={(file) => setFile('video', null, file)} /><div className="grid content-start gap-4 md:grid-cols-2"><Field label="Título" value={content.video.title} onChange={(value) => setContent((current) => ({ ...current, video: { ...current.video, title: value } }))} /><Field label="Enlace del botón" value={content.video.link} onChange={(value) => setContent((current) => ({ ...current, video: { ...current.video, link: value } }))} /><label className="block md:col-span-2"><span className="text-xs font-semibold text-gray-600">Descripción</span><textarea value={content.video.description || ''} onChange={(event) => setContent((current) => ({ ...current, video: { ...current.video, description: event.target.value } }))} rows="3" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500" /></label></div></div></section>

    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-gray-900">Productos destacados</h2><p className="text-sm text-gray-500">Elige hasta cuatro productos publicados y define su orden.</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{content.featuredReferences.length}/4 elegidos</span></div>{selectedProducts.length > 0 && <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{selectedProducts.map((product, index) => <div key={product.referencia} className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{product.nombre}</span><div className="flex gap-1"><button onClick={() => moveFeatured(product.referencia, -1)} disabled={index === 0} className="rounded px-1 text-teal-700 disabled:opacity-30">↑</button><button onClick={() => moveFeatured(product.referencia, 1)} disabled={index === selectedProducts.length - 1} className="rounded px-1 text-teal-700 disabled:opacity-30">↓</button></div></div>)}</div>}<div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3 text-right">Destacar</th></tr></thead><tbody>{products.map((product) => { const selected = content.featuredReferences.includes(product.referencia); return <tr key={product.id} className="border-t border-gray-100"><td className="px-4 py-3 font-medium text-gray-800">{product.nombre}<span className="ml-2 text-xs text-gray-400">{product.referencia}</span></td><td className="px-4 py-3 text-gray-500">{product.categoria}</td><td className="px-4 py-3 text-right"><button onClick={() => toggleFeatured(product.referencia)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${selected ? 'bg-teal-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{selected ? 'Elegido' : 'Elegir'}</button></td></tr>; })}</tbody></table></div></section>
  </div>;
}

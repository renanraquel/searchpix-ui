import { useState, useEffect } from "react"
import { fetchApi, apiUrl, getToken, getTenant, getCarouselPublicUrl } from "../api"

function mediaPreviewUrl(item, tenantSlug) {
  if (!item?.id || !tenantSlug) return ""
  const updatedAt = item.updated_at ? Math.floor(new Date(item.updated_at).getTime() / 1000) : 0
  const v = updatedAt > 0 ? `&v=${updatedAt}` : ""
  return apiUrl(`/api/public/carousel/media?id=${encodeURIComponent(item.id)}&tenant=${encodeURIComponent(tenantSlug)}${v}`)
}

export default function CarouselManage() {
  const tenant = getTenant()
  const tenantSlug = tenant?.slug || tenant?.Slug || ""

  const [list, setList] = useState([])
  const [settings, setSettings] = useState({ image_duration_seconds: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(null)
  const [mediaFile, setMediaFile] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState("")
  const [reordering, setReordering] = useState(false)

  const publicUrl = tenantSlug ? getCarouselPublicUrl(tenantSlug) : ""

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [itemsRes, settingsRes] = await Promise.all([
        fetchApi("/api/carousel/items"),
        fetchApi("/api/carousel/settings"),
      ])
      if (!itemsRes.ok) throw new Error(await itemsRes.text())
      if (!settingsRes.ok) throw new Error(await settingsRes.text())
      const items = await itemsRes.json()
      const cfg = await settingsRes.json()
      setList(Array.isArray(items) ? items : [])
      setSettings({
        image_duration_seconds: Number(cfg?.image_duration_seconds) || 20,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setMediaFile(null)
    setEditing(null)
  }

  function handleMediaChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    if (!isImage && !isVideo) {
      setError("Selecione uma imagem ou vídeo.")
      return
    }
    setError("")
    setMediaFile(file)
    e.target.value = ""
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!editing && !mediaFile) {
      setError("Selecione uma imagem ou vídeo para cadastrar.")
      return
    }
    setError("")
    try {
      const formData = new FormData()
      if (mediaFile) formData.append("media", mediaFile)
      const token = getToken()
      const url = editing
        ? apiUrl(`/api/carousel/items/update?id=${editing.id}`)
        : apiUrl("/api/carousel/items/create")
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      resetForm()
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este item do carrossel?")) return
    try {
      const res = await fetchApi(`/api/carousel/items/delete?id=${id}`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  function startEdit(item) {
    setEditing(item)
    setMediaFile(null)
  }

  async function moveItem(index, direction) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= list.length || reordering) return
    const newList = [...list]
    const [moved] = newList.splice(index, 1)
    newList.splice(newIndex, 0, moved)
    setList(newList)
    setReordering(true)
    setError("")
    try {
      const res = await fetchApi("/api/carousel/items/reorder", {
        method: "POST",
        body: JSON.stringify({ item_ids: newList.map((item) => item.id) }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setList(Array.isArray(data) ? data : newList)
    } catch (e) {
      setError(e.message)
      load()
    } finally {
      setReordering(false)
    }
  }

  async function saveSettings(e) {
    e.preventDefault()
    const secs = parseInt(String(settings.image_duration_seconds), 10)
    if (!secs || secs < 1) {
      setSettingsMsg("Informe um tempo válido (mínimo 1 segundo).")
      return
    }
    setSavingSettings(true)
    setSettingsMsg("")
    try {
      const res = await fetchApi("/api/carousel/settings", {
        method: "POST",
        body: JSON.stringify({ image_duration_seconds: secs }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSettings({ image_duration_seconds: data.image_duration_seconds || secs })
      setSettingsMsg("Parâmetros salvos.")
    } catch (e) {
      setSettingsMsg(e.message)
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Carrossel Fotos/Vídeos</h3>
        <p className="text-muted mb-0">
          Cadastre imagens e vídeos dos produtos para exibição em tela (modo TV).
        </p>
      </div>

      {publicUrl && (
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Link da tela pública</h4>
                <p className="text-muted small mb-2">
                  Abra este link em uma TV ou monitor — não exige login.
                </p>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="font-weight-bold">
                  {publicUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-md-5 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">{editing ? "Editar item" : "Novo item"}</h4>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{editing ? "Substituir mídia (opcional)" : "Imagem ou vídeo"}</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                  />
                  {mediaFile && (
                    <small className="text-muted d-block mt-1">
                      Arquivo: {mediaFile.name} ({mediaFile.type})
                    </small>
                  )}
                  {!editing && (
                    <small className="text-muted d-block mt-1">
                      A ordem é definida automaticamente conforme o cadastro.
                    </small>
                  )}
                </div>
                <button type="submit" className="btn btn-primary mr-2">
                  {editing ? "Salvar" : "Cadastrar"}
                </button>
                {editing && (
                  <button type="button" className="btn btn-light" onClick={resetForm}>
                    Cancelar
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-7 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Parâmetros de exibição</h4>
              <form onSubmit={saveSettings} className="mb-4">
                <div className="form-group">
                  <label>Tempo das imagens (segundos)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={settings.image_duration_seconds}
                    onChange={(e) =>
                      setSettings({ image_duration_seconds: e.target.value })
                    }
                  />
                  <small className="text-muted">
                    Vídeos são exibidos até o fim da reprodução, depois passa para o próximo item.
                  </small>
                </div>
                <button type="submit" className="btn btn-outline-primary btn-sm" disabled={savingSettings}>
                  {savingSettings ? "Salvando…" : "Salvar parâmetros"}
                </button>
                {settingsMsg && <span className="ml-2 small text-muted">{settingsMsg}</span>}
              </form>

              <h4 className="card-title">Itens cadastrados</h4>
              {loading ? (
                <p className="text-muted">Carregando…</p>
              ) : list.length === 0 ? (
                <p className="text-muted">Nenhum item cadastrado.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Ordem</th>
                        <th>Prévia</th>
                        <th>Tipo</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item, index) => {
                        const url = mediaPreviewUrl(item, tenantSlug)
                        return (
                          <tr key={item.id}>
                            <td className="text-nowrap">
                              <span className="mr-2">{index + 1}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-1"
                                title="Subir"
                                disabled={index === 0 || reordering}
                                onClick={() => moveItem(index, -1)}
                              >
                                <i className="mdi mdi-chevron-up" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-1"
                                title="Descer"
                                disabled={index === list.length - 1 || reordering}
                                onClick={() => moveItem(index, 1)}
                              >
                                <i className="mdi mdi-chevron-down" />
                              </button>
                            </td>
                            <td style={{ width: 120 }}>
                              {item.media_type === "video" ? (
                                <video
                                  src={url}
                                  style={{ width: 100, height: 60, objectFit: "cover" }}
                                  muted
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={url}
                                  alt=""
                                  style={{ width: 100, height: 60, objectFit: "cover" }}
                                  loading="lazy"
                                />
                              )}
                            </td>
                            <td>{item.media_type === "video" ? "Vídeo" : "Imagem"}</td>
                            <td className="text-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary mr-1"
                                onClick={() => startEdit(item)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item.id)}
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
